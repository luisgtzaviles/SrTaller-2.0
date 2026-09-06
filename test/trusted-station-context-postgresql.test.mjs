import assert from 'node:assert/strict';
import test from 'node:test';
import { Pool } from 'pg';

const enabled = process.env.SR_STATION_PG_TEST === '1';

test('station runtime persistence enforces the tenant-bound binding', { skip: !enabled }, async () => {
  const { ensureLocalEnvironment, databaseEnvironment, localSeedRows } = await import('../scripts/lib/local-development.mjs');
  const values = await ensureLocalEnvironment({ create: false });
  const environment = databaseEnvironment(values, 'application');
  const rows = localSeedRows();
  const pool = new Pool({ host: environment.SR_DB_HOST, port: Number(environment.SR_DB_PORT), database: environment.SR_DB_NAME, user: environment.SR_DB_USER, password: environment.SR_DB_PASSWORD, ssl: false });
  const stationId = '40000000-0000-4000-8000-000000000001';
  const client = await pool.connect();
  try {
    const tables = await client.query("select tablename from pg_tables where schemaname = 'public' and tablename in ('stations','station_bindings','station_credentials')");
    assert.equal(tables.rows.length, 3);
    await client.query('begin');
    await client.query("insert into stations(tenant_id, station_id, status, created_at, updated_at, revoked_at) values ($1, $2, 'active', now(), now(), null)", [rows.tenant.tenantId, stationId]);
    await assert.rejects(client.query('insert into station_bindings(tenant_id, station_id, branch_id, created_at) values ($1, $2, $3, now())', [rows.tenant.tenantId, stationId, '50000000-0000-4000-8000-000000000001']));
    await client.query('rollback');
  } finally {
    client.release();
    await pool.end();
  }
});
