import { inspect } from 'node:util';

declare const stationIdBrand: unique symbol;

export type StationId = string & {
  readonly [stationIdBrand]: 'StationId';
};

export type StationStatus = 'Unlinked' | 'Active' | 'Revoked';
export type StationRevision = number & {
  readonly __stationRevision: 'StationRevision';
};

export interface Station {
  /**
   * Ownership reference only. The stations domain does not import another
   * module; application boundaries validate the canonical TenantId.
   */
  readonly tenantId: string;
  readonly stationId: StationId;
  readonly status: StationStatus;
  readonly revision: StationRevision;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly revokedAt: string | null;
}

export type StationDomainErrorCode =
  | 'STATION_ID_INVALID'
  | 'STATION_REVISION_INVALID'
  | 'STATION_INSTANT_INVALID'
  | 'STATION_INVARIANT_BROKEN'
  | 'STATION_LIFECYCLE_CONFLICT'
  | 'STATION_CONTEXT_STALE';

const canonicalUuid =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/u;

const errorContract = Object.freeze({
  STATION_ID_INVALID: Object.freeze({
    category: 'Validation',
    message: 'Station identifier is invalid.',
  }),
  STATION_REVISION_INVALID: Object.freeze({
    category: 'Validation',
    message: 'Station revision is invalid.',
  }),
  STATION_INSTANT_INVALID: Object.freeze({
    category: 'Validation',
    message: 'Station lifecycle instant is invalid.',
  }),
  STATION_INVARIANT_BROKEN: Object.freeze({
    category: 'Unexpected',
    message: 'Station invariant is not satisfied.',
  }),
  STATION_LIFECYCLE_CONFLICT: Object.freeze({
    category: 'Conflict',
    message: 'Station lifecycle transition conflicts with current state.',
  }),
  STATION_CONTEXT_STALE: Object.freeze({
    category: 'Concurrency',
    message: 'Station context is stale.',
  }),
} satisfies Record<
  StationDomainErrorCode,
  Readonly<{ category: string; message: string }>
>);

export class StationDomainError extends Error {
  readonly category: string;

  constructor(readonly code: StationDomainErrorCode) {
    const contract = errorContract[code];
    super(contract.message);
    this.name = 'StationDomainError';
    this.category = contract.category;
  }

  toJSON(): Readonly<{
    name: 'StationDomainError';
    category: string;
    code: StationDomainErrorCode;
    message: string;
  }> {
    return Object.freeze({
      name: 'StationDomainError',
      category: this.category,
      code: this.code,
      message: this.message,
    });
  }

  [inspect.custom](): ReturnType<StationDomainError['toJSON']> {
    return this.toJSON();
  }
}

export function parseStationId(value: unknown): StationId {
  if (typeof value !== 'string' || !canonicalUuid.test(value)) {
    throw new StationDomainError('STATION_ID_INVALID');
  }
  return value as StationId;
}

export function parseStationRevision(value: unknown): StationRevision {
  if (!Number.isSafeInteger(value) || Number(value) < 1) {
    throw new StationDomainError('STATION_REVISION_INVALID');
  }
  return value as StationRevision;
}

function parseInstant(value: unknown): string {
  if (typeof value !== 'string') {
    throw new StationDomainError('STATION_INSTANT_INVALID');
  }
  const instant = new Date(value);
  if (!Number.isFinite(instant.getTime()) || instant.toISOString() !== value) {
    throw new StationDomainError('STATION_INSTANT_INVALID');
  }
  return value;
}

function assertChronology(createdAt: string, updatedAt: string): void {
  if (new Date(updatedAt).getTime() < new Date(createdAt).getTime()) {
    throw new StationDomainError('STATION_INVARIANT_BROKEN');
  }
}

export function hydrateStation(input: Station): Station {
  const stationId = parseStationId(input.stationId);
  const revision = parseStationRevision(input.revision);
  const createdAt = parseInstant(input.createdAt);
  const updatedAt = parseInstant(input.updatedAt);
  assertChronology(createdAt, updatedAt);
  if (
    !['Unlinked', 'Active', 'Revoked'].includes(input.status) ||
    (input.status === 'Revoked') !== (input.revokedAt !== null)
  ) {
    throw new StationDomainError('STATION_INVARIANT_BROKEN');
  }
  const revokedAt =
    input.revokedAt === null ? null : parseInstant(input.revokedAt);
  if (
    revokedAt !== null &&
    new Date(revokedAt).getTime() < new Date(createdAt).getTime()
  ) {
    throw new StationDomainError('STATION_INVARIANT_BROKEN');
  }
  return Object.freeze({
    tenantId: input.tenantId,
    stationId,
    status: input.status,
    revision,
    createdAt,
    updatedAt,
    revokedAt,
  });
}

export function createStation(input: Readonly<{
  tenantId: string;
  stationId: StationId;
  createdAt: string;
}>): Station {
  return hydrateStation({
    tenantId: input.tenantId,
    stationId: input.stationId,
    status: 'Unlinked',
    revision: parseStationRevision(1),
    createdAt: input.createdAt,
    updatedAt: input.createdAt,
    revokedAt: null,
  });
}

function assertExpectedRevision(
  station: Station,
  expectedRevision: StationRevision,
): void {
  if (station.revision !== expectedRevision) {
    throw new StationDomainError('STATION_CONTEXT_STALE');
  }
}

function transition(
  station: Station,
  expectedRevision: StationRevision,
  status: StationStatus,
  updatedAt: string,
  revokedAt: string | null,
): Station {
  assertExpectedRevision(station, expectedRevision);
  return hydrateStation({
    ...station,
    status,
    revision: parseStationRevision(station.revision + 1),
    updatedAt,
    revokedAt,
  });
}

export function linkStation(
  station: Station,
  expectedRevision: StationRevision,
  linkedAt: string,
): Station {
  if (station.status !== 'Unlinked') {
    throw new StationDomainError('STATION_LIFECYCLE_CONFLICT');
  }
  return transition(station, expectedRevision, 'Active', linkedAt, null);
}

export function unlinkStation(
  station: Station,
  expectedRevision: StationRevision,
  unlinkedAt: string,
): Station {
  if (station.status !== 'Active') {
    throw new StationDomainError('STATION_LIFECYCLE_CONFLICT');
  }
  return transition(station, expectedRevision, 'Unlinked', unlinkedAt, null);
}

export function revokeStation(
  station: Station,
  expectedRevision: StationRevision,
  revokedAt: string,
): Station {
  if (station.status === 'Revoked') {
    throw new StationDomainError('STATION_LIFECYCLE_CONFLICT');
  }
  return transition(
    station,
    expectedRevision,
    'Revoked',
    revokedAt,
    revokedAt,
  );
}
