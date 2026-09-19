import { sql, type Kysely } from 'kysely';

import type { DatabaseSchema } from '../database-types.js';

export async function up(database: Kysely<DatabaseSchema>): Promise<void> {
  await sql`
    alter table catalog_supplier_catalog_versions
      add column supersedes_version_id uuid;

    alter table catalog_supplier_catalog_versions
      add constraint catalog_supplier_versions_supersedes_fk
      foreign key (tenant_id, supersedes_version_id)
      references catalog_supplier_catalog_versions (tenant_id, version_id);

    alter table catalog_supplier_catalog_versions
      add constraint catalog_supplier_versions_supersedes_self_ck
      check (supersedes_version_id is null or supersedes_version_id <> version_id);

    alter table catalog_supplier_reconciliation_memory
      add column first_confirmed_at timestamptz,
      add column consistency_state varchar(16) not null default 'CONSISTENT',
      add column correction_count integer not null default 0;

    update catalog_supplier_reconciliation_memory
    set first_confirmed_at = last_confirmed_at
    where first_confirmed_at is null;

    alter table catalog_supplier_reconciliation_memory
      alter column first_confirmed_at set not null;

    alter table catalog_supplier_reconciliation_memory
      add constraint catalog_supplier_memory_consistency_ck
      check (consistency_state in ('CONSISTENT','CONFLICTED'));

    alter table catalog_supplier_reconciliation_memory
      add constraint catalog_supplier_memory_correction_ck
      check (correction_count >= 0 and
        ((consistency_state = 'CONSISTENT' and correction_count = 0) or
         (consistency_state = 'CONFLICTED' and correction_count > 0)));
  `.execute(database);
}

export async function down(database: Kysely<DatabaseSchema>): Promise<void> {
  await sql`
    alter table catalog_supplier_reconciliation_memory
      drop constraint catalog_supplier_memory_correction_ck,
      drop constraint catalog_supplier_memory_consistency_ck,
      drop column correction_count,
      drop column consistency_state,
      drop column first_confirmed_at;

    alter table catalog_supplier_catalog_versions
      drop constraint catalog_supplier_versions_supersedes_self_ck,
      drop constraint catalog_supplier_versions_supersedes_fk,
      drop column supersedes_version_id;
  `.execute(database);
}
