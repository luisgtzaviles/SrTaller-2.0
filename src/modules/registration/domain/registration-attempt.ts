import { createHash } from 'node:crypto';

export const REGISTRATION_CHALLENGE_TTL_MS = 60 * 60 * 1_000;
export const REGISTRATION_ATTEMPT_TTL_MS = 24 * 60 * 60 * 1_000;
export const REGISTRATION_RESEND_COOLDOWN_MS = 60 * 1_000;
export const REGISTRATION_RESEND_LIMIT_PER_HOUR = 5;
export const REGISTRATION_VERIFICATION_FAILURE_LIMIT = 10;

export type RegistrationAttemptStatus =
  | 'PENDING_VERIFICATION'
  | 'VERIFIED'
  | 'CONSUMED'
  | 'EXPIRED';

export type RegistrationChallengeStatus =
  | 'ACTIVE'
  | 'CONSUMED'
  | 'SUPERSEDED'
  | 'EXPIRED';

export type RegistrationDocumentKey = 'terms' | 'privacy';

export type RegistrationPublicResult =
  | 'accepted'
  | 'completed'
  | 'retryable'
  | 'invalid_or_expired';

export class RegistrationInputError extends Error {
  readonly code = 'REGISTRATION_INPUT_INVALID';
  constructor(readonly parameter: string) {
    super('Public registration input is invalid.');
    this.name = 'RegistrationInputError';
  }
}

function requiredText(value: unknown, parameter: string, max: number): string {
  if (typeof value !== 'string') throw new RegistrationInputError(parameter);
  const normalized = value.trim().normalize('NFC').replace(/\s+/gu, ' ');
  if (normalized.length < 1 || normalized.length > max || Buffer.byteLength(normalized, 'utf8') > max * 4) {
    throw new RegistrationInputError(parameter);
  }
  return normalized;
}

export function parseRegistrationDisplayName(value: unknown): string {
  return requiredText(value, 'personName', 160);
}

export function parseWorkshopDisplayName(value: unknown): string {
  return requiredText(value, 'workshopName', 160);
}

export function digestVerificationToken(value: unknown): Uint8Array {
  if (typeof value !== 'string' || !/^[A-Za-z0-9_-]{43}$/u.test(value)) {
    throw new RegistrationInputError('token');
  }
  const decoded = Buffer.from(value, 'base64url');
  if (decoded.byteLength !== 32 || decoded.toString('base64url') !== value) {
    throw new RegistrationInputError('token');
  }
  return createHash('sha256').update(decoded).digest();
}

export function registrationApprovedInputDigest(input: Readonly<{
  personDisplayName: string;
  workshopDisplayName: string;
  normalizedEmail: string;
  acceptanceEvidenceId: string;
}>): Uint8Array {
  const canonical = JSON.stringify({
    acceptanceEvidenceId: input.acceptanceEvidenceId,
    normalizedEmail: input.normalizedEmail,
    personDisplayName: input.personDisplayName,
    workshopDisplayName: input.workshopDisplayName,
  });
  return createHash('sha256').update('srtaller-registration-input\0v1\0').update(canonical).digest();
}

export function isRegistrationAttemptExpired(expiresAt: string, now: Date): boolean {
  const timestamp = Date.parse(expiresAt);
  return !Number.isFinite(timestamp) || timestamp <= now.getTime();
}

