import type { AdminPasswordVerifier } from '../../../access/index.js';
import type { RegistrationAttemptStatus } from '../../domain/registration-attempt.js';

export type RegistrationAttemptRecord = Readonly<{
  registrationAttemptId: string;
  status: RegistrationAttemptStatus;
  personDisplayName: string;
  workshopDisplayName: string;
  normalizedEmail: string;
  emailDisplay: string;
  tenantId: string;
  firstUserId: string;
  adminIdentityId: string;
  acceptanceEvidenceId: string;
  approvedInputDigest: Uint8Array;
  registrationRevision: number;
  passwordVerifier: AdminPasswordVerifier | null;
  expiresAt: string;
  verifiedAt: string | null;
  consumedAt: string | null;
  version: number;
}>;

export type RegistrationChallengeRecord = Readonly<{
  challengeId: string;
  registrationAttemptId: string;
  status: 'ACTIVE' | 'CONSUMED' | 'SUPERSEDED' | 'EXPIRED';
  failureCount: number;
  expiresAt: string;
  version: number;
}>;

export interface RegistrationRepositoryPort {
  findActiveByEmail(normalizedEmail: string, now: string): Promise<RegistrationAttemptRecord | null>;
  findAttempt(registrationAttemptId: string): Promise<RegistrationAttemptRecord | null>;
  create(input: Readonly<{
    attempt: RegistrationAttemptRecord;
    documents: readonly Readonly<{ documentKey: 'terms' | 'privacy'; documentVersion: string }>[];
    challenge: Readonly<{ challengeId: string; tokenDigest: Uint8Array; expiresAt: string }>;
    dispatch: Readonly<{ deliveryId: string; challengeId: string }>;
    occurredAt: string;
  }>): Promise<'CREATED' | 'ACTIVE_EMAIL_EXISTS' | 'ADMIN_IDENTITY_EXISTS'>;
  rotateChallenge(input: Readonly<{
    normalizedEmail: string;
    challengeId: string;
    tokenDigest: Uint8Array;
    challengeExpiresAt: string;
    deliveryId: string;
    occurredAt: string;
  }>): Promise<RegistrationAttemptRecord | null>;
  consumeChallenge(input: Readonly<{
    tokenDigest: Uint8Array;
    occurredAt: string;
  }>): Promise<Readonly<{
    outcome: 'VERIFIED' | 'REPLAY' | 'INVALID_OR_EXPIRED';
    attempt: RegistrationAttemptRecord | null;
  }>>;
  markConsumed(input: Readonly<{
    registrationAttemptId: string;
    expectedVersion: number;
    tenantId: string;
    userId: string;
    occurredAt: string;
  }>): Promise<RegistrationAttemptRecord | null>;
  recordDispatch(input: Readonly<{
    deliveryId: string;
    status: 'DELIVERED' | 'FAILED';
    providerReference: string | null;
    providerReasonCode: string | null;
    occurredAt: string;
  }>): Promise<void>;
  consumeActionLimit(input: Readonly<{
    principalDigest: Uint8Array;
    action: 'REGISTER' | 'RESEND' | 'VERIFY';
    occurredAt: string;
    windowMs: number;
    maximum: number;
    cooldownMs: number;
  }>): Promise<boolean>;
  recordSecurityEvent(input: Readonly<{
    eventId: string;
    registrationAttemptId: string | null;
    eventType: string;
    result: 'SUCCEEDED' | 'DENIED' | 'FAILED';
    reasonCode: string;
    correlationId: string;
    occurredAt: string;
  }>): Promise<void>;
}
