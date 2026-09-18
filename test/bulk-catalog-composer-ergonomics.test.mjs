import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { performance } from 'node:perf_hooks';
import test from 'node:test';

import {
  applyBatchDefaults,
  applyBatchDefaultsToEmptyRows,
  captureActionState,
  estimateColumnWidth,
  fillRows,
  nextGridCell,
  nextValidationIssueIndex,
  normalizeSupplierTitle,
  orchestrateReviewList,
  ownerSupplierClipboard,
  parseClipboardMatrix,
  syntheticSupplierDemoRows,
  parseMoneyToMinor,
  validateComposerDraft,
  validationIssueFromApi,
} from '../apps/dev-preview-web/src/pages/bulk-catalog-composer-model.mjs';

const blankRow = () => ({ kind: '', title: '', description: '', category: '', brand: '', supplierItemCode: '', sku: '', barcode: '', price: '', cost: '', supplierObservedTitle: '' });

test('Google Sheets terminal empty rows are trimmed without removing internal blank rows', () => {
  assert.deepEqual(parseClipboardMatrix('A\n\nB\n\n\n'), [['A'], [''], ['B']]);
  assert.deepEqual(parseClipboardMatrix('A\t1\r\n\t\r\nB\t2\r\n \t \r\n\t'), [['A', '1'], ['', ''], ['B', '2']]);
  const with999Rows = `${Array.from({ length: 36 }, (_, index) => `Fila ${index + 1}`).join('\n')}${'\n'.repeat(963)}`;
  assert.equal(parseClipboardMatrix(with999Rows).length, 36);
});

test('QA supplier fixtures remain internal and deterministic without operational UI controls', () => {
  const owner = parseClipboardMatrix(ownerSupplierClipboard());
  const version1 = syntheticSupplierDemoRows(1);
  const version2 = syntheticSupplierDemoRows(2);
  assert.equal(owner.length, 36);
  assert.equal(version1.length, 1_500);
  assert.equal(version2.length, 1_500);
  assert.equal(version1[0].title, version2[0].title);
  assert.notEqual(version1[5].price, version2[5].price);
  assert.match(version2[1_498].title, /Artículo agregado V2/u);
  assert.throws(() => syntheticSupplierDemoRows(3), /must be 1 or 2/u);
});

test('Owner supplier fixture is an exact 36 by 3 rectangular paste', () => {
  const matrix = parseClipboardMatrix(ownerSupplierClipboard());
  assert.equal(matrix.length, 36);
  assert.equal(matrix.every((row) => row.length === 3), true);
  assert.deepEqual(matrix[0], ['PANTALLA IPHONE 11 CALIDAD RJ >>', '450', '1199']);
  assert.deepEqual(matrix[35], ['PANTALLA IPHONE 15 PRO ORIGINAL', '6600', '14899']);
});

test('supplier title stays available while proposal casing protects technology terms', () => {
  const observed = 'PANTALLA IPHONE 11 PRO OLED 5.8" GX >>I';
  assert.equal(normalizeSupplierTitle(observed), 'Pantalla iPhone 11 Pro OLED 5.8" GX >>I');
  assert.equal(normalizeSupplierTitle('PANTALLA IPHONE 13 MINI COPIA INCELL RJ'), 'Pantalla iPhone 13 Mini Copia Incell RJ');
  assert.equal(normalizeSupplierTitle('CABLE USB-C PARA IPAD IOS 5G 4G WI-FI NFC ESIM SIM AMOLED LCD LED'), 'Cable USB-C Para iPad iOS 5G 4G Wi-Fi NFC eSIM SIM AMOLED LCD LED');
  assert.equal(observed, 'PANTALLA IPHONE 11 PRO OLED 5.8" GX >>I');
});

test('MXN costs distinguish blank, zero and formatted amounts', () => {
  assert.equal(parseMoneyToMinor(''), null);
  assert.equal(parseMoneyToMinor('0'), 0);
  assert.equal(parseMoneyToMinor('$1,360.50 MXN'), 136050);
  assert.equal(Number.isNaN(parseMoneyToMinor('1,2')), true);
});

