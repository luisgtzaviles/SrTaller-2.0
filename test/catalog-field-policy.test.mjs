import assert from 'node:assert/strict';
import test from 'node:test';
import { CatalogFieldPolicyInputError, CatalogFieldPolicyService } from '../dist/modules/catalog/application/catalog-field-policy.service.js';
import { CatalogFieldPolicyConcurrencyConflictError } from '../dist/modules/catalog/application/ports/catalog-field-policy-repository.port.js';
import { catalogFieldPolicyRegistry, productDefaultCatalogFieldPolicyLevels, validateCatalogFieldPolicyLevels } from '../dist/modules/catalog/domain/catalog-field-policy.js';
import { CatalogProtectedOperations } from '../dist/modules/catalog/application/catalog-protected-operations.js';

const tenantA = 'a0000000-0000-4000-8000-000000000041';
const tenantB = 'b0000000-0000-4000-8000-000000000041';
function context(tenantId) { return Object.freeze({ tenantId, branchId: 'c0000000-0000-4000-8000-000000000041', stationId: 'd0000000-0000-4000-8000-000000000041', sessionId: 'e0000000-0000-4000-8000-000000000041', actorUserId: 'f0000000-0000-4000-8000-000000000041', actorDisplayName: 'Owner QA', capability: 'catalog.configuration.manage', commitGuards: Object.freeze([{ async confirmCurrent() { return true; }, async confirmTemporalCurrent() { return true; } }]) }); }
function repository() { const records = new Map(); const versions = []; return { records, versions, async readCatalogFieldPolicy(scope) { return records.get(scope.tenantId) ?? null; }, async changeCatalogFieldPolicy(ctx, change) { const current = records.get(ctx.tenantId); const version = current?.policyVersion ?? 0; if (version !== change.expectedVersion) throw new CatalogFieldPolicyConcurrencyConflictError(); const record = Object.freeze({ schemaVersion: change.schemaVersion, policyVersion: version + 1, fieldLevels: change.fieldLevels, updatedAt: change.occurredAt.toISOString() }); records.set(ctx.tenantId, record); versions.push(Object.freeze({ tenantId: ctx.tenantId, previousVersion: version, policyVersion: version + 1, action: change.action, capability: ctx.capability, fieldLevels: change.fieldLevels })); return record; } }; }

test('catalog field registry is finite, preserves fixed FULL minima and has product defaults', () => {
  assert.deepEqual(catalogFieldPolicyRegistry.map(({ key }) => key), ['kind', 'title', 'description', 'category', 'brand', 'supplierItemCode', 'sku', 'barcode', 'referenceCost', 'basePrice']);
  assert.deepEqual(productDefaultCatalogFieldPolicyLevels(), { kind: 'REQUIRED', title: 'REQUIRED', description: 'OPTIONAL', category: 'REQUIRED', brand: 'OPTIONAL', supplierItemCode: 'OPTIONAL', sku: 'OPTIONAL', barcode: 'OPTIONAL', referenceCost: 'OPTIONAL', basePrice: 'REQUIRED' });
  assert.throws(() => validateCatalogFieldPolicyLevels({ kind: 'OPTIONAL' }), TypeError);
  assert.throws(() => validateCatalogFieldPolicyLevels({ unknown: 'OPTIONAL' }), TypeError);
});

test('tenant policy fallback, versioned update, stale write and restore are isolated', async () => {
  const repo = repository(); const service = new CatalogFieldPolicyService(repo, () => new Date('2026-09-17T19:00:00.000Z'), () => '00000000-0000-4000-8000-000000000041');
  const initialA = await service.effective({ tenantId: tenantA }); const initialB = await service.effective({ tenantId: tenantB });
  assert.equal(initialA.source, 'product-default'); assert.deepEqual(initialA.fieldLevels, initialB.fieldLevels);
  const modified = { ...initialA.fieldLevels, brand: 'REQUIRED', referenceCost: 'ESSENTIAL' };
  const updated = await service.update(context(tenantA), { expectedVersion: 0, fieldLevels: modified });
  assert.deepEqual([updated.source, updated.policyVersion, updated.fieldLevels.brand, updated.fieldLevels.referenceCost], ['tenant', 1, 'REQUIRED', 'ESSENTIAL']);
  assert.equal((await service.effective({ tenantId: tenantB })).source, 'product-default');
  await assert.rejects(service.update(context(tenantA), { expectedVersion: 0, fieldLevels: modified }), CatalogFieldPolicyConcurrencyConflictError);
  const restored = await service.reset(context(tenantA), { expectedVersion: 1 });
  assert.deepEqual(restored.fieldLevels, productDefaultCatalogFieldPolicyLevels()); assert.equal(restored.policyVersion, 2);
  assert.deepEqual(repo.versions.map(({ previousVersion, policyVersion, action, capability }) => [previousVersion, policyVersion, action, capability]), [[0, 1, 'catalog_field_policy.updated', 'catalog.configuration.manage'], [1, 2, 'catalog_field_policy.reset', 'catalog.configuration.manage']]);
  await assert.rejects(service.update(context(tenantA), { expectedVersion: 2, fieldLevels: { ...modified, tenantId: tenantB } }), (error) => error instanceof CatalogFieldPolicyInputError && error.parameter === 'fieldLevels');
});

test('catalog field policy API authority composes configuration and sensitive-cost permissions tenant-wide', async () => {
  const requirements = []; const calls = [];
  const authorized = Object.freeze({ tenantId: tenantA, branchId: 'c1000000-0000-4000-8000-000000000041', stationId: 'd1000000-0000-4000-8000-000000000041', sessionId: 'e1000000-0000-4000-8000-000000000041', userId: 'f1000000-0000-4000-8000-000000000041', userDisplayName: 'Policy Admin', capability: 'catalog.configuration.manage', commitGuard: Object.freeze({ async confirmCurrent() { return true; }, async confirmTemporalCurrent() { return true; } }) });
  const tenantWide = { async execute(_evidence, requirement, operation) { requirements.push(requirement); return operation({ ...authorized, capability: requirement.capability }); } };
  const policy = { async effective(scope) { calls.push(['read', scope]); return { source: 'product-default' }; }, async update(context, input) { calls.push(['update', context, input]); return { source: 'tenant' }; }, async reset(context, input) { calls.push(['reset', context, input]); return { source: 'tenant' }; } };
  const operations = new CatalogProtectedOperations({}, tenantWide, {}, {}, {}, {}, policy);
  await operations.getFieldPolicy({});
  assert.deepEqual(requirements.splice(0).map(({ capability, kind }) => [capability, kind]), [['catalog.configuration.read', 'read'], ['catalog.reference_cost.read', 'read']]);
  await operations.updateFieldPolicy({}, { expectedVersion: 0, fieldLevels: productDefaultCatalogFieldPolicyLevels() });
  assert.deepEqual(requirements.splice(0).map(({ capability, kind }) => [capability, kind]), [['catalog.configuration.manage', 'state-change'], ['catalog.reference_cost.manage', 'state-change']]);
  assert.deepEqual(calls[1][1].capability, 'catalog.configuration.manage');
  assert.equal(calls[1][1].tenantId, tenantA);
  assert.equal('tenantId' in calls[1][2], false);
});
