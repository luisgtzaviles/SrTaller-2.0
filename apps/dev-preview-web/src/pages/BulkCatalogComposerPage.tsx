import { ArchiveX, Check, ChevronDown, ChevronUp, ClipboardPaste, Columns3, Database, GitCompare, PanelLeftClose, PanelLeftOpen, Plus, RotateCcw, Save, Send, Trash2 } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { analyzeSupplierVersion, compareSupplierVersions, createCatalogRetirementPlan, createSupplierDraft, createSupplierSource, decideSupplierRow, decideSupplierRows, executeCatalogRetirementPlan, getSupplierVersion, listCatalogReferences, listSupplierSources, listSupplierVersions, normalizeCatalogReferenceText, publishSupplierVersion, replaceSupplierDraft } from '../catalog-api.js';
import type { BulkCatalogClassification, BulkCatalogMode, CatalogItemKind, CatalogReferences, CatalogRetirementPlan, SupplierSource, SupplierVersion, SupplierVersionComparison, SupplierVersionSummary } from '../catalog-api.js';
import { PreviewApiError } from '../api.js';
import { Button, Input, Select } from '../components/ui/controls.js';
import { Alert, EmptyState, Spinner, Toast } from '../components/ui/feedback.js';
import { BackLink, PageHeader } from '../components/ui/navigation.js';
import { Dialog } from '../components/ui/overlays.js';
import { hasOperationalCapability } from '../session/session-capabilities.mjs';
import type { OperationalCapability } from '../session/session-api.js';
import { applyBatchDefaults, COLUMN_MAX_WIDTH, COLUMN_MIN_WIDTH, COMPACT_COLUMNS, DEFAULT_COLUMN_WIDTHS, ESSENTIAL_COLUMNS, estimateColumnWidth, fillRows, FULL_COLUMNS, nextGridCell, nextValidationIssueIndex, normalizeSupplierTitle, ownerSupplierClipboard, parseClipboardMatrix, parseMoneyToMinor, sortValidationIssues, validateComposerDraft, validationIssueFromApi } from './bulk-catalog-composer-model.mjs';
import type { ComposerColumn, ComposerSelection, ValidationIssue } from './bulk-catalog-composer-model.mjs';
import { applyBulkCatalogCanvas, applyBulkCatalogGrid, applyBulkCatalogOffset } from './bulk-catalog-grid-layout.js';
import styles from './bulk-catalog-composer-page.module.css';

type UiRow = { kind: CatalogItemKind | ''; supplierObservedTitle: string; title: string; description: string; category: string; brand: string; supplierItemCode: string; sku: string; barcode: string; price: string; cost: string };
type Column = ComposerColumn;
type BatchDefaults = { kind: CatalogItemKind | ''; category: string; brand: string };
const columns = FULL_COLUMNS;
const compactColumns = COMPACT_COLUMNS;
const essentialColumns = ESSENTIAL_COLUMNS;
const blank = (): UiRow => ({ kind: '', supplierObservedTitle: '', title: '', description: '', category: '', brand: '', supplierItemCode: '', sku: '', barcode: '', price: '', cost: '' });
const labels: Record<Column, string> = { kind: 'Tipo', title: 'Título', description: 'Descripción', category: 'Categoría', brand: 'Marca', supplierItemCode: 'Código proveedor', sku: 'SKU interno', barcode: 'Código de barras interno', price: 'Precio base', cost: 'Costo de referencia' };
const statusLabels = { NEW: 'Nuevo', UPDATE: 'Actualiza', REACTIVATE: 'Reactiva', UNCHANGED: 'Sin cambio', PENDING_REFERENCE: 'Referencia pendiente', AMBIGUOUS: 'Ambiguo', CONFLICT: 'Conflicto', INVALID: 'Inválido' } as const;
const toMinor = (value: string): number | null => parseMoneyToMinor(value);
const fromMinor = (value: number | null): string => value === null ? '' : (value / 100).toFixed(2);
const fromRecord = (version: SupplierVersion): UiRow[] => version.rows.map(({ proposal, supplierObservedTitle }) => ({ kind: proposal.kind ?? '', supplierObservedTitle: supplierObservedTitle ?? proposal.supplierObservedTitle ?? proposal.title ?? '', title: proposal.title ?? '', description: proposal.description ?? '', category: proposal.category ?? '', brand: proposal.brand ?? '', supplierItemCode: proposal.supplierItemCode ?? '', sku: proposal.sku ?? '', barcode: proposal.barcode ?? '', price: fromMinor(proposal.basePriceMinor), cost: fromMinor(proposal.referenceCostMinor) }));
const signature = async (mode: BulkCatalogMode): Promise<string> => { const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode((mode === 'FULL' ? columns : compactColumns).join('\t'))); return [...new Uint8Array(bytes)].map((value) => value.toString(16).padStart(2, '0')).join(''); };
const proposal = (row: UiRow) => ({ kind: row.kind || null, supplierObservedTitle: row.supplierObservedTitle || row.title || null, title: row.title.trim() || null, description: row.description.trim() || null, category: row.category.trim() || null, brand: row.brand.trim() || null, supplierItemCode: row.supplierItemCode.trim() || null, sku: row.sku.trim() || null, barcode: row.barcode.trim() || null, basePriceMinor: toMinor(row.price), referenceCostMinor: toMinor(row.cost) });
const failureCode = (error: unknown): string => error instanceof PreviewApiError && error.code ? ` (${error.code})` : '';
const analysisMessage = (code: string): string => code === 'HISTORICAL_ITEM_RETIRED_REQUIRES_REACTIVATION' ? 'La memoria histórica apunta a un artículo retirado. Reactívalo explícitamente en Lista de precios y vuelve a analizar; no se creará un duplicado.' : code;
const warningMessage = (code: string): string => code === 'HISTORICAL_INACTIVE_MATCH_REQUIRES_REACTIVATION_CONFIRMATION' ? 'El análisis encontró una coincidencia histórica única con un artículo Inactivo: Reactivar conserva su identidad.' : code === 'HISTORICAL_MATCH_REQUIRES_CONFIRMATION' ? 'Coincidencia histórica única; requiere confirmación explícita.' : code;

function demo(version: 1 | 2): UiRow[] {
  return Array.from({ length: 1_500 }, (_, index) => {
    const ordinal = index + 1; const kind: CatalogItemKind = ordinal % 13 === 0 ? 'SUPPLY' : ordinal % 5 === 0 ? 'SERVICE' : ordinal % 3 === 0 ? 'PRODUCT' : 'PART';
    const changed = version === 2 && ordinal % 6 === 0; const replacement = version === 2 && ordinal >= 1_499; const renamedObservation = version === 2 && ordinal % 30 === 0;
    const baseTitle = `${kind === 'PART' ? 'Pantalla' : kind === 'PRODUCT' ? 'Accesorio' : kind === 'SERVICE' ? 'Servicio técnico' : 'Insumo'} Demo ${ordinal}`;
    const title = replacement ? `Artículo agregado V2 ${ordinal}` : renamedObservation ? `${baseTitle} · etiqueta proveedor V2` : baseTitle;
    return { kind, supplierObservedTitle: title, title, description: `Observación sintética`, category: kind === 'PART' ? (ordinal % 41 === 0 ? 'Pantallas por revisar' : 'Pantallas') : kind === 'PRODUCT' ? 'Accesorios' : kind === 'SERVICE' ? 'Mantenimiento' : 'Consumibles', brand: kind === 'SERVICE' ? '' : ordinal % 7 === 0 ? 'Samsung' : 'Apple', supplierItemCode: replacement ? `PROV-NUEVO-${ordinal}` : version === 2 && ordinal === 10 ? 'PROV-000005' : ordinal % 5 === 0 ? `PROV-${String(ordinal).padStart(6, '0')}` : '', sku: '', barcode: '', price: String(299 + ordinal + (changed ? 25 : 0)), cost: ordinal % 11 === 0 ? '' : String(120 + ordinal + (changed ? 10 : 0)) };
  });
}

