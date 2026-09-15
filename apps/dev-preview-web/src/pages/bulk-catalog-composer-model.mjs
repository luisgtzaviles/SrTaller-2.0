export const FULL_COLUMNS = Object.freeze([
  'kind',
  'title',
  'description',
  'category',
  'brand',
  'supplierItemCode',
  'sku',
  'barcode',
  'price',
  'cost',
]);

export const ESSENTIAL_COLUMNS = Object.freeze(['title', 'cost', 'price']);
export const COMPACT_COLUMNS = Object.freeze(['supplierItemCode', 'sku', 'barcode', 'cost', 'price']);

export const DEFAULT_COLUMN_WIDTHS = Object.freeze({
  kind: 150,
  title: 310,
  description: 260,
  category: 190,
  brand: 170,
  supplierItemCode: 190,
  sku: 170,
  barcode: 205,
  price: 150,
  cost: 180,
});

export const COLUMN_MIN_WIDTH = 112;
export const COLUMN_MAX_WIDTH = 420;

const technologyCasing = new Map([
  ['iphone', 'iPhone'],
  ['ipad', 'iPad'],
  ['ios', 'iOS'],
  ['usb', 'USB'],
  ['usb-c', 'USB-C'],
  ['oled', 'OLED'],
  ['amoled', 'AMOLED'],
  ['lcd', 'LCD'],
  ['led', 'LED'],
  ['esim', 'eSIM'],
  ['sim', 'SIM'],
  ['5g', '5G'],
  ['4g', '4G'],
  ['wi-fi', 'Wi-Fi'],
  ['nfc', 'NFC'],
  ['rj', 'RJ'],
  ['gx', 'GX'],
  ['zy', 'ZY'],
]);

export function isClipboardRowEmpty(row) {
  return row.every((cell) => cell === null || cell === undefined || String(cell).trim() === '');
}

export function trimTrailingEmptyRows(matrix) {
  let last = matrix.length;
  while (last > 0 && isClipboardRowEmpty(matrix[last - 1] ?? [])) last -= 1;
  return matrix.slice(0, last).map((row) => [...row]);
}

export function parseClipboardMatrix(text) {
  if (typeof text !== 'string') return [];
  const lines = text.replace(/\r\n?/gu, '\n').split('\n');
  return trimTrailingEmptyRows(lines.map((line) => line.split('\t')));
}

function normalizeWord(word) {
  const technology = technologyCasing.get(word.toLocaleLowerCase('es-MX'));
  if (technology) return technology;
  if (/[^\p{L}\p{M}-]/u.test(word)) return word;
  const lower = word.toLocaleLowerCase('es-MX');
  return `${lower.slice(0, 1).toLocaleUpperCase('es-MX')}${lower.slice(1)}`;
}

export function normalizeSupplierTitle(value) {
  return String(value ?? '').normalize('NFKC').trim().replace(/\s+/gu, ' ').split(' ').map(normalizeWord).join(' ');
}

export function parseMoneyToMinor(value) {
  const trimmed = String(value ?? '').trim();
  if (!trimmed) return null;
  const normalized = trimmed
    .replace(/\bMXN\b/giu, '')
    .replace(/\$/gu, '')
    .replace(/\s+/gu, '')
    .replace(/,(?=\d{3}(?:\D|$))/gu, '');
  if (!/^\d+(?:\.\d{1,2})?$/u.test(normalized)) return Number.NaN;
  const [whole = '0', decimals = ''] = normalized.split('.');
  const minor = Number(whole) * 100 + Number(decimals.padEnd(2, '0'));
  return Number.isSafeInteger(minor) ? minor : Number.NaN;
}

export function applyBatchDefaults(row, defaults) {
  return {
    ...row,
    kind: row.kind || defaults.kind || '',
    category: row.category.trim() || defaults.category.trim(),
    brand: row.brand.trim() || defaults.brand.trim(),
  };
}

export function nextGridCell(key, row, column, rowCount, columnCount, shiftKey = false) {
  if (rowCount < 1 || columnCount < 1) return { row: 0, column: 0 };
  let linear = row * columnCount + column;
  if (key === 'Tab') linear += shiftKey ? -1 : 1;
  else if (key === 'Enter' || key === 'ArrowDown') linear += columnCount;
  else if (key === 'ArrowUp') linear -= columnCount;
  else if (key === 'ArrowLeft') linear -= 1;
  else if (key === 'ArrowRight') linear += 1;
  else return { row, column };
  linear = Math.max(0, Math.min(rowCount * columnCount - 1, linear));
  return { row: Math.floor(linear / columnCount), column: linear % columnCount };
}

