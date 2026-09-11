import { sql, type Kysely } from 'kysely';

import type { DatabaseSchema } from '../database-types.js';

export async function up(database: Kysely<DatabaseSchema>): Promise<void> {
  await database.schema.createTable('repair_models')
    .addColumn('model_id', 'uuid', (column) => column.notNull())
    .addColumn('canonical_brand_id', 'uuid', (column) => column.notNull())
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
    .addPrimaryKeyConstraint('repair_models_pk', ['model_id'])
    .addForeignKeyConstraint('repair_models_brand_fk', ['canonical_brand_id'], 'repair_brands', ['brand_id'], (constraint) => constraint.onUpdate('restrict').onDelete('restrict'))
    .addForeignKeyConstraint('repair_models_tenant_fk', ['tenant_id'], 'tenants', ['tenant_id'], (constraint) => constraint.onUpdate('restrict').onDelete('restrict'))
    .addCheckConstraint('repair_models_scope_ck', sql`(scope = 'platform' and tenant_id is null and code is not null) or (scope = 'tenant' and tenant_id is not null and code is null)`)
    .addCheckConstraint('repair_models_status_ck', sql`status in ('active', 'inactive')`)
    .addCheckConstraint('repair_models_version_ck', sql`version >= 1`)
    .addCheckConstraint('repair_models_label_ck', sql`length(btrim(canonical_label)) between 2 and 160 and length(btrim(normalized_key)) between 2 and 180`)
    .addCheckConstraint('repair_models_time_ck', sql`updated_at >= created_at`)
    .execute();
  await sql`create unique index repair_models_platform_normalized_uq on repair_models (canonical_brand_id, normalized_key) where scope = 'platform'`.execute(database);
  await sql`create unique index repair_models_platform_code_uq on repair_models (code) where scope = 'platform'`.execute(database);
  await sql`create unique index repair_models_tenant_normalized_uq on repair_models (tenant_id, canonical_brand_id, normalized_key) where scope = 'tenant'`.execute(database);
  await database.schema.createIndex('repair_models_effective_idx').on('repair_models').columns(['canonical_brand_id', 'tenant_id', 'status', 'canonical_label', 'model_id']).execute();

  await database.schema.createTable('repair_model_pending_values')
    .addColumn('pending_model_value_id', 'uuid', (column) => column.notNull())
    .addColumn('tenant_id', 'uuid', (column) => column.notNull())
    .addColumn('brand_context_key', 'varchar(220)', (column) => column.notNull())
    .addColumn('canonical_brand_id', 'uuid')
    .addColumn('pending_brand_value_id', 'uuid')
    .addColumn('raw_brand_label_example', 'varchar(160)')
    .addColumn('raw_model_label_example', 'varchar(160)', (column) => column.notNull())
    .addColumn('normalized_model_key', 'varchar(180)', (column) => column.notNull())
    .addColumn('resolution_status', 'varchar(16)', (column) => column.notNull())
    .addColumn('canonical_model_id', 'uuid')
    .addColumn('version', 'integer', (column) => column.notNull())
    .addColumn('first_seen_at', 'timestamptz', (column) => column.notNull())
    .addColumn('last_seen_at', 'timestamptz', (column) => column.notNull())
    .addColumn('resolved_by_actor_id', 'uuid')
    .addColumn('resolved_at', 'timestamptz')
    .addPrimaryKeyConstraint('repair_model_pending_values_pk', ['pending_model_value_id'])
    .addUniqueConstraint('repair_model_pending_values_identity_uq', ['tenant_id', 'brand_context_key', 'normalized_model_key'])
    .addForeignKeyConstraint('repair_model_pending_values_tenant_fk', ['tenant_id'], 'tenants', ['tenant_id'], (constraint) => constraint.onUpdate('restrict').onDelete('restrict'))
    .addForeignKeyConstraint('repair_model_pending_values_brand_fk', ['canonical_brand_id'], 'repair_brands', ['brand_id'], (constraint) => constraint.onUpdate('restrict').onDelete('restrict'))
    .addForeignKeyConstraint('repair_model_pending_values_pending_brand_fk', ['pending_brand_value_id'], 'repair_brand_pending_values', ['pending_brand_value_id'], (constraint) => constraint.onUpdate('restrict').onDelete('restrict'))
    .addForeignKeyConstraint('repair_model_pending_values_model_fk', ['canonical_model_id'], 'repair_models', ['model_id'], (constraint) => constraint.onUpdate('restrict').onDelete('restrict'))
    .addCheckConstraint('repair_model_pending_values_context_ck', sql`num_nonnulls(canonical_brand_id, pending_brand_value_id, raw_brand_label_example) <= 1`)
    .addCheckConstraint('repair_model_pending_values_status_ck', sql`resolution_status in ('pending', 'resolved')`)
    .addCheckConstraint('repair_model_pending_values_version_ck', sql`version >= 1`)
    .addCheckConstraint('repair_model_pending_values_label_ck', sql`length(btrim(raw_model_label_example)) between 1 and 160 and length(btrim(normalized_model_key)) between 1 and 180 and length(btrim(brand_context_key)) between 1 and 220`)
    .addCheckConstraint('repair_model_pending_values_resolution_ck', sql`(resolution_status = 'pending' and canonical_model_id is null and resolved_by_actor_id is null and resolved_at is null) or (resolution_status = 'resolved' and canonical_model_id is not null and resolved_by_actor_id is not null and resolved_at is not null)`)
    .addCheckConstraint('repair_model_pending_values_time_ck', sql`last_seen_at >= first_seen_at and (resolved_at is null or resolved_at >= first_seen_at)`)
    .execute();
  await database.schema.createIndex('repair_model_pending_values_queue_idx').on('repair_model_pending_values').columns(['tenant_id', 'resolution_status', 'canonical_brand_id', 'last_seen_at', 'pending_model_value_id']).execute();

  await database.schema.createTable('repair_model_catalog_events')
    .addColumn('event_id', 'uuid', (column) => column.notNull())
    .addColumn('tenant_id', 'uuid', (column) => column.notNull())
    .addColumn('model_id', 'uuid')
    .addColumn('canonical_brand_id', 'uuid', (column) => column.notNull())
    .addColumn('pending_model_value_id', 'uuid')
    .addColumn('station_id', 'uuid', (column) => column.notNull())
    .addColumn('session_id', 'uuid', (column) => column.notNull())
    .addColumn('actor_user_id', 'uuid', (column) => column.notNull())
    .addColumn('actor_display_name', 'varchar(160)', (column) => column.notNull())
    .addColumn('capability', 'varchar(80)', (column) => column.notNull())
    .addColumn('action', 'varchar(96)', (column) => column.notNull())
    .addColumn('old_version', 'integer')
    .addColumn('new_version', 'integer', (column) => column.notNull())
    .addColumn('old_label', 'varchar(160)')
    .addColumn('new_label', 'varchar(160)', (column) => column.notNull())
    .addColumn('old_status', 'varchar(16)')
    .addColumn('new_status', 'varchar(16)', (column) => column.notNull())
    .addColumn('old_canonical_model_id', 'uuid')
    .addColumn('new_canonical_model_id', 'uuid')
    .addColumn('result', 'varchar(16)', (column) => column.notNull())
    .addColumn('correlation_id', 'uuid', (column) => column.notNull())
    .addColumn('occurred_at', 'timestamptz', (column) => column.notNull())
    .addPrimaryKeyConstraint('repair_model_catalog_events_pk', ['event_id'])
    .addUniqueConstraint('repair_model_catalog_events_correlation_uq', ['correlation_id'])
    .addForeignKeyConstraint('repair_model_catalog_events_tenant_fk', ['tenant_id'], 'tenants', ['tenant_id'], (constraint) => constraint.onUpdate('restrict').onDelete('restrict'))
    .addForeignKeyConstraint('repair_model_catalog_events_model_fk', ['model_id'], 'repair_models', ['model_id'], (constraint) => constraint.onUpdate('restrict').onDelete('restrict'))
    .addForeignKeyConstraint('repair_model_catalog_events_brand_fk', ['canonical_brand_id'], 'repair_brands', ['brand_id'], (constraint) => constraint.onUpdate('restrict').onDelete('restrict'))
    .addForeignKeyConstraint('repair_model_catalog_events_pending_fk', ['pending_model_value_id'], 'repair_model_pending_values', ['pending_model_value_id'], (constraint) => constraint.onUpdate('restrict').onDelete('restrict'))
    .addCheckConstraint('repair_model_catalog_events_contract_ck', sql`capability = 'repairs.catalogs.manage' and action in ('repair_model.created', 'repair_model.renamed', 'repair_model.deactivated', 'repair_model.reactivated', 'repair_model_pending.resolved', 'repair_model_pending.canonical_created') and result = 'succeeded'`)
    .addCheckConstraint('repair_model_catalog_events_identity_ck', sql`model_id is not null or pending_model_value_id is not null`)
    .addCheckConstraint('repair_model_catalog_events_version_ck', sql`new_version >= 1 and (old_version is null or new_version = old_version + 1)`)
    .execute();
  await database.schema.createIndex('repair_model_catalog_events_scope_time_idx').on('repair_model_catalog_events').columns(['tenant_id', 'occurred_at', 'event_id']).execute();
  await sql`
    create function repairs_reject_model_catalog_event_mutation()
    returns trigger language plpgsql as $function$
    begin
      raise check_violation using message = 'Repair model catalog events are append-only.', constraint = 'repair_model_catalog_events_append_only_ck', table = 'repair_model_catalog_events';
    end; $function$
  `.execute(database);
  await sql`create trigger repair_model_catalog_events_reject_update before update on repair_model_catalog_events for each row execute function repairs_reject_model_catalog_event_mutation()`.execute(database);
  await sql`create trigger repair_model_catalog_events_reject_delete before delete on repair_model_catalog_events for each row execute function repairs_reject_model_catalog_event_mutation()`.execute(database);

  await database.schema.alterTable('repair_intakes').addColumn('canonical_model_id', 'uuid').addColumn('pending_model_value_id', 'uuid').execute();
  await database.schema.alterTable('repair_intakes').addForeignKeyConstraint('repair_intakes_canonical_model_fk', ['canonical_model_id'], 'repair_models', ['model_id'], (constraint) => constraint.onUpdate('restrict').onDelete('restrict')).execute();
  await database.schema.alterTable('repair_intakes').addForeignKeyConstraint('repair_intakes_pending_model_fk', ['pending_model_value_id'], 'repair_model_pending_values', ['pending_model_value_id'], (constraint) => constraint.onUpdate('restrict').onDelete('restrict')).execute();
  await database.schema.createIndex('repair_intakes_canonical_model_usage_idx').on('repair_intakes').columns(['tenant_id', 'canonical_model_id', 'repair_id']).execute();
  await database.schema.createIndex('repair_intakes_pending_model_usage_idx').on('repair_intakes').columns(['tenant_id', 'pending_model_value_id', 'repair_id']).execute();
}

export async function down(database: Kysely<DatabaseSchema>): Promise<void> {
  await database.schema.dropIndex('repair_intakes_pending_model_usage_idx').execute();
  await database.schema.dropIndex('repair_intakes_canonical_model_usage_idx').execute();
  await database.schema.alterTable('repair_intakes').dropConstraint('repair_intakes_pending_model_fk').execute();
  await database.schema.alterTable('repair_intakes').dropConstraint('repair_intakes_canonical_model_fk').execute();
  await database.schema.alterTable('repair_intakes').dropColumn('pending_model_value_id').dropColumn('canonical_model_id').execute();
  await sql`drop trigger if exists repair_model_catalog_events_reject_delete on repair_model_catalog_events`.execute(database);
  await sql`drop trigger if exists repair_model_catalog_events_reject_update on repair_model_catalog_events`.execute(database);
  await sql`drop function if exists repairs_reject_model_catalog_event_mutation()`.execute(database);
  await database.schema.dropTable('repair_model_catalog_events').execute();
  await database.schema.dropTable('repair_model_pending_values').execute();
  await database.schema.dropTable('repair_models').execute();
}
