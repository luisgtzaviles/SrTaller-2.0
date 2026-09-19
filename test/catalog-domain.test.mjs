import assert from 'node:assert/strict';
import test from 'node:test';

import {
  CatalogConflictError,
  CatalogInputError,
  catalogKindCapabilities,
  normalizeCatalogIdentifier,
  normalizeCatalogText,
  normalizedSku,
  parseMinorAmount,
} from '../dist/modules/catalog/domain/catalog-item.js';
import { CatalogService } from '../dist/modules/catalog/application/catalog.service.js';
import { CatalogOperationAccessDeniedError, CatalogProtectedOperations } from '../dist/modules/catalog/application/catalog-protected-operations.js';
import { TenantWideAuthorizationExecutorService } from '../dist/modules/access/presentation/tenant-wide-authorization.executor.js';
import { ContextualAuthorizationError } from '../dist/modules/access/index.js';

const tenantId = '10000000-0000-4000-8000-000000000040';
const branchId = '20000000-0000-4000-8000-000000000040';
const categoryId = '30000000-0000-4000-8000-000000000040';
const itemId = '40000000-0000-4000-8000-000000000040';
const requestId = '50000000-0000-4000-8000-000000000040';

test('catalog normalization does not turn similar commercial names into identity', () => {
  assert.equal(normalizeCatalogText('  Pantalla  ÍPhone  11 OLED '), 'pantalla iphone 11 oled');
  assert.equal(normalizeCatalogText('  PANTALLAS   '), normalizeCatalogText('pantallas'));
  assert.notEqual(normalizeCatalogText('Pantalla'), normalizeCatalogText('Pantallas'));
  assert.notEqual(normalizeCatalogText('Pantalla iPhone 11 OLED'), normalizeCatalogText('Pantalla iPhone 11 LCD'));
  assert.equal(normalizedSku(' ref.ip11-oled '), 'REF.IP11-OLED');
  assert.equal(normalizeCatalogIdentifier('BARCODE', ' sr00000042 '), 'SR00000042');
  assert.throws(() => normalizeCatalogIdentifier('BARCODE', 'abc'), CatalogInputError);
  assert.throws(() => normalizedSku('ref 40'), CatalogInputError);
});

test('kind capabilities keep commercial offer separate from future inventory ownership', () => {
  assert.deepEqual(catalogKindCapabilities.PART, { sellable: true, stockable: true, purchasable: true, applicableToRepair: true });
  assert.deepEqual(catalogKindCapabilities.PRODUCT, { sellable: true, stockable: true, purchasable: true, applicableToRepair: false });
  assert.deepEqual(catalogKindCapabilities.SERVICE, { sellable: true, stockable: false, purchasable: false, applicableToRepair: true });
  assert.deepEqual(catalogKindCapabilities.SUPPLY, { sellable: false, stockable: true, purchasable: true, applicableToRepair: false });
  assert.equal(parseMinorAmount(0, 'amount'), 0);
  for (const invalid of [-1, 1.2, Number.MAX_SAFE_INTEGER + 1, '100']) {
    assert.throws(() => parseMinorAmount(invalid, 'amount'), CatalogInputError);
  }
});

function mutationContext() {
  return Object.freeze({
    tenantId,
    branchId,
    stationId: '60000000-0000-4000-8000-000000000040',
    sessionId: '70000000-0000-4000-8000-000000000040',
    actorUserId: '80000000-0000-4000-8000-000000000040',
    actorDisplayName: 'Owner QA',
    capability: 'catalog.manage',
    commitGuards: [],
  });
}

