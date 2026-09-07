import { timingSafeEqual } from 'node:crypto';

import type { PinAuthenticationProof } from './pin-credential.js';

export const OPERATIONAL_SESSION_IDLE_MS = 60 * 60 * 1_000;
export const OPERATIONAL_SESSION_ABSOLUTE_MS = 12 * 60 * 60 * 1_000;

export type OperationalSessionStatus =
  | 'active'
  | 'expired'
  | 'invalidated'
  | 'logged_out'
  | 'replaced';

export interface OperationalSessionRecord {
  readonly sessionId: string;
  readonly tenantId: string;
  readonly branchId: string;
  readonly stationId: string;
  readonly branchAdmissionRevision: number;
  readonly stationAdmissionRevision: number;
  readonly stationBindingAdmissionRevision: number;
  readonly stationCredentialAdmissionRevision: number;
  readonly userId: string;
  readonly userVersion: number;
  readonly userAdmissionRevision: number;
  readonly credentialVersion: number;
  readonly status: OperationalSessionStatus;
  readonly version: number;
  readonly issuedAt: string;
  readonly lastActivityAt: string;
  readonly expiresAt: string;
  readonly endedAt: string | null;
}

export interface OperationalSessionContext extends OperationalSessionRecord {
  readonly displayName: string;
  readonly status: 'active';
}

export interface OperationalSessionTokenMaterial {
  readonly bearer: string;
  readonly bearerVerifier: Uint8Array;
  readonly csrf: string;
  readonly csrfVerifier: Uint8Array;
}

interface SessionStationScope {
  readonly tenantId: string;
  readonly branchId: string;
  readonly stationId: string;
  readonly stationCredentialId: string;
  readonly branchAdmissionRevision: number;
  readonly stationAdmissionRevision: number;
  readonly stationBindingAdmissionRevision: number;
  readonly stationCredentialAdmissionRevision: number;
}

const canonicalUuid =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/u;

export function assertSessionId(value: string): string {
  if (!canonicalUuid.test(value)) throw new TypeError('Session identifier is invalid.');
  return value;
}

export function proofMatchesContext(
  proof: PinAuthenticationProof,
  context: SessionStationScope,
): boolean {
  return proof.tenantId === context.tenantId &&
    proof.branchId === context.branchId &&
    proof.stationId === context.stationId &&
    proof.stationCredentialId === context.stationCredentialId &&
    proof.branchAdmissionRevision === context.branchAdmissionRevision &&
    proof.stationAdmissionRevision === context.stationAdmissionRevision &&
    proof.stationBindingAdmissionRevision === context.stationBindingAdmissionRevision &&
    proof.stationCredentialAdmissionRevision === context.stationCredentialAdmissionRevision;
}

export function verifierEquals(left: Uint8Array, right: Uint8Array): boolean {
  return left.byteLength === right.byteLength &&
    timingSafeEqual(Buffer.from(left), Buffer.from(right));
}
