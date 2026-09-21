import assert from 'node:assert/strict';
import { createHash, randomBytes, randomUUID } from 'node:crypto';
import test from 'node:test';

import { Pool } from 'pg';

const enabled = process.env.SR_TL04_PG_TEST === '1';
const modules = enabled ? await Promise.all([
  import('../dist/infrastructure/database/database-connection.js'),
  import('../dist/modules/registration/infrastructure/persistence/kysely-registration.repository.js'),
  import('../dist/modules/registration/infrastructure/delivery/local-registration-email.delivery.js'),
  import('../dist/modules/registration/application/use-cases/public-registration.use-cases.js'),
  import('../dist/modules/access/infrastructure/security/node-argon2-admin-password-hasher.js'),
  import('../dist/modules/access/infrastructure/persistence/kysely-tenant-bootstrap-access.writer.js'),
  import('../dist/modules/tenancy/infrastructure/persistence/kysely-tenant-bootstrap.writer.js'),
  import('../dist/modules/users/infrastructure/persistence/kysely-tenant-bootstrap-user.writer.js'),
  import('../dist/modules/access/application/use-cases/bootstrap-tenant.use-case.js'),
  import('../dist/modules/access/infrastructure/persistence/kysely-admin-auth.repository.js'),
  import('../dist/modules/users/infrastructure/persistence/kysely-authentication-user.reader.js'),
  import('../dist/modules/access/infrastructure/security/node-admin-session-token.js'),
  import('../dist/modules/access/application/use-cases/admin-session.use-cases.js'),
]) : [];

function config() { return Object.freeze({ identity: Object.freeze({ host: process.env.SR_TL04_PG_HOST, port: Number(process.env.SR_TL04_PG_PORT), database: process.env.SR_TL04_PG_NAME, user: process.env.SR_TL04_PG_USER, password: process.env.SR_TL04_PG_PASSWORD }), transport: Object.freeze({ sslMode: 'disable' }), pool: Object.freeze({ min: 0, max: 12, idleTimeoutMs: 1_000, connectionTimeoutMs: 2_000, statementTimeoutMs: 30_000, queryTimeoutMs: 30_000 }), runtime: Object.freeze({ environment: 'development', role: 'application', accessMode: 'read-write', migrationsEnabled: false, testRunId: null }), observability: Object.freeze({ applicationName: 'srtaller-tl04-registration', labels: Object.freeze({ component: 'registration', environment: 'development', role: 'application' }) }) }); }
const legalDocuments = Object.freeze([{ key: 'terms', version: 'test-v1', url: 'https://srtaller.com/legal/terms/test-v1' }, { key: 'privacy', version: 'test-v1', url: 'https://srtaller.com/legal/privacy/test-v1' }]);
function registrationInput(email) { return { personName: 'Owner Sintético', workshopName: 'Taller Repetido', email, password: `P-${randomBytes(24).toString('base64url')}`, acceptedDocuments: legalDocuments.map(({ key, version }) => ({ key, version })) }; }
function token(delivery) { return new URL(delivery.takeLatestForTest().verificationUrl).hash.slice('#token='.length); }

