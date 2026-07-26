import { inspect } from 'node:util';
import { setTimeout as delay } from 'node:timers/promises';
import { fileURLToPath } from 'node:url';

import { Migrator } from 'kysely/migration';
import type {
  MigrationInfo,
  MigrationResult,
  MigrationResultSet,
} from 'kysely/migration';

import type { DatabaseConnection } from './database-connection.js';
import {
  DatabaseMigrationCapabilityError,
  databaseMigrationCapability,
  databaseMigrationRuntime,
} from './database-migration-capability.js';
import type {
  InternalDatabaseMigrationConnection,
  InternalDatabaseMigrationExecutor,
  InternalDatabaseMigrationRuntime,
} from './database-migration-capability.js';
import {
  InternalMigrationProviderError,
  createGovernedFileMigrationProvider,
  databaseMigrationSourceOverride,
  inspectMigrationSource,
} from './database-migration-provider.js';
import type {
  InternalMigrationInspection,
  InternalMigrationManifest,
  InternalMigrationSource,
} from './database-migration-provider.js';

type DatabaseMigrationRunnerState =
  | 'created'
  | 'inspecting'
  | 'acquiring-lock'
  | 'running'
  | 'ready'
  | 'failed'
  | 'closing'
  | 'closed';

type DatabaseMigrationOperation =
  | 'create'
  | 'status'
  | 'latest'
  | 'up'
  | 'down'
  | 'destroy';

type DatabaseMigrationErrorCode =
  | 'DATABASE_MIGRATION_INVALID_STATE'
  | 'DATABASE_MIGRATION_INVALID_ROLE'
  | 'DATABASE_MIGRATION_DIRECTORY_MISSING'
  | 'DATABASE_MIGRATION_PATH_FORBIDDEN'
  | 'DATABASE_MIGRATION_FILENAME_INVALID'
  | 'DATABASE_MIGRATION_DUPLICATE'
  | 'DATABASE_MIGRATION_DRIFT_DETECTED'
  | 'DATABASE_MIGRATION_LOCK_TIMEOUT'
  | 'DATABASE_MIGRATION_LOCK_FAILED'
  | 'DATABASE_MIGRATION_EXECUTION_FAILED'
  | 'DATABASE_MIGRATION_DOWN_FORBIDDEN'
  | 'DATABASE_MIGRATION_DOWN_FAILED'
  | 'DATABASE_MIGRATION_STATUS_FAILED'
  | 'DATABASE_MIGRATION_PROVIDER_FAILED'
  | 'DATABASE_MIGRATION_CLEANUP_FAILED';

type DatabaseMigrationErrorCategory =
  | 'Concurrency'
  | 'Configuration'
  | 'Infrastructure'
  | 'Persistence'
  | 'Unexpected';

type DatabaseMigrationErrorContract = Readonly<{
  category: DatabaseMigrationErrorCategory;
  message: string;
}>;

export type DatabaseMigrationRunnerOptions = Readonly<{
  lockTimeoutMs?: number;
  expectedManifestHash?: string;
}>;

type InternalDatabaseMigrationRunnerOptions =
  DatabaseMigrationRunnerOptions &
  Readonly<{
    [databaseMigrationSourceOverride]?: InternalMigrationSource;
  }>;

export type DatabaseMigrationDownAuthorization = Readonly<{
  migrationName: string;
  expectedHash: string;
  reason: string;
  environment: 'development' | 'production';
  confirmation: 'REVERT_ONE_MIGRATION';
}>;

export type DatabaseMigrationStatusItem = Readonly<{
  name: string;
  fileName: string;
  order: number;
  hash: string;
  state: 'applied' | 'pending' | 'error';
  appliedAt: string | null;
}>;

export type DatabaseMigrationStatus = Readonly<{
  state: DatabaseMigrationRunnerState;
  manifestHash: string;
  manifestVerification: 'match' | 'unverified';
  migrations: readonly DatabaseMigrationStatusItem[];
}>;

export type DatabaseMigrationExecution = Readonly<{
  operation: 'latest' | 'up' | 'down';
  manifestHash: string;
  results: readonly Readonly<{
    name: string;
    direction: 'Up' | 'Down';
    status: 'Success' | 'Error' | 'NotExecuted';
  }>[];
  status: DatabaseMigrationStatus;
}>;

