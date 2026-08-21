import type { Kysely } from 'kysely';

import type { DatabaseConnection } from '../../../../infrastructure/database/database-connection.js';
import { useDatabasePersistenceExecutor } from '../../../../infrastructure/database/database-persistence-capability.js';
import type { InternalDatabasePersistenceOperation } from '../../../../infrastructure/database/database-persistence-capability.js';
import type { DatabaseSchema, RepairRow } from '../../../../infrastructure/database/database-types.js';
import { parseTenantId } from '../../../tenancy/index.js';
import type {
  AddRepairOperationalNoteRecord,
  RepairPersistenceScope,
  RepairDetailRecord,
  RepairEvidenceContentRecord,
  RepairEvidenceItemRecord,
  RepairRepositoryPort,
  RepairTimelineItemRecord,
  RepairWorklistPage,
  RepairWorklistQuery,
  RepairWorklistRecord,
} from '../../application/ports/repair-repository.port.js';
import {
  custodyStatusCodes,
  repairStatusCodes,
} from '../../domain/repair-status.js';

type RepairExecutor = Kysely<Pick<DatabaseSchema, 'repair_attachments' | 'repair_intakes' | 'repair_timeline_entries' | 'repairs'>>;
type ExecuteRepairOperation<Result> = InternalDatabasePersistenceOperation<'repairs', Result>;

const branchUuid =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/u;
const referenceDate = new Date('2026-08-19T12:00:00.000Z');
const repairTimelineLimit = 20;
const repairEvidenceLimit = 20;

function validateScope(scope: RepairPersistenceScope): RepairPersistenceScope {
  const tenantId = parseTenantId(scope?.tenantId);
  if (typeof scope?.branchId !== 'string' || !branchUuid.test(scope.branchId)) {
    throw new TypeError('Repair branch scope must be a canonical UUID.');
  }
  return Object.freeze({ tenantId, branchId: scope.branchId });
}

function dateRange(query: RepairWorklistQuery): Readonly<{ from?: Date | undefined; to?: Date | undefined }> {
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
  constructor(readonly execute: <Result>(operation: ExecuteRepairOperation<Result>) => Promise<Result>) {}

  async listWorklist(
    scope: RepairPersistenceScope,
    query: RepairWorklistQuery,
  ): Promise<RepairWorklistPage> {
    const validatedScope = validateScope(scope);
    const validatedQuery = query;
    const range = dateRange(validatedQuery);

    return this.execute(async (executor: RepairExecutor) => {
      let filtered = executor
        .selectFrom('repairs')
        .selectAll()
        .where('tenant_id', '=', validatedScope.tenantId)
        .where('branch_id', '=', validatedScope.branchId);
      const whereSearch = validatedQuery.q ? `%${validatedQuery.q}%` : undefined;
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
      if (validatedQuery.technicianId) filtered = filtered.where('technician_id', '=', validatedQuery.technicianId);
      if (validatedQuery.unassigned) filtered = filtered.where('technician_id', 'is', null);
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
          .selectFrom('repairs')
          .select(['technician_id', 'technician_display_name'])
          .where('tenant_id', '=', validatedScope.tenantId)
          .where('branch_id', '=', validatedScope.branchId)
          .where('technician_id', 'is not', null)
          .where('technician_display_name', 'is not', null)
          .distinct()
          .orderBy('technician_display_name', 'asc')
          .execute(),
      ]);
      const totalCount = Number(total.count);
      return Object.freeze({
        items: Object.freeze(rows.map(mapRepair)),
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
      const [timelineRows, timelineCount, evidenceRows, evidenceCount] = await Promise.all([
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
      ]);
      return mapRepairDetail(
        row,
        timelineRows.map(mapTimelineEntry),
        Number(timelineCount.count),
        evidenceRows.map(mapEvidence),
        Number(evidenceCount.count),
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
      return mapTimelineEntry(existing);
    });
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

export function createKyselyRepairRepository(connection: DatabaseConnection): RepairRepositoryPort {
  return new KyselyRepairRepository((operation) =>
    useDatabasePersistenceExecutor(connection, 'repairs', operation),
  );
}
