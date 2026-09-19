import { sql, type Kysely } from 'kysely';

import type { DatabaseSchema } from '../database-types.js';

export async function up(database: Kysely<DatabaseSchema>): Promise<void> {
  await sql`
    alter table catalog_update_row_decisions
      drop constraint catalog_update_rows_class_ck;

    alter table catalog_update_row_decisions
      add column match_origin varchar(32) not null default 'NONE',
      add column match_algorithm_version integer not null default 1,
      add column candidate_matches jsonb not null default '[]'::jsonb,
      add constraint catalog_update_rows_class_ck
        check (classification in ('NEW','UPDATE','REACTIVATE','UNCHANGED','CANDIDATE','PENDING_REFERENCE','AMBIGUOUS','CONFLICT','INVALID')),
      add constraint catalog_update_rows_match_origin_ck
        check (match_origin in ('NONE','INTERNAL_IDENTIFIER','TRUSTED_HISTORY','CANDIDATE','OWNER_SELECTED')),
      add constraint catalog_update_rows_match_algorithm_ck
        check (match_algorithm_version > 0),
      add constraint catalog_update_rows_candidates_ck
        check (jsonb_typeof(candidate_matches) = 'array' and jsonb_array_length(candidate_matches) <= 3);
  `.execute(database);
}

export async function down(database: Kysely<DatabaseSchema>): Promise<void> {
  await sql`
    update catalog_update_batches
       set counts = jsonb_set(
         counts - 'CANDIDATE',
         '{CONFLICT}',
         to_jsonb(coalesce((counts->>'CONFLICT')::integer, 0) + coalesce((counts->>'CANDIDATE')::integer, 0))
       )
     where counts ? 'CANDIDATE';

    update catalog_update_row_decisions
       set classification = 'CONFLICT',
           decision = 'UNRESOLVED',
           errors = case when errors ? 'CANDIDATE_MATCH_REQUIRES_OWNER_DECISION' then errors else errors || '["CANDIDATE_MATCH_REQUIRES_OWNER_DECISION"]'::jsonb end
     where classification = 'CANDIDATE';

    alter table catalog_update_row_decisions
      drop constraint catalog_update_rows_candidates_ck,
      drop constraint catalog_update_rows_match_algorithm_ck,
      drop constraint catalog_update_rows_match_origin_ck,
      drop constraint catalog_update_rows_class_ck,
      drop column candidate_matches,
      drop column match_algorithm_version,
      drop column match_origin,
      add constraint catalog_update_rows_class_ck
        check (classification in ('NEW','UPDATE','REACTIVATE','UNCHANGED','PENDING_REFERENCE','AMBIGUOUS','CONFLICT','INVALID'));
  `.execute(database);
}
