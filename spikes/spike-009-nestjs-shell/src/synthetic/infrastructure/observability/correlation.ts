import { randomUUID } from 'node:crypto';

export interface CorrelationIdentifiers {
  readonly serverCorrelationId: string;
  readonly clientCorrelationIdCandidate?: string;
}

export function normalizeClientCorrelationIdCandidate(candidate: string | undefined): string | undefined {
  if (!candidate) return undefined;
  const normalized = candidate.trim();
  return /^[A-Za-z0-9._:-]{3,80}$/.test(normalized) ? normalized : undefined;
}

export function createCorrelationIdentifiers(candidate: string | undefined): CorrelationIdentifiers {
  const clientCorrelationIdCandidate = normalizeClientCorrelationIdCandidate(candidate);
  return Object.freeze({
    serverCorrelationId: randomUUID(),
    ...(clientCorrelationIdCandidate === undefined ? {} : { clientCorrelationIdCandidate }),
  });
}
