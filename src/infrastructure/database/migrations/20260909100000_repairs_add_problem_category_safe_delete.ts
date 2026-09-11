import { sql, type Kysely } from 'kysely';

import type { DatabaseSchema } from '../database-types.js';

export async function up(database: Kysely<DatabaseSchema>): Promise<void> {
  await database.schema.alterTable('repair_problem_category_catalog_events')
    .dropConstraint('repair_problem_category_catalog_events_category_fk')
    .execute();

  await database.schema.createTable('repair_problem_category_deletion_events')
    .addColumn('event_id', 'uuid', (column) => column.notNull())
    .addColumn('tenant_id', 'uuid', (column) => column.notNull())
    .addColumn('category_id', 'uuid', (column) => column.notNull())
    .addColumn('catalog_scope', 'varchar(16)', (column) => column.notNull())
    .addColumn('previous_label', 'varchar(160)')
    .addColumn('previous_status', 'varchar(16)')
    .addColumn('category_version', 'integer')
    .addColumn('expected_version', 'integer', (column) => column.notNull())
    .addColumn('station_id', 'uuid', (column) => column.notNull())
    .addColumn('session_id', 'uuid', (column) => column.notNull())
    .addColumn('actor_user_id', 'uuid', (column) => column.notNull())
    .addColumn('actor_display_name', 'varchar(160)', (column) => column.notNull())
    .addColumn('capability', 'varchar(80)', (column) => column.notNull())
    .addColumn('action', 'varchar(80)', (column) => column.notNull())
    .addColumn('result', 'varchar(16)', (column) => column.notNull())
    .addColumn('rejection_reason', 'varchar(40)')
    .addColumn('correlation_id', 'uuid', (column) => column.notNull())
    .addColumn('occurred_at', 'timestamptz', (column) => column.notNull())
    .addPrimaryKeyConstraint('repair_problem_category_deletion_events_pk', ['event_id'])
    .addUniqueConstraint('repair_problem_category_deletion_events_correlation_uq', ['correlation_id'])
    .addForeignKeyConstraint('repair_problem_category_deletion_events_tenant_fk', ['tenant_id'], 'tenants', ['tenant_id'], (constraint) => constraint.onUpdate('restrict').onDelete('restrict'))
    .addCheckConstraint('repair_problem_category_deletion_events_scope_ck', sql`catalog_scope in ('platform', 'tenant')`)
    .addCheckConstraint('repair_problem_category_deletion_events_contract_ck', sql`capability = 'repairs.catalogs.manage' and action = 'catalog_entry.deleted' and result in ('succeeded', 'rejected')`)
    .addCheckConstraint('repair_problem_category_deletion_events_version_ck', sql`expected_version >= 1 and (category_version is null or category_version >= 1)`)
    .addCheckConstraint('repair_problem_category_deletion_events_status_ck', sql`previous_status is null or previous_status in ('active', 'inactive')`)
    .addCheckConstraint('repair_problem_category_deletion_events_label_ck', sql`previous_label is null or length(btrim(previous_label)) between 2 and 160`)
    .addCheckConstraint('repair_problem_category_deletion_events_result_ck', sql`(result = 'succeeded' and catalog_scope = 'tenant' and previous_label is not null and previous_status is not null and category_version = expected_version and rejection_reason is null) or (result = 'rejected' and rejection_reason in ('not_found', 'platform_owned', 'version_conflict', 'historical_references'))`)
    .execute();
  await database.schema.createIndex('repair_problem_category_deletion_events_scope_time_idx')
    .on('repair_problem_category_deletion_events')
    .columns(['tenant_id', 'category_id', 'occurred_at', 'event_id'])
    .execute();
  await sql`create function repairs_reject_problem_category_deletion_event_mutation() returns trigger language plpgsql as $function$ begin raise check_violation using message = 'Repair problem category deletion events are append-only.', constraint = 'repair_problem_category_deletion_events_append_only_ck', table = 'repair_problem_category_deletion_events'; end; $function$`.execute(database);
  await sql`create trigger repair_problem_category_deletion_events_reject_update before update on repair_problem_category_deletion_events for each row execute function repairs_reject_problem_category_deletion_event_mutation()`.execute(database);
  await sql`create trigger repair_problem_category_deletion_events_reject_delete before delete on repair_problem_category_deletion_events for each row execute function repairs_reject_problem_category_deletion_event_mutation()`.execute(database);
}

export async function down(database: Kysely<DatabaseSchema>): Promise<void> {
  await sql`drop trigger if exists repair_problem_category_deletion_events_reject_delete on repair_problem_category_deletion_events`.execute(database);
  await sql`drop trigger if exists repair_problem_category_deletion_events_reject_update on repair_problem_category_deletion_events`.execute(database);
  await sql`drop function if exists repairs_reject_problem_category_deletion_event_mutation()`.execute(database);
  await database.schema.dropTable('repair_problem_category_deletion_events').execute();
  await sql`alter table repair_problem_category_catalog_events disable trigger repair_problem_category_catalog_events_reject_delete`.execute(database);
  await sql`delete from repair_problem_category_catalog_events event where not exists (select 1 from repair_problem_categories category where category.category_id = event.category_id)`.execute(database);
  await sql`alter table repair_problem_category_catalog_events enable trigger repair_problem_category_catalog_events_reject_delete`.execute(database);
  await database.schema.alterTable('repair_problem_category_catalog_events')
    .addForeignKeyConstraint('repair_problem_category_catalog_events_category_fk', ['category_id'], 'repair_problem_categories', ['category_id'], (constraint) => constraint.onUpdate('restrict').onDelete('restrict'))
    .execute();
}
