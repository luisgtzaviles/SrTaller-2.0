import assert from 'node:assert/strict';
import { createHash, randomBytes, randomUUID } from 'node:crypto';
import test from 'node:test';

import { Pool } from 'pg';

const enabled = process.env.SR_TL06_PG_TEST === '1';
const modules = enabled ? await Promise.all([
  import('../dist/infrastructure/database/database-connection.js'),
  import('../dist/infrastructure/email/email-delivery.js'),
  import('../dist/modules/access/application/use-cases/admin-invitation.use-cases.js'),
  import('../dist/modules/access/application/use-cases/revoke-role-assignment.use-case.js'),
  import('../dist/modules/access/infrastructure/persistence/kysely-access.repository.js'),
  import('../dist/modules/access/infrastructure/persistence/kysely-admin-invitation.repository.js'),
  import('../dist/modules/access/infrastructure/persistence/kysely-administration-authorization-commit.guard.js'),
]) : [];

function config(label) {
  return Object.freeze({
    identity: Object.freeze({ host: process.env.SR_TL06_PG_HOST, port: Number(process.env.SR_TL06_PG_PORT), database: process.env.SR_TL06_PG_NAME, user: process.env.SR_TL06_PG_USER, password: process.env.SR_TL06_PG_PASSWORD }),
    transport: Object.freeze({ sslMode: 'disable' }),
    pool: Object.freeze({ min: 0, max: 12, idleTimeoutMs: 1_000, connectionTimeoutMs: 2_000, statementTimeoutMs: 30_000, queryTimeoutMs: 30_000 }),
    runtime: Object.freeze({ environment: 'development', role: 'application', accessMode: 'read-write', migrationsEnabled: false, testRunId: null }),
    observability: Object.freeze({ applicationName: `srtaller-tl06-${label}`, labels: Object.freeze({ component: 'admin-users-roles', environment: 'development', role: 'application' }) }),
  });
}

function pool() {
  return new Pool({ host: process.env.SR_TL06_PG_HOST, port: Number(process.env.SR_TL06_PG_PORT), database: process.env.SR_TL06_PG_NAME, user: process.env.SR_TL06_PG_USER, password: process.env.SR_TL06_PG_PASSWORD, ssl: false });
}

async function seedTenant(database, { admins = 1 } = {}) {
  const tenantId = randomUUID(); const roleId = randomUUID(); const branchId = randomUUID(); const at = new Date('2026-09-21T20:00:00.000Z'); const users = [];
  await database.query("insert into tenants(tenant_id,display_name,lifecycle_status,operating_currency,version,created_at,updated_at) values($1,'Tenant TL06','ACTIVE','MXN',0,$2,$2)", [tenantId, at]);
  await database.query("insert into branches(tenant_id,branch_id,display_name,time_zone,active,version,created_at,updated_at) values($1,$2,'Sucursal TL06','America/Hermosillo',true,0,$3,$3)", [tenantId, branchId, at]);
  await database.query("insert into access_roles(tenant_id,role_id,role_key,display_name,description,status,version,management_mode,policy_version,created_at,updated_at) values($1,$2,'tenant_admin','Administrador del tenant',null,'active',0,'SYSTEM_MANAGED',1,$3,$3)", [tenantId, roleId, at]);
  for (const capability of ['users.read', 'users.manage', 'access_matrix.read', 'access_matrix.manage']) await database.query('insert into access_role_capabilities(tenant_id,role_id,capability_code,created_at) values($1,$2,$3,$4)', [tenantId, roleId, capability, at]);
  for (let index = 0; index < admins; index += 1) {
    const userId = randomUUID(); const identityId = randomUUID(); const assignmentId = randomUUID();
    await database.query("insert into users(tenant_id,user_id,display_name,operational_identifier,status,version,admission_revision,created_at,updated_at) values($1,$2,$3,null,'active',0,0,$4,$4)", [tenantId, userId, `Admin ${index + 1}`, at]);
    await database.query("insert into access_admin_identities(tenant_id,admin_identity_id,user_id,normalized_email,email_display,verified_at,status,identity_version,created_at,updated_at) values($1,$2,$3,$4,$4,$5,'active',0,$5,$5)", [tenantId, identityId, userId, `admin-${userId}@example.test`, at]);
    await database.query("insert into access_admin_password_credentials(tenant_id,admin_identity_id,user_id,status,algorithm,profile_version,pepper_version,memory_kib,passes,parallelism,salt,verifier,credential_version,session_revision,created_at,updated_at,revoked_at) values($1,$2,$3,'active','argon2id',1,1,65536,3,4,$4,$5,1,1,$6,$6,null)", [tenantId, identityId, userId, randomBytes(16), randomBytes(32), at]);
    await database.query("insert into access_role_assignments(tenant_id,assignment_id,user_id,role_id,assignment_scope,branch_id,status,version,assigned_at,revoked_at) values($1,$2,$3,$4,'TENANT_WIDE',null,'active',0,$5,null)", [tenantId, assignmentId, userId, roleId, at]);
    users.push({ userId, identityId, assignmentId });
  }
  return { tenantId, roleId, branchId, users, at };
}

