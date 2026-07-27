import { StationDomainError } from '../domain/station.js';
import { StationApplicationError } from './station-application.error.js';
import { StationPersistenceError } from './ports/station-persistence.error.js';

export function mapStationError(error: unknown): StationApplicationError {
  if (error instanceof StationApplicationError) {
    return error;
  }
  if (error instanceof StationDomainError) {
    if (error.code === 'STATION_CONTEXT_STALE') {
      return new StationApplicationError('STATION_CONTEXT_STALE');
    }
    if (error.code === 'STATION_LIFECYCLE_CONFLICT') {
      return new StationApplicationError('STATION_LIFECYCLE_CONFLICT');
    }
    return new StationApplicationError(
      error.category === 'Unexpected'
        ? 'STATION_INVARIANT_BROKEN'
        : 'STATION_LIFECYCLE_CONFLICT',
    );
  }
  if (error instanceof StationPersistenceError) {
    if (error.code === 'STATION_PERSISTENCE_REFERENCE_NOT_FOUND') {
      return new StationApplicationError('STATION_REFERENCE_NOT_FOUND');
    }
    if (error.code === 'STATION_PERSISTENCE_INVARIANT_BROKEN') {
      return new StationApplicationError(
        'STATION_REFERENCE_INTEGRITY_BROKEN',
      );
    }
    if (error.code === 'STATION_PERSISTENCE_CONFLICT') {
      return new StationApplicationError('STATION_LIFECYCLE_CONFLICT');
    }
    if (
      error.code === 'STATION_PERSISTENCE_SERIALIZATION_FAILURE' ||
      error.code === 'STATION_PERSISTENCE_DEADLOCK'
    ) {
      return new StationApplicationError(
        'STATION_TRANSIENT_CONCURRENCY',
        error.retryable,
      );
    }
    if (error.code === 'STATION_PERSISTENCE_QUERY_CANCELED') {
      return new StationApplicationError(
        'STATION_QUERY_CANCELED',
        error.retryable,
      );
    }
    return new StationApplicationError(
      'STATION_PERSISTENCE_FAILED',
      error.retryable,
    );
  }
  return new StationApplicationError('STATION_INVARIANT_BROKEN');
}
