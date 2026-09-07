import {
  Injectable,
  type OnModuleDestroy,
  type OnModuleInit,
} from '@nestjs/common';

import {
  createDatabaseRuntime,
} from '../database/database-runtime.js';
import type { DatabaseRuntime } from '../database/database-runtime.js';
import {
  DatabasePersistenceCapabilityError,
  databasePersistenceCapability,
} from '../database/database-persistence-capability.js';
import type {
  InternalDatabasePersistenceOperation,
  InternalDatabasePersistenceOwner,
} from '../database/database-persistence-capability.js';
import {
  DatabaseTransactionCapabilityError,
  databaseTransactionCapability,
} from '../database/database-transaction-capability.js';
import type {
  InternalDatabaseTransactionOperation,
  InternalDatabaseTransactionSettings,
} from '../database/database-transaction-capability.js';
import {
  ApplicationDatabaseOperationScheduler,
} from './application-database-operation-scheduler.js';
import type {
  ApplicationDatabaseOperationRelease,
} from './application-database-operation-scheduler.js';
import type { ApplicationDatabaseConnection } from './index.js';
import { RuntimeEnvironmentReader } from './runtime-environment.reader.js';

/**
 * The underlying governed connection deliberately rejects overlapping
 * transactions. A single application runtime is shared by all modules, so an
 * admission scheduler must keep ordinary concurrent HTTP work from turning a
 * safe overlap into an incidental 500. Persistence operations may share the
 * pool; transactions receive a fair exclusive turn. A bounded wait remains
 * fail-closed, including accidental nested calls, while the driver-level
 * nested/overlap prohibition stays unchanged.
 */
@Injectable()
export class ApplicationDatabaseRuntimeProvider
  implements ApplicationDatabaseConnection, OnModuleInit, OnModuleDestroy {
  #runtime: DatabaseRuntime | null = null;
  readonly #operations = new ApplicationDatabaseOperationScheduler();

  constructor(private readonly environment: RuntimeEnvironmentReader) {}

  get state(): string {
    return this.#runtime?.state ?? 'created';
  }

  async onModuleInit(): Promise<void> {
    if (!this.environment.applicationDatabaseConfigured()) {
      return;
    }
    this.#runtime = createDatabaseRuntime(
      this.environment.applicationDatabaseEnvironment(),
    );
    await this.#runtime.initialize();
  }

  async onModuleDestroy(): Promise<void> {
    await this.#operations.close();
    await this.#runtime?.close();
  }

  async verify(): Promise<void> {
    const release = await this.#operations.acquire(
      'transaction',
      () => new Error('Application database runtime scheduling timed out.'),
    );
    try {
      const runtime = this.#requireRuntime();
      if (!(await runtime.checkReady())) {
        throw new Error('Application database runtime is not ready.');
      }
    } finally {
      release();
    }
  }

  async checkReady(): Promise<boolean> {
    let release: ApplicationDatabaseOperationRelease;
    try {
      release = await this.#operations.acquire(
        'transaction',
        () => new Error('Application database runtime scheduling timed out.'),
      );
    } catch {
      return false;
    }
    try {
      return await (this.#runtime?.checkReady() ?? Promise.resolve(false));
    } finally {
      release();
    }
  }

  [databasePersistenceCapability]<
    Owner extends InternalDatabasePersistenceOwner,
    Result,
  >(
    owner: Owner,
    operation: InternalDatabasePersistenceOperation<Owner, Result>,
  ): Promise<Result> {
    return this.#schedulePersistence(() =>
      this.#requireRuntime()[databasePersistenceCapability](owner, operation));
  }

  [databaseTransactionCapability]<Result>(
    settings: InternalDatabaseTransactionSettings,
    operation: InternalDatabaseTransactionOperation<Result>,
  ): Promise<Result> {
    return this.#scheduleTransaction(() =>
      this.#requireRuntime()[databaseTransactionCapability](settings, operation));
  }

  async #schedulePersistence<Result>(
    operation: () => Promise<Result>,
  ): Promise<Result> {
    const release = await this.#operations.acquire(
      'persistence',
      () => new DatabasePersistenceCapabilityError('INVALID_STATE'),
    );
    try {
      return await operation();
    } finally {
      release();
    }
  }

  async #scheduleTransaction<Result>(
    operation: () => Promise<Result>,
  ): Promise<Result> {
    const release = await this.#operations.acquire(
      'transaction',
      () => new DatabaseTransactionCapabilityError('NESTED_FORBIDDEN'),
    );
    try {
      return await operation();
    } finally {
      release();
    }
  }

  #requireRuntime(): DatabaseRuntime {
    if (!this.#runtime) {
      throw new Error('Application database runtime is unavailable.');
    }
    return this.#runtime;
  }
}
