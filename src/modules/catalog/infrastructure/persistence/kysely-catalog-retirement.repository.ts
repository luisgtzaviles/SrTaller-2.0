import { createHash, randomUUID } from 'node:crypto';

import type { DatabaseConnection } from '../../../../infrastructure/database/database-connection.js';
import { useTransactionalDatabasePersistenceExecutor } from '../../../../infrastructure/database/database-persistence-capability.js';
import type { InternalDatabasePersistenceConnection, InternalDatabasePersistenceExecutor } from '../../../../infrastructure/database/database-persistence-capability.js';
import { runInTransaction } from '../../../../infrastructure/database/transaction-runner.js';
import type { CatalogRetirementExecutionRecord, CatalogRetirementPlanRecord, CatalogRetirementRepositoryPort, CatalogRetirementScope } from '../../application/ports/catalog-retirement-repository.port.js';
import type { CatalogMutationContext } from '../../application/ports/catalog-repository.port.js';
import { CatalogConflictError, CatalogInputError, CatalogNotFoundError, CatalogUnavailableError } from '../../domain/catalog-item.js';

type CatalogExecutor = InternalDatabasePersistenceExecutor<'catalog'>;

function translate(error: unknown): Error {
  if (error instanceof CatalogInputError || error instanceof CatalogNotFoundError || error instanceof CatalogConflictError) return error;
  const code = typeof error === 'object' && error && 'code' in error ? String(error.code) : '';
  if (['23505', '23503', '23514', 'DATABASE_TRANSACTION_SERIALIZATION_FAILURE', 'DATABASE_TRANSACTION_DEADLOCK'].includes(code)) return new CatalogConflictError();
  if (['22P02', '22001', '23502'].includes(code)) return new CatalogInputError('persistence');
  return new CatalogUnavailableError();
}

async function guardsCurrent(context: CatalogMutationContext, transactionContext: object): Promise<boolean> {
  for (const guard of context.commitGuards) {
    if (!await guard.confirmCurrent(transactionContext) || !await guard.confirmTemporalCurrent(transactionContext)) return false;
  }
  return true;
}

function hashItems(items: readonly Readonly<{ item_id: string; version: number }>[]): string {
  const canonical = [...items].sort((left, right) => left.item_id.localeCompare(right.item_id)).map(({ item_id, version }) => [item_id, version]);
  return createHash('sha256').update(JSON.stringify(canonical)).digest('hex');
}

async function batchForVersion(executor: CatalogExecutor, tenantId: string, versionId: string) {
  return executor.selectFrom('catalog_update_batches').select(['batch_id', 'lifecycle']).where('tenant_id', '=', tenantId).where('version_id', '=', versionId).executeTakeFirst();
}

async function candidateItems(executor: CatalogExecutor, tenantId: string, targetScope: CatalogRetirementScope, batchId: string | null, lock = false) {
  if (targetScope === 'ACTIVE_CATALOG') {
    const query = executor.selectFrom('catalog_items').select(['item_id', 'version', 'status']).where('tenant_id', '=', tenantId).orderBy('item_id');
    return (lock ? query.forUpdate() : query).execute();
  }
  const query = executor.selectFrom('catalog_supplier_listing_resolutions as resolution')
    .innerJoin('catalog_items as item', (join) => join.onRef('item.tenant_id', '=', 'resolution.tenant_id').onRef('item.item_id', '=', 'resolution.item_id'))
    .select(['item.item_id', 'item.version', 'item.status'])
    .distinct()
    .where('resolution.tenant_id', '=', tenantId)
    .where('resolution.batch_id', '=', batchId!)
    .where('resolution.resolution', '=', 'CREATED')
    .where('resolution.item_id', 'is not', null)
    .orderBy('item.item_id');
  const rows = await query.execute();
  if (!lock || rows.length === 0) return rows;
  return executor.selectFrom('catalog_items').select(['item_id', 'version', 'status'])
    .where('tenant_id', '=', tenantId).where('item_id', 'in', rows.map((item) => item.item_id))
    .orderBy('item_id').forUpdate().execute();
}

function chunks<Value>(values: readonly Value[], size = 500): readonly (readonly Value[])[] {
  const result: Value[][] = [];
  for (let offset = 0; offset < values.length; offset += size) result.push(values.slice(offset, offset + size));
  return result;
}

function planRecord(row: Readonly<{
  plan_id: string; scope: CatalogRetirementScope; batch_id: string | null; active_count: number;
  already_inactive_count: number; expires_at: Date; status: 'PENDING' | 'EXECUTED' | 'STALE' | 'EXPIRED'; retired_count: number | null;
}>, sourceVersionId: string | null): CatalogRetirementPlanRecord {
  return Object.freeze({
    planId: row.plan_id, scope: row.scope, batchId: row.batch_id, sourceVersionId,
    activeCount: row.active_count, alreadyInactiveCount: row.already_inactive_count,
    expiresAt: row.expires_at.toISOString(), status: row.status, retiredCount: row.retired_count,
  });
}

export class KyselyCatalogRetirementRepository implements CatalogRetirementRepositoryPort {
  constructor(private readonly connection: InternalDatabasePersistenceConnection) {}

