import { sql, type Kysely } from 'kysely';

import type { DatabaseSchema } from '../database-types.js';

export async function up(database: Kysely<DatabaseSchema>): Promise<void> {
  await database.schema.alterTable('catalog_categories')
    .addColumn('merged_into_id', 'uuid')
    .addColumn('merged_by_actor_id', 'uuid')
    .addColumn('merged_at', 'timestamptz')
    .execute();
  await database.schema.alterTable('catalog_brands')
    .addColumn('merged_into_id', 'uuid')
    .addColumn('merged_by_actor_id', 'uuid')
    .addColumn('merged_at', 'timestamptz')
    .execute();

  await database.schema.alterTable('catalog_categories')
    .addForeignKeyConstraint('catalog_categories_merged_into_fk', ['tenant_id', 'merged_into_id'], 'catalog_categories', ['tenant_id', 'category_id'], (constraint) => constraint.onDelete('restrict').onUpdate('restrict'))
    .execute();
  await database.schema.alterTable('catalog_categories').addCheckConstraint('catalog_categories_merge_state_ck', sql`(merged_into_id is null and merged_by_actor_id is null and merged_at is null) or (merged_into_id is not null and merged_by_actor_id is not null and merged_at is not null and status = 'INACTIVE' and merged_into_id <> category_id)`).execute();
  await database.schema.alterTable('catalog_brands')
    .addForeignKeyConstraint('catalog_brands_merged_into_fk', ['tenant_id', 'merged_into_id'], 'catalog_brands', ['tenant_id', 'brand_id'], (constraint) => constraint.onDelete('restrict').onUpdate('restrict'))
    .execute();
  await database.schema.alterTable('catalog_brands').addCheckConstraint('catalog_brands_merge_state_ck', sql`(merged_into_id is null and merged_by_actor_id is null and merged_at is null) or (merged_into_id is not null and merged_by_actor_id is not null and merged_at is not null and status = 'INACTIVE' and merged_into_id <> brand_id)`).execute();

  await database.schema.alterTable('catalog_categories').dropConstraint('catalog_categories_kind_name_uq').execute();
  await database.schema.alterTable('catalog_brands').dropConstraint('catalog_brands_name_uq').execute();
  await sql`create unique index catalog_categories_live_identity_uq on catalog_categories (tenant_id, kind, normalized_name) where merged_into_id is null`.execute(database);
  await sql`create unique index catalog_brands_live_identity_uq on catalog_brands (tenant_id, normalized_name) where merged_into_id is null`.execute(database);

  await database.schema.createTable('catalog_reference_merge_events')
    .addColumn('merge_id', 'uuid', (column) => column.notNull())
    .addColumn('tenant_id', 'uuid', (column) => column.notNull())
    .addColumn('reference_kind', 'varchar(16)', (column) => column.notNull())
    .addColumn('survivor_reference_id', 'uuid', (column) => column.notNull())
    .addColumn('source_reference_ids', 'jsonb', (column) => column.notNull())
    .addColumn('previous_names', 'jsonb', (column) => column.notNull())
    .addColumn('final_name', 'varchar(120)', (column) => column.notNull())
    .addColumn('reassigned_item_count', 'integer', (column) => column.notNull())
    .addColumn('reassigned_reconciliation_count', 'integer', (column) => column.notNull())
    .addColumn('applicability_before', 'jsonb', (column) => column.notNull())
    .addColumn('applicability_after', 'jsonb', (column) => column.notNull())
    .addColumn('station_id', 'uuid', (column) => column.notNull())
    .addColumn('session_id', 'uuid', (column) => column.notNull())
    .addColumn('actor_user_id', 'uuid', (column) => column.notNull())
    .addColumn('actor_display_name', 'varchar(160)', (column) => column.notNull())
    .addColumn('capability', 'varchar(80)', (column) => column.notNull())
    .addColumn('correlation_id', 'uuid', (column) => column.notNull())
    .addColumn('client_request_id', 'uuid', (column) => column.notNull())
    .addColumn('occurred_at', 'timestamptz', (column) => column.notNull())
    .addPrimaryKeyConstraint('catalog_reference_merge_events_pk', ['tenant_id', 'merge_id'])
    .addUniqueConstraint('catalog_reference_merge_events_correlation_uq', ['tenant_id', 'correlation_id'])
    .addForeignKeyConstraint('catalog_reference_merge_events_tenant_fk', ['tenant_id'], 'tenants', ['tenant_id'], (constraint) => constraint.onDelete('restrict').onUpdate('restrict'))
    .addCheckConstraint('catalog_reference_merge_events_kind_ck', sql`reference_kind in ('CATEGORY', 'BRAND')`)
    .addCheckConstraint('catalog_reference_merge_events_counts_ck', sql`reassigned_item_count >= 0 and reassigned_reconciliation_count >= 0`)
    .execute();
  await database.schema.createIndex('catalog_reference_merge_events_survivor_idx').on('catalog_reference_merge_events').columns(['tenant_id', 'survivor_reference_id', 'occurred_at', 'merge_id']).execute();
  await sql`create trigger catalog_reference_merge_events_reject_update before update on catalog_reference_merge_events for each row execute function catalog_reject_append_only_mutation()`.execute(database);
  await sql`create trigger catalog_reference_merge_events_reject_delete before delete on catalog_reference_merge_events for each row execute function catalog_reject_append_only_mutation()`.execute(database);
}

export async function down(database: Kysely<DatabaseSchema>): Promise<void> {
  await sql`drop trigger if exists catalog_reference_merge_events_reject_delete on catalog_reference_merge_events`.execute(database);
  await sql`drop trigger if exists catalog_reference_merge_events_reject_update on catalog_reference_merge_events`.execute(database);
  await database.schema.dropTable('catalog_reference_merge_events').execute();
  await database.schema.dropIndex('catalog_brands_live_identity_uq').execute();
  await database.schema.dropIndex('catalog_categories_live_identity_uq').execute();
  await sql`update catalog_categories set normalized_name = left(normalized_name, 75) || '-merged-' || category_id where merged_into_id is not null`.execute(database);
  await sql`update catalog_brands set normalized_name = left(normalized_name, 75) || '-merged-' || brand_id where merged_into_id is not null`.execute(database);
  await database.schema.alterTable('catalog_brands').dropConstraint('catalog_brands_merge_state_ck').execute();
  await database.schema.alterTable('catalog_brands').dropConstraint('catalog_brands_merged_into_fk').execute();
  await database.schema.alterTable('catalog_brands').dropColumn('merged_at').dropColumn('merged_by_actor_id').dropColumn('merged_into_id').execute();
  await database.schema.alterTable('catalog_categories').dropConstraint('catalog_categories_merge_state_ck').execute();
  await database.schema.alterTable('catalog_categories').dropConstraint('catalog_categories_merged_into_fk').execute();
  await database.schema.alterTable('catalog_categories').dropColumn('merged_at').dropColumn('merged_by_actor_id').dropColumn('merged_into_id').execute();
  await database.schema.alterTable('catalog_categories').addUniqueConstraint('catalog_categories_kind_name_uq', ['tenant_id', 'kind', 'normalized_name']).execute();
  await database.schema.alterTable('catalog_brands').addUniqueConstraint('catalog_brands_name_uq', ['tenant_id', 'normalized_name']).execute();
}
