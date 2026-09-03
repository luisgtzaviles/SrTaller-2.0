import type { Kysely } from 'kysely';

import type { DatabaseSchema } from '../database-types.js';

export async function up(database: Kysely<DatabaseSchema>): Promise<void> {
  await database.schema
    .alterTable('repair_technicians')
    .addUniqueConstraint('repair_technicians_tenant_id_uq', ['tenant_id', 'technician_id'])
    .execute();

  await database.schema
    .alterTable('repair_technician_branches')
    .dropConstraint('repair_technician_branches_technician_fk')
    .execute();
  await database.schema
    .alterTable('repair_technician_branches')
    .addForeignKeyConstraint(
      'repair_technician_branches_technician_scope_fk',
      ['tenant_id', 'technician_id'],
      'repair_technicians',
      ['tenant_id', 'technician_id'],
      (constraint) => constraint.onDelete('restrict').onUpdate('restrict'),
    )
    .execute();

  await database.schema
    .alterTable('repair_technician_assignments')
    .dropConstraint('repair_technician_assignments_technician_fk')
    .execute();
  await database.schema
    .alterTable('repair_technician_assignments')
    .addForeignKeyConstraint(
      'repair_technician_assignments_technician_scope_fk',
      ['tenant_id', 'technician_id'],
      'repair_technicians',
      ['tenant_id', 'technician_id'],
      (constraint) => constraint.onDelete('restrict').onUpdate('restrict'),
    )
    .execute();
}

export async function down(database: Kysely<DatabaseSchema>): Promise<void> {
  await database.schema
    .alterTable('repair_technician_assignments')
    .dropConstraint('repair_technician_assignments_technician_scope_fk')
    .execute();
  await database.schema
    .alterTable('repair_technician_assignments')
    .addForeignKeyConstraint(
      'repair_technician_assignments_technician_fk',
      ['technician_id'],
      'repair_technicians',
      ['technician_id'],
      (constraint) => constraint.onDelete('restrict').onUpdate('restrict'),
    )
    .execute();

  await database.schema
    .alterTable('repair_technician_branches')
    .dropConstraint('repair_technician_branches_technician_scope_fk')
    .execute();
  await database.schema
    .alterTable('repair_technician_branches')
    .addForeignKeyConstraint(
      'repair_technician_branches_technician_fk',
      ['technician_id'],
      'repair_technicians',
      ['technician_id'],
      (constraint) => constraint.onDelete('restrict').onUpdate('restrict'),
    )
    .execute();

  await database.schema
    .alterTable('repair_technicians')
    .dropConstraint('repair_technicians_tenant_id_uq')
    .execute();
}
