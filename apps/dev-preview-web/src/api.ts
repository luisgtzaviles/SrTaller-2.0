export interface PreviewContext {
  readonly tenantName: string;
  readonly branchName: string;
  readonly stationLabel: string;
  readonly environment: 'DEV_PREVIEW';
}

export type RepairStatusCode =
  | 'pending'
  | 'diagnosing'
  | 'awaiting_authorization'
  | 'awaiting_part'
  | 'repairing'
  | 'reviewing'
  | 'ready'
  | 'unsuccessful'
  | 'cancelled'
  | 'delivered';

export type CustodyStatusCode = 'active' | 'ended';

export interface RepairWorklistItem {
  readonly id: string;
  readonly folio: string;
  readonly receivedAt: string;
  readonly customer: Readonly<{ name: string; phone: string | null }>;
  readonly device: Readonly<{ brand: string; model: string; label: string }>;
  readonly reportedIssue: string;
  readonly technician: Readonly<{ id: string; displayName: string }> | null;
  readonly repairStatus: Readonly<{ code: RepairStatusCode; label: string; tone: 'info' | 'warning' | 'success' | 'danger' | 'neutral' }>;
  readonly custody: Readonly<{ code: CustodyStatusCode; label: string; tone: 'neutral' }>;
}

export interface RepairWorklistResponse {
  readonly items: readonly RepairWorklistItem[];
  readonly pagination: Readonly<{
    page: number;
    pageSize: number;
    totalCount: number;
    hasNextPage: boolean;
  }>;
  readonly unfilteredCount: number;
  readonly facets: Readonly<{
    technicians: readonly Readonly<{ id: string; displayName: string }>[];
  }>;
}

export interface PreviousRepairLookupResponse {
  readonly items: readonly RepairWorklistItem[];
}

export interface RepairDetail {
  readonly id: string;
  readonly folio: string;
  readonly customer: Readonly<{ name: string; phone: string | null }>;
  readonly receivedDevice: Readonly<{
    type: string | null;
    brand: string;
    model: string;
    label: string;
    correction: Readonly<{
      version: number;
      capturedBrand: string | null;
      canonicalBrandId: string | null;
      capturedModel: string | null;
      canonicalModelId: string | null;
    }>;
    color: string | null;
    identifier: string | null;
    identifierUnavailable: boolean;
    distinctiveSigns: string | null;
    accessories: Readonly<{
      simIncluded: boolean | null;
      memoryCardIncluded: boolean | null;
      other: string | null;
    }>;
  }>;
  readonly intake: Readonly<{
    receivedAt: string;
    receivedBy: Readonly<{ id: string; displayName: string }> | null;
    reportedIssue: string | null;
    reportedProblems: readonly Readonly<{ problemCaptureId: string; categoryId: string | null; label: string; rawLabel: string; status: 'active' | 'inactive' | 'pending'; stage: 'intake' | 'post_intake' }>[];
    customerNarrative: string | null;
    physicalConditionSummary: string | null;
    documentedRiskSummary: string | null;
    acceptedInterventionRisks: readonly Readonly<{ label: string }>[];
    receivedPowerState: 'powered_on' | 'powered_off' | null;
    deviceAccessType: 'none' | 'pin' | 'password' | 'pattern' | null;
    initialBudgetAmountMinor: number | null;
    newRepairPolicyVersion: number;
    warrantyReviewRequested: boolean;
    previousRepairId: string | null;
    deliveredByName: string | null;
    estimatedDeliveryAt: string | null;
  }>;
  readonly problemClassifications: readonly Readonly<{ categoryId: string; label: string; status: 'active' | 'inactive' }>[];
  readonly currentSituation: Readonly<{
    repairStatus: Readonly<{
      code: RepairStatusCode;
      label: string;
      tone: 'info' | 'warning' | 'success' | 'danger' | 'neutral';
    }>;
    location: Readonly<{
      id: string;
      code: 'pending_area' | 'workshop';
      category: 'pending_area' | 'workshop';
      label: string;
      movedAt: string;
    }> | null;
    locationVersion: number;
    locationSource: 'history' | 'unrecorded';
    custody: Readonly<{
      code: CustodyStatusCode;
      label: string;
      tone: 'neutral';
    }>;
    technician: Readonly<{ id: string; displayName: string }> | null;
    technicianSummary: TechnicianSummary;
    workflowVersion: number;
    workflowSource: 'history' | 'synthetic_projection';
  }>;
  readonly timeline: Readonly<{
    items: readonly RepairTimelineItem[];
    totalCount: number;
    limit: number;
  }>;
  readonly evidence: Readonly<{
    items: readonly RepairEvidenceItem[];
    totalCount: number;
    limit: number;
  }>;
}

export interface TechnicianSummary {
  readonly current: Readonly<{ id: string; displayName: string }> | null;
  readonly version: number;
  readonly historyCount: number;
  readonly history: readonly TechnicianAssignmentHistory[];
}

export interface TechnicianAssignmentHistory {
  readonly assignmentId: string;
  readonly technician: Readonly<{ id: string; displayName: string }>;
  readonly assignedAt: string;
  readonly endedAt: string | null;
  readonly reason: string | null;
  readonly assignedBy: Readonly<{ id: string; displayName: string }>;
  readonly endedBy: Readonly<{ id: string; displayName: string }> | null;
}

