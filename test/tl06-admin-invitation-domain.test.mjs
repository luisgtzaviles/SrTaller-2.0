import assert from 'node:assert/strict';
import test from 'node:test';

import {
  adminInvitationExpiresAt,
  canonicalizeAdminInvitationGrants,
  digestAdminInvitationGrants,
  invitationStatusAt,
  normalizeAdminInvitationEmail,
} from '../dist/modules/access/domain/admin-invitation.js';

const roleA = '11111111-1111-4111-8111-111111111111';
const roleB = '22222222-2222-4222-8222-222222222222';

test('TL-06 invitation email and 24-hour lifecycle are deterministic', () => {
  assert.deepEqual(normalizeAdminInvitationEmail('  Persona@Example.COM '), {
    normalized: 'persona@example.com',
    display: 'Persona@Example.COM',
  });
  const createdAt = '2026-09-21T12:00:00.000Z';
  const expiresAt = adminInvitationExpiresAt(createdAt);
  assert.equal(expiresAt, '2026-09-22T12:00:00.000Z');
  assert.equal(invitationStatusAt('PENDING', expiresAt, '2026-09-22T11:59:59.999Z'), 'PENDING');
  assert.equal(invitationStatusAt('PENDING', expiresAt, expiresAt), 'EXPIRED');
  assert.equal(invitationStatusAt('REVOKED', expiresAt, expiresAt), 'REVOKED');
});

test('TL-06 grant intent is canonical, scoped and digest-bound', () => {
  const input = [
    { roleId: roleB, roleVersion: 2, assignmentScope: 'TENANT_WIDE', branchId: null },
    { roleId: roleA, roleVersion: 1, assignmentScope: 'TENANT_WIDE', branchId: null },
  ];
  const canonical = canonicalizeAdminInvitationGrants(input);
  assert.equal(canonical[0].roleId, roleA);
  assert.equal(digestAdminInvitationGrants(input).byteLength, 32);
  assert.deepEqual(digestAdminInvitationGrants(input), digestAdminInvitationGrants([...input].reverse()));
  assert.throws(() => canonicalizeAdminInvitationGrants([{ roleId: roleA, roleVersion: 0, assignmentScope: 'TENANT_WIDE', branchId: roleB }]));
  assert.throws(() => canonicalizeAdminInvitationGrants([input[0], input[0]]));
});
