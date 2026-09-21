import assert from 'node:assert/strict';
import { randomBytes, randomUUID } from 'node:crypto';
import test from 'node:test';

import { Pool } from 'pg';

const enabled = process.env.SR_TL02_PG_TEST === '1';
const { createDatabaseConnection } = enabled ? await import('../dist/infrastructure/database/database-connection.js') : {};
const { KyselyAdminAuthRepository } = enabled ? await import('../dist/modules/access/infrastructure/persistence/kysely-admin-auth.repository.js') : {};
const { KyselyAuthenticationUserReader } = enabled ? await import('../dist/modules/users/infrastructure/persistence/kysely-authentication-user.reader.js') : {};
const { NodeArgon2AdminPasswordHasher } = enabled ? await import('../dist/modules/access/infrastructure/security/node-argon2-admin-password-hasher.js') : {};
const { NodeAdminSessionToken } = enabled ? await import('../dist/modules/access/infrastructure/security/node-admin-session-token.js') : {};
const { AdminRecoveryFoundationUseCase, AdminSessionManagementUseCase, LoginAdminUseCase, ProvisionAdminIdentityUseCase, ResolveAdminSessionUseCase } = enabled ? await import('../dist/modules/access/application/use-cases/admin-session.use-cases.js') : {};

function databaseConfig() {
  return Object.freeze({
    identity: Object.freeze({ host: process.env.SR_TL02_PG_HOST, port: Number(process.env.SR_TL02_PG_PORT), database: process.env.SR_TL02_PG_NAME, user: process.env.SR_TL02_PG_USER, password: process.env.SR_TL02_PG_PASSWORD }),
    transport: Object.freeze({ sslMode: 'disable' }),
    pool: Object.freeze({ min: 0, max: 8, idleTimeoutMs: 1_000, connectionTimeoutMs: 2_000, statementTimeoutMs: 30_000, queryTimeoutMs: 30_000 }),
    runtime: Object.freeze({ environment: 'development', role: 'application', accessMode: 'read-write', migrationsEnabled: false, testRunId: null }),
    observability: Object.freeze({ applicationName: 'srtaller-tl02-admin-auth', labels: Object.freeze({ component: 'admin-auth', environment: 'development', role: 'application' }) }),
  });
}

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

