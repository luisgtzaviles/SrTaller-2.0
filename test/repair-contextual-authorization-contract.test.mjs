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
  commitGuard: Object.freeze({
    async confirmCurrent() { return true; },
    async confirmTemporalCurrent() { return true; },
  }),
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
  assert.match(operationsSource, /capability: 'repairs\.create'[\s\S]*?kind: 'state-change'/u);
  assert.match(operationsSource, /capability: 'repairs\.correct_intake'[\s\S]*?kind: 'state-change'/u);
  assert.match(operationsSource, /ContextualAuthorizationExecutor/u);
  assert.match(operationsSource, /this\.authorization\.execute/u);
  assert.doesNotMatch(controllerSource, /repairs\.read|repairs\.add_note/u);
  assert.doesNotMatch(controllerSource, /tenantId|branchId|stationId|sessionId|userId/u);
});

test('every Repairs HTTP endpoint belongs to the exact closed authorization matrix', () => {
  assert.deepEqual(registeredRepairRoutes(), [
    { handler: 'getWorklist', method: 'GET', path: '/' },
    { handler: 'createRepair', method: 'POST', path: '/' },
    { handler: 'getDetail', method: 'GET', path: ':id' },
    { handler: 'correctEquipment', method: 'POST', path: ':repairId/equipment-correction' },
    { handler: 'getEvidenceContent', method: 'GET', path: ':repairId/evidence/:evidenceId/content' },
    { handler: 'moveToWorkshop', method: 'POST', path: ':repairId/location/move-to-workshop' },
    { handler: 'addOperationalNote', method: 'POST', path: ':repairId/notes' },
    { handler: 'addProblemClassification', method: 'POST', path: ':repairId/problem-classifications/:categoryId' },
    { handler: 'removeProblemClassification', method: 'POST', path: ':repairId/problem-classifications/:categoryId/remove' },
    { handler: 'assignTechnician', method: 'POST', path: ':repairId/technician-assignment' },
    { handler: 'reassignTechnician', method: 'POST', path: ':repairId/technician-reassignment' },
    { handler: 'unassignTechnician', method: 'POST', path: ':repairId/technician-unassignment' },
    { handler: 'startDiagnosis', method: 'POST', path: ':repairId/workflow/start-diagnosis' },
    { handler: 'getOperationalRepairBrands', method: 'GET', path: 'brands' },
    { handler: 'getAdminRepairBrands', method: 'GET', path: 'configuration/catalogs/brands' },
    { handler: 'createRepairBrand', method: 'POST', path: 'configuration/catalogs/brands' },
    { handler: 'renameRepairBrand', method: 'PUT', path: 'configuration/catalogs/brands/:brandId' },
    { handler: 'deactivateRepairBrand', method: 'POST', path: 'configuration/catalogs/brands/:brandId/deactivate' },
    { handler: 'reactivateRepairBrand', method: 'POST', path: 'configuration/catalogs/brands/:brandId/reactivate' },
    { handler: 'getPendingRepairBrands', method: 'GET', path: 'configuration/catalogs/brands/pending' },
    { handler: 'resolvePendingRepairBrand', method: 'POST', path: 'configuration/catalogs/brands/pending/:pendingBrandValueId/resolve' },
    { handler: 'getAdminRepairDeviceTypes', method: 'GET', path: 'configuration/catalogs/device-types' },
    { handler: 'createRepairDeviceType', method: 'POST', path: 'configuration/catalogs/device-types' },
    { handler: 'renameRepairDeviceType', method: 'PUT', path: 'configuration/catalogs/device-types/:deviceTypeId' },
    { handler: 'deactivateRepairDeviceType', method: 'POST', path: 'configuration/catalogs/device-types/:deviceTypeId/deactivate' },
    { handler: 'reactivateRepairDeviceType', method: 'POST', path: 'configuration/catalogs/device-types/:deviceTypeId/reactivate' },
    { handler: 'getPendingRepairDeviceTypes', method: 'GET', path: 'configuration/catalogs/device-types/pending' },
    { handler: 'resolvePendingRepairDeviceType', method: 'POST', path: 'configuration/catalogs/device-types/pending/:pendingDeviceTypeValueId/resolve' },
    { handler: 'getAdminRepairModels', method: 'GET', path: 'configuration/catalogs/models' },
    { handler: 'createRepairModel', method: 'POST', path: 'configuration/catalogs/models' },
    { handler: 'renameRepairModel', method: 'PUT', path: 'configuration/catalogs/models/:modelId' },
    { handler: 'deactivateRepairModel', method: 'POST', path: 'configuration/catalogs/models/:modelId/deactivate' },
    { handler: 'reactivateRepairModel', method: 'POST', path: 'configuration/catalogs/models/:modelId/reactivate' },
    { handler: 'getPendingRepairModels', method: 'GET', path: 'configuration/catalogs/models/pending' },
    { handler: 'resolvePendingRepairModel', method: 'POST', path: 'configuration/catalogs/models/pending/:pendingModelValueId/resolve' },
    { handler: 'getAdminProblemCategories', method: 'GET', path: 'configuration/catalogs/problem-categories' },
    { handler: 'createProblemCategory', method: 'POST', path: 'configuration/catalogs/problem-categories' },
    { handler: 'renameProblemCategory', method: 'PUT', path: 'configuration/catalogs/problem-categories/:categoryId' },
    { handler: 'deleteProblemCategory', method: 'DELETE', path: 'configuration/catalogs/problem-categories/:categoryId' },
    { handler: 'deactivateProblemCategory', method: 'POST', path: 'configuration/catalogs/problem-categories/:categoryId/deactivate' },
    { handler: 'reactivateProblemCategory', method: 'POST', path: 'configuration/catalogs/problem-categories/:categoryId/reactivate' },
    { handler: 'getPendingProblems', method: 'GET', path: 'configuration/catalogs/problem-categories/pending' },
    { handler: 'resolvePendingProblem', method: 'POST', path: 'configuration/catalogs/problem-categories/pending/:pendingProblemValueId/resolve' },
    { handler: 'getAdminRepairRisks', method: 'GET', path: 'configuration/catalogs/risks' },
    { handler: 'createRepairRisk', method: 'POST', path: 'configuration/catalogs/risks' },
    { handler: 'renameRepairRisk', method: 'PUT', path: 'configuration/catalogs/risks/:riskId' },
    { handler: 'deactivateRepairRisk', method: 'POST', path: 'configuration/catalogs/risks/:riskId/deactivate' },
    { handler: 'reactivateRepairRisk', method: 'POST', path: 'configuration/catalogs/risks/:riskId/reactivate' },
    { handler: 'getAdminNewRepairPolicy', method: 'GET', path: 'configuration/new-repair-policy' },
    { handler: 'updateNewRepairPolicy', method: 'PUT', path: 'configuration/new-repair-policy' },
    { handler: 'resetNewRepairPolicy', method: 'POST', path: 'configuration/new-repair-policy/reset' },
    { handler: 'searchCustomers', method: 'GET', path: 'customer-lookup' },
    { handler: 'getOperationalRepairDeviceTypes', method: 'GET', path: 'device-types' },
    { handler: 'getOperationalRepairModels', method: 'GET', path: 'models' },
    { handler: 'getOperationalNewRepairPolicy', method: 'GET', path: 'new-repair-policy' },
    { handler: 'getIntakeProblemCategories', method: 'GET', path: 'new-repair/problem-categories' },
    { handler: 'searchPreviousRepairs', method: 'GET', path: 'previous-repair-lookup' },
    { handler: 'getOperationalProblemCategories', method: 'GET', path: 'problem-categories' },
    { handler: 'getOperationalRepairRisks', method: 'GET', path: 'risks' },
    { handler: 'getTechnicians', method: 'GET', path: 'technicians' },
  ]);
});

