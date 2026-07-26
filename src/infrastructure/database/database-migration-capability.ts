import type { Kysely } from 'kysely';

import type { DatabaseConfig } from './database-config.js';

type InternalMigrationDatabaseSchema = Record<
  string,
  Record<string, unknown>
>;

export type InternalDatabaseMigrationExecutor =
  Kysely<InternalMigrationDatabaseSchema>;

export type InternalDatabaseMigrationOperation<T> = (
  executor: InternalDatabaseMigrationExecutor,
) => Promise<T>;

export type InternalDatabaseMigrationRuntime = Readonly<{
  environment: DatabaseConfig['runtime']['environment'];
  role: DatabaseConfig['runtime']['role'];
  accessMode: DatabaseConfig['runtime']['accessMode'];
  migrationsEnabled: boolean;
}>;

export const databaseMigrationCapability: unique symbol = Symbol(
  'srtaller.database.migration-capability',
);

export const databaseMigrationRuntime: unique symbol = Symbol(
  'srtaller.database.migration-runtime',
);

export class DatabaseMigrationCapabilityError extends Error {
  constructor(readonly code: 'OVERLAP_FORBIDDEN') {
    super('Database migration capability rejected the operation.');
    this.name = 'DatabaseMigrationCapabilityError';
  }
}

export interface InternalDatabaseMigrationConnection {
  readonly state: string;
  [databaseMigrationRuntime](): InternalDatabaseMigrationRuntime;
  [databaseMigrationCapability]<T>(
    operation: InternalDatabaseMigrationOperation<T>,
  ): Promise<T>;
}
