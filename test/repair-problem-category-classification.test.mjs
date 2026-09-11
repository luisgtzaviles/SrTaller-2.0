import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import { ChangeRepairProblemClassificationService, RepairProblemClassificationInputError } from '../dist/modules/repairs/application/change-repair-problem-classification.service.js';
import { normalizeRepairProblemCategoryKey, RepairProblemCategoryCatalogService, RepairProblemCategoryInputError } from '../dist/modules/repairs/application/repair-problem-category-catalog.service.js';

const catalogContext = Object.freeze({ tenantId: '10000000-0000-4000-8000-000000000001', branchId: '20000000-0000-4000-8000-000000000001', stationId: '30000000-0000-4000-8000-000000000001', sessionId: '40000000-0000-4000-8000-000000000001', actorUserId: '50000000-0000-4000-8000-000000000001', actorDisplayName: 'Luis', capability: 'repairs.catalogs.manage', commitGuard: Object.freeze({ async confirmCurrent() { return true; }, async confirmTemporalCurrent() { return true; } }) });
const classifyContext = Object.freeze({ ...catalogContext, capability: 'repairs.classify' });
const repairId = '60000000-0000-4000-8000-000000000001';
const categoryId = '70000000-0000-4000-8000-000000000001';

test('problem category normalization detects casing, spaces, accents and punctuation without fuzzy matching', () => {
  assert.equal(normalizeRepairProblemCategoryKey(' Cámara   / Audio '), 'camara audio');
  assert.equal(normalizeRepairProblemCategoryKey('CAMARA-AUDIO'), 'camara audio');
  assert.notEqual(normalizeRepairProblemCategoryKey('Audio'), normalizeRepairProblemCategoryKey('Altavoz'));
});

test('problem category catalog keeps stable identity and versioned tenant lifecycle', async () => {
  const calls = []; const ids = Array.from({ length: 9 }, (_, index) => `80000000-0000-4000-8000-${String(index + 1).padStart(12, '0')}`);
  const repository = { async createProblemCategory(context, input) { calls.push([context, input]); return { categoryId: input.categoryId, code: null, canonicalLabel: input.canonicalLabel, normalizedKey: input.normalizedKey, scope: 'tenant', status: 'active', version: 1, usageCount: 0, createdAt: input.occurredAt.toISOString(), updatedAt: input.occurredAt.toISOString() }; }, async changeProblemCategory(context, input) { calls.push([context, input]); return { categoryId: input.categoryId, code: null, canonicalLabel: input.canonicalLabel ?? 'Audio', normalizedKey: input.normalizedKey ?? 'audio', scope: 'tenant', status: input.status ?? 'active', version: input.expectedVersion + 1, usageCount: 2, createdAt: '2026-09-09T00:00:00.000Z', updatedAt: input.occurredAt.toISOString() }; } };
  const service = new RepairProblemCategoryCatalogService(repository, () => new Date('2026-09-09T10:00:00.000Z'), () => ids.shift());
  const created = await service.create(catalogContext, { canonicalLabel: ' AUDIO ' });
  const renamed = await service.rename(catalogContext, { categoryId: created.categoryId, canonicalLabel: 'Audio y altavoz', expectedVersion: 1 });
  assert.equal(renamed.categoryId, created.categoryId); assert.equal(calls[0][1].canonicalLabel, 'Audio'); assert.equal(calls[0][1].normalizedKey, 'audio'); assert.equal(calls[1][1].action, 'repair_problem_category.renamed');
  assert.throws(() => service.create(catalogContext, { canonicalLabel: 'Audio', branchId: catalogContext.branchId }), (error) => error instanceof RepairProblemCategoryInputError && error.parameter === 'payload');
  assert.throws(() => service.create(catalogContext, { canonicalLabel: '--' }), (error) => error instanceof RepairProblemCategoryInputError && error.parameter === 'canonicalLabel');
});

