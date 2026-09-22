import assert from 'node:assert/strict';
import test from 'node:test';

import { AdminInvitationService } from '../dist/modules/access/application/use-cases/admin-invitation.use-cases.js';
import { LocalEmailDelivery } from '../dist/infrastructure/email/email-delivery.js';

const ids = [
  '11111111-1111-4111-8111-111111111111', '22222222-2222-4222-8222-222222222222',
  '33333333-3333-4333-8333-333333333333', '44444444-4444-4444-8444-444444444444',
  '55555555-5555-4555-8555-555555555555', '66666666-6666-4666-8666-666666666666',
  '77777777-7777-4777-8777-777777777777', '88888888-8888-4888-8888-888888888888',
];

function harness() {
  let index = 0; let invitation; let active; const deliveries = [];
  const repository = {
    async list() { return invitation ? [invitation] : []; },
    async issue(input, guard) {
      assert.equal(await guard.confirmCurrent({}), true);
      active = { tenantId: input.tenantId, invitationId: input.invitationId, challengeId: input.challengeId, normalizedEmail: input.normalizedEmail, targetUserId: input.targetUserId, proposedDisplayName: input.proposedDisplayName, status: 'ACTIVE', expiresAt: '2026-09-22T12:00:00.000Z' };
      invitation = { tenantId: input.tenantId, invitationId: input.invitationId, normalizedEmail: input.normalizedEmail, emailDisplay: input.emailDisplay, targetUserId: input.targetUserId, proposedDisplayName: input.proposedDisplayName, inviterUserId: input.inviterUserId, inviterAdminIdentityId: input.inviterAdminIdentityId, status: 'PENDING', version: 0, authorityRevision: input.authorityRevision, grants: input.grants, expiresAt: '2026-09-22T12:00:00.000Z', acceptedAt: null, revokedAt: null, createdAt: input.occurredAt, updatedAt: input.occurredAt };
      return invitation;
    },
    async resend(input) { active = { ...active, challengeId: input.challengeId }; invitation = { ...invitation, version: invitation.version + 1 }; return invitation; },
    async revoke() { invitation = { ...invitation, status: 'REVOKED' }; return invitation; },
    async findByChallengeDigest() { return active; },
    async accept(input) { invitation = { ...invitation, status: 'ACCEPTED', acceptedAt: input.occurredAt }; return invitation; },
    async recordDelivery(input) { deliveries.push(input); },
  };
  const passwords = { principalDigest() { return new Uint8Array(32); }, async hash(input) { assert.equal(input.password, 'Safe invitation pass 123!'); return { algorithm: 'argon2id', profileVersion: 1, pepperVersion: 1, memoryKiB: 65536, passes: 3, parallelism: 4, salt: new Uint8Array(16), verifier: new Uint8Array(32) }; }, async verify() { return false; } };
  const service = new AdminInvitationService(repository, passwords, new LocalEmailDelivery(), 'http://127.0.0.1:4173', () => new Date('2026-09-21T12:00:00.000Z'), () => ids[index++], () => ({ token: 'a'.repeat(43), digest: new Uint8Array(32) }));
  return { service, deliveries, get invitation() { return invitation; } };
}

test('TL-06 issue binds server-approved grants and durable delivery result', async () => {
  const h = harness();
  const result = await h.service.issue({ tenantId: ids[7], inviterUserId: ids[6], inviterAdminIdentityId: ids[5], targetUserId: null, proposedDisplayName: 'Invitada Demo', email: 'Invitada@Example.com', authorityRevision: 3, grants: [{ roleId: ids[4], roleVersion: 2, assignmentScope: 'TENANT_WIDE', branchId: null }], clientRequestId: ids[3], correlationId: ids[2], guard: { async confirmCurrent() { return true; } } });
  assert.equal(result.normalizedEmail, 'invitada@example.com');
  assert.equal(result.grants[0].roleId, ids[4]);
  assert.equal(h.deliveries[0].status, 'DELIVERED');
});

test('TL-06 resend supersedes through repository and acceptance establishes invitee password', async () => {
  const h = harness();
  const issued = await h.service.issue({ tenantId: ids[7], inviterUserId: ids[6], inviterAdminIdentityId: ids[5], targetUserId: null, proposedDisplayName: 'Invitada Demo', email: 'i@example.com', authorityRevision: 0, grants: [{ roleId: ids[4], roleVersion: 0, assignmentScope: 'TENANT_WIDE', branchId: null }], clientRequestId: ids[3], correlationId: ids[2], guard: { async confirmCurrent() { return true; } } });
  const resent = await h.service.resend({ tenantId: ids[7], invitationId: issued.invitationId, expectedVersion: 0, clientRequestId: ids[1], correlationId: ids[0], guard: { async confirmCurrent() { return true; } } });
  assert.equal(resent.version, 1);
  const accepted = await h.service.accept({ token: 'b'.repeat(43), password: 'Safe invitation pass 123!', clientRequestId: ids[0], correlationId: ids[1] });
  assert.equal(accepted.status, 'ACCEPTED');
  assert.equal(JSON.stringify(accepted).includes('Safe invitation pass'), false);
});
