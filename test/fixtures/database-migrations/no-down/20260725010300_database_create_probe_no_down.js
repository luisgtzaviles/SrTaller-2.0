export async function up(database) {
  await database.schema
    .createTable('migration_probe_no_down')
    .addColumn('id', 'integer', (column) => column.primaryKey())
    .execute();
}