export interface DatabaseMigrationRunner {
  readonly state: DatabaseMigrationRunnerState;
  getMigrationStatus(): Promise<DatabaseMigrationStatus>;
  migrateToLatest(): Promise<DatabaseMigrationExecution>;
  migrateUp(): Promise<DatabaseMigrationExecution>;
  migrateDown(
    authorization: DatabaseMigrationDownAuthorization,
  ): Promise<DatabaseMigrationExecution>;
  destroy(): Promise<void>;
}

const errorContracts: Readonly<
  Record<DatabaseMigrationErrorCode, DatabaseMigrationErrorContract>
> = Object.freeze({
  DATABASE_MIGRATION_INVALID_STATE: Object.freeze({
    category: 'Configuration',
    message: 'Database migration operation is not valid in the current state.',
  }),
  DATABASE_MIGRATION_INVALID_ROLE: Object.freeze({
    category: 'Configuration',
    message: 'Database migration role is not authorized.',
  }),
  DATABASE_MIGRATION_DIRECTORY_MISSING: Object.freeze({
    category: 'Configuration',
    message: 'Authorized database migration directory is not available.',
  }),
  DATABASE_MIGRATION_PATH_FORBIDDEN: Object.freeze({
    category: 'Configuration',
    message: 'Database migration path is not authorized.',
  }),
  DATABASE_MIGRATION_FILENAME_INVALID: Object.freeze({
    category: 'Configuration',
    message: 'Database migration filename is invalid.',
  }),
  DATABASE_MIGRATION_DUPLICATE: Object.freeze({
    category: 'Configuration',
    message: 'Database migration identity is duplicated.',
  }),
  DATABASE_MIGRATION_DRIFT_DETECTED: Object.freeze({
    category: 'Persistence',
    message: 'Database migration manifest drift was detected.',
  }),
  DATABASE_MIGRATION_LOCK_TIMEOUT: Object.freeze({
    category: 'Concurrency',
    message: 'Database migration lock timed out.',
  }),
  DATABASE_MIGRATION_LOCK_FAILED: Object.freeze({
    category: 'Infrastructure',
    message: 'Database migration lock operation failed.',
  }),
  DATABASE_MIGRATION_EXECUTION_FAILED: Object.freeze({
    category: 'Persistence',
    message: 'Database migration execution failed.',
  }),
  DATABASE_MIGRATION_DOWN_FORBIDDEN: Object.freeze({
    category: 'Configuration',
    message: 'Database migration down operation is not authorized.',
  }),
  DATABASE_MIGRATION_DOWN_FAILED: Object.freeze({
    category: 'Persistence',
    message: 'Database migration down operation failed.',
  }),
  DATABASE_MIGRATION_STATUS_FAILED: Object.freeze({
    category: 'Persistence',
    message: 'Database migration status could not be read.',
  }),
  DATABASE_MIGRATION_PROVIDER_FAILED: Object.freeze({
    category: 'Infrastructure',
    message: 'Database migration provider failed.',
  }),
  DATABASE_MIGRATION_CLEANUP_FAILED: Object.freeze({
    category: 'Infrastructure',
    message: 'Database migration cleanup failed.',
  }),
});

const productMigrationRoot = fileURLToPath(
  new URL('./migrations/', import.meta.url),
);
const productMigrationSource: InternalMigrationSource = Object.freeze({
  root: productMigrationRoot,
  authorizedRoot: productMigrationRoot,
  normalizedRoot: 'src/infrastructure/database/migrations',
  mode: 'compiled',
});
const migrationLockId = '3853314791062309107';
const defaultLockTimeoutMs = 1_000;
const allowedOptionNames = new Set([
  'expectedManifestHash',
  'lockTimeoutMs',
]);

export class DatabaseMigrationError extends Error {
  readonly category: DatabaseMigrationErrorCategory;
  #cause: unknown;

