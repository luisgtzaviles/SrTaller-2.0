import { useTransactionalDatabasePersistenceExecutor } from '../../../../infrastructure/database/database-persistence-capability.js';
import type { AdministrationAuthorizationCommitGuardPort } from '../../application/ports/administration-authorization-commit-guard.port.js';
import { PIN_ACTIVE_PEPPER_VERSION } from '../../domain/pin-credential.js';

export class KyselyAdministrationAuthorizationCommitGuard
implements AdministrationAuthorizationCommitGuardPort {
  private static readonly productAdministratorCapabilities = Object.freeze([
    'users.read',
    'users.manage',
    'access_matrix.read',
    'access_matrix.manage',
  ] as const);

  private async hasTenantWideCapability(
    scope: Parameters<AdministrationAuthorizationCommitGuardPort['confirmCurrent']>[0],
    capability: Parameters<AdministrationAuthorizationCommitGuardPort['confirmCurrent']>[1],
    transactionContext: object,
  ): Promise<boolean> {
    const userActive = await useTransactionalDatabasePersistenceExecutor(
      transactionContext,
      'users',
      async (database) => await database
        .selectFrom('users')
        .select('user_id')
        .where('tenant_id', '=', scope.tenantId)
        .where('user_id', '=', scope.userId)
        .where('status', '=', 'active')
        .forShare()
        .executeTakeFirst(),
    );
    if (!userActive) return false;
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

  async confirmCurrent(
    scope: Parameters<AdministrationAuthorizationCommitGuardPort['confirmCurrent']>[0],
    capability: Parameters<AdministrationAuthorizationCommitGuardPort['confirmCurrent']>[1],
    transactionContext: object,
  ): Promise<boolean> {
    return this.hasTenantWideCapability(scope, capability, transactionContext);
  }

  async confirmContinuity(
    scope: Parameters<AdministrationAuthorizationCommitGuardPort['confirmCurrent']>[0],
    transactionContext: object,
  ): Promise<boolean> {
    const activeUsers = await useTransactionalDatabasePersistenceExecutor(
      transactionContext,
      'users',
      async (database) => await database
        .selectFrom('users')
        .select('user_id')
        .where('tenant_id', '=', scope.tenantId)
        .where('status', '=', 'active')
        .forShare()
        .execute(),
    );
    if (activeUsers.length === 0) return false;
    return useTransactionalDatabasePersistenceExecutor(
      transactionContext,
      'access',
      async (database) => {
        const grants = await database
          .selectFrom('access_role_assignments')
          .innerJoin('access_roles', (join) => join
            .onRef('access_roles.tenant_id', '=', 'access_role_assignments.tenant_id')
            .onRef('access_roles.role_id', '=', 'access_role_assignments.role_id'))
          .innerJoin('access_role_capabilities', (join) => join
            .onRef('access_role_capabilities.tenant_id', '=', 'access_roles.tenant_id')
            .onRef('access_role_capabilities.role_id', '=', 'access_roles.role_id'))
          .innerJoin('access_pin_credentials', (join) => join
            .onRef('access_pin_credentials.tenant_id', '=', 'access_role_assignments.tenant_id')
            .onRef('access_pin_credentials.user_id', '=', 'access_role_assignments.user_id'))
          .select([
            'access_role_assignments.user_id',
            'access_role_capabilities.capability_code',
          ])
          .where('access_role_assignments.tenant_id', '=', scope.tenantId)
          .where('access_role_assignments.user_id', 'in', activeUsers.map(({ user_id }) => user_id))
          .where('access_role_assignments.assignment_scope', '=', 'TENANT_WIDE')
          .where('access_role_assignments.branch_id', 'is', null)
          .where('access_role_assignments.status', '=', 'active')
          .where('access_role_assignments.revoked_at', 'is', null)
          .where('access_roles.status', '=', 'active')
          .where('access_pin_credentials.status', '=', 'active')
          .where('access_pin_credentials.pepper_version', '=', PIN_ACTIVE_PEPPER_VERSION)
          .where('access_pin_credentials.revoked_at', 'is', null)
          .where('access_pin_credentials.lookup_digest', 'is not', null)
          .where(
            'access_role_capabilities.capability_code',
            'in',
            KyselyAdministrationAuthorizationCommitGuard.productAdministratorCapabilities,
          )
          .forShare([
            'access_role_assignments',
            'access_roles',
            'access_role_capabilities',
            'access_pin_credentials',
          ])
          .execute();
        const byUser = new Map<string, Set<string>>();
        for (const grant of grants) {
          const capabilities = byUser.get(grant.user_id) ?? new Set<string>();
          capabilities.add(grant.capability_code);
          byUser.set(grant.user_id, capabilities);
        }
        return [...byUser.values()].some((capabilities) =>
          KyselyAdministrationAuthorizationCommitGuard.productAdministratorCapabilities
            .every((capability) => capabilities.has(capability)),
        );
      },
    );
  }

  async confirmEffectiveTenantAdmin(
    tenantId: Parameters<AdministrationAuthorizationCommitGuardPort['confirmEffectiveTenantAdmin']>[0],
    transactionContext: object,
  ): Promise<boolean> {
    const activeUsers = await useTransactionalDatabasePersistenceExecutor(
      transactionContext,
      'users',
      async (database) => await database.selectFrom('users').select('user_id')
        .where('tenant_id', '=', tenantId).where('status', '=', 'active').forShare().execute(),
    );
    if (activeUsers.length === 0) return false;
    return useTransactionalDatabasePersistenceExecutor(
      transactionContext,
      'access',
      async (database) => {
        const record = await database.selectFrom('access_role_assignments as assignment')
          .innerJoin('access_roles as role', (join) => join.onRef('role.tenant_id', '=', 'assignment.tenant_id').onRef('role.role_id', '=', 'assignment.role_id'))
          .innerJoin('access_admin_identities as identity', (join) => join.onRef('identity.tenant_id', '=', 'assignment.tenant_id').onRef('identity.user_id', '=', 'assignment.user_id'))
          .innerJoin('access_admin_password_credentials as credential', (join) => join.onRef('credential.tenant_id', '=', 'identity.tenant_id').onRef('credential.admin_identity_id', '=', 'identity.admin_identity_id').onRef('credential.user_id', '=', 'identity.user_id'))
          .select('assignment.assignment_id')
          .where('assignment.tenant_id', '=', tenantId)
          .where('assignment.user_id', 'in', activeUsers.map(({ user_id }) => user_id))
          .where('assignment.assignment_scope', '=', 'TENANT_WIDE').where('assignment.branch_id', 'is', null)
          .where('assignment.status', '=', 'active').where('assignment.revoked_at', 'is', null)
          .where('role.role_key', '=', 'tenant_admin').where('role.management_mode', '=', 'SYSTEM_MANAGED')
          .where('role.policy_version', '=', 1).where('role.status', '=', 'active')
          .where('identity.status', '=', 'active').where('identity.verified_at', 'is not', null)
          .where('credential.status', '=', 'active').where('credential.revoked_at', 'is', null)
          // The protected role is the tenant-scoped serialization key for every
          // mutation that can remove effective Tenant Admin authority.
          .forUpdate('role')
          .forShare(['assignment', 'identity', 'credential']).executeTakeFirst();
        return record !== undefined;
      },
    );
  }
}
