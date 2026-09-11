import { sql, type Kysely } from 'kysely';

import type { DatabaseSchema } from '../database-types.js';

export async function up(database: Kysely<DatabaseSchema>): Promise<void> {
  await database.schema.createTable('repair_problem_categories')
    .addColumn('category_id', 'uuid', (column) => column.notNull())
    .addColumn('scope', 'varchar(16)', (column) => column.notNull())
    .addColumn('tenant_id', 'uuid')
    .addColumn('code', 'varchar(64)')
    .addColumn('canonical_label', 'varchar(160)', (column) => column.notNull())
    .addColumn('normalized_key', 'varchar(180)', (column) => column.notNull())
    .addColumn('status', 'varchar(16)', (column) => column.notNull())
    .addColumn('version', 'integer', (column) => column.notNull())
    .addColumn('created_by_actor_id', 'uuid')
    .addColumn('updated_by_actor_id', 'uuid')
    .addColumn('created_at', 'timestamptz', (column) => column.notNull())
    .addColumn('updated_at', 'timestamptz', (column) => column.notNull())
    .addPrimaryKeyConstraint('repair_problem_categories_pk', ['category_id'])
    .addForeignKeyConstraint('repair_problem_categories_tenant_fk', ['tenant_id'], 'tenants', ['tenant_id'], (constraint) => constraint.onUpdate('restrict').onDelete('restrict'))
    .addCheckConstraint('repair_problem_categories_scope_ck', sql`(scope = 'platform' and tenant_id is null and code is not null) or (scope = 'tenant' and tenant_id is not null and code is null)`)
    .addCheckConstraint('repair_problem_categories_status_ck', sql`status in ('active', 'inactive')`)
    .addCheckConstraint('repair_problem_categories_version_ck', sql`version >= 1`)
    .addCheckConstraint('repair_problem_categories_label_ck', sql`length(btrim(canonical_label)) between 2 and 160 and length(btrim(normalized_key)) between 2 and 180`)
    .addCheckConstraint('repair_problem_categories_time_ck', sql`updated_at >= created_at`)
    .execute();
  await sql`create unique index repair_problem_categories_platform_normalized_uq on repair_problem_categories (normalized_key) where scope = 'platform'`.execute(database);
  await sql`create unique index repair_problem_categories_platform_code_uq on repair_problem_categories (code) where scope = 'platform'`.execute(database);
  await sql`create unique index repair_problem_categories_tenant_normalized_uq on repair_problem_categories (tenant_id, normalized_key) where scope = 'tenant'`.execute(database);
  await database.schema.createIndex('repair_problem_categories_effective_idx').on('repair_problem_categories').columns(['tenant_id', 'status', 'canonical_label', 'category_id']).execute();

  await database.schema.createTable('repair_problem_category_catalog_events')
    .addColumn('event_id', 'uuid', (column) => column.notNull())
    .addColumn('tenant_id', 'uuid', (column) => column.notNull())
    .addColumn('category_id', 'uuid', (column) => column.notNull())
    .addColumn('station_id', 'uuid', (column) => column.notNull())
    .addColumn('session_id', 'uuid', (column) => column.notNull())
    .addColumn('actor_user_id', 'uuid', (column) => column.notNull())
    .addColumn('actor_display_name', 'varchar(160)', (column) => column.notNull())
    .addColumn('capability', 'varchar(80)', (column) => column.notNull())
    .addColumn('action', 'varchar(80)', (column) => column.notNull())
    .addColumn('old_version', 'integer')
    .addColumn('new_version', 'integer', (column) => column.notNull())
    .addColumn('old_label', 'varchar(160)')
    .addColumn('new_label', 'varchar(160)', (column) => column.notNull())
    .addColumn('old_status', 'varchar(16)')
    .addColumn('new_status', 'varchar(16)', (column) => column.notNull())
    .addColumn('result', 'varchar(16)', (column) => column.notNull())
    .addColumn('correlation_id', 'uuid', (column) => column.notNull())
    .addColumn('occurred_at', 'timestamptz', (column) => column.notNull())
    .addPrimaryKeyConstraint('repair_problem_category_catalog_events_pk', ['event_id'])
    .addUniqueConstraint('repair_problem_category_catalog_events_correlation_uq', ['correlation_id'])
    .addForeignKeyConstraint('repair_problem_category_catalog_events_tenant_fk', ['tenant_id'], 'tenants', ['tenant_id'], (constraint) => constraint.onUpdate('restrict').onDelete('restrict'))
    .addForeignKeyConstraint('repair_problem_category_catalog_events_category_fk', ['category_id'], 'repair_problem_categories', ['category_id'], (constraint) => constraint.onUpdate('restrict').onDelete('restrict'))
    .addCheckConstraint('repair_problem_category_catalog_events_contract_ck', sql`capability = 'repairs.catalogs.manage' and action in ('repair_problem_category.created', 'repair_problem_category.renamed', 'repair_problem_category.deactivated', 'repair_problem_category.reactivated') and result = 'succeeded'`)
    .addCheckConstraint('repair_problem_category_catalog_events_version_ck', sql`new_version >= 1 and ((old_version is null and action = 'repair_problem_category.created' and new_version = 1) or (old_version is not null and new_version = old_version + 1))`)
    .addCheckConstraint('repair_problem_category_catalog_events_status_ck', sql`new_status in ('active', 'inactive') and (old_status is null or old_status in ('active', 'inactive'))`)
    .execute();
  await database.schema.createIndex('repair_problem_category_catalog_events_scope_time_idx').on('repair_problem_category_catalog_events').columns(['tenant_id', 'category_id', 'occurred_at', 'event_id']).execute();
  await sql`create function repairs_reject_problem_category_catalog_event_mutation() returns trigger language plpgsql as $function$ begin raise check_violation using message = 'Repair problem category catalog events are append-only.', constraint = 'repair_problem_category_catalog_events_append_only_ck', table = 'repair_problem_category_catalog_events'; end; $function$`.execute(database);
  await sql`create trigger repair_problem_category_catalog_events_reject_update before update on repair_problem_category_catalog_events for each row execute function repairs_reject_problem_category_catalog_event_mutation()`.execute(database);
  await sql`create trigger repair_problem_category_catalog_events_reject_delete before delete on repair_problem_category_catalog_events for each row execute function repairs_reject_problem_category_catalog_event_mutation()`.execute(database);

  await database.schema.createTable('repair_problem_classifications')
    .addColumn('repair_id', 'uuid', (column) => column.notNull())
    .addColumn('category_id', 'uuid', (column) => column.notNull())
    .addColumn('category_label_snapshot', 'varchar(160)', (column) => column.notNull())
    .addColumn('source', 'varchar(24)', (column) => column.notNull())
    .addColumn('stage', 'varchar(32)', (column) => column.notNull())
    .addColumn('assigned_by_actor_id', 'uuid', (column) => column.notNull())
    .addColumn('assigned_at', 'timestamptz', (column) => column.notNull())
    .addPrimaryKeyConstraint('repair_problem_classifications_pk', ['repair_id', 'category_id'])
    .addForeignKeyConstraint('repair_problem_classifications_repair_fk', ['repair_id'], 'repairs', ['repair_id'], (constraint) => constraint.onUpdate('restrict').onDelete('restrict'))
    .addForeignKeyConstraint('repair_problem_classifications_category_fk', ['category_id'], 'repair_problem_categories', ['category_id'], (constraint) => constraint.onUpdate('restrict').onDelete('restrict'))
    .addCheckConstraint('repair_problem_classifications_contract_ck', sql`source = 'manual' and stage = 'post_intake' and length(btrim(category_label_snapshot)) between 2 and 160`)
    .execute();
  await database.schema.createIndex('repair_problem_classifications_usage_idx').on('repair_problem_classifications').columns(['category_id', 'repair_id']).execute();

  await database.schema.createTable('repair_problem_classification_events')
    .addColumn('event_id', 'uuid', (column) => column.notNull())
    .addColumn('tenant_id', 'uuid', (column) => column.notNull())
    .addColumn('branch_id', 'uuid', (column) => column.notNull())
    .addColumn('repair_id', 'uuid', (column) => column.notNull())
    .addColumn('category_id', 'uuid', (column) => column.notNull())
    .addColumn('timeline_entry_id', 'uuid', (column) => column.notNull())
    .addColumn('station_id', 'uuid', (column) => column.notNull())
    .addColumn('session_id', 'uuid', (column) => column.notNull())
    .addColumn('actor_user_id', 'uuid', (column) => column.notNull())
    .addColumn('actor_display_name', 'varchar(160)', (column) => column.notNull())
    .addColumn('capability', 'varchar(80)', (column) => column.notNull())
    .addColumn('action', 'varchar(80)', (column) => column.notNull())
    .addColumn('category_label_snapshot', 'varchar(160)', (column) => column.notNull())
    .addColumn('source', 'varchar(24)', (column) => column.notNull())
    .addColumn('stage', 'varchar(32)', (column) => column.notNull())
    .addColumn('result', 'varchar(16)', (column) => column.notNull())
    .addColumn('correlation_id', 'uuid', (column) => column.notNull())
    .addColumn('occurred_at', 'timestamptz', (column) => column.notNull())
    .addPrimaryKeyConstraint('repair_problem_classification_events_pk', ['event_id'])
    .addUniqueConstraint('repair_problem_classification_events_correlation_uq', ['correlation_id'])
    .addForeignKeyConstraint('repair_problem_classification_events_tenant_fk', ['tenant_id'], 'tenants', ['tenant_id'], (constraint) => constraint.onUpdate('restrict').onDelete('restrict'))
    .addForeignKeyConstraint('repair_problem_classification_events_branch_fk', ['branch_id', 'tenant_id'], 'branches', ['branch_id', 'tenant_id'], (constraint) => constraint.onUpdate('restrict').onDelete('restrict'))
    .addForeignKeyConstraint('repair_problem_classification_events_repair_fk', ['repair_id'], 'repairs', ['repair_id'], (constraint) => constraint.onUpdate('restrict').onDelete('restrict'))
    .addForeignKeyConstraint('repair_problem_classification_events_category_fk', ['category_id'], 'repair_problem_categories', ['category_id'], (constraint) => constraint.onUpdate('restrict').onDelete('restrict'))
    .addForeignKeyConstraint('repair_problem_classification_events_timeline_fk', ['timeline_entry_id'], 'repair_timeline_entries', ['entry_id'], (constraint) => constraint.onUpdate('restrict').onDelete('restrict'))
    .addCheckConstraint('repair_problem_classification_events_contract_ck', sql`capability = 'repairs.classify' and action in ('repair.problem_category.assigned', 'repair.problem_category.removed') and source = 'manual' and stage = 'post_intake' and result = 'succeeded' and length(btrim(category_label_snapshot)) between 2 and 160`)
    .execute();
  await database.schema.createIndex('repair_problem_classification_events_scope_time_idx').on('repair_problem_classification_events').columns(['tenant_id', 'branch_id', 'repair_id', 'occurred_at', 'event_id']).execute();
  await sql`create function repairs_reject_problem_classification_event_mutation() returns trigger language plpgsql as $function$ begin raise check_violation using message = 'Repair problem classification events are append-only.', constraint = 'repair_problem_classification_events_append_only_ck', table = 'repair_problem_classification_events'; end; $function$`.execute(database);
  await sql`create trigger repair_problem_classification_events_reject_update before update on repair_problem_classification_events for each row execute function repairs_reject_problem_classification_event_mutation()`.execute(database);
  await sql`create trigger repair_problem_classification_events_reject_delete before delete on repair_problem_classification_events for each row execute function repairs_reject_problem_classification_event_mutation()`.execute(database);
}

export async function down(database: Kysely<DatabaseSchema>): Promise<void> {
  await sql`drop trigger if exists repair_problem_classification_events_reject_delete on repair_problem_classification_events`.execute(database);
  await sql`drop trigger if exists repair_problem_classification_events_reject_update on repair_problem_classification_events`.execute(database);
  await sql`drop function if exists repairs_reject_problem_classification_event_mutation()`.execute(database);
  await database.schema.dropTable('repair_problem_classification_events').execute();
  await database.schema.dropIndex('repair_problem_classifications_usage_idx').execute();
  await database.schema.dropTable('repair_problem_classifications').execute();
  await sql`drop trigger if exists repair_problem_category_catalog_events_reject_delete on repair_problem_category_catalog_events`.execute(database);
  await sql`drop trigger if exists repair_problem_category_catalog_events_reject_update on repair_problem_category_catalog_events`.execute(database);
  await sql`drop function if exists repairs_reject_problem_category_catalog_event_mutation()`.execute(database);
  await database.schema.dropTable('repair_problem_category_catalog_events').execute();
  await database.schema.dropTable('repair_problem_categories').execute();
}
