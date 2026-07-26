import { inspect } from 'node:util';

export type StationPersistenceErrorCode =
  | 'PERSISTENCE_STATION_SCOPE_REQUIRED'
  | 'PERSISTENCE_BINDING_SCOPE_REQUIRED'
  | 'STATION_PERSISTENCE_CONFLICT'
  | 'STATION_PERSISTENCE_REFERENCE_NOT_FOUND'
  | 'STATION_PERSISTENCE_INVARIANT_BROKEN'
  | 'STATION_PERSISTENCE_FAILED';

const contracts = Object.freeze({
  PERSISTENCE_STATION_SCOPE_REQUIRED: Object.freeze({
    category: 'Validation',
    message: 'A valid station persistence scope is required.',
  }),
  PERSISTENCE_BINDING_SCOPE_REQUIRED: Object.freeze({
    category: 'Validation',
    message: 'A valid binding persistence scope is required.',
  }),
  STATION_PERSISTENCE_CONFLICT: Object.freeze({
    category: 'Conflict',
    message: 'Station persistence conflicts with current state.',
  }),
  STATION_PERSISTENCE_REFERENCE_NOT_FOUND: Object.freeze({
    category: 'NotFound',
    message: 'Station persistence reference was not found.',
  }),
  STATION_PERSISTENCE_INVARIANT_BROKEN: Object.freeze({
    category: 'Unexpected',
    message: 'Station persistence invariant is invalid.',
  }),
  STATION_PERSISTENCE_FAILED: Object.freeze({
    category: 'Persistence',
    message: 'Station persistence operation failed.',
  }),
} satisfies Record<
  StationPersistenceErrorCode,
  Readonly<{ category: string; message: string }>
>);

export class StationPersistenceError extends Error {
  readonly category: string;

  constructor(
    readonly code: StationPersistenceErrorCode,
    readonly retryable: 'conditional' | 'never' = 'never',
  ) {
    const contract = contracts[code];
    super(contract.message);
    this.name = 'StationPersistenceError';
    this.category = contract.category;
  }

  toJSON(): Readonly<{
    name: 'StationPersistenceError';
    category: string;
    code: StationPersistenceErrorCode;
    message: string;
    retryable: 'conditional' | 'never';
  }> {
    return Object.freeze({
      name: 'StationPersistenceError',
      category: this.category,
      code: this.code,
      message: this.message,
      retryable: this.retryable,
    });
  }

  [inspect.custom](): ReturnType<StationPersistenceError['toJSON']> {
    return this.toJSON();
  }
}
