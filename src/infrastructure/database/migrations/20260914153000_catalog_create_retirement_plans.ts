import { sql, type Kysely } from 'kysely';

import type { DatabaseSchema } from '../database-types.js';

export async function up(database: Kysely<DatabaseSchema>): Promise<void> {
  await sql`
    create table catalog_retirement_plans (
      tenant_id uuid not null,
      plan_id uuid not null,
      scope varchar(24) not null,
      batch_id uuid,
      item_set_sha256 char(64) not null,
      active_count integer not null,
      already_inactive_count integer not null,
      created_by_actor_id uuid not null,
      created_in_branch_id uuid not null,
      created_in_station_id uuid not null,
      created_in_session_id uuid not null,
      status varchar(16) not null default 'PENDING',
      expires_at timestamptz not null,
      execution_client_request_id uuid,
      retired_count integer,
      created_at timestamptz not null,
      executed_at timestamptz,
      primary key (tenant_id, plan_id),
      foreign key (tenant_id) references tenants (tenant_id),
      foreign key (tenant_id, batch_id) references catalog_update_batches (tenant_id, batch_id),
      constraint catalog_retirement_plans_scope_ck check (scope in ('ACTIVE_CATALOG','BATCH_CREATED')),
      constraint catalog_retirement_plans_target_ck check ((scope = 'ACTIVE_CATALOG' and batch_id is null) or (scope = 'BATCH_CREATED' and batch_id is not null)),
      constraint catalog_retirement_plans_counts_ck check (active_count >= 0 and already_inactive_count >= 0 and length(item_set_sha256) = 64),
      constraint catalog_retirement_plans_status_ck check (status in ('PENDING','EXECUTED','STALE','EXPIRED')),
      constraint catalog_retirement_plans_result_ck check ((status = 'EXECUTED' and execution_client_request_id is not null and retired_count is not null and executed_at is not null) or (status <> 'EXECUTED' and retired_count is null and executed_at is null)),
      constraint catalog_retirement_plans_request_uq unique (tenant_id, execution_client_request_id)
    );

    create table catalog_retirement_events (
      tenant_id uuid not null,
      event_id uuid not null,
      plan_id uuid not null,
      scope varchar(24) not null,
      batch_id uuid,
      branch_id uuid not null,
      station_id uuid not null,
      session_id uuid not null,
      actor_user_id uuid not null,
      actor_display_name varchar(160) not null,
      capability varchar(80) not null,
      sensitivity_level smallint not null,
      reauthenticated_at timestamptz not null,
      item_set_sha256 char(64) not null,
      planned_count integer not null,
      retired_count integer not null,
      result varchar(16) not null,
      rejection_reason varchar(32),
      correlation_id uuid not null,
      client_request_id uuid not null,
      occurred_at timestamptz not null,
      primary key (tenant_id, event_id),
      foreign key (tenant_id, plan_id) references catalog_retirement_plans (tenant_id, plan_id),
      foreign key (tenant_id, batch_id) references catalog_update_batches (tenant_id, batch_id),
      constraint catalog_retirement_events_scope_ck check (scope in ('ACTIVE_CATALOG','BATCH_CREATED')),
      constraint catalog_retirement_events_target_ck check ((scope = 'ACTIVE_CATALOG' and batch_id is null) or (scope = 'BATCH_CREATED' and batch_id is not null)),
      constraint catalog_retirement_events_authority_ck check (capability = 'catalog.items.bulk_retire' and sensitivity_level = 2),
      constraint catalog_retirement_events_counts_ck check (planned_count >= 0 and retired_count >= 0 and length(item_set_sha256) = 64),
      constraint catalog_retirement_events_result_ck check ((result = 'SUCCEEDED' and rejection_reason is null and retired_count = planned_count) or (result = 'REJECTED' and rejection_reason in ('PLAN_STALE','PLAN_EXPIRED','PLAN_CONTEXT_CHANGED','AUTHORIZATION_CHANGED') and retired_count = 0)),
      constraint catalog_retirement_events_correlation_uq unique (tenant_id, correlation_id),
      constraint catalog_retirement_events_request_uq unique (tenant_id, client_request_id)
    );

    create index catalog_retirement_plans_pending_idx on catalog_retirement_plans (tenant_id, status, expires_at);
    create index catalog_retirement_events_plan_idx on catalog_retirement_events (tenant_id, plan_id, occurred_at);
    create trigger catalog_retirement_events_reject_update before update on catalog_retirement_events for each row execute function catalog_reject_append_only_mutation();
    create trigger catalog_retirement_events_reject_delete before delete on catalog_retirement_events for each row execute function catalog_reject_append_only_mutation();
  `.execute(database);
}

export async function down(database: Kysely<DatabaseSchema>): Promise<void> {
  await sql`
    drop trigger if exists catalog_retirement_events_reject_delete on catalog_retirement_events;
    drop trigger if exists catalog_retirement_events_reject_update on catalog_retirement_events;
    drop table catalog_retirement_events;
    drop table catalog_retirement_plans;
  `.execute(database);
}