test('catalog input is allowlisted, bounded, minor-unit based and currency comes from Tenancy', async () => {
  let created; let searched;
  const repository = {
    async createItem(context, input) { created = { context, input }; return { itemId: input.itemId, version: 1 }; },
    async search(_scope, input) { searched = input; return { items: [], totalCount: input.page }; },
  };
  const service = new CatalogService(repository, async (receivedTenantId) => {
    assert.equal(receivedTenantId, tenantId);
    return 'MXN';
  });
  await service.createItem(mutationContext(), {
    kind: 'SERVICE', title: 'Limpieza centro de carga', description: null,
    categoryId, brandId: null, sku: null, barcode: null,
    basePriceAmountMinor: 35000, referenceCostAmountMinor: null,
    expectedVersion: 0, clientRequestId: requestId,
  });
  assert.equal(created.input.currency, 'MXN');
  assert.equal(created.input.basePrice.amountMinor, 35000);
  assert.equal(created.input.referenceCost, null);
  assert.equal(created.input.kind, 'SERVICE');

  await assert.rejects(
    service.createItem(mutationContext(), {
      kind: 'SERVICE', title: 'Limpieza', categoryId, basePriceAmountMinor: 35000,
      expectedVersion: 0, clientRequestId: requestId, tenantId: 'attacker',
    }),
    (error) => error instanceof CatalogInputError && error.parameter === 'payload',
  );
  await assert.rejects(
    service.createItem(mutationContext(), {
      kind: 'SERVICE', title: 'Limpieza', categoryId, barcode: { value: 'SR00000042' },
      basePriceAmountMinor: 35000, expectedVersion: 0, clientRequestId: requestId,
    }),
    (error) => error instanceof CatalogInputError && error.parameter === 'identifier',
  );
  assert.throws(
    () => service.search({ tenantId, branchId }, { query: 'x'.repeat(121) }, false),
    (error) => error instanceof CatalogInputError && error.parameter === 'query',
  );
  await service.search({ tenantId, branchId }, { query: 'pantalla', kind: 'PART' }, false);
  assert.equal(searched.kind, 'PART');
  assert.throws(
    () => service.search({ tenantId, branchId }, { query: '', kind: 'SUPPLY' }, false),
    (error) => error instanceof CatalogInputError && error.parameter === 'kind',
  );
  await assert.rejects(
    service.createCategory(mutationContext(), { name: 'Pantallas\u0000', expectedVersion: 0, clientRequestId: requestId }),
    CatalogInputError,
  );
});

test('protected operations require fixed server capabilities and never let the cost preference grant access', async () => {
  const observed = [];
  const context = Object.freeze({
    ...mutationContext(),
    userId: mutationContext().actorUserId,
    userDisplayName: mutationContext().actorDisplayName,
    capability: 'price_list.read',
    commitGuard: Object.freeze({ async confirmCurrent() { return true; }, async confirmTemporalCurrent() { return true; } }),
  });
  const contextual = {
    async execute(_evidence, requirement, operation) {
      observed.push(['branch', requirement]);
      return operation(Object.freeze({ ...context, capability: requirement.capability }));
    },
  };
  const tenantWide = {
    async execute(_evidence, requirement, operation) {
      observed.push(['tenant', requirement]);
      return operation(Object.freeze({ ...context, capability: requirement.capability }));
    },
  };
  const service = {
    async search(_scope, _input, includeCost) { return { includeCost }; },
    async getItem() { return { version: 1 }; },
    async createItem() { return { version: 1 }; },
  };
  const operations = new CatalogProtectedOperations(contextual, tenantWide, {}, service, {}, {});

  assert.deepEqual(await operations.search({}, {}, false), { includeCost: false });
  assert.deepEqual(observed.splice(0), [['branch', { capability: 'price_list.read', kind: 'read' }]]);
  assert.deepEqual(await operations.search({}, {}, true), { includeCost: true });
  assert.deepEqual(observed.splice(0), [
    ['branch', { capability: 'price_list.read', kind: 'read' }],
    ['branch', { capability: 'catalog.reference_cost.read', kind: 'read' }],
  ]);
  assert.deepEqual(await operations.getItem({}, '30000000-0000-4000-8000-000000000040'), { version: 1 });
  assert.deepEqual(observed.splice(0), [['branch', { capability: 'price_list.read', kind: 'read' }]]);
  await operations.createItem({}, { referenceCostAmountMinor: 48000 });
  assert.deepEqual(observed.splice(0).map((entry) => entry[1].capability), [
    'catalog.items.create', 'catalog.prices.manage', 'catalog.reference_cost.manage',
  ]);
});

function capabilityExecutor(granted, observed = []) {
  return {
    async execute(_evidence, requirement, operation) {
      observed.push(requirement.capability);
      if (!granted.has(requirement.capability)) throw new ContextualAuthorizationError('ACCESS_DENIED');
      return await operation(Object.freeze({
        ...mutationContext(), userId: mutationContext().actorUserId,
        userDisplayName: mutationContext().actorDisplayName,
        capability: requirement.capability,
        commitGuard: Object.freeze({ async confirmCurrent() { return true; }, async confirmTemporalCurrent() { return true; } }),
      }));
    },
  };
}

