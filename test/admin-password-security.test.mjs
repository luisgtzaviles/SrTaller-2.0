import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import test from 'node:test';

import { NodeArgon2AdminPasswordHasher } from '../dist/modules/access/infrastructure/security/node-argon2-admin-password-hasher.js';
import { NodeAdminSessionToken } from '../dist/modules/access/infrastructure/security/node-admin-session-token.js';

test('administrative password hasher is separately peppered, context-bound and redacted', async () => {
  const hasher = new NodeArgon2AdminPasswordHasher(randomBytes(32).toString('base64url'));
  const password = 'correct horse battery staple';
  const stored = await hasher.hash({
    tenantId: '11111111-1111-4111-8111-111111111111',
    adminIdentityId: '22222222-2222-4222-8222-222222222222',
    password,
  });
  assert.equal(await hasher.verify({
    tenantId: '11111111-1111-4111-8111-111111111111',
    adminIdentityId: '22222222-2222-4222-8222-222222222222',
    password,
    stored,
  }), true);
  assert.equal(await hasher.verify({
    tenantId: '33333333-3333-4333-8333-333333333333',
    adminIdentityId: '22222222-2222-4222-8222-222222222222',
    password,
    stored,
  }), false);
  assert.deepEqual(hasher.toJSON(), {
    algorithm: 'argon2id',
    profileVersion: 1,
    pepper: '[REDACTED]',
  });
  assert.equal(hasher.principalDigest('owner@example.com').byteLength, 32);
});

test('administrative bearer and CSRF tokens are independent opaque credentials', () => {
  const tokens = new NodeAdminSessionToken();
  const issued = tokens.issue();
  assert.notEqual(issued.bearer, issued.csrf);
  assert.equal(issued.bearerVerifier.byteLength, 32);
  assert.equal(issued.csrfVerifier.byteLength, 32);
  assert.deepEqual(tokens.digestBearer(issued.bearer), issued.bearerVerifier);
  assert.deepEqual(tokens.digestCsrf(issued.csrf), issued.csrfVerifier);
  assert.throws(() => tokens.digestBearer('not-a-token'), /credential is invalid/u);
});
