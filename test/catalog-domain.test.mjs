import assert from 'node:assert/strict';
import test from 'node:test';

import {
  CatalogInputError,
  catalogKindCapabilities,
  normalizeCatalogIdentifier,
  normalizeCatalogText,
  normalizedSku,
  parseMinorAmount,
} from '../dist/modules/catalog/domain/catalog-item.js';
import { CatalogService } from '../dist/modules/catalog/application/catalog.service.js';
import { CatalogProtectedOperations } from '../dist/modules/catalog/application/catalog-protected-operations.js';
import { TenantWideAuthorizationExecutorService } from '../dist/modules/access/presentation/tenant-wide-authorization.executor.js';
import { ContextualAuthorizationError } from '../dist/modules/access/index.js';

const tenantId = '10000000-0000-4000-8000-000000000040';
const branchId = '20000000-0000-4000-8000-000000000040';
const categoryId = '30000000-0000-4000-8000-000000000040';
const itemId = '40000000-0000-4000-8000-000000000040';
const requestId = '50000000-0000-4000-8000-000000000040';

test('catalog normalization does not turn similar commercial names into identity', () => {
  assert.equal(normalizeCatalogText('  Pantalla  ÍPhone  11 OLED '), 'pantalla iphone 11 oled');
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
  const operations = new CatalogProtectedOperations(contextual, tenantWide, service);

  assert.deepEqual(await operations.search({}, {}, false), { includeCost: false });
  assert.deepEqual(observed.splice(0), [['branch', { capability: 'price_list.read', kind: 'read' }]]);
  assert.deepEqual(await operations.search({}, {}, true), { includeCost: true });
  assert.deepEqual(observed.splice(0), [
    ['branch', { capability: 'price_list.read', kind: 'read' }],
    ['branch', { capability: 'catalog.reference_cost.read', kind: 'read' }],
  ]);
  assert.deepEqual(await operations.getItem({}, '30000000-0000-4000-8000-000000000040'), { version: 1 });
  assert.deepEqual(observed.splice(0), [['tenant', { capability: 'catalog.manage', kind: 'read' }]]);
  await operations.createItem({}, { referenceCostAmountMinor: 48000 });
  assert.deepEqual(observed.splice(0).map((entry) => entry[1].capability), [
    'catalog.manage', 'catalog.prices.manage', 'catalog.reference_cost.manage',
  ]);
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

test('commercial reference governance is fixed to catalog.manage and preserves inline review intent', async () => {
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
    async createCategory(_context, input, reviewStatus) { return { input, reviewStatus }; },
  };
  const operations = new CatalogProtectedOperations(contextual, tenantWide, service);
  assert.deepEqual(await operations.listAdministrationReferences({}), { scope: { tenantId, branchId } });
  assert.deepEqual(await operations.createPendingCategory({}, { name: 'Termos' }), { input: { name: 'Termos' }, reviewStatus: 'PENDING' });
  assert.deepEqual(observed, [
    { capability: 'catalog.manage', kind: 'read' },
    { capability: 'catalog.manage', kind: 'state-change' },
  ]);
});
