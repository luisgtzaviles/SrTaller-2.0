import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import { readFile } from 'node:fs/promises';
import { PassThrough } from 'node:stream';
import test from 'node:test';

import { checkArchitecture } from '../scripts/lib/architecture-checker.mjs';
import {
  createChunkSignal,
  createReadinessCoordinator,
} from '../scripts/smoke-start.mjs';
import { fixtureCases } from './architecture-fixtures.mjs';
import { persistenceFixtureCases } from './architecture-persistence-fixtures.mjs';

const marker = 'technical_shell_listening';

function deferred() {
  let resolvePromise;
  let rejectPromise;
  const promise = new Promise((resolve, reject) => {
    resolvePromise = resolve;
    rejectPromise = reject;
  });
  return { promise, reject: rejectPromise, resolve: resolvePromise };
}

function fakeChild() {
  const child = new EventEmitter();
  child.stdout = new PassThrough();
  child.stderr = new PassThrough();
  return child;
}

function destroyCoordinator(child, coordinator) {
  coordinator.cleanup();
  child.stdout.destroy();
  child.stderr.destroy();
}

test('product tree satisfies the executable DEC-005 policy', async () => {
  const result = await checkArchitecture({ root: process.cwd() });
  assert.deepEqual(result.diagnostics, []);
  assert.deepEqual(result.observedEdges, [
    'access->stations',
    'access->tenancy',
    'access->users',
    'catalog->access',
    'catalog->tenancy',
    'customers->tenancy',
    'repairs->access',
    'repairs->customers',
    'repairs->stations',
    'repairs->tenancy',
    'stations->tenancy',
    'users->tenancy',
  ]);
});

