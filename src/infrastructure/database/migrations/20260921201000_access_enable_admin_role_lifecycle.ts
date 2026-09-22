import { sql, type Kysely } from 'kysely';

import type { DatabaseSchema } from '../database-types.js';

export async function up(database: Kysely<DatabaseSchema>): Promise<void> {
  await sql`alter table access_role_commands drop constraint access_role_commands_type_ck`.execute(database);
  await sql`alter table access_role_commands add constraint access_role_commands_type_ck check (command_type in ('create', 'update', 'replace_capabilities', 'deactivate', 'reactivate'))`.execute(database);
}

export async function down(database: Kysely<DatabaseSchema>): Promise<void> {
  await sql`delete from access_role_commands where command_type in ('deactivate', 'reactivate')`.execute(database);
  await sql`alter table access_role_commands drop constraint access_role_commands_type_ck`.execute(database);
  await sql`alter table access_role_commands add constraint access_role_commands_type_ck check (command_type in ('create', 'update', 'replace_capabilities'))`.execute(database);
}
