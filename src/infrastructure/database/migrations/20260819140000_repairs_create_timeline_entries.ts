import { sql, type Kysely } from 'kysely';

import type { DatabaseSchema } from '../database-types.js';

export async function up(database: Kysely<DatabaseSchema>): Promise<void> {
  await database.schema
    .createTable('repair_timeline_entries')
    .addColumn('entry_id', 'uuid', (column) => column.notNull())
    .addColumn('tenant_id', 'uuid', (column) => column.notNull())
    .addColumn('branch_id', 'uuid', (column) => column.notNull())
    .addColumn('repair_id', 'uuid', (column) => column.notNull())
    .addColumn('entry_type', 'varchar(24)', (column) => column.notNull())
    .addColumn('actor_id', 'uuid')
    .addColumn('actor_display_name', 'varchar(120)', (column) => column.notNull())
    .addColumn('title', 'varchar(160)')
    .addColumn('body', 'varchar(4000)')
    .addColumn('source', 'varchar(80)', (column) => column.notNull())
    .addColumn('occurred_at', 'timestamptz', (column) => column.notNull())
    .addColumn('created_at', 'timestamptz', (column) => column.notNull())
    .addPrimaryKeyConstraint('repair_timeline_entries_pk', ['entry_id'])
    .addForeignKeyConstraint(
      'repair_timeline_entries_repair_scope_fk',
      ['tenant_id', 'branch_id', 'repair_id'],
      'repairs',
      ['tenant_id', 'branch_id', 'repair_id'],
      (constraint) => constraint.onUpdate('restrict').onDelete('restrict'),
    )
    .addCheckConstraint(
      'repair_timeline_entries_type_ck',
      sql`entry_type in ('note', 'system_event')`,
    )
    .addCheckConstraint(
      'repair_timeline_entries_content_ck',
      sql`title is not null or body is not null`,
    )
    .addCheckConstraint(
      'repair_timeline_entries_note_actor_ck',
      sql`entry_type <> 'note' or actor_id is not null`,
    )
    .execute();

  await database.schema
    .createIndex('repair_timeline_entries_scope_time_idx')
    .on('repair_timeline_entries')
    .columns(['tenant_id', 'branch_id', 'repair_id', 'occurred_at', 'entry_id'])
    .execute();
}

export async function down(database: Kysely<DatabaseSchema>): Promise<void> {
  await database.schema
    .dropIndex('repair_timeline_entries_scope_time_idx')
    .execute();
  await database.schema.dropTable('repair_timeline_entries').execute();
}
