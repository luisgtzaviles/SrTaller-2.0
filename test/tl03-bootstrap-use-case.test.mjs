import assert from 'node:assert/strict';
import test from 'node:test';

import { BootstrapTenantUseCase } from '../dist/modules/access/application/use-cases/bootstrap-tenant.use-case.js';
import { STARTER_TENANT_ADMIN_POLICY } from '../dist/modules/access/domain/tenant-admin-policy.js';

const ids = Object.freeze({
  registration: '20000000-0000-4000-8000-000000000001',
  tenant: '20000000-0000-4000-8000-000000000002',
  user: '20000000-0000-4000-8000-000000000003',
  identity: '20000000-0000-4000-8000-000000000004',
  terms: '20000000-0000-4000-8000-000000000005',
  correlation: '20000000-0000-4000-8000-000000000006',
  role: '20000000-0000-4000-8000-000000000007',
  assignment: '20000000-0000-4000-8000-000000000008',
  event: '20000000-0000-4000-8000-000000000009',
});

function grant(overrides = {}) {
  return Object.freeze({
    verifiedRegistrationId: ids.registration,
    registrationRevision: 1,
    approvedInputDigest: new Uint8Array(32).fill(3),
    tenantId: ids.tenant,
    firstUserId: ids.user,
    adminIdentityId: ids.identity,
    personDisplayName: 'Ana Administradora',
    workshopDisplayName: 'Taller Norte',
    normalizedEmail: 'ana@example.com',
    emailDisplay: 'ana@example.com',
    verifiedAt: '2026-09-21T18:00:00.000Z',
    passwordVerifier: Object.freeze({
      algorithm: 'argon2id', profileVersion: 1, pepperVersion: 1,
      memoryKiB: 19456, passes: 2, parallelism: 1,
      salt: new Uint8Array(16).fill(1), verifier: new Uint8Array(32).fill(2),
    }),
    termsAcceptanceEvidenceId: ids.terms,
    ...overrides,
  });
}

function harness(overrides = {}) {
  const writes = [];
  let journal = null;
  const tenancy = {
    async lockAndFind() { writes.push('lock'); return journal; },
    async createTenant(scope, input) { writes.push(['tenant', scope, input]); },
    async complete(_scope, value) { writes.push('journal'); journal = value; },
  };
  const users = {
    async createFirstUser(scope, input) { writes.push(['user', scope, input]); },
  };
  const access = {
    async createVerifiedAdminIdentity(scope, input) { writes.push(['identity', scope, input]); },
    async createStarterRole(scope, input) { writes.push(['role', scope, input]); },
    async grantStarterCapabilities(scope, input) { writes.push(['capabilities', scope, input]); },
    async assignStarterRole(scope, input) { writes.push(['assignment', scope, input]); },
    async recordCompletedEvent(scope, input) { writes.push(['audit', scope, input]); },
  };
  const transactions = { async execute(operation) { return operation(Object.freeze({ tx: true })); } };
  const idsToCreate = [ids.role, ids.assignment, ids.event];
  const useCase = new BootstrapTenantUseCase(
    { async loadVerifiedGrant() { return overrides.grant ?? grant(); } },
    transactions,
    tenancy,
    users,
    access,
    () => new Date('2026-09-21T18:01:00.000Z'),
    () => idsToCreate.shift(),
  );
  return { useCase, writes, getJournal: () => journal };
}

test('atomic orchestration writes every owner in policy order and returns ONBOARDING', async () => {
  const { useCase, writes, getJournal } = harness();
  const result = await useCase.execute({
    verifiedRegistrationId: ids.registration,
    correlationId: ids.correlation,
  });
  assert.deepEqual(writes.map((entry) => Array.isArray(entry) ? entry[0] : entry), [
    'lock', 'tenant', 'user', 'identity', 'role', 'capabilities',
    'assignment', 'audit', 'journal',
  ]);
  assert.equal(result.tenantStatus, 'ONBOARDING');
  assert.equal(result.starterRolePolicyVersion, STARTER_TENANT_ADMIN_POLICY.policyVersion);
  assert.equal(getJournal().tenantId, ids.tenant);
  const identity = writes.find((entry) => Array.isArray(entry) && entry[0] === 'identity')[2];
  assert.equal(identity.normalizedEmail, 'ana@example.com');
  const audit = writes.find((entry) => Array.isArray(entry) && entry[0] === 'audit')[2];
  assert.deepEqual(Object.keys(audit).sort(), [
    'adminIdentityId', 'correlationId', 'eventId', 'occurredAt', 'userId',
  ]);
  assert.equal(writes.some((entry) => String(entry).includes('session')), false);
});

test('successful replay returns the durable result without repeating writes', async () => {
  const { useCase, writes } = harness();
  const command = { verifiedRegistrationId: ids.registration, correlationId: ids.correlation };
  const first = await useCase.execute(command);
  const writeCount = writes.length;
  const second = await useCase.execute(command);
  assert.deepEqual(second, first);
  assert.equal(writes.length, writeCount + 1);
  assert.equal(writes.at(-1), 'lock');
});
