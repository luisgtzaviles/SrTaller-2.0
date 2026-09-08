import type { TenantId } from '../../../tenancy/index.js';
import type { CapabilityCode } from '../../domain/capability.js';

/** Revalidates tenant-wide administrative authority inside the mutation transaction. */
export interface AdministrationAuthorizationCommitGuardPort {
  confirmCurrent(
    scope: Readonly<{ tenantId: TenantId; userId: string }>,
    capability: CapabilityCode,
    transactionContext: object,
  ): Promise<boolean>;
}
