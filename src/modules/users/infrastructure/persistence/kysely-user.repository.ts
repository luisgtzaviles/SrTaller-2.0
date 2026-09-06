import type { Kysely } from 'kysely';
import type { DatabaseSchema } from '../../../../infrastructure/database/database-types.js';
import { canTransitionUser, type UserStatus } from '../../domain/user.js';
import type { UserRecord, UserRepositoryPort, UserScope } from '../../application/ports/user-repository.port.js';

const map = (row: { user_id: string; tenant_id: string; display_name: string; operational_identifier: string | null; status: UserStatus; version: number; created_at: Date; updated_at: Date }): UserRecord => Object.freeze({ userId: row.user_id, tenantId: row.tenant_id, displayName: row.display_name, operationalIdentifier: row.operational_identifier, status: row.status, version: row.version, createdAt: row.created_at, updatedAt: row.updated_at });

export function createKyselyUserRepository(database: Kysely<DatabaseSchema>): UserRepositoryPort {
  return {
    async list(scope) { return (await database.selectFrom('users').selectAll().where('tenant_id', '=', scope.tenantId).orderBy('display_name').execute()).map(map); },
    async bootstrap(scope, input) {
      return database.transaction().execute(async (transaction) => {
        const existing = await transaction.selectFrom('users').select('user_id').where('tenant_id', '=', scope.tenantId).limit(1).executeTakeFirst();
        if (existing) throw new Error('FIRST_USER_ALREADY_PROVISIONED');
        const row = await transaction.insertInto('users').values({ user_id: input.userId, tenant_id: scope.tenantId, display_name: input.displayName, operational_identifier: input.operationalIdentifier, status: 'active', version: 0, created_at: input.now, updated_at: input.now }).returningAll().executeTakeFirstOrThrow();
        return map(row);
      });
    },
    async transition(scope, input) {
      const current = await database.selectFrom('users').selectAll().where('tenant_id', '=', scope.tenantId).where('user_id', '=', input.userId).executeTakeFirst();
      if (!current || !canTransitionUser(current.status, input.status)) throw new Error('USER_LIFECYCLE_CONFLICT');
      if (current.version !== input.expectedVersion) throw new Error('USER_STALE_WRITE');
      const row = await database.updateTable('users').set({ status: input.status, version: current.version + 1, updated_at: input.now }).where('tenant_id', '=', scope.tenantId).where('user_id', '=', input.userId).where('version', '=', input.expectedVersion).returningAll().executeTakeFirst();
      if (!row) throw new Error('USER_STALE_WRITE');
      return map(row);
    },
  };
}
