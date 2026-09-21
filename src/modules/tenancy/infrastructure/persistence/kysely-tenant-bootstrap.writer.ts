import {
  useTransactionalDatabasePersistenceExecutor,
} from '../../../../infrastructure/database/database-persistence-capability.js';
import type { TenantBootstrapCommandRow } from '../../../../infrastructure/database/database-types.js';
import type {
  TenantBootstrapJournalRecord,
  TenantBootstrapScope,
  TenantBootstrapWriterPort,
} from '../../application/ports/tenant-bootstrap-writer.port.js';

function mapJournal(row: TenantBootstrapCommandRow): TenantBootstrapJournalRecord {
  return Object.freeze({
    verifiedRegistrationId: row.verified_registration_id,
    registrationRevision: row.registration_revision,
    approvedInputDigest: Uint8Array.from(row.approved_input_digest),
    tenantId: row.tenant_id,
    firstUserId: row.first_user_id,
    adminIdentityId: row.admin_identity_id,
    starterRoleId: row.starter_role_id,
    starterPolicyVersion: row.starter_policy_version,
    starterAssignmentId: row.starter_assignment_id,
    resultTenantStatus: row.result_tenant_status,
    completedAt: row.completed_at.toISOString(),
  });
}

export class KyselyTenantBootstrapWriter implements TenantBootstrapWriterPort {
  async lockAndFind(
    scope: TenantBootstrapScope,
    verifiedRegistrationId: string,
    occurredAt: string,
    transactionContext: object,
  ): Promise<TenantBootstrapJournalRecord | null> {
    return useTransactionalDatabasePersistenceExecutor(
      transactionContext,
      'tenancy',
      async (database) => {
        await database.insertInto('tenant_bootstrap_guards').values({
          verified_registration_id: verifiedRegistrationId,
          created_at: new Date(occurredAt),
        }).onConflict((conflict) =>
          conflict.column('verified_registration_id').doNothing()).execute();
        await database.selectFrom('tenant_bootstrap_guards')
          .select('verified_registration_id')
          .where('verified_registration_id', '=', verifiedRegistrationId)
          .forUpdate()
          .executeTakeFirstOrThrow();
        const row = await database.selectFrom('tenant_bootstrap_commands')
          .selectAll()
          .where('verified_registration_id', '=', verifiedRegistrationId)
          .where('tenant_id', '=', scope.tenantId)
          .executeTakeFirst();
        return row ? mapJournal(row) : null;
      },
    );
  }

  async createTenant(
    scope: TenantBootstrapScope,
    input: Readonly<{ displayName: string; occurredAt: string }>,
    transactionContext: object,
  ): Promise<void> {
    await useTransactionalDatabasePersistenceExecutor(
      transactionContext,
      'tenancy',
      async (database) => {
        const occurredAt = new Date(input.occurredAt);
        await database.insertInto('tenants').values({
          tenant_id: scope.tenantId,
          display_name: input.displayName,
          lifecycle_status: 'ONBOARDING',
          operating_currency: 'MXN',
          version: 0,
          created_at: occurredAt,
          updated_at: occurredAt,
        }).execute();
      },
    );
  }

  async complete(
    scope: TenantBootstrapScope,
    record: TenantBootstrapJournalRecord,
    transactionContext: object,
  ): Promise<void> {
    await useTransactionalDatabasePersistenceExecutor(
      transactionContext,
      'tenancy',
      async (database) => {
        await database.insertInto('tenant_bootstrap_commands').values({
          verified_registration_id: record.verifiedRegistrationId,
          registration_revision: record.registrationRevision,
          approved_input_digest: record.approvedInputDigest,
          tenant_id: scope.tenantId,
          first_user_id: record.firstUserId,
          admin_identity_id: record.adminIdentityId,
          starter_role_id: record.starterRoleId,
          starter_policy_version: record.starterPolicyVersion,
          starter_assignment_id: record.starterAssignmentId,
          result_tenant_status: record.resultTenantStatus,
          completed_at: new Date(record.completedAt),
        }).execute();
      },
    );
  }
}
