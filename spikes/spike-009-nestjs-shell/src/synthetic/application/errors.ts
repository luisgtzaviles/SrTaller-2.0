export abstract class ApplicationError extends Error {
  abstract readonly code: string;
}

export class AuthenticationError extends ApplicationError {
  readonly code = 'AUTHENTICATION_REQUIRED';

  constructor() {
    super('Authentication is required.');
    this.name = 'AuthenticationError';
  }
}

export class ContextResolutionError extends ApplicationError {
  readonly code = 'CONTEXT_INVALID';

  constructor() {
    super('Operational context is invalid.');
    this.name = 'ContextResolutionError';
  }
}

export class AuthorizationError extends ApplicationError {
  readonly code = 'OPERATION_DENIED';

  constructor() {
    super('Operation is not permitted.');
    this.name = 'AuthorizationError';
  }
}

export class RecordNotFoundError extends ApplicationError {
  readonly code = 'RECORD_NOT_FOUND';

  constructor() {
    super('Synthetic record was not found.');
    this.name = 'RecordNotFoundError';
  }
}

export class RecordConflictError extends ApplicationError {
  readonly code = 'RECORD_CONFLICT';

  constructor() {
    super('Synthetic record has changed.');
    this.name = 'RecordConflictError';
  }
}

export class PersistenceError extends ApplicationError {
  readonly code = 'PERSISTENCE_FAILURE';

  constructor() {
    super('Persistence operation failed.');
    this.name = 'PersistenceError';
  }
}

export class SyntheticFailureError extends ApplicationError {
  readonly code = 'SYNTHETIC_FAILURE';

  constructor() {
    super('Synthetic failure requested.');
    this.name = 'SyntheticFailureError';
  }
}