test('granular item capabilities allow their exact operation, preserve the temporary legacy fallback, and retain composed effects', async () => {
  const observed = [];
  const writes = [];
  const explicit = capabilityExecutor(new Set([
    'catalog.items.create', 'catalog.items.update', 'catalog.items.deactivate',
    'catalog.prices.manage', 'catalog.reference_cost.manage',
  ]), observed);
  const service = {
    async createItem(_context, input) { writes.push(['create', input]); return { itemId, version: 1 }; },
    async getItem() { return { status: 'ACTIVE' }; },
    async updateItem(_context, _itemId, input) { writes.push(['update', input.status]); return { itemId, version: 2 }; },
  };
  const operations = new CatalogProtectedOperations(explicit, explicit, {}, service, {}, {});

  await operations.createItem({}, { referenceCostAmountMinor: 48000 });
  assert.deepEqual(observed.splice(0), [
    'catalog.items.create', 'catalog.prices.manage', 'catalog.reference_cost.manage',
  ]);
  await operations.updateItem({}, itemId, { status: 'ACTIVE' });
  assert.deepEqual(observed.splice(0), ['catalog.items.update', 'catalog.items.update']);
  await operations.updateItem({}, itemId, { status: 'INACTIVE' });
  assert.deepEqual(observed.splice(0), [
    'catalog.items.update', 'catalog.items.deactivate',
  ]);
  assert.deepEqual(writes.map(([kind]) => kind), ['create', 'update', 'update']);

  const legacyObserved = [];
  const legacy = capabilityExecutor(new Set(['catalog.manage', 'catalog.prices.manage']), legacyObserved);
  const legacyOperations = new CatalogProtectedOperations(legacy, legacy, {}, service, {}, {});
  await legacyOperations.createItem({}, {});
  await legacyOperations.updateItem({}, itemId, { status: 'ACTIVE' });
  assert.ok(legacyObserved.includes('catalog.manage'));
});

test('read-only price-list authority cannot mutate items or satisfy composed price and cost effects', async () => {
  const observed = [];
  let writes = 0;
  const readOnly = capabilityExecutor(new Set(['price_list.read']), observed);
  const service = {
    async createItem() { writes += 1; },
    async getItem() { return { status: 'ACTIVE' }; },
    async updateItem() { writes += 1; },
  };
  const operations = new CatalogProtectedOperations(readOnly, readOnly, {}, service, {}, {});
  await assert.rejects(operations.createItem({}, {}), /no approved authority/u);
  await assert.rejects(operations.updateItem({}, itemId, { status: 'ACTIVE' }), /no approved authority/u);
  await assert.rejects(operations.updateItem({}, itemId, { status: 'INACTIVE' }), /no approved authority/u);
  assert.equal(writes, 0);
  assert.ok(observed.every((capability) => capability !== 'catalog.import.publish'));
});

test('ordinary price-list readers can inspect safe item detail but cannot acquire mutation authority', async () => {
  const observed = [];
  let writes = 0;
  const reader = capabilityExecutor(new Set(['price_list.read']), observed);
  const service = {
    async getItem() { return { itemId, title: 'Detalle seguro', version: 1, status: 'ACTIVE' }; },
    async createItem() { writes += 1; },
    async updateItem() { writes += 1; },
  };
  const operations = new CatalogProtectedOperations(reader, reader, {}, service, {}, {});

  assert.deepEqual(await operations.getItem({}, itemId), { itemId, title: 'Detalle seguro', version: 1, status: 'ACTIVE' });
  assert.deepEqual(observed.splice(0), ['price_list.read']);
  await assert.rejects(operations.createItem({}, { basePriceAmountMinor: 100 }), /no approved authority/u);
  await assert.rejects(operations.updateItem({}, itemId, { status: 'ACTIVE' }), /no approved authority/u);
  await assert.rejects(operations.changeBasePrice({}, itemId, { amountMinor: 100 }), ContextualAuthorizationError);
  await assert.rejects(operations.changeReferenceCost({}, itemId, { amountMinor: 100 }), ContextualAuthorizationError);
  assert.equal(writes, 0);
});

