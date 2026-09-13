import type {
  CustodyStatusCode,
  RepairStatusCode,
} from '../../domain/repair-status.js';
import type { BranchTimeZone } from '../../../stations/index.js';
import type { RepairBrandReadModel } from '../repair-brand-read-model.js';
import type { RepairDeviceTypeReadModel } from '../repair-device-type-read-model.js';
import type { RepairModelReadModel } from '../repair-model-read-model.js';
import type { NewRepairFieldStates } from '../../domain/new-repair-field-policy.js';

export interface RepairPersistenceScope {
  readonly tenantId: string;
  readonly branchId: string;
}

export type RepairReceivedPowerState = 'powered_on' | 'powered_off';
export type RepairDeviceAccessType = 'none' | 'pin' | 'password' | 'pattern';
export type RepairRiskScope = 'platform' | 'tenant';
export type RepairRiskStatus = 'active' | 'inactive';
export type RepairBrandScope = 'platform' | 'tenant';
export type RepairBrandStatus = 'active' | 'inactive';
export type RepairDeviceTypeScope = 'platform' | 'tenant';
export type RepairDeviceTypeStatus = 'active' | 'inactive';
export type RepairModelScope = 'platform' | 'tenant';
export type RepairModelStatus = 'active' | 'inactive';
export type RepairProblemCategoryScope = 'platform' | 'tenant';
export type RepairProblemCategoryStatus = 'active' | 'inactive';

