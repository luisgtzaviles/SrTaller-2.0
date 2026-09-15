import assert from 'node:assert/strict';

import { syntheticSupplierDemoRows } from '../../apps/dev-preview-web/src/pages/bulk-catalog-composer-model.mjs';

export const SYNTHETIC_DEMO_SOURCE_ID = '1dbec1cf-eb2e-4f96-b3f0-caab42316855';
export const SYNTHETIC_DEMO_SOURCE_NAME = 'Proveedor Demo';
export const SYNTHETIC_DEMO_TENANT_ID = '00000000-0000-4000-8000-000000000001';

export const SYNTHETIC_DEMO_EXPECTED_COUNTS = Object.freeze({
  sources: 1,
  versions: 3,
  rawPayloads: 3,
  listings: 4_500,
  batches: 3,
  decisions: 4_500,
  resolutions: 1_800,
  memory: 1_800,
  retirementPlans: 1,
  retirementEvents: 1,
  items: 1_500,
  identifiers: 3_000,
  priceRevisions: 1_500,
  costRevisions: 1_364,
  branchPriceRevisions: 0,
  auditEvents: 3_000,
});

export function assertCleanupInvocation({ execute, sourceId, expectedName }) {
  if (!execute) return;
  assert.equal(sourceId, SYNTHETIC_DEMO_SOURCE_ID, 'Local cleanup source id is not the governed Demo fixture.');
  assert.equal(expectedName, SYNTHETIC_DEMO_SOURCE_NAME, 'Local cleanup source name is not the governed Demo fixture.');
}

export function assertExpectedCounts(actual) {
  for (const [name, expected] of Object.entries(SYNTHETIC_DEMO_EXPECTED_COUNTS)) {
    assert.equal(Number(actual[name]), expected, `Synthetic Demo ${name} drifted; refusing cleanup.`);
  }
}

export function assertSyntheticListings(listings) {
  const version1 = syntheticSupplierDemoRows(1);
  const version2 = syntheticSupplierDemoRows(2);
  assert.equal(listings.length, SYNTHETIC_DEMO_EXPECTED_COUNTS.listings);
  const seenByVersion = new Map();
  for (const listing of listings) {
    assert.ok([1, 2, 3].includes(Number(listing.sequence_number)), 'Unexpected Demo version sequence.');
    const rowNumber = Number(listing.row_number);
    assert.ok(Number.isInteger(rowNumber) && rowNumber >= 1 && rowNumber <= 1_500, 'Unexpected Demo listing row.');
    const first = version1[rowNumber - 1];
    const second = version2[rowNumber - 1];
    assert.ok(first && second);
    assert.equal(listing.item_kind, first.kind);
    assert.equal(listing.supplier_description, 'Observación sintética');
    assert.ok([first.title, second.title].includes(listing.supplier_title), 'Listing title does not belong to the synthetic generator.');
    assert.ok([first.category, second.category].includes(listing.category_label), 'Listing category does not belong to the synthetic generator.');
    assert.ok([first.brand, second.brand].includes(listing.brand_label ?? ''), 'Listing brand does not belong to the synthetic generator.');
    assert.ok([first.supplierItemCode, second.supplierItemCode].includes(listing.supplier_item_code ?? ''), 'Listing supplier code does not belong to the synthetic generator.');
    const allowedCosts = [first.cost, second.cost].map((value) => value === '' ? null : Math.round(Number(value) * 100));
    assert.ok(allowedCosts.includes(listing.supplier_cost_minor === null ? null : Number(listing.supplier_cost_minor)), 'Listing cost does not belong to the synthetic generator.');
    seenByVersion.set(Number(listing.sequence_number), (seenByVersion.get(Number(listing.sequence_number)) ?? 0) + 1);
  }
  assert.deepEqual(Object.fromEntries(seenByVersion), { 1: 1_500, 2: 1_500, 3: 1_500 });
}

export function assertSyntheticItems(items) {
  const expected = new Map(syntheticSupplierDemoRows(1).map((row) => [`${row.kind}:${row.title}`, row]));
  assert.equal(items.length, SYNTHETIC_DEMO_EXPECTED_COUNTS.items);
  for (const item of items) {
    const fixture = expected.get(`${item.kind}:${item.title}`);
    assert.ok(fixture, 'CatalogItem does not belong to the synthetic Demo generator.');
    assert.equal(item.description, 'Observación sintética');
    assert.equal(item.status, 'INACTIVE');
    assert.equal(Number(item.version), 2);
    expected.delete(`${item.kind}:${item.title}`);
  }
  assert.equal(expected.size, 0, 'The synthetic Demo CatalogItem set is incomplete.');
}
