import assert from 'node:assert/strict';
import test from 'node:test';
import { inspect } from 'node:util';

import {
  toPublicStationError,
} from '../dist/modules/stations/application/station-application.error.js';
import {
  mapStationError,
} from '../dist/modules/stations/application/station-error-mapper.js';
import {
  readStationPostgresqlDiagnostic,
  translateStationPostgresqlError,
} from '../dist/modules/stations/infrastructure/persistence/station-postgresql-error.js';

function driver(code, constraint = '') {
  return {
    code,
    constraint,
    detail: 'private SQL station=secret',
    query: 'select private from station_bindings',
  };
}

test('station PostgreSQL concurrency errors preserve code and retryability', () => {
  for (const [sqlState, persistenceCode] of [
    ['40001', 'STATION_PERSISTENCE_SERIALIZATION_FAILURE'],
    ['40P01', 'STATION_PERSISTENCE_DEADLOCK'],
  ]) {
    const persistence = translateStationPostgresqlError(
      driver(sqlState),
      'transition-station',
    );
    assert.equal(persistence.code, persistenceCode);
    assert.equal(persistence.category, 'Concurrency');
    assert.equal(persistence.retryable, 'conditional');

    const application = mapStationError(persistence);
    assert.equal(application.code, 'STATION_TRANSIENT_CONCURRENCY');
    assert.equal(application.category, 'Concurrency');
    assert.equal(application.retryable, 'conditional');
    assert.deepEqual(toPublicStationError(application), {
      code: 'TRANSIENT_CONCURRENCY_FAILURE',
      status: 503,
      message: 'La operación no está disponible temporalmente.',
    });
  }
});

test('query cancellation remains non-retryable infrastructure failure', () => {
  const persistence = translateStationPostgresqlError(
    driver('57014'),
    'find-station',
  );
  assert.equal(persistence.code, 'STATION_PERSISTENCE_QUERY_CANCELED');
  assert.equal(persistence.category, 'Infrastructure');
  assert.equal(persistence.retryable, 'never');

  const application = mapStationError(persistence);
  assert.equal(application.code, 'STATION_QUERY_CANCELED');
  assert.equal(application.category, 'Infrastructure');
  assert.equal(application.retryable, 'never');
  assert.deepEqual(toPublicStationError(application), {
    code: 'INTERNAL_ERROR',
    status: 500,
    message: 'Ocurrió un error interno.',
  });
});

test('known foreign keys are translated only in their operation context', () => {
  const missingTenant = translateStationPostgresqlError(
    driver('23503', 'stations_tenant_fk'),
    'create-station',
  );
  assert.equal(
    missingTenant.code,
    'STATION_PERSISTENCE_REFERENCE_NOT_FOUND',
  );
  assert.equal(missingTenant.category, 'NotFound');

  for (const constraint of [
    'station_bindings_station_fk',
    'station_bindings_branch_fk',
  ]) {
    const broken = translateStationPostgresqlError(
      driver('23503', constraint),
      'create-open-binding',
    );
    assert.equal(
      broken.code,
      'STATION_PERSISTENCE_INVARIANT_BROKEN',
    );
    assert.equal(broken.category, 'Unexpected');
  }
});

test('unknown or mismatched foreign keys fail closed as integrity errors', () => {
  for (const [operation, constraint] of [
    ['create-station', 'unknown_fk'],
    ['create-open-binding', 'stations_tenant_fk'],
    ['find-station', 'station_bindings_station_fk'],
  ]) {
    const error = translateStationPostgresqlError(
      driver('23503', constraint),
      operation,
    );
    assert.equal(
      error.code,
      'STATION_PERSISTENCE_INVARIANT_BROKEN',
    );
    assert.equal(error.retryable, 'never');
  }
});

test('technical diagnostics remain internal while public errors are sanitized', () => {
  const persistence = translateStationPostgresqlError(
    driver('23503', 'unknown_private_constraint'),
    'create-open-binding',
  );
  assert.deepEqual(readStationPostgresqlDiagnostic(persistence), {
    code: '23503',
    constraint: 'unknown_private_constraint',
  });

  const serialized = `${JSON.stringify(persistence)}\n${inspect(persistence)}`;
  const publicError = JSON.stringify(
    toPublicStationError(mapStationError(persistence)),
  );
  assert.doesNotMatch(
    serialized,
    /23503|unknown_private_constraint|private SQL|select private/iu,
  );
  assert.doesNotMatch(
    publicError,
    /23503|constraint|sql|private|station_bindings/iu,
  );
});
