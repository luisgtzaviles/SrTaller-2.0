import { sql } from 'kysely';
import type { Kysely } from 'kysely';

import type { DatabaseSchema } from '../database-types.js';

/** Durable replay evidence for User identity-metadata edits. */
export async function up(database: Kysely<DatabaseSchema>): Promise<void> {
  await database.schema
    .createTable('user_profile_update_commands')
    .addColumn('tenant_id', 'uuid', (column) => column.notNull())
    .addColumn('client_request_id', 'uuid', (column) => column.notNull())
    .addColumn('user_id', 'uuid', (column) => column.notNull())
    .addColumn('requested_display_name', 'varchar(160)', (column) => column.notNull())
    .addColumn('requested_operational_identifier', 'varchar(160)')
    .addColumn('expected_version', 'integer', (column) => column.notNull())
    .addColumn('result_display_name', 'varchar(160)', (column) => column.notNull())
    .addColumn('result_operational_identifier', 'varchar(160)')
    .addColumn('result_status', 'varchar(16)', (column) => column.notNull())
    .addColumn('result_version', 'integer', (column) => column.notNull())
    .addColumn('result_created_at', 'timestamptz', (column) => column.notNull())
    .addColumn('result_updated_at', 'timestamptz', (column) => column.notNull())
    .addColumn('applied_at', 'timestamptz', (column) => column.notNull())
    .addPrimaryKeyConstraint('user_profile_update_commands_pk', [
      'tenant_id',
      'client_request_id',
    ])
    .addForeignKeyConstraint(
      'user_profile_update_commands_user_fk',
      ['tenant_id', 'user_id'],
      'users',
      ['tenant_id', 'user_id'],
    )
    .addCheckConstraint(
      'user_profile_update_commands_version_ck',
      sql`expected_version >= 0 and result_version = expected_version + 1`,
    )
    .execute();
}

export async function down(database: Kysely<DatabaseSchema>): Promise<void> {
  await database.schema.dropTable('user_profile_update_commands').execute();
}
