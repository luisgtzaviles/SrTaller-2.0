import { sql, type Kysely } from 'kysely';

import type { DatabaseSchema } from '../database-types.js';

/**
 * Existing supplier versions predate the completeness contract.  Their coverage
 * is unknown, so the only safe historical value is PARTIAL.
 */
export async function up(database: Kysely<DatabaseSchema>): Promise<void> {
  await sql`
    alter table catalog_supplier_catalog_versions
      add column completeness varchar(16) not null default 'PARTIAL',
      add constraint catalog_supplier_versions_completeness_ck
        check (completeness in ('PARTIAL', 'COMPLETE'));
  `.execute(database);
}

export async function down(database: Kysely<DatabaseSchema>): Promise<void> {
  await sql`
    alter table catalog_supplier_catalog_versions
      drop constraint catalog_supplier_versions_completeness_ck,
      drop column completeness;
  `.execute(database);
}
