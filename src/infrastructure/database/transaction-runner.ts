import { inspect } from 'node:util';

import type { DatabaseConnection } from './database-connection.js';
import {
  DatabaseTransactionCapabilityError,
  bindDatabaseTransactionContext,
  databaseTransactionCapability,
  releaseDatabaseTransactionContext,
} from './database-transaction-capability.js';
import type {
  InternalDatabaseTransactionConnection,
  InternalDatabaseTransactionSettings,
} from './database-transaction-capability.js';

type DatabaseTransactionIsolationLevel =
  InternalDatabaseTransactionSettings['isolationLevel'];

export type DatabaseTransactionOptions = Readonly<{
  isolationLevel?: DatabaseTransactionIsolationLevel;
  readOnly?: boolean;
}>;

export type DatabaseTransactionContext = Readonly<{
  attempt: 1;
  isolationLevel: DatabaseTransactionIsolationLevel;
  readOnly: boolean;
}>;

type DatabaseTransactionErrorCode =
  | 'DATABASE_TRANSACTION_INVALID_STATE'
  | 'DATABASE_TRANSACTION_INVALID_OPTIONS'
  | 'DATABASE_TRANSACTION_NESTED_FORBIDDEN'
  | 'DATABASE_TRANSACTION_TIMEOUT'
  | 'DATABASE_TRANSACTION_SERIALIZATION_FAILURE'
  | 'DATABASE_TRANSACTION_DEADLOCK'
  | 'DATABASE_TRANSACTION_READ_ONLY_VIOLATION'
  | 'DATABASE_TRANSACTION_ABORTED'
  | 'DATABASE_TRANSACTION_CALLBACK_FAILED'
  | 'DATABASE_TRANSACTION_ROLLBACK_FAILED';

type DatabaseTransactionErrorCategory =
  | 'Concurrency'
  | 'Configuration'
  | 'Infrastructure'
  | 'Persistence'
  | 'Unexpected';

type DatabaseTransactionErrorPhase =
  | 'validation'
  | 'start'
  | 'callback'
  | 'commit'
  | 'rollback'
  | 'context';

type DatabaseTransactionRetryability = 'conditional' | 'never';

type TransactionErrorContract = Readonly<{
  category: DatabaseTransactionErrorCategory;
  message: string;
  retryable: DatabaseTransactionRetryability;
}>;

type DriverErrorShape = Readonly<{
  code: string;
  message: string;
  name: string;
}>;

const defaultIsolationLevel: DatabaseTransactionIsolationLevel =
  'read committed';

const allowedIsolationLevels = new Set<DatabaseTransactionIsolationLevel>([
  'read uncommitted',
  'read committed',
  'repeatable read',
  'serializable',
]);

const allowedOptionNames = new Set(['isolationLevel', 'readOnly']);

const errorContracts: Readonly<
  Record<DatabaseTransactionErrorCode, TransactionErrorContract>
> = Object.freeze({
  DATABASE_TRANSACTION_INVALID_STATE: Object.freeze({
    category: 'Configuration',
    message: 'Database transaction is not valid in the current state.',
    retryable: 'never',
  }),
  DATABASE_TRANSACTION_INVALID_OPTIONS: Object.freeze({
    category: 'Configuration',
    message: 'Database transaction options are invalid.',
    retryable: 'never',
  }),
  DATABASE_TRANSACTION_NESTED_FORBIDDEN: Object.freeze({
    category: 'Configuration',
    message: 'Nested or overlapping transactions are not permitted.',
    retryable: 'never',
  }),
  DATABASE_TRANSACTION_TIMEOUT: Object.freeze({
    category: 'Infrastructure',
    message: 'Database transaction operation timed out.',
    retryable: 'conditional',
  }),
  DATABASE_TRANSACTION_SERIALIZATION_FAILURE: Object.freeze({
    category: 'Concurrency',
    message: 'Database transaction serialization failed.',
    retryable: 'conditional',
  }),
  DATABASE_TRANSACTION_DEADLOCK: Object.freeze({
    category: 'Concurrency',
    message: 'Database transaction was aborted after a deadlock.',
    retryable: 'conditional',
  }),
  DATABASE_TRANSACTION_READ_ONLY_VIOLATION: Object.freeze({
    category: 'Persistence',
    message: 'Database transaction rejected a write in read-only mode.',
    retryable: 'never',
  }),
  DATABASE_TRANSACTION_ABORTED: Object.freeze({
    category: 'Persistence',
    message: 'Database transaction was aborted.',
    retryable: 'never',
  }),
  DATABASE_TRANSACTION_CALLBACK_FAILED: Object.freeze({
    category: 'Unexpected',
    message: 'Database transaction callback failed.',
    retryable: 'never',
  }),
  DATABASE_TRANSACTION_ROLLBACK_FAILED: Object.freeze({
    category: 'Persistence',
    message: 'Database transaction rollback failed.',
    retryable: 'never',
  }),
});

