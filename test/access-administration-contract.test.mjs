import assert from 'node:assert/strict';
import test from 'node:test';

import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';

import { ContextualAuthorizationError } from '../dist/modules/access/index.js';
import {
  AccessAdministrationOperations,
  AccessAdministrationRequestError,
  AccessAdministrationResourceNotFoundError,
} from '../dist/modules/access/application/access-administration-operations.js';
import {
  AccessAdministrationController,
} from '../dist/modules/access/presentation/access-administration.controller.js';

const tenantId = '10000000-0000-4000-8000-000000000001';
const branchId = '20000000-0000-4000-8000-000000000001';
const adminUserId = '30000000-0000-4000-8000-000000000001';
const targetUserId = '40000000-0000-4000-8000-000000000001';
const adminRoleId = '50000000-0000-4000-8000-000000000001';
const targetRoleId = '60000000-0000-4000-8000-000000000001';
const adminAssignmentId = '70000000-0000-4000-8000-000000000001';
const targetAssignmentId = '80000000-0000-4000-8000-000000000001';
const requestIds = Object.freeze({
  create: '90000000-0000-4000-8000-000000000001',
  assign: '91000000-0000-4000-8000-000000000001',
  revoke: '92000000-0000-4000-8000-000000000001',
  pin: '93000000-0000-4000-8000-000000000001',
  status: '94000000-0000-4000-8000-000000000001',
  roleCreate: '95000000-0000-4000-8000-000000000001',
  roleCapabilities: '96000000-0000-4000-8000-000000000001',
  roleUpdate: '97000000-0000-4000-8000-000000000001',
});

const requestEvidence = Object.freeze({
  cookieHeader: 'sr_session=opaque',
  origin: 'http://127.0.0.1:4173',
  host: '127.0.0.1:4173',
  forwardedProto: undefined,
  fetchSite: 'same-origin',
  contentType: 'application/json',
  csrfToken: 'csrf',
});

const authorizedContext = Object.freeze({
  tenantId,
  branchId,
  stationId: 'a0000000-0000-4000-8000-000000000001',
  sessionId: 'b0000000-0000-4000-8000-000000000001',
  userId: adminUserId,
  userDisplayName: 'Administración',
  capability: 'users.read',
  commitGuard: Object.freeze({
    async confirmCurrent(transactionContext) {
      return transactionContext?.marker === 'admin-mutation';
    },
  }),
});

function userRecord(overrides = {}) {
  return Object.freeze({
    tenantId,
    userId: targetUserId,
    displayName: 'Persona Operadora',
    operationalIdentifier: 'OP-1',
    status: 'active',
    version: 3,
    createdAt: '2026-09-07T20:00:00.000Z',
    updatedAt: '2026-09-07T20:01:00.000Z',
    ...overrides,
  });
}

function roleRecord(overrides = {}) {
  return Object.freeze({
    tenantId,
    roleId: targetRoleId,
    roleKey: 'ventas',
    displayName: 'Ventas',
    description: 'Acceso del equipo de ventas.',
    status: 'active',
    version: 2,
    capabilityCodes: Object.freeze(['repairs.read']),
    createdAt: '2026-09-07T20:00:00.000Z',
    updatedAt: '2026-09-07T20:01:00.000Z',
    ...overrides,
  });
}

function assignmentRecord(overrides = {}) {
  return Object.freeze({
    tenantId,
    assignmentId: targetAssignmentId,
    userId: targetUserId,
    roleId: targetRoleId,
    assignmentScope: 'TENANT_WIDE',
    branchId: null,
    status: 'active',
    version: 1,
    assignedAt: '2026-09-07T20:00:00.000Z',
    revokedAt: null,
    ...overrides,
  });
}

