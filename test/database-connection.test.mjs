import assert from 'node:assert/strict';
import { inspect } from 'node:util';
import test from 'node:test';

import { Pool } from 'pg';

const {
  DatabaseConnectionError,
  createDatabaseConnection,
  sanitizeDatabaseConnectionState,
} = await import('../dist/infrastructure/database/database-connection.js');

function config(overrides = {}) {
  const base = {
    identity: {
      host: 'synthetic.invalid',
      port: 5432,
      database: 'srtaller_test_connection_unit',
      user: 'synthetic_user',
      password: 'unit-secret-password',
    },
    transport: { sslMode: 'disable' },
    pool: {
      min: 0,
      max: 2,
      idleTimeoutMs: 500,
      connectionTimeoutMs: 500,
      statementTimeoutMs: 500,
      queryTimeoutMs: 500,
    },
    runtime: {
      environment: 'test',
      role: 'test',
      accessMode: 'read-write',
      migrationsEnabled: false,
      testRunId: 'connection_unit',
    },
    observability: {
      applicationName: 'srtaller-pbi023-unit',
      labels: {
        component: 'persistence',
        environment: 'test',
        role: 'test',
      },
    },
  };
  return structuredClone({ ...base, ...overrides });
}

async function withPoolPatch(method, replacement, run) {
  const original = Pool.prototype[method];
  Pool.prototype[method] = replacement;
  try {
    return await run();
  } finally {
    Pool.prototype[method] = original;
  }
}

function fakeClient({ query, released }) {
  return {
    query,
    release() {
      released.count += 1;
    },
  };
}

test('creation is lazy, state is sanitized and close before verify is safe', async () => {
  let connectCalls = 0;
  await withPoolPatch(
    'connect',
    async function patchedConnect() {
      connectCalls += 1;
      throw new Error('must not connect');
    },
    async () => {
      const connection = createDatabaseConnection(config());
      assert.equal(connection.state, 'created');
      assert.equal(connectCalls, 0);

      const state = sanitizeDatabaseConnectionState(connection);
      assert.equal(state.state, 'created');
      assert.deepEqual(state.identityConfigured, {
        host: true,
        database: true,
        user: true,
        password: true,
      });
      const serialized = `${JSON.stringify(state)}\n${inspect(state)}`;
      assert.doesNotMatch(serialized, /synthetic\.invalid/u);
      assert.doesNotMatch(serialized, /srtaller_test_connection_unit/u);
      assert.doesNotMatch(serialized, /synthetic_user/u);
      assert.doesNotMatch(serialized, /unit-secret-password/u);

      await connection.close();
      await connection.close();
      assert.equal(connection.state, 'closed');
      assert.equal(connectCalls, 0);
    },
  );
});

test('concurrent verification shares one query and verify-close is deterministic', async () => {
  let releaseQuery;
  let connectCalls = 0;
  let queryCalls = 0;
  const released = { count: 0 };
  const queryBarrier = new Promise((resolve) => {
    releaseQuery = resolve;
  });

  await withPoolPatch(
    'connect',
    async function patchedConnect() {
      connectCalls += 1;
      return fakeClient({
        released,
        async query(sql) {
          queryCalls += 1;
          assert.equal(sql, 'select 1');
          await queryBarrier;
          return { rows: [{ '?column?': 1 }] };
        },
      });
    },
    async () => {
      const connection = createDatabaseConnection(config());
      const first = connection.verify();
      const second = connection.verify();
      assert.equal(first, second);
      assert.equal(connection.state, 'verifying');

      const closing = connection.close();
      assert.equal(connection.state, 'closing');
      releaseQuery();
      await Promise.all([first, second, closing]);

      assert.equal(connectCalls, 1);
      assert.equal(queryCalls, 1);
      assert.equal(released.count, 1);
      assert.equal(connection.state, 'closed');
      await assert.rejects(
        connection.verify(),
        (error) =>
          error instanceof DatabaseConnectionError &&
          error.code === 'DATABASE_CONNECTION_CLOSED',
      );
    },
  );
});

