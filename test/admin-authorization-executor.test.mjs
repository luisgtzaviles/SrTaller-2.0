import assert from 'node:assert/strict';
import test from 'node:test';

import { AdminAuthorizationExecutorService } from '../dist/modules/access/presentation/admin-authorization.executor.js';
import { ContextualAuthorizationError } from '../dist/modules/access/index.js';
import { NodeAdminSessionToken } from '../dist/modules/access/infrastructure/security/node-admin-session-token.js';

const tenantId = 'b0000000-0000-4000-8000-000000000001';
const userId = 'b0000000-0000-4000-8000-000000000002';
const sessionId = 'b0000000-0000-4000-8000-000000000003';

function fixture({ capabilities = ['users.read'], reauthenticatedAt = null } = {}) {
  const material = new NodeAdminSessionToken().issue();
  const calls = { commitSession: 0, commitCapability: 0, resolve: 0 };
  const session = {
    tenantId, userId, sessionId,
    adminIdentityId: 'b0000000-0000-4000-8000-000000000004',
    displayName: 'Tenant Owner', status: 'active', version: 0,
    userAdmissionRevision: 0, identityVersion: 0, credentialVersion: 1, sessionRevision: 1,
    issuedAt: new Date(Date.now() - 60_000).toISOString(),
    lastActivityAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 60 * 60_000).toISOString(),
    reauthenticatedAt,
    endedAt: null,
  };
  const runtime = { admin: {
    resolve: {
      execute: async (input) => { calls.resolve += 1; assert.equal(input.bearer, material.bearer); return session; },
      confirmCurrentAtCommit: async (_session, recent) => { calls.commitSession += 1; return !recent || session.reauthenticatedAt !== null; },
    },
    capabilities: async (resolvedTenant, resolvedUser) => {
      assert.equal(resolvedTenant, tenantId); assert.equal(resolvedUser, userId); return capabilities;
    },
  } };
  const guard = { confirmCurrent: async (scope, capability) => {
    calls.commitCapability += 1;
    assert.deepEqual(scope, { tenantId, userId });
    return capabilities.includes(capability);
  } };
  const evidence = {
    cookieHeader: `sr_admin_session=${material.bearer}; sr_admin_session_csrf=${material.csrf}`,
    origin: 'https://admin.srtaller.test', host: 'admin.srtaller.test', forwardedProto: 'https',
    fetchSite: 'same-origin', contentType: 'application/json', csrfToken: material.csrf,
  };
  return { calls, evidence, executor: new AdminAuthorizationExecutorService(runtime, guard), session };
}

test('AdminAuthorizationExecutor derives Tenant/User from Admin Session and has no Station context', async () => {
  const { calls, evidence, executor } = fixture();
  const result = await executor.execute(evidence, { capability: 'users.read', kind: 'state-change' }, async (context) => {
    assert.equal(context.tenantId, tenantId);
    assert.equal(context.userId, userId);
    assert.equal('branchId' in context, false);
    assert.equal('stationId' in context, false);
    assert.equal(await context.commitGuard.confirmCurrent({}), true);
    return 'authorized';
  });
  assert.equal(result, 'authorized');
  assert.deepEqual(calls, { commitSession: 1, commitCapability: 1, resolve: 1 });
});

test('AdminAuthorizationExecutor denies wrong audience, missing capability and forged CSRF', async () => {
  const { evidence, executor } = fixture({ capabilities: [] });
  await assert.rejects(
    executor.execute(evidence, { capability: 'users.read', kind: 'read' }, async () => undefined),
    (error) => error instanceof ContextualAuthorizationError && error.code === 'ACCESS_DENIED',
  );
  const allowed = fixture();
  await assert.rejects(
    allowed.executor.execute({ ...allowed.evidence, csrfToken: 'forged' }, { capability: 'users.read', kind: 'state-change' }, async () => undefined),
    (error) => error instanceof ContextualAuthorizationError && error.code === 'ACCESS_DENIED',
  );
  await assert.rejects(
    allowed.executor.execute({ ...allowed.evidence, cookieHeader: allowed.evidence.cookieHeader.replaceAll('sr_admin_', 'sr_') }, { capability: 'users.read', kind: 'read' }, async () => undefined),
    (error) => error instanceof ContextualAuthorizationError && error.code === 'AUTHENTICATION_REQUIRED',
  );
});

test('Level-2 requirement needs recent password reauthentication at request and commit', async () => {
  const ordinary = fixture();
  await assert.rejects(
    ordinary.executor.execute(ordinary.evidence, { capability: 'users.read', kind: 'state-change', requiresRecentReauthentication: true }, async () => undefined),
    (error) => error instanceof ContextualAuthorizationError && error.code === 'ACCESS_DENIED',
  );
  const recent = fixture({ reauthenticatedAt: new Date().toISOString() });
  await recent.executor.execute(recent.evidence, { capability: 'users.read', kind: 'state-change', requiresRecentReauthentication: true }, async (context) => {
    assert.equal(await context.commitGuard.confirmCurrent({}), true);
  });
});
