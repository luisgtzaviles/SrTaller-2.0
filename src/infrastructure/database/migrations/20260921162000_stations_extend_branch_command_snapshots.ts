import { sql } from 'kysely';
import type { Kysely } from 'kysely';

import type { DatabaseSchema } from '../database-types.js';

export async function up(database: Kysely<DatabaseSchema>): Promise<void> {
  await database.schema.alterTable('branch_commands')
    .addColumn('result_display_name', 'varchar(160)')
    .addColumn('result_time_zone', 'text')
    .addColumn('result_admission_revision', 'integer')
    .addColumn('result_created_at', 'timestamptz')
    .addColumn('result_updated_at', 'timestamptz')
    .execute();
  const existing = await sql<{ count: string }>`select count(*)::text as count from branch_commands`.execute(database);
  if (Number(existing.rows[0]?.count ?? 0) !== 0) {
    throw new Error('TL-05 cannot extend a non-empty pre-candidate Branch command journal without an explicit snapshot mapping.');
  }
  await sql`alter table branch_commands alter column result_display_name set not null`.execute(database);
  await sql`alter table branch_commands alter column result_time_zone set not null`.execute(database);
  await sql`alter table branch_commands alter column result_admission_revision set not null`.execute(database);
  await sql`alter table branch_commands alter column result_created_at set not null`.execute(database);
  await sql`alter table branch_commands alter column result_updated_at set not null`.execute(database);
  await sql`alter table branch_commands drop constraint branch_commands_result_ck`.execute(database);
  await sql`alter table branch_commands add constraint branch_commands_result_ck check (result_version >= 0 and result_admission_revision >= 0 and result_status in ('ACTIVE','INACTIVE') and result_updated_at >= result_created_at)`.execute(database);
}

export async function down(database: Kysely<DatabaseSchema>): Promise<void> {
  await sql`alter table branch_commands drop constraint branch_commands_result_ck`.execute(database);
  await sql`alter table branch_commands add constraint branch_commands_result_ck check (result_version >= 0 and result_status in ('ACTIVE','INACTIVE'))`.execute(database);
  await database.schema.alterTable('branch_commands')
    .dropColumn('result_updated_at')
    .dropColumn('result_created_at')
    .dropColumn('result_admission_revision')
    .dropColumn('result_time_zone')
    .dropColumn('result_display_name')
    .execute();
}