export interface RepairTechnicianCatalogResponse {
  readonly items: readonly Readonly<{ id: string; displayName: string }>[];
}

export interface TechnicianAssignmentCommandResponse {
  readonly item: Readonly<{
    repairId: string;
    assignmentId: string;
    technicianId?: string;
    technicianDisplayName?: string;
    previousTechnicianId?: string;
    previousTechnicianDisplayName?: string;
    version: number;
  }>;
}

export interface StartRepairDiagnosisResponse {
  readonly item: Readonly<{
    repairId: string;
    transitionId: string;
    clientRequestId: string;
    fromState: 'pending';
    toState: 'diagnosing';
    workflowVersion: number;
    occurredAt: string;
    actor: Readonly<{ id: string; displayName: string }>;
  }>;
}

export interface MoveRepairToWorkshopResponse {
  readonly item: Readonly<{
    repairId: string;
    movementId: string;
    clientRequestId: string;
    fromLocation: Readonly<{ id: string; code: 'pending_area'; label: string }>;
    toLocation: Readonly<{ id: string; code: 'workshop'; label: string }>;
    locationVersion: number;
    reason: string | null;
    occurredAt: string;
    actor: Readonly<{ id: string; displayName: string }>;
  }>;
}

export interface RepairEvidenceItem {
  readonly id: string;
  readonly kind: 'photo';
  readonly category: 'intake' | 'general';
  readonly capturedAt: string | null;
  readonly uploadedAt: string;
  readonly uploadedBy: Readonly<{ id: string; displayName: string }> | null;
  readonly mimeType: 'image/png';
  readonly width: number | null;
  readonly height: number | null;
  readonly thumbnailUrl: string;
  readonly contentUrl: string;
  readonly caption: string | null;
}

export type RepairTimelineItemType = 'note' | 'system_event';

export interface RepairTimelineItem {
  readonly id: string;
  readonly occurredAt: string;
  readonly type: RepairTimelineItemType;
  readonly actor: Readonly<{ id: string | null; displayName: string }>;
  readonly title: string | null;
  readonly body: string | null;
  readonly source: string;
}

export interface AddRepairOperationalNoteResponse {
  readonly item: Readonly<{
    id: string;
    occurredAt: string;
    type: 'note';
    actor: Readonly<{ id: string; displayName: string }>;
    title: 'Nota';
    body: string;
    source: string;
  }>;
}

export interface RepairWorklistQuery {
  readonly q?: string | undefined;
  readonly period?: 'today' | 'week' | 'month' | 'all' | undefined;
  readonly from?: string | undefined;
  readonly to?: string | undefined;
  readonly status?: RepairStatusCode | undefined;
  readonly technicianId?: string | undefined;
  readonly unassigned?: boolean | undefined;
  readonly custody?: CustodyStatusCode | undefined;
  readonly page?: number | undefined;
  readonly pageSize?: number | undefined;
}

export class PreviewApiError extends Error {
  constructor(
    readonly status: number,
    message = 'No fue posible completar la operación de preview.',
    readonly code: string | null = null,
  ) {
    super(message);
    this.name = 'PreviewApiError';
  }
}

const SESSION_INVALIDATED_EVENT = 'srtaller:session-invalidated';
const CSRF_HEADER = 'X-SR-CSRF-Token';

export type PreviewRepairStatus =
  | 'received'
  | 'diagnosing'
  | 'ready'
  | 'delivered'
  | 'cancelled';

export interface PreviewRepairRecord {
  readonly id: string;
  readonly folio: string;
  readonly customerName: string;
  readonly customerPhone: string;
  readonly deviceBrand: string;
  readonly deviceModel: string;
  readonly deviceSerial: string | null;
  readonly deviceColor: string | null;
  readonly reportedProblem: string;
  readonly physicalCondition: string | null;
  readonly notes: string | null;
  readonly estimatedPrice: number | null;
  readonly depositAmount: number;
  readonly status: PreviewRepairStatus;
  readonly revision: number;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface PreviewRepairHistory {
  readonly id: string;
  readonly fromStatus: PreviewRepairStatus | null;
  readonly toStatus: PreviewRepairStatus;
  readonly resultingRevision: number;
  readonly stationId: string;
  readonly actorLabel: string;
  readonly changedAt: string;
}

export interface PreviewRepairDetail extends PreviewRepairRecord {
  readonly history: readonly PreviewRepairHistory[];
}

export interface CreatePreviewRepairRequest {
  readonly customerName: string;
  readonly customerPhone: string;
  readonly deviceBrand: string;
  readonly deviceModel: string;
  readonly deviceSerial: string | null;
  readonly deviceColor: string | null;
  readonly reportedProblem: string;
  readonly physicalCondition: string | null;
  readonly notes: string | null;
  readonly estimatedPrice: number | null;
  readonly depositAmount: number;
}

async function api<Response>(
  path: string,
  init: RequestInit = {},
): Promise<Response> {
  const response = await fetch(path, {
    ...init,
    credentials: 'include',
    headers: {
      Accept: 'application/json',
      ...(init.body ? { 'Content-Type': 'application/json' } : {}),
      ...init.headers,
    },
  });
  if (!response.ok) {
    if (response.status === 401) {
      window.dispatchEvent(new CustomEvent(SESSION_INVALIDATED_EVENT));
    }
    let message: string | undefined;
    let code: string | null = null;
    try {
      const payload = await response.json() as {
        code?: unknown;
        error?: { message?: unknown };
      };
      code = typeof payload.code === 'string' ? payload.code : null;
      message = typeof payload.error?.message === 'string'
        ? payload.error.message
        : undefined;
    } catch {
      // The public fallback below intentionally hides transport internals.
    }
    throw new PreviewApiError(response.status, message, code);
  }
  return response.json() as Promise<Response>;
}

export async function getPreviewContext(
  signal?: AbortSignal,
): Promise<PreviewContext> {
  return api<PreviewContext>('/api/preview/context', {
    signal: signal ?? null,
  });
}

export function listRepairs(
  query: RepairWorklistQuery,
  signal?: AbortSignal,
): Promise<RepairWorklistResponse> {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== '' && value !== false) params.set(key, String(value));
  }
  return api<RepairWorklistResponse>(`/api/repairs${params.toString() ? `?${params.toString()}` : ''}`, {
    signal: signal ?? null,
  });
}

