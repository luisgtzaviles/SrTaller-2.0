import { Pool } from 'pg';

import {
  cleanChildEnvironment,
  databaseEnvironment,
  ensureLocalEnvironment,
  localSeedRows,
} from './lib/local-development.mjs';
import { grantApplicationAccess, localDbUp } from './local-db.mjs';

const values = await ensureLocalEnvironment({ create: false });
await localDbUp();
await grantApplicationAccess(values);
const environment = databaseEnvironment(values, 'application');
const pool = new Pool({
  application_name: environment.SR_DB_APPLICATION_NAME,
  connectionTimeoutMillis: Number(environment.SR_DB_CONNECTION_TIMEOUT_MS),
  database: environment.SR_DB_NAME,
  host: environment.SR_DB_HOST,
  idleTimeoutMillis: Number(environment.SR_DB_IDLE_TIMEOUT_MS),
  max: Number(environment.SR_DB_POOL_MAX),
  password: environment.SR_DB_PASSWORD,
  port: Number(environment.SR_DB_PORT),
  query_timeout: Number(environment.SR_DB_QUERY_TIMEOUT_MS),
  ssl: false,
  statement_timeout: Number(environment.SR_DB_STATEMENT_TIMEOUT_MS),
  user: environment.SR_DB_USER,
});

const rows = localSeedRows();
const client = await pool.connect();
try {
  await client.query('BEGIN');
  await client.query(
    `INSERT INTO tenants (tenant_id, created_at) VALUES ($1::uuid, $2::timestamptz)
     ON CONFLICT (tenant_id) DO UPDATE SET created_at = EXCLUDED.created_at`,
    [rows.tenant.tenantId, rows.tenant.createdAt],
  );
  for (const branch of rows.branches) {
    await client.query(
      `INSERT INTO branches (tenant_id, branch_id, created_at) VALUES ($1::uuid, $2::uuid, $3::timestamptz)
       ON CONFLICT (tenant_id, branch_id) DO UPDATE SET created_at = EXCLUDED.created_at`,
      [branch.tenantId, branch.branchId, branch.createdAt],
    );
  }
  await client.query('COMMIT');
} catch (error) {
  await client.query('ROLLBACK').catch(() => undefined);
  throw error;
} finally {
  client.release();
  await pool.end();
}

process.stdout.write(`${JSON.stringify({
  event: 'local_synthetic_seed_complete',
  environment: 'local',
  dataClassification: 'synthetic-development-only',
  tenantCount: 1,
  branchCount: rows.branches.length,
  deterministic: true,
  applicationRole: environment.SR_DB_USER,
  forbiddenConnectionString: !Object.keys(cleanChildEnvironment()).includes('DATABASE_URL'),
})}\n`);
