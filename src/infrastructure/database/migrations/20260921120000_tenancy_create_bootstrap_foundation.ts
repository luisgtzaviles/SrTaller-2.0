import { sql } from 'kysely';
import type { Kysely } from 'kysely';

import type { DatabaseSchema } from '../database-types.js';

export async function up(database: Kysely<DatabaseSchema>): Promise<void> {
  await database.schema.alterTable('tenants')
    .addColumn('display_name', 'varchar(160)')
    .addColumn('lifecycle_status', 'varchar(16)')
    .addColumn('version', 'integer', (column) => column.notNull().defaultTo(0))
    .addColumn('updated_at', 'timestamptz')
    .execute();

  await sql`
    do $block$
    begin
      if exists (
        select 1
        from tenants
        where tenant_id <> '00000000-0000-4000-8000-000000000001'::uuid
      ) then
        raise exception 'TENANT_DISPLAY_NAME_BACKFILL_REQUIRED'
          using errcode = '23514';
      end if;
    end
    $block$
  `.execute(database);

  await database.updateTable('tenants')
    .set({
      display_name: 'SR Taller',
      lifecycle_status: 'ONBOARDING',
      updated_at: sql<Date>`created_at`,
    })
    .where('tenant_id', '=', '00000000-0000-4000-8000-000000000001')
    .execute();

  await database.schema.alterTable('tenants')
    .alterColumn('display_name', (column) => column.setNotNull())
    .alterColumn('lifecycle_status', (column) => column.setNotNull())
    .alterColumn('updated_at', (column) => column.setNotNull())
    .execute();
  await database.schema.alterTable('tenants').addCheckConstraint(
      'tenants_display_name_ck',
      sql`length(btrim(display_name)) between 1 and 160`,
    ).execute();
  await database.schema.alterTable('tenants').addCheckConstraint(
      'tenants_lifecycle_status_ck',
      sql`lifecycle_status in ('ONBOARDING', 'ACTIVE')`,
    ).execute();
  await database.schema.alterTable('tenants')
    .addCheckConstraint('tenants_version_ck', sql`version >= 0`).execute();
  await database.schema.alterTable('tenants').addCheckConstraint(
      'tenants_updated_at_ck',
      sql`updated_at >= created_at`,
    ).execute();

  await database.schema.createTable('tenant_bootstrap_commands')
    .addColumn('verified_registration_id', 'uuid', (column) => column.notNull())
    .addColumn('registration_revision', 'integer', (column) => column.notNull())
    .addColumn('approved_input_digest', 'bytea', (column) => column.notNull())
    .addColumn('tenant_id', 'uuid', (column) => column.notNull())
    .addColumn('first_user_id', 'uuid', (column) => column.notNull())
    .addColumn('admin_identity_id', 'uuid', (column) => column.notNull())
    .addColumn('starter_role_id', 'uuid', (column) => column.notNull())
    .addColumn('starter_policy_version', 'integer', (column) => column.notNull())
    .addColumn('starter_assignment_id', 'uuid', (column) => column.notNull())
    .addColumn('result_tenant_status', 'varchar(16)', (column) => column.notNull())
    .addColumn('completed_at', 'timestamptz', (column) => column.notNull())
    .addPrimaryKeyConstraint('tenant_bootstrap_commands_pk', [
      'verified_registration_id',
    ])
    .addUniqueConstraint('tenant_bootstrap_commands_tenant_uq', ['tenant_id'])
    .addForeignKeyConstraint(
      'tenant_bootstrap_commands_tenant_fk',
      ['tenant_id'],
      'tenants',
      ['tenant_id'],
      (constraint) => constraint.onUpdate('restrict').onDelete('restrict'),
    )
    .addForeignKeyConstraint(
      'tenant_bootstrap_commands_user_fk',
      ['tenant_id', 'first_user_id'],
      'users',
      ['tenant_id', 'user_id'],
      (constraint) => constraint.onUpdate('restrict').onDelete('restrict'),
    )
    .addForeignKeyConstraint(
      'tenant_bootstrap_commands_identity_fk',
      ['tenant_id', 'admin_identity_id'],
      'access_admin_identities',
      ['tenant_id', 'admin_identity_id'],
      (constraint) => constraint.onUpdate('restrict').onDelete('restrict'),
    )
    .addForeignKeyConstraint(
      'tenant_bootstrap_commands_role_fk',
      ['tenant_id', 'starter_role_id'],
      'access_roles',
      ['tenant_id', 'role_id'],
      (constraint) => constraint.onUpdate('restrict').onDelete('restrict'),
    )
    .addForeignKeyConstraint(
      'tenant_bootstrap_commands_assignment_fk',
      ['tenant_id', 'starter_assignment_id'],
      'access_role_assignments',
      ['tenant_id', 'assignment_id'],
      (constraint) => constraint.onUpdate('restrict').onDelete('restrict'),
    )
    .addCheckConstraint(
      'tenant_bootstrap_commands_revision_ck',
      sql`registration_revision >= 1 and starter_policy_version >= 1`,
    )
    .addCheckConstraint(
      'tenant_bootstrap_commands_digest_ck',
      sql`octet_length(approved_input_digest) = 32`,
    )
    .addCheckConstraint(
      'tenant_bootstrap_commands_status_ck',
      sql`result_tenant_status = 'ONBOARDING'`,
    )
    .execute();

  await sql`
    create function tenancy_reject_bootstrap_command_mutation()
    returns trigger language plpgsql as $function$
    begin
      raise exception 'Tenant bootstrap results are append-only.'
        using errcode = '23514';
    end;
    $function$
  `.execute(database);
  await sql`
    create trigger tenant_bootstrap_commands_reject_update
    before update on tenant_bootstrap_commands
    for each row execute function tenancy_reject_bootstrap_command_mutation()
  `.execute(database);
  await sql`
    create trigger tenant_bootstrap_commands_reject_delete
    before delete on tenant_bootstrap_commands
    for each row execute function tenancy_reject_bootstrap_command_mutation()
  `.execute(database);
}

export async function down(database: Kysely<DatabaseSchema>): Promise<void> {
  await database.schema.dropTable('tenant_bootstrap_commands').execute();
  await sql`drop function tenancy_reject_bootstrap_command_mutation()`.execute(database);
  await database.schema.alterTable('tenants').dropConstraint('tenants_updated_at_ck').execute();
  await database.schema.alterTable('tenants').dropConstraint('tenants_version_ck').execute();
  await database.schema.alterTable('tenants').dropConstraint('tenants_lifecycle_status_ck').execute();
  await database.schema.alterTable('tenants').dropConstraint('tenants_display_name_ck').execute();
  await database.schema.alterTable('tenants')
    .dropColumn('updated_at')
    .dropColumn('version')
    .dropColumn('lifecycle_status')
    .dropColumn('display_name')
    .execute();
}
