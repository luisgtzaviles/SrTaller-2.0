import { sql } from 'kysely';
import type { Kysely } from 'kysely';

import type { DatabaseSchema } from '../database-types.js';

/**
 * Stations owns the monotonic epochs consumed by composed Session admission.
 * A revoke followed by a restore therefore cannot make an older Session valid
 * again, while Access never reads or mutates Stations-owned persistence.
 */
export async function up(database: Kysely<DatabaseSchema>): Promise<void> {
  await database.schema.alterTable('branches')
    .addColumn('admission_revision', 'integer', (column) =>
      column.notNull().defaultTo(0))
    .execute();
  await sql`alter table branches add constraint branches_admission_revision_ck check (admission_revision >= 0)`.execute(database);
  await database.schema.alterTable('stations')
    .addColumn('admission_revision', 'integer', (column) =>
      column.notNull().defaultTo(0))
    .execute();
  await sql`alter table stations add constraint stations_admission_revision_ck check (admission_revision >= 0)`.execute(database);
  await database.schema.alterTable('station_bindings')
    .addColumn('admission_revision', 'integer', (column) =>
      column.notNull().defaultTo(0))
    .execute();
  await sql`alter table station_bindings add constraint station_bindings_admission_revision_ck check (admission_revision >= 0)`.execute(database);
  await database.schema.alterTable('station_credentials')
    .addColumn('admission_revision', 'integer', (column) =>
      column.notNull().defaultTo(0))
    .execute();
  await sql`alter table station_credentials add constraint station_credentials_admission_revision_ck check (admission_revision >= 0)`.execute(database);

  await sql`
    create function stations_advance_admission_revision()
    returns trigger
    language plpgsql
    as $function$
    begin
      new.admission_revision = old.admission_revision;
      if (
        (
          tg_table_name = 'branches'
          and to_jsonb(new)->'active' is distinct from to_jsonb(old)->'active'
        )
        or (
          tg_table_name = 'stations'
          and (
            to_jsonb(new)->'status' is distinct from to_jsonb(old)->'status'
            or to_jsonb(new)->'revoked_at' is distinct from to_jsonb(old)->'revoked_at'
          )
        )
        or (
          tg_table_name = 'station_bindings'
          and (
            to_jsonb(new)->'branch_id' is distinct from to_jsonb(old)->'branch_id'
            or to_jsonb(new)->'revoked_at' is distinct from to_jsonb(old)->'revoked_at'
          )
        )
        or (
          tg_table_name = 'station_credentials'
          and (
            to_jsonb(new)->'station_id' is distinct from to_jsonb(old)->'station_id'
            or to_jsonb(new)->'credential_hash' is distinct from to_jsonb(old)->'credential_hash'
            or to_jsonb(new)->'revoked_at' is distinct from to_jsonb(old)->'revoked_at'
          )
        )
      ) then
        new.admission_revision = old.admission_revision + 1;
      end if;
      return new;
    end;
    $function$
  `.execute(database);

  await sql`
    create trigger stations_advance_branch_admission_revision
    before update on branches
    for each row execute function stations_advance_admission_revision()
  `.execute(database);
  await sql`
    create trigger stations_advance_station_admission_revision
    before update on stations
    for each row execute function stations_advance_admission_revision()
  `.execute(database);
  await sql`
    create trigger stations_advance_binding_admission_revision
    before update on station_bindings
    for each row execute function stations_advance_admission_revision()
  `.execute(database);
  await sql`
    create trigger stations_advance_credential_admission_revision
    before update on station_credentials
    for each row execute function stations_advance_admission_revision()
  `.execute(database);
}

export async function down(database: Kysely<DatabaseSchema>): Promise<void> {
  await sql`drop trigger if exists stations_advance_credential_admission_revision on station_credentials`.execute(database);
  await sql`drop trigger if exists stations_advance_binding_admission_revision on station_bindings`.execute(database);
  await sql`drop trigger if exists stations_advance_station_admission_revision on stations`.execute(database);
  await sql`drop trigger if exists stations_advance_branch_admission_revision on branches`.execute(database);
  await sql`drop function if exists stations_advance_admission_revision()`.execute(database);
  await database.schema.alterTable('station_credentials')
    .dropColumn('admission_revision')
    .execute();
  await database.schema.alterTable('station_bindings')
    .dropColumn('admission_revision')
    .execute();
  await database.schema.alterTable('stations')
    .dropColumn('admission_revision')
    .execute();
  await database.schema.alterTable('branches')
    .dropColumn('admission_revision')
    .execute();
}
