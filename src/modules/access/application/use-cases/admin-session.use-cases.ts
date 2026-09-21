import { randomUUID, timingSafeEqual } from 'node:crypto';

import type { AuthenticationUserReader } from '../../../users/index.js';
import type { AdminAuthRepositoryPort, AdminCredentialRecord } from '../ports/admin-auth-repository.port.js';
import type { AdminPasswordHasherPort } from '../ports/admin-password-hasher.port.js';
import type { AdminSessionTokenPort } from '../ports/admin-session-token.port.js';
import { normalizeAdminEmail } from '../../domain/admin-identity.js';
import { parseAdminPassword } from '../../domain/admin-password.js';
import { ADMIN_RECOVERY_CHALLENGE_TTL_MS } from '../../domain/admin-recovery.js';
import {
  ADMIN_SESSION_ABSOLUTE_MS,
  ADMIN_SESSION_ACTIVITY_TOUCH_INTERVAL_MS,
  adminSessionHasRecentReauthentication,
  adminSessionIsTemporallyActive,
} from '../../domain/admin-session.js';
import type { AdminSessionContext, AdminSessionRecord, AdminSessionTokenMaterial } from '../../domain/admin-session.js';

export class AdminAuthenticationError extends Error {
  readonly category = 'Authentication';
  readonly code = 'ADMIN_AUTHENTICATION_DENIED';
  constructor() { super('Administrative authentication was not accepted.'); this.name = 'AdminAuthenticationError'; }
}

function deny(): never { throw new AdminAuthenticationError(); }
function equals(left: Uint8Array, right: Uint8Array): boolean { return left.byteLength === right.byteLength && timingSafeEqual(Buffer.from(left), Buffer.from(right)); }

async function activeUser(users: AuthenticationUserReader, credential: AdminCredentialRecord) {
  const user = await users.findAuthenticationUser({ tenantId: credential.tenantId as never }, credential.userId);
  return user?.status === 'active' ? user : null;
}

export class ProvisionAdminIdentityUseCase {
  constructor(private readonly repository: AdminAuthRepositoryPort, private readonly hasher: AdminPasswordHasherPort, private readonly now: () => Date = () => new Date(), private readonly createId: () => string = randomUUID) {}
  async execute(input: Readonly<{ tenantId: string; userId: string; email: unknown; password: unknown }>) {
    const email = normalizeAdminEmail(input.email); const password = parseAdminPassword(input.password); const identityId = this.createId();
    const protectedPassword = await this.hasher.hash({ tenantId: input.tenantId, adminIdentityId: identityId, password });
    return this.repository.provisionVerifiedIdentity({ tenantId: input.tenantId, adminIdentityId: identityId, userId: input.userId, normalizedEmail: email.normalized, emailDisplay: email.display, password: protectedPassword, occurredAt: this.now().toISOString() });
  }
}

