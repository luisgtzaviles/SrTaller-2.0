import {
  useTransactionalDatabasePersistenceExecutor,
} from '../../../../infrastructure/database/database-persistence-capability.js';
import type { DatabaseConnection } from '../../../../infrastructure/database/database-connection.js';
import { runInTransaction } from '../../../../infrastructure/database/transaction-runner.js';
import type {
  TenantBootstrapAccessWriterPort,
  TenantBootstrapScope,
  TenantBootstrapTransactionPort,
} from '../../application/ports/tenant-bootstrap-access-writer.port.js';
import { STARTER_TENANT_ADMIN_POLICY } from '../../domain/tenant-admin-policy.js';

export class KyselyTenantBootstrapAccessWriter implements TenantBootstrapAccessWriterPort {
  async createVerifiedAdminIdentity(
    scope: TenantBootstrapScope,
    input: Parameters<TenantBootstrapAccessWriterPort['createVerifiedAdminIdentity']>[1],
    transactionContext: object,
  ): Promise<void> {
    await useTransactionalDatabasePersistenceExecutor(
      transactionContext,
      'access',
      async (database) => {
        const verifiedAt = new Date(input.verifiedAt);
        await database.insertInto('access_admin_identities').values({
          tenant_id: scope.tenantId,
          admin_identity_id: input.adminIdentityId,
          user_id: input.userId,
          normalized_email: input.normalizedEmail,
          email_display: input.emailDisplay,
          verified_at: verifiedAt,
          status: 'active',
          identity_version: 0,
          created_at: verifiedAt,
          updated_at: verifiedAt,
        }).execute();
        await database.insertInto('access_admin_password_credentials').values({
          tenant_id: scope.tenantId,
          admin_identity_id: input.adminIdentityId,
          user_id: input.userId,
          status: 'active',
          algorithm: 'argon2id',
          profile_version: input.passwordVerifier.profileVersion,
          pepper_version: input.passwordVerifier.pepperVersion,
          memory_kib: input.passwordVerifier.memoryKiB,
          passes: input.passwordVerifier.passes,
          parallelism: input.passwordVerifier.parallelism,
          salt: input.passwordVerifier.salt,
          verifier: input.passwordVerifier.verifier,
          credential_version: 1,
          session_revision: 1,
          created_at: verifiedAt,
          updated_at: verifiedAt,
          revoked_at: null,
        }).execute();
      },
    );
  }

  async createStarterRole(
    scope: TenantBootstrapScope,
    input: Parameters<TenantBootstrapAccessWriterPort['createStarterRole']>[1],
    transactionContext: object,
  ): Promise<void> {
    await useTransactionalDatabasePersistenceExecutor(transactionContext, 'access', async (database) => {
      const occurredAt = new Date(input.occurredAt);
      await database.insertInto('access_roles').values({
        tenant_id: scope.tenantId,
        role_id: input.starterRoleId,
        role_key: STARTER_TENANT_ADMIN_POLICY.roleKey,
        display_name: STARTER_TENANT_ADMIN_POLICY.displayName,
        description: STARTER_TENANT_ADMIN_POLICY.description,
        status: 'active',
        version: 0,
        management_mode: STARTER_TENANT_ADMIN_POLICY.managementMode,
        policy_version: STARTER_TENANT_ADMIN_POLICY.policyVersion,
        created_at: occurredAt,
        updated_at: occurredAt,
      }).execute();
    });
  }

  async grantStarterCapabilities(
    scope: TenantBootstrapScope,
    input: Parameters<TenantBootstrapAccessWriterPort['grantStarterCapabilities']>[1],
    transactionContext: object,
  ): Promise<void> {
    await useTransactionalDatabasePersistenceExecutor(transactionContext, 'access', async (database) => {
      await database.insertInto('access_role_capabilities').values(
        STARTER_TENANT_ADMIN_POLICY.capabilityCodes.map((capabilityCode) => ({
          tenant_id: scope.tenantId,
          role_id: input.starterRoleId,
          capability_code: capabilityCode,
          created_at: new Date(input.occurredAt),
        })),
      ).execute();
    });
  }

  async assignStarterRole(
    scope: TenantBootstrapScope,
    input: Parameters<TenantBootstrapAccessWriterPort['assignStarterRole']>[1],
    transactionContext: object,
  ): Promise<void> {
    await useTransactionalDatabasePersistenceExecutor(transactionContext, 'access', async (database) => {
      await database.insertInto('access_role_assignments').values({
        tenant_id: scope.tenantId,
        assignment_id: input.starterAssignmentId,
        user_id: input.userId,
        role_id: input.starterRoleId,
        assignment_scope: 'TENANT_WIDE',
        branch_id: null,
        status: 'active',
        version: 0,
        assigned_at: new Date(input.occurredAt),
        revoked_at: null,
      }).execute();
    });
  }

  async recordCompletedEvent(
    scope: TenantBootstrapScope,
    input: Parameters<TenantBootstrapAccessWriterPort['recordCompletedEvent']>[1],
    transactionContext: object,
  ): Promise<void> {
    await useTransactionalDatabasePersistenceExecutor(transactionContext, 'access', async (database) => {
      await database.insertInto('access_admin_security_events').values({
        tenant_id: scope.tenantId,
        event_id: input.eventId,
        user_id: input.userId,
        admin_identity_id: input.adminIdentityId,
        session_id: null,
        event_type: 'TENANT_BOOTSTRAP_COMPLETED',
        result: 'SUCCEEDED',
        reason_code: 'VERIFIED_REGISTRATION_BOOTSTRAPPED',
        correlation_id: input.correlationId,
        occurred_at: new Date(input.occurredAt),
      }).execute();
    });
  }
}

export class KyselyTenantBootstrapTransaction implements TenantBootstrapTransactionPort {
  constructor(private readonly connection: DatabaseConnection) {}

  execute<Result>(
    operation: (transactionContext: object) => Promise<Result>,
  ): Promise<Result> {
    return runInTransaction(
      this.connection,
      { isolationLevel: 'serializable' },
      operation,
    );
  }
}
