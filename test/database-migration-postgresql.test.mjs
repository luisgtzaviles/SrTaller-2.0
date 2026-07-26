import assert from 'node:assert/strict';
import { cp, mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { setTimeout as delay } from 'node:timers/promises';
import { inspect } from 'node:util';

import { Pool } from 'pg';

const enabled = process.env.SR_MIGRATION_PG_TEST === '1';

const { createDatabaseConnection } = enabled
  ? await import('../dist/infrastructure/database/database-connection.js')
  : {};
const {
  databaseMigrationSourceOverride,
  inspectMigrationSource,
} = enabled
  ? await import(
      '../dist/infrastructure/database/database-migration-provider.js'
    )
  : {};
const {
  DatabaseMigrationError,
  createMigrationRunner,
} = enabled
  ? await import('../dist/infrastructure/database/migration-runner.js')
  : {};

const fixtureRoot = 'test/fixtures/database-migrations';
const migrationLockId = '3853314791062309107';
const journalTables = ['kysely_migration', 'kysely_migration_lock'];
const probeTables = [
  'migration_probe_a',
  'migration_probe_b',
  'migration_probe_down_failure',
  'migration_probe_failure',
  'migration_probe_lock',
  'migration_probe_no_down',
];

function databaseConfig(environment = 'development', poolMax = 1) {
  return Object.freeze({
    identity: Object.freeze({
      host: process.env.SR_MIGRATION_PG_HOST,
      port: Number(process.env.SR_MIGRATION_PG_PORT),
      database: process.env.SR_MIGRATION_PG_NAME,
      user: process.env.SR_MIGRATION_PG_USER,
      password: process.env.SR_MIGRATION_PG_PASSWORD,
    }),
    transport: Object.freeze({ sslMode: 'disable' }),
    pool: Object.freeze({
      min: 0,
      max: poolMax,
      idleTimeoutMs: 1_000,
      connectionTimeoutMs: 2_000,
      statementTimeoutMs: 5_000,
      queryTimeoutMs: 5_000,
    }),
    runtime: Object.freeze({
      environment,
      role: 'migration',
      accessMode: 'read-write',
      migrationsEnabled: true,
      testRunId: null,
    }),
    observability: Object.freeze({
      applicationName: 'srtaller-pbi023-migration-postgresql',
      labels: Object.freeze({
        component: 'persistence',
        environment,
        role: 'migration',
      }),
    }),
  });
}

function adminPool() {
  return new Pool({
    database: process.env.SR_MIGRATION_PG_NAME,
    host: process.env.SR_MIGRATION_PG_HOST,
    max: 2,
    password: process.env.SR_MIGRATION_PG_PASSWORD,
    port: Number(process.env.SR_MIGRATION_PG_PORT),
    ssl: false,
    user: process.env.SR_MIGRATION_PG_USER,
  });
}

function source(root, authorizedRoot) {
  return Object.freeze({
    root,
    authorizedRoot,
    normalizedRoot: 'test-fixtures/database-migrations',
    mode: 'compiled',
  });
}

async function temporaryRoot(name) {
  const temporary = await mkdtemp(
    join(tmpdir(), 'srtaller-migration-postgresql-'),
  );
  const root = join(temporary, name);
  if (name === 'empty') {
    await mkdir(root);
  } else {
    await cp(join(fixtureRoot, name), root, { recursive: true });
  }
  return Object.freeze({ root, temporary });
}

function expectsCode(code) {
  return (error) => {
    assert.ok(error instanceof DatabaseMigrationError);
    assert.equal(error.code, code);
    const rendered = `${JSON.stringify(error)}\n${inspect(error)}`;
    assert.doesNotMatch(
      rendered,
      /postgres:\/\/|password=|SR_MIGRATION_PG_|\/private\/runtime|must-not-escape/iu,
    );
    return true;
  };
}

function authorization(item, environment = 'development') {
  return Object.freeze({
    migrationName: item.name,
    expectedHash: item.hash,
    reason: 'verified single-step migration reversal',
    environment,
    confirmation: 'REVERT_ONE_MIGRATION',
  });
}

async function createScenario(
  name,
  resources,
  {
    environment = 'development',
    expectedManifestHash,
    lockTimeoutMs = 1_000,
  } = {},
) {
  const temporary = await temporaryRoot(name);
  resources.temporary.add(temporary.temporary);
  const migrationSource = source(temporary.root, temporary.temporary);
  const inspection = await inspectMigrationSource(migrationSource);
  const connection = createDatabaseConnection(
    databaseConfig(environment),
  );
  resources.connections.add(connection);
  const runner = createMigrationRunner(connection, {
    expectedManifestHash:
      expectedManifestHash ?? inspection.manifest.aggregateSha256,
    lockTimeoutMs,
    [databaseMigrationSourceOverride]: migrationSource,
  });
  resources.runners.add(runner);
  return Object.freeze({
    connection,
    inspection,
    root: temporary.root,
    runner,
    source: migrationSource,
  });
}

async function resetDatabase(admin) {
  const names = [...probeTables, ...journalTables]
    .map((name) => `"${name}"`)
    .join(', ');
  await admin.query(`drop table if exists ${names} cascade`);
}

async function tableExists(admin, table) {
  const result = await admin.query(
    `select exists (
      select 1
      from pg_catalog.pg_tables
      where schemaname = 'public' and tablename = $1
    ) as present`,
    [table],
  );
  return result.rows[0].present;
}

async function journalRows(admin) {
  if (!(await tableExists(admin, 'kysely_migration'))) {
    return [];
  }
  const result = await admin.query(
    'select name from kysely_migration order by timestamp, name',
  );
  return result.rows.map(({ name }) => name);
}

async function assertNoRetainedObjects(admin) {
  const result = await admin.query(
    `select tablename
     from pg_catalog.pg_tables
     where schemaname = 'public'
       and (tablename like 'migration_probe_%'
         or tablename in ('kysely_migration', 'kysely_migration_lock'))
     order by tablename`,
  );
  assert.deepEqual(result.rows, []);
}

async function releaseResources(resources) {
  await Promise.allSettled(
    [...resources.runners].map((runner) => runner.destroy()),
  );
  await Promise.allSettled(
    [...resources.connections].map((connection) => connection.close()),
  );
  await Promise.all(
    [...resources.temporary].map((directory) =>
      rm(directory, { recursive: true, force: true }),
    ),
  );
}

test(
  'PostgreSQL 18.4 governed migration runner is deterministic and leak-free',
  { skip: !enabled, timeout: 90_000 },
  async () => {
    assert.equal(process.version, 'v24.18.0');
    const admin = adminPool();
    const resources = {
      connections: new Set(),
      runners: new Set(),
      temporary: new Set(),
    };

    try {
      await resetDatabase(admin);

      const empty = await createScenario('empty', resources);
      const emptyStatus = await empty.runner.getMigrationStatus();
      assert.deepEqual(emptyStatus.migrations, []);
      assert.equal(emptyStatus.manifestVerification, 'match');
      assert.equal(await tableExists(admin, 'kysely_migration'), false);
      const emptyExecution = await empty.runner.migrateToLatest();
      assert.deepEqual(emptyExecution.results, []);
      assert.deepEqual(await journalRows(admin), []);
      await resetDatabase(admin);

      const latest = await createScenario('valid', resources);
      const pending = await latest.runner.getMigrationStatus();
      assert.deepEqual(
        pending.migrations.map(({ name, state }) => ({ name, state })),
        [
          {
            name: '20260725010000_database_create_probe_a',
            state: 'pending',
          },
          {
            name: '20260725010100_database_create_probe_b',
            state: 'pending',
          },
        ],
      );
      assert.ok(Object.isFrozen(pending));
      assert.ok(Object.isFrozen(pending.migrations));
      const applied = await latest.runner.migrateToLatest();
      assert.deepEqual(
        applied.results.map(({ name, direction, status }) => ({
          name,
          direction,
          status,
        })),
        [
          {
            name: '20260725010000_database_create_probe_a',
            direction: 'Up',
            status: 'Success',
          },
          {
            name: '20260725010100_database_create_probe_b',
            direction: 'Up',
            status: 'Success',
          },
        ],
      );
      assert.deepEqual(await journalRows(admin), [
        '20260725010000_database_create_probe_a',
        '20260725010100_database_create_probe_b',
      ]);
      assert.equal(await tableExists(admin, 'migration_probe_a'), true);
      assert.equal(await tableExists(admin, 'migration_probe_b'), true);
      const repeated = await latest.runner.migrateToLatest();
      assert.deepEqual(repeated.results, []);

      await assert.rejects(
        latest.runner.migrateDown(undefined),
        expectsCode('DATABASE_MIGRATION_DOWN_FORBIDDEN'),
      );
      const latestItem = repeated.status.migrations.at(-1);
      await assert.rejects(
        latest.runner.migrateDown({
          ...authorization(latestItem),
          expectedHash: '0'.repeat(64),
        }),
        expectsCode('DATABASE_MIGRATION_DOWN_FORBIDDEN'),
      );
      const down = await latest.runner.migrateDown(
        authorization(latestItem),
      );
      assert.deepEqual(
        down.results.map(({ name, direction, status }) => ({
          name,
          direction,
          status,
        })),
        [
          {
            name: '20260725010100_database_create_probe_b',
            direction: 'Down',
            status: 'Success',
          },
        ],
      );
      assert.equal(await tableExists(admin, 'migration_probe_b'), false);
      assert.deepEqual(await journalRows(admin), [
        '20260725010000_database_create_probe_a',
      ]);
      await resetDatabase(admin);

      const stepped = await createScenario('valid', resources);
      const firstStep = await stepped.runner.migrateUp();
      const secondStep = await stepped.runner.migrateUp();
      const thirdStep = await stepped.runner.migrateUp();
      assert.deepEqual(
        [firstStep, secondStep].map((execution) =>
          execution.results.map(({ name }) => name),
        ),
        [
          ['20260725010000_database_create_probe_a'],
          ['20260725010100_database_create_probe_b'],
        ],
      );
      assert.deepEqual(thirdStep.results, []);
      await resetDatabase(admin);

      const failing = await createScenario('failing', resources);
      await assert.rejects(
        failing.runner.migrateToLatest(),
        expectsCode('DATABASE_MIGRATION_EXECUTION_FAILED'),
      );
      assert.equal(await tableExists(admin, 'migration_probe_failure'), false);
      assert.deepEqual(await journalRows(admin), []);
      const recoveredStatus = await failing.runner.getMigrationStatus();
      assert.equal(recoveredStatus.migrations[0].state, 'pending');
      const lockClient = await admin.connect();
      try {
        const acquired = await lockClient.query(
          'select pg_try_advisory_lock($1::bigint) as acquired',
          [migrationLockId],
        );
        assert.equal(acquired.rows[0].acquired, true);
        const released = await lockClient.query(
          'select pg_advisory_unlock($1::bigint) as released',
          [migrationLockId],
        );
        assert.equal(released.rows[0].released, true);
      } finally {
        lockClient.release();
      }
      await resetDatabase(admin);

      const noDown = await createScenario('no-down', resources);
      const noDownApplied = await noDown.runner.migrateToLatest();
      await assert.rejects(
        noDown.runner.migrateDown(
          authorization(noDownApplied.status.migrations[0]),
        ),
        expectsCode('DATABASE_MIGRATION_DOWN_FORBIDDEN'),
      );
      assert.equal(await tableExists(admin, 'migration_probe_no_down'), true);
      assert.equal((await journalRows(admin)).length, 1);
      await resetDatabase(admin);

      const downFails = await createScenario('down-fails', resources);
      const downFailsApplied = await downFails.runner.migrateToLatest();
      await assert.rejects(
        downFails.runner.migrateDown(
          authorization(downFailsApplied.status.migrations[0]),
        ),
        expectsCode('DATABASE_MIGRATION_DOWN_FAILED'),
      );
      assert.equal(
        await tableExists(admin, 'migration_probe_down_failure'),
        true,
      );
      assert.equal((await journalRows(admin)).length, 1);
      await resetDatabase(admin);

      const productionSource = await temporaryRoot('valid');
      resources.temporary.add(productionSource.temporary);
      const productionMigrationSource = source(
        productionSource.root,
        productionSource.temporary,
      );
      const productionInspection = await inspectMigrationSource(
        productionMigrationSource,
      );
      const developmentConnection = createDatabaseConnection(
        databaseConfig('development'),
      );
      resources.connections.add(developmentConnection);
      const developmentRunner = createMigrationRunner(
        developmentConnection,
        {
          expectedManifestHash:
            productionInspection.manifest.aggregateSha256,
          [databaseMigrationSourceOverride]: productionMigrationSource,
        },
      );
      resources.runners.add(developmentRunner);
      const productionApplied =
        await developmentRunner.migrateToLatest();
      const productionConnection = createDatabaseConnection(
        databaseConfig('production'),
      );
      resources.connections.add(productionConnection);
      const productionRunner = createMigrationRunner(
        productionConnection,
        {
          expectedManifestHash:
            productionInspection.manifest.aggregateSha256,
          [databaseMigrationSourceOverride]: productionMigrationSource,
        },
      );
      resources.runners.add(productionRunner);
      await assert.rejects(
        productionRunner.migrateDown(
          authorization(
            productionApplied.status.migrations.at(-1),
            'production',
          ),
        ),
        expectsCode('DATABASE_MIGRATION_DOWN_FORBIDDEN'),
      );
      await resetDatabase(admin);

      const drift = await createScenario('valid', resources);
      const originalHash = drift.inspection.manifest.aggregateSha256;
      await writeFile(
        join(
          drift.root,
          '20260725010100_database_create_probe_b.js',
        ),
        "export async function up() { throw new Error('changed'); }\n",
      );
      await assert.rejects(
        drift.runner.migrateToLatest(),
        expectsCode('DATABASE_MIGRATION_DRIFT_DETECTED'),
      );
      const changedInspection = await inspectMigrationSource(drift.source);
      assert.notEqual(
        changedInspection.manifest.aggregateSha256,
        originalHash,
      );
      assert.deepEqual(await journalRows(admin), []);
      await resetDatabase(admin);

      const lockingA = await createScenario('locking', resources, {
        lockTimeoutMs: 2_000,
      });
      const lockingBConnection = createDatabaseConnection(
        databaseConfig('development'),
      );
      resources.connections.add(lockingBConnection);
      const lockingB = createMigrationRunner(lockingBConnection, {
        expectedManifestHash:
          lockingA.inspection.manifest.aggregateSha256,
        lockTimeoutMs: 50,
        [databaseMigrationSourceOverride]: lockingA.source,
      });
      resources.runners.add(lockingB);
      const firstLockExecution = lockingA.runner.migrateToLatest();
      await delay(75);
      await assert.rejects(
        lockingB.migrateToLatest(),
        expectsCode('DATABASE_MIGRATION_LOCK_TIMEOUT'),
      );
      await firstLockExecution;
      const lockingCConnection = createDatabaseConnection(
        databaseConfig('development'),
      );
      resources.connections.add(lockingCConnection);
      const lockingC = createMigrationRunner(lockingCConnection, {
        expectedManifestHash:
          lockingA.inspection.manifest.aggregateSha256,
        [databaseMigrationSourceOverride]: lockingA.source,
      });
      resources.runners.add(lockingC);
      assert.deepEqual((await lockingC.migrateToLatest()).results, []);
      assert.equal((await journalRows(admin)).length, 1);
      await resetDatabase(admin);

      const closing = await createScenario('locking', resources, {
        lockTimeoutMs: 2_000,
      });
      const activeExecution = closing.runner.migrateToLatest();
      await delay(75);
      const closingConnection = closing.connection.close();
      const closingRunner = closing.runner.destroy();
      await activeExecution;
      await Promise.all([closingConnection, closingRunner]);
      assert.equal(closing.connection.state, 'closed');
      assert.equal(closing.runner.state, 'closed');
      assert.equal(await tableExists(admin, 'migration_probe_lock'), true);
      await resetDatabase(admin);

      await assertNoRetainedObjects(admin);
    } finally {
      await releaseResources(resources);
      await resetDatabase(admin).catch(() => undefined);
      await assertNoRetainedObjects(admin);
      await admin.end();
    }
  },
);
