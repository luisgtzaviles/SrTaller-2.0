import { sql, type Kysely } from 'kysely';

import type { DatabaseSchema } from '../database-types.js';

export async function up(database: Kysely<DatabaseSchema>): Promise<void> {
  await database.schema
    .alterTable('repair_business_audit_events')
    .addForeignKeyConstraint(
      'repair_business_audit_events_timeline_entry_fk',
      ['tenant_id', 'branch_id', 'resource_id', 'client_request_id'],
      'repair_timeline_entries',
      ['tenant_id', 'branch_id', 'repair_id', 'client_request_id'],
      (constraint) => constraint.onUpdate('restrict').onDelete('restrict'),
    )
    .execute();
  await database.schema
    .alterTable('repair_business_audit_events')
    .addCheckConstraint(
      'repair_business_audit_events_actor_display_name_ck',
      sql`char_length(btrim(actor_display_name)) between 1 and 160`,
    )
    .execute();

  await database.schema
    .createTable('repair_operational_note_request_guards')
    .addColumn('tenant_id', 'uuid', (column) => column.notNull())
    .addColumn('branch_id', 'uuid', (column) => column.notNull())
    .addColumn('action', 'varchar(80)', (column) => column.notNull())
    .addColumn('client_request_id', 'uuid', (column) => column.notNull())
    .addColumn('created_at', 'timestamptz', (column) => column.notNull())
    .addPrimaryKeyConstraint('repair_operational_note_request_guards_pk', [
      'tenant_id',
      'branch_id',
      'action',
      'client_request_id',
    ])
    .addCheckConstraint(
      'repair_operational_note_request_guards_action_ck',
      sql`action = 'repair.operational_note.added'`,
    )
    .execute();
}

export async function down(database: Kysely<DatabaseSchema>): Promise<void> {
  await database.schema
    .dropTable('repair_operational_note_request_guards')
    .execute();
  await database.schema
    .alterTable('repair_business_audit_events')
    .dropConstraint('repair_business_audit_events_actor_display_name_ck')
    .execute();
  await database.schema
    .alterTable('repair_business_audit_events')
    .dropConstraint('repair_business_audit_events_timeline_entry_fk')
    .execute();
}
