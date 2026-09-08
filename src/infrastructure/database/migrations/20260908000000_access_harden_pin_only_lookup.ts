import { sql, type Kysely } from 'kysely';

import type { DatabaseSchema } from '../database-types.js';

/**
 * Adds a pepper-keyed, non-reversible PIN lookup tag. The tag is not globally
 * unique: ambiguity is evaluated against the Users eligible in the Station's
 * current Branch and fails closed.
 *
 * Existing credentials remain nullable because their PIN cannot be recovered
 * from Argon2. They must be replaced (or re-materialized by the local synthetic
 * seed) before the PIN-only resolver can use them.
 */
export async function up(database: Kysely<DatabaseSchema>): Promise<void> {
  await database.schema
    .createTable('access_pin_eligibility_tenant_guards')
    .addColumn('tenant_id', 'uuid', (column) => column.primaryKey())
    .addColumn('created_at', 'timestamptz', (column) => column.notNull())
    .execute();
  await database.schema
    .alterTable('access_pin_credentials')
    .addColumn('lookup_digest', 'bytea')
    .execute();
  await sql`
    alter table access_pin_credentials
    add constraint access_pin_credentials_lookup_digest_ck
    check (lookup_digest is null or octet_length(lookup_digest) = 32)
  `.execute(database);
  await sql`
    create index access_pin_credentials_lookup_idx
    on access_pin_credentials (tenant_id, lookup_digest, user_id)
    where status = 'active' and lookup_digest is not null
  `.execute(database);
  await sql`
    alter table access_pin_credential_commands
    drop constraint access_pin_credential_commands_semantics_ck
  `.execute(database);
  await sql`
    alter table access_pin_credential_commands
    add constraint access_pin_credential_commands_semantics_ck
    check (
      result_status = 'active'
      and (
        (command_type = 'provision' and result_credential_version = 0)
        or (command_type = 'replace' and result_credential_version > 0)
      )
    )
  `.execute(database);
  await sql`
    create or replace function access_assert_unambiguous_pin_eligibility()
    returns trigger
    language plpgsql
    as $body$
    declare
      affected_tenant uuid;
    begin
      affected_tenant := new.tenant_id;
      perform pg_advisory_xact_lock(
        hashtextextended(affected_tenant::text, 240000)
      );
      if exists (
        select 1
        from access_pin_credentials left_credential
        join access_pin_credentials right_credential
          on right_credential.tenant_id = left_credential.tenant_id
         and right_credential.lookup_digest = left_credential.lookup_digest
         and right_credential.user_id > left_credential.user_id
         and right_credential.status = 'active'
        where left_credential.tenant_id = affected_tenant
          and left_credential.status = 'active'
          and left_credential.lookup_digest is not null
          and exists (
            select 1
            from access_role_assignments left_assignment
            join access_roles left_role
              on left_role.tenant_id = left_assignment.tenant_id
             and left_role.role_id = left_assignment.role_id
             and left_role.status = 'active'
            join access_role_assignments right_assignment
              on right_assignment.tenant_id = left_assignment.tenant_id
             and right_assignment.user_id = right_credential.user_id
             and right_assignment.status = 'active'
            join access_roles right_role
              on right_role.tenant_id = right_assignment.tenant_id
             and right_role.role_id = right_assignment.role_id
             and right_role.status = 'active'
            where left_assignment.tenant_id = left_credential.tenant_id
              and left_assignment.user_id = left_credential.user_id
              and left_assignment.status = 'active'
              and (
                left_assignment.assignment_scope = 'TENANT_WIDE'
                or right_assignment.assignment_scope = 'TENANT_WIDE'
                or left_assignment.branch_id = right_assignment.branch_id
              )
          )
      ) then
        raise unique_violation
          using constraint = 'access_pin_branch_eligibility_uq';
      end if;
      return new;
    end
    $body$
  `.execute(database);
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

export async function down(database: Kysely<DatabaseSchema>): Promise<void> {
  await sql`drop trigger access_roles_pin_eligibility_guard on access_roles`
    .execute(database);
  await sql`drop trigger access_role_assignments_pin_eligibility_guard on access_role_assignments`
    .execute(database);
  await sql`drop trigger access_pin_credentials_pin_eligibility_guard on access_pin_credentials`
    .execute(database);
  await sql`drop function access_assert_unambiguous_pin_eligibility()`
    .execute(database);
  // Replacement command evidence is intentionally retained on downgrade.
  // Narrowing the command constraint would require deleting valid history.
  await database.schema.dropIndex('access_pin_credentials_lookup_idx').execute();
  await sql`
    alter table access_pin_credentials
    drop constraint access_pin_credentials_lookup_digest_ck
  `.execute(database);
  await database.schema
    .alterTable('access_pin_credentials')
    .dropColumn('lookup_digest')
    .execute();
  await database.schema
    .dropTable('access_pin_eligibility_tenant_guards')
    .execute();
}
