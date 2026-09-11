import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import { normalizeRepairDeviceTypeKey, RepairDeviceTypeCatalogService, RepairDeviceTypeInputError } from '../dist/modules/repairs/application/repair-device-type-catalog.service.js';
import { resolveRepairDeviceTypeReadModel } from '../dist/modules/repairs/application/repair-device-type-read-model.js';

const context = Object.freeze({
  tenantId: '10000000-0000-4000-8000-000000000001', branchId: '20000000-0000-4000-8000-000000000001',
  stationId: '30000000-0000-4000-8000-000000000001', sessionId: '40000000-0000-4000-8000-000000000001',
  actorUserId: '50000000-0000-4000-8000-000000000001', actorDisplayName: 'Luis', capability: 'repairs.catalogs.manage',
  commitGuard: Object.freeze({ async confirmCurrent() { return true; }, async confirmTemporalCurrent() { return true; } }),
});

test('Device Type effective label follows the canonical identity while retaining the raw snapshot', () => {
  assert.deepEqual(resolveRepairDeviceTypeReadModel('tablet qa', null, null), {
    rawLabel: 'tablet qa', canonicalId: null, canonicalLabel: null, effectiveLabel: 'tablet qa',
  });
  assert.deepEqual(resolveRepairDeviceTypeReadModel('tablet qa', '60000000-0000-4000-8000-000000000001', 'Tablet QA'), {
    rawLabel: 'tablet qa', canonicalId: '60000000-0000-4000-8000-000000000001', canonicalLabel: 'Tablet QA', effectiveLabel: 'Tablet QA',
  });
  assert.throws(() => resolveRepairDeviceTypeReadModel('tablet qa', '60000000-0000-4000-8000-000000000001', null), /has no current label/u);
});

test('Device Type normalization groups only exact governed variants and performs no fuzzy matching', () => {
  for (const value of ['Tablet QA', 'tablet qa', ' TABLET   QA ', 'TÁBLET-QA']) assert.equal(normalizeRepairDeviceTypeKey(value), 'tablet qa');
  assert.notEqual(normalizeRepairDeviceTypeKey('Tablet QAA'), normalizeRepairDeviceTypeKey('Tablet QA'));
  assert.notEqual(normalizeRepairDeviceTypeKey('Table QA'), normalizeRepairDeviceTypeKey('Tablet QA'));
});

test('Device Type service preserves stable identity, optimistic versions and explicit resolution', async () => {
  const calls = [];
  const repository = {
    async createDeviceType(receivedContext, input) { calls.push(['create', receivedContext, input]); return { deviceTypeId: input.deviceTypeId, canonicalLabel: input.canonicalLabel, normalizedKey: input.normalizedKey, code: null, scope: 'tenant', status: 'active', version: 1, usageCount: 0, createdAt: input.occurredAt.toISOString(), updatedAt: input.occurredAt.toISOString() }; },
    async changeDeviceType(receivedContext, input) { calls.push(['change', receivedContext, input]); return { deviceTypeId: input.deviceTypeId, canonicalLabel: input.canonicalLabel ?? 'Tablet QA', normalizedKey: input.normalizedKey ?? 'tablet qa', code: null, scope: 'tenant', status: input.status ?? 'active', version: input.expectedVersion + 1, usageCount: 2, createdAt: '2026-09-10T00:00:00.000Z', updatedAt: input.occurredAt.toISOString() }; },
    async resolvePendingDeviceType(receivedContext, input) { calls.push(['resolve', receivedContext, input]); return { pendingDeviceTypeValueId: input.pendingDeviceTypeValueId, rawLabel: 'Consola retro QA', normalizedKey: 'consola retro qa', resolutionStatus: 'resolved', canonicalDeviceTypeId: input.canonicalDeviceTypeId, canonicalLabel: 'Tablet QA', version: input.expectedVersion + 1, usageCount: 1, firstSeenAt: '2026-09-10T00:00:00.000Z', lastSeenAt: '2026-09-10T00:00:00.000Z' }; },
  };
  const generated = Array.from({ length: 16 }, (_, index) => `60000000-0000-4000-8000-${String(index + 1).padStart(12, '0')}`);
  const service = new RepairDeviceTypeCatalogService(repository, () => new Date('2026-09-10T01:00:00.000Z'), () => generated.shift());
  const tablet = await service.create(context, { canonicalLabel: ' Tablet QA ' });
  assert.equal(calls[0][2].canonicalLabel, 'Tablet QA');
  assert.equal(calls[0][2].normalizedKey, 'tablet qa');
  const renamed = await service.rename(context, { deviceTypeId: tablet.deviceTypeId, canonicalLabel: 'Tablet Owner', expectedVersion: 1 });
  assert.equal(renamed.deviceTypeId, tablet.deviceTypeId);
  assert.equal(calls[1][2].action, 'repair_device_type.renamed');
  await service.resolve(context, { pendingDeviceTypeValueId: '70000000-0000-4000-8000-000000000001', canonicalDeviceTypeId: tablet.deviceTypeId, expectedVersion: 1 });
  assert.equal(calls[2][2].canonicalDeviceTypeId, tablet.deviceTypeId);
  assert.equal(calls[2][2].newCanonicalLabel, null);
});

