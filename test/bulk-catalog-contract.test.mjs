import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { performance } from 'node:perf_hooks';
import test from 'node:test';

const domain = await import('../dist/modules/catalog/domain/bulk-catalog.js');
const matching = await import('../dist/modules/catalog/domain/bulk-catalog-candidate-matching.js');
const coverage = await import('../dist/modules/catalog/domain/supplier-coverage.js');
const composerModel = await import('../apps/dev-preview-web/src/pages/bulk-catalog-composer-model.mjs');
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

test('required policy validates the effective Catalog value and never supplier history or a guessed value', () => {
  const levels = { kind: 'REQUIRED', title: 'REQUIRED', description: 'OPTIONAL', category: 'REQUIRED', brand: 'REQUIRED', supplierItemCode: 'OPTIONAL', sku: 'OPTIONAL', barcode: 'OPTIONAL', referenceCost: 'ESSENTIAL', basePrice: 'REQUIRED' };
  const known = { kind: 'PART', title: 'Pantalla iPhone 11', description: null, categoryPresent: true, brandPresent: true, basePriceMinor: 120_00, referenceCostMinor: 60_00 };
  const compactKnown = { kind: null, supplierObservedTitle: 'Observado', title: null, description: null, category: null, brand: null, supplierItemCode: 'SUP-11', sku: null, barcode: null, basePriceMinor: 140_00, referenceCostMinor: null };
  assert.deepEqual(domain.missingRequiredEffectiveFields(levels, compactKnown, known), []);
  assert.deepEqual(domain.missingRequiredEffectiveFields(levels, { ...compactKnown, supplierItemCode: null }, null), ['kind', 'title', 'category', 'brand']);
  assert.deepEqual(domain.missingRequiredEffectiveFields(levels, { ...compactKnown, brand: 'Apple' }, { ...known, brandPresent: false }), []);
  assert.equal(domain.missingRequiredEffectiveValueReason('brand'), 'MISSING_REQUIRED_EFFECTIVE_VALUE:brand');
});

test('required money uses a meaningful effective amount, never an explicit or retained zero', () => {
  const required = { kind: 'REQUIRED', title: 'REQUIRED', description: 'OPTIONAL', category: 'REQUIRED', brand: 'OPTIONAL', supplierItemCode: 'OPTIONAL', sku: 'OPTIONAL', barcode: 'OPTIONAL', referenceCost: 'REQUIRED', basePrice: 'REQUIRED' };
  const optionalCost = { ...required, referenceCost: 'OPTIONAL' };
  const known = { kind: 'PART', title: 'Pantalla conocida', description: null, categoryPresent: true, brandPresent: false, basePriceMinor: 120_00, referenceCostMinor: 60_00 };
  const row = { kind: 'PART', supplierObservedTitle: 'Pantalla nueva', title: 'Pantalla nueva', description: null, category: 'Pantallas', brand: null, supplierItemCode: 'UX0056-001', sku: null, barcode: null, basePriceMinor: 120_00, referenceCostMinor: 60_00 };
  assert.deepEqual(domain.missingRequiredEffectiveFields(required, row, null), []);
  assert.deepEqual(domain.missingRequiredEffectiveFields(required, { ...row, basePriceMinor: 0 }, null), ['basePrice']);
  assert.deepEqual(domain.missingRequiredEffectiveFields(required, { ...row, basePriceMinor: null, referenceCostMinor: null }, known), []);
  assert.deepEqual(domain.missingRequiredEffectiveFields(required, { ...row, basePriceMinor: 0, referenceCostMinor: null }, known), ['basePrice']);
  assert.deepEqual(domain.missingRequiredEffectiveFields(required, { ...row, referenceCostMinor: 0 }, null), ['referenceCost']);
  assert.deepEqual(domain.missingRequiredEffectiveFields(optionalCost, { ...row, referenceCostMinor: 0 }, null), []);
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
  assert.equal(domain.isSafelyCapturableCategoryReference('Accesorios'), true);
  assert.equal(domain.isSafelyCapturableCategoryReference('V2314 COPIA'), false);
  assert.equal(domain.isSafelyCapturableBrandReference('iQOO'), true);
  assert.equal(domain.isSafelyCapturableBrandReference('2314'), false);
});

