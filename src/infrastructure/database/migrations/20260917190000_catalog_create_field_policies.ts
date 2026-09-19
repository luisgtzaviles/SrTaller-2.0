import { sql, type Kysely } from 'kysely';
import type { DatabaseSchema } from '../database-types.js';
export async function up(database: Kysely<DatabaseSchema>): Promise<void> {
  await database.schema.createTable('catalog_field_policy_heads')
    .addColumn('tenant_id', 'uuid', (column) => column.notNull())
    .addColumn('schema_version', 'integer', (column) => column.notNull())
    .addColumn('current_version', 'integer', (column) => column.notNull())
    .addColumn('field_levels', 'jsonb', (column) => column.notNull())
    .addColumn('created_at', 'timestamptz', (column) => column.notNull())
    .addColumn('updated_at', 'timestamptz', (column) => column.notNull())
    .addPrimaryKeyConstraint('catalog_field_policy_heads_pk', ['tenant_id'])
    .addForeignKeyConstraint('catalog_field_policy_heads_tenant_fk', ['tenant_id'], 'tenants', ['tenant_id'], (constraint) => constraint.onUpdate('restrict').onDelete('restrict'))
    .addCheckConstraint('catalog_field_policy_heads_version_ck', sql`schema_version >= 1 and current_version >= 0`).execute();
  await database.schema.createTable('catalog_field_policy_versions')
    .addColumn('tenant_id', 'uuid', (column) => column.notNull()).addColumn('policy_version', 'integer', (column) => column.notNull())
    .addColumn('schema_version', 'integer', (column) => column.notNull()).addColumn('previous_version', 'integer', (column) => column.notNull())
    .addColumn('field_levels', 'jsonb', (column) => column.notNull()).addColumn('actor_user_id', 'uuid', (column) => column.notNull())
    .addColumn('actor_display_name', 'varchar(200)', (column) => column.notNull()).addColumn('station_id', 'uuid', (column) => column.notNull()).addColumn('session_id', 'uuid', (column) => column.notNull())
    .addColumn('capability', 'varchar(64)', (column) => column.notNull()).addColumn('action', 'varchar(64)', (column) => column.notNull()).addColumn('result', 'varchar(32)', (column) => column.notNull())
    .addColumn('correlation_id', 'uuid', (column) => column.notNull()).addColumn('occurred_at', 'timestamptz', (column) => column.notNull())
    .addPrimaryKeyConstraint('catalog_field_policy_versions_pk', ['tenant_id', 'policy_version'])
    .addUniqueConstraint('catalog_field_policy_versions_correlation_uq', ['tenant_id', 'correlation_id'])
    .addForeignKeyConstraint('catalog_field_policy_versions_tenant_fk', ['tenant_id'], 'tenants', ['tenant_id'], (constraint) => constraint.onUpdate('restrict').onDelete('restrict'))
    .addCheckConstraint('catalog_field_policy_versions_version_ck', sql`schema_version >= 1 and policy_version = previous_version + 1`)
    .addCheckConstraint('catalog_field_policy_versions_contract_ck', sql`capability = 'catalog.configuration.manage' and action in ('catalog_field_policy.updated', 'catalog_field_policy.reset') and result = 'succeeded'`).execute();
  await sql`create trigger catalog_field_policy_versions_reject_update before update on catalog_field_policy_versions for each row execute function catalog_reject_append_only_mutation()`.execute(database);
  await sql`create trigger catalog_field_policy_versions_reject_delete before delete on catalog_field_policy_versions for each row execute function catalog_reject_append_only_mutation()`.execute(database);
}
export async function down(database: Kysely<DatabaseSchema>): Promise<void> { await sql`drop trigger if exists catalog_field_policy_versions_reject_delete on catalog_field_policy_versions`.execute(database); await sql`drop trigger if exists catalog_field_policy_versions_reject_update on catalog_field_policy_versions`.execute(database); await database.schema.dropTable('catalog_field_policy_versions').execute(); await database.schema.dropTable('catalog_field_policy_heads').execute(); }
