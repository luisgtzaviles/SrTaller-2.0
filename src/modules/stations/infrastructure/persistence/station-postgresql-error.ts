import { StationPersistenceError } from '../../application/ports/station-persistence.error.js';

export type StationPostgresqlOperation =
  | 'create-station'
  | 'find-station'
  | 'lock-station'
  | 'transition-station'
  | 'create-open-binding'
  | 'find-open-binding'
  | 'lock-open-binding'
  | 'close-open-binding'
  | 'list-bindings';

type DriverErrorShape = Readonly<{
  code: string;
  constraint: string;
}>;

const diagnostics = new WeakMap<
  StationPersistenceError,
  DriverErrorShape
>();

const knownForeignKeys = Object.freeze({
  'create-station': new Map([
    ['stations_tenant_fk', 'requested-reference'],
  ]),
  'create-open-binding': new Map([
    ['station_bindings_station_fk', 'persisted-integrity'],
    ['station_bindings_branch_fk', 'persisted-integrity'],
  ]),
} satisfies Partial<
  Record<
    StationPostgresqlOperation,
    ReadonlyMap<string, 'persisted-integrity' | 'requested-reference'>
  >
>);

function driverShape(error: unknown): DriverErrorShape {
  if (typeof error !== 'object' || error === null) {
    return Object.freeze({ code: '', constraint: '' });
  }
  const candidate = error as Readonly<Record<string, unknown>>;
  return Object.freeze({
    code: typeof candidate.code === 'string' ? candidate.code : '',
    constraint:
      typeof candidate.constraint === 'string' ? candidate.constraint : '',
  });
}

function translated(
  error: unknown,
  driver: DriverErrorShape,
  code: ConstructorParameters<typeof StationPersistenceError>[0],
  retryable: ConstructorParameters<typeof StationPersistenceError>[1],
): StationPersistenceError {
  const result = new StationPersistenceError(code, retryable, error);
  diagnostics.set(result, driver);
  return result;
}

export function readStationPostgresqlDiagnostic(
  error: StationPersistenceError,
): DriverErrorShape | null {
  return diagnostics.get(error) ?? null;
}

export function translateStationPostgresqlError(
  error: unknown,
  operation: StationPostgresqlOperation,
): StationPersistenceError {
  if (error instanceof StationPersistenceError) {
    return error;
  }
  const driver = driverShape(error);
  if (driver.code === '23505') {
    return translated(
      error,
      driver,
      'STATION_PERSISTENCE_CONFLICT',
      'never',
    );
  }
  if (driver.code === '23503') {
    const meaning = knownForeignKeys[
      operation as keyof typeof knownForeignKeys
    ]?.get(driver.constraint);
    return translated(
      error,
      driver,
      meaning === 'requested-reference'
        ? 'STATION_PERSISTENCE_REFERENCE_NOT_FOUND'
        : 'STATION_PERSISTENCE_INVARIANT_BROKEN',
      'never',
    );
  }
  if (
    driver.code === '23502' ||
    driver.code === '23514' ||
    driver.code === '22P02'
  ) {
    return translated(
      error,
      driver,
      'STATION_PERSISTENCE_INVARIANT_BROKEN',
      'never',
    );
  }
  if (driver.code === '40001') {
    return translated(
      error,
      driver,
      'STATION_PERSISTENCE_SERIALIZATION_FAILURE',
      'conditional',
    );
  }
  if (driver.code === '40P01') {
    return translated(
      error,
      driver,
      'STATION_PERSISTENCE_DEADLOCK',
      'conditional',
    );
  }
  if (driver.code === '57014') {
    return translated(
      error,
      driver,
      'STATION_PERSISTENCE_QUERY_CANCELED',
      'never',
    );
  }
  return translated(
    error,
    driver,
    'STATION_PERSISTENCE_FAILED',
    'never',
  );
}