test('problem category delete command preserves expectedVersion and server-owned audit identities', async () => {
  const calls = []; const ids = Array.from({ length: 2 }, (_, index) => `81000000-0000-4000-8000-${String(index + 1).padStart(12, '0')}`);
  const repository = { async deleteProblemCategory(context, input) { calls.push([context, input]); return { categoryId: input.categoryId, previousLabel: 'QA sin uso', scope: 'tenant', version: input.expectedVersion, deletedAt: input.occurredAt.toISOString() }; } };
  const service = new RepairProblemCategoryCatalogService(repository, () => new Date('2026-09-09T10:05:00.000Z'), () => ids.shift());
  const result = await service.delete(catalogContext, { categoryId, expectedVersion: 3 });
  assert.equal(result.version, 3);
  assert.equal(calls[0][0].capability, 'repairs.catalogs.manage');
  assert.equal(calls[0][1].expectedVersion, 3);
  assert.equal(calls[0][1].eventId, '81000000-0000-4000-8000-000000000001');
  assert.equal(calls[0][1].correlationId, '81000000-0000-4000-8000-000000000002');
  assert.throws(() => service.delete(catalogContext, { categoryId, expectedVersion: 0 }), (error) => error instanceof RepairProblemCategoryInputError && error.parameter === 'expectedVersion');
});

test('pending reconciliation requires one explicit human destination', async () => {
  const calls = []; const ids = Array.from({ length: 6 }, (_, index) => `8a000000-0000-4000-8000-${String(index + 1).padStart(12, '0')}`);
  const service = new RepairProblemCategoryCatalogService({ async resolvePendingProblem(context, input) { calls.push([context, input]); return { pendingProblemValueId: input.pendingProblemValueId, rawLabel: 'pantala', normalizedKey: 'pantala', resolutionStatus: 'resolved', canonicalCategoryId: input.canonicalCategoryId ?? input.newCategoryId, canonicalLabel: input.newCanonicalLabel ?? 'Pantalla', version: 2, usageCount: 1, firstSeenAt: input.occurredAt.toISOString(), lastSeenAt: input.occurredAt.toISOString() }; } }, () => new Date('2026-09-09T10:00:00.000Z'), () => ids.shift());
  await service.resolve(catalogContext, { pendingProblemValueId: '8b000000-0000-4000-8000-000000000001', canonicalCategoryId: categoryId, expectedVersion: 1 });
  await service.resolve(catalogContext, { pendingProblemValueId: '8b000000-0000-4000-8000-000000000002', canonicalLabel: 'Pantalla rota', expectedVersion: 1 });
  assert.equal(calls[0][1].canonicalCategoryId, categoryId); assert.equal(calls[0][1].newCategoryId, null);
  assert.equal(calls[1][1].newCanonicalLabel, 'Pantalla rota'); assert.equal(calls[1][1].newNormalizedKey, 'pantalla rota');
  assert.throws(() => service.resolve(catalogContext, { pendingProblemValueId: '8b000000-0000-4000-8000-000000000003', canonicalCategoryId: categoryId, canonicalLabel: 'Otra', expectedVersion: 1 }), (error) => error instanceof RepairProblemCategoryInputError && error.parameter === 'resolution');
});

test('manual N:M classification creates explicit assigned/removed commands and rejects invalid identities', async () => {
  const calls = []; const ids = Array.from({ length: 8 }, (_, index) => `90000000-0000-4000-8000-${String(index + 1).padStart(12, '0')}`);
  const service = new ChangeRepairProblemClassificationService({ async changeProblemClassification(context, input) { calls.push([context, input]); return { categoryId: input.categoryId, label: 'Audio', status: 'active' }; } }, () => new Date('2026-09-09T10:00:00.000Z'), () => ids.shift());
  await service.add(classifyContext, repairId, categoryId); await service.remove(classifyContext, repairId, categoryId);
  assert.deepEqual(calls.map((call) => call[1].action), ['repair.problem_category.assigned', 'repair.problem_category.removed']);
  assert.equal(calls[0][0].capability, 'repairs.classify'); assert.notEqual(calls[0][1].eventId, calls[0][1].timelineEntryId);
  assert.throws(() => service.add(classifyContext, 'invalid', categoryId), (error) => error instanceof RepairProblemClassificationInputError && error.parameter === 'repairId');
});

