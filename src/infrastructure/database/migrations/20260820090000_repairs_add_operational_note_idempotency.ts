import type { Kysely } from 'kysely';

import type { DatabaseSchema } from '../database-types.js';

export async function up(database: Kysely<DatabaseSchema>): Promise<void> {
  await database.schema
    .alterTable('repair_timeline_entries')
    .addColumn('client_request_id', 'uuid')
    .execute();
  await database.schema
    .alterTable('repair_timeline_entries')
    .addUniqueConstraint(
      'repair_timeline_entries_note_request_uq',
      ['tenant_id', 'branch_id', 'repair_id', 'client_request_id'],
    )
    .execute();
}

export async function down(database: Kysely<DatabaseSchema>): Promise<void> {
  await database.schema
    .alterTable('repair_timeline_entries')
    .dropConstraint('repair_timeline_entries_note_request_uq')
    .execute();
  await database.schema
    .alterTable('repair_timeline_entries')
    .dropColumn('client_request_id')
    .execute();
}
