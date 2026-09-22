import assert from 'node:assert/strict';
import test from 'node:test';

const [{ AdminBranchesController }, { ContextualAuthorizationError }] = await Promise.all([
  import('../dist/modules/access/presentation/admin-branches.controller.js'),
  import('../dist/modules/access/index.js'),
]);

const headers = Object.freeze({ cookie: 'synthetic', host: 'admin.srtaller.com', origin: 'https://admin.srtaller.com', 'x-forwarded-proto': 'https', 'sec-fetch-site': 'same-origin', 'content-type': 'application/json', 'x-sr-admin-csrf-token': 'synthetic' });
const context = Object.freeze({ tenantId: '00000000-0000-4000-8000-000000000001', sessionId: '00000000-0000-4000-8000-000000000002', userId: '00000000-0000-4000-8000-000000000003', userDisplayName: 'Admin', capability: 'branches.read', reauthenticatedAt: null, commitGuard: Object.freeze({ confirmCurrent: async () => true, confirmEffectiveTenantAdmin: async () => true }) });

test('TL-05 binds each route to the approved Admin capability and Level-2 boundary', async () => {
  const source = await import('node:fs/promises').then(({ readFile }) => readFile('src/modules/access/presentation/admin-branches.controller.ts', 'utf8'));
  const requirements = [];
  const authorization = { async execute(_evidence, requirement, operation) { requirements.push(requirement); return operation({ ...context, capability: requirement.capability }); } };
  const runtime = { list: async () => [], read: async () => ({ branchId: 'read' }), create: async () => ({ branchId: 'create' }), update: async () => ({ branchId: 'update' }), deactivate: async () => ({ branchId: 'deactivate' }), reactivate: async () => ({ branchId: 'reactivate' }) };
  const controller = new AdminBranchesController(authorization, runtime);
  await controller.list(headers); await controller.read('id', headers); await controller.create({}, headers); await controller.update('id', {}, headers); await controller.deactivate('id', {}, headers); await controller.reactivate('id', {}, headers);
  assert.deepEqual(requirements, [
    { capability: 'branches.read', kind: 'read' },
    { capability: 'branches.read', kind: 'read' },
    { capability: 'branches.manage', kind: 'state-change' },
    { capability: 'branches.manage', kind: 'state-change' },
    { capability: 'branches.deactivate', kind: 'state-change', requiresRecentReauthentication: true },
    { capability: 'branches.deactivate', kind: 'state-change', requiresRecentReauthentication: true },
  ]);
  assert.match(source, /x-sr-admin-csrf-token/u);
  assert.doesNotMatch(source, /x-sr-csrf-token/u);
});

test('TL-05 translates missing Admin Session and capability denial without invoking Branch runtime', async () => {
  let invoked = false;
  const runtime = { list: async () => { invoked = true; return []; } };
  const unauthenticated = new AdminBranchesController({ execute: async () => { throw new ContextualAuthorizationError('AUTHENTICATION_REQUIRED'); } }, runtime);
  await assert.rejects(unauthenticated.list(headers), (error) => error?.status === 401 && error?.response?.code === 'AUTHENTICATION_REQUIRED');
  const denied = new AdminBranchesController({ execute: async () => { throw new ContextualAuthorizationError('ACCESS_DENIED'); } }, runtime);
  await assert.rejects(denied.list(headers), (error) => error?.status === 403 && error?.response?.code === 'ACCESS_DENIED');
  assert.equal(invoked, false);
});

test('TL-05 retires operational timezone writes while preserving read presentation', async () => {
  const [controller, port, operations] = await Promise.all([
    import('node:fs/promises').then(({ readFile }) => readFile('src/modules/access/presentation/branch-settings-administration.controller.ts', 'utf8')),
    import('node:fs/promises').then(({ readFile }) => readFile('src/modules/stations/application/ports/branch-settings-runtime.port.ts', 'utf8')),
    import('node:fs/promises').then(({ readFile }) => readFile('src/modules/access/application/access-administration-operations.ts', 'utf8')),
  ]);
  assert.match(controller, /async read/u); assert.doesNotMatch(controller, /@Post|async update/u);
  assert.doesNotMatch(port, /updateTimeZone/u); assert.doesNotMatch(operations, /updateBranchSettings/u);
});
