import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const migrationPath =
  'src/infrastructure/database/migrations/20260907220000_repairs_create_business_audit_events.ts';
const guardMigrationPath =
  'src/infrastructure/database/migrations/20260908001000_repairs_create_operational_note_request_guards.ts';
const readinessPath = 'src/infrastructure/database/database-runtime.ts';

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
  const down = migration.slice(migration.indexOf('export async function down'));
  assert.doesNotMatch(down, /varchar\(120\)|alterColumn\('actor_display_name'/u);
  assert.doesNotMatch(
    migration,
    /addColumn\('(?:pin|token|cookie|csrf|sql|body|payload)/iu,
  );
});

test('PBI-028 durable request guard serializes retries without raw SQL', async () => {
  const [migration, readiness] = await Promise.all([
    readFile(guardMigrationPath, 'utf8'),
    readFile(readinessPath, 'utf8'),
  ]);
  assert.match(migration, /createTable\('repair_operational_note_request_guards'\)/u);
  assert.match(migration, /repair_business_audit_events_timeline_entry_fk/u);
  assert.match(migration, /\[\s*'tenant_id',\s*'branch_id',\s*'resource_id',\s*'client_request_id'\]/u);
  assert.match(migration, /char_length\(btrim\(actor_display_name\)\) between 1 and 160/u);
  assert.match(migration, /repair_operational_note_request_guards_pk/u);
  assert.match(migration, /\[\s*'tenant_id',\s*'branch_id',\s*'action',\s*'client_request_id',?\s*\]/u);
  assert.match(migration, /action = 'repair\.operational_note\.added'/u);
  assert.doesNotMatch(migration, /pin|token|cookie|header|secret|payload|body/iu);
  assert.match(readiness, /selectFrom\('repair_business_audit_events'\)/u);
  assert.match(readiness, /selectFrom\('repair_operational_note_request_guards'\)/u);
});