  constructor(
    readonly code: DatabaseMigrationErrorCode,
    readonly operation: DatabaseMigrationOperation,
    readonly state: DatabaseMigrationRunnerState,
    readonly environment: InternalDatabaseMigrationRuntime['environment'] | null,
    readonly role: InternalDatabaseMigrationRuntime['role'] | null,
    readonly migrationName: string | null = null,
    readonly lockTimeoutMs: number | null = null,
    cause?: unknown,
  ) {
    const contract = errorContracts[code];
    super(contract.message);
    this.name = 'DatabaseMigrationError';
    this.category = contract.category;
    this.#cause = cause;
  }

  toJSON(): Readonly<{
    name: 'DatabaseMigrationError';
    code: DatabaseMigrationErrorCode;
    category: DatabaseMigrationErrorCategory;
    message: string;
    operation: DatabaseMigrationOperation;
    state: DatabaseMigrationRunnerState;
    environment: InternalDatabaseMigrationRuntime['environment'] | null;
    role: InternalDatabaseMigrationRuntime['role'] | null;
    migrationName: string | null;
    lockTimeoutMs: number | null;
  }> {
    return Object.freeze({
      name: 'DatabaseMigrationError',
      code: this.code,
      category: this.category,
      message: this.message,
      operation: this.operation,
      state: this.state,
      environment: this.environment,
      role: this.role,
      migrationName: this.migrationName,
      lockTimeoutMs: this.lockTimeoutMs,
    });
  }

  [inspect.custom](): ReturnType<DatabaseMigrationError['toJSON']> {
    return this.toJSON();
  }
}

function validateOptions(
  options: DatabaseMigrationRunnerOptions,
): Readonly<{
  lockTimeoutMs: number;
  expectedManifestHash: string | null;
  source: InternalMigrationSource;
}> {
  const internal = options as InternalDatabaseMigrationRunnerOptions;
  if (
    typeof options !== 'object' ||
    options === null ||
    Array.isArray(options) ||
    Reflect.ownKeys(options).some(
      (name) =>
        name !== databaseMigrationSourceOverride &&
        (typeof name !== 'string' || !allowedOptionNames.has(name)),
    ) ||
    (options.lockTimeoutMs !== undefined &&
      (!Number.isInteger(options.lockTimeoutMs) ||
        options.lockTimeoutMs < 10 ||
        options.lockTimeoutMs > 60_000)) ||
    (options.expectedManifestHash !== undefined &&
      !/^[a-f0-9]{64}$/u.test(options.expectedManifestHash))
  ) {
    throw new DatabaseMigrationError(
      'DATABASE_MIGRATION_INVALID_STATE',
      'create',
      'created',
      null,
      null,
    );
  }
  return Object.freeze({
    lockTimeoutMs: options.lockTimeoutMs ?? defaultLockTimeoutMs,
    expectedManifestHash: options.expectedManifestHash ?? null,
    source: internal[databaseMigrationSourceOverride] ?? productMigrationSource,
  });
}

function migrationConnection(
  connection: DatabaseConnection,
): InternalDatabaseMigrationConnection {
  if (
    typeof connection !== 'object' ||
    connection === null ||
    !(databaseMigrationCapability in connection) ||
    !(databaseMigrationRuntime in connection)
  ) {
    throw new DatabaseMigrationError(
      'DATABASE_MIGRATION_INVALID_STATE',
      'create',
      'created',
      null,
      null,
    );
  }
  return connection as DatabaseConnection &
    InternalDatabaseMigrationConnection;
}

function validateRuntime(
  runtime: InternalDatabaseMigrationRuntime,
  operation: DatabaseMigrationOperation,
  state: DatabaseMigrationRunnerState,
): void {
  if (
    runtime.role !== 'migration' ||
    !runtime.migrationsEnabled ||
    runtime.accessMode !== 'read-write'
  ) {
    throw new DatabaseMigrationError(
      'DATABASE_MIGRATION_INVALID_ROLE',
      operation,
      state,
      runtime.environment,
      runtime.role,
    );
  }
}

