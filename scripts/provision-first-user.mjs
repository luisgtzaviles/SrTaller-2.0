import { randomUUID, timingSafeEqual } from 'node:crypto';
import { Pool } from 'pg';
import { databaseEnvironment, ensureLocalEnvironment } from './lib/local-development.mjs';

const [tenantId, displayName, clientRequestId] = process.argv.slice(2);
const uuid = /^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/iu;
if (!uuid.test(tenantId ?? '') || !displayName?.trim() || !uuid.test(clientRequestId ?? '')) throw new Error('Usage: provision-first-user <tenant-id> <display-name> <client-request-id>');
const values = await ensureLocalEnvironment({ create: false });
const expected = Buffer.from(values.SR_USER_BOOTSTRAP_SECRET, 'utf8');
const actual = Buffer.from(process.env.SR_USER_BOOTSTRAP_SECRET ?? '', 'utf8');
if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) throw new Error('First-user provisioning authority rejected.');
const environment = databaseEnvironment(values, 'application');
const pool = new Pool({ host: environment.SR_DB_HOST, port: Number(environment.SR_DB_PORT), database: environment.SR_DB_NAME, user: environment.SR_DB_USER, password: environment.SR_DB_PASSWORD, ssl: false });
try {
  const userId = randomUUID();
  const result = await pool.query('with existing_gate as (select first_user_id, client_request_id from user_provisioning_bootstraps where tenant_id = $1::uuid), existing as (select 1 from users where tenant_id = $1::uuid limit 1), gate as (insert into user_provisioning_bootstraps (tenant_id, first_user_id, client_request_id, provisioned_at) select $1::uuid, $2::uuid, $3::uuid, now() where not exists (select 1 from existing_gate) and not exists (select 1 from existing) on conflict (tenant_id) do nothing returning first_user_id), inserted as (insert into users (user_id, tenant_id, display_name, operational_identifier, status, version, created_at, updated_at) select $2::uuid, $1::uuid, $4, null, \'active\', 0, now(), now() from gate returning user_id), replay as (select users.user_id from existing_gate join users on users.tenant_id = $1::uuid and users.user_id = existing_gate.first_user_id where existing_gate.client_request_id = $3::uuid) select user_id from inserted union all select user_id from replay', [tenantId, userId, clientRequestId, displayName.trim()]);
  if (result.rowCount !== 1) throw new Error('FIRST_USER_ALREADY_PROVISIONED');
  process.stdout.write(`${JSON.stringify({ event: 'first_user_provisioned', tenantId, userId: result.rows[0].user_id })}\n`);
} finally { await pool.end(); }
