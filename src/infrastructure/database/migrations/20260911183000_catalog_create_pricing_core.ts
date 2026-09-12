import { sql, type Kysely } from 'kysely';

import type { DatabaseSchema } from '../database-types.js';

export async function up(database: Kysely<DatabaseSchema>): Promise<void> {
  await database.schema.createTable('catalog_categories')
    .addColumn('tenant_id', 'uuid', (column) => column.notNull())
    .addColumn('category_id', 'uuid', (column) => column.notNull())
    .addColumn('display_name', 'varchar(120)', (column) => column.notNull())
    .addColumn('normalized_name', 'varchar(120)', (column) => column.notNull())
    .addColumn('status', 'varchar(16)', (column) => column.notNull())
    .addColumn('version', 'integer', (column) => column.notNull())
    .addColumn('created_at', 'timestamptz', (column) => column.notNull())
    .addColumn('updated_at', 'timestamptz', (column) => column.notNull())
    .addPrimaryKeyConstraint('catalog_categories_pk', ['tenant_id', 'category_id'])
    .addUniqueConstraint('catalog_categories_name_uq', ['tenant_id', 'normalized_name'])
    .addForeignKeyConstraint('catalog_categories_tenant_fk', ['tenant_id'], 'tenants', ['tenant_id'], (constraint) => constraint.onDelete('restrict').onUpdate('restrict'))
    .addCheckConstraint('catalog_categories_status_ck', sql`status in ('ACTIVE', 'INACTIVE')`)
    .addCheckConstraint('catalog_categories_version_ck', sql`version >= 1`)
    .execute();

  await database.schema.createTable('catalog_brands')
    .addColumn('tenant_id', 'uuid', (column) => column.notNull())
    .addColumn('brand_id', 'uuid', (column) => column.notNull())
    .addColumn('display_name', 'varchar(120)', (column) => column.notNull())
    .addColumn('normalized_name', 'varchar(120)', (column) => column.notNull())
    .addColumn('status', 'varchar(16)', (column) => column.notNull())
    .addColumn('version', 'integer', (column) => column.notNull())
    .addColumn('created_at', 'timestamptz', (column) => column.notNull())
    .addColumn('updated_at', 'timestamptz', (column) => column.notNull())
    .addPrimaryKeyConstraint('catalog_brands_pk', ['tenant_id', 'brand_id'])
    .addUniqueConstraint('catalog_brands_name_uq', ['tenant_id', 'normalized_name'])
    .addForeignKeyConstraint('catalog_brands_tenant_fk', ['tenant_id'], 'tenants', ['tenant_id'], (constraint) => constraint.onDelete('restrict').onUpdate('restrict'))
    .addCheckConstraint('catalog_brands_status_ck', sql`status in ('ACTIVE', 'INACTIVE')`)
    .addCheckConstraint('catalog_brands_version_ck', sql`version >= 1`)
    .execute();

  await database.schema.createTable('catalog_items')
    .addColumn('tenant_id', 'uuid', (column) => column.notNull())
    .addColumn('item_id', 'uuid', (column) => column.notNull())
    .addColumn('kind', 'varchar(16)', (column) => column.notNull())
    .addColumn('title', 'varchar(200)', (column) => column.notNull())
    .addColumn('normalized_title', 'varchar(200)', (column) => column.notNull())
    .addColumn('description', 'varchar(2000)')
    .addColumn('category_id', 'uuid', (column) => column.notNull())
    .addColumn('brand_id', 'uuid')
    .addColumn('status', 'varchar(16)', (column) => column.notNull())
    .addColumn('sellable', 'boolean', (column) => column.notNull())
    .addColumn('stockable', 'boolean', (column) => column.notNull())
    .addColumn('purchasable', 'boolean', (column) => column.notNull())
    .addColumn('applicable_to_repair', 'boolean', (column) => column.notNull())
    .addColumn('version', 'integer', (column) => column.notNull())
    .addColumn('created_at', 'timestamptz', (column) => column.notNull())
    .addColumn('updated_at', 'timestamptz', (column) => column.notNull())
    .addPrimaryKeyConstraint('catalog_items_pk', ['tenant_id', 'item_id'])
    .addForeignKeyConstraint('catalog_items_category_fk', ['tenant_id', 'category_id'], 'catalog_categories', ['tenant_id', 'category_id'], (constraint) => constraint.onDelete('restrict').onUpdate('restrict'))
    .addForeignKeyConstraint('catalog_items_brand_fk', ['tenant_id', 'brand_id'], 'catalog_brands', ['tenant_id', 'brand_id'], (constraint) => constraint.onDelete('restrict').onUpdate('restrict'))
    .addCheckConstraint('catalog_items_kind_ck', sql`kind in ('PART', 'PRODUCT', 'SERVICE', 'SUPPLY')`)
    .addCheckConstraint('catalog_items_status_ck', sql`status in ('ACTIVE', 'INACTIVE')`)
    .addCheckConstraint('catalog_items_capabilities_ck', sql`(kind = 'PART' and sellable and stockable and purchasable and applicable_to_repair) or (kind = 'PRODUCT' and sellable and stockable and purchasable and not applicable_to_repair) or (kind = 'SERVICE' and sellable and not stockable and not purchasable and applicable_to_repair) or (kind = 'SUPPLY' and not sellable and stockable and purchasable and not applicable_to_repair)`)
    .addCheckConstraint('catalog_items_version_ck', sql`version >= 1`)
    .execute();
  await database.schema.createIndex('catalog_items_search_idx').on('catalog_items').columns(['tenant_id', 'status', 'sellable', 'normalized_title', 'item_id']).execute();
  await database.schema.createIndex('catalog_items_category_idx').on('catalog_items').columns(['tenant_id', 'category_id', 'status']).execute();

  await database.schema.createTable('catalog_item_identifiers')
    .addColumn('tenant_id', 'uuid', (column) => column.notNull())
    .addColumn('identifier_id', 'uuid', (column) => column.notNull())
    .addColumn('item_id', 'uuid', (column) => column.notNull())
    .addColumn('scheme', 'varchar(24)', (column) => column.notNull())
    .addColumn('normalized_value', 'varchar(128)', (column) => column.notNull())
    .addColumn('display_value', 'varchar(128)', (column) => column.notNull())
    .addColumn('created_at', 'timestamptz', (column) => column.notNull())
    .addPrimaryKeyConstraint('catalog_item_identifiers_pk', ['tenant_id', 'identifier_id'])
    .addUniqueConstraint('catalog_item_identifiers_value_uq', ['tenant_id', 'scheme', 'normalized_value'])
    .addForeignKeyConstraint('catalog_item_identifiers_item_fk', ['tenant_id', 'item_id'], 'catalog_items', ['tenant_id', 'item_id'], (constraint) => constraint.onDelete('restrict').onUpdate('restrict'))
    .addCheckConstraint('catalog_item_identifiers_scheme_ck', sql`scheme in ('SKU', 'INTERNAL_BARCODE', 'GTIN_8', 'GTIN_12', 'GTIN_13', 'GTIN_14')`)
    .execute();
  await database.schema.createIndex('catalog_item_identifiers_item_idx').on('catalog_item_identifiers').columns(['tenant_id', 'item_id', 'scheme']).execute();

  await database.schema.createTable('catalog_sku_sequences')
    .addColumn('tenant_id', 'uuid', (column) => column.notNull())
    .addColumn('kind', 'varchar(16)', (column) => column.notNull())
    .addColumn('next_value', 'bigint', (column) => column.notNull())
    .addPrimaryKeyConstraint('catalog_sku_sequences_pk', ['tenant_id', 'kind'])
    .addForeignKeyConstraint('catalog_sku_sequences_tenant_fk', ['tenant_id'], 'tenants', ['tenant_id'], (constraint) => constraint.onDelete('restrict').onUpdate('restrict'))
    .addCheckConstraint('catalog_sku_sequences_kind_ck', sql`kind in ('PART', 'PRODUCT', 'SERVICE', 'SUPPLY')`)
    .addCheckConstraint('catalog_sku_sequences_next_ck', sql`next_value >= 1`)
    .execute();

  await database.schema.createTable('catalog_base_price_revisions')
    .addColumn('tenant_id', 'uuid', (column) => column.notNull())
    .addColumn('revision_id', 'uuid', (column) => column.notNull())
    .addColumn('item_id', 'uuid', (column) => column.notNull())
    .addColumn('amount_minor', 'bigint', (column) => column.notNull())
    .addColumn('currency', 'varchar(3)', (column) => column.notNull())
    .addColumn('item_version', 'integer', (column) => column.notNull())
    .addColumn('reason', 'varchar(500)')
    .addColumn('actor_user_id', 'uuid', (column) => column.notNull())
    .addColumn('correlation_id', 'uuid', (column) => column.notNull())
    .addColumn('effective_from', 'timestamptz', (column) => column.notNull())
    .addPrimaryKeyConstraint('catalog_base_price_revisions_pk', ['tenant_id', 'revision_id'])
    .addUniqueConstraint('catalog_base_price_revisions_version_uq', ['tenant_id', 'item_id', 'item_version'])
    .addForeignKeyConstraint('catalog_base_price_revisions_item_fk', ['tenant_id', 'item_id'], 'catalog_items', ['tenant_id', 'item_id'], (constraint) => constraint.onDelete('restrict').onUpdate('restrict'))
    .addCheckConstraint('catalog_base_price_revisions_amount_ck', sql`amount_minor >= 0`)
    .addCheckConstraint('catalog_base_price_revisions_currency_ck', sql`currency ~ '^[A-Z]{3}$'`)
    .execute();
  await database.schema.createIndex('catalog_base_price_effective_idx').on('catalog_base_price_revisions').columns(['tenant_id', 'item_id', 'effective_from', 'revision_id']).execute();

  await database.schema.createTable('catalog_branch_price_revisions')
    .addColumn('tenant_id', 'uuid', (column) => column.notNull())
    .addColumn('branch_id', 'uuid', (column) => column.notNull())
    .addColumn('revision_id', 'uuid', (column) => column.notNull())
    .addColumn('item_id', 'uuid', (column) => column.notNull())
    .addColumn('action', 'varchar(12)', (column) => column.notNull())
    .addColumn('amount_minor', 'bigint')
    .addColumn('currency', 'varchar(3)', (column) => column.notNull())
    .addColumn('item_version', 'integer', (column) => column.notNull())
    .addColumn('reason', 'varchar(500)')
    .addColumn('actor_user_id', 'uuid', (column) => column.notNull())
    .addColumn('correlation_id', 'uuid', (column) => column.notNull())
    .addColumn('effective_from', 'timestamptz', (column) => column.notNull())
    .addPrimaryKeyConstraint('catalog_branch_price_revisions_pk', ['tenant_id', 'branch_id', 'revision_id'])
    .addUniqueConstraint('catalog_branch_price_revisions_version_uq', ['tenant_id', 'branch_id', 'item_id', 'item_version'])
    .addForeignKeyConstraint('catalog_branch_price_revisions_branch_fk', ['tenant_id', 'branch_id'], 'branches', ['tenant_id', 'branch_id'], (constraint) => constraint.onDelete('restrict').onUpdate('restrict'))
    .addForeignKeyConstraint('catalog_branch_price_revisions_item_fk', ['tenant_id', 'item_id'], 'catalog_items', ['tenant_id', 'item_id'], (constraint) => constraint.onDelete('restrict').onUpdate('restrict'))
    .addCheckConstraint('catalog_branch_price_revisions_action_ck', sql`(action = 'SET' and amount_minor is not null and amount_minor >= 0) or (action = 'REVOKE' and amount_minor is null)`)
    .addCheckConstraint('catalog_branch_price_revisions_currency_ck', sql`currency ~ '^[A-Z]{3}$'`)
    .execute();
  await database.schema.createIndex('catalog_branch_price_effective_idx').on('catalog_branch_price_revisions').columns(['tenant_id', 'branch_id', 'item_id', 'effective_from', 'revision_id']).execute();

  await database.schema.createTable('catalog_reference_cost_revisions')
    .addColumn('tenant_id', 'uuid', (column) => column.notNull())
    .addColumn('revision_id', 'uuid', (column) => column.notNull())
    .addColumn('item_id', 'uuid', (column) => column.notNull())
    .addColumn('amount_minor', 'bigint', (column) => column.notNull())
    .addColumn('currency', 'varchar(3)', (column) => column.notNull())
    .addColumn('source_type', 'varchar(16)', (column) => column.notNull())
    .addColumn('source_label', 'varchar(160)')
    .addColumn('observed_at', 'timestamptz', (column) => column.notNull())
    .addColumn('item_version', 'integer', (column) => column.notNull())
    .addColumn('reason', 'varchar(500)')
    .addColumn('actor_user_id', 'uuid', (column) => column.notNull())
    .addColumn('correlation_id', 'uuid', (column) => column.notNull())
    .addColumn('effective_from', 'timestamptz', (column) => column.notNull())
    .addPrimaryKeyConstraint('catalog_reference_cost_revisions_pk', ['tenant_id', 'revision_id'])
    .addUniqueConstraint('catalog_reference_cost_revisions_version_uq', ['tenant_id', 'item_id', 'item_version'])
    .addForeignKeyConstraint('catalog_reference_cost_revisions_item_fk', ['tenant_id', 'item_id'], 'catalog_items', ['tenant_id', 'item_id'], (constraint) => constraint.onDelete('restrict').onUpdate('restrict'))
    .addCheckConstraint('catalog_reference_cost_revisions_amount_ck', sql`amount_minor >= 0`)
    .addCheckConstraint('catalog_reference_cost_revisions_source_ck', sql`source_type in ('MANUAL', 'IMPORTED', 'ESTIMATED', 'THIRD_PARTY')`)
    .addCheckConstraint('catalog_reference_cost_revisions_currency_ck', sql`currency ~ '^[A-Z]{3}$'`)
    .execute();
  await database.schema.createIndex('catalog_reference_cost_effective_idx').on('catalog_reference_cost_revisions').columns(['tenant_id', 'item_id', 'effective_from', 'revision_id']).execute();

  await database.schema.createTable('catalog_commands')
    .addColumn('tenant_id', 'uuid', (column) => column.notNull())
    .addColumn('operation', 'varchar(48)', (column) => column.notNull())
    .addColumn('client_request_id', 'uuid', (column) => column.notNull())
    .addColumn('request_fingerprint', 'bytea', (column) => column.notNull())
    .addColumn('result_item_id', 'uuid', (column) => column.notNull())
    .addColumn('result_version', 'integer', (column) => column.notNull())
    .addColumn('result_payload', 'jsonb', (column) => column.notNull())
    .addColumn('applied_at', 'timestamptz', (column) => column.notNull())
    .addPrimaryKeyConstraint('catalog_commands_pk', ['tenant_id', 'operation', 'client_request_id'])
    .addForeignKeyConstraint('catalog_commands_tenant_fk', ['tenant_id'], 'tenants', ['tenant_id'], (constraint) => constraint.onDelete('restrict').onUpdate('restrict'))
    .execute();

  await database.schema.createTable('catalog_audit_events')
    .addColumn('tenant_id', 'uuid', (column) => column.notNull())
    .addColumn('audit_id', 'uuid', (column) => column.notNull())
    .addColumn('branch_id', 'uuid')
    .addColumn('station_id', 'uuid', (column) => column.notNull())
    .addColumn('session_id', 'uuid', (column) => column.notNull())
    .addColumn('actor_user_id', 'uuid', (column) => column.notNull())
    .addColumn('actor_display_name', 'varchar(160)', (column) => column.notNull())
    .addColumn('capability', 'varchar(80)', (column) => column.notNull())
    .addColumn('action', 'varchar(80)', (column) => column.notNull())
    .addColumn('resource_id', 'uuid', (column) => column.notNull())
    .addColumn('old_version', 'integer')
    .addColumn('new_version', 'integer', (column) => column.notNull())
    .addColumn('change_summary', 'jsonb', (column) => column.notNull())
    .addColumn('result', 'varchar(16)', (column) => column.notNull())
    .addColumn('correlation_id', 'uuid', (column) => column.notNull())
    .addColumn('client_request_id', 'uuid', (column) => column.notNull())
    .addColumn('occurred_at', 'timestamptz', (column) => column.notNull())
    .addPrimaryKeyConstraint('catalog_audit_events_pk', ['tenant_id', 'audit_id'])
    .addUniqueConstraint('catalog_audit_events_correlation_uq', ['tenant_id', 'correlation_id'])
    .addCheckConstraint('catalog_audit_events_result_ck', sql`result = 'SUCCEEDED'`)
    .execute();
  await database.schema.createIndex('catalog_audit_events_resource_idx').on('catalog_audit_events').columns(['tenant_id', 'resource_id', 'occurred_at', 'audit_id']).execute();

  await sql`
    create function catalog_reject_append_only_mutation()
    returns trigger language plpgsql as $function$
    begin
      raise check_violation using message = 'Catalog history is append-only.';
    end;
    $function$
  `.execute(database);
  await sql`create trigger catalog_item_identifiers_reject_update before update on catalog_item_identifiers for each row execute function catalog_reject_append_only_mutation()`.execute(database);
  await sql`create trigger catalog_item_identifiers_reject_delete before delete on catalog_item_identifiers for each row execute function catalog_reject_append_only_mutation()`.execute(database);
  await sql`create trigger catalog_base_price_revisions_reject_update before update on catalog_base_price_revisions for each row execute function catalog_reject_append_only_mutation()`.execute(database);
  await sql`create trigger catalog_base_price_revisions_reject_delete before delete on catalog_base_price_revisions for each row execute function catalog_reject_append_only_mutation()`.execute(database);
  await sql`create trigger catalog_branch_price_revisions_reject_update before update on catalog_branch_price_revisions for each row execute function catalog_reject_append_only_mutation()`.execute(database);
  await sql`create trigger catalog_branch_price_revisions_reject_delete before delete on catalog_branch_price_revisions for each row execute function catalog_reject_append_only_mutation()`.execute(database);
  await sql`create trigger catalog_reference_cost_revisions_reject_update before update on catalog_reference_cost_revisions for each row execute function catalog_reject_append_only_mutation()`.execute(database);
  await sql`create trigger catalog_reference_cost_revisions_reject_delete before delete on catalog_reference_cost_revisions for each row execute function catalog_reject_append_only_mutation()`.execute(database);
  await sql`create trigger catalog_commands_reject_update before update on catalog_commands for each row execute function catalog_reject_append_only_mutation()`.execute(database);
  await sql`create trigger catalog_commands_reject_delete before delete on catalog_commands for each row execute function catalog_reject_append_only_mutation()`.execute(database);
  await sql`create trigger catalog_audit_events_reject_update before update on catalog_audit_events for each row execute function catalog_reject_append_only_mutation()`.execute(database);
  await sql`create trigger catalog_audit_events_reject_delete before delete on catalog_audit_events for each row execute function catalog_reject_append_only_mutation()`.execute(database);
}

