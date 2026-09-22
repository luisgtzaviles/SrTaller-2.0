import type { TenantId } from '../../../tenancy/index.js';
import type { CapabilityCode } from '../../domain/capability.js';

/** Revalidates administrative authority inside the mutation transaction. */
export interface AdministrationAuthorizationCommitGuardPort {
  confirmCurrent(
    scope: Readonly<{
      tenantId: TenantId;
      userId: string;
      /** undefined preserves tenant-wide-only semantics for existing callers. */
      branchIds?: readonly string[];
    }>,
    capability: CapabilityCode,
    transactionContext: object,
  ): Promise<boolean>;
  confirmContinuity(
    scope: Readonly<{ tenantId: TenantId; userId: string }>,
    transactionContext: object,
  ): Promise<boolean>;
  confirmEffectiveTenantAdmin(
    tenantId: TenantId,
    transactionContext: object,
  ): Promise<boolean>;
}
