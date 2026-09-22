import { sql, type Kysely, type SqlBool } from 'kysely';

import type { DatabaseSchema } from '../database-types.js';

export async function up(database: Kysely<DatabaseSchema>): Promise<void> {
  await database.schema.createTable('access_admin_invitations')
    .addColumn('tenant_id', 'uuid', (column) => column.notNull())
    .addColumn('invitation_id', 'uuid', (column) => column.notNull())
    .addColumn('normalized_email', 'varchar(320)', (column) => column.notNull())
    .addColumn('email_display', 'varchar(320)', (column) => column.notNull())
    .addColumn('target_user_id', 'uuid')
    .addColumn('proposed_display_name', 'varchar(160)')
    .addColumn('inviter_user_id', 'uuid', (column) => column.notNull())
    .addColumn('inviter_admin_identity_id', 'uuid', (column) => column.notNull())
    .addColumn('status', 'varchar(16)', (column) => column.notNull())
    .addColumn('version', 'integer', (column) => column.notNull().defaultTo(0))
    .addColumn('authority_revision', 'integer', (column) => column.notNull())
    .addColumn('intended_grants_digest', 'bytea', (column) => column.notNull())
    .addColumn('expires_at', 'timestamptz', (column) => column.notNull())
    .addColumn('accepted_at', 'timestamptz')
    .addColumn('revoked_at', 'timestamptz')
    .addColumn('created_at', 'timestamptz', (column) => column.notNull())
    .addColumn('updated_at', 'timestamptz', (column) => column.notNull())
    .addPrimaryKeyConstraint('access_admin_invitations_pk', ['tenant_id', 'invitation_id'])
    .addUniqueConstraint('access_admin_invitations_id_tenant_uq', ['invitation_id', 'tenant_id'])
    .addForeignKeyConstraint('access_admin_invitations_tenant_fk', ['tenant_id'], 'tenants', ['tenant_id'], (constraint) => constraint.onUpdate('restrict').onDelete('restrict'))
    .addForeignKeyConstraint('access_admin_invitations_target_user_fk', ['tenant_id', 'target_user_id'], 'users', ['tenant_id', 'user_id'], (constraint) => constraint.onUpdate('restrict').onDelete('restrict'))
    .addForeignKeyConstraint('access_admin_invitations_inviter_user_fk', ['tenant_id', 'inviter_user_id'], 'users', ['tenant_id', 'user_id'], (constraint) => constraint.onUpdate('restrict').onDelete('restrict'))
    .addForeignKeyConstraint('access_admin_invitations_inviter_identity_fk', ['tenant_id', 'inviter_admin_identity_id'], 'access_admin_identities', ['tenant_id', 'admin_identity_id'], (constraint) => constraint.onUpdate('restrict').onDelete('restrict'))
    .addCheckConstraint('access_admin_invitations_email_ck', sql`normalized_email = lower(btrim(normalized_email)) and normalized_email like '%@%' and length(btrim(email_display)) > 0`)
    .addCheckConstraint('access_admin_invitations_status_ck', sql`status in ('PENDING', 'ACCEPTED', 'EXPIRED', 'REVOKED')`)
    .addCheckConstraint('access_admin_invitations_version_ck', sql`version >= 0 and authority_revision >= 0 and octet_length(intended_grants_digest) = 32`)
    .addCheckConstraint('access_admin_invitations_time_ck', sql`expires_at = created_at + interval '24 hours' and updated_at >= created_at and ((status = 'ACCEPTED' and accepted_at is not null and revoked_at is null) or (status = 'REVOKED' and revoked_at is not null and accepted_at is null) or (status in ('PENDING', 'EXPIRED') and accepted_at is null and revoked_at is null))`)
    .addCheckConstraint('access_admin_invitations_target_ck', sql`(target_user_id is not null and proposed_display_name is null) or (target_user_id is null and proposed_display_name is not null and length(btrim(proposed_display_name)) > 0)`)
    .execute();
  await database.schema.createIndex('access_admin_invitations_pending_email_uq')
    .on('access_admin_invitations').columns(['tenant_id', 'normalized_email']).unique()
    .where(sql<SqlBool>`status = 'PENDING'`).execute();

  await database.schema.createTable('access_admin_invitation_grants')
    .addColumn('tenant_id', 'uuid', (column) => column.notNull())
    .addColumn('invitation_id', 'uuid', (column) => column.notNull())
    .addColumn('grant_index', 'integer', (column) => column.notNull())
    .addColumn('role_id', 'uuid', (column) => column.notNull())
    .addColumn('role_version', 'integer', (column) => column.notNull())
    .addColumn('assignment_scope', 'varchar(24)', (column) => column.notNull())
    .addColumn('branch_id', 'uuid')
    .addColumn('created_at', 'timestamptz', (column) => column.notNull())
    .addPrimaryKeyConstraint('access_admin_invitation_grants_pk', ['tenant_id', 'invitation_id', 'grant_index'])
    .addForeignKeyConstraint('access_admin_invitation_grants_invitation_fk', ['tenant_id', 'invitation_id'], 'access_admin_invitations', ['tenant_id', 'invitation_id'], (constraint) => constraint.onUpdate('restrict').onDelete('restrict'))
    .addForeignKeyConstraint('access_admin_invitation_grants_role_fk', ['tenant_id', 'role_id'], 'access_roles', ['tenant_id', 'role_id'], (constraint) => constraint.onUpdate('restrict').onDelete('restrict'))
    .addForeignKeyConstraint('access_admin_invitation_grants_branch_fk', ['tenant_id', 'branch_id'], 'branches', ['tenant_id', 'branch_id'], (constraint) => constraint.onUpdate('restrict').onDelete('restrict'))
    .addCheckConstraint('access_admin_invitation_grants_index_ck', sql`grant_index >= 0 and role_version >= 0`)
    .addCheckConstraint('access_admin_invitation_grants_scope_ck', sql`(assignment_scope = 'TENANT_WIDE' and branch_id is null) or (assignment_scope = 'BRANCH_RESTRICTED' and branch_id is not null)`)
    .execute();

  await database.schema.createTable('access_admin_invitation_challenges')
    .addColumn('tenant_id', 'uuid', (column) => column.notNull())
    .addColumn('challenge_id', 'uuid', (column) => column.notNull())
    .addColumn('invitation_id', 'uuid', (column) => column.notNull())
    .addColumn('token_digest', 'bytea', (column) => column.notNull())
    .addColumn('status', 'varchar(16)', (column) => column.notNull())
    .addColumn('version', 'integer', (column) => column.notNull().defaultTo(0))
    .addColumn('expires_at', 'timestamptz', (column) => column.notNull())
    .addColumn('consumed_at', 'timestamptz')
    .addColumn('superseded_at', 'timestamptz')
    .addColumn('created_at', 'timestamptz', (column) => column.notNull())
    .addColumn('updated_at', 'timestamptz', (column) => column.notNull())
    .addPrimaryKeyConstraint('access_admin_invitation_challenges_pk', ['tenant_id', 'challenge_id'])
    .addUniqueConstraint('access_admin_invitation_challenges_digest_uq', ['token_digest'])
    .addForeignKeyConstraint('access_admin_invitation_challenges_invitation_fk', ['tenant_id', 'invitation_id'], 'access_admin_invitations', ['tenant_id', 'invitation_id'], (constraint) => constraint.onUpdate('restrict').onDelete('restrict'))
    .addCheckConstraint('access_admin_invitation_challenges_digest_ck', sql`octet_length(token_digest) = 32`)
    .addCheckConstraint('access_admin_invitation_challenges_status_ck', sql`status in ('ACTIVE', 'CONSUMED', 'SUPERSEDED', 'EXPIRED')`)
    .addCheckConstraint('access_admin_invitation_challenges_time_ck', sql`expires_at = created_at + interval '24 hours' and updated_at >= created_at and ((status = 'CONSUMED' and consumed_at is not null and superseded_at is null) or (status = 'SUPERSEDED' and superseded_at is not null and consumed_at is null) or (status in ('ACTIVE', 'EXPIRED') and consumed_at is null and superseded_at is null))`)
    .execute();
  await database.schema.createIndex('access_admin_invitation_challenges_active_uq')
    .on('access_admin_invitation_challenges').columns(['tenant_id', 'invitation_id']).unique()
    .where(sql<SqlBool>`status = 'ACTIVE'`).execute();

  await database.schema.createTable('access_admin_invitation_dispatches')
    .addColumn('tenant_id', 'uuid', (column) => column.notNull())
    .addColumn('delivery_id', 'uuid', (column) => column.notNull())
    .addColumn('invitation_id', 'uuid', (column) => column.notNull())
    .addColumn('challenge_id', 'uuid', (column) => column.notNull())
    .addColumn('template_key', 'varchar(48)', (column) => column.notNull())
    .addColumn('template_version', 'integer', (column) => column.notNull())
    .addColumn('destination', 'varchar(320)', (column) => column.notNull())
    .addColumn('status', 'varchar(16)', (column) => column.notNull())
    .addColumn('attempt_count', 'integer', (column) => column.notNull().defaultTo(0))
    .addColumn('provider_reference', 'varchar(160)')
    .addColumn('reason_code', 'varchar(64)', (column) => column.notNull())
    .addColumn('created_at', 'timestamptz', (column) => column.notNull())
    .addColumn('updated_at', 'timestamptz', (column) => column.notNull())
    .addPrimaryKeyConstraint('access_admin_invitation_dispatches_pk', ['tenant_id', 'delivery_id'])
    .addForeignKeyConstraint('access_admin_invitation_dispatches_challenge_fk', ['tenant_id', 'challenge_id'], 'access_admin_invitation_challenges', ['tenant_id', 'challenge_id'], (constraint) => constraint.onUpdate('restrict').onDelete('restrict'))
    .addForeignKeyConstraint('access_admin_invitation_dispatches_invitation_fk', ['tenant_id', 'invitation_id'], 'access_admin_invitations', ['tenant_id', 'invitation_id'], (constraint) => constraint.onUpdate('restrict').onDelete('restrict'))
    .addCheckConstraint('access_admin_invitation_dispatches_template_ck', sql`template_key = 'admin-invitation' and template_version = 1`)
    .addCheckConstraint('access_admin_invitation_dispatches_status_ck', sql`status in ('PENDING', 'DELIVERED', 'FAILED') and attempt_count >= 0`)
    .addCheckConstraint('access_admin_invitation_dispatches_reason_ck', sql`reason_code ~ '^[A-Z][A-Z0-9_]{2,63}$' and updated_at >= created_at`)
    .execute();

  await database.schema.createTable('access_admin_invitation_commands')
    .addColumn('tenant_id', 'uuid', (column) => column.notNull())
    .addColumn('client_request_id', 'uuid', (column) => column.notNull())
    .addColumn('command_type', 'varchar(16)', (column) => column.notNull())
    .addColumn('invitation_id', 'uuid', (column) => column.notNull())
    .addColumn('request_fingerprint', 'bytea', (column) => column.notNull())
    .addColumn('result_status', 'varchar(16)', (column) => column.notNull())
    .addColumn('result_version', 'integer', (column) => column.notNull())
    .addColumn('applied_at', 'timestamptz', (column) => column.notNull())
    .addPrimaryKeyConstraint('access_admin_invitation_commands_pk', ['tenant_id', 'client_request_id'])
    .addForeignKeyConstraint('access_admin_invitation_commands_invitation_fk', ['tenant_id', 'invitation_id'], 'access_admin_invitations', ['tenant_id', 'invitation_id'], (constraint) => constraint.onUpdate('restrict').onDelete('restrict'))
    .addCheckConstraint('access_admin_invitation_commands_type_ck', sql`command_type in ('ISSUE', 'RESEND', 'REVOKE', 'ACCEPT')`)
    .addCheckConstraint('access_admin_invitation_commands_result_ck', sql`result_status in ('PENDING', 'ACCEPTED', 'EXPIRED', 'REVOKED') and result_version >= 0 and octet_length(request_fingerprint) = 32`)
    .execute();

  await database.schema.createTable('access_admin_lifecycle_events')
    .addColumn('tenant_id', 'uuid', (column) => column.notNull())
    .addColumn('event_id', 'uuid', (column) => column.notNull())
    .addColumn('actor_user_id', 'uuid')
    .addColumn('actor_admin_identity_id', 'uuid')
    .addColumn('session_id', 'uuid')
    .addColumn('target_user_id', 'uuid')
    .addColumn('role_id', 'uuid')
    .addColumn('assignment_id', 'uuid')
    .addColumn('invitation_id', 'uuid')
    .addColumn('branch_id', 'uuid')
    .addColumn('event_type', 'varchar(64)', (column) => column.notNull())
    .addColumn('result', 'varchar(16)', (column) => column.notNull())
    .addColumn('reason_code', 'varchar(64)', (column) => column.notNull())
    .addColumn('sensitivity_level', 'smallint', (column) => column.notNull())
    .addColumn('correlation_id', 'uuid', (column) => column.notNull())
    .addColumn('occurred_at', 'timestamptz', (column) => column.notNull())
    .addPrimaryKeyConstraint('access_admin_lifecycle_events_pk', ['tenant_id', 'event_id'])
    .addForeignKeyConstraint('access_admin_lifecycle_events_tenant_fk', ['tenant_id'], 'tenants', ['tenant_id'], (constraint) => constraint.onUpdate('restrict').onDelete('restrict'))
    .addCheckConstraint('access_admin_lifecycle_events_type_ck', sql`event_type in ('INVITATION_ISSUED','INVITATION_RESENT','INVITATION_REVOKED','INVITATION_ACCEPTED','USER_ACTIVATED','USER_DEACTIVATED','ADMIN_IDENTITY_ESTABLISHED','ADMIN_IDENTITY_REVOKED','ROLE_CREATED','ROLE_UPDATED','ROLE_DEACTIVATED','ROLE_REACTIVATED','ROLE_ASSIGNED','ROLE_UNASSIGNED','TENANT_ADMIN_GRANTED','TENANT_ADMIN_REVOKED')`)
    .addCheckConstraint('access_admin_lifecycle_events_result_ck', sql`result in ('SUCCEEDED', 'DENIED') and reason_code ~ '^[A-Z][A-Z0-9_]{2,63}$' and sensitivity_level in (1, 2)`)
    .execute();
  await sql`create trigger access_admin_lifecycle_events_reject_update before update on access_admin_lifecycle_events for each row execute function access_reject_admin_security_event_mutation()`.execute(database);
  await sql`create trigger access_admin_lifecycle_events_reject_delete before delete on access_admin_lifecycle_events for each row execute function access_reject_admin_security_event_mutation()`.execute(database);
}

export async function down(database: Kysely<DatabaseSchema>): Promise<void> {
  await database.schema.dropTable('access_admin_lifecycle_events').execute();
  await database.schema.dropTable('access_admin_invitation_commands').execute();
  await database.schema.dropTable('access_admin_invitation_dispatches').execute();
  await database.schema.dropTable('access_admin_invitation_challenges').execute();
  await database.schema.dropTable('access_admin_invitation_grants').execute();
  await database.schema.dropTable('access_admin_invitations').execute();
}