export function fillRows(rows, columns, source, target) {
  const firstRow = Math.min(source.firstRow, source.lastRow);
  const lastRow = Math.max(source.firstRow, source.lastRow);
  const firstColumn = Math.min(source.firstColumn, source.lastColumn);
  const lastColumn = Math.max(source.firstColumn, source.lastColumn);
  const destinationFirstRow = Math.min(firstRow, target.row);
  const destinationLastRow = Math.max(lastRow, target.row);
  const destinationFirstColumn = Math.min(firstColumn, target.column);
  const destinationLastColumn = Math.max(lastColumn, target.column);
  const sourceRows = lastRow - firstRow + 1;
  const sourceColumns = lastColumn - firstColumn + 1;
  const next = rows.map((row) => ({ ...row }));
  for (let rowIndex = destinationFirstRow; rowIndex <= destinationLastRow; rowIndex += 1) {
    for (let columnIndex = destinationFirstColumn; columnIndex <= destinationLastColumn; columnIndex += 1) {
      if (rowIndex >= firstRow && rowIndex <= lastRow && columnIndex >= firstColumn && columnIndex <= lastColumn) continue;
      const sourceRow = firstRow + ((rowIndex - destinationFirstRow) % sourceRows);
      const sourceColumn = firstColumn + ((columnIndex - destinationFirstColumn) % sourceColumns);
      const destinationColumn = columns[columnIndex];
      const sourceColumnName = columns[sourceColumn];
      if (destinationColumn && sourceColumnName) {
        next[rowIndex][destinationColumn] = rows[sourceRow][sourceColumnName];
        if (destinationColumn === 'title' && sourceColumnName === 'title' && 'supplierObservedTitle' in next[rowIndex]) {
          next[rowIndex].supplierObservedTitle = rows[sourceRow].supplierObservedTitle;
        }
      }
    }
  }
  return next;
}

export function estimateColumnWidth(label, values, min = COLUMN_MIN_WIDTH, max = COLUMN_MAX_WIDTH) {
  const relevant = [label, ...values.slice(0, 500)].reduce((longest, value) => Math.max(longest, String(value ?? '').length), 0);
  return Math.max(min, Math.min(max, Math.ceil(relevant * 7.4 + 36)));
}

const validationColumnOrder = new Map(FULL_COLUMNS.map((column, index) => [column, index]));
const validationMessages = Object.freeze({
  kind: 'Selecciona un tipo.',
  title: 'El título es obligatorio.',
  category: 'La categoría es obligatoria.',
  price: 'Captura un precio base válido.',
  cost: 'Captura un costo de referencia válido o déjalo vacío.',
  identifier: 'Captura Código proveedor, SKU o Código de barras.',
});

/**
 * @typedef {'BATCH' | 'CELL' | 'GLOBAL'} ValidationIssueScope
 * @typedef {{scope: ValidationIssueScope, rowId?: string, rowIndex?: number, columnKey?: string, controlKey?: string, code: string, message: string}} ValidationIssue
 */

/** @param {readonly ValidationIssue[]} issues */
export function sortValidationIssues(issues) {
  const scopeOrder = { BATCH: 0, CELL: 1, GLOBAL: 2 };
  return [...issues].sort((left, right) => {
    const byScope = scopeOrder[left.scope] - scopeOrder[right.scope];
    if (byScope !== 0) return byScope;
    const byRow = (left.rowIndex ?? -1) - (right.rowIndex ?? -1);
    if (byRow !== 0) return byRow;
    return (validationColumnOrder.get(left.columnKey) ?? 999) - (validationColumnOrder.get(right.columnKey) ?? 999);
  });
}

