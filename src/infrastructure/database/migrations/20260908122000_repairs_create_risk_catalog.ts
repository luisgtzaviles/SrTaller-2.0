import { sql, type Kysely } from 'kysely';

import type { DatabaseSchema } from '../database-types.js';

export async function up(database: Kysely<DatabaseSchema>): Promise<void> {
  await database.schema.createTable('repair_risks')
    .addColumn('risk_id', 'uuid', (column) => column.notNull())
    .addColumn('scope', 'varchar(16)', (column) => column.notNull())
    .addColumn('tenant_id', 'uuid')
    .addColumn('code', 'varchar(64)')
    .addColumn('canonical_label', 'varchar(160)', (column) => column.notNull())
    .addColumn('normalized_key', 'varchar(180)', (column) => column.notNull())
    .addColumn('status', 'varchar(16)', (column) => column.notNull())
    .addColumn('version', 'integer', (column) => column.notNull())
    .addColumn('created_by_actor_id', 'uuid')
    .addColumn('updated_by_actor_id', 'uuid')
    .addColumn('created_at', 'timestamptz', (column) => column.notNull())
    .addColumn('updated_at', 'timestamptz', (column) => column.notNull())
    .addPrimaryKeyConstraint('repair_risks_pk', ['risk_id'])
    .addForeignKeyConstraint('repair_risks_tenant_fk', ['tenant_id'], 'tenants', ['tenant_id'], (constraint) => constraint.onUpdate('restrict').onDelete('restrict'))
    .addCheckConstraint('repair_risks_scope_ck', sql`(scope = 'platform' and tenant_id is null and code is not null) or (scope = 'tenant' and tenant_id is not null and code is null)`)
    .addCheckConstraint('repair_risks_status_ck', sql`status in ('active', 'inactive')`)
    .addCheckConstraint('repair_risks_version_ck', sql`version >= 1`)
    .addCheckConstraint('repair_risks_label_ck', sql`length(btrim(canonical_label)) between 2 and 160 and length(btrim(normalized_key)) between 2 and 180`)
    .addCheckConstraint('repair_risks_time_ck', sql`updated_at >= created_at`)
    .execute();

  await sql`create unique index repair_risks_platform_normalized_uq on repair_risks (normalized_key) where scope = 'platform'`.execute(database);
  await sql`create unique index repair_risks_platform_code_uq on repair_risks (code) where scope = 'platform'`.execute(database);
  await sql`create unique index repair_risks_tenant_normalized_uq on repair_risks (tenant_id, normalized_key) where scope = 'tenant'`.execute(database);
  await database.schema.createIndex('repair_risks_effective_idx')
    .on('repair_risks').columns(['tenant_id', 'status', 'canonical_label', 'risk_id']).execute();

  await database.schema.createTable('repair_risk_catalog_events')
    .addColumn('event_id', 'uuid', (column) => column.notNull())
    .addColumn('tenant_id', 'uuid', (column) => column.notNull())
    .addColumn('risk_id', 'uuid', (column) => column.notNull())
    .addColumn('station_id', 'uuid', (column) => column.notNull())
    .addColumn('session_id', 'uuid', (column) => column.notNull())
    .addColumn('actor_user_id', 'uuid', (column) => column.notNull())
    .addColumn('actor_display_name', 'varchar(160)', (column) => column.notNull())
    .addColumn('capability', 'varchar(80)', (column) => column.notNull())
    .addColumn('action', 'varchar(64)', (column) => column.notNull())
    .addColumn('old_version', 'integer')
    .addColumn('new_version', 'integer', (column) => column.notNull())
    .addColumn('old_label', 'varchar(160)')
    .addColumn('new_label', 'varchar(160)', (column) => column.notNull())
    .addColumn('old_status', 'varchar(16)')
    .addColumn('new_status', 'varchar(16)', (column) => column.notNull())
    .addColumn('result', 'varchar(16)', (column) => column.notNull())
    .addColumn('correlation_id', 'uuid', (column) => column.notNull())
    .addColumn('occurred_at', 'timestamptz', (column) => column.notNull())
    .addPrimaryKeyConstraint('repair_risk_catalog_events_pk', ['event_id'])
    .addUniqueConstraint('repair_risk_catalog_events_correlation_uq', ['correlation_id'])
    .addForeignKeyConstraint('repair_risk_catalog_events_tenant_fk', ['tenant_id'], 'tenants', ['tenant_id'], (constraint) => constraint.onUpdate('restrict').onDelete('restrict'))
    .addForeignKeyConstraint('repair_risk_catalog_events_risk_fk', ['risk_id'], 'repair_risks', ['risk_id'], (constraint) => constraint.onUpdate('restrict').onDelete('restrict'))
    .addCheckConstraint('repair_risk_catalog_events_contract_ck', sql`capability = 'repairs.catalogs.manage' and action in ('repair_risk.created', 'repair_risk.renamed', 'repair_risk.deactivated', 'repair_risk.reactivated') and result = 'succeeded'`)
    .addCheckConstraint('repair_risk_catalog_events_version_ck', sql`new_version >= 1 and ((old_version is null and action = 'repair_risk.created' and new_version = 1) or (old_version is not null and new_version = old_version + 1))`)
    .addCheckConstraint('repair_risk_catalog_events_status_ck', sql`new_status in ('active', 'inactive') and (old_status is null or old_status in ('active', 'inactive'))`)
    .execute();

  await database.schema.createIndex('repair_risk_catalog_events_scope_time_idx')
    .on('repair_risk_catalog_events').columns(['tenant_id', 'risk_id', 'occurred_at', 'event_id']).execute();

  await sql`
    create function repairs_reject_risk_catalog_event_mutation()
    returns trigger
    language plpgsql
    as $function$
    begin
      raise check_violation using
        message = 'Repair risk catalog events are append-only.',
        constraint = 'repair_risk_catalog_events_append_only_ck',
        table = 'repair_risk_catalog_events';
    end;
    $function$
  `.execute(database);
  await sql`create trigger repair_risk_catalog_events_reject_update before update on repair_risk_catalog_events for each row execute function repairs_reject_risk_catalog_event_mutation()`.execute(database);
  await sql`create trigger repair_risk_catalog_events_reject_delete before delete on repair_risk_catalog_events for each row execute function repairs_reject_risk_catalog_event_mutation()`.execute(database);

  await database.schema.createTable('repair_intervention_risks')
    .addColumn('repair_id', 'uuid', (column) => column.notNull())
    .addColumn('risk_id', 'uuid', (column) => column.notNull())
    .addColumn('risk_label_snapshot', 'varchar(160)', (column) => column.notNull())
    .addColumn('selection_order', 'smallint', (column) => column.notNull())
    .addColumn('recorded_by_actor_id', 'uuid', (column) => column.notNull())
    .addColumn('recorded_at', 'timestamptz', (column) => column.notNull())
    .addPrimaryKeyConstraint('repair_intervention_risks_pk', ['repair_id', 'risk_id'])
    .addUniqueConstraint('repair_intervention_risks_order_uq', ['repair_id', 'selection_order'])
    .addForeignKeyConstraint('repair_intervention_risks_repair_fk', ['repair_id'], 'repairs', ['repair_id'], (constraint) => constraint.onUpdate('restrict').onDelete('restrict'))
    .addForeignKeyConstraint('repair_intervention_risks_risk_fk', ['risk_id'], 'repair_risks', ['risk_id'], (constraint) => constraint.onUpdate('restrict').onDelete('restrict'))
    .addCheckConstraint('repair_intervention_risks_label_ck', sql`length(btrim(risk_label_snapshot)) between 2 and 160`)
    .addCheckConstraint('repair_intervention_risks_order_ck', sql`selection_order between 1 and 64`)
    .execute();
  await database.schema.createIndex('repair_intervention_risks_usage_idx')
    .on('repair_intervention_risks').columns(['risk_id', 'repair_id']).execute();
}

export async function down(database: Kysely<DatabaseSchema>): Promise<void> {
  await database.schema.dropIndex('repair_intervention_risks_usage_idx').execute();
  await database.schema.dropTable('repair_intervention_risks').execute();
  await sql`drop trigger if exists repair_risk_catalog_events_reject_delete on repair_risk_catalog_events`.execute(database);
  await sql`drop trigger if exists repair_risk_catalog_events_reject_update on repair_risk_catalog_events`.execute(database);
  await sql`drop function if exists repairs_reject_risk_catalog_event_mutation()`.execute(database);
  await database.schema.dropTable('repair_risk_catalog_events').execute();
  await database.schema.dropTable('repair_risks').execute();
}
