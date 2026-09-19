import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import { derivePolicyDrivenColumns } from '../apps/dev-preview-web/src/pages/bulk-catalog-composer-model.mjs';

const fields = Object.freeze([
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

test('policy-driven Essentials include required and essential fields in registry order while Todas retains optional fields', () => {
  const result = derivePolicyDrivenColumns(fields);
  assert.deepEqual(result.essential, ['kind', 'title', 'category', 'brand', 'cost', 'price']);
  assert.deepEqual(result.required, ['kind', 'title', 'category', 'price']);
  assert.deepEqual(result.all, ['kind', 'title', 'description', 'category', 'brand', 'supplierItemCode', 'sku', 'barcode', 'cost', 'price']);
  assert.equal(result.essential.includes('description'), false);
  assert.equal(result.all.includes('description'), true);
});

test('policy changes deterministically add and remove configurable Essentials without changing the full authorized grid', () => {
  const descriptionEssential = fields.map((field) => field.key === 'description' ? { ...field, level: 'ESSENTIAL' } : field.key === 'brand' ? { ...field, level: 'OPTIONAL' } : field);
  const result = derivePolicyDrivenColumns(descriptionEssential);
  assert.deepEqual(result.essential, ['kind', 'title', 'description', 'category', 'cost', 'price']);
  assert.equal(result.all.includes('brand'), true);
  assert.equal(result.essential.includes('brand'), false);
});

test('server-redacted cost metadata never produces a visible cost column even if the tenant marks it required', () => {
  const result = derivePolicyDrivenColumns(fields.filter((field) => field.key !== 'referenceCost'));
  assert.equal(result.all.includes('cost'), false);
  assert.equal(result.essential.includes('cost'), false);
  assert.equal(result.required.includes('cost'), false);
});

test('Composer consumes the safe operational policy read and marks required headers without making required values errors', async () => {
  const [page, api, controller] = await Promise.all([
    readFile('apps/dev-preview-web/src/pages/BulkCatalogComposerPage.tsx', 'utf8'),
    readFile('apps/dev-preview-web/src/catalog-api.ts', 'utf8'),
    readFile('src/modules/catalog/presentation/catalog.controller.ts', 'utf8'),
  ]);
  assert.match(api, /getBulkCatalogFieldPolicy\([^)]*\).*\/api\/catalog\/bulk\/field-policy/u);
  assert.match(controller, /@Get\('bulk\/field-policy'\)/u);
  assert.match(page, /derivePolicyDrivenColumns\(fieldPolicy\.fields\)/u);
  assert.match(page, /requiredColumns\.has\(column\).*obligatorio/u);
  assert.match(page, /mode === 'FULL' && !fullPolicyReady/u);
  assert.doesNotMatch(page, /getCatalogFieldPolicy\(/u);
});