test('missing-data helper fills only empty row values and preserves supplied values', () => {
  const inherited = applyBatchDefaults(blankRow(), { kind: 'PART', category: 'Pantallas', brand: 'Apple' });
  assert.deepEqual([inherited.kind, inherited.category, inherited.brand], ['PART', 'Pantallas', 'Apple']);
  const overridden = applyBatchDefaults({ ...blankRow(), category: 'Pantallas OLED', brand: 'Samsung' }, { kind: 'PART', category: 'Pantallas', brand: 'Apple' });
  assert.deepEqual([overridden.kind, overridden.category, overridden.brand], ['PART', 'Pantallas OLED', 'Samsung']);
});

test('missing-data helper supports partial context and reports no-op without mutating rows', () => {
  const rows = [
    { ...blankRow(), kind: '', category: 'Pantallas', brand: 'Samsung' },
    { ...blankRow(), kind: '', category: '', brand: '' },
  ];
  const partial = applyBatchDefaultsToEmptyRows(rows, { kind: 'PART', category: '', brand: 'Apple' });
  assert.equal(partial.changedCount, 2);
  assert.deepEqual(partial.rows.map((row) => [row.kind, row.category, row.brand]), [['PART', 'Pantallas', 'Samsung'], ['PART', '', 'Apple']]);
  const noOp = applyBatchDefaultsToEmptyRows(partial.rows, { kind: 'PART', category: '', brand: 'Apple' });
  assert.equal(noOp.changedCount, 0);
  assert.deepEqual(noOp.rows, partial.rows);
});

test('spreadsheet navigation covers arrows, Tab, Shift+Tab and Enter', () => {
  assert.deepEqual(nextGridCell('ArrowRight', 1, 1, 4, 3), { row: 1, column: 2 });
  assert.deepEqual(nextGridCell('ArrowLeft', 1, 0, 4, 3), { row: 0, column: 2 });
  assert.deepEqual(nextGridCell('ArrowDown', 1, 1, 4, 3), { row: 2, column: 1 });
  assert.deepEqual(nextGridCell('ArrowUp', 1, 1, 4, 3), { row: 0, column: 1 });
  assert.deepEqual(nextGridCell('Tab', 1, 2, 4, 3), { row: 2, column: 0 });
  assert.deepEqual(nextGridCell('Tab', 1, 0, 4, 3, true), { row: 0, column: 2 });
  assert.deepEqual(nextGridCell('Enter', 1, 1, 4, 3), { row: 2, column: 1 });
});

test('copy fill repeats a single cell or rectangular source and leaves source intact', () => {
  const rows = Array.from({ length: 5 }, blankRow);
  rows[0].kind = 'PART';
  const single = fillRows(rows, ['kind'], { firstRow: 0, lastRow: 0, firstColumn: 0, lastColumn: 0 }, { row: 4, column: 0 });
  assert.deepEqual(single.map((row) => row.kind), ['PART', 'PART', 'PART', 'PART', 'PART']);
  const rectangle = Array.from({ length: 4 }, blankRow);
  rectangle[0].title = 'A'; rectangle[0].cost = '1';
  rectangle[1].title = 'B'; rectangle[1].cost = '2';
  const filled = fillRows(rectangle, ['title', 'cost'], { firstRow: 0, lastRow: 1, firstColumn: 0, lastColumn: 1 }, { row: 3, column: 1 });
  assert.deepEqual(filled.map((row) => [row.title, row.cost]), [['A', '1'], ['B', '2'], ['A', '1'], ['B', '2']]);
});

test('column auto-fit is bounded and trailing-row trimming remains linear at 10k', () => {
  assert.equal(estimateColumnWidth('Título', ['x'.repeat(2_000)]), 420);
  assert.ok(estimateColumnWidth('Tipo', ['Refacción']) >= 112);
  const clipboard = `${Array.from({ length: 10_000 }, (_, index) => `Fila ${index}\t${index}\t${index + 1}`).join('\n')}${'\n\t\t'.repeat(1_000)}`;
  const started = performance.now();
  assert.equal(parseClipboardMatrix(clipboard).length, 10_000);
  assert.ok(performance.now() - started < 1_000);
});

