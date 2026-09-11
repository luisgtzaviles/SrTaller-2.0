import { sql, type Kysely } from 'kysely';

import type { DatabaseSchema } from '../database-types.js';

/** Owner-approved Classic 2.0 intake snapshot fields for PBI-039. */
export async function up(database: Kysely<DatabaseSchema>): Promise<void> {
  await database.schema.alterTable('repair_intakes').addColumn('device_type', 'varchar(80)').execute();
  await database.schema.alterTable('repair_intakes').addColumn('device_identifier', 'varchar(120)').execute();
  await database.schema.alterTable('repair_intakes').addColumn('device_identifier_unavailable', 'boolean', (column) => column.notNull().defaultTo(false)).execute();
  await database.schema.alterTable('repair_intakes').addColumn('distinctive_signs', 'varchar(1200)').execute();
  await database.schema.alterTable('repair_intakes').addColumn('sim_included', 'boolean').execute();
  await database.schema.alterTable('repair_intakes').addColumn('memory_card_included', 'boolean').execute();
  await database.schema.alterTable('repair_intakes').addColumn('other_accessories', 'varchar(800)').execute();
  await database.schema.alterTable('repair_intakes').addColumn('warranty_review_requested', 'boolean', (column) => column.notNull().defaultTo(false)).execute();
  await database.schema.alterTable('repair_intakes').addColumn('previous_repair_id', 'uuid').execute();
  await database.schema.alterTable('repair_intakes').addColumn('delivered_by_name', 'varchar(200)').execute();
  await database.schema.alterTable('repair_intakes').addColumn('estimated_delivery_at', 'timestamptz').execute();
  await database.schema.alterTable('repair_intakes')
    .addCheckConstraint(
      'repair_intakes_identifier_availability_ck',
      sql`not (device_identifier_unavailable and device_identifier is not null)`,
    ).execute();
  await database.schema.alterTable('repair_intakes')
    .addCheckConstraint(
      'repair_intakes_previous_warranty_ck',
      sql`previous_repair_id is null or warranty_review_requested`,
    ).execute();
  await database.schema.alterTable('repair_intakes')
    .addCheckConstraint(
      'repair_intakes_previous_not_self_ck',
      sql`previous_repair_id is null or previous_repair_id <> repair_id`,
    ).execute();
  await database.schema.alterTable('repair_intakes')
    .addForeignKeyConstraint(
      'repair_intakes_previous_repair_scope_fk',
      ['tenant_id', 'branch_id', 'previous_repair_id'],
      'repairs',
      ['tenant_id', 'branch_id', 'repair_id'],
      (constraint) => constraint.onUpdate('restrict').onDelete('restrict'),
    )
    .execute();
}

export async function down(database: Kysely<DatabaseSchema>): Promise<void> {
  await database.schema.alterTable('repair_intakes').dropConstraint('repair_intakes_previous_repair_scope_fk').execute();
  await database.schema.alterTable('repair_intakes').dropConstraint('repair_intakes_previous_not_self_ck').execute();
  await database.schema.alterTable('repair_intakes').dropConstraint('repair_intakes_previous_warranty_ck').execute();
  await database.schema.alterTable('repair_intakes').dropConstraint('repair_intakes_identifier_availability_ck').execute();
  await database.schema.alterTable('repair_intakes').dropColumn('estimated_delivery_at').execute();
  await database.schema.alterTable('repair_intakes').dropColumn('delivered_by_name').execute();
  await database.schema.alterTable('repair_intakes').dropColumn('previous_repair_id').execute();
  await database.schema.alterTable('repair_intakes').dropColumn('warranty_review_requested').execute();
  await database.schema.alterTable('repair_intakes').dropColumn('other_accessories').execute();
  await database.schema.alterTable('repair_intakes').dropColumn('memory_card_included').execute();
  await database.schema.alterTable('repair_intakes').dropColumn('sim_included').execute();
  await database.schema.alterTable('repair_intakes').dropColumn('distinctive_signs').execute();
  await database.schema.alterTable('repair_intakes').dropColumn('device_identifier_unavailable').execute();
  await database.schema.alterTable('repair_intakes').dropColumn('device_identifier').execute();
  await database.schema.alterTable('repair_intakes').dropColumn('device_type').execute();
}