function passwordHasher() {
  return Object.freeze({
    principalDigest() { return new Uint8Array(32); },
    async hash() { return Object.freeze({ algorithm: 'argon2id', profileVersion: 1, pepperVersion: 1, memoryKiB: 65_536, passes: 3, parallelism: 4, salt: randomBytes(16), verifier: randomBytes(32) }); },
    async verify() { return false; },
  });
}

function token(value) { return Object.freeze({ token: value.repeat(43), digest: createHash('sha256').update(value.repeat(43)).digest() }); }

test('TL-06 PostgreSQL executes invitation replay, supersession, acceptance and secret-safe audit', { skip: !enabled, timeout: 60_000 }, async () => {
  const [{ createDatabaseConnection }, { LocalEmailDelivery }, { AdminInvitationService }, , , { KyselyAdminInvitationRepository }] = modules;
  const database = pool(); const connection = createDatabaseConnection(config('invitation')); const seeded = await seedTenant(database); let now = new Date('2026-09-21T21:00:00.000Z'); const ids = Array.from({ length: 20 }, () => randomUUID()); let idIndex = 0; const tokens = [token('a'), token('b'), token('c'), token('d')]; let tokenIndex = 0;
  try {
    await connection.verify(); const repository = new KyselyAdminInvitationRepository(connection); const service = new AdminInvitationService(repository, passwordHasher(), new LocalEmailDelivery(), 'http://127.0.0.1:4173', () => now, () => ids[idIndex++], () => tokens[tokenIndex++]);
    const inviterAdminSessionId = randomUUID(); const requestId = randomUUID(); const input = { tenantId: seeded.tenantId, inviterUserId: seeded.users[0].userId, inviterAdminIdentityId: seeded.users[0].identityId, inviterAdminSessionId, targetUserId: null, proposedDisplayName: 'Invitada TL06', email: 'Invitada@Example.test', grants: [{ roleId: seeded.roleId, roleVersion: 0, assignmentScope: 'TENANT_WIDE', branchId: null }], clientRequestId: requestId, correlationId: randomUUID(), guard: { async confirmCurrent() { return true; } } };
    const issued = await service.issue(input); const replay = await service.issue(input);
    assert.equal(replay.invitationId, issued.invitationId);
    assert.equal(Number((await database.query('select count(*) from access_admin_invitation_dispatches where tenant_id=$1', [seeded.tenantId])).rows[0].count), 1);
    now = new Date('2026-09-21T21:05:00.000Z'); const resent = await service.resend({ tenantId: seeded.tenantId, invitationId: issued.invitationId, expectedVersion: 0, actorUserId: seeded.users[0].userId, actorAdminIdentityId: seeded.users[0].identityId, actorAdminSessionId: inviterAdminSessionId, clientRequestId: randomUUID(), correlationId: randomUUID(), guard: input.guard }); assert.equal(resent.version, 1);
    const challenges = await database.query('select status from access_admin_invitation_challenges where tenant_id=$1 order by created_at', [seeded.tenantId]); assert.deepEqual(challenges.rows.map(({ status }) => status), ['SUPERSEDED', 'ACTIVE']);
    await assert.rejects(service.accept({ token: tokens[0].token, password: 'Synthetic password 123!', clientRequestId: randomUUID(), correlationId: randomUUID() }), (error) => error?.code === 'ADMIN_INVITATION_UNAVAILABLE');
    now = new Date('2026-09-21T21:06:00.000Z'); const acceptRequest = randomUUID(); const accepted = await service.accept({ token: tokens[2].token, password: 'Synthetic password 123!', clientRequestId: acceptRequest, correlationId: randomUUID() }); assert.equal(accepted.status, 'ACCEPTED');
    const acceptedReplay = await service.accept({ token: tokens[2].token, password: 'Synthetic password 123!', clientRequestId: acceptRequest, correlationId: randomUUID() }); assert.equal(acceptedReplay.invitationId, accepted.invitationId);
    assert.equal(Number((await database.query('select count(*) from users where tenant_id=$1', [seeded.tenantId])).rows[0].count), 2);
    const auditRows = (await database.query('select event_type, actor_user_id, actor_admin_identity_id, session_id from access_admin_lifecycle_events where tenant_id=$1 order by occurred_at,event_type', [seeded.tenantId])).rows;
    assert.deepEqual(auditRows.map(({ event_type }) => event_type), ['INVITATION_ISSUED', 'INVITATION_RESENT', 'ADMIN_IDENTITY_ESTABLISHED', 'INVITATION_ACCEPTED']);
    for (const event of auditRows.filter(({ event_type }) => event_type === 'INVITATION_ISSUED' || event_type === 'INVITATION_RESENT')) assert.deepEqual(event, { event_type: event.event_type, actor_user_id: seeded.users[0].userId, actor_admin_identity_id: seeded.users[0].identityId, session_id: inviterAdminSessionId });
    const material = JSON.stringify(auditRows); assert.equal(material.includes('Synthetic password'), false); assert.equal(material.includes(tokens[2].token), false);
    await assert.rejects(database.query("update access_admin_lifecycle_events set reason_code='MUTATED' where tenant_id=$1", [seeded.tenantId]), (error) => error?.code === '23514');
  } finally { await connection.close(); await database.end(); }
});

