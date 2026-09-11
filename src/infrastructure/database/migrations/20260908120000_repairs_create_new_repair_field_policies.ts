import { sql, type Kysely } from 'kysely';

import type { DatabaseSchema } from '../database-types.js';

export async function up(database: Kysely<DatabaseSchema>): Promise<void> {
  await database.schema.createTable('repair_new_repair_policy_heads')
    .addColumn('tenant_id', 'uuid', (column) => column.notNull())
    .addColumn('branch_id', 'uuid', (column) => column.notNull())
    .addColumn('schema_version', 'integer', (column) => column.notNull())
    .addColumn('current_version', 'integer', (column) => column.notNull())
    .addColumn('field_states', 'jsonb', (column) => column.notNull())
    .addColumn('created_at', 'timestamptz', (column) => column.notNull())
    .addColumn('updated_at', 'timestamptz', (column) => column.notNull())
    .addPrimaryKeyConstraint('repair_new_repair_policy_heads_pk', ['tenant_id', 'branch_id'])
    .addForeignKeyConstraint('repair_new_repair_policy_heads_branch_fk', ['tenant_id', 'branch_id'], 'branches', ['tenant_id', 'branch_id'], (constraint) => constraint.onUpdate('restrict').onDelete('restrict'))
    .addCheckConstraint('repair_new_repair_policy_heads_version_ck', sql`schema_version >= 1 and current_version >= 0`)
    .execute();

  await database.schema.createTable('repair_new_repair_policy_versions')
    .addColumn('tenant_id', 'uuid', (column) => column.notNull())
    .addColumn('branch_id', 'uuid', (column) => column.notNull())
    .addColumn('policy_version', 'integer', (column) => column.notNull())
    .addColumn('schema_version', 'integer', (column) => column.notNull())
    .addColumn('previous_version', 'integer', (column) => column.notNull())
    .addColumn('field_states', 'jsonb', (column) => column.notNull())
    .addColumn('actor_user_id', 'uuid', (column) => column.notNull())
    .addColumn('actor_display_name', 'varchar(200)', (column) => column.notNull())
    .addColumn('station_id', 'uuid', (column) => column.notNull())
    .addColumn('session_id', 'uuid', (column) => column.notNull())
    .addColumn('capability', 'varchar(64)', (column) => column.notNull())
    .addColumn('action', 'varchar(64)', (column) => column.notNull())
    .addColumn('result', 'varchar(32)', (column) => column.notNull())
    .addColumn('correlation_id', 'uuid', (column) => column.notNull())
    .addColumn('occurred_at', 'timestamptz', (column) => column.notNull())
    .addPrimaryKeyConstraint('repair_new_repair_policy_versions_pk', ['tenant_id', 'branch_id', 'policy_version'])
    .addUniqueConstraint('repair_new_repair_policy_versions_correlation_uq', ['tenant_id', 'branch_id', 'correlation_id'])
    .addForeignKeyConstraint('repair_new_repair_policy_versions_branch_fk', ['tenant_id', 'branch_id'], 'branches', ['tenant_id', 'branch_id'], (constraint) => constraint.onUpdate('restrict').onDelete('restrict'))
    .addCheckConstraint('repair_new_repair_policy_versions_version_ck', sql`schema_version >= 1 and policy_version = previous_version + 1`)
    .addCheckConstraint('repair_new_repair_policy_versions_contract_ck', sql`capability = 'repairs.configuration.manage' and action in ('new_repair_policy.updated', 'new_repair_policy.reset') and result = 'succeeded'`)
    .execute();

  await database.schema.alterTable('repair_intakes')
    .addColumn('new_repair_policy_version', 'integer', (column) => column.notNull().defaultTo(0))
    .execute();
  await database.schema.alterTable('repair_intakes')
    .addCheckConstraint('repair_intakes_new_repair_policy_version_ck', sql`new_repair_policy_version >= 0`)
    .execute();
}

export async function down(database: Kysely<DatabaseSchema>): Promise<void> {
  await database.schema.alterTable('repair_intakes').dropConstraint('repair_intakes_new_repair_policy_version_ck').execute();
  await database.schema.alterTable('repair_intakes').dropColumn('new_repair_policy_version').execute();
  await database.schema.dropTable('repair_new_repair_policy_versions').execute();
  await database.schema.dropTable('repair_new_repair_policy_heads').execute();
}
