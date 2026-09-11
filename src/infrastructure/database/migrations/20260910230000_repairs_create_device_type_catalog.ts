import { sql, type Kysely } from 'kysely';
import type { DatabaseSchema } from '../database-types.js';

export async function up(database: Kysely<DatabaseSchema>): Promise<void> {
  await database.schema.createTable('repair_device_types')
    .addColumn('device_type_id', 'uuid', (column) => column.notNull()).addColumn('scope', 'varchar(16)', (column) => column.notNull()).addColumn('tenant_id', 'uuid').addColumn('code', 'varchar(64)')
    .addColumn('canonical_label', 'varchar(160)', (column) => column.notNull()).addColumn('normalized_key', 'varchar(180)', (column) => column.notNull()).addColumn('status', 'varchar(16)', (column) => column.notNull()).addColumn('version', 'integer', (column) => column.notNull())
    .addColumn('created_by_actor_id', 'uuid').addColumn('updated_by_actor_id', 'uuid').addColumn('created_at', 'timestamptz', (column) => column.notNull()).addColumn('updated_at', 'timestamptz', (column) => column.notNull())
    .addPrimaryKeyConstraint('repair_device_types_pk', ['device_type_id']).addForeignKeyConstraint('repair_device_types_tenant_fk', ['tenant_id'], 'tenants', ['tenant_id'], (constraint) => constraint.onUpdate('restrict').onDelete('restrict'))
    .addCheckConstraint('repair_device_types_scope_ck', sql`(scope = 'platform' and tenant_id is null and code is not null) or (scope = 'tenant' and tenant_id is not null and code is null)`)
    .addCheckConstraint('repair_device_types_status_ck', sql`status in ('active', 'inactive')`).addCheckConstraint('repair_device_types_version_ck', sql`version >= 1`).addCheckConstraint('repair_device_types_label_ck', sql`length(btrim(canonical_label)) between 2 and 160 and length(btrim(normalized_key)) between 2 and 180`).addCheckConstraint('repair_device_types_time_ck', sql`updated_at >= created_at`).execute();
  await sql`create unique index repair_device_types_platform_normalized_uq on repair_device_types (normalized_key) where scope = 'platform'`.execute(database);
  await sql`create unique index repair_device_types_platform_code_uq on repair_device_types (code) where scope = 'platform'`.execute(database);
  await sql`create unique index repair_device_types_tenant_normalized_uq on repair_device_types (tenant_id, normalized_key) where scope = 'tenant'`.execute(database);
  await database.schema.createIndex('repair_device_types_effective_idx').on('repair_device_types').columns(['tenant_id', 'status', 'canonical_label', 'device_type_id']).execute();

  await database.schema.createTable('repair_device_type_pending_values')
    .addColumn('pending_device_type_value_id', 'uuid', (column) => column.notNull()).addColumn('tenant_id', 'uuid', (column) => column.notNull()).addColumn('raw_label_example', 'varchar(160)', (column) => column.notNull()).addColumn('normalized_key', 'varchar(180)', (column) => column.notNull())
    .addColumn('resolution_status', 'varchar(16)', (column) => column.notNull()).addColumn('canonical_device_type_id', 'uuid').addColumn('version', 'integer', (column) => column.notNull()).addColumn('first_seen_at', 'timestamptz', (column) => column.notNull()).addColumn('last_seen_at', 'timestamptz', (column) => column.notNull()).addColumn('resolved_by_actor_id', 'uuid').addColumn('resolved_at', 'timestamptz')
    .addPrimaryKeyConstraint('repair_device_type_pending_values_pk', ['pending_device_type_value_id']).addUniqueConstraint('repair_device_type_pending_values_tenant_normalized_uq', ['tenant_id', 'normalized_key'])
    .addForeignKeyConstraint('repair_device_type_pending_values_tenant_fk', ['tenant_id'], 'tenants', ['tenant_id'], (constraint) => constraint.onUpdate('restrict').onDelete('restrict')).addForeignKeyConstraint('repair_device_type_pending_values_type_fk', ['canonical_device_type_id'], 'repair_device_types', ['device_type_id'], (constraint) => constraint.onUpdate('restrict').onDelete('restrict'))
    .addCheckConstraint('repair_device_type_pending_values_status_ck', sql`resolution_status in ('pending', 'resolved')`).addCheckConstraint('repair_device_type_pending_values_version_ck', sql`version >= 1`).addCheckConstraint('repair_device_type_pending_values_resolution_ck', sql`(resolution_status = 'pending' and canonical_device_type_id is null and resolved_by_actor_id is null and resolved_at is null) or (resolution_status = 'resolved' and canonical_device_type_id is not null and resolved_by_actor_id is not null and resolved_at is not null)`).execute();
  await database.schema.createIndex('repair_device_type_pending_queue_idx').on('repair_device_type_pending_values').columns(['tenant_id', 'resolution_status', 'last_seen_at', 'pending_device_type_value_id']).execute();

  await database.schema.createTable('repair_device_type_catalog_events')
    .addColumn('event_id', 'uuid', (column) => column.notNull()).addColumn('tenant_id', 'uuid', (column) => column.notNull()).addColumn('device_type_id', 'uuid').addColumn('pending_device_type_value_id', 'uuid')
    .addColumn('station_id', 'uuid', (column) => column.notNull()).addColumn('session_id', 'uuid', (column) => column.notNull()).addColumn('actor_user_id', 'uuid', (column) => column.notNull()).addColumn('actor_display_name', 'varchar(160)', (column) => column.notNull()).addColumn('capability', 'varchar(80)', (column) => column.notNull()).addColumn('action', 'varchar(80)', (column) => column.notNull())
    .addColumn('old_version', 'integer').addColumn('new_version', 'integer', (column) => column.notNull()).addColumn('old_label', 'varchar(160)').addColumn('new_label', 'varchar(160)', (column) => column.notNull()).addColumn('old_status', 'varchar(16)').addColumn('new_status', 'varchar(16)', (column) => column.notNull()).addColumn('old_canonical_device_type_id', 'uuid').addColumn('new_canonical_device_type_id', 'uuid')
    .addColumn('result', 'varchar(16)', (column) => column.notNull()).addColumn('correlation_id', 'uuid', (column) => column.notNull()).addColumn('occurred_at', 'timestamptz', (column) => column.notNull())
    .addPrimaryKeyConstraint('repair_device_type_catalog_events_pk', ['event_id']).addUniqueConstraint('repair_device_type_catalog_events_correlation_uq', ['correlation_id'])
    .addForeignKeyConstraint('repair_device_type_events_tenant_fk', ['tenant_id'], 'tenants', ['tenant_id'], (constraint) => constraint.onUpdate('restrict').onDelete('restrict')).addForeignKeyConstraint('repair_device_type_events_type_fk', ['device_type_id'], 'repair_device_types', ['device_type_id'], (constraint) => constraint.onUpdate('restrict').onDelete('restrict')).addForeignKeyConstraint('repair_device_type_events_pending_fk', ['pending_device_type_value_id'], 'repair_device_type_pending_values', ['pending_device_type_value_id'], (constraint) => constraint.onUpdate('restrict').onDelete('restrict'))
    .addCheckConstraint('repair_device_type_catalog_events_contract_ck', sql`capability = 'repairs.catalogs.manage' and action in ('repair_device_type.created', 'repair_device_type.renamed', 'repair_device_type.deactivated', 'repair_device_type.reactivated', 'repair_device_type_pending.resolved', 'repair_device_type_pending.canonical_created') and result = 'succeeded'`)
    .addCheckConstraint('repair_device_type_catalog_events_identity_ck', sql`device_type_id is not null or pending_device_type_value_id is not null`)
    .addCheckConstraint('repair_device_type_catalog_events_version_ck', sql`new_version >= 1 and (old_version is null or new_version = old_version + 1)`)
    .execute();

  await database.schema.alterTable('repair_intakes').addColumn('canonical_device_type_id', 'uuid').addColumn('pending_device_type_value_id', 'uuid').execute();
  await database.schema.alterTable('repair_intakes').addForeignKeyConstraint('repair_intakes_device_type_fk', ['canonical_device_type_id'], 'repair_device_types', ['device_type_id'], (constraint) => constraint.onUpdate('restrict').onDelete('restrict')).execute();
  await database.schema.alterTable('repair_intakes').addForeignKeyConstraint('repair_intakes_pending_device_type_fk', ['pending_device_type_value_id'], 'repair_device_type_pending_values', ['pending_device_type_value_id'], (constraint) => constraint.onUpdate('restrict').onDelete('restrict')).execute();
  await database.schema.createIndex('repair_intakes_canonical_device_type_idx').on('repair_intakes').columns(['tenant_id', 'canonical_device_type_id', 'repair_id']).execute();
  await database.schema.createIndex('repair_intakes_pending_device_type_idx').on('repair_intakes').columns(['tenant_id', 'pending_device_type_value_id', 'repair_id']).execute();

  await sql`create function repairs_reject_device_type_catalog_event_mutation() returns trigger language plpgsql as $$ begin raise check_violation using message = 'Repair Device Type catalog events are append-only.', constraint = 'repair_device_type_catalog_events_append_only_ck', table = 'repair_device_type_catalog_events'; end $$`.execute(database);
  await sql`create trigger repair_device_type_catalog_events_reject_update before update on repair_device_type_catalog_events for each row execute function repairs_reject_device_type_catalog_event_mutation()`.execute(database);
  await sql`create trigger repair_device_type_catalog_events_reject_delete before delete on repair_device_type_catalog_events for each row execute function repairs_reject_device_type_catalog_event_mutation()`.execute(database);
}

export async function down(database: Kysely<DatabaseSchema>): Promise<void> {
  await database.schema.dropIndex('repair_intakes_pending_device_type_idx').execute();
  await database.schema.dropIndex('repair_intakes_canonical_device_type_idx').execute();
  await database.schema.alterTable('repair_intakes').dropConstraint('repair_intakes_pending_device_type_fk').execute();
  await database.schema.alterTable('repair_intakes').dropConstraint('repair_intakes_device_type_fk').execute();
  await database.schema.alterTable('repair_intakes').dropColumn('pending_device_type_value_id').dropColumn('canonical_device_type_id').execute();
  await sql`drop trigger if exists repair_device_type_catalog_events_reject_delete on repair_device_type_catalog_events`.execute(database);
  await sql`drop trigger if exists repair_device_type_catalog_events_reject_update on repair_device_type_catalog_events`.execute(database);
  await sql`drop function if exists repairs_reject_device_type_catalog_event_mutation()`.execute(database);
  await database.schema.dropTable('repair_device_type_catalog_events').execute();
  await database.schema.dropTable('repair_device_type_pending_values').execute();
  await database.schema.dropTable('repair_device_types').execute();
}
