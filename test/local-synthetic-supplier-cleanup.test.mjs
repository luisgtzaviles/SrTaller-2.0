import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import {
  assertCleanupInvocation,
  assertExpectedCounts,
  assertSyntheticItems,
  assertSyntheticListings,
  SYNTHETIC_DEMO_EXPECTED_COUNTS,
  SYNTHETIC_DEMO_SOURCE_ID,
  SYNTHETIC_DEMO_SOURCE_NAME,
} from '../scripts/lib/local-synthetic-supplier-cleanup.mjs';
import { syntheticSupplierDemoRows } from '../apps/dev-preview-web/src/pages/bulk-catalog-composer-model.mjs';

test('synthetic cleanup requires the exact governed Demo identity before execution', () => {
  assert.doesNotThrow(() => assertCleanupInvocation({ execute: false }));
  assert.doesNotThrow(() => assertCleanupInvocation({ execute: true, sourceId: SYNTHETIC_DEMO_SOURCE_ID, expectedName: SYNTHETIC_DEMO_SOURCE_NAME }));
  assert.throws(() => assertCleanupInvocation({ execute: true, sourceId: crypto.randomUUID(), expectedName: SYNTHETIC_DEMO_SOURCE_NAME }), /not the governed Demo fixture/u);
  assert.throws(() => assertCleanupInvocation({ execute: true, sourceId: SYNTHETIC_DEMO_SOURCE_ID, expectedName: 'AG' }), /not the governed Demo fixture/u);
});

test('synthetic cleanup fails closed when any audited relation drifts', () => {
  assert.doesNotThrow(() => assertExpectedCounts(SYNTHETIC_DEMO_EXPECTED_COUNTS));
  assert.throws(() => assertExpectedCounts({ ...SYNTHETIC_DEMO_EXPECTED_COUNTS, items: 1_499 }), /drifted/u);
});

test('synthetic cleanup recognizes only the internal deterministic fixtures', () => {
  const version1 = syntheticSupplierDemoRows(1);
  const version2 = syntheticSupplierDemoRows(2);
  const listings = [1, 2, 3].flatMap((sequenceNumber) => (sequenceNumber === 1 ? version1 : version2).map((row, index) => ({
    sequence_number: sequenceNumber,
    row_number: index + 1,
    item_kind: row.kind,
    supplier_title: row.title,
    supplier_description: row.description,
    category_label: row.category,
    brand_label: row.brand || null,
    supplier_item_code: row.supplierItemCode || null,
    supplier_cost_minor: row.cost === '' ? null : Number(row.cost) * 100,
  })));
  assert.doesNotThrow(() => assertSyntheticListings(listings));
  assert.throws(() => assertSyntheticListings(listings.map((row, index) => index === 0 ? { ...row, supplier_title: 'Real customer item' } : row)), /does not belong/u);

  const items = version1.map((row) => ({ kind: row.kind, title: row.title, description: row.description, status: 'INACTIVE', version: 2 }));
  assert.doesNotThrow(() => assertSyntheticItems(items));
  assert.throws(() => assertSyntheticItems(items.map((row, index) => index === 0 ? { ...row, status: 'ACTIVE' } : row)));
});

test('cleanup entry point is explicitly local and has no product endpoint', async () => {
  const script = await readFile('scripts/cleanup-local-synthetic-supplier.mjs', 'utf8');
  assert.match(script, /assertGovernedLocalContainer/u);
  assert.match(script, /io\.srtaller\.environment/u);
  assert.match(script, /127\.0\.0\.1/u);
  assert.match(script, /BEGIN ISOLATION LEVEL SERIALIZABLE/u);
  assert.match(script, /DISABLE'\} TRIGGER USER/u);
  assert.match(script, /assertProductTriggersEnabled/u);
  assert.doesNotMatch(script, /session_replication_role/u);
  assert.match(script, /local_synthetic_supplier_cleanup_refused/u);
  assert.doesNotMatch(script, /@Controller|@Delete|catalog\.suppliers\.delete/u);
});
