import type { AuthenticatedIdentity } from '../../application/ports.js';

export interface SyntheticHttpRequest {
  readonly headers: Readonly<Record<string, string | string[] | undefined>>;
  syntheticIdentity?: AuthenticatedIdentity;
  serverCorrelationId?: string;
  clientCorrelationIdCandidate?: string;
}

export function singleHeader(
  headers: SyntheticHttpRequest['headers'],
  name: string,
): string | undefined {
  const value = headers[name];
  return Array.isArray(value) ? value[0] : value;
}
