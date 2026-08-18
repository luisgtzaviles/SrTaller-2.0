export interface PreviewContext {
  readonly tenantName: string;
  readonly branchName: string;
  readonly stationLabel: string;
  readonly environment: 'DEV_PREVIEW';
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
