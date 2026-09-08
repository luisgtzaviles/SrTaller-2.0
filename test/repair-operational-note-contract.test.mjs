import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const useCaseSource = await readFile('src/modules/repairs/application/use-cases/add-repair-operational-note.use-case.ts', 'utf8');
const portSource = await readFile('src/modules/repairs/application/ports/repair-repository.port.ts', 'utf8');
const repositorySource = await readFile('src/modules/repairs/infrastructure/persistence/kysely-repair.repository.ts', 'utf8');
const controllerSource = await readFile('src/modules/repairs/presentation/repairs.controller.ts', 'utf8');
const correlationFilterSource = await readFile('src/infrastructure/runtime/http-correlation-exception.filter.ts', 'utf8');
const appModuleSource = await readFile('src/app.module.ts', 'utf8');
const migrationSource = await readFile('src/infrastructure/database/migrations/20260820090000_repairs_add_operational_note_idempotency.ts', 'utf8');
const timelineMigrationSource = await readFile('src/infrastructure/database/migrations/20260819140000_repairs_create_timeline_entries.ts', 'utf8');
const apiSource = await readFile('apps/dev-preview-web/src/api.ts', 'utf8');
const detailPageSource = await readFile('apps/dev-preview-web/src/pages/RepairDetailPage.tsx', 'utf8');
const pageStylesSource = await readFile('apps/dev-preview-web/src/pages/pages.module.css', 'utf8');
const dashboardSource = await readFile('apps/dev-preview-web/src/pages/DashboardPage.tsx', 'utf8');
const {
  AddRepairOperationalNoteConflictError,
  AddRepairOperationalNoteUseCase,
} = await import('../dist/modules/repairs/application/use-cases/add-repair-operational-note.use-case.js');
const { RepairOperationalNoteIdempotencyConflictError } = await import(
  '../dist/modules/repairs/application/ports/repair-repository.port.js'
);

