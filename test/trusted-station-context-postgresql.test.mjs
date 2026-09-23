import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

import { Pool } from 'pg';

const enabled = process.env.SR_STATION_PG_TEST === '1';

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
const { KyselyStationCredentialVerifier } = enabled
  ? await import('../dist/modules/stations/infrastructure/persistence/kysely-station-credential.verifier.js')
  : {};
const {
  ResolveTrustedStationContextUseCase,
  TrustedStationContextError,
} = enabled
  ? await import('../dist/modules/stations/application/use-cases/resolve-trusted-station-context.js')
  : {};

const migrationRoot = fileURLToPath(
  new URL('../dist/infrastructure/database/migrations/', import.meta.url),
);
const tables = [
  'catalog_audit_events', 'catalog_commands', 'catalog_reference_cost_revisions',
  'catalog_branch_price_revisions', 'catalog_base_price_revisions',
  'catalog_barcode_sequences', 'catalog_sku_sequences', 'catalog_item_identifiers', 'catalog_items',
  'catalog_brand_pending_kind_applicability', 'catalog_brand_pending_values', 'catalog_category_pending_values',
  'catalog_brand_kind_applicability', 'catalog_category_kind_applicability', 'catalog_brands', 'catalog_categories', 'catalog_reference_identity_locks',
  'repair_operational_note_request_guards',
  'repair_business_audit_events',
  'access_operational_sessions',
  'access_operational_session_station_guards',
  'access_pin_attempt_limits',
  'access_pin_attempt_station_guards',
  'access_pin_credential_commands',
  'access_pin_eligibility_tenant_guards',
  'access_pin_credentials',
  'access_role_assignment_commands',
  'access_role_commands',
  'access_role_assignments',
  'access_role_capabilities',
  'access_roles',
  'access_capabilities',
  'user_lifecycle_commands',
  'user_profile_update_commands',
  'user_create_commands',
  'user_provisioning_bootstraps',
  'users',
  'station_credentials',
  'station_bindings',
  'stations',
  'branches',
  'tenants',
  'kysely_migration',
  'kysely_migration_lock',
];
const tenantA = '10000000-0000-4000-8000-000000000024';
const tenantB = '20000000-0000-4000-8000-000000000024';
const branchA = '30000000-0000-4000-8000-000000000024';
const branchB = '40000000-0000-4000-8000-000000000024';
const stationA = '50000000-0000-4000-8000-000000000024';
const stationB = '60000000-0000-4000-8000-000000000024';
const stationCrossTenant = '70000000-0000-4000-8000-000000000024';
const credential = 'A'.repeat(43);

function databaseConfig() {
  return Object.freeze({
    identity: Object.freeze({
      host: process.env.SR_STATION_PG_HOST,
      port: Number(process.env.SR_STATION_PG_PORT),
      database: process.env.SR_STATION_PG_NAME,
      user: process.env.SR_STATION_PG_USER,
      password: process.env.SR_STATION_PG_PASSWORD,
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
      applicationName: 'srtaller-station-runtime-postgresql-review',
      labels: Object.freeze({
        component: 'stations',
        environment: 'development',
        role: 'migration',
      }),
    }),
  });
}

function adminPool() {
  return new Pool({
    database: process.env.SR_STATION_PG_NAME,
    host: process.env.SR_STATION_PG_HOST,
    max: 2,
    password: process.env.SR_STATION_PG_PASSWORD,
    port: Number(process.env.SR_STATION_PG_PORT),
    ssl: false,
    user: process.env.SR_STATION_PG_USER,
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
    reason: 'verify trusted station runtime migration reversal',
    environment: 'development',
    confirmation: 'REVERT_ONE_MIGRATION',
  });
}

async function resetDatabase(admin) {
  await admin.query('drop function if exists catalog_reject_append_only_mutation() cascade');
  await admin.query('drop function if exists repairs_reject_business_audit_event_mutation() cascade');
  await admin.query('drop function if exists stations_advance_admission_revision() cascade');
  await admin.query('drop function if exists users_advance_admission_revision() cascade');
  await admin.query('drop function if exists access_validate_operational_session_admission() cascade');
  await admin.query('drop function if exists access_invalidate_operational_sessions_for_context_change() cascade');
  await admin.query('drop function if exists access_advance_pin_credential_version() cascade');
  await admin.query(
    `drop table if exists ${tables.map((name) => `"${name}"`).join(', ')} cascade`,
  );
}

async function assertNoObjects(admin) {
  const result = await admin.query(
    `select tablename from pg_catalog.pg_tables
     where schemaname = 'public' and tablename = any($1::text[])
     order by tablename`,
    [tables],
  );
  assert.deepEqual(result.rows, []);
}

