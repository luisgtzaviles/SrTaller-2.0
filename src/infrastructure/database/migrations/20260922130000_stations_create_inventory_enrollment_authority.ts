import { sql } from 'kysely';
import type { Kysely } from 'kysely';

import type { DatabaseSchema } from '../database-types.js';

const legacyStationId = '00000000-0000-4000-8000-000000000401';
const legacyStationName = 'SR Taller Fixture — Dispositivo 1';

export async function up(database: Kysely<DatabaseSchema>): Promise<void> {
  await database.schema.alterTable('stations')
    .addColumn('display_name', 'varchar(120)')
    .addColumn('version', 'integer', (column) => column.notNull().defaultTo(0))
    .execute();
  await sql`alter table stations add constraint stations_version_ck check (version >= 0)`.execute(database);
  await sql`alter table stations drop constraint stations_status_ck`.execute(database);
  await sql`alter table stations add constraint stations_status_ck check (status in ('unlinked', 'active', 'revoked'))`.execute(database);
  await sql`alter table stations drop constraint stations_revoked_ck`.execute(database);
  await sql`alter table stations add constraint stations_revoked_ck check ((status = 'revoked') = (revoked_at is not null))`.execute(database);

  await sql`
    update stations
    set display_name = ${legacyStationName}
    where station_id = ${legacyStationId}::uuid
      and display_name is null
  `.execute(database);
  await sql`
    do $block$
    begin
      if exists (select 1 from stations where display_name is null) then
        raise exception 'TL-07 requires explicit Owner mapping for every legacy Station';
      end if;
    end;
    $block$
  `.execute(database);
  await sql`alter table stations alter column display_name set not null`.execute(database);

  await sql`alter table station_bindings drop constraint station_bindings_pk`.execute(database);
  await database.schema.alterTable('station_bindings')
    .addColumn('binding_id', 'uuid', (column) => column.notNull().defaultTo(sql`gen_random_uuid()`))
    .execute();
  await sql`alter table station_bindings add constraint station_bindings_pk primary key (tenant_id, station_id, binding_id)`.execute(database);
  await sql`create unique index station_bindings_one_current_idx on station_bindings (tenant_id, station_id) where revoked_at is null`.execute(database);
  await sql`create index station_bindings_history_idx on station_bindings (tenant_id, station_id, created_at desc, binding_id)`.execute(database);
  await sql`create unique index station_credentials_one_current_idx on station_credentials (tenant_id, station_id) where revoked_at is null`.execute(database);

  await database.schema.createTable('station_enrollment_challenges')
    .addColumn('tenant_id', 'uuid', (column) => column.notNull())
    .addColumn('challenge_id', 'uuid', (column) => column.notNull())
    .addColumn('target_branch_id', 'uuid', (column) => column.notNull())
    .addColumn('intended_station_id', 'uuid')
    .addColumn('intended_display_name', 'varchar(120)', (column) => column.notNull())
    .addColumn('kind', 'varchar(24)', (column) => column.notNull())
    .addColumn('token_digest', 'bytea', (column) => column.notNull().unique())
    .addColumn('status', 'varchar(16)', (column) => column.notNull())
    .addColumn('issuer_user_id', 'uuid', (column) => column.notNull())
    .addColumn('issuer_admin_identity_id', 'uuid', (column) => column.notNull())
    .addColumn('issuer_admin_session_id', 'uuid', (column) => column.notNull())
    .addColumn('issuer_capability', 'varchar(96)', (column) => column.notNull())
    .addColumn('issuer_authority_digest', 'bytea', (column) => column.notNull())
    .addColumn('expires_at', 'timestamptz', (column) => column.notNull())
    .addColumn('consumed_at', 'timestamptz')
    .addColumn('canceled_at', 'timestamptz')
    .addColumn('superseded_at', 'timestamptz')
    .addColumn('version', 'integer', (column) => column.notNull().defaultTo(0))
    .addColumn('created_at', 'timestamptz', (column) => column.notNull())
    .addColumn('updated_at', 'timestamptz', (column) => column.notNull())
    .addPrimaryKeyConstraint('station_enrollment_challenges_pk', ['tenant_id', 'challenge_id'])
    .addForeignKeyConstraint('station_enrollment_challenges_tenant_fk', ['tenant_id'], 'tenants', ['tenant_id'])
    .addForeignKeyConstraint('station_enrollment_challenges_branch_fk', ['tenant_id', 'target_branch_id'], 'branches', ['tenant_id', 'branch_id'])
    .addForeignKeyConstraint('station_enrollment_challenges_station_fk', ['tenant_id', 'intended_station_id'], 'stations', ['tenant_id', 'station_id'])
    .addCheckConstraint('station_enrollment_challenges_kind_ck', sql`kind in ('NEW_STATION', 'RELINK_STATION')`)
    .addCheckConstraint('station_enrollment_challenges_status_ck', sql`status in ('ACTIVE', 'CONSUMED', 'CANCELED', 'SUPERSEDED', 'EXPIRED')`)
    .addCheckConstraint('station_enrollment_challenges_digest_ck', sql`octet_length(token_digest) = 32 and octet_length(issuer_authority_digest) = 32`)
    .addCheckConstraint('station_enrollment_challenges_version_ck', sql`version >= 0`)
    .addCheckConstraint('station_enrollment_challenges_ttl_ck', sql`expires_at = created_at + interval '10 minutes'`)
    .addCheckConstraint('station_enrollment_challenges_kind_station_ck', sql`(kind = 'NEW_STATION' and intended_station_id is null) or (kind = 'RELINK_STATION' and intended_station_id is not null)`)
    .execute();
  await sql`create index station_enrollment_challenges_inventory_idx on station_enrollment_challenges (tenant_id, status, expires_at, created_at desc)`.execute(database);
  await sql`create unique index station_enrollment_challenges_active_station_idx on station_enrollment_challenges (tenant_id, intended_station_id) where status = 'ACTIVE' and intended_station_id is not null`.execute(database);

  await database.schema.createTable('station_enrollment_consumptions')
    .addColumn('tenant_id', 'uuid', (column) => column.notNull())
    .addColumn('challenge_id', 'uuid', (column) => column.notNull())
    .addColumn('station_id', 'uuid', (column) => column.notNull())
    .addColumn('credential_id', 'uuid', (column) => column.notNull())
    .addColumn('result_digest', 'bytea', (column) => column.notNull())
    .addColumn('consumed_at', 'timestamptz', (column) => column.notNull())
    .addPrimaryKeyConstraint('station_enrollment_consumptions_pk', ['tenant_id', 'challenge_id'])
    .addForeignKeyConstraint('station_enrollment_consumptions_challenge_fk', ['tenant_id', 'challenge_id'], 'station_enrollment_challenges', ['tenant_id', 'challenge_id'])
    .addForeignKeyConstraint('station_enrollment_consumptions_station_fk', ['tenant_id', 'station_id'], 'stations', ['tenant_id', 'station_id'])
    .addForeignKeyConstraint('station_enrollment_consumptions_credential_fk', ['credential_id'], 'station_credentials', ['credential_id'])
    .addCheckConstraint('station_enrollment_consumptions_digest_ck', sql`octet_length(result_digest) = 32`)
    .execute();

  await database.schema.createTable('station_administration_commands')
    .addColumn('tenant_id', 'uuid', (column) => column.notNull())
    .addColumn('command_kind', 'varchar(32)', (column) => column.notNull())
    .addColumn('client_request_id', 'uuid', (column) => column.notNull())
    .addColumn('request_digest', 'bytea', (column) => column.notNull())
    .addColumn('station_id', 'uuid')
    .addColumn('challenge_id', 'uuid')
    .addColumn('result_station_version', 'integer')
    .addColumn('result_challenge_version', 'integer')
    .addColumn('completed_at', 'timestamptz', (column) => column.notNull())
    .addPrimaryKeyConstraint('station_administration_commands_pk', ['tenant_id', 'command_kind', 'client_request_id'])
    .addCheckConstraint('station_administration_commands_kind_ck', sql`command_kind in ('RENAME', 'ISSUE_ENROLLMENT', 'CANCEL_ENROLLMENT', 'UNLINK', 'INITIATE_RELINK', 'REVOKE')`)
    .addCheckConstraint('station_administration_commands_digest_ck', sql`octet_length(request_digest) = 32`)
    .execute();

  await database.schema.createTable('station_audit_events')
    .addColumn('event_id', 'uuid', (column) => column.primaryKey())
    .addColumn('tenant_id', 'uuid', (column) => column.notNull())
    .addColumn('station_id', 'uuid')
    .addColumn('challenge_id', 'uuid')
    .addColumn('branch_id', 'uuid')
    .addColumn('actor_user_id', 'uuid', (column) => column.notNull())
    .addColumn('actor_admin_identity_id', 'uuid', (column) => column.notNull())
    .addColumn('admin_session_id', 'uuid', (column) => column.notNull())
    .addColumn('event_type', 'varchar(64)', (column) => column.notNull())
    .addColumn('result', 'varchar(16)', (column) => column.notNull())
    .addColumn('reason_code', 'varchar(64)', (column) => column.notNull())
    .addColumn('capability', 'varchar(96)', (column) => column.notNull())
    .addColumn('sensitivity_level', 'integer', (column) => column.notNull())
    .addColumn('correlation_id', 'uuid', (column) => column.notNull())
    .addColumn('client_request_id', 'uuid', (column) => column.notNull())
    .addColumn('station_version', 'integer')
    .addColumn('station_admission_revision', 'integer')
    .addColumn('occurred_at', 'timestamptz', (column) => column.notNull())
    .addCheckConstraint('station_audit_events_type_ck', sql`event_type in ('STATION_ENROLLMENT_ISSUED', 'STATION_ENROLLMENT_CANCELED', 'STATION_RENAMED', 'STATION_UNLINKED', 'STATION_RELINK_INITIATED', 'STATION_REVOKED', 'STATION_CREDENTIAL_REVOKED', 'STATION_SESSIONS_INVALIDATED', 'STATION_ADMISSION_REVISION_CHANGED')`)
    .addCheckConstraint('station_audit_events_result_ck', sql`result in ('SUCCEEDED', 'DENIED', 'FAILED')`)
    .addCheckConstraint('station_audit_events_level_ck', sql`sensitivity_level in (1, 2)`)
    .execute();
  await sql`create index station_audit_events_station_idx on station_audit_events (tenant_id, station_id, occurred_at desc, event_id)`.execute(database);

  await sql`
    create function stations_reject_audit_mutation()
    returns trigger language plpgsql as $function$
    begin
      raise exception 'Station audit events are append-only';
    end;
    $function$
  `.execute(database);
  await sql`create trigger station_audit_events_append_only before update or delete on station_audit_events for each row execute function stations_reject_audit_mutation()`.execute(database);
}