test('policy v9 registers exact directed public module composition', async () => {
  const policy = JSON.parse(
    await readFile('architecture/dec-005-policy.json', 'utf8'),
  );
  assert.equal(policy.policyVersion, 9);
  assert.deepEqual(policy.directedModuleComposition, {
    decorator: 'Module',
    edges: [
      {
        consumer: 'catalog',
        producer: 'access',
        consumerModule: {
          file: 'src/modules/catalog/catalog.module.ts',
          className: 'CatalogModule',
        },
        producerModule: {
          file: 'src/modules/access/access.module.ts',
          className: 'AccessModule',
          importSpecifier: '../access/access.module.js',
        },
        publicBindings: [
          {
            token: 'CONTEXTUAL_AUTHORIZATION_EXECUTOR',
            contract: 'ContextualAuthorizationExecutor',
            consumerImportSpecifier: '../access/index.js',
            producerImportSpecifier: './index.js',
          },
          {
            token: 'TENANT_WIDE_AUTHORIZATION_EXECUTOR',
            contract: 'TenantWideAuthorizationExecutor',
            consumerImportSpecifier: '../access/index.js',
            producerImportSpecifier: './index.js',
          },
        ],
      },
      {
        consumer: 'catalog',
        producer: 'tenancy',
        consumerModule: {
          file: 'src/modules/catalog/catalog.module.ts',
          className: 'CatalogModule',
        },
        producerModule: {
          file: 'src/modules/tenancy/tenancy.module.ts',
          className: 'TenancyModule',
          importSpecifier: '../tenancy/tenancy.module.js',
        },
        publicBindings: [
          {
            token: 'TENANT_SETTINGS_RUNTIME',
            contract: 'TenantSettingsRuntime',
            consumerImportSpecifier: '../tenancy/index.js',
            producerImportSpecifier: './index.js',
          },
        ],
      },
      {
        consumer: 'access',
        producer: 'stations',
        consumerModule: {
          file: 'src/modules/access/access.module.ts',
          className: 'AccessModule',
        },
        producerModule: {
          file: 'src/modules/stations/stations.module.ts',
          className: 'StationsModule',
          importSpecifier: '../stations/stations.module.js',
        },
        publicBindings: [
          {
            token: 'BRANCH_SETTINGS_RUNTIME',
            contract: 'BranchSettingsRuntime',
            consumerImportSpecifier: '../stations/index.js',
            producerImportSpecifier: './index.js',
          },
          {
            token: 'TRUSTED_STATION_ADMISSION_VALIDATOR',
            contract: 'TrustedStationAdmissionValidator',
            consumerImportSpecifier: '../stations/index.js',
            producerImportSpecifier: './index.js',
          },
          {
            token: 'TRUSTED_STATION_CONTEXT_RESOLVER',
            contract: 'TrustedStationContextResolver',
            consumerImportSpecifier: '../stations/index.js',
            producerImportSpecifier: './index.js',
          },
        ],
      },
      {
        consumer: 'access',
        producer: 'users',
        consumerModule: {
          file: 'src/modules/access/access.module.ts',
          className: 'AccessModule',
        },
        producerModule: {
          file: 'src/modules/users/users.module.ts',
          className: 'UsersModule',
          importSpecifier: '../users/users.module.js',
        },
        publicBindings: [
          {
            token: 'AUTHENTICATION_USER_ADMISSION_VALIDATOR',
            contract: 'AuthenticationUserAdmissionValidator',
            consumerImportSpecifier: '../users/index.js',
            producerImportSpecifier: './index.js',
          },
          {
            token: 'AUTHENTICATION_USER_READER',
            contract: 'AuthenticationUserReader',
            consumerImportSpecifier: '../users/index.js',
            producerImportSpecifier: './index.js',
          },
          {
            token: 'USER_PRODUCT_RUNTIME',
            contract: 'UserProductRuntime',
            consumerImportSpecifier: '../users/index.js',
            producerImportSpecifier: './index.js',
          },
          {
            token: 'USER_PREFERENCES_RUNTIME',
            contract: 'UserPreferencesRuntime',
            consumerImportSpecifier: '../users/index.js',
            producerImportSpecifier: './index.js',
          },
        ],
      },
      {
        consumer: 'repairs',
        producer: 'customers',
        consumerModule: {
          file: 'src/modules/repairs/repairs.module.ts',
          className: 'RepairsModule',
        },
        producerModule: {
          file: 'src/modules/customers/customers.module.ts',
          className: 'CustomersModule',
          importSpecifier: '../customers/customers.module.js',
        },
        publicBindings: [
          {
            token: 'CUSTOMER_INTAKE_RUNTIME',
            contract: 'CustomerIntakeRuntime',
            consumerImportSpecifier: '../customers/index.js',
            producerImportSpecifier: './index.js',
          },
        ],
      },
      {
        consumer: 'repairs',
        producer: 'stations',
        consumerModule: {
          file: 'src/modules/repairs/repairs.module.ts',
          className: 'RepairsModule',
        },
        producerModule: {
          file: 'src/modules/stations/stations.module.ts',
          className: 'StationsModule',
          importSpecifier: '../stations/stations.module.js',
        },
        publicBindings: [
          {
            token: 'BRANCH_SETTINGS_RUNTIME',
            contract: 'BranchSettingsRuntime',
            consumerImportSpecifier: '../stations/index.js',
            producerImportSpecifier: './index.js',
          },
        ],
      },
      {
        consumer: 'repairs',
        producer: 'access',
        consumerModule: {
          file: 'src/modules/repairs/repairs.module.ts',
          className: 'RepairsModule',
        },
        producerModule: {
          file: 'src/modules/access/access.module.ts',
          className: 'AccessModule',
          importSpecifier: '../access/access.module.js',
        },
        publicBindings: [
          {
            token: 'CONTEXTUAL_AUTHORIZATION_EXECUTOR',
            contract: 'ContextualAuthorizationExecutor',
            consumerImportSpecifier: '../access/index.js',
            producerImportSpecifier: './index.js',
          },
        ],
      },
    ],
  });
  for (const edge of policy.directedModuleComposition.edges) {
    assert.ok(policy.dependencies[edge.consumer].includes(edge.producer));
    assert.ok(policy.consumers[edge.producer].includes(edge.consumer));
    for (const binding of edge.publicBindings) {
      assert.ok(policy.publicSurfaces[edge.producer].includes(binding.token));
      assert.ok(policy.publicSurfaces[edge.producer].includes(binding.contract));
    }
  }
  assert.ok(
    policy.productModuleFiles.includes(
      'src/modules/access/presentation/contextual-authorization.executor.ts',
    ),
  );
  assert.ok(
    policy.productModuleFiles.includes(
      'src/modules/repairs/application/repair-protected-operations.ts',
    ),
  );
});

