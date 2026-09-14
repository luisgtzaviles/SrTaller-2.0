import { sql, type Kysely } from 'kysely';

import type { DatabaseSchema } from '../database-types.js';

export async function up(database: Kysely<DatabaseSchema>): Promise<void> {
  // Catalog history describes the deleted identity by UUID and snapshot. It must
  // outlive an unused canonical row, so these are deliberately no longer FKs.
  await database.schema.alterTable('repair_risk_catalog_events').dropConstraint('repair_risk_catalog_events_risk_fk').execute();
  await database.schema.alterTable('repair_device_type_catalog_events').dropConstraint('repair_device_type_events_type_fk').execute();
  await database.schema.alterTable('repair_brand_catalog_events').dropConstraint('repair_brand_catalog_events_brand_fk').execute();
  await database.schema.alterTable('repair_model_catalog_events').dropConstraint('repair_model_catalog_events_model_fk').execute();
  await database.schema.alterTable('repair_model_catalog_events').dropConstraint('repair_model_catalog_events_brand_fk').execute();

  await database.schema.createTable('repair_catalog_reference_deletion_events')
    .addColumn('event_id', 'uuid', (column) => column.notNull())
    .addColumn('tenant_id', 'uuid', (column) => column.notNull())
    .addColumn('reference_kind', 'varchar(40)', (column) => column.notNull())
    .addColumn('reference_id', 'uuid', (column) => column.notNull())
    .addColumn('catalog_scope', 'varchar(16)', (column) => column.notNull())
    .addColumn('previous_label', 'varchar(160)')
    .addColumn('previous_status', 'varchar(16)')
    .addColumn('previous_record', 'jsonb')
    .addColumn('reference_version', 'integer')
    .addColumn('expected_version', 'integer', (column) => column.notNull())
    .addColumn('station_id', 'uuid', (column) => column.notNull())
    .addColumn('session_id', 'uuid', (column) => column.notNull())
    .addColumn('actor_user_id', 'uuid', (column) => column.notNull())
    .addColumn('actor_display_name', 'varchar(160)', (column) => column.notNull())
    .addColumn('capability', 'varchar(160)', (column) => column.notNull())
    .addColumn('result', 'varchar(16)', (column) => column.notNull())
    .addColumn('rejection_reason', 'varchar(40)')
    .addColumn('correlation_id', 'uuid', (column) => column.notNull())
    .addColumn('occurred_at', 'timestamptz', (column) => column.notNull())
    .addPrimaryKeyConstraint('repair_catalog_reference_deletion_events_pk', ['event_id'])
    .addUniqueConstraint('repair_catalog_reference_deletion_events_correlation_uq', ['correlation_id'])
    .addForeignKeyConstraint('repair_catalog_reference_deletion_events_tenant_fk', ['tenant_id'], 'tenants', ['tenant_id'], (constraint) => constraint.onUpdate('restrict').onDelete('restrict'))
    .addCheckConstraint('repair_catalog_reference_deletion_events_kind_ck', sql`reference_kind in ('RISK', 'DEVICE_TYPE', 'BRAND', 'MODEL')`)
    .addCheckConstraint('repair_catalog_reference_deletion_events_scope_ck', sql`catalog_scope in ('platform', 'tenant')`)
    .addCheckConstraint('repair_catalog_reference_deletion_events_capability_ck', sql`capability = 'repairs.catalogs.manage'`)
    .addCheckConstraint('repair_catalog_reference_deletion_events_result_ck', sql`(result = 'succeeded' and rejection_reason is null and previous_label is not null and previous_record is not null and reference_version = expected_version) or (result = 'rejected' and rejection_reason in ('not_found', 'platform_owned', 'version_conflict', 'reference_in_use', 'authorization_changed'))`)
    .addCheckConstraint('repair_catalog_reference_deletion_events_version_ck', sql`expected_version >= 1 and (reference_version is null or reference_version >= 1)`)
    .execute();
  await database.schema.createIndex('repair_catalog_reference_deletion_events_scope_idx').on('repair_catalog_reference_deletion_events').columns(['tenant_id', 'reference_kind', 'reference_id', 'occurred_at']).execute();
  await sql`create function reject_repair_catalog_reference_deletion_event_mutation() returns trigger language plpgsql as $function$ begin raise check_violation using message = 'Repair catalog reference deletion events are append-only.', constraint = 'repair_catalog_reference_deletion_events_append_only_ck', table = 'repair_catalog_reference_deletion_events'; end; $function$`.execute(database);
  await sql`create trigger repair_catalog_reference_deletion_events_reject_update before update on repair_catalog_reference_deletion_events for each row execute function reject_repair_catalog_reference_deletion_event_mutation()`.execute(database);
  await sql`create trigger repair_catalog_reference_deletion_events_reject_delete before delete on repair_catalog_reference_deletion_events for each row execute function reject_repair_catalog_reference_deletion_event_mutation()`.execute(database);

}