test('TL-02 PostgreSQL executes concurrent sessions, rate limit, reauth, revocation and recovery without Operational Session crossover', { skip: !enabled, timeout: 120_000 }, async () => {
  const pool = new Pool({ host: process.env.SR_TL02_PG_HOST, port: Number(process.env.SR_TL02_PG_PORT), database: process.env.SR_TL02_PG_NAME, user: process.env.SR_TL02_PG_USER, password: process.env.SR_TL02_PG_PASSWORD, ssl: false });
  const connection = createDatabaseConnection(databaseConfig());
  const concurrentConnections = [];
  const tenantA = randomUUID(); const tenantB = randomUUID(); const userA = randomUUID(); const userB = randomUUID();
  const nowValue = new Date('2026-09-20T20:00:00.000Z'); let now = nowValue;
  const passwordA = `A-${randomBytes(24).toString('base64url')}`; const passwordB = `B-${randomBytes(24).toString('base64url')}`; const replacement = `R-${randomBytes(24).toString('base64url')}`;
  const hasher = new NodeArgon2AdminPasswordHasher(randomBytes(32).toString('base64url'));
  const tokens = new NodeAdminSessionToken();
  try {
    await pool.query(`insert into tenants (tenant_id, operating_currency, created_at) values ($1, 'MXN', $3), ($2, 'MXN', $3)`, [tenantA, tenantB, now]);
    await pool.query(`insert into users (tenant_id, user_id, display_name, status, version, admission_revision, created_at, updated_at) values ($1,$2,'Owner A','active',0,0,$5,$5),($3,$4,'Owner B','active',0,0,$5,$5)`, [tenantA, userA, tenantB, userB, now]);
    await connection.verify();
    const repository = new KyselyAdminAuthRepository(connection); const users = new KyselyAuthenticationUserReader(connection);
    const provision = new ProvisionAdminIdentityUseCase(repository, users, hasher, () => now, randomUUID);
    await provision.execute({ tenantId: tenantA, userId: userA, email: 'owner-a@example.test', password: passwordA });
    await provision.execute({ tenantId: tenantB, userId: userB, email: 'owner-b@example.test', password: passwordB });
    const login = new LoginAdminUseCase(repository, users, hasher, tokens, () => now, randomUUID);
    const resolve = new ResolveAdminSessionUseCase(repository, users, tokens, () => now);
    const management = new AdminSessionManagementUseCase(repository, hasher, () => now);
    const first = await login.execute({ email: 'owner-a@example.test', password: passwordA, correlationId: randomUUID() });
    const second = await login.execute({ email: 'owner-a@example.test', password: passwordA, correlationId: randomUUID() });
    const tenantBSession = await login.execute({ email: 'owner-b@example.test', password: passwordB, correlationId: randomUUID() });
    assert.notEqual(first.session.sessionId, second.session.sessionId);
    assert.equal(tenantBSession.session.tenantId, tenantB);
    assert.equal((await pool.query(`select count(*)::int as count from access_operational_sessions where user_id = any($1::uuid[])`, [[userA, userB]])).rows[0].count, 0);
    await management.logout(first.session, randomUUID());
    await assert.rejects(resolve.execute({ bearer: first.tokens.bearer, csrfCookie: first.tokens.csrf }));
    const current = await resolve.execute({ bearer: second.tokens.bearer, csrfCookie: second.tokens.csrf, touch: false });
    const reauthenticated = await management.reauthenticate(current, passwordA, randomUUID());
    assert.equal(reauthenticated.reauthenticatedAt, now.toISOString());
    await management.revokeAll({ ...current, ...reauthenticated, displayName: current.displayName, status: 'active' }, randomUUID());
    await assert.rejects(resolve.execute({ bearer: second.tokens.bearer, csrfCookie: second.tokens.csrf }));

    const recovery = new AdminRecoveryFoundationUseCase(repository, users, hasher, tokens, () => now, randomUUID);
    const recoveryToken = await recovery.issue('owner-b@example.test'); assert.equal(typeof recoveryToken, 'string');
    await recovery.complete(recoveryToken, replacement, randomUUID());
    await assert.rejects(recovery.complete(recoveryToken, replacement, randomUUID()));
    await assert.rejects(login.execute({ email: 'owner-b@example.test', password: passwordB, correlationId: randomUUID() }));
    const recovered = await login.execute({ email: 'owner-b@example.test', password: replacement, correlationId: randomUUID() });
    now = new Date(nowValue.getTime() + 12 * 60 * 60_000);
    await assert.rejects(resolve.execute({ bearer: recovered.tokens.bearer, csrfCookie: recovered.tokens.csrf }));

    now = new Date('2026-09-20T21:00:00.000Z');
    for (let index = 0; index < 5; index += 1) concurrentConnections.push(createDatabaseConnection(databaseConfig()));
    await Promise.all(concurrentConnections.map((candidate) => candidate.verify()));
    const concurrentLogins = concurrentConnections.map((candidate) => new LoginAdminUseCase(new KyselyAdminAuthRepository(candidate), new KyselyAuthenticationUserReader(candidate), hasher, tokens, () => now, randomUUID));
    const failures = await Promise.allSettled(concurrentLogins.map((candidate) => candidate.execute({ email: 'owner-a@example.test', password: 'wrong but structurally valid', correlationId: randomUUID() })));
    assert.equal(failures.every(({ status }) => status === 'rejected'), true);
    assert.deepEqual(failures.map((result) => result.status === 'rejected' ? { name: result.reason.name, code: result.reason.code, message: result.reason.message } : { name: 'fulfilled' }), Array(5).fill({ name: 'AdminAuthenticationError', code: 'ADMIN_AUTHENTICATION_DENIED', message: 'Administrative authentication was not accepted.' }));
    const limit = await pool.query(`select attempt_count, blocked_until from access_admin_auth_attempt_limits where principal_digest=$1`, [Buffer.from(hasher.principalDigest('owner-a@example.test'))]);
    assert.equal(limit.rows[0].attempt_count, 5); assert.ok(limit.rows[0].blocked_until);
    const events = await pool.query(`select event_type, reason_code from access_admin_security_events where tenant_id = any($1::uuid[]) order by occurred_at`, [[tenantA, tenantB]]);
    assert.equal(events.rows.some(({ event_type }) => event_type === 'ADMIN_LOGIN_SUCCEEDED'), true);
    assert.equal(events.rows.some(({ event_type }) => event_type === 'ADMIN_REAUTHENTICATED'), true);
    assert.equal(events.rows.some(({ event_type }) => event_type === 'ADMIN_RECOVERY_COMPLETED'), true);
    assert.equal(JSON.stringify(events.rows).includes(passwordA), false);
    assert.equal(JSON.stringify(events.rows).includes('owner-a@example.test'), false);
  } finally { await Promise.all(concurrentConnections.map((candidate) => candidate.close())); await connection.close(); await pool.end(); }
});