test('operational note input is strict, trimmed, bounded, and server-owned', () => {
  assert.match(useCaseSource, /allowedRequestKeys = Object\.freeze\(\['body', 'clientRequestId'\]\)/u);
  assert.match(useCaseSource, /Object\.keys\(request\)\.some/u);
  assert.match(useCaseSource, /request\.body\.trim\(\)/u);
  assert.match(useCaseSource, /repairOperationalNoteBodyMinLength = 3/u);
  assert.match(useCaseSource, /repairOperationalNoteBodyMaxLength = 4000/u);
  assert.match(useCaseSource, /canonicalUuid\.test\(request\.clientRequestId\)/u);
  assert.match(useCaseSource, /const context = trustedContext\(this\.resolveContext\(\)\)/u);
  assert.match(useCaseSource, /const auditEventId = this\.createId\(\)/u);
  assert.match(useCaseSource, /const correlationId = this\.createId\(\)/u);
  assert.match(useCaseSource, /this\.repository\.addOperationalNote\(context,/u);
  assert.match(useCaseSource, /value\.commitGuard\.confirmCurrent/u);
  assert.match(useCaseSource, /action: 'repair\.operational_note\.added'/u);
  assert.match(useCaseSource, /resourceType: 'repair'/u);
  assert.match(useCaseSource, /result: 'succeeded'/u);
  assert.doesNotMatch(useCaseSource, /localOperationalNoteActor/u);
  assert.match(useCaseSource, /RepairOperationalNoteIdempotencyConflictError/u);
  assert.match(useCaseSource, /throw new AddRepairOperationalNoteConflictError\(\)/u);
  assert.match(useCaseSource, /private readonly now: \(\) => Date = \(\) => new Date\(\)/u);
  assert.match(useCaseSource, /private readonly createId: \(\) => string = randomUUID/u);
  assert.doesNotMatch(useCaseSource, /console\.|logger|log\(/iu);
});

test('repository atomically persists one scoped note and one append-only audit event', () => {
  assert.match(portSource, /addOperationalNote\([\s\S]*?scope: RepairOperationalNoteContext,[\s\S]*?note: AddRepairOperationalNoteRecord/u);
  const transactionHelper = repositorySource.slice(
    repositorySource.indexOf('async #runOperationalNoteTransaction'),
    repositorySource.indexOf('async listWorklist'),
  );
  assert.match(transactionHelper, /this\.executeTransaction\(operation\)/u);
  const writeMethod = repositorySource.slice(
    repositorySource.indexOf('async addOperationalNote'),
    repositorySource.indexOf('async listEligibleTechnicians'),
  );
  assert.match(writeMethod, /#runOperationalNoteTransaction/u);
  assert.match(writeMethod, /where\('tenant_id', '=', validatedScope\.tenantId\)[\s\S]*?where\('branch_id', '=', validatedScope\.branchId\)[\s\S]*?where\('repair_id', '=', note\.repairId\)/u);
  assert.match(writeMethod, /\.forUpdate\(\)/u);
  assert.match(writeMethod, /insertInto\('repair_timeline_entries'\)/u);
  assert.match(writeMethod, /insertInto\('repair_business_audit_events'\)/u);
  assert.match(writeMethod, /entry_type: 'note'/u);
  assert.match(writeMethod, /title: 'Nota'/u);
  assert.match(writeMethod, /client_request_id: note\.clientRequestId/u);
  assert.match(writeMethod, /source: operationalNoteTimelineSource/u);
  assert.match(writeMethod, /audit_id: note\.auditEventId/u);
  assert.match(writeMethod, /correlation_id: note\.correlationId/u);
  assert.match(writeMethod, /actor_user_id: scope\.actorUserId/u);
  assert.match(writeMethod, /station_id: scope\.stationId/u);
  assert.match(writeMethod, /session_id: scope\.sessionId/u);
  assert.match(writeMethod, /scope\.commitGuard\.confirmCurrent\(transactionContext\)/u);
  assert.match(writeMethod, /insertInto\('repair_operational_note_request_guards'\)/u);
  assert.match(writeMethod, /existing\.body !== note\.body/u);
  assert.match(writeMethod, /RepairOperationalNoteIdempotencyConflictError/u);
  assert.match(writeMethod, /RepairOperationalNoteAuditIntegrityError/u);
  assert.doesNotMatch(writeMethod, /updateTable|deleteFrom|upsert/iu);
});

test('use case derives actor/context and authoritative correlation server-side', async () => {
  const calls = [];
  const context = Object.freeze({
    tenantId: '10000000-0000-4000-8000-000000000001',
    branchId: 'a0000000-0000-4000-8000-000000000001',
    stationId: 'a1000000-0000-4000-8000-000000000001',
    sessionId: 'a2000000-0000-4000-8000-000000000001',
    actorUserId: 'a3000000-0000-4000-8000-000000000001',
    actorDisplayName: 'Ada Operadora',
    capability: 'repairs.add_note',
    commitGuard: Object.freeze({ async confirmCurrent() { return true; } }),
  });
  const generatedIds = [
    'b0000000-0000-4000-8000-000000000001',
    'b1000000-0000-4000-8000-000000000001',
    'b2000000-0000-4000-8000-000000000001',
  ];
  const repository = {
    async addOperationalNote(scope, note) {
      calls.push({ scope, note });
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
  };
  const useCase = new AddRepairOperationalNoteUseCase(
    repository,
    () => context,
    () => new Date('2026-09-07T20:30:00.000Z'),
    () => generatedIds.shift(),
  );
  const clientRequestId = '90000000-0000-4000-8000-000000000001';
  const result = await useCase.execute({
    repairId: '30000000-0000-4000-8000-000000000001',
    request: { body: '  Nota atribuida  ', clientRequestId },
  });

  assert.equal(result.actorId, context.actorUserId);
  assert.equal(calls.length, 1);
  assert.deepEqual(calls[0].scope, context);
  assert.deepEqual(calls[0].note, {
    repairId: '30000000-0000-4000-8000-000000000001',
    entryId: 'b0000000-0000-4000-8000-000000000001',
    auditEventId: 'b1000000-0000-4000-8000-000000000001',
    correlationId: 'b2000000-0000-4000-8000-000000000001',
    clientRequestId,
    body: 'Nota atribuida',
    action: 'repair.operational_note.added',
    resourceType: 'repair',
    result: 'succeeded',
    occurredAt: new Date('2026-09-07T20:30:00.000Z'),
  });
  assert.notEqual(calls[0].note.correlationId, clientRequestId);
  await assert.rejects(
    useCase.execute({
      repairId: '30000000-0000-4000-8000-000000000001',
      request: {
        body: 'Intento forjado',
        clientRequestId: '90000000-0000-4000-8000-000000000002',
        actorUserId: 'forged',
      },
    }),
    (error) => error?.parameter === 'payload',
  );
});

test('use case maps a conflicting idempotency retry without leaking persistence errors', async () => {
  const repository = {
    async addOperationalNote() {
      throw new RepairOperationalNoteIdempotencyConflictError();
    },
  };
  const useCase = new AddRepairOperationalNoteUseCase(
    repository,
    () => ({
      tenantId: '10000000-0000-4000-8000-000000000001',
      branchId: 'a0000000-0000-4000-8000-000000000001',
      stationId: 'a1000000-0000-4000-8000-000000000001',
      sessionId: 'a2000000-0000-4000-8000-000000000001',
      actorUserId: 'a3000000-0000-4000-8000-000000000001',
      actorDisplayName: 'Ada Operadora',
      capability: 'repairs.add_note',
      commitGuard: Object.freeze({ async confirmCurrent() { return true; } }),
    }),
  );
  await assert.rejects(
    useCase.execute({
      repairId: '30000000-0000-4000-8000-000000000001',
      request: {
        body: 'Contenido incompatible',
        clientRequestId: '90000000-0000-4000-8000-000000000001',
      },
    }),
    AddRepairOperationalNoteConflictError,
  );
});

test('database migration adds scoped idempotency without a second timeline model', () => {
  assert.match(migrationSource, /alterTable\('repair_timeline_entries'\)/u);
  assert.match(migrationSource, /addColumn\('client_request_id', 'uuid'\)/u);
  assert.match(timelineMigrationSource, /addColumn\('body', 'varchar\(4000\)'\)/u);
  assert.doesNotMatch(migrationSource, /alterColumn\('body'/u);
  assert.match(migrationSource, /repair_timeline_entries_note_request_uq/u);
  assert.match(migrationSource, /\['tenant_id', 'branch_id', 'repair_id', 'client_request_id'\]/u);
  assert.doesNotMatch(migrationSource, /createTable/u);
});

test('HTTP contract accepts only the note payload, returns a minimized 201 body, and correlates errors server-side', () => {
  assert.match(controllerSource, /@Post\(':repairId\/notes'\)/u);
  assert.match(controllerSource, /@Body\(\) request: unknown/u);
  assert.match(controllerSource, /REPAIR_NOTE_INVALID/u);
  assert.match(controllerSource, /REPAIR_NOT_FOUND/u);
  assert.match(controllerSource, /REPAIR_NOTE_IDEMPOTENCY_CONFLICT/u);
  const responseProjection = controllerSource.slice(
    controllerSource.indexOf('function operationalNoteResponse'),
    controllerSource.indexOf("@Controller('api/repairs')"),
  );
  for (const field of ['id', 'type', 'occurredAt', 'displayName', 'title', 'body', 'source']) {
    assert.match(responseProjection, new RegExp(`\\b${field}\\b`, 'u'));
  }
  assert.doesNotMatch(
    responseProjection,
    /auditEventId|attribution|branchId|clientRequestId|correlationId|sessionId|stationId|tenantId/iu,
  );
  assert.match(
    controllerSource,
    /response\.setHeader\('X-Correlation-ID', result\.attribution\.correlationId\)/u,
  );
  assert.doesNotMatch(controllerSource, /randomUUID|responseCorrelationId/u);
  assert.match(correlationFilterSource, /const correlationId = randomUUID\(\)/u);
  assert.match(correlationFilterSource, /response\.setHeader\('X-Correlation-ID', correlationId\)/u);
  assert.match(correlationFilterSource, /event: 'http_request_failed'/u);
  assert.doesNotMatch(correlationFilterSource, /request\.(?:body|headers)|payload:|body: exception/iu);
  assert.match(appModuleSource, /provide: APP_FILTER, useClass: HttpCorrelationExceptionFilter/u);
  assert.doesNotMatch(controllerSource, /@Get\([^)]*(?:audit|business)/iu);
  assert.doesNotMatch(detailPageSource, /Contexto verificado|entry\.attribution|correlationId/iu);
});

test('frontend composer submits once, preserves failed text, and inserts only confirmed notes', () => {
  assert.match(apiSource, /api<AddRepairOperationalNoteResponse>\([\s\S]*?`\/api\/repairs\/\$\{encodeURIComponent\(repairId\)\}\/notes`[\s\S]*?method: 'POST'/u);
  assert.match(apiSource, /JSON\.stringify\(request\)/u);
  assert.match(detailPageSource, /crypto\.randomUUID\(\)/u);
  assert.match(detailPageSource, /noteSubmitState === 'submitting'/u);
  assert.match(detailPageSource, /onNoteAdded\([\s\S]*?response\.item/u);
  assert.match(detailPageSource, /setNoteDraft\(''\)/u);
  assert.match(detailPageSource, /El texto se conservó; puedes reintentar/u);
  assert.match(detailPageSource, /disabled=\{!noteValid \|\| noteSubmitState === 'submitting'\}/u);
  assert.match(detailPageSource, /aria-live="polite"/u);
  assert.match(pageStylesSource, /\.timelineList p \{[^}]*white-space: pre-wrap;/u);
});

test('unsaved note safety uses the governed dialog and session draft without window.confirm', () => {
  assert.match(detailPageSource, /sessionStorage\.setItem/u);
  assert.match(detailPageSource, /beforeunload/u);
  assert.match(detailPageSource, /¿Descartar la nota sin guardar\?/u);
  assert.match(detailPageSource, /Seguir escribiendo/u);
  assert.match(detailPageSource, /Descartar nota/u);
  assert.doesNotMatch(detailPageSource, /window\.confirm/u);
});

test('dashboard describes the local Repairs capability without claiming production readiness', () => {
  assert.match(dashboardSource, /Reparaciones sólo opera con el backend local sintético/u);
  assert.doesNotMatch(dashboardSource, /APIs de producto permanecen fuera de alcance/u);
  assert.doesNotMatch(dashboardSource, /API no materializada/u);
  assert.match(dashboardSource, /Datos sintéticos locales/u);
  assert.doesNotMatch(dashboardSource, /production ready|listo para producción/iu);
});
