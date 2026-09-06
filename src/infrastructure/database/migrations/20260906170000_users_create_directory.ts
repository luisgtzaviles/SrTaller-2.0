import { sql } from 'kysely';
import type { Kysely, SqlBool } from 'kysely';
import type { DatabaseSchema } from '../database-types.js';

export async function up(database: Kysely<DatabaseSchema>): Promise<void> {
  await database.schema.createTable('users')
    .addColumn('user_id', 'uuid', (column) => column.notNull())
    .addColumn('tenant_id', 'uuid', (column) => column.notNull())
    .addColumn('display_name', 'varchar(160)', (column) => column.notNull())
    .addColumn('operational_identifier', 'varchar(160)')
    .addColumn('status', 'varchar(16)', (column) => column.notNull().defaultTo('active'))
    .addColumn('version', 'integer', (column) => column.notNull().defaultTo(0))
    .addColumn('created_at', 'timestamptz', (column) => column.notNull())
    .addColumn('updated_at', 'timestamptz', (column) => column.notNull())
    .addPrimaryKeyConstraint('users_pk', ['tenant_id', 'user_id'])
    .addForeignKeyConstraint('users_tenant_fk', ['tenant_id'], 'tenants', ['tenant_id'])
    .addCheckConstraint('users_status_ck', sql`status in ('active', 'inactive', 'revoked')`)
    .addCheckConstraint('users_version_ck', sql`version >= 0`)
    .execute();
  await database.schema.createIndex('users_tenant_display_name_idx').on('users').columns(['tenant_id', 'display_name']).execute();
  await database.schema.createIndex('users_tenant_operational_identifier_uq').on('users').columns(['tenant_id', 'operational_identifier']).unique().where(sql<SqlBool>`operational_identifier is not null`).execute();
}

export async function down(database: Kysely<DatabaseSchema>): Promise<void> {
  await database.schema.dropTable('users').execute();
}
