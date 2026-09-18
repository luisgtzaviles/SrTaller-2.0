import { ArchiveX, Check, ChevronDown, ChevronLeft, ChevronRight, Columns3, Database, GitCompare, Plus, RotateCcw, Save, Send, Trash2 } from 'lucide-react';
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';

import { analyzeSupplierVersion, compareSupplierVersions, createCatalogRetirementPlan, createSupplierDraft, createSupplierSource, decideSupplierRow, decideSupplierRows, deleteSupplierSource, executeCatalogRetirementPlan, getBulkCatalogFieldPolicy, getSupplierVersion, listCatalogReferences, listSupplierSources, listSupplierVersions, normalizeCatalogReferenceText, publishSupplierVersion, replaceSupplierDraft } from '../catalog-api.js';
import type { BulkCatalogCandidateMatch, BulkCatalogClassification, BulkCatalogMode, BulkCatalogTitleDecision, CatalogItemKind, CatalogOperationalFieldPolicyResponse, CatalogReferences, CatalogRetirementPlan, SupplierCatalogCompleteness, SupplierSource, SupplierVersion, SupplierVersionComparison, SupplierVersionSummary } from '../catalog-api.js';
import { PreviewApiError } from '../api.js';
import { Button, Input, Select } from '../components/ui/controls.js';
import { Alert, EmptyState, Spinner, Toast } from '../components/ui/feedback.js';
import { BackLink, PageHeader } from '../components/ui/navigation.js';
import { Dialog } from '../components/ui/overlays.js';
import { hasOperationalCapability } from '../session/session-capabilities.mjs';
import type { OperationalCapability } from '../session/session-api.js';
import { applyBatchDefaults, applyBatchDefaultsToEmptyRows, canChooseDuplicateWinner, canContinueNewLoadGate, captureActionState, COMPACT_COLUMNS, derivePolicyDrivenColumns, estimateColumnWidth, fillRows, filterSupplierSources, FULL_COLUMNS, groupDuplicateResolutionRows, hasMeaningfulComposerWork, NEW_LOAD_INTENTS, nextGridCell, nextValidationIssueIndex, normalizeBrandValue, normalizeColumnWidths, normalizeSupplierTitle, orchestrateReviewList, parseClipboardMatrix, parseMoneyToMinor, planSourceRowNavigation, reconcileBrowseSourceId, removeDraftRow, resizeColumnWidth, sortValidationIssues, supplierHistoryForBrowseSource, validateComposerDraft, validationIssueFromApi } from './bulk-catalog-composer-model.mjs';
import type { ComposerColumn, ComposerSelection, ValidationIssue } from './bulk-catalog-composer-model.mjs';
import { applyBulkCatalogCanvas, applyBulkCatalogGrid, applyBulkCatalogOffset } from './bulk-catalog-grid-layout.js';
import styles from './bulk-catalog-composer-page.module.css';

type UiRow = { kind: CatalogItemKind | ''; supplierObservedTitle: string; supplierObservedBrand: string; title: string; description: string; category: string; brand: string; supplierItemCode: string; sku: string; barcode: string; price: string; cost: string };
type Column = ComposerColumn;
type BatchDefaults = { kind: CatalogItemKind | ''; category: string; brand: string };
type UndoSnapshot = Readonly<{ rows: UiRow[]; active: { row: number; column: number }; selection: ComposerSelection | null }>;
type GridFocusTarget = Readonly<{ rowIndex: number; columnKey: Column | null }>;
type SupplierVersionRow = SupplierVersion['rows'][number];
type TitleChoiceTarget = Readonly<{ rowDecisionId: string; expectedRowVersion: number; targetItemId: string; currentTitle: string; receivedTitle: string }>;
type ReviewProgress = 'SAVING' | 'ANALYZING';
const columns = FULL_COLUMNS;
const compactColumns = COMPACT_COLUMNS;
const GRIDLINES_STORAGE_KEY = 'srtaller:bulk-composer:gridlines:v1';
const blank = (): UiRow => ({ kind: '', supplierObservedTitle: '', supplierObservedBrand: '', title: '', description: '', category: '', brand: '', supplierItemCode: '', sku: '', barcode: '', price: '', cost: '' });
const labels: Record<Column, string> = { kind: 'Tipo', title: 'Título', description: 'Descripción', category: 'Categoría', brand: 'Marca', supplierItemCode: 'Código proveedor', sku: 'SKU interno', barcode: 'Código de barras interno', price: 'Precio base', cost: 'Costo de referencia' };
const statusLabels = { NEW: 'Nuevo', UPDATE: 'Actualiza', REACTIVATE: 'Reactiva', UNCHANGED: 'Sin cambio', CANDIDATE: 'Candidato', PENDING_REFERENCE: 'Referencia pendiente', AMBIGUOUS: 'Ambiguo', CONFLICT: 'Conflicto', INVALID: 'Inválido' } as const;
const toMinor = (value: string): number | null => parseMoneyToMinor(value);
const fromMinor = (value: number | null): string => value === null ? '' : (value / 100).toFixed(2);
const fromRecord = (version: SupplierVersion): UiRow[] => version.rows.map(({ proposal, supplierObservedTitle }) => ({ kind: proposal.kind ?? '', supplierObservedTitle: supplierObservedTitle ?? proposal.supplierObservedTitle ?? proposal.title ?? '', supplierObservedBrand: proposal.brand ?? '', title: proposal.title ?? '', description: proposal.description ?? '', category: proposal.category ?? '', brand: proposal.brand ?? '', supplierItemCode: proposal.supplierItemCode ?? '', sku: proposal.sku ?? '', barcode: proposal.barcode ?? '', price: fromMinor(proposal.basePriceMinor), cost: fromMinor(proposal.referenceCostMinor) }));
const signature = async (mode: BulkCatalogMode): Promise<string> => { const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode((mode === 'FULL' ? columns : compactColumns).join('\t'))); return [...new Uint8Array(bytes)].map((value) => value.toString(16).padStart(2, '0')).join(''); };
const proposal = (row: UiRow) => ({ kind: row.kind || null, supplierObservedTitle: row.supplierObservedTitle || row.title || null, title: row.title.trim() || null, description: row.description.trim() || null, category: row.category.trim() || null, brand: row.brand.trim() || null, supplierItemCode: row.supplierItemCode.trim() || null, sku: row.sku.trim() || null, barcode: row.barcode.trim() || null, basePriceMinor: toMinor(row.price), referenceCostMinor: toMinor(row.cost) });
const failureCode = (error: unknown): string => error instanceof PreviewApiError && error.code ? ` (${error.code})` : '';
const versionStatus = (value: SupplierVersionSummary): string => value.lifecycle === 'DRAFT' ? 'Borrador' : value.batch.lifecycle === 'APPLIED' ? 'Aplicada' : 'En revisión';
const formatVersionDate = (value: string, timeZone: string): string => new Intl.DateTimeFormat('es-MX', { dateStyle: 'medium', timeZone }).format(new Date(value));
const requiredEffectiveField = (code: string): Column | null => {
  const key = code.startsWith('MISSING_REQUIRED_EFFECTIVE_VALUE:') ? code.slice('MISSING_REQUIRED_EFFECTIVE_VALUE:'.length) : '';
  const columnsByPolicyField: Readonly<Record<string, Column>> = { kind: 'kind', title: 'title', description: 'description', category: 'category', brand: 'brand', supplierItemCode: 'supplierItemCode', sku: 'sku', barcode: 'barcode', referenceCost: 'cost', basePrice: 'price' };
  return columnsByPolicyField[key] ?? null;
};
const correctionValue = (row: SupplierVersionRow, column: Column): string => {
  if (column === 'price') return row.proposal.basePriceMinor === null ? '' : fromMinor(row.proposal.basePriceMinor);
  if (column === 'cost') return row.proposal.referenceCostMinor === null ? '' : fromMinor(row.proposal.referenceCostMinor);
  return row.proposal[column] ?? '';
};
const analysisMessage = (code: string, canReadCost: boolean): string | null => {
  const requiredField = requiredEffectiveField(code);
  if (requiredField === 'price') return 'Precio base debe ser mayor que 0.';
  if (requiredField === 'cost') return canReadCost ? 'Costo de referencia debe ser mayor que 0.' : 'Falta un dato obligatorio protegido; requiere un usuario autorizado.';
  if (requiredField) return `Falta ${labels[requiredField]}.`;
  return ({
  DUPLICATE_OBSERVATION_IN_VERSION: 'Esta observación se repite dentro de la lista del proveedor.',
  DUPLICATE_VALUE_CONTRADICTION: 'Artículo repetido con datos diferentes.',
  IDENTIFIERS_POINT_TO_DIFFERENT_ITEMS: 'Los identificadores recibidos apuntan a artículos distintos.',
  CORRECTED_MAPPING_CONFLICT: 'Un mapping histórico fue corregido y requiere una nueva decisión.',
  AMBIGUOUS_HISTORY: 'La historia del proveedor apunta a más de un artículo.',
  HISTORICAL_TARGET_NOT_AVAILABLE: 'La identidad histórica ya no está disponible.',
  TYPE_CONTRADICTION: 'El tipo recibido no coincide con el artículo reconocido.',
  REFERENCE_CONTRADICTION: 'La categoría o marca recibida contradice el artículo reconocido.',
  UNTRUSTED_HISTORY_REQUIRES_OWNER_DECISION: 'La historia previa requiere una decisión explícita.',
  HISTORICAL_ITEM_RETIRED_REQUIRES_REACTIVATION: 'La memoria histórica apunta a un artículo retirado. Reactívalo explícitamente en Lista de precios y vuelve a analizar; no se creará un duplicado.',
  COMPACT_ROW_TARGET_NOT_FOUND: 'No se encontró un artículo para esta actualización compacta.',
  }[code] ?? null);
};
const warningMessage = (code: string): string | null => ({
  DUPLICATE_EXACT_CONSOLIDATED: 'Fila duplicada consolidada; esta copia queda como evidencia y no se aplicará dos veces.',
  DUPLICATE_VALUE_CONTRADICTION_SUPERSEDED: 'Fila no elegida para esta observación repetida; queda excluida de forma trazable.',
  TRUSTED_HISTORICAL_MATCH_AUTO_REACTIVATES: 'Identidad reconocida por historial confiable; el artículo se reactivará al aplicar.',
  TRUSTED_HISTORICAL_MATCH_AUTO_RESOLVED: 'Identidad reconocida por historial confiable.',
  CANDIDATE_MATCH_REQUIRES_OWNER_DECISION: 'Hay un candidato razonable; elige si es el mismo artículo o crea uno nuevo.',
  MULTIPLE_BOUNDED_CANDIDATES: 'Hay varios candidatos razonables. Elige explícitamente o excluye la fila.',
  REFERENCE_REQUIRES_GOVERNANCE: 'La categoría o marca recibida requiere revisión antes de aplicar.',
}[code] ?? null);
const rowErrors = (value: unknown): readonly string[] => Array.isArray(value) ? value.filter((entry): entry is string => typeof entry === 'string') : [];
const duplicateObservationKey = (row: SupplierVersion['rows'][number]): string => {
  if (row.proposal.supplierItemCode) return `C:${normalizeCatalogReferenceText(row.proposal.supplierItemCode)}`;
  return `S:${[row.proposal.kind, row.supplierObservedTitle ?? row.proposal.supplierObservedTitle ?? row.proposal.title, row.proposal.description, row.proposal.category, row.proposal.brand].map((value) => value ? normalizeCatalogReferenceText(value) : '').join('|')}`;
};
const formatDuplicateValue = (field: 'title' | 'supplierItemCode' | 'kind' | 'category' | 'brand' | 'cost' | 'price', row: SupplierVersionRow, canReadCost: boolean): string | null => {
  if (field === 'cost') return canReadCost ? (row.proposal.referenceCostMinor === null ? 'Sin cambio' : `$${fromMinor(row.proposal.referenceCostMinor)}`) : null;
  if (field === 'price') return row.proposal.basePriceMinor === null ? 'Sin cambio' : `$${fromMinor(row.proposal.basePriceMinor)}`;
  if (field === 'title') return row.supplierObservedTitle ?? row.proposal.supplierObservedTitle ?? row.proposal.title ?? null;
  if (field === 'supplierItemCode') return row.proposal.supplierItemCode ?? null;
  if (field === 'kind') return row.proposal.kind ?? null;
  if (field === 'category') return row.proposal.category ?? null;
  return row.proposal.brand ?? null;
};
const duplicateComparisonFields = (members: readonly SupplierVersionRow[], canReadCost: boolean) => ([
  ['cost', 'Costo'], ['price', 'Precio'], ['title', 'Título'], ['supplierItemCode', 'Código proveedor'], ['kind', 'Tipo'], ['category', 'Categoría'], ['brand', 'Marca'],
] as const).flatMap(([field, label]) => {
  const values = members.map((member) => formatDuplicateValue(field, member, canReadCost));
  return values[0] === null || new Set(values).size <= 1 ? [] : [Object.freeze({ field, label, values })];
});
const appliedResultSummary = (counts: SupplierVersion['batch']['counts'], excluded: number): string => [
  ...(['NEW', 'UPDATE', 'REACTIVATE', 'UNCHANGED'] as const).flatMap((classification) => counts[classification] > 0 ? [`${counts[classification].toLocaleString('es-MX')} ${statusLabels[classification].toLocaleLowerCase('es-MX')}`] : []),
  ...(excluded > 0 ? [`${excluded.toLocaleString('es-MX')} excluida${excluded === 1 ? '' : 's'}`] : []),
].join(' · ');
const loadIntentLabel = (value: SupplierCatalogCompleteness): string => value === 'COMPLETE' ? 'Lista completa del proveedor' : 'Sólo algunos artículos';
const readGridlinesPreference = (): boolean => {
  try { return sessionStorage.getItem(GRIDLINES_STORAGE_KEY) === 'true'; }
  catch { return false; }
};

