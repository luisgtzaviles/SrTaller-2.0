import { randomUUID } from 'node:crypto';

import type { Selectable } from 'kysely';

import type { DatabaseConnection } from '../../../../infrastructure/database/database-connection.js';
import {
  useDatabasePersistenceExecutor,
  useTransactionalDatabasePersistenceExecutor,
} from '../../../../infrastructure/database/database-persistence-capability.js';
import type {
  InternalDatabasePersistenceExecutor,
  InternalDatabasePersistenceOperation,
} from '../../../../infrastructure/database/database-persistence-capability.js';
import type { DatabaseSchema } from '../../../../infrastructure/database/database-types.js';
import { runInTransaction } from '../../../../infrastructure/database/transaction-runner.js';
import type { DatabaseTransactionContext } from '../../../../infrastructure/database/transaction-runner.js';
import type {
  PreviewActorPersistenceScope,
  PreviewRepairPersistenceScope,
  PreviewRepairRepositoryPort,
  PreviewRepairTransitionResult,
} from '../../application/ports/preview-repair-repository.port.js';
import type {
  CreatePreviewRepairInput,
  PreviewRepairDetail,
  PreviewRepairRecord,
  PreviewRepairStatus,
  PreviewRepairStatusHistory,
} from '../../domain/preview-repair.js';
import {
  assertPreviewRepairTransition,
  newPreviewRepairIdentity,
} from '../../domain/preview-repair.js';

type PreviewExecutor = InternalDatabasePersistenceExecutor<'preview'>;
type PreviewOperation<Result> = InternalDatabasePersistenceOperation<'preview', Result>;
type PreviewRepairRow = Selectable<DatabaseSchema['preview_repairs']>;
type PreviewRepairStatusHistoryRow =
  Selectable<DatabaseSchema['preview_repair_status_history']>;

function money(value: number): string {
  return value.toFixed(2);
}

function record(row: PreviewRepairRow): PreviewRepairRecord {
  return Object.freeze({
    id: row.repair_id,
    folio: row.folio,
    customerName: row.customer_name,
    customerPhone: row.customer_phone,
    deviceBrand: row.device_brand,
    deviceModel: row.device_model,
    deviceSerial: row.device_serial,
    deviceColor: row.device_color,
    reportedProblem: row.reported_problem,
    physicalCondition: row.physical_condition,
    notes: row.notes,
    estimatedPrice: row.estimated_price === null ? null : Number(row.estimated_price),
    depositAmount: Number(row.deposit_amount),
    status: row.status,
    revision: row.revision,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  });
}

function history(row: PreviewRepairStatusHistoryRow): PreviewRepairStatusHistory {
  return Object.freeze({
    id: row.history_id,
    fromStatus: row.from_status,
    toStatus: row.to_status,
    resultingRevision: row.resulting_revision,
    stationId: row.station_id,
    actorLabel: row.actor_label,
    changedAt: row.changed_at.toISOString(),
  });
}

function actorLabel(value: string): string {
  if (value.length < 1 || value.length > 120 || value !== value.trim()) {
    throw new TypeError('Preview actor label is invalid.');
  }
  return value;
}

class KyselyPreviewRepairRepository implements PreviewRepairRepositoryPort {
  constructor(private readonly connection: DatabaseConnection) {}

  private execute<Result>(operation: PreviewOperation<Result>): Promise<Result> {
    return useDatabasePersistenceExecutor(this.connection, 'preview', operation);
  }

  private executeIn<Result>(
    transaction: DatabaseTransactionContext,
    operation: PreviewOperation<Result>,
  ): Promise<Result> {
    return useTransactionalDatabasePersistenceExecutor(
      transaction,
      'preview',
      operation,
    );
  }

  async create(
    context: PreviewActorPersistenceScope,
    input: CreatePreviewRepairInput,
  ): Promise<PreviewRepairDetail> {
    const identity = newPreviewRepairIdentity();
    const changedAt = new Date(identity.instant);
    const label = actorLabel(context.actorLabel);
    const created = await runInTransaction(
      this.connection,
      { isolationLevel: 'read committed', readOnly: false },
      async (transaction) => this.executeIn(transaction, async (executor: PreviewExecutor) => {
        const row = await executor
          .insertInto('preview_repairs')
          .values({
            tenant_id: context.tenantId,
            branch_id: context.branchId,
            repair_id: identity.id,
            folio: identity.folio,
            customer_name: input.customerName,
            customer_phone: input.customerPhone,
            device_brand: input.deviceBrand,
            device_model: input.deviceModel,
            device_serial: input.deviceSerial,
            device_color: input.deviceColor,
            reported_problem: input.reportedProblem,
            physical_condition: input.physicalCondition,
            notes: input.notes,
            estimated_price: input.estimatedPrice === null
              ? null
              : money(input.estimatedPrice),
            deposit_amount: money(input.depositAmount),
            status: 'received',
            revision: 1,
            created_station_id: context.stationId,
            created_by_label: label,
            created_at: changedAt,
            updated_at: changedAt,
          })
          .returningAll()
          .executeTakeFirstOrThrow();
        const historyId = randomUUID();
        await executor
          .insertInto('preview_repair_status_history')
          .values({
            tenant_id: context.tenantId,
            branch_id: context.branchId,
            history_id: historyId,
            repair_id: identity.id,
            from_status: null,
            to_status: 'received',
            resulting_revision: 1,
            station_id: context.stationId,
            actor_label: label,
            changed_at: changedAt,
          })
          .executeTakeFirstOrThrow();
        return Object.freeze({ row, historyId });
      }),
    );
    return Object.freeze({
      ...record(created.row),
      history: Object.freeze([{
        id: created.historyId,
        fromStatus: null,
        toStatus: 'received' as const,
        resultingRevision: 1,
        stationId: context.stationId,
        actorLabel: label,
        changedAt: identity.instant,
      }]),
    });
  }

