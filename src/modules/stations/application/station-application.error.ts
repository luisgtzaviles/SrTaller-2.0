import { inspect } from 'node:util';

const transactionPassthroughError = Symbol.for(
  'srtaller.database.transaction-passthrough-error',
);

export type StationApplicationErrorCode =
  | 'STATION_EVIDENCE_REQUIRED'
  | 'STATION_EVIDENCE_MALFORMED'
  | 'STATION_EVIDENCE_REJECTED'
  | 'STATION_TENANT_NOT_RECOGNIZED'
  | 'STATION_NOT_TRUSTED'
  | 'STATION_BRANCH_NOT_ELIGIBLE'
  | 'STATION_SCOPE_MISMATCH'
  | 'STATION_CONTEXT_INPUT_CONFLICT'
  | 'STATION_LIFECYCLE_CONFLICT'
  | 'STATION_CONTEXT_STALE'
  | 'STATION_REFERENCE_NOT_FOUND'
  | 'STATION_REFERENCE_INTEGRITY_BROKEN'
  | 'STATION_INVARIANT_BROKEN'
  | 'STATION_PERSISTENCE_FAILED';

type ErrorCategory =
  | 'Authentication'
  | 'Concurrency'
  | 'Conflict'
  | 'NotFound'
  | 'Persistence'
  | 'Unexpected'
  | 'Validation';

const contracts: Readonly<
  Record<
    StationApplicationErrorCode,
    Readonly<{ category: ErrorCategory; message: string }>
  >
> = Object.freeze({
  STATION_EVIDENCE_REQUIRED: Object.freeze({
    category: 'Authentication',
    message: 'Station authentication is required.',
  }),
  STATION_EVIDENCE_MALFORMED: Object.freeze({
    category: 'Validation',
    message: 'Station evidence is invalid.',
  }),
  STATION_EVIDENCE_REJECTED: Object.freeze({
    category: 'Authentication',
    message: 'Station authentication is required.',
  }),
  STATION_TENANT_NOT_RECOGNIZED: Object.freeze({
    category: 'Authentication',
    message: 'Station authentication is required.',
  }),
  STATION_NOT_TRUSTED: Object.freeze({
    category: 'Authentication',
    message: 'Station authentication is required.',
  }),
  STATION_BRANCH_NOT_ELIGIBLE: Object.freeze({
    category: 'NotFound',
    message: 'The station branch is not available.',
  }),
  STATION_SCOPE_MISMATCH: Object.freeze({
    category: 'NotFound',
    message: 'The station scope is not available.',
  }),
  STATION_CONTEXT_INPUT_CONFLICT: Object.freeze({
    category: 'Validation',
    message: 'Station context input conflicts with trusted state.',
  }),
  STATION_LIFECYCLE_CONFLICT: Object.freeze({
    category: 'Conflict',
    message: 'Station lifecycle operation conflicts with current state.',
  }),
  STATION_CONTEXT_STALE: Object.freeze({
    category: 'Concurrency',
    message: 'Station context is stale.',
  }),
  STATION_REFERENCE_NOT_FOUND: Object.freeze({
    category: 'NotFound',
    message: 'The station reference was not found.',
  }),
  STATION_REFERENCE_INTEGRITY_BROKEN: Object.freeze({
    category: 'Unexpected',
    message: 'Station reference integrity is invalid.',
  }),
  STATION_INVARIANT_BROKEN: Object.freeze({
    category: 'Unexpected',
    message: 'Station invariant is invalid.',
  }),
  STATION_PERSISTENCE_FAILED: Object.freeze({
    category: 'Persistence',
    message: 'Station persistence operation failed.',
  }),
});

export class StationApplicationError
extends Error {
  readonly category: ErrorCategory;
  readonly [transactionPassthroughError] = true as const;

  constructor(readonly code: StationApplicationErrorCode) {
    const contract = contracts[code];
    super(contract.message);
    this.name = 'StationApplicationError';
    this.category = contract.category;
  }

  toJSON(): Readonly<{
    name: 'StationApplicationError';
    category: ErrorCategory;
    code: StationApplicationErrorCode;
    message: string;
  }> {
    return Object.freeze({
      name: 'StationApplicationError',
      category: this.category,
      code: this.code,
      message: this.message,
    });
  }

  [inspect.custom](): ReturnType<StationApplicationError['toJSON']> {
    return this.toJSON();
  }
}

export interface PublicStationError {
  readonly code:
    | 'AUTHENTICATION_REQUIRED'
    | 'CONCURRENCY_CONFLICT'
    | 'INTERNAL_ERROR'
    | 'RESOURCE_CONFLICT'
    | 'RESOURCE_NOT_FOUND'
    | 'VALIDATION_FAILED';
  readonly status: 400 | 401 | 404 | 409 | 500;
  readonly message: string;
}

export function toPublicStationError(
  error: StationApplicationError,
): PublicStationError {
  if (error.category === 'Authentication') {
    return Object.freeze({
      code: 'AUTHENTICATION_REQUIRED',
      status: 401,
      message: 'Se requiere autenticación.',
    });
  }
  if (error.category === 'Validation') {
    return Object.freeze({
      code: 'VALIDATION_FAILED',
      status: 400,
      message: 'La solicitud no es válida.',
    });
  }
  if (error.category === 'NotFound') {
    return Object.freeze({
      code: 'RESOURCE_NOT_FOUND',
      status: 404,
      message: 'El recurso no está disponible.',
    });
  }
  if (error.category === 'Conflict') {
    return Object.freeze({
      code: 'RESOURCE_CONFLICT',
      status: 409,
      message: 'El recurso presenta un conflicto.',
    });
  }
  if (error.category === 'Concurrency') {
    return Object.freeze({
      code: 'CONCURRENCY_CONFLICT',
      status: 409,
      message: 'La operación presenta un conflicto de concurrencia.',
    });
  }
  return Object.freeze({
    code: 'INTERNAL_ERROR',
    status: 500,
    message: 'Ocurrió un error interno.',
  });
}
