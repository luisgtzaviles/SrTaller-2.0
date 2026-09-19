import type { DatabaseConnection } from '../../../../infrastructure/database/database-connection.js';
import { useDatabasePersistenceExecutor, useTransactionalDatabasePersistenceExecutor } from '../../../../infrastructure/database/database-persistence-capability.js';
import type { InternalDatabasePersistenceConnection, InternalDatabasePersistenceExecutor } from '../../../../infrastructure/database/database-persistence-capability.js';
import { runInTransaction } from '../../../../infrastructure/database/transaction-runner.js';
import { CatalogConflictError, CatalogUnavailableError } from '../../domain/catalog-item.js';
import { validateCatalogFieldPolicyLevels } from '../../domain/catalog-field-policy.js';
import type { CatalogFieldPolicyConfigurationContext, CatalogFieldPolicyRecord, CatalogFieldPolicyRepositoryPort, CatalogFieldPolicyScope, ChangeCatalogFieldPolicyRecord } from '../../application/ports/catalog-field-policy-repository.port.js';
import { CatalogFieldPolicyAuthorizationChangedError, CatalogFieldPolicyConcurrencyConflictError } from '../../application/ports/catalog-field-policy-repository.port.js';

type CatalogExecutor = InternalDatabasePersistenceExecutor<'catalog'>;
function translate(error: unknown): Error { if (error instanceof CatalogFieldPolicyAuthorizationChangedError || error instanceof CatalogFieldPolicyConcurrencyConflictError) return error; const code = typeof error === 'object' && error && 'code' in error ? String(error.code) : ''; if (['23505', '23503', '23514', 'DATABASE_TRANSACTION_SERIALIZATION_FAILURE', 'DATABASE_TRANSACTION_DEADLOCK'].includes(code)) return new CatalogFieldPolicyConcurrencyConflictError(); return new CatalogUnavailableError(); }
async function guardsCurrent(context: CatalogFieldPolicyConfigurationContext, transactionContext: object): Promise<boolean> { for (const guard of context.commitGuards) if (!await guard.confirmCurrent(transactionContext) || !await guard.confirmTemporalCurrent(transactionContext)) return false; return true; }
function record(row: Readonly<{ schema_version: number; current_version: number; field_levels: unknown; updated_at: Date }>): CatalogFieldPolicyRecord { return Object.freeze({ schemaVersion: row.schema_version, policyVersion: row.current_version, fieldLevels: validateCatalogFieldPolicyLevels(row.field_levels), updatedAt: row.updated_at.toISOString() }); }

export class KyselyCatalogFieldPolicyRepository implements CatalogFieldPolicyRepositoryPort {
  constructor(private readonly connection: InternalDatabasePersistenceConnection) {}
  private execute<Result>(operation: (executor: CatalogExecutor) => Promise<Result>): Promise<Result> { return useDatabasePersistenceExecutor(this.connection, 'catalog', async (executor) => { try { return await operation(executor); } catch (error) { throw translate(error); } }); }
  private async transaction<Result>(operation: (executor: CatalogExecutor, transactionContext: object) => Promise<Result>): Promise<Result> { let safe: Error | null = null; try { return await runInTransaction(this.connection as unknown as DatabaseConnection, { isolationLevel: 'serializable' }, (transactionContext) => useTransactionalDatabasePersistenceExecutor(transactionContext, 'catalog', async (executor) => { try { return await operation(executor, transactionContext); } catch (error) { safe = translate(error); throw safe; } })); } catch (error) { throw safe ?? translate(error); } }
  async readCatalogFieldPolicy(scope: CatalogFieldPolicyScope): Promise<CatalogFieldPolicyRecord | null> { return this.execute(async (executor) => { const row = await executor.selectFrom('catalog_field_policy_heads').select(['schema_version', 'current_version', 'field_levels', 'updated_at']).where('tenant_id', '=', scope.tenantId).executeTakeFirst(); return row ? record(row) : null; }); }
  async changeCatalogFieldPolicy(context: CatalogFieldPolicyConfigurationContext, change: ChangeCatalogFieldPolicyRecord): Promise<CatalogFieldPolicyRecord> {
    const outcome = await this.transaction<CatalogFieldPolicyRecord | Readonly<{ error: Error }>>(async (executor, transactionContext) => {
      let current = await executor.selectFrom('catalog_field_policy_heads').select(['schema_version', 'current_version']).where('tenant_id', '=', context.tenantId).forUpdate().executeTakeFirst();
      if (!current) {
        if (change.expectedVersion !== 0) return Object.freeze({ error: new CatalogFieldPolicyConcurrencyConflictError() });
        await executor.insertInto('catalog_field_policy_heads').values({ tenant_id: context.tenantId, schema_version: change.schemaVersion, current_version: 0, field_levels: change.previousFieldLevels, created_at: change.occurredAt, updated_at: change.occurredAt }).onConflict((conflict) => conflict.column('tenant_id').doNothing()).execute();
        current = await executor.selectFrom('catalog_field_policy_heads').select(['schema_version', 'current_version']).where('tenant_id', '=', context.tenantId).forUpdate().executeTakeFirstOrThrow();
      }
      if (current.current_version !== change.expectedVersion || current.schema_version !== change.schemaVersion) return Object.freeze({ error: new CatalogFieldPolicyConcurrencyConflictError() });
      if (!await guardsCurrent(context, transactionContext)) return Object.freeze({ error: new CatalogFieldPolicyAuthorizationChangedError() });
      const nextVersion = current.current_version + 1;
      await executor.insertInto('catalog_field_policy_versions').values({ tenant_id: context.tenantId, policy_version: nextVersion, schema_version: change.schemaVersion, previous_version: current.current_version, field_levels: change.fieldLevels, actor_user_id: context.actorUserId, actor_display_name: context.actorDisplayName, station_id: context.stationId, session_id: context.sessionId, capability: context.capability, action: change.action, result: 'succeeded', correlation_id: change.correlationId, occurred_at: change.occurredAt }).execute();
      await executor.updateTable('catalog_field_policy_heads').set({ current_version: nextVersion, field_levels: change.fieldLevels, updated_at: change.occurredAt }).where('tenant_id', '=', context.tenantId).execute();
      return Object.freeze({ schemaVersion: change.schemaVersion, policyVersion: nextVersion, fieldLevels: change.fieldLevels, updatedAt: change.occurredAt.toISOString() });
    });
    if ('error' in outcome) throw outcome.error;
    return outcome;
  }
}
export function createKyselyCatalogFieldPolicyRepository(connection: InternalDatabasePersistenceConnection): CatalogFieldPolicyRepositoryPort { return new KyselyCatalogFieldPolicyRepository(connection); }
