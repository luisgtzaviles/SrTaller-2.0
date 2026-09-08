import { sql, type Kysely } from 'kysely';

import type { DatabaseSchema } from '../database-types.js';

export async function up(database: Kysely<DatabaseSchema>): Promise<void> {
  await database.schema
    .alterTable('access_roles')
    .addColumn('description', 'varchar(320)')
    .execute();
  await sql`
    alter table access_roles
    add constraint access_roles_description_ck
    check (description is null or length(btrim(description)) > 0)
  `.execute(database);

  await database.schema
    .createTable('access_role_commands')
    .addColumn('tenant_id', 'uuid', (column) => column.notNull())
    .addColumn('client_request_id', 'uuid', (column) => column.notNull())
    .addColumn('command_type', 'varchar(24)', (column) => column.notNull())
    .addColumn('role_id', 'uuid', (column) => column.notNull())
    .addColumn('request_fingerprint', 'bytea', (column) => column.notNull())
    .addColumn('result_role_key', 'varchar(64)', (column) => column.notNull())
    .addColumn('result_display_name', 'varchar(160)', (column) => column.notNull())
    .addColumn('result_description', 'varchar(320)')
    .addColumn('result_status', 'varchar(16)', (column) => column.notNull())
    .addColumn('result_version', 'integer', (column) => column.notNull())
    .addColumn('result_capability_codes', sql`varchar(80)[]`, (column) => column.notNull())
    .addColumn('result_created_at', 'timestamptz', (column) => column.notNull())
    .addColumn('result_updated_at', 'timestamptz', (column) => column.notNull())
    .addColumn('applied_at', 'timestamptz', (column) => column.notNull())
    .addPrimaryKeyConstraint('access_role_commands_pk', [
      'tenant_id',
      'client_request_id',
    ])
    .addForeignKeyConstraint(
      'access_role_commands_role_fk',
      ['tenant_id', 'role_id'],
      'access_roles',
      ['tenant_id', 'role_id'],
      (constraint) => constraint.onUpdate('restrict').onDelete('restrict'),
    )
    .addCheckConstraint(
      'access_role_commands_type_ck',
      sql`command_type in ('create', 'update', 'replace_capabilities')`,
    )
    .addCheckConstraint(
      'access_role_commands_fingerprint_ck',
      sql`octet_length(request_fingerprint) = 32`,
    )
    .addCheckConstraint(
      'access_role_commands_result_ck',
      sql`result_version >= 0 and cardinality(result_capability_codes) > 0`,
    )
    .addCheckConstraint(
      'access_role_commands_time_ck',
      sql`result_updated_at >= result_created_at and applied_at >= result_created_at`,
    )
    .execute();
}

export async function down(database: Kysely<DatabaseSchema>): Promise<void> {
  await database.schema.dropTable('access_role_commands').execute();
  await sql`
    alter table access_roles drop constraint access_roles_description_ck
  `.execute(database);
  await database.schema.alterTable('access_roles').dropColumn('description').execute();
}