function matrix(adminScope = 'TENANT_WIDE') {
  return Object.freeze({
    capabilities: Object.freeze([
      Object.freeze({
        capabilityCode: 'users.read',
        createdAt: '2026-09-07T20:00:00.000Z',
      }),
    ]),
    roles: Object.freeze([
      roleRecord({
        roleId: adminRoleId,
        roleKey: 'administracion',
        displayName: 'Administración',
        capabilityCodes: Object.freeze([
          'users.read',
          'users.manage',
          'access_matrix.read',
          'access_matrix.manage',
        ]),
      }),
      roleRecord(),
    ]),
    assignments: Object.freeze([
      assignmentRecord({
        assignmentId: adminAssignmentId,
        userId: adminUserId,
        roleId: adminRoleId,
        assignmentScope: adminScope,
        branchId: adminScope === 'TENANT_WIDE' ? null : branchId,
      }),
      assignmentRecord(),
    ]),
  });
}

function operationsFixture(adminScope = 'TENANT_WIDE', legacyPin = false) {
  const calls = [];
  const transactionContext = Object.freeze({ marker: 'admin-mutation' });
  const applyGuard = async (guard) => {
    calls.push({ operation: 'commitGuard', allowed: await guard.confirmCurrent(transactionContext) });
    calls.push({ operation: 'continuityGuard', allowed: await guard.confirmContinuity(transactionContext) });
  };
  const authorization = {
    async execute(evidence, requirement, operation) {
      calls.push({ operation: 'authorize', evidence, requirement });
      return operation({ ...authorizedContext, capability: requirement.capability });
    },
  };
  const users = {
    async list(scope) {
      calls.push({ operation: 'listUsers', scope });
      return [userRecord()];
    },
    async create(scope, input, guard) {
      await applyGuard(guard);
      calls.push({ operation: 'createUser', scope, input });
      return userRecord();
    },
    async update(scope, userId, input, guard) {
      await applyGuard(guard);
      calls.push({ operation: 'updateUser', scope, userId, input });
      return userRecord();
    },
    async transition(scope, input, guard) {
      await applyGuard(guard);
      calls.push({ operation: 'transitionUser', scope, input });
      return userRecord({ status: input.status, version: 4 });
    },
  };
  const operations = new AccessAdministrationOperations(
    authorization,
    users,
    async (scope) => {
      calls.push({ operation: 'listAccessMatrix', scope });
      return matrix(adminScope);
    },
    async (scope, input, guard) => {
      await applyGuard(guard);
      calls.push({ operation: 'createRole', scope, input });
      return roleRecord();
    },
    async (scope, roleId, input, guard) => {
      await applyGuard(guard);
      calls.push({ operation: 'replaceRoleCapabilities', scope, roleId, input });
      return roleRecord({ capabilityCodes: input.capabilityCodes });
    },
    async (scope, roleId, input, guard) => {
      await applyGuard(guard);
      calls.push({ operation: 'updateRole', scope, roleId, input });
      return roleRecord({
        displayName: input.displayName,
        description: input.description,
      });
    },
    async (scope, input, guard) => {
      await applyGuard(guard);
      calls.push({ operation: 'assignRole', scope, input });
      return assignmentRecord();
    },
    async (scope, input, guard) => {
      await applyGuard(guard);
      calls.push({ operation: 'revokeRole', scope, input });
      return assignmentRecord({ status: 'revoked', revokedAt: '2026-09-07T20:02:00.000Z' });
    },
    async (scope, input, guard) => {
      await applyGuard(guard);
      calls.push({ operation: 'provisionPin', scope, input });
      return { provisioned: true };
    },
    async (scope, input, guard) => {
      await applyGuard(guard);
      calls.push({ operation: 'replacePin', scope, input });
      if (legacyPin) {
        throw Object.assign(new Error('legacy credential absent from PIN-only readiness'), {
          code: 'PIN_CREDENTIAL_USER_INVALID',
        });
      }
      return { replaced: true };
    },
    async (scope) => {
      calls.push({ operation: 'listConfiguredPins', scope });
      return [targetUserId];
    },
    {
      async confirmCurrent(scope, capability, context) {
        calls.push({ operation: 'tenantWideCommitGuard', scope, capability });
        return context === transactionContext;
      },
      async confirmContinuity(scope, context) {
        calls.push({ operation: 'tenantWideContinuityGuard', scope });
        return context === transactionContext;
      },
    },
  );
  return { calls, operations };
}

