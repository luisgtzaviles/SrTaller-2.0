import type {
  OperationalSessionRecord,
  OperationalSessionStatus,
} from '../../domain/operational-session.js';

export interface OperationalSessionPersistenceScope {
  readonly tenantId: string;
  readonly branchId: string;
  readonly stationId: string;
  readonly stationCredentialId: string;
}

export class OperationalSessionAdmissionError extends Error {
  constructor() {
    super('Operational Session admission predicates changed.');
    this.name = 'OperationalSessionAdmissionError';
  }
}

export interface OperationalSessionRepositoryPort {
  createReplacingActive(
    scope: OperationalSessionPersistenceScope,
    input: Readonly<{
      sessionId: string;
      userId: string;
      userVersion: number;
      userAdmissionRevision: number;
      credentialVersion: number;
      bearerVerifier: Uint8Array;
      csrfVerifier: Uint8Array;
      occurredAt: string;
      expiresAt: string;
    }>,
  ): Promise<OperationalSessionRecord>;

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

  isPinCredentialCurrent(
    scope: OperationalSessionPersistenceScope,
    userId: string,
    credentialVersion: number,
  ): Promise<boolean>;
}
