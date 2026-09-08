import { sql } from 'kysely';
import type { Kysely } from 'kysely';

import type { DatabaseSchema } from '../database-types.js';

/** Product administration capabilities; authority remains server-side. */
export async function up(database: Kysely<DatabaseSchema>): Promise<void> {
  await sql`alter table access_capabilities drop constraint access_capabilities_code_ck`.execute(database);
  await sql`
    alter table access_capabilities add constraint access_capabilities_code_ck
    check (capability_code in (
      'users.read', 'users.manage', 'access_matrix.read', 'access_matrix.manage',
      'repairs.read', 'repairs.add_note'
    ))
  `.execute(database);
  const createdAt = new Date('2026-09-07T23:00:00.000Z');
  await database.insertInto('access_capabilities').values([
    { capability_code: 'users.manage', created_at: createdAt },
    { capability_code: 'access_matrix.manage', created_at: createdAt },
  ]).onConflict((conflict) => conflict.column('capability_code').doNothing()).execute();
}

export async function down(database: Kysely<DatabaseSchema>): Promise<void> {
  await sql`
    delete from access_capabilities capability
    where capability.capability_code in ('users.manage', 'access_matrix.manage')
      and not exists (
        select 1 from access_role_capabilities role_capability
        where role_capability.capability_code = capability.capability_code
      )
  `.execute(database);
  // Keep the widened allowlist when valid Role history still references these
  // capabilities. A downgrade must not delete grants or become impossible on
  // a database containing legitimate administration data.
}
