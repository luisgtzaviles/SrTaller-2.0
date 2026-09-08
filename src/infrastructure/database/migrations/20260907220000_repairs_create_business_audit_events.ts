import { sql, type Kysely } from 'kysely';

import type { DatabaseSchema } from '../database-types.js';

export async function up(database: Kysely<DatabaseSchema>): Promise<void> {
  await database.schema
    .alterTable('repair_timeline_entries')
    .alterColumn('actor_display_name', (column) =>
      column.setDataType('varchar(160)'),
    )
    .execute();

  await database.schema
    .createTable('repair_business_audit_events')
    .addColumn('audit_id', 'uuid', (column) => column.notNull())
    .addColumn('tenant_id', 'uuid', (column) => column.notNull())
    .addColumn('branch_id', 'uuid', (column) => column.notNull())
    .addColumn('station_id', 'uuid', (column) => column.notNull())
    .addColumn('session_id', 'uuid', (column) => column.notNull())
    .addColumn('actor_user_id', 'uuid', (column) => column.notNull())
    .addColumn('actor_display_name', 'varchar(160)', (column) => column.notNull())
    .addColumn('capability', 'varchar(80)', (column) => column.notNull())
    .addColumn('action', 'varchar(80)', (column) => column.notNull())
    .addColumn('resource_type', 'varchar(32)', (column) => column.notNull())
    .addColumn('resource_id', 'uuid', (column) => column.notNull())
    .addColumn('result', 'varchar(16)', (column) => column.notNull())
    .addColumn('correlation_id', 'uuid', (column) => column.notNull())
    .addColumn('client_request_id', 'uuid', (column) => column.notNull())
    .addColumn('occurred_at', 'timestamptz', (column) => column.notNull())
    .addColumn('created_at', 'timestamptz', (column) => column.notNull())
    .addPrimaryKeyConstraint('repair_business_audit_events_pk', ['audit_id'])
    .addUniqueConstraint('repair_business_audit_events_request_uq', [
      'tenant_id',
      'branch_id',
      'action',
      'client_request_id',
    ])
    .addUniqueConstraint('repair_business_audit_events_correlation_uq', [
      'correlation_id',
    ])
    .addForeignKeyConstraint(
      'repair_business_audit_events_repair_scope_fk',
      ['tenant_id', 'branch_id', 'resource_id'],
      'repairs',
      ['tenant_id', 'branch_id', 'repair_id'],
      (constraint) => constraint.onUpdate('restrict').onDelete('restrict'),
    )
    .addCheckConstraint(
      'repair_business_audit_events_contract_ck',
      sql`capability = 'repairs.add_note' and action = 'repair.operational_note.added' and resource_type = 'repair' and result = 'succeeded'`,
    )
    .addCheckConstraint(
      'repair_business_audit_events_time_ck',
      sql`created_at >= occurred_at`,
    )
    .execute();

  await database.schema
    .createIndex('repair_business_audit_events_scope_time_idx')
    .on('repair_business_audit_events')
    .columns(['tenant_id', 'branch_id', 'resource_id', 'occurred_at', 'audit_id'])
    .execute();

  await sql`
    create function repairs_reject_business_audit_event_mutation()
    returns trigger
    language plpgsql
    as $function$
    begin
      raise check_violation using
        message = 'Repair business audit events are append-only.',
        constraint = 'repair_business_audit_events_append_only_ck',
        table = 'repair_business_audit_events';
    end;
    $function$
  `.execute(database);

  await sql`
    create trigger repair_business_audit_events_reject_update
    before update on repair_business_audit_events
    for each row execute function repairs_reject_business_audit_event_mutation()
  `.execute(database);

  await sql`
    create trigger repair_business_audit_events_reject_delete
    before delete on repair_business_audit_events
    for each row execute function repairs_reject_business_audit_event_mutation()
  `.execute(database);
}

export async function down(database: Kysely<DatabaseSchema>): Promise<void> {
  await sql`drop trigger if exists repair_business_audit_events_reject_delete on repair_business_audit_events`.execute(database);
  await sql`drop trigger if exists repair_business_audit_events_reject_update on repair_business_audit_events`.execute(database);
  await sql`drop function if exists repairs_reject_business_audit_event_mutation()`.execute(database);
  await database.schema
    .dropIndex('repair_business_audit_events_scope_time_idx')
    .execute();
  await database.schema.dropTable('repair_business_audit_events').execute();
}
