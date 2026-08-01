import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import test from 'node:test';

const migrationPath =
  'src/infrastructure/database/migrations/20260725183832_database_create_tenants_and_branches.ts';
const stationMigrationPath =
  'src/infrastructure/database/migrations/20260726160000_stations_create_stations_and_bindings.ts';
const previewMigrationPath =
  'src/infrastructure/database/migrations/20260801140000_preview_create_repairs_and_status_history.ts';

test('initial schema registry has exact owners, keys and physical scope', async () => {
  const policy = JSON.parse(
    await readFile('architecture/dec-005-policy.json', 'utf8'),
  );
  assert.equal(
    policy.persistence.status,
    'visual-slice-0-preview-schema-materialized',
  );
  assert.deepEqual(policy.persistence.databaseObjects, {
    branches: { owner: 'tenancy', kind: 'table' },
    preview_repair_status_history: { owner: 'preview', kind: 'table' },
    preview_repairs: { owner: 'preview', kind: 'table' },
    station_bindings: { owner: 'stations', kind: 'table' },
    stations: { owner: 'stations', kind: 'table' },
    tenants: { owner: 'tenancy', kind: 'table' },
  });
  assert.deepEqual(policy.persistence.initialSchema, {
    migration: migrationPath,
    tables: ['tenants', 'branches'],
    tenantColumns: ['tenant_id', 'created_at'],
    branchColumns: ['tenant_id', 'branch_id', 'created_at'],
    columnTypes: {
      tenant_id: 'uuid',
      branch_id: 'uuid',
      created_at: 'timestamptz',
    },
    tenantPrimaryKeyName: 'tenants_pk',
    tenantPrimaryKey: ['tenant_id'],
    branchPrimaryKeyName: 'branches_pk',
    branchPrimaryKey: ['tenant_id', 'branch_id'],
    branchTenantForeignKey: {
      name: 'branches_tenant_fk',
      columns: ['tenant_id'],
      targetTable: 'tenants',
      targetColumns: ['tenant_id'],
      onUpdate: 'restrict',
      onDelete: 'restrict',
    },
    status: 'tenant-schema-materialized',
  });
  assert.deepEqual(policy.persistence.stationSchema, {
    migration: stationMigrationPath,
    tables: ['stations', 'station_bindings'],
    stationPrimaryKey: ['tenant_id', 'station_id'],
    bindingPrimaryKey: ['tenant_id', 'station_id', 'binding_revision'],
    openBindingUniqueIndex: 'station_bindings_one_open_uq',
    status: 'station-context-schema-materialized',
  });
  assert.deepEqual(policy.persistence.previewSchema, {
    migration: previewMigrationPath,
    tables: ['preview_repairs', 'preview_repair_status_history'],
    repairPrimaryKey: ['tenant_id', 'branch_id', 'repair_id'],
    historyPrimaryKey: ['tenant_id', 'branch_id', 'history_id'],
    scopeIndex: 'preview_repairs_scope_created_idx',
    status: 'visual-slice-0-preview-schema-materialized',
  });
  assert.equal(
    policy.persistence.infrastructureFiles[
      'src/infrastructure/database/database-types.ts'
    ].status,
    'materialized-schema-contract',
  );
});

test('productive migration root contains exactly the governed files', async () => {
  assert.deepEqual(
    await readdir('src/infrastructure/database/migrations'),
    [
      migrationPath.split('/').at(-1),
      stationMigrationPath.split('/').at(-1),
      previewMigrationPath.split('/').at(-1),
    ],
  );
  const migration = await readFile(migrationPath, 'utf8');
  for (const forbidden of [
    'insertInto',
    'updateTable',
    'deleteFrom',
    'mergeInto',
    '.cascade(',
    'sql`',
  ]) {
    assert.equal(migration.includes(forbidden), false);
  }
  const stationMigration = await readFile(stationMigrationPath, 'utf8');
  assert.match(stationMigration, /createTable\('stations'\)/u);
  assert.match(stationMigration, /createTable\('station_bindings'\)/u);
  assert.match(stationMigration, /station_bindings_one_open_uq/u);
  assert.match(stationMigration, /where\(sql<SqlBool>`unlinked_at is null`\)/u);
  assert.doesNotMatch(
    stationMigration,
    /\b(?:actor_id|reason|session_id|user_id|role|secret)\b/iu,
  );
  const previewMigration = await readFile(previewMigrationPath, 'utf8');
  assert.match(previewMigration, /createTable\('preview_repairs'\)/u);
  assert.match(
    previewMigration,
    /createTable\('preview_repair_status_history'\)/u,
  );
  assert.match(previewMigration, /preview_repairs_scope_created_idx/u);
});

test('database schema types are immutable and require externally supplied identity and time', async () => {
  const schema = await readFile(
    'src/infrastructure/database/database-types.ts',
    'utf8',
  );
  assert.match(schema, /type ImmutableColumn<T> = ColumnType<T, T, never>/u);
  assert.match(schema, /readonly tenant_id: ImmutableColumn<string>/u);
  assert.match(schema, /readonly branch_id: ImmutableColumn<string>/u);
  assert.match(schema, /readonly created_at: ImmutableColumn<Date>/u);
  assert.match(schema, /readonly station_id: ImmutableColumn<string>/u);
  assert.match(schema, /readonly binding_revision: ImmutableColumn<number>/u);
  assert.doesNotMatch(schema, /Generated/u);
});
