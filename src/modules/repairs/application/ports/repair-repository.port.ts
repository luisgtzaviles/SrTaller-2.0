import type {
  CustodyStatusCode,
  RepairStatusCode,
} from '../../domain/repair-status.js';

export interface RepairPersistenceScope {
  readonly tenantId: string;
  readonly branchId: string;
}

export interface RepairWorklistRecord {
  readonly id: string;
  readonly folio: string;
  readonly receivedAt: string;
  readonly customerName: string;
  readonly customerPhone: string;
  readonly deviceBrand: string;
  readonly deviceModel: string;
  readonly reportedIssue: string;
  readonly technicianId: string | null;
  readonly technicianDisplayName: string | null;
  readonly repairStatus: RepairStatusCode;
  readonly custodyStatus: CustodyStatusCode;
}

export interface RepairDetailRecord {
  readonly id: string;
  readonly folio: string;
  readonly customerName: string;
  readonly customerPhone: string | null;
  readonly deviceBrand: string;
  readonly deviceModel: string;
  readonly deviceColor: string | null;
  readonly receivedAt: string;
  readonly receivedById: string | null;
  readonly receivedByDisplayName: string | null;
  readonly reportedIssue: string | null;
  readonly customerNarrative: string | null;
  readonly physicalConditionSummary: string | null;
  readonly documentedRiskSummary: string | null;
  readonly technicianId: string | null;
  readonly technicianDisplayName: string | null;
  readonly repairStatus: RepairStatusCode;
  readonly currentLocation: null;
  readonly custodyStatus: CustodyStatusCode;
  readonly timeline: Readonly<{
    items: readonly RepairTimelineItemRecord[];
    totalCount: number;
    limit: number;
  }>;
  readonly evidence: Readonly<{
    items: readonly RepairEvidenceItemRecord[];
    totalCount: number;
    limit: number;
  }>;
}

export type RepairEvidenceCategory = 'intake' | 'general';

export interface RepairEvidenceItemRecord {
  readonly id: string;
  readonly kind: 'photo';
  readonly category: RepairEvidenceCategory;
  readonly capturedAt: string | null;
  readonly uploadedAt: string;
  readonly uploadedBy: Readonly<{ id: string; displayName: string }> | null;
  readonly mimeType: 'image/png';
  readonly width: number | null;
  readonly height: number | null;
  readonly caption: string | null;
}

export interface RepairEvidenceContentRecord {
  readonly id: string;
  readonly storageKey: string;
  readonly mimeType: 'image/png';
  readonly sizeBytes: number;
}

export type RepairTimelineItemType = 'note' | 'system_event';

export interface RepairTimelineItemRecord {
  readonly id: string;
  readonly occurredAt: string;
  readonly type: RepairTimelineItemType;
  readonly actorId: string | null;
  readonly actorDisplayName: string;
  readonly title: string | null;
  readonly body: string | null;
  readonly source: string;
}

export interface AddRepairOperationalNoteRecord {
  readonly repairId: string;
  readonly entryId: string;
  readonly clientRequestId: string;
  readonly actorId: string;
  readonly actorDisplayName: string;
  readonly body: string;
  readonly source: string;
  readonly occurredAt: Date;
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
  readonly page: number;
  readonly pageSize: number;
}

export interface RepairWorklistPage {
  readonly items: readonly RepairWorklistRecord[];
  readonly page: number;
  readonly pageSize: number;
  readonly totalCount: number;
  readonly unfilteredCount: number;
  readonly hasNextPage: boolean;
  readonly technicians: readonly Readonly<{
    id: string;
    displayName: string;
  }>[];
}

export interface RepairRepositoryPort {
  listWorklist(
    scope: RepairPersistenceScope,
    query: RepairWorklistQuery,
  ): Promise<RepairWorklistPage>;
  getRepairById(
    scope: RepairPersistenceScope,
    repairId: string,
  ): Promise<RepairDetailRecord | null>;
  addOperationalNote(
    scope: RepairPersistenceScope,
    note: AddRepairOperationalNoteRecord,
  ): Promise<RepairTimelineItemRecord | null>;
  getRepairEvidenceById(
    scope: RepairPersistenceScope,
    repairId: string,
    evidenceId: string,
  ): Promise<RepairEvidenceContentRecord | null>;
}
