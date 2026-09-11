import { sql, type Kysely } from 'kysely';

import type { DatabaseSchema } from '../database-types.js';

/** PBI-039 atomic Repair + Intake creation on the accepted Repairs foundation. */
export async function up(database: Kysely<DatabaseSchema>): Promise<void> {
  await database.schema.alterTable('repairs').alterColumn('customer_phone', (column) => column.dropNotNull()).execute();
  await database.schema.alterTable('repairs').alterColumn('device_brand', (column) => column.dropNotNull()).execute();
  await database.schema.alterTable('repairs').alterColumn('device_model', (column) => column.dropNotNull()).execute();
  await database.schema.alterTable('repairs').addColumn('customer_id', 'uuid').execute();
  await database.schema.alterTable('repairs')
    .addForeignKeyConstraint('repairs_customer_branch_fk', ['tenant_id', 'branch_id', 'customer_id'], 'customers', ['tenant_id', 'branch_id', 'customer_id'], (constraint) => constraint.onUpdate('restrict').onDelete('restrict'))
    .execute();
  await database.schema.createIndex('repairs_customer_history_idx').on('repairs')
    .columns(['tenant_id', 'branch_id', 'customer_id', 'received_at', 'repair_id']).execute();

  await database.schema
    .createTable('repair_folio_sequences')
    .addColumn('tenant_id', 'uuid', (column) => column.notNull())
    .addColumn('branch_id', 'uuid', (column) => column.notNull())
    .addColumn('next_value', 'integer', (column) => column.notNull())
    .addColumn('updated_at', 'timestamptz', (column) => column.notNull())
    .addPrimaryKeyConstraint('repair_folio_sequences_pk', ['tenant_id', 'branch_id'])
    .addForeignKeyConstraint('repair_folio_sequences_branch_fk', ['tenant_id', 'branch_id'], 'branches', ['tenant_id', 'branch_id'], (constraint) => constraint.onUpdate('restrict').onDelete('restrict'))
    .addCheckConstraint('repair_folio_sequences_next_value_ck', sql`next_value >= 1000`)
    .execute();

  await database.schema
    .createTable('repair_create_commands')
    .addColumn('tenant_id', 'uuid', (column) => column.notNull())
    .addColumn('branch_id', 'uuid', (column) => column.notNull())
    .addColumn('client_request_id', 'uuid', (column) => column.notNull())
    .addColumn('request_fingerprint', 'bytea', (column) => column.notNull())
    .addColumn('repair_id', 'uuid', (column) => column.notNull())
    .addColumn('customer_id', 'uuid', (column) => column.notNull())
    .addColumn('folio', 'varchar(32)', (column) => column.notNull())
    .addColumn('applied_at', 'timestamptz', (column) => column.notNull())
    .addPrimaryKeyConstraint('repair_create_commands_pk', ['tenant_id', 'branch_id', 'client_request_id'])
    .addForeignKeyConstraint('repair_create_commands_repair_fk', ['tenant_id', 'branch_id', 'repair_id'], 'repairs', ['tenant_id', 'branch_id', 'repair_id'], (constraint) => constraint.onUpdate('restrict').onDelete('restrict'))
    .addForeignKeyConstraint('repair_create_commands_customer_fk', ['tenant_id', 'branch_id', 'customer_id'], 'customers', ['tenant_id', 'branch_id', 'customer_id'], (constraint) => constraint.onUpdate('restrict').onDelete('restrict'))
    .execute();

  await database.schema.alterTable('repair_business_audit_events').dropConstraint('repair_business_audit_events_contract_ck').execute();
  await database.schema.alterTable('repair_business_audit_events')
    .addCheckConstraint('repair_business_audit_events_contract_ck', sql`((capability = 'repairs.add_note' and action = 'repair.operational_note.added') or (capability = 'repairs.create' and action = 'repair.received')) and resource_type = 'repair' and result = 'succeeded'`)
    .execute();
}

export async function down(database: Kysely<DatabaseSchema>): Promise<void> {
  await database.schema.alterTable('repair_business_audit_events').dropConstraint('repair_business_audit_events_contract_ck').execute();
  await database.schema.alterTable('repair_business_audit_events')
    .addCheckConstraint('repair_business_audit_events_contract_ck', sql`capability = 'repairs.add_note' and action = 'repair.operational_note.added' and resource_type = 'repair' and result = 'succeeded'`)
    .execute();
  await database.schema.dropTable('repair_create_commands').execute();
  await database.schema.dropTable('repair_folio_sequences').execute();
  await database.schema.dropIndex('repairs_customer_history_idx').execute();
  await database.schema.alterTable('repairs').dropConstraint('repairs_customer_branch_fk').execute();
  await database.schema.alterTable('repairs').dropColumn('customer_id').execute();
  await sql`update repairs set customer_phone = '' where customer_phone is null`.execute(database);
  await sql`update repairs set device_brand = '' where device_brand is null`.execute(database);
  await sql`update repairs set device_model = '' where device_model is null`.execute(database);
  await database.schema.alterTable('repairs').alterColumn('customer_phone', (column) => column.setNotNull()).execute();
  await database.schema.alterTable('repairs').alterColumn('device_brand', (column) => column.setNotNull()).execute();
  await database.schema.alterTable('repairs').alterColumn('device_model', (column) => column.setNotNull()).execute();
}
