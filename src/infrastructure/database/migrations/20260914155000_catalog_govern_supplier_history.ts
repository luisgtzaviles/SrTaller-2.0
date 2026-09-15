import { sql, type Kysely } from 'kysely';

import type { DatabaseSchema } from '../database-types.js';

export async function up(database: Kysely<DatabaseSchema>): Promise<void> {
  await sql`
    alter table catalog_supplier_sources
      add column next_version_sequence integer not null default 1;

    alter table catalog_supplier_catalog_versions
      add column sequence_number integer,
      add column description varchar(500),
      add column create_client_request_id uuid,
      add column create_request_sha256 varchar(64);

    create or replace function catalog_reject_ingested_supplier_version_mutation()
    returns trigger
    language plpgsql
    as $body$
    begin
      if old.lifecycle = 'INGESTED'
        and old.sequence_number is null
        and new.sequence_number is not null
        and (to_jsonb(new) - 'sequence_number') = (to_jsonb(old) - 'sequence_number') then
        return new;
      end if;
      if tg_op = 'DELETE' or old.lifecycle = 'INGESTED' then
        raise exception 'CATALOG_SUPPLIER_VERSION_IMMUTABLE' using errcode = '23514';
      end if;
      return new;
    end;
    $body$;

    update catalog_supplier_catalog_versions version
    set sequence_number = version_rank.sequence_number
    from (
      select tenant_id, version_id,
        row_number() over (
          partition by tenant_id, source_id
          order by created_at, version_id
        )::integer as sequence_number
      from catalog_supplier_catalog_versions
    ) version_rank
    where version.tenant_id = version_rank.tenant_id
      and version.version_id = version_rank.version_id;

    update catalog_supplier_sources source
    set next_version_sequence = coalesce((
      select max(version.sequence_number) + 1
      from catalog_supplier_catalog_versions version
      where version.tenant_id = source.tenant_id
        and version.source_id = source.source_id
    ), 1);

    alter table catalog_supplier_sources
      add constraint catalog_supplier_sources_next_sequence_ck
      check (next_version_sequence > 0);

    alter table catalog_supplier_catalog_versions
      alter column sequence_number set not null,
      add constraint catalog_supplier_versions_sequence_ck
      check (sequence_number > 0),
      add constraint catalog_supplier_versions_sequence_uq
      unique (tenant_id, source_id, sequence_number),
      add constraint catalog_supplier_versions_create_request_uq
      unique (tenant_id, create_client_request_id),
      add constraint catalog_supplier_versions_create_request_ck
      check (
        (create_client_request_id is null and create_request_sha256 is null) or
        (create_client_request_id is not null and length(create_request_sha256) = 64)
      );

    create table catalog_supplier_source_deletion_events (
      tenant_id uuid not null,
      deletion_id uuid not null,
      source_id uuid not null,
      source_name varchar(160) not null,
      normalized_name varchar(160) not null,
      source_version integer not null,
      deleted_version_count integer not null,
      deleted_listing_count integer not null,
      station_id uuid not null,
      session_id uuid not null,
      actor_user_id uuid not null,
      actor_display_name varchar(160) not null,
      capability varchar(80) not null,
      sensitivity_level integer not null,
      reauthenticated_at timestamptz not null,
      client_request_id uuid not null,
      request_sha256 varchar(64) not null,
      correlation_id uuid not null,
      occurred_at timestamptz not null,
      primary key (tenant_id, deletion_id),
      constraint catalog_supplier_source_deletion_events_request_uq
        unique (tenant_id, client_request_id),
      constraint catalog_supplier_source_deletion_events_correlation_uq
        unique (tenant_id, correlation_id),
      constraint catalog_supplier_source_deletion_events_counts_ck
        check (deleted_version_count >= 0 and deleted_listing_count >= 0),
      constraint catalog_supplier_source_deletion_events_contract_ck
        check (capability = 'catalog.suppliers.delete' and sensitivity_level = 2 and length(request_sha256) = 64)
    );

    create index catalog_supplier_source_deletion_events_source_idx
      on catalog_supplier_source_deletion_events
      (tenant_id, source_id, occurred_at, deletion_id);

    create trigger catalog_supplier_source_deletion_events_reject_update
      before update on catalog_supplier_source_deletion_events
      for each row execute function catalog_reject_append_only_mutation();

    create trigger catalog_supplier_source_deletion_events_reject_delete
      before delete on catalog_supplier_source_deletion_events
      for each row execute function catalog_reject_append_only_mutation();

    create or replace function catalog_reject_ingested_supplier_version_mutation()
    returns trigger
    language plpgsql
    as $body$
    begin
      if tg_op = 'DELETE' then
        if old.lifecycle = 'INGESTED' then
          raise exception 'CATALOG_SUPPLIER_VERSION_IMMUTABLE' using errcode = '23514';
        end if;
        return old;
      end if;
      if old.lifecycle = 'INGESTED' then
        raise exception 'CATALOG_SUPPLIER_VERSION_IMMUTABLE' using errcode = '23514';
      end if;
      return new;
    end;
    $body$;
  `.execute(database);

  await database.schema
    .alterTable('catalog_supplier_source_deletion_events')
    .addForeignKeyConstraint(
      'catalog_supplier_source_deletion_events_tenant_fk',
      ['tenant_id'],
      'tenants',
      ['tenant_id'],
    )
    .execute();
}

export async function down(database: Kysely<DatabaseSchema>): Promise<void> {
  await sql`
    do $body$
    begin
      if exists (select 1 from catalog_supplier_source_deletion_events) then
        raise exception 'CATALOG_SUPPLIER_DELETE_HISTORY_PREVENTS_DOWN' using errcode = '23514';
      end if;
    end;
    $body$;

    create or replace function catalog_reject_ingested_supplier_version_mutation()
    returns trigger
    language plpgsql
    as $body$
    begin
      if tg_op = 'DELETE' or old.lifecycle = 'INGESTED' then
        raise exception 'CATALOG_SUPPLIER_VERSION_IMMUTABLE' using errcode = '23514';
      end if;
      return new;
    end;
    $body$;

    drop trigger if exists catalog_supplier_source_deletion_events_reject_delete
      on catalog_supplier_source_deletion_events;
    drop trigger if exists catalog_supplier_source_deletion_events_reject_update
      on catalog_supplier_source_deletion_events;
    drop table catalog_supplier_source_deletion_events;

    alter table catalog_supplier_catalog_versions
      drop constraint catalog_supplier_versions_create_request_ck,
      drop constraint catalog_supplier_versions_create_request_uq,
      drop constraint catalog_supplier_versions_sequence_uq,
      drop constraint catalog_supplier_versions_sequence_ck,
      drop column create_request_sha256,
      drop column create_client_request_id,
      drop column description,
      drop column sequence_number;

    alter table catalog_supplier_sources
      drop constraint catalog_supplier_sources_next_sequence_ck,
      drop column next_version_sequence;
  `.execute(database);
}
