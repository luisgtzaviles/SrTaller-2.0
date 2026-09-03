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

export interface RepairDetail {
  readonly id: string;
  readonly folio: string;
  readonly customer: Readonly<{ name: string; phone: string | null }>;
  readonly receivedDevice: Readonly<{
    brand: string;
    model: string;
    label: string;
    color: string | null;
  }>;
  readonly intake: Readonly<{
    receivedAt: string;
    receivedBy: Readonly<{ id: string; displayName: string }> | null;
    reportedIssue: string | null;
    customerNarrative: string | null;
    physicalConditionSummary: string | null;
    documentedRiskSummary: string | null;
  }>;
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
    actor: Readonly<{ displayName: string }>;
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
  constructor(readonly status: number, message = 'No fue posible completar la operación de preview.') {
    super(message);
    this.name = 'PreviewApiError';
  }
}

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
    headers: {
      Accept: 'application/json',
      ...(init.body ? { 'Content-Type': 'application/json' } : {}),
      ...init.headers,
    },
  });
  if (!response.ok) {
    let message: string | undefined;
    try {
      const payload = await response.json() as { error?: { message?: unknown } };
      message = typeof payload.error?.message === 'string'
        ? payload.error.message
        : undefined;
    } catch {
      // The public fallback below intentionally hides transport internals.
    }
    throw new PreviewApiError(response.status, message);
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
): Promise<AddRepairOperationalNoteResponse> {
  return api<AddRepairOperationalNoteResponse>(
    `/api/repairs/${encodeURIComponent(repairId)}/notes`,
    {
      method: 'POST',
      body: JSON.stringify(request),
    },
  );
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
