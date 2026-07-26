import assert from 'node:assert/strict';
import { inspect } from 'node:util';
import test from 'node:test';

import { sql } from 'kysely';
import { Pool } from 'pg';

const enabled = process.env.SR_TRANSACTION_PG_TEST === '1';

const {
  createDatabaseConnection,
  sanitizeDatabaseConnectionState,
} = enabled
  ? await import('../dist/infrastructure/database/database-connection.js')
  : {};
const { parseDatabaseConfig } = enabled
  ? await import('../dist/infrastructure/database/database-config.js')
  : {};
const { useDatabaseTransactionExecutor } = enabled
  ? await import(
      '../dist/infrastructure/database/database-transaction-capability.js'
    )
  : {};
const {
  DatabaseTransactionError,
  runInTransaction,
} = enabled
  ? await import('../dist/infrastructure/database/transaction-runner.js')
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

function adminPool() {
  return new Pool({
    database: process.env.SR_TEST_DB_NAME,
    host: process.env.SR_TEST_DB_HOST,
    max: 2,
    password: process.env.SR_TEST_DB_PASSWORD,
    port: Number(process.env.SR_TEST_DB_PORT),
    ssl: false,
    user: process.env.SR_TEST_DB_USER,
  });
}

function expectsCode(expectedCode) {
  return (error) => {
    assert.ok(error instanceof DatabaseTransactionError);
    assert.equal(error.code, expectedCode);
    const rendered = `${JSON.stringify(error)}\n${inspect(error)}`;
    assert.doesNotMatch(
      rendered,
      /postgres:\/\/|password=|transaction_probe|SR_TEST_DB_/iu,
    );
    return true;
  };
}

async function withExecutor(context, operation) {
  return useDatabaseTransactionExecutor(context, operation);
}

function twoPartyBarrier() {
  let arrivals = 0;
  let release;
  const ready = new Promise((resolve) => {
    release = resolve;
  });
  return async () => {
    arrivals += 1;
    if (arrivals === 2) {
      release();
    }
    await ready;
  };
}

