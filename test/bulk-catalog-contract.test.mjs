import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { performance } from 'node:perf_hooks';
import test from 'node:test';

const domain = await import('../dist/modules/catalog/domain/bulk-catalog.js');
const matching = await import('../dist/modules/catalog/domain/bulk-catalog-candidate-matching.js');
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

test('supplier observed title remains separate from the editable Catalog title proposal', () => {
  const [row] = domain.parseBulkRows([{ ...fullRow(), supplierObservedTitle: 'PANTALLA IPHONE 11 OLED GX >>I', title: 'Pantalla iPhone 11 OLED GX >>I' }], 'FULL');
  assert.equal(row.supplierObservedTitle, 'PANTALLA IPHONE 11 OLED GX >>I');
  assert.equal(row.title, 'Pantalla iPhone 11 OLED GX >>I');
});

test('bounded supplier candidates explain AG changes without deciding identity', () => {
  const history = [
    { itemId: '11111111-1111-4111-8111-111111111111', title: 'Pantalla iPhone 11 Calidad RJ >>', observedTitle: 'Pantalla iPhone 11 Calidad RJ >>', kind: 'PART', categoryIdentity: 'C:pantallas', brandIdentity: 'C:apple', status: 'ACTIVE', version: 4 },
    { itemId: '22222222-2222-4222-8222-222222222222', title: 'Pantalla iPhone 11 Original >>I', observedTitle: 'Pantalla iPhone 11 Original >>I', kind: 'PART', categoryIdentity: 'C:pantallas', brandIdentity: 'C:apple', status: 'ACTIVE', version: 4 },
  ];
  const index = matching.buildSupplierHistoryTokenIndex(history);
  const row = (title) => ({ kind: 'PART', supplierObservedTitle: title, title, description: null, category: 'Pantallas', brand: 'Apple', supplierItemCode: null, sku: null, barcode: null, basePriceMinor: 1, referenceCostMinor: null });
  const liquidation = matching.matchSupplierHistoryCandidates(row('Pantalla iPhone 11 Calidad RJ >> (liquidacion)'), 'C:pantallas', 'C:apple', index);
  const display = matching.matchSupplierHistoryCandidates(row('Display iPhone 11 Original >>I'), 'C:pantallas', 'C:apple', index);
  assert.deepEqual(liquidation.candidates.map(({ itemId }) => itemId), [history[0].itemId]);
  assert.deepEqual(display.candidates.map(({ itemId }) => itemId), [history[1].itemId]);
  assert.equal(liquidation.candidates[0].differences.includes('OBSERVED_ONLY:liquidacion'), true);
  assert.equal(display.candidates[0].differences.includes('OBSERVED_ONLY:display'), true);
});

test('bounded candidates fail closed for identity-bearing and structural differences', () => {
  const base = { itemId: '33333333-3333-4333-8333-333333333333', title: 'Pantalla iPhone 11 Pro OLED Original 128GB Negra', observedTitle: 'Pantalla iPhone 11 Pro OLED Original 128GB Negra', kind: 'PART', categoryIdentity: 'C:pantallas', brandIdentity: 'C:apple', status: 'ACTIVE', version: 1 };
  const index = matching.buildSupplierHistoryTokenIndex([base]);
  const row = (title, kind = 'PART') => ({ kind, supplierObservedTitle: title, title, description: null, category: 'Pantallas', brand: 'Apple', supplierItemCode: null, sku: null, barcode: null, basePriceMinor: 1, referenceCostMinor: null });
  for (const title of [
    'Pantalla iPhone 11 OLED Original 128GB Negra',
    'Pantalla iPhone 11 Pro Plus OLED Original 128GB Negra',
    'Pantalla iPhone 11 Pro Max OLED Original 128GB Negra',
    'Pantalla iPhone 11 Pro INCELL Original 128GB Negra',
    'Pantalla iPhone 11 Pro OLED Calidad 128GB Negra',
    'Pantalla iPhone 11 Pro OLED Original 256GB Negra',
    'Pantalla iPhone 11 Pro OLED Original 128GB Azul',
    'Pantalla iPhone 12 Pro OLED Original 128GB Negra',
  ]) {
    const result = matching.matchSupplierHistoryCandidates(row(title), 'C:pantallas', 'C:apple', index); assert.equal(result.candidates.length, 0, title); assert.equal(result.contradictory, true, title);
  }
  assert.equal(matching.matchSupplierHistoryCandidates(row(base.title, 'PRODUCT'), 'C:pantallas', 'C:apple', index).contradictory, true);
  assert.equal(matching.matchSupplierHistoryCandidates(row(base.title), 'C:fundas', 'C:apple', index).contradictory, true);
  assert.equal(matching.matchSupplierHistoryCandidates(row(base.title), 'C:pantallas', 'C:samsung', index).contradictory, true);
});