export interface RepairProblemCategoryRecord {
  readonly categoryId: string;
  readonly code: string | null;
  readonly canonicalLabel: string;
  readonly normalizedKey: string;
  readonly scope: RepairProblemCategoryScope;
  readonly status: RepairProblemCategoryStatus;
  readonly version: number;
  readonly usageCount: number;
  readonly deletable?: boolean;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface RepairProblemClassificationRecord {
  readonly problemCaptureId: string;
  readonly categoryId: string | null;
  readonly rawLabel: string;
  readonly label: string;
  readonly status: RepairProblemCategoryStatus | 'pending';
  readonly stage: 'intake' | 'post_intake';
}

export interface RepairProblemPendingRecord {
  readonly pendingProblemValueId: string;
  readonly rawLabel: string;
  readonly normalizedKey: string;
  readonly resolutionStatus: 'pending' | 'resolved';
  readonly canonicalCategoryId: string | null;
  readonly canonicalLabel: string | null;
  readonly version: number;
  readonly usageCount: number;
  readonly firstSeenAt: string;
  readonly lastSeenAt: string;
}

export interface RepairProblemCategoryCatalogContext {
  readonly tenantId: string; readonly branchId: string; readonly stationId: string;
  readonly sessionId: string; readonly actorUserId: string; readonly actorDisplayName: string;
  readonly capability: 'repairs.catalogs.manage';
  readonly commitGuard: Readonly<{ confirmCurrent(transactionContext: object): Promise<boolean>; confirmTemporalCurrent(transactionContext: object): Promise<boolean> }>;
}

export interface RepairClassificationContext {
  readonly tenantId: string; readonly branchId: string; readonly stationId: string;
  readonly sessionId: string; readonly actorUserId: string; readonly actorDisplayName: string;
  readonly capability: 'repairs.classify';
  readonly commitGuard: Readonly<{ confirmCurrent(transactionContext: object): Promise<boolean>; confirmTemporalCurrent(transactionContext: object): Promise<boolean> }>;
}

export interface CreateRepairProblemCategoryRecord {
  readonly categoryId: string; readonly eventId: string; readonly correlationId: string;
  readonly canonicalLabel: string; readonly normalizedKey: string; readonly occurredAt: Date;
}
export interface ChangeRepairProblemCategoryRecord {
  readonly categoryId: string; readonly eventId: string; readonly correlationId: string; readonly expectedVersion: number;
  readonly canonicalLabel?: string; readonly normalizedKey?: string; readonly status?: RepairProblemCategoryStatus;
  readonly action: 'repair_problem_category.renamed' | 'repair_problem_category.deactivated' | 'repair_problem_category.reactivated'; readonly occurredAt: Date;
}
export interface DeleteRepairProblemCategoryRecord {
  readonly categoryId: string;
  readonly eventId: string;
  readonly correlationId: string;
  readonly expectedVersion: number;
  readonly occurredAt: Date;
}
export interface RepairProblemCategoryDeletionRecord {
  readonly categoryId: string;
  readonly previousLabel: string;
  readonly scope: 'tenant';
  readonly version: number;
  readonly deletedAt: string;
}
export interface ChangeRepairProblemClassificationRecord {
  readonly repairId: string; readonly categoryId: string; readonly problemCaptureId: string; readonly eventId: string; readonly timelineEntryId: string;
  readonly correlationId: string; readonly action: 'repair.problem_category.assigned' | 'repair.problem_category.removed'; readonly occurredAt: Date;
}
export interface ResolveRepairProblemPendingRecord {
  readonly pendingProblemValueId: string;
  readonly canonicalCategoryId: string | null;
  readonly newCategoryId: string | null;
  readonly newCanonicalLabel: string | null;
  readonly newNormalizedKey: string | null;
  readonly eventId: string;
  readonly correlationId: string;
  readonly expectedVersion: number;
  readonly occurredAt: Date;
}
export class RepairProblemCategoryDuplicateError extends Error { constructor() { super('Repair problem category duplicates an effective catalog entry.'); this.name = 'RepairProblemCategoryDuplicateError'; } }
export class RepairProblemCategoryNotFoundError extends Error { constructor() { super('Repair problem category was not found.'); this.name = 'RepairProblemCategoryNotFoundError'; } }
export class RepairProblemPendingNotFoundError extends Error { constructor() { super('Pending reported problem was not found.'); this.name = 'RepairProblemPendingNotFoundError'; } }
export class RepairProblemCategoryConcurrencyConflictError extends Error { constructor() { super('Repair problem category version is stale.'); this.name = 'RepairProblemCategoryConcurrencyConflictError'; } }
export class RepairProblemCategoryDeleteNotAllowedError extends Error {
  constructor(readonly reason: 'platform_owned' | 'historical_references') { super('Repair problem category cannot be physically deleted.'); this.name = 'RepairProblemCategoryDeleteNotAllowedError'; }
}
export class RepairProblemCategoryAuthorizationChangedError extends Error { constructor() { super('Repair problem category authorization changed before confirmation.'); this.name = 'RepairProblemCategoryAuthorizationChangedError'; } }
export class RepairProblemClassificationNotFoundError extends Error { constructor() { super('Repair or problem classification was not found in the trusted scope.'); this.name = 'RepairProblemClassificationNotFoundError'; } }
export class RepairProblemClassificationConflictError extends Error { constructor() { super('Repair problem classification already has the requested state.'); this.name = 'RepairProblemClassificationConflictError'; } }
export class RepairProblemClassificationAuthorizationChangedError extends Error { constructor() { super('Repair problem classification authorization changed before confirmation.'); this.name = 'RepairProblemClassificationAuthorizationChangedError'; } }

export interface RepairModelRecord {
  readonly modelId: string;
  readonly canonicalBrandId: string;
  readonly brandLabel: string;
  readonly code: string | null;
  readonly canonicalLabel: string;
  readonly normalizedKey: string;
  readonly scope: RepairModelScope;
  readonly status: RepairModelStatus;
  readonly version: number;
  readonly usageCount: number;
  readonly deletable?: boolean;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface RepairModelPendingRecord {
  readonly pendingModelValueId: string;
  readonly canonicalBrandId: string | null;
  readonly brandLabel: string | null;
  readonly rawBrandLabel: string | null;
  readonly rawModelLabel: string;
  readonly normalizedModelKey: string;
  readonly resolutionStatus: 'pending' | 'resolved';
  readonly canonicalModelId: string | null;
  readonly canonicalModelLabel: string | null;
  readonly version: number;
  readonly usageCount: number;
  readonly firstSeenAt: string;
  readonly lastSeenAt: string;
}

export interface RepairModelCatalogContext {
  readonly tenantId: string;
  readonly branchId: string;
  readonly stationId: string;
  readonly sessionId: string;
  readonly actorUserId: string;
  readonly actorDisplayName: string;
  readonly capability: 'repairs.catalogs.manage';
  readonly commitGuard: Readonly<{
    confirmCurrent(transactionContext: object): Promise<boolean>;
    confirmTemporalCurrent(transactionContext: object): Promise<boolean>;
  }>;
}

export interface CreateRepairModelRecord {
  readonly modelId: string; readonly canonicalBrandId: string; readonly eventId: string; readonly correlationId: string;
  readonly canonicalLabel: string; readonly normalizedKey: string; readonly occurredAt: Date;
}
export interface ChangeRepairModelRecord {
  readonly modelId: string; readonly eventId: string; readonly correlationId: string; readonly expectedVersion: number;
  readonly canonicalLabel?: string; readonly normalizedKey?: string; readonly status?: RepairModelStatus;
  readonly action: 'repair_model.renamed' | 'repair_model.deactivated' | 'repair_model.reactivated'; readonly occurredAt: Date;
}
export interface ResolveRepairModelPendingRecord {
  readonly pendingModelValueId: string; readonly canonicalModelId: string | null; readonly newModelId: string | null;
  readonly newCanonicalLabel: string | null; readonly newNormalizedKey: string | null; readonly eventId: string;
  readonly correlationId: string; readonly expectedVersion: number; readonly occurredAt: Date;
}
export class RepairModelDuplicateError extends Error { constructor() { super('Repair model duplicates an effective Brand model.'); this.name = 'RepairModelDuplicateError'; } }
export class RepairModelNotFoundError extends Error { constructor() { super('Repair model or its canonical Brand was not found.'); this.name = 'RepairModelNotFoundError'; } }
export class RepairModelPendingNotFoundError extends Error { constructor() { super('Pending repair model was not found.'); this.name = 'RepairModelPendingNotFoundError'; } }
export class RepairModelConcurrencyConflictError extends Error { constructor() { super('Repair model version is stale.'); this.name = 'RepairModelConcurrencyConflictError'; } }
export class RepairModelAuthorizationChangedError extends Error { constructor() { super('Repair model authorization changed before confirmation.'); this.name = 'RepairModelAuthorizationChangedError'; } }

export interface RepairBrandRecord {
  readonly brandId: string;
  readonly code: string | null;
  readonly canonicalLabel: string;
  readonly normalizedKey: string;
  readonly scope: RepairBrandScope;
  readonly status: RepairBrandStatus;
  readonly version: number;
  readonly usageCount: number;
  readonly deletable: boolean;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface RepairBrandPendingRecord {
  readonly pendingBrandValueId: string;
  readonly rawLabel: string;
  readonly normalizedKey: string;
  readonly resolutionStatus: 'pending' | 'resolved';
  readonly canonicalBrandId: string | null;
  readonly canonicalLabel: string | null;
  readonly version: number;
  readonly usageCount: number;
  readonly firstSeenAt: string;
  readonly lastSeenAt: string;
}

export interface RepairBrandCatalogContext {
  readonly tenantId: string;
  readonly branchId: string;
  readonly stationId: string;
  readonly sessionId: string;
  readonly actorUserId: string;
  readonly actorDisplayName: string;
  readonly capability: 'repairs.catalogs.manage';
  readonly commitGuard: Readonly<{
    confirmCurrent(transactionContext: object): Promise<boolean>;
    confirmTemporalCurrent(transactionContext: object): Promise<boolean>;
  }>;
}

export interface CreateRepairBrandRecord {
  readonly brandId: string;
  readonly eventId: string;
  readonly correlationId: string;
  readonly canonicalLabel: string;
  readonly normalizedKey: string;
  readonly occurredAt: Date;
}

export interface ChangeRepairBrandRecord {
  readonly brandId: string;
  readonly eventId: string;
  readonly correlationId: string;
  readonly expectedVersion: number;
  readonly canonicalLabel?: string;
  readonly normalizedKey?: string;
  readonly status?: RepairBrandStatus;
  readonly action: 'repair_brand.renamed' | 'repair_brand.deactivated' | 'repair_brand.reactivated';
  readonly occurredAt: Date;
}

export interface ResolveRepairBrandPendingRecord {
  readonly pendingBrandValueId: string;
  readonly canonicalBrandId: string | null;
  readonly newBrandId: string | null;
  readonly newCanonicalLabel: string | null;
  readonly newNormalizedKey: string | null;
  readonly eventId: string;
  readonly correlationId: string;
  readonly expectedVersion: number;
  readonly occurredAt: Date;
}

export class RepairBrandDuplicateError extends Error { constructor() { super('Repair brand duplicates an effective catalog entry.'); this.name = 'RepairBrandDuplicateError'; } }
export class RepairBrandNotFoundError extends Error { constructor() { super('Repair brand was not found.'); this.name = 'RepairBrandNotFoundError'; } }
export class RepairBrandPendingNotFoundError extends Error { constructor() { super('Pending repair brand was not found.'); this.name = 'RepairBrandPendingNotFoundError'; } }
export class RepairBrandConcurrencyConflictError extends Error { constructor() { super('Repair brand version is stale.'); this.name = 'RepairBrandConcurrencyConflictError'; } }
export class RepairBrandAuthorizationChangedError extends Error { constructor() { super('Repair brand authorization changed before confirmation.'); this.name = 'RepairBrandAuthorizationChangedError'; } }

export interface RepairDeviceTypeRecord { readonly deviceTypeId: string; readonly code: string | null; readonly canonicalLabel: string; readonly normalizedKey: string; readonly scope: RepairDeviceTypeScope; readonly status: RepairDeviceTypeStatus; readonly version: number; readonly usageCount: number; readonly deletable?: boolean; readonly createdAt: string; readonly updatedAt: string; }
export interface RepairDeviceTypePendingRecord { readonly pendingDeviceTypeValueId: string; readonly rawLabel: string; readonly normalizedKey: string; readonly resolutionStatus: 'pending' | 'resolved'; readonly canonicalDeviceTypeId: string | null; readonly canonicalLabel: string | null; readonly version: number; readonly usageCount: number; readonly firstSeenAt: string; readonly lastSeenAt: string; }
export interface RepairDeviceTypeCatalogContext {
  readonly tenantId: string;
  readonly branchId: string;
  readonly stationId: string;
  readonly sessionId: string;
  readonly actorUserId: string;
  readonly actorDisplayName: string;
  readonly capability: 'repairs.catalogs.manage';
  readonly commitGuard: Readonly<{
    confirmCurrent(transactionContext: object): Promise<boolean>;
    confirmTemporalCurrent(transactionContext: object): Promise<boolean>;
  }>;
}
export interface CreateRepairDeviceTypeRecord { readonly deviceTypeId: string; readonly eventId: string; readonly correlationId: string; readonly canonicalLabel: string; readonly normalizedKey: string; readonly occurredAt: Date; }
export interface ChangeRepairDeviceTypeRecord { readonly deviceTypeId: string; readonly eventId: string; readonly correlationId: string; readonly expectedVersion: number; readonly canonicalLabel?: string; readonly normalizedKey?: string; readonly status?: RepairDeviceTypeStatus; readonly action: 'repair_device_type.renamed' | 'repair_device_type.deactivated' | 'repair_device_type.reactivated'; readonly occurredAt: Date; }
export interface ResolveRepairDeviceTypePendingRecord { readonly pendingDeviceTypeValueId: string; readonly canonicalDeviceTypeId: string | null; readonly newDeviceTypeId: string | null; readonly newCanonicalLabel: string | null; readonly newNormalizedKey: string | null; readonly eventId: string; readonly correlationId: string; readonly expectedVersion: number; readonly occurredAt: Date; }
export class RepairDeviceTypeDuplicateError extends Error { constructor() { super('Repair DeviceType duplicates an effective catalog entry.'); this.name = 'RepairDeviceTypeDuplicateError'; } }
export class RepairDeviceTypeNotFoundError extends Error { constructor() { super('Repair DeviceType was not found.'); this.name = 'RepairDeviceTypeNotFoundError'; } }
export class RepairDeviceTypePendingNotFoundError extends Error { constructor() { super('Pending repair DeviceType was not found.'); this.name = 'RepairDeviceTypePendingNotFoundError'; } }
export class RepairDeviceTypeConcurrencyConflictError extends Error { constructor() { super('Repair DeviceType version is stale.'); this.name = 'RepairDeviceTypeConcurrencyConflictError'; } }
export class RepairDeviceTypeAuthorizationChangedError extends Error { constructor() { super('Repair DeviceType authorization changed before confirmation.'); this.name = 'RepairDeviceTypeAuthorizationChangedError'; } }

export interface RepairRiskRecord {
  readonly riskId: string;
  readonly code: string | null;
  readonly canonicalLabel: string;
  readonly normalizedKey: string;
  readonly scope: RepairRiskScope;
  readonly status: RepairRiskStatus;
  readonly version: number;
  readonly usageCount: number;
  readonly deletable?: boolean;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface RepairAcceptedInterventionRiskRecord {
  readonly riskId: string;
  readonly label: string;
}

export interface RepairRiskCatalogContext {
  readonly tenantId: string;
  readonly branchId: string;
  readonly stationId: string;
  readonly sessionId: string;
  readonly actorUserId: string;
  readonly actorDisplayName: string;
  readonly capability: 'repairs.catalogs.manage';
  readonly commitGuard: Readonly<{
    confirmCurrent(transactionContext: object): Promise<boolean>;
    confirmTemporalCurrent(transactionContext: object): Promise<boolean>;
  }>;
}

export interface CreateRepairRiskRecord {
  readonly riskId: string;
  readonly eventId: string;
  readonly correlationId: string;
  readonly canonicalLabel: string;
  readonly normalizedKey: string;
  readonly occurredAt: Date;
}

export interface ChangeRepairRiskRecord {
  readonly riskId: string;
  readonly eventId: string;
  readonly correlationId: string;
  readonly expectedVersion: number;
  readonly canonicalLabel?: string;
  readonly normalizedKey?: string;
  readonly status?: RepairRiskStatus;
  readonly action: 'repair_risk.renamed' | 'repair_risk.deactivated' | 'repair_risk.reactivated';
  readonly occurredAt: Date;
}

export class RepairRiskDuplicateError extends Error {
  constructor() { super('Repair risk duplicates an effective catalog entry.'); this.name = 'RepairRiskDuplicateError'; }
}
export class RepairRiskNotFoundError extends Error {
  constructor() { super('Repair risk was not found in the tenant catalog.'); this.name = 'RepairRiskNotFoundError'; }
}
export class RepairRiskConcurrencyConflictError extends Error {
  constructor() { super('Repair risk version is stale.'); this.name = 'RepairRiskConcurrencyConflictError'; }
}
export class RepairRiskAuthorizationChangedError extends Error {
  constructor() { super('Repair risk authorization changed before confirmation.'); this.name = 'RepairRiskAuthorizationChangedError'; }
}

export type RepairCatalogReferenceKind = 'RISK' | 'DEVICE_TYPE' | 'BRAND' | 'MODEL';
export interface DeleteRepairCatalogReferenceRecord {
  readonly referenceId: string; readonly kind: RepairCatalogReferenceKind;
  readonly eventId: string; readonly correlationId: string;
  readonly expectedVersion: number; readonly occurredAt: Date;
}
export interface RepairCatalogReferenceDeletionRecord {
  readonly referenceId: string; readonly kind: RepairCatalogReferenceKind;
  readonly previousLabel: string; readonly scope: 'tenant'; readonly version: number; readonly deletedAt: string;
}
export class RepairCatalogReferenceDeleteNotAllowedError extends Error {
  constructor(readonly kind: RepairCatalogReferenceKind, readonly reason: 'platform_owned' | 'reference_in_use') {
    super('Repair catalog reference cannot be physically deleted.');
    this.name = 'RepairCatalogReferenceDeleteNotAllowedError';
  }
}

export interface RepairWorklistRecord {
  readonly id: string;
  readonly folio: string;
  readonly receivedAt: string;
  readonly customerName: string;
  readonly customerPhone: string | null;
  readonly deviceBrand: RepairBrandReadModel;
  readonly deviceModel: string | null;
  readonly canonicalModel: RepairModelReadModel;
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
  readonly deviceBrand: RepairBrandReadModel;
  readonly deviceModel: string | null;
  readonly canonicalModel: RepairModelReadModel;
  readonly equipmentVersion: number;
  readonly capturedBrand: string | null;
  readonly canonicalBrandId: string | null;
  readonly capturedModel: string | null;
  readonly canonicalModelId: string | null;
  readonly deviceColor: string | null;
  readonly deviceType: string | null;
  readonly deviceTypeIdentity: RepairDeviceTypeReadModel;
  readonly deviceIdentifier: string | null;
  readonly deviceIdentifierUnavailable: boolean;
  readonly distinctiveSigns: string | null;
  readonly simIncluded: boolean | null;
  readonly memoryCardIncluded: boolean | null;
  readonly otherAccessories: string | null;
  readonly receivedAt: string;
  readonly receivedById: string | null;
  readonly receivedByDisplayName: string | null;
  readonly reportedIssue: string | null;
  readonly customerNarrative: string | null;
  readonly physicalConditionSummary: string | null;
  readonly documentedRiskSummary: string | null;
  readonly acceptedInterventionRisks: readonly RepairAcceptedInterventionRiskRecord[];
  readonly problemClassifications: readonly RepairProblemClassificationRecord[];
  readonly receivedPowerState: RepairReceivedPowerState | null;
  readonly deviceAccessType: RepairDeviceAccessType | null;
  readonly initialBudgetAmountMinor: number | null;
  readonly newRepairPolicyVersion: number;
  readonly warrantyReviewRequested: boolean;
  readonly previousRepairId: string | null;
  readonly deliveredByName: string | null;
  readonly estimatedDeliveryAt: string | null;
  readonly technicianId: string | null;
  readonly technicianDisplayName: string | null;
  readonly technicianSummary: TechnicianSummaryRecord;
  readonly repairStatus: RepairStatusCode;
  readonly workflowSummary: Readonly<{
    version: number;
    source: 'history' | 'synthetic_projection';
  }>;
  readonly currentLocation: Readonly<{
    id: string;
    code: 'pending_area' | 'workshop';
    category: 'pending_area' | 'workshop';
    label: string;
    movedAt: string;
  }> | null;
  readonly locationVersion: number;
  readonly locationSource: 'history' | 'unrecorded';
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
  /**
   * Safe operational projection of the authoritative business-audit fact.
   * The audit store remains internal; arbitrary payloads are never projected.
   */
  readonly attribution: RepairOperationalNoteAttributionRecord | null;
}

export interface RepairOperationalNoteAttributionRecord {
  readonly tenantId: string;
  readonly branchId: string;
  readonly stationId: string;
  readonly sessionId: string;
  readonly actorUserId: string;
  readonly actorDisplayNameSnapshot: string;
  readonly capability: 'repairs.add_note';
  readonly action: 'repair.operational_note.added';
  readonly resourceType: 'repair';
  readonly resourceId: string;
  readonly result: 'succeeded';
  readonly correlationId: string;
  readonly occurredAt: string;
}

/** Server-derived authority for the approved real-actor Repairs write. */
export interface RepairOperationalNoteContext {
  readonly tenantId: string;
  readonly branchId: string;
  readonly stationId: string;
  readonly sessionId: string;
  readonly actorUserId: string;
  readonly actorDisplayName: string;
  readonly capability: 'repairs.add_note';
  readonly commitGuard: Readonly<{
    confirmCurrent(transactionContext: object): Promise<boolean>;
    confirmTemporalCurrent(transactionContext: object): Promise<boolean>;
  }>;
}

/** Server-derived authority for the PBI-039 Customer + Repair intake write. */
export interface RepairCreateContext {
  readonly tenantId: string;
  readonly branchId: string;
  readonly stationId: string;
  readonly sessionId: string;
  readonly actorUserId: string;
  readonly actorDisplayName: string;
  readonly capability: 'repairs.create';
  readonly commitGuard: Readonly<{
    confirmCurrent(transactionContext: object): Promise<boolean>;
    confirmTemporalCurrent(transactionContext: object): Promise<boolean>;
  }>;
}

/** Server-derived authority for the narrow Brand/Model correction command. */
export interface RepairEquipmentCorrectionContext {
  readonly tenantId: string;
  readonly branchId: string;
  readonly stationId: string;
  readonly sessionId: string;
  readonly actorUserId: string;
  readonly actorDisplayName: string;
  readonly capability: 'repairs.correct_intake';
  readonly commitGuard: Readonly<{
    confirmCurrent(transactionContext: object): Promise<boolean>;
    confirmTemporalCurrent(transactionContext: object): Promise<boolean>;
  }>;
}

export interface CorrectRepairEquipmentRecord {
  readonly correctionId: string;
  readonly repairId: string;
  readonly timelineEntryId: string;
  readonly auditEventId: string;
  readonly correlationId: string;
  readonly clientRequestId: string;
  readonly expectedVersion: number;
  readonly deviceBrand: string;
  readonly canonicalBrandId: string | null;
  readonly pendingBrandValueId: string;
  readonly deviceModel: string;
  readonly canonicalModelId: string | null;
  readonly pendingModelValueId: string;
  readonly reason: string;
  readonly action: 'repair.equipment.corrected';
  readonly occurredAt: Date;
}

export interface CorrectedRepairEquipmentRecord {
  readonly repairId: string;
  readonly equipmentVersion: number;
  readonly deviceBrand: string;
  readonly canonicalBrandId: string | null;
  readonly deviceModel: string;
  readonly canonicalModelId: string | null;
  readonly timelineItem: RepairTimelineItemRecord;
  readonly correlationId: string;
}

export class RepairEquipmentCorrectionNotFoundError extends Error { constructor() { super('Repair is not available for equipment correction.'); this.name = 'RepairEquipmentCorrectionNotFoundError'; } }
export class RepairEquipmentCorrectionIdempotencyConflictError extends Error { constructor() { super('Equipment correction request was reused with different content.'); this.name = 'RepairEquipmentCorrectionIdempotencyConflictError'; } }
export class RepairEquipmentCorrectionConcurrencyConflictError extends Error { constructor() { super('Equipment correction version is stale.'); this.name = 'RepairEquipmentCorrectionConcurrencyConflictError'; } }
export class RepairEquipmentCorrectionAuthorizationChangedError extends Error { constructor() { super('Equipment correction authorization changed before confirmation.'); this.name = 'RepairEquipmentCorrectionAuthorizationChangedError'; } }
export class RepairEquipmentCorrectionBrandUnavailableError extends Error { constructor() { super('Selected correction Brand is unavailable.'); this.name = 'RepairEquipmentCorrectionBrandUnavailableError'; } }
export class RepairEquipmentCorrectionModelUnavailableError extends Error { constructor() { super('Selected correction Model is unavailable or does not belong to the selected Brand.'); this.name = 'RepairEquipmentCorrectionModelUnavailableError'; } }

export interface RepairConfigurationContext {
  readonly tenantId: string;
  readonly branchId: string;
  readonly stationId: string;
  readonly sessionId: string;
  readonly actorUserId: string;
  readonly actorDisplayName: string;
  readonly capability: 'repairs.configuration.manage';
  readonly commitGuard: Readonly<{
    confirmCurrent(transactionContext: object): Promise<boolean>;
    confirmTemporalCurrent(transactionContext: object): Promise<boolean>;
  }>;
}

export interface NewRepairPolicyRecord {
  readonly schemaVersion: number;
  readonly policyVersion: number;
  readonly fieldStates: NewRepairFieldStates;
  readonly updatedAt: string | null;
}

export interface ChangeNewRepairPolicyRecord {
  readonly expectedVersion: number;
  readonly schemaVersion: number;
  readonly previousFieldStates: NewRepairFieldStates;
  readonly fieldStates: NewRepairFieldStates;
  readonly action: 'new_repair_policy.updated' | 'new_repair_policy.reset';
  readonly correlationId: string;
  readonly occurredAt: Date;
}

export class NewRepairPolicyConcurrencyConflictError extends Error {
  constructor() { super('New Repair field policy version is stale.'); this.name = 'NewRepairPolicyConcurrencyConflictError'; }
}

export class NewRepairPolicyAuthorizationChangedError extends Error {
  constructor() { super('New Repair field policy authorization changed.'); this.name = 'NewRepairPolicyAuthorizationChangedError'; }
}

export interface CreateRepairCustomerRecord {
  readonly customerId: string;
  readonly tenantId: string;
  readonly branchId: string;
  readonly givenName: string;
  readonly familyName: string | null;
  readonly displayName: string;
}

export interface CreateRepairRecord {
  readonly repairId: string;
  readonly timelineEntryId: string;
  readonly auditEventId: string;
  readonly correlationId: string;
  readonly clientRequestId: string;
  readonly customerId: string | null;
  readonly customerGivenName: string | null;
  readonly customerFamilyName: string | null;
  readonly customerPhone: string | null;
  readonly addCustomerContactPhone: boolean;
  readonly deviceType: string | null;
  readonly canonicalDeviceTypeId: string | null;
  readonly pendingDeviceTypeValueId: string | null;
  readonly deviceBrand: string | null;
  readonly canonicalBrandId: string | null;
  readonly pendingBrandValueId: string | null;
  readonly deviceModel: string | null;
  readonly canonicalModelId: string | null;
  readonly pendingModelValueId: string | null;
  readonly deviceIdentifier: string | null;
  readonly deviceIdentifierUnavailable: boolean;
  readonly deviceColor: string | null;
  readonly distinctiveSigns: string | null;
  readonly simIncluded: boolean | null;
  readonly memoryCardIncluded: boolean | null;
  readonly otherAccessories: string | null;
  readonly reportedIssueCompatibilitySummary: string;
  readonly reportedProblems: readonly Readonly<{
    problemCaptureId: string;
    pendingProblemValueId: string;
    rawLabel: string;
    normalizedKey: string;
    canonicalCategoryId: string | null;
  }>[];
  readonly customerNarrative: string | null;
  readonly physicalConditionSummary: string | null;
  readonly documentedRiskSummary: string | null;
  readonly acceptedRiskIds: readonly string[];
  readonly receivedPowerState: RepairReceivedPowerState | null;
  readonly deviceAccessType: RepairDeviceAccessType | null;
  readonly initialBudgetAmountMinor: number | null;
  readonly newRepairPolicyVersion: number;
  readonly warrantyReviewRequested: boolean;
  readonly previousRepairId: string | null;
  readonly deliveredByName: string | null;
  readonly estimatedDeliveryAt: Date | null;
  readonly action: 'repair.received';
  readonly occurredAt: Date;
  readonly folioYear: number;
}

export interface CreatedRepairRecord {
  readonly repairId: string;
  readonly folio: string;
  readonly customerId: string;
  readonly customerName: string;
  readonly customerPhone: string | null;
  readonly occurredAt: string;
  readonly correlationId: string;
  readonly newRepairPolicyVersion: number;
}

export type CreateRepairCustomerResolver = (
  transactionContext: object,
) => Promise<CreateRepairCustomerRecord>;

export class RepairCreateIdempotencyConflictError extends Error {
  constructor() { super('Repair creation request was reused with different content.'); this.name = 'RepairCreateIdempotencyConflictError'; }
}
export class RepairCreateAuthorizationChangedError extends Error {
  constructor() { super('Repair creation authorization changed before confirmation.'); this.name = 'RepairCreateAuthorizationChangedError'; }
}
export class RepairCreateRiskUnavailableError extends Error {
  constructor() { super('Selected repair risk is not active in the effective catalog.'); this.name = 'RepairCreateRiskUnavailableError'; }
}
export class RepairCreateBrandUnavailableError extends Error {
  constructor() { super('Selected repair brand is not active in the effective catalog.'); this.name = 'RepairCreateBrandUnavailableError'; }
}
export class RepairCreateDeviceTypeUnavailableError extends Error { constructor() { super('Selected repair DeviceType is not active in the effective catalog.'); this.name = 'RepairCreateDeviceTypeUnavailableError'; } }
export class RepairCreateModelUnavailableError extends Error {
  constructor() { super('Selected repair model is unavailable or conflicts with the canonical Brand.'); this.name = 'RepairCreateModelUnavailableError'; }
}
export class RepairCreateProblemCategoryUnavailableError extends Error {
  constructor() { super('Selected reported-problem category is unavailable.'); this.name = 'RepairCreateProblemCategoryUnavailableError'; }
}

export interface AddRepairOperationalNoteRecord {
  readonly repairId: string;
  readonly entryId: string;
  readonly auditEventId: string;
  readonly correlationId: string;
  readonly clientRequestId: string;
  readonly body: string;
  readonly action: 'repair.operational_note.added';
  readonly resourceType: 'repair';
  readonly result: 'succeeded';
  readonly occurredAt: Date;
}

export class RepairOperationalNoteIdempotencyConflictError extends Error {
  constructor() {
    super('Operational note idempotency key was reused with different content.');
    this.name = 'RepairOperationalNoteIdempotencyConflictError';
  }
}

export class RepairOperationalNoteAuthorizationChangedError extends Error {
  constructor() {
    super('Operational note authorization changed before confirmation.');
    this.name = 'RepairOperationalNoteAuthorizationChangedError';
  }
}

export class RepairOperationalNoteAuditIntegrityError extends Error {
  constructor() {
    super('Operational note and business audit evidence are inconsistent.');
    this.name = 'RepairOperationalNoteAuditIntegrityError';
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

export interface MoveRepairToWorkshopRecord {
  readonly repairId: string;
  readonly movementId: string;
  readonly timelineEntryId: string;
  readonly clientRequestId: string;
  readonly actorId: string;
  readonly actorDisplayName: string;
  readonly occurredAt: Date;
  readonly expectedVersion: number;
  readonly locationVersion: number;
  readonly reason: string | null;
  readonly fromLocation: Readonly<{ id: string; code: 'pending_area'; label: string }>;
  readonly toLocation: Readonly<{ id: string; code: 'workshop'; label: string }>;
}

export class RepairLocationIdempotencyConflictError extends Error {
  constructor() { super('Location request was reused with different content.'); this.name = 'RepairLocationIdempotencyConflictError'; }
}
export class RepairLocationConcurrencyConflictError extends Error {
  constructor() { super('Location version is stale.'); this.name = 'RepairLocationConcurrencyConflictError'; }
}
export class RepairLocationStateConflictError extends Error {
  constructor() { super('Current location does not allow this command.'); this.name = 'RepairLocationStateConflictError'; }
}
export class RepairLocationCustodyConflictError extends Error {
  constructor() { super('Ended custody does not allow this command.'); this.name = 'RepairLocationCustodyConflictError'; }
}
export class RepairLocationConfigurationError extends Error {
  constructor() { super('Workshop location is unavailable in this branch.'); this.name = 'RepairLocationConfigurationError'; }
}

export interface RepairRepositoryPort {
  listEffectiveActiveDeviceTypes(scope: RepairPersistenceScope, query?: string): Promise<readonly RepairDeviceTypeRecord[]>;
  listAdminDeviceTypes(scope: RepairPersistenceScope): Promise<readonly RepairDeviceTypeRecord[]>;
  listPendingDeviceTypes(scope: RepairPersistenceScope): Promise<readonly RepairDeviceTypePendingRecord[]>;
  createDeviceType(scope: RepairDeviceTypeCatalogContext, input: CreateRepairDeviceTypeRecord): Promise<RepairDeviceTypeRecord>;
  changeDeviceType(scope: RepairDeviceTypeCatalogContext, input: ChangeRepairDeviceTypeRecord): Promise<RepairDeviceTypeRecord>;
  deleteDeviceType(scope: RepairDeviceTypeCatalogContext, input: DeleteRepairCatalogReferenceRecord): Promise<RepairCatalogReferenceDeletionRecord>;
  resolvePendingDeviceType(scope: RepairDeviceTypeCatalogContext, input: ResolveRepairDeviceTypePendingRecord): Promise<RepairDeviceTypePendingRecord>;
  listEffectiveActiveProblemCategories(scope: RepairPersistenceScope): Promise<readonly RepairProblemCategoryRecord[]>;
  listAdminProblemCategories(scope: RepairPersistenceScope): Promise<readonly RepairProblemCategoryRecord[]>;
  listPendingProblems(scope: RepairPersistenceScope): Promise<readonly RepairProblemPendingRecord[]>;
  createProblemCategory(scope: RepairProblemCategoryCatalogContext, input: CreateRepairProblemCategoryRecord): Promise<RepairProblemCategoryRecord>;
  changeProblemCategory(scope: RepairProblemCategoryCatalogContext, input: ChangeRepairProblemCategoryRecord): Promise<RepairProblemCategoryRecord>;
  deleteProblemCategory(scope: RepairProblemCategoryCatalogContext, input: DeleteRepairProblemCategoryRecord): Promise<RepairProblemCategoryDeletionRecord>;
  resolvePendingProblem(scope: RepairProblemCategoryCatalogContext, input: ResolveRepairProblemPendingRecord): Promise<RepairProblemPendingRecord>;
  changeProblemClassification(scope: RepairClassificationContext, input: ChangeRepairProblemClassificationRecord): Promise<RepairProblemClassificationRecord>;
  listEffectiveActiveBrands(scope: RepairPersistenceScope, query?: string): Promise<readonly RepairBrandRecord[]>;
  listAdminBrands(scope: RepairPersistenceScope): Promise<readonly RepairBrandRecord[]>;
  listPendingBrands(scope: RepairPersistenceScope): Promise<readonly RepairBrandPendingRecord[]>;
  createBrand(scope: RepairBrandCatalogContext, input: CreateRepairBrandRecord): Promise<RepairBrandRecord>;
  changeBrand(scope: RepairBrandCatalogContext, input: ChangeRepairBrandRecord): Promise<RepairBrandRecord>;
  deleteBrand(scope: RepairBrandCatalogContext, input: DeleteRepairCatalogReferenceRecord): Promise<RepairCatalogReferenceDeletionRecord>;
  resolvePendingBrand(scope: RepairBrandCatalogContext, input: ResolveRepairBrandPendingRecord): Promise<RepairBrandPendingRecord>;
  listEffectiveActiveModels(scope: RepairPersistenceScope, canonicalBrandId: string, query?: string): Promise<readonly RepairModelRecord[]>;
  listAdminModels(scope: RepairPersistenceScope, canonicalBrandId: string | null): Promise<readonly RepairModelRecord[]>;
  listPendingModels(scope: RepairPersistenceScope, canonicalBrandId: string | null): Promise<readonly RepairModelPendingRecord[]>;
  createModel(scope: RepairModelCatalogContext, input: CreateRepairModelRecord): Promise<RepairModelRecord>;
  changeModel(scope: RepairModelCatalogContext, input: ChangeRepairModelRecord): Promise<RepairModelRecord>;
  deleteModel(scope: RepairModelCatalogContext, input: DeleteRepairCatalogReferenceRecord): Promise<RepairCatalogReferenceDeletionRecord>;
  resolvePendingModel(scope: RepairModelCatalogContext, input: ResolveRepairModelPendingRecord): Promise<RepairModelPendingRecord>;
  listEffectiveActiveRisks(scope: RepairPersistenceScope): Promise<readonly RepairRiskRecord[]>;
  listAdminRisks(scope: RepairPersistenceScope): Promise<readonly RepairRiskRecord[]>;
  deleteRisk(scope: RepairRiskCatalogContext, input: DeleteRepairCatalogReferenceRecord): Promise<RepairCatalogReferenceDeletionRecord>;
  createRisk(scope: RepairRiskCatalogContext, input: CreateRepairRiskRecord): Promise<RepairRiskRecord>;
  changeRisk(scope: RepairRiskCatalogContext, input: ChangeRepairRiskRecord): Promise<RepairRiskRecord>;
  readNewRepairPolicy(scope: RepairPersistenceScope): Promise<NewRepairPolicyRecord | null>;
  changeNewRepairPolicy(scope: RepairConfigurationContext, change: ChangeNewRepairPolicyRecord): Promise<NewRepairPolicyRecord>;
  listWorklist(
    scope: RepairPersistenceScope,
    query: RepairWorklistQuery,
    timeZone: BranchTimeZone,
  ): Promise<RepairWorklistPage>;
  getRepairById(
    scope: RepairPersistenceScope,
    repairId: string,
  ): Promise<RepairDetailRecord | null>;
  addOperationalNote(
    scope: RepairOperationalNoteContext,
    note: AddRepairOperationalNoteRecord,
  ): Promise<RepairTimelineItemRecord | null>;
  createRepair(
    scope: RepairCreateContext,
    repair: CreateRepairRecord,
    resolveCustomer: CreateRepairCustomerResolver,
  ): Promise<CreatedRepairRecord>;
  correctRepairEquipment(
    scope: RepairEquipmentCorrectionContext,
    correction: CorrectRepairEquipmentRecord,
  ): Promise<CorrectedRepairEquipmentRecord>;
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
  moveRepairToWorkshop(
    scope: RepairPersistenceScope,
    input: MoveRepairToWorkshopRecord,
  ): Promise<MoveRepairToWorkshopRecord | null>;
  getRepairEvidenceById(
    scope: RepairPersistenceScope,
    repairId: string,
    evidenceId: string,
  ): Promise<RepairEvidenceContentRecord | null>;
}
