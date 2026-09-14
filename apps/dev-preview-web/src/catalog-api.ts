import { PreviewApiError } from './api.js';

export type CatalogItemKind = 'PART' | 'PRODUCT' | 'SERVICE' | 'SUPPLY';
export type CatalogReference = Readonly<{
  categoryId?: string; brandId?: string; name: string; status: 'ACTIVE' | 'INACTIVE';
  applicableKinds: readonly CatalogItemKind[];
  usageCount?: number; deletable: boolean; version: number; createdBy?: string | null; createdAt?: string;
  createdInBranchId?: string | null;
}>;
export type CatalogPendingCategory = Readonly<{ pendingCategoryValueId: string; rawLabel: string; normalizedKey: string; kind: CatalogItemKind; resolutionStatus: 'PENDING' | 'RESOLVED'; canonicalCategoryId: string | null; canonicalName: string | null; version: number; usageCount: number; firstSeenAt: string; lastSeenAt: string; capturedBy: string | null; capturedInBranchId: string }>;
export type CatalogPendingBrand = Readonly<{ pendingBrandValueId: string; rawLabel: string; normalizedKey: string; applicableKinds: readonly CatalogItemKind[]; resolutionStatus: 'PENDING' | 'RESOLVED'; canonicalBrandId: string | null; canonicalName: string | null; version: number; usageCount: number; firstSeenAt: string; lastSeenAt: string; capturedBy: string | null; capturedInBranchId: string }>;
export type CatalogCategoryBrandApplicability = Readonly<{ categoryId: string; brandId: string; kind: CatalogItemKind }>;
export type CatalogItem = Readonly<{
  itemId: string; kind: CatalogItemKind; title: string; description: string | null;
  category: Readonly<{ categoryId: string | null; pendingCategoryValueId: string | null; name: string; reconciliationStatus: 'CANONICAL' | 'PENDING' }>;
  brand: Readonly<{ brandId: string | null; pendingBrandValueId: string | null; name: string; reconciliationStatus: 'CANONICAL' | 'PENDING' }> | null; status: 'ACTIVE' | 'INACTIVE';
  identifiers: readonly Readonly<{ identifierId: string; scheme: string; value: string }>[];
  capabilities: Readonly<{ sellable: boolean; stockable: boolean; purchasable: boolean; applicableToRepair: boolean }>;
  version: number; createdAt: string; updatedAt: string;
}>;
export type PriceListItem = Readonly<{
  item: CatalogItem;
  price: Readonly<{ revisionId: string; amountMinor: number; currency: string; itemVersion: number; effectiveFrom: string; source: 'TENANT_BASE' | 'BRANCH_OVERRIDE' }> | null;
  referenceCost?: Readonly<{ revisionId: string; amountMinor: number; currency: string; itemVersion: number; effectiveFrom: string; sourceType: string; sourceLabel: string | null; observedAt: string }>;
}>;
export type CatalogReferences = Readonly<{
  categories: readonly CatalogReference[];
  brands: readonly CatalogReference[];
  pendingCategories: readonly CatalogPendingCategory[];
  pendingBrands: readonly CatalogPendingBrand[];
  categoryBrandApplicability: readonly CatalogCategoryBrandApplicability[];
}>;
export type CatalogReferenceMergeResult = Readonly<{
  kind: 'category' | 'brand'; survivor: CatalogReference; sourceReferenceIds: readonly string[];
  reassignedItemCount: number; reassignedReconciliationCount: number; mergedAt: string;
}>;
export type PriceListPage = Readonly<{ items: readonly PriceListItem[]; totalCount: number }>;
export type BulkCatalogMode = 'FULL' | 'COMPACT';
export type BulkCatalogClassification = 'NEW' | 'UPDATE' | 'UNCHANGED' | 'PENDING_REFERENCE' | 'AMBIGUOUS' | 'CONFLICT' | 'INVALID';
export type BulkCatalogRowInput = Readonly<{ kind: CatalogItemKind | null; title: string | null; description: string | null; category: string | null; brand: string | null; supplierItemCode: string | null; sku: string | null; barcode: string | null; basePriceMinor: number | null; referenceCostMinor: number | null }>;
export type SupplierSource = Readonly<{ sourceId: string; name: string; status: 'ACTIVE' | 'INACTIVE'; version: number }>;
export type SupplierVersion = Readonly<{ versionId: string; sourceId: string; sourceName: string; sourceRevision: string; mode: BulkCatalogMode; supersedesVersionId: string | null; columnSignature: string; lifecycle: 'DRAFT' | 'INGESTED'; version: number; rowCount: number; createdAt: string; ingestedAt: string | null; batch: Readonly<{ batchId: string; lifecycle: 'DRAFT' | 'ANALYZING' | 'RECONCILING' | 'READY' | 'APPLIED'; version: number; counts: Record<BulkCatalogClassification, number>; publishedAt: string | null }>; rows: readonly Readonly<{ rowDecisionId: string; rowNumber: number; proposal: BulkCatalogRowInput; classification: BulkCatalogClassification; decision: 'UNRESOLVED' | 'APPLY' | 'EXCLUDE'; targetItemId: string | null; targetTitle: string | null; expectedItemVersion: number | null; before: Readonly<{ kind: CatalogItemKind; title: string; description: string | null; category: string | null; brand: string | null; basePriceMinor: number | null; referenceCostMinor: number | null }> | null; preselectedByMemory: boolean; errors: readonly string[]; warnings: readonly string[]; version: number }>[] }>;
export type SupplierVersionSummary = Omit<SupplierVersion, 'rows'>;
export type SupplierVersionComparison = Readonly<{ leftVersionId: string; rightVersionId: string; mapped: number; changed: number; added: number; disappeared: number; ambiguous: number }>;