test('runtime composition exports configuration while Stations owns local bootstrap assembly', async () => {
  const [policySource, runtimeModule, stationsModule, controller] =
    await Promise.all([
      readFile('architecture/dec-005-policy.json', 'utf8'),
      readFile(
        'src/infrastructure/runtime/runtime-infrastructure.module.ts',
        'utf8',
      ),
      readFile('src/modules/stations/stations.module.ts', 'utf8'),
      readFile(
        'src/modules/stations/presentation/local-station-bootstrap.controller.ts',
        'utf8',
      ),
    ]);
  const policy = JSON.parse(policySource);
  const runtime = policy.runtimeInfrastructureComposition;
  assert.equal(Object.hasOwn(runtime, 'ownerInternalImports'), false);
  assert.deepEqual(
    runtime.providers.find(
      ({ token }) => token === 'LOCAL_RUNTIME_CONFIGURATION',
    ),
    {
      token: 'LOCAL_RUNTIME_CONFIGURATION',
      contract: 'LocalRuntimeConfiguration',
      strategy: 'useFactory',
      implementation: 'RuntimeEnvironmentReader',
      consumers: ['src/modules/stations/stations.module.ts'],
    },
  );
  assert.doesNotMatch(runtimeModule, /modules\/stations/u);
  assert.match(stationsModule, /provide:\s*LOCAL_STATION_BOOTSTRAP_RUNTIME/u);
  assert.match(stationsModule, /inject:\s*\[LOCAL_RUNTIME_CONFIGURATION\]/u);
  assert.match(
    controller,
    /\.\.\/application\/ports\/local-station-bootstrap-runtime\.port\.js/u,
  );
  assert.doesNotMatch(controller, /infrastructure\/runtime/u);
});