test(
  'PostgreSQL 18.4 resolves only an active, tenant-bound trusted station context',
  { skip: !enabled, timeout: 120_000 },
  async () => {
    assert.equal(process.version, 'v24.18.0');
    const admin = adminPool();
    const connection = createDatabaseConnection(databaseConfig());
    const migrationSource = source();
    const inspection = await inspectMigrationSource(migrationSource);
    const runner = createMigrationRunner(connection, {
      expectedManifestHash: inspection.manifest.aggregateSha256,
      [databaseMigrationSourceOverride]: migrationSource,
    });
    const credentialHash = createHash('sha256').update(credential).digest('hex');
    try {
      await resetDatabase(admin);
      const applied = await runner.migrateToLatest();
      assert.equal(applied.status.migrations.length, inspection.manifest.migrations.length);
      assert.ok(applied.status.migrations.every(({ state }) => state === 'applied'));
      await admin.query(
        `insert into tenants (tenant_id, display_name, lifecycle_status, operating_currency, version, created_at, updated_at)
         values ($1, 'Station Tenant A', 'ACTIVE', 'MXN', 0, now(), now()),
                ($2, 'Station Tenant B', 'ACTIVE', 'MXN', 0, now(), now())`,
        [tenantA, tenantB],
      );
      await admin.query(
        `insert into branches (
           tenant_id, branch_id, display_name, time_zone, active, created_at, updated_at
         ) values
           ($1, $2, 'Station Branch', 'America/Hermosillo', true, now(), now()),
           ($3, $4, 'Station Branch', 'America/Hermosillo', true, now(), now())`,
        [tenantA, branchA, tenantB, branchB],
      );
      await admin.query(
        `insert into stations (tenant_id, station_id, display_name, status, created_at, updated_at)
         values ($1, $2, 'Station A', 'active', now(), now()), ($3, $4, 'Station B', 'active', now(), now())`,
        [tenantA, stationA, tenantB, stationB],
      );
      await admin.query(
        `insert into station_bindings (tenant_id, station_id, branch_id, created_at)
         values ($1, $2, $3, now()), ($4, $5, $6, now())`,
        [tenantA, stationA, branchA, tenantB, stationB, branchB],
      );
      await admin.query(
        `insert into station_credentials (
           credential_id, tenant_id, station_id, credential_hash, created_at
         ) values ('70000000-0000-4000-8000-000000000024', $1, $2, $3, now())`,
        [tenantA, stationA, credentialHash],
      );

      const stored = await admin.query(
        'select credential_hash from station_credentials where tenant_id = $1',
        [tenantA],
      );
      assert.deepEqual(stored.rows, [{ credential_hash: credentialHash }]);
      assert.notEqual(stored.rows[0].credential_hash, credential);

      const resolver = new ResolveTrustedStationContextUseCase(
        new KyselyStationCredentialVerifier(connection),
      );
      const context = await resolver.execute(credential);
      assert.deepEqual(
        {
          tenantId: context.tenantId,
          branchId: context.branchId,
          stationId: context.stationId,
          stationCredentialId: context.stationCredentialId,
        },
        {
          tenantId: tenantA,
          branchId: branchA,
          stationId: stationA,
          stationCredentialId: '70000000-0000-4000-8000-000000000024',
        },
      );

      await admin.query(
        'update station_credentials set revoked_at = now() where tenant_id = $1',
        [tenantA],
      );
      await assert.rejects(resolver.execute(credential), TrustedStationContextError);
      await admin.query(
        'update station_credentials set revoked_at = null where tenant_id = $1',
        [tenantA],
      );
      await admin.query(
        "update stations set status = 'revoked', revoked_at = now() where tenant_id = $1",
        [tenantA],
      );
      await assert.rejects(resolver.execute(credential), TrustedStationContextError);
      await admin.query(
        "update stations set status = 'active', revoked_at = null where tenant_id = $1",
        [tenantA],
      );
      await admin.query(
        'update station_bindings set revoked_at = now() where tenant_id = $1',
        [tenantA],
      );
      await assert.rejects(resolver.execute(credential), TrustedStationContextError);
      await admin.query(
        'update station_bindings set revoked_at = null where tenant_id = $1',
        [tenantA],
      );
      await admin.query(
        'update branches set active = false where tenant_id = $1 and branch_id = $2',
        [tenantA, branchA],
      );
      await assert.rejects(resolver.execute(credential), TrustedStationContextError);
      await admin.query(
        'update branches set active = true where tenant_id = $1 and branch_id = $2',
        [tenantA, branchA],
      );
      await admin.query(
        `insert into stations (tenant_id, station_id, display_name, status, created_at, updated_at)
         values ($1, $2, 'Cross Tenant Station', 'active', now(), now())`,
        [tenantA, stationCrossTenant],
      );
      await assert.rejects(
        admin.query(
          `insert into station_bindings (tenant_id, station_id, branch_id, created_at)
           values ($1, $2, $3, now())`,
          [tenantA, stationCrossTenant, branchB],
        ),
        (error) => error?.code === '23503',
      );

      let status = await runner.getMigrationStatus();
      while (status.migrations.some(({ state }) => state === 'applied')) {
        const latest = [...status.migrations]
          .reverse()
          .find(({ state }) => state === 'applied');
        assert.ok(latest);
        await runner.migrateDown(authorization(latest));
        status = await runner.getMigrationStatus();
      }
      await resetDatabase(admin);
      await assertNoObjects(admin);
    } finally {
      await runner.destroy().catch(() => undefined);
      await connection.close().catch(() => undefined);
      await resetDatabase(admin).catch(() => undefined);
      await assertNoObjects(admin);
      await admin.end();
    }
  },
);
