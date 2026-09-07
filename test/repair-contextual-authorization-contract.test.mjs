import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import {
  ForbiddenException,
  RequestMethod,
  UnauthorizedException,
} from '@nestjs/common';
import { METHOD_METADATA, PATH_METADATA } from '@nestjs/common/constants.js';

const [operationsSource, controllerSource, moduleSource] = await Promise.all([
  readFile('src/modules/repairs/application/repair-protected-operations.ts', 'utf8'),
  readFile('src/modules/repairs/presentation/repairs.controller.ts', 'utf8'),
  readFile('src/modules/repairs/repairs.module.ts', 'utf8'),
]);

const {
  ContextualAuthorizationError,
} = await import('../dist/modules/access/index.js');
const {
  RepairOperationAccessDeniedError,
  RepairProtectedOperations,
} = await import('../dist/modules/repairs/application/repair-protected-operations.js');
const {
  RepairsController,
  repairProtectedRequestEvidence,
} = await import('../dist/modules/repairs/presentation/repairs.controller.js');

function registeredRepairRoutes() {
  return Object.getOwnPropertyNames(RepairsController.prototype)
    .flatMap((methodName) => {
      if (methodName === 'constructor') return [];
      const handler = RepairsController.prototype[methodName];
      if (typeof handler !== 'function') return [];
      const path = Reflect.getMetadata(PATH_METADATA, handler);
      const method = Reflect.getMetadata(METHOD_METADATA, handler);
      if (typeof path !== 'string' || typeof method !== 'number') return [];
      return [{ handler: methodName, method: RequestMethod[method], path }];
    })
    .sort((left, right) => (
      left.path < right.path ? -1 : left.path > right.path ? 1 : 0
    ));
}

const authorizedContext = Object.freeze({
  tenantId: '10000000-0000-4000-8000-000000000001',
  branchId: 'a0000000-0000-4000-8000-000000000001',
  stationId: 'a1000000-0000-4000-8000-000000000001',
  sessionId: 'a2000000-0000-4000-8000-000000000001',
  userId: 'a3000000-0000-4000-8000-000000000001',
  userDisplayName: 'Ada Operadora',
  capability: 'repairs.read',
});

const requestEvidence = Object.freeze({
  cookieHeader: 'sr_session=opaque',
  origin: 'http://127.0.0.1:4173',
  host: '127.0.0.1:4173',
  forwardedProto: undefined,
  fetchSite: 'same-origin',
  contentType: 'application/json',
  csrfToken: 'csrf-value',
});

test('Repairs owns a fixed operation-to-capability policy behind the Access public contract', () => {
  assert.match(operationsSource, /capability: 'repairs\.read'[\s\S]*?kind: 'read'/u);
  assert.match(operationsSource, /capability: 'repairs\.add_note'[\s\S]*?kind: 'state-change'/u);
  assert.match(operationsSource, /ContextualAuthorizationExecutor/u);
  assert.match(operationsSource, /this\.authorization\.execute/u);
  assert.doesNotMatch(controllerSource, /repairs\.read|repairs\.add_note/u);
  assert.doesNotMatch(controllerSource, /tenantId|branchId|stationId|sessionId|userId/u);
});

test('every Repairs HTTP endpoint belongs to the exact closed authorization matrix', () => {
  assert.deepEqual(registeredRepairRoutes(), [
    { handler: 'getWorklist', method: 'GET', path: '/' },
    { handler: 'getDetail', method: 'GET', path: ':id' },
    { handler: 'getEvidenceContent', method: 'GET', path: ':repairId/evidence/:evidenceId/content' },
    { handler: 'moveToWorkshop', method: 'POST', path: ':repairId/location/move-to-workshop' },
    { handler: 'addOperationalNote', method: 'POST', path: ':repairId/notes' },
    { handler: 'assignTechnician', method: 'POST', path: ':repairId/technician-assignment' },
    { handler: 'reassignTechnician', method: 'POST', path: ':repairId/technician-reassignment' },
    { handler: 'unassignTechnician', method: 'POST', path: ':repairId/technician-unassignment' },
    { handler: 'startDiagnosis', method: 'POST', path: ':repairId/workflow/start-diagnosis' },
    { handler: 'getTechnicians', method: 'GET', path: 'technicians' },
  ]);
});

