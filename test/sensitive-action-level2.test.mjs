import assert from 'node:assert/strict';
import test from 'node:test';

import { createPinAuthenticationProof, isPinAuthenticationProof } from '../dist/modules/access/domain/pin-credential.js';
import { SensitiveActionReauthenticationError } from '../dist/modules/access/index.js';
import { SensitiveActionLevel2ExecutorService } from '../dist/modules/access/presentation/sensitive-action-level2.executor.js';

const tenantId = 'a1410000-0000-4000-8000-000000000041';
const branchId = 'a2410000-0000-4000-8000-000000000041';
const stationId = 'a3410000-0000-4000-8000-000000000041';
const sessionId = 'a4410000-0000-4000-8000-000000000041';
const userId = 'a5410000-0000-4000-8000-000000000041';
const authenticatedAt = '2026-09-14T19:30:00.000Z';
const syntheticPin = '7392';
const evidence = Object.freeze({ cookieHeader: 'synthetic', origin: 'http://127.0.0.1:4173', host: '127.0.0.1:4173', forwardedProto: 'http', fetchSite: 'same-origin', contentType: 'application/json', csrfToken: 'synthetic' });

function proof(proofUserId = userId) {
  return createPinAuthenticationProof({
    context: { tenantId, branchId, stationId, stationCredentialId: 'a6410000-0000-4000-8000-000000000041', branchAdmissionRevision: 0, stationAdmissionRevision: 0, stationBindingAdmissionRevision: 0, stationCredentialAdmissionRevision: 0 },
    user: { userId: proofUserId, displayName: 'Owner QA', version: 0, admissionRevision: 0 },
    credentialVersion: 1,
    authenticatedAt,
  });
}

function fixture(authenticationProof) {
  let requirement;
  const context = Object.freeze({
    tenantId, branchId, stationId, sessionId, userId, userDisplayName: 'Owner QA',
    capability: 'catalog.items.bulk_retire',
    commitGuard: Object.freeze({ async confirmCurrent() { return true; }, async confirmTemporalCurrent() { return true; } }),
  });
  const tenantWide = Object.freeze({
    async execute(receivedEvidence, receivedRequirement, operation) {
      assert.equal(receivedEvidence, evidence);
      requirement = receivedRequirement;
      return operation(context);
    },
  });
  const runtime = Object.freeze({
    trustedStations: Object.freeze({ async resolve(cookieHeader) { assert.equal(cookieHeader, 'synthetic'); return Object.freeze({ tenantId, branchId, stationId }); } }),
    authenticatePinOnly: Object.freeze({ async execute(_station, input) { assert.deepEqual(input, { pin: syntheticPin }); return authenticationProof; } }),
  });
  return { executor: new SensitiveActionLevel2ExecutorService(tenantWide, runtime), get requirement() { return requirement; } };
}

test('ADR-013 level 2 composes explicit bulk-retire authority with same-actor one-shot PIN proof', async () => {
  const authenticationProof = proof();
  const state = fixture(authenticationProof);
  const result = await state.executor.execute(evidence, 'catalog.items.bulk-retire', { pin: syntheticPin }, async (context) => {
    assert.equal(context.userId, userId);
    assert.equal(context.sensitiveAction, 'catalog.items.bulk-retire');
    assert.equal(context.sensitivityLevel, 2);
    assert.equal(context.reauthenticatedAt, authenticatedAt);
    return 'executed';
  });
  assert.equal(result, 'executed');
  assert.deepEqual(state.requirement, { capability: 'catalog.items.bulk_retire', kind: 'state-change' });
  assert.equal(isPinAuthenticationProof(authenticationProof), false);
});

test('ADR-013 level 2 rejects a valid PIN proof belonging to a different user', async () => {
  const authenticationProof = proof('b5410000-0000-4000-8000-000000000041');
  const state = fixture(authenticationProof);
  await assert.rejects(
    state.executor.execute(evidence, 'catalog.items.bulk-retire', { pin: syntheticPin }, async () => 'must-not-run'),
    SensitiveActionReauthenticationError,
  );
  assert.equal(isPinAuthenticationProof(authenticationProof), false);
});