export async function down(database: Kysely<DatabaseSchema>): Promise<void> {
  await sql`drop trigger if exists catalog_audit_events_reject_delete on catalog_audit_events`.execute(database);
  await sql`drop trigger if exists catalog_audit_events_reject_update on catalog_audit_events`.execute(database);
  await sql`drop trigger if exists catalog_commands_reject_delete on catalog_commands`.execute(database);
  await sql`drop trigger if exists catalog_commands_reject_update on catalog_commands`.execute(database);
  await sql`drop trigger if exists catalog_reference_cost_revisions_reject_delete on catalog_reference_cost_revisions`.execute(database);
  await sql`drop trigger if exists catalog_reference_cost_revisions_reject_update on catalog_reference_cost_revisions`.execute(database);
  await sql`drop trigger if exists catalog_branch_price_revisions_reject_delete on catalog_branch_price_revisions`.execute(database);
  await sql`drop trigger if exists catalog_branch_price_revisions_reject_update on catalog_branch_price_revisions`.execute(database);
  await sql`drop trigger if exists catalog_base_price_revisions_reject_delete on catalog_base_price_revisions`.execute(database);
  await sql`drop trigger if exists catalog_base_price_revisions_reject_update on catalog_base_price_revisions`.execute(database);
  await sql`drop trigger if exists catalog_item_identifiers_reject_delete on catalog_item_identifiers`.execute(database);
  await sql`drop trigger if exists catalog_item_identifiers_reject_update on catalog_item_identifiers`.execute(database);
  await sql`drop function if exists catalog_reject_append_only_mutation()`.execute(database);
  await database.schema.dropTable('catalog_audit_events').execute();
  await database.schema.dropTable('catalog_commands').execute();
  await database.schema.dropTable('catalog_reference_cost_revisions').execute();
  await database.schema.dropTable('catalog_branch_price_revisions').execute();
  await database.schema.dropTable('catalog_base_price_revisions').execute();
  await database.schema.dropTable('catalog_sku_sequences').execute();
  await database.schema.dropTable('catalog_item_identifiers').execute();
  await database.schema.dropTable('catalog_items').execute();
  await database.schema.dropTable('catalog_brands').execute();
  await database.schema.dropTable('catalog_categories').execute();
}
