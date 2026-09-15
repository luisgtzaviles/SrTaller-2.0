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
    '20260903130000_repairs_create_location_movements.ts',
    '20260904120000_stations_add_branch_timezone.ts',
    '20260905160000_stations_create_trusted_runtime_context.ts',
    '20260906170000_users_create_directory.ts',
    '20260906171000_users_create_provisioning_bootstraps.ts',
    '20260906172000_users_create_lifecycle_commands.ts',
    '20260906180000_access_create_capability_catalog.ts',
    '20260906181000_access_create_roles.ts',
    '20260906182000_access_create_role_assignments.ts',
    '20260907010000_access_create_pin_credentials.ts',
    '20260907110000_stations_add_admission_revisions.ts',
    '20260907111000_users_add_admission_revision.ts',
    '20260907120000_access_create_operational_sessions.ts',
    '20260907220000_repairs_create_business_audit_events.ts',
    '20260907230000_access_add_local_administration_capabilities.ts',
    '20260908000000_access_harden_pin_only_lookup.ts',
    '20260908001000_repairs_create_operational_note_request_guards.ts',
    '20260908002000_access_add_role_editing_commands.ts',
    '20260908010000_access_narrow_pin_eligibility_triggers.ts',
    '20260908020000_users_create_profile_update_commands.ts',
    '20260908021000_users_create_commands.ts',
    '20260908110000_access_add_repairs_create_capability.ts',
    '20260908111000_customers_create_branch_minimum.ts',
    '20260908112000_repairs_enable_minimum_intake_creation.ts',
    '20260908113000_repairs_expand_classic_intake.ts',
      '20260908114000_repairs_expand_avicell_reception.ts',
      '20260908115000_access_add_repairs_configuration_capabilities.ts',
      '20260908120000_repairs_create_new_repair_field_policies.ts',
      '20260908121000_access_add_repairs_catalog_capabilities.ts',
      '20260908122000_repairs_create_risk_catalog.ts',
      '20260908123000_repairs_create_brand_catalog.ts',
      '20260908124000_repairs_create_model_catalog.ts',
      '20260908125000_repairs_enforce_model_brand_compatibility.ts',
      '20260908125100_access_add_repairs_correct_intake_capability.ts',
      '20260908125200_repairs_create_equipment_corrections.ts',
      '20260908130000_access_add_repairs_classify_capability.ts',
      '20260908130100_repairs_create_problem_category_catalog.ts',
      '20260908131000_repairs_add_problem_capture_reconciliation.ts',
      '20260909100000_repairs_add_problem_category_safe_delete.ts',
      '20260909220000_users_create_preferences.ts',
      '20260910230000_repairs_create_device_type_catalog.ts',
      '20260912180000_access_enable_concurrent_operational_sessions.ts',
      '20260912190000_tenancy_add_operating_currency.ts',
      '20260912191000_access_add_catalog_capabilities.ts',
      '20260912192000_users_add_price_list_cost_preference.ts',
      '20260912193000_catalog_create_pricing_core.ts',
      '20260912200000_catalog_add_reference_governance.ts',
      '20260912210000_catalog_unify_pending_reference_reconciliation.ts',
      '20260913120000_catalog_add_reference_safe_delete.ts',
      '20260913121000_repairs_add_reference_safe_delete.ts',
      '20260913130000_catalog_enforce_reference_identity.ts',
      '20260913140000_catalog_add_canonical_reference_merge.ts',
      '20260914150000_catalog_create_bulk_composer.ts',
      '20260914151000_catalog_strengthen_supplier_history.ts',
      '20260914152000_access_add_catalog_bulk_retire_capability.ts',
      '20260914153000_catalog_create_retirement_plans.ts',
      '20260914154000_catalog_add_historical_reactivation.ts',
    ],
  );
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
