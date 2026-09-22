import { useTransactionalDatabasePersistenceExecutor } from '../../../../infrastructure/database/database-persistence-capability.js';
import type { AdminInvitationUserCommitRuntime } from '../../application/ports/admin-invitation-user-commit.port.js';

export class KyselyAdminInvitationUserCommit implements AdminInvitationUserCommitRuntime {
  async findActive(
    scope: Readonly<{ tenantId: string; userId: string }>,
    transactionContext: object,
  ) {
    return useTransactionalDatabasePersistenceExecutor(transactionContext, 'users', async (database) => {
      const row = await database.selectFrom('users')
        .select(['user_id', 'status', 'admission_revision'])
        .where('tenant_id', '=', scope.tenantId)
        .where('user_id', '=', scope.userId)
        .where('status', '=', 'active')
        .forShare()
        .executeTakeFirst();
      return row ? Object.freeze({ userId: row.user_id, status: 'active' as const, admissionRevision: row.admission_revision }) : null;
    });
  }

  async create(
    scope: Readonly<{ tenantId: string }>,
    input: Readonly<{ userId: string; displayName: string; occurredAt: string }>,
    transactionContext: object,
  ) {
    return useTransactionalDatabasePersistenceExecutor(transactionContext, 'users', async (database) => {
      const at = new Date(input.occurredAt);
      await database.insertInto('users').values({
        tenant_id: scope.tenantId,
        user_id: input.userId,
        display_name: input.displayName,
        operational_identifier: null,
        status: 'active',
        version: 0,
        admission_revision: 0,
        created_at: at,
        updated_at: at,
      }).execute();
      return Object.freeze({ userId: input.userId, status: 'active' as const, admissionRevision: 0 });
    });
  }
}
