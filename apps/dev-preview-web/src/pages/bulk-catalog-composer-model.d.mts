export type ComposerColumn = 'kind' | 'title' | 'description' | 'category' | 'brand' | 'supplierItemCode' | 'sku' | 'barcode' | 'price' | 'cost';
export type ComposerRow = Record<ComposerColumn, string> & { supplierObservedTitle: string };
export type ComposerSelection = Readonly<{ firstRow: number; lastRow: number; firstColumn: number; lastColumn: number }>;
export type ValidationIssue = Readonly<{ scope: 'BATCH' | 'CELL' | 'GLOBAL'; rowId?: string; rowIndex?: number; columnKey?: ComposerColumn; controlKey?: 'source' | 'mode'; code: string; message: string }>;

export const FULL_COLUMNS: readonly ComposerColumn[];
export const ESSENTIAL_COLUMNS: readonly ComposerColumn[];
export const COMPACT_COLUMNS: readonly ComposerColumn[];
export const DEFAULT_COLUMN_WIDTHS: Readonly<Record<ComposerColumn, number>>;
export const COLUMN_MIN_WIDTH: number;
export const COLUMN_MAX_WIDTH: number;
export function isClipboardRowEmpty(row: readonly unknown[]): boolean;
export function trimTrailingEmptyRows(matrix: readonly (readonly unknown[])[]): unknown[][];
export function parseClipboardMatrix(text: string): string[][];
export function normalizeSupplierTitle(value: string): string;
export function parseMoneyToMinor(value: string): number | null;
export function applyBatchDefaults<Row extends { kind: string; category: string; brand: string }>(row: Row, defaults: Readonly<{ kind: string; category: string; brand: string }>): Row;
export function nextGridCell(key: string, row: number, column: number, rowCount: number, columnCount: number, shiftKey?: boolean): Readonly<{ row: number; column: number }>;
export function fillRows<Row extends Record<ComposerColumn, string>>(rows: readonly Row[], columns: readonly ComposerColumn[], source: ComposerSelection, target: Readonly<{ row: number; column: number }>): Row[];
export function estimateColumnWidth(label: string, values: readonly string[], min?: number, max?: number): number;
export function sortValidationIssues(issues: readonly ValidationIssue[]): ValidationIssue[];
export function validateComposerDraft(input: Readonly<{ selectedSource: string; mode: 'FULL' | 'COMPACT'; rows: readonly Record<string, string>[] }>): ValidationIssue[];
export function hasMeaningfulComposerWork(input: Readonly<{ dirty: boolean; description: string; mode: 'FULL' | 'COMPACT'; completeness: 'PARTIAL' | 'COMPLETE'; rows: readonly Record<string, unknown>[] }>): boolean;
export function captureActionState(input: Readonly<{ lifecycle: 'DRAFT' | 'INGESTED' | null; dirty: boolean; hasMeaningfulWork: boolean }>): Readonly<{ reviewVisible: boolean; saveForLaterVisible: boolean }>;
export function filterSupplierSources<Source extends Readonly<{ name: string }>>(sources: readonly Source[], query: string): readonly Source[];
export type NewLoadIntent = 'PARTIAL' | 'COMPLETE';
export type NewLoadGateState = Readonly<{ supplierId: string | null; completeness: NewLoadIntent | null }>;
export const NEW_LOAD_INTENTS: readonly Readonly<{ value: NewLoadIntent; label: string; description: string }>[];
export function createNewLoadGateState(): NewLoadGateState;
export function canContinueNewLoadGate(state: NewLoadGateState): boolean;
export function validationIssueFromApi(error: Readonly<{ status?: number; code?: string | null; parameter?: string | null }>): ValidationIssue;
export function nextValidationIssueIndex(current: number, direction: -1 | 1, count: number): number;
export function groupDuplicateResolutionRows<Row extends Readonly<{ rowNumber: number }>>(rows: readonly Row[], keyForRow: (row: Row) => string, errorsForRow: (row: Row) => readonly string[], warningsForRow: (row: Row) => readonly string[]): readonly Readonly<{ key: string; members: readonly Row[]; unresolved: boolean }> [];
export type ReviewListOutcome<Version> =
  | Readonly<{ stage: 'SAVE_FAILED'; snapshot: null; cause: unknown }>
  | Readonly<{ stage: 'ANALYZE_FAILED'; snapshot: Version; cause: unknown }>
  | Readonly<{ stage: 'ANALYZED'; snapshot: Version; result: Version; cause: null }>;
export function orchestrateReviewList<Version>(input: Readonly<{
  snapshot: Version | null;
  persist: () => Promise<Version | null>;
  analyze: (snapshot: Version) => Promise<Version>;
}>): Promise<ReviewListOutcome<Version>>;
export function ownerSupplierClipboard(): string;