export class LoginAdminUseCase {
  constructor(private readonly repository: AdminAuthRepositoryPort, private readonly users: AuthenticationUserReader, private readonly hasher: AdminPasswordHasherPort, private readonly tokens: AdminSessionTokenPort, private readonly now: () => Date = () => new Date(), private readonly createId: () => string = randomUUID) {}
  async execute(input: Readonly<{ email: unknown; password: unknown; correlationId: string }>): Promise<Readonly<{ session: AdminSessionContext; tokens: AdminSessionTokenMaterial }>> {
    let email; let password;
    try { email = normalizeAdminEmail(input.email); password = parseAdminPassword(input.password); } catch { deny(); }
    const now = this.now(); const principal = this.hasher.principalDigest(email.normalized);
    if (await this.repository.isAttemptBlocked(principal, now.toISOString())) deny();
    const credential = await this.repository.findCredentialByEmail(email.normalized);
    const verified = await this.hasher.verify({ tenantId: credential?.tenantId ?? null, adminIdentityId: credential?.adminIdentityId ?? null, password, stored: credential?.password ?? null });
    const user = credential ? await activeUser(this.users, credential) : null;
    if (!verified || !credential || !user || credential.verifiedAt === null || credential.identityStatus !== 'active' || credential.credentialStatus !== 'active') {
      await this.repository.recordFailedAttempt({
        principalDigest: principal,
        occurredAt: now.toISOString(),
        correlationId: input.correlationId,
        knownPrincipal: credential ? {
          tenantId: credential.tenantId,
          userId: credential.userId,
          adminIdentityId: credential.adminIdentityId,
        } : null,
      });
      deny();
    }
    await this.repository.clearFailedAttempts(principal);
    const tokens = this.tokens.issue();
    const row = await this.repository.createSession({ tenantId: credential.tenantId, sessionId: this.createId(), userId: credential.userId, adminIdentityId: credential.adminIdentityId, userAdmissionRevision: user.admissionRevision, identityVersion: credential.identityVersion, credentialVersion: credential.credentialVersion, sessionRevision: credential.sessionRevision, bearerVerifier: tokens.bearerVerifier, csrfVerifier: tokens.csrfVerifier, occurredAt: now.toISOString(), expiresAt: new Date(now.getTime() + ADMIN_SESSION_ABSOLUTE_MS).toISOString(), correlationId: input.correlationId });
    return Object.freeze({ session: Object.freeze({ ...row, status: 'active', displayName: user.displayName }), tokens });
  }
}

export class ResolveAdminSessionUseCase {
  constructor(private readonly repository: AdminAuthRepositoryPort, private readonly users: AuthenticationUserReader, private readonly tokens: AdminSessionTokenPort, private readonly now: () => Date = () => new Date()) {}
  confirmCurrentAtCommit(session: AdminSessionContext, requireRecentReauthentication: boolean, transactionContext: object): Promise<boolean> {
    return this.repository.confirmCurrent(session, this.now().toISOString(), requireRecentReauthentication, transactionContext);
  }
  async execute(input: Readonly<{ bearer: string; csrfCookie: string; csrfHeader?: string; requireCsrf?: boolean; touch?: boolean }>): Promise<AdminSessionContext> {
    let bearer: Uint8Array; let csrf: Uint8Array;
    try { bearer = this.tokens.digestBearer(input.bearer); csrf = this.tokens.digestCsrf(input.csrfCookie); } catch { deny(); }
    if (input.requireCsrf && input.csrfHeader !== input.csrfCookie) deny();
    for (let retry = 0; retry < 3; retry += 1) {
      const row = await this.repository.findSessionByBearerVerifier(bearer); const now = this.now();
      if (!row || !equals(row.csrfVerifier, csrf)) deny();
      if (!adminSessionIsTemporallyActive(row, now.toISOString())) { await this.repository.endSession({ tenantId: row.tenantId, sessionId: row.sessionId, expectedVersion: row.version, status: 'expired', occurredAt: now.toISOString(), correlationId: randomUUID(), eventType: 'ADMIN_SESSION_REVOKED' }); deny(); }
      const credential = await this.repository.findCredential(row.tenantId, row.adminIdentityId); const user = credential ? await activeUser(this.users, credential) : null;
      if (!credential || !user || credential.identityStatus !== 'active' || credential.credentialStatus !== 'active' || credential.identityVersion !== row.identityVersion || credential.credentialVersion !== row.credentialVersion || credential.sessionRevision !== row.sessionRevision || user.admissionRevision !== row.userAdmissionRevision) deny();
      let current: AdminSessionRecord = row;
      if (input.touch !== false && now.getTime() - Date.parse(row.lastActivityAt) >= ADMIN_SESSION_ACTIVITY_TOUCH_INTERVAL_MS) {
        const touched = await this.repository.touchSession({ tenantId: row.tenantId, sessionId: row.sessionId, expectedVersion: row.version, occurredAt: now.toISOString() });
        if (!touched) continue; current = touched;
      }
      return Object.freeze({ ...current, status: 'active', displayName: user.displayName });
    }
    deny();
  }
}