test('RepairsModule composes Access and no longer wires LocalRepairContext or uncatalogued writes', () => {
  assert.match(moduleSource, /imports: \[AccessModule\]/u);
  assert.match(moduleSource, /CONTEXTUAL_AUTHORIZATION_EXECUTOR/u);
  assert.match(moduleSource, /provide: RepairProtectedOperations/u);
  assert.doesNotMatch(moduleSource, /LocalRepairContext/u);
  assert.doesNotMatch(
    moduleSource,
    /provide: (?:AssignRepairTechnicianUseCase|ReassignRepairTechnicianUseCase|UnassignRepairTechnicianUseCase|StartRepairDiagnosisUseCase|MoveRepairToWorkshopUseCase)/u,
  );
});

test('authorized repairs operations use only the trusted scope and exact fixed capabilities', async () => {
  const authorizationCalls = [];
  const repositoryCalls = [];
  const authorization = {
    async execute(evidence, requirement, operation) {
      authorizationCalls.push({ evidence, requirement });
      return operation({ ...authorizedContext, capability: requirement.capability });
    },
  };
  const repository = {
    async listWorklist(scope, query) {
      repositoryCalls.push({ operation: 'list', scope, query });
      return {
        items: [],
        page: query.page,
        pageSize: query.pageSize,
        totalCount: 0,
        unfilteredCount: 0,
        hasNextPage: false,
        technicians: [],
      };
    },
    async getRepairById(scope) {
      repositoryCalls.push({ operation: 'detail', scope });
      return undefined;
    },
    async getRepairEvidenceById(scope) {
      repositoryCalls.push({ operation: 'evidence', scope });
      return undefined;
    },
    async listEligibleTechnicians(scope) {
      repositoryCalls.push({ operation: 'technicians', scope });
      return [];
    },
    async addOperationalNote(scope, note) {
      repositoryCalls.push({ operation: 'note', scope, note });
      return {
        id: note.entryId,
        occurredAt: note.occurredAt.toISOString(),
        type: 'note',
        actorId: note.actorUserId,
        actorDisplayName: note.actorDisplayName,
        title: 'Nota',
        body: note.body,
        source: 'repairs.operational_note',
        attribution: null,
      };
    },
  };
  const operations = new RepairProtectedOperations(
    authorization,
    repository,
    { async read() { return undefined; } },
  );

  await operations.listRepairs(requestEvidence, {
    page: '1',
    tenantId: '20000000-0000-4000-8000-000000000001',
    branchId: 'b0000000-0000-4000-8000-000000000001',
  });
  await assert.rejects(operations.getRepairDetail(requestEvidence, {
    repairId: '30000000-0000-4000-8000-000000000001',
  }));
  await assert.rejects(operations.getRepairEvidenceContent(requestEvidence, {
    repairId: '30000000-0000-4000-8000-000000000001',
    evidenceId: '70000000-0000-4000-8000-000000000001',
  }));
  await operations.listRepairTechnicians(requestEvidence);
  await operations.addRepairOperationalNote(requestEvidence, {
    repairId: '30000000-0000-4000-8000-000000000001',
    request: {
      body: 'Nota autorizada',
      clientRequestId: '90000000-0000-4000-8000-000000000001',
    },
  });

  assert.deepEqual(
    authorizationCalls.map(({ requirement }) => requirement),
    [
      { capability: 'repairs.read', kind: 'read' },
      { capability: 'repairs.read', kind: 'read' },
      { capability: 'repairs.read', kind: 'read' },
      { capability: 'repairs.read', kind: 'read' },
      { capability: 'repairs.add_note', kind: 'state-change' },
    ],
  );
  assert.ok(authorizationCalls.every(({ evidence }) => evidence === requestEvidence));
  assert.ok(repositoryCalls.every(({ scope }) => (
    scope.tenantId === authorizedContext.tenantId &&
    scope.branchId === authorizedContext.branchId
  )));
  const noteCall = repositoryCalls.find(({ operation }) => operation === 'note');
  assert.deepEqual(noteCall.scope, {
    tenantId: authorizedContext.tenantId,
    branchId: authorizedContext.branchId,
    stationId: authorizedContext.stationId,
    sessionId: authorizedContext.sessionId,
    actorUserId: authorizedContext.userId,
    actorDisplayName: authorizedContext.userDisplayName,
    capability: 'repairs.add_note',
  });
  assert.equal(noteCall.note.stationId, authorizedContext.stationId);
  assert.equal(noteCall.note.sessionId, authorizedContext.sessionId);
  assert.equal(noteCall.note.actorUserId, authorizedContext.userId);
  assert.equal(noteCall.note.actorDisplayName, authorizedContext.userDisplayName);
  assert.equal(noteCall.note.capability, 'repairs.add_note');
  assert.equal(noteCall.note.action, 'repair.operational_note.added');
  assert.equal(noteCall.note.resourceType, 'repair');
  assert.equal(noteCall.note.result, 'succeeded');
  assert.notEqual(noteCall.note.correlationId, noteCall.note.clientRequestId);
  assert.equal(repositoryCalls[0].query.tenantId, undefined);
  assert.equal(repositoryCalls[0].query.branchId, undefined);
});