test('item update, lifecycle and bulk retirement stay independently protected', async () => {
  const observed = [];
  const service = {
    async getItem() { return { status: 'ACTIVE', version: 1 }; },
    async updateItem(_context, _itemId, input) { return { status: input.status }; },
  };
  const updateOnly = capabilityExecutor(new Set(['catalog.items.update']), observed);
  const updateOperations = new CatalogProtectedOperations(updateOnly, updateOnly, {}, service, {}, {});
  await updateOperations.updateItem({}, itemId, { status: 'ACTIVE' });
  await assert.rejects(updateOperations.updateItem({}, itemId, { status: 'INACTIVE' }), /no approved authority/u);
  await assert.rejects(updateOperations.createRetirementPlan({}, { scope: 'ACTIVE_CATALOG' }), ContextualAuthorizationError);

  const lifecycle = capabilityExecutor(new Set(['catalog.items.deactivate']), observed);
  const lifecycleOperations = new CatalogProtectedOperations(lifecycle, lifecycle, {}, service, {}, {});
  await lifecycleOperations.updateItem({}, itemId, { status: 'INACTIVE' });
  await assert.rejects(lifecycleOperations.updateItem({}, itemId, { status: 'ACTIVE' }), /no approved authority/u);
  await assert.rejects(lifecycleOperations.createRetirementPlan({}, { scope: 'ACTIVE_CATALOG' }), ContextualAuthorizationError);
});

test('bulk history read is independent from prepare while prepare remains compatible with required history', async () => {
  const observed = [];
  const history = capabilityExecutor(new Set(['catalog.import.read']), observed);
  const bulk = {
    async listSources() { return ['source']; },
    async listVersions() { return ['version']; },
    async getVersion() { return { versionId: 'version', batch: { version: 1 }, rows: [] }; },
    async compare() { return { comparison: true }; },
    async createDraft() { return { versionId: 'draft' }; },
  };
  const reader = new CatalogProtectedOperations(history, history, {}, {}, bulk, {});
  assert.deepEqual(await reader.listSupplierSources({}), ['source']);
  assert.deepEqual(await reader.listSupplierVersions({}), ['version']);
  assert.deepEqual(await reader.getSupplierVersion({}, 'version', false), { versionId: 'version', batch: { version: 1 }, rows: [] });
  assert.deepEqual(await reader.compareSupplierVersions({}, 'left', 'right'), { comparison: true });
  await assert.rejects(reader.createSupplierDraft({}, {}), ContextualAuthorizationError);
  assert.ok(observed.includes('catalog.import.read'));

  const prepareObserved = [];
  const preparer = capabilityExecutor(new Set(['catalog.import.prepare']), prepareObserved);
  const prepareOperations = new CatalogProtectedOperations(preparer, preparer, {}, {}, bulk, {});
  assert.deepEqual(await prepareOperations.listSupplierSources({}), ['source']);
  assert.deepEqual(await prepareOperations.createSupplierDraft({}, {}), { versionId: 'draft' });
  assert.deepEqual(prepareObserved.slice(0, 2), ['catalog.import.read', 'catalog.import.prepare']);
  await assert.rejects(prepareOperations.publishSupplierVersion({}, 'version', {}), CatalogOperationAccessDeniedError);
});

