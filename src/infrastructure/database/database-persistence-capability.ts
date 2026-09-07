import type { Kysely, Transaction } from 'kysely';

import { useDatabaseTransactionExecutor } from './database-transaction-capability.js';
import type { DatabaseSchema } from './database-types.js';

export type InternalDatabasePersistenceOwner =
  | 'database'
  | 'repairs'
  | 'stations'
  | 'tenancy'
  | 'users';

type DatabaseMigrationJournalTable = Readonly<{
  name: string;
  timestamp: string;
}>;

type DatabaseTechnicalSchema = Pick<DatabaseSchema, 'branches' | 'tenants' | 'stations' | 'station_bindings' | 'station_credentials'> &
  Readonly<{
    kysely_migration: DatabaseMigrationJournalTable;
    repairs: DatabaseSchema['repairs'];
    repair_intakes: DatabaseSchema['repair_intakes'];
    repair_timeline_entries: DatabaseSchema['repair_timeline_entries'];
    repair_attachments: DatabaseSchema['repair_attachments'];
    repair_technicians: DatabaseSchema['repair_technicians'];
    repair_technician_branches: DatabaseSchema['repair_technician_branches'];
    repair_technician_assignments: DatabaseSchema['repair_technician_assignments'];
    repair_workflow_transitions: DatabaseSchema['repair_workflow_transitions'];
    repair_locations: DatabaseSchema['repair_locations'];
    repair_location_movements: DatabaseSchema['repair_location_movements'];
    users: DatabaseSchema['users'];
    user_provisioning_bootstraps: DatabaseSchema['user_provisioning_bootstraps'];
    user_lifecycle_commands: DatabaseSchema['user_lifecycle_commands'];
  }>;

type OwnerSchema<Owner extends InternalDatabasePersistenceOwner> =
  Owner extends 'database'
    ? DatabaseTechnicalSchema
    : Owner extends 'repairs'
    ? Pick<DatabaseSchema, 'repair_attachments' | 'repair_intakes' | 'repair_timeline_entries' | 'repairs' | 'repair_technicians' | 'repair_technician_branches' | 'repair_technician_assignments' | 'repair_workflow_transitions' | 'repair_locations' | 'repair_location_movements'>
    : Owner extends 'tenancy'
    ? Pick<DatabaseSchema, 'tenants'>
    : Owner extends 'users'
    ? Pick<DatabaseSchema, 'users' | 'user_provisioning_bootstraps' | 'user_lifecycle_commands'>
    : Pick<DatabaseSchema, 'branches' | 'stations' | 'station_bindings' | 'station_credentials'>;

export type InternalDatabasePersistenceExecutor<
  Owner extends InternalDatabasePersistenceOwner,
> =
  | Kysely<OwnerSchema<Owner>>
  | Transaction<OwnerSchema<Owner>>;

export type InternalDatabasePersistenceOperation<
  Owner extends InternalDatabasePersistenceOwner,
  Result,
> = (
  executor: InternalDatabasePersistenceExecutor<Owner>,
) => Promise<Result>;

export const databasePersistenceCapability: unique symbol = Symbol(
  'srtaller.database.persistence-capability',
);

export class DatabasePersistenceCapabilityError extends Error {
  constructor(readonly code: 'INVALID_STATE') {
    super('Database persistence capability rejected the operation.');
    this.name = 'DatabasePersistenceCapabilityError';
  }
}

export interface InternalDatabasePersistenceConnection {
  readonly state: string;
  verify(): Promise<void>;
  [databasePersistenceCapability]<
    Owner extends InternalDatabasePersistenceOwner,
    Result,
  >(
    owner: Owner,
    operation: InternalDatabasePersistenceOperation<Owner, Result>,
  ): Promise<Result>;
}

function persistenceConnection(
  connection: object,
): InternalDatabasePersistenceConnection {
  if (
    !(databasePersistenceCapability in connection)
  ) {
    throw new DatabasePersistenceCapabilityError('INVALID_STATE');
  }
  return connection as InternalDatabasePersistenceConnection;
}

export async function useDatabasePersistenceExecutor<
  Owner extends InternalDatabasePersistenceOwner,
  Result,
>(
  connection: object,
  owner: Owner,
  operation: InternalDatabasePersistenceOperation<Owner, Result>,
): Promise<Result> {
  const capability = persistenceConnection(connection);
  if (
    capability.state === 'created' ||
    capability.state === 'verifying' ||
    capability.state === 'failed'
  ) {
    await capability.verify();
  }
  if (capability.state !== 'ready') {
    throw new DatabasePersistenceCapabilityError('INVALID_STATE');
  }
  return capability[databasePersistenceCapability](owner, operation);
}

export async function useTransactionalDatabasePersistenceExecutor<
  Owner extends InternalDatabasePersistenceOwner,
  Result,
>(
  context: object,
  owner: Owner,
  operation: InternalDatabasePersistenceOperation<Owner, Result>,
): Promise<Result> {
  return useDatabaseTransactionExecutor(context, async (executor) =>
    operation(
      executor as unknown as InternalDatabasePersistenceExecutor<Owner>,
    ),
  );
}
