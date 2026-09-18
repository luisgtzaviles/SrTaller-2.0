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
export type SupplierCatalogCompleteness = 'PARTIAL' | 'COMPLETE';
export type BulkCatalogClassification = 'NEW' | 'UPDATE' | 'REACTIVATE' | 'UNCHANGED' | 'CANDIDATE' | 'PENDING_REFERENCE' | 'AMBIGUOUS' | 'CONFLICT' | 'INVALID';
export type BulkCatalogTitleDecision = 'KEEP_CURRENT' | 'ADOPT_OBSERVED';
export type BulkCatalogCandidateMatch = Readonly<{ itemId: string; title: string; status: 'ACTIVE' | 'INACTIVE'; expectedItemVersion: number; score: number; evidence: readonly string[]; differences: readonly string[]; contradictions: readonly string[] }>;
export type BulkCatalogRowInput = Readonly<{ kind: CatalogItemKind | null; supplierObservedTitle: string | null; title: string | null; description: string | null; category: string | null; brand: string | null; supplierItemCode: string | null; sku: string | null; barcode: string | null; basePriceMinor: number | null; referenceCostMinor: number | null }>;
export type SupplierSource = Readonly<{ sourceId: string; name: string; status: 'ACTIVE' | 'INACTIVE'; version: number; versionCount: number; deletionEligibility: Readonly<{ allowed: boolean; reason: 'SAFE_DRAFT_ONLY' | 'PUBLISHED_HISTORY' | 'DEPENDENT_HISTORY' }> }>;
export type SupplierCoverageItem = Readonly<{ itemId: string | null; canonicalTitle: string | null; observedTitle: string | null; baselineObservedTitle: string | null; coverageRelation: 'CONTINUED' | 'NOT_OBSERVED' | 'ADDITIONAL'; catalogRelation: 'NEW' | 'EXISTING' | 'UNKNOWN'; catalogStatus: 'ACTIVE' | 'INACTIVE' | null; catalogClassification: BulkCatalogClassification | null; catalogResolution: 'MATCHED' | 'CREATED' | 'EXCLUDED' | 'CONFLICT' | null }>;
export type SupplierCoveragePlausibility = Readonly<{ status: 'NORMAL' | 'REVIEW_REQUIRED'; reason: 'LARGE_COVERAGE_DROP' | null; baselineCount: number | null; currentCount: number; continuedCount: number | null; notObservedCount: number | null; additionalCount: number | null; absoluteDrop: number | null; reductionPercent: number | null }>;
export type SupplierCoverage = Readonly<{ status: 'NOT_APPLICABLE' | 'NO_BASELINE' | 'EVALUATED'; versionId: string | null; sequenceNumber: number | null; observed: number | null; notObserved: number | null; baselineCount: number | null; currentCount: number; continuedCount: number | null; notObservedCount: number | null; additionalCount: number | null; continuedItems: readonly SupplierCoverageItem[]; notObservedItems: readonly SupplierCoverageItem[]; additionalItems: readonly SupplierCoverageItem[]; plausibility: SupplierCoveragePlausibility }>;
export type SupplierVersion = Readonly<{ versionId: string; sourceId: string; sourceName: string; sequenceNumber: number; sourceRevision: string; description: string | null; mode: BulkCatalogMode; completeness: SupplierCatalogCompleteness; supersedesVersionId: string | null; columnSignature: string; lifecycle: 'DRAFT' | 'INGESTED'; version: number; rowCount: number; createdAt: string; ingestedAt: string | null; batch: Readonly<{ batchId: string; lifecycle: 'DRAFT' | 'ANALYZING' | 'RECONCILING' | 'READY' | 'APPLIED'; version: number; counts: Record<BulkCatalogClassification, number>; publishedAt: string | null }>; absenceBaseline: SupplierCoverage; rows: readonly Readonly<{ rowDecisionId: string; rowNumber: number; supplierObservedTitle: string | null; proposal: BulkCatalogRowInput; classification: BulkCatalogClassification; decision: 'UNRESOLVED' | 'APPLY' | 'EXCLUDE'; titleDecision: BulkCatalogTitleDecision | null; targetItemId: string | null; targetTitle: string | null; expectedItemVersion: number | null; before: Readonly<{ kind: CatalogItemKind; title: string; description: string | null; category: string | null; brand: string | null; status: 'ACTIVE' | 'INACTIVE'; basePriceMinor: number | null; referenceCostMinor: number | null }> | null; preselectedByMemory: boolean; matchOrigin: 'NONE' | 'INTERNAL_IDENTIFIER' | 'TRUSTED_HISTORY' | 'CANDIDATE' | 'OWNER_SELECTED'; matchAlgorithmVersion: number; candidates: readonly BulkCatalogCandidateMatch[]; errors: readonly string[]; warnings: readonly string[]; version: number }>[] }>;
export type SupplierVersionSummary = Omit<SupplierVersion, 'rows' | 'absenceBaseline'>;
export type SupplierVersionDraftInput = Readonly<{
  sourceId: string; description: string | null; mode: BulkCatalogMode; completeness: SupplierCatalogCompleteness;
  columnSignature: string; rawPayload: string; rows: readonly BulkCatalogRowInput[]; includeReferenceCost: boolean;
}>;
export type SupplierVersionComparison = Readonly<{ leftVersionId: string; rightVersionId: string; mapped: number; changed: number; added: number; ambiguous: number; absenceStatus: 'PARTIAL_CURRENT' | 'NO_PREVIOUS_COMPLETE' | 'EVALUATED'; notObserved: number | null }>;
export type CatalogRetirementPlan = Readonly<{ planId: string; scope: 'ACTIVE_CATALOG' | 'BATCH_CREATED'; batchId: string | null; sourceVersionId: string | null; activeCount: number; alreadyInactiveCount: number; expiresAt: string; status: 'PENDING' | 'EXECUTED' | 'STALE' | 'EXPIRED'; retiredCount: number | null }>;
export type CatalogRetirementExecution = Readonly<{ planId: string; scope: 'ACTIVE_CATALOG' | 'BATCH_CREATED'; retiredCount: number; activeCatalogCount: number; executedAt: string }>;
export type CatalogFieldPolicyLevel = 'REQUIRED' | 'ESSENTIAL' | 'OPTIONAL';
export type CatalogFieldPolicyKey = 'kind' | 'title' | 'description' | 'category' | 'brand' | 'supplierItemCode' | 'sku' | 'barcode' | 'referenceCost' | 'basePrice';
export type CatalogFieldPolicyRegistryEntry = Readonly<{
  key: CatalogFieldPolicyKey;
  label: string;
  allowedLevels: readonly CatalogFieldPolicyLevel[];
  domainFixed: boolean;
  defaultLevel: CatalogFieldPolicyLevel;
  capturePresentation: 'essential' | 'optional';
  referenceCostSensitive: boolean;
}>;
export type CatalogFieldPolicyResponse = Readonly<{
  schemaVersion: number;
  policyVersion: number;
  fieldLevels: Readonly<Record<CatalogFieldPolicyKey, CatalogFieldPolicyLevel>>;
  updatedAt: string | null;
  source: 'product-default' | 'tenant';
  registry: readonly CatalogFieldPolicyRegistryEntry[];
}>;

