import type { TenantId } from '../../../tenancy/index.js';
import type { PinCredentialId } from '../../domain/pin-credential.js';
import type { AccessUserId } from '../../domain/role-assignment.js';
import type {
  PinSecretMaterial,
  PinStoredVerifier,
} from './pin-secret-hasher.port.js';

type PinCredentialScopedTenantId = string & TenantId;

export interface PinCredentialTenantScope {
  readonly tenantId: PinCredentialScopedTenantId;
}

export interface PinCredentialStationScope {
  readonly tenantId: PinCredentialScopedTenantId;
  readonly branchId: string;
  readonly stationId: string;
}

export type PinCredentialRecord = Readonly<{
  tenantId: TenantId;
  userId: AccessUserId;
  credentialId: PinCredentialId;
  status: 'active' | 'revoked';
  credentialVersion: number;
  createdAt: string;
  updatedAt: string;
  revokedAt: string | null;
}>;

export type PinAttemptResult =
  | Readonly<{ status: 'authenticated'; credentialVersion: number }>
  | Readonly<{ status: 'denied' | 'temporarily-unavailable' }>;

export type PinCredentialPersistenceErrorCode =
  | 'PIN_CREDENTIAL_EXISTS'
  | 'PIN_CREDENTIAL_IDEMPOTENCY_CONFLICT'
  | 'PIN_CREDENTIAL_INPUT_INVALID'
  | 'PIN_CREDENTIAL_PERSISTENCE_FAILED'
  | 'PIN_CREDENTIAL_TENANT_SCOPE_REQUIRED'
  | 'PIN_CREDENTIAL_USER_INVALID';

export class PinCredentialPersistenceError extends Error {
  constructor(readonly code: PinCredentialPersistenceErrorCode) {
    super('PIN credential persistence operation failed.');
    this.name = 'PinCredentialPersistenceError';
  }

  toJSON(): Readonly<{ name: string; code: PinCredentialPersistenceErrorCode }> {
    return Object.freeze({ name: this.name, code: this.code });
  }
}

export interface PinCredentialRepositoryPort {
  provision(
    scope: PinCredentialTenantScope,
    input: Readonly<{
      userId: AccessUserId;
      credentialId: PinCredentialId;
      clientRequestId: string;
      occurredAt: string;
      secret: PinSecretMaterial;
    }>,
  ): Promise<PinCredentialRecord>;

  authenticateAttempt(
    context: PinCredentialStationScope,
    input: Readonly<{
      userId: AccessUserId;
      userEligible: boolean;
      occurredAt: string;
    }>,
    verify: (stored: PinStoredVerifier | null) => Promise<boolean>,
  ): Promise<PinAttemptResult>;
}
