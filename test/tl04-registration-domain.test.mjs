import assert from 'node:assert/strict';
import test from 'node:test';

import {
  REGISTRATION_ATTEMPT_TTL_MS,
  REGISTRATION_CHALLENGE_TTL_MS,
  digestVerificationToken,
  isRegistrationAttemptExpired,
  parseRegistrationDisplayName,
  parseWorkshopDisplayName,
  registrationApprovedInputDigest,
} from '../dist/modules/registration/domain/registration-attempt.js';

test('registration contract fixes the approved lifecycle time bounds', () => {
  assert.equal(REGISTRATION_CHALLENGE_TTL_MS, 60 * 60 * 1_000);
  assert.equal(REGISTRATION_ATTEMPT_TTL_MS, 24 * 60 * 60 * 1_000);
});

test('registration display values are bounded and deterministic', () => {
  assert.equal(parseRegistrationDisplayName('  Ana   Pérez  '), 'Ana Pérez');
  assert.equal(parseWorkshopDisplayName(' Taller Centro '), 'Taller Centro');
  assert.throws(() => parseRegistrationDisplayName(''));
  assert.throws(() => parseWorkshopDisplayName('x'.repeat(161)));
});

test('verification token is canonical 32-byte base64url and stored as digest', () => {
  const token = Buffer.alloc(32, 7).toString('base64url');
  const digest = digestVerificationToken(token);
  assert.equal(digest.byteLength, 32);
  assert.notDeepEqual(Buffer.from(digest), Buffer.from(token));
  assert.throws(() => digestVerificationToken('short'));
});

test('approved input digest is deterministic and attempt expiration is UTC-instant based', () => {
  const input = {
    personDisplayName: 'Ana Pérez',
    workshopDisplayName: 'Taller Centro',
    normalizedEmail: 'ana@example.com',
    acceptanceEvidenceId: '10000000-0000-4000-8000-000000000001',
  };
  assert.deepEqual(registrationApprovedInputDigest(input), registrationApprovedInputDigest(input));
  assert.equal(isRegistrationAttemptExpired('2026-09-21T10:00:00.000Z', new Date('2026-09-21T10:00:00.000Z')), true);
  assert.equal(isRegistrationAttemptExpired('2026-09-21T10:00:00.001Z', new Date('2026-09-21T10:00:00.000Z')), false);
});
