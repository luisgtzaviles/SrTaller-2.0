export async function up(database) {
  await database.schema
    .createTable('migration_probe_down_failure')
    .addColumn('id', 'integer', (column) => column.primaryKey())
    .execute();
}

export async function down() {
  throw new Error(
    'synthetic down failure password=must-not-escape /private/runtime/down.sql',
  );
}
