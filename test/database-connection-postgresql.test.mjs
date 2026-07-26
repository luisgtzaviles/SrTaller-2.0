import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import test from 'node:test';
import { promisify } from 'node:util';

const execute = promisify(execFile);
const enabled = process.env.SR_CONNECTION_PG_TEST === '1';

const {
  DatabaseConnectionError,
  createDatabaseConnection,
  sanitizeDatabaseConnectionState,
} = enabled
  ? await import('../dist/infrastructure/database/database-connection.js')
  : {};
const { parseDatabaseConfig } = enabled
  ? await import('../dist/infrastructure/database/database-config.js')
  : {};

function input(overrides = {}) {
  const names = [
    'SR_DB_ENVIRONMENT',
    'SR_TEST_DB_ACCESS_MODE',
    'SR_TEST_DB_APPLICATION_NAME',
    'SR_TEST_DB_CONNECTION_TIMEOUT_MS',
    'SR_TEST_DB_HOST',
    'SR_TEST_DB_IDLE_TIMEOUT_MS',
    'SR_TEST_DB_MIGRATIONS_ENABLED',
    'SR_TEST_DB_NAME',
    'SR_TEST_DB_PASSWORD',
    'SR_TEST_DB_POOL_MAX',
    'SR_TEST_DB_POOL_MIN',
    'SR_TEST_DB_PORT',
    'SR_TEST_DB_QUERY_TIMEOUT_MS',
    'SR_TEST_DB_ROLE',
    'SR_TEST_DB_RUN_ID',
    'SR_TEST_DB_SSL_MODE',
    'SR_TEST_DB_STATEMENT_TIMEOUT_MS',
    'SR_TEST_DB_USER',
  ];
  return Object.fromEntries(
    names.map((name) => [name, overrides[name] ?? process.env[name]]),
  );
}

function connection(overrides = {}) {
  return createDatabaseConnection(parseDatabaseConfig(input(overrides)));
}

function expectsCode(expectedCode) {
  return (error) => {
    assert.ok(error instanceof DatabaseConnectionError);
    assert.equal(error.code, expectedCode);
    return true;
  };
}

test(
  'PostgreSQL 18.4 connection facility verifies, releases and closes',
  { skip: !enabled },
  async () => {
    const database = connection({ SR_TEST_DB_POOL_MAX: '1' });
    const created = sanitizeDatabaseConnectionState(database);
    assert.equal(created.state, 'created');
    assert.equal(created.pool.totalCount, 0);

    await database.verify();
    await database.verify();
    await Promise.all([database.verify(), database.verify()]);

    const ready = sanitizeDatabaseConnectionState(database);
    assert.equal(ready.state, 'ready');
    assert.equal(ready.pool.configuredMax, 1);
    assert.equal(ready.pool.totalCount, 1);
    assert.equal(ready.pool.idleCount, 1);
    assert.equal(ready.pool.waitingCount, 0);

    const firstClose = database.close();
    const secondClose = database.close();
    assert.equal(firstClose, secondClose);
    await Promise.all([firstClose, secondClose]);
    await database.close();

    const closed = sanitizeDatabaseConnectionState(database);
    assert.equal(closed.state, 'closed');
    assert.equal(closed.pool.totalCount, 0);
    assert.equal(closed.pool.idleCount, 0);
    assert.equal(closed.pool.waitingCount, 0);
    await assert.rejects(
      database.verify(),
      expectsCode('DATABASE_CONNECTION_CLOSED'),
    );
  },
);

test(
  'PostgreSQL rejects invalid credentials with a sanitized stable error',
  { skip: !enabled },
  async () => {
    const database = connection({
      SR_TEST_DB_PASSWORD: 'synthetic_wrong_password',
    });
    try {
      await assert.rejects(
        database.verify(),
        expectsCode('DATABASE_CONNECTION_AUTHENTICATION_FAILED'),
      );
      assert.equal(database.state, 'failed');
    } finally {
      await database.close();
    }
  },
);

test(
  'PostgreSQL rejects a nonexistent database with a stable error',
  { skip: !enabled },
  async () => {
    const runId = 'connection_missing';
    const database = connection({
      SR_TEST_DB_NAME: `srtaller_test_${runId}`,
      SR_TEST_DB_RUN_ID: runId,
    });
    try {
      await assert.rejects(
        database.verify(),
        expectsCode('DATABASE_CONNECTION_DATABASE_NOT_FOUND'),
      );
    } finally {
      await database.close();
    }
  },
);

test(
  'PostgreSQL without TLS rejects verify-full with a stable SSL error',
  { skip: !enabled },
  async () => {
    const database = connection({ SR_TEST_DB_SSL_MODE: 'verify-full' });
    try {
      await assert.rejects(
        database.verify(),
        expectsCode('DATABASE_CONNECTION_SSL_FAILED'),
      );
    } finally {
      await database.close();
    }
  },
);

test(
  'paused PostgreSQL produces a finite connection timeout and recovers for cleanup',
  { skip: !enabled },
  async () => {
    const container = process.env.SR_CONNECTION_PG_CONTAINER;
    assert.match(container ?? '', /^srtaller_pbi023_connection_[a-z0-9]+$/u);
    const database = connection({
      SR_TEST_DB_CONNECTION_TIMEOUT_MS: '200',
      SR_TEST_DB_QUERY_TIMEOUT_MS: '200',
    });

    await execute('docker', ['pause', container]);
    try {
      await assert.rejects(
        database.verify(),
        expectsCode('DATABASE_CONNECTION_TIMEOUT'),
      );
    } finally {
      await execute('docker', ['unpause', container]);
      await database.close();
    }
  },
);

test(
  'verify-close race remains deterministic against PostgreSQL',
  { skip: !enabled },
  async () => {
    const database = connection();
    const verifying = database.verify();
    const closing = database.close();
    await Promise.all([verifying, closing]);
    assert.equal(database.state, 'closed');
    assert.equal(
      sanitizeDatabaseConnectionState(database).pool.totalCount,
      0,
    );
  },
);