test('bulk direct API guards keep read, prepare, and publish independently enforceable', async () => {
  const bulk = {
    async listSources() { return ['source']; },
    async listVersions() { return ['version']; },
    async getVersion() { return { versionId: 'ready', batch: { version: 7 }, rows: [{ decision: 'APPLY', classification: 'NEW', titleDecision: null, proposal: { basePriceMinor: 100, referenceCostMinor: null } }] }; },
    async compare() { return { comparison: true }; },
    async createSource() { return { sourceId: 'source' }; },
    async createDraft() { return { versionId: 'draft' }; },
    async replaceDraft() { return { versionId: 'draft' }; },
    async analyze() { return { versionId: 'analyzed' }; },
    async decide() { return { versionId: 'decided' }; },
    async decideMany() { return { versionId: 'decided' }; },
    async publish(_context, _versionId, input) { return { lifecycle: 'APPLIED', input }; },
  };
  const readerExecutor = capabilityExecutor(new Set(['catalog.import.read']));
  const reader = new CatalogProtectedOperations(readerExecutor, readerExecutor, {}, {}, bulk, {});
  assert.deepEqual(await reader.listSupplierSources({}), ['source']);
  assert.deepEqual(await reader.listSupplierVersions({}), ['version']);
  assert.deepEqual(await reader.getSupplierVersion({}, 'ready', false), { versionId: 'ready', batch: { version: 7 }, rows: [{ decision: 'APPLY', classification: 'NEW', titleDecision: null, proposal: { basePriceMinor: 100, referenceCostMinor: null } }] });
  assert.deepEqual(await reader.compareSupplierVersions({}, 'older', 'ready'), { comparison: true });
  await assert.rejects(reader.createSupplierSource({}, {}), ContextualAuthorizationError);
  await assert.rejects(reader.createSupplierDraft({}, {}), ContextualAuthorizationError);
  await assert.rejects(reader.replaceSupplierDraft({}, 'draft', {}), ContextualAuthorizationError);
  await assert.rejects(reader.analyzeSupplierVersion({}, 'draft', {}), ContextualAuthorizationError);
  await assert.rejects(reader.decideSupplierRow({}, 'draft', 'row', {}), ContextualAuthorizationError);
  await assert.rejects(reader.publishSupplierVersion({}, 'ready', {}), CatalogOperationAccessDeniedError);

  const preparerExecutor = capabilityExecutor(new Set(['catalog.import.prepare']));
  const preparer = new CatalogProtectedOperations(preparerExecutor, preparerExecutor, {}, {}, bulk, {});
  assert.deepEqual(await preparer.createSupplierSource({}, {}), { sourceId: 'source' });
  assert.deepEqual(await preparer.createSupplierDraft({}, {}), { versionId: 'draft' });
  assert.deepEqual(await preparer.replaceSupplierDraft({}, 'draft', {}), { versionId: 'draft' });
  assert.deepEqual(await preparer.analyzeSupplierVersion({}, 'draft', {}), { versionId: 'analyzed' });
  assert.deepEqual(await preparer.decideSupplierRow({}, 'draft', 'row', {}), { versionId: 'decided' });
  await assert.rejects(preparer.publishSupplierVersion({}, 'ready', {}), CatalogOperationAccessDeniedError);

  const publisherExecutor = capabilityExecutor(new Set(['catalog.import.read', 'catalog.import.publish', 'catalog.items.create', 'catalog.prices.manage']));
  const publisher = new CatalogProtectedOperations(publisherExecutor, publisherExecutor, {}, {}, bulk, {});
  await assert.rejects(publisher.createSupplierDraft({}, {}), ContextualAuthorizationError);
  assert.deepEqual(await publisher.publishSupplierVersion({}, 'ready', {}), { lifecycle: 'APPLIED', input: { expectedBatchVersion: 7 } });
});

test('role-matrix capability unions grant only the catalog operations assigned by roles', async () => {
  const bulk = {
    async listSources() { return ['source']; },
    async createDraft() { return { versionId: 'draft' }; },
    async getVersion() { return { versionId: 'ready', batch: { version: 8 }, rows: [{ decision: 'APPLY', classification: 'NEW', titleDecision: null, proposal: { basePriceMinor: 100, referenceCostMinor: null } }] }; },
    async publish() { return { lifecycle: 'APPLIED' }; },
  };
  const itemService = {
    async search(_scope, _input, includeCost) { return { includeCost }; },
    async createItem() { return { itemId, version: 1 }; },
  };
  const profiles = Object.freeze({
    attention: new Set(['price_list.read']),
    encargado: new Set(['price_list.read', 'catalog.items.create', 'catalog.items.update', 'catalog.items.deactivate', 'catalog.prices.manage', 'catalog.import.read', 'catalog.import.prepare']),
    publisher: new Set(['price_list.read', 'catalog.import.read', 'catalog.import.publish', 'catalog.items.create', 'catalog.prices.manage']),
    costViewer: new Set(['price_list.read', 'catalog.reference_cost.read']),
  });

  const attention = new CatalogProtectedOperations(capabilityExecutor(profiles.attention), capabilityExecutor(profiles.attention), {}, itemService, bulk, {});
  assert.deepEqual(await attention.search({}, {}, false), { includeCost: false });
  await assert.rejects(attention.search({}, {}, true), ContextualAuthorizationError);
  await assert.rejects(attention.createItem({}, {}), /no approved authority/u);
  await assert.rejects(attention.createSupplierDraft({}, {}), ContextualAuthorizationError);

  const encargado = new CatalogProtectedOperations(capabilityExecutor(profiles.encargado), capabilityExecutor(profiles.encargado), {}, itemService, bulk, {});
  assert.deepEqual(await encargado.createItem({}, {}), { itemId, version: 1 });
  assert.deepEqual(await encargado.createSupplierDraft({}, {}), { versionId: 'draft' });
  await assert.rejects(encargado.publishSupplierVersion({}, 'ready', {}), CatalogOperationAccessDeniedError);

  const publisher = new CatalogProtectedOperations(capabilityExecutor(profiles.publisher), capabilityExecutor(profiles.publisher), {}, itemService, bulk, {});
  assert.deepEqual(await publisher.listSupplierSources({}), ['source']);
  await assert.rejects(publisher.createSupplierDraft({}, {}), ContextualAuthorizationError);
  assert.deepEqual(await publisher.publishSupplierVersion({}, 'ready', {}), { lifecycle: 'APPLIED' });

  const costViewer = new CatalogProtectedOperations(capabilityExecutor(profiles.costViewer), capabilityExecutor(profiles.costViewer), {}, itemService, bulk, {});
  assert.deepEqual(await costViewer.search({}, {}, true), { includeCost: true });
  await assert.rejects(costViewer.createItem({}, {}), /no approved authority/u);

  const effectiveMultiRole = new Set([...profiles.attention, ...profiles.costViewer]);
  assert.deepEqual([...effectiveMultiRole].sort(), ['catalog.reference_cost.read', 'price_list.read']);
  const multiRole = new CatalogProtectedOperations(capabilityExecutor(effectiveMultiRole), capabilityExecutor(effectiveMultiRole), {}, itemService, bulk, {});
  assert.deepEqual(await multiRole.search({}, {}, true), { includeCost: true });
  await assert.rejects(multiRole.createSupplierDraft({}, {}), ContextualAuthorizationError);
});

