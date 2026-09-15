import { sql, type Kysely } from 'kysely';

import type { DatabaseSchema } from '../database-types.js';

export async function up(database: Kysely<DatabaseSchema>): Promise<void> {
  await sql`
    alter table catalog_update_row_decisions
      drop constraint catalog_update_rows_class_ck;

    alter table catalog_update_row_decisions
      add constraint catalog_update_rows_class_ck
      check (classification in ('NEW','UPDATE','REACTIVATE','UNCHANGED','PENDING_REFERENCE','AMBIGUOUS','CONFLICT','INVALID'));
  `.execute(database);
}

export async function down(database: Kysely<DatabaseSchema>): Promise<void> {
  await sql`
    update catalog_update_batches
       set counts = jsonb_set(
         counts - 'REACTIVATE',
         '{CONFLICT}',
         to_jsonb(coalesce((counts->>'CONFLICT')::integer, 0) + coalesce((counts->>'REACTIVATE')::integer, 0))
       )
     where counts ? 'REACTIVATE';

    update catalog_update_row_decisions
       set classification = 'CONFLICT',
           errors = case
             when errors ? 'HISTORICAL_ITEM_RETIRED_REQUIRES_REACTIVATION' then errors
             else errors || '["HISTORICAL_ITEM_RETIRED_REQUIRES_REACTIVATION"]'::jsonb
           end
     where classification = 'REACTIVATE';

    alter table catalog_update_row_decisions
      drop constraint catalog_update_rows_class_ck;

    alter table catalog_update_row_decisions
      add constraint catalog_update_rows_class_ck
      check (classification in ('NEW','UPDATE','UNCHANGED','PENDING_REFERENCE','AMBIGUOUS','CONFLICT','INVALID'));
  `.execute(database);
}