function providerErrorCode(
  error: InternalMigrationProviderError,
): DatabaseMigrationErrorCode {
  if (error.code === 'DIRECTORY_MISSING') {
    return 'DATABASE_MIGRATION_DIRECTORY_MISSING';
  }
  if (error.code === 'PATH_FORBIDDEN') {
    return 'DATABASE_MIGRATION_PATH_FORBIDDEN';
  }
  if (error.code === 'FILENAME_INVALID') {
    return 'DATABASE_MIGRATION_FILENAME_INVALID';
  }
  if (error.code === 'DUPLICATE') {
    return 'DATABASE_MIGRATION_DUPLICATE';
  }
  return 'DATABASE_MIGRATION_PROVIDER_FAILED';
}

function statusFrom(
  state: DatabaseMigrationRunnerState,
  manifest: InternalMigrationManifest,
  infos: readonly MigrationInfo[],
  expectedManifestHash: string | null,
): DatabaseMigrationStatus {
  const infoByName = new Map(infos.map((info) => [info.name, info]));
  return Object.freeze({
    state,
    manifestHash: manifest.aggregateSha256,
    manifestVerification:
      expectedManifestHash === null ? 'unverified' : 'match',
    migrations: Object.freeze(
      manifest.migrations.map((migration) => {
        const info = infoByName.get(migration.migrationName);
        return Object.freeze({
          name: migration.migrationName,
          fileName: migration.fileName,
          order: migration.order,
          hash: migration.sha256,
          state: info?.executedAt ? 'applied' : 'pending',
          appliedAt: info?.executedAt?.toISOString() ?? null,
        });
      }),
    ),
  });
}

function executionResults(
  results: readonly MigrationResult[] | undefined,
): DatabaseMigrationExecution['results'] {
  return Object.freeze(
    (results ?? []).map((result) =>
      Object.freeze({
        name: result.migrationName,
        direction: result.direction,
        status: result.status,
      }),
    ),
  );
}

async function tryMigrationLock(
  database: InternalDatabaseMigrationExecutor,
): Promise<boolean> {
  const result = await database
    .selectNoFrom((expression) =>
      expression.fn<boolean>(
        'pg_try_advisory_lock',
        [expression.val(migrationLockId)],
      ).as('acquired'),
    )
    .executeTakeFirstOrThrow();
  return result.acquired;
}

async function releaseMigrationLock(
  database: InternalDatabaseMigrationExecutor,
): Promise<boolean> {
  const result = await database
    .selectNoFrom((expression) =>
      expression.fn<boolean>(
        'pg_advisory_unlock',
        [expression.val(migrationLockId)],
      ).as('released'),
    )
    .executeTakeFirstOrThrow();
  return result.released;
}

async function acquireMigrationLock(
  database: InternalDatabaseMigrationExecutor,
  timeoutMs: number,
): Promise<void> {
  const deadline = performance.now() + timeoutMs;
  do {
    if (await tryMigrationLock(database)) {
      return;
    }
    const remaining = deadline - performance.now();
    if (remaining <= 0) {
      break;
    }
    await delay(Math.min(25, Math.ceil(remaining)));
  } while (performance.now() < deadline);
  throw new DatabaseMigrationError(
    'DATABASE_MIGRATION_LOCK_TIMEOUT',
    'latest',
    'acquiring-lock',
    null,
    null,
    null,
    timeoutMs,
  );
}

class GovernedDatabaseMigrationRunner implements DatabaseMigrationRunner {
  readonly #connection: DatabaseConnection;
  readonly #capability: InternalDatabaseMigrationConnection;
  readonly #runtime: InternalDatabaseMigrationRuntime;
  readonly #source: InternalMigrationSource;
  readonly #lockTimeoutMs: number;
  readonly #expectedManifestHash: string | null;
  #state: DatabaseMigrationRunnerState = 'created';
  #activeOperation: Promise<unknown> | null = null;
  #destroyPromise: Promise<void> | null = null;

