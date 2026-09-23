import assert from 'node:assert/strict';
import { createHash, randomBytes, randomUUID } from 'node:crypto';
import test from 'node:test';

import { Pool } from 'pg';

const enabled = process.env.SR_TL07_PG_TEST === '1';
const modules = enabled ? await Promise.all([
  import('../dist/infrastructure/database/database-connection.js'),
  import('../dist/infrastructure/database/database-persistence-capability.js'),
  import('../dist/modules/stations/infrastructure/persistence/kysely-station-administration.runtime.js'),
  import('../dist/modules/stations/infrastructure/persistence/kysely-station-credential.verifier.js'),
]) : [];

function config(label) { return Object.freeze({ identity: Object.freeze({ host: process.env.SR_TL07_PG_HOST, port: Number(process.env.SR_TL07_PG_PORT), database: process.env.SR_TL07_PG_NAME, user: process.env.SR_TL07_PG_USER, password: process.env.SR_TL07_PG_PASSWORD }), transport: Object.freeze({ sslMode: 'disable' }), pool: Object.freeze({ min: 0, max: 12, idleTimeoutMs: 1_000, connectionTimeoutMs: 2_000, statementTimeoutMs: 30_000, queryTimeoutMs: 30_000 }), runtime: Object.freeze({ environment: 'development', role: 'application', accessMode: 'read-write', migrationsEnabled: false, testRunId: null }), observability: Object.freeze({ applicationName: `srtaller-tl07-${label}`, labels: Object.freeze({ component: 'stations', environment: 'development', role: 'application' }) }) }); }

function pool() { return new Pool({ host: process.env.SR_TL07_PG_HOST, port: Number(process.env.SR_TL07_PG_PORT), database: process.env.SR_TL07_PG_NAME, user: process.env.SR_TL07_PG_USER, password: process.env.SR_TL07_PG_PASSWORD, max: 8 }); }

async function seedTenant(database, label) {
  const ids = { tenantId: randomUUID(), userId: randomUUID(), identityId: randomUUID(), sessionId: randomUUID(), branchA: randomUUID(), branchB: randomUUID(), stationId: randomUUID(), credentialId: randomUUID() };
  const now = new Date('2026-09-22T16:00:00.000Z');
  await database.query("insert into tenants(tenant_id,display_name,lifecycle_status,operating_currency,version,created_at,updated_at) values($1,$2,'ACTIVE','MXN',0,$3,$3)", [ids.tenantId, `Tenant ${label}`, now]);
  await database.query("insert into branches(tenant_id,branch_id,display_name,time_zone,active,version,created_at,updated_at) values($1,$2,$3,'America/Hermosillo',true,0,$5,$5),($1,$4,$6,'America/Cancun',true,0,$5,$5)", [ids.tenantId, ids.branchA, `${label} Centro`, ids.branchB, now, `${label} Norte`]);
  await database.query("insert into users(tenant_id,user_id,display_name,operational_identifier,status,version,created_at,updated_at) values($1,$2,$3,$4,'active',0,$5,$5)", [ids.tenantId, ids.userId, `Admin ${label}`, `ADMIN-${label}`, now]);
  await database.query("insert into stations(tenant_id,station_id,display_name,status,version,created_at,updated_at,revoked_at) values($1,$2,$3,'active',0,$4,$4,null)", [ids.tenantId, ids.stationId, `${label} Caja 1`, now]);
  await database.query('insert into station_bindings(tenant_id,station_id,branch_id,revoked_at,created_at) values($1,$2,$3,null,$4)', [ids.tenantId, ids.stationId, ids.branchA, now]);
  const secret = randomBytes(32).toString('base64url');
  await database.query('insert into station_credentials(credential_id,credential_hash,tenant_id,station_id,revoked_at,created_at) values($1,$2,$3,$4,null,$5)', [ids.credentialId, createHash('sha256').update(secret).digest('hex'), ids.tenantId, ids.stationId, now]);
  return { ...ids, now, secret };
}

function context(tenant, capability = 'stations.manage', branches = null, invalidation = async () => 0) {
  return Object.freeze({ tenantId: tenant.tenantId, sessionId: tenant.sessionId, userId: tenant.userId, adminIdentityId: tenant.identityId, userDisplayName: `Admin ${tenant.tenantId}`, capability, authorizedBranchIds: branches, authorityDigest: randomBytes(32), commitGuard: Object.freeze({ confirmCurrent: async (_transaction, exactBranches) => branches === null || (exactBranches ?? []).every((branch) => branches.includes(branch)) }), invalidateOperationalSessions: invalidation });
}

