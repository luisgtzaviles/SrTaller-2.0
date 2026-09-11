import { sql, type Kysely } from 'kysely';

import type { DatabaseSchema } from '../database-types.js';

/** Explicit authority for post-intake Repair problem classification. */
export async function up(database: Kysely<DatabaseSchema>): Promise<void> {
  await sql`alter table access_capabilities drop constraint access_capabilities_code_ck`.execute(database);
  await sql`
    alter table access_capabilities add constraint access_capabilities_code_ck
    check (capability_code in (
      'users.read', 'users.manage', 'access_matrix.read', 'access_matrix.manage',
      'repairs.read', 'repairs.add_note', 'repairs.create', 'repairs.correct_intake', 'repairs.classify',
      'repairs.configuration.read', 'repairs.configuration.manage',
      'repairs.catalogs.read', 'repairs.catalogs.manage'
    ))
  `.execute(database);
  await database.insertInto('access_capabilities').values({
    capability_code: 'repairs.classify',
    created_at: new Date(),
  }).onConflict((conflict) => conflict.column('capability_code').doNothing()).execute();
}

export async function down(database: Kysely<DatabaseSchema>): Promise<void> {
  await database.deleteFrom('access_role_capabilities').where('capability_code', '=', 'repairs.classify').execute();
  await database.deleteFrom('access_capabilities').where('capability_code', '=', 'repairs.classify').execute();
  await sql`alter table access_capabilities drop constraint access_capabilities_code_ck`.execute(database);
  await sql`
    alter table access_capabilities add constraint access_capabilities_code_ck
    check (capability_code in (
      'users.read', 'users.manage', 'access_matrix.read', 'access_matrix.manage',
      'repairs.read', 'repairs.add_note', 'repairs.create', 'repairs.correct_intake',
      'repairs.configuration.read', 'repairs.configuration.manage',
      'repairs.catalogs.read', 'repairs.catalogs.manage'
    ))
  `.execute(database);
}
