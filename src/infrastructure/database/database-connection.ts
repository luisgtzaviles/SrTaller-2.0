import { inspect } from 'node:util';

import { Kysely, PostgresDialect } from 'kysely';
import { Pool } from 'pg';
import type { PoolClient, PoolConfig } from 'pg';

import type { DatabaseConfig } from './database-config.js';

type DatabaseConnectionState =
  | 'created'
  | 'verifying'
  | 'ready'
  | 'closing'
  | 'closed'
  | 'failed';

type DatabaseConnectionErrorCode =
  | 'DATABASE_CONNECTION_INVALID_STATE'
  | 'DATABASE_CONNECTION_AUTHENTICATION_FAILED'
  | 'DATABASE_CONNECTION_DATABASE_NOT_FOUND'
  | 'DATABASE_CONNECTION_TIMEOUT'
  | 'DATABASE_CONNECTION_NETWORK_FAILED'
  | 'DATABASE_CONNECTION_SSL_FAILED'
  | 'DATABASE_CONNECTION_VERIFICATION_FAILED'
  | 'DATABASE_CONNECTION_CLOSED'
  | 'DATABASE_CONNECTION_CLOSE_FAILED';

type DatabaseConnectionErrorCategory =
  | 'Authentication'
  | 'Configuration'
  | 'Infrastructure'
  | 'Persistence'
  | 'Unexpected';

type EmptyDatabaseSchema = Record<never, never>;

type DriverErrorShape = Readonly<{
  code?: unknown;
  message?: unknown;
  name?: unknown;
}>;

type SanitizedDatabaseConnectionState = Readonly<{
  state: DatabaseConnectionState;
  environment: DatabaseConfig['runtime']['environment'];
  role: DatabaseConfig['runtime']['role'];
  accessMode: DatabaseConfig['runtime']['accessMode'];
  sslMode: DatabaseConfig['transport']['sslMode'];
  applicationName: string;
  identityConfigured: Readonly<{
    host: true;
    database: true;
    user: true;
    password: true;
  }>;
  pool: Readonly<{
    configuredMin: number;
    configuredMax: number;
    totalCount: number;
    idleCount: number;
    waitingCount: number;
  }>;
  timing: Readonly<{
    createdAt: string;
    verifiedAt: string | null;
    closedAt: string | null;
  }>;
  lastError: Readonly<{
    category: DatabaseConnectionErrorCategory;
    code: DatabaseConnectionErrorCode;
    retryable: boolean;
  }> | null;
}>;

const errorContracts: Readonly<
  Record<
    DatabaseConnectionErrorCode,
    Readonly<{
      category: DatabaseConnectionErrorCategory;
      message: string;
      retryable: boolean;
    }>
  >
> = Object.freeze({
  DATABASE_CONNECTION_INVALID_STATE: Object.freeze({
    category: 'Configuration',
    message: 'Database connection operation is not valid in the current state.',
    retryable: false,
  }),
  DATABASE_CONNECTION_AUTHENTICATION_FAILED: Object.freeze({
    category: 'Authentication',
    message: 'Database authentication failed.',
    retryable: false,
  }),
  DATABASE_CONNECTION_DATABASE_NOT_FOUND: Object.freeze({
    category: 'Persistence',
    message: 'Configured database is not available.',
    retryable: false,
  }),
  DATABASE_CONNECTION_TIMEOUT: Object.freeze({
    category: 'Infrastructure',
    message: 'Database connection verification timed out.',
    retryable: true,
  }),
  DATABASE_CONNECTION_NETWORK_FAILED: Object.freeze({
    category: 'Infrastructure',
    message: 'Database network connection failed.',
    retryable: true,
  }),
  DATABASE_CONNECTION_SSL_FAILED: Object.freeze({
    category: 'Infrastructure',
    message: 'Database transport verification failed.',
    retryable: false,
  }),
  DATABASE_CONNECTION_VERIFICATION_FAILED: Object.freeze({
    category: 'Unexpected',
    message: 'Database connection verification failed.',
    retryable: false,
  }),
  DATABASE_CONNECTION_CLOSED: Object.freeze({
    category: 'Infrastructure',
    message: 'Database connection is closed.',
    retryable: false,
  }),
  DATABASE_CONNECTION_CLOSE_FAILED: Object.freeze({
    category: 'Infrastructure',
    message: 'Database connection could not be closed safely.',
    retryable: false,
  }),
});

const networkErrorCodes = new Set([
  'ECONNREFUSED',
  'ECONNRESET',
  'EHOSTUNREACH',
  'ENETUNREACH',
  'ENOTFOUND',
  'EPIPE',
]);

const sslErrorCodes = new Set([
  'CERT_HAS_EXPIRED',
  'DEPTH_ZERO_SELF_SIGNED_CERT',
  'ERR_SSL_TLSV1_ALERT_PROTOCOL_VERSION',
  'ERR_TLS_CERT_ALTNAME_INVALID',
  'SELF_SIGNED_CERT_IN_CHAIN',
  'UNABLE_TO_VERIFY_LEAF_SIGNATURE',
]);

