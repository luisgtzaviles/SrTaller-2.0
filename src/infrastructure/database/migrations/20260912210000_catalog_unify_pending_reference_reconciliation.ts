import { sql, type Kysely } from 'kysely';

import type { DatabaseSchema } from '../database-types.js';

export async function up(database: Kysely<DatabaseSchema>): Promise<void> {
  await database.schema.createTable('catalog_category_pending_values')
    .addColumn('tenant_id', 'uuid', (column) => column.notNull())
    .addColumn('pending_category_value_id', 'uuid', (column) => column.notNull())
    .addColumn('raw_label_example', 'varchar(120)', (column) => column.notNull())
    .addColumn('normalized_key', 'varchar(120)', (column) => column.notNull())
    .addColumn('kind', 'varchar(16)', (column) => column.notNull())
    .addColumn('resolution_status', 'varchar(16)', (column) => column.notNull())
    .addColumn('canonical_category_id', 'uuid')
    .addColumn('version', 'integer', (column) => column.notNull())
    .addColumn('first_seen_at', 'timestamptz', (column) => column.notNull())
    .addColumn('last_seen_at', 'timestamptz', (column) => column.notNull())
    .addColumn('captured_by_actor_id', 'uuid', (column) => column.notNull())
    .addColumn('captured_by_actor_display_name', 'varchar(160)', (column) => column.notNull())
    .addColumn('captured_in_branch_id', 'uuid', (column) => column.notNull())
    .addColumn('captured_in_station_id', 'uuid', (column) => column.notNull())
    .addColumn('captured_in_session_id', 'uuid', (column) => column.notNull())
    .addColumn('resolved_by_actor_id', 'uuid')
    .addColumn('resolved_at', 'timestamptz')
    .addPrimaryKeyConstraint('catalog_category_pending_values_pk', ['tenant_id', 'pending_category_value_id'])
    .addUniqueConstraint('catalog_category_pending_values_key_uq', ['tenant_id', 'kind', 'normalized_key'])
    .addForeignKeyConstraint('catalog_category_pending_values_tenant_fk', ['tenant_id'], 'tenants', ['tenant_id'], (constraint) => constraint.onDelete('restrict').onUpdate('restrict'))
    .addForeignKeyConstraint('catalog_category_pending_values_canonical_fk', ['tenant_id', 'canonical_category_id'], 'catalog_categories', ['tenant_id', 'category_id'], (constraint) => constraint.onDelete('restrict').onUpdate('restrict'))
    .addCheckConstraint('catalog_category_pending_values_kind_ck', sql`kind in ('PART', 'PRODUCT', 'SERVICE', 'SUPPLY')`)
    .addCheckConstraint('catalog_category_pending_values_version_ck', sql`version >= 1`)
    .addCheckConstraint('catalog_category_pending_values_resolution_ck', sql`(resolution_status = 'PENDING' and canonical_category_id is null and resolved_by_actor_id is null and resolved_at is null) or (resolution_status = 'RESOLVED' and canonical_category_id is not null and resolved_by_actor_id is not null and resolved_at is not null)`)
    .execute();
  await database.schema.createIndex('catalog_category_pending_queue_idx').on('catalog_category_pending_values').columns(['tenant_id', 'resolution_status', 'last_seen_at', 'pending_category_value_id']).execute();

  await database.schema.createTable('catalog_brand_pending_values')
    .addColumn('tenant_id', 'uuid', (column) => column.notNull())
    .addColumn('pending_brand_value_id', 'uuid', (column) => column.notNull())
    .addColumn('raw_label_example', 'varchar(120)', (column) => column.notNull())
    .addColumn('normalized_key', 'varchar(120)', (column) => column.notNull())
    .addColumn('resolution_status', 'varchar(16)', (column) => column.notNull())
    .addColumn('canonical_brand_id', 'uuid')
    .addColumn('version', 'integer', (column) => column.notNull())
    .addColumn('first_seen_at', 'timestamptz', (column) => column.notNull())
    .addColumn('last_seen_at', 'timestamptz', (column) => column.notNull())
    .addColumn('captured_by_actor_id', 'uuid', (column) => column.notNull())
    .addColumn('captured_by_actor_display_name', 'varchar(160)', (column) => column.notNull())
    .addColumn('captured_in_branch_id', 'uuid', (column) => column.notNull())
    .addColumn('captured_in_station_id', 'uuid', (column) => column.notNull())
    .addColumn('captured_in_session_id', 'uuid', (column) => column.notNull())
    .addColumn('resolved_by_actor_id', 'uuid')
    .addColumn('resolved_at', 'timestamptz')
    .addPrimaryKeyConstraint('catalog_brand_pending_values_pk', ['tenant_id', 'pending_brand_value_id'])
    .addUniqueConstraint('catalog_brand_pending_values_key_uq', ['tenant_id', 'normalized_key'])
    .addForeignKeyConstraint('catalog_brand_pending_values_tenant_fk', ['tenant_id'], 'tenants', ['tenant_id'], (constraint) => constraint.onDelete('restrict').onUpdate('restrict'))
    .addForeignKeyConstraint('catalog_brand_pending_values_canonical_fk', ['tenant_id', 'canonical_brand_id'], 'catalog_brands', ['tenant_id', 'brand_id'], (constraint) => constraint.onDelete('restrict').onUpdate('restrict'))
    .addCheckConstraint('catalog_brand_pending_values_version_ck', sql`version >= 1`)
    .addCheckConstraint('catalog_brand_pending_values_resolution_ck', sql`(resolution_status = 'PENDING' and canonical_brand_id is null and resolved_by_actor_id is null and resolved_at is null) or (resolution_status = 'RESOLVED' and canonical_brand_id is not null and resolved_by_actor_id is not null and resolved_at is not null)`)
    .execute();
  await database.schema.createIndex('catalog_brand_pending_queue_idx').on('catalog_brand_pending_values').columns(['tenant_id', 'resolution_status', 'last_seen_at', 'pending_brand_value_id']).execute();

  await database.schema.createTable('catalog_brand_pending_kind_applicability')
    .addColumn('tenant_id', 'uuid', (column) => column.notNull())
    .addColumn('pending_brand_value_id', 'uuid', (column) => column.notNull())
    .addColumn('kind', 'varchar(16)', (column) => column.notNull())
    .addPrimaryKeyConstraint('catalog_brand_pending_kind_applicability_pk', ['tenant_id', 'pending_brand_value_id', 'kind'])
    .addForeignKeyConstraint('catalog_brand_pending_kind_applicability_pending_fk', ['tenant_id', 'pending_brand_value_id'], 'catalog_brand_pending_values', ['tenant_id', 'pending_brand_value_id'], (constraint) => constraint.onDelete('cascade').onUpdate('restrict'))
    .addCheckConstraint('catalog_brand_pending_kind_applicability_kind_ck', sql`kind in ('PART', 'PRODUCT', 'SERVICE', 'SUPPLY')`)
    .execute();

  await sql`insert into catalog_category_pending_values (
      tenant_id, pending_category_value_id, raw_label_example, normalized_key, kind,
      resolution_status, canonical_category_id, version, first_seen_at, last_seen_at,
      captured_by_actor_id, captured_by_actor_display_name, captured_in_branch_id, captured_in_station_id,
      captured_in_session_id, resolved_by_actor_id, resolved_at
    )
    select category.tenant_id, category.category_id, category.display_name,
      category.normalized_name, applicability.kind,
      case when category.review_status = 'MERGED' then 'RESOLVED' else 'PENDING' end,
      category.merged_into_id, category.version, category.created_at, category.updated_at,
      category.created_by_actor_id,
      coalesce((select event.actor_display_name from catalog_audit_events event where event.tenant_id = category.tenant_id and event.resource_id = category.category_id order by event.occurred_at limit 1), 'Migración PBI-040'),
      category.created_in_branch_id,
      category.created_in_station_id, category.created_in_session_id,
      category.reviewed_by_actor_id, category.reviewed_at
    from catalog_categories category
    join catalog_category_kind_applicability applicability
      on applicability.tenant_id = category.tenant_id and applicability.category_id = category.category_id
    where category.review_status in ('PENDING', 'MERGED')`.execute(database);

  await sql`insert into catalog_brand_pending_values (
      tenant_id, pending_brand_value_id, raw_label_example, normalized_key,
      resolution_status, canonical_brand_id, version, first_seen_at, last_seen_at,
      captured_by_actor_id, captured_by_actor_display_name, captured_in_branch_id, captured_in_station_id,
      captured_in_session_id, resolved_by_actor_id, resolved_at
    )
    select brand.tenant_id, brand.brand_id, brand.display_name, brand.normalized_name,
      case when brand.review_status = 'MERGED' then 'RESOLVED' else 'PENDING' end,
      brand.merged_into_id, brand.version, brand.created_at, brand.updated_at,
      brand.created_by_actor_id,
      coalesce((select event.actor_display_name from catalog_audit_events event where event.tenant_id = brand.tenant_id and event.resource_id = brand.brand_id order by event.occurred_at limit 1), 'Migración PBI-040'),
      brand.created_in_branch_id,
      brand.created_in_station_id, brand.created_in_session_id,
      brand.reviewed_by_actor_id, brand.reviewed_at
    from catalog_brands brand
    where brand.review_status in ('PENDING', 'MERGED')`.execute(database);
  await sql`insert into catalog_brand_pending_kind_applicability (tenant_id, pending_brand_value_id, kind)
    select applicability.tenant_id, applicability.brand_id, applicability.kind
    from catalog_brand_kind_applicability applicability
    join catalog_brands brand on brand.tenant_id = applicability.tenant_id and brand.brand_id = applicability.brand_id
    where brand.review_status in ('PENDING', 'MERGED')`.execute(database);

  await database.schema.alterTable('catalog_items')
    .addColumn('pending_category_value_id', 'uuid')
    .addColumn('pending_brand_value_id', 'uuid')
    .alterColumn('category_id', (column) => column.dropNotNull())
    .execute();
  await database.schema.alterTable('catalog_items')
    .addForeignKeyConstraint('catalog_items_pending_category_fk', ['tenant_id', 'pending_category_value_id'], 'catalog_category_pending_values', ['tenant_id', 'pending_category_value_id'], (constraint) => constraint.onDelete('restrict').onUpdate('restrict'))
    .execute();
  await database.schema.alterTable('catalog_items').addForeignKeyConstraint('catalog_items_pending_brand_fk', ['tenant_id', 'pending_brand_value_id'], 'catalog_brand_pending_values', ['tenant_id', 'pending_brand_value_id'], (constraint) => constraint.onDelete('restrict').onUpdate('restrict')).execute();
  await database.schema.alterTable('catalog_items').addCheckConstraint('catalog_items_category_reference_ck', sql`category_id is not null or pending_category_value_id is not null`).execute();
  await sql`update catalog_items item set pending_category_value_id = item.category_id, category_id = null
    from catalog_categories category where category.tenant_id = item.tenant_id and category.category_id = item.category_id and category.review_status = 'PENDING'`.execute(database);
  await sql`update catalog_items item set pending_brand_value_id = item.brand_id, brand_id = null
    from catalog_brands brand where brand.tenant_id = item.tenant_id and brand.brand_id = item.brand_id and brand.review_status = 'PENDING'`.execute(database);
  await database.schema.createIndex('catalog_items_pending_category_idx').on('catalog_items').columns(['tenant_id', 'pending_category_value_id', 'item_id']).execute();
  await database.schema.createIndex('catalog_items_pending_brand_idx').on('catalog_items').columns(['tenant_id', 'pending_brand_value_id', 'item_id']).execute();

  await sql`delete from catalog_category_kind_applicability applicability using catalog_categories category
    where category.tenant_id = applicability.tenant_id and category.category_id = applicability.category_id and category.review_status <> 'APPROVED'`.execute(database);
  await sql`delete from catalog_brand_kind_applicability applicability using catalog_brands brand
    where brand.tenant_id = applicability.tenant_id and brand.brand_id = applicability.brand_id and brand.review_status <> 'APPROVED'`.execute(database);
  await sql`delete from catalog_categories where review_status <> 'APPROVED'`.execute(database);
  await sql`delete from catalog_brands where review_status <> 'APPROVED'`.execute(database);

  await database.schema.alterTable('catalog_categories').dropConstraint('catalog_categories_merge_state_ck').execute();
  await database.schema.alterTable('catalog_categories').dropConstraint('catalog_categories_review_status_ck').execute();
  await database.schema.alterTable('catalog_brands').dropConstraint('catalog_brands_merge_state_ck').execute();
  await database.schema.alterTable('catalog_brands').dropConstraint('catalog_brands_review_status_ck').execute();
  await database.schema.alterTable('catalog_categories')
    .dropColumn('reviewed_at').dropColumn('reviewed_by_actor_id').dropColumn('merged_into_id').dropColumn('review_status').execute();
  await database.schema.alterTable('catalog_brands')
    .dropColumn('reviewed_at').dropColumn('reviewed_by_actor_id').dropColumn('merged_into_id').dropColumn('review_status').execute();
}

