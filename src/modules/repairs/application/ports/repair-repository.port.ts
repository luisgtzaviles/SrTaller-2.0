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
  readonly technicianSummary: TechnicianSummaryRecord;
  readonly repairStatus: RepairStatusCode;
  readonly workflowSummary: Readonly<{
    version: number;
    source: 'history' | 'synthetic_projection';
  }>;
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

export interface TechnicianSummaryRecord {
  readonly current: Readonly<{ id: string; displayName: string }> | null;
  readonly version: number;
  readonly historyCount: number;
  readonly history: readonly TechnicianAssignmentHistoryRecord[];
}

export interface TechnicianAssignmentHistoryRecord {
  readonly assignmentId: string;
  readonly technician: Readonly<{ id: string; displayName: string }>;
  readonly assignedAt: string;
  readonly endedAt: string | null;
  readonly reason: string | null;
  readonly assignedBy: Readonly<{ id: string; displayName: string }>;
  readonly endedBy: Readonly<{ id: string; displayName: string }> | null;
}

export interface RepairTechnicianRecord {
  readonly id: string;
  readonly displayName: string;
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

export class RepairOperationalNoteIdempotencyConflictError extends Error {
  constructor() {
    super('Operational note idempotency key was reused with different content.');
    this.name = 'RepairOperationalNoteIdempotencyConflictError';
  }
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

export interface AssignRepairTechnicianRecord {
  readonly repairId: string;
  readonly assignmentId: string;
  readonly technicianId: string;
  readonly technicianDisplayName: string;
  readonly clientRequestId: string;
  readonly actorId: string;
  readonly actorDisplayName: string;
  readonly occurredAt: Date;
  readonly version: number;
}

export interface ReassignRepairTechnicianRecord extends AssignRepairTechnicianRecord {
  readonly previousTechnicianId: string;
  readonly previousTechnicianDisplayName: string;
  readonly reason: string | null;
}

export interface UnassignRepairTechnicianRecord {
  readonly repairId: string;
  readonly assignmentId: string;
  readonly previousTechnicianId: string;
  readonly previousTechnicianDisplayName: string;
  readonly clientRequestId: string;
  readonly actorId: string;
  readonly actorDisplayName: string;
  readonly occurredAt: Date;
  readonly version: number;
  readonly reason: string | null;
}

export class RepairTechnicianIdempotencyConflictError extends Error {
  constructor() {
    super('Technician assignment request was reused with different content.');
    this.name = 'RepairTechnicianIdempotencyConflictError';
  }
}

export class RepairTechnicianConcurrencyConflictError extends Error {
  constructor() {
    super('Technician assignment version is stale.');
    this.name = 'RepairTechnicianConcurrencyConflictError';
  }
}

export class RepairTechnicianStateConflictError extends Error {
  constructor() { super('Technician assignment state does not allow this command.'); this.name = 'RepairTechnicianStateConflictError'; }
}

export class RepairTechnicianEligibilityError extends Error {
  constructor() { super('Technician is not eligible for this context.'); this.name = 'RepairTechnicianEligibilityError'; }
}

export interface StartRepairDiagnosisRecord {
  readonly repairId: string;
  readonly transitionId: string;
  readonly timelineEntryId: string;
  readonly clientRequestId: string;
  readonly actorId: string;
  readonly actorDisplayName: string;
  readonly occurredAt: Date;
  readonly expectedVersion: number;
  readonly workflowVersion: number;
  readonly fromState: 'pending';
  readonly toState: 'diagnosing';
}

export class RepairWorkflowIdempotencyConflictError extends Error {
  constructor() { super('Workflow request was reused with different content.'); this.name = 'RepairWorkflowIdempotencyConflictError'; }
}

export class RepairWorkflowConcurrencyConflictError extends Error {
  constructor() { super('Workflow version is stale.'); this.name = 'RepairWorkflowConcurrencyConflictError'; }
}

export class RepairWorkflowStateConflictError extends Error {
  constructor() { super('Workflow state does not allow this command.'); this.name = 'RepairWorkflowStateConflictError'; }
}

export class RepairWorkflowCustodyConflictError extends Error {
  constructor() { super('Ended custody does not allow this command.'); this.name = 'RepairWorkflowCustodyConflictError'; }
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
  listEligibleTechnicians(
    scope: RepairPersistenceScope,
  ): Promise<readonly RepairTechnicianRecord[]>;
  assignRepairTechnician(
    scope: RepairPersistenceScope,
    input: AssignRepairTechnicianRecord,
  ): Promise<AssignRepairTechnicianRecord | null>;
  reassignRepairTechnician(
    scope: RepairPersistenceScope,
    input: ReassignRepairTechnicianRecord,
  ): Promise<ReassignRepairTechnicianRecord | null>;
  unassignRepairTechnician(
    scope: RepairPersistenceScope,
    input: UnassignRepairTechnicianRecord,
  ): Promise<UnassignRepairTechnicianRecord | null>;
  startRepairDiagnosis(
    scope: RepairPersistenceScope,
    input: StartRepairDiagnosisRecord,
  ): Promise<StartRepairDiagnosisRecord | null>;
  getRepairEvidenceById(
    scope: RepairPersistenceScope,
    repairId: string,
    evidenceId: string,
  ): Promise<RepairEvidenceContentRecord | null>;
}