export function BulkCatalogComposerPage({ capabilities, csrfToken, timeZone }: Readonly<{ capabilities: readonly OperationalCapability[]; csrfToken: string; timeZone: string }>): React.JSX.Element {
  const canReadBulk = hasOperationalCapability(capabilities, 'catalog.import.read') || hasOperationalCapability(capabilities, 'catalog.import.prepare');
  const canPrepareBulk = hasOperationalCapability(capabilities, 'catalog.import.prepare');
  const canPublish = hasOperationalCapability(capabilities, 'catalog.import.publish');
  const canReadCost = hasOperationalCapability(capabilities, 'catalog.reference_cost.read'); const canWriteCost = hasOperationalCapability(capabilities, 'catalog.reference_cost.manage');
  const canBulkRetire = hasOperationalCapability(capabilities, 'catalog.items.bulk_retire');
  const canDeleteSupplier = hasOperationalCapability(capabilities, 'catalog.suppliers.delete');
  const [sources, setSources] = useState<readonly SupplierSource[]>([]); const [versions, setVersions] = useState<readonly SupplierVersionSummary[]>([]); const [browseSourceId, setBrowseSourceId] = useState(''); const [pendingNewLoadSupplierId, setPendingNewLoadSupplierId] = useState<string | null>(null); const [newSourceName, setNewSourceName] = useState('');
  const [description, setDescription] = useState(''); const [mode, setMode] = useState<BulkCatalogMode>('FULL'); const [completeness, setCompleteness] = useState<SupplierCatalogCompleteness>('PARTIAL'); const [rows, setRows] = useState<UiRow[]>([blank()]); const [current, setCurrent] = useState<SupplierVersion | null>(null); const [compare, setCompare] = useState<SupplierVersionComparison | null>(null); const [compareId, setCompareId] = useState('');
  const [references, setReferences] = useState<CatalogReferences>({ categories: [], brands: [], pendingCategories: [], pendingBrands: [], categoryBrandApplicability: [] });
  const [fieldPolicy, setFieldPolicy] = useState<CatalogOperationalFieldPolicyResponse | null>(null);
  const [fieldPolicyError, setFieldPolicyError] = useState<string | null>(null);
  const [batchDefaults, setBatchDefaults] = useState<BatchDefaults>({ kind: '', category: '', brand: '' });
  const [viewPreset, setViewPreset] = useState<'ESSENTIAL' | 'ALL'>('ESSENTIAL');
  const [gridlinesVisible, setGridlinesVisible] = useState(readGridlinesPreference);
  const [reconciliationView, setReconciliationView] = useState<'ATTENTION' | 'RESOLVED' | 'ALL'>('ATTENTION'); const [duplicateDetailsOpen, setDuplicateDetailsOpen] = useState<Record<string, boolean>>({});
  const [columnWidths, setColumnWidths] = useState<Record<Column, number>>(() => {
    try { return normalizeColumnWidths(JSON.parse(sessionStorage.getItem('srtaller:bulk-composer:column-widths:v1') ?? '{}')) as Record<Column, number>; }
    catch { return normalizeColumnWidths({}) as Record<Column, number>; }
  });
  const [mappingTargets, setMappingTargets] = useState<Record<string, string>>({});
  const [retirementPlan, setRetirementPlan] = useState<CatalogRetirementPlan | null>(null); const [retirementPin, setRetirementPin] = useState('');
  const [titleChoiceTarget, setTitleChoiceTarget] = useState<TitleChoiceTarget | null>(null); const [titleChoice, setTitleChoice] = useState<BulkCatalogTitleDecision>('KEEP_CURRENT');
  const [newSourceOpen, setNewSourceOpen] = useState(false); const [newSourceOrigin, setNewSourceOrigin] = useState<'ADMINISTRATION' | 'GATE' | null>(null); const [supplierGateOpen, setSupplierGateOpen] = useState(false); const [supplierSearch, setSupplierSearch] = useState(''); const [supplierGateSupplierId, setSupplierGateSupplierId] = useState<string | null>(null); const [supplierGateCompleteness, setSupplierGateCompleteness] = useState<SupplierCatalogCompleteness | null>(null); const [supplierGateRestoreTarget, setSupplierGateRestoreTarget] = useState('supplier-gate-new-load'); const [deleteSourceTarget, setDeleteSourceTarget] = useState<SupplierSource | null>(null); const [deleteStage, setDeleteStage] = useState<1 | 2>(1); const [deletePin, setDeletePin] = useState(''); const [deleteArmed, setDeleteArmed] = useState(false);
  const [busy, setBusy] = useState(false); const [reviewProgress, setReviewProgress] = useState<ReviewProgress | null>(null); const [dirty, setDirty] = useState(false); const [notice, setNotice] = useState<{ tone: 'danger' | 'warning'; message: string } | null>(null); const [toast, setToast] = useState<{ id: number; message: string } | null>(null); const [serverIssues, setServerIssues] = useState<ValidationIssue[]>([]); const [validationAttempted, setValidationAttempted] = useState(false); const [issueIndex, setIssueIndex] = useState(0); const [pendingIssueFocus, setPendingIssueFocus] = useState<ValidationIssue | null>(null); const [pendingGridFocus, setPendingGridFocus] = useState<GridFocusTarget | null>(null); const [sourcesOpen, setSourcesOpen] = useState(true); const [contextOpen, setContextOpen] = useState(false); const [gridExpanded, setGridExpanded] = useState(true); const [continuedOpen, setContinuedOpen] = useState(false); const [notObservedOpen, setNotObservedOpen] = useState(false); const [additionalOpen, setAdditionalOpen] = useState(false); const [comparisonOpen, setComparisonOpen] = useState(false); const [coverageReviewOpen, setCoverageReviewOpen] = useState(false); const [scrollTop, setScrollTop] = useState(0); const [active, setActive] = useState({ row: 0, column: 0 }); const [selection, setSelection] = useState<ComposerSelection | null>(null); const undoRows = useRef<UndoSnapshot | null>(null); const editOriginal = useRef<{ row: number; column: Column; value: string } | null>(null); const publishRequest = useRef(crypto.randomUUID()); const draftCreateRequest = useRef(crypto.randomUUID()); const reviewInFlight = useRef(false); const deleteInFlight = useRef(false); const viewportRef = useRef<HTMLDivElement | null>(null); const headerScrollRef = useRef<HTMLDivElement | null>(null); const toastTimer = useRef<number | null>(null); const sourcesToggleRef = useRef<HTMLButtonElement | null>(null); const pendingSourcesToggleFocus = useRef(false);
  const [advancedOptionsOpen, setAdvancedOptionsOpen] = useState(false);
  /** A source correction is local until the operator explicitly saves/reviews it. */
  const [correctionSupersedesVersionId, setCorrectionSupersedesVersionId] = useState<string | null>(null);
  const browseSourceInitialized = useRef(false);
  const policyColumns = useMemo(() => fieldPolicy ? derivePolicyDrivenColumns(fieldPolicy.fields) : { all: [], essential: [], required: [] }, [fieldPolicy]);
  const activeColumns = useMemo(() => !canPrepareBulk ? (mode === 'COMPACT' ? compactColumns : columns.filter((column) => column !== 'cost' || canReadCost)) : mode === 'COMPACT' ? compactColumns : viewPreset === 'ESSENTIAL' ? policyColumns.essential : policyColumns.all, [canPrepareBulk, canReadCost, mode, policyColumns, viewPreset]);
  const requiredColumns = useMemo(() => new Set(policyColumns.required), [policyColumns]);
  const fullPolicyReady = !canPrepareBulk || fieldPolicy !== null;
  const editableGridActionsVisible = canPrepareBulk && (mode === 'COMPACT' || fullPolicyReady) && (current?.lifecycle === 'DRAFT' || !current);
  const canPublishCurrent = useMemo(() => {
    if (!canPublish || !current || current.batch.lifecycle !== 'READY' || current.batch.staleByCorrection) return false;
    const actionable = current.rows.filter((row) => row.decision === 'APPLY');
    return (!actionable.some((row) => row.classification === 'NEW') || hasOperationalCapability(capabilities, 'catalog.items.create')) &&
      (!actionable.some((row) => row.classification === 'UPDATE' || row.titleDecision === 'ADOPT_OBSERVED') || hasOperationalCapability(capabilities, 'catalog.items.update')) &&
      (!actionable.some((row) => row.classification === 'REACTIVATE') || hasOperationalCapability(capabilities, 'catalog.items.deactivate')) &&
      (!actionable.some((row) => row.proposal.basePriceMinor !== null) || hasOperationalCapability(capabilities, 'catalog.prices.manage')) &&
      (!(canReadCost && canWriteCost && actionable.some((row) => row.proposal.referenceCostMinor !== null)) || hasOperationalCapability(capabilities, 'catalog.reference_cost.manage'));
  }, [canPublish, canReadCost, canWriteCost, capabilities, current]);
  const schemaColumns = mode === 'FULL' ? columns : compactColumns;
  const gridTemplateColumns = useMemo(() => `52px ${activeColumns.map((column) => `${columnWidths[column]}px`).join(' ')}`, [activeColumns, columnWidths]);
  const gridWidth = useMemo(() => 52 + activeColumns.reduce((total, column) => total + columnWidths[column], 0), [activeColumns, columnWidths]);
  const rowHeight = 62; const first = Math.max(0, Math.floor(scrollTop / rowHeight) - 5); const visible = rows.slice(first, first + 22);
  useLayoutEffect(() => {
    if (!pendingGridFocus || !gridExpanded || activeColumns.length === 0) return;
    const requestedColumn = pendingGridFocus.columnKey;
    if (requestedColumn && !activeColumns.includes(requestedColumn) && mode === 'FULL' && policyColumns.all.includes(requestedColumn) && viewPreset !== 'ALL') {
      setViewPreset('ALL');
      return;
    }
    const rowIndex = Math.min(Math.max(0, pendingGridFocus.rowIndex), Math.max(0, rows.length - 1));
    const columnIndex = requestedColumn && activeColumns.includes(requestedColumn) ? activeColumns.indexOf(requestedColumn) : Math.min(active.column, activeColumns.length - 1);
    const targetTop = Math.max(0, (rowIndex - 5) * rowHeight);
    const targetLeft = requestedColumn && activeColumns.includes(requestedColumn) ? Math.max(0, 52 + activeColumns.slice(0, columnIndex).reduce((total, key) => total + columnWidths[key], 0) - 24) : viewportRef.current?.scrollLeft ?? 0;
    setActive({ row: rowIndex, column: columnIndex });
    if (Math.abs(scrollTop - targetTop) > 1) {
      viewportRef.current?.scrollTo({ top: targetTop, left: targetLeft });
      setScrollTop(targetTop);
      return;
    }
    const focusTarget = requestedColumn && activeColumns.includes(requestedColumn)
      ? document.querySelector<HTMLElement>(`[data-cell-key="${rowIndex}:${requestedColumn}"]`)
      : document.querySelector<HTMLElement>(`[data-cell="${rowIndex}:${columnIndex}"]`);
    if (!focusTarget) return;
    focusTarget.focus();
    setPendingGridFocus(null);
  }, [active.column, activeColumns, columnWidths, gridExpanded, mode, pendingGridFocus, policyColumns.all, rows.length, scrollTop, viewPreset]);
  const refreshFieldPolicy = useCallback(async (): Promise<void> => {
    setFieldPolicyError(null);
    try { setFieldPolicy(await getBulkCatalogFieldPolicy()); }
    catch { setFieldPolicy(null); setFieldPolicyError('No fue posible cargar la política efectiva de campos. Reintenta antes de editar una carga completa.'); }
  }, []);
  const refresh = useCallback(async () => {
    const [nextSources, nextVersions] = await Promise.all([listSupplierSources(), listSupplierVersions()]);
    setSources(nextSources); setVersions(nextVersions);
    const browseWasInitialized = browseSourceInitialized.current;
    if (nextSources.length > 0) browseSourceInitialized.current = true;
    setBrowseSourceId((currentSourceId) => {
      return reconcileBrowseSourceId(currentSourceId, nextSources, browseWasInitialized);
    });
    if (!canPrepareBulk) return;
    const nextReferences = await listCatalogReferences();
    setReferences(nextReferences);
    await refreshFieldPolicy();
  }, [canPrepareBulk, refreshFieldPolicy]);
  useEffect(() => { void refresh().catch(() => setNotice({ tone: 'danger', message: 'No fue posible cargar los catálogos de proveedor.' })); }, [refresh]);
  useEffect(() => { const protect = (event: BeforeUnloadEvent): void => { if (dirty) event.preventDefault(); }; window.addEventListener('beforeunload', protect); return () => window.removeEventListener('beforeunload', protect); }, [dirty]);
  useEffect(() => { sessionStorage.setItem('srtaller:bulk-composer:column-widths:v1', JSON.stringify(columnWidths)); }, [columnWidths]);
  useEffect(() => {
    try { sessionStorage.setItem(GRIDLINES_STORAGE_KEY, String(gridlinesVisible)); }
    catch { /* Rendering remains correct when session storage is unavailable. */ }
  }, [gridlinesVisible]);
  useEffect(() => { sessionStorage.removeItem('srtaller:bulk-composer:batch-context:v1'); }, []);
  useEffect(() => {
    if (!pendingSourcesToggleFocus.current) return;
    pendingSourcesToggleFocus.current = false;
    sourcesToggleRef.current?.focus();
  }, [sourcesOpen]);
  useEffect(() => {
    if (deleteStage !== 2) { setDeleteArmed(false); return undefined; }
    const timer = window.setTimeout(() => setDeleteArmed(true), 650);
    return () => window.clearTimeout(timer);
  }, [deleteStage]);
  useEffect(() => () => { if (toastTimer.current !== null) window.clearTimeout(toastTimer.current); }, []);
  const showToast = useCallback((message: string): void => { if (toastTimer.current !== null) window.clearTimeout(toastTimer.current); setToast({ id: Date.now(), message }); toastTimer.current = window.setTimeout(() => setToast(null), 3_500); }, []);
  const changeSourcesVisibility = (open: boolean): void => { pendingSourcesToggleFocus.current = true; setSourcesOpen(open); };
  const canonicalBrandNames = useMemo(() => references.brands.filter((value) => value.status === 'ACTIVE').map((value) => value.name), [references.brands]);
  const normalizeBrand = useCallback((value: string): string => normalizeBrandValue(value, canonicalBrandNames), [canonicalBrandNames]);
  const rawPayload = useMemo(() => rows.map((row) => schemaColumns.map((column) => column === 'title' ? row.supplierObservedTitle || row.title : column === 'brand' ? row.supplierObservedBrand || row.brand : row[column]).join('\t')).join('\n'), [rows, schemaColumns]);
  const findCategory = useCallback((name: string) => references.categories.find((value) => value.status === 'ACTIVE' && normalizeCatalogReferenceText(value.name) === normalizeCatalogReferenceText(name)), [references.categories]);
  const findBrand = useCallback((name: string) => references.brands.find((value) => value.status === 'ACTIVE' && normalizeCatalogReferenceText(value.name) === normalizeCatalogReferenceText(name)), [references.brands]);
  const correctionFieldForRow = useCallback((row: SupplierVersionRow): Column | null => {
    const required = row.errors.map(requiredEffectiveField).find((field): field is Column => field !== null);
    if (required === 'cost' && !canReadCost) return null;
    if (required) return required;
    if (!row.warnings.includes('REFERENCE_REQUIRES_GOVERNANCE')) return null;
    const category = row.proposal.category;
    if (category && !findCategory(category)) return 'category';
    const brand = row.proposal.brand;
    if (brand && !findBrand(brand)) return 'brand';
    return null;
  }, [canReadCost, findBrand, findCategory]);
  const isCompatible = useCallback((row: UiRow): boolean => {
    if (!row.kind) return true;
    const category = row.category ? findCategory(row.category) : undefined; if (category && !category.applicableKinds.includes(row.kind)) return false;
    const brand = row.brand ? findBrand(row.brand) : undefined; if (brand && !brand.applicableKinds.includes(row.kind)) return false;
    if (category && brand) { const governed = references.categoryBrandApplicability.filter((value) => value.categoryId === category.categoryId && value.kind === row.kind); if (governed.length > 0 && !governed.some((value) => value.brandId === brand.brandId)) return false; }
    return true;
  }, [findBrand, findCategory, references.categoryBrandApplicability]);
  const collectIssues = useCallback((): ValidationIssue[] => sortValidationIssues([
    ...validateComposerDraft({ selectedSource: current?.sourceId ?? pendingNewLoadSupplierId ?? '', mode, rows }),
    ...rows.flatMap((row, rowIndex): ValidationIssue[] => isCompatible(row) ? [] : [{ scope: 'CELL', rowIndex, columnKey: row.brand ? 'brand' : 'category', code: 'INCOMPATIBLE_REFERENCE', message: 'Esta combinación de Tipo, Categoría y Marca no es compatible.' }]),
    ...serverIssues,
  ]), [current?.sourceId, isCompatible, mode, pendingNewLoadSupplierId, rows, serverIssues]);
  const issues = validationAttempted || serverIssues.length > 0 ? collectIssues() : [];
  const normalizedIssueIndex = Math.min(issueIndex, Math.max(0, issues.length - 1));
  const currentIssue = issues[normalizedIssueIndex];
  const cellIssue = (rowIndex: number, column: Column): ValidationIssue | undefined => issues.find((issue) => issue.scope === 'CELL' && issue.rowIndex === rowIndex && issue.columnKey === column);
  const batchIssue = (controlKey: 'source' | 'mode'): ValidationIssue | undefined => issues.find((issue) => issue.scope === 'BATCH' && issue.controlKey === controlKey);
  const clearServerIssue = (predicate: (issue: ValidationIssue) => boolean): void => setServerIssues((existing) => existing.filter((issue) => !predicate(issue)));
  const rememberUndo = (existing: readonly UiRow[]): void => { undoRows.current = { rows: existing.map((row) => ({ ...row })), active: { ...active }, selection: selection ? { ...selection } : null }; };
  const updateCell = (rowIndex: number, column: Column, value: string): void => { clearServerIssue((issue) => issue.scope === 'CELL' && issue.rowIndex === rowIndex && issue.columnKey === column); setDirty(true); setRows((existing) => { const currentRow = existing[rowIndex]; if (!currentRow) return existing; const candidate = { ...currentRow, [column]: value } as UiRow; if (column === 'title' && !currentRow.supplierObservedTitle) candidate.supplierObservedTitle = value; if (['kind', 'category', 'brand'].includes(column) && !isCompatible(candidate)) { setNotice({ tone: 'warning', message: 'Ese cambio no es compatible con Tipo, Categoría y Marca. Ajusta el contexto antes de continuar.' }); return existing; } rememberUndo(existing); return existing.map((row, index) => index === rowIndex ? candidate : row); }); };
  const commitBrand = (rowIndex: number): void => { setRows((existing) => { const currentRow = existing[rowIndex]; if (!currentRow) return existing; const brand = normalizeBrand(currentRow.brand); if (brand === currentRow.brand) return existing; const candidate = { ...currentRow, brand, supplierObservedBrand: currentRow.supplierObservedBrand || currentRow.brand }; if (!isCompatible(candidate)) { setNotice({ tone: 'warning', message: 'La marca normalizada no es compatible con el Tipo y la Categoría seleccionados.' }); return existing; } rememberUndo(existing); setDirty(true); return existing.map((row, index) => index === rowIndex ? candidate : row); }); };
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
        let nextRow = hadRowContent ? { ...previous } : applyBatchDefaults(previous, batchDefaults, normalizeBrand);
        values.forEach((value, x) => { const column = activeColumns[columnIndex + x]; if (!column) return; if (column === 'title') { nextRow.supplierObservedTitle = value; nextRow.title = normalizeSupplierTitle(value); } else if (column === 'brand') { nextRow.supplierObservedBrand = value; nextRow.brand = normalizeBrand(value); } else nextRow = { ...nextRow, [column]: value } as UiRow; });
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
  const focusCell = (row: number, column: number): void => {
    setGridExpanded(true);
    setSelection(null);
    setPendingGridFocus({ rowIndex: row, columnKey: activeColumns[column] ?? null });
  };
  const undo = (): void => { if (!undoRows.current) return; const prior = undoRows.current; undoRows.current = { rows: rows.map((row) => ({ ...row })), active: { ...active }, selection: selection ? { ...selection } : null }; setRows(prior.rows); setSelection(prior.selection); setDirty(true); focusCell(prior.active.row, prior.active.column); showToast('Se deshizo la última operación de datos.'); };
  const removeActiveDraftRow = (): void => {
    if (rows.length <= 1) return;
    const removal = removeDraftRow(rows, active.row);
    if (!removal.removed) return;
    rememberUndo(rows);
    setRows([...removal.rows]);
    setSelection(null);
    setDirty(true);
    focusCell(removal.nextRowIndex, Math.min(active.column, Math.max(0, activeColumns.length - 1)));
    showToast(`Fila ${active.row + 1} quitada. Puedes deshacerlo antes de guardar.`);
  };
  const focusIssue = (issue: ValidationIssue): void => {
    if (issue.scope === 'BATCH') {
      if (issue.controlKey === 'source') { setSupplierSearch(''); setSupplierGateOpen(true); }
      return;
    }
    if (issue.scope !== 'CELL' || issue.rowIndex === undefined || !issue.columnKey) return;
    setGridExpanded(true);
    setSelection(null);
    setPendingGridFocus({ rowIndex: issue.rowIndex, columnKey: issue.columnKey });
  };
  useEffect(() => {
    if (!pendingIssueFocus) return undefined;
    focusIssue(pendingIssueFocus);
    setPendingIssueFocus(null);
    return undefined;
  }, [pendingIssueFocus]);
  const moveIssue = (direction: -1 | 1): void => { const next = nextValidationIssueIndex(normalizedIssueIndex, direction, issues.length); setIssueIndex(next); const issue = issues[next]; if (issue) focusIssue(issue); };
  const navigate = (event: React.KeyboardEvent<HTMLInputElement | HTMLSelectElement>, rowIndex: number, columnIndex: number): void => {
    if ((event.metaKey || event.ctrlKey) && event.key.toLocaleLowerCase('en-US') === 'z') { event.preventDefault(); undo(); return; }
    if (event.key === 'Escape' && editOriginal.current?.row === rowIndex && editOriginal.current.column === activeColumns[columnIndex]) { event.preventDefault(); updateCell(rowIndex, editOriginal.current.column, editOriginal.current.value); showToast('Edición de celda cancelada.'); return; }
    if (event.currentTarget instanceof HTMLSelectElement && ['ArrowUp', 'ArrowDown'].includes(event.key)) return;
    if (!['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Tab', 'Enter'].includes(event.key)) return;
    event.preventDefault(); const next = nextGridCell(event.key, rowIndex, columnIndex, rows.length, activeColumns.length, event.shiftKey); focusCell(next.row, next.column);
  };
  const applyDefaultsToEmptyCells = (): void => {
    if (!batchDefaults.kind && !batchDefaults.category.trim() && !batchDefaults.brand.trim()) return;
    setRows((existing) => {
      const result = applyBatchDefaultsToEmptyRows(existing, batchDefaults, normalizeBrand);
      if (result.changedCount === 0) { showToast('No hay campos vacíos para completar.'); return existing; }
      if (result.rows.some((row) => !isCompatible(row))) { setNotice({ tone: 'warning', message: 'El contexto no es compatible con una o más filas; no se aplicó.' }); return existing; }
      rememberUndo(existing); setDirty(true); showToast('Se completaron sólo los campos vacíos.'); return result.rows;
    });
  };
  const performFill = (source: ComposerSelection, target: { row: number; column: number }): void => { setRows((existing) => { const next = fillRows(existing, activeColumns, source, target); if (next.some((row) => !isCompatible(row))) { setNotice({ tone: 'warning', message: 'El relleno produciría una combinación incompatible y fue cancelado.' }); return existing; } rememberUndo(existing); setDirty(true); showToast('Relleno copiado. Puedes deshacerlo antes de guardar.'); return next; }); };
  const beginFill = (event: React.PointerEvent<HTMLButtonElement>): void => {
    event.preventDefault(); const source = selection && active.row >= selection.firstRow && active.row <= selection.lastRow && active.column >= selection.firstColumn && active.column <= selection.lastColumn ? selection : { firstRow: active.row, lastRow: active.row, firstColumn: active.column, lastColumn: active.column }; let target = { row: source.lastRow, column: source.lastColumn };
    const move = (pointerEvent: PointerEvent): void => { const shell = document.elementFromPoint(pointerEvent.clientX, pointerEvent.clientY)?.closest<HTMLElement>('[data-cell-shell]'); if (!shell) return; const [rowValue, columnValue] = (shell.dataset.cellShell ?? '').split(':').map(Number); if (!Number.isInteger(rowValue) || !Number.isInteger(columnValue)) return; target = { row: rowValue!, column: columnValue! }; setSelection({ firstRow: Math.min(source.firstRow, target.row), lastRow: Math.max(source.lastRow, target.row), firstColumn: Math.min(source.firstColumn, target.column), lastColumn: Math.max(source.lastColumn, target.column) }); };
    const up = (): void => { window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); performFill(source, target); };
    window.addEventListener('pointermove', move); window.addEventListener('pointerup', up, { once: true });
  };
  const beginResize = (event: React.PointerEvent<HTMLButtonElement>, column: Column): void => { event.preventDefault(); event.stopPropagation(); const start = event.clientX; const initial = columnWidths[column]; const move = (pointerEvent: PointerEvent): void => setColumnWidths((value) => resizeColumnWidth(value, column, initial + pointerEvent.clientX - start) as Record<Column, number>); const up = (): void => { window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); }; window.addEventListener('pointermove', move); window.addEventListener('pointerup', up, { once: true }); };
  const autoFit = (column: Column): void => { const values = rows.slice(0, 500).map((row) => column === 'title' ? row.title : row[column]); setColumnWidths((existing) => resizeColumnWidth(existing, column, estimateColumnWidth(labels[column], values)) as Record<Column, number>); showToast(`${labels[column]} ajustada automáticamente.`); };
  const draftSourceId = current?.sourceId ?? pendingNewLoadSupplierId ?? '';
  const hasMeaningfulWork = hasMeaningfulComposerWork({ dirty, description, mode, completeness, rows });
  const { reviewVisible: captureActionsVisible, saveForLaterVisible: canSaveForLater } = captureActionState({ lifecycle: current?.lifecycle ?? null, dirty, hasMeaningfulWork });
  const buildPayload = async () => ({ sourceId: draftSourceId, description: description.trim() || null, mode, completeness, columnSignature: await signature(mode), rawPayload, rows: rows.map(proposal) });
  const navigateToSourceRow = (row: SupplierVersionRow, columnKey: Column | null = correctionFieldForRow(row)): void => {
    const plan = planSourceRowNavigation(current?.rows ?? [], row.rowDecisionId, columnKey, activeColumns, mode === 'COMPACT' ? compactColumns : policyColumns.all);
    if (plan.rowIndex < 0) return;
    setGridExpanded(true);
    setSelection(null);
    if (plan.requiresAllColumns) setViewPreset('ALL');
    setPendingGridFocus({ rowIndex: plan.rowIndex, columnKey: plan.columnKey });
  };
  const startCorrection = (row: SupplierVersionRow): void => {
    if (!current || current.lifecycle !== 'INGESTED' || !canPrepareBulk || current.batch.lifecycle === 'APPLIED') {
      navigateToSourceRow(row);
      return;
    }
    const parent = current;
    navigateToSourceRow(row);
    setCurrent(null);
    setPendingNewLoadSupplierId(parent.sourceId);
    setCorrectionSupersedesVersionId(parent.versionId);
    setDescription(`Corrección de ${parent.sourceName} v${parent.sequenceNumber}`);
    setMode(parent.mode);
    setCompleteness(parent.completeness);
    setDirty(true);
    setValidationAttempted(false);
    setServerIssues([]);
    undoRows.current = null;
    showToast(`Corrección local preparada desde ${parent.sourceName} v${parent.sequenceNumber}. Corrige la fila ${row.rowNumber} y guarda o revisa la lista para crear la nueva versión.`);
  };
  const resetCoverageDetails = (): void => { setContinuedOpen(false); setNotObservedOpen(false); setAdditionalOpen(false); setComparisonOpen(false); setCoverageReviewOpen(false); };
  const resetMissingDataContext = (): void => { setBatchDefaults({ kind: '', category: '', brand: '' }); setContextOpen(false); };
  const resetNewLoad = (sourceId: string, selectedCompleteness: SupplierCatalogCompleteness): void => { setPendingNewLoadSupplierId(sourceId); setCurrent(null); setCorrectionSupersedesVersionId(null); setDescription(''); setMode('FULL'); setCompleteness(selectedCompleteness); setRows([blank()]); resetMissingDataContext(); setCompare(null); setCompareId(''); setGridExpanded(true); resetCoverageDetails(); setDirty(false); setValidationAttempted(false); setServerIssues([]); setNotice(null); undoRows.current = null; draftCreateRequest.current = crypto.randomUUID(); };
  const clearNewLoad = (): void => { setPendingNewLoadSupplierId(null); setCurrent(null); setCorrectionSupersedesVersionId(null); setDescription(''); setMode('FULL'); setCompleteness('PARTIAL'); setRows([blank()]); resetMissingDataContext(); setCompare(null); setCompareId(''); setGridExpanded(true); resetCoverageDetails(); setDirty(false); setValidationAttempted(false); setServerIssues([]); setNotice(null); undoRows.current = null; };
  const discardMeaningfulWork = (message: string): boolean => !hasMeaningfulWork || window.confirm(message);
  const openSupplierGate = (restoreTarget: string, preservePreparation = false): void => {
    setSupplierGateRestoreTarget(restoreTarget); setSupplierSearch('');
    setSupplierGateSupplierId(preservePreparation ? pendingNewLoadSupplierId : null);
    setSupplierGateCompleteness(preservePreparation ? completeness : null);
    setSupplierGateOpen(true);
  };
  const continueNewLoad = (): boolean => {
    if (!canPrepareBulk) return false;
    const preparation = { supplierId: supplierGateSupplierId, completeness: supplierGateCompleteness };
    if (!canContinueNewLoadGate(preparation) || !preparation.supplierId || !preparation.completeness) return false;
    const keepsLocalRows = !current && pendingNewLoadSupplierId === preparation.supplierId;
    if (!keepsLocalRows && hasMeaningfulWork && !discardMeaningfulWork('Cambiar de proveedor descartará los datos locales sin guardar. ¿Continuar?')) return false;
    void refreshFieldPolicy();
    if (keepsLocalRows) {
      setCompleteness(preparation.completeness);
      if (completeness !== preparation.completeness) setDirty(true);
    } else resetNewLoad(preparation.supplierId, preparation.completeness);
    setSupplierGateOpen(false); setSupplierGateSupplierId(null); setSupplierGateCompleteness(null);
    showToast(`Nueva carga preparada para ${sources.find((source) => source.sourceId === preparation.supplierId)?.name ?? 'el proveedor seleccionado'} · ${loadIntentLabel(preparation.completeness)}.`);
    return true;
  };
  const browseSource = (sourceId: string): void => { setBrowseSourceId(sourceId); };
  const openNewSource = (origin: 'ADMINISTRATION' | 'GATE'): void => { setNewSourceOrigin(origin); setNewSourceName(''); setSupplierGateOpen(false); setNewSourceOpen(true); };
  const closeNewSource = (): void => { if (busy) return; const returnToGate = newSourceOrigin === 'GATE'; setNewSourceOpen(false); setNewSourceOrigin(null); if (returnToGate) setSupplierGateOpen(true); };
  const addSource = async (): Promise<void> => { if (!canPrepareBulk || !newSourceName.trim()) return; setBusy(true); try { const created = await createSupplierSource(newSourceName, csrfToken); await refresh(); setNewSourceName(''); setNewSourceOpen(false); clearServerIssue((issue) => issue.controlKey === 'source'); if (newSourceOrigin === 'GATE') { setNewSourceOrigin(null); setSupplierGateSupplierId(created.sourceId); setSupplierGateCompleteness(null); setSupplierGateOpen(true); } else { setNewSourceOrigin(null); showToast('Proveedor creado. El trabajo actual se conserva.'); } } catch { setNotice({ tone: 'danger', message: 'No se creó el proveedor; revisa nombre o duplicados.' }); } finally { setBusy(false); } };
  const persistDraft = async (): Promise<SupplierVersion | null> => {
    if (!canPrepareBulk) return null;
    setNotice(null); setServerIssues([]); setValidationAttempted(true); setIssueIndex(0);
    const clientIssues = sortValidationIssues([
      ...validateComposerDraft({ selectedSource: draftSourceId, mode, rows }),
      ...rows.flatMap((row, rowIndex): ValidationIssue[] => isCompatible(row) ? [] : [{ scope: 'CELL', rowIndex, columnKey: row.brand ? 'brand' : 'category', code: 'INCOMPATIBLE_REFERENCE', message: 'Esta combinación de Tipo, Categoría y Marca no es compatible.' }]),
    ]);
    if (clientIssues[0]) { setPendingIssueFocus(clientIssues[0]); return null; }
    try {
      const payload = { ...(await buildPayload()), includeReferenceCost: canReadCost };
      const saved = current?.lifecycle === 'DRAFT' ? await replaceSupplierDraft(current.versionId, { ...payload, expectedVersion: current.version }, csrfToken) : await createSupplierDraft({ ...payload, ...(correctionSupersedesVersionId ? { supersedesVersionId: correctionSupersedesVersionId } : {}), clientRequestId: draftCreateRequest.current }, csrfToken);
      // The server response deliberately omits retained raw payload. Keep the
      // capture rows locally after a DRAFT save so a second save cannot replace
      // supplier spelling with its effective canonical presentation.
      setCurrent(saved); setPendingNewLoadSupplierId(null); setCorrectionSupersedesVersionId(null); setRows(rows); resetCoverageDetails(); setDirty(false); setValidationAttempted(false); setServerIssues([]); undoRows.current = null; await refresh().catch(() => undefined); return saved;
    } catch (error) {
      const issue = validationIssueFromApi(error instanceof PreviewApiError ? { status: error.status, code: error.code, parameter: error.parameter } : { status: 0 });
      if (issue.scope === 'GLOBAL') setNotice({ tone: 'danger', message: issue.message });
      else { setServerIssues([issue]); setIssueIndex(0); setPendingIssueFocus(issue); }
      return null;
    }
  };
  const save = async (): Promise<void> => { if (busy) return; setBusy(true); try { if (await persistDraft()) showToast('Borrador guardado. Puedes continuar después.'); } finally { setBusy(false); } };
  const analyzeSnapshot = async (snapshot: SupplierVersion): Promise<SupplierVersion> => { const value = await analyzeSupplierVersion(snapshot.versionId, snapshot.version, canReadCost, csrfToken); setCurrent(value); setRows(fromRecord(value)); setGridExpanded(false); resetCoverageDetails(); setReconciliationView('ATTENTION'); await refresh().catch(() => undefined); return value; };
  const analyze = async (): Promise<void> => { if (!current || busy) return; setBusy(true); try { await analyzeSnapshot(current); showToast('Análisis terminado sin escribir en Lista de precios.'); } catch { setNotice({ tone: 'danger', message: 'No fue posible analizar el snapshot.' }); } finally { setBusy(false); } };
  const reviewList = async (): Promise<void> => {
    if (busy || reviewInFlight.current) return;
    reviewInFlight.current = true; setBusy(true); setNotice(null);
    try {
      const reusableDraft = current?.lifecycle === 'DRAFT' && !dirty ? current : null;
      setReviewProgress(reusableDraft ? 'ANALYZING' : 'SAVING');
      const outcome = await orchestrateReviewList({
        snapshot: reusableDraft,
        persist: persistDraft,
        analyze: async (snapshot) => { setReviewProgress('ANALYZING'); return analyzeSnapshot(snapshot); },
      });
      if (outcome.stage === 'SAVE_FAILED') return;
      if (outcome.stage === 'ANALYZE_FAILED') {
        setCurrent(outcome.snapshot); setRows(fromRecord(outcome.snapshot)); setGridExpanded(true);
        setNotice({ tone: 'danger', message: 'La lista quedó guardada, pero no pudo analizarse. Puedes revisar la versión y volver a intentarlo.' });
        return;
      }
      showToast('Análisis terminado sin escribir en Lista de precios.');
    } finally {
      setReviewProgress(null); setBusy(false); reviewInFlight.current = false;
    }
  };
  const load = async (id: string): Promise<void> => { if (!discardMeaningfulWork('Hay cambios sin guardar. ¿Quieres descartarlos y abrir otra versión?')) return; setBusy(true); try { const value = await getSupplierVersion(id, canReadCost); if (canPrepareBulk) await refreshFieldPolicy(); setCurrent(value); setMode(value.mode); setCompleteness(value.completeness); setBrowseSourceId(value.sourceId); setPendingNewLoadSupplierId(null); setCorrectionSupersedesVersionId(null); setDescription(value.description ?? ''); setRows(fromRecord(value)); resetMissingDataContext(); setCompare(null); setCompareId(''); setGridExpanded(value.lifecycle === 'DRAFT'); resetCoverageDetails(); setReconciliationView('ATTENTION'); setDirty(false); setValidationAttempted(false); setServerIssues([]); undoRows.current = null; setNotice(null); publishRequest.current = crypto.randomUUID(); draftCreateRequest.current = crypto.randomUUID(); } finally { setBusy(false); } };
  const resolve = async (rowDecisionId: string, expectedRowVersion: number, nextDecision: 'APPLY' | 'EXCLUDE', targetItemId: string | null = null, selectedTitleDecision: BulkCatalogTitleDecision | null = null): Promise<boolean> => { if (!current) return false; setBusy(true); try { const value = await decideSupplierRow(current.versionId, rowDecisionId, { expectedRowVersion, decision: nextDecision, targetItemId, titleDecision: selectedTitleDecision, includeReferenceCost: canReadCost }, csrfToken); setCurrent(value); showToast(targetItemId ? 'Identidad y nombre quedaron preparados para Apply; Catalog todavía no cambió.' : nextDecision === 'APPLY' ? 'Fila incluida explícitamente.' : 'Fila excluida del lote.'); return true; } catch (error) { setNotice({ tone: 'danger', message: error instanceof PreviewApiError && error.code === 'CATALOG_CONFLICT' ? 'La versión cambió mientras la revisabas. Se recargará para que confirmes de nuevo.' : 'La fila requiere un artículo canónico válido, una decisión de nombre o releer la versión.' }); return false; } finally { setBusy(false); } };
  const chooseDuplicateRow = async (row: SupplierVersionRow): Promise<void> => {
    if (await resolve(row.rowDecisionId, row.version, 'APPLY', row.targetItemId, row.titleDecision)) {
      setReconciliationView('ATTENTION');
      showToast(`Duplicado resuelto. Se usará la fila ${row.rowNumber}; las demás se ignorarán en este lote.`);
    }
  };
  const chooseCandidateTitle = (row: SupplierVersionRow, candidate: Pick<BulkCatalogCandidateMatch, 'itemId' | 'title'>): void => {
    if (!row.proposal.title || row.proposal.title === candidate.title) { void resolve(row.rowDecisionId, row.version, 'APPLY', candidate.itemId); return; }
    setTitleChoice('KEEP_CURRENT');
    setTitleChoiceTarget({ rowDecisionId: row.rowDecisionId, expectedRowVersion: row.version, targetItemId: candidate.itemId, currentTitle: candidate.title, receivedTitle: row.proposal.title });
  };
  const confirmTitleChoice = async (): Promise<void> => {
    if (!titleChoiceTarget) return;
    const succeeded = await resolve(titleChoiceTarget.rowDecisionId, titleChoiceTarget.expectedRowVersion, 'APPLY', titleChoiceTarget.targetItemId, titleChoice);
    if (succeeded) setTitleChoiceTarget(null);
  };
  const resolveGroup = async (classifications: readonly BulkCatalogClassification[], nextDecision: 'APPLY' | 'EXCLUDE'): Promise<void> => { if (!current) return; setBusy(true); try { const value = await decideSupplierRows(current.versionId, { expectedBatchVersion: current.batch.version, classifications, decision: nextDecision, includeReferenceCost: canReadCost }, csrfToken); setCurrent(value); showToast(nextDecision === 'APPLY' ? 'Filas compatibles confirmadas.' : 'Filas con conflicto excluidas.'); } catch { setNotice({ tone: 'danger', message: 'El lote cambió o contiene una combinación que requiere revisión individual.' }); } finally { setBusy(false); } };
  const publish = async (coverageReviewAcknowledged = false): Promise<void> => { if (!current || !canPublishCurrent) return; setBusy(true); try { const value = await publishSupplierVersion(current.versionId, current.version, canReadCost && canWriteCost, csrfToken, coverageReviewAcknowledged, publishRequest.current); setCurrent(value); setCoverageReviewOpen(false); await refresh(); showToast('Lote aplicado atómicamente a Catalog.'); } catch (error) { if (error instanceof PreviewApiError && error.code === 'CATALOG_COVERAGE_REVIEW_REQUIRED') setCoverageReviewOpen(true); else setNotice({ tone: 'danger', message: `No se publicó. El lote se revalidó y no hubo escrituras parciales.${failureCode(error)}` }); } finally { setBusy(false); } };
  const planCreatedBatchRetirement = async (): Promise<void> => { if (!current || current.batch.lifecycle !== 'APPLIED') return; setBusy(true); try { setRetirementPlan(await createCatalogRetirementPlan({ scope: 'BATCH_CREATED', sourceVersionId: current.versionId }, csrfToken)); setRetirementPin(''); } catch { setNotice({ tone: 'danger', message: 'No fue posible preparar el plan de artículos creados por este lote.' }); } finally { setBusy(false); } };
  const retireCreatedBatchItems = async (): Promise<void> => { if (!retirementPlan || retirementPin.length !== 4) return; setBusy(true); try { const result = await executeCatalogRetirementPlan(retirementPlan.planId, { confirmation: 'RETIRE_BATCH_CREATED_ITEMS', pin: retirementPin, clientRequestId: crypto.randomUUID() }, csrfToken); setRetirementPlan(null); setRetirementPin(''); await refresh(); showToast(`${result.retiredCount.toLocaleString('es-MX')} artículos CREATED retirados; MATCHED/UPDATED permanecen intactos.`); } catch (error) { setNotice({ tone: 'danger', message: error instanceof PreviewApiError && error.code === 'REAUTHENTICATION_DENIED' ? 'El PIN no corresponde al usuario de esta sesión o está temporalmente bloqueado.' : 'El plan cambió, expiró o perdió autoridad. Prepara uno nuevo.' }); } finally { setBusy(false); } };
  const compareVersions = async (): Promise<void> => { if (!current || !compareId) return; setBusy(true); try { setCompare(await compareSupplierVersions(compareId, current.versionId)); } finally { setBusy(false); } };
  const closeSupplierDelete = (force = false): void => { if (busy && !force) return; setDeleteSourceTarget(null); setDeleteStage(1); setDeletePin(''); setDeleteArmed(false); };
  const removeSupplier = async (): Promise<void> => {
    if (!deleteSourceTarget || !deleteArmed || deletePin.length !== 4 || deleteInFlight.current) return;
    deleteInFlight.current = true;
    setBusy(true);
    try {
      const deleted = await deleteSupplierSource(deleteSourceTarget.sourceId, { expectedVersion: deleteSourceTarget.version, confirmation: 'DELETE_SUPPLIER_SOURCE', pin: deletePin, clientRequestId: crypto.randomUUID() }, csrfToken);
      const deletedSelected = browseSourceId === deleted.sourceId;
      closeSupplierDelete(true);
      if (deletedSelected) { setBrowseSourceId(''); clearNewLoad(); }
      await refresh();
      showToast(`${deleted.sourceName} y ${deleted.deletedVersionCount.toLocaleString('es-MX')} versiones de borrador se eliminaron definitivamente.`);
    } catch (error) {
      setNotice({ tone: 'danger', message: error instanceof PreviewApiError && error.code === 'REAUTHENTICATION_DENIED' ? 'El PIN no corresponde al usuario de esta sesión o está temporalmente bloqueado.' : error instanceof PreviewApiError && error.code === 'CATALOG_SUPPLIER_DELETE_NOT_ALLOWED' ? 'El proveedor ya tiene historia publicada o dependencias y debe conservarse.' : 'No se eliminó el proveedor. Relee su estado e intenta nuevamente.' });
      closeSupplierDelete(true);
    } finally { deleteInFlight.current = false; setBusy(false); }
  };
  const categoryOptions = references.categories.filter((value) => value.status === 'ACTIVE' && (!batchDefaults.kind || value.applicableKinds.includes(batchDefaults.kind)));
  const selectedCategory = batchDefaults.category ? findCategory(batchDefaults.category) : undefined;
  const governedBrandIds = selectedCategory && batchDefaults.kind ? references.categoryBrandApplicability.filter((value) => value.categoryId === selectedCategory.categoryId && value.kind === batchDefaults.kind).map((value) => value.brandId) : [];
  const brandOptions = references.brands.filter((value) => value.status === 'ACTIVE' && (!batchDefaults.kind || value.applicableKinds.includes(batchDefaults.kind)) && (governedBrandIds.length === 0 || governedBrandIds.includes(value.brandId!)));
  const changeDefaultKind = (kind: CatalogItemKind | ''): void => { let next: BatchDefaults = { ...batchDefaults, kind }; const probe = { ...blank(), ...next }; if (next.category && !isCompatible(probe)) next = { ...next, category: '', brand: '' }; else if (next.brand && !isCompatible({ ...probe, category: next.category })) next = { ...next, brand: '' }; setBatchDefaults(next); showToast('El contexto cambió; las filas existentes no se modificaron.'); };
  const changeDefaultCategory = (category: string): void => { let next: BatchDefaults = { ...batchDefaults, category }; if (next.brand && !isCompatible({ ...blank(), ...next })) next = { ...next, brand: '' }; setBatchDefaults(next); };
  const commitDefaultBrand = (): void => { const brand = normalizeBrand(batchDefaults.brand); if (brand === batchDefaults.brand) return; const candidate = { ...batchDefaults, brand }; if (!isCompatible({ ...blank(), ...candidate })) { setNotice({ tone: 'warning', message: 'La marca normalizada no es compatible con el Tipo y la Categoría seleccionados.' }); return; } setBatchDefaults(candidate); };
  const counts = current?.batch.counts; const unresolved = current?.rows.filter((row) => row.decision === 'UNRESOLVED').length ?? 0; const resolved = (current?.rows.length ?? 0) - unresolved; const excluded = current?.rows.filter((row) => row.decision === 'EXCLUDE').length ?? 0;
  const missingRequiredFields = (row: SupplierVersionRow): readonly Column[] => rowErrors(row.errors).flatMap((code) => {
    const field = requiredEffectiveField(code); return field ? [field] : [];
  });
  const requiredAttentionRows = current?.rows.filter((row) => row.decision !== 'EXCLUDE' && missingRequiredFields(row).length > 0) ?? [];
  const missingRequiredFieldCounts = new Map<Column, number>();
  for (const row of requiredAttentionRows) for (const field of new Set(missingRequiredFields(row))) missingRequiredFieldCounts.set(field, (missingRequiredFieldCounts.get(field) ?? 0) + 1);
  const completeRequiredValues = (): void => {
    const issues = requiredAttentionRows.flatMap((row) => {
      const rowIndex = current?.rows.findIndex((candidate) => candidate.rowDecisionId === row.rowDecisionId) ?? -1;
      return rowIndex < 0 ? [] : missingRequiredFields(row).map((columnKey): ValidationIssue => ({ scope: 'CELL', rowIndex, columnKey, code: 'MISSING_REQUIRED_EFFECTIVE_VALUE', message: columnKey === 'price' ? 'Precio base debe ser mayor que 0.' : columnKey === 'cost' ? 'Costo de referencia debe ser mayor que 0.' : `${labels[columnKey]} es obligatorio para el valor final.` }));
    });
    setServerIssues(issues); setValidationAttempted(true); setIssueIndex(0); setGridExpanded(true); setViewPreset('ALL'); if (issues[0]) setPendingIssueFocus(issues[0]);
  };
  const compatibleSuggestionCount = current?.rows.filter((row) => row.decision === 'UNRESOLVED' && missingRequiredFields(row).length === 0 && ['NEW', 'UPDATE', 'REACTIVATE', 'UNCHANGED'].includes(row.classification)).length ?? 0;
  const duplicateResolutionGroups = current ? groupDuplicateResolutionRows(current.rows, duplicateObservationKey, (row) => rowErrors(row.errors), (row) => rowErrors(row.warnings)) : [];
  const duplicateMemberIds = new Set(duplicateResolutionGroups.flatMap((group) => group.members.map((member) => member.rowDecisionId)));
  const unresolvedDuplicateGroups = duplicateResolutionGroups.filter((group) => group.unresolved); const resolvedDuplicateGroups = duplicateResolutionGroups.filter((group) => !group.unresolved);
  const visibleDuplicateResolutionGroups = reconciliationView === 'ATTENTION' ? unresolvedDuplicateGroups : reconciliationView === 'RESOLVED' ? resolvedDuplicateGroups : duplicateResolutionGroups;
  const unresolvedDecisionUnits = unresolved - unresolvedDuplicateGroups.reduce((total, group) => total + group.members.length, 0) + unresolvedDuplicateGroups.length;
  const resolvedDecisionUnits = resolved - resolvedDuplicateGroups.reduce((total, group) => total + group.members.length, 0) + resolvedDuplicateGroups.length;
  const allDecisionUnits = (current?.rows.length ?? 0) - duplicateResolutionGroups.reduce((total, group) => total + group.members.length, 0) + duplicateResolutionGroups.length;
  const blockedRowCount = current?.rows.filter((row) => row.decision === 'UNRESOLVED' && ['AMBIGUOUS', 'CONFLICT', 'INVALID'].includes(row.classification) && !duplicateMemberIds.has(row.rowDecisionId)).length ?? 0;
  const reviewRows = current?.rows.filter((row) => !duplicateMemberIds.has(row.rowDecisionId) && (reconciliationView === 'ALL' || (reconciliationView === 'ATTENTION' ? row.decision === 'UNRESOLVED' : row.decision !== 'UNRESOLVED'))) ?? [];
  const exactDuplicateCount = current?.rows.filter((row) => row.warnings.includes('DUPLICATE_EXACT_CONSOLIDATED')).length ?? 0;
  const comparisonCandidates = current ? versions.filter((value) => value.sourceId === current.sourceId && value.sequenceNumber < current.sequenceNumber) : [];
  const currentIssueLabel = currentIssue ? currentIssue.scope === 'CELL' && currentIssue.rowIndex !== undefined && currentIssue.columnKey ? `Fila ${currentIssue.rowIndex + 1} · ${labels[currentIssue.columnKey]}` : currentIssue.scope === 'BATCH' ? 'Datos de la lista' : 'Guardado' : '';
  const continuedPanelId = current ? `continued-${current.versionId}` : undefined;
  const notObservedPanelId = current ? `not-observed-${current.versionId}` : undefined;
  const additionalPanelId = current ? `additional-${current.versionId}` : undefined;
  const comparisonPanelId = current ? `historical-comparison-${current.versionId}` : undefined;
  const coverageItemTitle = (item: SupplierVersion['absenceBaseline']['continuedItems'][number]): string => item.canonicalTitle ?? item.observedTitle ?? 'Artículo sin título';
  const coverageItemContext = (item: SupplierVersion['absenceBaseline']['continuedItems'][number]): string => {
    const provenance = current ? `${current.sourceName} v${current.sequenceNumber}` : 'esta versión';
    if (item.catalogResolution === 'CREATED') return `${item.catalogStatus === 'INACTIVE' ? 'Inactivo' : 'Activo'} · Creado por ${provenance}`;
    if (item.catalogClassification === 'REACTIVATE') return `${item.catalogStatus === 'INACTIVE' ? 'Inactivo' : 'Activo'} · Reactivado por ${provenance}`;
    if (item.catalogResolution === 'MATCHED') return `${item.catalogStatus === 'INACTIVE' ? 'Inactivo' : 'Activo'} · Ya existía en SR Taller`;
    if (item.catalogRelation === 'NEW') return 'Se creará como artículo nuevo al aplicar';
    if (item.catalogRelation === 'EXISTING') return `Ya existe en SR Taller · ${item.catalogStatus === 'INACTIVE' ? 'Inactivo' : 'Activo'}`;
    return item.coverageRelation === 'ADDITIONAL' ? 'Pendiente de resolver antes de aplicar' : 'Sin vínculo actual de Catalog';
  };
  const pendingSupplier = pendingNewLoadSupplierId ? sources.find((source) => source.sourceId === pendingNewLoadSupplierId) ?? null : null;
  const browsedSupplier = sources.find((source) => source.sourceId === browseSourceId) ?? null;
  const browsedSupplierVersions = useMemo(() => supplierHistoryForBrowseSource(versions, browseSourceId), [browseSourceId, versions]);
  const visibleSupplierSources = filterSupplierSources(sources, supplierSearch);
  const workspaceAvailable = Boolean(current || pendingSupplier);

  if (!canPrepareBulk) {
    return <div className={styles.page}>
      <div className={styles.heading}><BackLink to="/listas/precios">Lista de precios</BackLink><PageHeader eyebrow="Listas · Carga masiva" title="Bulk Catalog Composer" description="Consulta fuentes, versiones y resultados de carga." /></div>
          {notice ? <Alert tone={notice.tone} title="Atención">{notice.message}</Alert> : null}
          {current?.batch.staleByCorrection ? <Alert tone="warning" title="Esta revisión fue reemplazada por una corrección">La versión original se conserva como evidencia. Continúa la corrección desde la nueva versión antes de revisar o aplicar cambios.</Alert> : null}
      {toast ? <Toast key={toast.id}>{toast.message}</Toast> : null}
      <div className={styles.layout}>
        <aside className={styles.sidebar} aria-label="Fuentes y versiones">
          <div className={styles.sidebarHeading}><h2><Database size={18} aria-hidden="true" />Fuentes y versiones</h2></div>
          <p><small>{canReadBulk ? 'Solo lectura' : 'Acceso no disponible'}</small></p>
          <label>Explorar proveedor<Select value={browseSourceId} onChange={(event) => browseSource(event.target.value)}><option value="">Selecciona…</option>{sources.map((value) => <option key={value.sourceId} value={value.sourceId}>{value.name}</option>)}</Select></label>
          <div className={styles.history} aria-live="polite" aria-label={browsedSupplier ? `Historial de ${browsedSupplier.name}` : 'Historial de proveedor'}>{browsedSupplier ? <section className={`${styles.sourceGroup} ${styles.selectedSource}`}>
            <header><strong>{browsedSupplier.name}</strong><span>{browsedSupplierVersions.length} {browsedSupplierVersions.length === 1 ? 'versión' : 'versiones'}</span></header>
            {browsedSupplierVersions.length > 0 ? <div className={styles.versionList}>{browsedSupplierVersions.map((value) => <button type="button" key={value.versionId} className={current?.versionId === value.versionId ? styles.selectedVersion : ''} aria-current={current?.versionId === value.versionId ? 'true' : undefined} onClick={() => void load(value.versionId)}><span><strong>v{value.sequenceNumber}</strong><small>{versionStatus(value)}</small></span><span>{formatVersionDate(value.createdAt, timeZone)} · {value.rowCount.toLocaleString('es-MX')} filas</span>{value.description ? <small>{value.description}</small> : null}</button>)}</div> : <p>No hay versiones para este proveedor.</p>}
          </section> : <p>Selecciona un proveedor para consultar sus versiones.</p>}</div>
        </aside>
        <main className={styles.composer} aria-busy={busy}>
          {!current ? <section className={styles.emptyWorkspace} aria-labelledby="bulk-empty-workspace-title"><Columns3 size={20} aria-hidden="true" /><div><h2 id="bulk-empty-workspace-title">Selecciona una versión para revisarla</h2><p>Las cargas y sus resultados permanecen disponibles para consulta.</p></div></section> : <>
            <section className={styles.setup}><div className={styles.versionIdentity}><div><strong>{current.sourceName} · {loadIntentLabel(current.completeness)}</strong><small>{versionStatus(current)} · Solo lectura</small></div></div></section>
            <section className={styles.summary} aria-label="Resultado de la versión">{Object.entries(current.batch.counts).map(([key, value]) => <div key={key}><strong>{value}</strong><span>{statusLabels[key as keyof typeof statusLabels]}</span></div>)}</section>
            <section className={styles.coverage} aria-labelledby="supplier-coverage-title"><div className={styles.coverageHeader}><h2 id="supplier-coverage-title"><GitCompare size={18} />Cobertura del proveedor</h2><span>{current.completeness === 'COMPLETE' ? 'Lista completa' : 'Actualización parcial'}</span></div><p>{current.absenceBaseline.status === 'EVALUATED' ? `${current.absenceBaseline.currentCount.toLocaleString('es-MX')} recibidas · ${current.absenceBaseline.continuedCount?.toLocaleString('es-MX') ?? 0} continúan · ${current.absenceBaseline.additionalCount?.toLocaleString('es-MX') ?? 0} adicionales · ${current.absenceBaseline.notObservedCount?.toLocaleString('es-MX') ?? 0} ya no observadas.` : 'La cobertura de esta versión puede inspeccionarse sin modificarla.'}</p></section>
            <section className={styles.decisions} aria-labelledby="readonly-reconciliation-title"><div className={styles.decisionTitle}><h2 id="readonly-reconciliation-title">{current.batch.lifecycle === 'APPLIED' ? 'Resultado aplicado' : 'Reconciliación'}</h2><span>Solo lectura</span></div>{current.rows.slice(0, 100).map((row) => <article key={row.rowDecisionId}><div><strong>Fila {row.rowNumber} · {statusLabels[row.classification]}</strong><span>{row.proposal.title ?? row.proposal.supplierItemCode ?? row.proposal.sku ?? row.proposal.barcode ?? 'Sin identidad'}{row.targetTitle ? ` → ${row.targetTitle}` : ''}</span>{row.warnings.map(warningMessage).filter((message): message is string => message !== null).map((message) => <small key={message}>{message}</small>)}{rowErrors(row.errors).map((code) => analysisMessage(code, canReadCost)).filter((message): message is string => message !== null).map((message) => <small key={message}>{message}</small>)}</div><div><Button size="compact" tone="quiet" aria-label={`Ir a fila ${row.rowNumber}`} onClick={() => navigateToSourceRow(row)}>Ir a fila</Button></div></article>)}</section>
            {canPublishCurrent ? <section className={styles.batchSecondaryActions}><div><h2>Publicación</h2><p>Este lote está listo. Aplicar sigue validando todas las autoridades de efecto en el servidor.</p></div><Button size="compact" tone="primary" onClick={() => current.absenceBaseline.plausibility.status === 'REVIEW_REQUIRED' ? setCoverageReviewOpen(true) : void publish()} disabled={busy}><Send size={17} />Aplicar lote</Button></section> : null}
          </>}
        </main>
      </div>
      <Dialog open={coverageReviewOpen} title="Confirma la lista completa" description="La cobertura actual es mucho menor que la referencia anterior" onClose={() => { if (!busy) setCoverageReviewOpen(false); }} footer={false}><div className={styles.retirementDialog}><Alert tone="warning" title="Esta lista completa es mucho más pequeña que la referencia anterior">Referencia anterior: {current?.absenceBaseline.plausibility.baselineCount?.toLocaleString('es-MX') ?? 0} artículos. Lista actual: {current?.absenceBaseline.plausibility.currentCount.toLocaleString('es-MX') ?? 0}.</Alert><footer className={styles.retirementActions}><Button disabled={busy} onClick={() => setCoverageReviewOpen(false)}>Cancelar</Button><Button tone="primary" disabled={busy} onClick={() => void publish(true)}>{busy ? 'Aplicando…' : 'Confirmar y aplicar'}</Button></footer></div></Dialog>
    </div>;
  }

  return <div className={styles.page}>
    <div className={styles.heading}><BackLink to="/listas/precios" onClick={(event) => { if (hasMeaningfulWork && !window.confirm('Hay cambios sin guardar. ¿Quieres salir del Composer?')) event.preventDefault(); }}>Lista de precios</BackLink><PageHeader eyebrow="Listas · Carga masiva" title="Bulk Catalog Composer" description="Pega y corrige una versión de proveedor; nada toca Catalog hasta aplicar el lote." /></div>
    {notice ? <Alert tone={notice.tone} title="Atención">{notice.message}</Alert> : null}
    {current?.batch.staleByCorrection ? <Alert tone="warning" title="Esta revisión fue reemplazada por una corrección">La versión original se conserva como evidencia. Continúa la corrección desde la nueva versión antes de revisar o aplicar cambios.</Alert> : null}
    {toast ? <Toast key={toast.id}>{toast.message}</Toast> : null}
    <div className={`${styles.layout} ${!sourcesOpen ? styles.layoutCollapsed : ''}`}>
      {sourcesOpen ? <aside id="composer-sources-panel" className={styles.sidebar}>
        <div className={styles.sidebarHeading}><h2><Database size={18} aria-hidden="true" />Fuentes y versiones</h2><button ref={sourcesToggleRef} id="composer-sources-panel-toggle" type="button" className={styles.collapseToggle} aria-expanded="true" aria-controls="composer-sources-panel" aria-label="Ocultar fuentes y versiones" title="Ocultar fuentes y versiones" onClick={() => changeSourcesVisibility(false)}><ChevronLeft size={18} /></button></div>
        <Button id="supplier-gate-new-load" size="compact" tone="primary" onClick={() => openSupplierGate('supplier-gate-new-load')}><Plus size={16} />Nueva carga</Button>
        <Button size="compact" onClick={() => openNewSource('ADMINISTRATION')}><Plus size={16} />Nuevo proveedor</Button>
        <label>Explorar proveedor<Select value={browseSourceId} onChange={(event) => browseSource(event.target.value)}><option value="">Selecciona…</option>{sources.map((value) => <option key={value.sourceId} value={value.sourceId}>{value.name}</option>)}</Select></label>
        <div className={styles.history} aria-live="polite" aria-label={browsedSupplier ? `Historial de ${browsedSupplier.name}` : 'Historial de proveedor'}>{browsedSupplier ? <section className={`${styles.sourceGroup} ${styles.selectedSource}`}>
          <header><div><strong>{browsedSupplier.name}</strong><span>{browsedSupplierVersions.length} {browsedSupplierVersions.length === 1 ? 'versión' : 'versiones'}</span></div><div className={styles.sourceActions}><Button id={`supplier-gate-source-${browsedSupplier.sourceId}`} size="compact" tone="quiet" aria-label="Nueva carga; seleccionar proveedor" onClick={() => openSupplierGate(`supplier-gate-source-${browsedSupplier.sourceId}`)}><Plus size={15} /></Button>{canDeleteSupplier ? <Button size="compact" tone="quiet" aria-label={`Eliminar proveedor ${browsedSupplier.name}`} title={browsedSupplier.deletionEligibility.allowed ? 'Eliminar proveedor' : 'Se conserva porque tiene historia publicada o dependencias'} disabled={!browsedSupplier.deletionEligibility.allowed} onClick={() => { setDeleteSourceTarget(browsedSupplier); setDeleteStage(1); setDeletePin(''); }}><Trash2 size={15} /></Button> : null}</div></header>
          {browsedSupplierVersions.length > 0 ? <div className={styles.versionList}>{browsedSupplierVersions.map((value) => <button type="button" key={value.versionId} className={current?.versionId === value.versionId ? styles.selectedVersion : ''} aria-current={current?.versionId === value.versionId ? 'true' : undefined} onClick={() => void load(value.versionId)}><span><strong>v{value.sequenceNumber}</strong><small>{versionStatus(value)}</small></span><span>{formatVersionDate(value.createdAt, timeZone)} · {value.rowCount.toLocaleString('es-MX')} filas</span>{value.description ? <small>{value.description}</small> : null}</button>)}</div> : <p>No hay versiones para este proveedor.</p>}
        </section> : <p>Selecciona un proveedor para consultar sus versiones.</p>}</div>
      </aside> : null}
      <main className={styles.composer} aria-busy={busy}>
        {!sourcesOpen ? <button ref={sourcesToggleRef} id="composer-sources-panel-toggle" type="button" className={`${styles.collapseToggle} ${styles.sourceRestoreControl}`} aria-expanded="false" aria-controls="composer-sources-panel" aria-label="Mostrar fuentes y versiones" title="Mostrar fuentes y versiones" onClick={() => changeSourcesVisibility(true)}><ChevronRight size={18} /></button> : null}
        {workspaceAvailable ? <>
        <section className={styles.setup}>
          <div className={styles.versionIdentity}><div><strong>{current ? `${current.sourceName} · ${loadIntentLabel(current.completeness)}` : `${pendingSupplier?.name ?? 'Sin seleccionar'} · ${loadIntentLabel(completeness)}`}</strong><small>{current ? versionStatus(current) : 'Proveedor e intención de esta carga · El número se asignará al guardar'}</small></div>{!current && pendingSupplier ? <Button id="supplier-gate-change-pending" size="compact" tone="quiet" onClick={() => openSupplierGate('supplier-gate-change-pending', true)}>Cambiar</Button> : null}</div>
          <label>Descripción opcional<Input value={description} maxLength={500} disabled={current?.lifecycle === 'INGESTED'} placeholder="Ej. Lista septiembre, sucursal o referencia" onChange={(event) => { setDescription(event.target.value); setDirty(true); }} /></label>
          <section className={styles.advancedOptions}><Button type="button" size="compact" tone="quiet" aria-expanded={advancedOptionsOpen} aria-controls="capture-mode-advanced-options" onClick={() => setAdvancedOptionsOpen((value) => !value)}>Opciones avanzadas</Button>{advancedOptionsOpen ? <div id="capture-mode-advanced-options"><label><input type="checkbox" checked={mode === 'COMPACT'} disabled={current?.lifecycle === 'INGESTED'} aria-describedby="capture-mode-advanced-description" onChange={(event) => { setMode(event.target.checked ? 'COMPACT' : 'FULL'); setDirty(true); }} />Solo actualizar artículos identificados</label><p id="capture-mode-advanced-description">Requiere código de proveedor, SKU o código de barras. No permite crear artículos nuevos.</p><small>Úsalo cuando la lista contiene identificadores confiables y quieres impedir que SR Taller cree artículos nuevos.</small></div> : null}</section>
        </section>
        {mode === 'FULL' && (current?.lifecycle === 'DRAFT' || !current) ? <section className={styles.batchContext}>
          <Button size="compact" tone="quiet" className={styles.contextDisclosure} aria-expanded={contextOpen} aria-controls="missing-data-context" onClick={() => setContextOpen((value) => !value)}><ChevronDown size={16} className={contextOpen ? undefined : styles.contextDisclosureChevron} />Completar datos faltantes</Button>
          {contextOpen ? <div id="missing-data-context" className={styles.contextPanel}>
            <p>Úsalo cuando varias filas vienen sin tipo, categoría o marca.</p>
            <div className={styles.contextFields}>
              <label>Tipo<Select aria-label="Tipo" value={batchDefaults.kind} onChange={(event) => changeDefaultKind(event.target.value as CatalogItemKind | '')}><option value="">Sin tipo</option><option value="PART">Refacción</option><option value="PRODUCT">Producto</option><option value="SERVICE">Servicio</option><option value="SUPPLY">Insumo</option></Select></label>
              <label>Categoría<Input aria-label="Categoría" list="bulk-category-options" value={batchDefaults.category} onChange={(event) => changeDefaultCategory(event.target.value)} /><datalist id="bulk-category-options">{categoryOptions.map((value) => <option key={value.categoryId} value={value.name} />)}</datalist></label>
              <label>Marca<Input aria-label="Marca" list="bulk-brand-options" value={batchDefaults.brand} onBlur={commitDefaultBrand} onChange={(event) => { const candidate = { ...batchDefaults, brand: event.target.value }; if (!isCompatible({ ...blank(), ...candidate })) { setNotice({ tone: 'warning', message: 'La marca elegida no es compatible con el Tipo y la Categoría seleccionados.' }); return; } setBatchDefaults(candidate); }} /><datalist id="bulk-brand-options">{brandOptions.map((value) => <option key={value.brandId} value={value.name} />)}</datalist></label>
            </div>
            <div className={styles.contextApply}><Button size="compact" onClick={applyDefaultsToEmptyCells} disabled={!batchDefaults.kind && !batchDefaults.category.trim() && !batchDefaults.brand.trim()}>Aplicar a filas incompletas</Button><small>Solo se completarán campos vacíos. Los datos que ya vienen en la lista no se modificarán.</small></div>
          </div> : null}
        </section> : null}
        <section className={styles.workspaceToolbar}>
          <div className={styles.workspaceMeta}><Columns3 size={18} aria-hidden="true" /><strong>{rows.length.toLocaleString('es-MX')} {current?.lifecycle === 'INGESTED' ? 'filas recibidas' : 'filas'}</strong><span>{gridExpanded ? 'Celda, columna o rectángulo' : 'Lista oculta; resultados a continuación'}</span></div>
          <div className={styles.toolbarControls}><div className={styles.viewControls}>{gridExpanded ? mode === 'FULL' ? fullPolicyReady ? <div className={styles.presetButtons} role="group" aria-label="Columnas de trabajo"><Button size="compact" tone={viewPreset === 'ESSENTIAL' ? 'primary' : 'quiet'} onClick={() => setViewPreset('ESSENTIAL')}>Esenciales ({policyColumns.essential.length})</Button><Button size="compact" tone={viewPreset === 'ALL' ? 'primary' : 'quiet'} onClick={() => setViewPreset('ALL')}>Todas</Button></div> : <span>Política de campos pendiente</span> : <span>Actualización compacta</span> : null}<Button size="compact" tone="quiet" aria-expanded={gridExpanded} aria-controls="bulk-catalog-grid" onClick={() => setGridExpanded((value) => !value)}>{gridExpanded ? 'Ocultar lista' : 'Mostrar lista'}</Button><Button size="compact" tone={gridlinesVisible ? 'secondary' : 'quiet'} aria-pressed={gridlinesVisible} aria-controls="bulk-catalog-grid" onClick={() => setGridlinesVisible((value) => !value)}>Cuadrícula</Button></div><div className={styles.workflowControls}>{editableGridActionsVisible ? <div className={styles.gridEditActions} role="group" aria-label="Acciones de edición de la lista"><Button size="compact" tone="quiet" disabled={!undoRows.current} onClick={undo}><RotateCcw size={16} />Deshacer</Button><Button size="compact" disabled={rows.length >= 10_000} onClick={() => { setDirty(true); setRows((value) => { rememberUndo(value); return [...value, applyBatchDefaults(blank(), batchDefaults, normalizeBrand)]; }); }}><Plus size={16} />Agregar fila</Button><Button size="compact" tone="quiet" disabled={rows.length === 1} onClick={removeActiveDraftRow}><Trash2 size={16} />Quitar fila activa</Button></div> : null}{captureActionsVisible ? <><Button size="compact" tone="primary" onClick={() => void reviewList()} disabled={busy}><Check size={17} />{reviewProgress === 'SAVING' ? 'Guardando lista…' : reviewProgress === 'ANALYZING' ? 'Analizando…' : 'Revisar lista'}</Button>{canSaveForLater ? <Button size="compact" tone="quiet" onClick={() => void save()} disabled={busy}><Save size={17} />Guardar para después</Button> : null}</> : null}{current?.lifecycle === 'INGESTED' && current.batch.lifecycle !== 'APPLIED' && !current.batch.staleByCorrection ? <Button size="compact" tone="primary" onClick={() => void analyze()} disabled={busy}><Check size={17} />Reanalizar versión</Button> : null}{canPublishCurrent ? <Button size="compact" tone="primary" onClick={() => current?.absenceBaseline.plausibility.status === 'REVIEW_REQUIRED' ? setCoverageReviewOpen(true) : void publish()} disabled={busy}><Send size={17} />Aplicar lote</Button> : null}</div></div>
          {currentIssue ? <div className={styles.issueNavigator} role="status" aria-live="polite"><button type="button" onClick={() => moveIssue(-1)} aria-label="Error anterior">‹</button><button type="button" className={styles.issueTarget} onClick={() => focusIssue(currentIssue)}><strong>{normalizedIssueIndex + 1} de {issues.length} · {currentIssueLabel}</strong><span>{currentIssue.message}</span></button><button type="button" onClick={() => moveIssue(1)} aria-label="Error siguiente">›</button></div> : null}
        </section>
        {busy ? <Spinner label={reviewProgress === 'SAVING' ? 'Guardando lista…' : reviewProgress === 'ANALYZING' ? 'Analizando…' : 'Procesando versión'} /> : null}
        {mode === 'FULL' && !fullPolicyReady ? <Alert tone="warning" title="Política de campos no disponible">{fieldPolicyError ?? 'Cargando la política efectiva de este taller…'}{fieldPolicyError ? <Button size="compact" onClick={() => void refreshFieldPolicy()}>Reintentar</Button> : null}</Alert> : null}
        {(mode === 'COMPACT' || fullPolicyReady) ? <section id="bulk-catalog-grid" className={`${styles.gridRegion} ${gridlinesVisible ? styles.gridlines : ''}`} aria-label="Editor tabular del catálogo" hidden={!gridExpanded}>
          <div ref={headerScrollRef} className={styles.headerScroll}><div ref={(node) => applyBulkCatalogGrid(node, { columns: gridTemplateColumns, width: gridWidth })} className={styles.gridHeader}><span>#</span>{activeColumns.map((column) => <strong key={column} aria-label={requiredColumns.has(column) ? `${labels[column]} obligatorio` : labels[column]}>{labels[column]}{requiredColumns.has(column) ? <span aria-hidden="true"> *</span> : null}<button type="button" className={styles.columnResizer} aria-label={`Cambiar ancho de ${labels[column]}`} title="Arrastra para cambiar ancho; doble clic para ajuste automático" onPointerDown={(event) => beginResize(event, column)} onDoubleClick={() => autoFit(column)} onKeyDown={(event) => { if (!['ArrowLeft', 'ArrowRight'].includes(event.key)) return; event.preventDefault(); setColumnWidths((value) => resizeColumnWidth(value, column, value[column] + (event.key === 'ArrowRight' ? 12 : -12)) as Record<Column, number>); }} /></strong>)}</div></div>
          <div ref={viewportRef} className={styles.viewport} onScroll={(event) => { setScrollTop(event.currentTarget.scrollTop); if (headerScrollRef.current) headerScrollRef.current.scrollLeft = event.currentTarget.scrollLeft; }}><div ref={(node) => applyBulkCatalogCanvas(node, { width: gridWidth, height: rows.length * rowHeight })} className={styles.canvas}><div ref={(node) => applyBulkCatalogOffset(node, first * rowHeight)} className={styles.visibleRows}>{visible.map((row, offset) => { const rowIndex = first + offset; const rowIsActive = active.row === rowIndex; return <div key={rowIndex} ref={(node) => applyBulkCatalogGrid(node, { columns: gridTemplateColumns, width: gridWidth })} className={styles.gridRow}><div className={styles.rowHeader}><span>{rowIndex + 1}</span>{rowIsActive && editableGridActionsVisible && rows.length > 1 ? <button type="button" className={styles.rowRemove} aria-label={`Quitar fila ${rowIndex + 1}`} title={`Quitar fila ${rowIndex + 1}`} onClick={removeActiveDraftRow}><Trash2 size={14} aria-hidden="true" /></button> : null}</div>{activeColumns.map((column, columnIndex) => {
            const selected = selection && rowIndex >= selection.firstRow && rowIndex <= selection.lastRow && columnIndex >= selection.firstColumn && columnIndex <= selection.lastColumn; const isActive = active.row === rowIndex && active.column === columnIndex;
            const invalid = cellIssue(rowIndex, column); const errorId = invalid ? `bulk-cell-error-${rowIndex}-${column}` : undefined;
            const focus = (): void => { setActive({ row: rowIndex, column: columnIndex }); editOriginal.current = { row: rowIndex, column, value: row[column] }; setSelection(null); };
            return <div key={column} data-cell-shell={`${rowIndex}:${columnIndex}`} className={`${styles.cell} ${selected ? styles.selectedRange : ''} ${isActive ? styles.activeCell : ''} ${invalid ? styles.invalidCell : ''}`}>
              {column === 'kind' ? <Select data-cell={`${rowIndex}:${columnIndex}`} data-cell-key={`${rowIndex}:${column}`} aria-label={`${labels[column]} fila ${rowIndex + 1}`} aria-invalid={Boolean(invalid)} aria-describedby={errorId} disabled={current?.lifecycle === 'INGESTED'} value={row.kind} onFocus={focus} onKeyDown={(event) => navigate(event, rowIndex, columnIndex)} onChange={(event) => updateCell(rowIndex, column, event.target.value)}><option value="">Tipo…</option><option value="PART">Refacción</option><option value="PRODUCT">Producto</option><option value="SERVICE">Servicio</option><option value="SUPPLY">Insumo</option></Select> : <><Input data-cell={`${rowIndex}:${columnIndex}`} data-cell-key={`${rowIndex}:${column}`} aria-label={`${labels[column]} fila ${rowIndex + 1}`} aria-invalid={Boolean(invalid)} aria-describedby={errorId} disabled={current?.lifecycle === 'INGESTED'} value={row[column]} onFocus={focus} onPaste={(event) => paste(event, rowIndex, columnIndex)} onKeyDown={(event) => navigate(event, rowIndex, columnIndex)} onBlur={column === 'brand' ? () => commitBrand(rowIndex) : undefined} onChange={(event) => updateCell(rowIndex, column, event.target.value)} />{column === 'title' && row.supplierObservedTitle && row.supplierObservedTitle !== row.title ? <small className={styles.observedTitle} title={row.supplierObservedTitle}>Original: {row.supplierObservedTitle}</small> : null}{column === 'brand' && row.supplierObservedBrand && row.supplierObservedBrand !== row.brand ? <small className={styles.observedTitle} title={row.supplierObservedBrand}>Original: {row.supplierObservedBrand}</small> : null}</>}
              {invalid ? <span id={errorId} className={styles.cellErrorMarker} title={invalid.message}><span className={styles.srOnly}>{invalid.message}</span><span aria-hidden="true">!</span></span> : null}
              {isActive && current?.lifecycle !== 'INGESTED' ? <button type="button" className={styles.fillHandle} aria-label={`Rellenar desde ${labels[column]} fila ${rowIndex + 1}`} title="Arrastra para copiar el valor" onPointerDown={beginFill} /> : null}
            </div>;
          })}</div>; })}</div></div></div>
        </section> : null}
        <span className={styles.srOnly} aria-live="polite">{selection ? `Selección: filas ${selection.firstRow + 1} a ${selection.lastRow + 1}, columnas ${selection.firstColumn + 1} a ${selection.lastColumn + 1}.` : ''}</span>
        {counts ? <section className={styles.summary}>{Object.entries(counts).map(([key, value]) => <div key={key}><strong>{value}</strong><span>{statusLabels[key as keyof typeof statusLabels]}</span></div>)}</section> : null}
        {current?.lifecycle === 'INGESTED' ? <section className={styles.coverage} aria-labelledby="supplier-coverage-title">
          <div className={styles.coverageHeader}><h2 id="supplier-coverage-title"><GitCompare size={18} />Cobertura del proveedor</h2><span>{current.completeness === 'COMPLETE' ? 'Lista completa' : 'Actualización parcial'}</span></div>
          {current.absenceBaseline.status === 'NOT_APPLICABLE' ? <><div className={styles.coverageCounts}><div><strong>{current.rowCount.toLocaleString('es-MX')}</strong><span>artículos procesados</span></div></div><p>Los artículos que no fueron incluidos no se evaluaron.</p></> : null}
          {current.absenceBaseline.status === 'NO_BASELINE' ? <><div className={styles.coverageCounts}><div><strong>{current.rowCount.toLocaleString('es-MX')}</strong><span>filas recibidas</span></div></div><p>No existe una lista completa anterior aplicada para evaluar cobertura.</p></> : null}
          {current.absenceBaseline.status === 'EVALUATED' ? <>
            <div className={styles.coverageCounts}>
              <div><strong>{current.absenceBaseline.currentCount.toLocaleString('es-MX')}</strong><span>filas recibidas</span></div>
              <div className={current.absenceBaseline.additionalItems.length > 0 ? styles.coverageAttention : undefined}><strong>{current.absenceBaseline.additionalCount?.toLocaleString('es-MX')}</strong><span>adicionales respecto a la lista anterior</span></div>
              <div className={current.absenceBaseline.notObservedItems.length > 0 ? styles.coverageAttention : undefined}><strong>{current.absenceBaseline.notObservedCount?.toLocaleString('es-MX')}</strong><span>ya no aparecen en esta lista completa</span></div>
              <div className={styles.coverageAuditMetric}><strong>{current.absenceBaseline.continuedCount?.toLocaleString('es-MX')}</strong><span>continúan desde la lista anterior</span></div>
            </div>
            <p>Cobertura frente a {current.sourceName} v{current.absenceBaseline.sequenceNumber}, última lista completa aplicada.</p>
            <p>Esta comparación sólo describe lo recibido del proveedor. No desactiva artículos de SR Taller.</p>
            {current.absenceBaseline.plausibility.status === 'REVIEW_REQUIRED' ? <Alert tone="warning" title="Lista completa mucho más pequeña que la referencia anterior">Referencia anterior: {current.absenceBaseline.plausibility.baselineCount?.toLocaleString('es-MX')} artículos. Lista actual: {current.absenceBaseline.plausibility.currentCount.toLocaleString('es-MX')}. {current.absenceBaseline.plausibility.notObservedCount?.toLocaleString('es-MX')} ya no aparecen. Aplicarla no desactiva artículos, pero la convertirá en la nueva referencia completa del proveedor.</Alert> : null}
            <div className={styles.coverageActions}>
              {current.absenceBaseline.additionalItems.length > 0 ? <div className={styles.coverageChange}><div><strong>Cambio detectado</strong><span>{current.absenceBaseline.additionalItems.length.toLocaleString('es-MX')} adicional{current.absenceBaseline.additionalItems.length === 1 ? '' : 'es'} respecto a {current.sourceName} v{current.absenceBaseline.sequenceNumber}</span></div><Button size="compact" aria-expanded={additionalOpen} aria-controls={additionalPanelId} onClick={() => setAdditionalOpen((value) => !value)}>{additionalOpen ? 'Ocultar adicional' : 'Ver adicional'}</Button></div> : null}
              {additionalOpen ? <ul id={additionalPanelId} className={styles.coverageItems}>{current.absenceBaseline.additionalItems.map((item, index) => <li key={`${item.itemId ?? coverageItemTitle(item)}-${index}`}><strong>{coverageItemTitle(item)}</strong><span>{coverageItemContext(item)}</span></li>)}</ul> : null}
              {current.absenceBaseline.notObservedItems.length > 0 ? <div className={styles.coverageChange}><div><strong>Cambio detectado</strong><span>{current.absenceBaseline.notObservedItems.length.toLocaleString('es-MX')} ya no aparece{current.absenceBaseline.notObservedItems.length === 1 ? '' : 'n'} en esta lista completa</span></div><Button size="compact" aria-expanded={notObservedOpen} aria-controls={notObservedPanelId} onClick={() => setNotObservedOpen((value) => !value)}>{notObservedOpen ? 'Ocultar' : `Ver ${current.absenceBaseline.notObservedItems.length.toLocaleString('es-MX')} que ya no aparece${current.absenceBaseline.notObservedItems.length === 1 ? '' : 'n'}`}</Button></div> : null}
              {notObservedOpen ? <ul id={notObservedPanelId} className={styles.coverageItems}>{current.absenceBaseline.notObservedItems.map((item, index) => <li key={`${item.itemId ?? coverageItemTitle(item)}-${index}`}><strong>{coverageItemTitle(item)}</strong><span>{coverageItemContext(item)} · Observado en {current.sourceName} v{current.absenceBaseline.sequenceNumber}</span></li>)}</ul> : null}
              {current.absenceBaseline.continuedItems.length > 0 ? <div className={styles.coverageAuditAction}><Button size="compact" tone="quiet" aria-expanded={continuedOpen} aria-controls={continuedPanelId} onClick={() => setContinuedOpen((value) => !value)}>{continuedOpen ? 'Ocultar continuaciones' : `Ver ${current.absenceBaseline.continuedItems.length.toLocaleString('es-MX')} que continúan`}</Button></div> : null}
              {continuedOpen ? <ul id={continuedPanelId} className={styles.coverageItems}>{current.absenceBaseline.continuedItems.map((item, index) => <li key={`${item.itemId ?? coverageItemTitle(item)}-${index}`}><strong>{coverageItemTitle(item)}</strong><span>{coverageItemContext(item)}</span></li>)}</ul> : null}
            </div>
          </> : null}
        </section> : null}
        {current && requiredAttentionRows.length > 0 ? <section className={styles.requiredValueAttention} aria-labelledby="required-effective-values-title">
          <div><h2 id="required-effective-values-title">Faltan datos obligatorios</h2><p>{requiredAttentionRows.length.toLocaleString('es-MX')} {requiredAttentionRows.length === 1 ? 'fila requiere' : 'filas requieren'} atención antes de aplicar. Se identificaron {missingRequiredFieldCounts.size.toLocaleString('es-MX')} {missingRequiredFieldCounts.size === 1 ? 'campo' : 'campos'} obligatorio{missingRequiredFieldCounts.size === 1 ? '' : 's'}.</p></div>
          <ul>{[...missingRequiredFieldCounts.entries()].map(([field, count]) => <li key={field}>{field === 'cost' && !canReadCost ? 'Dato protegido' : labels[field]} <strong>{count.toLocaleString('es-MX')}</strong></li>)}</ul>
          {current.lifecycle === 'DRAFT' && mode === 'FULL' ? <Button size="compact" tone="primary" onClick={completeRequiredValues}>Completar datos faltantes</Button> : <p className={styles.requiredValueHint}>Completa los datos de la lista y vuelve a analizar con la política actual.</p>}
        </section> : null}
        {current?.lifecycle === 'INGESTED' ? <section className={styles.decisions}>
          <div className={styles.decisionTitle}><h2>{current.batch.lifecycle === 'APPLIED' ? 'Resultado aplicado' : 'Reconciliación'}</h2><span>{current.batch.lifecycle === 'APPLIED' ? 'Lote aplicado' : `${resolvedDecisionUnits} resueltas · ${unresolvedDecisionUnits} requieren tu atención`}</span></div>
          <div className={styles.reconciliationTabs} role="tablist" aria-label="Vistas de reconciliación">
            <button type="button" role="tab" aria-selected={reconciliationView === 'ATTENTION'} onClick={() => setReconciliationView('ATTENTION')}>Requieren atención <strong>{unresolvedDecisionUnits}</strong></button>
            <button type="button" role="tab" aria-selected={reconciliationView === 'RESOLVED'} onClick={() => setReconciliationView('RESOLVED')}>Resueltas <strong>{resolvedDecisionUnits}</strong></button>
            <button type="button" role="tab" aria-selected={reconciliationView === 'ALL'} onClick={() => setReconciliationView('ALL')}>Todas <strong>{allDecisionUnits}</strong></button>
          </div>
          {exactDuplicateCount > 0 ? <div className={styles.allResolved} role="status"><strong>{exactDuplicateCount.toLocaleString('es-MX')} fila{exactDuplicateCount === 1 ? '' : 's'} duplicada{exactDuplicateCount === 1 ? '' : 's'} fue{exactDuplicateCount === 1 ? '' : 'ron'} consolidada{exactDuplicateCount === 1 ? '' : 's'}.</strong><span>Las filas recibidas se conservan como evidencia; sólo una observación efectiva continúa hacia Catalog.</span></div> : null}
          {current.batch.lifecycle === 'APPLIED' ? <div className={styles.allResolved} role="status"><strong>Lote aplicado</strong><span>{current.rows.length.toLocaleString('es-MX')} filas fueron procesadas correctamente.</span><small>{appliedResultSummary(current.batch.counts, excluded)}</small></div> : unresolved === 0 && reconciliationView === 'ATTENTION' ? <div className={styles.allResolved} role="status"><strong>Todo resuelto</strong><span>{resolved.toLocaleString('es-MX')} filas están listas para aplicar.</span><small>No necesitas revisar cada fila. Resueltas y Todas permanecen disponibles para auditoría.</small></div> : null}
          {current.batch.lifecycle !== 'APPLIED' && (compatibleSuggestionCount > 0 || blockedRowCount > 0) ? <div className={styles.groupActions}>{compatibleSuggestionCount > 0 ? <Button size="compact" tone="primary" onClick={() => void resolveGroup(['NEW', 'UPDATE', 'REACTIVATE', 'UNCHANGED'], 'APPLY')} disabled={busy}>Aceptar {compatibleSuggestionCount.toLocaleString('es-MX')} {compatibleSuggestionCount === 1 ? 'sugerencia' : 'sugerencias'}</Button> : null}{blockedRowCount > 0 ? <Button size="compact" onClick={() => void resolveGroup(['AMBIGUOUS', 'CONFLICT', 'INVALID'], 'EXCLUDE')} disabled={busy}>Excluir {blockedRowCount.toLocaleString('es-MX')} {blockedRowCount === 1 ? 'bloqueada' : 'bloqueadas'}</Button> : null}</div> : null}
          {visibleDuplicateResolutionGroups.map((group) => { const comparison = duplicateComparisonFields(group.members, canReadCost); const leader = group.members[0]!; const duplicateWinnerAvailable = canPrepareBulk && canChooseDuplicateWinner(group.members); const detailsId = `duplicate-details-${leader.rowDecisionId}`; const detailsOpen = Boolean(duplicateDetailsOpen[group.key]); return <section key={group.key} className={`${styles.duplicateResolutionCard} ${group.unresolved ? styles.duplicateResolutionPending : styles.duplicateResolutionResolved}`}>
            {group.unresolved ? <><div className={styles.duplicateResolutionHeading}><div><strong>Artículo repetido con datos diferentes</strong><span>{leader.targetTitle ?? leader.proposal.title ?? leader.supplierObservedTitle ?? 'Artículo reconocido'}</span><small>Encontramos este artículo {group.members.length === 2 ? '2 veces' : `${group.members.length} veces`} en la misma lista. Elige cuál fila quieres usar.</small></div></div>
              {comparison.length > 0 ? <div className={styles.duplicateComparison} style={{ gridTemplateColumns: `minmax(6rem, auto) repeat(${group.members.length}, minmax(0, 1fr))` }}><span /><>{group.members.map((member) => <strong key={member.rowDecisionId}>Fila {member.rowNumber}</strong>)}</>{comparison.map((field) => <><span key={`${field.field}-label`}>{field.label}</span>{field.values.map((value, index) => <strong key={`${field.field}-${group.members[index]!.rowDecisionId}`}>{value}</strong>)}</>)}</div> : null}
              <div className={styles.duplicateMemberActions} style={{ gridTemplateColumns: `minmax(6rem, auto) repeat(${group.members.length}, minmax(0, 1fr))` }} aria-label="Acciones por fila duplicada"><span aria-hidden="true" />{group.members.map((member) => <div key={member.rowDecisionId}>{current.batch.lifecycle !== 'APPLIED' && duplicateWinnerAvailable ? <Button size="compact" tone="primary" disabled={busy} aria-label={`Usar fila ${member.rowNumber}`} onClick={() => void chooseDuplicateRow(member)}>Usar fila {member.rowNumber}</Button> : null}<Button size="compact" tone="quiet" aria-label={`Ir a fila ${member.rowNumber}`} onClick={() => navigateToSourceRow(member, null)}>Ir a fila {member.rowNumber}</Button></div>)}</div>
              <Button size="compact" tone="quiet" aria-expanded={detailsOpen} aria-controls={detailsId} onClick={() => setDuplicateDetailsOpen((value) => ({ ...value, [group.key]: !detailsOpen }))}>Ver detalles</Button>
              {detailsOpen ? <div id={detailsId} className={styles.duplicateDetails}>{group.members.map((member) => <div key={member.rowDecisionId}><strong>Fila {member.rowNumber}</strong><span>Título original: {member.supplierObservedTitle ?? member.proposal.title ?? 'sin título'}</span><span>Tipo: {member.proposal.kind ?? 'sin cambio'} · Categoría: {member.proposal.category ?? 'sin cambio'} · Marca: {member.proposal.brand ?? 'sin cambio'}</span><span>Costo: {formatDuplicateValue('cost', member, canReadCost) ?? 'no disponible'} · Precio: {formatDuplicateValue('price', member, canReadCost) ?? 'sin cambio'}</span></div>)}</div> : null}
            </> : <><strong>Duplicado resuelto</strong><span>Se usará la fila {group.members.find((member) => member.decision !== 'EXCLUDE')?.rowNumber ?? leader.rowNumber}. Las demás se ignorarán en este lote.</span><div className={styles.duplicateChoices} aria-label="Inspeccionar filas duplicadas resueltas">{group.members.map((member) => <Button key={`navigate-${member.rowDecisionId}`} size="compact" tone="quiet" aria-label={`Ir a fila ${member.rowNumber}`} onClick={() => navigateToSourceRow(member, null)}>Ir a fila {member.rowNumber}</Button>)}</div><Button size="compact" tone="quiet" aria-expanded={detailsOpen} aria-controls={detailsId} onClick={() => setDuplicateDetailsOpen((value) => ({ ...value, [group.key]: !detailsOpen }))}>Ver detalles</Button>{detailsOpen ? <div id={detailsId} className={styles.duplicateDetails}>{group.members.map((member) => <div key={member.rowDecisionId}><strong>Fila {member.rowNumber}</strong><span>{member.decision === 'EXCLUDE' ? 'Ignorada en este lote' : 'Fila elegida para este lote'}</span></div>)}</div> : null}</>}
          </section>; })}
          {reviewRows.slice(0, 100).map((row) => <article key={row.rowDecisionId}>
            <div>
              <strong>Fila {row.rowNumber} · {statusLabels[row.classification]}</strong>
              <span>{row.proposal.title ?? row.proposal.supplierItemCode ?? row.proposal.sku ?? row.proposal.barcode ?? 'Sin identidad'}{row.targetTitle ? ` → ${row.targetTitle}` : ''}</span>
              {row.classification === 'PENDING_REFERENCE' && correctionFieldForRow(row) ? <small className={styles.correctionPrompt}>{labels[correctionFieldForRow(row)!]} requiere revisión. Recibimos: {correctionValue(row, correctionFieldForRow(row)! ) || 'sin valor'}.</small> : null}
              {row.before ? <small>Actual: {row.before.kind} · {row.before.category ?? 'sin categoría'} · {row.before.brand ?? 'sin marca'} · estado {row.before.status === 'INACTIVE' ? 'Inactivo' : 'Activo'} · precio {row.before.basePriceMinor === null ? 'ausente' : fromMinor(row.before.basePriceMinor)}{canReadCost ? ` · costo ${row.before.referenceCostMinor === null ? 'ausente' : fromMinor(row.before.referenceCostMinor)}` : ''}</small> : <small>Actual: artículo nuevo; todavía no existe en Catalog.</small>}
              <small>Propuesta: {row.proposal.kind ?? 'tipo sin cambio'} · {row.proposal.category ?? 'categoría sin cambio'} · {row.proposal.brand ?? 'marca sin cambio'} · estado {row.classification === 'REACTIVATE' ? 'Reactivar' : 'sin cambio'} · precio {row.proposal.basePriceMinor === null ? 'sin cambio' : fromMinor(row.proposal.basePriceMinor)}{canReadCost ? ` · costo ${row.proposal.referenceCostMinor === null ? 'sin cambio' : fromMinor(row.proposal.referenceCostMinor)}` : ''}</small>
              {row.decision !== 'EXCLUDE' && row.titleDecision ? <small className={styles.titleDecisionSummary}>Nombre al aplicar: {row.titleDecision === 'ADOPT_OBSERVED' ? `usar “${row.proposal.title ?? ''}”` : `mantener “${row.targetTitle ?? row.before?.title ?? ''}”`}</small> : null}
              {row.warnings.map(warningMessage).filter((message): message is string => message !== null).map((message) => <small key={message}>{message}</small>)}
              {rowErrors(row.errors).map((code) => analysisMessage(code, canReadCost)).filter((message): message is string => message !== null).map((message) => <small key={message}>{message}</small>)}
              {row.candidates.map((candidate) => <section key={candidate.itemId} className={styles.candidateCard}>
                <strong>{candidate.title}</strong><span>{candidate.status === 'INACTIVE' ? 'Inactivo' : 'Activo'} · score de presentación {Math.round(candidate.score * 100)}%</span>
                <small>Evidencia: {candidate.evidence.join(' · ')}</small>
                <small>Diferencias: {candidate.differences.length ? candidate.differences.join(' · ') : 'ninguna'}</small>
                {candidate.contradictions.length ? <small>Contradicciones: {candidate.contradictions.join(' · ')}</small> : null}
                {current.batch.lifecycle !== 'APPLIED' ? <Button size="compact" tone="primary" onClick={() => chooseCandidateTitle(row, candidate)}>Mismo artículo</Button> : null}
              </section>)}
              {['CONFLICT', 'INVALID'].includes(row.classification) && !row.errors.includes('DUPLICATE_VALUE_CONTRADICTION') ? <label>
                Artículo canónico para corregir mapping
                <Input aria-label={`Artículo canónico fila ${row.rowNumber}`} placeholder="UUID del artículo existente" value={mappingTargets[row.rowDecisionId] ?? ''} onChange={(event) => setMappingTargets((value) => ({ ...value, [row.rowDecisionId]: event.target.value }))} />
              </label> : null}
            </div>
            {current.batch.lifecycle !== 'APPLIED' ? <div>{canPrepareBulk && correctionFieldForRow(row) && row.decision === 'UNRESOLVED' ? <Button size="compact" tone="primary" disabled={busy} aria-label={`Corregir fila ${row.rowNumber}`} onClick={() => void startCorrection(row)}>Corregir fila</Button> : <Button size="compact" tone="quiet" aria-label={`Ir a fila ${row.rowNumber}`} onClick={() => navigateToSourceRow(row)}>Ir a fila</Button>}{row.decision === 'EXCLUDE' ? <><small className={styles.excludedState}>Excluida del lote</small><Button size="compact" tone="primary" onClick={() => void resolve(row.rowDecisionId, row.version, 'APPLY')}>Volver a incluir</Button></> : <>{row.decision === 'APPLY' ? <>{row.targetItemId && row.targetTitle && row.proposal.title && row.targetTitle !== row.proposal.title && row.classification !== 'CANDIDATE' && row.classification !== 'AMBIGUOUS' ? <Button size="compact" onClick={() => chooseCandidateTitle(row, { itemId: row.targetItemId!, title: row.targetTitle! })}>Cambiar nombre</Button> : null}<Button size="compact" tone="quiet" onClick={() => void resolve(row.rowDecisionId, row.version, 'EXCLUDE')}>Excluir del lote</Button></> : <>{row.classification === 'CANDIDATE' ? <Button size="compact" tone="primary" onClick={() => void resolve(row.rowDecisionId, row.version, 'APPLY')}>Artículo nuevo</Button> : null}{['CONFLICT', 'INVALID'].includes(row.classification)
              ? !row.errors.includes('DUPLICATE_VALUE_CONTRADICTION') ? <Button size="compact" tone="primary" disabled={!mappingTargets[row.rowDecisionId]?.trim()} onClick={() => void resolve(row.rowDecisionId, row.version, 'APPLY', mappingTargets[row.rowDecisionId]!.trim())}>Corregir mapping</Button> : null
              : row.classification !== 'CANDIDATE' && row.classification !== 'AMBIGUOUS' ? <Button size="compact" tone="primary" onClick={() => void resolve(row.rowDecisionId, row.version, 'APPLY')}>Incluir</Button> : null}<Button size="compact" tone="quiet" onClick={() => void resolve(row.rowDecisionId, row.version, 'EXCLUDE')}>Excluir del lote</Button></>}</>}</div> : null}
          </article>)}
        </section> : null}
        {current?.batch.lifecycle === 'APPLIED' && canBulkRetire ? <section className={styles.batchSecondaryActions} aria-labelledby="batch-secondary-actions-title"><div><h2 id="batch-secondary-actions-title">Acciones del lote</h2><p>Herramientas secundarias para el resultado ya aplicado.</p></div><Button size="compact" tone="quiet" onClick={() => void planCreatedBatchRetirement()} disabled={busy}><ArchiveX size={17} />Retirar artículos creados por este lote</Button></section> : null}
        {current ? <section className={styles.comparison}><h2><Button size="compact" tone="quiet" aria-expanded={comparisonOpen} aria-controls={comparisonPanelId} onClick={() => setComparisonOpen((value) => !value)}><GitCompare size={18} />Comparación histórica</Button></h2>{comparisonOpen ? <div id={comparisonPanelId} className={styles.comparisonPanel}><p>Compara manualmente esta versión con otra anterior.</p><div><Select value={compareId} onChange={(event) => setCompareId(event.target.value)}><option value="">Versión anterior…</option>{comparisonCandidates.map((value) => <option key={value.versionId} value={value.versionId}>v{value.sequenceNumber}{value.description ? ` · ${value.description}` : ''}</option>)}</Select><Button size="compact" onClick={() => void compareVersions()} disabled={!compareId}>Comparar</Button></div>{compare ? <p>Mapeadas {compare.mapped} · Cambiadas {compare.changed} · Nuevas {compare.added} · {compare.absenceStatus === 'EVALUATED' ? `No observados ${compare.notObserved ?? 0} · ` : 'Ausencias no evaluadas · '}Ambiguas {compare.ambiguous}</p> : null}</div> : null}</section> : null}
        {!current && rows.length === 1 ? <EmptyState title="Pega tu lista para comenzar" description="Google Sheets: copia un rectángulo y pégalo en la primera celda. Nada toca Catalog hasta Aplicar lote." /> : null}
        </> : <section className={styles.emptyWorkspace} aria-labelledby="bulk-empty-workspace-title"><Columns3 size={20} aria-hidden="true" /><div><h2 id="bulk-empty-workspace-title">Selecciona una versión para revisarla</h2><p>Usa Fuentes y versiones para consultar una carga anterior o iniciar una nueva.</p></div></section>}
      </main>
    </div>
    <Dialog open={supplierGateOpen} size="wide" title="Nueva carga" description="Elige el proveedor y qué contiene esta carga antes de pegar datos." restoreFocusSelector={`#${supplierGateRestoreTarget}`} onClose={() => { if (!busy) setSupplierGateOpen(false); }} footer={<div className={styles.supplierGateActions}><Button onClick={() => setSupplierGateOpen(false)}>Cancelar</Button><Button tone="primary" disabled={!canContinueNewLoadGate({ supplierId: supplierGateSupplierId, completeness: supplierGateCompleteness })} onClick={continueNewLoad}>Continuar</Button></div>}>
      <div className={styles.supplierGate}>
        <section className={`${styles.supplierGatePanel} ${styles.supplierGateSupplierPanel}`} aria-labelledby="new-load-supplier-title">
          <div className={styles.supplierGatePanelHeading}><span aria-hidden="true">1</span><div><h3 id="new-load-supplier-title">Proveedor</h3><p>¿De qué proveedor es esta lista?</p></div></div>
          <label className={styles.supplierGateSearch}>Buscar proveedor<Input autoFocus type="search" value={supplierSearch} placeholder="Buscar proveedor..." onChange={(event) => setSupplierSearch(event.target.value)} /></label>
          <div className={styles.supplierGateList} role="list" aria-label="Proveedores disponibles">
            {visibleSupplierSources.map((source) => <button type="button" key={source.sourceId} aria-pressed={supplierGateSupplierId === source.sourceId} className={supplierGateSupplierId === source.sourceId ? styles.selectedSupplierGateSource : ''} onClick={() => setSupplierGateSupplierId(source.sourceId)}><span><strong>{source.name}</strong><small>{source.versionCount.toLocaleString('es-MX')} {source.versionCount === 1 ? 'versión' : 'versiones'}</small></span><small>{supplierGateSupplierId === source.sourceId ? 'Seleccionado' : source.status === 'ACTIVE' ? 'Disponible' : source.status}</small></button>)}
            {visibleSupplierSources.length === 0 ? <p role="status">No hay proveedores que coincidan con la búsqueda.</p> : null}
          </div>
          <Button className={styles.createSupplierInGate} tone="quiet" onClick={() => openNewSource('GATE')}><Plus size={16} />Crear nuevo proveedor</Button>
        </section>
        <section className={`${styles.supplierGatePanel} ${styles.supplierGateIntentPanel}`} aria-labelledby="new-load-intent-title">
          <div className={styles.supplierGatePanelHeading}><span aria-hidden="true">2</span><div><h3 id="new-load-intent-title">¿Qué contiene esta carga?</h3><p>Selecciona el tipo de carga que vas a realizar.</p></div></div>
          <fieldset className={styles.loadIntentChoices}><legend className={styles.srOnly}>¿Qué contiene esta carga?</legend>{NEW_LOAD_INTENTS.map((intent) => <label key={intent.value} className={supplierGateCompleteness === intent.value ? styles.selectedLoadIntent : ''}><input type="radio" name="new-load-intent" value={intent.value} checked={supplierGateCompleteness === intent.value} onChange={() => setSupplierGateCompleteness(intent.value as SupplierCatalogCompleteness)} /><span><strong>{intent.label}</strong><small>{intent.description}</small></span></label>)}</fieldset>
          <p className={styles.supplierGateNote}>Podrás cambiar el proveedor o el tipo de carga mientras no hayas guardado la versión.</p>
        </section>
      </div>
    </Dialog>
    <Dialog open={newSourceOpen} title="Nuevo proveedor" description="Crea la fuente; la primera versión sólo se crea cuando guardes una carga." onClose={closeNewSource} footer={false}>
      <div className={styles.supplierDialog}>
        <label>Nombre del proveedor<Input autoFocus maxLength={160} value={newSourceName} onChange={(event) => setNewSourceName(event.target.value)} /></label>
        <footer><Button disabled={busy} onClick={closeNewSource}>Cancelar</Button><Button tone="primary" disabled={busy || !newSourceName.trim()} onClick={() => void addSource()}>{busy ? 'Creando…' : 'Crear proveedor'}</Button></footer>
      </div>
    </Dialog>
    <Dialog open={deleteSourceTarget !== null} title={deleteStage === 1 ? 'Eliminar proveedor' : 'Confirmar eliminación definitiva'} description="Acción sensible nivel 2" onClose={() => closeSupplierDelete()} footer={false}>
      <div className={styles.supplierDialog} onKeyDownCapture={(event) => { if (deleteStage === 1 && event.key === 'Enter') event.preventDefault(); }}>
        {deleteStage === 1 ? <>
          <Alert tone="warning" title="Eliminación permanente">Se eliminará permanentemente “{deleteSourceTarget?.name}” y sus {deleteSourceTarget?.versionCount.toLocaleString('es-MX') ?? 0} versiones. Esta acción no se puede deshacer.</Alert>
          <p>Los proveedores con versiones aplicadas, memoria de reconciliación o cualquier evidencia dependiente están bloqueados por el servidor.</p>
          <footer><Button disabled={busy} onClick={() => closeSupplierDelete()}>Cancelar</Button><Button tone="danger" disabled={busy} onClick={() => setDeleteStage(2)}>Continuar</Button></footer>
        </> : <>
          <Alert tone="warning" title={`¿Confirmas que deseas eliminar “${deleteSourceTarget?.name ?? ''}” y sus ${deleteSourceTarget?.versionCount.toLocaleString('es-MX') ?? 0} versiones?`}>CatalogItem no se elimina.</Alert>
          <label>Confirma tu PIN<Input autoFocus type="password" inputMode="numeric" autoComplete="off" maxLength={4} value={deletePin} onChange={(event) => setDeletePin(event.target.value.replace(/\D/gu, '').slice(0, 4))} /><small>Debe corresponder al mismo usuario de la sesión activa.</small></label>
          <footer><Button disabled={busy} onClick={() => closeSupplierDelete()}>Cancelar</Button><Button tone="danger" disabled={busy || !deleteArmed || deletePin.length !== 4} onClick={() => void removeSupplier()}>{busy ? 'Eliminando…' : 'Eliminar definitivamente'}</Button></footer>
        </>}
      </div>
    </Dialog>
    <Dialog open={retirementPlan !== null} title="Retirar artículos creados por este lote" description="Compensación acotada · acción sensible nivel 2" onClose={() => { if (!busy) { setRetirementPlan(null); setRetirementPin(''); } }} footer={false}>
      <div className={styles.retirementDialog}>
        <Alert tone="warning" title="No es una reversión del lote">Sólo se inactivan artículos demostrablemente CREATED por este lote. MATCHED/UPDATED, precios previos y toda la historia permanecen.</Alert>
        <dl className={styles.retirementSummary}><div><dt>CREATED activos a retirar</dt><dd>{retirementPlan?.activeCount.toLocaleString('es-MX') ?? 0}</dd></div><div><dt>CREATED ya retirados</dt><dd>{retirementPlan?.alreadyInactiveCount.toLocaleString('es-MX') ?? 0}</dd></div></dl>
        <label className={styles.reauthenticationField}>Confirma tu PIN<Input type="password" inputMode="numeric" autoComplete="off" maxLength={4} value={retirementPin} onChange={(event) => setRetirementPin(event.target.value.replace(/\D/gu, '').slice(0, 4))} /><small>Debe corresponder al mismo usuario de la sesión activa.</small></label>
        <footer className={styles.retirementActions}><Button disabled={busy} onClick={() => { setRetirementPlan(null); setRetirementPin(''); }}>Cancelar</Button><Button tone="danger" disabled={busy || retirementPin.length !== 4} onClick={() => void retireCreatedBatchItems()}>{busy ? 'Retirando…' : `Retirar ${retirementPlan?.activeCount.toLocaleString('es-MX') ?? 0} artículos`}</Button></footer>
      </div>
    </Dialog>
    <Dialog open={coverageReviewOpen} title="Confirma la lista completa" description="La cobertura actual es mucho menor que la referencia anterior" onClose={() => { if (!busy) setCoverageReviewOpen(false); }} footer={false}>
      <div className={styles.retirementDialog}>
        <Alert tone="warning" title="Esta lista completa es mucho más pequeña que la referencia anterior">Referencia anterior: {current?.absenceBaseline.plausibility.baselineCount?.toLocaleString('es-MX') ?? 0} artículos. Lista actual: {current?.absenceBaseline.plausibility.currentCount.toLocaleString('es-MX') ?? 0}. {current?.absenceBaseline.plausibility.notObservedCount?.toLocaleString('es-MX') ?? 0} ya no aparecen.</Alert>
        <p>Esto no desactivará artículos de SR Taller. Si aplicas esta versión, se convertirá en la nueva referencia completa del proveedor.</p>
        <footer className={styles.retirementActions}><Button disabled={busy} onClick={() => setCoverageReviewOpen(false)}>Cancelar</Button><Button tone="primary" disabled={busy} onClick={() => void publish(true)}>{busy ? 'Aplicando…' : 'Confirmar que es lista completa y aplicar'}</Button></footer>
      </div>
    </Dialog>
    <Dialog open={titleChoiceTarget !== null} title="¿Qué nombre quieres conservar?" description="La identidad del artículo no cambia" onClose={() => { if (!busy) setTitleChoiceTarget(null); }} footer={false}>
      <div className={styles.titleChoiceDialog}>
        <fieldset>
          <legend>Elige el título canónico que se aplicará junto con el lote</legend>
          <label className={titleChoice === 'KEEP_CURRENT' ? styles.selectedTitleChoice : ''}>
            <input autoFocus type="radio" name="catalog-title-choice" value="KEEP_CURRENT" checked={titleChoice === 'KEEP_CURRENT'} onChange={() => setTitleChoice('KEEP_CURRENT')} />
            <span><strong>Mantener nombre actual</strong><small>{titleChoiceTarget?.currentTitle}</small></span>
          </label>
          <label className={titleChoice === 'ADOPT_OBSERVED' ? styles.selectedTitleChoice : ''}>
            <input type="radio" name="catalog-title-choice" value="ADOPT_OBSERVED" checked={titleChoice === 'ADOPT_OBSERVED'} onChange={() => setTitleChoice('ADOPT_OBSERVED')} />
            <span><strong>Usar nombre recibido</strong><small>{titleChoiceTarget?.receivedTitle}</small></span>
          </label>
        </fieldset>
        <p>El otro nombre permanecerá en el historial del proveedor y podrá usarse para reconocer y buscar este artículo.</p>
        <footer><Button disabled={busy} onClick={() => setTitleChoiceTarget(null)}>Cancelar</Button><Button tone="primary" disabled={busy} onClick={() => void confirmTitleChoice()}>{busy ? 'Guardando…' : 'Confirmar decisión'}</Button></footer>
      </div>
    </Dialog>
  </div>;
}
