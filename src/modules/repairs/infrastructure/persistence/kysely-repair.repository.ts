import type { Kysely } from 'kysely';
import { randomUUID } from 'node:crypto';

import type { DatabaseConnection } from '../../../../infrastructure/database/database-connection.js';
import { useDatabasePersistenceExecutor, useTransactionalDatabasePersistenceExecutor } from '../../../../infrastructure/database/database-persistence-capability.js';
import { DatabaseTransactionError, runInTransaction } from '../../../../infrastructure/database/transaction-runner.js';
import type { InternalDatabasePersistenceOperation } from '../../../../infrastructure/database/database-persistence-capability.js';
import type { DatabaseSchema, RepairRow, RepairTechnicianAssignmentRow } from '../../../../infrastructure/database/database-types.js';
import { parseTenantId } from '../../../tenancy/index.js';
import type {
  AddRepairOperationalNoteRecord,
  AssignRepairTechnicianRecord,
  RepairPersistenceScope,
  RepairDetailRecord,
  RepairEvidenceContentRecord,
  RepairEvidenceItemRecord,
  RepairRepositoryPort,
  RepairTimelineItemRecord,
  RepairWorklistPage,
  RepairWorklistQuery,
  RepairWorklistRecord,
  RepairTechnicianRecord,
  TechnicianAssignmentHistoryRecord,
  ReassignRepairTechnicianRecord,
  UnassignRepairTechnicianRecord,
} from '../../application/ports/repair-repository.port.js';
import { RepairOperationalNoteIdempotencyConflictError, RepairTechnicianConcurrencyConflictError, RepairTechnicianEligibilityError, RepairTechnicianIdempotencyConflictError, RepairTechnicianStateConflictError } from '../../application/ports/repair-repository.port.js';
import {
  custodyStatusCodes,
  repairStatusCodes,
} from '../../domain/repair-status.js';

type RepairTables = 'repair_attachments' | 'repair_intakes' | 'repair_timeline_entries' | 'repairs' | 'repair_technicians' | 'repair_technician_branches' | 'repair_technician_assignments';
type RepairExecutor = Kysely<Pick<DatabaseSchema, RepairTables>>;
type ExecuteRepairOperation<Result> = InternalDatabasePersistenceOperation<'repairs', Result>;

const branchUuid =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/u;
const repairTimelineLimit = 20;
const repairEvidenceLimit = 20;

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
): Readonly<{ from?: Date | undefined; to?: Date | undefined }> {
  let from = query.from ? new Date(`${query.from}T00:00:00.000Z`) : undefined;
  let to = query.to ? new Date(`${query.to}T00:00:00.000Z`) : undefined;
  if (to) {
    to = new Date(to.getTime() + 86_400_000);
  }
  if (query.period && query.period !== 'all') {
    const year = referenceDate.getUTCFullYear();
    const month = referenceDate.getUTCMonth();
    const day = referenceDate.getUTCDate();
    if (query.period === 'today') {
      from = new Date(Date.UTC(year, month, day));
      to = new Date(Date.UTC(year, month, day + 1));
    } else if (query.period === 'month') {
      from = new Date(Date.UTC(year, month, 1));
      to = new Date(Date.UTC(year, month + 1, 1));
    } else {
      const weekday = referenceDate.getUTCDay();
      const mondayOffset = weekday === 0 ? -6 : 1 - weekday;
      from = new Date(Date.UTC(year, month, day + mondayOffset));
      to = new Date(from.getTime() + 7 * 86_400_000);
    }
  }
  return Object.freeze({ from, to });
}

function literalLikePattern(value: string): string {
  return `%${value.replace(/[\\%_]/gu, '\\$&')}%`;
}

function mapRepair(row: RepairRow): RepairWorklistRecord {
  if (!repairStatusCodes.includes(row.repair_status as (typeof repairStatusCodes)[number])) {
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
    deviceBrand: row.device_brand,
    deviceModel: row.device_model,
    reportedIssue: row.reported_issue,
    technicianId: row.technician_id,
    technicianDisplayName: row.technician_display_name,
    repairStatus: row.repair_status as RepairWorklistRecord['repairStatus'],
    custodyStatus: row.custody_status as RepairWorklistRecord['custodyStatus'],
  });
}

