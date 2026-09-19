import { sql, type Kysely } from 'kysely';

import type { AccessCapabilityCode, DatabaseSchema } from '../database-types.js';

const newCapabilities = [
  'catalog.items.create',
  'catalog.items.update',
  'catalog.items.deactivate',
  'catalog.import.read',
] as const;

const priorCapabilities = [
  'users.read', 'users.manage', 'access_matrix.read', 'access_matrix.manage',
  'repairs.read', 'repairs.add_note', 'repairs.create', 'repairs.correct_intake',
  'repairs.classify', 'repairs.configuration.read', 'repairs.configuration.manage',
  'repairs.catalogs.read', 'repairs.catalogs.manage', 'price_list.read',
  'catalog.manage', 'catalog.prices.manage', 'catalog.branch_prices.manage',
  'catalog.reference_cost.read', 'catalog.reference_cost.manage',
  'catalog.import.prepare', 'catalog.import.publish', 'catalog.items.bulk_retire',
  'catalog.suppliers.delete', 'catalog.configuration.read', 'catalog.configuration.manage',
] as const;

async function replaceConstraint(database: Kysely<DatabaseSchema>, values: readonly string[]): Promise<void> {
  await sql`alter table access_capabilities drop constraint access_capabilities_code_ck`.execute(database);
  await sql.raw(`alter table access_capabilities add constraint access_capabilities_code_ck check (capability_code in (${values.map((value) => `'${value}'`).join(', ')}))`).execute(database);
}

async function backfillFromCapability(
  database: Kysely<DatabaseSchema>,
  sourceCapability: string,
  successorCapabilities: readonly string[],
  createdAt: Date,
): Promise<void> {
  const legacyGrants = await database
    .selectFrom('access_role_capabilities')
    .select(['tenant_id', 'role_id'])
    .where('capability_code', '=', sourceCapability as AccessCapabilityCode)
    .execute();
  if (legacyGrants.length === 0) return;
  for (const successor of successorCapabilities) {
    await database
      .insertInto('access_role_capabilities')
      .values(legacyGrants.map(({ tenant_id, role_id }) => ({
        tenant_id,
        role_id,
        capability_code: successor as AccessCapabilityCode,
        created_at: createdAt,
      })))
      .onConflict((conflict) => conflict.columns([
        'tenant_id', 'role_id', 'capability_code',
      ]).doNothing())
      .execute();
  }
}

export async function up(database: Kysely<DatabaseSchema>): Promise<void> {
  await replaceConstraint(database, [...priorCapabilities, ...newCapabilities]);
  const createdAt = new Date('2026-09-17T20:30:00.000Z');
  await database.insertInto('access_capabilities').values(
    newCapabilities.map((capability_code) => ({ capability_code, created_at: createdAt })),
  ).onConflict((conflict) => conflict.column('capability_code').doNothing()).execute();
  await backfillFromCapability(database, 'catalog.manage', [
    'catalog.items.create',
    'catalog.items.update',
    'catalog.items.deactivate',
  ], createdAt);
  await backfillFromCapability(database, 'catalog.import.prepare', [
    'catalog.import.read',
  ], createdAt);
}

export async function down(database: Kysely<DatabaseSchema>): Promise<void> {
  await database.deleteFrom('access_role_capabilities')
    .where('capability_code', 'in', newCapabilities)
    .execute();
  await database.deleteFrom('access_capabilities')
    .where('capability_code', 'in', newCapabilities)
    .execute();
  await replaceConstraint(database, priorCapabilities);
}
