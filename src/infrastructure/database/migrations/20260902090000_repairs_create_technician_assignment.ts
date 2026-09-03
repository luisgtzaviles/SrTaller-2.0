import { sql, type Kysely } from 'kysely';

import type { DatabaseSchema } from '../database-types.js';

export async function up(database: Kysely<DatabaseSchema>): Promise<void> {
  await database.schema
    .createTable('repair_technicians')
    .addColumn('technician_id', 'uuid', (column) => column.notNull())
    .addColumn('tenant_id', 'uuid', (column) => column.notNull())
    .addColumn('display_name', 'varchar(120)', (column) => column.notNull())
    .addColumn('active', 'boolean', (column) => column.notNull().defaultTo(true))
    .addColumn('created_at', 'timestamptz', (column) => column.notNull())
    .addPrimaryKeyConstraint('repair_technicians_pk', ['technician_id'])
    .addUniqueConstraint('repair_technicians_tenant_name_uq', ['tenant_id', 'display_name'])
    .addForeignKeyConstraint('repair_technicians_tenant_fk', ['tenant_id'], 'tenants', ['tenant_id'], (constraint) => constraint.onDelete('restrict').onUpdate('restrict'))
    .execute();

  await database.schema
    .createTable('repair_technician_branches')
    .addColumn('tenant_id', 'uuid', (column) => column.notNull())
    .addColumn('branch_id', 'uuid', (column) => column.notNull())
    .addColumn('technician_id', 'uuid', (column) => column.notNull())
    .addColumn('created_at', 'timestamptz', (column) => column.notNull())
    .addPrimaryKeyConstraint('repair_technician_branches_pk', ['tenant_id', 'branch_id', 'technician_id'])
    .addForeignKeyConstraint('repair_technician_branches_branch_fk', ['tenant_id', 'branch_id'], 'branches', ['tenant_id', 'branch_id'], (constraint) => constraint.onDelete('restrict').onUpdate('restrict'))
    .addForeignKeyConstraint('repair_technician_branches_technician_fk', ['technician_id'], 'repair_technicians', ['technician_id'], (constraint) => constraint.onDelete('restrict').onUpdate('restrict'))
    .execute();

  await database.schema
    .createTable('repair_technician_assignments')
    .addColumn('assignment_id', 'uuid', (column) => column.notNull())
    .addColumn('tenant_id', 'uuid', (column) => column.notNull())
    .addColumn('branch_id', 'uuid', (column) => column.notNull())
    .addColumn('repair_id', 'uuid', (column) => column.notNull())
    .addColumn('technician_id', 'uuid', (column) => column.notNull())
    .addColumn('assigned_by_actor_id', 'uuid', (column) => column.notNull())
    .addColumn('assigned_by_actor_display_name', 'varchar(120)', (column) => column.notNull())
    .addColumn('assigned_at', 'timestamptz', (column) => column.notNull())
    .addColumn('ended_at', 'timestamptz')
    .addColumn('ended_by_actor_id', 'uuid')
    .addColumn('ended_by_actor_display_name', 'varchar(120)')
    .addColumn('reason', 'varchar(1000)')
    .addColumn('client_request_id', 'uuid', (column) => column.notNull())
    .addColumn('assignment_sequence', 'integer', (column) => column.notNull())
    .addPrimaryKeyConstraint('repair_technician_assignments_pk', ['assignment_id'])
    .addForeignKeyConstraint('repair_technician_assignments_repair_scope_fk', ['tenant_id', 'branch_id', 'repair_id'], 'repairs', ['tenant_id', 'branch_id', 'repair_id'], (constraint) => constraint.onDelete('restrict').onUpdate('restrict'))
    .addForeignKeyConstraint('repair_technician_assignments_technician_fk', ['technician_id'], 'repair_technicians', ['technician_id'], (constraint) => constraint.onDelete('restrict').onUpdate('restrict'))
    .addCheckConstraint('repair_technician_assignments_end_actor_ck', sql`(ended_at is null and ended_by_actor_id is null and ended_by_actor_display_name is null) or (ended_at is not null and ended_by_actor_id is not null and ended_by_actor_display_name is not null)`)
    .addCheckConstraint('repair_technician_assignments_sequence_ck', sql`assignment_sequence > 0`)
    .execute();

  await database.schema
    .createIndex('repair_technician_assignments_active_uq')
    .on('repair_technician_assignments')
    .columns(['tenant_id', 'branch_id', 'repair_id'])
    .where(sql<boolean>`ended_at is null`)
    .unique()
    .execute();
  await database.schema
    .createIndex('repair_technician_assignments_request_uq')
    .on('repair_technician_assignments')
    .columns(['tenant_id', 'branch_id', 'repair_id', 'client_request_id'])
    .unique()
    .execute();
  await database.schema
    .createIndex('repair_technician_assignments_history_idx')
    .on('repair_technician_assignments')
    .columns(['tenant_id', 'branch_id', 'repair_id', 'assignment_sequence'])
    .execute();
}

export async function down(database: Kysely<DatabaseSchema>): Promise<void> {
  await database.schema.dropIndex('repair_technician_assignments_history_idx').execute();
  await database.schema.dropIndex('repair_technician_assignments_request_uq').execute();
  await database.schema.dropIndex('repair_technician_assignments_active_uq').execute();
  await database.schema.dropTable('repair_technician_assignments').execute();
  await database.schema.dropTable('repair_technician_branches').execute();
  await database.schema.dropTable('repair_technicians').execute();
}
