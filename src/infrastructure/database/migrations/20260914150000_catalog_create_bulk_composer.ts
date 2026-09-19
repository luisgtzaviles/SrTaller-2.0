import { sql, type Kysely } from 'kysely';

import type { DatabaseSchema } from '../database-types.js';

export async function up(database: Kysely<DatabaseSchema>): Promise<void> {
  await sql`
    create table catalog_supplier_sources (
      tenant_id uuid not null,
      source_id uuid not null,
      display_name varchar(160) not null,
      normalized_name varchar(160) not null,
      status varchar(16) not null default 'ACTIVE',
      version integer not null default 1,
      created_by_actor_id uuid not null,
      created_at timestamptz not null,
      updated_at timestamptz not null,
      primary key (tenant_id, source_id),
      foreign key (tenant_id) references tenants (tenant_id),
      constraint catalog_supplier_sources_status_ck check (status in ('ACTIVE','INACTIVE')),
      constraint catalog_supplier_sources_version_ck check (version > 0),
      constraint catalog_supplier_sources_name_uq unique (tenant_id, normalized_name)
    );

    create table catalog_supplier_catalog_versions (
      tenant_id uuid not null,
      version_id uuid not null,
      source_id uuid not null,
      source_revision varchar(120) not null,
      composer_mode varchar(24) not null,
      column_signature varchar(64) not null,
      lifecycle varchar(16) not null default 'DRAFT',
      lock_version integer not null default 1,
      row_count integer not null default 0,
      content_sha256 varchar(64),
      ingested_at timestamptz,
      created_by_actor_id uuid not null,
      created_at timestamptz not null,
      updated_at timestamptz not null,
      primary key (tenant_id, version_id),
      foreign key (tenant_id, source_id) references catalog_supplier_sources (tenant_id, source_id),
      constraint catalog_supplier_versions_mode_ck check (composer_mode in ('FULL','COMPACT')),
      constraint catalog_supplier_versions_lifecycle_ck check (lifecycle in ('DRAFT','INGESTED')),
      constraint catalog_supplier_versions_lock_ck check (lock_version > 0 and row_count >= 0),
      constraint catalog_supplier_versions_ingested_ck check ((lifecycle = 'DRAFT' and ingested_at is null and content_sha256 is null) or (lifecycle = 'INGESTED' and ingested_at is not null and content_sha256 is not null)),
      constraint catalog_supplier_versions_revision_uq unique (tenant_id, source_id, source_revision)
    );

    create table catalog_supplier_version_raw_payloads (
      tenant_id uuid not null,
      version_id uuid not null,
      payload_text text,
      retained_until timestamptz not null,
      purged_at timestamptz,
      created_at timestamptz not null,
      primary key (tenant_id, version_id),
      foreign key (tenant_id, version_id) references catalog_supplier_catalog_versions (tenant_id, version_id),
      constraint catalog_supplier_raw_purge_ck check ((payload_text is not null and purged_at is null) or (payload_text is null and purged_at is not null))
    );

    create table catalog_supplier_listings (
      tenant_id uuid not null,
      listing_id uuid not null,
      version_id uuid not null,
      row_number integer not null,
      item_kind varchar(16),
      supplier_item_code varchar(160),
      normalized_supplier_item_code varchar(160),
      normalized_signature varchar(64) not null,
      supplier_sku varchar(160),
      supplier_barcode varchar(160),
      supplier_title varchar(240),
      supplier_description text,
      category_label varchar(160),
      brand_label varchar(160),
      supplier_cost_minor bigint,
      currency char(3),
      source_observation jsonb not null,
      created_at timestamptz not null,
      primary key (tenant_id, listing_id),
      foreign key (tenant_id, version_id) references catalog_supplier_catalog_versions (tenant_id, version_id),
      constraint catalog_supplier_listings_row_ck check (row_number > 0 and length(normalized_signature) = 64 and (supplier_cost_minor is null or supplier_cost_minor >= 0)),
      constraint catalog_supplier_listings_kind_ck check (item_kind is null or item_kind in ('PART','PRODUCT','SERVICE','SUPPLY')),
      constraint catalog_supplier_listings_row_uq unique (tenant_id, version_id, row_number)
    );

    create table catalog_update_batches (
      tenant_id uuid not null,
      batch_id uuid not null,
      version_id uuid not null,
      lifecycle varchar(24) not null default 'DRAFT',
      lock_version integer not null default 1,
      counts jsonb not null default '{}'::jsonb,
      analysis_sha256 varchar(64),
      publish_client_request_id uuid,
      publish_request_sha256 varchar(64),
      published_at timestamptz,
      published_by_actor_id uuid,
      created_at timestamptz not null,
      updated_at timestamptz not null,
      primary key (tenant_id, batch_id),
      foreign key (tenant_id, version_id) references catalog_supplier_catalog_versions (tenant_id, version_id),
      constraint catalog_update_batches_lifecycle_ck check (lifecycle in ('DRAFT','ANALYZING','RECONCILING','READY','APPLIED')),
      constraint catalog_update_batches_lock_ck check (lock_version > 0),
      constraint catalog_update_batches_publish_ck check ((lifecycle <> 'APPLIED' and published_at is null and published_by_actor_id is null) or (lifecycle = 'APPLIED' and published_at is not null and published_by_actor_id is not null)),
      constraint catalog_update_batches_version_uq unique (tenant_id, version_id),
      constraint catalog_update_batches_publish_request_uq unique (tenant_id, publish_client_request_id)
    );

    create table catalog_update_row_decisions (
      tenant_id uuid not null,
      row_decision_id uuid not null,
      batch_id uuid not null,
      listing_id uuid not null,
      row_number integer not null,
      proposal jsonb not null,
      classification varchar(24) not null default 'INVALID',
      decision varchar(24) not null default 'UNRESOLVED',
      target_item_id uuid,
      expected_item_version integer,
      preselected_by_memory boolean not null default false,
      errors jsonb not null default '[]'::jsonb,
      warnings jsonb not null default '[]'::jsonb,
      lock_version integer not null default 1,
      updated_at timestamptz not null,
      primary key (tenant_id, row_decision_id),
      foreign key (tenant_id, batch_id) references catalog_update_batches (tenant_id, batch_id),
      foreign key (tenant_id, listing_id) references catalog_supplier_listings (tenant_id, listing_id),
      foreign key (tenant_id, target_item_id) references catalog_items (tenant_id, item_id),
      constraint catalog_update_rows_class_ck check (classification in ('NEW','UPDATE','UNCHANGED','PENDING_REFERENCE','AMBIGUOUS','CONFLICT','INVALID')),
      constraint catalog_update_rows_decision_ck check (decision in ('UNRESOLVED','APPLY','EXCLUDE')),
      constraint catalog_update_rows_lock_ck check (row_number > 0 and lock_version > 0),
      constraint catalog_update_rows_row_uq unique (tenant_id, batch_id, row_number)
    );

    create table catalog_supplier_listing_resolutions (
      tenant_id uuid not null,
      resolution_id uuid not null,
      source_id uuid not null,
      version_id uuid not null,
      listing_id uuid not null,
      batch_id uuid not null,
      item_id uuid,
      resolution varchar(24) not null,
      identifier_scheme varchar(16),
      normalized_identifier varchar(160),
      column_signature varchar(64) not null,
      actor_user_id uuid not null,
      correlation_id uuid not null,
      occurred_at timestamptz not null,
      primary key (tenant_id, resolution_id),
      foreign key (tenant_id, source_id) references catalog_supplier_sources (tenant_id, source_id),
      foreign key (tenant_id, version_id) references catalog_supplier_catalog_versions (tenant_id, version_id),
      foreign key (tenant_id, listing_id) references catalog_supplier_listings (tenant_id, listing_id),
      foreign key (tenant_id, batch_id) references catalog_update_batches (tenant_id, batch_id),
      foreign key (tenant_id, item_id) references catalog_items (tenant_id, item_id),
      constraint catalog_supplier_resolutions_value_ck check (resolution in ('MATCHED','CREATED','EXCLUDED','CONFLICT')),
      constraint catalog_supplier_resolutions_identifier_ck check (identifier_scheme is null or identifier_scheme in ('SKU','BARCODE','SUPPLIER_CODE','SIGNATURE')),
      constraint catalog_supplier_resolutions_correlation_uq unique (tenant_id, correlation_id)
    );

    create table catalog_supplier_reconciliation_memory (
      tenant_id uuid not null,
      source_id uuid not null,
      identifier_scheme varchar(16) not null,
      normalized_identifier varchar(160) not null,
      column_signature varchar(64) not null,
      item_id uuid not null,
      item_kind varchar(16) not null,
      last_resolution_id uuid not null,
      last_confirmed_at timestamptz not null,
      version integer not null default 1,
      primary key (tenant_id, source_id, identifier_scheme, normalized_identifier, column_signature),
      foreign key (tenant_id, source_id) references catalog_supplier_sources (tenant_id, source_id),
      foreign key (tenant_id, item_id) references catalog_items (tenant_id, item_id),
      foreign key (tenant_id, last_resolution_id) references catalog_supplier_listing_resolutions (tenant_id, resolution_id),
      constraint catalog_supplier_memory_scheme_ck check (identifier_scheme in ('SKU','BARCODE','SUPPLIER_CODE','SIGNATURE')),
      constraint catalog_supplier_memory_kind_ck check (item_kind in ('PART','PRODUCT','SERVICE','SUPPLY')),
      constraint catalog_supplier_memory_version_ck check (version > 0)
    );

    create index catalog_supplier_versions_source_idx on catalog_supplier_catalog_versions (tenant_id, source_id, created_at desc);
    create index catalog_supplier_listings_identifier_idx on catalog_supplier_listings (tenant_id, supplier_sku, supplier_barcode);
    create index catalog_supplier_listings_source_code_idx on catalog_supplier_listings (tenant_id, version_id, normalized_supplier_item_code);
    create index catalog_supplier_listings_signature_idx on catalog_supplier_listings (tenant_id, version_id, normalized_signature);
    create index catalog_update_rows_batch_class_idx on catalog_update_row_decisions (tenant_id, batch_id, classification, row_number);
    create index catalog_supplier_memory_item_idx on catalog_supplier_reconciliation_memory (tenant_id, item_id);

    create function catalog_reject_ingested_supplier_version_mutation()
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

    create function catalog_guard_supplier_listing_mutation()
    returns trigger
    language plpgsql
    as $body$
    declare snapshot_lifecycle varchar(16);
    begin
      select lifecycle into snapshot_lifecycle
      from catalog_supplier_catalog_versions
      where tenant_id = old.tenant_id and version_id = old.version_id;
      if snapshot_lifecycle = 'INGESTED' then
        raise exception 'CATALOG_SUPPLIER_LISTING_IMMUTABLE' using errcode = '23514';
      end if;
      if tg_op = 'DELETE' then return old; end if;
      return new;
    end;
    $body$;

    create trigger catalog_supplier_versions_reject_ingested_update before update on catalog_supplier_catalog_versions for each row execute function catalog_reject_ingested_supplier_version_mutation();
    create trigger catalog_supplier_versions_reject_delete before delete on catalog_supplier_catalog_versions for each row execute function catalog_reject_ingested_supplier_version_mutation();
    create trigger catalog_supplier_listings_guard_update before update on catalog_supplier_listings for each row execute function catalog_guard_supplier_listing_mutation();
    create trigger catalog_supplier_listings_guard_delete before delete on catalog_supplier_listings for each row execute function catalog_guard_supplier_listing_mutation();

    create trigger catalog_supplier_listing_resolutions_reject_update before update on catalog_supplier_listing_resolutions for each row execute function catalog_reject_append_only_mutation();
    create trigger catalog_supplier_listing_resolutions_reject_delete before delete on catalog_supplier_listing_resolutions for each row execute function catalog_reject_append_only_mutation();
  `.execute(database);
}

export async function down(database: Kysely<DatabaseSchema>): Promise<void> {
  await sql`
    drop table catalog_supplier_reconciliation_memory;
    drop trigger if exists catalog_supplier_listing_resolutions_reject_delete on catalog_supplier_listing_resolutions;
    drop trigger if exists catalog_supplier_listing_resolutions_reject_update on catalog_supplier_listing_resolutions;
    drop table catalog_supplier_listing_resolutions;
    drop table catalog_update_row_decisions;
    drop table catalog_update_batches;
    drop trigger if exists catalog_supplier_listings_guard_delete on catalog_supplier_listings;
    drop trigger if exists catalog_supplier_listings_guard_update on catalog_supplier_listings;
    drop table catalog_supplier_listings;
    drop table catalog_supplier_version_raw_payloads;
    drop trigger if exists catalog_supplier_versions_reject_delete on catalog_supplier_catalog_versions;
    drop trigger if exists catalog_supplier_versions_reject_ingested_update on catalog_supplier_catalog_versions;
    drop table catalog_supplier_catalog_versions;
    drop table catalog_supplier_sources;
    drop function catalog_guard_supplier_listing_mutation();
    drop function catalog_reject_ingested_supplier_version_mutation();
  `.execute(database);
}
