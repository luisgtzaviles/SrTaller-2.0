import { randomUUID } from 'node:crypto';

declare const stationIdBrand: unique symbol;

export type StationId = string & { readonly [stationIdBrand]: 'StationId' };
export type StationStatus = 'active' | 'revoked';

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