  async list(context: PreviewRepairPersistenceScope): Promise<readonly PreviewRepairRecord[]> {
    return this.execute(async (executor: PreviewExecutor) => {
      const rows = await executor
        .selectFrom('preview_repairs')
        .selectAll()
        .where('tenant_id', '=', context.tenantId)
        .where('branch_id', '=', context.branchId)
        .orderBy('created_at', 'desc')
        .limit(200)
        .execute();
      return Object.freeze(rows.map(record));
    });
  }

  async findById(
    context: PreviewRepairPersistenceScope,
    repairId: string,
  ): Promise<PreviewRepairDetail | null> {
    return this.execute(async (executor: PreviewExecutor) =>
      this.findWithExecutor(executor, context, repairId));
  }

  private async findWithExecutor(
    executor: PreviewExecutor,
    context: PreviewRepairPersistenceScope,
    repairId: string,
  ): Promise<PreviewRepairDetail | null> {
    const row = await executor
      .selectFrom('preview_repairs')
      .selectAll()
      .where('tenant_id', '=', context.tenantId)
      .where('branch_id', '=', context.branchId)
      .where('repair_id', '=', repairId)
      .executeTakeFirst();
    if (!row) {
      return null;
    }
    const rows = await executor
      .selectFrom('preview_repair_status_history')
      .selectAll()
      .where('tenant_id', '=', context.tenantId)
      .where('branch_id', '=', context.branchId)
      .where('repair_id', '=', repairId)
      .orderBy('changed_at', 'asc')
      .execute();
    return Object.freeze({ ...record(row), history: Object.freeze(rows.map(history)) });
  }

  async transitionStatus(
    context: PreviewActorPersistenceScope,
    repairId: string,
    expectedRevision: number,
    status: PreviewRepairStatus,
  ): Promise<PreviewRepairTransitionResult> {
    const label = actorLabel(context.actorLabel);
    return runInTransaction(
      this.connection,
      { isolationLevel: 'read committed', readOnly: false },
      async (transaction) => this.executeIn(transaction, async (executor: PreviewExecutor) => {
        const current = await executor
          .selectFrom('preview_repairs')
          .selectAll()
          .where('tenant_id', '=', context.tenantId)
          .where('branch_id', '=', context.branchId)
          .where('repair_id', '=', repairId)
          .forUpdate()
          .executeTakeFirst();
        if (!current) {
          return Object.freeze({ kind: 'not-found' as const });
        }
        if (current.revision !== expectedRevision) {
          return Object.freeze({
            kind: 'revision-conflict' as const,
            actualRevision: current.revision,
          });
        }
        try {
          assertPreviewRepairTransition(current.status, status);
        } catch {
          return Object.freeze({
            kind: 'transition-conflict' as const,
            actualStatus: current.status,
          });
        }
        const nextRevision = current.revision + 1;
        const changedAt = new Date();
        const updated = await executor
          .updateTable('preview_repairs')
          .set({ status, revision: nextRevision, updated_at: changedAt })
          .where('tenant_id', '=', context.tenantId)
          .where('branch_id', '=', context.branchId)
          .where('repair_id', '=', repairId)
          .where('revision', '=', expectedRevision)
          .returningAll()
          .executeTakeFirst();
        if (!updated) {
          return Object.freeze({
            kind: 'revision-conflict' as const,
            actualRevision: current.revision,
          });
        }
        await executor
          .insertInto('preview_repair_status_history')
          .values({
            tenant_id: context.tenantId,
            branch_id: context.branchId,
            history_id: randomUUID(),
            repair_id: repairId,
            from_status: current.status,
            to_status: status,
            resulting_revision: nextRevision,
            station_id: context.stationId,
            actor_label: label,
            changed_at: changedAt,
          })
          .executeTakeFirstOrThrow();
        const detail = await this.findWithExecutor(
          executor,
          context,
          repairId,
        );
        if (!detail) {
          throw new Error('Updated preview repair could not be reloaded.');
        }
        return Object.freeze({ kind: 'updated' as const, repair: detail });
      }),
    );
  }
}

export function createKyselyPreviewRepairRepository(
  connection: DatabaseConnection,
): PreviewRepairRepositoryPort {
  return new KyselyPreviewRepairRepository(connection);
}

export type KyselyPreviewRepairRepositoryFactory =
  typeof createKyselyPreviewRepairRepository;
