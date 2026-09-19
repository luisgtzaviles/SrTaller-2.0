import { sql, type Kysely } from 'kysely';

import type { DatabaseSchema } from '../database-types.js';

export async function up(database: Kysely<DatabaseSchema>): Promise<void> {
  await sql`
    alter table catalog_update_row_decisions
      add column title_decision varchar(24),
      add constraint catalog_update_rows_title_decision_ck
        check (title_decision is null or title_decision in ('KEEP_CURRENT','ADOPT_OBSERVED'));

    alter table catalog_supplier_listings
      add column supplier_title_search tsvector generated always as
        (to_tsvector('simple'::regconfig, coalesce(supplier_title, ''))) stored;

    create index catalog_supplier_listings_title_search_idx
      on catalog_supplier_listings using gin (supplier_title_search);

    create index catalog_supplier_resolutions_item_history_idx
      on catalog_supplier_listing_resolutions (tenant_id, item_id, batch_id, listing_id)
      where item_id is not null;
  `.execute(database);
}

export async function down(database: Kysely<DatabaseSchema>): Promise<void> {
  await sql`
    drop index catalog_supplier_resolutions_item_history_idx;
    drop index catalog_supplier_listings_title_search_idx;

    alter table catalog_supplier_listings
      drop column supplier_title_search;

    alter table catalog_update_row_decisions
      drop constraint catalog_update_rows_title_decision_ck,
      drop column title_decision;
  `.execute(database);
}