test('TL-07 inventory is tenant-scoped, preserves safe state and never exposes trust secrets', { skip: !enabled }, async () => {
  const [{ createDatabaseConnection }, , { KyselyStationAdministrationRuntime }] = modules; const connection = createDatabaseConnection(config('inventory')); const database = pool();
  try {
    const alpha = await seedTenant(database, 'Alpha'); const beta = await seedTenant(database, 'Beta'); await connection.verify(); const runtime = new KyselyStationAdministrationRuntime(connection, () => alpha.now);
    const list = await runtime.list(context(alpha)); assert.equal(list.length, 1); assert.equal(list[0].displayName, 'Alpha Caja 1'); assert.equal(list[0].branchId, alpha.branchA); assert.equal(list[0].credentialState, 'CURRENT'); assert.equal(JSON.stringify(list).includes(alpha.secret), false); assert.equal(JSON.stringify(list).includes(createHash('sha256').update(alpha.secret).digest('hex')), false);
    const renamed = await runtime.rename(context(alpha), alpha.stationId, { clientRequestId: randomUUID(), expectedVersion: 0, displayName: 'Alpha Recepción' }); assert.equal(renamed.displayName, 'Alpha Recepción'); assert.equal(renamed.version, 1);
    await assert.rejects(runtime.read(context(alpha), beta.stationId), (error) => error?.code === 'STATION_NOT_FOUND');
    assert.equal((await runtime.list(context(alpha, 'stations.read', [alpha.branchA]))).length, 1); assert.equal((await runtime.list(context(alpha, 'stations.read', [alpha.branchB]))).length, 0);
    const detail = await runtime.read(context(alpha), alpha.stationId); assert.equal(detail.bindingHistory.length, 1); assert.equal(detail.bindingHistory[0].branchId, alpha.branchA);
  } finally { await connection.close(); await database.end(); }
});

test('TL-07 enrollment is strong, digest-only, immutable, expiring, cancelable and replay-safe', { skip: !enabled }, async () => {
  const [{ createDatabaseConnection }, , { KyselyStationAdministrationRuntime }] = modules; const connection = createDatabaseConnection(config('enrollment')); const database = pool();
  try {
    const alpha = await seedTenant(database, 'Enrollment Alpha'); const beta = await seedTenant(database, 'Enrollment Beta'); await connection.verify(); let current = new Date('2026-09-22T17:00:00.000Z'); const runtime = new KyselyStationAdministrationRuntime(connection, () => current); const actor = context(alpha, 'stations.enrollment.issue');
    const request = { clientRequestId: randomUUID(), branchId: alpha.branchB, displayName: 'Tablet Recepción' }; const issued = await runtime.issueEnrollment(actor, request); assert.match(issued.manualCode, /^(?:[0-9A-HJKMNP-TV-Z]{4}-){12}[0-9A-HJKMNP-TV-Z]{4}$/u); assert.equal(issued.qrPayload, `srtaller-enroll:${issued.manualCode.replaceAll('-', '')}`); assert.equal(new Date(issued.enrollment.expiresAt).getTime() - new Date(issued.enrollment.createdAt).getTime(), 600_000);
    const row = (await database.query('select target_branch_id,intended_display_name,token_digest::text token,status from station_enrollment_challenges where tenant_id=$1 and challenge_id=$2', [alpha.tenantId, issued.enrollment.challengeId])).rows[0]; assert.equal(row.target_branch_id, alpha.branchB); assert.equal(row.intended_display_name, 'Tablet Recepción'); assert.equal(row.status, 'ACTIVE'); assert.equal(String(row.token).includes(issued.manualCode.replaceAll('-', '')), false);
    const replay = await runtime.issueEnrollment(actor, request); assert.equal(replay.enrollment.challengeId, issued.enrollment.challengeId); assert.equal(replay.manualCode, null); assert.equal(replay.qrPayload, null);
    await assert.rejects(runtime.issueEnrollment(context(alpha), { clientRequestId: randomUUID(), branchId: beta.branchA, displayName: 'Intrusión' }), (error) => error?.code === 'STATION_ACCESS_DENIED');
    const canceled = await runtime.cancelEnrollment(context(alpha, 'stations.enrollment.cancel'), issued.enrollment.challengeId, { clientRequestId: randomUUID(), expectedVersion: issued.enrollment.version }); assert.equal(canceled.status, 'CANCELED');
    const expiring = await runtime.issueEnrollment(actor, { clientRequestId: randomUUID(), branchId: alpha.branchA, displayName: 'Caja temporal' }); current = new Date('2026-09-22T17:10:00.001Z'); assert.equal((await runtime.listEnrollments(actor)).find(({ challengeId }) => challengeId === expiring.enrollment.challengeId).status, 'EXPIRED'); await assert.rejects(runtime.cancelEnrollment(context(alpha, 'stations.enrollment.cancel'), expiring.enrollment.challengeId, { clientRequestId: randomUUID(), expectedVersion: 0 }), (error) => error?.code === 'STATION_INVALID_TRANSITION');
  } finally { await connection.close(); await database.end(); }
});