function call(calls, operation) {
  return calls.find((candidate) => candidate.operation === operation);
}

test('administration operations enforce exact capability and tenant-wide authority', async () => {
  const { calls, operations } = operationsFixture();
  const created = await operations.createUser(requestEvidence, {
    clientRequestId: requestIds.create,
    displayName: 'Persona Operadora',
    operationalIdentifier: 'OP-1',
  });
  const users = await operations.listUsers(requestEvidence);
  const roles = await operations.listRoles(requestEvidence);
  await operations.createRole(requestEvidence, {
    roleKey: 'ventas',
    displayName: 'Ventas',
    description: 'Acceso del equipo de ventas.',
    capabilityCodes: ['repairs.read'],
    clientRequestId: requestIds.roleCreate,
  });
  await operations.replaceRoleCapabilities(requestEvidence, targetRoleId, {
    expectedVersion: 2,
    capabilityCodes: ['repairs.read'],
    clientRequestId: requestIds.roleCapabilities,
  });
  await operations.updateRole(requestEvidence, targetRoleId, {
    displayName: 'Ventas y mostrador',
    description: 'Atención comercial.',
    expectedVersion: 3,
    clientRequestId: requestIds.roleUpdate,
  });
  await operations.updateUser(requestEvidence, targetUserId, {
    displayName: 'Persona Editada',
    operationalIdentifier: 'OP-2',
    expectedVersion: 3,
  });
  await operations.assignRole(requestEvidence, targetUserId, {
    roleId: targetRoleId,
    clientRequestId: requestIds.assign,
  });
  await operations.revokeRole(
    requestEvidence,
    targetUserId,
    targetAssignmentId,
    { expectedVersion: 1, clientRequestId: requestIds.revoke },
  );
  await operations.provisionFourDigitPin(requestEvidence, targetUserId, {
    pin: '0000',
    clientRequestId: requestIds.pin,
  });
  const transitioned = await operations.transitionUser(requestEvidence, targetUserId, {
    status: 'inactive',
    expectedVersion: 3,
    clientRequestId: requestIds.status,
  });

  assert.equal(created.pinConfigured, true);
  assert.equal(users[0].pinConfigured, true);
  assert.equal(transitioned.pinConfigured, true);
  assert.equal(roles.roles.length, 2);
  assert.equal(calls.filter(({ operation }) => operation === 'commitGuard').length, 9);
  assert.ok(calls.filter(({ operation }) => operation === 'commitGuard').every(({ allowed }) => allowed));
  assert.equal(calls.filter(({ operation }) => operation === 'continuityGuard').length, 9);
  assert.ok(calls.filter(({ operation }) => operation === 'continuityGuard').every(({ allowed }) => allowed));
  assert.equal(calls.filter(({ operation }) => operation === 'tenantWideCommitGuard').length, 9);
  assert.equal(calls.filter(({ operation }) => operation === 'tenantWideContinuityGuard').length, 9);
  assert.deepEqual(
    calls.filter(({ operation }) => operation === 'authorize').map(({ requirement }) => requirement),
    [
      { capability: 'users.manage', kind: 'state-change' },
      { capability: 'users.read', kind: 'read' },
      { capability: 'access_matrix.read', kind: 'read' },
      { capability: 'access_matrix.manage', kind: 'state-change' },
      { capability: 'access_matrix.manage', kind: 'state-change' },
      { capability: 'access_matrix.manage', kind: 'state-change' },
      { capability: 'users.manage', kind: 'state-change' },
      { capability: 'access_matrix.manage', kind: 'state-change' },
      { capability: 'access_matrix.manage', kind: 'state-change' },
      { capability: 'users.manage', kind: 'state-change' },
      { capability: 'users.manage', kind: 'state-change' },
    ],
  );
  assert.ok(
    calls.filter(({ operation }) => operation === 'authorize')
      .every(({ evidence }) => evidence === requestEvidence),
  );
  assert.deepEqual(call(calls, 'assignRole').input, {
    userId: targetUserId,
    roleId: targetRoleId,
    assignmentScope: 'TENANT_WIDE',
    branchId: null,
    clientRequestId: requestIds.assign,
  });
  assert.deepEqual(call(calls, 'revokeRole').input, {
    assignmentId: targetAssignmentId,
    expectedVersion: 1,
    clientRequestId: requestIds.revoke,
  });
  assert.deepEqual(call(calls, 'replacePin').input, {
    userId: targetUserId,
    pin: '0000',
    clientRequestId: requestIds.pin,
  });
  assert.deepEqual(call(calls, 'transitionUser').input, {
    userId: targetUserId,
    status: 'inactive',
    expectedVersion: 3,
    clientRequestId: requestIds.status,
  });
});

