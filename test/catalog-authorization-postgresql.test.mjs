import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

import { Pool } from 'pg';

const enabled = process.env.SR_PBI041_AUTH_PG_TEST === '1';

const { createDatabaseConnection } = enabled
  ? await import('../dist/infrastructure/database/database-connection.js')
  : {};
const {
  databaseMigrationSourceOverride,
  inspectMigrationSource,
} = enabled
  ? await import('../dist/infrastructure/database/database-migration-provider.js')
  : {};
const { createMigrationRunner } = enabled
  ? await import('../dist/infrastructure/database/migration-runner.js')
  : {};
const { createKyselyAccessRepository } = enabled
  ? await import('../dist/modules/access/infrastructure/persistence/kysely-access.repository.js')
  : {};

const migrationRoot = fileURLToPath(
  new URL('../dist/infrastructure/database/migrations/', import.meta.url),
);
const migrationName = '20260917190200_access_add_granular_catalog_capabilities';
const tenantId = '00000000-0000-4000-8000-000000000001';
const roleIds = Object.freeze({
  legacyCatalog: randomUUID(),
  legacyImport: randomUUID(),
  priceListReader: randomUUID(),
  unrelated: randomUUID(),
});
const matrixRoleIds = Object.freeze({
  attention: randomUUID(),
  manager: randomUUID(),
  publisher: randomUUID(),
  costViewer: randomUUID(),
});
const matrixUserIds = Object.freeze({
  attention: randomUUID(),
  manager: randomUUID(),
  publisher: randomUUID(),
  multiRole: randomUUID(),
});
const matrixBranchId = randomUUID();
const otherBranchId = randomUUID();