export class DatabaseTransactionError extends Error {
  readonly category: DatabaseTransactionErrorCategory;
  readonly retryable: DatabaseTransactionRetryability;
  readonly attempt = 1 as const;
  #primaryCause: unknown;
  #secondaryCause: unknown;

  constructor(
    readonly code: DatabaseTransactionErrorCode,
    readonly phase: DatabaseTransactionErrorPhase,
    readonly isolationLevel: DatabaseTransactionIsolationLevel,
    readonly readOnly: boolean,
    readonly durationMs: number,
    readonly primaryCode: DatabaseTransactionErrorCode | null = null,
    primaryCause?: unknown,
    secondaryCause?: unknown,
  ) {
    const contract = errorContracts[code];
    super(contract.message);
    this.name = 'DatabaseTransactionError';
    this.category = contract.category;
    this.retryable = contract.retryable;
    this.#primaryCause = primaryCause;
    this.#secondaryCause = secondaryCause;
  }

  toJSON(): Readonly<{
    name: 'DatabaseTransactionError';
    code: DatabaseTransactionErrorCode;
    category: DatabaseTransactionErrorCategory;
    message: string;
    retryable: DatabaseTransactionRetryability;
    phase: DatabaseTransactionErrorPhase;
    isolationLevel: DatabaseTransactionIsolationLevel;
    readOnly: boolean;
    attempt: 1;
    durationMs: number;
    primaryCode: DatabaseTransactionErrorCode | null;
  }> {
    return Object.freeze({
      name: 'DatabaseTransactionError',
      code: this.code,
      category: this.category,
      message: this.message,
      retryable: this.retryable,
      phase: this.phase,
      isolationLevel: this.isolationLevel,
      readOnly: this.readOnly,
      attempt: this.attempt,
      durationMs: this.durationMs,
      primaryCode: this.primaryCode,
    });
  }

  [inspect.custom](): ReturnType<DatabaseTransactionError['toJSON']> {
    return this.toJSON();
  }
}

function driverErrorShape(error: unknown): DriverErrorShape {
  if (typeof error !== 'object' || error === null) {
    return Object.freeze({ code: '', message: '', name: '' });
  }
  const candidate = error as Readonly<Record<string, unknown>>;
  return Object.freeze({
    code: typeof candidate.code === 'string' ? candidate.code : '',
    message: typeof candidate.message === 'string' ? candidate.message : '',
    name: typeof candidate.name === 'string' ? candidate.name : '',
  });
}

function elapsedSince(startedAt: number): number {
  return Math.max(0, Math.round(performance.now() - startedAt));
}

function validateOptions(
  options: DatabaseTransactionOptions,
): Readonly<{
  isolationLevel: DatabaseTransactionIsolationLevel;
  readOnly: boolean;
}> {
  if (
    typeof options !== 'object' ||
    options === null ||
    Array.isArray(options) ||
    Object.keys(options).some((name) => !allowedOptionNames.has(name)) ||
    (options.isolationLevel !== undefined &&
      !allowedIsolationLevels.has(options.isolationLevel)) ||
    (options.readOnly !== undefined && typeof options.readOnly !== 'boolean')
  ) {
    throw new DatabaseTransactionError(
      'DATABASE_TRANSACTION_INVALID_OPTIONS',
      'validation',
      defaultIsolationLevel,
      false,
      0,
    );
  }
  return Object.freeze({
    isolationLevel: options.isolationLevel ?? defaultIsolationLevel,
    readOnly: options.readOnly ?? false,
  });
}

function transactionCapability(
  connection: DatabaseConnection,
  isolationLevel: DatabaseTransactionIsolationLevel,
  readOnly: boolean,
): InternalDatabaseTransactionConnection {
  if (
    typeof connection !== 'object' ||
    connection === null ||
    !(databaseTransactionCapability in connection)
  ) {
    throw new DatabaseTransactionError(
      'DATABASE_TRANSACTION_INVALID_STATE',
      'start',
      isolationLevel,
      readOnly,
      0,
    );
  }
  return connection as DatabaseConnection &
    InternalDatabaseTransactionConnection;
}

