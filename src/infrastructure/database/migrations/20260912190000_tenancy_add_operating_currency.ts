import { sql, type Kysely } from 'kysely';

import type { DatabaseSchema } from '../database-types.js';

export async function up(database: Kysely<DatabaseSchema>): Promise<void> {
  await database.schema
    .alterTable('tenants')
    .addColumn('operating_currency', 'varchar(3)')
    .execute();
  await sql`update tenants set operating_currency = 'MXN' where operating_currency is null`.execute(database);
  await database.schema
    .alterTable('tenants')
    .alterColumn('operating_currency', (column) => column.setNotNull())
    .execute();
  await database.schema
    .alterTable('tenants')
    .addCheckConstraint(
      'tenants_operating_currency_ck',
      sql`operating_currency ~ '^[A-Z]{3}$'`,
    )
    .execute();
}

export async function down(database: Kysely<DatabaseSchema>): Promise<void> {
  await database.schema
    .alterTable('tenants')
    .dropColumn('operating_currency')
    .execute();
}