test('reported problems extend the category foundation across intake, reconciliation and later classification', async () => {
  const [migration, reconciliationMigration, safeDeleteMigration, repository, operations, controller, detail, api, catalog, administration, newRepair, reportedProblemsInput, searchAutocomplete] = await Promise.all([
    readFile('src/infrastructure/database/migrations/20260908130100_repairs_create_problem_category_catalog.ts', 'utf8'),
    readFile('src/infrastructure/database/migrations/20260908131000_repairs_add_problem_capture_reconciliation.ts', 'utf8'),
    readFile('src/infrastructure/database/migrations/20260909100000_repairs_add_problem_category_safe_delete.ts', 'utf8'),
    readFile('src/modules/repairs/infrastructure/persistence/kysely-repair.repository.ts', 'utf8'),
    readFile('src/modules/repairs/application/repair-protected-operations.ts', 'utf8'),
    readFile('src/modules/repairs/presentation/repairs.controller.ts', 'utf8'),
    readFile('apps/dev-preview-web/src/pages/RepairDetailPage.tsx', 'utf8'),
    readFile('apps/dev-preview-web/src/api.ts', 'utf8'),
    readFile('apps/dev-preview-web/src/components/RepairProblemCategoryCatalogPanel.tsx', 'utf8'),
    readFile('apps/dev-preview-web/src/components/catalogs/CatalogAdministration.tsx', 'utf8'),
    readFile('apps/dev-preview-web/src/pages/NewRepairPage.tsx', 'utf8'),
    readFile('apps/dev-preview-web/src/components/ReportedProblemsInput.tsx', 'utf8'),
    readFile('apps/dev-preview-web/src/components/ui/SearchAutocomplete.tsx', 'utf8'),
  ]);
  assert.match(migration, /createTable\('repair_problem_classifications'\)/u); assert.match(migration, /source = 'manual' and stage = 'post_intake'/u); assert.match(migration, /append-only/u); assert.doesNotMatch(migration, /insertInto\('repair_problem_categories'\)/u);
  assert.match(reconciliationMigration, /createTable\('repair_problem_pending_values'\)/u); assert.match(reconciliationMigration, /stage in \('intake', 'post_intake'\)/u); assert.match(reconciliationMigration, /tenant_id', 'normalized_key'/u);
  assert.match(safeDeleteMigration, /createTable\('repair_problem_category_deletion_events'\)/u); assert.match(safeDeleteMigration, /catalog_entry\.deleted/u); assert.match(safeDeleteMigration, /append-only/u); assert.match(safeDeleteMigration, /historical_references/u);
  assert.match(repository, /Clasificación agregada/u); assert.match(repository, /Clasificación retirada/u); assert.match(repository, /category_label_snapshot/u); assert.match(repository, /fn\.count\('repairs\.repair_id'\)\.distinct/u); assert.match(repository, /deleteFrom\('repair_problem_classifications'\)[\s\S]*where\('stage', '=', 'post_intake'\)/u);
  assert.match(operations, /capability: 'repairs\.classify'/u); assert.match(operations, /listIntakeProblemCategories[\s\S]*repairsCreateLookupRequirement/u); assert.match(operations, /deleteProblemCategory[\s\S]*repairsCatalogsManageRequirement/u); assert.match(controller, /problem-classifications/u); assert.match(controller, /problem\.stage === 'intake'/u); assert.match(controller, /category\.stage === 'post_intake'/u); assert.match(api, /addRepairProblemClassification/u); assert.match(api, /method: 'DELETE'/u);
  assert.match(detail, /Problemas reportados/u); assert.match(detail, /Relato del cliente/u); assert.doesNotMatch(detail, /Falla reportada/u); assert.match(detail, /Sin clasificación/u); assert.match(detail, /Inactiva/u);
  assert.match(catalog, /CatalogReconciliationSummary/u); assert.match(administration, /por revisar/u); assert.match(administration, /canónicas/u); assert.match(catalog, /deletable/u); assert.match(catalog, /Eliminar definitivamente/u); assert.match(catalog, /Nunca ha sido utilizada por una reparación/u); assert.doesNotMatch(catalog, /role="tablist" aria-label="Vista de categorías"/u); assert.match(administration, /Plataforma/u); assert.match(administration, /Organización/u);
  assert.match(newRepair, /ReportedProblemsInput/u); assert.match(reportedProblemsInput, /Buscar o escribir otro problema/u); assert.match(reportedProblemsInput, /ArrowDown/u); assert.match(reportedProblemsInput, /SearchAutocomplete/u); assert.match(searchAutocomplete, /event\.key !== 'Escape'[\s\S]*onDismiss\(\)/u); assert.match(reportedProblemsInput, /getIntakeProblemCategories/u);
});
