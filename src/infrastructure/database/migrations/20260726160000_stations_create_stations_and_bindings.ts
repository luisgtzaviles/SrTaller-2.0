import { sql } from 'kysely';
import type { Kysely, SqlBool } from 'kysely';

import type { DatabaseSchema } from '../database-types.js';

export async function up(database: Kysely<DatabaseSchema>): Promise<void> {
  await database.schema
    .createTable('stations')
    .addColumn('tenant_id', 'uuid', (column) => column.notNull())
    .addColumn('station_id', 'uuid', (column) => column.notNull())
    .addColumn('status', 'varchar(16)', (column) => column.notNull())
    .addColumn('revision', 'integer', (column) => column.notNull())
    .addColumn('created_at', 'timestamptz', (column) => column.notNull())
    .addColumn('updated_at', 'timestamptz', (column) => column.notNull())
    .addColumn('revoked_at', 'timestamptz')
    .addPrimaryKeyConstraint('stations_pk', ['tenant_id', 'station_id'])
    .addForeignKeyConstraint(
      'stations_tenant_fk',
      ['tenant_id'],
      'tenants',
      ['tenant_id'],
      (constraint) =>
        constraint.onUpdate('restrict').onDelete('restrict'),
    )
    .addCheckConstraint(
      'stations_status_ck',
      sql`status in ('Unlinked', 'Active', 'Revoked')`,
    )
    .addCheckConstraint('stations_revision_ck', sql`revision > 0`)
    .addCheckConstraint(
      'stations_revoked_at_ck',
      sql`(
        (status = 'Revoked' and revoked_at is not null)
        or
        (status in ('Unlinked', 'Active') and revoked_at is null)
      )`,
    )
    .addCheckConstraint(
      'stations_updated_at_ck',
      sql`updated_at >= created_at`,
    )
    .execute();

  await database.schema
    .createTable('station_bindings')
    .addColumn('tenant_id', 'uuid', (column) => column.notNull())
    .addColumn('station_id', 'uuid', (column) => column.notNull())
    .addColumn('binding_revision', 'integer', (column) => column.notNull())
    .addColumn('branch_id', 'uuid', (column) => column.notNull())
    .addColumn('linked_at', 'timestamptz', (column) => column.notNull())
    .addColumn('unlinked_at', 'timestamptz')
    .addPrimaryKeyConstraint('station_bindings_pk', [
      'tenant_id',
      'station_id',
      'binding_revision',
    ])
    .addForeignKeyConstraint(
      'station_bindings_station_fk',
      ['tenant_id', 'station_id'],
      'stations',
      ['tenant_id', 'station_id'],
      (constraint) =>
        constraint.onUpdate('restrict').onDelete('restrict'),
    )
    .addForeignKeyConstraint(
      'station_bindings_branch_fk',
      ['tenant_id', 'branch_id'],
      'branches',
      ['tenant_id', 'branch_id'],
      (constraint) =>
        constraint.onUpdate('restrict').onDelete('restrict'),
    )
    .addCheckConstraint(
      'station_bindings_revision_ck',
      sql`binding_revision > 0`,
    )
    .addCheckConstraint(
      'station_bindings_interval_ck',
      sql`unlinked_at is null or unlinked_at >= linked_at`,
    )
    .execute();

  await database.schema
    .createIndex('station_bindings_one_open_uq')
    .unique()
    .on('station_bindings')
    .columns(['tenant_id', 'station_id'])
    .where(sql<SqlBool>`unlinked_at is null`)
    .execute();

  await database.schema
    .createIndex('station_bindings_branch_idx')
    .on('station_bindings')
    .columns(['tenant_id', 'branch_id'])
    .execute();
}

export async function down(
  database: Kysely<DatabaseSchema>,
): Promise<void> {
  await database.schema.dropTable('station_bindings').execute();
  await database.schema.dropTable('stations').execute();
}
