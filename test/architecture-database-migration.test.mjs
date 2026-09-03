import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import test from 'node:test';

const runnerPath = 'src/infrastructure/database/migration-runner.ts';
const capabilityPath =
  'src/infrastructure/database/database-migration-capability.ts';
const providerPath =
  'src/infrastructure/database/database-migration-provider.ts';
const productMigrationRoot =
  'src/infrastructure/database/migrations';

test('migration runner, capability and provider retain exact governed ownership', async () => {
  const policy = JSON.parse(
    await readFile('architecture/dec-005-policy.json', 'utf8'),
  );

  assert.equal(policy.persistence.status, 'tenant-schema-materialized');
  assert.deepEqual(policy.persistence.migrationBoundary, {
    runner: runnerPath,
    capability: capabilityPath,
    provider: providerPath,
    allowedInternalConsumers: {
      [capabilityPath]: [
        'src/infrastructure/database/database-connection.ts',
        runnerPath,
      ],
      [providerPath]: [
        runnerPath,
        'src/infrastructure/database/database-runtime.ts',
      ],
    },
  });
  assert.equal(
    policy.persistence.infrastructureFiles[runnerPath].status,
    'materialized-migration-runner',
  );
  assert.deepEqual(
    policy.persistence.infrastructureFiles[runnerPath].consumers,
    ['src/db-migrate.ts'],
  );
});

test('public migration API remains narrow with governed productive migrations', async () => {
  const [runner, provider, capability] = await Promise.all([
    readFile(runnerPath, 'utf8'),
    readFile(providerPath, 'utf8'),
    readFile(capabilityPath, 'utf8'),
  ]);

  for (const publicName of [
    'DatabaseMigrationRunnerOptions',
    'DatabaseMigrationDownAuthorization',
    'DatabaseMigrationStatusItem',
    'DatabaseMigrationStatus',
    'DatabaseMigrationExecution',
    'DatabaseMigrationRunner',
    'DatabaseMigrationError',
    'createMigrationRunner',
  ]) {
    assert.match(
      runner,
      new RegExp(
        `export (?:type |interface |class |function )${publicName}\\b`,
        'u',
      ),
    );
  }
  assert.match(provider, /new FileMigrationProvider\(/u);
  assert.match(runner, /new Migrator\(/u);
  assert.match(runner, /allowUnorderedMigrations: false/u);
  assert.match(runner, /pg_try_advisory_lock/u);
  assert.match(runner, /pg_advisory_unlock/u);
  assert.doesNotMatch(
    runner,
    /export (?:type |interface |class |const |function )(?:Migrator|FileMigrationProvider|Kysely|Pool|sql|migrationRoot)\b/u,
  );
  assert.match(capability, /unique symbol/u);
  assert.deepEqual(await readdir(productMigrationRoot), [
    '20260725183832_database_create_tenants_and_branches.ts',
    '20260819120000_database_create_repairs_worklist.ts',
    '20260819130000_repairs_create_intakes.ts',
    '20260819140000_repairs_create_timeline_entries.ts',
    '20260819150000_repairs_create_attachments.ts',
    '20260820090000_repairs_add_operational_note_idempotency.ts',
    '20260902090000_repairs_create_technician_assignment.ts',
    '20260902093000_repairs_add_technician_unassignment_idempotency.ts',
    '20260902100000_repairs_enforce_technician_scope.ts',
    '20260903120000_repairs_create_workflow_transitions.ts',
  ]);
});

test('startup, AppModule and product modules do not consume migration facilities', async () => {
  const files = [
    'src/main.ts',
    'src/app.module.ts',
    'src/modules/access/access.module.ts',
    'src/modules/stations/stations.module.ts',
    'src/modules/tenancy/tenancy.module.ts',
  ];
  const combined = (
    await Promise.all(files.map((file) => readFile(file, 'utf8')))
  ).join('\n');

  assert.doesNotMatch(
    combined,
    /migration-runner|database-migration-provider|databaseMigrationCapability/u,
  );
  assert.doesNotMatch(combined, /migrateToLatest|migrateUp|migrateDown/u);
});

test('one-shot migration entrypoint is the only operational runner consumer', async () => {
  const source = await readFile('src/db-migrate.ts', 'utf8');

  assert.match(source, /createMigrationRunner/u);
  assert.match(source, /migrateToLatest/u);
  assert.doesNotMatch(source, /migrateDown|migrateUp/u);
  assert.doesNotMatch(source, /NestFactory|application\.listen/u);
});

test('experimental fixtures are isolated from the productive migration root', async () => {
  const fixturePaths = [
    'test/fixtures/database-migrations/valid/20260725010000_database_create_probe_a.js',
    'test/fixtures/database-migrations/valid/20260725010100_database_create_probe_b.js',
    'test/fixtures/database-migrations/failing/20260725010200_database_create_probe_failure.js',
    'test/fixtures/database-migrations/no-down/20260725010300_database_create_probe_no_down.js',
    'test/fixtures/database-migrations/down-fails/20260725010400_database_create_probe_down_failure.js',
    'test/fixtures/database-migrations/locking/20260725010500_database_create_probe_lock.js',
  ];
  const combined = (
    await Promise.all(fixturePaths.map((file) => readFile(file, 'utf8')))
  ).join('\n');
  assert.match(combined, /migration_probe_/u);
  assert.doesNotMatch(
    combined,
    /\b(?:tenants|branches|users|repairs)\b/iu,
  );
});
