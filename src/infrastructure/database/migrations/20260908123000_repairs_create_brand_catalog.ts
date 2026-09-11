import { sql, type Kysely } from 'kysely';

import type { DatabaseSchema } from '../database-types.js';

export async function up(database: Kysely<DatabaseSchema>): Promise<void> {
  await database.schema.createTable('repair_brands')
    .addColumn('brand_id', 'uuid', (column) => column.notNull())
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
    .addPrimaryKeyConstraint('repair_brands_pk', ['brand_id'])
    .addForeignKeyConstraint('repair_brands_tenant_fk', ['tenant_id'], 'tenants', ['tenant_id'], (constraint) => constraint.onUpdate('restrict').onDelete('restrict'))
    .addCheckConstraint('repair_brands_scope_ck', sql`(scope = 'platform' and tenant_id is null and code is not null) or (scope = 'tenant' and tenant_id is not null and code is null)`)
    .addCheckConstraint('repair_brands_status_ck', sql`status in ('active', 'inactive')`)
    .addCheckConstraint('repair_brands_version_ck', sql`version >= 1`)
    .addCheckConstraint('repair_brands_label_ck', sql`length(btrim(canonical_label)) between 2 and 160 and length(btrim(normalized_key)) between 2 and 180`)
    .addCheckConstraint('repair_brands_time_ck', sql`updated_at >= created_at`)
    .execute();
  await sql`create unique index repair_brands_platform_normalized_uq on repair_brands (normalized_key) where scope = 'platform'`.execute(database);
  await sql`create unique index repair_brands_platform_code_uq on repair_brands (code) where scope = 'platform'`.execute(database);
  await sql`create unique index repair_brands_tenant_normalized_uq on repair_brands (tenant_id, normalized_key) where scope = 'tenant'`.execute(database);
  await database.schema.createIndex('repair_brands_effective_idx').on('repair_brands').columns(['tenant_id', 'status', 'canonical_label', 'brand_id']).execute();

  await database.schema.createTable('repair_brand_pending_values')
    .addColumn('pending_brand_value_id', 'uuid', (column) => column.notNull())
    .addColumn('tenant_id', 'uuid', (column) => column.notNull())
    .addColumn('raw_label_example', 'varchar(160)', (column) => column.notNull())
    .addColumn('normalized_key', 'varchar(180)', (column) => column.notNull())
    .addColumn('resolution_status', 'varchar(16)', (column) => column.notNull())
    .addColumn('canonical_brand_id', 'uuid')
    .addColumn('version', 'integer', (column) => column.notNull())
    .addColumn('first_seen_at', 'timestamptz', (column) => column.notNull())
    .addColumn('last_seen_at', 'timestamptz', (column) => column.notNull())
    .addColumn('resolved_by_actor_id', 'uuid')
    .addColumn('resolved_at', 'timestamptz')
    .addPrimaryKeyConstraint('repair_brand_pending_values_pk', ['pending_brand_value_id'])
    .addUniqueConstraint('repair_brand_pending_values_tenant_normalized_uq', ['tenant_id', 'normalized_key'])
    .addForeignKeyConstraint('repair_brand_pending_values_tenant_fk', ['tenant_id'], 'tenants', ['tenant_id'], (constraint) => constraint.onUpdate('restrict').onDelete('restrict'))
    .addForeignKeyConstraint('repair_brand_pending_values_brand_fk', ['canonical_brand_id'], 'repair_brands', ['brand_id'], (constraint) => constraint.onUpdate('restrict').onDelete('restrict'))
    .addCheckConstraint('repair_brand_pending_values_status_ck', sql`resolution_status in ('pending', 'resolved')`)
    .addCheckConstraint('repair_brand_pending_values_version_ck', sql`version >= 1`)
    .addCheckConstraint('repair_brand_pending_values_label_ck', sql`length(btrim(raw_label_example)) between 2 and 160 and length(btrim(normalized_key)) between 2 and 180`)
    .addCheckConstraint('repair_brand_pending_values_resolution_ck', sql`(resolution_status = 'pending' and canonical_brand_id is null and resolved_by_actor_id is null and resolved_at is null) or (resolution_status = 'resolved' and canonical_brand_id is not null and resolved_by_actor_id is not null and resolved_at is not null)`)
    .addCheckConstraint('repair_brand_pending_values_time_ck', sql`last_seen_at >= first_seen_at and (resolved_at is null or resolved_at >= first_seen_at)`)
    .execute();
  await database.schema.createIndex('repair_brand_pending_values_queue_idx').on('repair_brand_pending_values').columns(['tenant_id', 'resolution_status', 'last_seen_at', 'pending_brand_value_id']).execute();

  await database.schema.createTable('repair_brand_catalog_events')
    .addColumn('event_id', 'uuid', (column) => column.notNull())
    .addColumn('tenant_id', 'uuid', (column) => column.notNull())
    .addColumn('brand_id', 'uuid')
    .addColumn('pending_brand_value_id', 'uuid')
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
    .addColumn('old_canonical_brand_id', 'uuid')
    .addColumn('new_canonical_brand_id', 'uuid')
    .addColumn('result', 'varchar(16)', (column) => column.notNull())
    .addColumn('correlation_id', 'uuid', (column) => column.notNull())
    .addColumn('occurred_at', 'timestamptz', (column) => column.notNull())
    .addPrimaryKeyConstraint('repair_brand_catalog_events_pk', ['event_id'])
    .addUniqueConstraint('repair_brand_catalog_events_correlation_uq', ['correlation_id'])
    .addForeignKeyConstraint('repair_brand_catalog_events_tenant_fk', ['tenant_id'], 'tenants', ['tenant_id'], (constraint) => constraint.onUpdate('restrict').onDelete('restrict'))
    .addForeignKeyConstraint('repair_brand_catalog_events_brand_fk', ['brand_id'], 'repair_brands', ['brand_id'], (constraint) => constraint.onUpdate('restrict').onDelete('restrict'))
    .addForeignKeyConstraint('repair_brand_catalog_events_pending_fk', ['pending_brand_value_id'], 'repair_brand_pending_values', ['pending_brand_value_id'], (constraint) => constraint.onUpdate('restrict').onDelete('restrict'))
    .addCheckConstraint('repair_brand_catalog_events_contract_ck', sql`capability = 'repairs.catalogs.manage' and action in ('repair_brand.created', 'repair_brand.renamed', 'repair_brand.deactivated', 'repair_brand.reactivated', 'repair_brand_pending.resolved', 'repair_brand_pending.canonical_created', 'repair_brand_pending.reopened') and result = 'succeeded'`)
    .addCheckConstraint('repair_brand_catalog_events_identity_ck', sql`brand_id is not null or pending_brand_value_id is not null`)
    .addCheckConstraint('repair_brand_catalog_events_version_ck', sql`new_version >= 1 and (old_version is null or new_version = old_version + 1)`)
    .execute();
  await database.schema.createIndex('repair_brand_catalog_events_scope_time_idx').on('repair_brand_catalog_events').columns(['tenant_id', 'occurred_at', 'event_id']).execute();
  await sql`
    create function repairs_reject_brand_catalog_event_mutation()
    returns trigger language plpgsql as $function$
    begin
      raise check_violation using message = 'Repair brand catalog events are append-only.', constraint = 'repair_brand_catalog_events_append_only_ck', table = 'repair_brand_catalog_events';
    end; $function$
  `.execute(database);
  await sql`create trigger repair_brand_catalog_events_reject_update before update on repair_brand_catalog_events for each row execute function repairs_reject_brand_catalog_event_mutation()`.execute(database);
  await sql`create trigger repair_brand_catalog_events_reject_delete before delete on repair_brand_catalog_events for each row execute function repairs_reject_brand_catalog_event_mutation()`.execute(database);

  await database.schema.alterTable('repair_intakes').addColumn('canonical_brand_id', 'uuid').addColumn('pending_brand_value_id', 'uuid').execute();
  await database.schema.alterTable('repair_intakes')
    .addForeignKeyConstraint('repair_intakes_canonical_brand_fk', ['canonical_brand_id'], 'repair_brands', ['brand_id'], (constraint) => constraint.onUpdate('restrict').onDelete('restrict'))
    .execute();
  await database.schema.alterTable('repair_intakes')
    .addForeignKeyConstraint('repair_intakes_pending_brand_fk', ['pending_brand_value_id'], 'repair_brand_pending_values', ['pending_brand_value_id'], (constraint) => constraint.onUpdate('restrict').onDelete('restrict'))
    .execute();
  await database.schema.createIndex('repair_intakes_canonical_brand_usage_idx').on('repair_intakes').columns(['tenant_id', 'canonical_brand_id', 'repair_id']).execute();
  await database.schema.createIndex('repair_intakes_pending_brand_usage_idx').on('repair_intakes').columns(['tenant_id', 'pending_brand_value_id', 'repair_id']).execute();
}

export async function down(database: Kysely<DatabaseSchema>): Promise<void> {
  await database.schema.dropIndex('repair_intakes_pending_brand_usage_idx').execute();
  await database.schema.dropIndex('repair_intakes_canonical_brand_usage_idx').execute();
  await database.schema.alterTable('repair_intakes').dropConstraint('repair_intakes_pending_brand_fk').execute();
  await database.schema.alterTable('repair_intakes').dropConstraint('repair_intakes_canonical_brand_fk').execute();
  await database.schema.alterTable('repair_intakes').dropColumn('pending_brand_value_id').dropColumn('canonical_brand_id').execute();
  await sql`drop trigger if exists repair_brand_catalog_events_reject_delete on repair_brand_catalog_events`.execute(database);
  await sql`drop trigger if exists repair_brand_catalog_events_reject_update on repair_brand_catalog_events`.execute(database);
  await sql`drop function if exists repairs_reject_brand_catalog_event_mutation()`.execute(database);
  await database.schema.dropTable('repair_brand_catalog_events').execute();
  await database.schema.dropTable('repair_brand_pending_values').execute();
  await database.schema.dropTable('repair_brands').execute();
}
