import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import { normalizeRepairModelKey, RepairModelCatalogService, RepairModelInputError } from '../dist/modules/repairs/application/repair-model-catalog.service.js';
import { resolveRepairModelReadModel } from '../dist/modules/repairs/application/repair-model-read-model.js';

const brandId = '60000000-0000-4000-8000-000000000001';
const context = Object.freeze({
  tenantId: '10000000-0000-4000-8000-000000000001', branchId: '20000000-0000-4000-8000-000000000001',
  stationId: '30000000-0000-4000-8000-000000000001', sessionId: '40000000-0000-4000-8000-000000000001',
  actorUserId: '50000000-0000-4000-8000-000000000001', actorDisplayName: 'Luis', capability: 'repairs.catalogs.manage',
  commitGuard: Object.freeze({ async confirmCurrent() { return true; }, async confirmTemporalCurrent() { return true; } }),
});

test('model normalization is exact and the read model preserves raw while exposing a compatible canonical label', () => {
  assert.equal(normalizeRepairModelKey(' iPhone 14 Pro Máx! '), 'iphone 14 pro max');
  assert.notEqual(normalizeRepairModelKey('iphone14'), normalizeRepairModelKey('iphone 14'));
  assert.deepEqual(resolveRepairModelReadModel('iphone14 prm', null, null, null, brandId), { rawLabel: 'iphone14 prm', canonicalId: null, canonicalLabel: null, canonicalBrandId: null, effectiveLabel: 'iphone14 prm' });
  assert.equal(resolveRepairModelReadModel('iphone14 prm', '70000000-0000-4000-8000-000000000001', 'iPhone 14 Pro Max', brandId, brandId).effectiveLabel, 'iPhone 14 Pro Max');
  assert.throws(() => resolveRepairModelReadModel('S24', '70000000-0000-4000-8000-000000000001', 'S24', '80000000-0000-4000-8000-000000000001', brandId), /conflicts with/u);
});

test('model service requires Brand on create and preserves stable model identity across rename', async () => {
  const calls = [];
  const repository = {
    async createModel(receivedContext, input) { calls.push(['create', receivedContext, input]); return { modelId: input.modelId, canonicalBrandId: input.canonicalBrandId, brandLabel: 'Apple', canonicalLabel: input.canonicalLabel, normalizedKey: input.normalizedKey, code: null, scope: 'tenant', status: 'active', version: 1, usageCount: 0, createdAt: input.occurredAt.toISOString(), updatedAt: input.occurredAt.toISOString() }; },
    async changeModel(receivedContext, input) { calls.push(['change', receivedContext, input]); return { modelId: input.modelId, canonicalBrandId: brandId, brandLabel: 'Apple', canonicalLabel: input.canonicalLabel ?? 'iPhone 14', normalizedKey: input.normalizedKey ?? 'iphone 14', code: null, scope: 'tenant', status: input.status ?? 'active', version: input.expectedVersion + 1, usageCount: 2, createdAt: '2026-09-09T00:00:00.000Z', updatedAt: input.occurredAt.toISOString() }; },
    async resolvePendingModel(receivedContext, input) { calls.push(['resolve', receivedContext, input]); return { pendingModelValueId: input.pendingModelValueId, canonicalBrandId: brandId, brandLabel: 'Apple', rawBrandLabel: 'Apple', rawModelLabel: 'iphone14 prm', normalizedModelKey: 'iphone14 prm', resolutionStatus: 'resolved', canonicalModelId: input.canonicalModelId, canonicalModelLabel: 'iPhone 14 Pro Max', version: input.expectedVersion + 1, usageCount: 2, firstSeenAt: '2026-09-09T00:00:00.000Z', lastSeenAt: '2026-09-09T00:00:00.000Z' }; },
  };
  const generated = Array.from({ length: 16 }, (_, index) => `70000000-0000-4000-8000-${String(index + 1).padStart(12, '0')}`);
  const service = new RepairModelCatalogService(repository, () => new Date('2026-09-09T01:00:00.000Z'), () => generated.shift());
  const model = await service.create(context, { canonicalBrandId: brandId, canonicalLabel: '  iPhone   14  ' });
  assert.equal(calls[0][2].canonicalBrandId, brandId);
  assert.equal(calls[0][2].canonicalLabel, 'iPhone 14');
  assert.equal(calls[0][2].normalizedKey, 'iphone 14');
  const renamed = await service.rename(context, { modelId: model.modelId, canonicalLabel: 'iPhone 14 Pro', expectedVersion: 1 });
  assert.equal(renamed.modelId, model.modelId);
  assert.equal(calls[1][2].action, 'repair_model.renamed');
  await service.resolve(context, { pendingModelValueId: '80000000-0000-4000-8000-000000000001', canonicalModelId: model.modelId, expectedVersion: 1 });
  assert.equal(calls[2][2].canonicalModelId, model.modelId);
  assert.throws(() => service.create(context, { canonicalLabel: 'Sin marca' }), (error) => error instanceof RepairModelInputError && error.parameter === 'canonicalBrandId');
});

