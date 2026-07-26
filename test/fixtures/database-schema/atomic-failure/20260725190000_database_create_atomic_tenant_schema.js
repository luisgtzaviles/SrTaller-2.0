export async function up(database) {
  await database.schema
    .createTable('tenants')
    .addColumn('tenant_id', 'uuid', (column) => column.notNull())
    .addColumn('created_at', 'timestamptz', (column) => column.notNull())
    .addPrimaryKeyConstraint('tenants_pk', ['tenant_id'])
    .execute();
  await database.schema
    .createTable('branches')
    .addColumn('tenant_id', 'uuid', (column) => column.notNull())
    .addColumn('branch_id', 'uuid', (column) => column.notNull())
    .addColumn('created_at', 'timestamptz', (column) => column.notNull())
    .addPrimaryKeyConstraint('branches_pk', ['tenant_id', 'branch_id'])
    .addForeignKeyConstraint(
      'branches_tenant_fk',
      ['tenant_id'],
      'tenants',
      ['tenant_id'],
      (constraint) =>
        constraint.onUpdate('restrict').onDelete('restrict'),
    )
    .execute();
  await database.schema.createTable('branches').execute();
}

export async function down(database) {
  await database.schema.dropTable('branches').execute();
  await database.schema.dropTable('tenants').execute();
}
