import type { Kysely } from 'kysely';
import { createHash, randomUUID } from 'node:crypto';

import type { DatabaseConnection } from '../../../../infrastructure/database/database-connection.js';
import { useDatabasePersistenceExecutor, useTransactionalDatabasePersistenceExecutor } from '../../../../infrastructure/database/database-persistence-capability.js';
import { DatabaseTransactionError, runInTransaction } from '../../../../infrastructure/database/transaction-runner.js';
import type { InternalDatabasePersistenceOperation } from '../../../../infrastructure/database/database-persistence-capability.js';
import type { DatabaseSchema, RepairRow, RepairTechnicianAssignmentRow } from '../../../../infrastructure/database/database-types.js';
import { parseTenantId } from '../../../tenancy/index.js';
import {
  branchLocalCalendarBoundaryToUtc,
  branchLocalCalendarDate,
} from '../../../stations/index.js';
import type { BranchTimeZone } from '../../../stations/index.js';
import type {
  AddRepairOperationalNoteRecord,
  ChangeNewRepairPolicyRecord,
  ChangeRepairBrandRecord,
  ChangeRepairDeviceTypeRecord,
  ChangeRepairModelRecord,
  ChangeRepairRiskRecord,
  ChangeRepairProblemCategoryRecord,
  DeleteRepairProblemCategoryRecord,
  ChangeRepairProblemClassificationRecord,
  CreateRepairBrandRecord,
  CreateRepairDeviceTypeRecord,
  CreateRepairModelRecord,
  CreateRepairRiskRecord,
  CreateRepairProblemCategoryRecord,
  CreateRepairCustomerResolver,
  RepairCreateContext,
  RepairBrandCatalogContext,
  RepairBrandPendingRecord,
  RepairBrandRecord,
  RepairDeviceTypeCatalogContext,
  RepairDeviceTypePendingRecord,
  RepairDeviceTypeRecord,
  RepairModelCatalogContext,
  RepairModelPendingRecord,
  RepairModelRecord,
  RepairConfigurationContext,
  CreateRepairRecord,
  CorrectRepairEquipmentRecord,
  CorrectedRepairEquipmentRecord,
  CreatedRepairRecord,
  AssignRepairTechnicianRecord,
  RepairPersistenceScope,
  RepairDetailRecord,
  RepairEvidenceContentRecord,
  RepairEvidenceItemRecord,
  RepairOperationalNoteContext,
  RepairEquipmentCorrectionContext,
  RepairRepositoryPort,
  RepairRiskCatalogContext,
  RepairRiskRecord,
  RepairProblemCategoryCatalogContext,
  RepairProblemCategoryRecord,
  RepairProblemCategoryDeletionRecord,
  RepairProblemClassificationRecord,
  RepairProblemPendingRecord,
  RepairClassificationContext,
  ResolveRepairBrandPendingRecord,
  ResolveRepairDeviceTypePendingRecord,
  ResolveRepairModelPendingRecord,
  ResolveRepairProblemPendingRecord,
  NewRepairPolicyRecord,
  RepairOperationalNoteAttributionRecord,
  RepairTimelineItemRecord,
  RepairWorklistPage,
  RepairWorklistQuery,
  RepairWorklistRecord,
  RepairTechnicianRecord,
  TechnicianAssignmentHistoryRecord,
  ReassignRepairTechnicianRecord,
  MoveRepairToWorkshopRecord,
  StartRepairDiagnosisRecord,
  UnassignRepairTechnicianRecord,
} from '../../application/ports/repair-repository.port.js';
import { NewRepairPolicyAuthorizationChangedError, NewRepairPolicyConcurrencyConflictError, RepairBrandAuthorizationChangedError, RepairBrandConcurrencyConflictError, RepairBrandDuplicateError, RepairBrandNotFoundError, RepairBrandPendingNotFoundError, RepairCreateAuthorizationChangedError, RepairCreateBrandUnavailableError, RepairCreateIdempotencyConflictError, RepairCreateModelUnavailableError, RepairCreateProblemCategoryUnavailableError, RepairCreateRiskUnavailableError, RepairEquipmentCorrectionAuthorizationChangedError, RepairEquipmentCorrectionBrandUnavailableError, RepairEquipmentCorrectionConcurrencyConflictError, RepairEquipmentCorrectionIdempotencyConflictError, RepairEquipmentCorrectionModelUnavailableError, RepairEquipmentCorrectionNotFoundError, RepairLocationConcurrencyConflictError, RepairLocationConfigurationError, RepairLocationCustodyConflictError, RepairLocationIdempotencyConflictError, RepairLocationStateConflictError, RepairModelAuthorizationChangedError, RepairModelConcurrencyConflictError, RepairModelDuplicateError, RepairModelNotFoundError, RepairModelPendingNotFoundError, RepairOperationalNoteAuditIntegrityError, RepairOperationalNoteAuthorizationChangedError, RepairOperationalNoteIdempotencyConflictError, RepairRiskAuthorizationChangedError, RepairRiskConcurrencyConflictError, RepairRiskDuplicateError, RepairRiskNotFoundError, RepairProblemCategoryAuthorizationChangedError, RepairProblemCategoryConcurrencyConflictError, RepairProblemCategoryDeleteNotAllowedError, RepairProblemCategoryDuplicateError, RepairProblemCategoryNotFoundError, RepairProblemPendingNotFoundError, RepairProblemClassificationAuthorizationChangedError, RepairProblemClassificationConflictError, RepairProblemClassificationNotFoundError, RepairTechnicianConcurrencyConflictError, RepairTechnicianEligibilityError, RepairTechnicianIdempotencyConflictError, RepairTechnicianStateConflictError, RepairWorkflowConcurrencyConflictError, RepairWorkflowCustodyConflictError, RepairWorkflowIdempotencyConflictError, RepairWorkflowStateConflictError } from '../../application/ports/repair-repository.port.js';
import { RepairCreateDeviceTypeUnavailableError, RepairDeviceTypeAuthorizationChangedError, RepairDeviceTypeConcurrencyConflictError, RepairDeviceTypeDuplicateError, RepairDeviceTypeNotFoundError, RepairDeviceTypePendingNotFoundError } from '../../application/ports/repair-repository.port.js';
import { normalizeRepairDeviceTypeKey } from '../../application/repair-device-type-catalog.service.js';
import { resolveRepairDeviceTypeReadModel } from '../../application/repair-device-type-read-model.js';
import { normalizeRepairBrandKey } from '../../application/repair-brand-catalog.service.js';
import { resolveRepairBrandReadModel } from '../../application/repair-brand-read-model.js';
import { normalizeRepairModelKey } from '../../application/repair-model-catalog.service.js';
import { resolveRepairModelReadModel } from '../../application/repair-model-read-model.js';
import { validateNewRepairFieldStates } from '../../domain/new-repair-field-policy.js';
import {
  custodyStatusCodes,
  repairStatusCodes,
} from '../../domain/repair-status.js';

type RepairTables = 'repair_device_types' | 'repair_device_type_pending_values' | 'repair_device_type_catalog_events' | 'repair_attachments' | 'repair_business_audit_events' | 'repair_intakes' | 'repair_equipment_corrections' | 'repair_brands' | 'repair_brand_pending_values' | 'repair_brand_catalog_events' | 'repair_models' | 'repair_model_pending_values' | 'repair_model_catalog_events' | 'repair_risks' | 'repair_intervention_risks' | 'repair_risk_catalog_events' | 'repair_problem_categories' | 'repair_problem_pending_values' | 'repair_problem_category_catalog_events' | 'repair_problem_category_deletion_events' | 'repair_problem_classifications' | 'repair_problem_classification_events' | 'repair_operational_note_request_guards' | 'repair_timeline_entries' | 'repairs' | 'repair_technicians' | 'repair_technician_branches' | 'repair_technician_assignments' | 'repair_workflow_transitions' | 'repair_locations' | 'repair_location_movements' | 'repair_create_commands' | 'repair_folio_sequences' | 'repair_new_repair_policy_heads' | 'repair_new_repair_policy_versions';
type RepairExecutor = Kysely<Pick<DatabaseSchema, RepairTables>>;
type ExecuteRepairOperation<Result> = InternalDatabasePersistenceOperation<'repairs', Result>;
type ExecuteRepairTransaction<Result> = (
  executor: RepairExecutor,
  transactionContext: object,
) => Promise<Result>;

const branchUuid =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/u;
const repairTimelineLimit = 20;
const repairEvidenceLimit = 20;
const operationalNoteTimelineSource = 'repairs.operational_note';
const repairReceivedTimelineSource = 'repairs.received';
const repairEquipmentCorrectionTimelineSource = 'repairs.equipment_correction';
const repairProblemClassificationTimelineSource = 'repairs.problem_classification';

function validateScope(scope: RepairPersistenceScope): RepairPersistenceScope {
  const tenantId = parseTenantId(scope?.tenantId);
  if (typeof scope?.branchId !== 'string' || !branchUuid.test(scope.branchId)) {
    throw new TypeError('Repair branch scope must be a canonical UUID.');
  }
  return Object.freeze({ tenantId, branchId: scope.branchId });
}

function dateRange(
  query: RepairWorklistQuery,
  referenceDate: Date,
  timeZone: BranchTimeZone,
): Readonly<{ from?: Date | undefined; to?: Date | undefined }> {
  const addCalendarDays = (date: string, days: number): string => {
    const calendar = new Date(`${date}T00:00:00.000Z`);
    calendar.setUTCDate(calendar.getUTCDate() + days);
    return calendar.toISOString().slice(0, 10);
  };
  let from = query.from
    ? branchLocalCalendarBoundaryToUtc(query.from, timeZone)
    : undefined;
  let to = query.to
    ? branchLocalCalendarBoundaryToUtc(addCalendarDays(query.to, 1), timeZone)
    : undefined;
  if (query.period && query.period !== 'all') {
    const localDate = branchLocalCalendarDate(referenceDate, timeZone);
    if (query.period === 'today') {
      from = branchLocalCalendarBoundaryToUtc(localDate, timeZone);
      to = branchLocalCalendarBoundaryToUtc(addCalendarDays(localDate, 1), timeZone);
    } else if (query.period === 'month') {
      const monthStart = `${localDate.slice(0, 7)}-01`;
      from = branchLocalCalendarBoundaryToUtc(monthStart, timeZone);
      to = branchLocalCalendarBoundaryToUtc(
        `${addCalendarDays(monthStart, 32).slice(0, 7)}-01`,
        timeZone,
      );
    } else {
      const weekday = new Date(`${localDate}T00:00:00.000Z`).getUTCDay();
      const mondayOffset = weekday === 0 ? -6 : 1 - weekday;
      const weekStart = addCalendarDays(localDate, mondayOffset);
      from = branchLocalCalendarBoundaryToUtc(weekStart, timeZone);
      to = branchLocalCalendarBoundaryToUtc(addCalendarDays(weekStart, 7), timeZone);
    }
  }
  return Object.freeze({ from, to });
}

function literalLikePattern(value: string): string {
  return `%${value.replace(/[\\%_]/gu, '\\$&')}%`;
}

type RepairWorklistProjection = RepairRow & Readonly<{
  projected_repair_status: string;
  canonical_brand_id: string | null;
  canonical_brand_label: string | null;
  canonical_model_id: string | null;
  canonical_model_label: string | null;
  canonical_model_brand_id: string | null;
  effective_reported_issue?: string | undefined;
}>;

function mapRepair(row: RepairWorklistProjection): RepairWorklistRecord {
  if (!repairStatusCodes.includes(row.projected_repair_status as (typeof repairStatusCodes)[number])) {
    throw new Error('Database contains an unknown repair status.');
  }
  if (!custodyStatusCodes.includes(row.custody_status as (typeof custodyStatusCodes)[number])) {
    throw new Error('Database contains an unknown custody status.');
  }
  return Object.freeze({
    id: row.repair_id,
    folio: row.folio,
    receivedAt: row.received_at.toISOString(),
    customerName: row.customer_name,
    customerPhone: row.customer_phone,
    deviceBrand: resolveRepairBrandReadModel(
      row.device_brand,
      row.canonical_brand_id,
      row.canonical_brand_label,
    ),
    deviceModel: row.device_model,
    canonicalModel: resolveRepairModelReadModel(row.device_model, row.canonical_model_id, row.canonical_model_label, row.canonical_model_brand_id, row.canonical_brand_id),
    reportedIssue: row.effective_reported_issue ?? row.reported_issue,
    technicianId: row.technician_id,
    technicianDisplayName: row.technician_display_name,
    repairStatus: row.projected_repair_status as RepairWorklistRecord['repairStatus'],
    custodyStatus: row.custody_status as RepairWorklistRecord['custodyStatus'],
  });
}

function technicianProjection(
  row: RepairWorklistProjection,
  assignment: AssignmentProjection | undefined,
): RepairWorklistRecord {
  return mapRepair({
    ...row,
    technician_id: assignment?.technician_id ?? null,
    technician_display_name: assignment?.technician_display_name ?? null,
  });
}

interface RepairDetailProjection {
  readonly repair_id: string;
  readonly folio: string;
  readonly customer_name: string;
  readonly customer_phone: string | null;
  readonly device_brand: string | null;
  readonly canonical_brand_id: string | null;
  readonly canonical_brand_label: string | null;
  readonly canonical_model_id: string | null;
  readonly canonical_model_label: string | null;
  readonly canonical_model_brand_id: string | null;
  readonly device_model: string | null;
  readonly equipment_version: number | null;
  readonly device_color: string | null;
  readonly device_type: string | null;
  readonly canonical_device_type_id: string | null;
  readonly canonical_device_type_label: string | null;
  readonly device_identifier: string | null;
  readonly device_identifier_unavailable: boolean | null;
  readonly distinctive_signs: string | null;
  readonly sim_included: boolean | null;
  readonly memory_card_included: boolean | null;
  readonly other_accessories: string | null;
  readonly received_at: Date;
  readonly received_by_id: string | null;
  readonly received_by_display_name: string | null;
  readonly reported_issue: string;
  readonly customer_narrative: string | null;
  readonly physical_condition_summary: string | null;
  readonly documented_risk_summary: string | null;
  readonly received_power_state: 'powered_on' | 'powered_off' | null;
  readonly device_access_type: 'none' | 'pin' | 'password' | 'pattern' | null;
  readonly initial_budget_amount_minor: string | null;
  readonly new_repair_policy_version: number | null;
  readonly warranty_review_requested: boolean | null;
  readonly previous_repair_id: string | null;
  readonly delivered_by_name: string | null;
  readonly estimated_delivery_at: Date | null;
  readonly technician_id: string | null;
  readonly technician_display_name: string | null;
  readonly repair_status: string;
  readonly projected_repair_status: string;
  readonly workflow_version: number;
  readonly custody_status: string;
}

interface AssignmentProjection extends RepairTechnicianAssignmentRow {
  readonly technician_display_name: string;
}

type AssignmentCommandOutcome<T> = T | Readonly<{ error: Error }>;

function assignmentCommandError<T>(error: Error): AssignmentCommandOutcome<T> {
  return Object.freeze({ error });
}

type OperationalNoteCommandOutcome<T> = T | Readonly<{ error: Error }>;

function operationalNoteCommandError<T>(error: Error): OperationalNoteCommandOutcome<T> {
  return Object.freeze({ error });
}

type RepairBrandProjection = Readonly<{
  brand_id: string;
  code: string | null;
  canonical_label: string;
  normalized_key: string;
  scope: 'platform' | 'tenant';
  status: 'active' | 'inactive';
  version: number;
  created_at: Date;
  updated_at: Date;
  usage_count: string | number | bigint;
}>;

function mapRepairBrand(row: RepairBrandProjection): RepairBrandRecord {
  return Object.freeze({
    brandId: row.brand_id, code: row.code, canonicalLabel: row.canonical_label,
    normalizedKey: row.normalized_key, scope: row.scope, status: row.status,
    version: row.version, usageCount: Number(row.usage_count),
    createdAt: row.created_at.toISOString(), updatedAt: row.updated_at.toISOString(),
  });
}

type RepairBrandPendingProjection = Readonly<{
  pending_brand_value_id: string;
  raw_label_example: string;
  normalized_key: string;
  resolution_status: 'pending' | 'resolved';
  canonical_brand_id: string | null;
  canonical_label: string | null;
  version: number;
  first_seen_at: Date;
  last_seen_at: Date;
  usage_count: string | number | bigint;
}>;

function mapRepairBrandPending(row: RepairBrandPendingProjection): RepairBrandPendingRecord {
  return Object.freeze({
    pendingBrandValueId: row.pending_brand_value_id, rawLabel: row.raw_label_example,
    normalizedKey: row.normalized_key, resolutionStatus: row.resolution_status,
    canonicalBrandId: row.canonical_brand_id, canonicalLabel: row.canonical_label,
    version: row.version, usageCount: Number(row.usage_count),
    firstSeenAt: row.first_seen_at.toISOString(), lastSeenAt: row.last_seen_at.toISOString(),
  });
}

type RepairDeviceTypeProjection = Readonly<{ device_type_id: string; code: string | null; canonical_label: string; normalized_key: string; scope: 'platform' | 'tenant'; status: 'active' | 'inactive'; version: number; created_at: Date; updated_at: Date; usage_count: string | number | bigint }>;
function mapRepairDeviceType(row: RepairDeviceTypeProjection): RepairDeviceTypeRecord { return Object.freeze({ deviceTypeId: row.device_type_id, code: row.code, canonicalLabel: row.canonical_label, normalizedKey: row.normalized_key, scope: row.scope, status: row.status, version: row.version, usageCount: Number(row.usage_count), createdAt: row.created_at.toISOString(), updatedAt: row.updated_at.toISOString() }); }
type RepairDeviceTypePendingProjection = Readonly<{ pending_device_type_value_id: string; raw_label_example: string; normalized_key: string; resolution_status: 'pending' | 'resolved'; canonical_device_type_id: string | null; canonical_label: string | null; version: number; first_seen_at: Date; last_seen_at: Date; usage_count: string | number | bigint }>;
function mapRepairDeviceTypePending(row: RepairDeviceTypePendingProjection): RepairDeviceTypePendingRecord { return Object.freeze({ pendingDeviceTypeValueId: row.pending_device_type_value_id, rawLabel: row.raw_label_example, normalizedKey: row.normalized_key, resolutionStatus: row.resolution_status, canonicalDeviceTypeId: row.canonical_device_type_id, canonicalLabel: row.canonical_label, version: row.version, usageCount: Number(row.usage_count), firstSeenAt: row.first_seen_at.toISOString(), lastSeenAt: row.last_seen_at.toISOString() }); }

type RepairModelProjection = Readonly<{
  model_id: string;
  canonical_brand_id: string;
  canonical_brand_label: string;
  code: string | null;
  canonical_label: string;
  normalized_key: string;
  scope: 'platform' | 'tenant';
  status: 'active' | 'inactive';
  version: number;
  created_at: Date;
  updated_at: Date;
  usage_count: string | number | bigint;
}>;

function mapRepairModel(row: RepairModelProjection): RepairModelRecord {
  return Object.freeze({
    modelId: row.model_id,
    canonicalBrandId: row.canonical_brand_id,
    brandLabel: row.canonical_brand_label,
    code: row.code,
    canonicalLabel: row.canonical_label,
    normalizedKey: row.normalized_key,
    scope: row.scope,
    status: row.status,
    version: row.version,
    usageCount: Number(row.usage_count),
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  });
}

type RepairModelPendingProjection = Readonly<{
  pending_model_value_id: string;
  canonical_brand_id: string | null;
  canonical_brand_label: string | null;
  pending_brand_value_id: string | null;
  raw_brand_label_example: string | null;
  pending_brand_label: string | null;
  pending_brand_canonical_id: string | null;
  pending_brand_canonical_label: string | null;
  raw_model_label_example: string;
  normalized_model_key: string;
  resolution_status: 'pending' | 'resolved';
  canonical_model_id: string | null;
  canonical_model_label: string | null;
  version: number;
  first_seen_at: Date;
  last_seen_at: Date;
  usage_count: string | number | bigint;
}>;

function mapRepairModelPending(row: RepairModelPendingProjection): RepairModelPendingRecord {
  const canonicalBrandId = row.canonical_brand_id ?? row.pending_brand_canonical_id;
  const canonicalBrandLabel = row.canonical_brand_label ?? row.pending_brand_canonical_label;
  return Object.freeze({
    pendingModelValueId: row.pending_model_value_id,
    canonicalBrandId,
    brandLabel: canonicalBrandLabel,
    rawBrandLabel: canonicalBrandLabel ?? row.pending_brand_label ?? row.raw_brand_label_example,
    rawModelLabel: row.raw_model_label_example,
    normalizedModelKey: row.normalized_model_key,
    resolutionStatus: row.resolution_status,
    canonicalModelId: row.canonical_model_id,
    canonicalModelLabel: row.canonical_model_label,
    version: row.version,
    usageCount: Number(row.usage_count),
    firstSeenAt: row.first_seen_at.toISOString(),
    lastSeenAt: row.last_seen_at.toISOString(),
  });
}

type RepairRiskProjection = Readonly<{
  risk_id: string;
  code: string | null;
  canonical_label: string;
  normalized_key: string;
  scope: 'platform' | 'tenant';
  status: 'active' | 'inactive';
  version: number;
  created_at: Date;
  updated_at: Date;
  usage_count: string | number | bigint;
}>;

function mapRepairRisk(row: RepairRiskProjection): RepairRiskRecord {
  return Object.freeze({
    riskId: row.risk_id,
    code: row.code,
    canonicalLabel: row.canonical_label,
    normalizedKey: row.normalized_key,
    scope: row.scope,
    status: row.status,
    version: row.version,
    usageCount: Number(row.usage_count),
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  });
}

type RepairProblemCategoryProjection = Readonly<{
  category_id: string; code: string | null; canonical_label: string; normalized_key: string;
  scope: 'platform' | 'tenant'; status: 'active' | 'inactive'; version: number;
  created_at: Date; updated_at: Date; usage_count: string | number | bigint; historically_referenced: boolean | number;
}>;

function mapRepairProblemCategory(row: RepairProblemCategoryProjection): RepairProblemCategoryRecord {
  return Object.freeze({ categoryId: row.category_id, code: row.code, canonicalLabel: row.canonical_label, normalizedKey: row.normalized_key, scope: row.scope, status: row.status, version: row.version, usageCount: Number(row.usage_count), deletable: row.scope === 'tenant' && !row.historically_referenced, createdAt: row.created_at.toISOString(), updatedAt: row.updated_at.toISOString() });
}

type RepairProblemPendingProjection = Readonly<{
  pending_problem_value_id: string; raw_label_example: string; normalized_key: string;
  resolution_status: 'pending' | 'resolved'; canonical_category_id: string | null;
  canonical_label: string | null; version: number; usage_count: string | number | bigint;
  first_seen_at: Date; last_seen_at: Date;
}>;

function mapRepairProblemPending(row: RepairProblemPendingProjection): RepairProblemPendingRecord {
  return Object.freeze({ pendingProblemValueId: row.pending_problem_value_id, rawLabel: row.raw_label_example, normalizedKey: row.normalized_key, resolutionStatus: row.resolution_status, canonicalCategoryId: row.canonical_category_id, canonicalLabel: row.canonical_label, version: row.version, usageCount: Number(row.usage_count), firstSeenAt: row.first_seen_at.toISOString(), lastSeenAt: row.last_seen_at.toISOString() });
}

function mapAssignmentHistory(row: AssignmentProjection): TechnicianAssignmentHistoryRecord {
  return Object.freeze({
    assignmentId: row.assignment_id,
    technician: Object.freeze({ id: row.technician_id, displayName: row.technician_display_name }),
    assignedAt: row.assigned_at.toISOString(),
    endedAt: row.ended_at?.toISOString() ?? null,
    reason: row.reason,
    assignedBy: Object.freeze({ id: row.assigned_by_actor_id, displayName: row.assigned_by_actor_display_name }),
    endedBy: row.ended_by_actor_id && row.ended_by_actor_display_name
      ? Object.freeze({ id: row.ended_by_actor_id, displayName: row.ended_by_actor_display_name })
      : null,
  });
}

interface RepairTimelineEntryProjection {
  readonly entry_id: string;
  readonly entry_type: string;
  readonly actor_id: string | null;
  readonly actor_display_name: string;
  readonly title: string | null;
  readonly body: string | null;
  readonly source: string;
  readonly client_request_id: string | null;
  readonly occurred_at: Date;
}

interface RepairBusinessAuditProjection {
  readonly tenant_id: string;
  readonly branch_id: string;
  readonly station_id: string;
  readonly session_id: string;
  readonly actor_user_id: string;
  readonly actor_display_name: string;
  readonly capability: 'repairs.add_note' | 'repairs.create' | 'repairs.correct_intake';
  readonly action: 'repair.operational_note.added' | 'repair.received' | 'repair.equipment.corrected';
  readonly resource_type: 'repair';
  readonly resource_id: string;
  readonly result: 'succeeded';
  readonly correlation_id: string;
  readonly client_request_id: string;
  readonly occurred_at: Date;
}

interface RepairEvidenceProjection {
  readonly attachment_id: string;
  readonly kind: string;
  readonly category: string;
  readonly captured_at: Date | null;
  readonly uploaded_at: Date;
  readonly uploaded_by_id: string | null;
  readonly uploaded_by_display_name: string | null;
  readonly mime_type: string;
  readonly width: number | null;
  readonly height: number | null;
  readonly caption: string | null;
}

interface LocationProjection {
  readonly location_id: string;
  readonly code: string;
  readonly semantic_category: string;
  readonly display_label: string;
  readonly occurred_at: Date;
  readonly location_version: number;
}

function mapEvidence(row: RepairEvidenceProjection): RepairEvidenceItemRecord {
  if (row.kind !== 'photo' || (row.category !== 'intake' && row.category !== 'general') || row.mime_type !== 'image/png') {
    throw new Error('Database contains unsupported repair evidence metadata.');
  }
  if ((row.uploaded_by_id === null) !== (row.uploaded_by_display_name === null)) {
    throw new Error('Database contains incomplete repair evidence uploader metadata.');
  }
  return Object.freeze({
    id: row.attachment_id,
    kind: row.kind,
    category: row.category,
    capturedAt: row.captured_at?.toISOString() ?? null,
    uploadedAt: row.uploaded_at.toISOString(),
    uploadedBy: row.uploaded_by_id && row.uploaded_by_display_name
      ? Object.freeze({ id: row.uploaded_by_id, displayName: row.uploaded_by_display_name })
      : null,
    mimeType: row.mime_type,
    width: row.width,
    height: row.height,
    caption: row.caption,
  });
}

function mapAuditAttribution(
  row: RepairBusinessAuditProjection,
): RepairOperationalNoteAttributionRecord {
  if (row.capability !== 'repairs.add_note' || row.action !== 'repair.operational_note.added') {
    throw new Error('Database contains unsupported Repair note audit attribution.');
  }
  return Object.freeze({
    tenantId: row.tenant_id,
    branchId: row.branch_id,
    stationId: row.station_id,
    sessionId: row.session_id,
    actorUserId: row.actor_user_id,
    actorDisplayNameSnapshot: row.actor_display_name,
    capability: row.capability,
    action: row.action,
    resourceType: row.resource_type,
    resourceId: row.resource_id,
    result: row.result,
    correlationId: row.correlation_id,
    occurredAt: row.occurred_at.toISOString(),
  });
}

