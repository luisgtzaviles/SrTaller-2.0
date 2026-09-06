import type { DatabaseConnection } from '../../../../infrastructure/database/database-connection.js';
import { useDatabasePersistenceExecutor } from '../../../../infrastructure/database/database-persistence-capability.js';
import type { InternalDatabasePersistenceOperation } from '../../../../infrastructure/database/database-persistence-capability.js';
import { canTransitionUser, type UserStatus } from '../../domain/user.js';
import type { UserRecord, UserRepositoryPort, UserScope } from '../../application/ports/user-repository.port.js';

type UserOperation = <Result>(operation: InternalDatabasePersistenceOperation<'users', Result>) => Promise<Result>;

export class UserPersistenceError extends Error {
  constructor(readonly code: 'FIRST_USER_ALREADY_PROVISIONED' | 'USER_LIFECYCLE_CONFLICT' | 'USER_STALE_WRITE' | 'USER_TENANT_SCOPE_REQUIRED') {
    super(code);
    this.name = 'UserPersistenceError';
  }
}

function validateScope(scope: UserScope): UserScope {
  if (typeof scope?.tenantId !== 'string' || !/^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/iu.test(scope.tenantId)) {
    throw new UserPersistenceError('USER_TENANT_SCOPE_REQUIRED');
  }
  return Object.freeze({ tenantId: scope.tenantId });
}

function map(row: { user_id: string; tenant_id: string; display_name: string; operational_identifier: string | null; status: UserStatus; version: number; created_at: Date; updated_at: Date }): UserRecord {
  return Object.freeze({ userId: row.user_id, tenantId: row.tenant_id, displayName: row.display_name, operationalIdentifier: row.operational_identifier, status: row.status, version: row.version, createdAt: row.created_at, updatedAt: row.updated_at });
}

function repository(execute: UserOperation): UserRepositoryPort {
  return {
    async list(scope) {
      const trustedScope = validateScope(scope);
      return execute(async (database) => (await database.selectFrom('users').selectAll().where('tenant_id', '=', trustedScope.tenantId).orderBy('display_name').execute()).map(map));
    },
    async bootstrap(scope, input) {
      const trustedScope = validateScope(scope);
      return execute(async (database) => database.transaction().execute(async (transaction) => {
        const previousGate = await transaction.selectFrom('user_provisioning_bootstraps').selectAll().where('tenant_id', '=', trustedScope.tenantId).executeTakeFirst();
        if (previousGate) {
          if (previousGate.client_request_id !== input.clientRequestId) throw new UserPersistenceError('FIRST_USER_ALREADY_PROVISIONED');
          const existing = await transaction.selectFrom('users').selectAll().where('tenant_id', '=', trustedScope.tenantId).where('user_id', '=', previousGate.first_user_id).executeTakeFirst();
          if (!existing) throw new UserPersistenceError('FIRST_USER_ALREADY_PROVISIONED');
          return map(existing);
        }
        const existingUser = await transaction.selectFrom('users').select('user_id').where('tenant_id', '=', trustedScope.tenantId).limit(1).executeTakeFirst();
        if (existingUser) throw new UserPersistenceError('FIRST_USER_ALREADY_PROVISIONED');
        const gate = await transaction.insertInto('user_provisioning_bootstraps').values({ tenant_id: trustedScope.tenantId, first_user_id: input.userId, client_request_id: input.clientRequestId, provisioned_at: input.now }).onConflict((conflict) => conflict.column('tenant_id').doNothing()).returningAll().executeTakeFirst();
        if (!gate) {
          const prior = await transaction.selectFrom('user_provisioning_bootstraps').selectAll().where('tenant_id', '=', trustedScope.tenantId).executeTakeFirstOrThrow();
          if (prior.client_request_id !== input.clientRequestId) throw new UserPersistenceError('FIRST_USER_ALREADY_PROVISIONED');
          const existing = await transaction.selectFrom('users').selectAll().where('tenant_id', '=', trustedScope.tenantId).where('user_id', '=', prior.first_user_id).executeTakeFirst();
          if (!existing) throw new UserPersistenceError('FIRST_USER_ALREADY_PROVISIONED');
          return map(existing);
        }
        const row = await transaction.insertInto('users').values({ user_id: input.userId, tenant_id: trustedScope.tenantId, display_name: input.displayName, operational_identifier: input.operationalIdentifier, status: 'active', version: 0, created_at: input.now, updated_at: input.now }).returningAll().executeTakeFirstOrThrow();
        return map(row);
      }));
    },
    async transition(scope, input) {
      const trustedScope = validateScope(scope);
      return execute(async (database) => {
        const current = await database.selectFrom('users').selectAll().where('tenant_id', '=', trustedScope.tenantId).where('user_id', '=', input.userId).executeTakeFirst();
        if (!current || !canTransitionUser(current.status, input.status)) throw new UserPersistenceError('USER_LIFECYCLE_CONFLICT');
        if (current.version !== input.expectedVersion) throw new UserPersistenceError('USER_STALE_WRITE');
        const row = await database.updateTable('users').set({ status: input.status, version: current.version + 1, updated_at: input.now }).where('tenant_id', '=', trustedScope.tenantId).where('user_id', '=', input.userId).where('version', '=', input.expectedVersion).returningAll().executeTakeFirst();
        if (!row) throw new UserPersistenceError('USER_STALE_WRITE');
        return map(row);
      });
    },
  };
}

export function createKyselyUserRepository(connection: DatabaseConnection): UserRepositoryPort {
  return repository((operation) => useDatabasePersistenceExecutor(connection, 'users', operation));
}
