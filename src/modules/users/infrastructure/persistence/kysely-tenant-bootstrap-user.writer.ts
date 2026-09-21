import {
  useTransactionalDatabasePersistenceExecutor,
} from '../../../../infrastructure/database/database-persistence-capability.js';
import type { TenantBootstrapScope, TenantBootstrapUserWriterPort } from '../../application/ports/tenant-bootstrap-user-writer.port.js';

export class KyselyTenantBootstrapUserWriter implements TenantBootstrapUserWriterPort {
  async createFirstUser(
    scope: TenantBootstrapScope,
    input: Readonly<{
      userId: string;
      displayName: string;
      occurredAt: string;
    }>,
    transactionContext: object,
  ): Promise<void> {
    await useTransactionalDatabasePersistenceExecutor(
      transactionContext,
      'users',
      async (database) => {
        const occurredAt = new Date(input.occurredAt);
        await database.insertInto('users').values({
          tenant_id: scope.tenantId,
          user_id: input.userId,
          display_name: input.displayName,
          operational_identifier: null,
          status: 'active',
          version: 0,
          admission_revision: 0,
          created_at: occurredAt,
          updated_at: occurredAt,
        }).execute();
      },
    );
  }
}