test('migration ownership is fail-closed without a timestamp bypass', async () => {
  const policy = JSON.parse(
    await readFile('architecture/dec-005-policy.json', 'utf8'),
  );
  const ownership = policy.persistence.migrationOwnership;
  assert.deepEqual(Object.keys(ownership).sort(), [
    'legacyMigrations',
    'registrations',
  ]);
  assert.equal(Object.hasOwn(ownership, 'enforcedFrom'), false);
  assert.deepEqual(ownership.legacyMigrations, [
    'src/infrastructure/database/migrations/20260819120000_database_create_repairs_worklist.ts',
    'src/infrastructure/database/migrations/20260819130000_repairs_create_intakes.ts',
    'src/infrastructure/database/migrations/20260819140000_repairs_create_timeline_entries.ts',
    'src/infrastructure/database/migrations/20260819150000_repairs_create_attachments.ts',
    'src/infrastructure/database/migrations/20260820090000_repairs_add_operational_note_idempotency.ts',
    'src/infrastructure/database/migrations/20260902090000_repairs_create_technician_assignment.ts',
    'src/infrastructure/database/migrations/20260902093000_repairs_add_technician_unassignment_idempotency.ts',
    'src/infrastructure/database/migrations/20260902100000_repairs_enforce_technician_scope.ts',
    'src/infrastructure/database/migrations/20260903120000_repairs_create_workflow_transitions.ts',
    'src/infrastructure/database/migrations/20260903130000_repairs_create_location_movements.ts',
    'src/infrastructure/database/migrations/20260904120000_stations_add_branch_timezone.ts',
    'src/infrastructure/database/migrations/20260905160000_stations_create_trusted_runtime_context.ts',
    'src/infrastructure/database/migrations/20260906170000_users_create_directory.ts',
    'src/infrastructure/database/migrations/20260906171000_users_create_provisioning_bootstraps.ts',
    'src/infrastructure/database/migrations/20260906172000_users_create_lifecycle_commands.ts',
    'src/infrastructure/database/migrations/20260906180000_access_create_capability_catalog.ts',
    'src/infrastructure/database/migrations/20260906181000_access_create_roles.ts',
    'src/infrastructure/database/migrations/20260906182000_access_create_role_assignments.ts',
    'src/infrastructure/database/migrations/20260907010000_access_create_pin_credentials.ts',
  ]);
  assert.deepEqual(Object.keys(ownership.registrations), [
    'src/infrastructure/database/migrations/20260907110000_stations_add_admission_revisions.ts',
    'src/infrastructure/database/migrations/20260907111000_users_add_admission_revision.ts',
    'src/infrastructure/database/migrations/20260907120000_access_create_operational_sessions.ts',
    'src/infrastructure/database/migrations/20260907220000_repairs_create_business_audit_events.ts',
    'src/infrastructure/database/migrations/20260907230000_access_add_local_administration_capabilities.ts',
    'src/infrastructure/database/migrations/20260908000000_access_harden_pin_only_lookup.ts',
    'src/infrastructure/database/migrations/20260908001000_repairs_create_operational_note_request_guards.ts',
    'src/infrastructure/database/migrations/20260908002000_access_add_role_editing_commands.ts',
    'src/infrastructure/database/migrations/20260908010000_access_narrow_pin_eligibility_triggers.ts',
    'src/infrastructure/database/migrations/20260908020000_users_create_profile_update_commands.ts',
    'src/infrastructure/database/migrations/20260908021000_users_create_commands.ts',
    'src/infrastructure/database/migrations/20260908110000_access_add_repairs_create_capability.ts',
    'src/infrastructure/database/migrations/20260908111000_customers_create_branch_minimum.ts',
    'src/infrastructure/database/migrations/20260908112000_repairs_enable_minimum_intake_creation.ts',
    'src/infrastructure/database/migrations/20260908113000_repairs_expand_classic_intake.ts',
    'src/infrastructure/database/migrations/20260908114000_repairs_expand_avicell_reception.ts',
    'src/infrastructure/database/migrations/20260908115000_access_add_repairs_configuration_capabilities.ts',
    'src/infrastructure/database/migrations/20260908120000_repairs_create_new_repair_field_policies.ts',
    'src/infrastructure/database/migrations/20260908121000_access_add_repairs_catalog_capabilities.ts',
    'src/infrastructure/database/migrations/20260908122000_repairs_create_risk_catalog.ts',
    'src/infrastructure/database/migrations/20260908123000_repairs_create_brand_catalog.ts',
    'src/infrastructure/database/migrations/20260910230000_repairs_create_device_type_catalog.ts',
    'src/infrastructure/database/migrations/20260908124000_repairs_create_model_catalog.ts',
    'src/infrastructure/database/migrations/20260908125000_repairs_enforce_model_brand_compatibility.ts',
    'src/infrastructure/database/migrations/20260908125100_access_add_repairs_correct_intake_capability.ts',
    'src/infrastructure/database/migrations/20260908125200_repairs_create_equipment_corrections.ts',
    'src/infrastructure/database/migrations/20260908130000_access_add_repairs_classify_capability.ts',
    'src/infrastructure/database/migrations/20260908130100_repairs_create_problem_category_catalog.ts',
    'src/infrastructure/database/migrations/20260908131000_repairs_add_problem_capture_reconciliation.ts',
    'src/infrastructure/database/migrations/20260909100000_repairs_add_problem_category_safe_delete.ts',
    'src/infrastructure/database/migrations/20260909220000_users_create_preferences.ts',
    'src/infrastructure/database/migrations/20260911180000_tenancy_add_operating_currency.ts',
    'src/infrastructure/database/migrations/20260911181000_access_add_catalog_capabilities.ts',
    'src/infrastructure/database/migrations/20260911182000_users_add_price_list_cost_preference.ts',
    'src/infrastructure/database/migrations/20260911183000_catalog_create_pricing_core.ts',
    'src/infrastructure/database/migrations/20260911200000_catalog_add_reference_governance.ts',
    'src/infrastructure/database/migrations/20260912180000_access_enable_concurrent_operational_sessions.ts',
    'src/infrastructure/database/migrations/20260912210000_catalog_unify_pending_reference_reconciliation.ts',
    'src/infrastructure/database/migrations/20260913120000_catalog_add_reference_safe_delete.ts',
    'src/infrastructure/database/migrations/20260913121000_repairs_add_reference_safe_delete.ts',
    'src/infrastructure/database/migrations/20260913130000_catalog_enforce_reference_identity.ts',
  ]);
  assert.deepEqual(
    Object.values(ownership.registrations).map(({ owner }) => owner),
    ['stations', 'users', 'access', 'repairs', 'access', 'access', 'repairs', 'access', 'access', 'users', 'users', 'access', 'customers', 'repairs', 'repairs', 'repairs', 'access', 'repairs', 'access', 'repairs', 'repairs', 'repairs', 'repairs', 'repairs', 'access', 'repairs', 'access', 'repairs', 'repairs', 'repairs', 'users', 'tenancy', 'access', 'users', 'catalog', 'catalog', 'access', 'catalog', 'catalog', 'repairs', 'catalog'],
  );
  for (const [migration, registration] of Object.entries(ownership.registrations)) {
    const allowedKeys = [
      'functions',
      'owner',
      'tables',
      'triggers',
      ...(registration.references ? ['references'] : []),
    ].sort();
    assert.deepEqual(Object.keys(registration).sort(), allowedKeys);
    assert.ok(registration.tables.length > 0);
    if ([
      'src/infrastructure/database/migrations/20260907230000_access_add_local_administration_capabilities.ts',
      'src/infrastructure/database/migrations/20260908001000_repairs_create_operational_note_request_guards.ts',
      'src/infrastructure/database/migrations/20260908002000_access_add_role_editing_commands.ts',
      'src/infrastructure/database/migrations/20260908020000_users_create_profile_update_commands.ts',
      'src/infrastructure/database/migrations/20260908021000_users_create_commands.ts',
      'src/infrastructure/database/migrations/20260908110000_access_add_repairs_create_capability.ts',
      'src/infrastructure/database/migrations/20260908111000_customers_create_branch_minimum.ts',
      'src/infrastructure/database/migrations/20260908112000_repairs_enable_minimum_intake_creation.ts',
      'src/infrastructure/database/migrations/20260908113000_repairs_expand_classic_intake.ts',
      'src/infrastructure/database/migrations/20260908114000_repairs_expand_avicell_reception.ts',
      'src/infrastructure/database/migrations/20260908115000_access_add_repairs_configuration_capabilities.ts',
      'src/infrastructure/database/migrations/20260908120000_repairs_create_new_repair_field_policies.ts',
      'src/infrastructure/database/migrations/20260908121000_access_add_repairs_catalog_capabilities.ts',
      'src/infrastructure/database/migrations/20260908125100_access_add_repairs_correct_intake_capability.ts',
      'src/infrastructure/database/migrations/20260908130000_access_add_repairs_classify_capability.ts',
      'src/infrastructure/database/migrations/20260908131000_repairs_add_problem_capture_reconciliation.ts',
      'src/infrastructure/database/migrations/20260909220000_users_create_preferences.ts',
      'src/infrastructure/database/migrations/20260911180000_tenancy_add_operating_currency.ts',
      'src/infrastructure/database/migrations/20260911181000_access_add_catalog_capabilities.ts',
      'src/infrastructure/database/migrations/20260911182000_users_add_price_list_cost_preference.ts',
      'src/infrastructure/database/migrations/20260911200000_catalog_add_reference_governance.ts',
      'src/infrastructure/database/migrations/20260912180000_access_enable_concurrent_operational_sessions.ts',
      'src/infrastructure/database/migrations/20260912210000_catalog_unify_pending_reference_reconciliation.ts',
      'src/infrastructure/database/migrations/20260913130000_catalog_enforce_reference_identity.ts',
    ].includes(migration)) {
      assert.deepEqual(registration.functions, []);
      assert.deepEqual(registration.triggers, []);
    } else {
      assert.ok(registration.functions.length > 0);
      assert.ok(registration.triggers.length > 0);
    }
  }
});

