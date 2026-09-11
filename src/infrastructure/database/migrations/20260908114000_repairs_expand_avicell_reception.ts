import { sql, type Kysely } from 'kysely';

import type { DatabaseSchema } from '../database-types.js';

/** Owner iterations 2-3: non-secret reception facts and initial commercial snapshot. */
export async function up(database: Kysely<DatabaseSchema>): Promise<void> {
  await database.schema.alterTable('repair_intakes').addColumn('received_power_state', 'varchar(24)').execute();
  await database.schema.alterTable('repair_intakes').addColumn('device_access_type', 'varchar(24)').execute();
  await database.schema.alterTable('repair_intakes').addColumn('initial_budget_amount_minor', 'bigint').execute();
  await database.schema.alterTable('repair_intakes')
    .addCheckConstraint(
      'repair_intakes_received_power_state_ck',
      sql`received_power_state is null or received_power_state in ('powered_on', 'powered_off')`,
    ).execute();
  await database.schema.alterTable('repair_intakes')
    .addCheckConstraint(
      'repair_intakes_device_access_type_ck',
      sql`device_access_type is null or device_access_type in ('none', 'pin', 'password', 'pattern')`,
    ).execute();
  await database.schema.alterTable('repair_intakes')
    .addCheckConstraint(
      'repair_intakes_initial_budget_amount_ck',
      sql`initial_budget_amount_minor is null or initial_budget_amount_minor between 0 and 999999999999`,
    ).execute();
}

export async function down(database: Kysely<DatabaseSchema>): Promise<void> {
  await database.schema.alterTable('repair_intakes').dropConstraint('repair_intakes_initial_budget_amount_ck').execute();
  await database.schema.alterTable('repair_intakes').dropConstraint('repair_intakes_device_access_type_ck').execute();
  await database.schema.alterTable('repair_intakes').dropConstraint('repair_intakes_received_power_state_ck').execute();
  await database.schema.alterTable('repair_intakes').dropColumn('initial_budget_amount_minor').execute();
  await database.schema.alterTable('repair_intakes').dropColumn('device_access_type').execute();
  await database.schema.alterTable('repair_intakes').dropColumn('received_power_state').execute();
}