  constructor(
    connection: DatabaseConnection,
    options: DatabaseMigrationRunnerOptions,
  ) {
    const validated = validateOptions(options);
    this.#connection = connection;
    this.#capability = migrationConnection(connection);
    this.#runtime = this.#capability[databaseMigrationRuntime]();
    validateRuntime(this.#runtime, 'create', this.#state);
    this.#source = validated.source;
    this.#lockTimeoutMs = validated.lockTimeoutMs;
    this.#expectedManifestHash = validated.expectedManifestHash;
  }

  get state(): DatabaseMigrationRunnerState {
    return this.#state;
  }

  getMigrationStatus(): Promise<DatabaseMigrationStatus> {
    return this.#runExclusive('status', async () => {
      const inspection = await this.#inspect('status', false);
      await this.#ensureConnection('status');
      return this.#capability[databaseMigrationCapability](
        async (database) => {
          const migrator = this.#migrator(database, inspection);
          try {
            const infos = await migrator.getMigrations();
            return statusFrom(
              'ready',
              inspection.manifest,
              infos,
              this.#expectedManifestHash,
            );
          } catch (error: unknown) {
            throw this.#mapError(error, 'status', 'DATABASE_MIGRATION_STATUS_FAILED');
          }
        },
      );
    });
  }

  migrateToLatest(): Promise<DatabaseMigrationExecution> {
    return this.#mutate('latest', (migrator) =>
      migrator.migrateToLatest(),
    );
  }

  migrateUp(): Promise<DatabaseMigrationExecution> {
    return this.#mutate('up', (migrator) => migrator.migrateUp());
  }

  migrateDown(
    authorization: DatabaseMigrationDownAuthorization,
  ): Promise<DatabaseMigrationExecution> {
    return this.#runExclusive('down', async () => {
      const inspection = await this.#inspect('down', true);
      await this.#ensureConnection('down');
      return this.#capability[databaseMigrationCapability](
        async (database) =>
          this.#withLock(database, 'down', async () => {
            const lockedInspection = await this.#inspect('down', true);
            this.#assertStableInspection(inspection, lockedInspection, 'down');
            const migrator = this.#migrator(database, lockedInspection);
            const infos = await this.#migrationInfos(migrator, 'down');
            const applied = infos.filter((info) => info.executedAt);
            const latest = applied.at(-1);
            const manifestItem = latest
              ? lockedInspection.manifest.migrations.find(
                  (item) => item.migrationName === latest.name,
                )
              : undefined;
            this.#validateDownAuthorization(
              authorization,
              latest,
              manifestItem?.sha256,
            );
            if (!latest?.migration.down) {
              throw this.#error(
                'DATABASE_MIGRATION_DOWN_FORBIDDEN',
                'down',
                latest?.name ?? null,
              );
            }
            this.#state = 'running';
            const result = await migrator.migrateDown();
            this.#assertResult(result, 'down');
            const after = await this.#migrationInfos(migrator, 'down');
            return Object.freeze({
              operation: 'down',
              manifestHash: lockedInspection.manifest.aggregateSha256,
              results: executionResults(result.results),
              status: statusFrom(
                'ready',
                lockedInspection.manifest,
                after,
                this.#expectedManifestHash,
              ),
            });
          }),
      );
    });
  }

  destroy(): Promise<void> {
    if (this.#state === 'closed') {
      return Promise.resolve();
    }
    if (this.#destroyPromise) {
      return this.#destroyPromise;
    }
    this.#state = 'closing';
    const active = this.#activeOperation;
    const destroying = (async () => {
      try {
        await active?.catch(() => undefined);
        this.#state = 'closed';
      } catch (error: unknown) {
        this.#state = 'failed';
        throw this.#mapError(
          error,
          'destroy',
          'DATABASE_MIGRATION_CLEANUP_FAILED',
        );
      }
    })();
    this.#destroyPromise = destroying;
    return destroying;
  }

  #migrator(
    database: InternalDatabaseMigrationExecutor,
    inspection: InternalMigrationInspection,
  ): Migrator {
    return new Migrator({
      db: database,
      provider: createGovernedFileMigrationProvider(inspection),
      allowUnorderedMigrations: false,
      disableTransactions: false,
    });
  }

  async #mutate(
    operation: 'latest' | 'up',
    execute: (migrator: Migrator) => Promise<MigrationResultSet>,
  ): Promise<DatabaseMigrationExecution> {
    return this.#runExclusive(operation, async () => {
      const inspection = await this.#inspect(operation, true);
      await this.#ensureConnection(operation);
      return this.#capability[databaseMigrationCapability](
        async (database) =>
          this.#withLock(database, operation, async () => {
            const lockedInspection = await this.#inspect(operation, true);
            this.#assertStableInspection(
              inspection,
              lockedInspection,
              operation,
            );
            const migrator = this.#migrator(database, lockedInspection);
            this.#state = 'running';
            const result = await execute(migrator);
            this.#assertResult(result, operation);
            const infos = await this.#migrationInfos(migrator, operation);
            return Object.freeze({
              operation,
              manifestHash: lockedInspection.manifest.aggregateSha256,
              results: executionResults(result.results),
              status: statusFrom(
                'ready',
                lockedInspection.manifest,
                infos,
                this.#expectedManifestHash,
              ),
            });
          }),
      );
    });
  }

  async #withLock<T>(
    database: InternalDatabaseMigrationExecutor,
    operation: 'latest' | 'up' | 'down',
    callback: () => Promise<T>,
  ): Promise<T> {
    this.#state = 'acquiring-lock';
    let locked = false;
    try {
      await acquireMigrationLock(database, this.#lockTimeoutMs);
      locked = true;
      return await callback();
    } catch (error: unknown) {
      if (error instanceof DatabaseMigrationError) {
        throw new DatabaseMigrationError(
          error.code,
          operation,
          error.state,
          this.#runtime.environment,
          this.#runtime.role,
          error.migrationName,
          this.#lockTimeoutMs,
          error,
        );
      }
      throw this.#mapError(
        error,
        operation,
        'DATABASE_MIGRATION_LOCK_FAILED',
      );
    } finally {
      if (locked) {
        try {
          if (!(await releaseMigrationLock(database))) {
            throw new Error('migration lock was not owned');
          }
        } catch (error: unknown) {
          throw this.#mapError(
            error,
            operation,
            'DATABASE_MIGRATION_CLEANUP_FAILED',
          );
        }
      }
    }
  }

  async #inspect(
    operation: DatabaseMigrationOperation,
    requireExpected: boolean,
  ): Promise<InternalMigrationInspection> {
    this.#state = 'inspecting';
    let inspection: InternalMigrationInspection;
    try {
      inspection = await inspectMigrationSource(this.#source);
    } catch (error: unknown) {
      throw this.#mapError(
        error,
        operation,
        'DATABASE_MIGRATION_PROVIDER_FAILED',
      );
    }
    if (
      (requireExpected && this.#expectedManifestHash === null) ||
      (this.#expectedManifestHash !== null &&
        this.#expectedManifestHash !==
          inspection.manifest.aggregateSha256)
    ) {
      throw this.#error(
        'DATABASE_MIGRATION_DRIFT_DETECTED',
        operation,
      );
    }
    return inspection;
  }

  #assertStableInspection(
    before: InternalMigrationInspection,
    after: InternalMigrationInspection,
    operation: DatabaseMigrationOperation,
  ): void {
    if (
      before.manifest.aggregateSha256 !== after.manifest.aggregateSha256
    ) {
      throw this.#error(
        'DATABASE_MIGRATION_DRIFT_DETECTED',
        operation,
      );
    }
  }

  async #ensureConnection(
    operation: DatabaseMigrationOperation,
  ): Promise<void> {
    if (
      this.#connection.state === 'closing' ||
      this.#connection.state === 'closed'
    ) {
      throw this.#error('DATABASE_MIGRATION_INVALID_STATE', operation);
    }
    if (this.#connection.state !== 'ready') {
      try {
        await this.#connection.verify();
      } catch (error: unknown) {
        throw this.#mapError(
          error,
          operation,
          'DATABASE_MIGRATION_INVALID_STATE',
        );
      }
    }
  }

  async #migrationInfos(
    migrator: Migrator,
    operation: DatabaseMigrationOperation,
  ): Promise<readonly MigrationInfo[]> {
    try {
      return await migrator.getMigrations();
    } catch (error: unknown) {
      throw this.#mapError(
        error,
        operation,
        'DATABASE_MIGRATION_STATUS_FAILED',
      );
    }
  }

  #assertResult(
    result: MigrationResultSet,
    operation: 'latest' | 'up' | 'down',
  ): void {
    if (
      result.error !== undefined ||
      result.results?.some((item) => item.status !== 'Success')
    ) {
      const failed = result.results?.find(
        (item) => item.status === 'Error',
      );
      throw this.#error(
        operation === 'down'
          ? 'DATABASE_MIGRATION_DOWN_FAILED'
          : 'DATABASE_MIGRATION_EXECUTION_FAILED',
        operation,
        failed?.migrationName ?? null,
        result.error,
      );
    }
  }

  #validateDownAuthorization(
    authorization: DatabaseMigrationDownAuthorization,
    latest: MigrationInfo | undefined,
    expectedHash: string | undefined,
  ): void {
    if (
      this.#runtime.environment === 'production' ||
      typeof authorization !== 'object' ||
      authorization === null ||
      Array.isArray(authorization) ||
      Object.keys(authorization).sort().join(',') !==
        'confirmation,environment,expectedHash,migrationName,reason' ||
      authorization.confirmation !== 'REVERT_ONE_MIGRATION' ||
      authorization.environment !== this.#runtime.environment ||
      !/^[a-f0-9]{64}$/u.test(authorization.expectedHash) ||
      authorization.expectedHash !== expectedHash ||
      authorization.migrationName !== latest?.name ||
      typeof authorization.reason !== 'string' ||
      authorization.reason !== authorization.reason.trim() ||
      authorization.reason.length < 12 ||
      authorization.reason.length > 200
    ) {
      throw this.#error(
        'DATABASE_MIGRATION_DOWN_FORBIDDEN',
        'down',
        latest?.name ?? null,
      );
    }
  }

  #runExclusive<T>(
    operation: DatabaseMigrationOperation,
    callback: () => Promise<T>,
  ): Promise<T> {
    if (
      this.#state === 'closing' ||
      this.#state === 'closed' ||
      this.#activeOperation
    ) {
      return Promise.reject(
        this.#error('DATABASE_MIGRATION_INVALID_STATE', operation),
      );
    }
    validateRuntime(this.#runtime, operation, this.#state);
    const active = (async () => {
      try {
        const result = await callback();
        if (this.#state !== 'closing' && this.#state !== 'closed') {
          this.#state = 'ready';
        }
        return result;
      } catch (error: unknown) {
        if (this.#state !== 'closing' && this.#state !== 'closed') {
          this.#state = 'failed';
        }
        throw this.#mapError(
          error,
          operation,
          operation === 'status'
            ? 'DATABASE_MIGRATION_STATUS_FAILED'
            : operation === 'down'
              ? 'DATABASE_MIGRATION_DOWN_FAILED'
              : 'DATABASE_MIGRATION_EXECUTION_FAILED',
        );
      } finally {
        this.#activeOperation = null;
      }
    })();
    this.#activeOperation = active;
    return active;
  }

  #error(
    code: DatabaseMigrationErrorCode,
    operation: DatabaseMigrationOperation,
    migrationName: string | null = null,
    cause?: unknown,
  ): DatabaseMigrationError {
    return new DatabaseMigrationError(
      code,
      operation,
      this.#state,
      this.#runtime.environment,
      this.#runtime.role,
      migrationName,
      code === 'DATABASE_MIGRATION_LOCK_TIMEOUT'
        ? this.#lockTimeoutMs
        : null,
      cause,
    );
  }

  #mapError(
    error: unknown,
    operation: DatabaseMigrationOperation,
    fallback: DatabaseMigrationErrorCode,
  ): DatabaseMigrationError {
    if (error instanceof DatabaseMigrationError) {
      return error;
    }
    if (error instanceof InternalMigrationProviderError) {
      return this.#error(providerErrorCode(error), operation, null, error);
    }
    if (
      error instanceof DatabaseMigrationCapabilityError &&
      error.code === 'OVERLAP_FORBIDDEN'
    ) {
      return this.#error(
        'DATABASE_MIGRATION_INVALID_STATE',
        operation,
        null,
        error,
      );
    }
    return this.#error(fallback, operation, null, error);
  }
}

export function createMigrationRunner(
  connection: DatabaseConnection,
  options: DatabaseMigrationRunnerOptions,
): DatabaseMigrationRunner {
  return new GovernedDatabaseMigrationRunner(connection, options);
}
