import { sql } from 'kysely';
import type { Kysely, SqlBool } from 'kysely';

import type { DatabaseSchema } from '../database-types.js';

export async function up(database: Kysely<DatabaseSchema>): Promise<void> {
  await database.schema.createTable('access_admin_identities')
    .addColumn('tenant_id', 'uuid', (column) => column.notNull())
    .addColumn('admin_identity_id', 'uuid', (column) => column.notNull())
    .addColumn('user_id', 'uuid', (column) => column.notNull())
    .addColumn('normalized_email', 'varchar(254)', (column) => column.notNull())
    .addColumn('email_display', 'varchar(254)', (column) => column.notNull())
    .addColumn('verified_at', 'timestamptz')
    .addColumn('status', 'varchar(16)', (column) => column.notNull())
    .addColumn('identity_version', 'integer', (column) => column.notNull().defaultTo(0))
    .addColumn('created_at', 'timestamptz', (column) => column.notNull())
    .addColumn('updated_at', 'timestamptz', (column) => column.notNull())
    .addPrimaryKeyConstraint('access_admin_identities_pk', ['tenant_id', 'admin_identity_id'])
    .addUniqueConstraint('access_admin_identities_email_uq', ['normalized_email'])
    .addUniqueConstraint('access_admin_identities_user_uq', ['tenant_id', 'user_id'])
    .addForeignKeyConstraint('access_admin_identities_user_fk', ['tenant_id', 'user_id'], 'users', ['tenant_id', 'user_id'], (constraint) => constraint.onDelete('restrict'))
    .addCheckConstraint('access_admin_identities_email_ck', sql`normalized_email = lower(normalized_email) and length(normalized_email) between 3 and 254 and position('@' in normalized_email) > 1`)
    .addCheckConstraint('access_admin_identities_status_ck', sql`status in ('active', 'revoked')`)
    .addCheckConstraint('access_admin_identities_version_ck', sql`identity_version >= 0`)
    .addCheckConstraint('access_admin_identities_time_ck', sql`updated_at >= created_at`)
    .execute();

  await database.schema.createTable('access_admin_password_credentials')
    .addColumn('tenant_id', 'uuid', (column) => column.notNull())
    .addColumn('admin_identity_id', 'uuid', (column) => column.notNull())
    .addColumn('user_id', 'uuid', (column) => column.notNull())
    .addColumn('status', 'varchar(16)', (column) => column.notNull())
    .addColumn('algorithm', 'varchar(16)', (column) => column.notNull())
    .addColumn('profile_version', 'integer', (column) => column.notNull())
    .addColumn('pepper_version', 'integer', (column) => column.notNull())
    .addColumn('memory_kib', 'integer', (column) => column.notNull())
    .addColumn('passes', 'integer', (column) => column.notNull())
    .addColumn('parallelism', 'integer', (column) => column.notNull())
    .addColumn('salt', 'bytea', (column) => column.notNull())
    .addColumn('verifier', 'bytea', (column) => column.notNull())
    .addColumn('credential_version', 'integer', (column) => column.notNull().defaultTo(1))
    .addColumn('session_revision', 'integer', (column) => column.notNull().defaultTo(1))
    .addColumn('created_at', 'timestamptz', (column) => column.notNull())
    .addColumn('updated_at', 'timestamptz', (column) => column.notNull())
    .addColumn('revoked_at', 'timestamptz')
    .addPrimaryKeyConstraint('access_admin_password_credentials_pk', ['tenant_id', 'admin_identity_id'])
    .addForeignKeyConstraint('access_admin_password_credentials_identity_fk', ['tenant_id', 'admin_identity_id'], 'access_admin_identities', ['tenant_id', 'admin_identity_id'], (constraint) => constraint.onDelete('restrict'))
    .addForeignKeyConstraint('access_admin_password_credentials_user_fk', ['tenant_id', 'user_id'], 'users', ['tenant_id', 'user_id'], (constraint) => constraint.onDelete('restrict'))
    .addCheckConstraint('access_admin_password_credentials_status_ck', sql`status in ('active', 'revoked')`)
    .addCheckConstraint('access_admin_password_credentials_profile_ck', sql`algorithm = 'argon2id' and profile_version = 1 and pepper_version = 1 and memory_kib = 65536 and passes = 3 and parallelism = 4 and octet_length(salt) = 16 and octet_length(verifier) = 32`)
    .addCheckConstraint('access_admin_password_credentials_version_ck', sql`credential_version >= 1 and session_revision >= 1`)
    .addCheckConstraint('access_admin_password_credentials_state_ck', sql`(status = 'active' and revoked_at is null) or (status = 'revoked' and revoked_at is not null)`)
    .execute();

  await database.schema.createTable('access_admin_sessions')
    .addColumn('tenant_id', 'uuid', (column) => column.notNull())
    .addColumn('session_id', 'uuid', (column) => column.notNull())
    .addColumn('user_id', 'uuid', (column) => column.notNull())
    .addColumn('admin_identity_id', 'uuid', (column) => column.notNull())
    .addColumn('user_admission_revision', 'integer', (column) => column.notNull())
    .addColumn('identity_version', 'integer', (column) => column.notNull())
    .addColumn('credential_version', 'integer', (column) => column.notNull())
    .addColumn('session_revision', 'integer', (column) => column.notNull())
    .addColumn('token_verifier', 'bytea', (column) => column.notNull())
    .addColumn('csrf_verifier', 'bytea', (column) => column.notNull())
    .addColumn('status', 'varchar(16)', (column) => column.notNull())
    .addColumn('version', 'integer', (column) => column.notNull().defaultTo(0))
    .addColumn('issued_at', 'timestamptz', (column) => column.notNull())
    .addColumn('last_activity_at', 'timestamptz', (column) => column.notNull())
    .addColumn('expires_at', 'timestamptz', (column) => column.notNull())
    .addColumn('reauthenticated_at', 'timestamptz')
    .addColumn('ended_at', 'timestamptz')
    .addPrimaryKeyConstraint('access_admin_sessions_pk', ['tenant_id', 'session_id'])
    .addUniqueConstraint('access_admin_sessions_token_uq', ['token_verifier'])
    .addForeignKeyConstraint('access_admin_sessions_identity_fk', ['tenant_id', 'admin_identity_id'], 'access_admin_identities', ['tenant_id', 'admin_identity_id'], (constraint) => constraint.onDelete('restrict'))
    .addForeignKeyConstraint('access_admin_sessions_user_fk', ['tenant_id', 'user_id'], 'users', ['tenant_id', 'user_id'], (constraint) => constraint.onDelete('restrict'))
    .addCheckConstraint('access_admin_sessions_status_ck', sql`status in ('active', 'expired', 'logged_out', 'revoked')`)
    .addCheckConstraint('access_admin_sessions_verifier_ck', sql`octet_length(token_verifier) = 32 and octet_length(csrf_verifier) = 32`)
    .addCheckConstraint('access_admin_sessions_version_ck', sql`user_admission_revision >= 0 and identity_version >= 0 and credential_version >= 1 and session_revision >= 1 and version >= 0`)
    .addCheckConstraint('access_admin_sessions_time_ck', sql`last_activity_at >= issued_at and last_activity_at <= expires_at and expires_at = issued_at + interval '12 hours' and (reauthenticated_at is null or reauthenticated_at between issued_at and expires_at) and ((status = 'active' and ended_at is null) or (status <> 'active' and ended_at is not null))`)
    .execute();
  await database.schema.createIndex('access_admin_sessions_active_user_idx').on('access_admin_sessions').columns(['tenant_id', 'user_id']).where(sql<SqlBool>`status = 'active'`).execute();

  await database.schema.createTable('access_admin_auth_attempt_limits')
    .addColumn('principal_digest', 'bytea', (column) => column.notNull().primaryKey())
    .addColumn('attempt_count', 'integer', (column) => column.notNull())
    .addColumn('window_started_at', 'timestamptz', (column) => column.notNull())
    .addColumn('blocked_until', 'timestamptz')
    .addColumn('updated_at', 'timestamptz', (column) => column.notNull())
    .addCheckConstraint('access_admin_auth_attempt_limits_digest_ck', sql`octet_length(principal_digest) = 32`)
    .addCheckConstraint('access_admin_auth_attempt_limits_count_ck', sql`attempt_count between 0 and 5`)
    .execute();

  await database.schema.createTable('access_admin_recovery_challenges')
    .addColumn('tenant_id', 'uuid', (column) => column.notNull())
    .addColumn('challenge_id', 'uuid', (column) => column.notNull())
    .addColumn('admin_identity_id', 'uuid', (column) => column.notNull())
    .addColumn('user_id', 'uuid', (column) => column.notNull())
    .addColumn('token_verifier', 'bytea', (column) => column.notNull())
    .addColumn('identity_version', 'integer', (column) => column.notNull())
    .addColumn('credential_version', 'integer', (column) => column.notNull())
    .addColumn('status', 'varchar(16)', (column) => column.notNull())
    .addColumn('version', 'integer', (column) => column.notNull().defaultTo(0))
    .addColumn('issued_at', 'timestamptz', (column) => column.notNull())
    .addColumn('expires_at', 'timestamptz', (column) => column.notNull())
    .addColumn('consumed_at', 'timestamptz')
    .addPrimaryKeyConstraint('access_admin_recovery_challenges_pk', ['tenant_id', 'challenge_id'])
    .addUniqueConstraint('access_admin_recovery_challenges_token_uq', ['token_verifier'])
    .addForeignKeyConstraint('access_admin_recovery_challenges_identity_fk', ['tenant_id', 'admin_identity_id'], 'access_admin_identities', ['tenant_id', 'admin_identity_id'], (constraint) => constraint.onDelete('restrict'))
    .addCheckConstraint('access_admin_recovery_challenges_status_ck', sql`status in ('active', 'consumed', 'expired', 'cancelled')`)
    .addCheckConstraint('access_admin_recovery_challenges_token_ck', sql`octet_length(token_verifier) = 32`)
    .addCheckConstraint('access_admin_recovery_challenges_time_ck', sql`expires_at = issued_at + interval '30 minutes' and ((status = 'consumed' and consumed_at is not null) or (status <> 'consumed' and consumed_at is null))`)
    .execute();

  await database.schema.createTable('access_admin_security_events')
    .addColumn('tenant_id', 'uuid', (column) => column.notNull())
    .addColumn('event_id', 'uuid', (column) => column.notNull())
    .addColumn('user_id', 'uuid')
    .addColumn('admin_identity_id', 'uuid')
    .addColumn('session_id', 'uuid')
    .addColumn('event_type', 'varchar(48)', (column) => column.notNull())
    .addColumn('result', 'varchar(16)', (column) => column.notNull())
    .addColumn('reason_code', 'varchar(64)', (column) => column.notNull())
    .addColumn('correlation_id', 'uuid', (column) => column.notNull())
    .addColumn('occurred_at', 'timestamptz', (column) => column.notNull())
    .addPrimaryKeyConstraint('access_admin_security_events_pk', ['tenant_id', 'event_id'])
    .addCheckConstraint('access_admin_security_events_result_ck', sql`result in ('SUCCEEDED', 'DENIED')`)
    .addCheckConstraint('access_admin_security_events_reason_ck', sql`reason_code ~ '^[A-Z][A-Z0-9_]{2,63}$'`)
    .execute();

  await sql`create function access_reject_admin_security_event_mutation() returns trigger language plpgsql as $function$ begin raise exception 'Administrative security events are append-only.' using errcode = '23514'; end; $function$`.execute(database);
  await sql`create trigger access_admin_security_events_reject_update before update on access_admin_security_events for each row execute function access_reject_admin_security_event_mutation()`.execute(database);
  await sql`create trigger access_admin_security_events_reject_delete before delete on access_admin_security_events for each row execute function access_reject_admin_security_event_mutation()`.execute(database);
}

export async function down(database: Kysely<DatabaseSchema>): Promise<void> {
  await database.schema.dropTable('access_admin_security_events').execute();
  await sql`drop function access_reject_admin_security_event_mutation()`.execute(database);
  await database.schema.dropTable('access_admin_recovery_challenges').execute();
  await database.schema.dropTable('access_admin_auth_attempt_limits').execute();
  await database.schema.dropTable('access_admin_sessions').execute();
  await database.schema.dropTable('access_admin_password_credentials').execute();
  await database.schema.dropTable('access_admin_identities').execute();
}
