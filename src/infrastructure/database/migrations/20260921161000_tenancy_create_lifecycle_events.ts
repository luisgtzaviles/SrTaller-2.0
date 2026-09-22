import { sql } from 'kysely';
import type { Kysely } from 'kysely';

import type { DatabaseSchema } from '../database-types.js';

export async function up(database: Kysely<DatabaseSchema>): Promise<void> {
  await database.schema.createTable('tenant_lifecycle_events')
    .addColumn('event_id', 'uuid', (column) => column.primaryKey())
    .addColumn('tenant_id', 'uuid', (column) => column.notNull().references('tenants.tenant_id').onDelete('restrict'))
    .addColumn('actor_user_id', 'uuid', (column) => column.notNull())
    .addColumn('admin_session_id', 'uuid', (column) => column.notNull())
    .addColumn('event_type', 'varchar(32)', (column) => column.notNull())
    .addColumn('correlation_id', 'uuid', (column) => column.notNull())
    .addColumn('tenant_version', 'integer', (column) => column.notNull())
    .addColumn('occurred_at', 'timestamptz', (column) => column.notNull())
    .addCheckConstraint('tenant_lifecycle_events_type_ck', sql`event_type = 'TENANT_ACTIVATED'`)
    .addCheckConstraint('tenant_lifecycle_events_version_ck', sql`tenant_version >= 0`)
    .execute();
  await sql`create index tenant_lifecycle_events_tenant_idx on tenant_lifecycle_events(tenant_id, occurred_at)`.execute(database);
  await sql`create function tenancy_reject_lifecycle_event_mutation() returns trigger language plpgsql as $function$ begin raise exception 'Tenant lifecycle events are append-only.' using errcode = '23514'; end; $function$`.execute(database);
  await sql`create trigger tenant_lifecycle_events_reject_update before update on tenant_lifecycle_events for each row execute function tenancy_reject_lifecycle_event_mutation()`.execute(database);
  await sql`create trigger tenant_lifecycle_events_reject_delete before delete on tenant_lifecycle_events for each row execute function tenancy_reject_lifecycle_event_mutation()`.execute(database);
}

export async function down(database: Kysely<DatabaseSchema>): Promise<void> {
  await database.schema.dropTable('tenant_lifecycle_events').execute();
  await sql`drop function tenancy_reject_lifecycle_event_mutation()`.execute(database);
}
