import type { AdminPasswordStoredVerifier } from './admin-password-hasher.port.js';
import type { AdminSessionRecord } from '../../domain/admin-session.js';

export type AdminCredentialRecord = Readonly<{
  tenantId: string;
  adminIdentityId: string;
  userId: string;
  normalizedEmail: string;
  emailDisplay: string;
  verifiedAt: string | null;
  identityStatus: 'active' | 'revoked';
  identityVersion: number;
  credentialStatus: 'active' | 'revoked';
  credentialVersion: number;
  sessionRevision: number;
  password: AdminPasswordStoredVerifier;
}>;

export type AdminSecurityEventType =
  | 'ADMIN_LOGIN_SUCCEEDED'
  | 'ADMIN_LOGIN_BLOCKED'
  | 'ADMIN_LOGOUT'
  | 'ADMIN_SESSION_REVOKED'
  | 'ADMIN_SESSIONS_REVOKED'
  | 'ADMIN_REAUTHENTICATED'
  | 'ADMIN_PASSWORD_CHANGED'
  | 'ADMIN_RECOVERY_COMPLETED';

export interface AdminAuthRepositoryPort {
  confirmCurrent(
    session: AdminSessionRecord,
    occurredAt: string,
    requireRecentReauthentication: boolean,
    transactionContext: object,
  ): Promise<boolean>;
  findCredentialByEmail(normalizedEmail: string): Promise<AdminCredentialRecord | null>;
  findCredential(tenantId: string, adminIdentityId: string): Promise<AdminCredentialRecord | null>;
  provisionVerifiedIdentity(input: Readonly<{
    tenantId: string;
    adminIdentityId: string;
    userId: string;
    normalizedEmail: string;
    emailDisplay: string;
    password: AdminPasswordStoredVerifier;
    occurredAt: string;
  }>): Promise<AdminCredentialRecord>;
  createSession(input: Readonly<{
    tenantId: string;
    sessionId: string;
    userId: string;
    adminIdentityId: string;
    userAdmissionRevision: number;
    identityVersion: number;
    credentialVersion: number;
    sessionRevision: number;
    bearerVerifier: Uint8Array;
    csrfVerifier: Uint8Array;
    occurredAt: string;
    expiresAt: string;
    correlationId: string;
  }>): Promise<AdminSessionRecord>;
  findSessionByBearerVerifier(verifier: Uint8Array): Promise<Readonly<AdminSessionRecord & { csrfVerifier: Uint8Array }> | null>;
  listSessions(tenantId: string, userId: string): Promise<readonly AdminSessionRecord[]>;
  isAttemptBlocked(principalDigest: Uint8Array, occurredAt: string): Promise<boolean>;
  touchSession(input: Readonly<{
    tenantId: string;
    sessionId: string;
    expectedVersion: number;
    occurredAt: string;
  }>): Promise<AdminSessionRecord | null>;
  endSession(input: Readonly<{
    tenantId: string;
    sessionId: string;
    expectedVersion: number;
    status: 'expired' | 'logged_out' | 'revoked';
    occurredAt: string;
    correlationId: string;
    eventType: 'ADMIN_LOGOUT' | 'ADMIN_SESSION_REVOKED';
  }>): Promise<boolean>;
  revokeAll(input: Readonly<{
    tenantId: string;
    adminIdentityId: string;
    currentSessionId: string;
    expectedSessionVersion: number;
    expectedSessionRevision: number;
    occurredAt: string;
    correlationId: string;
  }>): Promise<number>;
  markReauthenticated(input: Readonly<{
    tenantId: string;
    sessionId: string;
    expectedVersion: number;
    occurredAt: string;
    correlationId: string;
  }>): Promise<AdminSessionRecord | null>;
  recordFailedAttempt(input: Readonly<{
    principalDigest: Uint8Array;
    occurredAt: string;
    correlationId: string;
    knownPrincipal: Readonly<{
      tenantId: string;
      userId: string;
      adminIdentityId: string;
    }> | null;
  }>): Promise<Readonly<{ blocked: boolean; blockedUntil: string | null }>>;
  clearFailedAttempts(principalDigest: Uint8Array): Promise<void>;
  issueRecovery(input: Readonly<{
    tenantId: string;
    challengeId: string;
    adminIdentityId: string;
    userId: string;
    identityVersion: number;
    credentialVersion: number;
    tokenVerifier: Uint8Array;
    occurredAt: string;
    expiresAt: string;
  }>): Promise<void>;
  findRecoveryContext(tokenVerifier: Uint8Array): Promise<Readonly<{
    tenantId: string;
    adminIdentityId: string;
  }> | null>;
  completeRecovery(input: Readonly<{
    tokenVerifier: Uint8Array;
    password: AdminPasswordStoredVerifier;
    occurredAt: string;
    correlationId: string;
  }>): Promise<boolean>;
}
