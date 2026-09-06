import assert from 'node:assert/strict';
import test from 'node:test';
import { Pool } from 'pg';

const enabled = process.env.SR_STATION_PG_TEST === '1';

test('station runtime persistence enforces the tenant-bound binding', { skip: !enabled }, async () => {
  const { ensureLocalEnvironment, databaseEnvironment, localSeedRows, localStationBootstrapCredential, localStationBootstrapCredentialHash, LOCAL_STATION_ID } = await import('../scripts/lib/local-development.mjs');
  const { parseDatabaseConfig } = await import('../dist/infrastructure/database/database-config.js');
  const { createDatabaseConnection } = await import('../dist/infrastructure/database/database-connection.js');
  const { KyselyStationCredentialVerifier } = await import('../dist/modules/stations/infrastructure/persistence/kysely-station-credential.verifier.js');
  const { ResolveTrustedStationContextUseCase, TrustedStationContextError } = await import('../dist/modules/stations/application/use-cases/resolve-trusted-station-context.js');
  const values = await ensureLocalEnvironment();
  const environment = databaseEnvironment(values, 'application');
  const rows = localSeedRows();
  const credentialValue = localStationBootstrapCredential(values);
  const connection = createDatabaseConnection(parseDatabaseConfig(environment));
  await connection.verify();
  const resolver = new ResolveTrustedStationContextUseCase(
    new KyselyStationCredentialVerifier(connection),
  );
  const pool = new Pool({ host: environment.SR_DB_HOST, port: Number(environment.SR_DB_PORT), database: environment.SR_DB_NAME, user: environment.SR_DB_USER, password: environment.SR_DB_PASSWORD, ssl: false });
  const stationId = '40000000-0000-4000-8000-000000000001';
  const client = await pool.connect();
  try {
    const tables = await client.query("select tablename from pg_tables where schemaname = 'public' and tablename in ('stations','station_bindings','station_credentials')");
    assert.equal(tables.rows.length, 3);
    const credential = await client.query('select credential_hash from station_credentials where tenant_id = $1', [rows.tenant.tenantId]);
    assert.ok(credential.rows.some((row) => row.credential_hash === localStationBootstrapCredentialHash(values)));
    assert.ok(credential.rows.every((row) => row.credential_hash !== credentialValue));
    const context = await resolver.execute(credentialValue);
    assert.deepEqual(
      { tenantId: context.tenantId, branchId: context.branchId, stationId: context.stationId },
      { tenantId: rows.tenant.tenantId, branchId: rows.branches[0].branchId, stationId: LOCAL_STATION_ID },
    );
    await client.query('update station_credentials set revoked_at = now() where tenant_id = $1 and station_id = $2', [rows.tenant.tenantId, LOCAL_STATION_ID]);
    await assert.rejects(resolver.execute(credentialValue), TrustedStationContextError);
    await client.query('update station_credentials set revoked_at = null where tenant_id = $1 and station_id = $2', [rows.tenant.tenantId, LOCAL_STATION_ID]);
    await client.query("update stations set status = 'revoked', revoked_at = now() where tenant_id = $1 and station_id = $2", [rows.tenant.tenantId, LOCAL_STATION_ID]);
    await assert.rejects(resolver.execute(credentialValue), TrustedStationContextError);
    await client.query("update stations set status = 'active', revoked_at = null where tenant_id = $1 and station_id = $2", [rows.tenant.tenantId, LOCAL_STATION_ID]);
    await client.query('update station_bindings set revoked_at = now() where tenant_id = $1 and station_id = $2', [rows.tenant.tenantId, LOCAL_STATION_ID]);
    await assert.rejects(resolver.execute(credentialValue), TrustedStationContextError);
    await client.query('update station_bindings set revoked_at = null where tenant_id = $1 and station_id = $2', [rows.tenant.tenantId, LOCAL_STATION_ID]);
    await client.query('update branches set active = false where tenant_id = $1 and branch_id = $2', [rows.tenant.tenantId, rows.branches[0].branchId]);
    await assert.rejects(resolver.execute(credentialValue), TrustedStationContextError);
    await client.query('update branches set active = true where tenant_id = $1 and branch_id = $2', [rows.tenant.tenantId, rows.branches[0].branchId]);
    await client.query('begin');
    await client.query("insert into stations(tenant_id, station_id, status, created_at, updated_at, revoked_at) values ($1, $2, 'active', now(), now(), null)", [rows.tenant.tenantId, stationId]);
    await assert.rejects(client.query('insert into station_bindings(tenant_id, station_id, branch_id, created_at) values ($1, $2, $3, now())', [rows.tenant.tenantId, stationId, '50000000-0000-4000-8000-000000000001']));
    await client.query('rollback');
  } finally {
    client.release();
    await pool.end();
    await connection.close();
  }
});