function mapTimelineEntry(
  row: RepairTimelineEntryProjection,
  audit: RepairBusinessAuditProjection | null = null,
): RepairTimelineItemRecord {
  if (row.entry_type !== 'note' && row.entry_type !== 'system_event') {
    throw new Error('Database contains an unknown repair timeline type.');
  }
  if (row.entry_type === 'note' && !row.actor_id) {
    throw new Error('Database contains a repair note without an actor.');
  }
  return Object.freeze({
    id: row.entry_id,
    occurredAt: row.occurred_at.toISOString(),
    type: row.entry_type,
    actorId: audit?.actor_user_id ?? row.actor_id,
    actorDisplayName: audit?.actor_display_name ?? row.actor_display_name,
    title: row.title,
    body: row.body,
    source: row.source,
    attribution: row.entry_type === 'note' && audit ? mapAuditAttribution(audit) : null,
  });
}

function mapRepairDetail(
  row: RepairDetailProjection,
  acceptedInterventionRisks: readonly Readonly<{ risk_id: string; risk_label_snapshot: string }>[],
  problemClassifications: readonly Readonly<{ problem_capture_id: string; category_id: string | null; raw_problem_label_snapshot: string; canonical_label: string | null; status: 'active' | 'inactive' | null; stage: 'intake' | 'post_intake' }>[],
  timelineItems: readonly RepairTimelineItemRecord[],
  timelineTotalCount: number,
  evidenceItems: readonly RepairEvidenceItemRecord[],
  evidenceTotalCount: number,
  assignmentHistory: readonly TechnicianAssignmentHistoryRecord[] = [],
  assignmentVersion = assignmentHistory.length,
  location?: LocationProjection,
): RepairDetailRecord {
  if (!repairStatusCodes.includes(row.projected_repair_status as (typeof repairStatusCodes)[number])) {
    throw new Error('Database contains an unknown repair status.');
  }
  if (!custodyStatusCodes.includes(row.custody_status as (typeof custodyStatusCodes)[number])) {
    throw new Error('Database contains an unknown custody status.');
  }
  return Object.freeze({
    id: row.repair_id,
    folio: row.folio,
    customerName: row.customer_name,
    customerPhone: row.customer_phone,
    deviceBrand: resolveRepairBrandReadModel(
      row.device_brand,
      row.canonical_brand_id,
      row.canonical_brand_label,
    ),
    deviceModel: row.device_model,
    canonicalModel: resolveRepairModelReadModel(row.device_model, row.canonical_model_id, row.canonical_model_label, row.canonical_model_brand_id, row.canonical_brand_id),
    equipmentVersion: row.equipment_version ?? 0,
    capturedBrand: row.device_brand,
    canonicalBrandId: row.canonical_brand_id,
    capturedModel: row.device_model,
    canonicalModelId: row.canonical_model_id,
    deviceColor: row.device_color,
    deviceType: resolveRepairDeviceTypeReadModel(row.device_type, row.canonical_device_type_id, row.canonical_device_type_label).effectiveLabel,
    deviceTypeIdentity: resolveRepairDeviceTypeReadModel(row.device_type, row.canonical_device_type_id, row.canonical_device_type_label),
    deviceIdentifier: row.device_identifier,
    deviceIdentifierUnavailable: row.device_identifier_unavailable ?? false,
    distinctiveSigns: row.distinctive_signs,
    simIncluded: row.sim_included,
    memoryCardIncluded: row.memory_card_included,
    otherAccessories: row.other_accessories,
    receivedAt: row.received_at.toISOString(),
    receivedById: row.received_by_id,
    receivedByDisplayName: row.received_by_display_name,
    reportedIssue: row.reported_issue,
    customerNarrative: row.customer_narrative,
    physicalConditionSummary: row.physical_condition_summary,
    documentedRiskSummary: row.documented_risk_summary,
    acceptedInterventionRisks: Object.freeze(acceptedInterventionRisks.map((risk) => Object.freeze({ riskId: risk.risk_id, label: risk.risk_label_snapshot }))),
    problemClassifications: Object.freeze(problemClassifications.map((category) => Object.freeze({ problemCaptureId: category.problem_capture_id, categoryId: category.category_id, rawLabel: category.raw_problem_label_snapshot, label: category.canonical_label ?? category.raw_problem_label_snapshot, status: category.status ?? 'pending', stage: category.stage }))),
    receivedPowerState: row.received_power_state,
    deviceAccessType: row.device_access_type,
    initialBudgetAmountMinor: row.initial_budget_amount_minor === null ? null : Number(row.initial_budget_amount_minor),
    newRepairPolicyVersion: row.new_repair_policy_version ?? 0,
    warrantyReviewRequested: row.warranty_review_requested ?? false,
    previousRepairId: row.previous_repair_id,
    deliveredByName: row.delivered_by_name,
    estimatedDeliveryAt: row.estimated_delivery_at?.toISOString() ?? null,
    technicianId: row.technician_id,
    technicianDisplayName: row.technician_display_name,
    technicianSummary: Object.freeze({
      current: row.technician_id && row.technician_display_name
        ? Object.freeze({ id: row.technician_id, displayName: row.technician_display_name })
        : null,
      version: assignmentVersion,
      historyCount: assignmentHistory.length,
      history: Object.freeze([...assignmentHistory]),
    }),
    repairStatus: row.projected_repair_status as RepairDetailRecord['repairStatus'],
    workflowSummary: Object.freeze({
      version: Number(row.workflow_version),
      source: Number(row.workflow_version) > 0 ? 'history' : 'synthetic_projection',
    }),
    currentLocation: location ? Object.freeze({
      id: location.location_id,
      code: location.code as 'pending_area' | 'workshop',
      category: location.semantic_category as 'pending_area' | 'workshop',
      label: location.display_label,
      movedAt: location.occurred_at.toISOString(),
    }) : null,
    locationVersion: location?.location_version ?? 0,
    locationSource: location ? 'history' : 'unrecorded',
    custodyStatus: row.custody_status as RepairDetailRecord['custodyStatus'],
    timeline: Object.freeze({
      items: Object.freeze([...timelineItems]),
      totalCount: timelineTotalCount,
      limit: repairTimelineLimit,
    }),
    evidence: Object.freeze({
      items: Object.freeze([...evidenceItems]),
      totalCount: evidenceTotalCount,
      limit: repairEvidenceLimit,
    }),
  });
}

class KyselyRepairRepository implements RepairRepositoryPort {
  constructor(
    readonly execute: <Result>(operation: ExecuteRepairOperation<Result>) => Promise<Result>,
    readonly executeTransaction: <Result>(operation: ExecuteRepairTransaction<Result>) => Promise<Result>,
    readonly now: () => Date,
  ) {}

