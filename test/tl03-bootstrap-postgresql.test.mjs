import assert from 'node:assert/strict';
import { randomBytes, randomUUID } from 'node:crypto';
import test from 'node:test';

import { Pool } from 'pg';

const enabled = process.env.SR_TL03_PG_TEST === '1';
const { createDatabaseConnection } = enabled ? await import('../dist/infrastructure/database/database-connection.js') : {};
const { BootstrapTenantUseCase } = enabled ? await import('../dist/modules/access/application/use-cases/bootstrap-tenant.use-case.js') : {};
const { KyselyTenantBootstrapTransaction, KyselyTenantBootstrapAccessWriter } = enabled ? await import('../dist/modules/access/infrastructure/persistence/kysely-tenant-bootstrap-access.writer.js') : {};
const { KyselyTenantBootstrapWriter } = enabled ? await import('../dist/modules/tenancy/infrastructure/persistence/kysely-tenant-bootstrap.writer.js') : {};
const { KyselyTenantBootstrapUserWriter } = enabled ? await import('../dist/modules/users/infrastructure/persistence/kysely-tenant-bootstrap-user.writer.js') : {};
const { NodeArgon2AdminPasswordHasher } = enabled ? await import('../dist/modules/access/infrastructure/security/node-argon2-admin-password-hasher.js') : {};
const { NodeAdminSessionToken } = enabled ? await import('../dist/modules/access/infrastructure/security/node-admin-session-token.js') : {};
const { KyselyAdminAuthRepository } = enabled ? await import('../dist/modules/access/infrastructure/persistence/kysely-admin-auth.repository.js') : {};
const { KyselyAuthenticationUserReader } = enabled ? await import('../dist/modules/users/infrastructure/persistence/kysely-authentication-user.reader.js') : {};
const { LoginAdminUseCase } = enabled ? await import('../dist/modules/access/application/use-cases/admin-session.use-cases.js') : {};

function config() {
  return Object.freeze({
    identity: Object.freeze({ host: process.env.SR_TL03_PG_HOST, port: Number(process.env.SR_TL03_PG_PORT), database: process.env.SR_TL03_PG_NAME, user: process.env.SR_TL03_PG_USER, password: process.env.SR_TL03_PG_PASSWORD }),
    transport: Object.freeze({ sslMode: 'disable' }),
    pool: Object.freeze({ min: 0, max: 12, idleTimeoutMs: 1_000, connectionTimeoutMs: 2_000, statementTimeoutMs: 30_000, queryTimeoutMs: 30_000 }),
    runtime: Object.freeze({ environment: 'development', role: 'application', accessMode: 'read-write', migrationsEnabled: false, testRunId: null }),
    observability: Object.freeze({ applicationName: 'srtaller-tl03-bootstrap', labels: Object.freeze({ component: 'tenant-bootstrap', environment: 'development', role: 'application' }) }),
  });
}

function command(registrationId, correlationId = randomUUID()) { return { verifiedRegistrationId: registrationId, correlationId }; }
function source(value) { return { async loadVerifiedGrant(id) { return id === value.verifiedRegistrationId ? value : null; } }; }
function fixedIds(...values) { const copy = [...values]; return () => copy.shift() ?? randomUUID(); }

async function makeGrant(hasher, overrides = {}) {
  const tenantId = overrides.tenantId ?? randomUUID();
  const adminIdentityId = overrides.adminIdentityId ?? randomUUID();
  const password = overrides.password ?? `P-${randomBytes(24).toString('base64url')}`;
  const grant = Object.freeze({
    verifiedRegistrationId: overrides.verifiedRegistrationId ?? randomUUID(),
    registrationRevision: overrides.registrationRevision ?? 1,
    approvedInputDigest: overrides.approvedInputDigest ?? randomBytes(32),
    tenantId,
    firstUserId: overrides.firstUserId ?? randomUUID(),
    adminIdentityId,
    personDisplayName: overrides.personDisplayName ?? 'Owner Sintético',
    workshopDisplayName: overrides.workshopDisplayName ?? 'Taller Duplicable',
    normalizedEmail: overrides.normalizedEmail ?? `owner-${randomUUID()}@example.test`,
    emailDisplay: overrides.emailDisplay ?? overrides.normalizedEmail ?? `owner-${randomUUID()}@example.test`,
    verifiedAt: '2026-09-21T18:00:00.000Z',
    passwordVerifier: await hasher.hash({ tenantId, adminIdentityId, password }),
    termsAcceptanceEvidenceId: randomUUID(),
  });
  return Object.freeze({ grant, password });
}