test('Device Type service rejects payload authority and ambiguous resolutions', () => {
  const service = new RepairDeviceTypeCatalogService({});
  assert.throws(() => service.create(context, { canonicalLabel: 'Tablet', tenantId: context.tenantId }), (error) => error instanceof RepairDeviceTypeInputError && error.parameter === 'payload');
  assert.throws(() => service.resolve(context, { pendingDeviceTypeValueId: '70000000-0000-4000-8000-000000000001', canonicalDeviceTypeId: '60000000-0000-4000-8000-000000000001', canonicalLabel: 'Tablet', expectedVersion: 1 }), (error) => error instanceof RepairDeviceTypeInputError && error.parameter === 'resolution');
});

test('Device Type vertical slice is independent from Brand and fixes footerless shared Dialog clipping', async () => {
  const [migration, repository, useCase, controller, form, panel, catalogs, overlay, styles] = await Promise.all([
    readFile('src/infrastructure/database/migrations/20260910230000_repairs_create_device_type_catalog.ts', 'utf8'),
    readFile('src/modules/repairs/infrastructure/persistence/kysely-repair.repository.ts', 'utf8'),
    readFile('src/modules/repairs/application/use-cases/create-repair.use-case.ts', 'utf8'),
    readFile('src/modules/repairs/presentation/repairs.controller.ts', 'utf8'),
    readFile('apps/dev-preview-web/src/pages/NewRepairPage.tsx', 'utf8'),
    readFile('apps/dev-preview-web/src/components/RepairDeviceTypeCatalogPanel.tsx', 'utf8'),
    readFile('apps/dev-preview-web/src/pages/RepairCatalogsPage.tsx', 'utf8'),
    readFile('apps/dev-preview-web/src/components/ui/overlays.tsx', 'utf8'),
    readFile('apps/dev-preview-web/src/components/ui/ui.module.css', 'utf8'),
  ]);
  assert.match(migration, /createTable\('repair_device_types'\)/u);
  assert.match(migration, /repair_device_type_pending_values/u);
  assert.match(migration, /repair_device_type_catalog_events_contract_ck/u);
  assert.match(migration, /append-only/u);
  assert.doesNotMatch(migration, /Tablet QA|Consola retro QA/u);
  assert.match(repository, /count\('repair_intakes\.repair_id'\)\.distinct/u);
  assert.match(repository, /updateTable\('repair_intakes'\)\.set\(\{ canonical_device_type_id: deviceTypeId \}\)/u);
  assert.match(repository, /leftJoin\('repair_device_types'/u);
  assert.match(useCase, /canonicalDeviceTypeId/u);
  assert.match(controller, /configuration\/catalogs\/device-types\/pending/u);
  assert.match(form, /getOperationalRepairDeviceTypes/u);
  assert.match(form, /canonicalDeviceTypeId: selectedDeviceType\?\.deviceTypeId/u);
  assert.doesNotMatch(form, /canonicalDeviceTypeId.*canonicalBrandId|canonicalBrandId.*canonicalDeviceTypeId/u);
  assert.match(panel, /CatalogReconciliationSummary/u);
  assert.match(panel, /surface === 'canonical'/u);
  assert.match(catalogs, /device-types/u);
  assert.match(overlay, /data-has-footer/u);
  assert.match(styles, /\.dialog\[data-has-footer="true"\] \.dialogBody/u);
});
