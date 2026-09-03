import { sql, type Kysely } from 'kysely';

import type { DatabaseSchema } from '../database-types.js';

export async function up(database: Kysely<DatabaseSchema>): Promise<void> {
  await database.schema
    .alterTable('repair_technician_assignments')
    .addColumn('ended_client_request_id', 'uuid')
    .execute();
  await database.schema
    .createIndex('repair_technician_assignments_end_request_uq')
    .on('repair_technician_assignments')
    .columns(['tenant_id', 'branch_id', 'repair_id', 'ended_client_request_id'])
    .where(sql<boolean>`ended_client_request_id is not null`)
    .unique()
    .execute();
}

export async function down(database: Kysely<DatabaseSchema>): Promise<void> {
  await database.schema.dropIndex('repair_technician_assignments_end_request_uq').execute();
  await database.schema
    .alterTable('repair_technician_assignments')
    .dropColumn('ended_client_request_id')
    .execute();
}
