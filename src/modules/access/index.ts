import type { StationsModuleContract } from '../stations/index.js';
import type { TenancyModuleContract } from '../tenancy/index.js';
import type { TenantId } from '../tenancy/index.js';
import type { UsersModuleContract } from '../users/index.js';

import type { CapabilityCode } from './domain/capability.js';

export type ProtectedOperationKind = 'read' | 'state-change';

/**
 * Untrusted HTTP evidence. The Access owner validates every field before it
 * resolves authority; consumers cannot supply identity or scope through this
 * contract.
 */
export interface ProtectedRequestEvidence {
  readonly cookieHeader: string | undefined;
  readonly origin: string | undefined;
  readonly host: string | undefined;
  readonly forwardedProto: string | undefined;
  readonly fetchSite: string | undefined;
  readonly contentType: string | undefined;
  readonly csrfToken: string | undefined;
}

/** Fixed requirement selected by the server-owned operation adapter. */
export interface ProtectedOperationRequirement {
  readonly capability: CapabilityCode;
  readonly kind: ProtectedOperationKind;
}

/** Server-owned guard evaluated inside the consumer's effect transaction. */
export interface AuthorizedOperationCommitGuard {
  confirmCurrent(transactionContext: object): Promise<boolean>;
  confirmTemporalCurrent(transactionContext: object): Promise<boolean>;
}

/** Immutable authority composed server-side for one protected operation. */
export interface AuthorizedOperationalContext {
  readonly tenantId: TenantId;
  readonly branchId: string;
  readonly stationId: string;
  readonly sessionId: string;
  readonly userId: string;
  readonly userDisplayName: string;
  readonly capability: CapabilityCode;
  readonly commitGuard: AuthorizedOperationCommitGuard;
}

export type ContextualAuthorizationErrorCode =
  | 'AUTHENTICATION_REQUIRED'
  | 'ACCESS_DENIED';

/** Framework-neutral denial translated only by the consuming HTTP boundary. */
export class ContextualAuthorizationError extends Error {
  constructor(readonly code: ContextualAuthorizationErrorCode) {
    super(code === 'AUTHENTICATION_REQUIRED'
      ? 'Authentication is required.'
      : 'Access is denied.');
    this.name = 'ContextualAuthorizationError';
  }

  toJSON(): Readonly<{
    code: ContextualAuthorizationErrorCode;
    name: string;
  }> {
    return Object.freeze({ code: this.code, name: this.name });
  }
}

export interface ContextualAuthorizationExecutor {
  execute<Result>(
    evidence: ProtectedRequestEvidence,
    requirement: ProtectedOperationRequirement,
    operation: (
      context: AuthorizedOperationalContext,
    ) => Promise<Result>,
  ): Promise<Result>;
}

export const CONTEXTUAL_AUTHORIZATION_EXECUTOR: unique symbol = Symbol(
  'srtaller.access.contextual-authorization-executor',
);

export interface TenantWideAuthorizationExecutor extends ContextualAuthorizationExecutor {}
export const TENANT_WIDE_AUTHORIZATION_EXECUTOR: unique symbol = Symbol(
  'srtaller.access.tenant-wide-authorization-executor',
);

export type SensitiveActionLevel2Code = 'catalog.items.bulk-retire' | 'catalog.suppliers-delete';

export class SensitiveActionReauthenticationError extends Error {
  readonly code = 'REAUTHENTICATION_DENIED';
  constructor() { super('Sensitive action reauthentication was denied.'); this.name = 'SensitiveActionReauthenticationError'; }
}

export interface ReauthenticatedOperationalContext extends AuthorizedOperationalContext {
  readonly sensitiveAction: SensitiveActionLevel2Code;
  readonly sensitivityLevel: 2;
  readonly reauthenticatedAt: string;
}

export interface SensitiveActionLevel2Executor {
  execute<Result>(
    evidence: ProtectedRequestEvidence,
    action: SensitiveActionLevel2Code,
    reauthentication: Readonly<{ pin: unknown }>,
    operation: (context: ReauthenticatedOperationalContext) => Promise<Result>,
  ): Promise<Result>;
}

export const SENSITIVE_ACTION_LEVEL2_EXECUTOR: unique symbol = Symbol(
  'srtaller.access.sensitive-action-level2-executor',
);

/** Compile-time marker for the public access module boundary. */
export interface AccessModuleContract {
  readonly module: 'access';
  readonly stations: StationsModuleContract;
  readonly tenancy: TenancyModuleContract;
  readonly users: UsersModuleContract;
}
