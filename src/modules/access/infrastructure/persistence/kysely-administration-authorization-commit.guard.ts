import { useTransactionalDatabasePersistenceExecutor } from '../../../../infrastructure/database/database-persistence-capability.js';
import type { AdministrationAuthorizationCommitGuardPort } from '../../application/ports/administration-authorization-commit-guard.port.js';

export class KyselyAdministrationAuthorizationCommitGuard
implements AdministrationAuthorizationCommitGuardPort {
  async confirmCurrent(
    scope: Parameters<AdministrationAuthorizationCommitGuardPort['confirmCurrent']>[0],
    capability: Parameters<AdministrationAuthorizationCommitGuardPort['confirmCurrent']>[1],
    transactionContext: object,
  ): Promise<boolean> {
    return useTransactionalDatabasePersistenceExecutor(
      transactionContext,
      'access',
      async (database) => {
        const grant = await database
          .selectFrom('access_role_assignments')
          .innerJoin('access_roles', (join) => join
            .onRef('access_roles.tenant_id', '=', 'access_role_assignments.tenant_id')
            .onRef('access_roles.role_id', '=', 'access_role_assignments.role_id'))
          .innerJoin('access_role_capabilities', (join) => join
            .onRef('access_role_capabilities.tenant_id', '=', 'access_roles.tenant_id')
            .onRef('access_role_capabilities.role_id', '=', 'access_roles.role_id'))
          .select('access_role_assignments.assignment_id')
          .where('access_role_assignments.tenant_id', '=', scope.tenantId)
          .where('access_role_assignments.user_id', '=', scope.userId)
          .where('access_role_assignments.assignment_scope', '=', 'TENANT_WIDE')
          .where('access_role_assignments.branch_id', 'is', null)
          .where('access_role_assignments.status', '=', 'active')
          .where('access_role_assignments.revoked_at', 'is', null)
          .where('access_roles.status', '=', 'active')
          .where('access_role_capabilities.capability_code', '=', capability)
          .forShare([
            'access_role_assignments',
            'access_roles',
            'access_role_capabilities',
          ])
          .executeTakeFirst();
        return grant !== undefined;
      },
    );
  }
}
