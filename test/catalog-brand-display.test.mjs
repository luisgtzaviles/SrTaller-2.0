import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import { normalizeBrandDisplay } from '../apps/dev-preview-web/src/catalog-brand-display.mjs';

function normalizedIdentityKey(value) {
  return String(value).normalize('NFD').replace(/[\u0300-\u036f]/gu, '').toLocaleLowerCase('es-MX')
    .replace(/\s+/gu, ' ').trim();
}

test('pending Brand display is derived without changing raw provenance or normalized grouping', () => {
  const rawObservations = Object.freeze(['SAMSUNG', ' samsung ', 'Samsung']);
  const displayNames = rawObservations.map((raw) => normalizeBrandDisplay(raw));

  assert.deepEqual(rawObservations, ['SAMSUNG', ' samsung ', 'Samsung']);
  assert.deepEqual(displayNames, ['Samsung', 'Samsung', 'Samsung']);
  assert.deepEqual(new Set(rawObservations.map(normalizedIdentityKey)), new Set(['samsung']));
});

test('Brand display uses an exact canonical spelling, protects acronyms and never fuzzy-matches', () => {
  const canonicals = Object.freeze(['Apple', 'OnePlus', 'iFixit']);

  assert.equal(normalizeBrandDisplay('  APPLE  ', canonicals), 'Apple');
  assert.equal(normalizeBrandDisplay('oneplus', canonicals), 'OnePlus');
  assert.equal(normalizeBrandDisplay('SAMSUNG'), 'Samsung');
  assert.equal(normalizeBrandDisplay('samsung'), 'Samsung');
  assert.equal(normalizeBrandDisplay('XIAOMI'), 'Xiaomi');
  assert.equal(normalizeBrandDisplay('MOTOROLA'), 'Motorola');
  assert.equal(normalizeBrandDisplay('HUAWEI'), 'Huawei');
  assert.equal(normalizeBrandDisplay('LG'), 'LG');
  assert.equal(normalizeBrandDisplay('ZTE'), 'ZTE');
  assert.equal(normalizeBrandDisplay('iFixit'), 'iFixit');
  assert.equal(normalizeBrandDisplay('SAMSUGN', canonicals), 'Samsugn');
  assert.notEqual(normalizedIdentityKey('SAMSUGN'), normalizedIdentityKey('Samsung'));
});

test('pending Brand governance presents the derived proposal but leaves resolution and authorization explicit', async () => {
  const source = await readFile('apps/dev-preview-web/src/components/CatalogPriceListReferencesPanel.tsx', 'utf8');

  assert.match(source, /normalizeBrandDisplay\(value\.rawLabel, allItems\.map\(\(item\) => item\.name\)\)/u);
  assert.match(source, /Observado: \$\{item\.rawLabel\} · clave \$\{item\.normalizedKey\}/u);
  assert.match(source, /setResolutionName\(pendingDisplayName\(value\)\)/u);
  assert.match(source, /catalog\.configuration\.manage/u);
  assert.doesNotMatch(source, /fuzzy/iu);

  const catalogApi = await readFile('apps/dev-preview-web/src/catalog-api.ts', 'utf8');
  assert.match(catalogApi, /export function normalizeCatalogReferenceText/u);
  assert.match(catalogApi, /toLocaleLowerCase\('es-MX'\)/u);
});