function useCase(connection, grant, options = {}) {
  return new BootstrapTenantUseCase(
    source(grant),
    options.transactions ?? new KyselyTenantBootstrapTransaction(connection),
    new KyselyTenantBootstrapWriter(),
    new KyselyTenantBootstrapUserWriter(),
    new KyselyTenantBootstrapAccessWriter(),
    () => new Date('2026-09-21T18:01:00.000Z'),
    options.createId ?? fixedIds(randomUUID(), randomUUID(), randomUUID()),
    options.failures,
  );
}

async function counts(pool, tenantId) {
  const tables = ['tenants', 'users', 'access_admin_identities', 'access_admin_password_credentials', 'access_roles', 'access_role_capabilities', 'access_role_assignments', 'access_admin_security_events', 'tenant_bootstrap_commands'];
  const result = {};
  for (const table of tables) result[table] = Number((await pool.query(`select count(*) from ${table} where tenant_id=$1`, [tenantId])).rows[0].count);
  return result;
}

test('TL-03 rolls back every material failure stage without partial authority', { skip: !enabled, timeout: 120_000 }, async () => {
  const connection = createDatabaseConnection(config());
  const pool = new Pool({ host: process.env.SR_TL03_PG_HOST, port: Number(process.env.SR_TL03_PG_PORT), database: process.env.SR_TL03_PG_NAME, user: process.env.SR_TL03_PG_USER, password: process.env.SR_TL03_PG_PASSWORD, ssl: false });
  const hasher = new NodeArgon2AdminPasswordHasher(randomBytes(32).toString('base64url'));
  const stages = ['after-lock', 'after-tenant', 'after-user', 'after-identity', 'after-role', 'after-capabilities', 'after-assignment', 'after-audit', 'after-journal'];
  try {
    await connection.verify();
    for (const target of stages) {
      const email = `rollback-${target}@example.test`;
      const { grant } = await makeGrant(hasher, { normalizedEmail: email, emailDisplay: email });
      const candidate = useCase(connection, grant, { failures: { after(stage) { if (stage === target) throw new Error(`injected:${target}`); } } });
      await assert.rejects(candidate.execute(command(grant.verifiedRegistrationId)));
      assert.deepEqual(await counts(pool, grant.tenantId), Object.fromEntries(Object.keys(await counts(pool, grant.tenantId)).map((table) => [table, 0])));
      assert.equal(Number((await pool.query('select count(*) from tenant_bootstrap_guards where verified_registration_id=$1', [grant.verifiedRegistrationId])).rows[0].count), 0);
    }
  } finally { await connection.close(); await pool.end(); }
});

test('TL-03 serializes duplicate calls, replays ambiguous success and rejects conflicting reuse', { skip: !enabled, timeout: 120_000 }, async () => {
  const connections = [createDatabaseConnection(config()), createDatabaseConnection(config())];
  const pool = new Pool({ host: process.env.SR_TL03_PG_HOST, port: Number(process.env.SR_TL03_PG_PORT), database: process.env.SR_TL03_PG_NAME, user: process.env.SR_TL03_PG_USER, password: process.env.SR_TL03_PG_PASSWORD, ssl: false });
  const hasher = new NodeArgon2AdminPasswordHasher(randomBytes(32).toString('base64url'));
  const email = 'concurrent-owner@example.test';
  const { grant } = await makeGrant(hasher, { normalizedEmail: email, emailDisplay: email });
  try {
    await Promise.all(connections.map((connection) => connection.verify()));
    const results = await Promise.all(connections.map((connection) => useCase(connection, grant).execute(command(grant.verifiedRegistrationId))));
    assert.deepEqual(results[0], results[1]);
    assert.deepEqual(await counts(pool, grant.tenantId), { tenants: 1, users: 1, access_admin_identities: 1, access_admin_password_credentials: 1, access_roles: 1, access_role_capabilities: 15, access_role_assignments: 1, access_admin_security_events: 1, tenant_bootstrap_commands: 1 });
    const replay = await useCase(connections[0], grant).execute(command(grant.verifiedRegistrationId));
    assert.deepEqual(replay, results[0]);
    const conflict = Object.freeze({ ...grant, approvedInputDigest: randomBytes(32) });
    await assert.rejects(useCase(connections[0], conflict).execute(command(grant.verifiedRegistrationId)), (error) => error?.code === 'TENANT_BOOTSTRAP_IDEMPOTENCY_CONFLICT');
    assert.deepEqual(await counts(pool, grant.tenantId), { tenants: 1, users: 1, access_admin_identities: 1, access_admin_password_credentials: 1, access_roles: 1, access_role_capabilities: 15, access_role_assignments: 1, access_admin_security_events: 1, tenant_bootstrap_commands: 1 });

    const timeoutEmail = 'ambiguous-timeout@example.test';
    const { grant: timeoutGrant } = await makeGrant(hasher, { normalizedEmail: timeoutEmail, emailDisplay: timeoutEmail });
    const committedTransaction = new KyselyTenantBootstrapTransaction(connections[0]);
    let responseLost = true;
    const ambiguousTransport = {
      async execute(operation) {
        const result = await committedTransaction.execute(operation);
        if (responseLost) { responseLost = false; throw new Error('synthetic response loss after commit'); }
        return result;
      },
    };
    await assert.rejects(useCase(connections[0], timeoutGrant, { transactions: ambiguousTransport }).execute(command(timeoutGrant.verifiedRegistrationId)));
    const recovered = await useCase(connections[0], timeoutGrant).execute(command(timeoutGrant.verifiedRegistrationId));
    assert.equal(recovered.tenantId, timeoutGrant.tenantId);
    assert.equal((await counts(pool, timeoutGrant.tenantId)).tenant_bootstrap_commands, 1);
  } finally { await Promise.all(connections.map((connection) => connection.close())); await pool.end(); }
});

