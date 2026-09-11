import { sql, type Kysely } from 'kysely';

import type { DatabaseSchema } from '../database-types.js';

export async function up(database: Kysely<DatabaseSchema>): Promise<void> {
  await database.schema.createTable('repair_problem_pending_values')
    .addColumn('pending_problem_value_id', 'uuid', (column) => column.notNull())
    .addColumn('tenant_id', 'uuid', (column) => column.notNull())
    .addColumn('raw_label_example', 'varchar(160)', (column) => column.notNull())
    .addColumn('normalized_key', 'varchar(180)', (column) => column.notNull())
    .addColumn('resolution_status', 'varchar(16)', (column) => column.notNull())
    .addColumn('canonical_category_id', 'uuid')
    .addColumn('version', 'integer', (column) => column.notNull())
    .addColumn('first_seen_at', 'timestamptz', (column) => column.notNull())
    .addColumn('last_seen_at', 'timestamptz', (column) => column.notNull())
    .addColumn('resolved_by_actor_id', 'uuid')
    .addColumn('resolved_at', 'timestamptz')
    .addPrimaryKeyConstraint('repair_problem_pending_values_pk', ['pending_problem_value_id'])
    .addUniqueConstraint('repair_problem_pending_values_tenant_key_uq', ['tenant_id', 'normalized_key'])
    .addUniqueConstraint('repair_problem_pending_values_id_tenant_uq', ['pending_problem_value_id', 'tenant_id'])
    .addForeignKeyConstraint('repair_problem_pending_values_tenant_fk', ['tenant_id'], 'tenants', ['tenant_id'], (constraint) => constraint.onUpdate('restrict').onDelete('restrict'))
    .addForeignKeyConstraint('repair_problem_pending_values_category_fk', ['canonical_category_id'], 'repair_problem_categories', ['category_id'], (constraint) => constraint.onUpdate('restrict').onDelete('restrict'))
    .addCheckConstraint('repair_problem_pending_values_label_ck', sql`length(btrim(raw_label_example)) between 2 and 160 and length(btrim(normalized_key)) between 2 and 180`)
    .addCheckConstraint('repair_problem_pending_values_version_ck', sql`version >= 1`)
    .addCheckConstraint('repair_problem_pending_values_time_ck', sql`last_seen_at >= first_seen_at`)
    .addCheckConstraint('repair_problem_pending_values_resolution_ck', sql`(resolution_status = 'pending' and canonical_category_id is null and resolved_by_actor_id is null and resolved_at is null) or (resolution_status = 'resolved' and canonical_category_id is not null and resolved_by_actor_id is not null and resolved_at is not null)`)
    .execute();
  await database.schema.createIndex('repair_problem_pending_values_status_idx').on('repair_problem_pending_values').columns(['tenant_id', 'resolution_status', 'last_seen_at']).execute();

  await sql`alter table repair_problem_classifications add column tenant_id uuid, add column branch_id uuid, add column problem_capture_id uuid, add column pending_problem_value_id uuid, add column raw_problem_label_snapshot varchar(160), add column normalized_problem_key varchar(180), add column selection_order integer`.execute(database);
  await sql`update repair_problem_classifications rpc set tenant_id = r.tenant_id, branch_id = r.branch_id, problem_capture_id = md5(rpc.repair_id::text || ':' || rpc.category_id::text)::uuid, raw_problem_label_snapshot = rpc.category_label_snapshot, normalized_problem_key = c.normalized_key, selection_order = ranked.position from repairs r, repair_problem_categories c, (select repair_id, category_id, row_number() over (partition by repair_id order by assigned_at, category_id)::integer as position from repair_problem_classifications) ranked where r.repair_id = rpc.repair_id and c.category_id = rpc.category_id and ranked.repair_id = rpc.repair_id and ranked.category_id = rpc.category_id`.execute(database);
  await sql`alter table repair_problem_classifications drop constraint repair_problem_classifications_contract_ck, drop constraint repair_problem_classifications_pk, alter column category_id drop not null, alter column category_label_snapshot drop not null, alter column tenant_id set not null, alter column branch_id set not null, alter column problem_capture_id set not null, alter column raw_problem_label_snapshot set not null, alter column normalized_problem_key set not null, alter column selection_order set not null`.execute(database);
  await sql`alter table repair_problem_classifications add constraint repair_problem_classifications_pk primary key (problem_capture_id), add constraint repair_problem_classifications_contract_ck check (source = 'manual' and stage in ('intake', 'post_intake') and length(btrim(raw_problem_label_snapshot)) between 2 and 160 and length(btrim(normalized_problem_key)) between 2 and 180 and selection_order >= 1 and (category_id is not null or pending_problem_value_id is not null) and (category_id is null or category_label_snapshot is not null))`.execute(database);
  await database.schema.alterTable('repair_problem_classifications').addForeignKeyConstraint('repair_problem_classifications_scope_fk', ['tenant_id', 'branch_id', 'repair_id'], 'repairs', ['tenant_id', 'branch_id', 'repair_id'], (constraint) => constraint.onUpdate('restrict').onDelete('restrict')).execute();
  await database.schema.alterTable('repair_problem_classifications').addForeignKeyConstraint('repair_problem_classifications_pending_fk', ['pending_problem_value_id', 'tenant_id'], 'repair_problem_pending_values', ['pending_problem_value_id', 'tenant_id'], (constraint) => constraint.onUpdate('restrict').onDelete('restrict')).execute();
  await database.schema.createIndex('repair_problem_classifications_repair_order_idx').on('repair_problem_classifications').columns(['tenant_id', 'branch_id', 'repair_id', 'selection_order']).unique().execute();
  await database.schema.createIndex('repair_problem_classifications_repair_normalized_idx').on('repair_problem_classifications').columns(['tenant_id', 'branch_id', 'repair_id', 'normalized_problem_key']).unique().execute();
  await database.schema.createIndex('repair_problem_classifications_pending_usage_idx').on('repair_problem_classifications').columns(['pending_problem_value_id', 'repair_id']).execute();

  await sql`alter table repair_problem_category_catalog_events add column pending_problem_value_id uuid`.execute(database);
  await sql`alter table repair_problem_category_catalog_events drop constraint repair_problem_category_catalog_events_contract_ck, drop constraint repair_problem_category_catalog_events_version_ck, drop constraint repair_problem_category_catalog_events_status_ck`.execute(database);
  await database.schema.alterTable('repair_problem_category_catalog_events').addForeignKeyConstraint('repair_problem_category_catalog_events_pending_fk', ['pending_problem_value_id', 'tenant_id'], 'repair_problem_pending_values', ['pending_problem_value_id', 'tenant_id'], (constraint) => constraint.onUpdate('restrict').onDelete('restrict')).execute();
  await sql`alter table repair_problem_category_catalog_events add constraint repair_problem_category_catalog_events_contract_ck check (capability = 'repairs.catalogs.manage' and action in ('repair_problem_category.created', 'repair_problem_category.renamed', 'repair_problem_category.deactivated', 'repair_problem_category.reactivated', 'repair_problem_pending.resolved', 'repair_problem_pending.canonical_created') and result = 'succeeded'), add constraint repair_problem_category_catalog_events_version_ck check (new_version >= 1 and ((old_version is null and action = 'repair_problem_category.created' and new_version = 1) or (old_version is not null and new_version = old_version + 1))), add constraint repair_problem_category_catalog_events_status_ck check ((action like 'repair_problem_category.%' and new_status in ('active', 'inactive') and (old_status is null or old_status in ('active', 'inactive'))) or (action like 'repair_problem_pending.%' and old_status = 'pending' and new_status = 'resolved'))`.execute(database);
}