test('TL-06 PostgreSQL fails closed across tenants, branches and stale issuer authority', { skip: !enabled, timeout: 60_000 }, async () => {
  const [{ createDatabaseConnection }, { LocalEmailDelivery }, { AdminInvitationService }, , , { KyselyAdminInvitationRepository }] = modules; const database = pool(); const connection = createDatabaseConnection(config('isolation')); const alpha = await seedTenant(database); const beta = await seedTenant(database); let tokenValue = token('e');
  try {
    await connection.verify(); const repository = new KyselyAdminInvitationRepository(connection); const service = new AdminInvitationService(repository, passwordHasher(), new LocalEmailDelivery(), 'http://127.0.0.1:4173', () => new Date('2026-09-21T22:00:00.000Z'), randomUUID, () => tokenValue); const guard = { async confirmCurrent() { return true; } };
    await assert.rejects(service.issue({ tenantId: alpha.tenantId, inviterUserId: alpha.users[0].userId, inviterAdminIdentityId: alpha.users[0].identityId, targetUserId: null, proposedDisplayName: 'Cross tenant', email: 'cross@example.test', grants: [{ roleId: beta.roleId, roleVersion: 0, assignmentScope: 'TENANT_WIDE', branchId: null }], clientRequestId: randomUUID(), correlationId: randomUUID(), guard }), (error) => error?.code === 'ADMIN_INVITATION_AUTHORITY_CHANGED');
    await assert.rejects(service.issue({ tenantId: alpha.tenantId, inviterUserId: alpha.users[0].userId, inviterAdminIdentityId: alpha.users[0].identityId, targetUserId: null, proposedDisplayName: 'Cross branch', email: 'branch@example.test', grants: [{ roleId: alpha.roleId, roleVersion: 0, assignmentScope: 'BRANCH_RESTRICTED', branchId: beta.branchId }], clientRequestId: randomUUID(), correlationId: randomUUID(), guard }), (error) => error?.code === 'ADMIN_INVITATION_AUTHORITY_CHANGED');
    tokenValue = token('g'); await service.issue({ tenantId: alpha.tenantId, inviterUserId: alpha.users[0].userId, inviterAdminIdentityId: alpha.users[0].identityId, targetUserId: null, proposedDisplayName: 'Global pending', email: 'global-pending@example.test', grants: [{ roleId: alpha.roleId, roleVersion: 0, assignmentScope: 'TENANT_WIDE', branchId: null }], clientRequestId: randomUUID(), correlationId: randomUUID(), guard });
    tokenValue = token('h'); await assert.rejects(service.issue({ tenantId: beta.tenantId, inviterUserId: beta.users[0].userId, inviterAdminIdentityId: beta.users[0].identityId, targetUserId: null, proposedDisplayName: 'Global duplicate', email: 'global-pending@example.test', grants: [{ roleId: beta.roleId, roleVersion: 0, assignmentScope: 'TENANT_WIDE', branchId: null }], clientRequestId: randomUUID(), correlationId: randomUUID(), guard }), (error) => error?.code === 'ADMIN_INVITATION_INVALID');
    tokenValue = token('f'); const issued = await service.issue({ tenantId: alpha.tenantId, inviterUserId: alpha.users[0].userId, inviterAdminIdentityId: alpha.users[0].identityId, targetUserId: null, proposedDisplayName: 'Stale issuer', email: 'stale@example.test', grants: [{ roleId: alpha.roleId, roleVersion: 0, assignmentScope: 'TENANT_WIDE', branchId: null }], clientRequestId: randomUUID(), correlationId: randomUUID(), guard });
    await database.query("update users set status='inactive' where tenant_id=$1 and user_id=$2", [alpha.tenantId, alpha.users[0].userId]);
    await database.query("update users set status='active' where tenant_id=$1 and user_id=$2", [alpha.tenantId, alpha.users[0].userId]);
    const revisions = await database.query('select i.authority_revision, u.admission_revision from access_admin_invitations i join users u on u.tenant_id=i.tenant_id and u.user_id=i.inviter_user_id where i.tenant_id=$1 and i.invitation_id=$2', [alpha.tenantId, issued.invitationId]); assert.deepEqual(revisions.rows[0], { authority_revision: 0, admission_revision: 2 });
    await assert.rejects(service.accept({ token: tokenValue.token, password: 'Synthetic password 123!', clientRequestId: randomUUID(), correlationId: randomUUID() }), (error) => error?.code === 'ADMIN_INVITATION_AUTHORITY_CHANGED');
    assert.equal((await repository.list(beta.tenantId)).some(({ invitationId }) => invitationId === issued.invitationId), false);
  } finally { await connection.close(); await database.end(); }
});