test('model catalog is Brand-bound end to end and keeps free entry non-blocking', async () => {
  const [migration, compatibilityMigration, repository, useCase, operations, controller, form, catalogPage, panel, administration] = await Promise.all([
    readFile('src/infrastructure/database/migrations/20260908124000_repairs_create_model_catalog.ts', 'utf8'),
    readFile('src/infrastructure/database/migrations/20260908125000_repairs_enforce_model_brand_compatibility.ts', 'utf8'),
    readFile('src/modules/repairs/infrastructure/persistence/kysely-repair.repository.ts', 'utf8'),
    readFile('src/modules/repairs/application/use-cases/create-repair.use-case.ts', 'utf8'),
    readFile('src/modules/repairs/application/repair-protected-operations.ts', 'utf8'),
    readFile('src/modules/repairs/presentation/repairs.controller.ts', 'utf8'),
    readFile('apps/dev-preview-web/src/pages/NewRepairPage.tsx', 'utf8'),
    readFile('apps/dev-preview-web/src/pages/RepairCatalogsPage.tsx', 'utf8'),
    readFile('apps/dev-preview-web/src/components/RepairModelCatalogPanel.tsx', 'utf8'),
    readFile('apps/dev-preview-web/src/components/catalogs/CatalogAdministration.tsx', 'utf8'),
  ]);
  assert.match(migration, /canonical_brand_id.*notNull/su);
  assert.match(migration, /repair_models_brand_fk/u);
  assert.match(migration, /tenant_id.*brand_context_key.*normalized_model_key/su);
  assert.doesNotMatch(migration, /iPhone|Samsung|Motorola/u);
  assert.match(compatibilityMigration, /repair_models_enforce_brand_scope/u);
  assert.match(compatibilityMigration, /repair_intakes_enforce_model_brand_match/u);
  assert.match(compatibilityMigration, /brand_tenant_id <> new\.tenant_id/u);
  assert.match(repository, /selectedModel\.canonical_brand_id !== canonicalBrandId/u);
  assert.match(repository, /where\('canonical_brand_id', '=', canonicalBrandId\).*where\('normalized_key', '=', normalizedModelKey/su);
  assert.match(repository, /updateTable\('repair_intakes'\).*canonical_model_id/su);
  assert.match(repository, /correctRepairEquipment[\s\S]*updateTable\('repairs'\)\.set\(\{ device_brand: correction\.deviceBrand, device_model: correction\.deviceModel \}\)/u);
  assert.match(useCase, /canonicalModelId/u);
  assert.match(operations, /listOperationalRepairModels/u);
  assert.match(controller, /configuration\/catalogs\/models\/pending/u);
  assert.match(form, /getOperationalRepairModels\(selectedBrand\.brandId, deviceModel/u);
  assert.match(form, /canonicalModelId: selectedModel\?\.modelId/u);
  assert.match(form, /activeModelIndex >= 0/u);
  assert.match(form, /event\.key === 'Enter' && activeModelIndex >= 0/u);
  assert.match(catalogPage, /useSearchParams/u);
  assert.match(catalogPage, /next\.set\('catalog', catalog\)/u);
  assert.match(catalogPage, /repairCatalogFromSearchParams\(searchParams\)/u);
  assert.match(panel, /Todas las marcas/u);
  assert.match(panel, /CatalogReconciliationSummary/u);
  assert.match(panel, /CatalogLifecycleFilter/u);
  assert.match(panel, /CatalogRowActions/u);
  assert.match(administration, /canónicas/u);
  assert.match(administration, /por revisar/u);
  assert.match(panel, /Resuelve la marca primero/u);
  assert.match(panel, /La marca del modelo no puede cambiar/u);
});
