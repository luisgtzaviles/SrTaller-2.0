import { sql } from 'kysely';
import type { Kysely } from 'kysely';

import type { DatabaseSchema } from '../database-types.js';

export async function up(database: Kysely<DatabaseSchema>): Promise<void> {
  await database.schema
    .createTable('preview_repairs')
    .addColumn('tenant_id', 'uuid', (column) => column.notNull())
    .addColumn('branch_id', 'uuid', (column) => column.notNull())
    .addColumn('repair_id', 'uuid', (column) => column.notNull())
    .addColumn('folio', 'varchar(32)', (column) => column.notNull())
    .addColumn('customer_name', 'varchar(120)', (column) => column.notNull())
    .addColumn('customer_phone', 'varchar(32)', (column) => column.notNull())
    .addColumn('device_brand', 'varchar(80)', (column) => column.notNull())
    .addColumn('device_model', 'varchar(80)', (column) => column.notNull())
    .addColumn('device_serial', 'varchar(120)')
    .addColumn('device_color', 'varchar(80)')
    .addColumn('reported_problem', 'varchar(1000)', (column) => column.notNull())
    .addColumn('physical_condition', 'varchar(1000)')
    .addColumn('notes', 'varchar(1000)')
    .addColumn('estimated_price', 'numeric(12, 2)')
    .addColumn('deposit_amount', 'numeric(12, 2)', (column) => column.notNull())
    .addColumn('status', 'varchar(16)', (column) => column.notNull())
    .addColumn('revision', 'integer', (column) => column.notNull())
    .addColumn('created_station_id', 'uuid', (column) => column.notNull())
    .addColumn('created_by_label', 'varchar(120)', (column) => column.notNull())
    .addColumn('created_at', 'timestamptz', (column) => column.notNull())
    .addColumn('updated_at', 'timestamptz', (column) => column.notNull())
    .addPrimaryKeyConstraint('preview_repairs_pk', [
      'tenant_id',
      'branch_id',
      'repair_id',
    ])
    .addUniqueConstraint('preview_repairs_folio_uq', [
      'tenant_id',
      'branch_id',
      'folio',
    ])
    .addForeignKeyConstraint(
      'preview_repairs_branch_fk',
      ['tenant_id', 'branch_id'],
      'branches',
      ['tenant_id', 'branch_id'],
      (constraint) => constraint.onUpdate('restrict').onDelete('restrict'),
    )
    .addForeignKeyConstraint(
      'preview_repairs_station_fk',
      ['tenant_id', 'created_station_id'],
      'stations',
      ['tenant_id', 'station_id'],
      (constraint) => constraint.onUpdate('restrict').onDelete('restrict'),
    )
    .addCheckConstraint(
      'preview_repairs_status_ck',
      sql`status in ('received', 'diagnosing', 'ready', 'delivered', 'cancelled')`,
    )
    .addCheckConstraint('preview_repairs_revision_ck', sql`revision > 0`)
    .addCheckConstraint(
      'preview_repairs_estimated_price_ck',
      sql`estimated_price is null or estimated_price >= 0`,
    )
    .addCheckConstraint('preview_repairs_deposit_ck', sql`deposit_amount >= 0`)
    .addCheckConstraint('preview_repairs_updated_ck', sql`updated_at >= created_at`)
    .execute();

  await database.schema
    .createIndex('preview_repairs_scope_created_idx')
    .on('preview_repairs')
    .columns(['tenant_id', 'branch_id', 'created_at'])
    .execute();

  await database.schema
    .createTable('preview_repair_status_history')
    .addColumn('tenant_id', 'uuid', (column) => column.notNull())
    .addColumn('branch_id', 'uuid', (column) => column.notNull())
    .addColumn('history_id', 'uuid', (column) => column.notNull())
    .addColumn('repair_id', 'uuid', (column) => column.notNull())
    .addColumn('from_status', 'varchar(16)')
    .addColumn('to_status', 'varchar(16)', (column) => column.notNull())
    .addColumn('resulting_revision', 'integer', (column) => column.notNull())
    .addColumn('station_id', 'uuid', (column) => column.notNull())
    .addColumn('actor_label', 'varchar(120)', (column) => column.notNull())
    .addColumn('changed_at', 'timestamptz', (column) => column.notNull())
    .addPrimaryKeyConstraint('preview_repair_status_history_pk', [
      'tenant_id',
      'branch_id',
      'history_id',
    ])
    .addForeignKeyConstraint(
      'preview_repair_status_history_repair_fk',
      ['tenant_id', 'branch_id', 'repair_id'],
      'preview_repairs',
      ['tenant_id', 'branch_id', 'repair_id'],
      (constraint) => constraint.onUpdate('restrict').onDelete('restrict'),
    )
    .addForeignKeyConstraint(
      'preview_repair_status_history_station_fk',
      ['tenant_id', 'station_id'],
      'stations',
      ['tenant_id', 'station_id'],
      (constraint) => constraint.onUpdate('restrict').onDelete('restrict'),
    )
    .addCheckConstraint(
      'preview_repair_status_history_from_ck',
      sql`from_status is null or from_status in ('received', 'diagnosing', 'ready', 'delivered', 'cancelled')`,
    )
    .addCheckConstraint(
      'preview_repair_status_history_to_ck',
      sql`to_status in ('received', 'diagnosing', 'ready', 'delivered', 'cancelled')`,
    )
    .addCheckConstraint(
      'preview_repair_status_history_revision_ck',
      sql`resulting_revision > 0`,
    )
    .execute();

  await database.schema
    .createIndex('preview_repair_status_history_repair_idx')
    .on('preview_repair_status_history')
    .columns(['tenant_id', 'branch_id', 'repair_id', 'changed_at'])
    .execute();
}

export async function down(database: Kysely<DatabaseSchema>): Promise<void> {
  await database.schema.dropTable('preview_repair_status_history').execute();
  await database.schema.dropTable('preview_repairs').execute();
}
