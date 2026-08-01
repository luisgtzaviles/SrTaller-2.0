import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import { inspect } from 'node:util';

import { Pool } from 'pg';

const enabled = process.env.SR_OWNER_SCOPED_PG_TEST === '1';

const { createDatabaseConnection } = enabled
  ? await import('../dist/infrastructure/database/database-connection.js')
  : {};
const { inspectMigrationSource } = enabled
  ? await import(
      '../dist/infrastructure/database/database-migration-provider.js'
    )
  : {};
const { createMigrationRunner } = enabled
  ? await import('../dist/infrastructure/database/migration-runner.js')
  : {};
const { DatabaseTransactionError, runInTransaction } = enabled
  ? await import('../dist/infrastructure/database/transaction-runner.js')
  : {};
const {
  BranchPersistenceError,
} = enabled
  ? await import(
      '../dist/modules/tenancy/application/ports/branch-repository.port.js'
    )
  : {};
const {
  createKyselyBranchRepository,
  createTransactionalKyselyBranchRepository,
} = enabled
  ? await import(
      '../dist/modules/tenancy/infrastructure/persistence/kysely-branch.repository.js'
    )
  : {};
const { TenantPersistenceError } = enabled
  ? await import(
      '../dist/modules/tenancy/application/ports/tenant-repository.port.js'
    )
  : {};
const { parseBranchId, parseTenantId } = enabled
  ? await import('../dist/modules/tenancy/index.js')
  : {};
const {
  createKyselyTenantRepository,
  createTransactionalKyselyTenantRepository,
} = enabled
  ? await import(
      '../dist/modules/tenancy/infrastructure/persistence/kysely-tenant.repository.js'
    )
  : {};

const migrationRoot = fileURLToPath(
  new URL('../dist/infrastructure/database/migrations/', import.meta.url),
);
const migrationName =
  '20260725183832_database_create_tenants_and_branches';
const stationMigrationName =
  '20260726160000_stations_create_stations_and_bindings';
const previewMigrationName =
  '20260801140000_preview_create_repairs_and_status_history';
const createdAt = '2026-07-25T20:00:00.000Z';

function databaseConfig() {
  return Object.freeze({
    identity: Object.freeze({
      host: process.env.SR_OWNER_SCOPED_PG_HOST,
      port: Number(process.env.SR_OWNER_SCOPED_PG_PORT),
      database: process.env.SR_OWNER_SCOPED_PG_NAME,
      user: process.env.SR_OWNER_SCOPED_PG_USER,
      password: process.env.SR_OWNER_SCOPED_PG_PASSWORD,
    }),
    transport: Object.freeze({ sslMode: 'disable' }),
    pool: Object.freeze({
      min: 0,
      max: 4,
      idleTimeoutMs: 1_000,
      connectionTimeoutMs: 2_000,
      statementTimeoutMs: 10_000,
      queryTimeoutMs: 10_000,
    }),
    runtime: Object.freeze({
      environment: 'development',
      role: 'migration',
      accessMode: 'read-write',
      migrationsEnabled: true,
      testRunId: null,
    }),
    observability: Object.freeze({
      applicationName: 'srtaller-pbi023-owner-scoped-postgresql',
      labels: Object.freeze({
        component: 'persistence',
        environment: 'development',
        role: 'migration',
      }),
    }),
  });
}

function adminPool() {
  return new Pool({
    database: process.env.SR_OWNER_SCOPED_PG_NAME,
    host: process.env.SR_OWNER_SCOPED_PG_HOST,
    max: 2,
    password: process.env.SR_OWNER_SCOPED_PG_PASSWORD,
    port: Number(process.env.SR_OWNER_SCOPED_PG_PORT),
    ssl: false,
    user: process.env.SR_OWNER_SCOPED_PG_USER,
  });
}

function source() {
  return Object.freeze({
    root: migrationRoot,
    authorizedRoot: migrationRoot,
    normalizedRoot: 'src/infrastructure/database/migrations',
    mode: 'compiled',
  });
}

function authorization(item) {
  return Object.freeze({
    migrationName: item.name,
    expectedHash: item.hash,
    reason: 'owner-scoped adapter integration cleanup',
    environment: 'development',
    confirmation: 'REVERT_ONE_MIGRATION',
  });
}

function expectsTenantCode(code) {
  return (error) => {
    assert.ok(error instanceof TenantPersistenceError);
    assert.equal(error.code, code);
    assert.doesNotMatch(
      `${JSON.stringify(error)}\n${inspect(error)}`,
      /postgres:\/\/|password|SR_OWNER_SCOPED|select|insert|tenant_[ab]/iu,
    );
    return true;
  };
}

function expectsBranchCode(code) {
  return (error) => {
    assert.ok(error instanceof BranchPersistenceError);
    assert.equal(error.code, code);
    assert.doesNotMatch(
      `${JSON.stringify(error)}\n${inspect(error)}`,
      /postgres:\/\/|password|SR_OWNER_SCOPED|select|insert|tenant_[ab]/iu,
    );
    return true;
  };
}