test('registered module presentation and Health are the explicitly governed HTTP surfaces', async () => {
  const policy = JSON.parse(
    await readFile('architecture/dec-005-policy.json', 'utf8'),
  );
  assert.equal(policy.httpSurfacePolicy.allowedModuleLayer, 'presentation');
  assert.deepEqual(
    policy.httpSurfacePolicy.controllers,
    {
      'src/modules/access/presentation/access-administration.controller.ts': {
        owner: 'access',
        className: 'AccessAdministrationController',
        composition: {
          file: 'src/modules/access/access.module.ts',
          className: 'AccessModule',
          importSpecifier: './presentation/access-administration.controller.js',
        },
      },
      'src/modules/access/presentation/branch-settings-administration.controller.ts': {
        owner: 'access',
        className: 'BranchSettingsAdministrationController',
        composition: {
          file: 'src/modules/access/access.module.ts',
          className: 'AccessModule',
          importSpecifier: './presentation/branch-settings-administration.controller.js',
        },
      },
      'src/modules/access/presentation/access-session.controller.ts': {
        owner: 'access',
        className: 'AccessSessionController',
        composition: {
          file: 'src/modules/access/access.module.ts',
          className: 'AccessModule',
          importSpecifier: './presentation/access-session.controller.js',
        },
      },
      'src/modules/access/presentation/user-preferences.controller.ts': {
        owner: 'access',
        className: 'UserPreferencesController',
        composition: {
          file: 'src/modules/access/access.module.ts',
          className: 'AccessModule',
          importSpecifier: './presentation/user-preferences.controller.js',
        },
      },
      'src/modules/repairs/presentation/repairs.controller.ts': {
        owner: 'repairs',
        className: 'RepairsController',
        composition: {
          file: 'src/modules/repairs/repairs.module.ts',
          className: 'RepairsModule',
          importSpecifier: './presentation/repairs.controller.js',
        },
      },
      'src/modules/catalog/presentation/catalog.controller.ts': {
        owner: 'catalog',
        className: 'CatalogController',
        composition: {
          file: 'src/modules/catalog/catalog.module.ts',
          className: 'CatalogModule',
          importSpecifier: './presentation/catalog.controller.js',
        },
      },
      'src/modules/stations/presentation/local-station-bootstrap.controller.ts': {
        owner: 'stations',
        className: 'LocalStationBootstrapController',
        composition: {
          file: 'src/modules/stations/stations.module.ts',
          className: 'StationsModule',
          importSpecifier: './presentation/local-station-bootstrap.controller.js',
        },
      },
    },
  );
  const result = await checkArchitecture({ root: process.cwd() });
  assert.deepEqual(result.diagnostics, []);
});