test('row-decision errors always normalize to a string array across JSON boundaries', () => {
  assert.deepEqual(domain.normalizeRowErrors(['PENDING_ANALYSIS', 1, null]), ['PENDING_ANALYSIS']);
  assert.deepEqual(domain.normalizeRowErrors([]), []);
  assert.deepEqual(domain.normalizeRowErrors({}), []);
  assert.deepEqual(domain.normalizeRowErrors(null), []);
  assert.deepEqual(domain.normalizeRowErrors('PENDING_ANALYSIS'), []);
});

test('duplicate resolution groups authoritative contradictions into one owner decision without title inference', () => {
  const rows = [
    { rowNumber: 1, key: 'SUPPLIER_CODE:RJ-11', errors: ['DUPLICATE_VALUE_CONTRADICTION'], warnings: [] },
    { rowNumber: 2, key: 'SUPPLIER_CODE:RJ-11', errors: ['DUPLICATE_VALUE_CONTRADICTION'], warnings: [] },
    { rowNumber: 3, key: 'SUPPLIER_CODE:OTRO', errors: [], warnings: [] },
  ];
  const grouped = composerModel.groupDuplicateResolutionRows(rows, (row) => row.key, (row) => row.errors, (row) => row.warnings);
  assert.deepEqual(grouped.map((group) => ({ key: group.key, rows: group.members.map((row) => row.rowNumber), unresolved: group.unresolved })), [{ key: 'SUPPLIER_CODE:RJ-11', rows: [1, 2], unresolved: true }]);
  const resolved = composerModel.groupDuplicateResolutionRows(rows.map((row) => row.rowNumber === 2 ? { ...row, errors: [], warnings: ['DUPLICATE_VALUE_CONTRADICTION_SUPERSEDED'] } : { ...row, errors: [] }), (row) => row.key, (row) => row.errors, (row) => row.warnings);
  assert.equal(resolved[0].unresolved, false);
});

test('duplicate resolution groups the SupplierVersion row DTO shape', () => {
  const supplierVersionRows = [
    { rowNumber: 14, targetItemId: 'item-iphone-11', errors: ['DUPLICATE_VALUE_CONTRADICTION'], warnings: [], proposal: { supplierItemCode: 'QA-UX-002A3-ID-1', supplierSku: 'REF-000839' } },
    { rowNumber: 15, targetItemId: 'item-iphone-11', errors: ['DUPLICATE_VALUE_CONTRADICTION'], warnings: [], proposal: { supplierItemCode: 'QA-UX-002A3-ID-1', supplierSku: 'REF-000839' } },
  ];
  const groups = composerModel.groupDuplicateResolutionRows(
    supplierVersionRows,
    (row) => `C:${row.proposal.supplierItemCode.toLowerCase()}`,
    (row) => (Array.isArray(row.errors) ? row.errors.filter((value) => typeof value === 'string') : []),
    (row) => (Array.isArray(row.warnings) ? row.warnings.filter((value) => typeof value === 'string') : []),
  );
  assert.deepEqual(
    groups.map((group) => ({ key: group.key, rows: group.members.map((row) => row.rowNumber) })),
    [{ key: 'C:qa-ux-002a3-id-1', rows: [14, 15] }],
  );
});

test('duplicate winner eligibility permits one explicit existing or prospective identity, never a mixed group', () => {
  const base = { decision: 'UNRESOLVED', errors: ['DUPLICATE_VALUE_CONTRADICTION'], titleDecision: null };
  assert.equal(composerModel.canChooseDuplicateWinner([{ ...base, targetItemId: 'item-1' }, { ...base, targetItemId: 'item-1' }]), true);
  assert.equal(composerModel.canChooseDuplicateWinner([{ ...base, targetItemId: null }, { ...base, targetItemId: null }]), true);
  assert.equal(composerModel.canChooseDuplicateWinner([{ ...base, targetItemId: 'item-1' }, { ...base, targetItemId: null }]), false);
  assert.equal(composerModel.canChooseDuplicateWinner([{ ...base, targetItemId: null }, { ...base, targetItemId: null, titleDecision: 'KEEP_CURRENT' }]), false);
});

