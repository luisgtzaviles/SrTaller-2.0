import { createHash } from 'node:crypto';

/**
 * Development/test-only bootstrap material. Production enrollment is PBI-031.
 * It deliberately refuses all non-development runtimes and never returns a
 * secret to transport code.
 */
export function localStationBootstrapCredential(
  environment: Readonly<Record<string, string | undefined>>,
): string {
  if (environment.NODE_ENV !== 'development' || environment.SR_DB_ENVIRONMENT !== 'development') {
    throw new Error('Local station bootstrap is unavailable outside development.');
  }
  const value = environment.SR_STATION_BOOTSTRAP_SECRET;
  if (typeof value !== 'string' || value.length < 32 || value !== value.trim()) {
    throw new Error('Local station bootstrap secret is required.');
  }
  return createHash('sha256')
    .update(`srtaller-local-station-bootstrap:${value}`, 'utf8')
    .digest('base64url');
}
