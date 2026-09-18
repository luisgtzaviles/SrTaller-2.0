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

const migrationRoot = fileURLToPath(
  new URL('../dist/infrastructure/database/migrations/', import.meta.url),
);
const migrationName = '20260917190200_access_add_granular_catalog_capabilities';
const tenantId = randomUUID();
const roleIds = Object.freeze({
  legacyCatalog: randomUUID(),
  legacyImport: randomUUID(),
  priceListReader: randomUUID(),
  unrelated: randomUUID(),
});

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

test(
  'granular catalog capability migration backfills only matching legacy capability grants',
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
      const target = current.migrations.find(({ name }) => name === migrationName);
      assert.ok(target);
      assert.equal(target.state, 'applied');

      const reverted = await runner.migrateDown({
        migrationName: target.name,
        expectedHash: target.hash,
        reason: 'prove capability-based catalog authorization backfill',
        environment: 'development',
        confirmation: 'REVERT_ONE_MIGRATION',
      });
      assert.deepEqual(
        reverted.results.map(({ name, direction, status }) => ({ name, direction, status })),
        [{ name: migrationName, direction: 'Down', status: 'Success' }],
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
        [{ name: migrationName, direction: 'Up', status: 'Success' }],
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
      assert.deepEqual((await runner.migrateToLatest()).results, []);
    } finally {
      await runner.destroy().catch(() => undefined);
      await admin.end().catch(() => undefined);
    }
  },
);
