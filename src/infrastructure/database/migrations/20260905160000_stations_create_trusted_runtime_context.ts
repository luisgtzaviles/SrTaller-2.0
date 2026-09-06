import { sql } from 'kysely';
import type { Kysely, SqlBool } from 'kysely';
import type { DatabaseSchema } from '../database-types.js';

export async function up(database: Kysely<DatabaseSchema>): Promise<void> {
  await database.schema.alterTable('branches')
    .addColumn('active', 'boolean', (column) => column.notNull().defaultTo(true))
    .execute();

  await database.schema.createTable('stations')
    .addColumn('tenant_id', 'uuid', (column) => column.notNull())
    .addColumn('station_id', 'uuid', (column) => column.notNull())
    .addColumn('status', 'varchar(16)', (column) => column.notNull())
    .addColumn('created_at', 'timestamptz', (column) => column.notNull())
    .addColumn('updated_at', 'timestamptz', (column) => column.notNull())
    .addColumn('revoked_at', 'timestamptz')
    .addPrimaryKeyConstraint('stations_pk', ['tenant_id', 'station_id'])
    .addForeignKeyConstraint('stations_tenant_fk', ['tenant_id'], 'tenants', ['tenant_id'])
    .addCheckConstraint('stations_status_ck', sql`status in ('active', 'revoked')`)
    .addCheckConstraint('stations_revoked_ck', sql`(status = 'revoked') = (revoked_at is not null)`)
    .execute();
  await database.schema.createTable('station_bindings')
    .addColumn('tenant_id', 'uuid', (column) => column.notNull())
    .addColumn('station_id', 'uuid', (column) => column.notNull())
    .addColumn('branch_id', 'uuid', (column) => column.notNull())
    .addColumn('revoked_at', 'timestamptz')
    .addColumn('created_at', 'timestamptz', (column) => column.notNull())
    .addPrimaryKeyConstraint('station_bindings_pk', ['tenant_id', 'station_id'])
    .addForeignKeyConstraint('station_bindings_station_fk', ['tenant_id', 'station_id'], 'stations', ['tenant_id', 'station_id'])
    .addForeignKeyConstraint('station_bindings_branch_fk', ['tenant_id', 'branch_id'], 'branches', ['tenant_id', 'branch_id'])
    .execute();
  await database.schema.createTable('station_credentials')
    .addColumn('credential_id', 'uuid', (column) => column.primaryKey())
    .addColumn('credential_hash', 'varchar(128)', (column) => column.notNull().unique())
    .addColumn('tenant_id', 'uuid', (column) => column.notNull())
    .addColumn('station_id', 'uuid', (column) => column.notNull())
    .addColumn('revoked_at', 'timestamptz')
    .addColumn('created_at', 'timestamptz', (column) => column.notNull())
    .addForeignKeyConstraint('station_credentials_station_fk', ['tenant_id', 'station_id'], 'stations', ['tenant_id', 'station_id'])
    .execute();
  await database.schema.createIndex('station_credentials_active_hash_idx').on('station_credentials').columns(['credential_hash']).where(sql<SqlBool>`revoked_at is null`).execute();
}

export async function down(database: Kysely<DatabaseSchema>): Promise<void> {
  await database.schema.dropTable('station_credentials').execute();
  await database.schema.dropTable('station_bindings').execute();
  await database.schema.dropTable('stations').execute();
  await database.schema.alterTable('branches').dropColumn('active').execute();
}
