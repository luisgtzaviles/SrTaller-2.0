import assert from 'node:assert/strict';
import test from 'node:test';

const {
  ACCESS_CAPABILITY_CATALOG,
  composeEffectiveCapabilities,
  parseCapabilityCode,
} = await import('../dist/modules/access/domain/capability.js');
const {
  parseRoleAssignmentTarget,
} = await import('../dist/modules/access/domain/role-assignment.js');
const { AssignRoleUseCase } = await import(
  '../dist/modules/access/application/use-cases/assign-role.use-case.js'
);
const { ListAccessMatrixUseCase } = await import(
  '../dist/modules/access/application/use-cases/list-access-matrix.use-case.js'
);
const { ListApplicableUsersUseCase } = await import(
  '../dist/modules/access/application/use-cases/list-applicable-users.use-case.js'
);
const { ResolveEffectiveCapabilitiesUseCase } = await import(
  '../dist/modules/access/application/use-cases/resolve-effective-capabilities.use-case.js'
);
const { RevokeRoleAssignmentUseCase } = await import(
  '../dist/modules/access/application/use-cases/revoke-role-assignment.use-case.js'
);
const { AccessInputError, parseReplaceAccessRoleCapabilitiesInput } = await import(
  '../dist/modules/access/application/access-input.js'
);

const tenantId = '10000000-0000-4000-8000-000000000033';
const branchId = '20000000-0000-4000-8000-000000000033';
const userId = '30000000-0000-4000-8000-000000000033';
const roleId = '40000000-0000-4000-8000-000000000033';
const assignmentId = '50000000-0000-4000-8000-000000000033';
const requestId = '60000000-0000-4000-8000-000000000033';
const now = new Date('2026-09-06T19:00:00.000Z');

const activeAssignment = Object.freeze({
  tenantId,
  assignmentId,
  userId,
  roleId,
  assignmentScope: 'BRANCH_RESTRICTED',
  branchId,
  status: 'active',
  version: 0,
  assignedAt: now.toISOString(),
  revokedAt: null,
});

function fixtureRepository() {
  const calls = [];
  return {
    calls,
    repository: {
      async listMatrix(scope) {
        calls.push(['listMatrix', scope]);
        return Object.freeze({ capabilities: [], roles: [], assignments: [] });
      },
      async listApplicableUserIds(scope) {
        calls.push(['listApplicableUserIds', scope]);
        return Object.freeze([userId]);
      },
      async resolveEffectiveCapabilities(scope) {
        calls.push(['resolveEffectiveCapabilities', scope]);
        return Object.freeze(['repairs.read', 'repairs.add_note']);
      },
      async assignRole(scope, input) {
        calls.push(['assignRole', scope, input]);
        return activeAssignment;
      },
      async revokeRoleAssignment(scope, input) {
        calls.push(['revokeRoleAssignment', scope, input]);
        return Object.freeze({
          ...activeAssignment,
          status: 'revoked',
          version: 1,
          revokedAt: input.occurredAt,
        });
      },
    },
  };
}

function rejectsInput(operation, parameter) {
  assert.throws(
    operation,
    (error) =>
      error instanceof AccessInputError && error.parameter === parameter,
  );
}

test('Access capability catalog is finite, action-specific and composed deterministically', () => {
  assert.deepEqual([...ACCESS_CAPABILITY_CATALOG], [
    'users.read',
    'users.manage',
    'access_matrix.read',
    'access_matrix.manage',
    'repairs.read',
    'repairs.add_note',
    'repairs.create',
    'repairs.correct_intake',
    'repairs.classify',
    'repairs.catalogs.read',
    'repairs.catalogs.manage',
    'repairs.configuration.read',
    'repairs.configuration.manage',
    'price_list.read',
    'catalog.manage',
    'catalog.prices.manage',
    'catalog.branch_prices.manage',
    'catalog.reference_cost.read',
    'catalog.reference_cost.manage',
    'catalog.import.prepare',
    'catalog.import.publish',
    'catalog.items.bulk_retire',
    'catalog.suppliers.delete',
  ]);
  assert.deepEqual(
    composeEffectiveCapabilities([
      'repairs.add_note',
      'users.read',
      'repairs.add_note',
    ]),
    ['users.read', 'repairs.add_note'],
  );
  assert.equal(parseCapabilityCode('repairs.read'), 'repairs.read');
  assert.throws(() => parseCapabilityCode('administrator'), TypeError);
});

test('role capability replacement accepts the exact durable command contract', () => {
  assert.deepEqual(
    parseReplaceAccessRoleCapabilitiesInput({
      expectedVersion: 2,
      capabilityCodes: ['repairs.read', 'repairs.add_note'],
      clientRequestId: requestId,
    }),
    {
      expectedVersion: 2,
      capabilityCodes: ['repairs.read', 'repairs.add_note'],
      clientRequestId: requestId,
    },
  );
  rejectsInput(
    () => parseReplaceAccessRoleCapabilitiesInput({
      expectedVersion: 2,
      capabilityCodes: ['repairs.read'],
      clientRequestId: requestId,
      directPermission: true,
    }),
    'payload',
  );
});