test('sequential verification reuses the facility without duplicating lifecycle', async () => {
  const released = { count: 0 };
  let queryCalls = 0;
  await withPoolPatch(
    'connect',
    async function patchedConnect() {
      return fakeClient({
        released,
        async query(sql) {
          queryCalls += 1;
          assert.equal(sql, 'select 1');
          return { rows: [{ '?column?': 1 }] };
        },
      });
    },
    async () => {
      const connection = createDatabaseConnection(config());
      await connection.verify();
      await connection.verify();
      assert.equal(connection.state, 'ready');
      assert.equal(queryCalls, 2);
      assert.equal(released.count, 2);
      await connection.close();
    },
  );
});

const mappedErrors = [
  ['28P01', 'authentication failed', 'DATABASE_CONNECTION_AUTHENTICATION_FAILED'],
  ['3D000', 'database missing', 'DATABASE_CONNECTION_DATABASE_NOT_FOUND'],
  ['57014', 'statement cancelled', 'DATABASE_CONNECTION_TIMEOUT'],
  ['ETIMEDOUT', 'connect timed out', 'DATABASE_CONNECTION_TIMEOUT'],
  ['ECONNREFUSED', 'connect refused', 'DATABASE_CONNECTION_NETWORK_FAILED'],
  ['ERR_TLS_CERT_ALTNAME_INVALID', 'certificate mismatch', 'DATABASE_CONNECTION_SSL_FAILED'],
  ['XX000', 'unexpected driver failure', 'DATABASE_CONNECTION_VERIFICATION_FAILED'],
];

test('driver failures map to stable errors and never retain nested secrets', async (context) => {
  for (const [driverCode, driverMessage, expectedCode] of mappedErrors) {
    await context.test(`${driverCode} maps to ${expectedCode}`, async () => {
      const raw = Object.assign(
        new Error(
          `${driverMessage}; host=private.example user=private_user password=private_password`,
          {
            cause: new Error(
              'postgres://private_user:private_password@private.example/private_db',
            ),
          },
        ),
        { code: driverCode },
      );
      await withPoolPatch(
        'connect',
        async function patchedConnect() {
          throw raw;
        },
        async () => {
          const connection = createDatabaseConnection(config());
          await assert.rejects(
            connection.verify(),
            (error) => {
              assert.ok(error instanceof DatabaseConnectionError);
              assert.equal(error.code, expectedCode);
              const rendered = `${JSON.stringify(error)}\n${inspect(error)}`;
              assert.doesNotMatch(rendered, /private\.example/u);
              assert.doesNotMatch(rendered, /private_user/u);
              assert.doesNotMatch(rendered, /private_password/u);
              assert.doesNotMatch(rendered, /postgres:\/\//u);
              assert.doesNotMatch(rendered, /private_db/u);
              assert.equal(Object.hasOwn(error, 'cause'), false);
              return true;
            },
          );
          assert.equal(connection.state, 'failed');
          assert.equal(
            sanitizeDatabaseConnectionState(connection).lastError.code,
            expectedCode,
          );
          await connection.close();
        },
      );
    });
  }
});

test('close failures are typed, sanitized and deterministic', async () => {
  const rawCloseError = new Error(
    'close failed for postgres://private:secret@private.example/private_db',
  );
  await withPoolPatch(
    'end',
    async function patchedEnd() {
      throw rawCloseError;
    },
    async () => {
      const connection = createDatabaseConnection(config());
      const first = connection.close();
      const second = connection.close();
      assert.equal(first, second);
      await assert.rejects(
        first,
        (error) => {
          assert.ok(error instanceof DatabaseConnectionError);
          assert.equal(error.code, 'DATABASE_CONNECTION_CLOSE_FAILED');
          const rendered = `${JSON.stringify(error)}\n${inspect(error)}`;
          assert.doesNotMatch(rendered, /private\.example|private_db|secret/u);
          return true;
        },
      );
      await assert.rejects(second);
      assert.equal(connection.state, 'failed');
    },
  );
});

test('sanitizer rejects objects not created by the facility', () => {
  assert.throws(
    () =>
      sanitizeDatabaseConnectionState({
        state: 'created',
        async verify() {},
        async close() {},
      }),
    (error) =>
      error instanceof DatabaseConnectionError &&
      error.code === 'DATABASE_CONNECTION_INVALID_STATE',
  );
});
