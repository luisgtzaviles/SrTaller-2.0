import { sql } from 'kysely';
import type { Kysely } from 'kysely';

import type { DatabaseSchema } from '../database-types.js';

export async function up(database: Kysely<DatabaseSchema>): Promise<void> {
  await database.schema
    .createTable('access_roles')
    .addColumn('tenant_id', 'uuid', (column) => column.notNull())
    .addColumn('role_id', 'uuid', (column) => column.notNull())
    .addColumn('role_key', 'varchar(64)', (column) => column.notNull())
    .addColumn('display_name', 'varchar(160)', (column) => column.notNull())
    .addColumn('status', 'varchar(16)', (column) =>
      column.notNull().defaultTo('active'),
    )
    .addColumn('version', 'integer', (column) => column.notNull().defaultTo(0))
    .addColumn('created_at', 'timestamptz', (column) => column.notNull())
    .addColumn('updated_at', 'timestamptz', (column) => column.notNull())
    .addPrimaryKeyConstraint('access_roles_pk', ['tenant_id', 'role_id'])
    .addForeignKeyConstraint(
      'access_roles_tenant_fk',
      ['tenant_id'],
      'tenants',
      ['tenant_id'],
      (constraint) => constraint.onUpdate('restrict').onDelete('restrict'),
    )
    .addUniqueConstraint('access_roles_tenant_key_uq', [
      'tenant_id',
      'role_key',
    ])
    .addCheckConstraint(
      'access_roles_key_ck',
      sql`role_key ~ '^[a-z][a-z0-9]*(_[a-z0-9]+)*$'`,
    )
    .addCheckConstraint(
      'access_roles_display_name_ck',
      sql`length(btrim(display_name)) > 0`,
    )
    .addCheckConstraint(
      'access_roles_status_ck',
      sql`status in ('active', 'disabled', 'archived')`,
    )
    .addCheckConstraint('access_roles_version_ck', sql`version >= 0`)
    .execute();

  await database.schema
    .createTable('access_role_capabilities')
    .addColumn('tenant_id', 'uuid', (column) => column.notNull())
    .addColumn('role_id', 'uuid', (column) => column.notNull())
    .addColumn('capability_code', 'varchar(80)', (column) => column.notNull())
    .addColumn('created_at', 'timestamptz', (column) => column.notNull())
    .addPrimaryKeyConstraint('access_role_capabilities_pk', [
      'tenant_id',
      'role_id',
      'capability_code',
    ])
    .addForeignKeyConstraint(
      'access_role_capabilities_role_fk',
      ['tenant_id', 'role_id'],
      'access_roles',
      ['tenant_id', 'role_id'],
      (constraint) => constraint.onUpdate('restrict').onDelete('restrict'),
    )
    .addForeignKeyConstraint(
      'access_role_capabilities_capability_fk',
      ['capability_code'],
      'access_capabilities',
      ['capability_code'],
      (constraint) => constraint.onUpdate('restrict').onDelete('restrict'),
    )
    .execute();
}

export async function down(database: Kysely<DatabaseSchema>): Promise<void> {
  await database.schema.dropTable('access_role_capabilities').execute();
  await database.schema.dropTable('access_roles').execute();
}
