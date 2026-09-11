import { sql, type Kysely } from 'kysely';

import type { DatabaseSchema } from '../database-types.js';

/** PBI-039 Branch-owned Customer minimum; phones are non-unique lookup aids. */
export async function up(database: Kysely<DatabaseSchema>): Promise<void> {
  await database.schema
    .createTable('customers')
    .addColumn('customer_id', 'uuid', (column) => column.notNull())
    .addColumn('tenant_id', 'uuid', (column) => column.notNull())
    .addColumn('branch_id', 'uuid', (column) => column.notNull())
    .addColumn('given_name', 'varchar(80)', (column) => column.notNull())
    .addColumn('family_name', 'varchar(120)')
    .addColumn('created_at', 'timestamptz', (column) => column.notNull())
    .addPrimaryKeyConstraint('customers_pk', ['customer_id'])
    .addUniqueConstraint('customers_scope_id_uq', ['tenant_id', 'branch_id', 'customer_id'])
    .addForeignKeyConstraint('customers_branch_fk', ['tenant_id', 'branch_id'], 'branches', ['tenant_id', 'branch_id'], (constraint) => constraint.onUpdate('restrict').onDelete('restrict'))
    .addCheckConstraint('customers_given_name_ck', sql`char_length(btrim(given_name)) between 1 and 80`)
    .addCheckConstraint('customers_family_name_ck', sql`family_name is null or char_length(btrim(family_name)) between 1 and 120`)
    .execute();
  await database.schema.createIndex('customers_branch_name_lookup_idx').on('customers')
    .columns(['tenant_id', 'branch_id', 'given_name', 'family_name', 'customer_id']).execute();

  await database.schema
    .createTable('customer_contact_phones')
    .addColumn('customer_contact_phone_id', 'uuid', (column) => column.notNull())
    .addColumn('tenant_id', 'uuid', (column) => column.notNull())
    .addColumn('branch_id', 'uuid', (column) => column.notNull())
    .addColumn('customer_id', 'uuid', (column) => column.notNull())
    .addColumn('phone_normalized', 'varchar(40)', (column) => column.notNull())
    .addColumn('created_at', 'timestamptz', (column) => column.notNull())
    .addPrimaryKeyConstraint('customer_contact_phones_pk', ['customer_contact_phone_id'])
    .addUniqueConstraint('customer_contact_phones_customer_phone_uq', ['tenant_id', 'branch_id', 'customer_id', 'phone_normalized'])
    .addForeignKeyConstraint('customer_contact_phones_customer_fk', ['tenant_id', 'branch_id', 'customer_id'], 'customers', ['tenant_id', 'branch_id', 'customer_id'], (constraint) => constraint.onUpdate('restrict').onDelete('restrict'))
    .addCheckConstraint('customer_contact_phones_phone_ck', sql`phone_normalized ~ '^[0-9]{7,20}$'`)
    .execute();
  await database.schema.createIndex('customer_contact_phones_branch_phone_lookup_idx').on('customer_contact_phones')
    .columns(['tenant_id', 'branch_id', 'phone_normalized', 'customer_id']).execute();
}

export async function down(database: Kysely<DatabaseSchema>): Promise<void> {
  await database.schema.dropIndex('customer_contact_phones_branch_phone_lookup_idx').execute();
  await database.schema.dropTable('customer_contact_phones').execute();
  await database.schema.dropIndex('customers_branch_name_lookup_idx').execute();
  await database.schema.dropTable('customers').execute();
}
