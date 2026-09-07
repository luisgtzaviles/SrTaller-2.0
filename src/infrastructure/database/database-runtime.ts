import { fileURLToPath } from 'node:url';
import { inspect } from 'node:util';

import {
  createDatabaseConnection,
  sanitizeDatabaseConnectionState,
} from './database-connection.js';
import type { DatabaseConnection } from './database-connection.js';
import {
  parseDatabaseConfig,
  sanitizeDatabaseConfig,
} from './database-config.js';
import {
  inspectMigrationSource,
} from './database-migration-provider.js';
import type {
  InternalMigrationInspection,
  InternalMigrationSource,
} from './database-migration-provider.js';
import {
  databasePersistenceCapability,
  useDatabasePersistenceExecutor,
} from './database-persistence-capability.js';
import type {
  InternalDatabasePersistenceConnection,
  InternalDatabasePersistenceOperation,
  InternalDatabasePersistenceOwner,
} from './database-persistence-capability.js';
import {
  databaseTransactionCapability,
} from './database-transaction-capability.js';
import type {
  InternalDatabaseTransactionConnection,
  InternalDatabaseTransactionOperation,
  InternalDatabaseTransactionSettings,
} from './database-transaction-capability.js';

type DatabaseRuntimeState =
  | 'created'
  | 'initializing'
  | 'ready'
  | 'failed'
  | 'closing'
  | 'closed';

type DatabaseRuntimeErrorCode =
  | 'DATABASE_RUNTIME_INVALID_STATE'
  | 'DATABASE_RUNTIME_SCHEMA_NOT_READY'
  | 'DATABASE_RUNTIME_INITIALIZATION_FAILED'
  | 'DATABASE_RUNTIME_CLOSE_FAILED';

const productMigrationRoot = fileURLToPath(
  new URL('./migrations/', import.meta.url),
);
const productMigrationSource: InternalMigrationSource = Object.freeze({
  root: productMigrationRoot,
  authorizedRoot: productMigrationRoot,
  normalizedRoot: 'src/infrastructure/database/migrations',
  mode: 'compiled',
});

export interface DatabaseRuntime
  extends
    InternalDatabasePersistenceConnection,
    InternalDatabaseTransactionConnection {
  readonly state: DatabaseRuntimeState;
  initialize(): Promise<void>;
  checkReady(): Promise<boolean>;
  close(): Promise<void>;
}

export class DatabaseRuntimeError extends Error {
  readonly category = 'Persistence';

  constructor(
    readonly code: DatabaseRuntimeErrorCode,
    readonly state: DatabaseRuntimeState,
  ) {
    super('Database runtime is not ready.');
    this.name = 'DatabaseRuntimeError';
  }

  toJSON(): Readonly<{
    name: 'DatabaseRuntimeError';
    category: 'Persistence';
    code: DatabaseRuntimeErrorCode;
    message: string;
    state: DatabaseRuntimeState;
  }> {
    return Object.freeze({
      name: 'DatabaseRuntimeError',
      category: this.category,
      code: this.code,
      message: this.message,
      state: this.state,
    });
  }

  [inspect.custom](): ReturnType<DatabaseRuntimeError['toJSON']> {
    return this.toJSON();
  }
}

class ControlledDatabaseRuntime implements DatabaseRuntime {
  readonly #connection: DatabaseConnection &
    InternalDatabasePersistenceConnection &
    InternalDatabaseTransactionConnection;
  #state: DatabaseRuntimeState = 'created';
  #inspection: InternalMigrationInspection | null = null;
  #readinessPromise: Promise<boolean> | null = null;
  #closePromise: Promise<void> | null = null;

  constructor(input: Readonly<Record<string, string | undefined>>) {
    const config = parseDatabaseConfig(input);
    if (
      config.runtime.role !== 'application' ||
      config.runtime.migrationsEnabled
    ) {
      throw new DatabaseRuntimeError(
        'DATABASE_RUNTIME_INVALID_STATE',
        this.#state,
      );
    }
    this.#connection = createDatabaseConnection(config) as DatabaseConnection &
      InternalDatabasePersistenceConnection &
      InternalDatabaseTransactionConnection;
    void sanitizeDatabaseConfig(config);
  }

  get state(): DatabaseRuntimeState {
    return this.#state;
  }

  async initialize(): Promise<void> {
    if (this.#state !== 'created') {
      throw new DatabaseRuntimeError(
        'DATABASE_RUNTIME_INVALID_STATE',
        this.#state,
      );
    }
    this.#state = 'initializing';
    try {
      this.#inspection = await inspectMigrationSource(productMigrationSource);
      await this.#connection.verify();
      let schemaReady = false;
      try {
        schemaReady = await this.#probeSchema();
      } catch {
        schemaReady = false;
      }
      if (!schemaReady) {
        throw new DatabaseRuntimeError(
          'DATABASE_RUNTIME_SCHEMA_NOT_READY',
          this.#state,
        );
      }
      this.#state = 'ready';
    } catch (error: unknown) {
      this.#state = 'failed';
      if (error instanceof DatabaseRuntimeError) {
        throw error;
      }
      throw new DatabaseRuntimeError(
        'DATABASE_RUNTIME_INITIALIZATION_FAILED',
        this.#state,
      );
    }
  }

