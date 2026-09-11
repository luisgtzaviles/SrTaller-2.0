import { sql, type Kysely } from 'kysely';

import type { DatabaseSchema } from '../database-types.js';

export async function up(database: Kysely<DatabaseSchema>): Promise<void> {
  await database.schema.alterTable('repair_intakes')
    .addColumn('equipment_version', 'integer', (column) => column.notNull().defaultTo(0))
    .execute();

  await database.schema.createTable('repair_equipment_corrections')
    .addColumn('correction_id', 'uuid', (column) => column.notNull())
    .addColumn('tenant_id', 'uuid', (column) => column.notNull())
    .addColumn('branch_id', 'uuid', (column) => column.notNull())
    .addColumn('repair_id', 'uuid', (column) => column.notNull())
    .addColumn('timeline_entry_id', 'uuid', (column) => column.notNull())
    .addColumn('audit_id', 'uuid', (column) => column.notNull())
    .addColumn('client_request_id', 'uuid', (column) => column.notNull())
    .addColumn('request_fingerprint', 'bytea', (column) => column.notNull())
    .addColumn('expected_version', 'integer', (column) => column.notNull())
    .addColumn('equipment_version', 'integer', (column) => column.notNull())
    .addColumn('old_brand_label', 'varchar(160)')
    .addColumn('new_brand_label', 'varchar(160)')
    .addColumn('old_canonical_brand_id', 'uuid')
    .addColumn('new_canonical_brand_id', 'uuid')
    .addColumn('old_pending_brand_value_id', 'uuid')
    .addColumn('new_pending_brand_value_id', 'uuid')
    .addColumn('old_model_label', 'varchar(160)')
    .addColumn('new_model_label', 'varchar(160)')
    .addColumn('old_canonical_model_id', 'uuid')
    .addColumn('new_canonical_model_id', 'uuid')
    .addColumn('old_pending_model_value_id', 'uuid')
    .addColumn('new_pending_model_value_id', 'uuid')
    .addColumn('reason', 'varchar(400)', (column) => column.notNull())
    .addColumn('station_id', 'uuid', (column) => column.notNull())
    .addColumn('session_id', 'uuid', (column) => column.notNull())
    .addColumn('actor_user_id', 'uuid', (column) => column.notNull())
    .addColumn('actor_display_name', 'varchar(160)', (column) => column.notNull())
    .addColumn('capability', 'varchar(80)', (column) => column.notNull())
    .addColumn('correlation_id', 'uuid', (column) => column.notNull())
    .addColumn('occurred_at', 'timestamptz', (column) => column.notNull())
    .addPrimaryKeyConstraint('repair_equipment_corrections_pk', ['correction_id'])
    .addUniqueConstraint('repair_equipment_corrections_request_uq', ['tenant_id', 'branch_id', 'repair_id', 'client_request_id'])
    .addUniqueConstraint('repair_equipment_corrections_timeline_uq', ['timeline_entry_id'])
    .addUniqueConstraint('repair_equipment_corrections_audit_uq', ['audit_id'])
    .addUniqueConstraint('repair_equipment_corrections_correlation_uq', ['correlation_id'])
    .addForeignKeyConstraint('repair_equipment_corrections_repair_fk', ['tenant_id', 'branch_id', 'repair_id'], 'repairs', ['tenant_id', 'branch_id', 'repair_id'], (constraint) => constraint.onUpdate('restrict').onDelete('restrict'))
    .addForeignKeyConstraint('repair_equipment_corrections_timeline_fk', ['timeline_entry_id'], 'repair_timeline_entries', ['entry_id'], (constraint) => constraint.onUpdate('restrict').onDelete('restrict'))
    .addForeignKeyConstraint('repair_equipment_corrections_audit_fk', ['audit_id'], 'repair_business_audit_events', ['audit_id'], (constraint) => constraint.onUpdate('restrict').onDelete('restrict'))
    .addCheckConstraint('repair_equipment_corrections_contract_ck', sql`capability = 'repairs.correct_intake' and length(btrim(reason)) between 3 and 400`)
    .addCheckConstraint('repair_equipment_corrections_version_ck', sql`expected_version >= 0 and equipment_version = expected_version + 1`)
    .execute();
  await database.schema.createIndex('repair_equipment_corrections_scope_time_idx').on('repair_equipment_corrections').columns(['tenant_id', 'branch_id', 'repair_id', 'occurred_at', 'correction_id']).execute();

  await database.schema.alterTable('repair_business_audit_events').dropConstraint('repair_business_audit_events_contract_ck').execute();
  await database.schema.alterTable('repair_business_audit_events')
    .addCheckConstraint('repair_business_audit_events_contract_ck', sql`((capability = 'repairs.add_note' and action = 'repair.operational_note.added') or (capability = 'repairs.create' and action = 'repair.received') or (capability = 'repairs.correct_intake' and action = 'repair.equipment.corrected')) and resource_type = 'repair' and result = 'succeeded'`)
    .execute();

  await sql`
    create function repairs_reject_equipment_correction_mutation()
    returns trigger language plpgsql as $function$
    begin
      raise check_violation using message = 'Repair equipment corrections are append-only.', constraint = 'repair_equipment_corrections_append_only_ck', table = 'repair_equipment_corrections';
    end; $function$
  `.execute(database);
  await sql`create trigger repair_equipment_corrections_reject_update before update on repair_equipment_corrections for each row execute function repairs_reject_equipment_correction_mutation()`.execute(database);
  await sql`create trigger repair_equipment_corrections_reject_delete before delete on repair_equipment_corrections for each row execute function repairs_reject_equipment_correction_mutation()`.execute(database);
}

export async function down(database: Kysely<DatabaseSchema>): Promise<void> {
  await sql`drop trigger if exists repair_equipment_corrections_reject_delete on repair_equipment_corrections`.execute(database);
  await sql`drop trigger if exists repair_equipment_corrections_reject_update on repair_equipment_corrections`.execute(database);
  await sql`drop function if exists repairs_reject_equipment_correction_mutation()`.execute(database);
  await database.schema.dropIndex('repair_equipment_corrections_scope_time_idx').execute();
  await database.schema.dropTable('repair_equipment_corrections').execute();
  await database.schema.alterTable('repair_business_audit_events').dropConstraint('repair_business_audit_events_contract_ck').execute();
  await database.schema.alterTable('repair_business_audit_events')
    .addCheckConstraint('repair_business_audit_events_contract_ck', sql`((capability = 'repairs.add_note' and action = 'repair.operational_note.added') or (capability = 'repairs.create' and action = 'repair.received')) and resource_type = 'repair' and result = 'succeeded'`)
    .execute();
  await database.schema.alterTable('repair_intakes').dropColumn('equipment_version').execute();
}