export interface DatabaseConnection {
  readonly state: DatabaseConnectionState;
  verify(): Promise<void>;
  close(): Promise<void>;
}

export class DatabaseConnectionError extends Error {
  readonly category: DatabaseConnectionErrorCategory;
  readonly retryable: boolean;

  constructor(
    readonly code: DatabaseConnectionErrorCode,
    readonly state: DatabaseConnectionState,
  ) {
    const contract = errorContracts[code];
    super(contract.message);
    this.name = 'DatabaseConnectionError';
    this.category = contract.category;
    this.retryable = contract.retryable;
  }

  toJSON(): Readonly<{
    name: 'DatabaseConnectionError';
    category: DatabaseConnectionErrorCategory;
    code: DatabaseConnectionErrorCode;
    message: string;
    retryable: boolean;
    state: DatabaseConnectionState;
  }> {
    return Object.freeze({
      name: 'DatabaseConnectionError',
      category: this.category,
      code: this.code,
      message: this.message,
      retryable: this.retryable,
      state: this.state,
    });
  }

  [inspect.custom](): ReturnType<DatabaseConnectionError['toJSON']> {
    return this.toJSON();
  }
}

function driverErrorShape(error: unknown): DriverErrorShape {
  if (typeof error !== 'object' || error === null) {
    return Object.freeze({});
  }
  const candidate = error as Readonly<Record<string, unknown>>;
  return Object.freeze({
    code: candidate.code,
    message: candidate.message,
    name: candidate.name,
  });
}

function mapVerificationError(
  error: unknown,
  state: DatabaseConnectionState,
): DatabaseConnectionError {
  if (error instanceof DatabaseConnectionError) {
    return error;
  }
  const shape = driverErrorShape(error);
  const code = typeof shape.code === 'string' ? shape.code : '';
  const name = typeof shape.name === 'string' ? shape.name : '';
  const message = typeof shape.message === 'string' ? shape.message : '';

  if (code === '28P01') {
    return new DatabaseConnectionError(
      'DATABASE_CONNECTION_AUTHENTICATION_FAILED',
      state,
    );
  }
  if (code === '3D000') {
    return new DatabaseConnectionError(
      'DATABASE_CONNECTION_DATABASE_NOT_FOUND',
      state,
    );
  }
  if (
    code === '57014' ||
    code === 'ETIMEDOUT' ||
    name === 'TimeoutError' ||
    /timeout|timed out/iu.test(message)
  ) {
    return new DatabaseConnectionError(
      'DATABASE_CONNECTION_TIMEOUT',
      state,
    );
  }
  if (
    sslErrorCodes.has(code) ||
    code.startsWith('ERR_SSL_') ||
    code.startsWith('ERR_TLS_') ||
    /certificate|ssl|tls/iu.test(message)
  ) {
    return new DatabaseConnectionError(
      'DATABASE_CONNECTION_SSL_FAILED',
      state,
    );
  }
  if (networkErrorCodes.has(code)) {
    return new DatabaseConnectionError(
      'DATABASE_CONNECTION_NETWORK_FAILED',
      state,
    );
  }
  return new DatabaseConnectionError(
    'DATABASE_CONNECTION_VERIFICATION_FAILED',
    state,
  );
}

function sslConfig(
  mode: DatabaseConfig['transport']['sslMode'],
): PoolConfig['ssl'] {
  if (mode === 'disable') {
    return false;
  }
  if (mode === 'verify-ca') {
    return Object.freeze({
      checkServerIdentity: (): undefined => undefined,
      rejectUnauthorized: true,
    });
  }
  return Object.freeze({ rejectUnauthorized: true });
}

function poolConfig(config: Readonly<DatabaseConfig>): Readonly<PoolConfig> {
  return Object.freeze({
    application_name: config.observability.applicationName,
    connectionTimeoutMillis: config.pool.connectionTimeoutMs,
    database: config.identity.database,
    host: config.identity.host,
    idleTimeoutMillis: config.pool.idleTimeoutMs,
    max: config.pool.max,
    min: config.pool.min,
    password: config.identity.password,
    port: config.identity.port,
    query_timeout: config.pool.queryTimeoutMs,
    ssl: sslConfig(config.transport.sslMode),
    statement_timeout: config.pool.statementTimeoutMs,
    user: config.identity.user,
  });
}

async function runConnectionVerification(client: PoolClient): Promise<void> {
  await client.query('select 1');
}

class ControlledDatabaseConnection implements DatabaseConnection {
  readonly #config: Readonly<DatabaseConfig>;
  readonly #database: Kysely<EmptyDatabaseSchema>;
  readonly #pool: Pool;
  readonly #createdAt = new Date();
  #verifiedAt: Date | null = null;
  #closedAt: Date | null = null;
  #lastError: DatabaseConnectionError | null = null;
  #state: DatabaseConnectionState = 'created';
  #verificationPromise: Promise<void> | null = null;
  #closePromise: Promise<void> | null = null;

