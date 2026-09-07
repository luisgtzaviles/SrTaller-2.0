import { sql } from 'kysely';
import type { Kysely, SqlBool } from 'kysely';

import type { DatabaseSchema } from '../database-types.js';

export async function up(database: Kysely<DatabaseSchema>): Promise<void> {
  await database.schema
    .createTable('access_role_assignments')
    .addColumn('tenant_id', 'uuid', (column) => column.notNull())
    .addColumn('assignment_id', 'uuid', (column) => column.notNull())
    .addColumn('user_id', 'uuid', (column) => column.notNull())
    .addColumn('role_id', 'uuid', (column) => column.notNull())
    .addColumn('assignment_scope', 'varchar(24)', (column) => column.notNull())
    .addColumn('branch_id', 'uuid')
    .addColumn('status', 'varchar(16)', (column) =>
      column.notNull().defaultTo('active'),
    )
    .addColumn('version', 'integer', (column) => column.notNull().defaultTo(0))
    .addColumn('assigned_at', 'timestamptz', (column) => column.notNull())
    .addColumn('revoked_at', 'timestamptz')
    .addPrimaryKeyConstraint('access_role_assignments_pk', [
      'tenant_id',
      'assignment_id',
    ])
    .addForeignKeyConstraint(
      'access_role_assignments_user_fk',
      ['tenant_id', 'user_id'],
      'users',
      ['tenant_id', 'user_id'],
      (constraint) => constraint.onUpdate('restrict').onDelete('restrict'),
    )
    .addForeignKeyConstraint(
      'access_role_assignments_role_fk',
      ['tenant_id', 'role_id'],
      'access_roles',
      ['tenant_id', 'role_id'],
      (constraint) => constraint.onUpdate('restrict').onDelete('restrict'),
    )
    .addForeignKeyConstraint(
      'access_role_assignments_branch_fk',
      ['tenant_id', 'branch_id'],
      'branches',
      ['tenant_id', 'branch_id'],
      (constraint) => constraint.onUpdate('restrict').onDelete('restrict'),
    )
    .addCheckConstraint(
      'access_role_assignments_scope_ck',
      sql`(assignment_scope = 'TENANT_WIDE' and branch_id is null) or (assignment_scope = 'BRANCH_RESTRICTED' and branch_id is not null)`,
    )
    .addCheckConstraint(
      'access_role_assignments_status_ck',
      sql`(status = 'active' and revoked_at is null) or (status = 'revoked' and revoked_at is not null)`,
    )
    .addCheckConstraint(
      'access_role_assignments_version_ck',
      sql`version >= 0`,
    )
    .addCheckConstraint(
      'access_role_assignments_time_ck',
      sql`revoked_at is null or revoked_at >= assigned_at`,
    )
    .execute();

  await database.schema
    .createIndex('access_role_assignments_active_tenant_uq')
    .on('access_role_assignments')
    .columns(['tenant_id', 'user_id', 'role_id'])
    .unique()
    .where(
      sql<SqlBool>`status = 'active' and assignment_scope = 'TENANT_WIDE'`,
    )
    .execute();
  await database.schema
    .createIndex('access_role_assignments_active_branch_uq')
    .on('access_role_assignments')
    .columns(['tenant_id', 'user_id', 'role_id', 'branch_id'])
    .unique()
    .where(
      sql<SqlBool>`status = 'active' and assignment_scope = 'BRANCH_RESTRICTED'`,
    )
    .execute();
  await database.schema
    .createIndex('access_role_assignments_user_scope_idx')
    .on('access_role_assignments')
    .columns([
      'tenant_id',
      'user_id',
      'status',
      'assignment_scope',
      'branch_id',
    ])
    .execute();

  await database.schema
    .createTable('access_role_assignment_commands')
    .addColumn('tenant_id', 'uuid', (column) => column.notNull())
    .addColumn('client_request_id', 'uuid', (column) => column.notNull())
    .addColumn('command_type', 'varchar(16)', (column) => column.notNull())
    .addColumn('assignment_id', 'uuid', (column) => column.notNull())
    .addColumn('user_id', 'uuid', (column) => column.notNull())
    .addColumn('role_id', 'uuid', (column) => column.notNull())
    .addColumn('assignment_scope', 'varchar(24)', (column) => column.notNull())
    .addColumn('branch_id', 'uuid')
    .addColumn('expected_version', 'integer')
    .addColumn('result_status', 'varchar(16)', (column) => column.notNull())
    .addColumn('result_version', 'integer', (column) => column.notNull())
    .addColumn('result_assigned_at', 'timestamptz', (column) => column.notNull())
    .addColumn('result_revoked_at', 'timestamptz')
    .addColumn('applied_at', 'timestamptz', (column) => column.notNull())
    .addPrimaryKeyConstraint('access_role_assignment_commands_pk', [
      'tenant_id',
      'client_request_id',
    ])
    .addForeignKeyConstraint(
      'access_role_assignment_commands_assignment_fk',
      ['tenant_id', 'assignment_id'],
      'access_role_assignments',
      ['tenant_id', 'assignment_id'],
      (constraint) => constraint.onUpdate('restrict').onDelete('restrict'),
    )
    .addForeignKeyConstraint(
      'access_role_assignment_commands_user_fk',
      ['tenant_id', 'user_id'],
      'users',
      ['tenant_id', 'user_id'],
      (constraint) => constraint.onUpdate('restrict').onDelete('restrict'),
    )
    .addForeignKeyConstraint(
      'access_role_assignment_commands_role_fk',
      ['tenant_id', 'role_id'],
      'access_roles',
      ['tenant_id', 'role_id'],
      (constraint) => constraint.onUpdate('restrict').onDelete('restrict'),
    )
    .addForeignKeyConstraint(
      'access_role_assignment_commands_branch_fk',
      ['tenant_id', 'branch_id'],
      'branches',
      ['tenant_id', 'branch_id'],
      (constraint) => constraint.onUpdate('restrict').onDelete('restrict'),
    )
    .addCheckConstraint(
      'access_role_assignment_commands_scope_ck',
      sql`(assignment_scope = 'TENANT_WIDE' and branch_id is null) or (assignment_scope = 'BRANCH_RESTRICTED' and branch_id is not null)`,
    )
    .addCheckConstraint(
      'access_role_assignment_commands_status_ck',
      sql`(result_status = 'active' and result_revoked_at is null) or (result_status = 'revoked' and result_revoked_at is not null)`,
    )
    .addCheckConstraint(
      'access_role_assignment_commands_semantics_ck',
      sql`(command_type = 'assign' and expected_version is null and result_status = 'active' and result_version = 0) or (command_type = 'revoke' and expected_version >= 0 and result_status = 'revoked' and result_version = expected_version + 1)`,
    )
    .addCheckConstraint(
      'access_role_assignment_commands_time_ck',
      sql`result_revoked_at is null or result_revoked_at >= result_assigned_at`,
    )
    .execute();
}

export async function down(database: Kysely<DatabaseSchema>): Promise<void> {
  await database.schema
    .dropTable('access_role_assignment_commands')
    .execute();
  await database.schema
    .dropIndex('access_role_assignments_user_scope_idx')
    .execute();
  await database.schema
    .dropIndex('access_role_assignments_active_branch_uq')
    .execute();
  await database.schema
    .dropIndex('access_role_assignments_active_tenant_uq')
    .execute();
  await database.schema.dropTable('access_role_assignments').execute();
}
