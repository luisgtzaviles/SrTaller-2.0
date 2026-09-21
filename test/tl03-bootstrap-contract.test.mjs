import assert from 'node:assert/strict';
import test from 'node:test';

import {
  TenantBootstrapError,
  parseTenantBootstrapCommand,
  tenantBootstrapResultFromJournal,
  validateVerifiedRegistrationBootstrapGrant,
} from '../dist/modules/access/domain/tenant-bootstrap.js';

const ids = Object.freeze({
  registration: '10000000-0000-4000-8000-000000000001',
  tenant: '10000000-0000-4000-8000-000000000002',
  user: '10000000-0000-4000-8000-000000000003',
  identity: '10000000-0000-4000-8000-000000000004',
  terms: '10000000-0000-4000-8000-000000000005',
  correlation: '10000000-0000-4000-8000-000000000006',
});

function grant() {
  return Object.freeze({
    verifiedRegistrationId: ids.registration,
    registrationRevision: 1,
    approvedInputDigest: new Uint8Array(32).fill(7),
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
  });
}

test('bootstrap command accepts only opaque registration and correlation IDs', () => {
  assert.deepEqual(parseTenantBootstrapCommand({
    verifiedRegistrationId: ids.registration,
    correlationId: ids.correlation,
  }), {
    verifiedRegistrationId: ids.registration,
    correlationId: ids.correlation,
  });
  for (const input of [
    { verifiedRegistrationId: ids.registration, correlationId: ids.correlation, tenantId: ids.tenant },
    { verifiedRegistrationId: ids.registration, correlationId: ids.correlation, capabilities: ['users.manage'] },
    { verifiedRegistrationId: 'not-a-uuid', correlationId: ids.correlation },
  ]) {
    assert.throws(() => parseTenantBootstrapCommand(input), (error) =>
      error instanceof TenantBootstrapError && error.code === 'TENANT_BOOTSTRAP_INPUT_INVALID');
  }
});

test('verified registration grant validates immutable server-owned authority', () => {
  const value = grant();
  assert.equal(validateVerifiedRegistrationBootstrapGrant(value, ids.registration), value);
  for (const invalid of [
    { ...value, tenantId: 'not-a-uuid' },
    { ...value, approvedInputDigest: new Uint8Array(31) },
    { ...value, normalizedEmail: 'other@example.com' },
    { ...value, passwordVerifier: { ...value.passwordVerifier, algorithm: 'plain' } },
  ]) {
    assert.throws(
      () => validateVerifiedRegistrationBootstrapGrant(invalid, ids.registration),
      (error) => error instanceof TenantBootstrapError && error.code === 'TENANT_BOOTSTRAP_GRANT_INVALID',
    );
  }
});

test('stable result and errors do not serialize credential material', () => {
  const result = tenantBootstrapResultFromJournal({
    ...grant(),
    starterRoleId: '10000000-0000-4000-8000-000000000007',
    starterPolicyVersion: 1,
    starterAssignmentId: '10000000-0000-4000-8000-000000000008',
    completedAt: '2026-09-21T18:01:00.000Z',
  });
  assert.equal(result.tenantStatus, 'ONBOARDING');
  const serialized = JSON.stringify(result);
  assert.doesNotMatch(serialized, /password|verifier|salt|pepper|email/iu);
  assert.deepEqual(new TenantBootstrapError('TENANT_BOOTSTRAP_GRANT_INVALID').toJSON(), {
    name: 'TenantBootstrapError',
    code: 'TENANT_BOOTSTRAP_GRANT_INVALID',
    retryable: 'never',
  });
});
