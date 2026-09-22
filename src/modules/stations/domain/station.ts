import { randomUUID } from 'node:crypto';

declare const stationIdBrand: unique symbol;

export type StationId = string & { readonly [stationIdBrand]: 'StationId' };
export type StationStatus = 'unlinked' | 'active' | 'revoked';

export type StationDisplayName = string & { readonly __stationDisplayName: true };

export function parseStationDisplayName(value: unknown): StationDisplayName {
  if (typeof value !== 'string') throw new TypeError('Station display name is required.');
  const normalized = value.trim().replace(/\s+/gu, ' ');
  if (normalized.length < 1 || normalized.length > 120 || /[\u0000-\u001f\u007f]/u.test(normalized)) {
    throw new TypeError('Station display name is invalid.');
  }
  return normalized as StationDisplayName;
}

const canonicalUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/u;

export function parseStationId(value: unknown): StationId {
  if (typeof value !== 'string' || !canonicalUuid.test(value)) {
    throw new TypeError('Station ID must be a canonical UUID.');
  }
  return value as StationId;
}

export function createStationId(): StationId {
  return parseStationId(randomUUID());
}
