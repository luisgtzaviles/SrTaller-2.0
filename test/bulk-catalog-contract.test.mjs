import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { performance } from 'node:perf_hooks';
import test from 'node:test';

const domain = await import('../dist/modules/catalog/domain/bulk-catalog.js');
const fullRow = (index = 1) => ({ kind: 'PART', title: `Pantalla ${index}`, description: null, category: 'Pantallas', brand: 'Apple', supplierItemCode: null, sku: `REF-${index}`, barcode: `SR${String(index).padStart(4, '0')}`, basePriceMinor: 139900, referenceCostMinor: 48000 });

test('bulk rows support the required 1k and target 10k envelope with explicit zero and blank cost', () => {
  const thousand = domain.parseBulkRows(Array.from({ length: 1_000 }, (_, index) => fullRow(index + 1)), 'FULL');
  assert.equal(thousand.length, 1_000);
  const target = domain.parseBulkRows(Array.from({ length: 10_000 }, (_, index) => ({ sku: `SKU-${index}`, referenceCostMinor: index === 0 ? 0 : null, basePriceMinor: index })), 'COMPACT');
  assert.equal(target.length, 10_000);
  assert.equal(target[0].referenceCostMinor, 0);
  assert.equal(target[1].referenceCostMinor, null);
  assert.equal(domain.parseBulkRows([{ supplierItemCode: 'PROV-001', basePriceMinor: 12000 }], 'COMPACT')[0].supplierItemCode, 'PROV-001');
});

test('bulk input fails closed above 10k and never uses title-only compact identity', () => {
  assert.throws(() => domain.parseBulkRows(Array.from({ length: 10_001 }, () => fullRow()), 'FULL'), /Catalog input/u);
  assert.throws(() => domain.parseBulkRows([{ title: 'Pantalla' }], 'COMPACT'), /Catalog input/u);
  assert.throws(() => domain.parseBulkRows([{ sku: 'A', basePriceMinor: -1 }], 'COMPACT'), /Catalog input/u);
});

test('50k characterization rejects before persistence without truncation', () => {
  const rows = Array.from({ length: 50_000 }, (_, index) => fullRow(index + 1));
  const heapBefore = process.memoryUsage().heapUsed; const started = performance.now();
  let characterized = 0;
  for (let offset = 0; offset < rows.length; offset += 10_000) characterized += domain.parseBulkRows(rows.slice(offset, offset + 10_000), 'FULL').length;
  const engineMs = performance.now() - started;
  const rejectStarted = performance.now();
  assert.throws(() => domain.parseBulkRows(rows, 'FULL'), /Catalog input/u);
  const rejectMs = performance.now() - rejectStarted; const heapDeltaMiB = Math.max(0, process.memoryUsage().heapUsed - heapBefore) / 1024 / 1024;
  assert.ok(engineMs < 5_000); assert.equal(characterized, 50_000); assert.equal(rows.length, 50_000);
  process.stdout.write(`PBI-041 50k characterization: engine=${engineMs.toFixed(1)}ms rejected=${rejectMs.toFixed(1)}ms heapDelta=${heapDeltaMiB.toFixed(1)}MiB persisted=0\n`);
});

test('identifier and reference normalization are exact and deterministic, not fuzzy', () => {
  assert.equal(domain.normalizeIdentifier('SKU', ' ref-001 '), 'REF-001');
  assert.equal(domain.normalizeReference('  Pantállas  OLED '), 'pantallas oled');
  assert.notEqual(domain.normalizeReference('Pantalla OLED'), domain.normalizeReference('Pantalla OELD'));
});

test('bulk contracts preserve separate prepare, publish, cost and Branch boundaries', async () => {
  const [protectedOperations, repository, migration, ui, css] = await Promise.all([
    readFile('src/modules/catalog/application/catalog-protected-operations.ts', 'utf8'),
    readFile('src/modules/catalog/infrastructure/persistence/kysely-bulk-catalog.repository.ts', 'utf8'),
    readFile('src/infrastructure/database/migrations/20260914150000_catalog_create_bulk_composer.ts', 'utf8'),
    readFile('apps/dev-preview-web/src/pages/BulkCatalogComposerPage.tsx', 'utf8'),
    readFile('apps/dev-preview-web/src/pages/bulk-catalog-composer-page.module.css', 'utf8'),
  ]);
  assert.match(protectedOperations, /catalog\.import\.prepare/u);
  assert.match(protectedOperations, /catalog\.import\.publish/u);
  assert.match(protectedOperations, /writeReferenceCost/u);
  assert.match(protectedOperations, /containsReferenceCost/u);
  assert.match(protectedOperations, /requestsReferenceCost/u);
  assert.match(protectedOperations, /costManage, costRead/u);
  assert.doesNotMatch(repository, /catalog_branch_price_revisions/u);
  assert.match(repository, /input\.includeReferenceCost/u);
  assert.match(repository, /source_type: 'IMPORTED'/u);
  assert.match(migration, /retained_until/u);
  assert.match(migration, /catalog_supplier_listing_resolutions_reject_update/u);
  assert.match(ui, /Nada toca Catalog hasta Aplicar lote/u);
  assert.match(ui, /Hay cambios sin guardar/u);
  assert.match(ui, /Actual:/u);
  assert.match(ui, /Propuesta:/u);
  assert.match(ui, /Corregir mapping/u);
  assert.match(ui, /SUPPLY/u);
  assert.match(ui, /rows\.slice\(first, first \+ 22\)/u);
  assert.match(ui, /translateY/u);
});