  private async transaction<Result>(operation: (executor: CatalogExecutor, transactionContext: object) => Promise<Result>): Promise<Result> {
    let safe: Error | null = null;
    try {
      return await runInTransaction(this.connection as unknown as DatabaseConnection, { isolationLevel: 'serializable' }, (transactionContext) =>
        useTransactionalDatabasePersistenceExecutor(transactionContext, 'catalog', async (executor) => {
          try { return await operation(executor, transactionContext); }
          catch (error: unknown) { safe = translate(error); throw safe; }
        }));
    } catch (error: unknown) { throw safe ?? translate(error); }
  }

  createPlan(context: CatalogMutationContext, input: Parameters<CatalogRetirementRepositoryPort['createPlan']>[1]): Promise<CatalogRetirementPlanRecord> {
    return this.transaction(async (executor, transactionContext) => {
      let batchId: string | null = null;
      if (input.scope === 'BATCH_CREATED') {
        const batch = await batchForVersion(executor, context.tenantId, input.sourceVersionId!);
        if (!batch) throw new CatalogNotFoundError();
        if (batch.lifecycle !== 'APPLIED') throw new CatalogConflictError();
        batchId = batch.batch_id;
      }
      const items = await candidateItems(executor, context.tenantId, input.scope, batchId);
      const active = items.filter((item) => item.status === 'ACTIVE');
      const inactive = items.length - active.length;
      if (!await guardsCurrent(context, transactionContext)) throw new CatalogConflictError();
      const row = {
        tenant_id: context.tenantId, plan_id: input.planId, scope: input.scope, batch_id: batchId,
        item_set_sha256: hashItems(active), active_count: active.length, already_inactive_count: inactive,
        created_by_actor_id: context.actorUserId, created_in_branch_id: context.branchId,
        created_in_station_id: context.stationId, created_in_session_id: context.sessionId,
        status: 'PENDING' as const, expires_at: input.expiresAt, execution_client_request_id: null,
        retired_count: null, created_at: input.occurredAt, executed_at: null,
      };
      await executor.insertInto('catalog_retirement_plans').values(row).execute();
      return planRecord(row, input.sourceVersionId);
    });
  }