test('TL-03 permits duplicate workshop names, isolates tenants, logs no secrets and supports TL-02 login', { skip: !enabled, timeout: 120_000 }, async () => {
  const connections = [createDatabaseConnection(config()), createDatabaseConnection(config())];
  const pool = new Pool({ host: process.env.SR_TL03_PG_HOST, port: Number(process.env.SR_TL03_PG_PORT), database: process.env.SR_TL03_PG_NAME, user: process.env.SR_TL03_PG_USER, password: process.env.SR_TL03_PG_PASSWORD, ssl: false });
  const hasher = new NodeArgon2AdminPasswordHasher(randomBytes(32).toString('base64url'));
  const entries = await Promise.all(['alpha', 'beta'].map((label) => makeGrant(hasher, { normalizedEmail: `${label}@example.test`, emailDisplay: `${label}@example.test`, workshopDisplayName: 'Taller Repetido' })));
  const grants = entries.map(({ grant }) => grant);
  try {
    await Promise.all(connections.map((candidate) => candidate.verify()));
    const results = await Promise.all(grants.map((grant, index) => useCase(connections[index], grant).execute(command(grant.verifiedRegistrationId))));
    assert.notEqual(results[0].tenantId, results[1].tenantId);
    const tenants = await pool.query("select tenant_id, display_name, lifecycle_status, operating_currency from tenants where tenant_id=any($1::uuid[]) order by tenant_id", [results.map(({ tenantId }) => tenantId)]);
    assert.equal(tenants.rows.every((row) => row.display_name === 'Taller Repetido' && row.lifecycle_status === 'ONBOARDING' && row.operating_currency === 'MXN'), true);
    const roleRows = await pool.query('select tenant_id, role_key, management_mode, policy_version from access_roles where tenant_id=any($1::uuid[]) order by tenant_id', [results.map(({ tenantId }) => tenantId)]);
    assert.equal(roleRows.rows.every((row) => row.role_key === 'tenant_admin' && row.management_mode === 'SYSTEM_MANAGED' && row.policy_version === 1), true);
    const events = await pool.query('select event_type, reason_code, correlation_id from access_admin_security_events where tenant_id=any($1::uuid[])', [results.map(({ tenantId }) => tenantId)]);
    assert.equal(events.rows.every((row) => row.event_type === 'TENANT_BOOTSTRAP_COMPLETED'), true);
    const serialized = JSON.stringify(events.rows);
    assert.doesNotMatch(serialized, /password|verifier|salt|pepper|@example\.test/iu);
    const login = new LoginAdminUseCase(new KyselyAdminAuthRepository(connections[0]), new KyselyAuthenticationUserReader(connections[0]), hasher, new NodeAdminSessionToken(), () => new Date('2026-09-21T18:02:00.000Z'), randomUUID);
    const authenticated = await login.execute({ email: grants[0].normalizedEmail, password: entries[0].password, correlationId: randomUUID() });
    assert.equal(authenticated.session.tenantId, grants[0].tenantId);
    assert.equal(authenticated.session.userId, grants[0].firstUserId);
    const operational = await pool.query('select count(*) from access_operational_sessions where tenant_id=any($1::uuid[])', [results.map(({ tenantId }) => tenantId)]);
    assert.equal(Number(operational.rows[0].count), 0);

    const { grant: emailConflict } = await makeGrant(hasher, { normalizedEmail: grants[0].normalizedEmail, emailDisplay: grants[0].emailDisplay });
    await assert.rejects(useCase(connections[0], emailConflict).execute(command(emailConflict.verifiedRegistrationId)), (error) => error?.code === 'TENANT_BOOTSTRAP_PERSISTENCE_FAILED');
    assert.equal((await counts(pool, emailConflict.tenantId)).tenants, 0);
  } finally { await Promise.all(connections.map((candidate) => candidate.close())); await pool.end(); }
});
