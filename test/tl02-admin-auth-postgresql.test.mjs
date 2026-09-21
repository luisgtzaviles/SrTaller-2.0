import assert from 'node:assert/strict';
import { randomBytes, randomUUID } from 'node:crypto';
import test from 'node:test';

import { Pool } from 'pg';

const enabled = process.env.SR_TL02_PG_TEST === '1';

test('TL-02 persistence enforces tenant identity, secret shape and append-only audit', { skip: !enabled }, async () => {
  const pool = new Pool({
    host: process.env.SR_TL02_PG_HOST,
    port: Number(process.env.SR_TL02_PG_PORT),
    database: process.env.SR_TL02_PG_NAME,
    user: process.env.SR_TL02_PG_USER,
    password: process.env.SR_TL02_PG_PASSWORD,
    ssl: false,
  });
  const tenantA = randomUUID(); const tenantB = randomUUID(); const userA = randomUUID();
  const identity = randomUUID(); const now = new Date('2026-09-20T18:00:00.000Z');
  try {
    await pool.query(`insert into tenants (tenant_id, operating_currency, created_at) values ($1, 'MXN', $3), ($2, 'MXN', $3)`, [tenantA, tenantB, now]);
    await pool.query(`insert into users (tenant_id, user_id, display_name, status, version, admission_revision, created_at, updated_at) values ($1, $2, 'Owner A', 'active', 0, 0, $3, $3)`, [tenantA, userA, now]);
    await pool.query(`insert into access_admin_identities (tenant_id, admin_identity_id, user_id, normalized_email, email_display, verified_at, status, identity_version, created_at, updated_at) values ($1,$2,$3,'owner@example.com','Owner@Example.com',$4,'active',0,$4,$4)`, [tenantA, identity, userA, now]);
    await assert.rejects(pool.query(`insert into access_admin_identities (tenant_id, admin_identity_id, user_id, normalized_email, email_display, verified_at, status, identity_version, created_at, updated_at) values ($1,$2,$3,'other@example.com','other@example.com',$4,'active',0,$4,$4)`, [tenantB, randomUUID(), userA, now]), (error) => error?.code === '23503');
    await pool.query(`insert into access_admin_password_credentials (tenant_id, admin_identity_id, user_id, status, algorithm, profile_version, pepper_version, memory_kib, passes, parallelism, salt, verifier, credential_version, session_revision, created_at, updated_at, revoked_at) values ($1,$2,$3,'active','argon2id',1,1,65536,3,4,$4,$5,1,1,$6,$6,null)`, [tenantA, identity, userA, randomBytes(16), randomBytes(32), now]);
    await assert.rejects(pool.query(`insert into access_admin_password_credentials (tenant_id, admin_identity_id, user_id, status, algorithm, profile_version, pepper_version, memory_kib, passes, parallelism, salt, verifier, credential_version, session_revision, created_at, updated_at, revoked_at) values ($1,$2,$3,'active','argon2id',1,1,65536,3,4,$4,$5,1,1,$6,$6,null)`, [tenantA, identity, userA, randomBytes(15), randomBytes(32), now]), (error) => error?.code === '23514');
    const eventId = randomUUID();
    await pool.query(`insert into access_admin_security_events (tenant_id,event_id,user_id,admin_identity_id,session_id,event_type,result,reason_code,correlation_id,occurred_at) values ($1,$2,$3,$4,null,'ADMIN_LOGIN_SUCCEEDED','SUCCEEDED','CREDENTIAL_ACCEPTED',$5,$6)`, [tenantA, eventId, userA, identity, randomUUID(), now]);
    await assert.rejects(pool.query(`update access_admin_security_events set reason_code='MUTATED' where tenant_id=$1 and event_id=$2`, [tenantA, eventId]), (error) => error?.code === '23514');
    const columns = await pool.query(`select table_name from information_schema.tables where table_schema='public' and table_name like 'access_admin_%' order by table_name`);
    assert.deepEqual(columns.rows.map(({ table_name }) => table_name), ['access_admin_auth_attempt_limits','access_admin_identities','access_admin_password_credentials','access_admin_recovery_challenges','access_admin_security_events','access_admin_sessions']);
  } finally { await pool.end(); }
});
