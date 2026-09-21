import assert from 'node:assert/strict';
import test from 'node:test';

import {
  normalizeAdminEmail,
} from '../dist/modules/access/domain/admin-identity.js';
import {
  parseAdminPassword,
} from '../dist/modules/access/domain/admin-password.js';
import {
  ADMIN_SESSION_ABSOLUTE_MS,
  ADMIN_SESSION_IDLE_MS,
  ADMIN_SESSION_REAUTHENTICATION_MS,
  adminSessionHasRecentReauthentication,
  adminSessionIsTemporallyActive,
} from '../dist/modules/access/domain/admin-session.js';

test('administrative email normalization preserves display and canonicalizes authority key', () => {
  assert.deepEqual(normalizeAdminEmail('  Owner@Example.COM  '), {
    display: 'Owner@Example.COM',
    normalized: 'owner@example.com',
  });
  assert.throws(() => normalizeAdminEmail('owner'), /identity input/u);
});

test('administrative passwords preserve exact material and enforce bounded input', () => {
  assert.equal(parseAdminPassword('  exact-password  '), '  exact-password  ');
  assert.throws(() => parseAdminPassword('too-short'), /credential input/u);
  assert.throws(() => parseAdminPassword('x'.repeat(129)), /credential input/u);
});

test('administrative temporal boundaries are exact and independent from operational sessions', () => {
  assert.equal(ADMIN_SESSION_IDLE_MS, 30 * 60 * 1_000);
  assert.equal(ADMIN_SESSION_ABSOLUTE_MS, 12 * 60 * 60 * 1_000);
  assert.equal(ADMIN_SESSION_REAUTHENTICATION_MS, 10 * 60 * 1_000);
  const session = {
    status: 'active',
    issuedAt: '2026-09-20T00:00:00.000Z',
    lastActivityAt: '2026-09-20T00:00:00.000Z',
    expiresAt: '2026-09-20T12:00:00.000Z',
    reauthenticatedAt: '2026-09-20T00:00:00.000Z',
  };
  assert.equal(adminSessionIsTemporallyActive(session, '2026-09-20T00:29:59.999Z'), true);
  assert.equal(adminSessionIsTemporallyActive(session, '2026-09-20T00:30:00.000Z'), false);
  assert.equal(adminSessionHasRecentReauthentication(session, '2026-09-20T00:09:59.999Z'), true);
  assert.equal(adminSessionHasRecentReauthentication(session, '2026-09-20T00:10:00.000Z'), false);
});