test('bulk composer composes prepare, cost and publish authority without leaking cost reads', async () => {
  const observed = [];
  const authorized = Object.freeze({
    ...mutationContext(), userId: mutationContext().actorUserId, userDisplayName: mutationContext().actorDisplayName,
    commitGuard: Object.freeze({ async confirmCurrent() { return true; }, async confirmTemporalCurrent() { return true; } }),
  });
  const executor = {
    async execute(_evidence, requirement, operation) {
      observed.push(requirement);
      return operation(Object.freeze({ ...authorized, capability: requirement.capability }));
    },
  };
  const bulk = {
    async createDraft(_context, input) { return { input }; },
    async analyze(_context, _versionId, input) { return { input }; },
    async getVersion() { return { versionId: 'version', batch: { version: 11 }, rows: [{ decision: 'APPLY', classification: 'NEW', titleDecision: null, proposal: { basePriceMinor: 100, referenceCostMinor: 48000 } }] }; },
    async publish(_context, _versionId, input, mayWriteCost) { return { input, mayWriteCost }; },
  };
  const operations = new CatalogProtectedOperations(executor, executor, {}, {}, bulk, {});

  await operations.createSupplierDraft({}, { includeReferenceCost: true, rows: [{ referenceCostMinor: 48000 }] });
  assert.deepEqual(observed.splice(0).map((value) => value.capability), [
    'catalog.import.prepare', 'catalog.reference_cost.read', 'catalog.reference_cost.manage',
  ]);

  await operations.analyzeSupplierVersion({}, '30000000-0000-4000-8000-000000000041', { expectedVersion: 1, includeReferenceCost: true });
  assert.deepEqual(observed.splice(0).map((value) => value.capability), [
    'catalog.import.prepare', 'catalog.reference_cost.read',
  ]);

  await operations.publishSupplierVersion({}, '30000000-0000-4000-8000-000000000041', { expectedVersion: 2, writeReferenceCost: true });
  assert.deepEqual(observed.splice(0).map((value) => value.capability), [
    'catalog.import.read', 'catalog.reference_cost.read', 'catalog.import.publish', 'catalog.items.create', 'catalog.prices.manage', 'catalog.reference_cost.manage', 'catalog.reference_cost.read',
  ]);
});

