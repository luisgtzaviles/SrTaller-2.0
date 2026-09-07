import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const migrationPath =
  'src/infrastructure/database/migrations/20260907220000_repairs_create_business_audit_events.ts';

test('PBI-028 migration creates a scoped append-only Repairs audit store', async () => {
  const migration = await readFile(migrationPath, 'utf8');

  assert.match(migration, /createTable\('repair_business_audit_events'\)/u);
  const allowedColumns = [
    'audit_id', 'tenant_id', 'branch_id', 'station_id', 'session_id',
    'actor_user_id', 'actor_display_name', 'capability', 'action',
    'resource_type', 'resource_id', 'result', 'correlation_id',
    'client_request_id', 'occurred_at', 'created_at',
  ];
  for (const column of allowedColumns) {
    assert.match(migration, new RegExp(`addColumn\\('${column}'`, 'u'));
  }
  assert.deepEqual(
    [...migration.matchAll(/\.addColumn\('([^']+)'/gu)].map((match) => match[1]),
    allowedColumns,
  );
  assert.match(migration, /repair_business_audit_events_repair_scope_fk/u);
  assert.match(migration, /\['tenant_id', 'branch_id', 'resource_id'\]/u);
  assert.match(migration, /repair_business_audit_events_request_uq/u);
  assert.match(migration, /repair_business_audit_events_correlation_uq/u);
  assert.match(
    migration,
    /addColumn\('actor_display_name', 'varchar\(160\)'/u,
  );
  assert.match(migration, /capability = 'repairs\.add_note'/u);
  assert.match(migration, /action = 'repair\.operational_note\.added'/u);
  assert.match(migration, /resource_type = 'repair'/u);
  assert.match(migration, /result = 'succeeded'/u);
  assert.match(migration, /before update on repair_business_audit_events/u);
  assert.match(migration, /before delete on repair_business_audit_events/u);
  assert.match(migration, /drop trigger if exists/u);
  assert.match(migration, /drop function if exists/u);
  assert.match(migration, /dropTable\('repair_business_audit_events'\)/u);
  assert.doesNotMatch(
    migration,
    /addColumn\('(?:pin|token|cookie|csrf|sql|body|payload)/iu,
  );
});