/** @param {{selectedSource: string, mode: 'FULL' | 'COMPACT', rows: readonly Record<string, string>[]}} input */
export function validateComposerDraft(input) {
  /** @type {ValidationIssue[]} */
  const issues = [];
  if (!input.selectedSource.trim()) issues.push({ scope: 'BATCH', controlKey: 'source', code: 'REQUIRED', message: 'Selecciona o crea una fuente.' });
  input.rows.forEach((row, rowIndex) => {
    if (input.mode === 'FULL') {
      for (const columnKey of ['kind', 'title', 'category']) {
        if (!String(row[columnKey] ?? '').trim()) issues.push({ scope: 'CELL', rowIndex, columnKey, code: 'REQUIRED', message: validationMessages[columnKey] });
      }
      const price = parseMoneyToMinor(row.price);
      if (price === null || Number.isNaN(price)) issues.push({ scope: 'CELL', rowIndex, columnKey: 'price', code: price === null ? 'REQUIRED' : 'INVALID_MONEY', message: validationMessages.price });
    } else if (![row.supplierItemCode, row.sku, row.barcode].some((value) => String(value ?? '').trim())) {
      issues.push({ scope: 'CELL', rowIndex, columnKey: 'supplierItemCode', code: 'IDENTIFIER_REQUIRED', message: validationMessages.identifier });
    }
    const cost = parseMoneyToMinor(row.cost);
    if (Number.isNaN(cost)) issues.push({ scope: 'CELL', rowIndex, columnKey: 'cost', code: 'INVALID_MONEY', message: validationMessages.cost });
    if (input.mode === 'COMPACT') {
      const price = parseMoneyToMinor(row.price);
      if (Number.isNaN(price)) issues.push({ scope: 'CELL', rowIndex, columnKey: 'price', code: 'INVALID_MONEY', message: validationMessages.price });
    }
  });
  return sortValidationIssues(issues);
}

const apiColumnMap = Object.freeze({
  kind: 'kind', supplierObservedTitle: 'title', title: 'title', description: 'description', category: 'category', brand: 'brand',
  supplierItemCode: 'supplierItemCode', sku: 'sku', barcode: 'barcode', basePriceMinor: 'price', referenceCostMinor: 'cost', identifier: 'supplierItemCode', required: 'title',
});

/** @param {{status?: number, code?: string | null, parameter?: string | null}} error */
export function validationIssueFromApi(error) {
  if (error.code === 'CATALOG_INPUT_INVALID' && error.parameter) {
    const rowMatch = /^rows\.(\d+)\.([A-Za-z]+)$/u.exec(error.parameter);
    if (rowMatch) {
      const rawKey = rowMatch[2]; const columnKey = apiColumnMap[rawKey] ?? 'title';
      return { scope: 'CELL', rowIndex: Number(rowMatch[1]), columnKey, code: error.code, message: validationMessages[rawKey] ?? validationMessages[columnKey] ?? `Revisa ${columnKey}.` };
    }
    const controlKey = ['sourceId', 'mode'].includes(error.parameter) ? (error.parameter === 'sourceId' ? 'source' : error.parameter) : undefined;
    if (controlKey) return { scope: 'BATCH', controlKey, code: error.code, message: controlKey === 'source' ? 'Selecciona un proveedor válido.' : 'Revisa el modo de carga.' };
  }
  return { scope: 'GLOBAL', code: error.code ?? 'UNEXPECTED', message: error.status === 0 ? 'No fue posible contactar al servidor. El borrador no se guardó.' : 'No se guardó el borrador. No hubo escrituras parciales; intenta nuevamente o relee la versión.' };
}

export function nextValidationIssueIndex(current, direction, count) {
  if (count < 1) return 0;
  return (current + direction + count) % count;
}

