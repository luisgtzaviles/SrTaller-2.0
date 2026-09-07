import { sql } from 'kysely';
import type { Kysely } from 'kysely';

import type { DatabaseSchema } from '../database-types.js';

export async function up(database: Kysely<DatabaseSchema>): Promise<void> {
  await database.schema
    .createTable('access_capabilities')
    .addColumn('capability_code', 'varchar(80)', (column) => column.notNull())
    .addColumn('created_at', 'timestamptz', (column) => column.notNull())
    .addPrimaryKeyConstraint('access_capabilities_pk', ['capability_code'])
    .addCheckConstraint(
      'access_capabilities_code_ck',
      sql`capability_code in ('users.read', 'access_matrix.read', 'repairs.read', 'repairs.add_note')`,
    )
    .execute();

  const createdAt = new Date('2026-09-06T18:00:00.000Z');
  await database
    .insertInto('access_capabilities')
    .values([
      { capability_code: 'users.read', created_at: createdAt },
      { capability_code: 'access_matrix.read', created_at: createdAt },
      { capability_code: 'repairs.read', created_at: createdAt },
      { capability_code: 'repairs.add_note', created_at: createdAt },
    ])
    .execute();
}

export async function down(database: Kysely<DatabaseSchema>): Promise<void> {
  await database
    .deleteFrom('access_capabilities')
    .where('capability_code', 'in', [
      'users.read',
      'access_matrix.read',
      'repairs.read',
      'repairs.add_note',
    ])
    .execute();
  await database.schema.dropTable('access_capabilities').execute();
}
