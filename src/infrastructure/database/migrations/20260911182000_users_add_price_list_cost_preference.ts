import type { Kysely } from 'kysely';

import type { DatabaseSchema } from '../database-types.js';

export async function up(database: Kysely<DatabaseSchema>): Promise<void> {
  await database.schema
    .alterTable('user_preferences')
    .addColumn('price_list_show_reference_cost', 'boolean', (column) =>
      column.notNull().defaultTo(false),
    )
    .execute();
}

export async function down(database: Kysely<DatabaseSchema>): Promise<void> {
  await database.schema
    .alterTable('user_preferences')
    .dropColumn('price_list_show_reference_cost')
    .execute();
}