test('candidate pool and top set stay bounded at 1,500 rows', () => {
  const history = Array.from({ length: 1_500 }, (_, index) => ({ itemId: `00000000-0000-4000-8000-${String(index).padStart(12, '0')}`, title: `Pantalla iPhone Modelo ${index} Original`, observedTitle: `Pantalla iPhone Modelo ${index} Original`, kind: 'PART', categoryIdentity: 'C:pantallas', brandIdentity: 'C:marca', status: 'ACTIVE', version: 1 }));
  const index = matching.buildSupplierHistoryTokenIndex(history); const started = performance.now();
  const result = matching.matchSupplierHistoryCandidates({ kind: 'PART', supplierObservedTitle: 'Display iPhone Modelo 1499 Original', title: 'Display iPhone Modelo 1499 Original', description: null, category: 'Pantallas', brand: 'Marca', supplierItemCode: null, sku: null, barcode: null, basePriceMinor: 1, referenceCostMinor: null }, 'C:pantallas', 'C:marca', index);
  assert.equal(result.candidates.length, 1); assert.equal(result.candidates[0].itemId, history[1499].itemId); assert.ok(result.candidates.length <= matching.BULK_CATALOG_MAX_CANDIDATES); assert.ok(performance.now() - started < 250);
});

test('bulk contracts preserve separate prepare, publish, retirement, cost and Branch boundaries', async () => {
  const [protectedOperations, repository, migration, reactivationMigration, retirementMigration, supplierHistoryMigration, supplierCapabilityMigration, retirementRepository, sensitiveAction, ui, priceListUi, css, gridLayout, model, shell, feedback, navigation] = await Promise.all([
    readFile('src/modules/catalog/application/catalog-protected-operations.ts', 'utf8'),
    readFile('src/modules/catalog/infrastructure/persistence/kysely-bulk-catalog.repository.ts', 'utf8'),
    readFile('src/infrastructure/database/migrations/20260914150000_catalog_create_bulk_composer.ts', 'utf8'),
    readFile('src/infrastructure/database/migrations/20260914154000_catalog_add_historical_reactivation.ts', 'utf8'),
    readFile('src/infrastructure/database/migrations/20260914153000_catalog_create_retirement_plans.ts', 'utf8'),
    readFile('src/infrastructure/database/migrations/20260914155000_catalog_govern_supplier_history.ts', 'utf8'),
    readFile('src/infrastructure/database/migrations/20260914155100_access_add_supplier_delete_capability.ts', 'utf8'),
    readFile('src/modules/catalog/infrastructure/persistence/kysely-catalog-retirement.repository.ts', 'utf8'),
    readFile('src/modules/access/presentation/sensitive-action-level2.executor.ts', 'utf8'),
    readFile('apps/dev-preview-web/src/pages/BulkCatalogComposerPage.tsx', 'utf8'),
    readFile('apps/dev-preview-web/src/pages/PriceListPage.tsx', 'utf8'),
    readFile('apps/dev-preview-web/src/pages/bulk-catalog-composer-page.module.css', 'utf8'),
    readFile('apps/dev-preview-web/src/pages/bulk-catalog-grid-layout.ts', 'utf8'),
    readFile('apps/dev-preview-web/src/pages/bulk-catalog-composer-model.mjs', 'utf8'),
    readFile('apps/dev-preview-web/src/components/shell/ApplicationShell.tsx', 'utf8'),
    readFile('apps/dev-preview-web/src/components/ui/feedback.tsx', 'utf8'),
    readFile('apps/dev-preview-web/src/components/ui/navigation.tsx', 'utf8'),
  ]);
  assert.match(protectedOperations, /catalog\.import\.prepare/u);
  assert.match(protectedOperations, /catalog\.import\.publish/u);
  assert.match(protectedOperations, /catalog\.items\.bulk_retire/u);
  assert.match(protectedOperations, /catalog\.items\.bulk-retire/u);
  assert.match(protectedOperations, /catalog\.suppliers-delete/u);
  assert.match(protectedOperations, /deleteSupplierSource/u);
  assert.match(protectedOperations, /writeReferenceCost/u);
  assert.match(protectedOperations, /containsReferenceCost/u);
  assert.match(protectedOperations, /requestsReferenceCost/u);
  assert.match(protectedOperations, /costManage, costRead/u);
  assert.doesNotMatch(repository, /catalog_branch_price_revisions/u);
  assert.match(repository, /input\.includeReferenceCost/u);
  assert.match(repository, /source_type: 'IMPORTED'/u);
  assert.match(migration, /retained_until/u);
  assert.match(migration, /catalog_supplier_listing_resolutions_reject_update/u);
  assert.match(reactivationMigration, /'REACTIVATE'/u);
  assert.match(repository, /classification = target\.status === 'INACTIVE' \? 'REACTIVATE'/u);
  assert.match(repository, /expectedStatus = row\.classification === 'REACTIVATE' \? 'INACTIVE' : 'ACTIVE'/u);
  assert.match(repository, /status: 'ACTIVE' as const/u);
  assert.match(repository, /lifecycle: \{ before: 'INACTIVE', after: 'ACTIVE' \}/u);
  assert.match(retirementMigration, /sensitivity_level smallint not null/u);
  assert.match(retirementMigration, /catalog_retirement_events_reject_update/u);
  assert.match(supplierHistoryMigration, /next_version_sequence/u);
  assert.match(supplierHistoryMigration, /catalog_supplier_versions_sequence_uq/u);
  assert.match(supplierHistoryMigration, /catalog_supplier_source_deletion_events/u);
  assert.match(supplierHistoryMigration, /old\.lifecycle = 'INGESTED'/u);
  assert.match(supplierCapabilityMigration, /catalog\.suppliers\.delete/u);
  assert.match(retirementRepository, /isolationLevel: 'serializable'/u);
  assert.match(retirementRepository, /resolution', '=', 'CREATED'/u);
  assert.doesNotMatch(retirementRepository, /deleteFrom\('catalog_items'\)/u);
  assert.match(sensitiveAction, /proof\.userId === context\.userId/u);
  assert.match(sensitiveAction, /consumePinAuthenticationProof/u);
  assert.match(ui, /Nada toca Catalog hasta Aplicar lote/u);
  assert.match(ui, /Hay cambios sin guardar/u);
  assert.match(ui, /Actual:/u);
  assert.match(ui, /Propuesta:/u);
  assert.match(ui, /Corregir mapping/u);
  assert.match(ui, /SUPPLY/u);
  assert.match(ui, /rows\.slice\(first, first \+ 22\)/u);
  assert.match(css, /translateY/u);
  assert.match(css, /\.page \{ min-width: 0;/u);
  assert.match(css, /\.layout \{ min-width: 0;/u);
  assert.match(css, /\.composer > section, \.rowActions \{ min-width: 0;/u);
  assert.match(css, /repeat\(auto-fit, minmax\(180px, 1fr\)\)/u);
  assert.match(gridLayout, /--bulk-grid-offset/u);
  assert.match(ui, /Contexto del lote/u);
  assert.match(ui, /aria-label="Columnas de trabajo"/u);
  assert.match(ui, /supplierObservedTitle/u);
  assert.match(ui, /Original:/u);
  assert.match(ui, /REACTIVATE: 'Reactiva'/u);
  assert.match(ui, /estado \{row\.before\.status === 'INACTIVE' \? 'Inactivo' : 'Activo'\}/u);
  assert.match(ui, /'Reanalizar versión'/u);
  assert.match(ui, /current\.batch\.lifecycle === 'APPLIED' \? 'Resultado aplicado' : 'Reconciliación'/u);
  assert.match(ui, /current\.batch\.lifecycle !== 'APPLIED' \? <div className=\{styles\.groupActions\}/u);
  assert.match(ui, /current\.batch\.lifecycle !== 'APPLIED' \? <div>\s*<Button size="compact" onClick=\{\(\) => void resolve/u);
  assert.doesNotMatch(ui, /Proveedor:\s*\{row\.supplierObservedTitle/u);
  assert.match(ui, /Retirar artículos creados por este lote/u);
  assert.match(ui, /No es una reversión del lote/u);
  assert.match(ui, /Nuevo proveedor/u);
  assert.match(ui, /El número se asignará al guardar/u);
  assert.doesNotMatch(ui, /Caso Owner · 36/u);
  assert.doesNotMatch(ui, /Demo V1 · 1500/u);
  assert.doesNotMatch(ui, /Demo V2 · 1500/u);
  assert.match(model, /ownerSupplierClipboard/u);
  assert.match(model, /syntheticSupplierDemoRows/u);
  assert.match(ui, /Confirmar eliminación definitiva/u);
  assert.match(ui, /Se eliminará permanentemente “\{deleteSourceTarget\?\.name\}” y sus/u);
  assert.match(ui, /¿Confirmas que deseas eliminar “\$\{deleteSourceTarget\?\.name/u);
  assert.match(ui, /Eliminar definitivamente/u);
  assert.match(ui, /deleteArmed/u);
  assert.match(ui, /formatVersionDate\(value\.createdAt, timeZone\)/u);
  assert.match(priceListUi, /Vaciar lista de precios/u);
  assert.match(priceListUi, /identidad, mappings e historia permanecen/u);
  assert.match(ui, /validateComposerDraft/u);
  assert.match(ui, /focusIssue/u);
  assert.match(ui, /data-cell-key/u);
  assert.match(ui, /aria-invalid/u);
  assert.match(ui, /Error siguiente/u);
  assert.match(model, /scope: 'BATCH'/u);
  assert.match(model, /scope: 'CELL'/u);
  assert.doesNotMatch(model, /sourceRevision/u);
  assert.match(repository, /next_version_sequence/u);
  assert.match(repository, /CatalogSupplierDeleteNotAllowedError/u);
  assert.doesNotMatch(repository, /deleteFrom\('catalog_items'\)/u);
  assert.match(shell, /location\.pathname !== '\/listas\/precios\/carga-masiva'/u);
  assert.match(feedback, /export function Toast/u);
  assert.match(navigation, /export function BackLink/u);
  assert.match(css, /\.issueNavigator/u);
  assert.match(css, /\.invalidCell/u);
});
