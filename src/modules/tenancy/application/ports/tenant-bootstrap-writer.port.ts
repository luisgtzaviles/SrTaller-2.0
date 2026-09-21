export type TenantBootstrapJournalRecord = Readonly<{
  verifiedRegistrationId: string;
  registrationRevision: number;
  approvedInputDigest: Uint8Array;
  tenantId: string;
  firstUserId: string;
  adminIdentityId: string;
  starterRoleId: string;
  starterPolicyVersion: number;
  starterAssignmentId: string;
  resultTenantStatus: 'ONBOARDING';
  completedAt: string;
}>;

export interface TenantBootstrapScope {
  readonly tenantId: string;
}

export interface TenantBootstrapWriterPort {
  lockAndFind(
    scope: TenantBootstrapScope,
    verifiedRegistrationId: string,
    occurredAt: string,
    transactionContext: object,
  ): Promise<TenantBootstrapJournalRecord | null>;
  createTenant(
    scope: TenantBootstrapScope,
    input: Readonly<{
      displayName: string;
      occurredAt: string;
    }>,
    transactionContext: object,
  ): Promise<void>;
  complete(
    scope: TenantBootstrapScope,
    record: TenantBootstrapJournalRecord,
    transactionContext: object,
  ): Promise<void>;
}
