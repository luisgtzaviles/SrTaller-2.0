export async function up(database) {
  await new Promise((resolve) => setTimeout(resolve, 350));
  await database.schema
    .createTable('migration_probe_lock')
    .addColumn('id', 'integer', (column) => column.primaryKey())
    .execute();
}

export async function down(database) {
  await database.schema.dropTable('migration_probe_lock').execute();
}