test('save validation is exhaustive, deterministic and points to batch controls before row cells', () => {
  const rows = [blankRow(), { ...blankRow(), kind: 'PART', title: 'Pantalla', category: 'Pantallas', price: 'abc', cost: '1,2' }];
  const issues = validateComposerDraft({ selectedSource: '', mode: 'FULL', rows });
  assert.deepEqual(issues.slice(0, 1).map(({ scope, controlKey }) => [scope, controlKey]), [['BATCH', 'source']]);
  assert.deepEqual(issues.filter(({ rowIndex }) => rowIndex === 0).map(({ columnKey }) => columnKey), ['kind', 'title', 'category', 'price']);
  assert.deepEqual(issues.filter(({ rowIndex }) => rowIndex === 1).map(({ columnKey }) => columnKey), ['price', 'cost']);
});

test('compact validation requires one governed identifier and retains blank money semantics', () => {
  const invalid = validateComposerDraft({ selectedSource: 'source', mode: 'COMPACT', rows: [blankRow()] });
  assert.deepEqual(invalid.map(({ columnKey, code }) => [columnKey, code]), [['supplierItemCode', 'IDENTIFIER_REQUIRED']]);
  assert.equal(validateComposerDraft({ selectedSource: 'source', mode: 'COMPACT', rows: [{ ...blankRow(), sku: 'REF-1' }] }).length, 0);
});

test('backend validation becomes actionable while unknown conflicts remain global', () => {
  assert.deepEqual(validationIssueFromApi({ status: 400, code: 'CATALOG_INPUT_INVALID', parameter: 'rows.826.basePriceMinor' }), {
    scope: 'CELL', rowIndex: 826, columnKey: 'price', code: 'CATALOG_INPUT_INVALID', message: 'Captura un precio base válido.',
  });
  assert.equal(validationIssueFromApi({ status: 409, code: 'CATALOG_CONFLICT' }).scope, 'GLOBAL');
  assert.equal(nextValidationIssueIndex(0, -1, 3), 2);
  assert.equal(nextValidationIssueIndex(2, 1, 3), 0);
});

test('Review list persists exactly one authoritative snapshot before analysis and preserves it on partial failure', async () => {
  const draft = Object.freeze({ versionId: 'draft-v1', version: 3 });
  const calls = [];
  const complete = await orchestrateReviewList({
    snapshot: null,
    persist: async () => { calls.push('save'); return draft; },
    analyze: async (snapshot) => { calls.push(`analyze:${snapshot.versionId}:${snapshot.version}`); return { ...snapshot, analyzed: true }; },
  });
  assert.deepEqual(calls, ['save', 'analyze:draft-v1:3']);
  assert.equal(complete.stage, 'ANALYZED');
  assert.equal(complete.snapshot, draft);

  calls.length = 0;
  const saveFailure = await orchestrateReviewList({
    snapshot: null,
    persist: async () => { calls.push('save'); throw new Error('network'); },
    analyze: async () => { calls.push('analyze'); return draft; },
  });
  assert.deepEqual(calls, ['save']);
  assert.equal(saveFailure.stage, 'SAVE_FAILED');

  calls.length = 0;
  const analyzeFailure = await orchestrateReviewList({
    snapshot: draft,
    persist: async () => { calls.push('save'); return draft; },
    analyze: async (snapshot) => { calls.push(`analyze:${snapshot.version}`); throw new Error('unavailable'); },
  });
  assert.deepEqual(calls, ['analyze:3']);
  assert.equal(analyzeFailure.stage, 'ANALYZE_FAILED');
  assert.equal(analyzeFailure.snapshot, draft);
});

test('capture actions keep review primary while draft save is optional and lifecycle-aware', () => {
  assert.deepEqual(captureActionState({ lifecycle: null, dirty: false, hasMeaningfulWork: false }), { reviewVisible: true, saveForLaterVisible: false });
  assert.deepEqual(captureActionState({ lifecycle: null, dirty: true, hasMeaningfulWork: true }), { reviewVisible: true, saveForLaterVisible: true });
  assert.deepEqual(captureActionState({ lifecycle: 'DRAFT', dirty: false, hasMeaningfulWork: false }), { reviewVisible: true, saveForLaterVisible: false });
  assert.deepEqual(captureActionState({ lifecycle: 'DRAFT', dirty: true, hasMeaningfulWork: true }), { reviewVisible: true, saveForLaterVisible: true });
  assert.deepEqual(captureActionState({ lifecycle: 'INGESTED', dirty: false, hasMeaningfulWork: false }), { reviewVisible: false, saveForLaterVisible: false });
});

