import assert from 'node:assert/strict';
import { randomBytes, randomUUID } from 'node:crypto';
import test from 'node:test';

import { Pool } from 'pg';

const enabled = process.env.SR_TL05_PG_TEST === '1';
const modules = enabled ? await Promise.all([
  import('../dist/infrastructure/database/database-connection.js'),
  import('../dist/modules/stations/application/branch-administration.service.js'),
  import('../dist/modules/access/infrastructure/persistence/kysely-administration-authorization-commit.guard.js'),
]) : [];

function config(label) { return Object.freeze({ identity: Object.freeze({ host: process.env.SR_TL05_PG_HOST, port: Number(process.env.SR_TL05_PG_PORT), database: process.env.SR_TL05_PG_NAME, user: process.env.SR_TL05_PG_USER, password: process.env.SR_TL05_PG_PASSWORD }), transport: Object.freeze({ sslMode: 'disable' }), pool: Object.freeze({ min: 0, max: 12, idleTimeoutMs: 1_000, connectionTimeoutMs: 2_000, statementTimeoutMs: 30_000, queryTimeoutMs: 30_000 }), runtime: Object.freeze({ environment: 'development', role: 'application', accessMode: 'read-write', migrationsEnabled: false, testRunId: null }), observability: Object.freeze({ applicationName: `srtaller-tl05-${label}`, labels: Object.freeze({ component: 'branches', environment: 'development', role: 'application' }) }) }); }

async function seedTenant(pool, { withAdmin = true, lifecycle = 'ONBOARDING' } = {}) {
  const tenantId = randomUUID(); const userId = randomUUID(); const roleId = randomUUID(); const identityId = randomUUID(); const now = new Date('2026-09-21T20:00:00.000Z');
  await pool.query('insert into tenants(tenant_id,display_name,lifecycle_status,operating_currency,version,created_at,updated_at) values($1,$2,$3,$4,0,$5,$5)', [tenantId, 'Tenant TL-05', lifecycle, 'MXN', now]);
  if (withAdmin) {
    await pool.query("insert into users(tenant_id,user_id,display_name,operational_identifier,status,version,created_at,updated_at) values($1,$2,'Admin TL05',$3,'active',0,$4,$4)", [tenantId, userId, `ADMIN-${userId.slice(0, 8)}`, now]);
    await pool.query("insert into access_admin_identities(tenant_id,admin_identity_id,user_id,normalized_email,email_display,verified_at,status,identity_version,created_at,updated_at) values($1,$2,$3,$4,$4,$5,'active',0,$5,$5)", [tenantId, identityId, userId, `admin-${userId}@example.test`, now]);
    await pool.query("insert into access_admin_password_credentials(tenant_id,admin_identity_id,user_id,status,algorithm,profile_version,pepper_version,memory_kib,passes,parallelism,salt,verifier,credential_version,session_revision,created_at,updated_at,revoked_at) values($1,$2,$3,'active','argon2id',1,1,65536,3,4,$4,$5,1,1,$6,$6,null)", [tenantId, identityId, userId, randomBytes(16), randomBytes(32), now]);
    await pool.query("insert into access_roles(tenant_id,role_id,role_key,display_name,description,status,version,management_mode,policy_version,created_at,updated_at) values($1,$2,'tenant_admin','Administrador del tenant',null,'active',0,'SYSTEM_MANAGED',1,$3,$3)", [tenantId, roleId, now]);
    for (const capability of ['branches.read', 'branches.manage', 'branches.deactivate']) await pool.query('insert into access_role_capabilities(tenant_id,role_id,capability_code,created_at) values($1,$2,$3,$4)', [tenantId, roleId, capability, now]);
    await pool.query("insert into access_role_assignments(tenant_id,assignment_id,user_id,role_id,assignment_scope,branch_id,status,version,assigned_at,revoked_at) values($1,$2,$3,$4,'TENANT_WIDE',null,'active',0,$5,null)", [tenantId, randomUUID(), userId, roleId, now]);
  }
  return { tenantId, userId };
}

function context(guard, tenantId, userId, capability) { return Object.freeze({ tenantId, userId, userDisplayName: 'Admin TL05', sessionId: randomUUID(), capability, commitGuard: Object.freeze({ confirmCurrent: (tx) => guard.confirmCurrent({ tenantId, userId }, capability, tx), confirmEffectiveTenantAdmin: (tx) => guard.confirmEffectiveTenantAdmin(tenantId, tx) }) }); }
function createInput(displayName, timeZone = 'America/Hermosillo', id = randomUUID()) { return { clientRequestId: id, displayName, timeZone }; }

