import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const useCaseSource = await readFile('src/modules/repairs/application/use-cases/add-repair-operational-note.use-case.ts', 'utf8');
const portSource = await readFile('src/modules/repairs/application/ports/repair-repository.port.ts', 'utf8');
const repositorySource = await readFile('src/modules/repairs/infrastructure/persistence/kysely-repair.repository.ts', 'utf8');
const controllerSource = await readFile('src/modules/repairs/presentation/repairs.controller.ts', 'utf8');
const migrationSource = await readFile('src/infrastructure/database/migrations/20260820090000_repairs_add_operational_note_idempotency.ts', 'utf8');
const apiSource = await readFile('apps/dev-preview-web/src/api.ts', 'utf8');
const detailPageSource = await readFile('apps/dev-preview-web/src/pages/RepairDetailPage.tsx', 'utf8');
const pageStylesSource = await readFile('apps/dev-preview-web/src/pages/pages.module.css', 'utf8');

test('operational note input is strict, trimmed, bounded, and server-owned', () => {
  assert.match(useCaseSource, /allowedRequestKeys = Object\.freeze\(\['body', 'clientRequestId'\]\)/u);
  assert.match(useCaseSource, /Object\.keys\(request\)\.some/u);
  assert.match(useCaseSource, /request\.body\.trim\(\)/u);
  assert.match(useCaseSource, /repairOperationalNoteBodyMinLength = 3/u);
  assert.match(useCaseSource, /repairOperationalNoteBodyMaxLength = 4000/u);
  assert.match(useCaseSource, /canonicalUuid\.test\(request\.clientRequestId\)/u);
  assert.match(useCaseSource, /actorId: localOperationalNoteActor\.id/u);
  assert.match(useCaseSource, /actorDisplayName: localOperationalNoteActor\.displayName/u);
  assert.match(useCaseSource, /source: 'local\.operational_note'/u);
  assert.match(useCaseSource, /private readonly now: \(\) => Date = \(\) => new Date\(\)/u);
  assert.match(useCaseSource, /private readonly createId: \(\) => string = randomUUID/u);
  assert.doesNotMatch(useCaseSource, /console\.|logger|log\(/iu);
});

test('repository performs one append-only scoped note write with retry idempotency', () => {
  assert.match(portSource, /addOperationalNote\([\s\S]*?scope: RepairPersistenceScope,[\s\S]*?note: AddRepairOperationalNoteRecord/u);
  const writeMethod = repositorySource.slice(
    repositorySource.indexOf('async addOperationalNote'),
    repositorySource.indexOf('async getRepairEvidenceById'),
  );
  assert.match(writeMethod, /where\('tenant_id', '=', validatedScope\.tenantId\)[\s\S]*?where\('branch_id', '=', validatedScope\.branchId\)[\s\S]*?where\('repair_id', '=', note\.repairId\)/u);
  assert.match(writeMethod, /insertInto\('repair_timeline_entries'\)/u);
  assert.match(writeMethod, /entry_type: 'note'/u);
  assert.match(writeMethod, /title: 'Nota'/u);
  assert.match(writeMethod, /client_request_id: note\.clientRequestId/u);
  assert.match(writeMethod, /columns\(\['tenant_id', 'branch_id', 'repair_id', 'client_request_id'\]\)[\s\S]*?doNothing\(\)/u);
  assert.doesNotMatch(writeMethod, /updateTable|deleteFrom/u);
});

test('database migration adds scoped idempotency without a second timeline model', () => {
  assert.match(migrationSource, /alterTable\('repair_timeline_entries'\)/u);
  assert.match(migrationSource, /addColumn\('client_request_id', 'uuid'\)/u);
  assert.match(migrationSource, /varchar\(4000\)/u);
  assert.match(migrationSource, /repair_timeline_entries_note_request_uq/u);
  assert.match(migrationSource, /\['tenant_id', 'branch_id', 'repair_id', 'client_request_id'\]/u);
  assert.doesNotMatch(migrationSource, /createTable/u);
});

test('HTTP contract accepts only the note payload and returns a minimized 201 body', () => {
  assert.match(controllerSource, /@Post\(':repairId\/notes'\)/u);
  assert.match(controllerSource, /@Body\(\) request: unknown/u);
  assert.match(controllerSource, /REPAIR_NOTE_INVALID/u);
  assert.match(controllerSource, /REPAIR_NOT_FOUND/u);
  const responseProjection = controllerSource.slice(
    controllerSource.indexOf('function operationalNoteResponse'),
    controllerSource.indexOf("@Controller('api/repairs')"),
  );
  for (const field of ['id', 'type', 'occurredAt', 'displayName', 'title', 'body', 'source']) {
    assert.match(responseProjection, new RegExp(`\\b${field}\\b`, 'u'));
  }
  assert.doesNotMatch(responseProjection, /tenant|branch|actorId|clientRequestId/iu);
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