  executePlan(context: CatalogMutationContext, input: Parameters<CatalogRetirementRepositoryPort['executePlan']>[1]): Promise<CatalogRetirementExecutionRecord> {
    return this.transaction<CatalogRetirementExecutionRecord | Readonly<{ rejected: true }>>(async (executor, transactionContext) => {
      const plan = await executor.selectFrom('catalog_retirement_plans').selectAll()
        .where('tenant_id', '=', context.tenantId).where('plan_id', '=', input.planId).forUpdate().executeTakeFirst();
      if (!plan) throw new CatalogNotFoundError();
      const sameContext = plan.created_by_actor_id === context.actorUserId && plan.created_in_branch_id === context.branchId && plan.created_in_station_id === context.stationId && plan.created_in_session_id === context.sessionId;
      if (!sameContext) {
        if (plan.status === 'PENDING') {
          await executor.updateTable('catalog_retirement_plans').set({ status: 'STALE' }).where('tenant_id', '=', context.tenantId).where('plan_id', '=', plan.plan_id).execute();
        }
        await executor.insertInto('catalog_retirement_events').values({
          tenant_id: context.tenantId, event_id: randomUUID(), plan_id: plan.plan_id, scope: plan.scope, batch_id: plan.batch_id,
          branch_id: context.branchId, station_id: context.stationId, session_id: context.sessionId,
          actor_user_id: context.actorUserId, actor_display_name: context.actorDisplayName,
          capability: 'catalog.items.bulk_retire', sensitivity_level: 2, reauthenticated_at: input.reauthenticatedAt,
          item_set_sha256: plan.item_set_sha256, planned_count: plan.active_count, retired_count: 0,
          result: 'REJECTED', rejection_reason: 'PLAN_CONTEXT_CHANGED', correlation_id: input.correlationId,
          client_request_id: input.clientRequestId, occurred_at: input.occurredAt,
        }).execute();
        return Object.freeze({ rejected: true as const });
      }
      if (plan.status === 'EXECUTED' && plan.execution_client_request_id === input.clientRequestId) {
        const active = await executor.selectFrom('catalog_items').select(({ fn }) => fn.countAll<number>().as('count')).where('tenant_id', '=', context.tenantId).where('status', '=', 'ACTIVE').executeTakeFirstOrThrow();
        return Object.freeze({ planId: plan.plan_id, scope: plan.scope, retiredCount: plan.retired_count ?? 0, activeCatalogCount: Number(active.count), executedAt: plan.executed_at!.toISOString() });
      }
      if (plan.status !== 'PENDING') throw new CatalogConflictError();
      const expectedConfirmation = plan.scope === 'ACTIVE_CATALOG' ? 'RETIRE_ACTIVE_CATALOG' : 'RETIRE_BATCH_CREATED_ITEMS';
      if (input.confirmation !== expectedConfirmation) throw new CatalogInputError('confirmation');
      const items = await candidateItems(executor, context.tenantId, plan.scope, plan.batch_id, true);
      const active = items.filter((item) => item.status === 'ACTIVE');
      const expired = input.occurredAt >= plan.expires_at;
      const stale = active.length !== plan.active_count || hashItems(active) !== plan.item_set_sha256;
      const authorized = await guardsCurrent(context, transactionContext);
      if (!sameContext || expired || stale || !authorized) {
        const rejection = !sameContext ? 'PLAN_CONTEXT_CHANGED' : expired ? 'PLAN_EXPIRED' : stale ? 'PLAN_STALE' : 'AUTHORIZATION_CHANGED';
        await executor.updateTable('catalog_retirement_plans').set({ status: expired ? 'EXPIRED' : 'STALE' }).where('tenant_id', '=', context.tenantId).where('plan_id', '=', plan.plan_id).execute();
        await executor.insertInto('catalog_retirement_events').values({
          tenant_id: context.tenantId, event_id: randomUUID(), plan_id: plan.plan_id, scope: plan.scope, batch_id: plan.batch_id,
          branch_id: context.branchId, station_id: context.stationId, session_id: context.sessionId,
          actor_user_id: context.actorUserId, actor_display_name: context.actorDisplayName,
          capability: 'catalog.items.bulk_retire', sensitivity_level: 2, reauthenticated_at: input.reauthenticatedAt,
          item_set_sha256: plan.item_set_sha256, planned_count: plan.active_count, retired_count: 0,
          result: 'REJECTED', rejection_reason: rejection, correlation_id: input.correlationId,
          client_request_id: input.clientRequestId, occurred_at: input.occurredAt,
        }).execute();
        return Object.freeze({ rejected: true as const });
      }
      for (const itemChunk of chunks(active)) {
        const itemIds = itemChunk.map((item) => item.item_id);
        const update = await executor.updateTable('catalog_items').set((builder) => ({
          status: 'INACTIVE', version: builder('version', '+', 1), updated_at: input.occurredAt,
        })).where('tenant_id', '=', context.tenantId).where('item_id', 'in', itemIds).where('status', '=', 'ACTIVE').executeTakeFirstOrThrow();
        if (update.numUpdatedRows !== BigInt(itemChunk.length)) throw new CatalogConflictError();
        await executor.insertInto('catalog_audit_events').values(itemChunk.map((item) => ({
          tenant_id: context.tenantId, audit_id: randomUUID(), branch_id: context.branchId,
          station_id: context.stationId, session_id: context.sessionId, actor_user_id: context.actorUserId,
          actor_display_name: context.actorDisplayName, capability: 'catalog.items.bulk_retire',
          action: plan.scope === 'ACTIVE_CATALOG' ? 'catalog.items.bulk_retire' : 'catalog.batch.created_items.retire',
          resource_id: item.item_id, old_version: item.version, new_version: item.version + 1,
          change_summary: { planId: plan.plan_id, batchId: plan.batch_id, oldStatus: 'ACTIVE', newStatus: 'INACTIVE', sensitivityLevel: 2, operationCorrelationId: input.correlationId },
          result: 'SUCCEEDED' as const, correlation_id: randomUUID(), client_request_id: input.clientRequestId, occurred_at: input.occurredAt,
        }))).execute();
      }
      await executor.insertInto('catalog_retirement_events').values({
        tenant_id: context.tenantId, event_id: randomUUID(), plan_id: plan.plan_id, scope: plan.scope, batch_id: plan.batch_id,
        branch_id: context.branchId, station_id: context.stationId, session_id: context.sessionId,
        actor_user_id: context.actorUserId, actor_display_name: context.actorDisplayName,
        capability: 'catalog.items.bulk_retire', sensitivity_level: 2, reauthenticated_at: input.reauthenticatedAt,
        item_set_sha256: plan.item_set_sha256, planned_count: plan.active_count, retired_count: active.length,
        result: 'SUCCEEDED', rejection_reason: null, correlation_id: input.correlationId,
        client_request_id: input.clientRequestId, occurred_at: input.occurredAt,
      }).execute();
      await executor.updateTable('catalog_retirement_plans').set({ status: 'EXECUTED', execution_client_request_id: input.clientRequestId, retired_count: active.length, executed_at: input.occurredAt })
        .where('tenant_id', '=', context.tenantId).where('plan_id', '=', plan.plan_id).execute();
      const activeCatalog = await executor.selectFrom('catalog_items').select(({ fn }) => fn.countAll<number>().as('count')).where('tenant_id', '=', context.tenantId).where('status', '=', 'ACTIVE').executeTakeFirstOrThrow();
      return Object.freeze({ planId: plan.plan_id, scope: plan.scope, retiredCount: active.length, activeCatalogCount: Number(activeCatalog.count), executedAt: input.occurredAt.toISOString() });
    }).then((result) => {
      if ('rejected' in result) throw new CatalogConflictError();
      return result;
    });
  }
}

export function createKyselyCatalogRetirementRepository(connection: InternalDatabasePersistenceConnection): CatalogRetirementRepositoryPort {
  return new KyselyCatalogRetirementRepository(connection);
}