test('bulk publish binds effect authorization to the inspected batch snapshot and recomposes authority after a conflict', async () => {
  let currentBatchVersion = 3;
  let currentClassification = 'UNCHANGED';
  const publishInputs = [];
  const bulk = {
    async getVersion() {
      return {
        versionId: 'ready',
        batch: { version: currentBatchVersion },
        rows: [{ decision: 'APPLY', classification: currentClassification, titleDecision: null, proposal: { basePriceMinor: null, referenceCostMinor: null } }],
      };
    },
    async publish(_context, _versionId, input) {
      publishInputs.push(input);
      if (input.expectedBatchVersion === 3) {
        currentBatchVersion = 4;
        currentClassification = 'REACTIVATE';
        throw new CatalogConflictError();
      }
      return { lifecycle: 'APPLIED' };
    },
  };
  const publishOnlyExecutor = capabilityExecutor(new Set(['catalog.import.read', 'catalog.import.publish']));
  const publishOnly = new CatalogProtectedOperations(publishOnlyExecutor, publishOnlyExecutor, {}, {}, bulk, {});

  await assert.rejects(
    publishOnly.publishSupplierVersion({}, 'ready', { expectedVersion: 2, clientRequestId: requestId }),
    CatalogConflictError,
  );
  assert.equal(publishInputs[0].expectedBatchVersion, 3);
  await assert.rejects(
    publishOnly.publishSupplierVersion({}, 'ready', { expectedVersion: 2, clientRequestId: requestId }),
    CatalogOperationAccessDeniedError,
  );
  assert.equal(publishInputs.length, 1);

  const reactivationExecutor = capabilityExecutor(new Set(['catalog.import.read', 'catalog.import.publish', 'catalog.items.deactivate']));
  const authorizedRetry = new CatalogProtectedOperations(reactivationExecutor, reactivationExecutor, {}, {}, bulk, {});
  assert.deepEqual(
    await authorizedRetry.publishSupplierVersion({}, 'ready', { expectedVersion: 2, clientRequestId: requestId }),
    { lifecycle: 'APPLIED' },
  );
  assert.equal(publishInputs[1].expectedBatchVersion, 4);
});

test('supplier hard delete cannot bypass the dedicated sensitive-action executor', async () => {
  let bulkCalls = 0;
  const sensitive = {
    async execute(_evidence, action) {
      assert.equal(action, 'catalog.suppliers-delete');
      throw new ContextualAuthorizationError('ACCESS_DENIED');
    },
  };
  const bulk = {
    async deleteSource() { bulkCalls += 1; return 'must-not-run'; },
  };
  const operations = new CatalogProtectedOperations({}, {}, sensitive, {}, bulk, {});
  await assert.rejects(
    operations.deleteSupplierSource({}, '30000000-0000-4000-8000-000000000041', { pin: '7392' }),
    (error) => error instanceof ContextualAuthorizationError && error.code === 'ACCESS_DENIED',
  );
  assert.equal(bulkCalls, 0);
});

test('tenant-wide catalog administration rejects branch-only authority and composes both commit guards', async () => {
  let assignmentScope = 'BRANCH_RESTRICTED';
  let contextualCommits = 0;
  let tenantWideCommits = 0;
  const authorizedContext = Object.freeze({
    tenantId,
    branchId,
    stationId: '60000000-0000-4000-8000-000000000040',
    sessionId: '70000000-0000-4000-8000-000000000040',
    userId: '80000000-0000-4000-8000-000000000040',
    userDisplayName: 'Owner QA',
    capability: 'catalog.manage',
    commitGuard: Object.freeze({
      async confirmCurrent() { contextualCommits += 1; return true; },
      async confirmTemporalCurrent() { return true; },
    }),
  });
  const contextual = {
    async execute(_evidence, requirement, operation) {
      return operation(Object.freeze({ ...authorizedContext, capability: requirement.capability }));
    },
  };
  const runtime = {
    listAccessMatrix: {
      async execute(receivedScope) {
        assert.deepEqual(receivedScope, { tenantId });
        return {
          capabilities: [],
          roles: [{ roleId: 'role-owner', status: 'active', capabilityCodes: ['catalog.manage'] }],
          assignments: [{
            userId: authorizedContext.userId,
            roleId: 'role-owner',
            status: 'active',
            assignmentScope,
            branchId: assignmentScope === 'TENANT_WIDE' ? null : branchId,
          }],
        };
      },
    },
  };
  const guard = {
    async confirmCurrent(receivedScope, capability, transactionContext) {
      tenantWideCommits += 1;
      assert.deepEqual(receivedScope, { tenantId, userId: authorizedContext.userId });
      assert.equal(capability, 'catalog.manage');
      assert.equal(transactionContext.marker, 'transaction');
      return true;
    },
  };
  const executor = new TenantWideAuthorizationExecutorService(contextual, runtime, guard);

  await assert.rejects(
    executor.execute({}, { capability: 'catalog.manage', kind: 'state-change' }, async () => 'forbidden'),
    (error) => error instanceof ContextualAuthorizationError && error.code === 'ACCESS_DENIED',
  );

  assignmentScope = 'TENANT_WIDE';
  const result = await executor.execute(
    {},
    { capability: 'catalog.manage', kind: 'state-change' },
    async (context) => {
      assert.equal(await context.commitGuard.confirmCurrent({ marker: 'transaction' }), true);
      return context.tenantId;
    },
  );
  assert.equal(result, tenantId);
  assert.equal(contextualCommits, 1);
  assert.equal(tenantWideCommits, 1);
});