/** Mirrors Catalog's exact identity normalization; it is intentionally not fuzzy. */
export function normalizeCatalogReferenceText(value: string): string {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/gu, '').toLocaleLowerCase('es-MX')
    .replace(/\s+/gu, ' ').trim();
}

const SESSION_INVALIDATED_EVENT = 'srtaller:session-invalidated';
async function json<T>(response: Response): Promise<T> {
  if (!response.ok) {
    if (response.status === 401 || response.status === 403) window.dispatchEvent(new CustomEvent(SESSION_INVALIDATED_EVENT, { detail: { background: response.status === 403 } }));
    let payload: { code?: string; message?: string } = {};
    try { payload = await response.json() as { code?: string; message?: string }; } catch { /* response has no safe JSON body */ }
    throw new PreviewApiError(response.status, payload.message, payload.code ?? null);
  }
  try { return await response.json() as T; }
  catch { throw new PreviewApiError(0); }
}
async function get<T>(path: string, signal?: AbortSignal): Promise<T> {
  return json<T>(await fetch(path, { credentials: 'include', cache: 'no-store', headers: { Accept: 'application/json' }, signal: signal ?? null }));
}
async function mutate<T>(path: string, method: 'POST' | 'PATCH' | 'PUT' | 'DELETE', body: unknown, csrfToken: string): Promise<T> {
  return json<T>(await fetch(path, { method, credentials: 'include', cache: 'no-store', headers: { Accept: 'application/json', 'Content-Type': 'application/json', 'X-SR-CSRF-Token': csrfToken }, body: JSON.stringify(body) }));
}

