export async function up(database) {
  await database.schema
    .createTable('migration_probe_a')
    .addColumn('id', 'integer', (column) => column.primaryKey())
    .execute();
}

export async function down(database) {
  await database.schema.dropTable('migration_probe_a').execute();
}
