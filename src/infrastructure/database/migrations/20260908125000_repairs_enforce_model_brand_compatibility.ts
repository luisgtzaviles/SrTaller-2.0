import { sql, type Kysely } from 'kysely';

import type { DatabaseSchema } from '../database-types.js';

export async function up(database: Kysely<DatabaseSchema>): Promise<void> {
  await sql`
    create function repairs_enforce_model_catalog_brand_scope()
    returns trigger language plpgsql as $function$
    declare
      brand_scope varchar(16);
      brand_tenant_id uuid;
    begin
      select scope, tenant_id into brand_scope, brand_tenant_id
      from repair_brands where brand_id = new.canonical_brand_id;
      if brand_scope is null
        or (new.scope = 'platform' and brand_scope <> 'platform')
        or (new.scope = 'tenant' and brand_scope = 'tenant' and brand_tenant_id <> new.tenant_id)
      then
        raise check_violation using message = 'Repair model scope conflicts with its canonical Brand.', constraint = 'repair_models_brand_scope_ck', table = 'repair_models';
      end if;
      return new;
    end; $function$
  `.execute(database);
  await sql`create trigger repair_models_enforce_brand_scope before insert or update of canonical_brand_id, scope, tenant_id on repair_models for each row execute function repairs_enforce_model_catalog_brand_scope()`.execute(database);

  await sql`
    create function repairs_enforce_intake_model_brand_match()
    returns trigger language plpgsql as $function$
    declare
      model_brand_id uuid;
    begin
      if new.canonical_model_id is null then return new; end if;
      select canonical_brand_id into model_brand_id from repair_models where model_id = new.canonical_model_id;
      if new.canonical_brand_id is null or model_brand_id is null or model_brand_id <> new.canonical_brand_id then
        raise check_violation using message = 'Repair intake canonical Model conflicts with canonical Brand.', constraint = 'repair_intakes_model_brand_match_ck', table = 'repair_intakes';
      end if;
      return new;
    end; $function$
  `.execute(database);
  await sql`create trigger repair_intakes_enforce_model_brand_match before insert or update of canonical_brand_id, canonical_model_id on repair_intakes for each row execute function repairs_enforce_intake_model_brand_match()`.execute(database);
}

export async function down(database: Kysely<DatabaseSchema>): Promise<void> {
  await sql`drop trigger if exists repair_intakes_enforce_model_brand_match on repair_intakes`.execute(database);
  await sql`drop function if exists repairs_enforce_intake_model_brand_match()`.execute(database);
  await sql`drop trigger if exists repair_models_enforce_brand_scope on repair_models`.execute(database);
  await sql`drop function if exists repairs_enforce_model_catalog_brand_scope()`.execute(database);
}
