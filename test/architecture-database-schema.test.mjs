import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import test from 'node:test';

const migrationPath =
  'src/infrastructure/database/migrations/20260725183832_database_create_tenants_and_branches.ts';

test('initial schema registry has exact owners, keys and physical scope', async () => {
  const policy = JSON.parse(
    await readFile('architecture/dec-005-policy.json', 'utf8'),
  );
  assert.equal(policy.persistence.status, 'tenant-schema-materialized');
  assert.deepEqual(policy.persistence.databaseObjects, {
    branches: { owner: 'stations', kind: 'table' },
    repairs: { owner: 'repairs', kind: 'table' },
    repair_intakes: { owner: 'repairs', kind: 'table' },
    repair_timeline_entries: { owner: 'repairs', kind: 'table' },
    repair_attachments: { owner: 'repairs', kind: 'table' },
    repair_technicians: { owner: 'repairs', kind: 'table' },
    repair_technician_branches: { owner: 'repairs', kind: 'table' },
    repair_technician_assignments: { owner: 'repairs', kind: 'table' },
    repair_workflow_transitions: { owner: 'repairs', kind: 'table' },
    repair_locations: { owner: 'repairs', kind: 'table' },
    repair_location_movements: { owner: 'repairs', kind: 'table' },
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
  assert.equal(
    policy.persistence.infrastructureFiles[
      'src/infrastructure/database/database-types.ts'
    ].status,
    'materialized-schema-contract',
  );
});

test('initial productive migration root contains exactly one governed file', async () => {
  assert.deepEqual(
    await readdir('src/infrastructure/database/migrations'),
    [
      migrationPath.split('/').at(-1),
      '20260819120000_database_create_repairs_worklist.ts',
      '20260819130000_repairs_create_intakes.ts',
      '20260819140000_repairs_create_timeline_entries.ts',
      '20260819150000_repairs_create_attachments.ts',
      '20260820090000_repairs_add_operational_note_idempotency.ts',
      '20260902090000_repairs_create_technician_assignment.ts',
      '20260902093000_repairs_add_technician_unassignment_idempotency.ts',
      '20260902100000_repairs_enforce_technician_scope.ts',
      '20260903120000_repairs_create_workflow_transitions.ts',
      '20260903130000_repairs_create_location_movements.ts',
      '20260904120000_stations_add_branch_timezone.ts',
      '20260905160000_stations_create_trusted_runtime_context.ts',
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
});

test('database schema types are immutable and require externally supplied identity and time', async () => {
  const schema = await readFile(
    'src/infrastructure/database/database-types.ts',
    'utf8',
  );
  assert.match(schema, /type ImmutableColumn<T> = ColumnType<T, T, never>/u);
  assert.match(schema, /readonly tenant_id: ImmutableColumn<string>/u);
  assert.match(schema, /readonly branch_id: ImmutableColumn<string>/u);
  assert.match(schema, /readonly time_zone: MutableColumn<string>/u);
  assert.match(schema, /readonly created_at: ImmutableColumn<Date>/u);
  assert.doesNotMatch(schema, /Generated/u);
});
