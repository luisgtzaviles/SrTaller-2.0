import { sql, type Kysely } from 'kysely';

import type { DatabaseSchema } from '../database-types.js';

const capabilityCodes = [
  'repairs.catalogs.read',
  'repairs.catalogs.manage',
] as const;

export async function up(database: Kysely<DatabaseSchema>): Promise<void> {
  await sql`alter table access_capabilities drop constraint access_capabilities_code_ck`.execute(database);
  await sql`
    alter table access_capabilities add constraint access_capabilities_code_ck
    check (capability_code in (
      'users.read', 'users.manage', 'access_matrix.read', 'access_matrix.manage',
      'repairs.read', 'repairs.add_note', 'repairs.create',
      'repairs.configuration.read', 'repairs.configuration.manage',
      'repairs.catalogs.read', 'repairs.catalogs.manage'
    ))
  `.execute(database);
  const createdAt = new Date();
  await database.insertInto('access_capabilities').values(
    capabilityCodes.map((capability_code) => ({ capability_code, created_at: createdAt })),
  ).onConflict((conflict) => conflict.column('capability_code').doNothing()).execute();
}

export async function down(database: Kysely<DatabaseSchema>): Promise<void> {
  await database.deleteFrom('access_role_capabilities').where('capability_code', 'in', capabilityCodes).execute();
  await database.deleteFrom('access_capabilities').where('capability_code', 'in', capabilityCodes).execute();
  await sql`alter table access_capabilities drop constraint access_capabilities_code_ck`.execute(database);
  await sql`
    alter table access_capabilities add constraint access_capabilities_code_ck
    check (capability_code in (
      'users.read', 'users.manage', 'access_matrix.read', 'access_matrix.manage',
      'repairs.read', 'repairs.add_note', 'repairs.create',
      'repairs.configuration.read', 'repairs.configuration.manage'
    ))
  `.execute(database);
}
