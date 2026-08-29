import type { Kysely } from 'kysely';

import type { DatabaseSchema } from '../database-types.js';

export async function up(database: Kysely<DatabaseSchema>): Promise<void> {
  await database.schema
    .alterTable('repairs')
    .addUniqueConstraint('repairs_scope_id_uq', [
      'tenant_id',
      'branch_id',
      'repair_id',
    ])
    .execute();

  await database.schema
    .createTable('repair_intakes')
    .addColumn('repair_id', 'uuid', (column) => column.notNull())
    .addColumn('tenant_id', 'uuid', (column) => column.notNull())
    .addColumn('branch_id', 'uuid', (column) => column.notNull())
    .addColumn('device_color', 'varchar(80)')
    .addColumn('received_by_id', 'uuid')
    .addColumn('received_by_display_name', 'varchar(120)')
    .addColumn('customer_narrative', 'varchar(2000)')
    .addColumn('physical_condition_summary', 'varchar(1200)')
    .addColumn('documented_risk_summary', 'varchar(800)')
    .addColumn('created_at', 'timestamptz', (column) => column.notNull())
    .addPrimaryKeyConstraint('repair_intakes_pk', ['repair_id'])
    .addForeignKeyConstraint(
      'repair_intakes_repair_scope_fk',
      ['tenant_id', 'branch_id', 'repair_id'],
      'repairs',
      ['tenant_id', 'branch_id', 'repair_id'],
      (constraint) => constraint.onUpdate('restrict').onDelete('restrict'),
    )
    .execute();
}

export async function down(database: Kysely<DatabaseSchema>): Promise<void> {
  await database.schema.dropTable('repair_intakes').execute();
  await database.schema
    .alterTable('repairs')
    .dropConstraint('repairs_scope_id_uq')
    .execute();
}