  constructor(config: Readonly<DatabaseConfig>) {
    this.#config = config;
    this.#pool = new Pool(poolConfig(config));
    this.#pool.on('error', (error: unknown) => {
      if (this.#state === 'closing' || this.#state === 'closed') {
        return;
      }
      this.#lastError = mapVerificationError(error, this.#state);
      this.#state = 'failed';
    });
    this.#database = new Kysely<EmptyDatabaseSchema>({
      dialect: new PostgresDialect({ pool: this.#pool }),
    });
  }

  get state(): DatabaseConnectionState {
    return this.#state;
  }

  verify(): Promise<void> {
    if (this.#state === 'closing' || this.#state === 'closed') {
      return Promise.reject(
        new DatabaseConnectionError(
          'DATABASE_CONNECTION_CLOSED',
          this.#state,
        ),
      );
    }
    if (this.#verificationPromise) {
      return this.#verificationPromise;
    }
    if (
      this.#state !== 'created' &&
      this.#state !== 'ready' &&
      this.#state !== 'failed'
    ) {
      return Promise.reject(
        new DatabaseConnectionError(
          'DATABASE_CONNECTION_INVALID_STATE',
          this.#state,
        ),
      );
    }

    this.#state = 'verifying';
    const verification = this.#performVerification();
    this.#verificationPromise = verification;
    void verification.finally(() => {
      if (this.#verificationPromise === verification) {
        this.#verificationPromise = null;
      }
    }).catch(() => undefined);
    return verification;
  }

  close(): Promise<void> {
    if (this.#state === 'closed') {
      return Promise.resolve();
    }
    if (this.#closePromise) {
      return this.#closePromise;
    }

    this.#state = 'closing';
    const closing = this.#performClose();
    this.#closePromise = closing;
    return closing;
  }

  sanitizedState(): SanitizedDatabaseConnectionState {
    const lastError = this.#lastError
      ? Object.freeze({
          category: this.#lastError.category,
          code: this.#lastError.code,
          retryable: this.#lastError.retryable,
        })
      : null;
    return Object.freeze({
      state: this.#state,
      environment: this.#config.runtime.environment,
      role: this.#config.runtime.role,
      accessMode: this.#config.runtime.accessMode,
      sslMode: this.#config.transport.sslMode,
      applicationName: this.#config.observability.applicationName,
      identityConfigured: Object.freeze({
        host: true,
        database: true,
        user: true,
        password: true,
      }),
      pool: Object.freeze({
        configuredMin: this.#config.pool.min,
        configuredMax: this.#config.pool.max,
        totalCount: this.#pool.totalCount,
        idleCount: this.#pool.idleCount,
        waitingCount: this.#pool.waitingCount,
      }),
      timing: Object.freeze({
        createdAt: this.#createdAt.toISOString(),
        verifiedAt: this.#verifiedAt?.toISOString() ?? null,
        closedAt: this.#closedAt?.toISOString() ?? null,
      }),
      lastError,
    });
  }

  async #performVerification(): Promise<void> {
    let client: PoolClient | null = null;
    try {
      client = await this.#pool.connect();
      await runConnectionVerification(client);
      this.#verifiedAt = new Date();
      this.#lastError = null;
      if (this.#state === 'verifying') {
        this.#state = 'ready';
      }
    } catch (error: unknown) {
      const mapped = mapVerificationError(error, this.#state);
      this.#lastError = mapped;
      if (this.#state === 'verifying') {
        this.#state = 'failed';
      }
      throw mapped;
    } finally {
      client?.release();
    }
  }

  async #performClose(): Promise<void> {
    const activeVerification = this.#verificationPromise;
    if (activeVerification) {
      await activeVerification.catch(() => undefined);
    }
    try {
      await this.#pool.end();
      await this.#database.destroy();
      this.#state = 'closed';
      this.#closedAt = new Date();
    } catch {
      const error = new DatabaseConnectionError(
        'DATABASE_CONNECTION_CLOSE_FAILED',
        'closing',
      );
      this.#lastError = error;
      this.#state = 'failed';
      throw error;
    }
  }
}

export function createDatabaseConnection(
  config: Readonly<DatabaseConfig>,
): DatabaseConnection {
  return new ControlledDatabaseConnection(config);
}

export function sanitizeDatabaseConnectionState(
  connection: DatabaseConnection,
): SanitizedDatabaseConnectionState {
  if (!(connection instanceof ControlledDatabaseConnection)) {
    throw new DatabaseConnectionError(
      'DATABASE_CONNECTION_INVALID_STATE',
      connection.state,
    );
  }
  return connection.sanitizedState();
}