/** Mirrors Catalog's exact identity normalization; it is intentionally not fuzzy. */
export function normalizeCatalogReferenceText(value: string): string {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/gu, '').toLocaleLowerCase('es-MX')
    .replace(/\s+/gu, ' ').trim();
}

const SESSION_INVALIDATED_EVENT = 'srtaller:session-invalidated';
async function json<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let payload: { code?: string; message?: string; parameter?: string } = {};
    try { payload = await response.json() as { code?: string; message?: string; parameter?: string }; } catch { /* response has no safe JSON body */ }
    if (payload.code === 'AUTHENTICATION_REQUIRED' || payload.code === 'ACCESS_DENIED') window.dispatchEvent(new CustomEvent(SESSION_INVALIDATED_EVENT, { detail: { background: response.status === 403 } }));
    throw new PreviewApiError(response.status, payload.message, payload.code ?? null, payload.parameter ?? null);
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
export function deleteSupplierSource(sourceId: string, input: Readonly<{ expectedVersion: number; confirmation: 'DELETE_SUPPLIER_SOURCE'; pin: string; clientRequestId: string }>, csrfToken: string) { return mutate<Readonly<{ sourceId: string; sourceName: string; deletedVersionCount: number; deletedListingCount: number; deletedAt: string }>>(`/api/catalog/supplier-sources/${encodeURIComponent(sourceId)}`, 'DELETE', input, csrfToken); }
function requireSupplierVersionCompleteness<T extends Readonly<{ completeness: unknown }>>(version: T): T {
  if (version.completeness === 'PARTIAL' || version.completeness === 'COMPLETE') return version;
  throw new PreviewApiError(0, 'La respuesta de versión de proveedor no incluye un alcance válido.', 'CATALOG_RESPONSE_INVALID', 'completeness');
}
export function listSupplierVersions(sourceId?: string, signal?: AbortSignal) { const query = sourceId ? `?sourceId=${encodeURIComponent(sourceId)}` : ''; return get<readonly SupplierVersionSummary[]>(`/api/catalog/supplier-versions${query}`, signal).then((values) => values.map(requireSupplierVersionCompleteness)); }
export function getSupplierVersion(versionId: string, includeReferenceCost: boolean, signal?: AbortSignal) { return get<SupplierVersion>(`/api/catalog/supplier-versions/${encodeURIComponent(versionId)}?includeReferenceCost=${includeReferenceCost}`, signal).then(requireSupplierVersionCompleteness); }
export function createSupplierDraft(input: SupplierVersionDraftInput & Readonly<{ clientRequestId: string }>, csrfToken: string) { return mutate<SupplierVersion>('/api/catalog/supplier-versions', 'POST', input, csrfToken).then(requireSupplierVersionCompleteness); }
export function replaceSupplierDraft(versionId: string, input: SupplierVersionDraftInput & Readonly<{ expectedVersion: number }>, csrfToken: string) { return mutate<SupplierVersion>(`/api/catalog/supplier-versions/${encodeURIComponent(versionId)}/draft`, 'PUT', input, csrfToken).then(requireSupplierVersionCompleteness); }
export function analyzeSupplierVersion(versionId: string, expectedVersion: number, includeReferenceCost: boolean, csrfToken: string) { return mutate<SupplierVersion>(`/api/catalog/supplier-versions/${encodeURIComponent(versionId)}/analyze`, 'POST', { expectedVersion, includeReferenceCost }, csrfToken).then(requireSupplierVersionCompleteness); }
export function decideSupplierRow(versionId: string, rowDecisionId: string, input: unknown, csrfToken: string) { return mutate<SupplierVersion>(`/api/catalog/supplier-versions/${encodeURIComponent(versionId)}/rows/${encodeURIComponent(rowDecisionId)}`, 'PUT', input, csrfToken).then(requireSupplierVersionCompleteness); }
export function decideSupplierRows(versionId: string, input: unknown, csrfToken: string) { return mutate<SupplierVersion>(`/api/catalog/supplier-versions/${encodeURIComponent(versionId)}/rows`, 'PUT', input, csrfToken).then(requireSupplierVersionCompleteness); }
export function publishSupplierVersion(versionId: string, expectedVersion: number, writeReferenceCost: boolean, csrfToken: string, coverageReviewAcknowledged = false, clientRequestId = crypto.randomUUID()) { return mutate<SupplierVersion>(`/api/catalog/supplier-versions/${encodeURIComponent(versionId)}/publish`, 'POST', { expectedVersion, writeReferenceCost, coverageReviewAcknowledged, clientRequestId }, csrfToken).then(requireSupplierVersionCompleteness); }
export function compareSupplierVersions(leftVersionId: string, rightVersionId: string, signal?: AbortSignal) { return get<SupplierVersionComparison>(`/api/catalog/supplier-versions/${encodeURIComponent(leftVersionId)}/compare/${encodeURIComponent(rightVersionId)}`, signal); }
export function createCatalogRetirementPlan(input: Readonly<{ scope: 'ACTIVE_CATALOG' | 'BATCH_CREATED'; sourceVersionId?: string }>, csrfToken: string) { return mutate<CatalogRetirementPlan>('/api/catalog/retirement-plans', 'POST', input, csrfToken); }
export function executeCatalogRetirementPlan(planId: string, input: Readonly<{ confirmation: 'RETIRE_ACTIVE_CATALOG' | 'RETIRE_BATCH_CREATED_ITEMS'; pin: string; clientRequestId: string }>, csrfToken: string) { return mutate<CatalogRetirementExecution>(`/api/catalog/retirement-plans/${encodeURIComponent(planId)}/execute`, 'POST', input, csrfToken); }
export function getCatalogFieldPolicy(signal?: AbortSignal) { return get<CatalogFieldPolicyResponse>('/api/catalog/configuration/field-policy', signal); }
export function updateCatalogFieldPolicy(input: Readonly<{ expectedVersion: number; fieldLevels: CatalogFieldPolicyResponse['fieldLevels'] }>, csrfToken: string) { return mutate<CatalogFieldPolicyResponse>('/api/catalog/configuration/field-policy', 'PUT', input, csrfToken); }
export function restoreCatalogFieldPolicyDefaults(expectedVersion: number, csrfToken: string) { return mutate<CatalogFieldPolicyResponse>('/api/catalog/configuration/field-policy/restore-product-defaults', 'POST', { expectedVersion }, csrfToken); }