export async function down(database: Kysely<DatabaseSchema>): Promise<void> {
  await sql`delete from repair_problem_classifications where stage = 'intake' or category_id is null`.execute(database);
  await database.schema.dropIndex('repair_problem_classifications_pending_usage_idx').execute();
  await database.schema.dropIndex('repair_problem_classifications_repair_normalized_idx').execute();
  await database.schema.dropIndex('repair_problem_classifications_repair_order_idx').execute();
  await sql`alter table repair_problem_category_catalog_events disable trigger repair_problem_category_catalog_events_reject_delete`.execute(database);
  await sql`delete from repair_problem_category_catalog_events where pending_problem_value_id is not null`.execute(database);
  await sql`alter table repair_problem_category_catalog_events enable trigger repair_problem_category_catalog_events_reject_delete`.execute(database);
  await sql`alter table repair_problem_category_catalog_events drop constraint repair_problem_category_catalog_events_pending_fk, drop constraint repair_problem_category_catalog_events_contract_ck, drop constraint repair_problem_category_catalog_events_version_ck, drop constraint repair_problem_category_catalog_events_status_ck, drop column pending_problem_value_id`.execute(database);
  await sql`alter table repair_problem_category_catalog_events add constraint repair_problem_category_catalog_events_contract_ck check (capability = 'repairs.catalogs.manage' and action in ('repair_problem_category.created', 'repair_problem_category.renamed', 'repair_problem_category.deactivated', 'repair_problem_category.reactivated') and result = 'succeeded'), add constraint repair_problem_category_catalog_events_version_ck check (new_version >= 1 and ((old_version is null and action = 'repair_problem_category.created' and new_version = 1) or (old_version is not null and new_version = old_version + 1))), add constraint repair_problem_category_catalog_events_status_ck check (new_status in ('active', 'inactive') and (old_status is null or old_status in ('active', 'inactive')))`.execute(database);
  await sql`alter table repair_problem_classifications drop constraint repair_problem_classifications_scope_fk, drop constraint repair_problem_classifications_pending_fk, drop constraint repair_problem_classifications_contract_ck, drop constraint repair_problem_classifications_pk, alter column category_id set not null, alter column category_label_snapshot set not null, add constraint repair_problem_classifications_pk primary key (repair_id, category_id), add constraint repair_problem_classifications_contract_ck check (source = 'manual' and stage = 'post_intake' and length(btrim(category_label_snapshot)) between 2 and 160), drop column selection_order, drop column normalized_problem_key, drop column raw_problem_label_snapshot, drop column pending_problem_value_id, drop column problem_capture_id, drop column branch_id, drop column tenant_id`.execute(database);
  await database.schema.dropIndex('repair_problem_pending_values_status_idx').execute();
  await database.schema.dropTable('repair_problem_pending_values').execute();
}
