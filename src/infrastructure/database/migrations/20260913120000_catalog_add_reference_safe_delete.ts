import { sql, type Kysely } from 'kysely';

import type { DatabaseSchema } from '../database-types.js';

export async function up(database: Kysely<DatabaseSchema>): Promise<void> {
  await database.schema.createTable('catalog_reference_deletion_events')
    .addColumn('event_id', 'uuid', (column) => column.notNull())
    .addColumn('tenant_id', 'uuid', (column) => column.notNull())
    .addColumn('reference_kind', 'varchar(40)', (column) => column.notNull())
    .addColumn('reference_id', 'uuid', (column) => column.notNull())
    .addColumn('catalog_scope', 'varchar(16)', (column) => column.notNull())
    .addColumn('previous_label', 'varchar(160)')
    .addColumn('previous_status', 'varchar(16)')
    .addColumn('reference_version', 'integer')
    .addColumn('expected_version', 'integer', (column) => column.notNull())
    .addColumn('station_id', 'uuid', (column) => column.notNull())
    .addColumn('session_id', 'uuid', (column) => column.notNull())
    .addColumn('actor_user_id', 'uuid', (column) => column.notNull())
    .addColumn('actor_display_name', 'varchar(160)', (column) => column.notNull())
    .addColumn('capability', 'varchar(160)', (column) => column.notNull())
    .addColumn('result', 'varchar(16)', (column) => column.notNull())
    .addColumn('rejection_reason', 'varchar(40)')
    .addColumn('correlation_id', 'uuid', (column) => column.notNull())
    .addColumn('occurred_at', 'timestamptz', (column) => column.notNull())
    .addPrimaryKeyConstraint('catalog_reference_deletion_events_pk', ['event_id'])
    .addUniqueConstraint('catalog_reference_deletion_events_correlation_uq', ['correlation_id'])
    .addForeignKeyConstraint('catalog_reference_deletion_events_tenant_fk', ['tenant_id'], 'tenants', ['tenant_id'], (constraint) => constraint.onUpdate('restrict').onDelete('restrict'))
    .addCheckConstraint('catalog_reference_deletion_events_kind_ck', sql`reference_kind in ('CATEGORY', 'BRAND')`)
    .addCheckConstraint('catalog_reference_deletion_events_scope_ck', sql`catalog_scope = 'tenant'`)
    .addCheckConstraint('catalog_reference_deletion_events_capability_ck', sql`capability = 'catalog.manage'`)
    .addCheckConstraint('catalog_reference_deletion_events_result_ck', sql`(result = 'succeeded' and rejection_reason is null and previous_label is not null and reference_version = expected_version) or (result = 'rejected' and rejection_reason in ('not_found', 'version_conflict', 'reference_in_use', 'authorization_changed'))`)
    .addCheckConstraint('catalog_reference_deletion_events_version_ck', sql`expected_version >= 1 and (reference_version is null or reference_version >= 1)`)
    .execute();
  await database.schema.createIndex('catalog_reference_deletion_events_scope_idx').on('catalog_reference_deletion_events').columns(['tenant_id', 'reference_kind', 'reference_id', 'occurred_at']).execute();
  await sql`create function reject_catalog_reference_deletion_event_mutation() returns trigger language plpgsql as $function$ begin raise check_violation using message = 'Catalog reference deletion events are append-only.', constraint = 'catalog_reference_deletion_events_append_only_ck', table = 'catalog_reference_deletion_events'; end; $function$`.execute(database);
  await sql`create trigger catalog_reference_deletion_events_reject_update before update on catalog_reference_deletion_events for each row execute function reject_catalog_reference_deletion_event_mutation()`.execute(database);
  await sql`create trigger catalog_reference_deletion_events_reject_delete before delete on catalog_reference_deletion_events for each row execute function reject_catalog_reference_deletion_event_mutation()`.execute(database);
}

export async function down(database: Kysely<DatabaseSchema>): Promise<void> {
  await sql`drop trigger if exists catalog_reference_deletion_events_reject_delete on catalog_reference_deletion_events`.execute(database);
  await sql`drop trigger if exists catalog_reference_deletion_events_reject_update on catalog_reference_deletion_events`.execute(database);
  await sql`drop function if exists reject_catalog_reference_deletion_event_mutation()`.execute(database);
  await database.schema.dropTable('catalog_reference_deletion_events').execute();
}
