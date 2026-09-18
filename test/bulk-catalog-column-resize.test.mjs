import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import {
  COLUMN_MAX_WIDTH,
  COLUMN_MIN_WIDTH,
  DEFAULT_COLUMN_WIDTHS,
  derivePolicyDrivenColumns,
  normalizeColumnWidth,
  normalizeColumnWidths,
  resizeColumnWidth,
} from '../apps/dev-preview-web/src/pages/bulk-catalog-composer-model.mjs';

const policyA = Object.freeze([
  { key: 'kind', level: 'REQUIRED' },
  { key: 'title', level: 'REQUIRED' },
  { key: 'description', level: 'OPTIONAL' },
  { key: 'category', level: 'REQUIRED' },
  { key: 'brand', level: 'ESSENTIAL' },
  { key: 'supplierItemCode', level: 'OPTIONAL' },
  { key: 'sku', level: 'OPTIONAL' },
  { key: 'barcode', level: 'OPTIONAL' },
  { key: 'referenceCost', level: 'ESSENTIAL' },
  { key: 'basePrice', level: 'REQUIRED' },
]);

test('column width hydration rounds fractional browser coordinates and drops malformed persisted values', () => {
  const widths = normalizeColumnWidths({
    title: 310.68359375,
    kind: -1,
    description: Number.NaN,
    brand: Number.POSITIVE_INFINITY,
    obsolete: 9999,
  });
  assert.equal(widths.title, 311);
  assert.equal(widths.kind, COLUMN_MIN_WIDTH);
  assert.equal(widths.description, DEFAULT_COLUMN_WIDTHS.description);
  assert.equal(widths.brand, DEFAULT_COLUMN_WIDTHS.brand);
  assert.equal(Object.hasOwn(widths, 'obsolete'), false);
  assert.deepEqual(Object.keys(widths), Object.keys(DEFAULT_COLUMN_WIDTHS));
});

test('resizing one canonical field is bounded, integral and does not rebuild unchanged state', () => {
  const initial = normalizeColumnWidths({ title: 310 });
  const resized = resizeColumnWidth(initial, 'title', 310.68359375);
  assert.equal(resized.title, 311);
  assert.equal(resized.kind, initial.kind);
  assert.equal(resizeColumnWidth(resized, 'title', 310.6), resized);
  assert.equal(resizeColumnWidth(resized, 'title', -999).title, COLUMN_MIN_WIDTH);
  assert.equal(resizeColumnWidth(resized, 'title', 9999).title, COLUMN_MAX_WIDTH);
  assert.equal(normalizeColumnWidth(Number.NaN, DEFAULT_COLUMN_WIDTHS.title), DEFAULT_COLUMN_WIDTHS.title);
});

test('policy visibility switches retain width state by canonical field key', () => {
  const policyB = policyA.map((field) => field.key === 'brand' ? { ...field, level: 'OPTIONAL' } : field.key === 'description' ? { ...field, level: 'ESSENTIAL' } : field);
  const widths = resizeColumnWidth(normalizeColumnWidths({}), 'title', 367.4);
  const first = derivePolicyDrivenColumns(policyA);
  const second = derivePolicyDrivenColumns(policyB);
  assert.deepEqual(first.essential, ['kind', 'title', 'category', 'brand', 'cost', 'price']);
  assert.deepEqual(second.essential, ['kind', 'title', 'description', 'category', 'cost', 'price']);
  assert.equal(widths.title, 367);
  assert.ok(first.all.includes('brand'));
  assert.ok(second.all.includes('brand'));
  assert.ok(second.essential.includes('description'));
  assert.ok(Number.isInteger(widths.description));
});

test('Composer normalizes persisted widths and routes pointer and keyboard resize through the canonical update path', async () => {
  const page = await readFile('apps/dev-preview-web/src/pages/BulkCatalogComposerPage.tsx', 'utf8');
  assert.match(page, /normalizeColumnWidths\(JSON\.parse\(sessionStorage\.getItem\('srtaller:bulk-composer:column-widths:v1'\)/u);
  assert.match(page, /resizeColumnWidth\(value, column, initial \+ pointerEvent\.clientX - start\)/u);
  assert.match(page, /resizeColumnWidth\(value, column, value\[column\] \+ \(event\.key === 'ArrowRight' \? 12 : -12\)\)/u);
  assert.match(page, /useMemo\(\(\) => mode === 'COMPACT'/u);
  assert.doesNotMatch(page, /initial \+ pointerEvent\.clientX - start\) \}[^\n]*Math\.max/u);
});
