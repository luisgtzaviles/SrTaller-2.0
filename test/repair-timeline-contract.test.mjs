import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const portSource = await readFile('src/modules/repairs/application/ports/repair-repository.port.ts', 'utf8');
const repositorySource = await readFile('src/modules/repairs/infrastructure/persistence/kysely-repair.repository.ts', 'utf8');
const controllerSource = await readFile('src/modules/repairs/presentation/repairs.controller.ts', 'utf8');
const migrationSource = await readFile('src/infrastructure/database/migrations/20260819140000_repairs_create_timeline_entries.ts', 'utf8');
const databaseTypesSource = await readFile('src/infrastructure/database/database-types.ts', 'utf8');
const detailPageSource = await readFile('apps/dev-preview-web/src/pages/RepairDetailPage.tsx', 'utf8');
const pageStylesSource = await readFile('apps/dev-preview-web/src/pages/pages.module.css', 'utf8');
const apiSource = await readFile('apps/dev-preview-web/src/api.ts', 'utf8');

test('repair timeline has a typed repairs-owned scoped schema', () => {
  assert.match(databaseTypesSource, /export interface RepairTimelineEntryTable/u);
  assert.match(migrationSource, /createTable\('repair_timeline_entries'\)/u);
  assert.match(migrationSource, /repair_timeline_entries_repair_scope_fk/u);
  assert.match(migrationSource, /\['tenant_id', 'branch_id', 'repair_id'\][\s\S]*?'repairs'[\s\S]*?\['tenant_id', 'branch_id', 'repair_id'\]/u);
  assert.match(migrationSource, /entry_type in \('note', 'system_event'\)/u);
  assert.match(migrationSource, /entry_type <> 'note' or actor_id is not null/u);
  assert.match(migrationSource, /repair_timeline_entries_scope_time_idx/u);
  assert.match(migrationSource, /\['tenant_id', 'branch_id', 'repair_id', 'occurred_at', 'entry_id'\]/u);
  assert.doesNotMatch(migrationSource, /\b(?:json|jsonb|pin|password|pattern|unlock|imei|secret)\b/iu);
});

test('repair detail read model owns an explicit bounded timeline contract', () => {
  assert.match(portSource, /export type RepairTimelineItemType = 'note' \| 'system_event'/u);
  assert.match(portSource, /readonly timeline: Readonly<\{[\s\S]*?items:[\s\S]*?totalCount: number;[\s\S]*?limit: number;/u);
  assert.match(repositorySource, /const repairTimelineLimit = 20/u);
  assert.match(repositorySource, /selectFrom\('repair_timeline_entries'\)/u);
  const timelineRead = repositorySource.slice(
    repositorySource.indexOf("const timelineScope"),
    repositorySource.indexOf('async addOperationalNote'),
  );
  assert.match(timelineRead, /where\('tenant_id', '=', validatedScope\.tenantId\)[\s\S]*?where\('branch_id', '=', validatedScope\.branchId\)[\s\S]*?where\('repair_id', '=', repairId\)/u);
  assert.match(timelineRead, /\.select\(\[[\s\S]*?'entry_id'[\s\S]*?'occurred_at'[\s\S]*?\]\)/u);
  assert.match(timelineRead, /orderBy\('occurred_at', 'desc'\)[\s\S]*?orderBy\('entry_id', 'desc'\)[\s\S]*?limit\(repairTimelineLimit\)/u);
  assert.match(timelineRead, /fn\.countAll<number>\(\)\.as\('count'\)/u);
  assert.doesNotMatch(timelineRead, /selectAll/u);
  assert.match(repositorySource, /row\.entry_type === 'note' && !row\.actor_id/u);
});

test('existing repair detail endpoint exposes timeline plus the single approved note write', () => {
  assert.match(controllerSource, /@Get\(':id'\)/u);
  assert.match(controllerSource, /timeline: \{[\s\S]*?items:[\s\S]*?occurredAt:[\s\S]*?actor:[\s\S]*?source:[\s\S]*?totalCount:[\s\S]*?limit:/u);
  assert.match(controllerSource, /@Post\(':repairId\/notes'\)/u);
  assert.doesNotMatch(controllerSource, /@(?:Patch|Put|Delete)|@Get\(':id\/timeline'\)/u);
  assert.match(controllerSource, /@Post\(':repairId\/technician-assignment'\)/u);
  assert.match(apiSource, /export type RepairTimelineItemType = 'note' \| 'system_event'/u);
  assert.match(apiSource, /readonly timeline: Readonly<\{[\s\S]*?items:[\s\S]*?totalCount:[\s\S]*?limit:/u);
});

test('repair detail renders an accessible timeline, honest empty state, and bounded note composer', () => {
  assert.match(detailPageSource, /<section[^>]+aria-labelledby="repair-timeline-title"/u);
  assert.match(detailPageSource, /<h2 id="repair-timeline-title">Historial<\/h2>/u);
  assert.match(detailPageSource, /<ol className=\{styles\.timelineList\}>[\s\S]*?<li key=\{entry\.id\}>[\s\S]*?<article>/u);
  assert.match(detailPageSource, /<time dateTime=\{entry\.occurredAt\}>/u);
  assert.match(detailPageSource, /No hay actividad registrada todavía\./u);
  assert.match(detailPageSource, /Las notas y actividades aparecerán aquí\./u);
  assert.match(detailPageSource, /timelineTypeLabel\(entry\.type\)/u);
  assert.match(detailPageSource, /entry\.actor\.displayName/u);
  assert.doesNotMatch(detailPageSource, /Editar|Eliminar|Cambiar estado|Adjuntar|Guardar cambios|>Guardar</iu);
  assert.match(detailPageSource, /<form className=\{styles\.noteComposer\}/u);
  assert.match(detailPageSource, /<Textarea[\s\S]*?maxLength=\{noteBodyMaxLength\}/u);
  assert.match(pageStylesSource, /\.timelineList p \{[^}]*overflow-wrap: anywhere;[^}]*white-space: pre-wrap;/u);
});