test('TL-06 serializes simultaneous Tenant Admin revocation and preserves one effective Admin', { skip: !enabled, timeout: 60_000 }, async () => {
  const [{ createDatabaseConnection }, , , { RevokeRoleAssignmentUseCase }, { createKyselyAccessRepository }, , { KyselyAdministrationAuthorizationCommitGuard }] = modules; const database = pool(); const seeded = await seedTenant(database, { admins: 2 }); const connections = [createDatabaseConnection(config('race-a')), createDatabaseConnection(config('race-b'))];
  try {
    await Promise.all(connections.map((connection) => connection.verify())); const invariant = new KyselyAdministrationAuthorizationCommitGuard();
    const services = connections.map((connection) => new RevokeRoleAssignmentUseCase(createKyselyAccessRepository(connection)));
    const mutationGuard = { async confirmCurrent() { return true; }, confirmContinuity: (transaction) => invariant.confirmEffectiveTenantAdmin(seeded.tenantId, transaction) };
    const settled = await Promise.allSettled(seeded.users.map((user, index) => services[index].execute({ tenantId: seeded.tenantId }, { assignmentId: user.assignmentId, expectedVersion: 0, clientRequestId: randomUUID() }, mutationGuard)));
    assert.equal(settled.filter(({ status }) => status === 'fulfilled').length, 1);
    assert.equal(settled.filter(({ status }) => status === 'rejected').length, 1);
    const effective = await database.query("select count(*)::int as count from access_role_assignments where tenant_id=$1 and role_id=$2 and status='active'", [seeded.tenantId, seeded.roleId]); assert.equal(effective.rows[0].count, 1);
  } finally { await Promise.all(connections.map((connection) => connection.close())); await database.end(); }
});