test('RepairsModule composes Access and the public Stations timezone contract', () => {
  assert.match(moduleSource, /imports: \[AccessModule, CustomersModule, StationsModule\]/u);
  assert.match(moduleSource, /CONTEXTUAL_AUTHORIZATION_EXECUTOR/u);
  assert.match(moduleSource, /BRANCH_SETTINGS_RUNTIME/u);
  assert.match(moduleSource, /CUSTOMER_INTAKE_RUNTIME/u);
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
  const branchSettingsCalls = [];
  const authorization = {
    async execute(evidence, requirement, operation) {
      authorizationCalls.push({ evidence, requirement });
      return operation({ ...authorizedContext, capability: requirement.capability });
    },
  };
  const repository = {
    async listWorklist(scope, query, timeZone) {
      repositoryCalls.push({ operation: 'list', scope, query, timeZone });
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
        actorId: scope.actorUserId,
        actorDisplayName: scope.actorDisplayName,
        title: 'Nota',
        body: note.body,
        source: 'repairs.operational_note',
        attribution: null,
      };
    },
    async listEffectiveActiveBrands(scope, query) {
      repositoryCalls.push({ operation: 'brand-autocomplete', scope, query });
      return [];
    },
    async listAdminBrands(scope) {
      repositoryCalls.push({ operation: 'brand-admin', scope });
      return [];
    },
    async listPendingBrands(scope) {
      repositoryCalls.push({ operation: 'brand-pending', scope });
      return [];
    },
    async createBrand(scope, input) {
      repositoryCalls.push({ operation: 'brand-create', scope, input });
      return { brandId: input.brandId, code: null, canonicalLabel: input.canonicalLabel, normalizedKey: input.normalizedKey, scope: 'tenant', status: 'active', version: 1, usageCount: 0, createdAt: input.occurredAt.toISOString(), updatedAt: input.occurredAt.toISOString() };
    },
    async deleteProblemCategory(scope, input) {
      repositoryCalls.push({ operation: 'problem-category-delete', scope, input });
      return { categoryId: input.categoryId, previousLabel: 'QA', scope: 'tenant', version: input.expectedVersion, deletedAt: input.occurredAt.toISOString() };
    },
  };
  const operations = new RepairProtectedOperations(
    authorization,
    repository,
    { async read() { return undefined; } },
    {
      async readTimeZone(scope) {
        branchSettingsCalls.push(scope);
        return { timeZone: 'America/Hermosillo' };
      },
    },
  );

  await operations.listRepairs(requestEvidence, {
    page: '1',
    tenantId: '20000000-0000-4000-8000-000000000001',
    branchId: 'b0000000-0000-4000-8000-000000000001',
  });
  await operations.searchPreviousRepairs(requestEvidence, 'SR-2026');
  await assert.rejects(operations.getRepairDetail(requestEvidence, {
    repairId: '30000000-0000-4000-8000-000000000001',
  }));
  await assert.rejects(operations.getRepairEvidenceContent(requestEvidence, {
    repairId: '30000000-0000-4000-8000-000000000001',
    evidenceId: '70000000-0000-4000-8000-000000000001',
  }));
  await operations.listRepairTechnicians(requestEvidence);
  await operations.listOperationalRepairBrands(requestEvidence, 'app');
  await operations.listAdminRepairBrands(requestEvidence);
  await operations.listPendingRepairBrands(requestEvidence);
  await operations.createRepairBrand(requestEvidence, { canonicalLabel: 'Apple' });
  await operations.deleteProblemCategory(requestEvidence, { categoryId: '70000000-0000-4000-8000-000000000001', expectedVersion: 1 });
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
      { capability: 'repairs.create', kind: 'read' },
      { capability: 'repairs.read', kind: 'read' },
      { capability: 'repairs.read', kind: 'read' },
      { capability: 'repairs.read', kind: 'read' },
      { capability: 'repairs.create', kind: 'read' },
      { capability: 'repairs.catalogs.read', kind: 'read' },
      { capability: 'repairs.catalogs.read', kind: 'read' },
      { capability: 'repairs.catalogs.manage', kind: 'state-change' },
      { capability: 'repairs.catalogs.manage', kind: 'state-change' },
      { capability: 'repairs.add_note', kind: 'state-change' },
    ],
  );
  assert.ok(authorizationCalls.every(({ evidence }) => evidence === requestEvidence));
  assert.ok(repositoryCalls.every(({ scope }) => (
    scope.tenantId === authorizedContext.tenantId &&
    scope.branchId === authorizedContext.branchId
  )));
  assert.deepEqual(branchSettingsCalls, [
    { tenantId: authorizedContext.tenantId, branchId: authorizedContext.branchId },
    { tenantId: authorizedContext.tenantId, branchId: authorizedContext.branchId },
  ]);
  assert.equal(repositoryCalls[0].timeZone, 'America/Hermosillo');
  const noteCall = repositoryCalls.find(({ operation }) => operation === 'note');
  assert.deepEqual(noteCall.scope, {
    tenantId: authorizedContext.tenantId,
    branchId: authorizedContext.branchId,
    stationId: authorizedContext.stationId,
    sessionId: authorizedContext.sessionId,
    actorUserId: authorizedContext.userId,
    actorDisplayName: authorizedContext.userDisplayName,
    capability: 'repairs.add_note',
    commitGuard: authorizedContext.commitGuard,
  });
  assert.equal(noteCall.note.stationId, undefined);
  assert.equal(noteCall.note.sessionId, undefined);
  assert.equal(noteCall.note.actorUserId, undefined);
  assert.equal(noteCall.note.actorDisplayName, undefined);
  assert.equal(noteCall.note.capability, undefined);
  assert.equal(noteCall.note.action, 'repair.operational_note.added');
  assert.equal(noteCall.note.resourceType, 'repair');
  assert.equal(noteCall.note.result, 'succeeded');
  assert.notEqual(noteCall.note.correlationId, noteCall.note.clientRequestId);
  assert.equal(repositoryCalls[0].query.tenantId, undefined);
  assert.equal(repositoryCalls[0].query.branchId, undefined);
  const previousRepairLookup = repositoryCalls.find(({ operation, query }) => operation === 'list' && query.q === 'SR-2026');
  assert.ok(previousRepairLookup);
  assert.equal(previousRepairLookup.query.pageSize, 8);
  assert.equal(previousRepairLookup.query.tenantId, undefined);
  assert.equal(previousRepairLookup.query.branchId, undefined);
  const brandAutocomplete = repositoryCalls.find(({ operation }) => operation === 'brand-autocomplete');
  assert.equal(brandAutocomplete.query, 'app');
  const brandCreate = repositoryCalls.find(({ operation }) => operation === 'brand-create');
  assert.equal(brandCreate.scope.capability, 'repairs.catalogs.manage');
  assert.equal(brandCreate.scope.actorUserId, authorizedContext.userId);
  const categoryDelete = repositoryCalls.find(({ operation }) => operation === 'problem-category-delete');
  assert.equal(categoryDelete.scope.capability, 'repairs.catalogs.manage');
  assert.equal(categoryDelete.scope.tenantId, authorizedContext.tenantId);
  assert.equal(categoryDelete.input.expectedVersion, 1);
});

test('uncatalogued D5 and D6 HTTP commands fail closed before authorization or repository effects', () => {
  let authorizationCalls = 0;
  const operations = new RepairProtectedOperations(
    { async execute() { authorizationCalls += 1; throw new Error('must not execute'); } },
    {},
    { async read() { throw new Error('must not read'); } },
    { async readTimeZone() { throw new Error('must not read'); } },
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
