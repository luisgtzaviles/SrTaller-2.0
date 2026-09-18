import { normalizeBrandDisplay as normalizeBrandValue } from '../catalog-brand-display.mjs';

export { normalizeBrandValue };

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

export const COMPACT_COLUMNS = Object.freeze(['supplierItemCode', 'sku', 'barcode', 'cost', 'price']);

const policyColumnByKey = Object.freeze({
  kind: 'kind',
  title: 'title',
  description: 'description',
  category: 'category',
  brand: 'brand',
  supplierItemCode: 'supplierItemCode',
  sku: 'sku',
  barcode: 'barcode',
  referenceCost: 'cost',
  basePrice: 'price',
});

/** Derives presentation-only Composer columns from the server-filtered effective policy. */
export function derivePolicyDrivenColumns(fields) {
  const all = [];
  const essential = [];
  const required = [];
  const seen = new Set();
  for (const field of fields) {
    const column = policyColumnByKey[field?.key];
    if (!column || seen.has(column)) continue;
    seen.add(column);
    all.push(column);
    if (field.level === 'REQUIRED' || field.level === 'ESSENTIAL') essential.push(column);
    if (field.level === 'REQUIRED') required.push(column);
  }
  return Object.freeze({ all: Object.freeze(all), essential: Object.freeze(essential), required: Object.freeze(required) });
}

/**
 * Keeps browsing a supplier independent from the supplier selected for a new
 * load. A previously chosen source is never silently replaced by another
 * source after the initial list has loaded.
 */
export function reconcileBrowseSourceId(sourceId, sources, initialized) {
  if (sourceId && sources.some((source) => source.sourceId === sourceId)) return sourceId;
  if (sources.length === 0 || initialized) return '';
  return sources[0]?.sourceId ?? '';
}

/** Returns only the version history belonging to the explicitly browsed source. */
export function supplierHistoryForBrowseSource(versions, sourceId) {
  if (!sourceId) return Object.freeze([]);
  return Object.freeze(versions
    .filter((version) => version.sourceId === sourceId)
    .sort((left, right) => right.sequenceNumber - left.sequenceNumber));
}

/**
 * Plans exception navigation from an immutable reconciliation row identity,
 * never from its human-facing row number. `allColumns` is the server-filtered
 * schema, so an unavailable protected field is intentionally not targeted.
 */
export function planSourceRowNavigation(rows, rowDecisionId, requestedColumn, visibleColumns, allColumns) {
  const rowIndex = rows.findIndex((row) => row?.rowDecisionId === rowDecisionId);
  if (rowIndex < 0) return Object.freeze({ rowIndex: -1, columnKey: null, requiresAllColumns: false });
  const authorizedColumn = requestedColumn && allColumns.includes(requestedColumn) ? requestedColumn : null;
  return Object.freeze({
    rowIndex,
    columnKey: authorizedColumn,
    requiresAllColumns: Boolean(authorizedColumn && !visibleColumns.includes(authorizedColumn)),
  });
}

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

/**
 * Keeps presentation-only grid widths within the integer-pixel contract used by
 * the layout adapter. Pointer coordinates may be fractional on HiDPI displays,
 * and persisted browser state is untrusted input on the next Composer mount.
 */
export function normalizeColumnWidth(value, fallback) {
  const fallbackWidth = Math.round(Math.max(COLUMN_MIN_WIDTH, Math.min(COLUMN_MAX_WIDTH, fallback)));
  if (typeof value !== 'number' || !Number.isFinite(value)) return fallbackWidth;
  return Math.round(Math.max(COLUMN_MIN_WIDTH, Math.min(COLUMN_MAX_WIDTH, value)));
}

/** Restores only canonical field widths and drops stale, malformed browser values. */
export function normalizeColumnWidths(value) {
  const candidate = value && typeof value === 'object' && !Array.isArray(value) ? value : {};
  return Object.freeze(Object.fromEntries(Object.entries(DEFAULT_COLUMN_WIDTHS).map(([column, fallback]) => [
    column,
    normalizeColumnWidth(candidate[column], fallback),
  ])));
}

/** Updates one stable canonical field key without rebuilding or reordering the grid schema. */
export function resizeColumnWidth(widths, column, value) {
  if (!Object.hasOwn(DEFAULT_COLUMN_WIDTHS, column)) return widths;
  const nextWidth = normalizeColumnWidth(value, DEFAULT_COLUMN_WIDTHS[column]);
  return widths[column] === nextWidth ? widths : Object.freeze({ ...widths, [column]: nextWidth });
}

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

export function applyBatchDefaults(row, defaults, normalizeBrand = normalizeBrandValue) {
  return {
    ...row,
    kind: row.kind || defaults.kind || '',
    category: row.category.trim() || defaults.category.trim(),
    brand: row.brand.trim() || normalizeBrand(defaults.brand),
  };
}

export function applyBatchDefaultsToEmptyRows(rows, defaults, normalizeBrand = normalizeBrandValue) {
  let changedCount = 0;
  const nextRows = rows.map((row) => {
    const next = applyBatchDefaults(row, defaults, normalizeBrand);
    if (next.kind !== row.kind || next.category !== row.category || next.brand !== row.brand) changedCount += 1;
    return next;
  });
  return Object.freeze({ rows: nextRows, changedCount });
}

