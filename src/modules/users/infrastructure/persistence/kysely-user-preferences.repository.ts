import {
  useDatabasePersistenceExecutor,
  useTransactionalDatabasePersistenceExecutor,
} from '../../../../infrastructure/database/database-persistence-capability.js';
import type {
  InternalDatabasePersistenceConnection,
  InternalDatabasePersistenceExecutor,
} from '../../../../infrastructure/database/database-persistence-capability.js';
import type { DatabaseConnection } from '../../../../infrastructure/database/database-connection.js';
import { runInTransaction } from '../../../../infrastructure/database/transaction-runner.js';
import type {
  NewRepairFormMode,
  UserPreferencesMutationGuard,
  UserPreferencesRecord,
  UserPreferencesPatch,
  UserPreferencesRepositoryPort,
  UserPreferencesScope,
} from '../../application/ports/user-preferences-repository.port.js';
import { UserPreferencesPersistenceError } from '../../application/ports/user-preferences-repository.port.js';

type UserPreferencesExecutor = InternalDatabasePersistenceExecutor<'users'>;

function driverErrorCode(error: unknown): string {
  if (typeof error !== 'object' || error === null || !('code' in error)) return '';
  return typeof error.code === 'string' ? error.code : '';
}

function persistenceError(error: unknown): UserPreferencesPersistenceError {
  if (error instanceof UserPreferencesPersistenceError) return error;
  const code = driverErrorCode(error);
  if (code === '23503') {
    return new UserPreferencesPersistenceError('USER_PREFERENCES_USER_NOT_FOUND');
  }
  if (code === '22001' || code === '22P02' || code === '23502' || code === '23514') {
    return new UserPreferencesPersistenceError('USER_PREFERENCES_INPUT_INVALID');
  }
  return new UserPreferencesPersistenceError('USER_PREFERENCES_PERSISTENCE_FAILED');
}

function record(row: Readonly<{
  new_repair_form_mode: NewRepairFormMode;
  price_list_show_reference_cost: boolean;
  updated_at: Date;
}>): UserPreferencesRecord {
  return Object.freeze({
    newRepairFormMode: row.new_repair_form_mode,
    priceListShowReferenceCost: row.price_list_show_reference_cost,
    updatedAt: row.updated_at.toISOString(),
  });
}

export class KyselyUserPreferencesRepository
implements UserPreferencesRepositoryPort {
  private transactionTail = Promise.resolve();

  constructor(private readonly connection: InternalDatabasePersistenceConnection) {}

  async read(scope: UserPreferencesScope): Promise<UserPreferencesRecord | null> {
    try {
      return await useDatabasePersistenceExecutor(
        this.connection,
        'users',
        async (database: UserPreferencesExecutor) => {
          const row = await database
            .selectFrom('user_preferences')
            .select(['new_repair_form_mode', 'price_list_show_reference_cost', 'updated_at'])
            .where('tenant_id', '=', scope.tenantId)
            .where('user_id', '=', scope.userId)
            .executeTakeFirst();
          return row ? record(row) : null;
        },
      );
    } catch (error: unknown) {
      throw persistenceError(error);
    }
  }

  async upsert(
    scope: UserPreferencesScope,
    patch: UserPreferencesPatch,
    occurredAt: Date,
    guard?: UserPreferencesMutationGuard,
  ): Promise<UserPreferencesRecord> {
    let releaseTurn!: () => void;
    const previousTurn = this.transactionTail;
    this.transactionTail = new Promise<void>((resolve) => { releaseTurn = resolve; });
    await previousTurn;
    try {
      return await runInTransaction(
        this.connection as unknown as DatabaseConnection,
        { isolationLevel: 'serializable' },
        async (transactionContext) =>
          useTransactionalDatabasePersistenceExecutor(
            transactionContext,
            'users',
            async (database) => {
              if (guard && !await guard.confirmCurrent(transactionContext)) {
                throw new UserPreferencesPersistenceError(
                  'USER_PREFERENCES_AUTHENTICATION_CHANGED',
                );
              }
              const current = await database.selectFrom('user_preferences')
                .select(['new_repair_form_mode', 'price_list_show_reference_cost'])
                .where('tenant_id', '=', scope.tenantId).where('user_id', '=', scope.userId)
                .forUpdate().executeTakeFirst();
              const mode = patch.newRepairFormMode ?? current?.new_repair_form_mode ?? 'classic';
              const showCost = patch.priceListShowReferenceCost ?? current?.price_list_show_reference_cost ?? false;
              const row = await database
                .insertInto('user_preferences')
                .values({
                  tenant_id: scope.tenantId,
                  user_id: scope.userId,
                  new_repair_form_mode: mode,
                  price_list_show_reference_cost: showCost,
                  updated_at: occurredAt,
                })
                .onConflict((conflict) =>
                  conflict.columns(['tenant_id', 'user_id']).doUpdateSet({
                    new_repair_form_mode: mode,
                    price_list_show_reference_cost: showCost,
                    updated_at: occurredAt,
                  }),
                )
                .returning(['new_repair_form_mode', 'price_list_show_reference_cost', 'updated_at'])
                .executeTakeFirstOrThrow();
              if (guard && !await guard.confirmCurrent(transactionContext)) {
                throw new UserPreferencesPersistenceError(
                  'USER_PREFERENCES_AUTHENTICATION_CHANGED',
                );
              }
              return record(row);
            },
          ),
      );
    } catch (error: unknown) {
      throw persistenceError(error);
    } finally {
      releaseTurn();
    }
  }
}
