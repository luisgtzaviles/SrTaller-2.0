import { sql, type Kysely, type SqlBool } from 'kysely';

import type { DatabaseSchema } from '../database-types.js';

export async function up(database: Kysely<DatabaseSchema>): Promise<void> {
  await database.schema.dropIndex('access_admin_invitations_pending_email_uq').execute();
  await database.schema.createIndex('access_admin_invitations_pending_email_uq')
    .on('access_admin_invitations')
    .column('normalized_email')
    .unique()
    .where(sql<SqlBool>`status = 'PENDING'`)
    .execute();
}

export async function down(database: Kysely<DatabaseSchema>): Promise<void> {
  await database.schema.dropIndex('access_admin_invitations_pending_email_uq').execute();
  await database.schema.createIndex('access_admin_invitations_pending_email_uq')
    .on('access_admin_invitations')
    .columns(['tenant_id', 'normalized_email'])
    .unique()
    .where(sql<SqlBool>`status = 'PENDING'`)
    .execute();
}