test('TL-04 PostgreSQL executes registration, challenge concurrency, TL-03 bootstrap and TL-02 login end to end', { skip: !enabled, timeout: 120_000 }, async () => {
  const [{ createDatabaseConnection }, { KyselyRegistrationRepository }, { LocalRegistrationEmailDelivery }, { PublicRegistrationService }, { NodeArgon2AdminPasswordHasher }, { KyselyTenantBootstrapTransaction, KyselyTenantBootstrapAccessWriter }, { KyselyTenantBootstrapWriter }, { KyselyTenantBootstrapUserWriter }, { BootstrapTenantUseCase }, { KyselyAdminAuthRepository }, { KyselyAuthenticationUserReader }, { NodeAdminSessionToken }, { LoginAdminUseCase }] = modules;
  const connections = [createDatabaseConnection(config()), createDatabaseConnection(config())];
  const pool = new Pool({ host: process.env.SR_TL04_PG_HOST, port: Number(process.env.SR_TL04_PG_PORT), database: process.env.SR_TL04_PG_NAME, user: process.env.SR_TL04_PG_USER, password: process.env.SR_TL04_PG_PASSWORD, ssl: false });
  const hasher = new NodeArgon2AdminPasswordHasher(randomBytes(32).toString('base64url'));
  const runtime = Object.freeze({ enabled: true, mode: 'local', sender: 'SR Taller <no-reply@srtaller.com>', publicBaseUrl: 'http://127.0.0.1:4173', legalDocuments, principalDigest(value) { return createHash('sha256').update(value).digest(); }, createResendAdapter() { throw new Error('not available'); } });
  const bootstrap = (connection) => ({ async execute(input) { const useCase = new BootstrapTenantUseCase({ loadVerifiedGrant: (id) => input.loadVerifiedGrant(id) }, new KyselyTenantBootstrapTransaction(connection), new KyselyTenantBootstrapWriter(), new KyselyTenantBootstrapUserWriter(), new KyselyTenantBootstrapAccessWriter()); const result = await useCase.execute({ verifiedRegistrationId: input.verifiedRegistrationId, correlationId: input.correlationId }); return { tenantStatus: result.tenantStatus, completedAt: result.completedAt }; } });
  const protector = { protect: (input) => hasher.hash(input) };
  const alphaDelivery = new LocalRegistrationEmailDelivery(); const betaDelivery = new LocalRegistrationEmailDelivery();
  const alphaService = new PublicRegistrationService(new KyselyRegistrationRepository(connections[0]), protector, bootstrap(connections[0]), alphaDelivery, runtime);
  const betaService = new PublicRegistrationService(new KyselyRegistrationRepository(connections[1]), protector, bootstrap(connections[1]), betaDelivery, runtime);
  const alpha = registrationInput('alpha@example.test'); const beta = registrationInput('beta@example.test');
  try {
    await Promise.all(connections.map((connection) => connection.verify()));
    assert.deepEqual(await alphaService.register(alpha, randomUUID(), '198.51.100.1'), { result: 'accepted' });
    assert.deepEqual(await betaService.register(beta, randomUUID(), '198.51.100.2'), { result: 'accepted' });
    const oldAlphaToken = token(alphaDelivery);
    assert.deepEqual(await alphaService.resend({ email: 'ALPHA@example.test' }, randomUUID(), '198.51.100.1'), { result: 'accepted', retryAfterSeconds: 60 });
    const newAlphaToken = token(alphaDelivery); assert.notEqual(oldAlphaToken, newAlphaToken);
    assert.deepEqual(await alphaService.verify({ token: oldAlphaToken }, randomUUID(), '198.51.100.1'), { result: 'invalid_or_expired' });
    const concurrentAlpha = await Promise.all([alphaService.verify({ token: newAlphaToken }, randomUUID(), '198.51.100.1'), new PublicRegistrationService(new KyselyRegistrationRepository(connections[1]), protector, bootstrap(connections[1]), alphaDelivery, runtime).verify({ token: newAlphaToken }, randomUUID(), '198.51.100.4')]);
    assert.equal(concurrentAlpha.every((result) => result.result === 'completed'), true);
    assert.deepEqual(await betaService.verify({ token: token(betaDelivery) }, randomUUID(), '198.51.100.2'), { result: 'completed', loginUrl: 'https://admin.srtaller.com/login' });
    assert.deepEqual(await alphaService.verify({ token: newAlphaToken }, randomUUID(), '198.51.100.3'), { result: 'completed', loginUrl: 'https://admin.srtaller.com/login' });
    const attempts = await pool.query('select normalized_email, status, password_verifier, password_salt from registration_attempts order by normalized_email');
    assert.equal(attempts.rows.length, 2); assert.equal(attempts.rows.every((row) => row.status === 'CONSUMED' && row.password_verifier === null && row.password_salt === null), true);
    const evidence = await pool.query('select document_key, document_version, tenant_id, user_id from registration_acceptance_documents order by tenant_id, document_key');
    assert.equal(evidence.rows.length, 4); assert.equal(evidence.rows.every((row) => row.tenant_id && row.user_id && row.document_version === 'test-v1'), true);
    const tenants = await pool.query("select tenant_id, display_name, lifecycle_status from tenants order by tenant_id");
    assert.equal(tenants.rows.length, 2); assert.equal(tenants.rows.every((row) => row.display_name === 'Taller Repetido' && row.lifecycle_status === 'ONBOARDING'), true);
    const credentials = await pool.query('select tenant_id, normalized_email from access_admin_identities order by normalized_email');
    assert.deepEqual(credentials.rows.map((row) => row.normalized_email), ['alpha@example.test', 'beta@example.test']); assert.notEqual(credentials.rows[0].tenant_id, credentials.rows[1].tenant_id);
    const login = new LoginAdminUseCase(new KyselyAdminAuthRepository(connections[0]), new KyselyAuthenticationUserReader(connections[0]), hasher, new NodeAdminSessionToken());
    const authenticated = await login.execute({ email: alpha.email, password: alpha.password, correlationId: randomUUID() }); assert.equal(authenticated.session.tenantId, credentials.rows[0].tenant_id);
    assert.equal(Number((await pool.query('select count(*) from access_operational_sessions')).rows[0].count), 0);
    const durable = JSON.stringify((await pool.query('select event_type, reason_code, correlation_id from registration_security_events')).rows); assert.doesNotMatch(durable, /password|token|pepper|alpha@example/iu);
  } finally { await Promise.all(connections.map((connection) => connection.close())); await pool.end(); }
});

test('TL-04 PostgreSQL rejects malformed durable lifecycle and preserves append-only legal/audit evidence', { skip: !enabled }, async () => {
  const pool = new Pool({ host: process.env.SR_TL04_PG_HOST, port: Number(process.env.SR_TL04_PG_PORT), database: process.env.SR_TL04_PG_NAME, user: process.env.SR_TL04_PG_USER, password: process.env.SR_TL04_PG_PASSWORD, ssl: false });
  try {
    await assert.rejects(pool.query("insert into registration_verification_challenges(challenge_id,registration_attempt_id,token_digest,status,failure_count,expires_at,version,created_at,updated_at) values($1,$2,$3,'ACTIVE',-1,now(),0,now(),now())", [randomUUID(), randomUUID(), randomBytes(32)]));
    const metadata = await pool.query("select table_name from information_schema.tables where table_schema='public' and table_name like 'registration_%' order by table_name");
    assert.deepEqual(metadata.rows.map((row) => row.table_name), ['registration_acceptance_documents', 'registration_attempts', 'registration_email_dispatches', 'registration_public_action_limits', 'registration_security_events', 'registration_verification_challenges']);
  } finally { await pool.end(); }
});
