import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import { normalizeRepairBrandKey, RepairBrandCatalogService, RepairBrandInputError } from '../dist/modules/repairs/application/repair-brand-catalog.service.js';
import { resolveRepairBrandReadModel } from '../dist/modules/repairs/application/repair-brand-read-model.js';

const context = Object.freeze({
  tenantId: '10000000-0000-4000-8000-000000000001', branchId: '20000000-0000-4000-8000-000000000001',
  stationId: '30000000-0000-4000-8000-000000000001', sessionId: '40000000-0000-4000-8000-000000000001',
  actorUserId: '50000000-0000-4000-8000-000000000001', actorDisplayName: 'Luis', capability: 'repairs.catalogs.manage',
  commitGuard: Object.freeze({ async confirmCurrent() { return true; }, async confirmTemporalCurrent() { return true; } }),
});

test('operational brand read model uses current canonical label and otherwise preserves the raw snapshot', () => {
  assert.deepEqual(resolveRepairBrandReadModel('appple', null, null), {
    rawLabel: 'appple', canonicalId: null, canonicalLabel: null, effectiveLabel: 'appple',
  });
  assert.deepEqual(resolveRepairBrandReadModel('appple', '60000000-0000-4000-8000-000000000001', 'Apple'), {
    rawLabel: 'appple', canonicalId: '60000000-0000-4000-8000-000000000001', canonicalLabel: 'Apple', effectiveLabel: 'Apple',
  });
  assert.equal(resolveRepairBrandReadModel('appple', '60000000-0000-4000-8000-000000000001', 'Apple Test').effectiveLabel, 'Apple Test');
  assert.equal(resolveRepairBrandReadModel('appple', null, null).effectiveLabel, 'appple');
  assert.throws(
    () => resolveRepairBrandReadModel('appple', '60000000-0000-4000-8000-000000000001', null),
    /Canonical repair brand link has no current label/u,
  );
});

test('brand normalization detects governed exact variants without fuzzy matching or rewriting labels', () => {
  for (const value of ['Apple', 'apple', 'APPLE', '  ÁPPLE  ', 'Apple!']) {
    assert.equal(normalizeRepairBrandKey(value), 'apple');
  }
  assert.equal(normalizeRepairBrandKey('iQOO'), 'iqoo');
  assert.equal(normalizeRepairBrandKey('appple'), normalizeRepairBrandKey('Appple'));
  assert.equal(normalizeRepairBrandKey('appple'), normalizeRepairBrandKey('APPPLE'));
  for (const value of ['appple', 'Appple', 'Aple', 'Appl']) {
    assert.notEqual(normalizeRepairBrandKey(value), normalizeRepairBrandKey('Apple'));
  }
});

test('brand service preserves canonical spelling, stable identity, versions, and explicit pending resolution', async () => {
  const calls = [];
  const repository = {
    async createBrand(receivedContext, input) { calls.push(['create', receivedContext, input]); return { brandId: input.brandId, canonicalLabel: input.canonicalLabel, normalizedKey: input.normalizedKey, code: null, scope: 'tenant', status: 'active', version: 1, usageCount: 0, createdAt: input.occurredAt.toISOString(), updatedAt: input.occurredAt.toISOString() }; },
    async changeBrand(receivedContext, input) { calls.push(['change', receivedContext, input]); return { brandId: input.brandId, canonicalLabel: input.canonicalLabel ?? 'Apple', normalizedKey: input.normalizedKey ?? 'apple', code: null, scope: 'tenant', status: input.status ?? 'active', version: input.expectedVersion + 1, usageCount: 2, createdAt: '2026-09-09T00:00:00.000Z', updatedAt: input.occurredAt.toISOString() }; },
    async resolvePendingBrand(receivedContext, input) { calls.push(['resolve', receivedContext, input]); return { pendingBrandValueId: input.pendingBrandValueId, rawLabel: 'Appple', normalizedKey: 'appple', resolutionStatus: 'resolved', canonicalBrandId: input.canonicalBrandId, canonicalLabel: 'Apple', version: input.expectedVersion + 1, usageCount: 1, firstSeenAt: '2026-09-09T00:00:00.000Z', lastSeenAt: '2026-09-09T00:00:00.000Z' }; },
  };
  const generated = Array.from({ length: 16 }, (_, index) => `60000000-0000-4000-8000-${String(index + 1).padStart(12, '0')}`);
  const service = new RepairBrandCatalogService(repository, () => new Date('2026-09-09T01:00:00.000Z'), () => generated.shift());
  const apple = await service.create(context, { canonicalLabel: ' APPLE ' });
  assert.equal(calls[0][2].canonicalLabel, 'Apple');
  assert.equal(calls[0][2].normalizedKey, 'apple');
  const renamed = await service.rename(context, { brandId: apple.brandId, canonicalLabel: 'Apple Inc.', expectedVersion: 1 });
  assert.equal(renamed.brandId, apple.brandId);
  assert.equal(calls[1][2].action, 'repair_brand.renamed');
  const pendingId = '70000000-0000-4000-8000-000000000001';
  await service.resolve(context, { pendingBrandValueId: pendingId, canonicalBrandId: apple.brandId, expectedVersion: 1 });
  assert.equal(calls[2][2].canonicalBrandId, apple.brandId);
  assert.equal(calls[2][2].newCanonicalLabel, null);
});

