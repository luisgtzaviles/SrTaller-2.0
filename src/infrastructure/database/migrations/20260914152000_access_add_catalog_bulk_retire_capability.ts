import { sql, type Kysely } from 'kysely';

import type { DatabaseSchema } from '../database-types.js';

const newCapability = 'catalog.items.bulk_retire' as const;
const priorCapabilities = [
  'users.read', 'users.manage', 'access_matrix.read', 'access_matrix.manage',
  'repairs.read', 'repairs.add_note', 'repairs.create', 'repairs.correct_intake',
  'repairs.classify', 'repairs.configuration.read', 'repairs.configuration.manage',
  'repairs.catalogs.read', 'repairs.catalogs.manage', 'price_list.read',
  'catalog.manage', 'catalog.prices.manage', 'catalog.branch_prices.manage',
  'catalog.reference_cost.read', 'catalog.reference_cost.manage',
  'catalog.import.prepare', 'catalog.import.publish',
] as const;

async function replaceConstraint(database: Kysely<DatabaseSchema>, values: readonly string[]): Promise<void> {
  await sql`alter table access_capabilities drop constraint access_capabilities_code_ck`.execute(database);
  await sql.raw(`alter table access_capabilities add constraint access_capabilities_code_ck check (capability_code in (${values.map((value) => `'${value}'`).join(', ')}))`).execute(database);
}

export async function up(database: Kysely<DatabaseSchema>): Promise<void> {
  await replaceConstraint(database, [...priorCapabilities, newCapability]);
  await database.insertInto('access_capabilities').values({ capability_code: newCapability, created_at: new Date('2026-09-14T19:00:00.000Z') }).onConflict((conflict) => conflict.column('capability_code').doNothing()).execute();
}

export async function down(database: Kysely<DatabaseSchema>): Promise<void> {
  await database.deleteFrom('access_role_capabilities').where('capability_code', '=', newCapability).execute();
  await database.deleteFrom('access_capabilities').where('capability_code', '=', newCapability).execute();
  await replaceConstraint(database, priorCapabilities);
}
