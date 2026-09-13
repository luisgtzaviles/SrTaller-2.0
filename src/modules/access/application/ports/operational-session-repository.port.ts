import type {
  OperationalSessionRecord,
  OperationalSessionStatus,
} from '../../domain/operational-session.js';
import type { OperationalAuthorizationCommitGuardPort } from './operational-authorization-commit-guard.port.js';

export interface OperationalSessionPersistenceScope {
  readonly tenantId: string;
  readonly branchId: string;
  readonly stationId: string;
  readonly stationCredentialId: string;
}

export interface OperationalSessionTenantScope {
  readonly tenantId: string;
}

export class OperationalSessionAdmissionError extends Error {
  constructor() {
    super('Operational Session admission predicates changed.');
    this.name = 'OperationalSessionAdmissionError';
  }
}

export interface OperationalSessionRepositoryPort
  extends OperationalAuthorizationCommitGuardPort {
  createForProfile(
    scope: OperationalSessionPersistenceScope,
    input: Readonly<{
      sessionId: string;
      userId: string;
      userVersion: number;
      userAdmissionRevision: number;
      credentialVersion: number;
      bearerVerifier: Uint8Array;
      csrfVerifier: Uint8Array;
      expectedSessionId: string | null;
      occurredAt: string;
      expiresAt: string;
    }>,
  ): Promise<OperationalSessionRecord>;

  invalidateOne(
    scope: OperationalSessionTenantScope,
    input: Readonly<{
      sessionId: string;
      expectedVersion: number;
      occurredAt: string;
    }>,
  ): Promise<boolean>;

  invalidateByUser(
    scope: OperationalSessionTenantScope,
    input: Readonly<{ userId: string; occurredAt: string }>,
  ): Promise<number>;

  invalidateByStation(
    scope: OperationalSessionTenantScope,
    input: Readonly<{ stationId: string; occurredAt: string }>,
  ): Promise<number>;

  invalidateByCredentialVersion(
    scope: OperationalSessionTenantScope,
    input: Readonly<{
      userId: string;
      credentialVersion: number;
      occurredAt: string;
    }>,
  ): Promise<number>;

  findByBearerVerifier(
    scope: OperationalSessionPersistenceScope,
    bearerVerifier: Uint8Array,
  ): Promise<Readonly<OperationalSessionRecord & { csrfVerifier: Uint8Array }> | null>;

  confirmActive(
    scope: OperationalSessionPersistenceScope,
    input: Readonly<{
      sessionId: string;
      expectedVersion: number;
      occurredAt: string;
      recordActivity: boolean;
    }>,
  ): Promise<Readonly<OperationalSessionRecord & { displayName: string }> | null>;

  close(
    scope: OperationalSessionPersistenceScope,
    input: Readonly<{
      sessionId: string;
      expectedVersion: number;
      status: Exclude<OperationalSessionStatus, 'active'>;
      occurredAt: string;
    }>,
  ): Promise<boolean>;

  closeAuthenticated(
    scope: OperationalSessionPersistenceScope,
    input: Readonly<{
      bearerVerifier: Uint8Array;
      csrfVerifier: Uint8Array;
      status: Exclude<OperationalSessionStatus, 'active'>;
      occurredAt: string;
    }>,
  ): Promise<boolean>;

  isPinCredentialCurrent(
    scope: OperationalSessionPersistenceScope,
    userId: string,
    credentialVersion: number,
  ): Promise<boolean>;
}
