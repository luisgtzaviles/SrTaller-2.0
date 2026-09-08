import { sql, type Kysely } from 'kysely';

import type { DatabaseSchema } from '../database-types.js';

/** Avoids tenant-wide collision scans when authentication updates only counters. */
export async function up(database: Kysely<DatabaseSchema>): Promise<void> {
  await sql`drop trigger access_pin_credentials_pin_eligibility_guard on access_pin_credentials`.execute(database);
  await sql`drop trigger access_role_assignments_pin_eligibility_guard on access_role_assignments`.execute(database);
  await sql`drop trigger access_roles_pin_eligibility_guard on access_roles`.execute(database);
  await sql`
    create trigger access_pin_credentials_pin_eligibility_guard
    after insert or update of tenant_id, user_id, status, lookup_digest
    on access_pin_credentials
    for each row execute function access_assert_unambiguous_pin_eligibility()
  `.execute(database);
  await sql`
    create trigger access_role_assignments_pin_eligibility_guard
    after insert or update of tenant_id, user_id, role_id, assignment_scope,
      branch_id, status, revoked_at
    on access_role_assignments
    for each row execute function access_assert_unambiguous_pin_eligibility()
  `.execute(database);
  await sql`
    create trigger access_roles_pin_eligibility_guard
    after insert or update of tenant_id, role_id, status
    on access_roles
    for each row execute function access_assert_unambiguous_pin_eligibility()
  `.execute(database);
}

export async function down(database: Kysely<DatabaseSchema>): Promise<void> {
  await sql`drop trigger access_pin_credentials_pin_eligibility_guard on access_pin_credentials`.execute(database);
  await sql`drop trigger access_role_assignments_pin_eligibility_guard on access_role_assignments`.execute(database);
  await sql`drop trigger access_roles_pin_eligibility_guard on access_roles`.execute(database);
  await sql`
    create trigger access_pin_credentials_pin_eligibility_guard
    after insert or update on access_pin_credentials
    for each row execute function access_assert_unambiguous_pin_eligibility()
  `.execute(database);
  await sql`
    create trigger access_role_assignments_pin_eligibility_guard
    after insert or update on access_role_assignments
    for each row execute function access_assert_unambiguous_pin_eligibility()
  `.execute(database);
  await sql`
    create trigger access_roles_pin_eligibility_guard
    after insert or update on access_roles
    for each row execute function access_assert_unambiguous_pin_eligibility()
  `.execute(database);
}