export async function down(database: Kysely<DatabaseSchema>): Promise<void> {
  await database.schema.alterTable('catalog_categories')
    .addColumn('review_status', 'varchar(16)', (column) => column.notNull().defaultTo('APPROVED'))
    .addColumn('merged_into_id', 'uuid').addColumn('reviewed_by_actor_id', 'uuid').addColumn('reviewed_at', 'timestamptz').execute();
  await database.schema.alterTable('catalog_categories').addCheckConstraint('catalog_categories_review_status_ck', sql`review_status in ('APPROVED', 'PENDING', 'MERGED')`).execute();
  await database.schema.alterTable('catalog_categories').addCheckConstraint('catalog_categories_merge_state_ck', sql`(review_status = 'MERGED' and merged_into_id is not null and status = 'INACTIVE') or (review_status <> 'MERGED' and merged_into_id is null)`).execute();
  await database.schema.alterTable('catalog_brands')
    .addColumn('review_status', 'varchar(16)', (column) => column.notNull().defaultTo('APPROVED'))
    .addColumn('merged_into_id', 'uuid').addColumn('reviewed_by_actor_id', 'uuid').addColumn('reviewed_at', 'timestamptz').execute();
  await database.schema.alterTable('catalog_brands').addCheckConstraint('catalog_brands_review_status_ck', sql`review_status in ('APPROVED', 'PENDING', 'MERGED')`).execute();
  await database.schema.alterTable('catalog_brands').addCheckConstraint('catalog_brands_merge_state_ck', sql`(review_status = 'MERGED' and merged_into_id is not null and status = 'INACTIVE') or (review_status <> 'MERGED' and merged_into_id is null)`).execute();

  await sql`insert into catalog_categories (tenant_id, category_id, display_name, normalized_name, status, review_status, merged_into_id, created_by_actor_id, created_in_branch_id, created_in_station_id, created_in_session_id, reviewed_by_actor_id, reviewed_at, version, created_at, updated_at)
    select tenant_id, pending_category_value_id, raw_label_example, normalized_key,
      case resolution_status when 'PENDING' then 'ACTIVE' else 'INACTIVE' end,
      case resolution_status when 'PENDING' then 'PENDING' else 'MERGED' end,
      canonical_category_id, captured_by_actor_id, captured_in_branch_id,
      captured_in_station_id, captured_in_session_id, resolved_by_actor_id, resolved_at,
      version, first_seen_at, last_seen_at from catalog_category_pending_values`.execute(database);
  await sql`insert into catalog_category_kind_applicability (tenant_id, category_id, kind)
    select tenant_id, pending_category_value_id, kind from catalog_category_pending_values`.execute(database);
  await sql`insert into catalog_brands (tenant_id, brand_id, display_name, normalized_name, status, review_status, merged_into_id, created_by_actor_id, created_in_branch_id, created_in_station_id, created_in_session_id, reviewed_by_actor_id, reviewed_at, version, created_at, updated_at)
    select tenant_id, pending_brand_value_id, raw_label_example, normalized_key,
      case resolution_status when 'PENDING' then 'ACTIVE' else 'INACTIVE' end,
      case resolution_status when 'PENDING' then 'PENDING' else 'MERGED' end,
      canonical_brand_id, captured_by_actor_id, captured_in_branch_id,
      captured_in_station_id, captured_in_session_id, resolved_by_actor_id, resolved_at,
      version, first_seen_at, last_seen_at from catalog_brand_pending_values`.execute(database);
  await sql`insert into catalog_brand_kind_applicability (tenant_id, brand_id, kind)
    select tenant_id, pending_brand_value_id, kind from catalog_brand_pending_kind_applicability`.execute(database);
  await sql`update catalog_items set category_id = coalesce(category_id, pending_category_value_id), brand_id = coalesce(brand_id, pending_brand_value_id)`.execute(database);

  await database.schema.dropIndex('catalog_items_pending_brand_idx').execute();
  await database.schema.dropIndex('catalog_items_pending_category_idx').execute();
  await database.schema.alterTable('catalog_items').dropConstraint('catalog_items_category_reference_ck').execute();
  await database.schema.alterTable('catalog_items').dropConstraint('catalog_items_pending_brand_fk').execute();
  await database.schema.alterTable('catalog_items').dropConstraint('catalog_items_pending_category_fk').execute();
  await database.schema.alterTable('catalog_items').dropColumn('pending_brand_value_id').dropColumn('pending_category_value_id').alterColumn('category_id', (column) => column.setNotNull()).execute();
  await database.schema.dropTable('catalog_brand_pending_kind_applicability').execute();
  await database.schema.dropTable('catalog_brand_pending_values').execute();
  await database.schema.dropTable('catalog_category_pending_values').execute();
}
