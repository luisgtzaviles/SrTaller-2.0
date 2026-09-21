export const ADMIN_RECOVERY_CHALLENGE_TTL_MS = 30 * 60 * 1_000;

export type AdminRecoveryChallengeStatus =
  | 'active'
  | 'consumed'
  | 'expired'
  | 'cancelled';

export interface AdminRecoveryChallengeRecord {
  readonly tenantId: string;
  readonly challengeId: string;
  readonly adminIdentityId: string;
  readonly userId: string;
  readonly identityVersion: number;
  readonly credentialVersion: number;
  readonly status: AdminRecoveryChallengeStatus;
  readonly version: number;
  readonly issuedAt: string;
  readonly expiresAt: string;
  readonly consumedAt: string | null;
}

export function adminRecoveryChallengeIsActive(
  challenge: Pick<AdminRecoveryChallengeRecord, 'status' | 'expiresAt'>,
  occurredAt: string,
): boolean {
  return challenge.status === 'active' && Date.parse(occurredAt) < Date.parse(challenge.expiresAt);
}
