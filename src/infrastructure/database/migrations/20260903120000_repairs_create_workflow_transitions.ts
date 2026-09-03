import { sql, type Kysely } from 'kysely';

import type { DatabaseSchema } from '../database-types.js';

export async function up(database: Kysely<DatabaseSchema>): Promise<void> {
  await database.schema
    .createTable('repair_workflow_transitions')
    .addColumn('transition_id', 'uuid', (column) => column.notNull())
    .addColumn('tenant_id', 'uuid', (column) => column.notNull())
    .addColumn('branch_id', 'uuid', (column) => column.notNull())
    .addColumn('repair_id', 'uuid', (column) => column.notNull())
    .addColumn('command', 'varchar(40)', (column) => column.notNull())
    .addColumn('from_state', 'varchar(32)', (column) => column.notNull())
    .addColumn('to_state', 'varchar(32)', (column) => column.notNull())
    .addColumn('actor_id', 'uuid', (column) => column.notNull())
    .addColumn('actor_display_name', 'varchar(120)', (column) => column.notNull())
    .addColumn('occurred_at', 'timestamptz', (column) => column.notNull())
    .addColumn('reason', 'varchar(1000)')
    .addColumn('client_request_id', 'uuid', (column) => column.notNull())
    .addColumn('expected_workflow_version', 'integer', (column) => column.notNull())
    .addColumn('workflow_version', 'integer', (column) => column.notNull())
    .addPrimaryKeyConstraint('repair_workflow_transitions_pk', ['transition_id'])
    .addForeignKeyConstraint(
      'repair_workflow_transitions_repair_scope_fk',
      ['tenant_id', 'branch_id', 'repair_id'],
      'repairs',
      ['tenant_id', 'branch_id', 'repair_id'],
      (constraint) => constraint.onUpdate('restrict').onDelete('restrict'),
    )
    .addCheckConstraint('repair_workflow_transitions_command_ck', sql`command = 'start_diagnosis'`)
    .addCheckConstraint('repair_workflow_transitions_states_ck', sql`from_state = 'pending' and to_state = 'diagnosing'`)
    .addCheckConstraint('repair_workflow_transitions_reason_ck', sql`reason is null`)
    .addCheckConstraint('repair_workflow_transitions_version_ck', sql`expected_workflow_version >= 0 and workflow_version = expected_workflow_version + 1`)
    .execute();

  await database.schema
    .createIndex('repair_workflow_transitions_version_uq')
    .on('repair_workflow_transitions')
    .columns(['tenant_id', 'branch_id', 'repair_id', 'workflow_version'])
    .unique()
    .execute();
  await database.schema
    .createIndex('repair_workflow_transitions_request_uq')
    .on('repair_workflow_transitions')
    .columns(['tenant_id', 'branch_id', 'repair_id', 'client_request_id'])
    .unique()
    .execute();
  await database.schema
    .createIndex('repair_workflow_transitions_history_idx')
    .on('repair_workflow_transitions')
    .columns(['tenant_id', 'branch_id', 'repair_id', 'occurred_at', 'transition_id'])
    .execute();
}

export async function down(database: Kysely<DatabaseSchema>): Promise<void> {
  await database.schema.dropIndex('repair_workflow_transitions_history_idx').execute();
  await database.schema.dropIndex('repair_workflow_transitions_request_uq').execute();
  await database.schema.dropIndex('repair_workflow_transitions_version_uq').execute();
  await database.schema.dropTable('repair_workflow_transitions').execute();
}
