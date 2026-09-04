import type { Kysely } from 'kysely';

import type { DatabaseSchema } from '../database-types.js';

/**
 * Existing SR Taller branches historically rendered with America/Hermosillo.
 * This one-time fallback gives every legacy row a valid IANA authority. New
 * branch creation is validated by the stations boundary and must provide its
 * own value; the fallback remains only for governed legacy/bootstrap SQL.
 */
export async function up(database: Kysely<DatabaseSchema>): Promise<void> {
  await database.schema
    .alterTable('branches')
    .addColumn('time_zone', 'text', (column) =>
      column.notNull().defaultTo('America/Hermosillo'),
    )
    .execute();
}

/** Local/test cleanup only; shared environments use a forward migration. */
export async function down(database: Kysely<DatabaseSchema>): Promise<void> {
  await database.schema.alterTable('branches').dropColumn('time_zone').execute();
}
