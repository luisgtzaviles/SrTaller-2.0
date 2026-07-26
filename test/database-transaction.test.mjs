import assert from 'node:assert/strict';
import { inspect } from 'node:util';
import test from 'node:test';

import { Pool } from 'pg';

const {
  DatabaseConnectionError,
  createDatabaseConnection,
  sanitizeDatabaseConnectionState,
} = await import('../dist/infrastructure/database/database-connection.js');
const { useDatabaseTransactionExecutor } = await import(
  '../dist/infrastructure/database/database-transaction-capability.js'
);
const {
  DatabaseTransactionError,
  runInTransaction,
} = await import('../dist/infrastructure/database/transaction-runner.js');

function config() {
  return {
    identity: {
      host: 'synthetic.invalid',
      port: 5432,
      database: 'srtaller_test_transaction_unit',
      user: 'synthetic_user',
      password: 'unit-secret-password',
    },
    transport: { sslMode: 'disable' },
    pool: {
      min: 0,
      max: 1,
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
      testRunId: 'transaction_unit',
    },
    observability: {
      applicationName: 'srtaller-pbi023-transaction-unit',
      labels: {
        component: 'persistence',
        environment: 'test',
        role: 'test',
      },
    },
  };
}

async function withPoolPatch(run, queryOverride) {
  const originalConnect = Pool.prototype.connect;
  const queries = [];
  let releaseCount = 0;
  Pool.prototype.connect = async function patchedConnect() {
    return {
      async query(sql, parameters = []) {
        queries.push({ parameters, sql });
        if (queryOverride) {
          const result = await queryOverride(sql, parameters);
          if (result !== undefined) {
            return result;
          }
        }
        return { command: 'SELECT', rowCount: 1, rows: [{ value: 1 }] };
      },
      release() {
        releaseCount += 1;
      },
    };
  };
  try {
    return await run({
      queries,
      releaseCount: () => releaseCount,
    });
  } finally {
    Pool.prototype.connect = originalConnect;
  }
}

function expectsTransactionCode(expectedCode) {
  return (error) => {
    assert.ok(error instanceof DatabaseTransactionError);
    assert.equal(error.code, expectedCode);
    return true;
  };
}

test('options fail before acquisition and public surface is narrow', async () => {
  let connectCalls = 0;
  const originalConnect = Pool.prototype.connect;
  Pool.prototype.connect = async function patchedConnect() {
    connectCalls += 1;
    throw new Error('must not acquire');
  };
  try {
    const connection = createDatabaseConnection(config());
    for (const options of [
      { isolationLevel: 'snapshot' },
      { readOnly: 'yes' },
      { retry: 3 },
      null,
    ]) {
      await assert.rejects(
        runInTransaction(connection, options, async () => undefined),
        expectsTransactionCode('DATABASE_TRANSACTION_INVALID_OPTIONS'),
      );
    }
    await assert.rejects(
      runInTransaction(connection, {}, null),
      expectsTransactionCode('DATABASE_TRANSACTION_INVALID_OPTIONS'),
    );
    assert.equal(connectCalls, 0);
    await connection.close();
  } finally {
    Pool.prototype.connect = originalConnect;
  }
});

test('callback executes once, is immutable and propagates typed values', async () => {
  await withPoolPatch(async ({ queries, releaseCount }) => {
    const connection = createDatabaseConnection(config());
    let calls = 0;
    let retainedContext;

    const primitive = await runInTransaction(
      connection,
      {},
      (context) => {
        calls += 1;
        retainedContext = context;
        assert.ok(Object.isFrozen(context));
        assert.deepEqual(context, {
          attempt: 1,
          isolationLevel: 'read committed',
          readOnly: false,
        });
        return 42;
      },
    );
    const object = await runInTransaction(
      connection,
      { isolationLevel: 'serializable', readOnly: true },
      async (context) => {
        calls += 1;
        await Promise.resolve();
        return Object.freeze({ isolation: context.isolationLevel });
      },
    );

    assert.equal(primitive, 42);
    assert.deepEqual(object, { isolation: 'serializable' });
    assert.equal(calls, 2);
    await assert.rejects(
      useDatabaseTransactionExecutor(retainedContext, async () => undefined),
      expectsTransactionCode('DATABASE_TRANSACTION_INVALID_STATE'),
    );
    assert.deepEqual(
      queries.map(({ sql }) => sql),
      [
        'select 1',
        'start transaction isolation level read committed read write',
        'commit',
        'start transaction isolation level serializable read only',
        'commit',
      ],
    );
    assert.equal(releaseCount(), 3);
    await connection.close();
  });
});

test('sync, async and undefined callback failures roll back exactly once', async () => {
  await withPoolPatch(async ({ queries }) => {
    const connection = createDatabaseConnection(config());
    const failures = [
      () => {
        throw new Error('sync secret postgres://user:password@private/db');
      },
      async () => {
        await Promise.resolve();
        throw new Error('async secret password=private');
      },
      () => {
        throw undefined;
      },
    ];

    for (const callback of failures) {
      await assert.rejects(
        runInTransaction(connection, {}, callback),
        expectsTransactionCode('DATABASE_TRANSACTION_CALLBACK_FAILED'),
      );
    }
    assert.equal(
      queries.filter(({ sql }) => sql === 'rollback').length,
      failures.length,
    );
    assert.equal(
      queries.filter(({ sql }) => sql === 'commit').length,
      0,
    );
    await connection.close();
  });
});