test('PIN administration attempts replacement first and provisions only when no credential row exists', async () => {
  const { calls, operations } = operationsFixture('TENANT_WIDE', true);
  await operations.provisionFourDigitPin(requestEvidence, targetUserId, {
    pin: '0000',
    clientRequestId: requestIds.pin,
  });
  assert.ok(call(calls, 'replacePin'));
  assert.ok(call(calls, 'provisionPin'));
});

test('branch-restricted administration authority cannot read or mutate tenant-wide resources', async () => {
  const { calls, operations } = operationsFixture('BRANCH_RESTRICTED');
  await assert.rejects(
    operations.listUsers(requestEvidence),
    (error) => error instanceof ContextualAuthorizationError && error.code === 'ACCESS_DENIED',
  );
  await assert.rejects(
    operations.createRole(requestEvidence, {
      roleKey: 'ventas',
      displayName: 'Ventas',
      description: null,
      capabilityCodes: ['repairs.read'],
      clientRequestId: requestIds.roleCreate,
    }),
    (error) => error instanceof ContextualAuthorizationError && error.code === 'ACCESS_DENIED',
  );
  assert.deepEqual(
    calls.map(({ operation }) => operation),
    ['authorize', 'listAccessMatrix', 'authorize', 'listAccessMatrix'],
  );
});

test('administration mutations reject unknown fields and invalid request IDs before effects', async () => {
  const scenarios = [
    ['createUser', [requestEvidence, {
      clientRequestId: requestIds.create,
      displayName: 'Persona',
      operationalIdentifier: null,
      directPermissions: ['users.manage'],
    }]],
    ['updateUser', [requestEvidence, targetUserId, {
      displayName: 'Persona',
      operationalIdentifier: null,
      expectedVersion: 1,
      pin: '0000',
    }]],
    ['createRole', [requestEvidence, {
      roleKey: 'ventas',
      displayName: 'Ventas',
      description: null,
      capabilityCodes: ['repairs.read'],
      clientRequestId: requestIds.roleCreate,
      isAdmin: true,
    }]],
    ['replaceRoleCapabilities', [requestEvidence, targetRoleId, {
      expectedVersion: 1,
      capabilityCodes: ['repairs.read'],
      clientRequestId: requestIds.roleCapabilities,
      userId: targetUserId,
    }]],
    ['assignRole', [requestEvidence, targetUserId, {
      roleId: targetRoleId,
      clientRequestId: requestIds.assign,
      branchId,
    }]],
    ['revokeRole', [requestEvidence, targetUserId, targetAssignmentId, {
      expectedVersion: 1,
      clientRequestId: requestIds.revoke,
      roleId: targetRoleId,
    }]],
    ['provisionFourDigitPin', [requestEvidence, targetUserId, {
      pin: '0000',
      clientRequestId: requestIds.pin,
      returnPin: true,
    }]],
    ['transitionUser', [requestEvidence, targetUserId, {
      status: 'inactive',
      expectedVersion: 1,
      clientRequestId: requestIds.status,
      reason: 'extra',
    }]],
  ];

  for (const [method, args] of scenarios) {
    const { calls, operations } = operationsFixture();
    await assert.rejects(
      operations[method](...args),
      AccessAdministrationRequestError,
      method,
    );
    assert.ok(!calls.some(({ operation }) => operation === method), method);
  }

  const { calls, operations } = operationsFixture();
  await assert.rejects(
    operations.assignRole(requestEvidence, targetUserId, {
      roleId: targetRoleId,
      clientRequestId: 'not-a-request-id',
    }),
    AccessAdministrationRequestError,
  );
  assert.ok(!calls.some(({ operation }) => operation === 'assignRole'));
});