test('TL-07 unlink/relink/revoke atomically cuts binding, credential and session trust', { skip: !enabled }, async () => {
  const [{ createDatabaseConnection }, { useTransactionalDatabasePersistenceExecutor }, { KyselyStationAdministrationRuntime }, { KyselyStationCredentialVerifier }] = modules; const connection = createDatabaseConnection(config('trust')); const database = pool();
  try {
    const alpha = await seedTenant(database, 'Trust Alpha'); await connection.verify(); const verifier = new KyselyStationCredentialVerifier(connection); const trusted = await verifier.verify(alpha.secret); assert.equal(trusted.stationId, alpha.stationId); let invalidations = 0;
    const invalidate = async (stationId, occurredAt, transactionContext) => useTransactionalDatabasePersistenceExecutor(transactionContext, 'access', async (db) => { invalidations += 1; const result = await db.updateTable('access_operational_sessions').set({ status: 'invalidated', ended_at: new Date(occurredAt) }).where('tenant_id', '=', alpha.tenantId).where('station_id', '=', stationId).where('status', '=', 'active').executeTakeFirst(); return Number(result.numUpdatedRows); });
    const runtime = new KyselyStationAdministrationRuntime(connection, () => new Date('2026-09-22T18:00:00.000Z')); const unlinkActor = context(alpha, 'stations.relink', [alpha.branchA], invalidate);
    const unlinked = await runtime.unlink(unlinkActor, alpha.stationId, { clientRequestId: randomUUID(), expectedVersion: 0 }); assert.equal(unlinked.status, 'UNLINKED'); assert.equal(unlinked.credentialState, 'REVOKED'); assert.equal(unlinked.branchId, null); assert.ok(unlinked.admissionRevision > 0); assert.equal(invalidations, 1); assert.equal(await verifier.verify(alpha.secret), null);
    const second = await seedTenant(database, 'Relink Alpha'); const relinkRuntime = new KyselyStationAdministrationRuntime(connection, () => new Date('2026-09-22T18:05:00.000Z')); const issued = await relinkRuntime.initiateRelink(context(second, 'stations.relink', [second.branchA, second.branchB], invalidate), second.stationId, { clientRequestId: randomUUID(), expectedVersion: 0, branchId: second.branchB, displayName: 'Relink Caja' }); assert.equal(issued.enrollment.kind, 'RELINK_STATION'); assert.equal(issued.enrollment.targetBranchId, second.branchB); assert.equal((await relinkRuntime.read(context(second), second.stationId)).status, 'UNLINKED'); assert.equal(await verifier.verify(second.secret), null);
    const third = await seedTenant(database, 'Revoke Alpha'); const revoked = await relinkRuntime.revoke(context(third, 'stations.revoke', [third.branchA], invalidate), third.stationId, { clientRequestId: randomUUID(), expectedVersion: 0 }); assert.equal(revoked.status, 'REVOKED'); await assert.rejects(relinkRuntime.initiateRelink(context(third, 'stations.relink', null, invalidate), third.stationId, { clientRequestId: randomUUID(), expectedVersion: revoked.version, branchId: third.branchB, displayName: 'No revive' }), (error) => error?.code === 'STATION_INVALID_TRANSITION');
    assert.equal(Number((await database.query("select count(*) from station_audit_events where event_type in ('STATION_UNLINKED','STATION_RELINK_INITIATED','STATION_REVOKED')")).rows[0].count), 3);
    assert.equal(Number((await database.query("select count(*) from station_audit_events where event_type = 'STATION_CREDENTIAL_REVOKED'")).rows[0].count), 3);
    assert.equal(Number((await database.query("select count(*) from station_audit_events where event_type = 'STATION_ADMISSION_REVISION_CHANGED'")).rows[0].count), 3);
  } finally { await connection.close(); await database.end(); }
});