function codeForDriverError(
  error: unknown,
  fallback: DatabaseTransactionErrorCode,
): DatabaseTransactionErrorCode {
  const shape = driverErrorShape(error);
  if (shape.code === '40001') {
    return 'DATABASE_TRANSACTION_SERIALIZATION_FAILURE';
  }
  if (shape.code === '40P01') {
    return 'DATABASE_TRANSACTION_DEADLOCK';
  }
  if (shape.code === '25006') {
    return 'DATABASE_TRANSACTION_READ_ONLY_VIOLATION';
  }
  if (
    shape.code === '57014' ||
    shape.code === 'ETIMEDOUT' ||
    shape.name === 'TimeoutError' ||
    /timeout|timed out|canceling statement/iu.test(shape.message)
  ) {
    return 'DATABASE_TRANSACTION_TIMEOUT';
  }
  return fallback;
}

function mapError(
  error: unknown,
  phase: DatabaseTransactionErrorPhase,
  isolationLevel: DatabaseTransactionIsolationLevel,
  readOnly: boolean,
  startedAt: number,
): DatabaseTransactionError {
  if (error instanceof DatabaseTransactionError) {
    return error;
  }
  if (
    error instanceof DatabaseTransactionCapabilityError &&
    error.code === 'NESTED_FORBIDDEN'
  ) {
    return new DatabaseTransactionError(
      'DATABASE_TRANSACTION_NESTED_FORBIDDEN',
      'start',
      isolationLevel,
      readOnly,
      elapsedSince(startedAt),
      null,
      error,
    );
  }
  const fallback =
    phase === 'callback'
      ? 'DATABASE_TRANSACTION_CALLBACK_FAILED'
      : 'DATABASE_TRANSACTION_ABORTED';
  return new DatabaseTransactionError(
    codeForDriverError(error, fallback),
    phase,
    isolationLevel,
    readOnly,
    elapsedSince(startedAt),
    null,
    error,
  );
}

export async function runInTransaction<T>(
  connection: DatabaseConnection,
  options: DatabaseTransactionOptions,
  callback: (context: DatabaseTransactionContext) => T | Promise<T>,
): Promise<T> {
  const validated = validateOptions(options);
  if (typeof callback !== 'function') {
    throw new DatabaseTransactionError(
      'DATABASE_TRANSACTION_INVALID_OPTIONS',
      'validation',
      validated.isolationLevel,
      validated.readOnly,
      0,
    );
  }
  const capability = transactionCapability(
    connection,
    validated.isolationLevel,
    validated.readOnly,
  );
  if (
    connection.state === 'created' ||
    connection.state === 'verifying' ||
    connection.state === 'failed'
  ) {
    await connection.verify().catch((error: unknown) => {
      throw mapError(
        error,
        'start',
        validated.isolationLevel,
        validated.readOnly,
        performance.now(),
      );
    });
  }
  if (connection.state !== 'ready') {
    throw new DatabaseTransactionError(
      'DATABASE_TRANSACTION_INVALID_STATE',
      'start',
      validated.isolationLevel,
      validated.readOnly,
      0,
    );
  }

  const startedAt = performance.now();
  let callbackError: unknown;
  let callbackFailed = false;
  let callbackCompleted = false;
  try {
    return await capability[databaseTransactionCapability](
      Object.freeze({
        isolationLevel: validated.isolationLevel,
        accessMode: validated.readOnly ? 'read only' : 'read write',
      }),
      async (executor) => {
        const context: DatabaseTransactionContext = Object.freeze({
          attempt: 1,
          isolationLevel: validated.isolationLevel,
          readOnly: validated.readOnly,
        });
        bindDatabaseTransactionContext(
          context,
          executor,
          () =>
            new DatabaseTransactionError(
              'DATABASE_TRANSACTION_INVALID_STATE',
              'context',
              validated.isolationLevel,
              validated.readOnly,
              elapsedSince(startedAt),
            ),
        );
        try {
          const result = await callback(context);
          callbackCompleted = true;
          return result;
        } catch (error: unknown) {
          callbackFailed = true;
          callbackError = error;
          throw error;
        } finally {
          releaseDatabaseTransactionContext(context);
        }
      },
    );
  } catch (error: unknown) {
    if (callbackFailed && error !== callbackError) {
      const primary = mapError(
        callbackError,
        'callback',
        validated.isolationLevel,
        validated.readOnly,
        startedAt,
      );
      throw new DatabaseTransactionError(
        'DATABASE_TRANSACTION_ROLLBACK_FAILED',
        'rollback',
        validated.isolationLevel,
        validated.readOnly,
        elapsedSince(startedAt),
        primary.code,
        primary,
        error,
      );
    }
    const phase = callbackFailed
      ? 'callback'
      : callbackCompleted
        ? 'commit'
        : 'start';
    throw mapError(
      error,
      phase,
      validated.isolationLevel,
      validated.readOnly,
      startedAt,
    );
  }
}