export function getRepairDetail(
  id: string,
  signal?: AbortSignal,
): Promise<RepairDetail> {
  return api<RepairDetail>(`/api/repairs/${encodeURIComponent(id)}`, {
    signal: signal ?? null,
  });
}

export function addRepairOperationalNote(
  repairId: string,
  request: Readonly<{ body: string; clientRequestId: string }>,
  csrfToken: string,
): Promise<AddRepairOperationalNoteResponse> {
  return api<AddRepairOperationalNoteResponse>(
    `/api/repairs/${encodeURIComponent(repairId)}/notes`,
    {
      method: 'POST',
      headers: { [CSRF_HEADER]: csrfToken },
      body: JSON.stringify(request),
    },
  );
}

export interface CustomerSearchResponse {
  readonly items: readonly Readonly<{
    id: string;
    givenName: string;
    familyName: string | null;
    name: string;
    contactPhone: string | null;
    contactPhones: readonly string[];
    matchedPhone: string | null;
  }>[];
}

export interface CreateRepairRequest {
  readonly customerId: string | null;
  readonly customerGivenName: string | null;
  readonly customerFamilyName?: string | null;
  readonly customerPhone?: string | null;
  readonly addCustomerContactPhone?: boolean;
  readonly deviceType?: string | null;
  readonly canonicalDeviceTypeId?: string | null;
  readonly deviceBrand?: string | null;
  readonly canonicalBrandId?: string | null;
  readonly deviceModel?: string | null;
  readonly canonicalModelId?: string | null;
  readonly deviceIdentifier?: string | null;
  readonly deviceIdentifierUnavailable?: boolean;
  readonly deviceColor?: string | null;
  readonly distinctiveSigns?: string | null;
  readonly simIncluded?: boolean | null;
  readonly memoryCardIncluded?: boolean | null;
  readonly otherAccessories?: string | null;
  readonly reportedProblems: readonly Readonly<{ label: string; categoryId: string | null }>[];
  readonly customerNarrative?: string | null;
  readonly physicalConditionSummary?: string | null;
  readonly documentedRiskSummary?: string | null;
  readonly acceptedRiskIds?: readonly string[];
  readonly receivedPowerState?: 'powered_on' | 'powered_off' | null;
  readonly deviceAccessType?: 'none' | 'pin' | 'password' | 'pattern' | null;
  readonly initialBudgetAmount?: string | null;
  readonly warrantyReviewRequested?: boolean | null;
  readonly previousRepairId?: string | null;
  readonly differentDeliverer?: boolean | null;
  readonly deliveredByName?: string | null;
  readonly requiresRiskAcceptance?: boolean | null;
  readonly estimatedDeliveryLocal?: string | null;
  readonly clientRequestId: string;
}

export interface CreateRepairResponse {
  readonly id: string;
  readonly folio: string;
  readonly customer: Readonly<{ id: string; name: string; phone: string | null }>;
  readonly receivedAt: string;
  readonly newRepairPolicyVersion: number;
}

export interface OperationalRepairRisk {
  readonly riskId: string;
  readonly code: string | null;
  readonly label: string;
  readonly scope: 'platform' | 'tenant';
}

