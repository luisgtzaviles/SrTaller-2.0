import { sql } from 'kysely';
import type { Kysely, SqlBool } from 'kysely';

import type { DatabaseSchema } from '../database-types.js';

export async function up(database: Kysely<DatabaseSchema>): Promise<void> {
  await database.schema
    .createTable('access_operational_session_station_guards')
    .addColumn('tenant_id', 'uuid', (column) => column.notNull())
    .addColumn('station_id', 'uuid', (column) => column.notNull())
    .addColumn('created_at', 'timestamptz', (column) => column.notNull())
    .addColumn('updated_at', 'timestamptz', (column) => column.notNull())
    .addPrimaryKeyConstraint('access_operational_session_station_guards_pk', [
      'tenant_id',
      'station_id',
    ])
    .addCheckConstraint(
      'access_operational_session_station_guards_time_ck',
      sql`updated_at >= created_at`,
    )
    .execute();

  await database.schema
    .createTable('access_operational_sessions')
    .addColumn('tenant_id', 'uuid', (column) => column.notNull())
    .addColumn('session_id', 'uuid', (column) => column.notNull())
    .addColumn('branch_id', 'uuid', (column) => column.notNull())
    .addColumn('station_id', 'uuid', (column) => column.notNull())
    .addColumn('station_credential_id', 'uuid', (column) => column.notNull())
    .addColumn('branch_admission_revision', 'integer', (column) => column.notNull())
    .addColumn('station_admission_revision', 'integer', (column) => column.notNull())
    .addColumn('station_binding_admission_revision', 'integer', (column) => column.notNull())
    .addColumn('station_credential_admission_revision', 'integer', (column) => column.notNull())
    .addColumn('user_id', 'uuid', (column) => column.notNull())
    .addColumn('user_version', 'integer', (column) => column.notNull())
    .addColumn('user_admission_revision', 'integer', (column) => column.notNull())
    .addColumn('credential_version', 'integer', (column) => column.notNull())
    .addColumn('token_verifier', 'bytea', (column) => column.notNull())
    .addColumn('csrf_verifier', 'bytea', (column) => column.notNull())
    .addColumn('status', 'varchar(16)', (column) => column.notNull())
    .addColumn('version', 'integer', (column) => column.notNull().defaultTo(0))
    .addColumn('issued_at', 'timestamptz', (column) => column.notNull())
    .addColumn('last_activity_at', 'timestamptz', (column) => column.notNull())
    .addColumn('expires_at', 'timestamptz', (column) => column.notNull())
    .addColumn('ended_at', 'timestamptz')
    .addPrimaryKeyConstraint('access_operational_sessions_pk', [
      'tenant_id',
      'session_id',
    ])
    .addUniqueConstraint('access_operational_sessions_verifier_uq', [
      'token_verifier',
    ])
    .addCheckConstraint(
      'access_operational_sessions_status_ck',
      sql`status in ('active', 'expired', 'invalidated', 'logged_out', 'replaced')`,
    )
    .addCheckConstraint(
      'access_operational_sessions_state_ck',
      sql`(status = 'active' and ended_at is null) or (status <> 'active' and ended_at is not null)`,
    )
    .addCheckConstraint(
      'access_operational_sessions_version_ck',
      sql`version >= 0 and branch_admission_revision >= 0 and station_admission_revision >= 0 and station_binding_admission_revision >= 0 and station_credential_admission_revision >= 0 and user_version >= 0 and user_admission_revision >= 0 and credential_version >= 0`,
    )
    .addCheckConstraint(
      'access_operational_sessions_verifier_ck',
      sql`octet_length(token_verifier) = 32 and octet_length(csrf_verifier) = 32`,
    )
    .addCheckConstraint(
      'access_operational_sessions_time_ck',
      sql`last_activity_at >= issued_at and last_activity_at <= expires_at and expires_at = issued_at + interval '12 hours' and (ended_at is null or ended_at >= issued_at)`,
    )
    .execute();

  await database.schema
    .createIndex('access_operational_sessions_one_active_station_uq')
    .unique()
    .on('access_operational_sessions')
    .columns(['tenant_id', 'station_id'])
    .where(sql<SqlBool>`status = 'active'`)
    .execute();

  /*
   * A PIN proof carries credential_version. Make that existing authority
   * monotonic for every trust-material/lifecycle change, including direct
   * owner maintenance, so revoke -> restore cannot make a consumed older
   * proof admissible again.
   */
  await sql`
    create function access_advance_pin_credential_version()
    returns trigger
    language plpgsql
    as $function$
    begin
      if new.credential_version < old.credential_version then
        raise check_violation using
          message = 'PIN credential version cannot decrease.',
          constraint = 'access_pin_credentials_version_monotonic_ck',
          table = 'access_pin_credentials';
      end if;
      if new.status is distinct from old.status
        or new.algorithm is distinct from old.algorithm
        or new.profile_version is distinct from old.profile_version
        or new.pepper_version is distinct from old.pepper_version
        or new.memory_kib is distinct from old.memory_kib
        or new.passes is distinct from old.passes
        or new.parallelism is distinct from old.parallelism
        or new.salt is distinct from old.salt
        or new.verifier is distinct from old.verifier
        or new.revoked_at is distinct from old.revoked_at
      then
        new.credential_version = greatest(
          new.credential_version,
          old.credential_version + 1
        );
      end if;
      return new;
    end;
    $function$
  `.execute(database);

  await sql`
    create trigger access_advance_pin_credential_version
    before update on access_pin_credentials
    for each row execute function access_advance_pin_credential_version()
  `.execute(database);

  /*
   * The application composes narrow public readers before reaching this
   * repository. Stations and Users retain their own persistence ownership and
   * are locked through public owner contracts in the enclosing transaction;
   * this Access-owned trigger closes the same race for PIN and role predicates.
   */
  await sql`
    create function access_validate_operational_session_admission()
    returns trigger
    language plpgsql
    as $function$
    begin
      perform 1
      from access_pin_credentials
      where tenant_id = new.tenant_id
        and user_id = new.user_id
        and status = 'active'
        and revoked_at is null
        and credential_version = new.credential_version
      for share;
      if not found then
        raise check_violation using
          message = 'Operational Session admission denied.',
          constraint = 'access_operational_sessions_admission_ck',
          table = 'access_operational_sessions';
      end if;

      perform 1
      from access_role_assignments as ara
      inner join access_roles as ar
        on ar.tenant_id = ara.tenant_id
       and ar.role_id = ara.role_id
      where ara.tenant_id = new.tenant_id
        and ara.user_id = new.user_id
        and ara.status = 'active'
        and ara.revoked_at is null
        and ar.status = 'active'
        and (
          ara.assignment_scope = 'TENANT_WIDE'
          or (
            ara.assignment_scope = 'BRANCH_RESTRICTED'
            and ara.branch_id = new.branch_id
          )
        )
      limit 1
      for share of ara, ar;
      if not found then
        raise check_violation using
          message = 'Operational Session admission denied.',
          constraint = 'access_operational_sessions_admission_ck',
          table = 'access_operational_sessions';
      end if;

      return new;
    end;
    $function$
  `.execute(database);

  await sql`
    create trigger access_sessions_validate_admission
    before insert on access_operational_sessions
    for each row execute function access_validate_operational_session_admission()
  `.execute(database);

  await sql`
    create function access_invalidate_operational_sessions_for_context_change()
    returns trigger
    language plpgsql
    as $function$
    begin
      if tg_table_name = 'access_role_assignments' then
        update access_operational_sessions
        set status = 'invalidated',
            ended_at = greatest(clock_timestamp(), issued_at),
            version = version + 1
        where tenant_id = old.tenant_id
          and user_id = old.user_id
          and status = 'active';
      elsif tg_table_name = 'access_roles' then
        if new.status <> 'active' or new.version is distinct from old.version then
          update access_operational_sessions as aos
          set status = 'invalidated',
              ended_at = greatest(clock_timestamp(), aos.issued_at),
              version = aos.version + 1
          where aos.tenant_id = old.tenant_id
            and aos.status = 'active'
            and exists (
              select 1
              from access_role_assignments as ara
              where ara.tenant_id = old.tenant_id
                and ara.role_id = old.role_id
                and ara.user_id = aos.user_id
            );
        end if;
      elsif tg_table_name = 'access_pin_credentials' then
        update access_operational_sessions
        set status = 'invalidated',
            ended_at = greatest(clock_timestamp(), issued_at),
            version = version + 1
        where tenant_id = old.tenant_id
          and user_id = old.user_id
          and status = 'active';
      end if;
      return new;
    end;
    $function$
  `.execute(database);

  await sql`
    create trigger access_sessions_invalidate_role_assignment
    after update of user_id, role_id, assignment_scope, branch_id, status, version, revoked_at on access_role_assignments
    for each row execute function access_invalidate_operational_sessions_for_context_change()
  `.execute(database);
  await sql`
    create trigger access_sessions_invalidate_role
    after update of status, version on access_roles
    for each row execute function access_invalidate_operational_sessions_for_context_change()
  `.execute(database);
  await sql`
    create trigger access_sessions_invalidate_pin_credential
    after update of status, algorithm, profile_version, pepper_version, memory_kib, passes, parallelism, salt, verifier, credential_version, revoked_at on access_pin_credentials
    for each row execute function access_invalidate_operational_sessions_for_context_change()
  `.execute(database);
}

export async function down(database: Kysely<DatabaseSchema>): Promise<void> {
  await sql`drop trigger if exists access_sessions_invalidate_pin_credential on access_pin_credentials`.execute(database);
  await sql`drop trigger if exists access_sessions_invalidate_role on access_roles`.execute(database);
  await sql`drop trigger if exists access_sessions_invalidate_role_assignment on access_role_assignments`.execute(database);
  await sql`drop function if exists access_invalidate_operational_sessions_for_context_change()`.execute(database);
  await sql`drop trigger if exists access_sessions_validate_admission on access_operational_sessions`.execute(database);
  await sql`drop function if exists access_validate_operational_session_admission()`.execute(database);
  await sql`drop trigger if exists access_advance_pin_credential_version on access_pin_credentials`.execute(database);
  await sql`drop function if exists access_advance_pin_credential_version()`.execute(database);
  await database.schema.dropTable('access_operational_sessions').execute();
  await database.schema
    .dropTable('access_operational_session_station_guards')
    .execute();
}