  async #runAssignmentTransaction<Result>(
    operation: ExecuteRepairOperation<Result>,
  ): Promise<Result> {
    try {
      return await this.executeTransaction(operation);
    } catch (error: unknown) {
      if (
        error instanceof DatabaseTransactionError &&
        (error.code === 'DATABASE_TRANSACTION_SERIALIZATION_FAILURE' ||
          error.code === 'DATABASE_TRANSACTION_DEADLOCK' ||
          error.code === 'DATABASE_TRANSACTION_NESTED_FORBIDDEN')
      ) {
        throw new RepairTechnicianConcurrencyConflictError();
      }
      throw error;
    }
  }

  async #runWorkflowTransaction<Result>(operation: ExecuteRepairOperation<Result>): Promise<Result> {
    try {
      return await this.executeTransaction(operation);
    } catch (error: unknown) {
      if (
        error instanceof DatabaseTransactionError &&
        (error.code === 'DATABASE_TRANSACTION_SERIALIZATION_FAILURE' ||
          error.code === 'DATABASE_TRANSACTION_DEADLOCK' ||
          error.code === 'DATABASE_TRANSACTION_NESTED_FORBIDDEN')
      ) throw new RepairWorkflowConcurrencyConflictError();
      throw error;
    }
  }

  async #runLocationTransaction<Result>(operation: ExecuteRepairOperation<Result>): Promise<Result> {
    try {
      return await this.executeTransaction(operation);
    } catch (error: unknown) {
      if (
        error instanceof DatabaseTransactionError &&
        (error.code === 'DATABASE_TRANSACTION_SERIALIZATION_FAILURE' ||
          error.code === 'DATABASE_TRANSACTION_DEADLOCK' ||
          error.code === 'DATABASE_TRANSACTION_NESTED_FORBIDDEN')
      ) throw new RepairLocationConcurrencyConflictError();
      throw error;
    }
  }

  async #runOperationalNoteTransaction<Result>(
    operation: ExecuteRepairTransaction<Result>,
  ): Promise<Result> {
    try {
      return await this.executeTransaction(operation);
    } catch (error: unknown) {
      if (
        error instanceof DatabaseTransactionError &&
        (error.code === 'DATABASE_TRANSACTION_SERIALIZATION_FAILURE' ||
          error.code === 'DATABASE_TRANSACTION_DEADLOCK')
      ) {
        // This command has a durable idempotency key. One bounded retry lets a
        // concurrent exact replay observe and return the already-committed pair.
        return this.executeTransaction(operation);
      }
      throw error;
    }
  }

  async #runCreateTransaction<Result>(operation: ExecuteRepairTransaction<Result>): Promise<Result> {
    try {
      return await this.executeTransaction(operation);
    } catch (error: unknown) {
      if (error instanceof DatabaseTransactionError && (error.code === 'DATABASE_TRANSACTION_SERIALIZATION_FAILURE' || error.code === 'DATABASE_TRANSACTION_DEADLOCK')) return this.executeTransaction(operation);
      throw error;
    }
  }

  async listEffectiveActiveDeviceTypes(scope: RepairPersistenceScope, query = ''): Promise<readonly RepairDeviceTypeRecord[]> {
    const validatedScope = validateScope(scope); const normalizedQuery = normalizeRepairDeviceTypeKey(query);
    return this.execute(async (executor) => {
      let statement = executor.selectFrom('repair_device_types')
        .leftJoin('repair_intakes', (join) => join.onRef('repair_intakes.canonical_device_type_id', '=', 'repair_device_types.device_type_id').on('repair_intakes.tenant_id', '=', validatedScope.tenantId))
        .leftJoin('repair_device_type_pending_values', (join) => join.onRef('repair_device_type_pending_values.canonical_device_type_id', '=', 'repair_device_types.device_type_id').on('repair_device_type_pending_values.tenant_id', '=', validatedScope.tenantId).on('repair_device_type_pending_values.resolution_status', '=', 'resolved'))
        .select(['repair_device_types.device_type_id', 'repair_device_types.code', 'repair_device_types.canonical_label', 'repair_device_types.normalized_key', 'repair_device_types.scope', 'repair_device_types.status', 'repair_device_types.version', 'repair_device_types.created_at', 'repair_device_types.updated_at'])
        .select(({ fn }) => fn.count('repair_intakes.repair_id').distinct().as('usage_count')).where('repair_device_types.status', '=', 'active')
        .where((eb) => eb.or([eb('repair_device_types.scope', '=', 'platform'), eb.and([eb('repair_device_types.scope', '=', 'tenant'), eb('repair_device_types.tenant_id', '=', validatedScope.tenantId)])]));
      if (normalizedQuery) { const pattern = literalLikePattern(normalizedQuery); statement = statement.where((eb) => eb.or([eb('repair_device_types.normalized_key', 'ilike', pattern), eb('repair_device_type_pending_values.normalized_key', 'ilike', pattern)])); }
      const rows = await statement.groupBy(['repair_device_types.device_type_id', 'repair_device_types.code', 'repair_device_types.canonical_label', 'repair_device_types.normalized_key', 'repair_device_types.scope', 'repair_device_types.status', 'repair_device_types.version', 'repair_device_types.created_at', 'repair_device_types.updated_at']).orderBy('repair_device_types.scope', 'asc').orderBy('repair_device_types.canonical_label', 'asc').limit(12).execute();
      return Object.freeze(rows.map(mapRepairDeviceType));
    });
  }
  async listAdminDeviceTypes(scope: RepairPersistenceScope): Promise<readonly RepairDeviceTypeRecord[]> {
    const validatedScope = validateScope(scope); return this.execute(async (executor) => { const rows = await executor.selectFrom('repair_device_types').leftJoin('repair_intakes', (join) => join.onRef('repair_intakes.canonical_device_type_id', '=', 'repair_device_types.device_type_id').on('repair_intakes.tenant_id', '=', validatedScope.tenantId)).select(['repair_device_types.device_type_id', 'repair_device_types.code', 'repair_device_types.canonical_label', 'repair_device_types.normalized_key', 'repair_device_types.scope', 'repair_device_types.status', 'repair_device_types.version', 'repair_device_types.created_at', 'repair_device_types.updated_at']).select(({ fn }) => fn.count('repair_intakes.repair_id').distinct().as('usage_count')).where((eb) => eb.or([eb('repair_device_types.scope', '=', 'platform'), eb.and([eb('repair_device_types.scope', '=', 'tenant'), eb('repair_device_types.tenant_id', '=', validatedScope.tenantId)])])).groupBy(['repair_device_types.device_type_id', 'repair_device_types.code', 'repair_device_types.canonical_label', 'repair_device_types.normalized_key', 'repair_device_types.scope', 'repair_device_types.status', 'repair_device_types.version', 'repair_device_types.created_at', 'repair_device_types.updated_at']).orderBy('repair_device_types.status', 'asc').orderBy('repair_device_types.canonical_label', 'asc').execute(); return Object.freeze(rows.map(mapRepairDeviceType)); });
  }
  async listPendingDeviceTypes(scope: RepairPersistenceScope): Promise<readonly RepairDeviceTypePendingRecord[]> {
    const validatedScope = validateScope(scope); return this.execute(async (executor) => { const rows = await executor.selectFrom('repair_device_type_pending_values').leftJoin('repair_device_types', 'repair_device_types.device_type_id', 'repair_device_type_pending_values.canonical_device_type_id').leftJoin('repair_intakes', (join) => join.onRef('repair_intakes.pending_device_type_value_id', '=', 'repair_device_type_pending_values.pending_device_type_value_id').on('repair_intakes.tenant_id', '=', validatedScope.tenantId)).select(['repair_device_type_pending_values.pending_device_type_value_id', 'repair_device_type_pending_values.raw_label_example', 'repair_device_type_pending_values.normalized_key', 'repair_device_type_pending_values.resolution_status', 'repair_device_type_pending_values.canonical_device_type_id', 'repair_device_types.canonical_label', 'repair_device_type_pending_values.version', 'repair_device_type_pending_values.first_seen_at', 'repair_device_type_pending_values.last_seen_at']).select(({ fn }) => fn.count('repair_intakes.repair_id').distinct().as('usage_count')).where('repair_device_type_pending_values.tenant_id', '=', validatedScope.tenantId).where('repair_device_type_pending_values.resolution_status', '=', 'pending').groupBy(['repair_device_type_pending_values.pending_device_type_value_id', 'repair_device_types.canonical_label']).having(({ fn }) => fn.count('repair_intakes.repair_id').distinct(), '>', 0).orderBy('repair_device_type_pending_values.last_seen_at', 'desc').execute(); return Object.freeze(rows.map(mapRepairDeviceTypePending)); });
  }
  async createDeviceType(scope: RepairDeviceTypeCatalogContext, input: CreateRepairDeviceTypeRecord): Promise<RepairDeviceTypeRecord> {
    const validatedScope = validateScope(scope); const outcome = await this.executeTransaction<RepairDeviceTypeRecord | Readonly<{ error: Error }>>(async (executor, tx) => { const duplicate = await executor.selectFrom('repair_device_types').select('device_type_id').where('normalized_key', '=', input.normalizedKey).where((eb) => eb.or([eb('scope', '=', 'platform'), eb.and([eb('scope', '=', 'tenant'), eb('tenant_id', '=', validatedScope.tenantId)])])).executeTakeFirst(); if (duplicate) return { error: new RepairDeviceTypeDuplicateError() }; if (!await scope.commitGuard.confirmCurrent(tx) || !await scope.commitGuard.confirmTemporalCurrent(tx)) return { error: new RepairDeviceTypeAuthorizationChangedError() }; await executor.insertInto('repair_device_types').values({ device_type_id: input.deviceTypeId, scope: 'tenant', tenant_id: validatedScope.tenantId, code: null, canonical_label: input.canonicalLabel, normalized_key: input.normalizedKey, status: 'active', version: 1, created_by_actor_id: scope.actorUserId, updated_by_actor_id: scope.actorUserId, created_at: input.occurredAt, updated_at: input.occurredAt }).execute(); await executor.insertInto('repair_device_type_catalog_events').values({ event_id: input.eventId, tenant_id: validatedScope.tenantId, device_type_id: input.deviceTypeId, pending_device_type_value_id: null, station_id: scope.stationId, session_id: scope.sessionId, actor_user_id: scope.actorUserId, actor_display_name: scope.actorDisplayName, capability: scope.capability, action: 'repair_device_type.created', old_version: null, new_version: 1, old_label: null, new_label: input.canonicalLabel, old_status: null, new_status: 'active', old_canonical_device_type_id: null, new_canonical_device_type_id: input.deviceTypeId, result: 'succeeded', correlation_id: input.correlationId, occurred_at: input.occurredAt }).execute(); return { deviceTypeId: input.deviceTypeId, code: null, canonicalLabel: input.canonicalLabel, normalizedKey: input.normalizedKey, scope: 'tenant', status: 'active', version: 1, usageCount: 0, createdAt: input.occurredAt.toISOString(), updatedAt: input.occurredAt.toISOString() }; }); if ('error' in outcome) throw outcome.error; return Object.freeze(outcome);
  }
  async changeDeviceType(scope: RepairDeviceTypeCatalogContext, input: ChangeRepairDeviceTypeRecord): Promise<RepairDeviceTypeRecord> {
    const validatedScope = validateScope(scope); const outcome = await this.executeTransaction<RepairDeviceTypeRecord | Readonly<{ error: Error }>>(async (executor, tx) => { const current = await executor.selectFrom('repair_device_types').selectAll().where('device_type_id', '=', input.deviceTypeId).where('scope', '=', 'tenant').where('tenant_id', '=', validatedScope.tenantId).forUpdate().executeTakeFirst(); if (!current) return { error: new RepairDeviceTypeNotFoundError() }; if (current.version !== input.expectedVersion || (input.status !== undefined && current.status === input.status)) return { error: new RepairDeviceTypeConcurrencyConflictError() }; if (input.normalizedKey) { const duplicate = await executor.selectFrom('repair_device_types').select('device_type_id').where('device_type_id', '!=', input.deviceTypeId).where('normalized_key', '=', input.normalizedKey).where((eb) => eb.or([eb('scope', '=', 'platform'), eb.and([eb('scope', '=', 'tenant'), eb('tenant_id', '=', validatedScope.tenantId)])])).executeTakeFirst(); if (duplicate) return { error: new RepairDeviceTypeDuplicateError() }; } if (!await scope.commitGuard.confirmCurrent(tx) || !await scope.commitGuard.confirmTemporalCurrent(tx)) return { error: new RepairDeviceTypeAuthorizationChangedError() }; const canonicalLabel = input.canonicalLabel ?? current.canonical_label; const normalizedKey = input.normalizedKey ?? current.normalized_key; const status = input.status ?? current.status; const nextVersion = current.version + 1; await executor.updateTable('repair_device_types').set({ canonical_label: canonicalLabel, normalized_key: normalizedKey, status, version: nextVersion, updated_by_actor_id: scope.actorUserId, updated_at: input.occurredAt }).where('device_type_id', '=', input.deviceTypeId).execute(); await executor.insertInto('repair_device_type_catalog_events').values({ event_id: input.eventId, tenant_id: validatedScope.tenantId, device_type_id: input.deviceTypeId, pending_device_type_value_id: null, station_id: scope.stationId, session_id: scope.sessionId, actor_user_id: scope.actorUserId, actor_display_name: scope.actorDisplayName, capability: scope.capability, action: input.action, old_version: current.version, new_version: nextVersion, old_label: current.canonical_label, new_label: canonicalLabel, old_status: current.status, new_status: status, old_canonical_device_type_id: input.deviceTypeId, new_canonical_device_type_id: input.deviceTypeId, result: 'succeeded', correlation_id: input.correlationId, occurred_at: input.occurredAt }).execute(); const usage = await executor.selectFrom('repair_intakes').select(({ fn }) => fn.countAll().as('count')).where('tenant_id', '=', validatedScope.tenantId).where('canonical_device_type_id', '=', input.deviceTypeId).executeTakeFirstOrThrow(); return { deviceTypeId: input.deviceTypeId, code: current.code, canonicalLabel, normalizedKey, scope: 'tenant', status, version: nextVersion, usageCount: Number(usage.count), createdAt: current.created_at.toISOString(), updatedAt: input.occurredAt.toISOString() }; }); if ('error' in outcome) throw outcome.error; return Object.freeze(outcome);
  }
  async resolvePendingDeviceType(scope: RepairDeviceTypeCatalogContext, input: ResolveRepairDeviceTypePendingRecord): Promise<RepairDeviceTypePendingRecord> {
    const validatedScope = validateScope(scope); const outcome = await this.executeTransaction<RepairDeviceTypePendingRecord | Readonly<{ error: Error }>>(async (executor, tx) => { const pending = await executor.selectFrom('repair_device_type_pending_values').selectAll().where('pending_device_type_value_id', '=', input.pendingDeviceTypeValueId).where('tenant_id', '=', validatedScope.tenantId).forUpdate().executeTakeFirst(); if (!pending) return { error: new RepairDeviceTypePendingNotFoundError() }; if (pending.version !== input.expectedVersion || pending.resolution_status !== 'pending') return { error: new RepairDeviceTypeConcurrencyConflictError() }; let deviceTypeId = input.canonicalDeviceTypeId; let canonicalLabel: string; let action: 'repair_device_type_pending.resolved' | 'repair_device_type_pending.canonical_created' = 'repair_device_type_pending.resolved'; if (input.newDeviceTypeId && input.newCanonicalLabel && input.newNormalizedKey) { const duplicate = await executor.selectFrom('repair_device_types').select('device_type_id').where('normalized_key', '=', input.newNormalizedKey).where((eb) => eb.or([eb('scope', '=', 'platform'), eb.and([eb('scope', '=', 'tenant'), eb('tenant_id', '=', validatedScope.tenantId)])])).executeTakeFirst(); if (duplicate) return { error: new RepairDeviceTypeDuplicateError() }; deviceTypeId = input.newDeviceTypeId; canonicalLabel = input.newCanonicalLabel; action = 'repair_device_type_pending.canonical_created'; } else { const item = deviceTypeId ? await executor.selectFrom('repair_device_types').select(['device_type_id', 'canonical_label']).where('device_type_id', '=', deviceTypeId).where('status', '=', 'active').where((eb) => eb.or([eb('scope', '=', 'platform'), eb.and([eb('scope', '=', 'tenant'), eb('tenant_id', '=', validatedScope.tenantId)])])).forShare().executeTakeFirst() : undefined; if (!item) return { error: new RepairDeviceTypeNotFoundError() }; canonicalLabel = item.canonical_label; } if (!await scope.commitGuard.confirmCurrent(tx) || !await scope.commitGuard.confirmTemporalCurrent(tx)) return { error: new RepairDeviceTypeAuthorizationChangedError() }; if (action === 'repair_device_type_pending.canonical_created') await executor.insertInto('repair_device_types').values({ device_type_id: deviceTypeId!, scope: 'tenant', tenant_id: validatedScope.tenantId, code: null, canonical_label: canonicalLabel!, normalized_key: input.newNormalizedKey!, status: 'active', version: 1, created_by_actor_id: scope.actorUserId, updated_by_actor_id: scope.actorUserId, created_at: input.occurredAt, updated_at: input.occurredAt }).execute(); const nextVersion = pending.version + 1; await executor.updateTable('repair_device_type_pending_values').set({ resolution_status: 'resolved', canonical_device_type_id: deviceTypeId, version: nextVersion, resolved_by_actor_id: scope.actorUserId, resolved_at: input.occurredAt }).where('pending_device_type_value_id', '=', input.pendingDeviceTypeValueId).execute(); await executor.updateTable('repair_intakes').set({ canonical_device_type_id: deviceTypeId }).where('tenant_id', '=', validatedScope.tenantId).where('pending_device_type_value_id', '=', input.pendingDeviceTypeValueId).execute(); await executor.insertInto('repair_device_type_catalog_events').values({ event_id: input.eventId, tenant_id: validatedScope.tenantId, device_type_id: deviceTypeId, pending_device_type_value_id: input.pendingDeviceTypeValueId, station_id: scope.stationId, session_id: scope.sessionId, actor_user_id: scope.actorUserId, actor_display_name: scope.actorDisplayName, capability: scope.capability, action, old_version: pending.version, new_version: nextVersion, old_label: pending.raw_label_example, new_label: canonicalLabel!, old_status: 'pending', new_status: 'resolved', old_canonical_device_type_id: null, new_canonical_device_type_id: deviceTypeId, result: 'succeeded', correlation_id: input.correlationId, occurred_at: input.occurredAt }).execute(); const usage = await executor.selectFrom('repair_intakes').select(({ fn }) => fn.countAll().as('count')).where('tenant_id', '=', validatedScope.tenantId).where('pending_device_type_value_id', '=', input.pendingDeviceTypeValueId).executeTakeFirstOrThrow(); return { pendingDeviceTypeValueId: pending.pending_device_type_value_id, rawLabel: pending.raw_label_example, normalizedKey: pending.normalized_key, resolutionStatus: 'resolved', canonicalDeviceTypeId: deviceTypeId, canonicalLabel: canonicalLabel!, version: nextVersion, usageCount: Number(usage.count), firstSeenAt: pending.first_seen_at.toISOString(), lastSeenAt: pending.last_seen_at.toISOString() }; }); if ('error' in outcome) throw outcome.error; return Object.freeze(outcome);
  }

  async listEffectiveActiveBrands(scope: RepairPersistenceScope, query = ''): Promise<readonly RepairBrandRecord[]> {
    const validatedScope = validateScope(scope);
    const normalizedQuery = normalizeRepairBrandKey(query);
    return this.execute(async (executor) => {
      let statement = executor.selectFrom('repair_brands')
        .leftJoin('repair_intakes', (join) => join
          .onRef('repair_intakes.canonical_brand_id', '=', 'repair_brands.brand_id')
          .on('repair_intakes.tenant_id', '=', validatedScope.tenantId))
        .leftJoin('repair_brand_pending_values', (join) => join
          .onRef('repair_brand_pending_values.canonical_brand_id', '=', 'repair_brands.brand_id')
          .on('repair_brand_pending_values.tenant_id', '=', validatedScope.tenantId)
          .on('repair_brand_pending_values.resolution_status', '=', 'resolved'))
        .select([
          'repair_brands.brand_id', 'repair_brands.code', 'repair_brands.canonical_label',
          'repair_brands.normalized_key', 'repair_brands.scope', 'repair_brands.status',
          'repair_brands.version', 'repair_brands.created_at', 'repair_brands.updated_at',
        ])
        .select(({ fn }) => fn.count('repair_intakes.repair_id').distinct().as('usage_count'))
        .where('repair_brands.status', '=', 'active')
        .where((expression) => expression.or([
          expression('repair_brands.scope', '=', 'platform'),
          expression.and([expression('repair_brands.scope', '=', 'tenant'), expression('repair_brands.tenant_id', '=', validatedScope.tenantId)]),
        ]));
      if (normalizedQuery) {
        const pattern = literalLikePattern(normalizedQuery);
        statement = statement.where((expression) => expression.or([
          expression('repair_brands.normalized_key', 'ilike', pattern),
          expression('repair_brand_pending_values.normalized_key', 'ilike', pattern),
        ]));
      }
      const rows = await statement.groupBy([
        'repair_brands.brand_id', 'repair_brands.code', 'repair_brands.canonical_label',
        'repair_brands.normalized_key', 'repair_brands.scope', 'repair_brands.status',
        'repair_brands.version', 'repair_brands.created_at', 'repair_brands.updated_at',
      ]).orderBy('repair_brands.scope', 'asc').orderBy('repair_brands.canonical_label', 'asc').orderBy('repair_brands.brand_id', 'asc').limit(12).execute();
      return Object.freeze(rows.map(mapRepairBrand));
    });
  }

  async listAdminBrands(scope: RepairPersistenceScope): Promise<readonly RepairBrandRecord[]> {
    const validatedScope = validateScope(scope);
    return this.execute(async (executor) => {
      const rows = await executor.selectFrom('repair_brands')
        .leftJoin('repair_intakes', (join) => join.onRef('repair_intakes.canonical_brand_id', '=', 'repair_brands.brand_id').on('repair_intakes.tenant_id', '=', validatedScope.tenantId))
        .select(['repair_brands.brand_id', 'repair_brands.code', 'repair_brands.canonical_label', 'repair_brands.normalized_key', 'repair_brands.scope', 'repair_brands.status', 'repair_brands.version', 'repair_brands.created_at', 'repair_brands.updated_at'])
        .select(({ fn }) => fn.count('repair_intakes.repair_id').distinct().as('usage_count'))
        .where((expression) => expression.or([
          expression('repair_brands.scope', '=', 'platform'),
          expression.and([expression('repair_brands.scope', '=', 'tenant'), expression('repair_brands.tenant_id', '=', validatedScope.tenantId)]),
        ]))
        .groupBy(['repair_brands.brand_id', 'repair_brands.code', 'repair_brands.canonical_label', 'repair_brands.normalized_key', 'repair_brands.scope', 'repair_brands.status', 'repair_brands.version', 'repair_brands.created_at', 'repair_brands.updated_at'])
        .orderBy('repair_brands.status', 'asc').orderBy('repair_brands.canonical_label', 'asc').execute();
      return Object.freeze(rows.map(mapRepairBrand));
    });
  }

  async listPendingBrands(scope: RepairPersistenceScope): Promise<readonly RepairBrandPendingRecord[]> {
    const validatedScope = validateScope(scope);
    return this.execute(async (executor) => {
      const rows = await executor.selectFrom('repair_brand_pending_values')
        .leftJoin('repair_brands', 'repair_brands.brand_id', 'repair_brand_pending_values.canonical_brand_id')
        .leftJoin('repair_intakes', (join) => join.onRef('repair_intakes.pending_brand_value_id', '=', 'repair_brand_pending_values.pending_brand_value_id').on('repair_intakes.tenant_id', '=', validatedScope.tenantId))
        .select(['repair_brand_pending_values.pending_brand_value_id', 'repair_brand_pending_values.raw_label_example', 'repair_brand_pending_values.normalized_key', 'repair_brand_pending_values.resolution_status', 'repair_brand_pending_values.canonical_brand_id', 'repair_brands.canonical_label', 'repair_brand_pending_values.version', 'repair_brand_pending_values.first_seen_at', 'repair_brand_pending_values.last_seen_at'])
        .select(({ fn }) => fn.count('repair_intakes.repair_id').distinct().as('usage_count'))
        .where('repair_brand_pending_values.tenant_id', '=', validatedScope.tenantId)
        .where('repair_brand_pending_values.resolution_status', '=', 'pending')
        .groupBy(['repair_brand_pending_values.pending_brand_value_id', 'repair_brands.canonical_label'])
        .having(({ fn }) => fn.count('repair_intakes.repair_id').distinct(), '>', 0)
        .orderBy('repair_brand_pending_values.last_seen_at', 'desc').execute();
      return Object.freeze(rows.map(mapRepairBrandPending));
    });
  }

  async createBrand(scope: RepairBrandCatalogContext, input: CreateRepairBrandRecord): Promise<RepairBrandRecord> {
    const validatedScope = validateScope(scope);
    const outcome = await this.executeTransaction<RepairBrandRecord | Readonly<{ error: Error }>>(async (executor, transactionContext) => {
      const duplicate = await executor.selectFrom('repair_brands').select('brand_id').where('normalized_key', '=', input.normalizedKey).where((expression) => expression.or([
        expression('scope', '=', 'platform'),
        expression.and([expression('scope', '=', 'tenant'), expression('tenant_id', '=', validatedScope.tenantId)]),
      ])).executeTakeFirst();
      if (duplicate) return { error: new RepairBrandDuplicateError() };
      if (!await scope.commitGuard.confirmCurrent(transactionContext) || !await scope.commitGuard.confirmTemporalCurrent(transactionContext)) return { error: new RepairBrandAuthorizationChangedError() };
      await executor.insertInto('repair_brands').values({ brand_id: input.brandId, scope: 'tenant', tenant_id: validatedScope.tenantId, code: null, canonical_label: input.canonicalLabel, normalized_key: input.normalizedKey, status: 'active', version: 1, created_by_actor_id: scope.actorUserId, updated_by_actor_id: scope.actorUserId, created_at: input.occurredAt, updated_at: input.occurredAt }).execute();
      await executor.insertInto('repair_brand_catalog_events').values({ event_id: input.eventId, tenant_id: validatedScope.tenantId, brand_id: input.brandId, pending_brand_value_id: null, station_id: scope.stationId, session_id: scope.sessionId, actor_user_id: scope.actorUserId, actor_display_name: scope.actorDisplayName, capability: scope.capability, action: 'repair_brand.created', old_version: null, new_version: 1, old_label: null, new_label: input.canonicalLabel, old_status: null, new_status: 'active', old_canonical_brand_id: null, new_canonical_brand_id: input.brandId, result: 'succeeded', correlation_id: input.correlationId, occurred_at: input.occurredAt }).execute();
      return { brandId: input.brandId, code: null, canonicalLabel: input.canonicalLabel, normalizedKey: input.normalizedKey, scope: 'tenant', status: 'active', version: 1, usageCount: 0, createdAt: input.occurredAt.toISOString(), updatedAt: input.occurredAt.toISOString() };
    });
    if ('error' in outcome) throw outcome.error;
    return Object.freeze(outcome);
  }

  async changeBrand(scope: RepairBrandCatalogContext, input: ChangeRepairBrandRecord): Promise<RepairBrandRecord> {
    const validatedScope = validateScope(scope);
    const outcome = await this.executeTransaction<RepairBrandRecord | Readonly<{ error: Error }>>(async (executor, transactionContext) => {
      const current = await executor.selectFrom('repair_brands').selectAll().where('brand_id', '=', input.brandId).where('scope', '=', 'tenant').where('tenant_id', '=', validatedScope.tenantId).forUpdate().executeTakeFirst();
      if (!current) return { error: new RepairBrandNotFoundError() };
      if (current.version !== input.expectedVersion || (input.status !== undefined && current.status === input.status)) return { error: new RepairBrandConcurrencyConflictError() };
      if (input.normalizedKey) {
        const duplicate = await executor.selectFrom('repair_brands').select('brand_id').where('brand_id', '!=', input.brandId).where('normalized_key', '=', input.normalizedKey).where((expression) => expression.or([
          expression('scope', '=', 'platform'), expression.and([expression('scope', '=', 'tenant'), expression('tenant_id', '=', validatedScope.tenantId)]),
        ])).executeTakeFirst();
        if (duplicate) return { error: new RepairBrandDuplicateError() };
      }
      if (!await scope.commitGuard.confirmCurrent(transactionContext) || !await scope.commitGuard.confirmTemporalCurrent(transactionContext)) return { error: new RepairBrandAuthorizationChangedError() };
      const canonicalLabel = input.canonicalLabel ?? current.canonical_label;
      const normalizedKey = input.normalizedKey ?? current.normalized_key;
      const status = input.status ?? current.status;
      const nextVersion = current.version + 1;
      await executor.updateTable('repair_brands').set({ canonical_label: canonicalLabel, normalized_key: normalizedKey, status, version: nextVersion, updated_by_actor_id: scope.actorUserId, updated_at: input.occurredAt }).where('brand_id', '=', input.brandId).where('tenant_id', '=', validatedScope.tenantId).execute();
      await executor.insertInto('repair_brand_catalog_events').values({ event_id: input.eventId, tenant_id: validatedScope.tenantId, brand_id: input.brandId, pending_brand_value_id: null, station_id: scope.stationId, session_id: scope.sessionId, actor_user_id: scope.actorUserId, actor_display_name: scope.actorDisplayName, capability: scope.capability, action: input.action, old_version: current.version, new_version: nextVersion, old_label: current.canonical_label, new_label: canonicalLabel, old_status: current.status, new_status: status, old_canonical_brand_id: input.brandId, new_canonical_brand_id: input.brandId, result: 'succeeded', correlation_id: input.correlationId, occurred_at: input.occurredAt }).execute();
      const usage = await executor.selectFrom('repair_intakes').select(({ fn }) => fn.countAll().as('count')).where('tenant_id', '=', validatedScope.tenantId).where('canonical_brand_id', '=', input.brandId).executeTakeFirstOrThrow();
      return { brandId: input.brandId, code: current.code, canonicalLabel, normalizedKey, scope: 'tenant', status, version: nextVersion, usageCount: Number(usage.count), createdAt: current.created_at.toISOString(), updatedAt: input.occurredAt.toISOString() };
    });
    if ('error' in outcome) throw outcome.error;
    return Object.freeze(outcome);
  }

  async resolvePendingBrand(scope: RepairBrandCatalogContext, input: ResolveRepairBrandPendingRecord): Promise<RepairBrandPendingRecord> {
    const validatedScope = validateScope(scope);
    const outcome = await this.executeTransaction<RepairBrandPendingRecord | Readonly<{ error: Error }>>(async (executor, transactionContext) => {
      const pending = await executor.selectFrom('repair_brand_pending_values').selectAll().where('pending_brand_value_id', '=', input.pendingBrandValueId).where('tenant_id', '=', validatedScope.tenantId).forUpdate().executeTakeFirst();
      if (!pending) return { error: new RepairBrandPendingNotFoundError() };
      if (pending.version !== input.expectedVersion || pending.resolution_status !== 'pending') return { error: new RepairBrandConcurrencyConflictError() };
      let brandId = input.canonicalBrandId;
      let canonicalLabel: string;
      let action: 'repair_brand_pending.resolved' | 'repair_brand_pending.canonical_created' = 'repair_brand_pending.resolved';
      if (input.newBrandId && input.newCanonicalLabel && input.newNormalizedKey) {
        const duplicate = await executor.selectFrom('repair_brands').select('brand_id').where('normalized_key', '=', input.newNormalizedKey).where((expression) => expression.or([
          expression('scope', '=', 'platform'), expression.and([expression('scope', '=', 'tenant'), expression('tenant_id', '=', validatedScope.tenantId)]),
        ])).executeTakeFirst();
        if (duplicate) return { error: new RepairBrandDuplicateError() };
        brandId = input.newBrandId;
        canonicalLabel = input.newCanonicalLabel;
        action = 'repair_brand_pending.canonical_created';
      } else {
        const brand = brandId ? await executor.selectFrom('repair_brands').select(['brand_id', 'canonical_label']).where('brand_id', '=', brandId).where('status', '=', 'active').where((expression) => expression.or([
          expression('scope', '=', 'platform'), expression.and([expression('scope', '=', 'tenant'), expression('tenant_id', '=', validatedScope.tenantId)]),
        ])).forShare().executeTakeFirst() : undefined;
        if (!brand) return { error: new RepairBrandNotFoundError() };
        canonicalLabel = brand.canonical_label;
      }
      if (!await scope.commitGuard.confirmCurrent(transactionContext) || !await scope.commitGuard.confirmTemporalCurrent(transactionContext)) return { error: new RepairBrandAuthorizationChangedError() };
      if (action === 'repair_brand_pending.canonical_created') {
        await executor.insertInto('repair_brands').values({ brand_id: brandId!, scope: 'tenant', tenant_id: validatedScope.tenantId, code: null, canonical_label: canonicalLabel!, normalized_key: input.newNormalizedKey!, status: 'active', version: 1, created_by_actor_id: scope.actorUserId, updated_by_actor_id: scope.actorUserId, created_at: input.occurredAt, updated_at: input.occurredAt }).execute();
      }
      const nextVersion = pending.version + 1;
      await executor.updateTable('repair_brand_pending_values').set({ resolution_status: 'resolved', canonical_brand_id: brandId, version: nextVersion, resolved_by_actor_id: scope.actorUserId, resolved_at: input.occurredAt }).where('pending_brand_value_id', '=', input.pendingBrandValueId).where('tenant_id', '=', validatedScope.tenantId).execute();
      await executor.updateTable('repair_intakes').set({ canonical_brand_id: brandId }).where('tenant_id', '=', validatedScope.tenantId).where('pending_brand_value_id', '=', input.pendingBrandValueId).execute();
      await executor.insertInto('repair_brand_catalog_events').values({ event_id: input.eventId, tenant_id: validatedScope.tenantId, brand_id: brandId, pending_brand_value_id: input.pendingBrandValueId, station_id: scope.stationId, session_id: scope.sessionId, actor_user_id: scope.actorUserId, actor_display_name: scope.actorDisplayName, capability: scope.capability, action, old_version: pending.version, new_version: nextVersion, old_label: pending.raw_label_example, new_label: canonicalLabel!, old_status: 'pending', new_status: 'resolved', old_canonical_brand_id: null, new_canonical_brand_id: brandId, result: 'succeeded', correlation_id: input.correlationId, occurred_at: input.occurredAt }).execute();
      const usage = await executor.selectFrom('repair_intakes').select(({ fn }) => fn.countAll().as('count')).where('tenant_id', '=', validatedScope.tenantId).where('pending_brand_value_id', '=', input.pendingBrandValueId).executeTakeFirstOrThrow();
      return { pendingBrandValueId: pending.pending_brand_value_id, rawLabel: pending.raw_label_example, normalizedKey: pending.normalized_key, resolutionStatus: 'resolved', canonicalBrandId: brandId, canonicalLabel: canonicalLabel!, version: nextVersion, usageCount: Number(usage.count), firstSeenAt: pending.first_seen_at.toISOString(), lastSeenAt: pending.last_seen_at.toISOString() };
    });
    if ('error' in outcome) throw outcome.error;
    return Object.freeze(outcome);
  }

  async listEffectiveActiveModels(scope: RepairPersistenceScope, canonicalBrandId: string, query = ''): Promise<readonly RepairModelRecord[]> {
    const validatedScope = validateScope(scope);
    const normalizedQuery = normalizeRepairModelKey(query);
    return this.execute(async (executor) => {
      let statement = executor.selectFrom('repair_models')
        .innerJoin('repair_brands', 'repair_brands.brand_id', 'repair_models.canonical_brand_id')
        .leftJoin('repair_intakes', (join) => join.onRef('repair_intakes.canonical_model_id', '=', 'repair_models.model_id').on('repair_intakes.tenant_id', '=', validatedScope.tenantId))
        .leftJoin('repair_model_pending_values', (join) => join.onRef('repair_model_pending_values.canonical_model_id', '=', 'repair_models.model_id').on('repair_model_pending_values.tenant_id', '=', validatedScope.tenantId).on('repair_model_pending_values.resolution_status', '=', 'resolved'))
        .select(['repair_models.model_id', 'repair_models.canonical_brand_id', 'repair_brands.canonical_label as canonical_brand_label', 'repair_models.code', 'repair_models.canonical_label', 'repair_models.normalized_key', 'repair_models.scope', 'repair_models.status', 'repair_models.version', 'repair_models.created_at', 'repair_models.updated_at'])
        .select(({ fn }) => fn.count('repair_intakes.repair_id').distinct().as('usage_count'))
        .where('repair_models.canonical_brand_id', '=', canonicalBrandId)
        .where('repair_models.status', '=', 'active')
        .where('repair_brands.status', '=', 'active')
        .where((expression) => expression.or([expression('repair_models.scope', '=', 'platform'), expression.and([expression('repair_models.scope', '=', 'tenant'), expression('repair_models.tenant_id', '=', validatedScope.tenantId)])]))
        .where((expression) => expression.or([expression('repair_brands.scope', '=', 'platform'), expression.and([expression('repair_brands.scope', '=', 'tenant'), expression('repair_brands.tenant_id', '=', validatedScope.tenantId)])]));
      if (normalizedQuery) {
        const pattern = literalLikePattern(normalizedQuery);
        statement = statement.where((expression) => expression.or([expression('repair_models.normalized_key', 'ilike', pattern), expression('repair_model_pending_values.normalized_model_key', 'ilike', pattern)]));
      }
      const rows = await statement.groupBy(['repair_models.model_id', 'repair_models.canonical_brand_id', 'repair_brands.canonical_label', 'repair_models.code', 'repair_models.canonical_label', 'repair_models.normalized_key', 'repair_models.scope', 'repair_models.status', 'repair_models.version', 'repair_models.created_at', 'repair_models.updated_at'])
        .orderBy('repair_models.scope', 'asc').orderBy('repair_models.canonical_label', 'asc').orderBy('repair_models.model_id', 'asc').limit(12).execute();
      return Object.freeze(rows.map(mapRepairModel));
    });
  }

  async listAdminModels(scope: RepairPersistenceScope, canonicalBrandId: string | null): Promise<readonly RepairModelRecord[]> {
    const validatedScope = validateScope(scope);
    return this.execute(async (executor) => {
      let statement = executor.selectFrom('repair_models')
        .innerJoin('repair_brands', 'repair_brands.brand_id', 'repair_models.canonical_brand_id')
        .leftJoin('repair_intakes', (join) => join.onRef('repair_intakes.canonical_model_id', '=', 'repair_models.model_id').on('repair_intakes.tenant_id', '=', validatedScope.tenantId))
        .select(['repair_models.model_id', 'repair_models.canonical_brand_id', 'repair_brands.canonical_label as canonical_brand_label', 'repair_models.code', 'repair_models.canonical_label', 'repair_models.normalized_key', 'repair_models.scope', 'repair_models.status', 'repair_models.version', 'repair_models.created_at', 'repair_models.updated_at'])
        .select(({ fn }) => fn.count('repair_intakes.repair_id').distinct().as('usage_count'))
        .where((expression) => expression.or([expression('repair_models.scope', '=', 'platform'), expression.and([expression('repair_models.scope', '=', 'tenant'), expression('repair_models.tenant_id', '=', validatedScope.tenantId)])]))
        .where((expression) => expression.or([expression('repair_brands.scope', '=', 'platform'), expression.and([expression('repair_brands.scope', '=', 'tenant'), expression('repair_brands.tenant_id', '=', validatedScope.tenantId)])]));
      if (canonicalBrandId) statement = statement.where('repair_models.canonical_brand_id', '=', canonicalBrandId);
      const rows = await statement.groupBy(['repair_models.model_id', 'repair_models.canonical_brand_id', 'repair_brands.canonical_label', 'repair_models.code', 'repair_models.canonical_label', 'repair_models.normalized_key', 'repair_models.scope', 'repair_models.status', 'repair_models.version', 'repair_models.created_at', 'repair_models.updated_at'])
        .orderBy('repair_brands.canonical_label', 'asc').orderBy('repair_models.status', 'asc').orderBy('repair_models.canonical_label', 'asc').execute();
      return Object.freeze(rows.map(mapRepairModel));
    });
  }

  async listPendingModels(scope: RepairPersistenceScope, canonicalBrandId: string | null): Promise<readonly RepairModelPendingRecord[]> {
    const validatedScope = validateScope(scope);
    return this.execute(async (executor) => {
      const rows = await executor.selectFrom('repair_model_pending_values')
        .leftJoin('repair_brands as direct_brand', 'direct_brand.brand_id', 'repair_model_pending_values.canonical_brand_id')
        .leftJoin('repair_brand_pending_values as pending_brand', 'pending_brand.pending_brand_value_id', 'repair_model_pending_values.pending_brand_value_id')
        .leftJoin('repair_brands as pending_brand_canonical', 'pending_brand_canonical.brand_id', 'pending_brand.canonical_brand_id')
        .leftJoin('repair_models as canonical_model', 'canonical_model.model_id', 'repair_model_pending_values.canonical_model_id')
        .leftJoin('repair_intakes', (join) => join.onRef('repair_intakes.pending_model_value_id', '=', 'repair_model_pending_values.pending_model_value_id').on('repair_intakes.tenant_id', '=', validatedScope.tenantId))
        .select(['repair_model_pending_values.pending_model_value_id', 'repair_model_pending_values.canonical_brand_id', 'direct_brand.canonical_label as canonical_brand_label', 'repair_model_pending_values.pending_brand_value_id', 'repair_model_pending_values.raw_brand_label_example', 'pending_brand.raw_label_example as pending_brand_label', 'pending_brand.canonical_brand_id as pending_brand_canonical_id', 'pending_brand_canonical.canonical_label as pending_brand_canonical_label', 'repair_model_pending_values.raw_model_label_example', 'repair_model_pending_values.normalized_model_key', 'repair_model_pending_values.resolution_status', 'repair_model_pending_values.canonical_model_id', 'canonical_model.canonical_label as canonical_model_label', 'repair_model_pending_values.version', 'repair_model_pending_values.first_seen_at', 'repair_model_pending_values.last_seen_at'])
        .select(({ fn }) => fn.count('repair_intakes.repair_id').distinct().as('usage_count'))
        .where('repair_model_pending_values.tenant_id', '=', validatedScope.tenantId)
        .where('repair_model_pending_values.resolution_status', '=', 'pending')
        .groupBy(['repair_model_pending_values.pending_model_value_id', 'direct_brand.canonical_label', 'pending_brand.raw_label_example', 'pending_brand.canonical_brand_id', 'pending_brand_canonical.canonical_label', 'canonical_model.canonical_label'])
        .having(({ fn }) => fn.count('repair_intakes.repair_id').distinct(), '>', 0)
        .orderBy('repair_model_pending_values.last_seen_at', 'desc').execute();
      const mapped = rows.map(mapRepairModelPending);
      return Object.freeze(canonicalBrandId ? mapped.filter((item) => item.canonicalBrandId === canonicalBrandId) : mapped);
    });
  }

  async createModel(scope: RepairModelCatalogContext, input: CreateRepairModelRecord): Promise<RepairModelRecord> {
    const validatedScope = validateScope(scope);
    const outcome = await this.executeTransaction<RepairModelRecord | Readonly<{ error: Error }>>(async (executor, transactionContext) => {
      const brand = await executor.selectFrom('repair_brands').select(['brand_id', 'canonical_label']).where('brand_id', '=', input.canonicalBrandId).where('status', '=', 'active').where((expression) => expression.or([expression('scope', '=', 'platform'), expression.and([expression('scope', '=', 'tenant'), expression('tenant_id', '=', validatedScope.tenantId)])])).forShare().executeTakeFirst();
      if (!brand) return { error: new RepairModelNotFoundError() };
      const duplicate = await executor.selectFrom('repair_models').select('model_id').where('canonical_brand_id', '=', input.canonicalBrandId).where('normalized_key', '=', input.normalizedKey).where((expression) => expression.or([expression('scope', '=', 'platform'), expression.and([expression('scope', '=', 'tenant'), expression('tenant_id', '=', validatedScope.tenantId)])])).executeTakeFirst();
      if (duplicate) return { error: new RepairModelDuplicateError() };
      if (!await scope.commitGuard.confirmCurrent(transactionContext) || !await scope.commitGuard.confirmTemporalCurrent(transactionContext)) return { error: new RepairModelAuthorizationChangedError() };
      await executor.insertInto('repair_models').values({ model_id: input.modelId, canonical_brand_id: input.canonicalBrandId, scope: 'tenant', tenant_id: validatedScope.tenantId, code: null, canonical_label: input.canonicalLabel, normalized_key: input.normalizedKey, status: 'active', version: 1, created_by_actor_id: scope.actorUserId, updated_by_actor_id: scope.actorUserId, created_at: input.occurredAt, updated_at: input.occurredAt }).execute();
      await executor.insertInto('repair_model_catalog_events').values({ event_id: input.eventId, tenant_id: validatedScope.tenantId, model_id: input.modelId, canonical_brand_id: input.canonicalBrandId, pending_model_value_id: null, station_id: scope.stationId, session_id: scope.sessionId, actor_user_id: scope.actorUserId, actor_display_name: scope.actorDisplayName, capability: scope.capability, action: 'repair_model.created', old_version: null, new_version: 1, old_label: null, new_label: input.canonicalLabel, old_status: null, new_status: 'active', old_canonical_model_id: null, new_canonical_model_id: input.modelId, result: 'succeeded', correlation_id: input.correlationId, occurred_at: input.occurredAt }).execute();
      return { modelId: input.modelId, canonicalBrandId: input.canonicalBrandId, brandLabel: brand.canonical_label, code: null, canonicalLabel: input.canonicalLabel, normalizedKey: input.normalizedKey, scope: 'tenant', status: 'active', version: 1, usageCount: 0, createdAt: input.occurredAt.toISOString(), updatedAt: input.occurredAt.toISOString() };
    });
    if ('error' in outcome) throw outcome.error;
    return Object.freeze(outcome);
  }

  async changeModel(scope: RepairModelCatalogContext, input: ChangeRepairModelRecord): Promise<RepairModelRecord> {
    const validatedScope = validateScope(scope);
    const outcome = await this.executeTransaction<RepairModelRecord | Readonly<{ error: Error }>>(async (executor, transactionContext) => {
      const current = await executor.selectFrom('repair_models').innerJoin('repair_brands', 'repair_brands.brand_id', 'repair_models.canonical_brand_id').select(['repair_models.model_id', 'repair_models.canonical_brand_id', 'repair_brands.canonical_label as brand_label', 'repair_models.code', 'repair_models.canonical_label', 'repair_models.normalized_key', 'repair_models.status', 'repair_models.version', 'repair_models.created_at']).where('repair_models.model_id', '=', input.modelId).where('repair_models.scope', '=', 'tenant').where('repair_models.tenant_id', '=', validatedScope.tenantId).forUpdate().executeTakeFirst();
      if (!current) return { error: new RepairModelNotFoundError() };
      if (current.version !== input.expectedVersion || (input.status !== undefined && current.status === input.status)) return { error: new RepairModelConcurrencyConflictError() };
      if (input.normalizedKey) {
        const duplicate = await executor.selectFrom('repair_models').select('model_id').where('model_id', '!=', input.modelId).where('canonical_brand_id', '=', current.canonical_brand_id).where('normalized_key', '=', input.normalizedKey).where((expression) => expression.or([expression('scope', '=', 'platform'), expression.and([expression('scope', '=', 'tenant'), expression('tenant_id', '=', validatedScope.tenantId)])])).executeTakeFirst();
        if (duplicate) return { error: new RepairModelDuplicateError() };
      }
      if (!await scope.commitGuard.confirmCurrent(transactionContext) || !await scope.commitGuard.confirmTemporalCurrent(transactionContext)) return { error: new RepairModelAuthorizationChangedError() };
      const canonicalLabel = input.canonicalLabel ?? current.canonical_label;
      const normalizedKey = input.normalizedKey ?? current.normalized_key;
      const status = input.status ?? current.status;
      const nextVersion = current.version + 1;
      await executor.updateTable('repair_models').set({ canonical_label: canonicalLabel, normalized_key: normalizedKey, status, version: nextVersion, updated_by_actor_id: scope.actorUserId, updated_at: input.occurredAt }).where('model_id', '=', input.modelId).where('tenant_id', '=', validatedScope.tenantId).execute();
      await executor.insertInto('repair_model_catalog_events').values({ event_id: input.eventId, tenant_id: validatedScope.tenantId, model_id: input.modelId, canonical_brand_id: current.canonical_brand_id, pending_model_value_id: null, station_id: scope.stationId, session_id: scope.sessionId, actor_user_id: scope.actorUserId, actor_display_name: scope.actorDisplayName, capability: scope.capability, action: input.action, old_version: current.version, new_version: nextVersion, old_label: current.canonical_label, new_label: canonicalLabel, old_status: current.status, new_status: status, old_canonical_model_id: input.modelId, new_canonical_model_id: input.modelId, result: 'succeeded', correlation_id: input.correlationId, occurred_at: input.occurredAt }).execute();
      const usage = await executor.selectFrom('repair_intakes').select(({ fn }) => fn.countAll().as('count')).where('tenant_id', '=', validatedScope.tenantId).where('canonical_model_id', '=', input.modelId).executeTakeFirstOrThrow();
      return { modelId: input.modelId, canonicalBrandId: current.canonical_brand_id, brandLabel: current.brand_label, code: current.code, canonicalLabel, normalizedKey, scope: 'tenant', status, version: nextVersion, usageCount: Number(usage.count), createdAt: current.created_at.toISOString(), updatedAt: input.occurredAt.toISOString() };
    });
    if ('error' in outcome) throw outcome.error;
    return Object.freeze(outcome);
  }

  async resolvePendingModel(scope: RepairModelCatalogContext, input: ResolveRepairModelPendingRecord): Promise<RepairModelPendingRecord> {
    const validatedScope = validateScope(scope);
    const outcome = await this.executeTransaction<RepairModelPendingRecord | Readonly<{ error: Error }>>(async (executor, transactionContext) => {
      const pending = await executor.selectFrom('repair_model_pending_values').selectAll().where('pending_model_value_id', '=', input.pendingModelValueId).where('tenant_id', '=', validatedScope.tenantId).forUpdate().executeTakeFirst();
      if (!pending) return { error: new RepairModelPendingNotFoundError() };
      if (pending.version !== input.expectedVersion || pending.resolution_status !== 'pending') return { error: new RepairModelConcurrencyConflictError() };
      let brandId = pending.canonical_brand_id;
      let brandLabel: string | null = null;
      if (brandId) {
        const brand = await executor.selectFrom('repair_brands').select('canonical_label').where('brand_id', '=', brandId).where('status', '=', 'active').where((expression) => expression.or([expression('scope', '=', 'platform'), expression.and([expression('scope', '=', 'tenant'), expression('tenant_id', '=', validatedScope.tenantId)])])).executeTakeFirst();
        brandLabel = brand?.canonical_label ?? null;
      } else if (pending.pending_brand_value_id) {
        const brand = await executor.selectFrom('repair_brand_pending_values').innerJoin('repair_brands', 'repair_brands.brand_id', 'repair_brand_pending_values.canonical_brand_id').select(['repair_brands.brand_id', 'repair_brands.canonical_label']).where('repair_brand_pending_values.pending_brand_value_id', '=', pending.pending_brand_value_id).where('repair_brand_pending_values.tenant_id', '=', validatedScope.tenantId).where('repair_brand_pending_values.resolution_status', '=', 'resolved').executeTakeFirst();
        brandId = brand?.brand_id ?? null;
        brandLabel = brand?.canonical_label ?? null;
      }
      if (!brandId || !brandLabel) return { error: new RepairModelNotFoundError() };
      let modelId = input.canonicalModelId;
      let canonicalLabel: string;
      let action: 'repair_model_pending.resolved' | 'repair_model_pending.canonical_created' = 'repair_model_pending.resolved';
      if (input.newModelId && input.newCanonicalLabel && input.newNormalizedKey) {
        const duplicate = await executor.selectFrom('repair_models').select('model_id').where('canonical_brand_id', '=', brandId).where('normalized_key', '=', input.newNormalizedKey).where((expression) => expression.or([expression('scope', '=', 'platform'), expression.and([expression('scope', '=', 'tenant'), expression('tenant_id', '=', validatedScope.tenantId)])])).executeTakeFirst();
        if (duplicate) return { error: new RepairModelDuplicateError() };
        modelId = input.newModelId;
        canonicalLabel = input.newCanonicalLabel;
        action = 'repair_model_pending.canonical_created';
      } else {
        const model = modelId ? await executor.selectFrom('repair_models').select(['model_id', 'canonical_label']).where('model_id', '=', modelId).where('canonical_brand_id', '=', brandId).where('status', '=', 'active').where((expression) => expression.or([expression('scope', '=', 'platform'), expression.and([expression('scope', '=', 'tenant'), expression('tenant_id', '=', validatedScope.tenantId)])])).forShare().executeTakeFirst() : undefined;
        if (!model) return { error: new RepairModelNotFoundError() };
        canonicalLabel = model.canonical_label;
      }
      if (!await scope.commitGuard.confirmCurrent(transactionContext) || !await scope.commitGuard.confirmTemporalCurrent(transactionContext)) return { error: new RepairModelAuthorizationChangedError() };
      if (action === 'repair_model_pending.canonical_created') await executor.insertInto('repair_models').values({ model_id: modelId!, canonical_brand_id: brandId, scope: 'tenant', tenant_id: validatedScope.tenantId, code: null, canonical_label: canonicalLabel!, normalized_key: input.newNormalizedKey!, status: 'active', version: 1, created_by_actor_id: scope.actorUserId, updated_by_actor_id: scope.actorUserId, created_at: input.occurredAt, updated_at: input.occurredAt }).execute();
      const nextVersion = pending.version + 1;
      await executor.updateTable('repair_model_pending_values').set({ resolution_status: 'resolved', canonical_model_id: modelId, version: nextVersion, resolved_by_actor_id: scope.actorUserId, resolved_at: input.occurredAt }).where('pending_model_value_id', '=', input.pendingModelValueId).where('tenant_id', '=', validatedScope.tenantId).execute();
      await executor.updateTable('repair_intakes').set({ canonical_model_id: modelId }).where('tenant_id', '=', validatedScope.tenantId).where('pending_model_value_id', '=', input.pendingModelValueId).execute();
      await executor.insertInto('repair_model_catalog_events').values({ event_id: input.eventId, tenant_id: validatedScope.tenantId, model_id: modelId, canonical_brand_id: brandId, pending_model_value_id: input.pendingModelValueId, station_id: scope.stationId, session_id: scope.sessionId, actor_user_id: scope.actorUserId, actor_display_name: scope.actorDisplayName, capability: scope.capability, action, old_version: pending.version, new_version: nextVersion, old_label: pending.raw_model_label_example, new_label: canonicalLabel!, old_status: 'pending', new_status: 'resolved', old_canonical_model_id: null, new_canonical_model_id: modelId, result: 'succeeded', correlation_id: input.correlationId, occurred_at: input.occurredAt }).execute();
      const usage = await executor.selectFrom('repair_intakes').select(({ fn }) => fn.countAll().as('count')).where('tenant_id', '=', validatedScope.tenantId).where('pending_model_value_id', '=', input.pendingModelValueId).executeTakeFirstOrThrow();
      return { pendingModelValueId: pending.pending_model_value_id, canonicalBrandId: brandId, brandLabel, rawBrandLabel: pending.raw_brand_label_example ?? brandLabel, rawModelLabel: pending.raw_model_label_example, normalizedModelKey: pending.normalized_model_key, resolutionStatus: 'resolved', canonicalModelId: modelId, canonicalModelLabel: canonicalLabel!, version: nextVersion, usageCount: Number(usage.count), firstSeenAt: pending.first_seen_at.toISOString(), lastSeenAt: pending.last_seen_at.toISOString() };
    });
    if ('error' in outcome) throw outcome.error;
    return Object.freeze(outcome);
  }

  async listEffectiveActiveProblemCategories(scope: RepairPersistenceScope): Promise<readonly RepairProblemCategoryRecord[]> {
    const validatedScope = validateScope(scope);
    return this.execute(async (executor) => {
      const rows = await executor.selectFrom('repair_problem_categories')
        .leftJoin('repair_problem_classifications', 'repair_problem_classifications.category_id', 'repair_problem_categories.category_id')
        .leftJoin('repairs', (join) => join.onRef('repairs.repair_id', '=', 'repair_problem_classifications.repair_id').on('repairs.tenant_id', '=', validatedScope.tenantId))
        .select(['repair_problem_categories.category_id', 'repair_problem_categories.code', 'repair_problem_categories.canonical_label', 'repair_problem_categories.normalized_key', 'repair_problem_categories.scope', 'repair_problem_categories.status', 'repair_problem_categories.version', 'repair_problem_categories.created_at', 'repair_problem_categories.updated_at'])
        .select(({ fn }) => fn.count('repairs.repair_id').distinct().as('usage_count'))
        .select((expression) => expression.or([
          expression.exists(expression.selectFrom('repair_problem_classifications as historical_current').select('historical_current.problem_capture_id').whereRef('historical_current.category_id', '=', 'repair_problem_categories.category_id')),
          expression.exists(expression.selectFrom('repair_problem_classification_events as historical_event').select('historical_event.event_id').whereRef('historical_event.category_id', '=', 'repair_problem_categories.category_id')),
          expression.exists(expression.selectFrom('repair_problem_pending_values as historical_pending').select('historical_pending.pending_problem_value_id').whereRef('historical_pending.canonical_category_id', '=', 'repair_problem_categories.category_id')),
        ]).as('historically_referenced'))
        .where('repair_problem_categories.status', '=', 'active')
        .where((expression) => expression.or([expression('repair_problem_categories.scope', '=', 'platform'), expression.and([expression('repair_problem_categories.scope', '=', 'tenant'), expression('repair_problem_categories.tenant_id', '=', validatedScope.tenantId)])]))
        .groupBy(['repair_problem_categories.category_id', 'repair_problem_categories.code', 'repair_problem_categories.canonical_label', 'repair_problem_categories.normalized_key', 'repair_problem_categories.scope', 'repair_problem_categories.status', 'repair_problem_categories.version', 'repair_problem_categories.created_at', 'repair_problem_categories.updated_at'])
        .orderBy('repair_problem_categories.canonical_label', 'asc').orderBy('repair_problem_categories.category_id', 'asc').execute();
      return Object.freeze(rows.map(mapRepairProblemCategory));
    });
  }

  async listAdminProblemCategories(scope: RepairPersistenceScope): Promise<readonly RepairProblemCategoryRecord[]> {
    const validatedScope = validateScope(scope);
    return this.execute(async (executor) => {
      const rows = await executor.selectFrom('repair_problem_categories')
        .leftJoin('repair_problem_classifications', 'repair_problem_classifications.category_id', 'repair_problem_categories.category_id')
        .leftJoin('repairs', (join) => join.onRef('repairs.repair_id', '=', 'repair_problem_classifications.repair_id').on('repairs.tenant_id', '=', validatedScope.tenantId))
        .select(['repair_problem_categories.category_id', 'repair_problem_categories.code', 'repair_problem_categories.canonical_label', 'repair_problem_categories.normalized_key', 'repair_problem_categories.scope', 'repair_problem_categories.status', 'repair_problem_categories.version', 'repair_problem_categories.created_at', 'repair_problem_categories.updated_at'])
        .select(({ fn }) => fn.count('repairs.repair_id').distinct().as('usage_count'))
        .select((expression) => expression.or([
          expression.exists(expression.selectFrom('repair_problem_classifications as historical_current').select('historical_current.problem_capture_id').whereRef('historical_current.category_id', '=', 'repair_problem_categories.category_id')),
          expression.exists(expression.selectFrom('repair_problem_classification_events as historical_event').select('historical_event.event_id').whereRef('historical_event.category_id', '=', 'repair_problem_categories.category_id')),
          expression.exists(expression.selectFrom('repair_problem_pending_values as historical_pending').select('historical_pending.pending_problem_value_id').whereRef('historical_pending.canonical_category_id', '=', 'repair_problem_categories.category_id')),
        ]).as('historically_referenced'))
        .where((expression) => expression.or([expression('repair_problem_categories.scope', '=', 'platform'), expression.and([expression('repair_problem_categories.scope', '=', 'tenant'), expression('repair_problem_categories.tenant_id', '=', validatedScope.tenantId)])]))
        .groupBy(['repair_problem_categories.category_id', 'repair_problem_categories.code', 'repair_problem_categories.canonical_label', 'repair_problem_categories.normalized_key', 'repair_problem_categories.scope', 'repair_problem_categories.status', 'repair_problem_categories.version', 'repair_problem_categories.created_at', 'repair_problem_categories.updated_at'])
        .orderBy('repair_problem_categories.status', 'asc').orderBy('repair_problem_categories.canonical_label', 'asc').execute();
      return Object.freeze(rows.map(mapRepairProblemCategory));
    });
  }

  async listPendingProblems(scope: RepairPersistenceScope): Promise<readonly RepairProblemPendingRecord[]> {
    const validatedScope = validateScope(scope);
    return this.execute(async (executor) => {
      const rows = await executor.selectFrom('repair_problem_pending_values')
        .leftJoin('repair_problem_categories', 'repair_problem_categories.category_id', 'repair_problem_pending_values.canonical_category_id')
        .leftJoin('repair_problem_classifications', (join) => join
          .onRef('repair_problem_classifications.pending_problem_value_id', '=', 'repair_problem_pending_values.pending_problem_value_id')
          .onRef('repair_problem_classifications.tenant_id', '=', 'repair_problem_pending_values.tenant_id'))
        .select(['repair_problem_pending_values.pending_problem_value_id', 'repair_problem_pending_values.raw_label_example', 'repair_problem_pending_values.normalized_key', 'repair_problem_pending_values.resolution_status', 'repair_problem_pending_values.canonical_category_id', 'repair_problem_categories.canonical_label', 'repair_problem_pending_values.version', 'repair_problem_pending_values.first_seen_at', 'repair_problem_pending_values.last_seen_at'])
        .select(({ fn }) => fn.count('repair_problem_classifications.repair_id').distinct().as('usage_count'))
        .where('repair_problem_pending_values.tenant_id', '=', validatedScope.tenantId)
        .groupBy(['repair_problem_pending_values.pending_problem_value_id', 'repair_problem_pending_values.raw_label_example', 'repair_problem_pending_values.normalized_key', 'repair_problem_pending_values.resolution_status', 'repair_problem_pending_values.canonical_category_id', 'repair_problem_categories.canonical_label', 'repair_problem_pending_values.version', 'repair_problem_pending_values.first_seen_at', 'repair_problem_pending_values.last_seen_at'])
        .orderBy('repair_problem_pending_values.resolution_status', 'asc')
        .orderBy('repair_problem_pending_values.last_seen_at', 'desc')
        .execute();
      return Object.freeze(rows.map(mapRepairProblemPending));
    });
  }

  async createProblemCategory(scope: RepairProblemCategoryCatalogContext, input: CreateRepairProblemCategoryRecord): Promise<RepairProblemCategoryRecord> {
    const validatedScope = validateScope(scope);
    const outcome = await this.executeTransaction<RepairProblemCategoryRecord | { error: Error }>(async (executor, transactionContext) => {
      const duplicate = await executor.selectFrom('repair_problem_categories').select('category_id').where('normalized_key', '=', input.normalizedKey).where((expression) => expression.or([expression('scope', '=', 'platform'), expression.and([expression('scope', '=', 'tenant'), expression('tenant_id', '=', validatedScope.tenantId)])])).executeTakeFirst();
      if (duplicate) return { error: new RepairProblemCategoryDuplicateError() };
      if (!await scope.commitGuard.confirmCurrent(transactionContext) || !await scope.commitGuard.confirmTemporalCurrent(transactionContext)) return { error: new RepairProblemCategoryAuthorizationChangedError() };
      await executor.insertInto('repair_problem_categories').values({ category_id: input.categoryId, scope: 'tenant', tenant_id: validatedScope.tenantId, code: null, canonical_label: input.canonicalLabel, normalized_key: input.normalizedKey, status: 'active', version: 1, created_by_actor_id: scope.actorUserId, updated_by_actor_id: scope.actorUserId, created_at: input.occurredAt, updated_at: input.occurredAt }).execute();
      await executor.insertInto('repair_problem_category_catalog_events').values({ event_id: input.eventId, tenant_id: validatedScope.tenantId, category_id: input.categoryId, pending_problem_value_id: null, station_id: scope.stationId, session_id: scope.sessionId, actor_user_id: scope.actorUserId, actor_display_name: scope.actorDisplayName, capability: scope.capability, action: 'repair_problem_category.created', old_version: null, new_version: 1, old_label: null, new_label: input.canonicalLabel, old_status: null, new_status: 'active', result: 'succeeded', correlation_id: input.correlationId, occurred_at: input.occurredAt }).execute();
      return { categoryId: input.categoryId, code: null, canonicalLabel: input.canonicalLabel, normalizedKey: input.normalizedKey, scope: 'tenant', status: 'active', version: 1, usageCount: 0, deletable: true, createdAt: input.occurredAt.toISOString(), updatedAt: input.occurredAt.toISOString() };
    });
    if ('error' in outcome) throw outcome.error; return Object.freeze(outcome);
  }

  async changeProblemCategory(scope: RepairProblemCategoryCatalogContext, input: ChangeRepairProblemCategoryRecord): Promise<RepairProblemCategoryRecord> {
    const validatedScope = validateScope(scope);
    const outcome = await this.executeTransaction<RepairProblemCategoryRecord | { error: Error }>(async (executor, transactionContext) => {
      const current = await executor.selectFrom('repair_problem_categories').selectAll().where('category_id', '=', input.categoryId).where('scope', '=', 'tenant').where('tenant_id', '=', validatedScope.tenantId).forUpdate().executeTakeFirst();
      if (!current) return { error: new RepairProblemCategoryNotFoundError() };
      if (current.version !== input.expectedVersion || (input.status && current.status === input.status)) return { error: new RepairProblemCategoryConcurrencyConflictError() };
      if (input.normalizedKey) { const duplicate = await executor.selectFrom('repair_problem_categories').select('category_id').where('category_id', '!=', input.categoryId).where('normalized_key', '=', input.normalizedKey).where((expression) => expression.or([expression('scope', '=', 'platform'), expression.and([expression('scope', '=', 'tenant'), expression('tenant_id', '=', validatedScope.tenantId)])])).executeTakeFirst(); if (duplicate) return { error: new RepairProblemCategoryDuplicateError() }; }
      if (!await scope.commitGuard.confirmCurrent(transactionContext) || !await scope.commitGuard.confirmTemporalCurrent(transactionContext)) return { error: new RepairProblemCategoryAuthorizationChangedError() };
      const canonicalLabel = input.canonicalLabel ?? current.canonical_label; const normalizedKey = input.normalizedKey ?? current.normalized_key; const status = input.status ?? current.status; const nextVersion = current.version + 1;
      await executor.updateTable('repair_problem_categories').set({ canonical_label: canonicalLabel, normalized_key: normalizedKey, status, version: nextVersion, updated_by_actor_id: scope.actorUserId, updated_at: input.occurredAt }).where('category_id', '=', input.categoryId).where('tenant_id', '=', validatedScope.tenantId).execute();
      await executor.insertInto('repair_problem_category_catalog_events').values({ event_id: input.eventId, tenant_id: validatedScope.tenantId, category_id: input.categoryId, pending_problem_value_id: null, station_id: scope.stationId, session_id: scope.sessionId, actor_user_id: scope.actorUserId, actor_display_name: scope.actorDisplayName, capability: scope.capability, action: input.action, old_version: current.version, new_version: nextVersion, old_label: current.canonical_label, new_label: canonicalLabel, old_status: current.status, new_status: status, result: 'succeeded', correlation_id: input.correlationId, occurred_at: input.occurredAt }).execute();
      const usage = await executor.selectFrom('repair_problem_classifications').innerJoin('repairs', 'repairs.repair_id', 'repair_problem_classifications.repair_id').select(({ fn }) => fn.count('repairs.repair_id').distinct().as('count')).where('repairs.tenant_id', '=', validatedScope.tenantId).where('repair_problem_classifications.category_id', '=', input.categoryId).executeTakeFirstOrThrow();
      const historical = await executor.selectFrom('repair_problem_categories').select((expression) => expression.or([
        expression.exists(expression.selectFrom('repair_problem_classifications as historical_current').select('historical_current.problem_capture_id').whereRef('historical_current.category_id', '=', 'repair_problem_categories.category_id')),
        expression.exists(expression.selectFrom('repair_problem_classification_events as historical_event').select('historical_event.event_id').whereRef('historical_event.category_id', '=', 'repair_problem_categories.category_id')),
        expression.exists(expression.selectFrom('repair_problem_pending_values as historical_pending').select('historical_pending.pending_problem_value_id').whereRef('historical_pending.canonical_category_id', '=', 'repair_problem_categories.category_id')),
      ]).as('value')).where('category_id', '=', input.categoryId).executeTakeFirstOrThrow();
      return { categoryId: input.categoryId, code: current.code, canonicalLabel, normalizedKey, scope: 'tenant', status, version: nextVersion, usageCount: Number(usage.count), deletable: !historical.value, createdAt: current.created_at.toISOString(), updatedAt: input.occurredAt.toISOString() };
    });
    if ('error' in outcome) throw outcome.error; return Object.freeze(outcome);
  }

  async deleteProblemCategory(scope: RepairProblemCategoryCatalogContext, input: DeleteRepairProblemCategoryRecord): Promise<RepairProblemCategoryDeletionRecord> {
    const validatedScope = validateScope(scope);
    const outcome = await this.executeTransaction<RepairProblemCategoryDeletionRecord | { error: Error }>(async (executor, transactionContext) => {
      const current = await executor.selectFrom('repair_problem_categories').selectAll()
        .where('category_id', '=', input.categoryId)
        .where((expression) => expression.or([
          expression('scope', '=', 'platform'),
          expression.and([expression('scope', '=', 'tenant'), expression('tenant_id', '=', validatedScope.tenantId)]),
        ]))
        .forUpdate()
        .executeTakeFirst();
      const recordAttempt = async (
        result: 'succeeded' | 'rejected',
        rejectionReason: 'not_found' | 'platform_owned' | 'version_conflict' | 'historical_references' | null,
      ) => executor.insertInto('repair_problem_category_deletion_events').values({
        event_id: input.eventId,
        tenant_id: validatedScope.tenantId,
        category_id: input.categoryId,
        catalog_scope: current?.scope ?? 'tenant',
        previous_label: current?.canonical_label ?? null,
        previous_status: current?.status ?? null,
        category_version: current?.version ?? null,
        expected_version: input.expectedVersion,
        station_id: scope.stationId,
        session_id: scope.sessionId,
        actor_user_id: scope.actorUserId,
        actor_display_name: scope.actorDisplayName,
        capability: scope.capability,
        action: 'catalog_entry.deleted',
        result,
        rejection_reason: rejectionReason,
        correlation_id: input.correlationId,
        occurred_at: input.occurredAt,
      }).execute();
      if (!current) {
        await recordAttempt('rejected', 'not_found');
        return { error: new RepairProblemCategoryNotFoundError() };
      }
      if (current.scope === 'platform') {
        await recordAttempt('rejected', 'platform_owned');
        return { error: new RepairProblemCategoryDeleteNotAllowedError('platform_owned') };
      }
      if (current.version !== input.expectedVersion) {
        await recordAttempt('rejected', 'version_conflict');
        return { error: new RepairProblemCategoryConcurrencyConflictError() };
      }
      const currentReference = await executor.selectFrom('repair_problem_classifications').select('problem_capture_id').where('category_id', '=', input.categoryId).executeTakeFirst();
      const historicalEvent = await executor.selectFrom('repair_problem_classification_events').select('event_id').where('category_id', '=', input.categoryId).executeTakeFirst();
      const reconciliationReference = await executor.selectFrom('repair_problem_pending_values').select('pending_problem_value_id').where('canonical_category_id', '=', input.categoryId).executeTakeFirst();
      if (currentReference || historicalEvent || reconciliationReference) {
        await recordAttempt('rejected', 'historical_references');
        return { error: new RepairProblemCategoryDeleteNotAllowedError('historical_references') };
      }
      if (!await scope.commitGuard.confirmCurrent(transactionContext) || !await scope.commitGuard.confirmTemporalCurrent(transactionContext)) return { error: new RepairProblemCategoryAuthorizationChangedError() };
      await executor.deleteFrom('repair_problem_categories').where('category_id', '=', input.categoryId).where('tenant_id', '=', validatedScope.tenantId).executeTakeFirstOrThrow();
      await recordAttempt('succeeded', null);
      return { categoryId: input.categoryId, previousLabel: current.canonical_label, scope: 'tenant', version: current.version, deletedAt: input.occurredAt.toISOString() };
    });
    if ('error' in outcome) throw outcome.error;
    return Object.freeze(outcome);
  }

  async resolvePendingProblem(scope: RepairProblemCategoryCatalogContext, input: ResolveRepairProblemPendingRecord): Promise<RepairProblemPendingRecord> {
    const validatedScope = validateScope(scope);
    const outcome = await this.executeTransaction<RepairProblemPendingRecord | { error: Error }>(async (executor, transactionContext) => {
      const pending = await executor.selectFrom('repair_problem_pending_values').selectAll()
        .where('pending_problem_value_id', '=', input.pendingProblemValueId)
        .where('tenant_id', '=', validatedScope.tenantId).forUpdate().executeTakeFirst();
      if (!pending) return { error: new RepairProblemPendingNotFoundError() };
      if (pending.version !== input.expectedVersion || pending.resolution_status !== 'pending') return { error: new RepairProblemCategoryConcurrencyConflictError() };
      let categoryId = input.canonicalCategoryId;
      let canonicalLabel: string;
      let action: 'repair_problem_pending.resolved' | 'repair_problem_pending.canonical_created' = 'repair_problem_pending.resolved';
      if (input.newCategoryId && input.newCanonicalLabel && input.newNormalizedKey) {
        const duplicate = await executor.selectFrom('repair_problem_categories').select('category_id').where('normalized_key', '=', input.newNormalizedKey)
          .where((expression) => expression.or([expression('scope', '=', 'platform'), expression.and([expression('scope', '=', 'tenant'), expression('tenant_id', '=', validatedScope.tenantId)])])).executeTakeFirst();
        if (duplicate) return { error: new RepairProblemCategoryDuplicateError() };
        categoryId = input.newCategoryId;
        canonicalLabel = input.newCanonicalLabel;
        action = 'repair_problem_pending.canonical_created';
      } else {
        const category = categoryId ? await executor.selectFrom('repair_problem_categories').select(['category_id', 'canonical_label']).where('category_id', '=', categoryId).where('status', '=', 'active')
          .where((expression) => expression.or([expression('scope', '=', 'platform'), expression.and([expression('scope', '=', 'tenant'), expression('tenant_id', '=', validatedScope.tenantId)])])).forShare().executeTakeFirst() : undefined;
        if (!category) return { error: new RepairProblemCategoryNotFoundError() };
        canonicalLabel = category.canonical_label;
      }
      if (!await scope.commitGuard.confirmCurrent(transactionContext) || !await scope.commitGuard.confirmTemporalCurrent(transactionContext)) return { error: new RepairProblemCategoryAuthorizationChangedError() };
      if (action === 'repair_problem_pending.canonical_created') {
        await executor.insertInto('repair_problem_categories').values({ category_id: categoryId!, scope: 'tenant', tenant_id: validatedScope.tenantId, code: null, canonical_label: canonicalLabel!, normalized_key: input.newNormalizedKey!, status: 'active', version: 1, created_by_actor_id: scope.actorUserId, updated_by_actor_id: scope.actorUserId, created_at: input.occurredAt, updated_at: input.occurredAt }).execute();
      }
      const nextVersion = pending.version + 1;
      await executor.updateTable('repair_problem_pending_values').set({ resolution_status: 'resolved', canonical_category_id: categoryId, version: nextVersion, resolved_by_actor_id: scope.actorUserId, resolved_at: input.occurredAt }).where('pending_problem_value_id', '=', input.pendingProblemValueId).where('tenant_id', '=', validatedScope.tenantId).execute();
      await executor.updateTable('repair_problem_classifications').set({ category_id: categoryId, category_label_snapshot: canonicalLabel }).where('tenant_id', '=', validatedScope.tenantId).where('pending_problem_value_id', '=', input.pendingProblemValueId).execute();
      await executor.insertInto('repair_problem_category_catalog_events').values({ event_id: input.eventId, tenant_id: validatedScope.tenantId, category_id: categoryId!, pending_problem_value_id: input.pendingProblemValueId, station_id: scope.stationId, session_id: scope.sessionId, actor_user_id: scope.actorUserId, actor_display_name: scope.actorDisplayName, capability: scope.capability, action, old_version: pending.version, new_version: nextVersion, old_label: pending.raw_label_example, new_label: canonicalLabel!, old_status: 'pending', new_status: 'resolved', result: 'succeeded', correlation_id: input.correlationId, occurred_at: input.occurredAt }).execute();
      const usage = await executor.selectFrom('repair_problem_classifications').select(({ fn }) => fn.count('repair_id').distinct().as('count')).where('tenant_id', '=', validatedScope.tenantId).where('pending_problem_value_id', '=', input.pendingProblemValueId).executeTakeFirstOrThrow();
      return { pendingProblemValueId: pending.pending_problem_value_id, rawLabel: pending.raw_label_example, normalizedKey: pending.normalized_key, resolutionStatus: 'resolved', canonicalCategoryId: categoryId!, canonicalLabel: canonicalLabel!, version: nextVersion, usageCount: Number(usage.count), firstSeenAt: pending.first_seen_at.toISOString(), lastSeenAt: pending.last_seen_at.toISOString() };
    });
    if ('error' in outcome) throw outcome.error;
    return Object.freeze(outcome);
  }

  async changeProblemClassification(scope: RepairClassificationContext, input: ChangeRepairProblemClassificationRecord): Promise<RepairProblemClassificationRecord> {
    const validatedScope = validateScope(scope);
    const outcome = await this.executeTransaction<RepairProblemClassificationRecord | { error: Error }>(async (executor, transactionContext) => {
      const repair = await executor.selectFrom('repairs').select('repair_id').where('tenant_id', '=', validatedScope.tenantId).where('branch_id', '=', validatedScope.branchId).where('repair_id', '=', input.repairId).forUpdate().executeTakeFirst();
      if (!repair) return { error: new RepairProblemClassificationNotFoundError() };
      const category = await executor.selectFrom('repair_problem_categories').select(['category_id', 'canonical_label', 'normalized_key', 'status']).where('category_id', '=', input.categoryId).where((expression) => expression.or([expression('scope', '=', 'platform'), expression.and([expression('scope', '=', 'tenant'), expression('tenant_id', '=', validatedScope.tenantId)])])).forShare().executeTakeFirst();
      if (!category || (input.action === 'repair.problem_category.assigned' && category.status !== 'active')) return { error: new RepairProblemClassificationNotFoundError() };
      const existing = await executor.selectFrom('repair_problem_classifications').select(['problem_capture_id', 'category_label_snapshot', 'raw_problem_label_snapshot', 'stage']).where('repair_id', '=', input.repairId).where('category_id', '=', input.categoryId).executeTakeFirst();
      if ((input.action === 'repair.problem_category.assigned' && existing) || (input.action === 'repair.problem_category.removed' && (!existing || existing.stage !== 'post_intake'))) return { error: new RepairProblemClassificationConflictError() };
      if (!await scope.commitGuard.confirmCurrent(transactionContext) || !await scope.commitGuard.confirmTemporalCurrent(transactionContext)) return { error: new RepairProblemClassificationAuthorizationChangedError() };
      const labelSnapshot = input.action === 'repair.problem_category.assigned' ? category.canonical_label : existing!.category_label_snapshot!;
      const problemCaptureId = input.action === 'repair.problem_category.assigned' ? input.problemCaptureId : existing!.problem_capture_id;
      if (input.action === 'repair.problem_category.assigned') {
        const last = await executor.selectFrom('repair_problem_classifications').select(({ fn }) => fn.max('selection_order').as('position')).where('repair_id', '=', input.repairId).executeTakeFirstOrThrow();
        await executor.insertInto('repair_problem_classifications').values({ problem_capture_id: input.problemCaptureId, tenant_id: validatedScope.tenantId, branch_id: validatedScope.branchId, repair_id: input.repairId, category_id: input.categoryId, pending_problem_value_id: null, raw_problem_label_snapshot: category.canonical_label, normalized_problem_key: category.normalized_key, category_label_snapshot: labelSnapshot, selection_order: Number(last.position ?? 0) + 1, source: 'manual', stage: 'post_intake', assigned_by_actor_id: scope.actorUserId, assigned_at: input.occurredAt }).execute();
      }
      else await executor.deleteFrom('repair_problem_classifications').where('repair_id', '=', input.repairId).where('category_id', '=', input.categoryId).where('stage', '=', 'post_intake').execute();
      await executor.insertInto('repair_timeline_entries').values({ entry_id: input.timelineEntryId, tenant_id: validatedScope.tenantId, branch_id: validatedScope.branchId, repair_id: input.repairId, entry_type: 'system_event', actor_id: scope.actorUserId, actor_display_name: scope.actorDisplayName, title: input.action === 'repair.problem_category.assigned' ? 'Clasificación agregada' : 'Clasificación retirada', body: labelSnapshot, source: repairProblemClassificationTimelineSource, client_request_id: null, occurred_at: input.occurredAt, created_at: input.occurredAt }).execute();
      await executor.insertInto('repair_problem_classification_events').values({ event_id: input.eventId, tenant_id: validatedScope.tenantId, branch_id: validatedScope.branchId, repair_id: input.repairId, category_id: input.categoryId, timeline_entry_id: input.timelineEntryId, station_id: scope.stationId, session_id: scope.sessionId, actor_user_id: scope.actorUserId, actor_display_name: scope.actorDisplayName, capability: scope.capability, action: input.action, category_label_snapshot: labelSnapshot, source: 'manual', stage: 'post_intake', result: 'succeeded', correlation_id: input.correlationId, occurred_at: input.occurredAt }).execute();
      return { problemCaptureId, categoryId: input.categoryId, rawLabel: input.action === 'repair.problem_category.assigned' ? category.canonical_label : existing!.raw_problem_label_snapshot, label: category.canonical_label, status: category.status, stage: input.action === 'repair.problem_category.assigned' ? 'post_intake' : existing!.stage };
    });
    if ('error' in outcome) throw outcome.error; return Object.freeze(outcome);
  }

  async listEffectiveActiveRisks(scope: RepairPersistenceScope): Promise<readonly RepairRiskRecord[]> {
    const validatedScope = validateScope(scope);
    return this.execute(async (executor) => {
      const rows = await executor.selectFrom('repair_risks')
        .leftJoin('repair_intervention_risks', 'repair_intervention_risks.risk_id', 'repair_risks.risk_id')
        .leftJoin('repairs', (join) => join
          .onRef('repairs.repair_id', '=', 'repair_intervention_risks.repair_id')
          .on('repairs.tenant_id', '=', validatedScope.tenantId))
        .select([
          'repair_risks.risk_id', 'repair_risks.code', 'repair_risks.canonical_label',
          'repair_risks.normalized_key', 'repair_risks.scope', 'repair_risks.status',
          'repair_risks.version', 'repair_risks.created_at', 'repair_risks.updated_at',
        ])
        .select(({ fn }) => fn.count('repairs.repair_id').as('usage_count'))
        .where('repair_risks.status', '=', 'active')
        .where((expression) => expression.or([
          expression('repair_risks.scope', '=', 'platform'),
          expression.and([
            expression('repair_risks.scope', '=', 'tenant'),
            expression('repair_risks.tenant_id', '=', validatedScope.tenantId),
          ]),
        ]))
        .groupBy([
          'repair_risks.risk_id', 'repair_risks.code', 'repair_risks.canonical_label',
          'repair_risks.normalized_key', 'repair_risks.scope', 'repair_risks.status',
          'repair_risks.version', 'repair_risks.created_at', 'repair_risks.updated_at',
        ])
        .orderBy('repair_risks.canonical_label', 'asc')
        .orderBy('repair_risks.risk_id', 'asc')
        .execute();
      return Object.freeze(rows.map((row) => mapRepairRisk(row)));
    });
  }

  async listAdminRisks(scope: RepairPersistenceScope): Promise<readonly RepairRiskRecord[]> {
    const validatedScope = validateScope(scope);
    return this.execute(async (executor) => {
      const rows = await executor.selectFrom('repair_risks')
        .leftJoin('repair_intervention_risks', 'repair_intervention_risks.risk_id', 'repair_risks.risk_id')
        .leftJoin('repairs', (join) => join
          .onRef('repairs.repair_id', '=', 'repair_intervention_risks.repair_id')
          .on('repairs.tenant_id', '=', validatedScope.tenantId))
        .select([
          'repair_risks.risk_id', 'repair_risks.code', 'repair_risks.canonical_label',
          'repair_risks.normalized_key', 'repair_risks.scope', 'repair_risks.status',
          'repair_risks.version', 'repair_risks.created_at', 'repair_risks.updated_at',
        ])
        .select(({ fn }) => fn.count('repairs.repair_id').as('usage_count'))
        .where((expression) => expression.or([
          expression('repair_risks.scope', '=', 'platform'),
          expression.and([
            expression('repair_risks.scope', '=', 'tenant'),
            expression('repair_risks.tenant_id', '=', validatedScope.tenantId),
          ]),
        ]))
        .groupBy([
          'repair_risks.risk_id', 'repair_risks.code', 'repair_risks.canonical_label',
          'repair_risks.normalized_key', 'repair_risks.scope', 'repair_risks.status',
          'repair_risks.version', 'repair_risks.created_at', 'repair_risks.updated_at',
        ])
        .orderBy('repair_risks.status', 'asc')
        .orderBy('repair_risks.canonical_label', 'asc')
        .orderBy('repair_risks.risk_id', 'asc')
        .execute();
      return Object.freeze(rows.map((row) => mapRepairRisk(row)));
    });
  }

  async createRisk(scope: RepairRiskCatalogContext, input: CreateRepairRiskRecord): Promise<RepairRiskRecord> {
    const validatedScope = validateScope(scope);
    const outcome = await this.executeTransaction<RepairRiskRecord | Readonly<{ error: Error }>>(async (executor, transactionContext) => {
      const duplicate = await executor.selectFrom('repair_risks').select('risk_id')
        .where('normalized_key', '=', input.normalizedKey)
        .where((expression) => expression.or([
          expression('scope', '=', 'platform'),
          expression.and([
            expression('scope', '=', 'tenant'),
            expression('tenant_id', '=', validatedScope.tenantId),
          ]),
        ]))
        .executeTakeFirst();
      if (duplicate) return Object.freeze({ error: new RepairRiskDuplicateError() });
      if (!await scope.commitGuard.confirmCurrent(transactionContext) || !await scope.commitGuard.confirmTemporalCurrent(transactionContext)) {
        return Object.freeze({ error: new RepairRiskAuthorizationChangedError() });
      }
      await executor.insertInto('repair_risks').values({
        risk_id: input.riskId,
        scope: 'tenant',
        tenant_id: validatedScope.tenantId,
        code: null,
        canonical_label: input.canonicalLabel,
        normalized_key: input.normalizedKey,
        status: 'active',
        version: 1,
        created_by_actor_id: scope.actorUserId,
        updated_by_actor_id: scope.actorUserId,
        created_at: input.occurredAt,
        updated_at: input.occurredAt,
      }).execute();
      await executor.insertInto('repair_risk_catalog_events').values({
        event_id: input.eventId,
        tenant_id: validatedScope.tenantId,
        risk_id: input.riskId,
        station_id: scope.stationId,
        session_id: scope.sessionId,
        actor_user_id: scope.actorUserId,
        actor_display_name: scope.actorDisplayName,
        capability: scope.capability,
        action: 'repair_risk.created',
        old_version: null,
        new_version: 1,
        old_label: null,
        new_label: input.canonicalLabel,
        old_status: null,
        new_status: 'active',
        result: 'succeeded',
        correlation_id: input.correlationId,
        occurred_at: input.occurredAt,
      }).execute();
      return Object.freeze({
        riskId: input.riskId,
        code: null,
        canonicalLabel: input.canonicalLabel,
        normalizedKey: input.normalizedKey,
        scope: 'tenant' as const,
        status: 'active' as const,
        version: 1,
        usageCount: 0,
        createdAt: input.occurredAt.toISOString(),
        updatedAt: input.occurredAt.toISOString(),
      });
    });
    if ('error' in outcome) throw outcome.error;
    return outcome;
  }

  async changeRisk(scope: RepairRiskCatalogContext, input: ChangeRepairRiskRecord): Promise<RepairRiskRecord> {
    const validatedScope = validateScope(scope);
    const outcome = await this.executeTransaction<RepairRiskRecord | Readonly<{ error: Error }>>(async (executor, transactionContext) => {
      const current = await executor.selectFrom('repair_risks').selectAll()
        .where('risk_id', '=', input.riskId)
        .where('scope', '=', 'tenant')
        .where('tenant_id', '=', validatedScope.tenantId)
        .forUpdate()
        .executeTakeFirst();
      if (!current) return Object.freeze({ error: new RepairRiskNotFoundError() });
      if (current.version !== input.expectedVersion) return Object.freeze({ error: new RepairRiskConcurrencyConflictError() });
      if (input.status && current.status === input.status) return Object.freeze({ error: new RepairRiskConcurrencyConflictError() });
      if (input.normalizedKey) {
        const duplicate = await executor.selectFrom('repair_risks').select('risk_id')
          .where('risk_id', '!=', input.riskId)
          .where('normalized_key', '=', input.normalizedKey)
          .where((expression) => expression.or([
            expression('scope', '=', 'platform'),
            expression.and([
              expression('scope', '=', 'tenant'),
              expression('tenant_id', '=', validatedScope.tenantId),
            ]),
          ]))
          .executeTakeFirst();
        if (duplicate) return Object.freeze({ error: new RepairRiskDuplicateError() });
      }
      if (!await scope.commitGuard.confirmCurrent(transactionContext) || !await scope.commitGuard.confirmTemporalCurrent(transactionContext)) {
        return Object.freeze({ error: new RepairRiskAuthorizationChangedError() });
      }
      const canonicalLabel = input.canonicalLabel ?? current.canonical_label;
      const normalizedKey = input.normalizedKey ?? current.normalized_key;
      const status = input.status ?? current.status;
      const nextVersion = current.version + 1;
      await executor.updateTable('repair_risks').set({
        canonical_label: canonicalLabel,
        normalized_key: normalizedKey,
        status,
        version: nextVersion,
        updated_by_actor_id: scope.actorUserId,
        updated_at: input.occurredAt,
      }).where('risk_id', '=', input.riskId).where('tenant_id', '=', validatedScope.tenantId).execute();
      await executor.insertInto('repair_risk_catalog_events').values({
        event_id: input.eventId,
        tenant_id: validatedScope.tenantId,
        risk_id: input.riskId,
        station_id: scope.stationId,
        session_id: scope.sessionId,
        actor_user_id: scope.actorUserId,
        actor_display_name: scope.actorDisplayName,
        capability: scope.capability,
        action: input.action,
        old_version: current.version,
        new_version: nextVersion,
        old_label: current.canonical_label,
        new_label: canonicalLabel,
        old_status: current.status,
        new_status: status,
        result: 'succeeded',
        correlation_id: input.correlationId,
        occurred_at: input.occurredAt,
      }).execute();
      const usage = await executor.selectFrom('repair_intervention_risks')
        .innerJoin('repairs', 'repairs.repair_id', 'repair_intervention_risks.repair_id')
        .select(({ fn }) => fn.countAll().as('count'))
        .where('repairs.tenant_id', '=', validatedScope.tenantId)
        .where('repair_intervention_risks.risk_id', '=', input.riskId)
        .executeTakeFirstOrThrow();
      return Object.freeze({
        riskId: input.riskId,
        code: current.code,
        canonicalLabel,
        normalizedKey,
        scope: 'tenant' as const,
        status,
        version: nextVersion,
        usageCount: Number(usage.count),
        createdAt: current.created_at.toISOString(),
        updatedAt: input.occurredAt.toISOString(),
      });
    });
    if ('error' in outcome) throw outcome.error;
    return outcome;
  }

  async readNewRepairPolicy(scope: RepairPersistenceScope): Promise<NewRepairPolicyRecord | null> {
    const validatedScope = validateScope(scope);
    return this.execute(async (executor) => {
      const row = await executor.selectFrom('repair_new_repair_policy_heads')
        .select(['schema_version', 'current_version', 'field_states', 'updated_at'])
        .where('tenant_id', '=', validatedScope.tenantId)
        .where('branch_id', '=', validatedScope.branchId)
        .executeTakeFirst();
      return row ? Object.freeze({
        schemaVersion: row.schema_version,
        policyVersion: row.current_version,
        fieldStates: validateNewRepairFieldStates(row.field_states),
        updatedAt: row.updated_at.toISOString(),
      }) : null;
    });
  }

  async changeNewRepairPolicy(scope: RepairConfigurationContext, change: ChangeNewRepairPolicyRecord): Promise<NewRepairPolicyRecord> {
    const validatedScope = validateScope(scope);
    const outcome = await this.executeTransaction<NewRepairPolicyRecord | Readonly<{ error: Error }>>(async (executor, transactionContext) => {
      let current = await executor.selectFrom('repair_new_repair_policy_heads')
        .select(['schema_version', 'current_version'])
        .where('tenant_id', '=', validatedScope.tenantId)
        .where('branch_id', '=', validatedScope.branchId)
        .forUpdate()
        .executeTakeFirst();
      if (!current) {
        if (change.expectedVersion !== 0) return Object.freeze({ error: new NewRepairPolicyConcurrencyConflictError() });
        await executor.insertInto('repair_new_repair_policy_heads').values({
          tenant_id: validatedScope.tenantId,
          branch_id: validatedScope.branchId,
          schema_version: change.schemaVersion,
          current_version: 0,
          field_states: change.previousFieldStates,
          created_at: change.occurredAt,
          updated_at: change.occurredAt,
        }).onConflict((conflict) => conflict.columns(['tenant_id', 'branch_id']).doNothing()).execute();
        current = await executor.selectFrom('repair_new_repair_policy_heads')
          .select(['schema_version', 'current_version'])
          .where('tenant_id', '=', validatedScope.tenantId)
          .where('branch_id', '=', validatedScope.branchId)
          .forUpdate()
          .executeTakeFirstOrThrow();
      }
      if (current.current_version !== change.expectedVersion || current.schema_version !== change.schemaVersion) return Object.freeze({ error: new NewRepairPolicyConcurrencyConflictError() });
      if (!await scope.commitGuard.confirmCurrent(transactionContext) || !await scope.commitGuard.confirmTemporalCurrent(transactionContext)) return Object.freeze({ error: new NewRepairPolicyAuthorizationChangedError() });
      const nextVersion = current.current_version + 1;
      await executor.insertInto('repair_new_repair_policy_versions').values({
        tenant_id: validatedScope.tenantId,
        branch_id: validatedScope.branchId,
        policy_version: nextVersion,
        schema_version: change.schemaVersion,
        previous_version: current.current_version,
        field_states: change.fieldStates,
        actor_user_id: scope.actorUserId,
        actor_display_name: scope.actorDisplayName,
        station_id: scope.stationId,
        session_id: scope.sessionId,
        capability: scope.capability,
        action: change.action,
        result: 'succeeded',
        correlation_id: change.correlationId,
        occurred_at: change.occurredAt,
      }).execute();
      await executor.updateTable('repair_new_repair_policy_heads').set({
        current_version: nextVersion,
        field_states: change.fieldStates,
        updated_at: change.occurredAt,
      }).where('tenant_id', '=', validatedScope.tenantId).where('branch_id', '=', validatedScope.branchId).execute();
      return Object.freeze({ schemaVersion: change.schemaVersion, policyVersion: nextVersion, fieldStates: change.fieldStates, updatedAt: change.occurredAt.toISOString() });
    });
    if ('error' in outcome) throw outcome.error;
    return outcome;
  }

  async listWorklist(
    scope: RepairPersistenceScope,
    query: RepairWorklistQuery,
    timeZone: BranchTimeZone,
  ): Promise<RepairWorklistPage> {
    const validatedScope = validateScope(scope);
    const validatedQuery = query;
    const range = dateRange(validatedQuery, this.now(), timeZone);

    return this.execute(async (executor: RepairExecutor) => {
      let filtered = executor
        .selectFrom('repairs')
        .leftJoin('repair_intakes', (join) => join
          .onRef('repair_intakes.repair_id', '=', 'repairs.repair_id')
          .onRef('repair_intakes.tenant_id', '=', 'repairs.tenant_id')
          .onRef('repair_intakes.branch_id', '=', 'repairs.branch_id'))
        .leftJoin('repair_brands', 'repair_brands.brand_id', 'repair_intakes.canonical_brand_id')
        .leftJoin('repair_models', 'repair_models.model_id', 'repair_intakes.canonical_model_id')
        .selectAll('repairs')
        .select([
          'repair_intakes.canonical_brand_id as canonical_brand_id',
          'repair_brands.canonical_label as canonical_brand_label',
          'repair_intakes.canonical_model_id as canonical_model_id',
          'repair_models.canonical_label as canonical_model_label',
          'repair_models.canonical_brand_id as canonical_model_brand_id',
        ])
        .where('repairs.tenant_id', '=', validatedScope.tenantId)
        .where('repairs.branch_id', '=', validatedScope.branchId);
      const whereSearch = validatedQuery.q
        ? literalLikePattern(validatedQuery.q)
        : undefined;
      if (whereSearch) {
        filtered = filtered.where((expression) => expression.or([
          expression('repairs.folio', 'ilike', whereSearch),
          expression('repairs.customer_name', 'ilike', whereSearch),
          expression('repairs.customer_phone', 'ilike', whereSearch),
          expression('repairs.device_brand', 'ilike', whereSearch),
          expression('repair_brands.canonical_label', 'ilike', whereSearch),
          expression('repairs.device_model', 'ilike', whereSearch),
          expression('repair_models.canonical_label', 'ilike', whereSearch),
          expression('repairs.reported_issue', 'ilike', whereSearch),
        ]));
      }
      if (range.from) filtered = filtered.where('repairs.received_at', '>=', range.from);
      if (range.to) filtered = filtered.where('repairs.received_at', '<', range.to);
      if (validatedQuery.status) filtered = filtered.where('repairs.repair_status', '=', validatedQuery.status);
      if (validatedQuery.technicianId) {
        filtered = filtered.where(({ eb }) => eb.exists(
          executor
            .selectFrom('repair_technician_assignments')
            .select('repair_technician_assignments.assignment_id')
            .whereRef('repair_technician_assignments.tenant_id', '=', 'repairs.tenant_id' as never)
            .whereRef('repair_technician_assignments.branch_id', '=', 'repairs.branch_id' as never)
            .whereRef('repair_technician_assignments.repair_id', '=', 'repairs.repair_id' as never)
            .where('repair_technician_assignments.technician_id', '=', validatedQuery.technicianId!)
            .where('repair_technician_assignments.ended_at', 'is', null),
        ));
      }
      if (validatedQuery.unassigned) {
        filtered = filtered.where(({ eb }) => eb.not(eb.exists(
          executor
            .selectFrom('repair_technician_assignments')
            .select('repair_technician_assignments.assignment_id')
            .whereRef('repair_technician_assignments.tenant_id', '=', 'repairs.tenant_id' as never)
            .whereRef('repair_technician_assignments.branch_id', '=', 'repairs.branch_id' as never)
            .whereRef('repair_technician_assignments.repair_id', '=', 'repairs.repair_id' as never)
            .where('repair_technician_assignments.ended_at', 'is', null),
        )));
      }
      if (validatedQuery.custody) filtered = filtered.where('repairs.custody_status', '=', validatedQuery.custody);

      const [rows, total, unfiltered, technicians] = await Promise.all([
        filtered
          .orderBy('repairs.received_at', 'desc')
          .orderBy('repairs.repair_id', 'desc')
          .limit(validatedQuery.pageSize)
          .offset((validatedQuery.page - 1) * validatedQuery.pageSize)
          .execute(),
        filtered
          .clearSelect()
          .select(({ fn }) => fn.countAll<number>().as('count'))
          .executeTakeFirstOrThrow(),
        executor
          .selectFrom('repairs')
          .select(({ fn }) => fn.countAll<number>().as('count'))
          .where('tenant_id', '=', validatedScope.tenantId)
          .where('branch_id', '=', validatedScope.branchId)
          .executeTakeFirstOrThrow(),
        executor
          .selectFrom('repair_technician_branches')
          .innerJoin('repair_technicians', 'repair_technicians.technician_id', 'repair_technician_branches.technician_id')
          .select(['repair_technicians.technician_id as technician_id', 'repair_technicians.display_name as technician_display_name'])
          .where('repair_technician_branches.tenant_id', '=', validatedScope.tenantId)
          .where('repair_technician_branches.branch_id', '=', validatedScope.branchId)
          .whereRef('repair_technicians.tenant_id', '=', 'repair_technician_branches.tenant_id')
          .where('repair_technicians.active', '=', true)
          .orderBy('repair_technicians.display_name', 'asc')
          .execute(),
      ]);
      const activeAssignments = await executor
        .selectFrom('repair_technician_assignments')
        .innerJoin('repair_technicians', 'repair_technicians.technician_id', 'repair_technician_assignments.technician_id')
        .select([
          'repair_technician_assignments.repair_id',
          'repair_technician_assignments.assignment_id',
          'repair_technician_assignments.tenant_id',
          'repair_technician_assignments.branch_id',
          'repair_technician_assignments.technician_id',
          'repair_technician_assignments.assigned_by_actor_id',
          'repair_technician_assignments.assigned_by_actor_display_name',
          'repair_technician_assignments.assigned_at',
          'repair_technician_assignments.ended_at',
          'repair_technician_assignments.ended_by_actor_id',
          'repair_technician_assignments.ended_by_actor_display_name',
          'repair_technician_assignments.reason',
          'repair_technician_assignments.client_request_id',
          'repair_technician_assignments.ended_client_request_id',
          'repair_technician_assignments.assignment_sequence',
          'repair_technicians.display_name as technician_display_name',
        ])
        .where('repair_technician_assignments.tenant_id', '=', validatedScope.tenantId)
        .where('repair_technician_assignments.branch_id', '=', validatedScope.branchId)
        .whereRef('repair_technicians.tenant_id', '=', 'repair_technician_assignments.tenant_id')
        .where('repair_technician_assignments.ended_at', 'is', null)
        .execute();
      const reportedProblemRows = rows.length === 0 ? [] : await executor
        .selectFrom('repair_problem_classifications')
        .leftJoin('repair_problem_categories', 'repair_problem_categories.category_id', 'repair_problem_classifications.category_id')
        .select(['repair_problem_classifications.repair_id', 'repair_problem_classifications.raw_problem_label_snapshot', 'repair_problem_classifications.selection_order', 'repair_problem_categories.canonical_label'])
        .where('repair_problem_classifications.tenant_id', '=', validatedScope.tenantId)
        .where('repair_problem_classifications.branch_id', '=', validatedScope.branchId)
        .where('repair_problem_classifications.repair_id', 'in', rows.map((row) => row.repair_id))
        .orderBy('repair_problem_classifications.selection_order', 'asc').execute();
      const reportedProblemsByRepair = new Map<string, string[]>();
      for (const problem of reportedProblemRows) {
        const labels = reportedProblemsByRepair.get(problem.repair_id) ?? [];
        const label = problem.canonical_label ?? problem.raw_problem_label_snapshot;
        if (!labels.includes(label)) labels.push(label);
        reportedProblemsByRepair.set(problem.repair_id, labels);
      }
      const workflowTransitions = rows.length === 0 ? [] : await executor
        .selectFrom('repair_workflow_transitions')
        .select(['repair_id', 'to_state', 'workflow_version'])
        .where('tenant_id', '=', validatedScope.tenantId)
        .where('branch_id', '=', validatedScope.branchId)
        .where('repair_id', 'in', rows.map((row) => row.repair_id))
        .orderBy('workflow_version', 'desc')
        .execute();
      const workflowByRepair = new Map<string, string>();
      for (const transition of workflowTransitions) {
        if (!workflowByRepair.has(transition.repair_id)) workflowByRepair.set(transition.repair_id, transition.to_state);
      }
      const assignmentByRepair = new Map(activeAssignments.map((assignment) => [assignment.repair_id, assignment as AssignmentProjection]));
      const totalCount = Number(total.count);
      return Object.freeze({
        items: Object.freeze(rows.map((row) => technicianProjection({
          ...row,
          projected_repair_status: workflowByRepair.get(row.repair_id) ?? row.repair_status,
          effective_reported_issue: reportedProblemsByRepair.get(row.repair_id)?.join(' · '),
        }, assignmentByRepair.get(row.repair_id)))),
        page: validatedQuery.page,
        pageSize: validatedQuery.pageSize,
        totalCount,
        unfilteredCount: Number(unfiltered.count),
        hasNextPage: validatedQuery.page * validatedQuery.pageSize < totalCount,
        technicians: Object.freeze(technicians.flatMap((technician) => (
          technician.technician_id && technician.technician_display_name
            ? [{ id: technician.technician_id, displayName: technician.technician_display_name }]
            : []
        ))),
      });
    });
  }

  async getRepairById(
    scope: RepairPersistenceScope,
    repairId: string,
  ): Promise<RepairDetailRecord | null> {
    const validatedScope = validateScope(scope);
    return this.execute(async (executor: RepairExecutor) => {
      const row = await executor
        .selectFrom('repairs')
        .leftJoin('repair_intakes', (join) => join
          .onRef('repair_intakes.repair_id', '=', 'repairs.repair_id')
          .onRef('repair_intakes.tenant_id', '=', 'repairs.tenant_id')
          .onRef('repair_intakes.branch_id', '=', 'repairs.branch_id'))
        .leftJoin('repair_brands', 'repair_brands.brand_id', 'repair_intakes.canonical_brand_id')
        .leftJoin('repair_device_types', 'repair_device_types.device_type_id', 'repair_intakes.canonical_device_type_id')
        .leftJoin('repair_models', 'repair_models.model_id', 'repair_intakes.canonical_model_id')
        .select([
          'repairs.repair_id',
          'repairs.folio',
          'repairs.customer_name',
          'repairs.customer_phone',
          'repairs.device_brand',
          'repair_intakes.canonical_brand_id as canonical_brand_id',
          'repair_brands.canonical_label as canonical_brand_label',
          'repair_intakes.canonical_model_id as canonical_model_id',
          'repair_models.canonical_label as canonical_model_label',
          'repair_models.canonical_brand_id as canonical_model_brand_id',
          'repairs.device_model',
          'repair_intakes.equipment_version',
          'repair_intakes.device_color',
          'repair_intakes.device_type',
          'repair_intakes.canonical_device_type_id as canonical_device_type_id',
          'repair_device_types.canonical_label as canonical_device_type_label',
          'repair_intakes.device_identifier',
          'repair_intakes.device_identifier_unavailable',
          'repair_intakes.distinctive_signs',
          'repair_intakes.sim_included',
          'repair_intakes.memory_card_included',
          'repair_intakes.other_accessories',
          'repairs.received_at',
          'repair_intakes.received_by_id',
          'repair_intakes.received_by_display_name',
          'repairs.reported_issue',
          'repair_intakes.customer_narrative',
          'repair_intakes.physical_condition_summary',
          'repair_intakes.documented_risk_summary',
          'repair_intakes.received_power_state',
          'repair_intakes.device_access_type',
          'repair_intakes.initial_budget_amount_minor',
          'repair_intakes.new_repair_policy_version',
          'repair_intakes.warranty_review_requested',
          'repair_intakes.previous_repair_id',
          'repair_intakes.delivered_by_name',
          'repair_intakes.estimated_delivery_at',
          'repairs.technician_id',
          'repairs.technician_display_name',
          'repairs.repair_status',
          'repairs.custody_status',
        ])
        .where('repairs.tenant_id', '=', validatedScope.tenantId)
        .where('repairs.branch_id', '=', validatedScope.branchId)
        .where('repairs.repair_id', '=', repairId)
        .executeTakeFirst();
      if (!row) return null;

      const timelineScope = executor
        .selectFrom('repair_timeline_entries')
        .where('tenant_id', '=', validatedScope.tenantId)
        .where('branch_id', '=', validatedScope.branchId)
        .where('repair_id', '=', repairId);
      const evidenceScope = executor
        .selectFrom('repair_attachments')
        .where('tenant_id', '=', validatedScope.tenantId)
        .where('branch_id', '=', validatedScope.branchId)
        .where('repair_id', '=', repairId);
      const assignmentUnassignmentCount = executor
        .selectFrom('repair_timeline_entries')
        .select(({ fn }) => fn.countAll<number>().as('count'))
        .where('tenant_id', '=', validatedScope.tenantId)
        .where('branch_id', '=', validatedScope.branchId)
        .where('repair_id', '=', repairId)
        .where('source', '=', 'local.technician_assignment')
        .where('title', '=', 'Asignación retirada');
      const [acceptedRiskRows, problemClassificationRows, timelineRows, timelineCount, evidenceRows, evidenceCount, assignmentRows, unassignmentCount, workflowTransition, locationMovement] = await Promise.all([
        executor.selectFrom('repair_intervention_risks')
          .select(['risk_id', 'risk_label_snapshot'])
          .where('repair_id', '=', repairId)
          .orderBy('selection_order', 'asc')
          .execute(),
        executor.selectFrom('repair_problem_classifications')
          .leftJoin('repair_problem_categories', 'repair_problem_categories.category_id', 'repair_problem_classifications.category_id')
          .select(['repair_problem_classifications.problem_capture_id', 'repair_problem_classifications.category_id', 'repair_problem_classifications.raw_problem_label_snapshot', 'repair_problem_classifications.stage', 'repair_problem_categories.canonical_label', 'repair_problem_categories.status'])
          .where('repair_problem_classifications.tenant_id', '=', validatedScope.tenantId)
          .where('repair_problem_classifications.branch_id', '=', validatedScope.branchId)
          .where('repair_problem_classifications.repair_id', '=', repairId)
          .orderBy('repair_problem_classifications.selection_order', 'asc')
          .execute(),
        timelineScope
          .select([
            'entry_id',
            'entry_type',
            'actor_id',
            'actor_display_name',
            'title',
            'body',
            'source',
            'client_request_id',
            'occurred_at',
          ])
          .orderBy('occurred_at', 'desc')
          .orderBy('entry_id', 'desc')
          .limit(repairTimelineLimit)
          .execute(),
        timelineScope
          .select(({ fn }) => fn.countAll<number>().as('count'))
          .executeTakeFirstOrThrow(),
        evidenceScope
          .select([
            'attachment_id', 'kind', 'category', 'captured_at', 'uploaded_at',
            'uploaded_by_id', 'uploaded_by_display_name', 'mime_type',
            'width', 'height', 'caption',
          ])
          .orderBy('uploaded_at', 'desc')
          .orderBy('attachment_id', 'desc')
          .limit(repairEvidenceLimit)
          .execute(),
        evidenceScope
          .select(({ fn }) => fn.countAll<number>().as('count'))
          .executeTakeFirstOrThrow(),
        executor
          .selectFrom('repair_technician_assignments')
          .innerJoin('repair_technicians', 'repair_technicians.technician_id', 'repair_technician_assignments.technician_id')
          .select([
            'repair_technician_assignments.assignment_id',
            'repair_technician_assignments.tenant_id',
            'repair_technician_assignments.branch_id',
            'repair_technician_assignments.repair_id',
            'repair_technician_assignments.technician_id',
            'repair_technician_assignments.assigned_by_actor_id',
            'repair_technician_assignments.assigned_by_actor_display_name',
            'repair_technician_assignments.assigned_at',
            'repair_technician_assignments.ended_at',
            'repair_technician_assignments.ended_by_actor_id',
            'repair_technician_assignments.ended_by_actor_display_name',
            'repair_technician_assignments.reason',
            'repair_technician_assignments.client_request_id',
            'repair_technician_assignments.ended_client_request_id',
            'repair_technician_assignments.assignment_sequence',
            'repair_technicians.display_name as technician_display_name',
          ])
          .where('repair_technician_assignments.tenant_id', '=', validatedScope.tenantId)
          .where('repair_technician_assignments.branch_id', '=', validatedScope.branchId)
          .where('repair_technician_assignments.repair_id', '=', repairId)
          .whereRef('repair_technicians.tenant_id', '=', 'repair_technician_assignments.tenant_id')
          .orderBy('repair_technician_assignments.assignment_sequence', 'desc')
          .execute(),
        assignmentUnassignmentCount.executeTakeFirstOrThrow(),
        executor
          .selectFrom('repair_workflow_transitions')
          .select(['to_state', 'workflow_version'])
          .where('tenant_id', '=', validatedScope.tenantId)
          .where('branch_id', '=', validatedScope.branchId)
          .where('repair_id', '=', repairId)
          .orderBy('workflow_version', 'desc')
          .limit(1)
          .executeTakeFirst(),
        executor
          .selectFrom('repair_location_movements')
          .innerJoin('repair_locations', (join) => join
            .onRef('repair_locations.location_id', '=', 'repair_location_movements.to_location_id')
            .onRef('repair_locations.tenant_id', '=', 'repair_location_movements.tenant_id')
            .onRef('repair_locations.branch_id', '=', 'repair_location_movements.branch_id'))
          .select([
            'repair_locations.location_id',
            'repair_locations.code',
            'repair_locations.semantic_category',
            'repair_locations.display_label',
            'repair_location_movements.occurred_at',
            'repair_location_movements.location_version',
          ])
          .where('repair_location_movements.tenant_id', '=', validatedScope.tenantId)
          .where('repair_location_movements.branch_id', '=', validatedScope.branchId)
          .where('repair_location_movements.repair_id', '=', repairId)
          .orderBy('repair_location_movements.location_version', 'desc')
          .limit(1)
          .executeTakeFirst(),
      ]);
      const assignments = assignmentRows as readonly AssignmentProjection[];
      const activeAssignment = assignments.find((assignment) => assignment.ended_at === null);
      const projectedRow = {
        ...row,
        projected_repair_status: workflowTransition?.to_state ?? row.repair_status,
        workflow_version: workflowTransition?.workflow_version ?? 0,
        technician_id: activeAssignment?.technician_id ?? null,
        technician_display_name: activeAssignment?.technician_display_name ?? null,
      };
      return mapRepairDetail(
        projectedRow,
        acceptedRiskRows,
        problemClassificationRows,
        timelineRows.map((entry) => mapTimelineEntry(entry)),
        Number(timelineCount.count),
        evidenceRows.map(mapEvidence),
        Number(evidenceCount.count),
        assignments.map(mapAssignmentHistory),
        assignments.length + Number(unassignmentCount.count),
        locationMovement,
      );
    });
  }

  async createRepair(
    scope: RepairCreateContext,
    repair: CreateRepairRecord,
    resolveCustomer: CreateRepairCustomerResolver,
  ): Promise<CreatedRepairRecord> {
    const validatedScope = validateScope(scope);
    const fingerprint = createHash('sha256').update(JSON.stringify({
      customerId: repair.customerId,
      customerGivenName: repair.customerGivenName,
      customerFamilyName: repair.customerFamilyName,
      customerPhone: repair.customerPhone,
      addCustomerContactPhone: repair.addCustomerContactPhone,
      deviceType: repair.deviceType,
      deviceBrand: repair.deviceBrand,
      canonicalBrandId: repair.canonicalBrandId,
      deviceModel: repair.deviceModel,
      canonicalModelId: repair.canonicalModelId,
      deviceIdentifier: repair.deviceIdentifier,
      deviceIdentifierUnavailable: repair.deviceIdentifierUnavailable,
      deviceColor: repair.deviceColor,
      distinctiveSigns: repair.distinctiveSigns,
      simIncluded: repair.simIncluded,
      memoryCardIncluded: repair.memoryCardIncluded,
      otherAccessories: repair.otherAccessories,
      reportedProblems: repair.reportedProblems.map(({ rawLabel, normalizedKey, canonicalCategoryId }) => ({ rawLabel, normalizedKey, canonicalCategoryId })),
      customerNarrative: repair.customerNarrative,
      physicalConditionSummary: repair.physicalConditionSummary,
      documentedRiskSummary: repair.documentedRiskSummary,
      acceptedRiskIds: repair.acceptedRiskIds,
      receivedPowerState: repair.receivedPowerState,
      deviceAccessType: repair.deviceAccessType,
      initialBudgetAmountMinor: repair.initialBudgetAmountMinor,
      newRepairPolicyVersion: repair.newRepairPolicyVersion,
      warrantyReviewRequested: repair.warrantyReviewRequested,
      previousRepairId: repair.previousRepairId,
      deliveredByName: repair.deliveredByName,
      estimatedDeliveryAt: repair.estimatedDeliveryAt?.toISOString() ?? null,
    })).digest();
    const outcome = await this.#runCreateTransaction<CreatedRepairRecord | Readonly<{ error: Error }>>(async (executor, transactionContext) => {
      const existing = await executor.selectFrom('repair_create_commands')
        .innerJoin('repairs', (join) => join
          .onRef('repairs.tenant_id', '=', 'repair_create_commands.tenant_id')
          .onRef('repairs.branch_id', '=', 'repair_create_commands.branch_id')
          .onRef('repairs.repair_id', '=', 'repair_create_commands.repair_id'))
        .innerJoin('repair_business_audit_events', (join) => join
          .onRef('repair_business_audit_events.tenant_id', '=', 'repair_create_commands.tenant_id')
          .onRef('repair_business_audit_events.branch_id', '=', 'repair_create_commands.branch_id')
          .onRef('repair_business_audit_events.resource_id', '=', 'repair_create_commands.repair_id')
          .onRef('repair_business_audit_events.client_request_id', '=', 'repair_create_commands.client_request_id'))
        .innerJoin('repair_intakes', (join) => join
          .onRef('repair_intakes.tenant_id', '=', 'repair_create_commands.tenant_id')
          .onRef('repair_intakes.branch_id', '=', 'repair_create_commands.branch_id')
          .onRef('repair_intakes.repair_id', '=', 'repair_create_commands.repair_id'))
        .select(['repair_create_commands.request_fingerprint', 'repair_create_commands.customer_id', 'repair_create_commands.repair_id', 'repair_create_commands.folio', 'repairs.customer_name', 'repairs.customer_phone', 'repairs.received_at', 'repair_business_audit_events.correlation_id', 'repair_intakes.new_repair_policy_version'])
        .where('repair_create_commands.tenant_id', '=', validatedScope.tenantId)
        .where('repair_create_commands.branch_id', '=', validatedScope.branchId)
        .where('repair_create_commands.client_request_id', '=', repair.clientRequestId)
        .executeTakeFirst();
      if (existing) {
        if (!Buffer.from(existing.request_fingerprint).equals(fingerprint)) throw new RepairCreateIdempotencyConflictError();
        return Object.freeze({ repairId: existing.repair_id, folio: existing.folio, customerId: existing.customer_id, customerName: existing.customer_name, customerPhone: existing.customer_phone, occurredAt: existing.received_at.toISOString(), correlationId: existing.correlation_id, newRepairPolicyVersion: existing.new_repair_policy_version });
      }
      if (!await scope.commitGuard.confirmCurrent(transactionContext)) throw new RepairCreateAuthorizationChangedError();
      const selectedRiskRows = repair.acceptedRiskIds.length > 0
        ? await executor.selectFrom('repair_risks')
          .select(['risk_id', 'canonical_label'])
          .where('risk_id', 'in', [...repair.acceptedRiskIds])
          .where('status', '=', 'active')
          .where((expression) => expression.or([
            expression('scope', '=', 'platform'),
            expression.and([
              expression('scope', '=', 'tenant'),
              expression('tenant_id', '=', validatedScope.tenantId),
            ]),
          ]))
          .forShare()
          .execute()
        : [];
      if (selectedRiskRows.length !== repair.acceptedRiskIds.length) return Object.freeze({ error: new RepairCreateRiskUnavailableError() });
      const selectedRiskById = new Map(selectedRiskRows.map((risk) => [risk.risk_id, risk] as const));
      const selectedRisks = repair.acceptedRiskIds.map((riskId) => selectedRiskById.get(riskId));
      if (selectedRisks.some((risk) => !risk)) return Object.freeze({ error: new RepairCreateRiskUnavailableError() });
      let canonicalDeviceTypeId: string | null = null;
      let pendingDeviceTypeValueId: string | null = null;
      if (repair.deviceType && repair.canonicalDeviceTypeId) {
        const selected = await executor.selectFrom('repair_device_types').select('device_type_id').where('device_type_id', '=', repair.canonicalDeviceTypeId).where('status', '=', 'active').where((eb) => eb.or([eb('scope', '=', 'platform'), eb.and([eb('scope', '=', 'tenant'), eb('tenant_id', '=', validatedScope.tenantId)])])).forShare().executeTakeFirst();
        if (!selected) return Object.freeze({ error: new RepairCreateDeviceTypeUnavailableError() });
        canonicalDeviceTypeId = selected.device_type_id;
      } else if (repair.deviceType) {
        const normalizedKey = normalizeRepairDeviceTypeKey(repair.deviceType);
        const exact = await executor.selectFrom('repair_device_types').select('device_type_id').where('normalized_key', '=', normalizedKey).where('status', '=', 'active').where((eb) => eb.or([eb('scope', '=', 'platform'), eb.and([eb('scope', '=', 'tenant'), eb('tenant_id', '=', validatedScope.tenantId)])])).orderBy('scope', 'asc').forShare().executeTakeFirst();
        if (exact) canonicalDeviceTypeId = exact.device_type_id;
        else if (normalizedKey.length >= 2) {
          if (!repair.pendingDeviceTypeValueId) throw new Error('Pending DeviceType identity is missing.');
          await executor.insertInto('repair_device_type_pending_values').values({ pending_device_type_value_id: repair.pendingDeviceTypeValueId, tenant_id: validatedScope.tenantId, raw_label_example: repair.deviceType, normalized_key: normalizedKey, resolution_status: 'pending', canonical_device_type_id: null, version: 1, first_seen_at: repair.occurredAt, last_seen_at: repair.occurredAt, resolved_by_actor_id: null, resolved_at: null }).onConflict((conflict) => conflict.columns(['tenant_id', 'normalized_key']).doUpdateSet({ last_seen_at: repair.occurredAt })).execute();
          const pending = await executor.selectFrom('repair_device_type_pending_values').select(['pending_device_type_value_id', 'canonical_device_type_id']).where('tenant_id', '=', validatedScope.tenantId).where('normalized_key', '=', normalizedKey).forShare().executeTakeFirstOrThrow();
          pendingDeviceTypeValueId = pending.pending_device_type_value_id; canonicalDeviceTypeId = pending.canonical_device_type_id;
        }
      }
      let canonicalBrandId: string | null = null;
      let pendingBrandValueId: string | null = null;
      if (repair.deviceBrand && repair.canonicalBrandId) {
        const selectedBrand = await executor.selectFrom('repair_brands').select('brand_id')
          .where('brand_id', '=', repair.canonicalBrandId).where('status', '=', 'active')
          .where((expression) => expression.or([
            expression('scope', '=', 'platform'),
            expression.and([expression('scope', '=', 'tenant'), expression('tenant_id', '=', validatedScope.tenantId)]),
          ])).forShare().executeTakeFirst();
        if (!selectedBrand) return Object.freeze({ error: new RepairCreateBrandUnavailableError() });
        canonicalBrandId = selectedBrand.brand_id;
      } else if (repair.deviceBrand) {
        const normalizedBrandKey = normalizeRepairBrandKey(repair.deviceBrand);
        if (normalizedBrandKey.length >= 2) {
          const exactBrand = await executor.selectFrom('repair_brands').select('brand_id')
            .where('normalized_key', '=', normalizedBrandKey).where('status', '=', 'active')
            .where((expression) => expression.or([
              expression('scope', '=', 'platform'),
              expression.and([expression('scope', '=', 'tenant'), expression('tenant_id', '=', validatedScope.tenantId)]),
            ])).orderBy('scope', 'asc').forShare().executeTakeFirst();
          if (exactBrand) {
            canonicalBrandId = exactBrand.brand_id;
          } else {
            if (!repair.pendingBrandValueId) throw new Error('Pending brand identity is missing.');
            await executor.insertInto('repair_brand_pending_values').values({
              pending_brand_value_id: repair.pendingBrandValueId,
              tenant_id: validatedScope.tenantId,
              raw_label_example: repair.deviceBrand,
              normalized_key: normalizedBrandKey,
              resolution_status: 'pending',
              canonical_brand_id: null,
              version: 1,
              first_seen_at: repair.occurredAt,
              last_seen_at: repair.occurredAt,
              resolved_by_actor_id: null,
              resolved_at: null,
            }).onConflict((conflict) => conflict.columns(['tenant_id', 'normalized_key']).doUpdateSet({ last_seen_at: repair.occurredAt })).execute();
            const pending = await executor.selectFrom('repair_brand_pending_values').select(['pending_brand_value_id', 'canonical_brand_id'])
              .where('tenant_id', '=', validatedScope.tenantId).where('normalized_key', '=', normalizedBrandKey).forShare().executeTakeFirstOrThrow();
            pendingBrandValueId = pending.pending_brand_value_id;
            canonicalBrandId = pending.canonical_brand_id;
          }
        }
      }
      let canonicalModelId: string | null = null;
      let pendingModelValueId: string | null = null;
      if (repair.deviceModel && repair.canonicalModelId) {
        if (!canonicalBrandId) return Object.freeze({ error: new RepairCreateModelUnavailableError() });
        const selectedModel = await executor.selectFrom('repair_models').select(['model_id', 'canonical_brand_id'])
          .where('model_id', '=', repair.canonicalModelId).where('status', '=', 'active')
          .where((expression) => expression.or([expression('scope', '=', 'platform'), expression.and([expression('scope', '=', 'tenant'), expression('tenant_id', '=', validatedScope.tenantId)])]))
          .forShare().executeTakeFirst();
        if (!selectedModel || selectedModel.canonical_brand_id !== canonicalBrandId) return Object.freeze({ error: new RepairCreateModelUnavailableError() });
        canonicalModelId = selectedModel.model_id;
      } else if (repair.deviceModel) {
        const normalizedModelKey = normalizeRepairModelKey(repair.deviceModel);
        if (canonicalBrandId) {
          const exactModel = await executor.selectFrom('repair_models').select('model_id')
            .where('canonical_brand_id', '=', canonicalBrandId).where('normalized_key', '=', normalizedModelKey).where('status', '=', 'active')
            .where((expression) => expression.or([expression('scope', '=', 'platform'), expression.and([expression('scope', '=', 'tenant'), expression('tenant_id', '=', validatedScope.tenantId)])]))
            .orderBy('scope', 'asc').forShare().executeTakeFirst();
          canonicalModelId = exactModel?.model_id ?? null;
        }
        if (!canonicalModelId && normalizedModelKey) {
          if (!repair.pendingModelValueId) throw new Error('Pending model identity is missing.');
          const brandContextKey = canonicalBrandId
            ? `canonical:${canonicalBrandId}`
            : pendingBrandValueId
              ? `pending:${pendingBrandValueId}`
              : repair.deviceBrand
                ? `raw:${normalizeRepairBrandKey(repair.deviceBrand)}`
                : 'none';
          await executor.insertInto('repair_model_pending_values').values({
            pending_model_value_id: repair.pendingModelValueId,
            tenant_id: validatedScope.tenantId,
            brand_context_key: brandContextKey,
            canonical_brand_id: canonicalBrandId,
            pending_brand_value_id: canonicalBrandId ? null : pendingBrandValueId,
            raw_brand_label_example: canonicalBrandId || pendingBrandValueId ? null : repair.deviceBrand,
            raw_model_label_example: repair.deviceModel,
            normalized_model_key: normalizedModelKey,
            resolution_status: 'pending',
            canonical_model_id: null,
            version: 1,
            first_seen_at: repair.occurredAt,
            last_seen_at: repair.occurredAt,
            resolved_by_actor_id: null,
            resolved_at: null,
          }).onConflict((conflict) => conflict.columns(['tenant_id', 'brand_context_key', 'normalized_model_key']).doUpdateSet({ last_seen_at: repair.occurredAt })).execute();
          const pending = await executor.selectFrom('repair_model_pending_values').select(['pending_model_value_id', 'canonical_model_id'])
            .where('tenant_id', '=', validatedScope.tenantId).where('brand_context_key', '=', brandContextKey).where('normalized_model_key', '=', normalizedModelKey).forShare().executeTakeFirstOrThrow();
          pendingModelValueId = pending.pending_model_value_id;
          canonicalModelId = pending.canonical_model_id;
          if (canonicalModelId && canonicalBrandId) {
            const resolvedModel = await executor.selectFrom('repair_models').select('canonical_brand_id').where('model_id', '=', canonicalModelId).executeTakeFirst();
            if (!resolvedModel || resolvedModel.canonical_brand_id !== canonicalBrandId) return Object.freeze({ error: new RepairCreateModelUnavailableError() });
          }
        }
      }
      const capturedProblems: Array<Readonly<{ problemCaptureId: string; rawLabel: string; normalizedKey: string; categoryId: string | null; pendingProblemValueId: string | null; categoryLabelSnapshot: string | null; selectionOrder: number }>> = [];
      for (const [index, problem] of repair.reportedProblems.entries()) {
        let categoryId: string | null = null;
        let pendingProblemValueId: string | null = null;
        let categoryLabelSnapshot: string | null = null;
        if (problem.canonicalCategoryId) {
          const selected = await executor.selectFrom('repair_problem_categories').select(['category_id', 'canonical_label'])
            .where('category_id', '=', problem.canonicalCategoryId).where('status', '=', 'active')
            .where((expression) => expression.or([expression('scope', '=', 'platform'), expression.and([expression('scope', '=', 'tenant'), expression('tenant_id', '=', validatedScope.tenantId)])])).forShare().executeTakeFirst();
          if (!selected) return Object.freeze({ error: new RepairCreateProblemCategoryUnavailableError() });
          categoryId = selected.category_id;
          categoryLabelSnapshot = selected.canonical_label;
        } else {
          const exactCategory = await executor.selectFrom('repair_problem_categories').select(['category_id', 'canonical_label'])
            .where('normalized_key', '=', problem.normalizedKey).where('status', '=', 'active')
            .where((expression) => expression.or([expression('scope', '=', 'platform'), expression.and([expression('scope', '=', 'tenant'), expression('tenant_id', '=', validatedScope.tenantId)])])).orderBy('scope', 'asc').forShare().executeTakeFirst();
          if (exactCategory) {
            categoryId = exactCategory.category_id;
            categoryLabelSnapshot = exactCategory.canonical_label;
          } else {
            await executor.insertInto('repair_problem_pending_values').values({ pending_problem_value_id: problem.pendingProblemValueId, tenant_id: validatedScope.tenantId, raw_label_example: problem.rawLabel, normalized_key: problem.normalizedKey, resolution_status: 'pending', canonical_category_id: null, version: 1, first_seen_at: repair.occurredAt, last_seen_at: repair.occurredAt, resolved_by_actor_id: null, resolved_at: null })
              .onConflict((conflict) => conflict.columns(['tenant_id', 'normalized_key']).doUpdateSet({ last_seen_at: repair.occurredAt })).execute();
            const pending = await executor.selectFrom('repair_problem_pending_values').leftJoin('repair_problem_categories', 'repair_problem_categories.category_id', 'repair_problem_pending_values.canonical_category_id')
              .select(['repair_problem_pending_values.pending_problem_value_id', 'repair_problem_pending_values.resolution_status', 'repair_problem_pending_values.canonical_category_id', 'repair_problem_categories.canonical_label', 'repair_problem_categories.status'])
              .where('repair_problem_pending_values.tenant_id', '=', validatedScope.tenantId).where('repair_problem_pending_values.normalized_key', '=', problem.normalizedKey).forShare('repair_problem_pending_values').executeTakeFirstOrThrow();
            pendingProblemValueId = pending.pending_problem_value_id;
            if (pending.resolution_status === 'resolved' && pending.canonical_category_id && pending.status === 'active') {
              categoryId = pending.canonical_category_id;
              categoryLabelSnapshot = pending.canonical_label;
            }
          }
        }
        capturedProblems.push(Object.freeze({ problemCaptureId: problem.problemCaptureId, rawLabel: problem.rawLabel, normalizedKey: problem.normalizedKey, categoryId, pendingProblemValueId, categoryLabelSnapshot, selectionOrder: index + 1 }));
      }
      const customer = await resolveCustomer(transactionContext);
      if (!customer || !branchUuid.test(customer.customerId) || customer.tenantId !== validatedScope.tenantId || customer.branchId !== validatedScope.branchId || customer.displayName.trim().length < 1) throw new Error('Customer intake runtime returned an invalid record.');
      await executor.insertInto('repair_folio_sequences').values({
        tenant_id: validatedScope.tenantId,
        branch_id: validatedScope.branchId,
        next_value: 1000,
        updated_at: repair.occurredAt,
      }).onConflict((conflict) => conflict.columns(['tenant_id', 'branch_id']).doNothing()).execute();
      const sequence = await executor.selectFrom('repair_folio_sequences')
        .select('next_value')
        .where('tenant_id', '=', validatedScope.tenantId)
        .where('branch_id', '=', validatedScope.branchId)
        .forUpdate()
        .executeTakeFirstOrThrow();
      const folio = `SR-${repair.folioYear}-${String(sequence.next_value).padStart(3, '0')}`;
      await executor.updateTable('repair_folio_sequences').set({ next_value: sequence.next_value + 1, updated_at: repair.occurredAt })
        .where('tenant_id', '=', validatedScope.tenantId).where('branch_id', '=', validatedScope.branchId).execute();
      if (!await scope.commitGuard.confirmTemporalCurrent(transactionContext)) throw new RepairCreateAuthorizationChangedError();
      await executor.insertInto('repairs').values({
        repair_id: repair.repairId, tenant_id: validatedScope.tenantId, branch_id: validatedScope.branchId, folio,
        received_at: repair.occurredAt, customer_id: customer.customerId, customer_name: customer.displayName, customer_phone: repair.customerPhone,
        device_brand: repair.deviceBrand, device_model: repair.deviceModel, reported_issue: repair.reportedIssueCompatibilitySummary,
        technician_id: null, technician_display_name: null, repair_status: 'pending', custody_status: 'active', created_at: repair.occurredAt,
      }).execute();
      await executor.insertInto('repair_intakes').values({
        repair_id: repair.repairId, tenant_id: validatedScope.tenantId, branch_id: validatedScope.branchId,
        device_color: repair.deviceColor, device_type: repair.deviceType, canonical_device_type_id: canonicalDeviceTypeId, pending_device_type_value_id: pendingDeviceTypeValueId, device_identifier: repair.deviceIdentifier,
        device_identifier_unavailable: repair.deviceIdentifierUnavailable, distinctive_signs: repair.distinctiveSigns,
        sim_included: repair.simIncluded, memory_card_included: repair.memoryCardIncluded, other_accessories: repair.otherAccessories,
        warranty_review_requested: repair.warrantyReviewRequested, previous_repair_id: repair.previousRepairId,
        delivered_by_name: repair.deliveredByName, estimated_delivery_at: repair.estimatedDeliveryAt,
        received_by_id: scope.actorUserId, received_by_display_name: scope.actorDisplayName,
        customer_narrative: repair.customerNarrative, physical_condition_summary: repair.physicalConditionSummary,
        documented_risk_summary: repair.documentedRiskSummary,
        received_power_state: repair.receivedPowerState, device_access_type: repair.deviceAccessType,
        initial_budget_amount_minor: repair.initialBudgetAmountMinor === null ? null : String(repair.initialBudgetAmountMinor), created_at: repair.occurredAt,
        new_repair_policy_version: repair.newRepairPolicyVersion,
        canonical_brand_id: canonicalBrandId,
        pending_brand_value_id: pendingBrandValueId,
        canonical_model_id: canonicalModelId,
        pending_model_value_id: pendingModelValueId,
      }).execute();
      if (selectedRisks.length > 0) {
        await executor.insertInto('repair_intervention_risks').values(selectedRisks.map((selectedRisk, index) => ({
          repair_id: repair.repairId,
          risk_id: selectedRisk!.risk_id,
          risk_label_snapshot: selectedRisk!.canonical_label,
          selection_order: index + 1,
          recorded_by_actor_id: scope.actorUserId,
          recorded_at: repair.occurredAt,
        }))).execute();
      }
      await executor.insertInto('repair_problem_classifications').values(capturedProblems.map((problem) => ({
        problem_capture_id: problem.problemCaptureId,
        tenant_id: validatedScope.tenantId,
        branch_id: validatedScope.branchId,
        repair_id: repair.repairId,
        category_id: problem.categoryId,
        pending_problem_value_id: problem.pendingProblemValueId,
        raw_problem_label_snapshot: problem.rawLabel,
        normalized_problem_key: problem.normalizedKey,
        category_label_snapshot: problem.categoryLabelSnapshot,
        selection_order: problem.selectionOrder,
        source: 'manual' as const,
        stage: 'intake' as const,
        assigned_by_actor_id: scope.actorUserId,
        assigned_at: repair.occurredAt,
      }))).execute();
      await executor.insertInto('repair_timeline_entries').values({
        entry_id: repair.timelineEntryId, tenant_id: validatedScope.tenantId, branch_id: validatedScope.branchId, repair_id: repair.repairId,
        entry_type: 'system_event', actor_id: scope.actorUserId, actor_display_name: scope.actorDisplayName,
        title: 'Reparación recibida', body: null, source: repairReceivedTimelineSource, client_request_id: repair.clientRequestId,
        occurred_at: repair.occurredAt, created_at: repair.occurredAt,
      }).execute();
      await executor.insertInto('repair_business_audit_events').values({
        audit_id: repair.auditEventId, tenant_id: validatedScope.tenantId, branch_id: validatedScope.branchId,
        station_id: scope.stationId, session_id: scope.sessionId, actor_user_id: scope.actorUserId, actor_display_name: scope.actorDisplayName,
        capability: scope.capability, action: repair.action, resource_type: 'repair', resource_id: repair.repairId, result: 'succeeded',
        correlation_id: repair.correlationId, client_request_id: repair.clientRequestId, occurred_at: repair.occurredAt, created_at: repair.occurredAt,
      }).execute();
      await executor.insertInto('repair_create_commands').values({
        tenant_id: validatedScope.tenantId, branch_id: validatedScope.branchId, client_request_id: repair.clientRequestId,
        request_fingerprint: fingerprint, repair_id: repair.repairId, customer_id: customer.customerId, folio, applied_at: repair.occurredAt,
      }).execute();
      return Object.freeze({ repairId: repair.repairId, folio, customerId: customer.customerId, customerName: customer.displayName, customerPhone: repair.customerPhone, occurredAt: repair.occurredAt.toISOString(), correlationId: repair.correlationId, newRepairPolicyVersion: repair.newRepairPolicyVersion });
    });
    if ('error' in outcome) throw outcome.error;
    return outcome;
  }

  async correctRepairEquipment(
    scope: RepairEquipmentCorrectionContext,
    correction: CorrectRepairEquipmentRecord,
  ): Promise<CorrectedRepairEquipmentRecord> {
    const validatedScope = validateScope(scope);
    const fingerprint = createHash('sha256').update(JSON.stringify({
      repairId: correction.repairId,
      expectedVersion: correction.expectedVersion,
      deviceBrand: correction.deviceBrand,
      canonicalBrandId: correction.canonicalBrandId,
      deviceModel: correction.deviceModel,
      canonicalModelId: correction.canonicalModelId,
      reason: correction.reason,
    })).digest();
    const outcome = await this.#runCreateTransaction<CorrectedRepairEquipmentRecord | Readonly<{ error: Error }>>(async (executor, transactionContext) => {
      const existing = await executor.selectFrom('repair_equipment_corrections')
        .innerJoin('repair_timeline_entries', 'repair_timeline_entries.entry_id', 'repair_equipment_corrections.timeline_entry_id')
        .select([
          'repair_equipment_corrections.request_fingerprint', 'repair_equipment_corrections.repair_id',
          'repair_equipment_corrections.equipment_version', 'repair_equipment_corrections.new_brand_label',
          'repair_equipment_corrections.new_canonical_brand_id', 'repair_equipment_corrections.new_model_label',
          'repair_equipment_corrections.new_canonical_model_id', 'repair_equipment_corrections.correlation_id',
          'repair_timeline_entries.entry_id', 'repair_timeline_entries.entry_type', 'repair_timeline_entries.actor_id',
          'repair_timeline_entries.actor_display_name', 'repair_timeline_entries.title', 'repair_timeline_entries.body',
          'repair_timeline_entries.source', 'repair_timeline_entries.client_request_id', 'repair_timeline_entries.occurred_at',
        ])
        .where('repair_equipment_corrections.tenant_id', '=', validatedScope.tenantId)
        .where('repair_equipment_corrections.branch_id', '=', validatedScope.branchId)
        .where('repair_equipment_corrections.repair_id', '=', correction.repairId)
        .where('repair_equipment_corrections.client_request_id', '=', correction.clientRequestId)
        .executeTakeFirst();
      if (existing) {
        if (!Buffer.from(existing.request_fingerprint).equals(fingerprint)) return { error: new RepairEquipmentCorrectionIdempotencyConflictError() };
        return Object.freeze({
          repairId: existing.repair_id,
          equipmentVersion: existing.equipment_version,
          deviceBrand: existing.new_brand_label ?? '',
          canonicalBrandId: existing.new_canonical_brand_id,
          deviceModel: existing.new_model_label ?? '',
          canonicalModelId: existing.new_canonical_model_id,
          timelineItem: mapTimelineEntry(existing),
          correlationId: existing.correlation_id,
        });
      }

      const current = await executor.selectFrom('repairs')
        .innerJoin('repair_intakes', (join) => join
          .onRef('repair_intakes.tenant_id', '=', 'repairs.tenant_id')
          .onRef('repair_intakes.branch_id', '=', 'repairs.branch_id')
          .onRef('repair_intakes.repair_id', '=', 'repairs.repair_id'))
        .select([
          'repairs.device_brand', 'repairs.device_model', 'repair_intakes.equipment_version',
          'repair_intakes.canonical_brand_id', 'repair_intakes.pending_brand_value_id',
          'repair_intakes.canonical_model_id', 'repair_intakes.pending_model_value_id',
        ])
        .where('repairs.tenant_id', '=', validatedScope.tenantId)
        .where('repairs.branch_id', '=', validatedScope.branchId)
        .where('repairs.repair_id', '=', correction.repairId)
        .forUpdate()
        .executeTakeFirst();
      if (!current) return { error: new RepairEquipmentCorrectionNotFoundError() };
      if (current.equipment_version !== correction.expectedVersion) return { error: new RepairEquipmentCorrectionConcurrencyConflictError() };

      const oldBrand = current.canonical_brand_id
        ? await executor.selectFrom('repair_brands').select('canonical_label').where('brand_id', '=', current.canonical_brand_id).executeTakeFirst()
        : null;
      const oldModel = current.canonical_model_id
        ? await executor.selectFrom('repair_models').select('canonical_label').where('model_id', '=', current.canonical_model_id).executeTakeFirst()
        : null;

      let canonicalBrandId: string | null = correction.canonicalBrandId;
      let pendingBrandValueId: string | null = null;
      let effectiveBrandLabel = correction.deviceBrand;
      if (canonicalBrandId) {
        const brand = await executor.selectFrom('repair_brands').select(['brand_id', 'canonical_label'])
          .where('brand_id', '=', canonicalBrandId).where('status', '=', 'active')
          .where((expression) => expression.or([expression('scope', '=', 'platform'), expression.and([expression('scope', '=', 'tenant'), expression('tenant_id', '=', validatedScope.tenantId)])]))
          .forShare().executeTakeFirst();
        if (!brand) return { error: new RepairEquipmentCorrectionBrandUnavailableError() };
        effectiveBrandLabel = brand.canonical_label;
      } else {
        const normalizedBrandKey = normalizeRepairBrandKey(correction.deviceBrand);
        await executor.insertInto('repair_brand_pending_values').values({
          pending_brand_value_id: correction.pendingBrandValueId, tenant_id: validatedScope.tenantId,
          raw_label_example: correction.deviceBrand, normalized_key: normalizedBrandKey, resolution_status: 'pending',
          canonical_brand_id: null, version: 1, first_seen_at: correction.occurredAt, last_seen_at: correction.occurredAt,
          resolved_by_actor_id: null, resolved_at: null,
        }).onConflict((conflict) => conflict.columns(['tenant_id', 'normalized_key']).doUpdateSet({ last_seen_at: correction.occurredAt })).execute();
        const pending = await executor.selectFrom('repair_brand_pending_values').select(['pending_brand_value_id', 'resolution_status', 'canonical_brand_id'])
          .where('tenant_id', '=', validatedScope.tenantId).where('normalized_key', '=', normalizedBrandKey).forShare().executeTakeFirstOrThrow();
        if (pending.resolution_status === 'resolved' && pending.canonical_brand_id) {
          canonicalBrandId = pending.canonical_brand_id;
          const brand = await executor.selectFrom('repair_brands').select('canonical_label').where('brand_id', '=', canonicalBrandId).where('status', '=', 'active').executeTakeFirst();
          if (!brand) return { error: new RepairEquipmentCorrectionBrandUnavailableError() };
          effectiveBrandLabel = brand.canonical_label;
        } else {
          pendingBrandValueId = pending.pending_brand_value_id;
        }
      }

      let canonicalModelId: string | null = correction.canonicalModelId;
      let pendingModelValueId: string | null = null;
      let effectiveModelLabel = correction.deviceModel;
      if (canonicalModelId) {
        if (!canonicalBrandId) return { error: new RepairEquipmentCorrectionModelUnavailableError() };
        const model = await executor.selectFrom('repair_models').select(['model_id', 'canonical_brand_id', 'canonical_label'])
          .where('model_id', '=', canonicalModelId).where('status', '=', 'active')
          .where((expression) => expression.or([expression('scope', '=', 'platform'), expression.and([expression('scope', '=', 'tenant'), expression('tenant_id', '=', validatedScope.tenantId)])]))
          .forShare().executeTakeFirst();
        if (!model || model.canonical_brand_id !== canonicalBrandId) return { error: new RepairEquipmentCorrectionModelUnavailableError() };
        effectiveModelLabel = model.canonical_label;
      } else {
        const normalizedModelKey = normalizeRepairModelKey(correction.deviceModel);
        const brandContextKey = canonicalBrandId
          ? `canonical:${canonicalBrandId}`
          : pendingBrandValueId
            ? `pending:${pendingBrandValueId}`
            : `raw:${normalizeRepairBrandKey(correction.deviceBrand)}`;
        await executor.insertInto('repair_model_pending_values').values({
          pending_model_value_id: correction.pendingModelValueId, tenant_id: validatedScope.tenantId,
          brand_context_key: brandContextKey, canonical_brand_id: canonicalBrandId,
          pending_brand_value_id: canonicalBrandId ? null : pendingBrandValueId,
          raw_brand_label_example: canonicalBrandId || pendingBrandValueId ? null : correction.deviceBrand,
          raw_model_label_example: correction.deviceModel, normalized_model_key: normalizedModelKey,
          resolution_status: 'pending', canonical_model_id: null, version: 1,
          first_seen_at: correction.occurredAt, last_seen_at: correction.occurredAt,
          resolved_by_actor_id: null, resolved_at: null,
        }).onConflict((conflict) => conflict.columns(['tenant_id', 'brand_context_key', 'normalized_model_key']).doUpdateSet({ last_seen_at: correction.occurredAt })).execute();
        const pending = await executor.selectFrom('repair_model_pending_values').select(['pending_model_value_id', 'resolution_status', 'canonical_model_id'])
          .where('tenant_id', '=', validatedScope.tenantId).where('brand_context_key', '=', brandContextKey).where('normalized_model_key', '=', normalizedModelKey).forShare().executeTakeFirstOrThrow();
        if (pending.resolution_status === 'resolved' && pending.canonical_model_id) {
          const model = await executor.selectFrom('repair_models').select(['model_id', 'canonical_brand_id', 'canonical_label']).where('model_id', '=', pending.canonical_model_id).where('status', '=', 'active').executeTakeFirst();
          if (!model || !canonicalBrandId || model.canonical_brand_id !== canonicalBrandId) return { error: new RepairEquipmentCorrectionModelUnavailableError() };
          canonicalModelId = model.model_id;
          effectiveModelLabel = model.canonical_label;
        } else {
          pendingModelValueId = pending.pending_model_value_id;
        }
      }

      if (!await scope.commitGuard.confirmCurrent(transactionContext) || !await scope.commitGuard.confirmTemporalCurrent(transactionContext)) return { error: new RepairEquipmentCorrectionAuthorizationChangedError() };
      const equipmentVersion = current.equipment_version + 1;
      await executor.updateTable('repairs').set({ device_brand: correction.deviceBrand, device_model: correction.deviceModel })
        .where('tenant_id', '=', validatedScope.tenantId).where('branch_id', '=', validatedScope.branchId).where('repair_id', '=', correction.repairId).execute();
      await executor.updateTable('repair_intakes').set({
        canonical_brand_id: canonicalBrandId, pending_brand_value_id: pendingBrandValueId,
        canonical_model_id: canonicalModelId, pending_model_value_id: pendingModelValueId,
        equipment_version: equipmentVersion,
      }).where('tenant_id', '=', validatedScope.tenantId).where('branch_id', '=', validatedScope.branchId).where('repair_id', '=', correction.repairId).execute();

      const oldLabel = [oldBrand?.canonical_label ?? current.device_brand, oldModel?.canonical_label ?? current.device_model].filter(Boolean).join(' · ') || 'Equipo sin identificar';
      const newLabel = [effectiveBrandLabel, effectiveModelLabel].filter(Boolean).join(' · ');
      const body = `${oldLabel} → ${newLabel}. Motivo: ${correction.reason}`;
      await executor.insertInto('repair_timeline_entries').values({
        entry_id: correction.timelineEntryId, tenant_id: validatedScope.tenantId, branch_id: validatedScope.branchId, repair_id: correction.repairId,
        entry_type: 'system_event', actor_id: scope.actorUserId, actor_display_name: scope.actorDisplayName,
        title: 'Equipo corregido', body, source: repairEquipmentCorrectionTimelineSource, client_request_id: correction.clientRequestId,
        occurred_at: correction.occurredAt, created_at: correction.occurredAt,
      }).execute();
      await executor.insertInto('repair_business_audit_events').values({
        audit_id: correction.auditEventId, tenant_id: validatedScope.tenantId, branch_id: validatedScope.branchId,
        station_id: scope.stationId, session_id: scope.sessionId, actor_user_id: scope.actorUserId, actor_display_name: scope.actorDisplayName,
        capability: scope.capability, action: correction.action, resource_type: 'repair', resource_id: correction.repairId, result: 'succeeded',
        correlation_id: correction.correlationId, client_request_id: correction.clientRequestId, occurred_at: correction.occurredAt, created_at: correction.occurredAt,
      }).execute();
      await executor.insertInto('repair_equipment_corrections').values({
        correction_id: correction.correctionId, tenant_id: validatedScope.tenantId, branch_id: validatedScope.branchId, repair_id: correction.repairId,
        timeline_entry_id: correction.timelineEntryId, audit_id: correction.auditEventId, client_request_id: correction.clientRequestId,
        request_fingerprint: fingerprint, expected_version: correction.expectedVersion, equipment_version: equipmentVersion,
        old_brand_label: current.device_brand, new_brand_label: correction.deviceBrand,
        old_canonical_brand_id: current.canonical_brand_id, new_canonical_brand_id: canonicalBrandId,
        old_pending_brand_value_id: current.pending_brand_value_id, new_pending_brand_value_id: pendingBrandValueId,
        old_model_label: current.device_model, new_model_label: correction.deviceModel,
        old_canonical_model_id: current.canonical_model_id, new_canonical_model_id: canonicalModelId,
        old_pending_model_value_id: current.pending_model_value_id, new_pending_model_value_id: pendingModelValueId,
        reason: correction.reason, station_id: scope.stationId, session_id: scope.sessionId,
        actor_user_id: scope.actorUserId, actor_display_name: scope.actorDisplayName, capability: scope.capability,
        correlation_id: correction.correlationId, occurred_at: correction.occurredAt,
      }).execute();
      const timelineItem = Object.freeze({
        id: correction.timelineEntryId, occurredAt: correction.occurredAt.toISOString(), type: 'system_event' as const,
        actorId: scope.actorUserId, actorDisplayName: scope.actorDisplayName, title: 'Equipo corregido', body,
        source: repairEquipmentCorrectionTimelineSource, attribution: null,
      });
      return Object.freeze({ repairId: correction.repairId, equipmentVersion, deviceBrand: correction.deviceBrand, canonicalBrandId, deviceModel: correction.deviceModel, canonicalModelId, timelineItem, correlationId: correction.correlationId });
    });
    if ('error' in outcome) throw outcome.error;
    return outcome;
  }

  async addOperationalNote(
    scope: RepairOperationalNoteContext,
    note: AddRepairOperationalNoteRecord,
  ): Promise<RepairTimelineItemRecord | null> {
    const validatedScope = validateScope(scope);
    const outcome = await this.#runOperationalNoteTransaction<
      OperationalNoteCommandOutcome<RepairTimelineItemRecord | null>
    >(async (executor: RepairExecutor, transactionContext: object) => {
      await executor
        .insertInto('repair_operational_note_request_guards')
        .values({
          tenant_id: validatedScope.tenantId,
          branch_id: validatedScope.branchId,
          action: note.action,
          client_request_id: note.clientRequestId,
          created_at: note.occurredAt,
        })
        .onConflict((conflict) => conflict.doNothing())
        .execute();
      await executor
        .selectFrom('repair_operational_note_request_guards')
        .select('client_request_id')
        .where('tenant_id', '=', validatedScope.tenantId)
        .where('branch_id', '=', validatedScope.branchId)
        .where('action', '=', note.action)
        .where('client_request_id', '=', note.clientRequestId)
        .forUpdate()
        .executeTakeFirstOrThrow();
      const existing = await executor
        .selectFrom('repair_timeline_entries')
        .select([
          'entry_id', 'entry_type', 'actor_id', 'actor_display_name',
          'title', 'body', 'source', 'client_request_id', 'occurred_at',
        ])
        .where('tenant_id', '=', validatedScope.tenantId)
        .where('branch_id', '=', validatedScope.branchId)
        .where('repair_id', '=', note.repairId)
        .where('client_request_id', '=', note.clientRequestId)
        .executeTakeFirst();
      const existingAudit = await executor
        .selectFrom('repair_business_audit_events')
        .select([
          'tenant_id', 'branch_id', 'station_id', 'session_id',
          'actor_user_id', 'actor_display_name', 'capability', 'action',
          'resource_type', 'resource_id', 'result', 'correlation_id',
          'client_request_id', 'occurred_at',
        ])
        .where('tenant_id', '=', validatedScope.tenantId)
        .where('branch_id', '=', validatedScope.branchId)
        .where('action', '=', note.action)
        .where('client_request_id', '=', note.clientRequestId)
        .executeTakeFirst();
      if (existing || existingAudit) {
        if (!existing) {
          return operationalNoteCommandError(
            existingAudit?.resource_id === note.repairId
              ? new RepairOperationalNoteAuditIntegrityError()
              : new RepairOperationalNoteIdempotencyConflictError(),
          );
        }
        if (
          existing.entry_type !== 'note' ||
          existing.body !== note.body ||
          existing.actor_id !== scope.actorUserId ||
          existing.actor_display_name !== scope.actorDisplayName ||
          existing.source !== operationalNoteTimelineSource
        ) {
          return operationalNoteCommandError(
            new RepairOperationalNoteIdempotencyConflictError(),
          );
        }
        if (!existingAudit) {
          return operationalNoteCommandError(
            new RepairOperationalNoteAuditIntegrityError(),
          );
        }
        if (
          existingAudit.station_id !== scope.stationId ||
          existingAudit.session_id !== scope.sessionId ||
          existingAudit.actor_user_id !== scope.actorUserId ||
          existingAudit.actor_display_name !== scope.actorDisplayName ||
          existingAudit.capability !== scope.capability ||
          existingAudit.action !== note.action ||
          existingAudit.resource_type !== note.resourceType ||
          existingAudit.resource_id !== note.repairId ||
          existingAudit.result !== note.result ||
          existingAudit.occurred_at.getTime() !== existing.occurred_at.getTime()
        ) {
          return operationalNoteCommandError(
            new RepairOperationalNoteIdempotencyConflictError(),
          );
        }
        return mapTimelineEntry(existing, existingAudit);
      }

      if (!await scope.commitGuard.confirmCurrent(transactionContext)) {
        return operationalNoteCommandError(
          new RepairOperationalNoteAuthorizationChangedError(),
        );
      }
      const repair = await executor
        .selectFrom('repairs')
        .select('repair_id')
        .where('tenant_id', '=', validatedScope.tenantId)
        .where('branch_id', '=', validatedScope.branchId)
        .where('repair_id', '=', note.repairId)
        .forUpdate()
        .executeTakeFirst();
      if (!repair) return null;

      // The Repair lock above can wait long enough for an otherwise valid
      // operational Session to cross an idle or absolute deadline. Re-read
      // the database clock after that final blocking lock and before either
      // half of the atomic note/audit pair is written.
      if (!await scope.commitGuard.confirmTemporalCurrent(transactionContext)) {
        return operationalNoteCommandError(
          new RepairOperationalNoteAuthorizationChangedError(),
        );
      }

      const inserted = await executor
        .insertInto('repair_timeline_entries')
        .values({
          entry_id: note.entryId,
          tenant_id: validatedScope.tenantId,
          branch_id: validatedScope.branchId,
          repair_id: note.repairId,
          entry_type: 'note',
          actor_id: scope.actorUserId,
          actor_display_name: scope.actorDisplayName,
          title: 'Nota',
          body: note.body,
          source: operationalNoteTimelineSource,
          client_request_id: note.clientRequestId,
          occurred_at: note.occurredAt,
          created_at: note.occurredAt,
        })
        .returning([
          'entry_id', 'entry_type', 'actor_id', 'actor_display_name',
          'title', 'body', 'source', 'client_request_id', 'occurred_at',
        ])
        .executeTakeFirstOrThrow();
      const audit = await executor
        .insertInto('repair_business_audit_events')
        .values({
          audit_id: note.auditEventId,
          tenant_id: validatedScope.tenantId,
          branch_id: validatedScope.branchId,
          station_id: scope.stationId,
          session_id: scope.sessionId,
          actor_user_id: scope.actorUserId,
          actor_display_name: scope.actorDisplayName,
          capability: scope.capability,
          action: note.action,
          resource_type: note.resourceType,
          resource_id: note.repairId,
          result: note.result,
          correlation_id: note.correlationId,
          client_request_id: note.clientRequestId,
          occurred_at: note.occurredAt,
          created_at: note.occurredAt,
        })
        .returning([
          'tenant_id', 'branch_id', 'station_id', 'session_id',
          'actor_user_id', 'actor_display_name', 'capability', 'action',
          'resource_type', 'resource_id', 'result', 'correlation_id',
          'client_request_id', 'occurred_at',
        ])
        .executeTakeFirstOrThrow();
      return mapTimelineEntry(inserted, audit);
    });
    if (outcome && 'error' in outcome) throw outcome.error;
    return outcome;
  }

  async listEligibleTechnicians(
    scope: RepairPersistenceScope,
  ): Promise<readonly RepairTechnicianRecord[]> {
    const validatedScope = validateScope(scope);
    return this.execute(async (executor) => {
      const rows = await executor
        .selectFrom('repair_technician_branches')
        .innerJoin('repair_technicians', 'repair_technicians.technician_id', 'repair_technician_branches.technician_id')
        .select(['repair_technicians.technician_id as id', 'repair_technicians.display_name as displayName'])
        .where('repair_technician_branches.tenant_id', '=', validatedScope.tenantId)
        .where('repair_technician_branches.branch_id', '=', validatedScope.branchId)
        .whereRef('repair_technicians.tenant_id', '=', 'repair_technician_branches.tenant_id')
        .where('repair_technicians.active', '=', true)
        .orderBy('repair_technicians.display_name', 'asc')
        .execute();
      return Object.freeze(rows.map((row) => Object.freeze({ id: row.id, displayName: row.displayName })));
    });
  }

  async #technicianForScope(executor: RepairExecutor, scope: RepairPersistenceScope, technicianId: string): Promise<RepairTechnicianRecord | null> {
    const row = await executor
      .selectFrom('repair_technician_branches')
      .innerJoin('repair_technicians', 'repair_technicians.technician_id', 'repair_technician_branches.technician_id')
      .select(['repair_technicians.technician_id as id', 'repair_technicians.display_name as displayName'])
      .where('repair_technician_branches.tenant_id', '=', scope.tenantId)
      .where('repair_technician_branches.branch_id', '=', scope.branchId)
      .where('repair_technician_branches.technician_id', '=', technicianId)
      .whereRef('repair_technicians.tenant_id', '=', 'repair_technician_branches.tenant_id')
      .where('repair_technicians.active', '=', true)
      .executeTakeFirst();
    return row ? Object.freeze({ id: row.id, displayName: row.displayName }) : null;
  }

  async #assignmentByRequest(executor: RepairExecutor, scope: RepairPersistenceScope, repairId: string, clientRequestId: string): Promise<AssignmentProjection | null> {
    const row = await executor
      .selectFrom('repair_technician_assignments')
      .innerJoin('repair_technicians', 'repair_technicians.technician_id', 'repair_technician_assignments.technician_id')
      .select([
        'repair_technician_assignments.assignment_id', 'repair_technician_assignments.tenant_id', 'repair_technician_assignments.branch_id', 'repair_technician_assignments.repair_id', 'repair_technician_assignments.technician_id', 'repair_technician_assignments.assigned_by_actor_id', 'repair_technician_assignments.assigned_by_actor_display_name', 'repair_technician_assignments.assigned_at', 'repair_technician_assignments.ended_at', 'repair_technician_assignments.ended_by_actor_id', 'repair_technician_assignments.ended_by_actor_display_name', 'repair_technician_assignments.reason', 'repair_technician_assignments.client_request_id', 'repair_technician_assignments.ended_client_request_id', 'repair_technician_assignments.assignment_sequence', 'repair_technicians.display_name as technician_display_name',
      ])
      .where('repair_technician_assignments.tenant_id', '=', scope.tenantId)
      .where('repair_technician_assignments.branch_id', '=', scope.branchId)
      .where('repair_technician_assignments.repair_id', '=', repairId)
      .whereRef('repair_technicians.tenant_id', '=', 'repair_technician_assignments.tenant_id')
      .where((expressionBuilder) => expressionBuilder.or([
        expressionBuilder('repair_technician_assignments.client_request_id', '=', clientRequestId),
        expressionBuilder('repair_technician_assignments.ended_client_request_id', '=', clientRequestId),
      ]))
      .executeTakeFirst();
    return (row as AssignmentProjection | undefined) ?? null;
  }

  async #activeAssignment(executor: RepairExecutor, scope: RepairPersistenceScope, repairId: string): Promise<AssignmentProjection | null> {
    const row = await executor
      .selectFrom('repair_technician_assignments')
      .innerJoin('repair_technicians', 'repair_technicians.technician_id', 'repair_technician_assignments.technician_id')
      .select([
        'repair_technician_assignments.assignment_id', 'repair_technician_assignments.tenant_id', 'repair_technician_assignments.branch_id', 'repair_technician_assignments.repair_id', 'repair_technician_assignments.technician_id', 'repair_technician_assignments.assigned_by_actor_id', 'repair_technician_assignments.assigned_by_actor_display_name', 'repair_technician_assignments.assigned_at', 'repair_technician_assignments.ended_at', 'repair_technician_assignments.ended_by_actor_id', 'repair_technician_assignments.ended_by_actor_display_name', 'repair_technician_assignments.reason', 'repair_technician_assignments.client_request_id', 'repair_technician_assignments.ended_client_request_id', 'repair_technician_assignments.assignment_sequence', 'repair_technicians.display_name as technician_display_name',
      ])
      .where('repair_technician_assignments.tenant_id', '=', scope.tenantId)
      .where('repair_technician_assignments.branch_id', '=', scope.branchId)
      .where('repair_technician_assignments.repair_id', '=', repairId)
      .whereRef('repair_technicians.tenant_id', '=', 'repair_technician_assignments.tenant_id')
      .where('repair_technician_assignments.ended_at', 'is', null)
      .executeTakeFirst();
    return (row as AssignmentProjection | undefined) ?? null;
  }

  async #assignmentVersion(executor: RepairExecutor, scope: RepairPersistenceScope, repairId: string): Promise<number> {
    const result = await executor
      .selectFrom('repair_technician_assignments')
      .select(({ fn }) => fn.countAll<number>().as('count'))
      .where('tenant_id', '=', scope.tenantId)
      .where('branch_id', '=', scope.branchId)
      .where('repair_id', '=', repairId)
      .executeTakeFirstOrThrow();
    const unassignments = await executor
        .selectFrom('repair_timeline_entries')
        .select(({ fn }) => fn.countAll<number>().as('count'))
        .where('tenant_id', '=', scope.tenantId)
        .where('branch_id', '=', scope.branchId)
        .where('repair_id', '=', repairId)
        .where('source', '=', 'local.technician_assignment')
        .where('title', '=', 'Asignación retirada')
        .executeTakeFirstOrThrow();
    return Number(result.count) + Number(unassignments.count);
  }

  async #timelineEvent(executor: RepairExecutor, scope: RepairPersistenceScope, repairId: string, entryId: string, clientRequestId: string, actorId: string, actorDisplayName: string, title: string, body: string, occurredAt: Date): Promise<void> {
    await executor.insertInto('repair_timeline_entries').values({
      entry_id: entryId, tenant_id: scope.tenantId, branch_id: scope.branchId, repair_id: repairId,
      entry_type: 'system_event', actor_id: actorId, actor_display_name: actorDisplayName, title, body,
      source: 'local.technician_assignment', client_request_id: clientRequestId, occurred_at: occurredAt, created_at: occurredAt,
    }).execute();
  }

  async assignRepairTechnician(scope: RepairPersistenceScope, input: AssignRepairTechnicianRecord): Promise<AssignRepairTechnicianRecord | null> {
    const validatedScope = validateScope(scope);
    const outcome = await this.#runAssignmentTransaction<AssignmentCommandOutcome<AssignRepairTechnicianRecord | null>>(async (executor) => {
      const repair = await executor.selectFrom('repairs').select('repair_id').where('tenant_id', '=', validatedScope.tenantId).where('branch_id', '=', validatedScope.branchId).where('repair_id', '=', input.repairId).forUpdate().executeTakeFirst();
      if (!repair) return null;
      const existing = await this.#assignmentByRequest(executor, validatedScope, input.repairId, input.clientRequestId);
      if (existing) {
        if (existing.technician_id !== input.technicianId || existing.ended_at !== null) return assignmentCommandError<AssignRepairTechnicianRecord | null>(new RepairTechnicianIdempotencyConflictError());
        return Object.freeze({ ...input, assignmentId: existing.assignment_id, technicianDisplayName: existing.technician_display_name, occurredAt: existing.assigned_at, version: existing.assignment_sequence });
      }
      const active = await this.#activeAssignment(executor, validatedScope, input.repairId);
      const version = await this.#assignmentVersion(executor, validatedScope, input.repairId);
      if (version !== input.version) return assignmentCommandError<AssignRepairTechnicianRecord | null>(new RepairTechnicianConcurrencyConflictError());
      if (active) return assignmentCommandError<AssignRepairTechnicianRecord | null>(new RepairTechnicianStateConflictError());
      const technician = await this.#technicianForScope(executor, validatedScope, input.technicianId);
      if (!technician) return assignmentCommandError<AssignRepairTechnicianRecord | null>(new RepairTechnicianEligibilityError());
      await executor.insertInto('repair_technician_assignments').values({
        assignment_id: input.assignmentId, tenant_id: validatedScope.tenantId, branch_id: validatedScope.branchId, repair_id: input.repairId,
        technician_id: technician.id, assigned_by_actor_id: input.actorId, assigned_by_actor_display_name: input.actorDisplayName, assigned_at: input.occurredAt,
        ended_at: null, ended_by_actor_id: null, ended_by_actor_display_name: null, reason: null, client_request_id: input.clientRequestId, assignment_sequence: version + 1,
      }).execute();
      await this.#timelineEvent(executor, validatedScope, input.repairId, randomUUID(), input.clientRequestId, input.actorId, input.actorDisplayName, 'Técnico asignado', `${input.actorDisplayName} asignó a ${technician.displayName}.`, input.occurredAt);
      return Object.freeze({ ...input, technicianDisplayName: technician.displayName, version: version + 1 });
    });
    if (outcome && 'error' in outcome) throw outcome.error;
    return outcome;
  }

  async reassignRepairTechnician(scope: RepairPersistenceScope, input: ReassignRepairTechnicianRecord): Promise<ReassignRepairTechnicianRecord | null> {
    const validatedScope = validateScope(scope);
    const outcome = await this.#runAssignmentTransaction<AssignmentCommandOutcome<ReassignRepairTechnicianRecord | null>>(async (executor) => {
      const repair = await executor.selectFrom('repairs').select('repair_id').where('tenant_id', '=', validatedScope.tenantId).where('branch_id', '=', validatedScope.branchId).where('repair_id', '=', input.repairId).forUpdate().executeTakeFirst();
      if (!repair) return null;
      const existing = await this.#assignmentByRequest(executor, validatedScope, input.repairId, input.clientRequestId);
      if (existing) {
        if (existing.technician_id !== input.technicianId || existing.reason !== input.reason) return assignmentCommandError<ReassignRepairTechnicianRecord | null>(new RepairTechnicianIdempotencyConflictError());
        return Object.freeze({ ...input, assignmentId: existing.assignment_id, technicianDisplayName: existing.technician_display_name, previousTechnicianId: input.previousTechnicianId || existing.technician_id, previousTechnicianDisplayName: input.previousTechnicianDisplayName || existing.technician_display_name, occurredAt: existing.assigned_at, version: existing.assignment_sequence });
      }
      const active = await this.#activeAssignment(executor, validatedScope, input.repairId);
      const version = await this.#assignmentVersion(executor, validatedScope, input.repairId);
      if (version !== input.version) return assignmentCommandError<ReassignRepairTechnicianRecord | null>(new RepairTechnicianConcurrencyConflictError());
      if (!active) return assignmentCommandError<ReassignRepairTechnicianRecord | null>(new RepairTechnicianStateConflictError());
      const technician = await this.#technicianForScope(executor, validatedScope, input.technicianId);
      if (!technician) return assignmentCommandError<ReassignRepairTechnicianRecord | null>(new RepairTechnicianEligibilityError());
      if (technician.id === active.technician_id) return assignmentCommandError<ReassignRepairTechnicianRecord | null>(new RepairTechnicianStateConflictError());
      await executor.updateTable('repair_technician_assignments').set({ ended_at: input.occurredAt, ended_by_actor_id: input.actorId, ended_by_actor_display_name: input.actorDisplayName }).where('assignment_id', '=', active.assignment_id).execute();
      await executor.insertInto('repair_technician_assignments').values({ assignment_id: input.assignmentId, tenant_id: validatedScope.tenantId, branch_id: validatedScope.branchId, repair_id: input.repairId, technician_id: technician.id, assigned_by_actor_id: input.actorId, assigned_by_actor_display_name: input.actorDisplayName, assigned_at: input.occurredAt, ended_at: null, ended_by_actor_id: null, ended_by_actor_display_name: null, reason: input.reason, client_request_id: input.clientRequestId, assignment_sequence: version + 1 }).execute();
      await this.#timelineEvent(executor, validatedScope, input.repairId, randomUUID(), input.clientRequestId, input.actorId, input.actorDisplayName, 'Técnico reasignado', `${active.technician_display_name} → ${technician.displayName}${input.reason ? ` · ${input.reason}` : ''}`, input.occurredAt);
      return Object.freeze({ ...input, technicianDisplayName: technician.displayName, previousTechnicianId: active.technician_id, previousTechnicianDisplayName: active.technician_display_name, version: version + 1 });
    });
    if (outcome && 'error' in outcome) throw outcome.error;
    return outcome;
  }

  async unassignRepairTechnician(scope: RepairPersistenceScope, input: UnassignRepairTechnicianRecord): Promise<UnassignRepairTechnicianRecord | null> {
    const validatedScope = validateScope(scope);
    const outcome = await this.#runAssignmentTransaction<AssignmentCommandOutcome<UnassignRepairTechnicianRecord | null>>(async (executor) => {
      const repair = await executor.selectFrom('repairs').select('repair_id').where('tenant_id', '=', validatedScope.tenantId).where('branch_id', '=', validatedScope.branchId).where('repair_id', '=', input.repairId).forUpdate().executeTakeFirst();
      if (!repair) return null;
      const existing = await this.#assignmentByRequest(executor, validatedScope, input.repairId, input.clientRequestId);
      if (existing) {
        if (existing.ended_client_request_id !== input.clientRequestId || existing.ended_at === null || existing.reason !== input.reason) return assignmentCommandError<UnassignRepairTechnicianRecord | null>(new RepairTechnicianIdempotencyConflictError());
        return Object.freeze({ ...input, assignmentId: existing.assignment_id, previousTechnicianId: existing.technician_id, previousTechnicianDisplayName: existing.technician_display_name, version: existing.assignment_sequence + 1 });
      }
      const active = await this.#activeAssignment(executor, validatedScope, input.repairId);
      const version = await this.#assignmentVersion(executor, validatedScope, input.repairId);
      if (version !== input.version) return assignmentCommandError<UnassignRepairTechnicianRecord | null>(new RepairTechnicianConcurrencyConflictError());
      if (!active) return assignmentCommandError<UnassignRepairTechnicianRecord | null>(new RepairTechnicianStateConflictError());
      await executor.updateTable('repair_technician_assignments').set({ ended_at: input.occurredAt, ended_by_actor_id: input.actorId, ended_by_actor_display_name: input.actorDisplayName, reason: input.reason, ended_client_request_id: input.clientRequestId }).where('assignment_id', '=', active.assignment_id).execute();
      await this.#timelineEvent(executor, validatedScope, input.repairId, randomUUID(), input.clientRequestId, input.actorId, input.actorDisplayName, 'Asignación retirada', `${active.technician_display_name} quedó sin asignación activa${input.reason ? ` · ${input.reason}` : ''}`, input.occurredAt);
      return Object.freeze({ ...input, assignmentId: active.assignment_id, previousTechnicianId: active.technician_id, previousTechnicianDisplayName: active.technician_display_name, version: version + 1 });
    });
    if (outcome && 'error' in outcome) throw outcome.error;
    return outcome;
  }

  async startRepairDiagnosis(scope: RepairPersistenceScope, input: StartRepairDiagnosisRecord): Promise<StartRepairDiagnosisRecord | null> {
    const validatedScope = validateScope(scope);
    type WorkflowOutcome = StartRepairDiagnosisRecord | null | Readonly<{ error: Error }>;
    const outcome = await this.#runWorkflowTransaction<WorkflowOutcome>(async (executor) => {
      const repair = await executor
        .selectFrom('repairs')
        .select(['repair_id', 'repair_status', 'custody_status'])
        .where('tenant_id', '=', validatedScope.tenantId)
        .where('branch_id', '=', validatedScope.branchId)
        .where('repair_id', '=', input.repairId)
        .forUpdate()
        .executeTakeFirst();
      if (!repair) return null;

      const existing = await executor
        .selectFrom('repair_workflow_transitions')
        .selectAll()
        .where('tenant_id', '=', validatedScope.tenantId)
        .where('branch_id', '=', validatedScope.branchId)
        .where('repair_id', '=', input.repairId)
        .where('client_request_id', '=', input.clientRequestId)
        .executeTakeFirst();
      if (existing) {
        if (existing.command !== 'start_diagnosis' || existing.expected_workflow_version !== input.expectedVersion) {
          return Object.freeze({ error: new RepairWorkflowIdempotencyConflictError() });
        }
        const timeline = await executor
          .selectFrom('repair_timeline_entries')
          .select('entry_id')
          .where('tenant_id', '=', validatedScope.tenantId)
          .where('branch_id', '=', validatedScope.branchId)
          .where('repair_id', '=', input.repairId)
          .where('client_request_id', '=', input.clientRequestId)
          .where('source', '=', 'local.workflow')
          .executeTakeFirstOrThrow();
        return Object.freeze({
          repairId: existing.repair_id,
          transitionId: existing.transition_id,
          timelineEntryId: timeline.entry_id,
          clientRequestId: existing.client_request_id,
          actorId: existing.actor_id,
          actorDisplayName: existing.actor_display_name,
          occurredAt: existing.occurred_at,
          expectedVersion: existing.expected_workflow_version,
          workflowVersion: existing.workflow_version,
          fromState: 'pending' as const,
          toState: 'diagnosing' as const,
        });
      }

      const latest = await executor
        .selectFrom('repair_workflow_transitions')
        .selectAll()
        .where('tenant_id', '=', validatedScope.tenantId)
        .where('branch_id', '=', validatedScope.branchId)
        .where('repair_id', '=', input.repairId)
        .orderBy('workflow_version', 'desc')
        .limit(1)
        .executeTakeFirst();
      const currentVersion = latest?.workflow_version ?? 0;
      const currentState = latest?.to_state ?? repair.repair_status;
      if (currentVersion !== input.expectedVersion) return Object.freeze({ error: new RepairWorkflowConcurrencyConflictError() });
      if (currentState !== 'pending') return Object.freeze({ error: new RepairWorkflowStateConflictError() });
      if (repair.custody_status !== 'active') return Object.freeze({ error: new RepairWorkflowCustodyConflictError() });

      const workflowVersion = currentVersion + 1;
      await executor.insertInto('repair_workflow_transitions').values({
        transition_id: input.transitionId,
        tenant_id: validatedScope.tenantId,
        branch_id: validatedScope.branchId,
        repair_id: input.repairId,
        command: 'start_diagnosis',
        from_state: 'pending',
        to_state: 'diagnosing',
        actor_id: input.actorId,
        actor_display_name: input.actorDisplayName,
        occurred_at: input.occurredAt,
        reason: null,
        client_request_id: input.clientRequestId,
        expected_workflow_version: input.expectedVersion,
        workflow_version: workflowVersion,
      }).execute();
      await executor.insertInto('repair_timeline_entries').values({
        entry_id: input.timelineEntryId,
        tenant_id: validatedScope.tenantId,
        branch_id: validatedScope.branchId,
        repair_id: input.repairId,
        entry_type: 'system_event',
        actor_id: input.actorId,
        actor_display_name: input.actorDisplayName,
        title: 'Diagnóstico iniciado',
        body: `${input.actorDisplayName} inició el diagnóstico.`,
        source: 'local.workflow',
        client_request_id: input.clientRequestId,
        occurred_at: input.occurredAt,
        created_at: input.occurredAt,
      }).execute();
      await executor
        .updateTable('repairs')
        .set({ repair_status: 'diagnosing' })
        .where('tenant_id', '=', validatedScope.tenantId)
        .where('branch_id', '=', validatedScope.branchId)
        .where('repair_id', '=', input.repairId)
        .executeTakeFirstOrThrow();
      return Object.freeze({ ...input, workflowVersion });
    });
    if (outcome && 'error' in outcome) throw outcome.error;
    return outcome;
  }

  async moveRepairToWorkshop(scope: RepairPersistenceScope, input: MoveRepairToWorkshopRecord): Promise<MoveRepairToWorkshopRecord | null> {
    const validatedScope = validateScope(scope);
    type LocationOutcome = MoveRepairToWorkshopRecord | null | Readonly<{ error: Error }>;
    const outcome = await this.#runLocationTransaction<LocationOutcome>(async (executor) => {
      const repair = await executor
        .selectFrom('repairs')
        .select(['repair_id', 'custody_status'])
        .where('tenant_id', '=', validatedScope.tenantId)
        .where('branch_id', '=', validatedScope.branchId)
        .where('repair_id', '=', input.repairId)
        .forUpdate()
        .executeTakeFirst();
      if (!repair) return null;

      const existing = await executor
        .selectFrom('repair_location_movements')
        .selectAll()
        .where('tenant_id', '=', validatedScope.tenantId)
        .where('branch_id', '=', validatedScope.branchId)
        .where('repair_id', '=', input.repairId)
        .where('client_request_id', '=', input.clientRequestId)
        .executeTakeFirst();
      if (existing) {
        if (
          existing.command !== 'move_to_workshop' ||
          existing.expected_location_version !== input.expectedVersion ||
          existing.reason !== input.reason
        ) return Object.freeze({ error: new RepairLocationIdempotencyConflictError() });
        const timeline = await executor
          .selectFrom('repair_timeline_entries')
          .select('entry_id')
          .where('tenant_id', '=', validatedScope.tenantId)
          .where('branch_id', '=', validatedScope.branchId)
          .where('repair_id', '=', input.repairId)
          .where('client_request_id', '=', input.clientRequestId)
          .where('source', '=', 'local.location')
          .executeTakeFirstOrThrow();
        return Object.freeze({
          repairId: existing.repair_id,
          movementId: existing.movement_id,
          timelineEntryId: timeline.entry_id,
          clientRequestId: existing.client_request_id,
          actorId: existing.actor_id,
          actorDisplayName: existing.actor_display_name,
          occurredAt: existing.occurred_at,
          expectedVersion: existing.expected_location_version,
          locationVersion: existing.location_version,
          reason: existing.reason,
          fromLocation: Object.freeze({ id: existing.from_location_id!, code: 'pending_area' as const, label: existing.from_label! }),
          toLocation: Object.freeze({ id: existing.to_location_id, code: 'workshop' as const, label: existing.to_label }),
        });
      }

      const current = await executor
        .selectFrom('repair_location_movements')
        .selectAll()
        .where('tenant_id', '=', validatedScope.tenantId)
        .where('branch_id', '=', validatedScope.branchId)
        .where('repair_id', '=', input.repairId)
        .orderBy('location_version', 'desc')
        .limit(1)
        .executeTakeFirst();
      const currentVersion = current?.location_version ?? 0;
      if (currentVersion !== input.expectedVersion) return Object.freeze({ error: new RepairLocationConcurrencyConflictError() });
      if (repair.custody_status !== 'active') return Object.freeze({ error: new RepairLocationCustodyConflictError() });
      if (!current || current.to_code !== 'pending_area') return Object.freeze({ error: new RepairLocationStateConflictError() });

      const workshop = await executor
        .selectFrom('repair_locations')
        .select(['location_id', 'code', 'display_label'])
        .where('tenant_id', '=', validatedScope.tenantId)
        .where('branch_id', '=', validatedScope.branchId)
        .where('code', '=', 'workshop')
        .where('semantic_category', '=', 'workshop')
        .where('active', '=', true)
        .executeTakeFirst();
      if (!workshop) return Object.freeze({ error: new RepairLocationConfigurationError() });

      const locationVersion = currentVersion + 1;
      await executor.insertInto('repair_location_movements').values({
        movement_id: input.movementId,
        tenant_id: validatedScope.tenantId,
        branch_id: validatedScope.branchId,
        repair_id: input.repairId,
        command: 'move_to_workshop',
        from_location_id: current.to_location_id,
        to_location_id: workshop.location_id,
        from_code: current.to_code,
        from_label: current.to_label,
        to_code: workshop.code,
        to_label: workshop.display_label,
        actor_id: input.actorId,
        actor_display_name: input.actorDisplayName,
        occurred_at: input.occurredAt,
        reason: input.reason,
        client_request_id: input.clientRequestId,
        expected_location_version: input.expectedVersion,
        location_version: locationVersion,
      }).execute();
      await executor.insertInto('repair_timeline_entries').values({
        entry_id: input.timelineEntryId,
        tenant_id: validatedScope.tenantId,
        branch_id: validatedScope.branchId,
        repair_id: input.repairId,
        entry_type: 'system_event',
        actor_id: input.actorId,
        actor_display_name: input.actorDisplayName,
        title: 'Equipo movido',
        body: `${current.to_label} → ${workshop.display_label}${input.reason ? ` · ${input.reason}` : ''}`,
        source: 'local.location',
        client_request_id: input.clientRequestId,
        occurred_at: input.occurredAt,
        created_at: input.occurredAt,
      }).execute();
      return Object.freeze({
        ...input,
        locationVersion,
        fromLocation: Object.freeze({ id: current.to_location_id, code: 'pending_area' as const, label: current.to_label }),
        toLocation: Object.freeze({ id: workshop.location_id, code: 'workshop' as const, label: workshop.display_label }),
      });
    });
    if (outcome && 'error' in outcome) throw outcome.error;
    return outcome;
  }

  async getRepairEvidenceById(
    scope: RepairPersistenceScope,
    repairId: string,
    evidenceId: string,
  ): Promise<RepairEvidenceContentRecord | null> {
    const validatedScope = validateScope(scope);
    return this.execute(async (executor: RepairExecutor) => {
      const row = await executor
        .selectFrom('repair_attachments')
        .select(['attachment_id', 'storage_key', 'mime_type', 'size_bytes'])
        .where('tenant_id', '=', validatedScope.tenantId)
        .where('branch_id', '=', validatedScope.branchId)
        .where('repair_id', '=', repairId)
        .where('attachment_id', '=', evidenceId)
        .executeTakeFirst();
      if (!row) return null;
      if (row.mime_type !== 'image/png') throw new Error('Database contains unsupported evidence content metadata.');
      return Object.freeze({
        id: row.attachment_id,
        storageKey: row.storage_key,
        mimeType: row.mime_type,
        sizeBytes: row.size_bytes,
      });
    });
  }
}

export function createKyselyRepairRepository(
  connection: DatabaseConnection,
  now: () => Date = () => new Date(),
): RepairRepositoryPort {
  return new KyselyRepairRepository(
    (operation) => useDatabasePersistenceExecutor(connection, 'repairs', operation),
    (operation) => runInTransaction(connection, { isolationLevel: 'serializable' }, async (context) =>
      useTransactionalDatabasePersistenceExecutor(
        context,
        'repairs',
        (executor) => operation(executor, context),
      )),
    now,
  );
}