test('uncatalogued D5 and D6 HTTP commands fail closed before authorization or repository effects', () => {
  let authorizationCalls = 0;
  const operations = new RepairProtectedOperations(
    { async execute() { authorizationCalls += 1; throw new Error('must not execute'); } },
    {},
    { async read() { throw new Error('must not read'); } },
  );
  assert.throws(
    () => operations.rejectUncataloguedWrite(),
    RepairOperationAccessDeniedError,
  );
  assert.equal(authorizationCalls, 0);

  const controller = new RepairsController(operations);
  for (const command of [
    () => controller.assignTechnician(),
    () => controller.reassignTechnician(),
    () => controller.unassignTechnician(),
    () => controller.startDiagnosis(),
    () => controller.moveToWorkshop(),
  ]) {
    assert.throws(command, (error) => (
      error instanceof ForbiddenException &&
      error.getStatus() === 403 &&
      error.getResponse().code === 'ACCESS_DENIED'
    ));
  }
  assert.equal(authorizationCalls, 0);
});

test('controller projects only the approved transport evidence and sanitizes authorization failures', async () => {
  assert.deepEqual(
    repairProtectedRequestEvidence({
      Cookie: 'sr_session=opaque',
      Origin: 'http://127.0.0.1:4173',
      Host: '127.0.0.1:4173',
      'X-Forwarded-Proto': 'http',
      'Sec-Fetch-Site': 'same-origin',
      'Content-Type': 'application/json; charset=utf-8',
      'X-SR-CSRF-Token': 'csrf-value',
      'x-ignored-authority': 'forged',
    }),
    {
      cookieHeader: 'sr_session=opaque',
      origin: 'http://127.0.0.1:4173',
      host: '127.0.0.1:4173',
      forwardedProto: 'http',
      fetchSite: 'same-origin',
      contentType: 'application/json; charset=utf-8',
      csrfToken: 'csrf-value',
    },
  );

  const unauthenticated = new RepairsController({
    async listRepairs() {
      throw new ContextualAuthorizationError('AUTHENTICATION_REQUIRED');
    },
  });
  await assert.rejects(
    unauthenticated.getWorklist({}, {}),
    (error) => (
      error instanceof UnauthorizedException &&
      error.getStatus() === 401 &&
      error.getResponse().code === 'AUTHENTICATION_REQUIRED'
    ),
  );

  const unauthorized = new RepairsController({
    async listRepairs() {
      throw new ContextualAuthorizationError('ACCESS_DENIED');
    },
  });
  await assert.rejects(
    unauthorized.getWorklist({}, {}),
    (error) => (
      error instanceof ForbiddenException &&
      error.getStatus() === 403 &&
      error.getResponse().code === 'ACCESS_DENIED'
    ),
  );
  assert.doesNotMatch(controllerSource, /error\.message|error\.stack/u);
  assert.ok((controllerSource.match(/'private, no-store'/gu) ?? []).length >= 8);
});