/** Removes one physical draft observation while retaining the one-row grid invariant. */
export function removeDraftRow(rows, rowIndex) {
  if (rows.length <= 1) return Object.freeze({ rows: [...rows], removed: null, nextRowIndex: 0 });
  const index = Math.max(0, Math.min(rows.length - 1, Number.isInteger(rowIndex) ? rowIndex : 0));
  return Object.freeze({
    rows: Object.freeze(rows.filter((_, candidate) => candidate !== index)),
    removed: rows[index] ?? null,
    nextRowIndex: Math.min(index, rows.length - 2),
  });
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

export function hasMeaningfulComposerWork(input) {
  if (!input.dirty) return false;
  if (input.description.trim() || input.mode !== 'FULL' || input.completeness !== 'PARTIAL') return true;
  return input.rows.some((row) => [
    row.kind,
    row.supplierObservedTitle,
    row.title,
    row.description,
    row.category,
    row.brand,
    row.supplierItemCode,
    row.sku,
    row.barcode,
    row.price,
    row.cost,
  ].some((value) => String(value ?? '').trim().length > 0));
}

export function captureActionState({ lifecycle, dirty, hasMeaningfulWork }) {
  const reviewVisible = lifecycle === null || lifecycle === 'DRAFT';
  return Object.freeze({
    reviewVisible,
    saveForLaterVisible: reviewVisible && (lifecycle === 'DRAFT' ? dirty : hasMeaningfulWork),
  });
}

export function filterSupplierSources(sources, query) {
  const normalized = query.trim().toLocaleLowerCase('es-MX');
  if (!normalized) return sources;
  return sources.filter((source) => source.name.toLocaleLowerCase('es-MX').includes(normalized));
}

export const NEW_LOAD_INTENTS = Object.freeze([
  Object.freeze({ value: 'PARTIAL', label: 'Sólo algunos artículos', description: 'Agrega o actualiza únicamente lo incluido. Lo que no aparezca no se toma como ausencia.' }),
  Object.freeze({ value: 'COMPLETE', label: 'La lista completa del proveedor', description: 'Representa todo lo que ofrece actualmente el proveedor. SR Taller comparará qué continúa, qué se agregó y qué dejó de aparecer.' }),
]);

export function createNewLoadGateState() {
  return Object.freeze({ supplierId: null, completeness: null });
}

export function canContinueNewLoadGate(state) {
  return typeof state.supplierId === 'string'
    && state.supplierId.trim().length > 0
    && (state.completeness === 'PARTIAL' || state.completeness === 'COMPLETE');
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

/**
 * Creates presentation-only decision units for the authoritative duplicate
 * contradiction reason. Callers supply the existing identity key; this helper
 * never tries to infer identity from title similarity.
 *
 * @template T
 * @param {readonly T[]} rows
 * @param {(row: T) => string} keyForRow
 * @param {(row: T) => readonly string[]} errorsForRow
 * @param {(row: T) => readonly string[]} warningsForRow
 */
export function groupDuplicateResolutionRows(rows, keyForRow, errorsForRow, warningsForRow) {
  const evidence = rows.filter((row) => errorsForRow(row).includes('DUPLICATE_VALUE_CONTRADICTION') || warningsForRow(row).includes('DUPLICATE_VALUE_CONTRADICTION_SUPERSEDED'));
  const keys = new Set(evidence.map(keyForRow));
  const groups = new Map();
  for (const row of rows) {
    const key = keyForRow(row);
    if (!keys.has(key)) continue;
    groups.set(key, [...(groups.get(key) ?? []), row]);
  }
  return [...groups.entries()].map(([key, members]) => ({
    key,
    members: [...members].sort((left, right) => left.rowNumber - right.rowNumber),
    unresolved: members.some((member) => errorsForRow(member).includes('DUPLICATE_VALUE_CONTRADICTION')),
  })).filter((group) => group.members.length > 1);
}

/**
 * A contradictory duplicate can be explicitly reduced to one effective row
 * only when the server already describes one coherent identity: either the
 * same existing Catalog item, or no Catalog item at all (a prospective NEW
 * item). This is a presentation guard only; the repository repeats every
 * invariant transactionally before it persists the choice.
 *
 * @template {{targetItemId?: string | null, titleDecision?: string | null, decision?: string, errors?: readonly string[]}} T
 * @param {readonly T[]} members
 */
export function canChooseDuplicateWinner(members) {
  if (members.length < 2) return false;
  const first = members[0];
  if (!first) return false;
  const targetItemId = first.targetItemId ?? null;
  const titleDecision = first.titleDecision ?? null;
  return members.every((member) =>
    member.decision === 'UNRESOLVED'
    && Array.isArray(member.errors)
    && member.errors.includes('DUPLICATE_VALUE_CONTRADICTION')
    && (member.targetItemId ?? null) === targetItemId
    && (member.titleDecision ?? null) === titleDecision,
  );
}

/**
 * Compose the existing durable draft and analysis boundaries without making a
 * second analysis attempt when persistence did not complete. `snapshot` is an
 * already-authoritative, unchanged DRAFT; otherwise `persist` must return the
 * authoritative server response that `analyze` receives.
 */
export async function orchestrateReviewList({ snapshot, persist, analyze }) {
  let authoritativeSnapshot = snapshot;
  if (!authoritativeSnapshot) {
    try {
      authoritativeSnapshot = await persist();
    } catch (cause) {
      return { stage: 'SAVE_FAILED', snapshot: null, cause };
    }
    if (!authoritativeSnapshot) return { stage: 'SAVE_FAILED', snapshot: null, cause: null };
  }
  try {
    return { stage: 'ANALYZED', snapshot: authoritativeSnapshot, result: await analyze(authoritativeSnapshot), cause: null };
  } catch (cause) {
    return { stage: 'ANALYZE_FAILED', snapshot: authoritativeSnapshot, cause };
  }
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
