import type { TenantId } from '../../tenancy/index.js';
import type {
  ProtectedOperationKind,
  ProtectedRequestEvidence,
} from '../index.js';

/** Authentication-only authority for a user changing their own data. */
export interface AuthenticatedSelfContext {
  readonly tenantId: TenantId;
  readonly userId: string;
  readonly commitGuard: Readonly<{
    confirmCurrent(transactionContext: object): Promise<boolean>;
  }>;
}

export interface AuthenticatedSelfExecutor {
  execute<Result>(
    evidence: ProtectedRequestEvidence,
    kind: ProtectedOperationKind,
    operation: (context: AuthenticatedSelfContext) => Promise<Result>,
  ): Promise<Result>;
}

export const AUTHENTICATED_SELF_EXECUTOR = Symbol(
  'srtaller.access.authenticated-self-executor',
);