test('role revocation validates that the route assignment belongs to the route user', async () => {
  const { calls, operations } = operationsFixture();
  const otherUserId = '41000000-0000-4000-8000-000000000001';
  await assert.rejects(
    operations.revokeRole(
      requestEvidence,
      otherUserId,
      targetAssignmentId,
      { expectedVersion: 1, clientRequestId: requestIds.revoke },
    ),
    AccessAdministrationResourceNotFoundError,
  );
  assert.ok(!calls.some(({ operation }) => operation === 'revokeRole'));
});

function controllerWithFailure(error) {
  return new AccessAdministrationController({
    async listUsers() { throw error; },
  });
}

test('administration HTTP boundary maps denials, invalid input, absence, and conflicts', async () => {
  const cases = [
    [new ContextualAuthorizationError('AUTHENTICATION_REQUIRED'), UnauthorizedException, 401],
    [new ContextualAuthorizationError('ACCESS_DENIED'), ForbiddenException, 403],
    [Object.assign(new Error('bad'), { name: 'UserInputError' }), BadRequestException, 400],
    [Object.assign(new Error('missing'), { code: 'USER_NOT_FOUND' }), NotFoundException, 404],
    [Object.assign(new Error('stale'), { code: 'USER_STALE_WRITE' }), ConflictException, 409],
  ];
  for (const [error, Exception, status] of cases) {
    await assert.rejects(
      controllerWithFailure(error).list({}),
      (caught) => caught instanceof Exception && caught.getStatus() === status,
    );
  }
  const infrastructureFailure = new Error('database unavailable');
  await assert.rejects(
    controllerWithFailure(infrastructureFailure).list({}),
    (caught) => caught === infrastructureFailure,
  );
});

test('administration HTTP responses are allowlisted and never expose credential material', async () => {
  const exposed = Object.freeze({
    plaintextPin: '0000',
    pinHash: 'hash-value',
    salt: 'salt-value',
    token: 'token-value',
    cookie: 'cookie-value',
  });
  const controller = new AccessAdministrationController({
    async listUsers() {
      return [{ ...userRecord(), pinConfigured: true, ...exposed }];
    },
    async createUser() {
      return { ...userRecord(), pinConfigured: true, ...exposed };
    },
    async listRoles() {
      return {
        capabilities: [{ capabilityCode: 'users.read', createdAt: 'now', ...exposed }],
        roles: [{ ...roleRecord(), ...exposed }],
        assignments: [{ ...assignmentRecord(), ...exposed }],
        ...exposed,
      };
    },
    async assignRole() {
      return { ...assignmentRecord(), ...exposed };
    },
    async provisionFourDigitPin() {
      return exposed;
    },
  });
  const responses = [
    await controller.list({}),
    await controller.create({}, {}),
    await controller.listRoles({}),
    await controller.assignRole(targetUserId, {}, {}),
    await controller.provisionPin(targetUserId, {}, {}),
  ];
  const serialized = JSON.stringify(responses);
  assert.doesNotMatch(serialized, /plaintextPin|pinHash|salt|token|cookie/iu);
  assert.doesNotMatch(serialized, /hash-value|salt-value|token-value|cookie-value/iu);
  assert.equal(responses[0].items[0].pinConfigured, true);
  assert.equal(responses[1].pinConfigured, true);
  assert.deepEqual(responses[4], { provisioned: true });
});
