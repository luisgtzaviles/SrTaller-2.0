import { sql, type Kysely } from 'kysely';

import type { DatabaseSchema } from '../database-types.js';

export async function up(database: Kysely<DatabaseSchema>): Promise<void> {
  await database.schema.alterTable('catalog_categories')
    .addColumn('review_status', 'varchar(16)', (column) => column.notNull().defaultTo('APPROVED'))
    .addColumn('merged_into_id', 'uuid')
    .addColumn('created_by_actor_id', 'uuid')
    .addColumn('created_in_branch_id', 'uuid')
    .addColumn('created_in_station_id', 'uuid')
    .addColumn('created_in_session_id', 'uuid')
    .addColumn('reviewed_by_actor_id', 'uuid')
    .addColumn('reviewed_at', 'timestamptz').execute();
  await database.schema.alterTable('catalog_categories').addCheckConstraint('catalog_categories_review_status_ck', sql`review_status in ('APPROVED', 'PENDING', 'MERGED')`).execute();
  await database.schema.alterTable('catalog_categories').addCheckConstraint('catalog_categories_merge_state_ck', sql`(review_status = 'MERGED' and merged_into_id is not null and status = 'INACTIVE') or (review_status <> 'MERGED' and merged_into_id is null)`).execute();

  await database.schema.alterTable('catalog_brands')
    .addColumn('review_status', 'varchar(16)', (column) => column.notNull().defaultTo('APPROVED'))
    .addColumn('merged_into_id', 'uuid')
    .addColumn('created_by_actor_id', 'uuid')
    .addColumn('created_in_branch_id', 'uuid')
    .addColumn('created_in_station_id', 'uuid')
    .addColumn('created_in_session_id', 'uuid')
    .addColumn('reviewed_by_actor_id', 'uuid')
    .addColumn('reviewed_at', 'timestamptz').execute();
  await database.schema.alterTable('catalog_brands').addCheckConstraint('catalog_brands_review_status_ck', sql`review_status in ('APPROVED', 'PENDING', 'MERGED')`).execute();
  await database.schema.alterTable('catalog_brands').addCheckConstraint('catalog_brands_merge_state_ck', sql`(review_status = 'MERGED' and merged_into_id is not null and status = 'INACTIVE') or (review_status <> 'MERGED' and merged_into_id is null)`).execute();

  await database.schema.createTable('catalog_category_kind_applicability')
    .addColumn('tenant_id', 'uuid', (column) => column.notNull())
    .addColumn('category_id', 'uuid', (column) => column.notNull())
    .addColumn('kind', 'varchar(16)', (column) => column.notNull())
    .addPrimaryKeyConstraint('catalog_category_kind_applicability_pk', ['tenant_id', 'category_id', 'kind'])
    .addForeignKeyConstraint('catalog_category_kind_applicability_category_fk', ['tenant_id', 'category_id'], 'catalog_categories', ['tenant_id', 'category_id'], (constraint) => constraint.onDelete('cascade').onUpdate('restrict'))
    .addCheckConstraint('catalog_category_kind_applicability_kind_ck', sql`kind in ('PART', 'PRODUCT', 'SERVICE', 'SUPPLY')`)
    .execute();

  await database.schema.createTable('catalog_brand_kind_applicability')
    .addColumn('tenant_id', 'uuid', (column) => column.notNull())
    .addColumn('brand_id', 'uuid', (column) => column.notNull())
    .addColumn('kind', 'varchar(16)', (column) => column.notNull())
    .addPrimaryKeyConstraint('catalog_brand_kind_applicability_pk', ['tenant_id', 'brand_id', 'kind'])
    .addForeignKeyConstraint('catalog_brand_kind_applicability_brand_fk', ['tenant_id', 'brand_id'], 'catalog_brands', ['tenant_id', 'brand_id'], (constraint) => constraint.onDelete('cascade').onUpdate('restrict'))
    .addCheckConstraint('catalog_brand_kind_applicability_kind_ck', sql`kind in ('PART', 'PRODUCT', 'SERVICE', 'SUPPLY')`)
    .execute();

  // The pre-governance model had no applicability contract. Existing values
  // remain usable in every kind; every newly-created value is explicitly scoped.
  await sql`insert into catalog_category_kind_applicability (tenant_id, category_id, kind)
    select category.tenant_id, category.category_id, kind.value
    from catalog_categories category cross join (values ('PART'), ('PRODUCT'), ('SERVICE'), ('SUPPLY')) as kind(value)`.execute(database);
  await sql`insert into catalog_brand_kind_applicability (tenant_id, brand_id, kind)
    select brand.tenant_id, brand.brand_id, kind.value
    from catalog_brands brand cross join (values ('PART'), ('PRODUCT'), ('SERVICE'), ('SUPPLY')) as kind(value)`.execute(database);

  await database.schema.createTable('catalog_internal_code_sequences')
    .addColumn('tenant_id', 'uuid', (column) => column.notNull())
    .addColumn('next_value', 'bigint', (column) => column.notNull())
    .addPrimaryKeyConstraint('catalog_internal_code_sequences_pk', ['tenant_id'])
    .addForeignKeyConstraint('catalog_internal_code_sequences_tenant_fk', ['tenant_id'], 'tenants', ['tenant_id'], (constraint) => constraint.onDelete('restrict').onUpdate('restrict'))
    .addCheckConstraint('catalog_internal_code_sequences_next_ck', sql`next_value >= 1`)
    .execute();
}

export async function down(database: Kysely<DatabaseSchema>): Promise<void> {
  await database.schema.dropTable('catalog_internal_code_sequences').execute();
  await database.schema.dropTable('catalog_brand_kind_applicability').execute();
  await database.schema.dropTable('catalog_category_kind_applicability').execute();
  await database.schema.alterTable('catalog_brands').dropConstraint('catalog_brands_merge_state_ck').execute();
  await database.schema.alterTable('catalog_brands').dropConstraint('catalog_brands_review_status_ck').execute();
  await database.schema.alterTable('catalog_brands')
    .dropColumn('reviewed_at').dropColumn('reviewed_by_actor_id')
    .dropColumn('created_in_session_id').dropColumn('created_in_station_id')
    .dropColumn('created_in_branch_id').dropColumn('created_by_actor_id')
    .dropColumn('merged_into_id').dropColumn('review_status').execute();
  await database.schema.alterTable('catalog_categories').dropConstraint('catalog_categories_merge_state_ck').execute();
  await database.schema.alterTable('catalog_categories').dropConstraint('catalog_categories_review_status_ck').execute();
  await database.schema.alterTable('catalog_categories')
    .dropColumn('reviewed_at').dropColumn('reviewed_by_actor_id')
    .dropColumn('created_in_session_id').dropColumn('created_in_station_id')
    .dropColumn('created_in_branch_id').dropColumn('created_by_actor_id')
    .dropColumn('merged_into_id').dropColumn('review_status').execute();
}