export function listCatalogReferences(signal?: AbortSignal) { return get<CatalogReferences>('/api/catalog/references', signal); }
export function listCatalogAdministrationReferences(signal?: AbortSignal) { return get<CatalogReferences>('/api/catalog/administration/references', signal); }
export function searchPriceList(input: Readonly<{ query: string; kind: Exclude<CatalogItemKind, 'SUPPLY'> | ''; categoryId: string; brandId: string; page: number; includeReferenceCost: boolean }>, signal?: AbortSignal) {
  const query = new URLSearchParams({ query: input.query, page: String(input.page), pageSize: '25' });
  if (input.kind) query.set('kind', input.kind);
  if (input.categoryId) query.set('categoryId', input.categoryId);
  if (input.brandId) query.set('brandId', input.brandId);
  if (input.includeReferenceCost) query.set('includeReferenceCost', 'true');
  return get<PriceListPage>(`/api/catalog/price-list?${query.toString()}`, signal);
}
export function getCatalogItem(itemId: string, signal?: AbortSignal) { return get<CatalogItem>(`/api/catalog/items/${encodeURIComponent(itemId)}`, signal); }
export function createCatalogCategory(name: string, applicableKinds: readonly CatalogItemKind[], csrfToken: string) { return mutate<CatalogReference>('/api/catalog/categories', 'POST', { name, applicableKinds, expectedVersion: 0, clientRequestId: crypto.randomUUID() }, csrfToken); }
export function createCatalogBrand(name: string, applicableKinds: readonly CatalogItemKind[], csrfToken: string) { return mutate<CatalogReference>('/api/catalog/brands', 'POST', { name, applicableKinds, expectedVersion: 0, clientRequestId: crypto.randomUUID() }, csrfToken); }
export function updateCatalogCategory(categoryId: string, input: unknown, csrfToken: string) { return mutate<CatalogReference>(`/api/catalog/categories/${encodeURIComponent(categoryId)}`, 'PATCH', input, csrfToken); }
export function updateCatalogBrand(brandId: string, input: unknown, csrfToken: string) { return mutate<CatalogReference>(`/api/catalog/brands/${encodeURIComponent(brandId)}`, 'PATCH', input, csrfToken); }
export function deleteCatalogCategory(categoryId: string, expectedVersion: number, csrfToken: string) { return mutate(`/api/catalog/categories/${encodeURIComponent(categoryId)}`, 'DELETE', { expectedVersion, clientRequestId: crypto.randomUUID() }, csrfToken); }
export function deleteCatalogBrand(brandId: string, expectedVersion: number, csrfToken: string) { return mutate(`/api/catalog/brands/${encodeURIComponent(brandId)}`, 'DELETE', { expectedVersion, clientRequestId: crypto.randomUUID() }, csrfToken); }
export function mergeCatalogCategories(input: unknown, csrfToken: string) { return mutate<CatalogReferenceMergeResult>('/api/catalog/categories/merge', 'POST', input, csrfToken); }
export function mergeCatalogBrands(input: unknown, csrfToken: string) { return mutate<CatalogReferenceMergeResult>('/api/catalog/brands/merge', 'POST', input, csrfToken); }
export function resolveCatalogCategory(pendingCategoryValueId: string, input: unknown, csrfToken: string) { return mutate<CatalogPendingCategory>(`/api/catalog/categories/pending/${encodeURIComponent(pendingCategoryValueId)}/resolve`, 'POST', input, csrfToken); }
export function resolveCatalogBrand(pendingBrandValueId: string, input: unknown, csrfToken: string) { return mutate<CatalogPendingBrand>(`/api/catalog/brands/pending/${encodeURIComponent(pendingBrandValueId)}/resolve`, 'POST', input, csrfToken); }
export function createCatalogItem(input: unknown, csrfToken: string) { return mutate<CatalogItem>('/api/catalog/items', 'POST', input, csrfToken); }
export function updateCatalogItem(itemId: string, input: unknown, csrfToken: string) { return mutate<CatalogItem>(`/api/catalog/items/${encodeURIComponent(itemId)}`, 'PATCH', input, csrfToken); }
export function changeCatalogBasePrice(itemId: string, input: unknown, csrfToken: string) { return mutate<CatalogItem>(`/api/catalog/items/${encodeURIComponent(itemId)}/base-price`, 'POST', input, csrfToken); }
export function changeCatalogReferenceCost(itemId: string, input: unknown, csrfToken: string) { return mutate<CatalogItem>(`/api/catalog/items/${encodeURIComponent(itemId)}/reference-cost`, 'POST', input, csrfToken); }
export function setCatalogBranchPrice(itemId: string, input: unknown, csrfToken: string) { return mutate<CatalogItem>(`/api/catalog/items/${encodeURIComponent(itemId)}/branch-price`, 'PUT', input, csrfToken); }
export function revokeCatalogBranchPrice(itemId: string, input: unknown, csrfToken: string) { return mutate<CatalogItem>(`/api/catalog/items/${encodeURIComponent(itemId)}/branch-price`, 'DELETE', input, csrfToken); }
export function listSupplierSources(signal?: AbortSignal) { return get<readonly SupplierSource[]>('/api/catalog/supplier-sources', signal); }
export function createSupplierSource(name: string, csrfToken: string) { return mutate<SupplierSource>('/api/catalog/supplier-sources', 'POST', { name }, csrfToken); }
export function listSupplierVersions(sourceId?: string, signal?: AbortSignal) { const query = sourceId ? `?sourceId=${encodeURIComponent(sourceId)}` : ''; return get<readonly SupplierVersionSummary[]>(`/api/catalog/supplier-versions${query}`, signal); }
export function getSupplierVersion(versionId: string, includeReferenceCost: boolean, signal?: AbortSignal) { return get<SupplierVersion>(`/api/catalog/supplier-versions/${encodeURIComponent(versionId)}?includeReferenceCost=${includeReferenceCost}`, signal); }
export function createSupplierDraft(input: unknown, csrfToken: string) { return mutate<SupplierVersion>('/api/catalog/supplier-versions', 'POST', input, csrfToken); }
export function replaceSupplierDraft(versionId: string, input: unknown, csrfToken: string) { return mutate<SupplierVersion>(`/api/catalog/supplier-versions/${encodeURIComponent(versionId)}/draft`, 'PUT', input, csrfToken); }
export function analyzeSupplierVersion(versionId: string, expectedVersion: number, includeReferenceCost: boolean, csrfToken: string) { return mutate<SupplierVersion>(`/api/catalog/supplier-versions/${encodeURIComponent(versionId)}/analyze`, 'POST', { expectedVersion, includeReferenceCost }, csrfToken); }
export function decideSupplierRow(versionId: string, rowDecisionId: string, input: unknown, csrfToken: string) { return mutate<SupplierVersion>(`/api/catalog/supplier-versions/${encodeURIComponent(versionId)}/rows/${encodeURIComponent(rowDecisionId)}`, 'PUT', input, csrfToken); }
export function decideSupplierRows(versionId: string, input: unknown, csrfToken: string) { return mutate<SupplierVersion>(`/api/catalog/supplier-versions/${encodeURIComponent(versionId)}/rows`, 'PUT', input, csrfToken); }
export function publishSupplierVersion(versionId: string, expectedVersion: number, writeReferenceCost: boolean, csrfToken: string, clientRequestId = crypto.randomUUID()) { return mutate<SupplierVersion>(`/api/catalog/supplier-versions/${encodeURIComponent(versionId)}/publish`, 'POST', { expectedVersion, writeReferenceCost, clientRequestId }, csrfToken); }
export function compareSupplierVersions(leftVersionId: string, rightVersionId: string, signal?: AbortSignal) { return get<SupplierVersionComparison>(`/api/catalog/supplier-versions/${encodeURIComponent(leftVersionId)}/compare/${encodeURIComponent(rightVersionId)}`, signal); }