export function BulkCatalogComposerPage({ capabilities, csrfToken }: Readonly<{ capabilities: readonly OperationalCapability[]; csrfToken: string }>): React.JSX.Element {
  const canPublish = hasOperationalCapability(capabilities, 'catalog.import.publish') && hasOperationalCapability(capabilities, 'catalog.manage') && hasOperationalCapability(capabilities, 'catalog.prices.manage');
  const canReadCost = hasOperationalCapability(capabilities, 'catalog.reference_cost.read'); const canWriteCost = hasOperationalCapability(capabilities, 'catalog.reference_cost.manage');
  const canBulkRetire = hasOperationalCapability(capabilities, 'catalog.items.bulk_retire');
  const [sources, setSources] = useState<readonly SupplierSource[]>([]); const [versions, setVersions] = useState<readonly SupplierVersionSummary[]>([]); const [selectedSource, setSelectedSource] = useState(''); const [newSourceName, setNewSourceName] = useState('Proveedor Demo');
  const [sourceRevision, setSourceRevision] = useState('Versión 1'); const [mode, setMode] = useState<BulkCatalogMode>('FULL'); const [rows, setRows] = useState<UiRow[]>([blank()]); const [current, setCurrent] = useState<SupplierVersion | null>(null); const [compare, setCompare] = useState<SupplierVersionComparison | null>(null); const [compareId, setCompareId] = useState('');
  const [references, setReferences] = useState<CatalogReferences>({ categories: [], brands: [], pendingCategories: [], pendingBrands: [], categoryBrandApplicability: [] });
  const [batchDefaults, setBatchDefaults] = useState<BatchDefaults>(() => {
    try {
      const stored = JSON.parse(sessionStorage.getItem('srtaller:bulk-composer:batch-context:v1') ?? '{}') as Partial<BatchDefaults>;
      return { kind: stored.kind ?? '', category: stored.category ?? '', brand: stored.brand ?? '' };
    } catch { return { kind: '', category: '', brand: '' }; }
  });
  const [viewPreset, setViewPreset] = useState<'ESSENTIAL' | 'ALL'>('ESSENTIAL');
  const [columnWidths, setColumnWidths] = useState<Record<Column, number>>(() => {
    try { return { ...DEFAULT_COLUMN_WIDTHS, ...JSON.parse(sessionStorage.getItem('srtaller:bulk-composer:column-widths:v1') ?? '{}') as Partial<Record<Column, number>> }; }
    catch { return { ...DEFAULT_COLUMN_WIDTHS }; }
  });
  const [mappingTargets, setMappingTargets] = useState<Record<string, string>>({});
  const [retirementPlan, setRetirementPlan] = useState<CatalogRetirementPlan | null>(null); const [retirementPin, setRetirementPin] = useState('');
  const [busy, setBusy] = useState(false); const [dirty, setDirty] = useState(false); const [notice, setNotice] = useState<{ tone: 'danger' | 'warning'; message: string } | null>(null); const [toast, setToast] = useState<{ id: number; message: string } | null>(null); const [serverIssues, setServerIssues] = useState<ValidationIssue[]>([]); const [validationAttempted, setValidationAttempted] = useState(false); const [issueIndex, setIssueIndex] = useState(0); const [pendingIssueFocus, setPendingIssueFocus] = useState<ValidationIssue | null>(null); const [sourcesOpen, setSourcesOpen] = useState(true); const [contextOpen, setContextOpen] = useState(true); const [scrollTop, setScrollTop] = useState(0); const [active, setActive] = useState({ row: 0, column: 0 }); const [selection, setSelection] = useState<ComposerSelection | null>(null); const undoRows = useRef<UiRow[] | null>(null); const editOriginal = useRef<{ row: number; column: Column; value: string } | null>(null); const publishRequest = useRef(crypto.randomUUID()); const viewportRef = useRef<HTMLDivElement | null>(null); const headerScrollRef = useRef<HTMLDivElement | null>(null); const sourceRef = useRef<HTMLSelectElement | null>(null); const sourceRevisionRef = useRef<HTMLInputElement | null>(null); const toastTimer = useRef<number | null>(null);
  const activeColumns = mode === 'COMPACT' ? compactColumns : viewPreset === 'ESSENTIAL' ? essentialColumns : columns;
  const schemaColumns = mode === 'FULL' ? columns : compactColumns;
  const gridTemplateColumns = `52px ${activeColumns.map((column) => `${columnWidths[column]}px`).join(' ')}`;
  const gridWidth = 52 + activeColumns.reduce((total, column) => total + columnWidths[column], 0);
  const rowHeight = 62; const first = Math.max(0, Math.floor(scrollTop / rowHeight) - 5); const visible = rows.slice(first, first + 22);
  const refresh = useCallback(async () => { const [nextSources, nextVersions, nextReferences] = await Promise.all([listSupplierSources(), listSupplierVersions(), listCatalogReferences()]); setSources(nextSources); setVersions(nextVersions); setReferences(nextReferences); if (!selectedSource && nextSources[0]) setSelectedSource(nextSources[0].sourceId); }, [selectedSource]);
  useEffect(() => { void refresh().catch(() => setNotice({ tone: 'danger', message: 'No fue posible cargar los catálogos de proveedor.' })); }, [refresh]);
  useEffect(() => { const protect = (event: BeforeUnloadEvent): void => { if (dirty) event.preventDefault(); }; window.addEventListener('beforeunload', protect); return () => window.removeEventListener('beforeunload', protect); }, [dirty]);
  useEffect(() => { sessionStorage.setItem('srtaller:bulk-composer:column-widths:v1', JSON.stringify(columnWidths)); }, [columnWidths]);
  useEffect(() => { sessionStorage.setItem('srtaller:bulk-composer:batch-context:v1', JSON.stringify(batchDefaults)); }, [batchDefaults]);
  useEffect(() => () => { if (toastTimer.current !== null) window.clearTimeout(toastTimer.current); }, []);
  const showToast = useCallback((message: string): void => { if (toastTimer.current !== null) window.clearTimeout(toastTimer.current); setToast({ id: Date.now(), message }); toastTimer.current = window.setTimeout(() => setToast(null), 3_500); }, []);
  const rawPayload = useMemo(() => rows.map((row) => schemaColumns.map((column) => column === 'title' ? row.supplierObservedTitle || row.title : row[column]).join('\t')).join('\n'), [rows, schemaColumns]);
  const findCategory = useCallback((name: string) => references.categories.find((value) => value.status === 'ACTIVE' && normalizeCatalogReferenceText(value.name) === normalizeCatalogReferenceText(name)), [references.categories]);
  const findBrand = useCallback((name: string) => references.brands.find((value) => value.status === 'ACTIVE' && normalizeCatalogReferenceText(value.name) === normalizeCatalogReferenceText(name)), [references.brands]);
  const isCompatible = useCallback((row: UiRow): boolean => {
    if (!row.kind) return true;
    const category = row.category ? findCategory(row.category) : undefined; if (category && !category.applicableKinds.includes(row.kind)) return false;
    const brand = row.brand ? findBrand(row.brand) : undefined; if (brand && !brand.applicableKinds.includes(row.kind)) return false;
    if (category && brand) { const governed = references.categoryBrandApplicability.filter((value) => value.categoryId === category.categoryId && value.kind === row.kind); if (governed.length > 0 && !governed.some((value) => value.brandId === brand.brandId)) return false; }
    return true;
  }, [findBrand, findCategory, references.categoryBrandApplicability]);
  const collectIssues = useCallback((): ValidationIssue[] => sortValidationIssues([
    ...validateComposerDraft({ selectedSource, sourceRevision, mode, rows }),
    ...rows.flatMap((row, rowIndex): ValidationIssue[] => isCompatible(row) ? [] : [{ scope: 'CELL', rowIndex, columnKey: row.brand ? 'brand' : 'category', code: 'INCOMPATIBLE_REFERENCE', message: 'Esta combinación de Tipo, Categoría y Marca no es compatible.' }]),
    ...serverIssues,
  ]), [isCompatible, mode, rows, selectedSource, serverIssues, sourceRevision]);
  const issues = validationAttempted || serverIssues.length > 0 ? collectIssues() : [];
  const normalizedIssueIndex = Math.min(issueIndex, Math.max(0, issues.length - 1));
  const currentIssue = issues[normalizedIssueIndex];
  const cellIssue = (rowIndex: number, column: Column): ValidationIssue | undefined => issues.find((issue) => issue.scope === 'CELL' && issue.rowIndex === rowIndex && issue.columnKey === column);
  const batchIssue = (controlKey: 'source' | 'sourceRevision' | 'mode'): ValidationIssue | undefined => issues.find((issue) => issue.scope === 'BATCH' && issue.controlKey === controlKey);
  const clearServerIssue = (predicate: (issue: ValidationIssue) => boolean): void => setServerIssues((existing) => existing.filter((issue) => !predicate(issue)));
  const rememberUndo = (existing: readonly UiRow[]): void => { undoRows.current = existing.map((row) => ({ ...row })); };
  const updateCell = (rowIndex: number, column: Column, value: string): void => { clearServerIssue((issue) => issue.scope === 'CELL' && issue.rowIndex === rowIndex && issue.columnKey === column); setDirty(true); setRows((existing) => { const currentRow = existing[rowIndex]; if (!currentRow) return existing; const candidate = { ...currentRow, [column]: value } as UiRow; if (column === 'title' && !currentRow.supplierObservedTitle) candidate.supplierObservedTitle = value; if (['kind', 'category', 'brand'].includes(column) && !isCompatible(candidate)) { setNotice({ tone: 'warning', message: 'Ese cambio no es compatible con Tipo, Categoría y Marca. Ajusta el contexto antes de continuar.' }); return existing; } rememberUndo(existing); return existing.map((row, index) => index === rowIndex ? candidate : row); }); };
  const paste = (event: React.ClipboardEvent<HTMLInputElement>, rowIndex: number, columnIndex: number): void => {
    event.preventDefault(); const text = event.clipboardData.getData('text/plain'); const matrix = parseClipboardMatrix(text);
    if (matrix.length === 0) { setNotice({ tone: 'warning', message: 'El bloque copiado no contiene filas con datos.' }); return; }
    const cellCount = matrix.reduce((total, line) => total + line.filter((cell) => cell.trim().length > 0).length, 0);
    if (new TextEncoder().encode(text).byteLength > 10 * 1024 * 1024 || rowIndex + matrix.length > 10_000 || matrix.some((line) => line.length > 32 || line.some((cell) => cell.length > 4_096)) || cellCount > 200_000) { setNotice({ tone: 'danger', message: 'El bloque excede los límites: 10,000 filas, 32 columnas, 200,000 celdas, 4,096 caracteres por celda o 10 MiB.' }); return; }
    setDirty(true); setRows((existing) => {
      rememberUndo(existing); const next = existing.map((row) => ({ ...row }));
      while (next.length < rowIndex + matrix.length) next.push(blank());
      matrix.forEach((values, y) => {
        const destination = rowIndex + y; const previous = next[destination] ?? blank(); const hadRowContent = [previous.title, previous.description, previous.supplierItemCode, previous.sku, previous.barcode, previous.price, previous.cost].some((value) => value.trim());
        let nextRow = hadRowContent ? { ...previous } : applyBatchDefaults(previous, batchDefaults);
        values.forEach((value, x) => { const column = activeColumns[columnIndex + x]; if (!column) return; if (column === 'title') { nextRow.supplierObservedTitle = value; nextRow.title = normalizeSupplierTitle(value); } else nextRow = { ...nextRow, [column]: value } as UiRow; });
        next[destination] = nextRow;
      });
      const invalid = next.slice(rowIndex, rowIndex + matrix.length).find((row) => !isCompatible(row));
      if (invalid) { setNotice({ tone: 'warning', message: 'El pegado produciría una combinación incompatible de Tipo, Categoría y Marca; no se aplicó.' }); return existing; }
      return next;
    });
    const lastColumn = Math.min(activeColumns.length - 1, columnIndex + Math.max(...matrix.map((line) => line.length)) - 1);
    setActive({ row: rowIndex, column: columnIndex }); setSelection({ firstRow: rowIndex, lastRow: rowIndex + matrix.length - 1, firstColumn: columnIndex, lastColumn });
    showToast(`${matrix.length} filas pegadas; se ignoraron sólo filas vacías terminales.`);
  };
  const undo = (): void => { if (!undoRows.current) return; const prior = undoRows.current; undoRows.current = rows.map((row) => ({ ...row })); setRows(prior); setDirty(true); showToast('Se deshizo la última operación de datos.'); };
  const focusCell = (row: number, column: number): void => { setActive({ row, column }); if (row < first + 2 || row > first + 18) viewportRef.current?.scrollTo({ top: Math.max(0, (row - 5) * rowHeight), left: viewportRef.current.scrollLeft }); requestAnimationFrame(() => requestAnimationFrame(() => document.querySelector<HTMLElement>(`[data-cell="${row}:${column}"]`)?.focus())); };
  const focusIssue = (issue: ValidationIssue): void => {
    if (issue.scope === 'BATCH') {
      if (issue.controlKey === 'source') { setSourcesOpen(true); window.setTimeout(() => sourceRef.current?.focus(), 40); }
      if (issue.controlKey === 'sourceRevision') window.setTimeout(() => sourceRevisionRef.current?.focus(), 40);
      return;
    }
    if (issue.scope !== 'CELL' || issue.rowIndex === undefined || !issue.columnKey) return;
    const targetColumns = mode === 'COMPACT' ? compactColumns : columns;
    if (!activeColumns.includes(issue.columnKey)) setViewPreset('ALL');
    const column = targetColumns.indexOf(issue.columnKey);
    setActive({ row: issue.rowIndex, column });
    const left = 52 + targetColumns.slice(0, column).reduce((total, key) => total + columnWidths[key], 0);
    viewportRef.current?.scrollTo({ top: Math.max(0, (issue.rowIndex - 4) * rowHeight), left: Math.max(0, left - 24) });
    window.setTimeout(() => document.querySelector<HTMLElement>(`[data-cell-key="${issue.rowIndex}:${issue.columnKey}"]`)?.focus(), 40);
  };
  useEffect(() => {
    if (!pendingIssueFocus) return undefined;
    const timer = window.setTimeout(() => { focusIssue(pendingIssueFocus); setPendingIssueFocus(null); }, 40);
    return () => window.clearTimeout(timer);
  }, [pendingIssueFocus]);
  const moveIssue = (direction: -1 | 1): void => { const next = nextValidationIssueIndex(normalizedIssueIndex, direction, issues.length); setIssueIndex(next); const issue = issues[next]; if (issue) focusIssue(issue); };
  const navigate = (event: React.KeyboardEvent<HTMLInputElement | HTMLSelectElement>, rowIndex: number, columnIndex: number): void => {
    if ((event.metaKey || event.ctrlKey) && event.key.toLocaleLowerCase('en-US') === 'z') { event.preventDefault(); undo(); return; }
    if (event.key === 'Escape' && editOriginal.current?.row === rowIndex && editOriginal.current.column === activeColumns[columnIndex]) { event.preventDefault(); updateCell(rowIndex, editOriginal.current.column, editOriginal.current.value); showToast('Edición de celda cancelada.'); return; }
    if (event.currentTarget instanceof HTMLSelectElement && ['ArrowUp', 'ArrowDown'].includes(event.key)) return;
    if (!['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Tab', 'Enter'].includes(event.key)) return;
    event.preventDefault(); const next = nextGridCell(event.key, rowIndex, columnIndex, rows.length, activeColumns.length, event.shiftKey); focusCell(next.row, next.column);
  };
  const applyDefaultsToEmptyCells = (): void => { setRows((existing) => { rememberUndo(existing); const next = existing.map((row) => applyBatchDefaults(row, batchDefaults)); if (next.some((row) => !isCompatible(row))) { setNotice({ tone: 'warning', message: 'El contexto no es compatible con una o más filas; no se aplicó.' }); return existing; } setDirty(true); showToast('El contexto se aplicó sólo a celdas vacías.'); return next; }); };
  const prepareOwnerCase = (): void => {
    const ownerDefaults: BatchDefaults = { kind: 'PART', category: 'Pantallas', brand: 'Apple' }; const matrix = parseClipboardMatrix(ownerSupplierClipboard());
    setBatchDefaults(ownerDefaults); setViewPreset('ESSENTIAL'); setCurrent(null); setSourceRevision('Caso Owner · 36 pantallas'); setMode('FULL');
    setRows(matrix.map(([observedTitle = '', cost = '', price = '']) => ({ ...applyBatchDefaults(blank(), ownerDefaults), supplierObservedTitle: observedTitle, title: normalizeSupplierTitle(observedTitle), cost, price })));
    setActive({ row: 0, column: 0 }); setSelection({ firstRow: 0, lastRow: matrix.length - 1, firstColumn: 0, lastColumn: 2 }); setDirty(true); setValidationAttempted(false); setServerIssues([]); showToast('Caso Owner preparado: 36 filas × 3 columnas; nada se ha guardado.');
  };
  const prepareDemo = (version: 1 | 2): void => {
    setRows(demo(version)); setSourceRevision(`Versión ${version}`); setViewPreset('ALL'); setDirty(true);
    setValidationAttempted(false); setServerIssues([]); setNotice(null); setIssueIndex(0);
  };
  const performFill = (source: ComposerSelection, target: { row: number; column: number }): void => { setRows((existing) => { const next = fillRows(existing, activeColumns, source, target); if (next.some((row) => !isCompatible(row))) { setNotice({ tone: 'warning', message: 'El relleno produciría una combinación incompatible y fue cancelado.' }); return existing; } rememberUndo(existing); setDirty(true); showToast('Relleno copiado. Puedes deshacerlo antes de guardar.'); return next; }); };
  const beginFill = (event: React.PointerEvent<HTMLButtonElement>): void => {
    event.preventDefault(); const source = selection && active.row >= selection.firstRow && active.row <= selection.lastRow && active.column >= selection.firstColumn && active.column <= selection.lastColumn ? selection : { firstRow: active.row, lastRow: active.row, firstColumn: active.column, lastColumn: active.column }; let target = { row: source.lastRow, column: source.lastColumn };
    const move = (pointerEvent: PointerEvent): void => { const shell = document.elementFromPoint(pointerEvent.clientX, pointerEvent.clientY)?.closest<HTMLElement>('[data-cell-shell]'); if (!shell) return; const [rowValue, columnValue] = (shell.dataset.cellShell ?? '').split(':').map(Number); if (!Number.isInteger(rowValue) || !Number.isInteger(columnValue)) return; target = { row: rowValue!, column: columnValue! }; setSelection({ firstRow: Math.min(source.firstRow, target.row), lastRow: Math.max(source.lastRow, target.row), firstColumn: Math.min(source.firstColumn, target.column), lastColumn: Math.max(source.lastColumn, target.column) }); };
    const up = (): void => { window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); performFill(source, target); };
    window.addEventListener('pointermove', move); window.addEventListener('pointerup', up, { once: true });
  };
  const beginResize = (event: React.PointerEvent<HTMLButtonElement>, column: Column): void => { event.preventDefault(); event.stopPropagation(); const start = event.clientX; const initial = columnWidths[column]; const move = (pointerEvent: PointerEvent): void => setColumnWidths((value) => ({ ...value, [column]: Math.max(COLUMN_MIN_WIDTH, Math.min(COLUMN_MAX_WIDTH, initial + pointerEvent.clientX - start)) })); const up = (): void => { window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); }; window.addEventListener('pointermove', move); window.addEventListener('pointerup', up, { once: true }); };
  const autoFit = (column: Column): void => { const values = rows.slice(0, 500).map((row) => column === 'title' ? row.title : row[column]); setColumnWidths((existing) => ({ ...existing, [column]: estimateColumnWidth(labels[column], values) })); showToast(`${labels[column]} ajustada automáticamente.`); };
  const buildPayload = async () => ({ sourceId: selectedSource, sourceRevision, mode, columnSignature: await signature(mode), rawPayload, rows: rows.map(proposal) });
  const addSource = async (): Promise<void> => { setBusy(true); try { const created = await createSupplierSource(newSourceName, csrfToken); await refresh(); setSelectedSource(created.sourceId); clearServerIssue((issue) => issue.controlKey === 'source'); showToast('Fuente de proveedor creada.'); } catch { setNotice({ tone: 'danger', message: 'No se creó la fuente; revisa nombre o duplicados.' }); } finally { setBusy(false); } };
  const save = async (): Promise<void> => {
    setNotice(null); setServerIssues([]); setValidationAttempted(true); setIssueIndex(0);
    const clientIssues = sortValidationIssues([
      ...validateComposerDraft({ selectedSource, sourceRevision, mode, rows }),
      ...rows.flatMap((row, rowIndex): ValidationIssue[] => isCompatible(row) ? [] : [{ scope: 'CELL', rowIndex, columnKey: row.brand ? 'brand' : 'category', code: 'INCOMPATIBLE_REFERENCE', message: 'Esta combinación de Tipo, Categoría y Marca no es compatible.' }]),
    ]);
    if (clientIssues[0]) { setPendingIssueFocus(clientIssues[0]); return; }
    setBusy(true);
    try {
      const payload = { ...(await buildPayload()), includeReferenceCost: canReadCost };
      const saved = current?.lifecycle === 'DRAFT' ? await replaceSupplierDraft(current.versionId, { ...payload, expectedVersion: current.version }, csrfToken) : await createSupplierDraft(payload, csrfToken);
      setCurrent(saved); setRows(fromRecord(saved)); setDirty(false); setValidationAttempted(false); setServerIssues([]); undoRows.current = null; await refresh(); showToast('Borrador guardado. Puedes continuar después.');
    } catch (error) {
      const issue = validationIssueFromApi(error instanceof PreviewApiError ? { status: error.status, code: error.code, parameter: error.parameter } : { status: 0 });
      if (issue.scope === 'GLOBAL') setNotice({ tone: 'danger', message: issue.message });
      else { setServerIssues([issue]); setIssueIndex(0); setPendingIssueFocus(issue); }
    } finally { setBusy(false); }
  };
  const analyze = async (): Promise<void> => { if (!current) return; setBusy(true); try { const value = await analyzeSupplierVersion(current.versionId, current.version, canReadCost, csrfToken); setCurrent(value); setRows(fromRecord(value)); await refresh(); showToast('Análisis terminado sin escribir en Lista de precios.'); } catch { setNotice({ tone: 'danger', message: 'No fue posible analizar el snapshot.' }); } finally { setBusy(false); } };
  const load = async (id: string): Promise<void> => { if (dirty && !window.confirm('Hay cambios sin guardar. ¿Quieres descartarlos y abrir otra versión?')) return; setBusy(true); try { const value = await getSupplierVersion(id, canReadCost); setCurrent(value); setMode(value.mode); setSelectedSource(value.sourceId); setSourceRevision(value.sourceRevision); setRows(fromRecord(value)); setDirty(false); setValidationAttempted(false); setServerIssues([]); setSourcesOpen(false); undoRows.current = null; setNotice(null); publishRequest.current = crypto.randomUUID(); } finally { setBusy(false); } };
  const resolve = async (rowDecisionId: string, expectedRowVersion: number, nextDecision: 'APPLY' | 'EXCLUDE', targetItemId: string | null = null): Promise<void> => { if (!current) return; setBusy(true); try { const value = await decideSupplierRow(current.versionId, rowDecisionId, { expectedRowVersion, decision: nextDecision, targetItemId, includeReferenceCost: canReadCost }, csrfToken); setCurrent(value); showToast(targetItemId ? 'Mapping corregido e incluido explícitamente.' : nextDecision === 'APPLY' ? 'Fila incluida explícitamente.' : 'Fila excluida del lote.'); } catch { setNotice({ tone: 'danger', message: 'La fila requiere un artículo canónico válido, resolver el duplicado o releer la versión.' }); } finally { setBusy(false); } };
  const resolveGroup = async (classifications: readonly BulkCatalogClassification[], nextDecision: 'APPLY' | 'EXCLUDE'): Promise<void> => { if (!current) return; setBusy(true); try { const value = await decideSupplierRows(current.versionId, { expectedBatchVersion: current.batch.version, classifications, decision: nextDecision, includeReferenceCost: canReadCost }, csrfToken); setCurrent(value); showToast(nextDecision === 'APPLY' ? 'Filas compatibles confirmadas.' : 'Filas con conflicto excluidas.'); } catch { setNotice({ tone: 'danger', message: 'El lote cambió o contiene una combinación que requiere revisión individual.' }); } finally { setBusy(false); } };
  const publish = async (): Promise<void> => { if (!current || !canPublish) return; setBusy(true); try { const value = await publishSupplierVersion(current.versionId, current.version, canReadCost && canWriteCost, csrfToken, publishRequest.current); setCurrent(value); await refresh(); showToast('Lote aplicado atómicamente a Catalog.'); } catch (error) { setNotice({ tone: 'danger', message: `No se publicó. El lote se revalidó y no hubo escrituras parciales.${failureCode(error)}` }); } finally { setBusy(false); } };
  const planCreatedBatchRetirement = async (): Promise<void> => { if (!current || current.batch.lifecycle !== 'APPLIED') return; setBusy(true); try { setRetirementPlan(await createCatalogRetirementPlan({ scope: 'BATCH_CREATED', sourceVersionId: current.versionId }, csrfToken)); setRetirementPin(''); } catch { setNotice({ tone: 'danger', message: 'No fue posible preparar el plan de artículos creados por este lote.' }); } finally { setBusy(false); } };
  const retireCreatedBatchItems = async (): Promise<void> => { if (!retirementPlan || retirementPin.length !== 4) return; setBusy(true); try { const result = await executeCatalogRetirementPlan(retirementPlan.planId, { confirmation: 'RETIRE_BATCH_CREATED_ITEMS', pin: retirementPin, clientRequestId: crypto.randomUUID() }, csrfToken); setRetirementPlan(null); setRetirementPin(''); await refresh(); showToast(`${result.retiredCount.toLocaleString('es-MX')} artículos CREATED retirados; MATCHED/UPDATED permanecen intactos.`); } catch (error) { setNotice({ tone: 'danger', message: error instanceof PreviewApiError && error.code === 'REAUTHENTICATION_DENIED' ? 'El PIN no corresponde al usuario de esta sesión o está temporalmente bloqueado.' : 'El plan cambió, expiró o perdió autoridad. Prepara uno nuevo.' }); } finally { setBusy(false); } };
  const compareVersions = async (): Promise<void> => { if (!current || !compareId) return; setBusy(true); try { setCompare(await compareSupplierVersions(compareId, current.versionId)); } finally { setBusy(false); } };
  const categoryOptions = references.categories.filter((value) => value.status === 'ACTIVE' && (!batchDefaults.kind || value.applicableKinds.includes(batchDefaults.kind)));
  const selectedCategory = batchDefaults.category ? findCategory(batchDefaults.category) : undefined;
  const governedBrandIds = selectedCategory && batchDefaults.kind ? references.categoryBrandApplicability.filter((value) => value.categoryId === selectedCategory.categoryId && value.kind === batchDefaults.kind).map((value) => value.brandId) : [];
  const brandOptions = references.brands.filter((value) => value.status === 'ACTIVE' && (!batchDefaults.kind || value.applicableKinds.includes(batchDefaults.kind)) && (governedBrandIds.length === 0 || governedBrandIds.includes(value.brandId!)));
  const changeDefaultKind = (kind: CatalogItemKind | ''): void => { let next: BatchDefaults = { ...batchDefaults, kind }; const probe = { ...blank(), ...next }; if (next.category && !isCompatible(probe)) next = { ...next, category: '', brand: '' }; else if (next.brand && !isCompatible({ ...probe, category: next.category })) next = { ...next, brand: '' }; setBatchDefaults(next); showToast('El contexto cambió; las filas existentes no se modificaron.'); };
  const changeDefaultCategory = (category: string): void => { let next: BatchDefaults = { ...batchDefaults, category }; if (next.brand && !isCompatible({ ...blank(), ...next })) next = { ...next, brand: '' }; setBatchDefaults(next); };
  const counts = current?.batch.counts; const unresolved = current?.rows.filter((row) => row.decision === 'UNRESOLVED').length ?? 0;
  const currentIssueLabel = currentIssue ? currentIssue.scope === 'CELL' && currentIssue.rowIndex !== undefined && currentIssue.columnKey ? `Fila ${currentIssue.rowIndex + 1} · ${labels[currentIssue.columnKey]}` : currentIssue.scope === 'BATCH' ? 'Contexto del lote' : 'Guardado' : '';
  const sourceIssue = batchIssue('source'); const revisionIssue = batchIssue('sourceRevision');

  return <div className={styles.page}>
    <div className={styles.heading}><BackLink to="/listas/precios" onClick={(event) => { if (dirty && !window.confirm('Hay cambios sin guardar. ¿Quieres salir del Composer?')) event.preventDefault(); }}>Lista de precios</BackLink><PageHeader eyebrow="Listas · Carga masiva" title="Bulk Catalog Composer" description="Pega y corrige una versión de proveedor; nada toca Catalog hasta aplicar el lote." /></div>
    {notice ? <Alert tone={notice.tone} title="Atención">{notice.message}</Alert> : null}
    {toast ? <Toast key={toast.id}>{toast.message}</Toast> : null}
    <div className={`${styles.layout} ${!sourcesOpen ? styles.layoutCollapsed : ''}`}>
      <aside className={`${styles.sidebar} ${!sourcesOpen ? styles.sidebarCollapsed : ''}`}>
        <div className={styles.sidebarHeading}><h2><Database size={18} aria-hidden="true" />{sourcesOpen ? 'Fuentes y versiones' : <span className={styles.srOnly}>Fuentes y versiones</span>}</h2><button type="button" className={styles.collapseToggle} aria-expanded={sourcesOpen} aria-label={sourcesOpen ? 'Compactar fuentes y versiones' : 'Abrir fuentes y versiones'} onClick={() => setSourcesOpen((value) => !value)}>{sourcesOpen ? <PanelLeftClose size={18} /> : <PanelLeftOpen size={18} />}</button></div>
        {sourcesOpen ? <>
        <div className={styles.inline}><Input aria-label="Nueva fuente" value={newSourceName} onChange={(event) => setNewSourceName(event.target.value)} /><Button size="compact" onClick={() => void addSource()} disabled={busy}>Crear</Button></div>
        <label>Fuente<Select ref={sourceRef} aria-invalid={Boolean(sourceIssue)} aria-describedby={sourceIssue ? 'bulk-source-error' : undefined} value={selectedSource} onChange={(event) => { setSelectedSource(event.target.value); clearServerIssue((issue) => issue.controlKey === 'source' || issue.controlKey === 'sourceRevision'); }}><option value="">Selecciona…</option>{sources.map((value) => <option key={value.sourceId} value={value.sourceId}>{value.name}</option>)}</Select>{sourceIssue ? <small id="bulk-source-error" className={styles.fieldError}>{sourceIssue.message}</small> : null}</label>
        <div className={styles.history}>{versions.map((value) => <button key={value.versionId} className={current?.versionId === value.versionId ? styles.selectedVersion : ''} onClick={() => void load(value.versionId)}><strong>{value.sourceName}</strong><span>{value.sourceRevision} · {value.rowCount} filas</span><small>{value.lifecycle} / {value.batch.lifecycle}{value.supersedesVersionId ? ' · continuación' : ''}</small></button>)}</div>
        </> : <span className={styles.sidebarRail} title={sources.find((value) => value.sourceId === selectedSource)?.name ?? 'Sin fuente'}>{sources.find((value) => value.sourceId === selectedSource)?.name.slice(0, 2).toLocaleUpperCase('es-MX') ?? '—'}</span>}
      </aside>
      <main className={styles.composer}>
        <section className={styles.setup}>
          <label>Versión del proveedor<Input ref={sourceRevisionRef} aria-invalid={Boolean(revisionIssue)} aria-describedby={revisionIssue ? 'bulk-revision-error' : undefined} value={sourceRevision} disabled={current?.lifecycle === 'INGESTED'} onChange={(event) => { setSourceRevision(event.target.value); clearServerIssue((issue) => issue.controlKey === 'sourceRevision'); setDirty(true); }} />{revisionIssue ? <small id="bulk-revision-error" className={styles.fieldError}>{revisionIssue.message}</small> : null}</label>
          <fieldset disabled={Boolean(current)}><legend>Modo</legend><label><input type="radio" checked={mode === 'FULL'} onChange={() => { setMode('FULL'); setDirty(true); }} />Alta y actualización</label><label><input type="radio" checked={mode === 'COMPACT'} onChange={() => { setMode('COMPACT'); setDirty(true); }} />Actualización compacta</label></fieldset>
          {!current ? <div className={styles.demo}><Button size="compact" onClick={prepareOwnerCase}><ClipboardPaste size={16} />Caso Owner · 36</Button><Button size="compact" onClick={() => prepareDemo(1)}><ClipboardPaste size={16} />Demo V1 · 1500</Button><Button size="compact" onClick={() => prepareDemo(2)}><ClipboardPaste size={16} />Demo V2 · 1500</Button></div> : null}
        </section>
        {mode === 'FULL' && (current?.lifecycle === 'DRAFT' || !current) ? <section className={styles.batchContext}>
          <div className={styles.contextHeading}><div><h2>Contexto del lote</h2>{contextOpen ? <p>Defaults opcionales; cada fila puede sobrescribirlos.</p> : <p>{batchDefaults.kind || 'Sin tipo'} · {batchDefaults.category || 'Sin categoría'} · {batchDefaults.brand || 'Sin marca'}</p>}</div><div className={styles.inline}>{contextOpen ? <Button size="compact" onClick={applyDefaultsToEmptyCells}>Aplicar sólo a vacíos</Button> : null}<Button size="compact" tone="quiet" aria-expanded={contextOpen} onClick={() => setContextOpen((value) => !value)}>{contextOpen ? <><ChevronUp size={16} />Compactar</> : <><ChevronDown size={16} />Editar contexto</>}</Button></div></div>
          {contextOpen ? <><div className={styles.contextFields}>
            <label>Tipo por defecto<Select aria-label="Tipo por defecto" value={batchDefaults.kind} onChange={(event) => changeDefaultKind(event.target.value as CatalogItemKind | '')}><option value="">Sin tipo por defecto</option><option value="PART">Refacción</option><option value="PRODUCT">Producto</option><option value="SERVICE">Servicio</option><option value="SUPPLY">Insumo</option></Select></label>
            <label>Categoría por defecto<Input aria-label="Categoría por defecto" list="bulk-category-options" value={batchDefaults.category} onChange={(event) => changeDefaultCategory(event.target.value)} /><datalist id="bulk-category-options">{categoryOptions.map((value) => <option key={value.categoryId} value={value.name} />)}</datalist></label>
            <label>Marca por defecto<Input aria-label="Marca por defecto" list="bulk-brand-options" value={batchDefaults.brand} onChange={(event) => { const candidate = { ...batchDefaults, brand: event.target.value }; if (!isCompatible({ ...blank(), ...candidate })) { setNotice({ tone: 'warning', message: 'La marca elegida no es compatible con el Tipo y la Categoría del lote.' }); return; } setBatchDefaults(candidate); }} /><datalist id="bulk-brand-options">{brandOptions.map((value) => <option key={value.brandId} value={value.name} />)}</datalist></label>
          </div>
          <small>Una referencia nueva seguirá el governance pendiente existente. Cambiar defaults no modifica filas capturadas.</small></> : null}
        </section> : null}
        <section className={styles.workspaceToolbar}>
          <div className={styles.workspaceMeta}><Columns3 size={18} aria-hidden="true" /><strong>{rows.length.toLocaleString('es-MX')} filas</strong><span>Celda, columna o rectángulo</span></div>
          <div className={styles.toolbarControls}>{mode === 'FULL' ? <div className={styles.presetButtons} role="group" aria-label="Columnas de trabajo"><Button size="compact" tone={viewPreset === 'ESSENTIAL' ? 'primary' : 'quiet'} onClick={() => setViewPreset('ESSENTIAL')}>Esenciales</Button><Button size="compact" tone={viewPreset === 'ALL' ? 'primary' : 'quiet'} onClick={() => setViewPreset('ALL')}>Todas</Button></div> : <span>Actualización compacta</span>}{current?.lifecycle === 'DRAFT' || !current ? <Button size="compact" onClick={() => void save()} disabled={busy}><Save size={17} />Guardar borrador</Button> : null}{current && current.batch.lifecycle !== 'APPLIED' ? <Button size="compact" tone="primary" onClick={() => void analyze()} disabled={busy}><Check size={17} />{current.lifecycle === 'DRAFT' ? 'Analizar versión' : 'Reanalizar versión'}</Button> : null}{current?.batch.lifecycle === 'READY' && canPublish ? <Button size="compact" tone="primary" onClick={() => void publish()} disabled={busy}><Send size={17} />Aplicar lote</Button> : null}{current?.batch.lifecycle === 'APPLIED' && canBulkRetire ? <Button size="compact" tone="danger" onClick={() => void planCreatedBatchRetirement()} disabled={busy}><ArchiveX size={17} />Retirar artículos creados por este lote</Button> : null}</div>
          {currentIssue ? <div className={styles.issueNavigator} role="status" aria-live="polite"><button type="button" onClick={() => moveIssue(-1)} aria-label="Error anterior">‹</button><button type="button" className={styles.issueTarget} onClick={() => focusIssue(currentIssue)}><strong>{normalizedIssueIndex + 1} de {issues.length} · {currentIssueLabel}</strong><span>{currentIssue.message}</span></button><button type="button" onClick={() => moveIssue(1)} aria-label="Error siguiente">›</button></div> : null}
        </section>
        {busy ? <Spinner label="Procesando versión" /> : null}
        <section className={styles.gridRegion} aria-label="Editor tabular del catálogo">
          <div ref={headerScrollRef} className={styles.headerScroll}><div ref={(node) => applyBulkCatalogGrid(node, { columns: gridTemplateColumns, width: gridWidth })} className={styles.gridHeader}><span>#</span>{activeColumns.map((column) => <strong key={column}>{labels[column]}<button type="button" className={styles.columnResizer} aria-label={`Cambiar ancho de ${labels[column]}`} title="Arrastra para cambiar ancho; doble clic para ajuste automático" onPointerDown={(event) => beginResize(event, column)} onDoubleClick={() => autoFit(column)} onKeyDown={(event) => { if (!['ArrowLeft', 'ArrowRight'].includes(event.key)) return; event.preventDefault(); setColumnWidths((value) => ({ ...value, [column]: Math.max(COLUMN_MIN_WIDTH, Math.min(COLUMN_MAX_WIDTH, value[column] + (event.key === 'ArrowRight' ? 12 : -12))) })); }} /></strong>)}</div></div>
          <div ref={viewportRef} className={styles.viewport} onScroll={(event) => { setScrollTop(event.currentTarget.scrollTop); if (headerScrollRef.current) headerScrollRef.current.scrollLeft = event.currentTarget.scrollLeft; }}><div ref={(node) => applyBulkCatalogCanvas(node, { width: gridWidth, height: rows.length * rowHeight })} className={styles.canvas}><div ref={(node) => applyBulkCatalogOffset(node, first * rowHeight)} className={styles.visibleRows}>{visible.map((row, offset) => { const rowIndex = first + offset; return <div key={rowIndex} ref={(node) => applyBulkCatalogGrid(node, { columns: gridTemplateColumns, width: gridWidth })} className={styles.gridRow}><span>{rowIndex + 1}</span>{activeColumns.map((column, columnIndex) => {
            const selected = selection && rowIndex >= selection.firstRow && rowIndex <= selection.lastRow && columnIndex >= selection.firstColumn && columnIndex <= selection.lastColumn; const isActive = active.row === rowIndex && active.column === columnIndex;
            const invalid = cellIssue(rowIndex, column); const errorId = invalid ? `bulk-cell-error-${rowIndex}-${column}` : undefined;
            const focus = (): void => { setActive({ row: rowIndex, column: columnIndex }); editOriginal.current = { row: rowIndex, column, value: row[column] }; setSelection(null); };
            return <div key={column} data-cell-shell={`${rowIndex}:${columnIndex}`} className={`${styles.cell} ${selected ? styles.selectedRange : ''} ${isActive ? styles.activeCell : ''} ${invalid ? styles.invalidCell : ''}`}>
              {column === 'kind' ? <Select data-cell={`${rowIndex}:${columnIndex}`} data-cell-key={`${rowIndex}:${column}`} aria-label={`${labels[column]} fila ${rowIndex + 1}`} aria-invalid={Boolean(invalid)} aria-describedby={errorId} disabled={current?.lifecycle === 'INGESTED'} value={row.kind} onFocus={focus} onKeyDown={(event) => navigate(event, rowIndex, columnIndex)} onChange={(event) => updateCell(rowIndex, column, event.target.value)}><option value="">Tipo…</option><option value="PART">Refacción</option><option value="PRODUCT">Producto</option><option value="SERVICE">Servicio</option><option value="SUPPLY">Insumo</option></Select> : <><Input data-cell={`${rowIndex}:${columnIndex}`} data-cell-key={`${rowIndex}:${column}`} aria-label={`${labels[column]} fila ${rowIndex + 1}`} aria-invalid={Boolean(invalid)} aria-describedby={errorId} disabled={current?.lifecycle === 'INGESTED'} value={row[column]} onFocus={focus} onPaste={(event) => paste(event, rowIndex, columnIndex)} onKeyDown={(event) => navigate(event, rowIndex, columnIndex)} onChange={(event) => updateCell(rowIndex, column, event.target.value)} />{column === 'title' && row.supplierObservedTitle && row.supplierObservedTitle !== row.title ? <small className={styles.observedTitle} title={row.supplierObservedTitle}>Original: {row.supplierObservedTitle}</small> : null}</>}
              {invalid ? <span id={errorId} className={styles.cellErrorMarker} title={invalid.message}><span className={styles.srOnly}>{invalid.message}</span><span aria-hidden="true">!</span></span> : null}
              {isActive && current?.lifecycle !== 'INGESTED' ? <button type="button" className={styles.fillHandle} aria-label={`Rellenar desde ${labels[column]} fila ${rowIndex + 1}`} title="Arrastra para copiar el valor" onPointerDown={beginFill} /> : null}
            </div>;
          })}</div>; })}</div></div></div>
        </section>
        {current?.lifecycle === 'DRAFT' || !current ? <div className={styles.rowActions}><Button size="compact" disabled={!undoRows.current} onClick={undo}><RotateCcw size={16} />Deshacer</Button><Button size="compact" disabled={rows.length >= 10_000} onClick={() => { setDirty(true); setRows((value) => { rememberUndo(value); return [...value, applyBatchDefaults(blank(), batchDefaults)]; }); }}><Plus size={16} />Agregar fila</Button><Button size="compact" disabled={rows.length === 1} onClick={() => { setDirty(true); setRows((value) => { rememberUndo(value); return value.filter((_, index) => index !== active.row); }); }}><Trash2 size={16} />Quitar fila activa</Button></div> : null}
        <span className={styles.srOnly} aria-live="polite">{selection ? `Selección: filas ${selection.firstRow + 1} a ${selection.lastRow + 1}, columnas ${selection.firstColumn + 1} a ${selection.lastColumn + 1}.` : ''}</span>
        {counts ? <section className={styles.summary}>{Object.entries(counts).map(([key, value]) => <div key={key}><strong>{value}</strong><span>{statusLabels[key as keyof typeof statusLabels]}</span></div>)}</section> : null}
        {current?.lifecycle === 'INGESTED' ? <section className={styles.decisions}>
          <div className={styles.decisionTitle}><h2>{current.batch.lifecycle === 'APPLIED' ? 'Resultado aplicado' : 'Reconciliación'}</h2><span>{current.batch.lifecycle === 'APPLIED' ? 'Lote aplicado' : `${unresolved} pendientes de decisión`}</span></div>
          {current.batch.lifecycle !== 'APPLIED' ? <div className={styles.groupActions}><Button size="compact" tone="primary" onClick={() => void resolveGroup(['NEW', 'UPDATE', 'REACTIVATE', 'UNCHANGED', 'PENDING_REFERENCE'], 'APPLY')} disabled={busy}>Confirmar compatibles y sugerencias</Button><Button size="compact" onClick={() => void resolveGroup(['AMBIGUOUS', 'CONFLICT', 'INVALID'], 'EXCLUDE')} disabled={busy}>Excluir bloqueadas</Button></div> : null}
          {current.rows.filter((row) => row.classification !== 'UNCHANGED' || row.preselectedByMemory).slice(0, 100).map((row) => <article key={row.rowDecisionId}>
            <div>
              <strong>Fila {row.rowNumber} · {statusLabels[row.classification]}</strong>
              <span>{row.proposal.title ?? row.proposal.supplierItemCode ?? row.proposal.sku ?? row.proposal.barcode ?? 'Sin identidad'}{row.targetTitle ? ` → ${row.targetTitle}` : ''}</span>
              {row.before ? <small>Actual: {row.before.kind} · {row.before.category ?? 'sin categoría'} · {row.before.brand ?? 'sin marca'} · estado {row.before.status === 'INACTIVE' ? 'Inactivo' : 'Activo'} · precio {row.before.basePriceMinor === null ? 'ausente' : fromMinor(row.before.basePriceMinor)}{canReadCost ? ` · costo ${row.before.referenceCostMinor === null ? 'ausente' : fromMinor(row.before.referenceCostMinor)}` : ''}</small> : <small>Actual: artículo nuevo; todavía no existe en Catalog.</small>}
              <small>Propuesta: {row.proposal.kind ?? 'tipo sin cambio'} · {row.proposal.category ?? 'categoría sin cambio'} · {row.proposal.brand ?? 'marca sin cambio'} · estado {row.classification === 'REACTIVATE' ? 'Reactivar' : 'sin cambio'} · precio {row.proposal.basePriceMinor === null ? 'sin cambio' : fromMinor(row.proposal.basePriceMinor)}{canReadCost ? ` · costo ${row.proposal.referenceCostMinor === null ? 'sin cambio' : fromMinor(row.proposal.referenceCostMinor)}` : ''}</small>
              {row.warnings.map((warning) => <small key={warning}>{warningMessage(warning)}</small>)}
              {row.errors.map((error) => <small key={error}>{analysisMessage(error)}</small>)}
              {['AMBIGUOUS', 'CONFLICT', 'INVALID'].includes(row.classification) ? <label>
                Artículo canónico para corregir mapping
                <Input aria-label={`Artículo canónico fila ${row.rowNumber}`} placeholder="UUID del artículo existente" value={mappingTargets[row.rowDecisionId] ?? ''} onChange={(event) => setMappingTargets((value) => ({ ...value, [row.rowDecisionId]: event.target.value }))} />
              </label> : null}
            </div>
            {current.batch.lifecycle !== 'APPLIED' ? <div>
              <Button size="compact" onClick={() => void resolve(row.rowDecisionId, row.version, 'EXCLUDE')}>Excluir</Button>
              {['AMBIGUOUS', 'CONFLICT', 'INVALID'].includes(row.classification)
                ? <Button size="compact" tone="primary" disabled={!mappingTargets[row.rowDecisionId]?.trim()} onClick={() => void resolve(row.rowDecisionId, row.version, 'APPLY', mappingTargets[row.rowDecisionId]!.trim())}>Corregir mapping</Button>
                : <Button size="compact" tone="primary" onClick={() => void resolve(row.rowDecisionId, row.version, 'APPLY')}>Incluir</Button>}
            </div> : null}
          </article>)}
        </section> : null}
        {current ? <section className={styles.comparison}><h2><GitCompare size={18} />Comparar versiones</h2><Select value={compareId} onChange={(event) => setCompareId(event.target.value)}><option value="">Versión anterior…</option>{versions.filter((value) => value.versionId !== current.versionId && value.sourceId === current.sourceId).map((value) => <option key={value.versionId} value={value.versionId}>{value.sourceRevision}</option>)}</Select><Button size="compact" onClick={() => void compareVersions()} disabled={!compareId}>Comparar</Button>{compare ? <p>Mapeadas {compare.mapped} · Cambiadas {compare.changed} · Nuevas {compare.added} · Desaparecidas {compare.disappeared} · Ambiguas {compare.ambiguous}</p> : null}</section> : null}
        {!current && rows.length === 1 ? <EmptyState title="Pega tu lista para comenzar" description="Google Sheets: copia un rectángulo y pégalo en la primera celda. Nada toca Catalog hasta Aplicar lote." /> : null}
      </main>
    </div>
    <Dialog open={retirementPlan !== null} title="Retirar artículos creados por este lote" description="Compensación acotada · acción sensible nivel 2" onClose={() => { if (!busy) { setRetirementPlan(null); setRetirementPin(''); } }} footer={false}>
      <div className={styles.retirementDialog}>
        <Alert tone="warning" title="No es una reversión del lote">Sólo se inactivan artículos demostrablemente CREATED por este lote. MATCHED/UPDATED, precios previos y toda la historia permanecen.</Alert>
        <dl className={styles.retirementSummary}><div><dt>CREATED activos a retirar</dt><dd>{retirementPlan?.activeCount.toLocaleString('es-MX') ?? 0}</dd></div><div><dt>CREATED ya retirados</dt><dd>{retirementPlan?.alreadyInactiveCount.toLocaleString('es-MX') ?? 0}</dd></div></dl>
        <label className={styles.reauthenticationField}>Confirma tu PIN<Input type="password" inputMode="numeric" autoComplete="off" maxLength={4} value={retirementPin} onChange={(event) => setRetirementPin(event.target.value.replace(/\D/gu, '').slice(0, 4))} /><small>Debe corresponder al mismo usuario de la sesión activa.</small></label>
        <footer className={styles.retirementActions}><Button disabled={busy} onClick={() => { setRetirementPlan(null); setRetirementPin(''); }}>Cancelar</Button><Button tone="danger" disabled={busy || retirementPin.length !== 4} onClick={() => void retireCreatedBatchItems()}>{busy ? 'Retirando…' : `Retirar ${retirementPlan?.activeCount.toLocaleString('es-MX') ?? 0} artículos`}</Button></footer>
      </div>
    </Dialog>
  </div>;
}