test('policy, rules, ownership and graph evidence remain consistent', async () => {
  const policy = JSON.parse(
    await readFile('architecture/dec-005-policy.json', 'utf8'),
  );
  const [rules, ownership, graph, fixtures, matrix] = await Promise.all(
    [
      'ARCHITECTURE_RULES.md',
      'OWNERSHIP.md',
      'DEPENDENCY_GRAPH.md',
      'FIXTURES.md',
      'TRACEABILITY_MATRIX.md',
    ].map((file) =>
      readFile(
        `docs/architecture-readiness/dec-005-materialization/${file}`,
        'utf8',
      ),
    ),
  );

  for (let number = 1; number <= 53; number += 1) {
    const rule = `D5-R${String(number).padStart(3, '0')}`;
    assert.match(rules, new RegExp(rule, 'u'));
    assert.match(matrix, new RegExp(`\\| ${rule} \\|`, 'u'));
  }
  const fixtureRules = new Set(
    [...fixtureCases, ...persistenceFixtureCases].flatMap(
      ({ expectedRules = [] }) => expectedRules,
    ),
  );
  assert.deepEqual(
    policy.checkerRules.filter((rule) => !fixtureRules.has(rule)),
    [],
    'every checker rule must have an isolated negative fixture',
  );
  for (const moduleName of policy.allowedModules) {
    assert.ok(ownership.includes(`| \`${moduleName}\` |`));
    for (const exportName of policy.publicSurfaces[moduleName]) {
      assert.match(ownership, new RegExp(exportName, 'u'));
    }
    for (const consumer of policy.consumers[moduleName]) {
      assert.match(ownership, new RegExp(consumer, 'u'));
    }
    for (const dependency of policy.dependencies[moduleName]) {
      assert.match(graph, new RegExp(`${moduleName}->${dependency}`, 'u'));
    }
  }
  for (const requiredCase of [
    'Módulo no autorizado',
    'Dependencia fuera del grafo',
    'Ciclo intermodular',
    'Root global `helpers`',
    'Root global `base`',
    'Root global `core`',
  ]) {
    assert.match(fixtures, new RegExp(requiredCase, 'u'));
  }
});

test('smoke readiness accepts marker before listener', async () => {
  const child = fakeChild();
  const listener = deferred();
  const coordinator = createReadinessCoordinator({
    child,
    listenerPromise: listener.promise,
    timeoutMs: 100,
  });
  try {
    child.stdout.write(marker);
    listener.resolve();
    await coordinator.ready;
  } finally {
    destroyCoordinator(child, coordinator);
  }
});

test('smoke readiness accepts listener before marker', async () => {
  const child = fakeChild();
  const listener = deferred();
  const coordinator = createReadinessCoordinator({
    child,
    listenerPromise: listener.promise,
    timeoutMs: 100,
  });
  try {
    listener.resolve();
    child.stdout.write(marker);
    await coordinator.ready;
  } finally {
    destroyCoordinator(child, coordinator);
  }
});

