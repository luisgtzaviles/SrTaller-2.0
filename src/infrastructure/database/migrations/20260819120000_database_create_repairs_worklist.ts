import { sql, type Kysely } from 'kysely';

import type { DatabaseSchema } from '../database-types.js';

const repairStatuses = [
  'pending',
  'diagnosing',
  'awaiting_authorization',
  'awaiting_part',
  'repairing',
  'reviewing',
  'ready',
  'unsuccessful',
  'cancelled',
  'delivered',
] as const;

export async function up(database: Kysely<DatabaseSchema>): Promise<void> {
  await database.schema
    .createTable('repairs')
    .addColumn('repair_id', 'uuid', (column) => column.notNull())
    .addColumn('tenant_id', 'uuid', (column) => column.notNull())
    .addColumn('branch_id', 'uuid', (column) => column.notNull())
    .addColumn('folio', 'varchar(32)', (column) => column.notNull())
    .addColumn('received_at', 'timestamptz', (column) => column.notNull())
    .addColumn('customer_name', 'varchar(160)', (column) => column.notNull())
    .addColumn('customer_phone', 'varchar(40)', (column) => column.notNull())
    .addColumn('device_brand', 'varchar(80)', (column) => column.notNull())
    .addColumn('device_model', 'varchar(120)', (column) => column.notNull())
    .addColumn('reported_issue', 'varchar(500)', (column) => column.notNull())
    .addColumn('technician_id', 'uuid')
    .addColumn('technician_display_name', 'varchar(120)')
    .addColumn('repair_status', 'varchar(32)', (column) => column.notNull())
    .addColumn('custody_status', 'varchar(16)', (column) => column.notNull())
    .addColumn('created_at', 'timestamptz', (column) => column.notNull())
    .addPrimaryKeyConstraint('repairs_pk', ['repair_id'])
    .addUniqueConstraint('repairs_branch_folio_uq', ['tenant_id', 'branch_id', 'folio'])
    .addForeignKeyConstraint(
      'repairs_branch_fk',
      ['tenant_id', 'branch_id'],
      'branches',
      ['tenant_id', 'branch_id'],
      (constraint) => constraint.onUpdate('restrict').onDelete('restrict'),
    )
    .addCheckConstraint(
      'repairs_status_ck',
      sql`repair_status in (${sql.join(repairStatuses.map((status) => sql.lit(status)))})`,
    )
    .addCheckConstraint(
      'repairs_custody_ck',
      sql`custody_status in ('active', 'ended')`,
    )
    .execute();

  await database.schema
    .createIndex('repairs_scope_received_idx')
    .on('repairs')
    .columns(['tenant_id', 'branch_id', 'received_at', 'repair_id'])
    .execute();
}

export async function down(database: Kysely<DatabaseSchema>): Promise<void> {
  await database.schema.dropIndex('repairs_scope_received_idx').execute();
  await database.schema.dropTable('repairs').execute();
}
