import { sql, type Kysely } from 'kysely';

import type { DatabaseSchema } from '../database-types.js';

export async function up(database: Kysely<DatabaseSchema>): Promise<void> {
  await database.schema
    .createTable('repair_locations')
    .addColumn('location_id', 'uuid', (column) => column.notNull())
    .addColumn('tenant_id', 'uuid', (column) => column.notNull())
    .addColumn('branch_id', 'uuid', (column) => column.notNull())
    .addColumn('code', 'varchar(64)', (column) => column.notNull())
    .addColumn('semantic_category', 'varchar(64)', (column) => column.notNull())
    .addColumn('display_label', 'varchar(120)', (column) => column.notNull())
    .addColumn('active', 'boolean', (column) => column.notNull())
    .addColumn('created_at', 'timestamptz', (column) => column.notNull())
    .addPrimaryKeyConstraint('repair_locations_pk', ['location_id'])
    .addUniqueConstraint('repair_locations_scope_id_uq', ['tenant_id', 'branch_id', 'location_id'])
    .addUniqueConstraint('repair_locations_scope_id_code_uq', ['tenant_id', 'branch_id', 'location_id', 'code'])
    .addForeignKeyConstraint(
      'repair_locations_branch_scope_fk',
      ['tenant_id', 'branch_id'],
      'branches',
      ['tenant_id', 'branch_id'],
      (constraint) => constraint.onUpdate('restrict').onDelete('restrict'),
    )
    .addCheckConstraint('repair_locations_code_category_ck', sql`code = semantic_category and code in ('pending_area', 'workshop')`)
    .addCheckConstraint('repair_locations_label_ck', sql`length(btrim(display_label)) > 0`)
    .execute();
  await database.schema
    .createIndex('repair_locations_scope_code_uq')
    .on('repair_locations')
    .columns(['tenant_id', 'branch_id', 'code'])
    .unique()
    .execute();

  await database.schema
    .createTable('repair_location_movements')
    .addColumn('movement_id', 'uuid', (column) => column.notNull())
    .addColumn('tenant_id', 'uuid', (column) => column.notNull())
    .addColumn('branch_id', 'uuid', (column) => column.notNull())
    .addColumn('repair_id', 'uuid', (column) => column.notNull())
    .addColumn('command', 'varchar(40)', (column) => column.notNull())
    .addColumn('from_location_id', 'uuid')
    .addColumn('to_location_id', 'uuid', (column) => column.notNull())
    .addColumn('from_code', 'varchar(64)')
    .addColumn('from_label', 'varchar(120)')
    .addColumn('to_code', 'varchar(64)', (column) => column.notNull())
    .addColumn('to_label', 'varchar(120)', (column) => column.notNull())
    .addColumn('actor_id', 'uuid', (column) => column.notNull())
    .addColumn('actor_display_name', 'varchar(120)', (column) => column.notNull())
    .addColumn('occurred_at', 'timestamptz', (column) => column.notNull())
    .addColumn('reason', 'varchar(1000)')
    .addColumn('client_request_id', 'uuid', (column) => column.notNull())
    .addColumn('expected_location_version', 'integer', (column) => column.notNull())
    .addColumn('location_version', 'integer', (column) => column.notNull())
    .addPrimaryKeyConstraint('repair_location_movements_pk', ['movement_id'])
    .addForeignKeyConstraint(
      'repair_location_movements_repair_scope_fk',
      ['tenant_id', 'branch_id', 'repair_id'],
      'repairs',
      ['tenant_id', 'branch_id', 'repair_id'],
      (constraint) => constraint.onUpdate('restrict').onDelete('restrict'),
    )
    .addForeignKeyConstraint(
      'repair_location_movements_from_scope_fk',
      ['tenant_id', 'branch_id', 'from_location_id', 'from_code'],
      'repair_locations',
      ['tenant_id', 'branch_id', 'location_id', 'code'],
      (constraint) => constraint.onUpdate('restrict').onDelete('restrict'),
    )
    .addForeignKeyConstraint(
      'repair_location_movements_to_scope_fk',
      ['tenant_id', 'branch_id', 'to_location_id', 'to_code'],
      'repair_locations',
      ['tenant_id', 'branch_id', 'location_id', 'code'],
      (constraint) => constraint.onUpdate('restrict').onDelete('restrict'),
    )
    .addCheckConstraint('repair_location_movements_command_ck', sql`command in ('initial_placement', 'move_to_workshop')`)
    .addCheckConstraint('repair_location_movements_version_ck', sql`expected_location_version >= 0 and location_version = expected_location_version + 1`)
    .addCheckConstraint('repair_location_movements_snapshot_ck', sql`length(btrim(to_label)) > 0 and to_code in ('pending_area', 'workshop') and ((from_location_id is null and from_code is null and from_label is null) or (from_location_id is not null and from_code is not null and from_label is not null and length(btrim(from_label)) > 0))`)
    .addCheckConstraint('repair_location_movements_semantics_ck', sql`(command = 'initial_placement' and from_location_id is null and to_code = 'pending_area' and expected_location_version = 0 and location_version = 1) or (command = 'move_to_workshop' and from_location_id is not null and from_code = 'pending_area' and to_code = 'workshop' and expected_location_version >= 1)`)
    .execute();
  await database.schema.createIndex('repair_location_movements_version_uq').on('repair_location_movements').columns(['tenant_id', 'branch_id', 'repair_id', 'location_version']).unique().execute();
  await database.schema.createIndex('repair_location_movements_request_uq').on('repair_location_movements').columns(['tenant_id', 'branch_id', 'repair_id', 'client_request_id']).unique().execute();
  await database.schema.createIndex('repair_location_movements_history_idx').on('repair_location_movements').columns(['tenant_id', 'branch_id', 'repair_id', 'occurred_at', 'movement_id']).execute();
}

export async function down(database: Kysely<DatabaseSchema>): Promise<void> {
  await database.schema.dropIndex('repair_location_movements_history_idx').execute();
  await database.schema.dropIndex('repair_location_movements_request_uq').execute();
  await database.schema.dropIndex('repair_location_movements_version_uq').execute();
  await database.schema.dropTable('repair_location_movements').execute();
  await database.schema.dropIndex('repair_locations_scope_code_uq').execute();
  await database.schema.dropTable('repair_locations').execute();
}
