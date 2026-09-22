import { sql, type Kysely } from 'kysely';

import type { DatabaseSchema } from '../database-types.js';

export async function up(database: Kysely<DatabaseSchema>): Promise<void> {
  await database.schema.alterTable('access_admin_invitation_challenges')
    .dropConstraint('access_admin_invitation_challenges_time_ck')
    .execute();
  await database.schema.alterTable('access_admin_invitation_challenges')
    .addCheckConstraint(
      'access_admin_invitation_challenges_time_ck',
      sql`expires_at > created_at and expires_at <= created_at + interval '24 hours' and updated_at >= created_at and ((status = 'CONSUMED' and consumed_at is not null and superseded_at is null) or (status = 'SUPERSEDED' and superseded_at is not null and consumed_at is null) or (status in ('ACTIVE', 'EXPIRED') and consumed_at is null and superseded_at is null))`,
    )
    .execute();
}

export async function down(database: Kysely<DatabaseSchema>): Promise<void> {
  await database.schema.alterTable('access_admin_invitation_challenges')
    .dropConstraint('access_admin_invitation_challenges_time_ck')
    .execute();
  await database.schema.alterTable('access_admin_invitation_challenges')
    .addCheckConstraint(
      'access_admin_invitation_challenges_time_ck',
      sql`expires_at = created_at + interval '24 hours' and updated_at >= created_at and ((status = 'CONSUMED' and consumed_at is not null and superseded_at is null) or (status = 'SUPERSEDED' and superseded_at is not null and consumed_at is null) or (status in ('ACTIVE', 'EXPIRED') and consumed_at is null and superseded_at is null))`,
    )
    .execute();
}
