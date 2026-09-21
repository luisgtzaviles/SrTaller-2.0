import assert from 'node:assert/strict';
import test from 'node:test';

import { Pool } from 'pg';

const enabled = process.env.SR_PBI039_PG_TEST === '1';
const { createDatabaseConnection } = enabled
  ? await import('../dist/infrastructure/database/database-connection.js')
  : {};
const { KyselyUserPreferencesRepository } = enabled
  ? await import('../dist/modules/users/infrastructure/persistence/kysely-user-preferences.repository.js')
  : {};

const tenantA = 'a1100000-0000-4000-8000-000000000039';
const tenantB = 'b1100000-0000-4000-8000-000000000039';
const sharedUserId = 'c1100000-0000-4000-8000-000000000039';
const otherUserId = 'd1100000-0000-4000-8000-000000000039';

function databaseConfig() {
  return Object.freeze({
    identity: Object.freeze({
      host: process.env.SR_PBI039_PG_HOST,
      port: Number(process.env.SR_PBI039_PG_PORT),
      database: process.env.SR_PBI039_PG_NAME,
      user: process.env.SR_PBI039_PG_USER,
      password: process.env.SR_PBI039_PG_PASSWORD,
    }),
    transport: Object.freeze({ sslMode: 'disable' }),
    pool: Object.freeze({ min: 0, max: 4, idleTimeoutMs: 1_000, connectionTimeoutMs: 2_000, statementTimeoutMs: 10_000, queryTimeoutMs: 10_000 }),
    runtime: Object.freeze({ environment: 'development', role: 'migration', accessMode: 'read-write', migrationsEnabled: true, testRunId: null }),
    observability: Object.freeze({
      applicationName: 'srtaller-user-preferences-postgresql-review',
      labels: Object.freeze({ component: 'users', environment: 'development', role: 'application' }),
    }),
  });
}

function adminPool() {
  return new Pool({
    host: process.env.SR_PBI039_PG_HOST,
    port: Number(process.env.SR_PBI039_PG_PORT),
    database: process.env.SR_PBI039_PG_NAME,
    user: process.env.SR_PBI039_PG_USER,
    password: process.env.SR_PBI039_PG_PASSWORD,
    application_name: 'srtaller-user-preferences-postgresql-fixture',
    max: 2,
  });
}

async function removeFixture(admin) {
  await admin.query('delete from user_preferences where tenant_id = any($1::uuid[])', [[tenantA, tenantB]]);
  await admin.query('delete from users where tenant_id = any($1::uuid[])', [[tenantA, tenantB]]);
  await admin.query('delete from tenants where tenant_id = any($1::uuid[])', [[tenantA, tenantB]]);
}

test('PostgreSQL persists personal mode by Tenant and User with restrictive lifecycle and last-write-wins', { skip: !enabled }, async () => {
  assert.equal(process.version, 'v24.18.0');
  const admin = adminPool();
  const connection = createDatabaseConnection(databaseConfig());
  const repository = new KyselyUserPreferencesRepository(connection);
  try {
    await removeFixture(admin);
    await admin.query("insert into tenants (tenant_id, display_name, lifecycle_status, operating_currency, version, created_at, updated_at) values ($1, 'Preferences Tenant A', 'ACTIVE', 'MXN', 0, now(), now()), ($2, 'Preferences Tenant B', 'ACTIVE', 'MXN', 0, now(), now())", [tenantA, tenantB]);
    await admin.query(`insert into users (tenant_id, user_id, display_name, status, version, created_at, updated_at)
      values ($1, $2, 'Shared A', 'active', 0, now(), now()),
             ($1, $3, 'Other A', 'active', 0, now(), now()),
             ($4, $2, 'Shared B', 'active', 0, now(), now())`,
    [tenantA, sharedUserId, otherUserId, tenantB]);

    assert.equal(await repository.read({ tenantId: tenantA, userId: sharedUserId }), null);
    await repository.upsert({ tenantId: tenantA, userId: sharedUserId }, { newRepairFormMode: 'classic' }, new Date('2026-09-09T22:00:00.000Z'));
    await repository.upsert({ tenantId: tenantA, userId: sharedUserId }, { newRepairFormMode: 'guided_v2', priceListShowReferenceCost: true }, new Date('2026-09-09T22:01:00.000Z'));
    await repository.upsert({ tenantId: tenantB, userId: sharedUserId }, { newRepairFormMode: 'classic' }, new Date('2026-09-09T22:02:00.000Z'));

    assert.deepEqual(await repository.read({ tenantId: tenantA, userId: sharedUserId }), {
      newRepairFormMode: 'guided_v2',
      priceListShowReferenceCost: true,
      updatedAt: '2026-09-09T22:01:00.000Z',
    });
    assert.deepEqual(await repository.read({ tenantId: tenantB, userId: sharedUserId }), {
      newRepairFormMode: 'classic',
      priceListShowReferenceCost: false,
      updatedAt: '2026-09-09T22:02:00.000Z',
    });
    assert.equal(await repository.read({ tenantId: tenantA, userId: otherUserId }), null);

    await assert.rejects(
      admin.query(`update user_preferences
        set new_repair_form_mode = 'wizard'
        where tenant_id = $1 and user_id = $2`, [tenantA, sharedUserId]),
      (error) => error?.code === '23514',
    );
    assert.equal(
      (await repository.read({ tenantId: tenantA, userId: sharedUserId })).newRepairFormMode,
      'guided_v2',
    );

    await assert.rejects(
      admin.query('delete from users where tenant_id = $1 and user_id = $2', [tenantA, sharedUserId]),
      (error) => error?.code === '23001' || error?.code === '23503',
    );
  } finally {
    await removeFixture(admin).catch(() => undefined);
    await connection.close().catch(() => undefined);
    await admin.end();
  }
});
