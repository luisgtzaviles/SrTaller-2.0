import { sql } from 'kysely';
import type { Kysely } from 'kysely';

import type { DatabaseSchema } from '../database-types.js';

/** Product Mode local capability surface; no production authority is implied. */
export async function up(database: Kysely<DatabaseSchema>): Promise<void> {
  await sql`alter table access_capabilities drop constraint access_capabilities_code_ck`.execute(database);
  await sql`
    alter table access_capabilities add constraint access_capabilities_code_ck
    check (capability_code in (
      'users.read', 'users.manage', 'access_matrix.read', 'access_matrix.manage',
      'repairs.read', 'repairs.add_note'
    ))
  `.execute(database);
  const createdAt = new Date();
  await database.insertInto('access_capabilities').values([
    { capability_code: 'users.manage', created_at: createdAt },
    { capability_code: 'access_matrix.manage', created_at: createdAt },
  ]).onConflict((conflict) => conflict.column('capability_code').doNothing()).execute();
}

export async function down(database: Kysely<DatabaseSchema>): Promise<void> {
  await database.deleteFrom('access_capabilities')
    .where('capability_code', 'in', ['users.manage', 'access_matrix.manage'])
    .execute();
  await sql`alter table access_capabilities drop constraint access_capabilities_code_ck`.execute(database);
  await sql`
    alter table access_capabilities add constraint access_capabilities_code_ck
    check (capability_code in ('users.read', 'access_matrix.read', 'repairs.read', 'repairs.add_note'))
  `.execute(database);
}