function config() {
  return Object.freeze({
    identity: Object.freeze({
      host: process.env.SR_PBI041_PG_HOST,
      port: Number(process.env.SR_PBI041_PG_PORT),
      database: process.env.SR_PBI041_PG_NAME,
      user: process.env.SR_PBI041_PG_USER,
      password: process.env.SR_PBI041_PG_PASSWORD,
    }),
    transport: Object.freeze({ sslMode: 'disable' }),
    pool: Object.freeze({
      min: 0, max: 4, idleTimeoutMs: 1_000, connectionTimeoutMs: 2_000,
      statementTimeoutMs: 30_000, queryTimeoutMs: 30_000,
    }),
    runtime: Object.freeze({
      environment: 'development', role: 'migration', accessMode: 'read-write',
      migrationsEnabled: true, testRunId: null,
    }),
    observability: Object.freeze({
      applicationName: 'srtaller-pbi041-catalog-authorization-postgresql',
      labels: Object.freeze({ component: 'catalog-authorization', environment: 'development', role: 'migration' }),
    }),
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

function adminPool() {
  return new Pool({
    host: process.env.SR_PBI041_PG_HOST,
    port: Number(process.env.SR_PBI041_PG_PORT),
    database: process.env.SR_PBI041_PG_NAME,
    user: process.env.SR_PBI041_PG_USER,
    password: process.env.SR_PBI041_PG_PASSWORD,
    ssl: false,
    max: 2,
  });
}

async function roleCapabilities(admin, roleId) {
  const result = await admin.query(
    `select capability_code
       from access_role_capabilities
      where tenant_id = $1 and role_id = $2
      order by capability_code`,
    [tenantId, roleId],
  );
  return result.rows.map(({ capability_code }) => capability_code);
}

async function assignMatrixRole(admin, userId, roleId) {
  await admin.query(
    `insert into access_role_assignments (
       tenant_id, assignment_id, user_id, role_id, assignment_scope,
       branch_id, status, version, assigned_at
     ) values ($1, $2, $3, $4, 'BRANCH_RESTRICTED', $5, 'active', 0, now())`,
    [tenantId, randomUUID(), userId, roleId, matrixBranchId],
  );
}

async function resolvedCapabilities(repository, userId, branchId = matrixBranchId) {
  return [...await repository.resolveEffectiveCapabilities({ tenantId, branchId, userId })].sort();
}

test(
  'granular catalog capability migration preserves compatibility and materializes the role matrix',
  { skip: !enabled, timeout: 90_000 },
  async () => {
    assert.equal(process.version, 'v24.18.0');
    const admin = adminPool();
    const connection = createDatabaseConnection(config());
    const migrationSource = source();
    const inspection = await inspectMigrationSource(migrationSource);
    const runner = createMigrationRunner(connection, {
      expectedManifestHash: inspection.manifest.aggregateSha256,
      [databaseMigrationSourceOverride]: migrationSource,
    });

    try {
      const current = await runner.getMigrationStatus();
      const targetIndex = current.migrations.findIndex(({ name }) => name === migrationName);
      const target = current.migrations[targetIndex];
      assert.ok(target);
      assert.equal(target.state, 'applied');

      const rollbackSequence = current.migrations
        .slice(targetIndex)
        .filter(({ state }) => state === 'applied')
        .reverse();
      const reverted = [];
      for (const migration of rollbackSequence) {
        reverted.push(await runner.migrateDown({
          migrationName: migration.name,
          expectedHash: migration.hash,
          reason: 'prove capability-based catalog authorization backfill',
          environment: 'development',
          confirmation: 'REVERT_ONE_MIGRATION',
        }));
      }
      assert.deepEqual(
        reverted.flatMap(({ results }) => results).map(({ name, direction, status }) => ({ name, direction, status })),
        rollbackSequence.map(({ name }) => ({ name, direction: 'Down', status: 'Success' })),
      );

      await admin.query(
        `insert into tenants (tenant_id, operating_currency, created_at)
         values ($1, 'MXN', now())`,
        [tenantId],
      );
      await admin.query(
        `insert into access_roles (
           tenant_id, role_id, role_key, display_name, status, version, created_at, updated_at
         ) values
           ($1, $2, 'legacy_catalog', 'Legacy Catalog', 'active', 0, now(), now()),
           ($1, $3, 'legacy_import', 'Legacy Import', 'active', 0, now(), now()),
           ($1, $4, 'price_list_reader', 'Price List Reader', 'active', 0, now(), now()),
           ($1, $5, 'unrelated', 'Unrelated', 'active', 0, now(), now())`,
        [tenantId, roleIds.legacyCatalog, roleIds.legacyImport, roleIds.priceListReader, roleIds.unrelated],
      );
      await admin.query(
        `insert into access_role_capabilities (tenant_id, role_id, capability_code, created_at)
         values
           ($1, $2, 'catalog.manage', now()),
           ($1, $2, 'catalog.prices.manage', now()),
           ($1, $3, 'catalog.import.prepare', now()),
           ($1, $4, 'price_list.read', now()),
           ($1, $5, 'repairs.read', now())`,
        [tenantId, roleIds.legacyCatalog, roleIds.legacyImport, roleIds.priceListReader, roleIds.unrelated],
      );

      const reapplied = await runner.migrateToLatest();
      assert.deepEqual(
        reapplied.results.map(({ name, direction, status }) => ({ name, direction, status })),
        [...rollbackSequence].reverse().map(({ name }) => ({ name, direction: 'Up', status: 'Success' })),
      );
      assert.deepEqual(await roleCapabilities(admin, roleIds.legacyCatalog), [
        'catalog.items.create',
        'catalog.items.deactivate',
        'catalog.items.update',
        'catalog.manage',
        'catalog.prices.manage',
      ]);
      assert.deepEqual(await roleCapabilities(admin, roleIds.legacyImport), [
        'catalog.import.prepare',
        'catalog.import.read',
      ]);
      assert.deepEqual(await roleCapabilities(admin, roleIds.priceListReader), ['price_list.read']);
      assert.deepEqual(await roleCapabilities(admin, roleIds.unrelated), ['repairs.read']);

      const sensitiveCount = await admin.query(
        `select count(*)::integer as count
           from access_role_capabilities
          where tenant_id = $1
            and capability_code = any($2::varchar[])`,
        [tenantId, [
          'catalog.import.publish', 'catalog.items.bulk_retire', 'catalog.suppliers.delete',
          'catalog.reference_cost.read', 'catalog.reference_cost.manage',
          'catalog.branch_prices.manage', 'catalog.configuration.read', 'catalog.configuration.manage',
        ]],
      );
      assert.equal(sensitiveCount.rows[0].count, 0);

      await admin.query(
        `insert into branches (tenant_id, branch_id, active, created_at)
         values ($1, $2, true, now()), ($1, $3, true, now())`,
        [tenantId, matrixBranchId, otherBranchId],
      );
      await admin.query(
        `insert into users (
           tenant_id, user_id, display_name, operational_identifier, status,
           version, created_at, updated_at
         ) values
           ($1, $2, 'Atención QA', 'attention-qa', 'active', 0, now(), now()),
           ($1, $3, 'Encargado QA', 'manager-qa', 'active', 0, now(), now()),
           ($1, $4, 'Publisher QA', 'publisher-qa', 'active', 0, now(), now()),
           ($1, $5, 'Costo QA', 'cost-qa', 'active', 0, now(), now())`,
        [tenantId, matrixUserIds.attention, matrixUserIds.manager, matrixUserIds.publisher, matrixUserIds.multiRole],
      );
      await admin.query(
        `insert into access_roles (
           tenant_id, role_id, role_key, display_name, status, version, created_at, updated_at
         ) values
           ($1, $2, 'attention_qa', 'Atención QA', 'active', 0, now(), now()),
           ($1, $3, 'manager_qa', 'Encargado QA', 'active', 0, now(), now()),
           ($1, $4, 'publisher_qa', 'Publisher QA', 'active', 0, now(), now()),
           ($1, $5, 'cost_viewer_qa', 'Costo QA', 'active', 0, now(), now())`,
        [tenantId, matrixRoleIds.attention, matrixRoleIds.manager, matrixRoleIds.publisher, matrixRoleIds.costViewer],
      );
      await admin.query(
        `insert into access_role_capabilities (tenant_id, role_id, capability_code, created_at)
         values
           ($1, $2, 'price_list.read', now()),
           ($1, $3, 'price_list.read', now()),
           ($1, $3, 'catalog.items.create', now()),
           ($1, $3, 'catalog.items.update', now()),
           ($1, $3, 'catalog.items.deactivate', now()),
           ($1, $3, 'catalog.prices.manage', now()),
           ($1, $3, 'catalog.import.read', now()),
           ($1, $3, 'catalog.import.prepare', now()),
           ($1, $4, 'price_list.read', now()),
           ($1, $4, 'catalog.import.read', now()),
           ($1, $4, 'catalog.import.publish', now()),
           ($1, $4, 'catalog.items.create', now()),
           ($1, $4, 'catalog.prices.manage', now()),
           ($1, $5, 'price_list.read', now()),
           ($1, $5, 'catalog.reference_cost.read', now())`,
        [
          tenantId,
          matrixRoleIds.attention,
          matrixRoleIds.manager,
          matrixRoleIds.publisher,
          matrixRoleIds.costViewer,
        ],
      );
      await assignMatrixRole(admin, matrixUserIds.attention, matrixRoleIds.attention);
      await assignMatrixRole(admin, matrixUserIds.manager, matrixRoleIds.manager);
      await assignMatrixRole(admin, matrixUserIds.publisher, matrixRoleIds.publisher);
      await assignMatrixRole(admin, matrixUserIds.multiRole, matrixRoleIds.attention);
      await assignMatrixRole(admin, matrixUserIds.multiRole, matrixRoleIds.costViewer);

      const accessRepository = createKyselyAccessRepository(connection);
      assert.deepEqual(await resolvedCapabilities(accessRepository, matrixUserIds.attention), ['price_list.read']);
      assert.deepEqual(await resolvedCapabilities(accessRepository, matrixUserIds.manager), [
        'catalog.import.prepare', 'catalog.import.read', 'catalog.items.create',
        'catalog.items.deactivate', 'catalog.items.update', 'catalog.prices.manage',
        'price_list.read',
      ]);
      assert.deepEqual(await resolvedCapabilities(accessRepository, matrixUserIds.publisher), [
        'catalog.import.publish', 'catalog.import.read', 'catalog.items.create',
        'catalog.prices.manage', 'price_list.read',
      ]);
      assert.deepEqual(await resolvedCapabilities(accessRepository, matrixUserIds.multiRole), [
        'catalog.reference_cost.read', 'price_list.read',
      ]);
      assert.deepEqual(await resolvedCapabilities(accessRepository, matrixUserIds.manager, otherBranchId), []);
      assert.deepEqual(
        [...await accessRepository.resolveEffectiveCapabilities({
          tenantId: randomUUID(), branchId: matrixBranchId, userId: matrixUserIds.manager,
        })],
        [],
      );

      await admin.query(
        `delete from access_role_capabilities
          where tenant_id = $1 and role_id = $2 and capability_code = 'catalog.import.prepare'`,
        [tenantId, matrixRoleIds.manager],
      );
      assert.equal(
        (await resolvedCapabilities(accessRepository, matrixUserIds.manager)).includes('catalog.import.prepare'),
        false,
        'the next protected-operation capability resolution must observe role changes',
      );
      assert.deepEqual((await runner.migrateToLatest()).results, []);
    } finally {
      await runner.destroy().catch(() => undefined);
      await admin.end().catch(() => undefined);
    }
  },
);
