import assert from 'node:assert/strict';
import { performance } from 'node:perf_hooks';
import test from 'node:test';

import {
  applyBatchDefaults,
  estimateColumnWidth,
  fillRows,
  nextGridCell,
  normalizeSupplierTitle,
  ownerSupplierClipboard,
  parseClipboardMatrix,
  parseMoneyToMinor,
} from '../apps/dev-preview-web/src/pages/bulk-catalog-composer-model.mjs';

const blankRow = () => ({ kind: '', title: '', description: '', category: '', brand: '', supplierItemCode: '', sku: '', barcode: '', price: '', cost: '', supplierObservedTitle: '' });

test('Google Sheets terminal empty rows are trimmed without removing internal blank rows', () => {
  assert.deepEqual(parseClipboardMatrix('A\n\nB\n\n\n'), [['A'], [''], ['B']]);
  assert.deepEqual(parseClipboardMatrix('A\t1\r\n\t\r\nB\t2\r\n \t \r\n\t'), [['A', '1'], ['', ''], ['B', '2']]);
  const with999Rows = `${Array.from({ length: 36 }, (_, index) => `Fila ${index + 1}`).join('\n')}${'\n'.repeat(963)}`;
  assert.equal(parseClipboardMatrix(with999Rows).length, 36);
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

test('Batch Context fills only missing row values and preserves manual overrides', () => {
  const inherited = applyBatchDefaults(blankRow(), { kind: 'PART', category: 'Pantallas', brand: 'Apple' });
  assert.deepEqual([inherited.kind, inherited.category, inherited.brand], ['PART', 'Pantallas', 'Apple']);
  const overridden = applyBatchDefaults({ ...blankRow(), category: 'Pantallas OLED', brand: 'Samsung' }, { kind: 'PART', category: 'Pantallas', brand: 'Apple' });
  assert.deepEqual([overridden.kind, overridden.category, overridden.brand], ['PART', 'Pantallas OLED', 'Samsung']);
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