test('commercial reference governance is fixed and inline capture stays inside item create/edit', async () => {
  const observed = [];
  const authorized = Object.freeze({
    ...mutationContext(), userId: mutationContext().actorUserId, userDisplayName: mutationContext().actorDisplayName,
    commitGuard: Object.freeze({ async confirmCurrent() { return true; }, async confirmTemporalCurrent() { return true; } }),
  });
  const contextual = { async execute() { throw new Error('branch authorization must not govern Tenant references'); } };
  const tenantWide = {
    async execute(_evidence, requirement, operation) {
      observed.push(requirement); return operation(Object.freeze({ ...authorized, capability: requirement.capability }));
    },
  };
  const service = {
    async listReferences(scope) { return { scope }; },
    async resolveBrand(_context, referenceId, input) { return { referenceId, input }; },
    async createItem(_context, input) { return { input }; },
    async mergeCategories(_context, input) { return { input }; },
  };
  const operations = new CatalogProtectedOperations(contextual, tenantWide, {}, service, {}, {});
  assert.deepEqual(await operations.listAdministrationReferences({}), { scope: { tenantId, branchId } });
  assert.deepEqual(await operations.resolveBrand({}, 'pending-brand', { canonicalBrandId: 'brand', expectedVersion: 1 }), { referenceId: 'pending-brand', input: { canonicalBrandId: 'brand', expectedVersion: 1 } });
  assert.deepEqual(await operations.createItem({}, { categoryCapturedValue: 'Termos' }), { input: { categoryCapturedValue: 'Termos' } });
  assert.deepEqual(await operations.mergeCategories({}, { references: ['a', 'b'] }), { input: { references: ['a', 'b'] } });
  assert.deepEqual(observed, [
    { capability: 'catalog.configuration.read', kind: 'read' },
    { capability: 'catalog.configuration.manage', kind: 'state-change' },
    { capability: 'catalog.items.create', kind: 'state-change' },
    { capability: 'catalog.prices.manage', kind: 'state-change' },
    { capability: 'catalog.manage', kind: 'state-change' },
  ]);
});

test('canonical merge commands are bounded, versioned, tenant-authorized and distinct from edit', async () => {
  let received;
  const repository = {
    async mergeCategories(context, input) { received = { context, input }; return { kind: 'category', version: 2 }; },
  };
  const service = new CatalogService(repository, async () => 'MXN');
  const result = await service.mergeCategories(mutationContext(), {
    references: [
      { referenceId: categoryId, expectedVersion: 1 },
      { referenceId: '30000000-0000-4000-8000-000000000041', expectedVersion: 3 },
    ],
    survivorReferenceId: categoryId,
    finalName: 'Pantallas',
    clientRequestId: requestId,
  });
  assert.equal(result.version, 2);
  assert.equal(received.context.tenantId, tenantId);
  assert.equal(received.input.finalNormalizedName, 'pantallas');
  assert.equal(received.input.references[1].expectedVersion, 3);
  await assert.rejects(service.mergeCategories(mutationContext(), { references: [], survivorReferenceId: categoryId, finalName: 'x', clientRequestId: requestId }), CatalogInputError);
  await assert.rejects(service.mergeCategories(mutationContext(), { references: [{ referenceId: categoryId, expectedVersion: 1 }, { referenceId: categoryId, expectedVersion: 1 }], survivorReferenceId: categoryId, finalName: 'x', clientRequestId: requestId }), CatalogInputError);
  await assert.rejects(service.mergeCategories(mutationContext(), { references: [{ referenceId: categoryId, expectedVersion: 1 }, { referenceId: '30000000-0000-4000-8000-000000000041', expectedVersion: 1 }], survivorReferenceId: '30000000-0000-4000-8000-000000000042', finalName: 'x', clientRequestId: requestId }), CatalogInputError);
});