export class AdminSessionManagementUseCase {
  constructor(private readonly repository: AdminAuthRepositoryPort, private readonly hasher: AdminPasswordHasherPort, private readonly now: () => Date = () => new Date()) {}
  list(context: AdminSessionContext) { return this.repository.listSessions(context.tenantId, context.userId); }
  async logout(context: AdminSessionContext, correlationId: string) { if (!await this.repository.endSession({ tenantId: context.tenantId, sessionId: context.sessionId, expectedVersion: context.version, status: 'logged_out', occurredAt: this.now().toISOString(), correlationId, eventType: 'ADMIN_LOGOUT' })) deny(); }
  async revokeOne(context: AdminSessionContext, sessionId: string, correlationId: string) { const target = (await this.repository.listSessions(context.tenantId, context.userId)).find((row) => row.sessionId === sessionId); if (!target || !await this.repository.endSession({ tenantId: context.tenantId, sessionId, expectedVersion: target.version, status: 'revoked', occurredAt: this.now().toISOString(), correlationId, eventType: 'ADMIN_SESSION_REVOKED' })) deny(); }
  async reauthenticate(context: AdminSessionContext, passwordValue: unknown, correlationId: string) { const password = parseAdminPassword(passwordValue); const credential = await this.repository.findCredential(context.tenantId, context.adminIdentityId); if (!credential || !await this.hasher.verify({ tenantId: context.tenantId, adminIdentityId: context.adminIdentityId, password, stored: credential.password })) deny(); const row = await this.repository.markReauthenticated({ tenantId: context.tenantId, sessionId: context.sessionId, expectedVersion: context.version, occurredAt: this.now().toISOString(), correlationId }); if (!row) deny(); return row; }
  async revokeAll(context: AdminSessionContext, correlationId: string) { const occurredAt = this.now().toISOString(); const credential = await this.repository.findCredential(context.tenantId, context.adminIdentityId); if (!credential || !adminSessionHasRecentReauthentication(context, occurredAt)) deny(); const revoked = await this.repository.revokeAll({ tenantId: context.tenantId, adminIdentityId: context.adminIdentityId, currentSessionId: context.sessionId, expectedSessionVersion: context.version, expectedSessionRevision: credential.sessionRevision, occurredAt, correlationId }); if (revoked <= 0) deny(); return revoked; }
}

export class AdminRecoveryFoundationUseCase {
  constructor(private readonly repository: AdminAuthRepositoryPort, private readonly users: AuthenticationUserReader, private readonly hasher: AdminPasswordHasherPort, private readonly tokens: AdminSessionTokenPort, private readonly now: () => Date = () => new Date(), private readonly createId: () => string = randomUUID) {}
  async issue(emailValue: unknown): Promise<string | null> { let email; try { email = normalizeAdminEmail(emailValue); } catch { return null; } const credential = await this.repository.findCredentialByEmail(email.normalized); if (!credential || !await activeUser(this.users, credential) || credential.identityStatus !== 'active' || credential.credentialStatus !== 'active' || credential.verifiedAt === null) return null; const token = this.tokens.issue().bearer; const now = this.now(); await this.repository.issueRecovery({ tenantId: credential.tenantId, challengeId: this.createId(), adminIdentityId: credential.adminIdentityId, userId: credential.userId, identityVersion: credential.identityVersion, credentialVersion: credential.credentialVersion, tokenVerifier: this.tokens.digestBearer(token), occurredAt: now.toISOString(), expiresAt: new Date(now.getTime() + ADMIN_RECOVERY_CHALLENGE_TTL_MS).toISOString() }); return token; }
  async complete(token: string, passwordValue: unknown, correlationId: string): Promise<void> { let verifier; let password; try { verifier = this.tokens.digestBearer(token); password = parseAdminPassword(passwordValue); } catch { deny(); } const context = await this.repository.findRecoveryContext(verifier); if (!context) deny(); const protectedPassword = await this.hasher.hash({ tenantId: context.tenantId, adminIdentityId: context.adminIdentityId, password }); if (!await this.repository.completeRecovery({ tokenVerifier: verifier, password: protectedPassword, occurredAt: this.now().toISOString(), correlationId })) deny(); }
}
