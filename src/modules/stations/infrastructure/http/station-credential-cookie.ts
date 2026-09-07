import { randomBytes } from 'node:crypto';

export const stationCredentialCookieName = 'sr_station';

function isOpaqueStationCredential(value: string): boolean {
  return /^[A-Za-z0-9_-]{43,128}$/u.test(value);
}

/** Creates a high-entropy bearer credential; callers persist only its verifier. */
export function createStationCredential(): string {
  return randomBytes(32).toString('base64url');
}

export function readStationCredentialCookie(
  header: string | undefined,
): string | null {
  if (typeof header !== 'string' || header.length > 8_192) return null;
  const found = header
    .split(';')
    .map((part) => part.trim())
    .filter((part) => part.startsWith(`${stationCredentialCookieName}=`));
  if (found.length === 0) return null;
  if (found.length !== 1) return null;
  const value = found[0]!.slice(stationCredentialCookieName.length + 1);
  return isOpaqueStationCredential(value) ? value : null;
}

/**
 * Enrollment is deferred to PBI-031. This serializer fixes the browser
 * transport contract without introducing an enrollment endpoint.
 */
export function serializeStationCredentialCookie(
  credential: string,
  secure: boolean,
): string {
  if (!isOpaqueStationCredential(credential)) {
    throw new TypeError('Station credential must be an opaque high-entropy value.');
  }
  return [
    `${stationCredentialCookieName}=${credential}`,
    'HttpOnly',
    'SameSite=Strict',
    'Path=/',
    ...(secure ? ['Secure'] : []),
  ].join('; ');
}
