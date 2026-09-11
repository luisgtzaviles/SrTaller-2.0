import { sql, type Kysely } from 'kysely';

import type { DatabaseSchema } from '../database-types.js';

export async function up(database: Kysely<DatabaseSchema>): Promise<void> {
  await database.schema
    .createTable('user_preferences')
    .addColumn('tenant_id', 'uuid', (column) => column.notNull())
    .addColumn('user_id', 'uuid', (column) => column.notNull())
    .addColumn('new_repair_form_mode', 'varchar(16)', (column) =>
      column.notNull().defaultTo('classic'),
    )
    .addColumn('updated_at', 'timestamptz', (column) => column.notNull())
    .addPrimaryKeyConstraint('user_preferences_pk', ['tenant_id', 'user_id'])
    .addForeignKeyConstraint(
      'user_preferences_user_fk',
      ['tenant_id', 'user_id'],
      'users',
      ['tenant_id', 'user_id'],
      (constraint) => constraint.onUpdate('restrict').onDelete('restrict'),
    )
    .addCheckConstraint(
      'user_preferences_new_repair_form_mode_ck',
      sql`new_repair_form_mode in ('classic', 'guided_v2')`,
    )
    .execute();
}

export async function down(database: Kysely<DatabaseSchema>): Promise<void> {
  await database.schema.dropTable('user_preferences').execute();
}
