import { sql } from 'kysely';
import type { Kysely } from 'kysely';

import type { DatabaseSchema } from '../database-types.js';

export async function up(database: Kysely<DatabaseSchema>): Promise<void> {
  await database.schema.createTable('registration_attempts')
    .addColumn('registration_attempt_id', 'uuid', (column) => column.primaryKey())
    .addColumn('status', 'varchar(24)', (column) => column.notNull())
    .addColumn('person_display_name', 'varchar(160)', (column) => column.notNull())
    .addColumn('workshop_display_name', 'varchar(160)', (column) => column.notNull())
    .addColumn('normalized_email', 'varchar(254)', (column) => column.notNull())
    .addColumn('email_display', 'varchar(254)', (column) => column.notNull())
    .addColumn('tenant_id', 'uuid', (column) => column.notNull().unique())
    .addColumn('first_user_id', 'uuid', (column) => column.notNull().unique())
    .addColumn('admin_identity_id', 'uuid', (column) => column.notNull().unique())
    .addColumn('acceptance_evidence_id', 'uuid', (column) => column.notNull().unique())
    .addColumn('approved_input_digest', 'bytea', (column) => column.notNull())
    .addColumn('registration_revision', 'integer', (column) => column.notNull())
    .addColumn('password_algorithm', 'varchar(24)')
    .addColumn('password_profile_version', 'integer')
    .addColumn('password_pepper_version', 'integer')
    .addColumn('password_memory_kib', 'integer')
    .addColumn('password_passes', 'integer')
    .addColumn('password_parallelism', 'integer')
    .addColumn('password_salt', 'bytea')
    .addColumn('password_verifier', 'bytea')
    .addColumn('expires_at', 'timestamptz', (column) => column.notNull())
    .addColumn('verified_at', 'timestamptz')
    .addColumn('consumed_at', 'timestamptz')
    .addColumn('version', 'integer', (column) => column.notNull().defaultTo(0))
    .addColumn('created_at', 'timestamptz', (column) => column.notNull())
    .addColumn('updated_at', 'timestamptz', (column) => column.notNull())
    .addCheckConstraint('registration_attempts_status_ck', sql`status in ('PENDING_VERIFICATION','VERIFIED','CONSUMED','EXPIRED')`)
    .addCheckConstraint('registration_attempts_digest_ck', sql`octet_length(approved_input_digest) = 32`)
    .addCheckConstraint('registration_attempts_revision_ck', sql`registration_revision >= 1 and version >= 0`)
    .addCheckConstraint('registration_attempts_lifecycle_ck', sql`
      (status = 'PENDING_VERIFICATION' and verified_at is null and consumed_at is null) or
      (status = 'VERIFIED' and verified_at is not null and consumed_at is null) or
      (status = 'CONSUMED' and verified_at is not null and consumed_at is not null and password_verifier is null and password_salt is null) or
      (status = 'EXPIRED' and consumed_at is null)
    `)
    .execute();
  await sql`create unique index registration_attempts_active_email_uq on registration_attempts(normalized_email) where status in ('PENDING_VERIFICATION','VERIFIED')`.execute(database);

  await database.schema.createTable('registration_verification_challenges')
    .addColumn('challenge_id', 'uuid', (column) => column.primaryKey())
    .addColumn('registration_attempt_id', 'uuid', (column) => column.notNull().references('registration_attempts.registration_attempt_id').onDelete('restrict'))
    .addColumn('token_digest', 'bytea', (column) => column.notNull().unique())
    .addColumn('status', 'varchar(16)', (column) => column.notNull())
    .addColumn('failure_count', 'integer', (column) => column.notNull().defaultTo(0))
    .addColumn('expires_at', 'timestamptz', (column) => column.notNull())
    .addColumn('consumed_at', 'timestamptz')
    .addColumn('superseded_at', 'timestamptz')
    .addColumn('version', 'integer', (column) => column.notNull().defaultTo(0))
    .addColumn('created_at', 'timestamptz', (column) => column.notNull())
    .addColumn('updated_at', 'timestamptz', (column) => column.notNull())
    .addCheckConstraint('registration_challenges_status_ck', sql`status in ('ACTIVE','CONSUMED','SUPERSEDED','EXPIRED')`)
    .addCheckConstraint('registration_challenges_digest_ck', sql`octet_length(token_digest) = 32`)
    .addCheckConstraint('registration_challenges_counter_ck', sql`failure_count >= 0 and version >= 0`)
    .execute();
  await sql`create unique index registration_challenges_active_attempt_uq on registration_verification_challenges(registration_attempt_id) where status = 'ACTIVE'`.execute(database);

  await database.schema.createTable('registration_acceptance_documents')
    .addColumn('acceptance_evidence_id', 'uuid', (column) => column.notNull())
    .addColumn('document_key', 'varchar(16)', (column) => column.notNull())
    .addColumn('document_version', 'varchar(64)', (column) => column.notNull())
    .addColumn('registration_attempt_id', 'uuid', (column) => column.references('registration_attempts.registration_attempt_id').onDelete('set null'))
    .addColumn('tenant_id', 'uuid')
    .addColumn('user_id', 'uuid')
    .addColumn('accepted_at', 'timestamptz', (column) => column.notNull())
    .addPrimaryKeyConstraint('registration_acceptance_documents_pk', ['acceptance_evidence_id', 'document_key'])
    .addCheckConstraint('registration_acceptance_document_key_ck', sql`document_key in ('terms','privacy')`)
    .execute();

  await database.schema.createTable('registration_email_dispatches')
    .addColumn('delivery_id', 'uuid', (column) => column.primaryKey())
    .addColumn('registration_attempt_id', 'uuid', (column) => column.notNull().references('registration_attempts.registration_attempt_id').onDelete('restrict'))
    .addColumn('challenge_id', 'uuid', (column) => column.notNull().references('registration_verification_challenges.challenge_id').onDelete('restrict'))
    .addColumn('template_key', 'varchar(64)', (column) => column.notNull())
    .addColumn('template_version', 'integer', (column) => column.notNull())
    .addColumn('status', 'varchar(12)', (column) => column.notNull())
    .addColumn('attempt_count', 'integer', (column) => column.notNull().defaultTo(0))
    .addColumn('provider_reference', 'varchar(160)')
    .addColumn('provider_reason_code', 'varchar(80)')
    .addColumn('last_attempt_at', 'timestamptz')
    .addColumn('created_at', 'timestamptz', (column) => column.notNull())
    .addColumn('updated_at', 'timestamptz', (column) => column.notNull())
    .addCheckConstraint('registration_dispatches_status_ck', sql`status in ('PENDING','DELIVERED','FAILED') and attempt_count >= 0`)
    .execute();

  await database.schema.createTable('registration_public_action_limits')
    .addColumn('principal_digest', 'bytea', (column) => column.notNull())
    .addColumn('action', 'varchar(16)', (column) => column.notNull())
    .addColumn('window_started_at', 'timestamptz', (column) => column.notNull())
    .addColumn('action_count', 'integer', (column) => column.notNull())
    .addColumn('last_action_at', 'timestamptz', (column) => column.notNull())
    .addColumn('expires_at', 'timestamptz', (column) => column.notNull())
    .addPrimaryKeyConstraint('registration_public_action_limits_pk', ['principal_digest', 'action'])
    .addCheckConstraint('registration_public_action_limits_action_ck', sql`action in ('REGISTER','RESEND','VERIFY') and action_count >= 0`)
    .execute();

  await database.schema.createTable('registration_security_events')
    .addColumn('event_id', 'uuid', (column) => column.primaryKey())
    .addColumn('registration_attempt_id', 'uuid')
    .addColumn('event_type', 'varchar(64)', (column) => column.notNull())
    .addColumn('result', 'varchar(12)', (column) => column.notNull())
    .addColumn('reason_code', 'varchar(80)', (column) => column.notNull())
    .addColumn('correlation_id', 'uuid', (column) => column.notNull())
    .addColumn('occurred_at', 'timestamptz', (column) => column.notNull())
    .addCheckConstraint('registration_security_events_result_ck', sql`result in ('SUCCEEDED','DENIED','FAILED')`)
    .execute();
}

export async function down(database: Kysely<DatabaseSchema>): Promise<void> {
  await database.schema.dropTable('registration_security_events').execute();
  await database.schema.dropTable('registration_public_action_limits').execute();
  await database.schema.dropTable('registration_email_dispatches').execute();
  await database.schema.dropTable('registration_acceptance_documents').execute();
  await database.schema.dropTable('registration_verification_challenges').execute();
  await database.schema.dropTable('registration_attempts').execute();
}
