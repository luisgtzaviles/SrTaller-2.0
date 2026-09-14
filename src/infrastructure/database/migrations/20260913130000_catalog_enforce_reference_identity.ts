import { sql, type Kysely } from 'kysely';

import type { DatabaseSchema } from '../database-types.js';

/**
 * Category identity includes its owning item kind. Brand identity remains
 * Tenant-wide. The applicability table is retained as the read projection used
 * by Catalog governance and filtering.
 */
export async function up(database: Kysely<DatabaseSchema>): Promise<void> {
  await database.schema.createTable('catalog_reference_identity_locks')
    .addColumn('tenant_id', 'uuid', (column) => column.notNull())
    .addColumn('identity_key', 'varchar(320)', (column) => column.notNull())
    .addColumn('created_at', 'timestamptz', (column) => column.notNull())
    .addPrimaryKeyConstraint('catalog_reference_identity_locks_pk', ['tenant_id', 'identity_key'])
    .addForeignKeyConstraint('catalog_reference_identity_locks_tenant_fk', ['tenant_id'], 'tenants', ['tenant_id'], (constraint) => constraint.onDelete('restrict').onUpdate('restrict'))
    .addCheckConstraint('catalog_reference_identity_locks_key_ck', sql`length(btrim(identity_key)) between 1 and 320`)
    .execute();
  await database.schema.alterTable('catalog_categories').addColumn('kind', 'varchar(16)').execute();
  await sql`update catalog_categories category
    set kind = applicability.kind
    from catalog_category_kind_applicability applicability
    where applicability.tenant_id = category.tenant_id
      and applicability.category_id = category.category_id`.execute(database);
  await database.schema.alterTable('catalog_categories').alterColumn('kind', (column) => column.setNotNull()).execute();
  await database.schema.alterTable('catalog_categories').addCheckConstraint('catalog_categories_kind_ck', sql`kind in ('PART', 'PRODUCT', 'SERVICE', 'SUPPLY')`).execute();
  await database.schema.alterTable('catalog_categories').dropConstraint('catalog_categories_name_uq').execute();
  await database.schema.alterTable('catalog_categories').addUniqueConstraint('catalog_categories_kind_name_uq', ['tenant_id', 'kind', 'normalized_name']).execute();
}

export async function down(database: Kysely<DatabaseSchema>): Promise<void> {
  await database.schema.alterTable('catalog_categories').dropConstraint('catalog_categories_kind_name_uq').execute();
  await database.schema.alterTable('catalog_categories').addUniqueConstraint('catalog_categories_name_uq', ['tenant_id', 'normalized_name']).execute();
  await database.schema.alterTable('catalog_categories').dropConstraint('catalog_categories_kind_ck').execute();
  await database.schema.alterTable('catalog_categories').dropColumn('kind').execute();
  await database.schema.dropTable('catalog_reference_identity_locks').execute();
}