const ownerRows = [
  ['PANTALLA IPHONE 11 CALIDAD RJ >>', '450', '1199'],
  ['PANTALLA IPHONE 11 ORIGINAL >>I', '520', '1399'],
  ['PANTALLA IPHONE 11 PRO CALIDAD RJ >>', '490', '1299'],
  ['PANTALLA IPHONE 11 PRO MAX CALIDAD RJ >>>', '570', '1499'],
  ['PANTALLA IPHONE 11 PRO MAX NEGRO OLED GX 6.5\" >>>', '790', '1999'],
  ['PANTALLA IPHONE 11 PRO MAX ORIGINAL >>>I', '1360', '3199'],
  ['PANTALLA IPHONE 11 PRO OLED 5.8\" GX >>I', '660', '1699'],
  ['PANTALLA IPHONE 12 CALIDAD RJ >>', '560', '1499'],
  ['PANTALLA IPHONE 12 MINI CALIDAD RJ >>', '890', '2199'],
  ['PANTALLA IPHONE 12 MINI OLED GX>>I', '1080', '2599'],
  ['PANTALLA IPHONE 12 OLED GX', '925', '2299'],
  ['PANTALLA IPHONE 12 ORIGINAL >>I', '1420', '3399'],
  ['PANTALLA IPHONE 12 PRO CALIDAD RJ >>', '570', '1499'],
  ['PANTALLA IPHONE 12 PRO MAX OLED GX>>', '1180', '2799'],
  ['PANTALLA IPHONE 12 PRO MAX CALIDAD RJ >>', '910', '2199'],
  ['PANTALLA IPHONE 12 PRO MAX ORIGINAL >>I', '2040', '4799'],
  ['PANTALLA IPHONE 12 PRO OLED GX', '950', '2299'],
  ['PANTALLA IPHONE 12 PRO ORIGINAL >>I', '1350', '3199'],
  ['PANTALLA IPHONE 13 MINI COPIA INCELL RJ', '840', '2099'],
  ['PANTALLA IPHONE 13 MINI ORIGINAL', '2220', '5199'],
  ['PANTALLA IPHONE 13 OLED GX', '1180', '2799'],
  ['PANTALLA IPHONE 13 ORIGINAL >>I', '1595', '3799'],
  ['PANTALLA IPHONE 13 PRO MAX ORIGINAL', '5600', '12699'],
  ['PANTALLA IPHONE 13 PRO OLED ZY', '2650', '6099'],
  ['PANTALLA IPHONE 13 PRO ORIGINAL', '5020', '11399'],
  ['PANTALLA IPHONE 13 RJ >>', '835', '2099'],
  ['PANTALLA IPHONE 14 COPIA INCELL RJ', '1350', '3199'],
  ['PANTALLA IPHONE 14 ORIGINAL', '1550', '3699'],
  ['PANTALLA IPHONE 14 PLUS INCELL', '1600', '3799'],
  ['PANTALLA IPHONE 14 PLUS OLED GX', '1750', '4099'],
  ['PANTALLA IPHONE 14 PRO MAX ORIGINAL', '6680', '15099'],
  ['PANTALLA IPHONE 14 PRO ORIGINAL', '6000', '13599'],
  ['PANTALLA IPHONE 15 ORIGINAL', '4800', '10899'],
  ['PANTALLA IPHONE 15 PLUS ORIGINAL', '6700', '15099'],
  ['PANTALLA IPHONE 15 PRO MAX ORIGINAL', '7200', '16199'],
  ['PANTALLA IPHONE 15 PRO ORIGINAL', '6600', '14899'],
];

export function ownerSupplierClipboard() {
  return ownerRows.map((row) => row.join('\t')).join('\n');
}

export function syntheticSupplierDemoRows(version) {
  if (version !== 1 && version !== 2) throw new TypeError('Synthetic supplier demo version must be 1 or 2.');
  return Array.from({ length: 1_500 }, (_, index) => {
    const ordinal = index + 1;
    const kind = ordinal % 13 === 0 ? 'SUPPLY' : ordinal % 5 === 0 ? 'SERVICE' : ordinal % 3 === 0 ? 'PRODUCT' : 'PART';
    const changed = version === 2 && ordinal % 6 === 0;
    const replacement = version === 2 && ordinal >= 1_499;
    const renamedObservation = version === 2 && ordinal % 30 === 0;
    const baseTitle = `${kind === 'PART' ? 'Pantalla' : kind === 'PRODUCT' ? 'Accesorio' : kind === 'SERVICE' ? 'Servicio técnico' : 'Insumo'} Demo ${ordinal}`;
    const title = replacement ? `Artículo agregado V2 ${ordinal}` : renamedObservation ? `${baseTitle} · etiqueta proveedor V2` : baseTitle;
    return { kind, supplierObservedTitle: title, title, description: 'Observación sintética', category: kind === 'PART' ? (ordinal % 41 === 0 ? 'Pantallas por revisar' : 'Pantallas') : kind === 'PRODUCT' ? 'Accesorios' : kind === 'SERVICE' ? 'Mantenimiento' : 'Consumibles', brand: kind === 'SERVICE' ? '' : ordinal % 7 === 0 ? 'Samsung' : 'Apple', supplierItemCode: replacement ? `PROV-NUEVO-${ordinal}` : version === 2 && ordinal === 10 ? 'PROV-000005' : ordinal % 5 === 0 ? `PROV-${String(ordinal).padStart(6, '0')}` : '', sku: '', barcode: '', price: String(299 + ordinal + (changed ? 25 : 0)), cost: ordinal % 11 === 0 ? '' : String(120 + ordinal + (changed ? 10 : 0)) };
  });
}
