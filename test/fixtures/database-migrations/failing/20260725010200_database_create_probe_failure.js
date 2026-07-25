export async function up(database) {
  await database.schema
    .createTable('migration_probe_failure')
    .addColumn('id', 'integer', (column) => column.primaryKey())
    .execute();
  throw new Error(
    'synthetic failure password=must-not-escape /private/runtime/migration.sql',
  );
}

export async function down(database) {
  await database.schema.dropTable('migration_probe_failure').execute();
}
