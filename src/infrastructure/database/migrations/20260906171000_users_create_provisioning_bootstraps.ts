import type { Kysely } from 'kysely';
import type { DatabaseSchema } from '../database-types.js';

/** Durable one-time bootstrap gate; retained as auditable tenant evidence. */
export async function up(database: Kysely<DatabaseSchema>): Promise<void> {
  await database.schema.createTable('user_provisioning_bootstraps')
    .addColumn('tenant_id', 'uuid', (column) => column.primaryKey())
    .addColumn('first_user_id', 'uuid', (column) => column.notNull())
    .addColumn('client_request_id', 'uuid', (column) => column.notNull())
    .addColumn('provisioned_at', 'timestamptz', (column) => column.notNull())
    .addForeignKeyConstraint('user_provisioning_bootstraps_tenant_fk', ['tenant_id'], 'tenants', ['tenant_id'])
    .execute();
}

export async function down(database: Kysely<DatabaseSchema>): Promise<void> {
  await database.schema.dropTable('user_provisioning_bootstraps').execute();
}