export async function down(database: Kysely<DatabaseSchema>): Promise<void> {
  await sql`drop trigger if exists station_audit_events_append_only on station_audit_events`.execute(database);
  await sql`drop function if exists stations_reject_audit_mutation()`.execute(database);
  await database.schema.dropTable('station_audit_events').execute();
  await database.schema.dropTable('station_administration_commands').execute();
  await database.schema.dropTable('station_enrollment_consumptions').execute();
  await database.schema.dropTable('station_enrollment_challenges').execute();
  await sql`drop index if exists station_credentials_one_current_idx`.execute(database);
  await sql`drop index if exists station_bindings_history_idx`.execute(database);
  await sql`drop index if exists station_bindings_one_current_idx`.execute(database);
  await sql`alter table station_bindings drop constraint station_bindings_pk`.execute(database);
  await database.schema.alterTable('station_bindings').dropColumn('binding_id').execute();
  await sql`alter table station_bindings add constraint station_bindings_pk primary key (tenant_id, station_id)`.execute(database);
  await sql`alter table stations alter column display_name drop not null`.execute(database);
  await database.schema.alterTable('stations').dropColumn('version').dropColumn('display_name').execute();
  await sql`alter table stations drop constraint stations_status_ck`.execute(database);
  await sql`alter table stations add constraint stations_status_ck check (status in ('active', 'revoked'))`.execute(database);
}