test('grid edit actions live once in the primary toolbar immediately before Review', async () => {
  const [page, css] = await Promise.all([
    readFile('apps/dev-preview-web/src/pages/BulkCatalogComposerPage.tsx', 'utf8'),
    readFile('apps/dev-preview-web/src/pages/bulk-catalog-composer-page.module.css', 'utf8'),
  ]);
  const toolbarStart = page.indexOf('<section className={styles.workspaceToolbar}>');
  const toolbarEnd = page.indexOf('{currentIssue ? ', toolbarStart);
  const toolbar = page.slice(toolbarStart, toolbarEnd);
  assert.match(page, /const editableGridActionsVisible = \(mode === 'COMPACT' \|\| fullPolicyReady\) && \(current\?\.lifecycle === 'DRAFT' \|\| !current\);/u);
  assert.match(toolbar, /className=\{styles\.gridEditActions\} role="group" aria-label="Acciones de edición de la lista"/u);
  assert.equal((page.match(/>Deshacer<\/Button>/gu) ?? []).length, 1);
  assert.equal((page.match(/>Agregar fila<\/Button>/gu) ?? []).length, 1);
  assert.equal((page.match(/>Quitar fila activa<\/Button>/gu) ?? []).length, 1);
  assert.equal((page.match(/Revisar lista/g) ?? []).length, 1);
  assert.ok(toolbar.indexOf('>Deshacer</Button>') < toolbar.indexOf('>Agregar fila</Button>'));
  assert.ok(toolbar.indexOf('>Agregar fila</Button>') < toolbar.indexOf('>Quitar fila activa</Button>'));
  assert.ok(toolbar.indexOf('>Quitar fila activa</Button>') < toolbar.indexOf('Revisar lista'));
  assert.match(toolbar, /disabled=\{!undoRows\.current\} onClick=\{undo\}/u);
  assert.match(toolbar, /disabled=\{rows\.length >= 10_000\}/u);
  assert.match(toolbar, /disabled=\{rows\.length === 1\}/u);
  assert.match(toolbar, /tone="primary" onClick=\{\(\) => void reviewList\(\)\}/u);
  assert.doesNotMatch(page, /styles\.rowActions/u);
  assert.match(css, /\.gridEditActions \{ display: grid; grid-template-columns: repeat\(2, minmax\(0, 1fr\)\); \}/u);
  assert.match(css, /\.gridEditActions > button:last-child \{ grid-column: 1 \/ -1; \}/u);
});

test('supplier paste transformation stays bounded at 1,500 and 10,000 rows', (context) => {
  for (const rowCount of [1_500, 10_000]) {
    const clipboard = Array.from({ length: rowCount }, (_, index) => `PANTALLA IPHONE ${index} OLED GX\t${index}\t${index + 1}`).join('\n');
    const durations = Array.from({ length: 7 }, () => {
      const started = performance.now();
      const rows = parseClipboardMatrix(clipboard).map(([observedTitle = '', cost = '', price = '']) => ({
        ...applyBatchDefaults(blankRow(), { kind: 'PART', category: 'Pantallas', brand: 'Apple' }),
        supplierObservedTitle: observedTitle,
        title: normalizeSupplierTitle(observedTitle),
        cost,
        price,
      }));
      assert.equal(rows.length, rowCount);
      return performance.now() - started;
    }).sort((left, right) => left - right);
    const p95 = durations[Math.ceil(durations.length * 0.95) - 1];
    context.diagnostic(`${rowCount.toLocaleString('en-US')} rows p95: ${p95.toFixed(1)} ms`);
    assert.ok(p95 < (rowCount === 1_500 ? 250 : 1_000));
  }
});
