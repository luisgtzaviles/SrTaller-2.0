import type { AdminPasswordStoredVerifier } from './admin-password-hasher.port.js';

export interface TenantBootstrapScope {
  readonly tenantId: string;
}

export interface TenantBootstrapAccessWriterPort {
  createVerifiedAdminIdentity(
    scope: TenantBootstrapScope,
    input: Readonly<{
      userId: string;
      adminIdentityId: string;
      normalizedEmail: string;
      emailDisplay: string;
      verifiedAt: string;
      passwordVerifier: AdminPasswordStoredVerifier;
    }>,
    transactionContext: object,
  ): Promise<void>;
  createStarterRole(
    scope: TenantBootstrapScope,
    input: Readonly<{ starterRoleId: string; occurredAt: string }>,
    transactionContext: object,
  ): Promise<void>;
  grantStarterCapabilities(
    scope: TenantBootstrapScope,
    input: Readonly<{ starterRoleId: string; occurredAt: string }>,
    transactionContext: object,
  ): Promise<void>;
  assignStarterRole(
    scope: TenantBootstrapScope,
    input: Readonly<{
      userId: string;
      starterRoleId: string;
      starterAssignmentId: string;
      occurredAt: string;
    }>,
    transactionContext: object,
  ): Promise<void>;
  recordCompletedEvent(
    scope: TenantBootstrapScope,
    input: Readonly<{
      userId: string;
      adminIdentityId: string;
      eventId: string;
      correlationId: string;
      occurredAt: string;
    }>,
    transactionContext: object,
  ): Promise<void>;
}

export interface TenantBootstrapTransactionPort {
  execute<Result>(
    operation: (transactionContext: object) => Promise<Result>,
  ): Promise<Result>;
}
