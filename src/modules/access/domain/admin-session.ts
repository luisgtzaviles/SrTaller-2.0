export const ADMIN_SESSION_IDLE_MS = 30 * 60 * 1_000;
export const ADMIN_SESSION_ABSOLUTE_MS = 12 * 60 * 60 * 1_000;
export const ADMIN_SESSION_REAUTHENTICATION_MS = 10 * 60 * 1_000;
export const ADMIN_SESSION_ACTIVITY_TOUCH_INTERVAL_MS = 5_000;

export type AdminSessionStatus = 'active' | 'expired' | 'logged_out' | 'revoked';

export interface AdminSessionRecord {
  readonly tenantId: string;
  readonly sessionId: string;
  readonly userId: string;
  readonly adminIdentityId: string;
  readonly userAdmissionRevision: number;
  readonly identityVersion: number;
  readonly credentialVersion: number;
  readonly sessionRevision: number;
  readonly status: AdminSessionStatus;
  readonly version: number;
  readonly issuedAt: string;
  readonly lastActivityAt: string;
  readonly expiresAt: string;
  readonly reauthenticatedAt: string | null;
  readonly endedAt: string | null;
}

export interface AdminSessionContext extends AdminSessionRecord {
  readonly displayName: string;
  readonly status: 'active';
}

export interface AdminSessionTokenMaterial {
  readonly bearer: string;
  readonly bearerVerifier: Uint8Array;
  readonly csrf: string;
  readonly csrfVerifier: Uint8Array;
}

export function adminSessionIsTemporallyActive(
  session: Pick<AdminSessionRecord, 'issuedAt' | 'lastActivityAt' | 'expiresAt' | 'status'>,
  occurredAt: string,
): boolean {
  const now = Date.parse(occurredAt);
  return session.status === 'active' &&
    Number.isFinite(now) &&
    now < Date.parse(session.expiresAt) &&
    now - Date.parse(session.lastActivityAt) < ADMIN_SESSION_IDLE_MS;
}

export function adminSessionHasRecentReauthentication(
  session: Pick<AdminSessionRecord, 'reauthenticatedAt' | 'status'>,
  occurredAt: string,
): boolean {
  if (session.status !== 'active' || session.reauthenticatedAt === null) return false;
  const elapsed = Date.parse(occurredAt) - Date.parse(session.reauthenticatedAt);
  return Number.isFinite(elapsed) && elapsed >= 0 && elapsed < ADMIN_SESSION_REAUTHENTICATION_MS;
}