test('TL-05 creates duplicate-named Branches, activates Tenant and preserves idempotent snapshots', { skip: !enabled, timeout: 60_000 }, async () => {
  const [{ createDatabaseConnection }, { BranchAdministrationService }, { KyselyAdministrationAuthorizationCommitGuard }] = modules;
  const connection = createDatabaseConnection(config('create')); const pool = new Pool({ host: process.env.SR_TL05_PG_HOST, port: Number(process.env.SR_TL05_PG_PORT), database: process.env.SR_TL05_PG_NAME, user: process.env.SR_TL05_PG_USER, password: process.env.SR_TL05_PG_PASSWORD });
  try {
    const seeded = await seedTenant(pool); await connection.verify(); const guard = new KyselyAdministrationAuthorizationCommitGuard(); const service = new BranchAdministrationService(connection); const actor = context(guard, seeded.tenantId, seeded.userId, 'branches.manage');
    const request = createInput('Sucursal Centro'); const first = await service.create(actor, request); assert.equal(first.status, 'ACTIVE'); assert.equal(first.version, 0);
    const replay = await service.create(actor, request); assert.deepEqual(replay, first);
    const second = await service.create(actor, createInput('Sucursal Centro', 'America/Cancun')); assert.notEqual(second.branchId, first.branchId); assert.equal(second.displayName, first.displayName);
    assert.equal((await pool.query('select lifecycle_status from tenants where tenant_id=$1', [seeded.tenantId])).rows[0].lifecycle_status, 'ACTIVE');
    assert.equal(Number((await pool.query('select count(*) from tenant_lifecycle_events where tenant_id=$1', [seeded.tenantId])).rows[0].count), 1);
    const updated = await service.update(actor, first.branchId, { clientRequestId: randomUUID(), expectedVersion: 0, displayName: 'Sucursal Centro Norte', timeZone: 'America/Tijuana' }); assert.equal(updated.version, 1); assert.equal(updated.timeZone, 'America/Tijuana');
    await assert.rejects(service.update(actor, first.branchId, { clientRequestId: randomUUID(), expectedVersion: 0, displayName: 'Viejo', timeZone: 'America/Hermosillo' }), (error) => error?.code === 'BRANCH_VERSION_CONFLICT');
    await assert.rejects(service.create(actor, createInput('Zona inválida', '-07:00')), (error) => error?.code === 'BRANCH_INVALID_INPUT');
  } finally { await connection.close(); await pool.end(); }
});

test('TL-05 does not activate without effective Tenant Admin and isolates Tenant scope', { skip: !enabled }, async () => {
  const [{ createDatabaseConnection }, { BranchAdministrationService }] = modules; const connection = createDatabaseConnection(config('isolation')); const pool = new Pool({ host: process.env.SR_TL05_PG_HOST, port: Number(process.env.SR_TL05_PG_PORT), database: process.env.SR_TL05_PG_NAME, user: process.env.SR_TL05_PG_USER, password: process.env.SR_TL05_PG_PASSWORD });
  try {
    const alpha = await seedTenant(pool, { withAdmin: false }); const beta = await seedTenant(pool, { withAdmin: false }); await connection.verify(); const service = new BranchAdministrationService(connection); const allow = (tenantId) => ({ tenantId, userId: randomUUID(), userDisplayName: 'Synthetic', sessionId: randomUUID(), capability: 'branches.manage', commitGuard: { confirmCurrent: async () => true, confirmEffectiveTenantAdmin: async () => false } });
    const created = await service.create(allow(alpha.tenantId), createInput('Misma sucursal'));
    assert.equal((await pool.query('select lifecycle_status from tenants where tenant_id=$1', [alpha.tenantId])).rows[0].lifecycle_status, 'ONBOARDING');
    await assert.rejects(service.read(allow(beta.tenantId), created.branchId), (error) => error?.code === 'BRANCH_NOT_FOUND');
    assert.equal((await service.list(allow(beta.tenantId))).length, 0);
  } finally { await connection.close(); await pool.end(); }
});

test('TL-05 serializes simultaneous deactivation and preserves one active Branch', { skip: !enabled, timeout: 60_000 }, async () => {
  const [{ createDatabaseConnection }, { BranchAdministrationService }, { KyselyAdministrationAuthorizationCommitGuard }] = modules; const connections = [createDatabaseConnection(config('race-a')), createDatabaseConnection(config('race-b'))]; const pool = new Pool({ host: process.env.SR_TL05_PG_HOST, port: Number(process.env.SR_TL05_PG_PORT), database: process.env.SR_TL05_PG_NAME, user: process.env.SR_TL05_PG_USER, password: process.env.SR_TL05_PG_PASSWORD });
  try {
    const seeded = await seedTenant(pool); await Promise.all(connections.map((entry) => entry.verify())); const guard = new KyselyAdministrationAuthorizationCommitGuard(); const manage = context(guard, seeded.tenantId, seeded.userId, 'branches.manage'); const serviceA = new BranchAdministrationService(connections[0]); const serviceB = new BranchAdministrationService(connections[1]); const a = await serviceA.create(manage, createInput('A')); const b = await serviceA.create(manage, createInput('B'));
    const lifecycleA = context(guard, seeded.tenantId, seeded.userId, 'branches.deactivate'); const lifecycleB = context(guard, seeded.tenantId, seeded.userId, 'branches.deactivate');
    const settled = await Promise.allSettled([serviceA.deactivate(lifecycleA, a.branchId, { clientRequestId: randomUUID(), expectedVersion: a.version }), serviceB.deactivate(lifecycleB, b.branchId, { clientRequestId: randomUUID(), expectedVersion: b.version })]);
    assert.equal(settled.filter(({ status }) => status === 'fulfilled').length, 1); assert.equal(settled.filter((result) => result.status === 'rejected' && result.reason?.code === 'LAST_ACTIVE_BRANCH_REQUIRED').length, 1);
    assert.equal(Number((await pool.query('select count(*) from branches where tenant_id=$1 and active=true', [seeded.tenantId])).rows[0].count), 1);
    const inactive = (await serviceA.list(lifecycleA)).find((branch) => branch.status === 'INACTIVE'); const reactivated = await serviceA.reactivate(lifecycleA, inactive.branchId, { clientRequestId: randomUUID(), expectedVersion: inactive.version }); assert.equal(reactivated.status, 'ACTIVE');
  } finally { await Promise.all(connections.map((entry) => entry.close())); await pool.end(); }
});