test('new-load gate requires an explicit supplier and load intent', () => {
  assert.deepEqual(composerModel.createNewLoadGateState(), { supplierId: null, completeness: null });
  assert.equal(composerModel.canContinueNewLoadGate({ supplierId: null, completeness: null }), false);
  assert.equal(composerModel.canContinueNewLoadGate({ supplierId: 'source-ag', completeness: null }), false);
  assert.equal(composerModel.canContinueNewLoadGate({ supplierId: null, completeness: 'PARTIAL' }), false);
  assert.equal(composerModel.canContinueNewLoadGate({ supplierId: 'source-ag', completeness: 'PARTIAL' }), true);
  assert.equal(composerModel.canContinueNewLoadGate({ supplierId: 'source-ag', completeness: 'COMPLETE' }), true);
  assert.deepEqual(
    composerModel.NEW_LOAD_INTENTS.map(({ value, label }) => ({ value, label })),
    [{ value: 'PARTIAL', label: 'Sólo algunos artículos' }, { value: 'COMPLETE', label: 'La lista completa del proveedor' }],
  );
});

test('supplier observed title remains separate from the editable Catalog title proposal', () => {
  const [row] = domain.parseBulkRows([{ ...fullRow(), supplierObservedTitle: 'PANTALLA IPHONE 11 OLED GX >>I', title: 'Pantalla iPhone 11 OLED GX >>I' }], 'FULL');
  assert.equal(row.supplierObservedTitle, 'PANTALLA IPHONE 11 OLED GX >>I');
  assert.equal(row.title, 'Pantalla iPhone 11 OLED GX >>I');
});