async function resetDatabase(admin) {
  await admin.query(
    `drop table if exists
      station_bindings,
      stations,
      preview_repair_status_history,
      preview_repairs,
      branches,
      tenants,
      kysely_migration,
      kysely_migration_lock
     cascade`,
  );
}

async function assertNoObjects(admin) {
  const result = await admin.query(
    `select tablename
     from pg_catalog.pg_tables
     where schemaname = 'public'
       and tablename in (
         'station_bindings',
         'stations',
         'preview_repair_status_history',
         'preview_repairs',
         'branches',
         'tenants',
         'kysely_migration',
         'kysely_migration_lock'
       )
     order by tablename`,
  );
  assert.deepEqual(result.rows, []);
}

test(
  'PostgreSQL 18.4 verifies owner-scoped adapters and negative tenant isolation',
  { skip: !enabled, timeout: 120_000 },
  async () => {
    assert.equal(process.version, 'v24.18.0');
    const admin = adminPool();
    const connection = createDatabaseConnection(databaseConfig());
    let runner;
    try {
      await resetDatabase(admin);
      const inspection = await inspectMigrationSource(source());
      assert.deepEqual(
        inspection.manifest.migrations.map(({ migrationName }) => migrationName),
        [migrationName, stationMigrationName, previewMigrationName],
      );
      runner = createMigrationRunner(connection, {
        expectedManifestHash: inspection.manifest.aggregateSha256,
      });
      const applied = await runner.migrateToLatest();
      assert.equal(applied.status.migrations[0].state, 'applied');

      const tenantRepository = createKyselyTenantRepository(connection);
      const branchRepository = createKyselyBranchRepository(connection);

      const tenantA = parseTenantId(
        '10000000-0000-4000-8000-000000000001',
      );
      const tenantB = parseTenantId(
        '20000000-0000-4000-8000-000000000002',
      );
      const tenantCommitted = parseTenantId(
        '30000000-0000-4000-8000-000000000003',
      );
      const tenantRolledBack = parseTenantId(
        '40000000-0000-4000-8000-000000000004',
      );
      const missingTenant = parseTenantId(
        '50000000-0000-4000-8000-000000000005',
      );
      const branchA = parseBranchId(
        'a0000000-0000-4000-8000-000000000001',
      );
      const branchB = parseBranchId(
        'b0000000-0000-4000-8000-000000000002',
      );
      const sharedBranch = parseBranchId(
        'c0000000-0000-4000-8000-000000000003',
      );
      const concurrentBranch = parseBranchId(
        'd0000000-0000-4000-8000-000000000004',
      );
      const rolledBackBranch = parseBranchId(
        'e0000000-0000-4000-8000-000000000005',
      );

      const tenantARecord = await tenantRepository.createTenant(
        { tenantId: tenantA },
        { tenantId: tenantA, createdAt },
      );
      await tenantRepository.createTenant(
        { tenantId: tenantB },
        { tenantId: tenantB, createdAt },
      );
      assert.ok(Object.isFrozen(tenantARecord));
      assert.deepEqual(
        await tenantRepository.findTenantById({ tenantId: tenantA }),
        tenantARecord,
      );
      assert.equal(
        await tenantRepository.existsTenant({ tenantId: tenantA }),
        true,
      );
      await assert.rejects(
        tenantRepository.createTenant(
          { tenantId: tenantA },
          { tenantId: tenantA, createdAt },
        ),
        expectsTenantCode('TENANT_PERSISTENCE_CONFLICT'),
      );

      await runInTransaction(connection, {}, async (context) => {
        const repository =
          createTransactionalKyselyTenantRepository(context);
        await repository.createTenant(
          { tenantId: tenantCommitted },
          { tenantId: tenantCommitted, createdAt },
        );
      });
      assert.equal(
        await tenantRepository.existsTenant({ tenantId: tenantCommitted }),
        true,
      );

      await assert.rejects(
        runInTransaction(connection, {}, async (context) => {
          const repository =
            createTransactionalKyselyTenantRepository(context);
          await repository.createTenant(
            { tenantId: tenantRolledBack },
            { tenantId: tenantRolledBack, createdAt },
          );
          throw new Error('synthetic rollback');
        }),
        (error) =>
          error instanceof DatabaseTransactionError &&
          error.code === 'DATABASE_TRANSACTION_CALLBACK_FAILED',
      );
      assert.equal(
        await tenantRepository.existsTenant({ tenantId: tenantRolledBack }),
        false,
      );

      for (const [tenantId, branchId] of [
        [tenantA, branchA],
        [tenantB, branchB],
        [tenantA, sharedBranch],
        [tenantB, sharedBranch],
      ]) {
        await branchRepository.createBranch(
          { tenantId, branchId },
          { tenantId, branchId, createdAt },
        );
      }

      const foundA = await branchRepository.findBranchById({
        tenantId: tenantA,
        branchId: branchA,
      });
      assert.equal(foundA?.tenantId, tenantA);
      assert.equal(
        await branchRepository.findBranchById({
          tenantId: tenantB,
          branchId: branchA,
        }),
        null,
      );
      assert.equal(
        await branchRepository.existsBranch({
          tenantId: tenantB,
          branchId: branchA,
        }),
        false,
      );

      const listA = await branchRepository.listBranchesByTenant({
        tenantId: tenantA,
      });
      const listB = await branchRepository.listBranchesByTenant({
        tenantId: tenantB,
      });
      assert.ok(Object.isFrozen(listA));
      assert.deepEqual(
        new Set(listA.map(({ branchId }) => branchId)),
        new Set([branchA, sharedBranch]),
      );
      assert.deepEqual(
        new Set(listB.map(({ branchId }) => branchId)),
        new Set([branchB, sharedBranch]),
      );
      assert.ok(listA.every(({ tenantId }) => tenantId === tenantA));
      assert.ok(listB.every(({ tenantId }) => tenantId === tenantB));

      await assert.rejects(
        branchRepository.createBranch(
          { tenantId: tenantA, branchId: branchA },
          { tenantId: tenantA, branchId: branchA, createdAt },
        ),
        expectsBranchCode('BRANCH_PERSISTENCE_CONFLICT'),
      );
      await assert.rejects(
        branchRepository.createBranch(
          { tenantId: missingTenant, branchId: branchA },
          { tenantId: missingTenant, branchId: branchA, createdAt },
        ),
        expectsBranchCode('BRANCH_PERSISTENCE_TENANT_NOT_FOUND'),
      );

      const duplicateResults = await Promise.allSettled([
        branchRepository.createBranch(
          { tenantId: tenantA, branchId: concurrentBranch },
          { tenantId: tenantA, branchId: concurrentBranch, createdAt },
        ),
        branchRepository.createBranch(
          { tenantId: tenantA, branchId: concurrentBranch },
          { tenantId: tenantA, branchId: concurrentBranch, createdAt },
        ),
      ]);
      assert.equal(
        duplicateResults.filter(({ status }) => status === 'fulfilled').length,
        1,
      );
      assert.equal(
        duplicateResults.filter(
          (result) =>
            result.status === 'rejected' &&
            result.reason instanceof BranchPersistenceError &&
            result.reason.code === 'BRANCH_PERSISTENCE_CONFLICT',
        ).length,
        1,
      );

      let expiredRepository;
      await runInTransaction(
        connection,
        { isolationLevel: 'serializable' },
        async (context) => {
          const repository =
            createTransactionalKyselyBranchRepository(context);
          expiredRepository = repository;
          assert.equal(
            await repository.findBranchById({
              tenantId: tenantB,
              branchId: branchA,
            }),
            null,
          );
          assert.equal(
            (await repository.listBranchesByTenant({ tenantId: tenantA }))
              .every(({ tenantId }) => tenantId === tenantA),
            true,
          );
          await assert.rejects(
            runInTransaction(connection, {}, async () => undefined),
            (error) =>
              error instanceof DatabaseTransactionError &&
              error.code === 'DATABASE_TRANSACTION_NESTED_FORBIDDEN',
          );
        },
      );
      await assert.rejects(
        expiredRepository.findBranchById({
          tenantId: tenantA,
          branchId: branchA,
        }),
        expectsBranchCode('BRANCH_PERSISTENCE_FAILED'),
      );

      await assert.rejects(
        runInTransaction(connection, {}, async (context) => {
          const repository =
            createTransactionalKyselyBranchRepository(context);
          await repository.createBranch(
            { tenantId: tenantA, branchId: rolledBackBranch },
            { tenantId: tenantA, branchId: rolledBackBranch, createdAt },
          );
          throw new Error('synthetic branch rollback');
        }),
        (error) =>
          error instanceof DatabaseTransactionError &&
          error.code === 'DATABASE_TRANSACTION_CALLBACK_FAILED',
      );
      assert.equal(
        await branchRepository.existsBranch({
          tenantId: tenantA,
          branchId: rolledBackBranch,
        }),
        false,
      );

      const status = await runner.getMigrationStatus();
      await runner.migrateDown(authorization(status.migrations[2]));
      await runner.migrateDown(authorization(status.migrations[1]));
      await runner.migrateDown(authorization(status.migrations[0]));
      await resetDatabase(admin);
      await assertNoObjects(admin);
    } finally {
      await runner?.destroy().catch(() => undefined);
      await connection.close().catch(() => undefined);
      await resetDatabase(admin).catch(() => undefined);
      await assertNoObjects(admin);
      await admin.end();
    }
  },
);