function technicianProjection(
  row: RepairRow,
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
  readonly customer_phone: string;
  readonly device_brand: string;
  readonly device_model: string;
  readonly device_color: string | null;
  readonly received_at: Date;
  readonly received_by_id: string | null;
  readonly received_by_display_name: string | null;
  readonly reported_issue: string;
  readonly customer_narrative: string | null;
  readonly physical_condition_summary: string | null;
  readonly documented_risk_summary: string | null;
  readonly technician_id: string | null;
  readonly technician_display_name: string | null;
  readonly repair_status: string;
  readonly custody_status: string;
}

interface AssignmentProjection extends RepairTechnicianAssignmentRow {
  readonly technician_display_name: string;
}

type AssignmentCommandOutcome<T> = T | Readonly<{ error: Error }>;

function assignmentCommandError<T>(error: Error): AssignmentCommandOutcome<T> {
  return Object.freeze({ error });
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

function mapTimelineEntry(row: RepairTimelineEntryProjection): RepairTimelineItemRecord {
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
    actorId: row.actor_id,
    actorDisplayName: row.actor_display_name,
    title: row.title,
    body: row.body,
    source: row.source,
  });
}

function mapRepairDetail(
  row: RepairDetailProjection,
  timelineItems: readonly RepairTimelineItemRecord[],
  timelineTotalCount: number,
  evidenceItems: readonly RepairEvidenceItemRecord[],
  evidenceTotalCount: number,
  assignmentHistory: readonly TechnicianAssignmentHistoryRecord[] = [],
  assignmentVersion = assignmentHistory.length,
): RepairDetailRecord {
  if (!repairStatusCodes.includes(row.repair_status as (typeof repairStatusCodes)[number])) {
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
    deviceBrand: row.device_brand,
    deviceModel: row.device_model,
    deviceColor: row.device_color,
    receivedAt: row.received_at.toISOString(),
    receivedById: row.received_by_id,
    receivedByDisplayName: row.received_by_display_name,
    reportedIssue: row.reported_issue,
    customerNarrative: row.customer_narrative,
    physicalConditionSummary: row.physical_condition_summary,
    documentedRiskSummary: row.documented_risk_summary,
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
    repairStatus: row.repair_status as RepairDetailRecord['repairStatus'],
    currentLocation: null,
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
    readonly executeTransaction: <Result>(operation: ExecuteRepairOperation<Result>) => Promise<Result>,
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

  async listWorklist(
    scope: RepairPersistenceScope,
    query: RepairWorklistQuery,
  ): Promise<RepairWorklistPage> {
    const validatedScope = validateScope(scope);
    const validatedQuery = query;
    const range = dateRange(validatedQuery, this.now());

    return this.execute(async (executor: RepairExecutor) => {
      let filtered = executor
        .selectFrom('repairs')
        .selectAll()
        .where('tenant_id', '=', validatedScope.tenantId)
        .where('branch_id', '=', validatedScope.branchId);
      const whereSearch = validatedQuery.q
        ? literalLikePattern(validatedQuery.q)
        : undefined;
      if (whereSearch) {
        filtered = filtered.where((expression) => expression.or([
          expression('folio', 'ilike', whereSearch),
          expression('customer_name', 'ilike', whereSearch),
          expression('customer_phone', 'ilike', whereSearch),
          expression('device_brand', 'ilike', whereSearch),
          expression('device_model', 'ilike', whereSearch),
          expression('reported_issue', 'ilike', whereSearch),
        ]));
      }
      if (range.from) filtered = filtered.where('received_at', '>=', range.from);
      if (range.to) filtered = filtered.where('received_at', '<', range.to);
      if (validatedQuery.status) filtered = filtered.where('repair_status', '=', validatedQuery.status);
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
      if (validatedQuery.custody) filtered = filtered.where('custody_status', '=', validatedQuery.custody);

      const [rows, total, unfiltered, technicians] = await Promise.all([
        filtered
          .orderBy('received_at', 'desc')
          .orderBy('repair_id', 'desc')
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
        .where('repair_technician_assignments.ended_at', 'is', null)
        .execute();
      const assignmentByRepair = new Map(activeAssignments.map((assignment) => [assignment.repair_id, assignment as AssignmentProjection]));
      const totalCount = Number(total.count);
      return Object.freeze({
        items: Object.freeze(rows.map((row) => technicianProjection(row, assignmentByRepair.get(row.repair_id)))),
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
        .select([
          'repairs.repair_id',
          'repairs.folio',
          'repairs.customer_name',
          'repairs.customer_phone',
          'repairs.device_brand',
          'repairs.device_model',
          'repair_intakes.device_color',
          'repairs.received_at',
          'repair_intakes.received_by_id',
          'repair_intakes.received_by_display_name',
          'repairs.reported_issue',
          'repair_intakes.customer_narrative',
          'repair_intakes.physical_condition_summary',
          'repair_intakes.documented_risk_summary',
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
      const [timelineRows, timelineCount, evidenceRows, evidenceCount, assignmentRows, unassignmentCount] = await Promise.all([
        timelineScope
          .select([
            'entry_id',
            'entry_type',
            'actor_id',
            'actor_display_name',
            'title',
            'body',
            'source',
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
          .orderBy('repair_technician_assignments.assignment_sequence', 'desc')
          .execute(),
        assignmentUnassignmentCount.executeTakeFirstOrThrow(),
      ]);
      const assignments = assignmentRows as readonly AssignmentProjection[];
      const activeAssignment = assignments.find((assignment) => assignment.ended_at === null);
      const projectedRow = {
        ...row,
        technician_id: activeAssignment?.technician_id ?? null,
        technician_display_name: activeAssignment?.technician_display_name ?? null,
      };
      return mapRepairDetail(
        projectedRow,
        timelineRows.map(mapTimelineEntry),
        Number(timelineCount.count),
        evidenceRows.map(mapEvidence),
        Number(evidenceCount.count),
        assignments.map(mapAssignmentHistory),
        assignments.length + Number(unassignmentCount.count),
      );
    });
  }

  async addOperationalNote(
    scope: RepairPersistenceScope,
    note: AddRepairOperationalNoteRecord,
  ): Promise<RepairTimelineItemRecord | null> {
    const validatedScope = validateScope(scope);
    return this.execute(async (executor: RepairExecutor) => {
      const repair = await executor
        .selectFrom('repairs')
        .select('repair_id')
        .where('tenant_id', '=', validatedScope.tenantId)
        .where('branch_id', '=', validatedScope.branchId)
        .where('repair_id', '=', note.repairId)
        .executeTakeFirst();
      if (!repair) return null;

      const inserted = await executor
        .insertInto('repair_timeline_entries')
        .values({
          entry_id: note.entryId,
          tenant_id: validatedScope.tenantId,
          branch_id: validatedScope.branchId,
          repair_id: note.repairId,
          entry_type: 'note',
          actor_id: note.actorId,
          actor_display_name: note.actorDisplayName,
          title: 'Nota',
          body: note.body,
          source: note.source,
          client_request_id: note.clientRequestId,
          occurred_at: note.occurredAt,
          created_at: note.occurredAt,
        })
        .onConflict((conflict) => conflict
          .columns(['tenant_id', 'branch_id', 'repair_id', 'client_request_id'])
          .doNothing())
        .returning([
          'entry_id', 'entry_type', 'actor_id', 'actor_display_name',
          'title', 'body', 'source', 'occurred_at',
        ])
        .executeTakeFirst();
      if (inserted) return mapTimelineEntry(inserted);

      const existing = await executor
        .selectFrom('repair_timeline_entries')
        .select([
          'entry_id', 'entry_type', 'actor_id', 'actor_display_name',
          'title', 'body', 'source', 'occurred_at',
        ])
        .where('tenant_id', '=', validatedScope.tenantId)
        .where('branch_id', '=', validatedScope.branchId)
        .where('repair_id', '=', note.repairId)
        .where('client_request_id', '=', note.clientRequestId)
        .executeTakeFirstOrThrow();
      if (
        existing.entry_type !== 'note' ||
        existing.body !== note.body ||
        existing.actor_id !== note.actorId ||
        existing.actor_display_name !== note.actorDisplayName ||
        existing.source !== note.source
      ) {
        throw new RepairOperationalNoteIdempotencyConflictError();
      }
      return mapTimelineEntry(existing);
    });
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
        if (existing.ended_client_request_id !== input.clientRequestId || existing.ended_at === null) return assignmentCommandError<UnassignRepairTechnicianRecord | null>(new RepairTechnicianIdempotencyConflictError());
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
      useTransactionalDatabasePersistenceExecutor(context, 'repairs', operation)),
    now,
  );
}