test('smoke readiness accepts both signals in the same event turn', async () => {
  const child = fakeChild();
  const listener = deferred();
  const coordinator = createReadinessCoordinator({
    child,
    listenerPromise: listener.promise,
    timeoutMs: 100,
  });
  try {
    queueMicrotask(() => {
      child.stdout.write(`prefix ${marker} suffix`);
      listener.resolve();
    });
    await coordinator.ready;
  } finally {
    destroyCoordinator(child, coordinator);
  }
});

test('smoke readiness recognizes a marker split between chunks', async () => {
  const child = fakeChild();
  const coordinator = createReadinessCoordinator({
    child,
    listenerPromise: Promise.resolve(),
    timeoutMs: 100,
  });
  try {
    child.stdout.write('technical_shell_');
    child.stdout.write('listening');
    await coordinator.ready;
  } finally {
    destroyCoordinator(child, coordinator);
  }
});

test('smoke readiness accepts listener evidence split between chunks', async () => {
  const child = fakeChild();
  const listener = createChunkSignal('listener-ready');
  const coordinator = createReadinessCoordinator({
    child,
    listenerPromise: listener.promise,
    timeoutMs: 100,
  });
  try {
    child.stdout.write(marker);
    listener.push('listener-');
    listener.push('ready');
    await coordinator.ready;
  } finally {
    destroyCoordinator(child, coordinator);
  }
});

test('smoke readiness preserves stderr diagnostics', async () => {
  const child = fakeChild();
  const coordinator = createReadinessCoordinator({
    child,
    listenerPromise: Promise.resolve(),
    timeoutMs: 100,
  });
  try {
    child.stderr.write('diagnostic detail');
    child.stdout.write(marker);
    await coordinator.ready;
    assert.equal(coordinator.output().stderr, 'diagnostic detail');
  } finally {
    destroyCoordinator(child, coordinator);
  }
});

test('smoke readiness rejects termination before readiness', async () => {
  const child = fakeChild();
  const listener = deferred();
  const coordinator = createReadinessCoordinator({
    child,
    listenerPromise: listener.promise,
    timeoutMs: 100,
  });
  try {
    child.stderr.write('startup failed');
    child.emit('exit', 1, null);
    await assert.rejects(
      coordinator.ready,
      /exited before readiness.*startup failed/u,
    );
  } finally {
    destroyCoordinator(child, coordinator);
  }
});

test('smoke readiness rejects timeout without both signals', async () => {
  const child = fakeChild();
  const listener = deferred();
  const coordinator = createReadinessCoordinator({
    child,
    listenerPromise: listener.promise,
    timeoutMs: 10,
  });
  try {
    child.stdout.write(marker);
    await assert.rejects(coordinator.ready, /readiness timed out/u);
  } finally {
    destroyCoordinator(child, coordinator);
  }
});

test('smoke readiness cleanup removes listeners after PASS', async () => {
  const child = fakeChild();
  const coordinator = createReadinessCoordinator({
    child,
    listenerPromise: Promise.resolve(),
    timeoutMs: 100,
  });
  child.stdout.write(marker);
  await coordinator.ready;
  coordinator.cleanup();
  assert.equal(child.stdout.listenerCount('data'), 0);
  assert.equal(child.stderr.listenerCount('data'), 0);
  assert.equal(child.listenerCount('exit'), 0);
  assert.equal(child.listenerCount('error'), 0);
  child.stdout.destroy();
  child.stderr.destroy();
});

test('smoke readiness cleanup removes listeners after FAIL', async () => {
  const child = fakeChild();
  const coordinator = createReadinessCoordinator({
    child,
    listenerPromise: Promise.reject(new Error('probe failed')),
    timeoutMs: 100,
  });
  await assert.rejects(coordinator.ready, /Listener probe failed/u);
  coordinator.cleanup();
  assert.equal(child.stdout.listenerCount('data'), 0);
  assert.equal(child.stderr.listenerCount('data'), 0);
  assert.equal(child.listenerCount('exit'), 0);
  assert.equal(child.listenerCount('error'), 0);
  child.stdout.destroy();
  child.stderr.destroy();
});