test('brand service rejects ambiguous resolutions and unknown payload authority', () => {
  const service = new RepairBrandCatalogService({});
  assert.throws(() => service.create(context, { canonicalLabel: 'Apple', tenantId: context.tenantId }), (error) => error instanceof RepairBrandInputError && error.parameter === 'payload');
  assert.throws(() => service.resolve(context, { pendingBrandValueId: '70000000-0000-4000-8000-000000000001', canonicalBrandId: '60000000-0000-4000-8000-000000000001', canonicalLabel: 'Apple', expectedVersion: 1 }), (error) => error instanceof RepairBrandInputError && error.parameter === 'resolution');
});

test('brand slice keeps free-entry snapshots, normalized relations, capabilities, audit, autocomplete and admin resolution', async () => {
  const [migration, repository, readModel, useCase, operations, controller, form, panel, administration] = await Promise.all([
    readFile('src/infrastructure/database/migrations/20260908123000_repairs_create_brand_catalog.ts', 'utf8'),
    readFile('src/modules/repairs/infrastructure/persistence/kysely-repair.repository.ts', 'utf8'),
    readFile('src/modules/repairs/application/repair-brand-read-model.ts', 'utf8'),
    readFile('src/modules/repairs/application/use-cases/create-repair.use-case.ts', 'utf8'),
    readFile('src/modules/repairs/application/repair-protected-operations.ts', 'utf8'),
    readFile('src/modules/repairs/presentation/repairs.controller.ts', 'utf8'),
    readFile('apps/dev-preview-web/src/pages/NewRepairPage.tsx', 'utf8'),
    readFile('apps/dev-preview-web/src/components/RepairBrandCatalogPanel.tsx', 'utf8'),
    readFile('apps/dev-preview-web/src/components/catalogs/CatalogAdministration.tsx', 'utf8'),
  ]);
  assert.match(migration, /createTable\('repair_brands'\)/u);
  assert.match(migration, /createTable\('repair_brand_pending_values'\)/u);
  assert.match(migration, /repair_intakes_canonical_brand_fk/u);
  assert.match(migration, /append-only/u);
  assert.match(migration, /repair_brand_pending\.reopened/u);
  assert.doesNotMatch(migration, /Apple|Samsung|Motorola/u);
  assert.match(repository, /count\('repair_intakes\.repair_id'\)\.distinct/u);
  assert.match(repository, /pending_brand_value_id.*canonical_brand_id/su);
  assert.match(repository, /updateTable\('repair_intakes'\).*canonical_brand_id/su);
  assert.match(repository, /correctRepairEquipment[\s\S]*updateTable\('repairs'\)\.set\(\{ device_brand: correction\.deviceBrand, device_model: correction\.deviceModel \}\)/u);
  assert.match(repository, /leftJoin\('repair_brands'.*repair_intakes\.canonical_brand_id/su);
  assert.match(repository, /repair_brands\.canonical_label as canonical_brand_label/u);
  assert.match(readModel, /effectiveLabel: canonicalId === null \? rawLabel : canonicalLabel/u);
  assert.match(useCase, /normalizedOptional\(input\.deviceBrand/u);
  assert.match(useCase, /canonicalBrandId/u);
  assert.match(operations, /repairsCatalogsManageRequirement/u);
  assert.match(controller, /configuration\/catalogs\/brands\/pending/u);
  assert.match(form, /getOperationalRepairBrands/u);
  assert.match(form, /canonicalBrandId: selectedBrand\?\.brandId/u);
  assert.match(form, /onChange=\{\(event\) => \{ setDeviceBrand\(event\.target\.value\); setSelectedBrand\(null\); setSelectedModel\(null\); setModelCandidates\(\[\]\); \}\}/u);
  assert.match(form, /activeBrandIndex >= 0/u);
  assert.match(panel, /CatalogReconciliationSummary/u);
  assert.match(panel, /CatalogLifecycleFilter/u);
  assert.match(panel, /CatalogRowActions/u);
  assert.match(administration, /canónicas/u);
  assert.match(administration, /por revisar/u);
  assert.match(panel, /Asociar a marca existente/u);
  assert.match(panel, /Buscar Apple/u);
  assert.match(panel, /Crear como nueva marca de Organización/u);
  assert.match(panel, /setResolutionBrandId\(''\)/u);
  const operationalResponses = controller.slice(
    controller.indexOf('function response'),
    controller.indexOf('function operationalNoteResponse'),
  );
  assert.match(operationalResponses, /deviceBrand\.effectiveLabel/u);
  assert.doesNotMatch(operationalResponses, /deviceBrand\.(?:rawLabel|canonicalId|canonicalLabel)/u);
});
