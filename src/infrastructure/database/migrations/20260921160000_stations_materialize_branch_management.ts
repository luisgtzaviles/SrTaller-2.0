import { sql } from 'kysely';
import type { Kysely } from 'kysely';

import type { DatabaseSchema } from '../database-types.js';

const legacyBranchNames = Object.freeze([
  Object.freeze({
    branchId: '00000000-0000-4000-8000-000000000101',
    displayName: 'SR Taller Fixture — Hermosillo',
  }),
  Object.freeze({
    branchId: '00000000-0000-4000-8000-000000000102',
    displayName: 'SR Taller Fixture — Tijuana',
  }),
]);

export async function up(database: Kysely<DatabaseSchema>): Promise<void> {
  await database.schema.alterTable('branches')
    .addColumn('display_name', 'varchar(160)')
    .addColumn('version', 'integer', (column) => column.notNull().defaultTo(0))
    .addColumn('updated_at', 'timestamptz')
    .execute();

  for (const mapping of legacyBranchNames) {
    await database.updateTable('branches')
      .set({ display_name: mapping.displayName, updated_at: sql.ref('created_at') })
      .where('branch_id', '=', mapping.branchId)
      .execute();
  }

  const unmapped = await sql<{ branch_id: string }>`
    select branch_id::text as branch_id
    from branches
    where display_name is null
    order by branch_id
  `.execute(database);
  if (unmapped.rows.length > 0) {
    throw new Error(`TL-05 requires explicit Owner mapping for legacy Branches: ${unmapped.rows.map((row) => row.branch_id).join(', ')}`);
  }

  await sql`alter table branches alter column display_name set not null`.execute(database);
  await sql`alter table branches alter column updated_at set not null`.execute(database);
  await sql`alter table branches alter column time_zone drop default`.execute(database);
  await sql`alter table branches add constraint branches_display_name_ck check (display_name = btrim(display_name) and length(display_name) between 1 and 160)`.execute(database);
  await sql`alter table branches add constraint branches_version_ck check (version >= 0)`.execute(database);
  await sql`alter table branches add constraint branches_updated_at_ck check (updated_at >= created_at)`.execute(database);
  await sql`create index branches_tenant_active_idx on branches(tenant_id, active, branch_id)`.execute(database);

  await database.schema.createTable('branch_commands')
    .addColumn('tenant_id', 'uuid', (column) => column.notNull())
    .addColumn('command_kind', 'varchar(16)', (column) => column.notNull())
    .addColumn('client_request_id', 'uuid', (column) => column.notNull())
    .addColumn('request_digest', 'bytea', (column) => column.notNull())
    .addColumn('branch_id', 'uuid', (column) => column.notNull())
    .addColumn('result_display_name', 'varchar(160)', (column) => column.notNull())
    .addColumn('result_time_zone', 'text', (column) => column.notNull())
    .addColumn('result_version', 'integer', (column) => column.notNull())
    .addColumn('result_status', 'varchar(12)', (column) => column.notNull())
    .addColumn('result_admission_revision', 'integer', (column) => column.notNull())
    .addColumn('result_created_at', 'timestamptz', (column) => column.notNull())
    .addColumn('result_updated_at', 'timestamptz', (column) => column.notNull())
    .addColumn('completed_at', 'timestamptz', (column) => column.notNull())
    .addPrimaryKeyConstraint('branch_commands_pk', ['tenant_id', 'command_kind', 'client_request_id'])
    .addForeignKeyConstraint('branch_commands_tenant_fk', ['tenant_id'], 'tenants', ['tenant_id'], (constraint) => constraint.onDelete('restrict'))
    .addForeignKeyConstraint('branch_commands_branch_fk', ['tenant_id', 'branch_id'], 'branches', ['tenant_id', 'branch_id'], (constraint) => constraint.onDelete('restrict'))
    .addCheckConstraint('branch_commands_kind_ck', sql`command_kind in ('CREATE','UPDATE','DEACTIVATE','REACTIVATE')`)
    .addCheckConstraint('branch_commands_digest_ck', sql`octet_length(request_digest) = 32`)
    .addCheckConstraint('branch_commands_result_ck', sql`result_version >= 0 and result_admission_revision >= 0 and result_status in ('ACTIVE','INACTIVE') and result_updated_at >= result_created_at`)
    .execute();

  await database.schema.createTable('branch_audit_events')
    .addColumn('event_id', 'uuid', (column) => column.primaryKey())
    .addColumn('tenant_id', 'uuid', (column) => column.notNull())
    .addColumn('branch_id', 'uuid', (column) => column.notNull())
    .addColumn('actor_user_id', 'uuid', (column) => column.notNull())
    .addColumn('actor_display_name', 'varchar(160)', (column) => column.notNull())
    .addColumn('admin_session_id', 'uuid', (column) => column.notNull())
    .addColumn('event_type', 'varchar(32)', (column) => column.notNull())
    .addColumn('capability', 'varchar(80)', (column) => column.notNull())
    .addColumn('correlation_id', 'uuid', (column) => column.notNull())
    .addColumn('client_request_id', 'uuid', (column) => column.notNull())
    .addColumn('branch_version', 'integer', (column) => column.notNull())
    .addColumn('occurred_at', 'timestamptz', (column) => column.notNull())
    .addForeignKeyConstraint('branch_audit_events_branch_fk', ['tenant_id', 'branch_id'], 'branches', ['tenant_id', 'branch_id'], (constraint) => constraint.onDelete('restrict'))
    .addCheckConstraint('branch_audit_events_type_ck', sql`event_type in ('BRANCH_CREATED','BRANCH_UPDATED','BRANCH_DEACTIVATED','BRANCH_REACTIVATED')`)
    .addCheckConstraint('branch_audit_events_version_ck', sql`branch_version >= 0`)
    .execute();
  await sql`create index branch_audit_events_branch_idx on branch_audit_events(tenant_id, branch_id, occurred_at)`.execute(database);
  await sql`create function branch_reject_audit_event_mutation() returns trigger language plpgsql as $function$ begin raise exception 'Branch audit events are append-only.' using errcode = '23514'; end; $function$`.execute(database);
  await sql`create trigger branch_audit_events_reject_update before update on branch_audit_events for each row execute function branch_reject_audit_event_mutation()`.execute(database);
  await sql`create trigger branch_audit_events_reject_delete before delete on branch_audit_events for each row execute function branch_reject_audit_event_mutation()`.execute(database);
}

export async function down(database: Kysely<DatabaseSchema>): Promise<void> {
  await database.schema.dropTable('branch_audit_events').execute();
  await sql`drop function branch_reject_audit_event_mutation()`.execute(database);
  await database.schema.dropTable('branch_commands').execute();
  await sql`drop index branches_tenant_active_idx`.execute(database);
  await sql`alter table branches drop constraint branches_updated_at_ck`.execute(database);
  await sql`alter table branches drop constraint branches_version_ck`.execute(database);
  await sql`alter table branches drop constraint branches_display_name_ck`.execute(database);
  await sql`alter table branches alter column time_zone set default 'America/Hermosillo'`.execute(database);
  await database.schema.alterTable('branches')
    .dropColumn('updated_at')
    .dropColumn('version')
    .dropColumn('display_name')
    .execute();
}