export interface AdminRepairRisk extends OperationalRepairRisk {
  readonly status: 'active' | 'inactive';
  readonly version: number;
  readonly usageCount: number;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface OperationalRepairRisksResponse {
  readonly items: readonly OperationalRepairRisk[];
}

export interface AdminRepairRisksResponse {
  readonly items: readonly AdminRepairRisk[];
}

export interface RepairRiskMutationResponse {
  readonly item: AdminRepairRisk;
}

export interface RepairProblemCategory {
  readonly categoryId: string;
  readonly code: string | null;
  readonly label: string;
  readonly scope: 'platform' | 'tenant';
  readonly status: 'active' | 'inactive';
  readonly version: number;
  readonly usageCount: number;
  readonly deletable: boolean;
  readonly createdAt: string;
  readonly updatedAt: string;
}
export interface RepairProblemCategoriesResponse { readonly items: readonly RepairProblemCategory[]; }
export interface RepairProblemCategoryMutationResponse { readonly item: RepairProblemCategory; }
export interface PendingRepairProblem {
  readonly pendingProblemValueId: string;
  readonly rawLabel: string;
  readonly status: 'pending' | 'resolved';
  readonly canonicalCategoryId: string | null;
  readonly canonicalLabel: string | null;
  readonly version: number;
  readonly usageCount: number;
  readonly firstSeenAt: string;
  readonly lastSeenAt: string;
}
export interface PendingRepairProblemsResponse { readonly items: readonly PendingRepairProblem[]; }

export interface OperationalRepairBrand {
  readonly brandId: string;
  readonly label: string;
  readonly scope: 'platform' | 'tenant';
}
export interface OperationalRepairDeviceType { readonly deviceTypeId: string; readonly label: string; readonly scope: 'platform' | 'tenant'; }
export interface AdminRepairDeviceType extends OperationalRepairDeviceType { readonly code: string | null; readonly status: 'active' | 'inactive'; readonly version: number; readonly usageCount: number; readonly createdAt: string; readonly updatedAt: string; }
export interface PendingRepairDeviceType { readonly pendingDeviceTypeValueId: string; readonly rawLabel: string; readonly status: 'pending' | 'resolved'; readonly canonicalDeviceTypeId: string | null; readonly canonicalLabel: string | null; readonly version: number; readonly usageCount: number; readonly firstSeenAt: string; readonly lastSeenAt: string; }
export interface OperationalRepairDeviceTypesResponse { readonly items: readonly OperationalRepairDeviceType[]; }
export interface AdminRepairDeviceTypesResponse { readonly items: readonly AdminRepairDeviceType[]; }
export interface PendingRepairDeviceTypesResponse { readonly items: readonly PendingRepairDeviceType[]; }
export interface AdminRepairBrand extends OperationalRepairBrand {
  readonly code: string | null;
  readonly status: 'active' | 'inactive';
  readonly version: number;
  readonly usageCount: number;
  readonly createdAt: string;
  readonly updatedAt: string;
}
export interface PendingRepairBrand {
  readonly pendingBrandValueId: string;
  readonly rawLabel: string;
  readonly status: 'pending' | 'resolved';
  readonly canonicalBrandId: string | null;
  readonly canonicalLabel: string | null;
  readonly version: number;
  readonly usageCount: number;
  readonly firstSeenAt: string;
  readonly lastSeenAt: string;
}
export interface OperationalRepairBrandsResponse { readonly items: readonly OperationalRepairBrand[]; }
export interface AdminRepairBrandsResponse { readonly items: readonly AdminRepairBrand[]; }
export interface PendingRepairBrandsResponse { readonly items: readonly PendingRepairBrand[]; }
export interface RepairBrandMutationResponse { readonly item: AdminRepairBrand; }

export interface OperationalRepairModel {
  readonly modelId: string;
  readonly brandId: string;
  readonly brandLabel: string;
  readonly label: string;
  readonly scope: 'platform' | 'tenant';
}
export interface AdminRepairModel extends OperationalRepairModel {
  readonly code: string | null;
  readonly status: 'active' | 'inactive';
  readonly version: number;
  readonly usageCount: number;
  readonly createdAt: string;
  readonly updatedAt: string;
}
export interface PendingRepairModel {
  readonly pendingModelValueId: string;
  readonly brandId: string | null;
  readonly brandLabel: string | null;
  readonly rawBrandLabel: string | null;
  readonly rawModelLabel: string;
  readonly status: 'pending' | 'resolved';
  readonly canonicalModelId: string | null;
  readonly canonicalModelLabel: string | null;
  readonly version: number;
  readonly usageCount: number;
  readonly firstSeenAt: string;
  readonly lastSeenAt: string;
}
export interface OperationalRepairModelsResponse { readonly items: readonly OperationalRepairModel[]; }
export interface AdminRepairModelsResponse { readonly items: readonly AdminRepairModel[]; }
export interface PendingRepairModelsResponse { readonly items: readonly PendingRepairModel[]; }
export interface RepairModelMutationResponse { readonly item: AdminRepairModel; }

export interface RepairEquipmentCorrectionResponse {
  readonly item: Readonly<{
    repairId: string;
    equipmentVersion: number;
    brand: string;
    canonicalBrandId: string | null;
    model: string;
    canonicalModelId: string | null;
    timeline: RepairTimelineItem;
  }>;
}

export function correctRepairEquipment(
  repairId: string,
  request: Readonly<{
    clientRequestId: string;
    expectedVersion: number;
    deviceBrand: string;
    canonicalBrandId: string | null;
    deviceModel: string;
    canonicalModelId: string | null;
    reason: string;
  }>,
  csrfToken: string,
): Promise<RepairEquipmentCorrectionResponse> {
  return api<RepairEquipmentCorrectionResponse>(`/api/repairs/${encodeURIComponent(repairId)}/equipment-correction`, {
    method: 'POST',
    headers: { [CSRF_HEADER]: csrfToken },
    body: JSON.stringify(request),
  });
}

export type NewRepairFieldState = 'fixed' | 'required' | 'optional' | 'hidden' | 'conditional';
export type NewRepairFieldSection = 'customer' | 'equipment' | 'reception' | 'access' | 'commitment';
export interface NewRepairFieldRegistryEntry {
  readonly key: string;
  readonly label: string;
  readonly section: NewRepairFieldSection;
  readonly classification: 'core' | 'configurable' | 'conditional';
  readonly allowedStates: readonly NewRepairFieldState[];
  readonly systemDefault: NewRepairFieldState;
  readonly condition: string | null;
  readonly available: boolean;
  readonly sensitive: boolean;
  readonly payloadKeys: readonly string[];
}
export interface NewRepairPolicyResponse {
  readonly schemaVersion: number;
  readonly policyVersion: number;
  readonly source: 'system-default' | 'branch';
  readonly fieldStates: Readonly<Record<string, NewRepairFieldState>>;
  readonly registry: readonly NewRepairFieldRegistryEntry[];
  readonly updatedAt: string | null;
}

export function getOperationalNewRepairPolicy(signal?: AbortSignal): Promise<NewRepairPolicyResponse> {
  return api<NewRepairPolicyResponse>('/api/repairs/new-repair-policy', { signal: signal ?? null });
}

export function getOperationalRepairRisks(signal?: AbortSignal): Promise<OperationalRepairRisksResponse> {
  return api<OperationalRepairRisksResponse>('/api/repairs/risks', { signal: signal ?? null });
}

export function getOperationalRepairBrands(query: string, signal?: AbortSignal): Promise<OperationalRepairBrandsResponse> {
  return api<OperationalRepairBrandsResponse>(`/api/repairs/brands?q=${encodeURIComponent(query)}`, { signal: signal ?? null });
}
export function getOperationalRepairDeviceTypes(query: string, signal?: AbortSignal): Promise<OperationalRepairDeviceTypesResponse> { return api<OperationalRepairDeviceTypesResponse>(`/api/repairs/device-types?q=${encodeURIComponent(query)}`, { signal: signal ?? null }); }
export function getAdminRepairDeviceTypes(signal?: AbortSignal): Promise<AdminRepairDeviceTypesResponse> { return api<AdminRepairDeviceTypesResponse>('/api/repairs/configuration/catalogs/device-types', { signal: signal ?? null }); }
export function getPendingRepairDeviceTypes(signal?: AbortSignal): Promise<PendingRepairDeviceTypesResponse> { return api<PendingRepairDeviceTypesResponse>('/api/repairs/configuration/catalogs/device-types/pending', { signal: signal ?? null }); }
export function createRepairDeviceType(canonicalLabel: string, csrfToken: string): Promise<{ readonly item: AdminRepairDeviceType }> { return api('/api/repairs/configuration/catalogs/device-types', { method: 'POST', headers: { [CSRF_HEADER]: csrfToken }, body: JSON.stringify({ canonicalLabel }) }); }
export function renameRepairDeviceType(deviceTypeId: string, canonicalLabel: string, expectedVersion: number, csrfToken: string): Promise<{ readonly item: AdminRepairDeviceType }> { return api(`/api/repairs/configuration/catalogs/device-types/${encodeURIComponent(deviceTypeId)}`, { method: 'PUT', headers: { [CSRF_HEADER]: csrfToken }, body: JSON.stringify({ canonicalLabel, expectedVersion }) }); }
export function changeRepairDeviceTypeStatus(deviceTypeId: string, status: 'active' | 'inactive', expectedVersion: number, csrfToken: string): Promise<{ readonly item: AdminRepairDeviceType }> { return api(`/api/repairs/configuration/catalogs/device-types/${encodeURIComponent(deviceTypeId)}/${status === 'active' ? 'reactivate' : 'deactivate'}`, { method: 'POST', headers: { [CSRF_HEADER]: csrfToken }, body: JSON.stringify({ expectedVersion }) }); }
export function resolvePendingRepairDeviceType(pendingDeviceTypeValueId: string, resolution: Readonly<{ canonicalDeviceTypeId?: string; canonicalLabel?: string; expectedVersion: number }>, csrfToken: string): Promise<{ readonly item: PendingRepairDeviceType }> { return api(`/api/repairs/configuration/catalogs/device-types/pending/${encodeURIComponent(pendingDeviceTypeValueId)}/resolve`, { method: 'POST', headers: { [CSRF_HEADER]: csrfToken }, body: JSON.stringify(resolution) }); }

export function getAdminRepairBrands(signal?: AbortSignal): Promise<AdminRepairBrandsResponse> {
  return api<AdminRepairBrandsResponse>('/api/repairs/configuration/catalogs/brands', { signal: signal ?? null });
}

export function getPendingRepairBrands(signal?: AbortSignal): Promise<PendingRepairBrandsResponse> {
  return api<PendingRepairBrandsResponse>('/api/repairs/configuration/catalogs/brands/pending', { signal: signal ?? null });
}

export function createRepairBrand(canonicalLabel: string, csrfToken: string): Promise<RepairBrandMutationResponse> {
  return api<RepairBrandMutationResponse>('/api/repairs/configuration/catalogs/brands', { method: 'POST', headers: { [CSRF_HEADER]: csrfToken }, body: JSON.stringify({ canonicalLabel }) });
}

export function renameRepairBrand(brandId: string, canonicalLabel: string, expectedVersion: number, csrfToken: string): Promise<RepairBrandMutationResponse> {
  return api<RepairBrandMutationResponse>(`/api/repairs/configuration/catalogs/brands/${encodeURIComponent(brandId)}`, { method: 'PUT', headers: { [CSRF_HEADER]: csrfToken }, body: JSON.stringify({ canonicalLabel, expectedVersion }) });
}

export function changeRepairBrandStatus(brandId: string, status: 'active' | 'inactive', expectedVersion: number, csrfToken: string): Promise<RepairBrandMutationResponse> {
  const action = status === 'active' ? 'reactivate' : 'deactivate';
  return api<RepairBrandMutationResponse>(`/api/repairs/configuration/catalogs/brands/${encodeURIComponent(brandId)}/${action}`, { method: 'POST', headers: { [CSRF_HEADER]: csrfToken }, body: JSON.stringify({ expectedVersion }) });
}

export function resolvePendingRepairBrand(pendingBrandValueId: string, resolution: Readonly<{ canonicalBrandId?: string; canonicalLabel?: string; expectedVersion: number }>, csrfToken: string): Promise<{ readonly item: PendingRepairBrand }> {
  return api<{ readonly item: PendingRepairBrand }>(`/api/repairs/configuration/catalogs/brands/pending/${encodeURIComponent(pendingBrandValueId)}/resolve`, { method: 'POST', headers: { [CSRF_HEADER]: csrfToken }, body: JSON.stringify(resolution) });
}

export function getOperationalRepairModels(brandId: string, query: string, signal?: AbortSignal): Promise<OperationalRepairModelsResponse> {
  return api<OperationalRepairModelsResponse>(`/api/repairs/models?brandId=${encodeURIComponent(brandId)}&q=${encodeURIComponent(query)}`, { signal: signal ?? null });
}
export function getAdminRepairModels(brandId?: string, signal?: AbortSignal): Promise<AdminRepairModelsResponse> {
  const query = brandId ? `?brandId=${encodeURIComponent(brandId)}` : '';
  return api<AdminRepairModelsResponse>(`/api/repairs/configuration/catalogs/models${query}`, { signal: signal ?? null });
}
export function getPendingRepairModels(brandId?: string, signal?: AbortSignal): Promise<PendingRepairModelsResponse> {
  const query = brandId ? `?brandId=${encodeURIComponent(brandId)}` : '';
  return api<PendingRepairModelsResponse>(`/api/repairs/configuration/catalogs/models/pending${query}`, { signal: signal ?? null });
}
export function createRepairModel(canonicalBrandId: string, canonicalLabel: string, csrfToken: string): Promise<RepairModelMutationResponse> {
  return api<RepairModelMutationResponse>('/api/repairs/configuration/catalogs/models', { method: 'POST', headers: { [CSRF_HEADER]: csrfToken }, body: JSON.stringify({ canonicalBrandId, canonicalLabel }) });
}
export function renameRepairModel(modelId: string, canonicalLabel: string, expectedVersion: number, csrfToken: string): Promise<RepairModelMutationResponse> {
  return api<RepairModelMutationResponse>(`/api/repairs/configuration/catalogs/models/${encodeURIComponent(modelId)}`, { method: 'PUT', headers: { [CSRF_HEADER]: csrfToken }, body: JSON.stringify({ canonicalLabel, expectedVersion }) });
}
export function changeRepairModelStatus(modelId: string, status: 'active' | 'inactive', expectedVersion: number, csrfToken: string): Promise<RepairModelMutationResponse> {
  const action = status === 'active' ? 'reactivate' : 'deactivate';
  return api<RepairModelMutationResponse>(`/api/repairs/configuration/catalogs/models/${encodeURIComponent(modelId)}/${action}`, { method: 'POST', headers: { [CSRF_HEADER]: csrfToken }, body: JSON.stringify({ expectedVersion }) });
}
export function resolvePendingRepairModel(pendingModelValueId: string, resolution: Readonly<{ canonicalModelId?: string; canonicalLabel?: string; expectedVersion: number }>, csrfToken: string): Promise<{ readonly item: PendingRepairModel }> {
  return api<{ readonly item: PendingRepairModel }>(`/api/repairs/configuration/catalogs/models/pending/${encodeURIComponent(pendingModelValueId)}/resolve`, { method: 'POST', headers: { [CSRF_HEADER]: csrfToken }, body: JSON.stringify(resolution) });
}

export function getAdminRepairRisks(signal?: AbortSignal): Promise<AdminRepairRisksResponse> {
  return api<AdminRepairRisksResponse>('/api/repairs/configuration/catalogs/risks', { signal: signal ?? null });
}

export function createRepairRisk(canonicalLabel: string, csrfToken: string): Promise<RepairRiskMutationResponse> {
  return api<RepairRiskMutationResponse>('/api/repairs/configuration/catalogs/risks', {
    method: 'POST',
    headers: { [CSRF_HEADER]: csrfToken },
    body: JSON.stringify({ canonicalLabel }),
  });
}

export function renameRepairRisk(riskId: string, canonicalLabel: string, expectedVersion: number, csrfToken: string): Promise<RepairRiskMutationResponse> {
  return api<RepairRiskMutationResponse>(`/api/repairs/configuration/catalogs/risks/${encodeURIComponent(riskId)}`, {
    method: 'PUT',
    headers: { [CSRF_HEADER]: csrfToken },
    body: JSON.stringify({ canonicalLabel, expectedVersion }),
  });
}

export function changeRepairRiskStatus(riskId: string, status: 'active' | 'inactive', expectedVersion: number, csrfToken: string): Promise<RepairRiskMutationResponse> {
  const action = status === 'active' ? 'reactivate' : 'deactivate';
  return api<RepairRiskMutationResponse>(`/api/repairs/configuration/catalogs/risks/${encodeURIComponent(riskId)}/${action}`, {
    method: 'POST',
    headers: { [CSRF_HEADER]: csrfToken },
    body: JSON.stringify({ expectedVersion }),
  });
}

export function getOperationalProblemCategories(signal?: AbortSignal): Promise<RepairProblemCategoriesResponse> { return api<RepairProblemCategoriesResponse>('/api/repairs/problem-categories', { signal: signal ?? null }); }
export function getIntakeProblemCategories(signal?: AbortSignal): Promise<RepairProblemCategoriesResponse> { return api<RepairProblemCategoriesResponse>('/api/repairs/new-repair/problem-categories', { signal: signal ?? null }); }
export function getAdminProblemCategories(signal?: AbortSignal): Promise<RepairProblemCategoriesResponse> { return api<RepairProblemCategoriesResponse>('/api/repairs/configuration/catalogs/problem-categories', { signal: signal ?? null }); }
export function getPendingProblems(signal?: AbortSignal): Promise<PendingRepairProblemsResponse> { return api<PendingRepairProblemsResponse>('/api/repairs/configuration/catalogs/problem-categories/pending', { signal: signal ?? null }); }
export function createProblemCategory(canonicalLabel: string, csrfToken: string): Promise<RepairProblemCategoryMutationResponse> { return api<RepairProblemCategoryMutationResponse>('/api/repairs/configuration/catalogs/problem-categories', { method: 'POST', headers: { [CSRF_HEADER]: csrfToken }, body: JSON.stringify({ canonicalLabel }) }); }
export function renameProblemCategory(categoryId: string, canonicalLabel: string, expectedVersion: number, csrfToken: string): Promise<RepairProblemCategoryMutationResponse> { return api<RepairProblemCategoryMutationResponse>(`/api/repairs/configuration/catalogs/problem-categories/${encodeURIComponent(categoryId)}`, { method: 'PUT', headers: { [CSRF_HEADER]: csrfToken }, body: JSON.stringify({ canonicalLabel, expectedVersion }) }); }
export function changeProblemCategoryStatus(categoryId: string, status: 'active' | 'inactive', expectedVersion: number, csrfToken: string): Promise<RepairProblemCategoryMutationResponse> { const action = status === 'active' ? 'reactivate' : 'deactivate'; return api<RepairProblemCategoryMutationResponse>(`/api/repairs/configuration/catalogs/problem-categories/${encodeURIComponent(categoryId)}/${action}`, { method: 'POST', headers: { [CSRF_HEADER]: csrfToken }, body: JSON.stringify({ expectedVersion }) }); }
export function deleteProblemCategory(categoryId: string, expectedVersion: number, csrfToken: string): Promise<{ readonly item: Readonly<{ categoryId: string; previousLabel: string; scope: 'tenant'; version: number; deletedAt: string }> }> { return api(`/api/repairs/configuration/catalogs/problem-categories/${encodeURIComponent(categoryId)}`, { method: 'DELETE', headers: { [CSRF_HEADER]: csrfToken }, body: JSON.stringify({ expectedVersion }) }); }
export function resolvePendingProblem(pendingProblemValueId: string, resolution: Readonly<{ canonicalCategoryId?: string; canonicalLabel?: string }>, expectedVersion: number, csrfToken: string): Promise<{ readonly item: PendingRepairProblem }> { return api(`/api/repairs/configuration/catalogs/problem-categories/pending/${encodeURIComponent(pendingProblemValueId)}/resolve`, { method: 'POST', headers: { [CSRF_HEADER]: csrfToken }, body: JSON.stringify({ ...resolution, expectedVersion }) }); }
export function addRepairProblemClassification(repairId: string, categoryId: string, csrfToken: string): Promise<{ readonly item: Readonly<{ categoryId: string; label: string; status: 'active' | 'inactive' }> }> { return api(`/api/repairs/${encodeURIComponent(repairId)}/problem-classifications/${encodeURIComponent(categoryId)}`, { method: 'POST', headers: { [CSRF_HEADER]: csrfToken }, body: JSON.stringify({}) }); }
export function removeRepairProblemClassification(repairId: string, categoryId: string, csrfToken: string): Promise<{ readonly item: Readonly<{ categoryId: string; label: string; status: 'active' | 'inactive' }> }> { return api(`/api/repairs/${encodeURIComponent(repairId)}/problem-classifications/${encodeURIComponent(categoryId)}/remove`, { method: 'POST', headers: { [CSRF_HEADER]: csrfToken }, body: JSON.stringify({}) }); }

export function getAdminNewRepairPolicy(signal?: AbortSignal): Promise<NewRepairPolicyResponse> {
  return api<NewRepairPolicyResponse>('/api/repairs/configuration/new-repair-policy', { signal: signal ?? null });
}

export function updateNewRepairPolicy(expectedVersion: number, fieldStates: Readonly<Record<string, NewRepairFieldState>>, csrfToken: string): Promise<NewRepairPolicyResponse> {
  return api<NewRepairPolicyResponse>('/api/repairs/configuration/new-repair-policy', { method: 'PUT', headers: { [CSRF_HEADER]: csrfToken }, body: JSON.stringify({ expectedVersion, fieldStates }) });
}

export function resetNewRepairPolicy(expectedVersion: number, csrfToken: string): Promise<NewRepairPolicyResponse> {
  return api<NewRepairPolicyResponse>('/api/repairs/configuration/new-repair-policy/reset', { method: 'POST', headers: { [CSRF_HEADER]: csrfToken }, body: JSON.stringify({ expectedVersion }) });
}

export function searchCustomers(query: string, signal?: AbortSignal): Promise<CustomerSearchResponse> {
  return api<CustomerSearchResponse>(`/api/repairs/customer-lookup?q=${encodeURIComponent(query)}`, { signal: signal ?? null });
}

export function searchPreviousRepairs(query: string, signal?: AbortSignal): Promise<PreviousRepairLookupResponse> {
  return api<PreviousRepairLookupResponse>(`/api/repairs/previous-repair-lookup?q=${encodeURIComponent(query)}`, { signal: signal ?? null });
}

export function createRepair(request: CreateRepairRequest, csrfToken: string): Promise<CreateRepairResponse> {
  return api<CreateRepairResponse>('/api/repairs', {
    method: 'POST',
    headers: { [CSRF_HEADER]: csrfToken },
    body: JSON.stringify(request),
  });
}

export function listRepairTechnicians(signal?: AbortSignal): Promise<RepairTechnicianCatalogResponse> {
  return api<RepairTechnicianCatalogResponse>('/api/repairs/technicians', { signal: signal ?? null });
}

export function assignRepairTechnician(repairId: string, request: Readonly<{ technicianId: string; clientRequestId: string; expectedVersion: number }>): Promise<TechnicianAssignmentCommandResponse> {
  return api<TechnicianAssignmentCommandResponse>(`/api/repairs/${encodeURIComponent(repairId)}/technician-assignment`, { method: 'POST', body: JSON.stringify(request) });
}

export function reassignRepairTechnician(repairId: string, request: Readonly<{ technicianId: string; reason?: string | null; clientRequestId: string; expectedVersion: number }>): Promise<TechnicianAssignmentCommandResponse> {
  return api<TechnicianAssignmentCommandResponse>(`/api/repairs/${encodeURIComponent(repairId)}/technician-reassignment`, { method: 'POST', body: JSON.stringify(request) });
}

export function unassignRepairTechnician(repairId: string, request: Readonly<{ reason?: string | null; clientRequestId: string; expectedVersion: number }>): Promise<TechnicianAssignmentCommandResponse> {
  return api<TechnicianAssignmentCommandResponse>(`/api/repairs/${encodeURIComponent(repairId)}/technician-unassignment`, { method: 'POST', body: JSON.stringify(request) });
}

export function startRepairDiagnosis(repairId: string, request: Readonly<{ clientRequestId: string; expectedVersion: number }>): Promise<StartRepairDiagnosisResponse> {
  return api<StartRepairDiagnosisResponse>(`/api/repairs/${encodeURIComponent(repairId)}/workflow/start-diagnosis`, {
    method: 'POST',
    body: JSON.stringify(request),
  });
}

export function moveRepairToWorkshop(repairId: string, request: Readonly<{ clientRequestId: string; expectedVersion: number; reason?: string | null }>): Promise<MoveRepairToWorkshopResponse> {
  return api<MoveRepairToWorkshopResponse>(`/api/repairs/${encodeURIComponent(repairId)}/location/move-to-workshop`, {
    method: 'POST',
    body: JSON.stringify(request),
  });
}

export function listPreviewRepairs(
  signal?: AbortSignal,
): Promise<readonly PreviewRepairRecord[]> {
  return api<readonly PreviewRepairRecord[]>('/api/preview/repairs', {
    signal: signal ?? null,
  });
}

export function createPreviewRepair(
  request: CreatePreviewRepairRequest,
): Promise<PreviewRepairDetail> {
  return api<PreviewRepairDetail>('/api/preview/repairs', {
    method: 'POST',
    body: JSON.stringify(request),
  });
}

export function getPreviewRepair(
  id: string,
  signal?: AbortSignal,
): Promise<PreviewRepairDetail> {
  return api<PreviewRepairDetail>(`/api/preview/repairs/${encodeURIComponent(id)}`, {
    signal: signal ?? null,
  });
}

export function transitionPreviewRepair(
  repair: Pick<PreviewRepairRecord, 'id' | 'revision'>,
  status: PreviewRepairStatus,
): Promise<PreviewRepairDetail> {
  return api<PreviewRepairDetail>(
    `/api/preview/repairs/${encodeURIComponent(repair.id)}/status`,
    {
      method: 'PATCH',
      body: JSON.stringify({ expectedRevision: repair.revision, status }),
    },
  );
}