  checkReady(): Promise<boolean> {
    if (
      this.#state === 'created' ||
      this.#state === 'initializing' ||
      this.#state === 'closing' ||
      this.#state === 'closed'
    ) {
      return Promise.resolve(false);
    }
    if (this.#readinessPromise) {
      return this.#readinessPromise;
    }
    const readiness = this.#performReadinessCheck();
    this.#readinessPromise = readiness;
    void readiness.finally(() => {
      if (this.#readinessPromise === readiness) {
        this.#readinessPromise = null;
      }
    }).catch(() => undefined);
    return readiness;
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

  verify(): Promise<void> {
    return this.#connection.verify();
  }

  [databasePersistenceCapability]<
    Owner extends InternalDatabasePersistenceOwner,
    Result,
  >(
    owner: Owner,
    operation: InternalDatabasePersistenceOperation<Owner, Result>,
  ): Promise<Result> {
    return this.#connection[databasePersistenceCapability](owner, operation);
  }

  [databaseTransactionCapability]<Result>(
    settings: InternalDatabaseTransactionSettings,
    operation: InternalDatabaseTransactionOperation<Result>,
  ): Promise<Result> {
    return this.#connection[databaseTransactionCapability](settings, operation);
  }

  async #performReadinessCheck(): Promise<boolean> {
    try {
      await this.#connection.verify();
      const ready = await this.#probeSchema();
      this.#state = ready ? 'ready' : 'failed';
      return ready;
    } catch {
      this.#state = 'failed';
      return false;
    }
  }

  async #probeSchema(): Promise<boolean> {
    const expectedNames = this.#inspection?.manifest.migrations.map(
      ({ migrationName }) => migrationName,
    );
    if (!expectedNames || expectedNames.length === 0) {
      return false;
    }
    return useDatabasePersistenceExecutor(
      this.#connection,
      'database',
      async (database) => {
        const journal = await database
          .selectFrom('kysely_migration')
          .select('name')
          .orderBy('name')
          .execute();
        await database
          .selectFrom('tenants')
          .select('tenant_id')
          .limit(0)
          .execute();
        await database
          .selectFrom('branches')
          .select(['tenant_id', 'branch_id'])
          .limit(0)
          .execute();
        await database
          .selectFrom('repairs')
          .select(['repair_id', 'tenant_id', 'branch_id'])
          .limit(0)
          .execute();
        await database
          .selectFrom('repair_intakes')
          .select(['repair_id', 'tenant_id', 'branch_id'])
          .limit(0)
          .execute();
        await database
          .selectFrom('repair_timeline_entries')
          .select(['entry_id', 'repair_id', 'tenant_id', 'branch_id'])
          .limit(0)
          .execute();
        await database
          .selectFrom('repair_attachments')
          .select(['attachment_id', 'repair_id', 'tenant_id', 'branch_id'])
          .limit(0)
          .execute();
        await database
          .selectFrom('repair_technicians')
          .select(['technician_id', 'tenant_id'])
          .limit(0)
          .execute();
        await database
          .selectFrom('repair_technician_branches')
          .select(['tenant_id', 'branch_id', 'technician_id'])
          .limit(0)
          .execute();
        await database
          .selectFrom('repair_technician_assignments')
          .select(['assignment_id', 'repair_id', 'tenant_id', 'branch_id'])
          .limit(0)
          .execute();
        await database
          .selectFrom('repair_workflow_transitions')
          .select(['transition_id', 'repair_id', 'tenant_id', 'branch_id'])
          .limit(0)
          .execute();
        await database
          .selectFrom('repair_locations')
          .select(['location_id', 'tenant_id', 'branch_id'])
          .limit(0)
          .execute();
        await database
          .selectFrom('repair_location_movements')
          .select(['movement_id', 'repair_id', 'tenant_id', 'branch_id'])
          .limit(0)
          .execute();
        await database
          .selectFrom('access_operational_session_station_guards')
          .select(['tenant_id', 'station_id'])
          .limit(0)
          .execute();
        await database
          .selectFrom('access_operational_sessions')
          .select(['tenant_id', 'branch_id', 'station_id', 'session_id'])
          .limit(0)
          .execute();
        return (
          journal.map(({ name }) => name).join(',') ===
          expectedNames.join(',')
        );
      },
    );
  }

  async #performClose(): Promise<void> {
    await this.#readinessPromise?.catch(() => undefined);
    try {
      await this.#connection.close();
      this.#state = 'closed';
    } catch {
      this.#state = 'failed';
      throw new DatabaseRuntimeError(
        'DATABASE_RUNTIME_CLOSE_FAILED',
        this.#state,
      );
    }
  }

  sanitizedState(): ReturnType<typeof sanitizeDatabaseRuntimeState> {
    return Object.freeze({
      state: this.#state,
      migrationCount: this.#inspection?.manifest.migrations.length ?? 0,
      connection: sanitizeDatabaseConnectionState(this.#connection),
    });
  }
}

export function createDatabaseRuntime(
  input: Readonly<Record<string, string | undefined>>,
): DatabaseRuntime {
  return new ControlledDatabaseRuntime(input);
}

export function sanitizeDatabaseRuntimeState(
  runtime: DatabaseRuntime,
): Readonly<{
  state: DatabaseRuntimeState;
  migrationCount: number;
  connection: ReturnType<typeof sanitizeDatabaseConnectionState>;
}> {
  if (!(runtime instanceof ControlledDatabaseRuntime)) {
    throw new DatabaseRuntimeError(
      'DATABASE_RUNTIME_INVALID_STATE',
      runtime.state,
    );
  }
  return runtime.sanitizedState();
}