export async function down(database: Kysely<DatabaseSchema>): Promise<void> {
  // Restore successfully deleted Repairs canonicals from their complete row
  // snapshots before restoring the former event FKs. Rollback therefore never
  // deletes append-only catalog history merely to make a constraint fit.
  await sql`insert into repair_risks (risk_id, scope, tenant_id, code, canonical_label, normalized_key, status, version, created_by_actor_id, updated_by_actor_id, created_at, updated_at)
    select (previous_record->>'risk_id')::uuid, previous_record->>'scope', nullif(previous_record->>'tenant_id', '')::uuid,
      nullif(previous_record->>'code', ''), previous_record->>'canonical_label', previous_record->>'normalized_key', previous_record->>'status',
      (previous_record->>'version')::integer, nullif(previous_record->>'created_by_actor_id', '')::uuid, nullif(previous_record->>'updated_by_actor_id', '')::uuid,
      (previous_record->>'created_at')::timestamptz, (previous_record->>'updated_at')::timestamptz
    from repair_catalog_reference_deletion_events where result = 'succeeded' and reference_kind = 'RISK'
    on conflict do nothing`.execute(database);
  await sql`insert into repair_device_types (device_type_id, scope, tenant_id, code, canonical_label, normalized_key, status, version, created_by_actor_id, updated_by_actor_id, created_at, updated_at)
    select (previous_record->>'device_type_id')::uuid, previous_record->>'scope', nullif(previous_record->>'tenant_id', '')::uuid,
      nullif(previous_record->>'code', ''), previous_record->>'canonical_label', previous_record->>'normalized_key', previous_record->>'status',
      (previous_record->>'version')::integer, nullif(previous_record->>'created_by_actor_id', '')::uuid, nullif(previous_record->>'updated_by_actor_id', '')::uuid,
      (previous_record->>'created_at')::timestamptz, (previous_record->>'updated_at')::timestamptz
    from repair_catalog_reference_deletion_events where result = 'succeeded' and reference_kind = 'DEVICE_TYPE'
    on conflict do nothing`.execute(database);
  await sql`insert into repair_brands (brand_id, scope, tenant_id, code, canonical_label, normalized_key, status, version, created_by_actor_id, updated_by_actor_id, created_at, updated_at)
    select (previous_record->>'brand_id')::uuid, previous_record->>'scope', nullif(previous_record->>'tenant_id', '')::uuid,
      nullif(previous_record->>'code', ''), previous_record->>'canonical_label', previous_record->>'normalized_key', previous_record->>'status',
      (previous_record->>'version')::integer, nullif(previous_record->>'created_by_actor_id', '')::uuid, nullif(previous_record->>'updated_by_actor_id', '')::uuid,
      (previous_record->>'created_at')::timestamptz, (previous_record->>'updated_at')::timestamptz
    from repair_catalog_reference_deletion_events where result = 'succeeded' and reference_kind = 'BRAND'
    on conflict do nothing`.execute(database);
  await sql`insert into repair_models (model_id, canonical_brand_id, scope, tenant_id, code, canonical_label, normalized_key, status, version, created_by_actor_id, updated_by_actor_id, created_at, updated_at)
    select (previous_record->>'model_id')::uuid, (previous_record->>'canonical_brand_id')::uuid, previous_record->>'scope', nullif(previous_record->>'tenant_id', '')::uuid,
      nullif(previous_record->>'code', ''), previous_record->>'canonical_label', previous_record->>'normalized_key', previous_record->>'status',
      (previous_record->>'version')::integer, nullif(previous_record->>'created_by_actor_id', '')::uuid, nullif(previous_record->>'updated_by_actor_id', '')::uuid,
      (previous_record->>'created_at')::timestamptz, (previous_record->>'updated_at')::timestamptz
    from repair_catalog_reference_deletion_events where result = 'succeeded' and reference_kind = 'MODEL'
    on conflict do nothing`.execute(database);
  await sql`drop trigger if exists repair_catalog_reference_deletion_events_reject_delete on repair_catalog_reference_deletion_events`.execute(database);
  await sql`drop trigger if exists repair_catalog_reference_deletion_events_reject_update on repair_catalog_reference_deletion_events`.execute(database);
  await sql`drop function if exists reject_repair_catalog_reference_deletion_event_mutation()`.execute(database);
  await database.schema.dropTable('repair_catalog_reference_deletion_events').execute();
  await database.schema.alterTable('repair_model_catalog_events').addForeignKeyConstraint('repair_model_catalog_events_brand_fk', ['canonical_brand_id'], 'repair_brands', ['brand_id'], (constraint) => constraint.onUpdate('restrict').onDelete('restrict')).execute();
  await database.schema.alterTable('repair_model_catalog_events').addForeignKeyConstraint('repair_model_catalog_events_model_fk', ['model_id'], 'repair_models', ['model_id'], (constraint) => constraint.onUpdate('restrict').onDelete('restrict')).execute();
  await database.schema.alterTable('repair_brand_catalog_events').addForeignKeyConstraint('repair_brand_catalog_events_brand_fk', ['brand_id'], 'repair_brands', ['brand_id'], (constraint) => constraint.onUpdate('restrict').onDelete('restrict')).execute();
  await database.schema.alterTable('repair_device_type_catalog_events').addForeignKeyConstraint('repair_device_type_events_type_fk', ['device_type_id'], 'repair_device_types', ['device_type_id'], (constraint) => constraint.onUpdate('restrict').onDelete('restrict')).execute();
  await database.schema.alterTable('repair_risk_catalog_events').addForeignKeyConstraint('repair_risk_catalog_events_risk_fk', ['risk_id'], 'repair_risks', ['risk_id'], (constraint) => constraint.onUpdate('restrict').onDelete('restrict')).execute();
}
