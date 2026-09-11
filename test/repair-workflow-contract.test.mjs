import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const [migration, types, port, useCase, repository, controller, moduleSource, api, detail, worklist, seed, runtime] = await Promise.all([
  readFile('src/infrastructure/database/migrations/20260903120000_repairs_create_workflow_transitions.ts', 'utf8'),
  readFile('src/infrastructure/database/database-types.ts', 'utf8'),
  readFile('src/modules/repairs/application/ports/repair-repository.port.ts', 'utf8'),
  readFile('src/modules/repairs/application/use-cases/start-repair-diagnosis.use-case.ts', 'utf8'),
  readFile('src/modules/repairs/infrastructure/persistence/kysely-repair.repository.ts', 'utf8'),
  readFile('src/modules/repairs/presentation/repairs.controller.ts', 'utf8'),
  readFile('src/modules/repairs/repairs.module.ts', 'utf8'),
  readFile('apps/dev-preview-web/src/api.ts', 'utf8'),
  readFile('apps/dev-preview-web/src/pages/RepairDetailPage.tsx', 'utf8'),
  readFile('apps/dev-preview-web/src/pages/RepairsPage.tsx', 'utf8'),
  readFile('scripts/local-db-seed.mjs', 'utf8'),
  readFile('src/infrastructure/database/database-runtime.ts', 'utf8'),
]);

test('D6.1 persists one scoped append-only workflow stream with independent monotonic versioning', () => {
  assert.match(migration, /createTable\('repair_workflow_transitions'\)/u);
  assert.match(migration, /repair_workflow_transitions_repair_scope_fk/u);
  assert.match(migration, /\['tenant_id', 'branch_id', 'repair_id'\]/u);
  assert.match(migration, /command = 'start_diagnosis'/u);
  assert.match(migration, /from_state = 'pending' and to_state = 'diagnosing'/u);
  assert.match(migration, /workflow_version = expected_workflow_version \+ 1/u);
  assert.match(migration, /repair_workflow_transitions_version_uq/u);
  assert.match(migration, /repair_workflow_transitions_request_uq/u);
  assert.match(types, /RepairWorkflowTransitionTable/u);
  assert.match(port, /StartRepairDiagnosisRecord/u);
  assert.match(port, /startRepairDiagnosis/u);
});

test('D6.1 keeps the intentional command implementation but fails its HTTP route closed until a capability is approved', () => {
  assert.match(useCase, /class StartRepairDiagnosisUseCase/u);
  assert.match(useCase, /allowedKeys = Object\.freeze\(\['clientRequestId', 'expectedVersion'\]\)/u);
  assert.match(useCase, /localRepairWorkflowActor/u);
  assert.match(controller, /@Post\(':repairId\/workflow\/start-diagnosis'\)/u);
  assert.doesNotMatch(controller, /@(?:Post|Patch)\([^\n]*status/u);
  assert.doesNotMatch(useCase, /toState.*request|actor.*request|tenantId.*request|branchId.*request/u);
  assert.match(moduleSource, /provide: RepairProtectedOperations/u);
  assert.doesNotMatch(moduleSource, /provide: StartRepairDiagnosisUseCase/u);
  assert.match(controller, /startDiagnosis\(\): never \{[\s\S]*?rejectUncataloguedWrite\(\)/u);
});

test('D6.1 transaction owns history, structured timeline, cache update and fail-closed preconditions atomically', () => {
  assert.match(repository, /#runWorkflowTransaction/u);
  assert.match(repository, /forUpdate\(\)/u);
  assert.match(repository, /repair\.custody_status !== 'active'/u);
  assert.match(repository, /currentState !== 'pending'/u);
  assert.match(repository, /currentVersion !== input\.expectedVersion/u);
  assert.match(repository, /insertInto\('repair_workflow_transitions'\)/u);
  assert.match(repository, /source: 'local\.workflow'/u);
  assert.match(repository, /title: 'Diagnóstico iniciado'/u);
  assert.match(repository, /updateTable\('repairs'\)[\s\S]*?repair_status: 'diagnosing'/u);
  assert.match(repository, /projected_repair_status: workflowTransition\?\.to_state \?\? row\.repair_status/u);
  assert.match(repository, /workflowByRepair\.get\(row\.repair_id\) \?\? row\.repair_status/u);
  assert.match(runtime, /selectFrom\('repair_workflow_transitions'\)/u);
});

test('D6.1 status projection remains visible while the uncataloged write stays hidden', () => {
  assert.match(api, /startRepairDiagnosis/u);
  assert.match(api, /workflow\/start-diagnosis/u);
  assert.match(detail, /repair\.currentSituation\.repairStatus\.label/u);
  assert.doesNotMatch(detail, /startRepairDiagnosis|Iniciar diagnóstico|workflowMessageRef/u);
  assert.match(worklist, /srtaller:repairs-changed/u);
  assert.doesNotMatch(detail, /Cambiar estado/u);
  assert.match(detail, /repair\.currentSituation\.location\?\.label \?\? 'Sin registrar'/u);
  assert.match(detail, /currentTechnician\?\.displayName \?\? 'Sin asignar'/u);
  assert.match(detail, /repair\.timeline\.items\.map[\s\S]*RepairTimelineEntry/u);
});

test('D6.1 seed declares deterministic diagnosing history without widening the writable catalog', () => {
  assert.match(seed, /localRepairWorkflowTransitionRows/u);
  assert.match(useCase, /fromState: 'pending'/u);
  assert.match(useCase, /toState: 'diagnosing'/u);
  assert.doesNotMatch(migration, /repairing|reviewing|ready|unsuccessful|cancelled|delivered/u);
});

test('StartRepairDiagnosisUseCase validates exact payload and supplies trusted local actor server-side', async () => {
  const {
    StartRepairDiagnosisInputError,
    StartRepairDiagnosisUseCase,
    localRepairWorkflowActor,
  } = await import('../dist/modules/repairs/application/use-cases/start-repair-diagnosis.use-case.js');
  let captured;
  const repository = {
    async startRepairDiagnosis(scope, input) {
      captured = { scope, input };
      return input;
    },
  };
  const ids = [
    '90000000-0000-4000-8000-000000000001',
    '90000000-0000-4000-8000-000000000002',
  ];
  const subject = new StartRepairDiagnosisUseCase(
    repository,
    () => ({ tenantId: '10000000-0000-4000-8000-000000000001', branchId: 'a0000000-0000-4000-8000-000000000001' }),
    () => new Date('2026-09-03T12:00:00.000Z'),
    () => ids.shift(),
  );
  const result = await subject.execute({
    repairId: '30000000-0000-4000-8000-000000000001',
    request: { clientRequestId: '80000000-0000-4000-8000-000000000001', expectedVersion: 0 },
  });
  assert.equal(result.actorId, localRepairWorkflowActor.id);
  assert.equal(captured.input.actorDisplayName, 'Operador sintético');
  assert.equal(result.workflowVersion, 1);
  await assert.rejects(
    subject.execute({ repairId: 'not-a-uuid', request: { clientRequestId: '80000000-0000-4000-8000-000000000001', expectedVersion: 0 } }),
    StartRepairDiagnosisInputError,
  );
  await assert.rejects(
    subject.execute({ repairId: '30000000-0000-4000-8000-000000000001', request: { clientRequestId: '80000000-0000-4000-8000-000000000001', expectedVersion: 0, actor: 'forged' } }),
    StartRepairDiagnosisInputError,
  );
});