test('complete baseline plausibility only requires acknowledgement for a material coverage collapse', () => {
  const assess = (baselineCount, currentCount) => coverage.assessCompleteBaselinePlausibility({ baselineCount, currentCount, continuedCount: Math.min(baselineCount, currentCount), notObservedCount: Math.max(0, baselineCount - currentCount), additionalCount: Math.max(0, currentCount - baselineCount) });
  assert.equal(assess(100, 95).status, 'NORMAL');
  assert.equal(assess(37, 34).status, 'NORMAL');
  assert.equal(assess(34, 38).status, 'NORMAL');
  assert.equal(assess(1, 38).status, 'NORMAL');
  assert.deepEqual(assess(100, 5), { status: 'REVIEW_REQUIRED', reason: 'LARGE_COVERAGE_DROP', baselineCount: 100, currentCount: 5, continuedCount: 5, notObservedCount: 95, additionalCount: 0, absoluteDrop: 95, reductionPercent: 95 });
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

test('candidate contrasts preserve protected tokens without promoting text to identity conflict', () => {
  const base = { itemId: '33333333-3333-4333-8333-333333333333', title: 'Pantalla iPhone 15 Original', observedTitle: 'Pantalla iPhone 15 Original', kind: 'PART', categoryIdentity: 'C:pantallas', brandIdentity: 'C:apple', status: 'ACTIVE', version: 1 };
  const older = { ...base, itemId: '44444444-4444-4444-8444-444444444444', title: 'Pantalla iPhone 14 Original', observedTitle: 'Pantalla iPhone 14 Original' };
  const index = matching.buildSupplierHistoryTokenIndex([base, older]);
  const row = (title, kind = 'PART') => ({ kind, supplierObservedTitle: title, title, description: null, category: 'Pantallas', brand: 'Apple', supplierItemCode: null, sku: null, barcode: null, basePriceMinor: 1, referenceCostMinor: null });
  const genuinelyNew = matching.matchSupplierHistoryCandidates(row('Pantalla iPhone 16 Original'), 'C:pantallas', 'C:apple', index);
  assert.equal(genuinelyNew.candidates.length, 0);
  assert.deepEqual(genuinelyNew.contrasts.map((contrast) => contrast.itemId), [base.itemId, older.itemId]);
  assert.equal(genuinelyNew.contrasts.every((contrast) => contrast.contrasts.includes('IDENTITY_TOKEN:16')), true);
  assert.equal(genuinelyNew.contrasts.every((contrast) => contrast.differences.includes('OBSERVED_ONLY:16')), true);

  const highSimilarity = matching.matchSupplierHistoryCandidates(row('Pantalla iPhone 16 Pro Original'), 'C:pantallas', 'C:apple', matching.buildSupplierHistoryTokenIndex([{ ...base, title: 'Pantalla iPhone 16 Original', observedTitle: 'Pantalla iPhone 16 Original' }]));
  assert.equal(highSimilarity.candidates.length, 0);
  assert.equal(highSimilarity.contrasts.length, 1);
  assert.equal(highSimilarity.contrasts[0].contrasts.includes('IDENTITY_TOKEN:pro'), true);
  assert.equal(highSimilarity.contrasts[0].differences.includes('OBSERVED_ONLY:pro'), true);

  const structural = matching.matchSupplierHistoryCandidates(row(base.title, 'PRODUCT'), 'C:pantallas', 'C:apple', index);
  assert.equal(structural.candidates.length, 0);
  assert.equal(structural.contrasts.some((contrast) => contrast.contrasts.includes('TYPE')), true);
});

test('candidate pool and top set stay bounded at 1,500 rows', () => {
  const history = Array.from({ length: 1_500 }, (_, index) => ({ itemId: `00000000-0000-4000-8000-${String(index).padStart(12, '0')}`, title: `Pantalla iPhone Modelo ${index} Original`, observedTitle: `Pantalla iPhone Modelo ${index} Original`, kind: 'PART', categoryIdentity: 'C:pantallas', brandIdentity: 'C:marca', status: 'ACTIVE', version: 1 }));
  const index = matching.buildSupplierHistoryTokenIndex(history); const started = performance.now();
  const result = matching.matchSupplierHistoryCandidates({ kind: 'PART', supplierObservedTitle: 'Display iPhone Modelo 1499 Original', title: 'Display iPhone Modelo 1499 Original', description: null, category: 'Pantallas', brand: 'Marca', supplierItemCode: null, sku: null, barcode: null, basePriceMinor: 1, referenceCostMinor: null }, 'C:pantallas', 'C:marca', index);
  assert.equal(result.candidates.length, 1); assert.equal(result.candidates[0].itemId, history[1499].itemId); assert.ok(result.candidates.length <= matching.BULK_CATALOG_MAX_CANDIDATES); assert.ok(performance.now() - started < 250);
});

test('bulk contracts preserve separate prepare, publish, retirement, cost and Branch boundaries', async () => {
  const [protectedOperations, repository, catalogRepository, migration, completenessMigration, titleHistoryMigration, reactivationMigration, retirementMigration, supplierHistoryMigration, supplierCapabilityMigration, retirementRepository, sensitiveAction, ui, priceListUi, css, gridLayout, model, shell, feedback, navigation, bulkService, catalogApi, coveragePolicy] = await Promise.all([
    readFile('src/modules/catalog/application/catalog-protected-operations.ts', 'utf8'),
    readFile('src/modules/catalog/infrastructure/persistence/kysely-bulk-catalog.repository.ts', 'utf8'),
    readFile('src/modules/catalog/infrastructure/persistence/kysely-catalog.repository.ts', 'utf8'),
    readFile('src/infrastructure/database/migrations/20260914150000_catalog_create_bulk_composer.ts', 'utf8'),
    readFile('src/infrastructure/database/migrations/20260916180000_catalog_add_supplier_version_completeness.ts', 'utf8'),
    readFile('src/infrastructure/database/migrations/20260915130000_catalog_add_supplier_observed_title_history.ts', 'utf8'),
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
    readFile('src/modules/catalog/application/bulk-catalog.service.ts', 'utf8'),
    readFile('apps/dev-preview-web/src/catalog-api.ts', 'utf8'),
    readFile('src/modules/catalog/domain/supplier-coverage.ts', 'utf8'),
  ]);
  assert.match(protectedOperations, /catalog\.import\.prepare/u);
  assert.match(protectedOperations, /publishEffectRequirements/u);
  assert.match(protectedOperations, /catalogItemCreate/u);
  assert.match(protectedOperations, /catalogItemUpdate/u);
  assert.match(protectedOperations, /catalogItemDeactivate/u);
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
  assert.match(repository, /const serializeRowErrors = \(value: unknown\): string => JSON\.stringify\(normalizeRowErrors\(value\)\)/u);
  assert.match(repository, /errors: normalizeRowErrors\(value\.errors\)/u);
  assert.match(repository, /const missingRequired = input\.decision === 'EXCLUDE'/u);
  assert.match(repository, /missingRequiredEffectiveFields\(await readEffectiveFieldPolicy\(db, context\.tenantId\), row\.proposal as BulkCatalogRowInput, selectedEffectiveTarget\)/u);
  assert.match(repository, /const persistedDecision: BulkCatalogDecision = missingRequired\.length > 0 \? 'UNRESOLVED' : input\.decision/u);
  assert.match(repository, /const requiredAttention = await db\.selectFrom\('catalog_update_row_decisions'\)/u);
  assert.match(repository, /throw new CatalogRequiredEffectiveValueError\(failures\.length/u);
  assert.match(repository, /source_type: 'IMPORTED'/u);
  assert.match(repository, /title_decision/u);
  assert.match(repository, /canonicalTitle: \{ before: priorItem\.title, after: p\.title \}/u);
  assert.match(repository, /supplierCatalogVersionId: version\.version_id/u);
  assert.match(catalogRepository, /historical_listing\.supplier_title_search', '@@'/u);
  assert.match(catalogRepository, /historical_resolution\.tenant_id', '=', scope\.tenantId/u);
  assert.match(catalogRepository, /historical_batch\.lifecycle', '=', 'APPLIED'/u);
  assert.match(titleHistoryMigration, /title_decision/u);
  assert.match(titleHistoryMigration, /generated always as/u);
  assert.match(titleHistoryMigration, /using gin/u);
  assert.match(titleHistoryMigration, /catalog_supplier_resolutions_item_history_idx/u);
  assert.match(migration, /retained_until/u);
  assert.match(completenessMigration, /completeness varchar\(16\) not null default 'PARTIAL'/u);
  assert.match(completenessMigration, /check \(completeness in \('PARTIAL', 'COMPLETE'\)\)/u);
  assert.match(bulkService, /function completeness\(value: unknown\): SupplierCatalogCompleteness \{ if \(value !== 'PARTIAL' && value !== 'COMPLETE'\) throw new CatalogInputError\('completeness'\); return value; \}/u);
  assert.doesNotMatch(bulkService, /value === undefined\) return 'PARTIAL'/u);
  assert.match(catalogApi, /export type SupplierVersionDraftInput/u);
  assert.match(catalogApi, /function requireSupplierVersionCompleteness/u);
  assert.match(catalogApi, /continuedItems/u);
  assert.match(catalogApi, /additionalItems/u);
  assert.match(catalogApi, /coverageRelation: 'CONTINUED' \| 'NOT_OBSERVED' \| 'ADDITIONAL'/u);
  assert.match(catalogApi, /catalogResolution: 'MATCHED' \| 'CREATED' \| 'EXCLUDED' \| 'CONFLICT' \| null/u);
  assert.match(catalogApi, /coverageReviewAcknowledged/u);
  assert.match(ui, /const canReadBulk = hasOperationalCapability\(capabilities, 'catalog\.import\.read'\) \|\| hasOperationalCapability\(capabilities, 'catalog\.import\.prepare'\)/u);
  assert.match(ui, /const canPrepareBulk = hasOperationalCapability\(capabilities, 'catalog\.import\.prepare'\)/u);
  assert.match(ui, /const canPublish = hasOperationalCapability\(capabilities, 'catalog\.import\.publish'\)/u);
  assert.match(ui, /const canPublishCurrent = useMemo\(/u);
  assert.match(ui, /catalog\.items\.create/u);
  assert.match(ui, /catalog\.items\.update/u);
  assert.match(ui, /catalog\.items\.deactivate/u);
  assert.match(ui, /catalog\.prices\.manage/u);
  assert.match(ui, /Solo lectura/u);
  assert.match(ui, /if \(!canPrepareBulk\)/u);
  assert.match(coveragePolicy, /COMPLETE_BASELINE_PLAUSIBILITY_MINIMUM_BASELINE_COUNT = 20/u);
  assert.match(coveragePolicy, /COMPLETE_BASELINE_PLAUSIBILITY_MAX_CURRENT_RATIO = 0\.25/u);
  assert.match(coveragePolicy, /LARGE_COVERAGE_DROP/u);
  assert.match(repository, /readAutomaticAbsenceBaseline/u);
  assert.match(repository, /catalog_supplier_listing_resolutions as r/u);
  assert.match(repository, /catalogRelation: row\.resolution === 'CREATED' \|\| row\.decision_classification === 'NEW'/u);
  assert.match(repository, /CatalogCoverageReviewRequiredError/u);
  assert.match(repository, /coverageReviewAcknowledged/u);
  assert.match(repository, /coverageReviewRequired/u);
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
  assert.match(ui, /const rowErrors = \(value: unknown\): readonly string\[\] => Array\.isArray\(value\)/u);
  assert.match(ui, /rowErrors\(row\.errors\)\.map/u);
  assert.doesNotMatch(ui, /\{row\.errors\.map/u);
  assert.match(ui, /setReconciliationView\('ATTENTION'\)/u);
  assert.match(ui, /unresolved === 0 && reconciliationView === 'ATTENTION'/u);
  assert.match(ui, /Todo resuelto/u);
  assert.match(ui, /const appliedResultSummary/u);
  assert.match(ui, /current\.batch\.lifecycle === 'APPLIED' \? <div className=\{styles\.allResolved\} role="status"><strong>Lote aplicado<\/strong><span>\{current\.rows\.length\.toLocaleString\('es-MX'\)\} filas fueron procesadas correctamente\.<\/span>/u);
  assert.match(ui, /No necesitas revisar cada fila/u);
  assert.match(ui, /compatibleSuggestionCount > 0 \|\| blockedRowCount > 0/u);
  assert.match(ui, /Aceptar \{compatibleSuggestionCount\.toLocaleString\('es-MX'\)\}/u);
  assert.match(ui, /Excluir \{blockedRowCount\.toLocaleString\('es-MX'\)\}/u);
  assert.match(ui, /row\.decision === 'EXCLUDE'/u);
  assert.match(ui, /Excluida del lote/u);
  assert.match(ui, /Volver a incluir/u);
  assert.match(ui, /Excluir del lote/u);
  assert.match(ui, />Cambiar nombre</u);
  assert.doesNotMatch(ui, /Cambiar nombre elegido/u);
  assert.match(ui, /row\.decision !== 'EXCLUDE' && row\.titleDecision/u);
  assert.match(ui, /\.map\(warningMessage\)\.filter\(\(message\): message is string => message !== null\)/u);
  assert.doesNotMatch(ui, /SUPPLIER_TITLE_DIFF_NOT_APPLIED/iu);
  assert.match(ui, /¿Qué contiene esta carga?/u);
  assert.match(model, /Sólo algunos artículos/u);
  assert.match(model, /La lista completa del proveedor/u);
  assert.match(ui, /<Dialog open=\{supplierGateOpen\} size="wide"/u);
  assert.match(ui, /supplierGateSupplierPanel/u);
  assert.match(ui, /supplierGateIntentPanel/u);
  assert.match(ui, /new-load-supplier-title/u);
  assert.match(ui, /new-load-intent-title/u);
  assert.match(ui, /createSupplierInGate/u);
  assert.match(ui, /footer=\{<div className=\{styles\.supplierGateActions\}>/u);
  assert.match(ui, /<fieldset className=\{styles\.loadIntentChoices\}>/u);
  assert.match(ui, /<label key=\{intent\.value\} className=\{supplierGateCompleteness === intent\.value/u);
  assert.match(css, /\.supplierGate \{ display: grid; grid-template-columns: minmax\(0, 1fr\) minmax\(0, 1fr\);/u);
  assert.match(css, /\.supplierGateIntentPanel \{ border-left: 1px solid var\(--color-border\);/u);
  assert.match(css, /@media \(max-width: 768px\) \{ \.supplierGate \{ grid-template-columns: 1fr;/u);
  assert.match(ui, /canContinueNewLoadGate\(\{ supplierId: supplierGateSupplierId, completeness: supplierGateCompleteness \}\)/u);
  assert.match(ui, /setSupplierGateSupplierId\(created\.sourceId\); setSupplierGateCompleteness\(null\);/u);
  assert.match(ui, /openSupplierGate\('supplier-gate-change-pending', true\)/u);
  assert.doesNotMatch(ui, /<fieldset disabled=\{current\?\.lifecycle === 'INGESTED'\}><legend>Alcance de la carga/u);
  assert.match(ui, /continúan desde la lista anterior/u);
  assert.match(ui, /ya no aparecen en esta lista completa/u);
  assert.match(ui, /adicionales respecto a la lista anterior/u);
  assert.match(ui, /Cobertura del proveedor/u);
  assert.match(ui, /Cambio detectado/u);
  assert.match(ui, /Ver adicional/u);
  assert.match(ui, /catalogRelation === 'NEW'/u);
  assert.match(ui, /catalogResolution === 'CREATED'/u);
  assert.match(ui, /Se creará como artículo nuevo al aplicar/u);
  assert.match(ui, /Creado por \$\{provenance\}/u);
  assert.doesNotMatch(ui, /Sin estado actual disponible/u);
  assert.match(ui, /const \[comparisonOpen, setComparisonOpen\] = useState\(false\)/u);
  assert.match(ui, /aria-expanded=\{comparisonOpen\} aria-controls=\{comparisonPanelId\}/u);
  assert.match(ui, /id=\{comparisonPanelId\}/u);
  assert.match(ui, /Acciones del lote/u);
  assert.match(ui, /tone="quiet" onClick=\{\(\) => void planCreatedBatchRetirement\(\)\}/u);
  assert.match(ui, /Comparación histórica/u);
  assert.match(ui, /No existe una lista completa anterior aplicada para evaluar cobertura/u);
  assert.match(ui, /Los artículos que no fueron incluidos no se evaluaron/u);
  assert.match(ui, /Ver \$\{current\.absenceBaseline\.notObservedItems\.length/u);
  assert.match(ui, /Ver \$\{current\.absenceBaseline\.continuedItems\.length/u);
  assert.match(ui, /additionalItems\.length > 0/u);
  assert.match(ui, /aria-expanded=\{notObservedOpen\}/u);
  assert.match(ui, /aria-controls=\{notObservedPanelId\}/u);
  assert.match(ui, /aria-expanded=\{continuedOpen\}/u);
  assert.match(ui, /aria-controls=\{continuedPanelId\}/u);
  assert.match(ui, /aria-expanded=\{additionalOpen\}/u);
  assert.match(ui, /aria-controls=\{additionalPanelId\}/u);
  assert.match(ui, /const \[gridExpanded, setGridExpanded\] = useState\(true\)/u);
  assert.match(ui, /const plan = planSourceRowNavigation\(current\?\.rows \?\? \[\], row\.rowDecisionId, columnKey, activeColumns, mode === 'COMPACT' \? compactColumns : policyColumns\.all\);/u);
  assert.match(ui, /if \(plan\.requiresAllColumns\) setViewPreset\('ALL'\);/u);
  assert.match(ui, /setGridExpanded\(false\); resetCoverageDetails\(\);/u);
  assert.match(ui, /setGridExpanded\(value\.lifecycle === 'DRAFT'\);/u);
  assert.match(ui, /aria-expanded=\{gridExpanded\} aria-controls="bulk-catalog-grid"/u);
  assert.match(ui, /id="bulk-catalog-grid"[\s\S]*hidden=\{!gridExpanded\}/u);
  assert.doesNotMatch(ui.slice(ui.indexOf('const save'), ui.indexOf('const analyze')), /setGridExpanded/u);
  assert.doesNotMatch(ui.slice(ui.indexOf('const resolve'), ui.indexOf('const chooseCandidateTitle')), /setGridExpanded/u);
  assert.ok(ui.indexOf('styles.summary') < ui.indexOf('styles.coverage'));
  assert.ok(ui.indexOf('styles.coverage') < ui.indexOf('styles.decisions'));
  assert.doesNotMatch(ui, /Desaparecidas/u);
  assert.doesNotMatch(ui.slice(ui.indexOf('Cobertura del proveedor'), ui.indexOf('Reconciliación')), /Nuevos/u);
  assert.match(ui, /Hay cambios sin guardar/u);
  assert.match(ui, /Actual:/u);
  assert.match(ui, /Propuesta:/u);
  assert.match(ui, /Corregir mapping/u);
  assert.match(ui, /¿Qué nombre quieres conservar\?/u);
  assert.match(ui, /Mantener nombre actual/u);
  assert.match(ui, /Usar nombre recibido/u);
  assert.match(ui, /El otro nombre permanecerá en el historial del proveedor/u);
  assert.match(ui, /useState<BulkCatalogTitleDecision>\('KEEP_CURRENT'\)/u);
  assert.match(ui, /SUPPLY/u);
  assert.match(ui, /rows\.slice\(first, first \+ 22\)/u);
  assert.match(css, /translateY/u);
  assert.match(css, /\.page \{ min-width: 0;/u);
  assert.match(css, /\.layout \{ min-width: 0;/u);
  assert.match(css, /\.composer > section \{ min-width: 0;/u);
  assert.match(css, /repeat\(auto-fit, minmax\(180px, 1fr\)\)/u);
  assert.match(css, /\.coverageCounts/u);
  assert.match(css, /\.coverageItems/u);
  assert.match(css, /\.coverageActions/u);
  assert.match(gridLayout, /--bulk-grid-offset/u);
  assert.match(ui, /Completar datos faltantes/u);
  assert.match(ui, /Aplicar a filas incompletas/u);
  assert.doesNotMatch(ui, /Aplicar sólo a vacíos/u);
  assert.match(ui, /aria-label="Columnas de trabajo"/u);
  assert.match(ui, /supplierObservedTitle/u);
  assert.match(ui, /Original:/u);
  assert.match(ui, /REACTIVATE: 'Reactiva'/u);
  assert.match(ui, /estado \{row\.before\.status === 'INACTIVE' \? 'Inactivo' : 'Activo'\}/u);
  assert.match(ui, /Reanalizar versión/u);
  assert.match(ui, /DUPLICATE_VALUE_CONTRADICTION/u);
  assert.match(ui, /Artículo repetido con datos diferentes/u);
  assert.match(ui, /groupDuplicateResolutionRows/u);
  assert.match(ui, /groupDuplicateResolutionRows\(current\.rows, duplicateObservationKey, \(row\) => rowErrors\(row\.errors\), \(row\) => rowErrors\(row\.warnings\)\)/u);
  assert.match(ui, /duplicateResolutionCard/u);
  assert.match(ui, /Encontramos este artículo/u);
  assert.match(ui, /Usar fila \{member\.rowNumber\}/u);
  assert.match(ui, /canPrepareBulk && canChooseDuplicateWinner\(group\.members\)/u);
  assert.match(ui, /aria-label=\{`Usar fila \$\{member\.rowNumber\}`\}/u);
  assert.match(ui, /aria-label=\{`Ir a fila \$\{member\.rowNumber\}`\}/u);
  assert.match(ui, /resolve\(row\.rowDecisionId, row\.version, 'APPLY', row\.targetItemId, row\.titleDecision\)/u);
  assert.match(ui, /Ver detalles/u);
  assert.match(ui, /Duplicado resuelto/u);
  assert.match(ui, /unresolvedDecisionUnits/u);
  assert.match(ui, /DUPLICATE_EXACT_CONSOLIDATED/u);
  assert.match(ui, /!row\.errors\.includes\('DUPLICATE_VALUE_CONTRADICTION'\)/u);
  assert.match(ui, /current\.batch\.lifecycle === 'APPLIED' \? 'Resultado aplicado' : 'Reconciliación'/u);
  assert.match(ui, /current\.batch\.lifecycle !== 'APPLIED' && \(compatibleSuggestionCount > 0 \|\| blockedRowCount > 0\) \? <div className=\{styles\.groupActions\}/u);
  assert.match(ui, /current\.batch\.lifecycle !== 'APPLIED' \? <div>\{canPrepareBulk && correctionFieldForRow\(row\) && row\.decision === 'UNRESOLVED'/u);
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
  assert.match(repository, /PARTIAL_CURRENT/u);
  assert.match(repository, /NO_PREVIOUS_COMPLETE/u);
  assert.match(repository, /EVALUATED/u);
  assert.match(repository, /CatalogSupplierDeleteNotAllowedError/u);
  assert.doesNotMatch(repository, /deleteFrom\('catalog_items'\)/u);
  assert.match(shell, /location\.pathname !== '\/listas\/precios\/carga-masiva'/u);
  assert.match(feedback, /export function Toast/u);
  assert.match(navigation, /export function BackLink/u);
  assert.match(css, /\.issueNavigator/u);
  assert.match(css, /\.invalidCell/u);
});