test('nested, indirect and overlapping use is rejected fail-closed', async () => {
  await withPoolPatch(async () => {
    const connection = createDatabaseConnection(config());

    async function indirect() {
      return runInTransaction(connection, {}, async () => 'nested');
    }
    await assert.rejects(
      runInTransaction(connection, {}, indirect),
      expectsTransactionCode('DATABASE_TRANSACTION_NESTED_FORBIDDEN'),
    );

    let releaseOuter;
    const barrier = new Promise((resolve) => {
      releaseOuter = resolve;
    });
    const outer = runInTransaction(connection, {}, async () => {
      await barrier;
      return 'outer';
    });
    await assert.rejects(
      runInTransaction(connection, {}, async () => 'overlap'),
      expectsTransactionCode('DATABASE_TRANSACTION_NESTED_FORBIDDEN'),
    );
    releaseOuter();
    assert.equal(await outer, 'outer');
    await connection.close();
  });
});

test('ordinary connection verification cannot bypass an active transaction', async () => {
  await withPoolPatch(async () => {
    const connection = createDatabaseConnection(config());
    const value = await runInTransaction(connection, {}, async () => {
      await assert.rejects(
        connection.verify(),
        (error) =>
          error instanceof DatabaseConnectionError &&
          error.code === 'DATABASE_CONNECTION_INVALID_STATE',
      );
      return 'transaction-remains-owner';
    });
    assert.equal(value, 'transaction-remains-owner');
    await connection.close();
  });
});

test('transaction waits for active verification and rejects closed connection', async () => {
  let releaseVerification;
  const barrier = new Promise((resolve) => {
    releaseVerification = resolve;
  });
  let probePending = true;
  await withPoolPatch(
    async () => {
      const connection = createDatabaseConnection(config());
      const verifying = connection.verify();
      const transaction = runInTransaction(
        connection,
        {},
        async () => 'ready-after-verify',
      );
      releaseVerification();
      await verifying;
      assert.equal(await transaction, 'ready-after-verify');
      await connection.close();
      await assert.rejects(
        runInTransaction(connection, {}, async () => undefined),
        expectsTransactionCode('DATABASE_TRANSACTION_INVALID_STATE'),
      );
    },
    async (sql) => {
      if (sql === 'select 1' && probePending) {
        probePending = false;
        await barrier;
      }
    },
  );
});

test('close rejects new work, waits for active callback and leaves no pool state', async () => {
  await withPoolPatch(async () => {
    const connection = createDatabaseConnection(config());
    let releaseCallback;
    let markStarted;
    const barrier = new Promise((resolve) => {
      releaseCallback = resolve;
    });
    const started = new Promise((resolve) => {
      markStarted = resolve;
    });
    const active = runInTransaction(connection, {}, async () => {
      markStarted();
      await barrier;
      return 'done';
    });

    await started;
    const closing = connection.close();
    assert.equal(connection.state, 'closing');
    await assert.rejects(
      runInTransaction(connection, {}, async () => undefined),
      expectsTransactionCode('DATABASE_TRANSACTION_INVALID_STATE'),
    );
    releaseCallback();
    assert.equal(await active, 'done');
    await closing;
    assert.equal(connection.state, 'closed');
    assert.deepEqual(
      sanitizeDatabaseConnectionState(connection).pool,
      {
        configuredMin: 0,
        configuredMax: 1,
        totalCount: 0,
        idleCount: 0,
        waitingCount: 0,
      },
    );
  });
});

test('driver error mapping and diagnostics are stable and sanitized', async (context) => {
  const cases = [
    ['40001', 'DATABASE_TRANSACTION_SERIALIZATION_FAILURE'],
    ['40P01', 'DATABASE_TRANSACTION_DEADLOCK'],
    ['25006', 'DATABASE_TRANSACTION_READ_ONLY_VIOLATION'],
    ['57014', 'DATABASE_TRANSACTION_TIMEOUT'],
  ];
  for (const [driverCode, expectedCode] of cases) {
    await context.test(`${driverCode} maps to ${expectedCode}`, async () => {
      let injected = false;
      await withPoolPatch(
        async () => {
          const connection = createDatabaseConnection(config());
          await assert.rejects(
            runInTransaction(connection, {}, async () => 'result'),
            (error) => {
              assert.ok(error instanceof DatabaseTransactionError);
              assert.equal(error.code, expectedCode);
              const rendered = `${JSON.stringify(error)}\n${inspect(error)}`;
              assert.doesNotMatch(
                rendered,
                /private\.example|private_user|private_password|postgres:\/\//u,
              );
              assert.equal(Object.hasOwn(error, 'cause'), false);
              return true;
            },
          );
          await connection.close();
        },
        async (sql) => {
          if (sql === 'commit' && !injected) {
            injected = true;
            throw Object.assign(
              new Error(
                'postgres://private_user:private_password@private.example/private',
              ),
              { code: driverCode },
            );
          }
        },
      );
    });
  }
});

test('rollback failure preserves safe primary metadata and both raw causes privately', async () => {
  await withPoolPatch(
    async () => {
      const connection = createDatabaseConnection(config());
      await assert.rejects(
        runInTransaction(connection, {}, async () => {
          throw new Error('primary-secret-password');
        }),
        (error) => {
          assert.ok(error instanceof DatabaseTransactionError);
          assert.equal(error.code, 'DATABASE_TRANSACTION_ROLLBACK_FAILED');
          assert.equal(
            error.primaryCode,
            'DATABASE_TRANSACTION_CALLBACK_FAILED',
          );
          const rendered = `${JSON.stringify(error)}\n${inspect(error)}`;
          assert.doesNotMatch(
            rendered,
            /primary-secret-password|rollback-secret-password/u,
          );
          return true;
        },
      );
      await connection.close();
    },
    async (sql) => {
      if (sql === 'rollback') {
        throw new Error('rollback-secret-password');
      }
    },
  );
});
