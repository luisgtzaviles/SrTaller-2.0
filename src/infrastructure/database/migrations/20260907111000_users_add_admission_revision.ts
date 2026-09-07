import { sql } from 'kysely';
import type { Kysely } from 'kysely';

import type { DatabaseSchema } from '../database-types.js';

/** Users owns the monotonic lifecycle epoch consumed by Session admission. */
export async function up(database: Kysely<DatabaseSchema>): Promise<void> {
  await database.schema.alterTable('users')
    .addColumn('admission_revision', 'integer', (column) =>
      column.notNull().defaultTo(0))
    .execute();
  await sql`alter table users add constraint users_admission_revision_ck check (admission_revision >= 0)`.execute(database);
  await sql`
    create function users_advance_admission_revision()
    returns trigger
    language plpgsql
    as $function$
    begin
      new.admission_revision = old.admission_revision;
      if new.status is distinct from old.status then
        new.admission_revision = old.admission_revision + 1;
      end if;
      return new;
    end;
    $function$
  `.execute(database);
  await sql`
    create trigger users_advance_admission_revision
    before update on users
    for each row execute function users_advance_admission_revision()
  `.execute(database);
}

export async function down(database: Kysely<DatabaseSchema>): Promise<void> {
  await sql`drop trigger if exists users_advance_admission_revision on users`.execute(database);
  await sql`drop function if exists users_advance_admission_revision()`.execute(database);
  await database.schema.alterTable('users')
    .dropColumn('admission_revision')
    .execute();
}