test('Access read use cases enforce exact tenant, branch and principal scopes', async () => {
  const fixture = fixtureRepository();
  const listMatrix = new ListAccessMatrixUseCase(fixture.repository);
  const listApplicableUsers = new ListApplicableUsersUseCase(fixture.repository);
  const resolveCapabilities = new ResolveEffectiveCapabilitiesUseCase(
    fixture.repository,
  );

  await listMatrix.execute({ tenantId });
  assert.deepEqual(await listApplicableUsers.execute({ tenantId, branchId }), [
    userId,
  ]);
  assert.deepEqual(
    await resolveCapabilities.execute({ tenantId, branchId, userId }),
    ['repairs.read', 'repairs.add_note'],
  );
  assert.deepEqual(fixture.calls, [
    ['listMatrix', { tenantId }],
    ['listApplicableUserIds', { tenantId, branchId }],
    ['resolveEffectiveCapabilities', { tenantId, branchId, userId }],
  ]);

  rejectsInput(
    () => listMatrix.execute({ tenantId, userId }),
    'payload',
  );
  rejectsInput(
    () => listApplicableUsers.execute({ tenantId, branchId: 'branch-a' }),
    'branchId',
  );
  rejectsInput(
    () => resolveCapabilities.execute({ tenantId, branchId, userId: 'user-a' }),
    'userId',
  );
});

test('assign role use case owns ID/time and validates exact scope semantics', async () => {
  const fixture = fixtureRepository();
  const useCase = new AssignRoleUseCase(
    fixture.repository,
    () => assignmentId,
    () => now,
  );

  assert.equal(
    await useCase.execute(
      { tenantId },
      {
        userId,
        roleId,
        assignmentScope: 'BRANCH_RESTRICTED',
        branchId,
        clientRequestId: requestId,
      },
    ),
    activeAssignment,
  );
  assert.deepEqual(fixture.calls[0], [
    'assignRole',
    { tenantId },
    {
      userId,
      roleId,
      assignmentScope: 'BRANCH_RESTRICTED',
      branchId,
      clientRequestId: requestId,
      assignmentId,
      occurredAt: now.toISOString(),
    },
  ]);

  for (const [change, parameter] of [
    [{ userId: 'user-a' }, 'userId'],
    [{ roleId: 'role-a' }, 'roleId'],
    [{ assignmentScope: 'GLOBAL' }, 'assignmentScope'],
    [{ branchId: null }, 'branchId'],
    [{ clientRequestId: 'request-a' }, 'clientRequestId'],
  ]) {
    rejectsInput(
      () =>
        useCase.execute(
          { tenantId },
          {
            userId,
            roleId,
            assignmentScope: 'BRANCH_RESTRICTED',
            branchId,
            clientRequestId: requestId,
            ...change,
          },
        ),
      parameter,
    );
  }
  rejectsInput(
    () =>
      useCase.execute(
        { tenantId },
        {
          userId,
          roleId,
          assignmentScope: 'BRANCH_RESTRICTED',
          branchId,
          clientRequestId: requestId,
          isAdministrator: true,
        },
      ),
    'payload',
  );
  rejectsInput(
    () =>
      useCase.execute(
        { tenantId },
        {
          userId,
          roleId,
          assignmentScope: 'TENANT_WIDE',
          branchId,
          clientRequestId: requestId,
        },
      ),
    'branchId',
  );
  assert.deepEqual(parseRoleAssignmentTarget('TENANT_WIDE', null), {
    scope: 'TENANT_WIDE',
    branchId: null,
  });
});

test('revoke role use case requires optimistic version and durable request identity', async () => {
  const fixture = fixtureRepository();
  const useCase = new RevokeRoleAssignmentUseCase(
    fixture.repository,
    () => now,
  );

  const result = await useCase.execute(
    { tenantId },
    { assignmentId, expectedVersion: 0, clientRequestId: requestId },
  );
  assert.equal(result.status, 'revoked');
  assert.equal(result.version, 1);
  assert.deepEqual(fixture.calls[0], [
    'revokeRoleAssignment',
    { tenantId },
    {
      assignmentId,
      expectedVersion: 0,
      clientRequestId: requestId,
      occurredAt: now.toISOString(),
    },
  ]);

  for (const [change, parameter] of [
    [{ assignmentId: 'assignment-a' }, 'assignmentId'],
    [{ expectedVersion: -1 }, 'expectedVersion'],
    [{ clientRequestId: 'request-a' }, 'clientRequestId'],
  ]) {
    rejectsInput(
      () =>
        useCase.execute(
          { tenantId },
          { assignmentId, expectedVersion: 0, clientRequestId: requestId, ...change },
        ),
      parameter,
    );
  }
});