test(
  'PostgreSQL 18.4 transaction runner contract is deterministic and leak-free',
  { skip: !enabled, timeout: 60_000 },
  async () => {
    const admin = adminPool();
    const database = connection({ SR_TEST_DB_POOL_MAX: '1' });
    const openedConnections = new Set([database]);
    try {
      await admin.query(`
        create table transaction_probe (
          id integer primary key,
          value integer not null,
          version integer not null
        )
      `);

      const committed = await runInTransaction(
        database,
        {},
        async (context) =>
          withExecutor(context, async (executor) => {
            await executor
              .insertInto('transaction_probe')
              .values({ id: 1, value: 10, version: 1 })
              .executeTakeFirstOrThrow();
            return Object.freeze({ committed: true });
          }),
      );
      assert.deepEqual(committed, { committed: true });
      assert.equal(
        Number(
          (
            await admin.query(
              'select count(*)::integer as count from transaction_probe where id = 1',
            )
          ).rows[0].count,
        ),
        1,
      );

      await assert.rejects(
        runInTransaction(database, {}, (context) => {
          throw Object.assign(new Error('sync callback secret'), { context });
        }),
        expectsCode('DATABASE_TRANSACTION_CALLBACK_FAILED'),
      );
      await assert.rejects(
        runInTransaction(database, {}, async (context) => {
          await withExecutor(context, (executor) =>
            executor
              .insertInto('transaction_probe')
              .values({ id: 2, value: 20, version: 1 })
              .executeTakeFirstOrThrow(),
          );
          await Promise.resolve();
          throw new Error('async callback secret');
        }),
        expectsCode('DATABASE_TRANSACTION_CALLBACK_FAILED'),
      );
      assert.equal(
        Number(
          (
            await admin.query(
              'select count(*)::integer as count from transaction_probe where id = 2',
            )
          ).rows[0].count,
        ),
        0,
      );

      const isolationExpectations = new Map([
        ['read uncommitted', 'read uncommitted'],
        ['read committed', 'read committed'],
        ['repeatable read', 'repeatable read'],
        ['serializable', 'serializable'],
      ]);
      for (const [requested, actual] of isolationExpectations) {
        const observed = await runInTransaction(
          database,
          { isolationLevel: requested },
          (context) =>
            withExecutor(context, async (executor) => {
              const result = await sql`
                show transaction_isolation
              `.execute(executor);
              return result.rows[0].transaction_isolation;
            }),
        );
        assert.equal(observed, actual);
      }

      const readOnlyValue = await runInTransaction(
        database,
        { readOnly: true },
        (context) =>
          withExecutor(context, (executor) =>
            executor
              .selectFrom('transaction_probe')
              .select('value')
              .where('id', '=', 1)
              .executeTakeFirstOrThrow(),
          ),
      );
      assert.equal(readOnlyValue.value, 10);
      await assert.rejects(
        runInTransaction(database, { readOnly: true }, (context) =>
          withExecutor(context, (executor) =>
            executor
              .insertInto('transaction_probe')
              .values({ id: 3, value: 30, version: 1 })
              .executeTakeFirstOrThrow(),
          ),
        ),
        expectsCode('DATABASE_TRANSACTION_READ_ONLY_VIOLATION'),
      );
      await runInTransaction(
        database,
        { readOnly: false },
        (context) =>
          withExecutor(context, (executor) =>
            executor
              .insertInto('transaction_probe')
              .values({ id: 3, value: 30, version: 1 })
              .executeTakeFirstOrThrow(),
          ),
      );

      const independentA = connection({ SR_TEST_DB_POOL_MAX: '1' });
      const independentB = connection({ SR_TEST_DB_POOL_MAX: '1' });
      openedConnections.add(independentA);
      openedConnections.add(independentB);
      const independentBarrier = twoPartyBarrier();
      await Promise.all([
        runInTransaction(independentA, {}, async (context) => {
          await independentBarrier();
          await withExecutor(context, (executor) =>
            executor
              .insertInto('transaction_probe')
              .values({ id: 10, value: 10, version: 1 })
              .executeTakeFirstOrThrow(),
          );
        }),
        runInTransaction(independentB, {}, async (context) => {
          await independentBarrier();
          await withExecutor(context, (executor) =>
            executor
              .insertInto('transaction_probe')
              .values({ id: 11, value: 11, version: 1 })
              .executeTakeFirstOrThrow(),
          );
        }),
      ]);

      await admin.query(
        'insert into transaction_probe (id, value, version) values (100, 0, 1)',
      );
      const serializationBarrier = twoPartyBarrier();
      const serializationResults = await Promise.allSettled([
        runInTransaction(
          independentA,
          { isolationLevel: 'serializable' },
          async (context) =>
            withExecutor(context, async (executor) => {
              const row = await executor
                .selectFrom('transaction_probe')
                .select(['value', 'version'])
                .where('id', '=', 100)
                .executeTakeFirstOrThrow();
              await serializationBarrier();
              await executor
                .updateTable('transaction_probe')
                .set({ value: row.value + 1, version: row.version + 1 })
                .where('id', '=', 100)
                .executeTakeFirstOrThrow();
            }),
        ),
        runInTransaction(
          independentB,
          { isolationLevel: 'serializable' },
          async (context) =>
            withExecutor(context, async (executor) => {
              const row = await executor
                .selectFrom('transaction_probe')
                .select(['value', 'version'])
                .where('id', '=', 100)
                .executeTakeFirstOrThrow();
              await serializationBarrier();
              await executor
                .updateTable('transaction_probe')
                .set({ value: row.value + 1, version: row.version + 1 })
                .where('id', '=', 100)
                .executeTakeFirstOrThrow();
            }),
        ),
      ]);
      assert.equal(
        serializationResults.filter(({ status }) => status === 'fulfilled')
          .length,
        1,
      );
      const serializationFailure = serializationResults.find(
        ({ status }) => status === 'rejected',
      );
      assert.ok(serializationFailure);
      assert.ok(
        expectsCode('DATABASE_TRANSACTION_SERIALIZATION_FAILURE')(
          serializationFailure.reason,
        ),
      );

      await admin.query(
        'insert into transaction_probe (id, value, version) values (201, 0, 1), (202, 0, 1)',
      );
      const deadlockBarrier = twoPartyBarrier();
      const updateRow = (executor, id) =>
        executor
          .updateTable('transaction_probe')
          .set((expression) => ({
            value: expression('value', '+', 1),
            version: expression('version', '+', 1),
          }))
          .where('id', '=', id)
          .executeTakeFirstOrThrow();
      const deadlockResults = await Promise.allSettled([
        runInTransaction(independentA, {}, (context) =>
          withExecutor(context, async (executor) => {
            await updateRow(executor, 201);
            await deadlockBarrier();
            await updateRow(executor, 202);
          }),
        ),
        runInTransaction(independentB, {}, (context) =>
          withExecutor(context, async (executor) => {
            await updateRow(executor, 202);
            await deadlockBarrier();
            await updateRow(executor, 201);
          }),
        ),
      ]);
      assert.equal(
        deadlockResults.filter(({ status }) => status === 'fulfilled').length,
        1,
      );
      const deadlockFailure = deadlockResults.find(
        ({ status }) => status === 'rejected',
      );
      assert.ok(deadlockFailure);
      assert.ok(
        expectsCode('DATABASE_TRANSACTION_DEADLOCK')(
          deadlockFailure.reason,
        ),
      );

      const timeoutDatabase = connection({
        SR_TEST_DB_POOL_MAX: '1',
        SR_TEST_DB_QUERY_TIMEOUT_MS: '100',
        SR_TEST_DB_STATEMENT_TIMEOUT_MS: '100',
      });
      openedConnections.add(timeoutDatabase);
      await assert.rejects(
        runInTransaction(timeoutDatabase, {}, (context) =>
          withExecutor(context, (executor) =>
            sql`select pg_sleep(0.25)`.execute(executor),
          ),
        ),
        expectsCode('DATABASE_TRANSACTION_TIMEOUT'),
      );
      assert.equal(
        await runInTransaction(timeoutDatabase, {}, async () => 'reused'),
        'reused',
      );

      let releaseActive;
      let markActive;
      const activeBarrier = new Promise((resolve) => {
        releaseActive = resolve;
      });
      const activeStarted = new Promise((resolve) => {
        markActive = resolve;
      });
      const active = runInTransaction(database, {}, async () => {
        markActive();
        await activeBarrier;
        return 'closed-after-commit';
      });
      await activeStarted;
      const closing = database.close();
      assert.equal(database.state, 'closing');
      await assert.rejects(
        runInTransaction(database, {}, async () => undefined),
        expectsCode('DATABASE_TRANSACTION_INVALID_STATE'),
      );
      releaseActive();
      assert.equal(await active, 'closed-after-commit');
      await closing;
      openedConnections.delete(database);

      const failed = connection({
        SR_TEST_DB_PASSWORD: 'synthetic_wrong_password',
      });
      openedConnections.add(failed);
      await assert.rejects(
        runInTransaction(failed, {}, async () => undefined),
        expectsCode('DATABASE_TRANSACTION_ABORTED'),
      );

      for (const candidate of openedConnections) {
        await candidate.close();
      }
      openedConnections.clear();
      for (const candidate of [
        database,
        independentA,
        independentB,
        timeoutDatabase,
        failed,
      ]) {
        const pool = sanitizeDatabaseConnectionState(candidate).pool;
        assert.equal(pool.totalCount, 0);
        assert.equal(pool.idleCount, 0);
        assert.equal(pool.waitingCount, 0);
      }
    } finally {
      await Promise.all(
        [...openedConnections].map((candidate) =>
          candidate.close().catch(() => undefined),
        ),
      );
      await admin
        .query('drop table if exists transaction_probe')
        .catch(() => undefined);
      await admin.end();
    }
  },
);
