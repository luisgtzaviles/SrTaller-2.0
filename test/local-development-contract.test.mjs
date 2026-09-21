import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import {
  LOCAL_APPLICATION_USER,
  LOCAL_DB_HOST,
  LOCAL_DB_NAME,
  LOCAL_DB_PORT,
  LOCAL_MIGRATION_USER,
  LOCAL_OWNER_USER_ID,
  LOCAL_TENANT_ID,
  assertLocalUserBootstrapAuthority,
  assertLocalTarget,
  cleanChildEnvironment,
  databaseEnvironment,
  localAccessCapabilityRows,
  localAccessRoleAssignmentRows,
  localAccessRoleCapabilityRows,
  localAccessRoleRows,
  localRepairCatalogRows,
  localRepairIntakeRows,
  localRepairRows,
  localRepairTimelineRows,
  localSeedRows,
  localUserRows,
  parseLocalEnvironment,
} from '../scripts/lib/local-development.mjs';
import {
  LOCAL_PIN_FIXTURE_PROFILE,
  localPinCredentialRows,
} from '../scripts/lib/local-pin-fixtures.mjs';

const [localDevelopmentSource, localEnvironmentExample, localSeedSource] = await Promise.all([
  readFile('scripts/lib/local-development.mjs', 'utf8'),
  readFile('.env.local.example', 'utf8'),
  readFile('scripts/local-db-seed.mjs', 'utf8'),
]);

function validLocalValues() {
  return {
    SR_LOCAL_ENVIRONMENT: 'local',
    SR_LOCAL_DB_HOST: LOCAL_DB_HOST,
    SR_LOCAL_DB_PORT: String(LOCAL_DB_PORT),
    SR_LOCAL_DB_NAME: LOCAL_DB_NAME,
    SR_LOCAL_ADMIN_USER: 'srtaller_local_admin',
    SR_LOCAL_ADMIN_PASSWORD: 'synthetic-admin-password',
    SR_LOCAL_MIGRATION_USER: LOCAL_MIGRATION_USER,
    SR_LOCAL_MIGRATION_PASSWORD: 'synthetic-migration-password',
    SR_LOCAL_APPLICATION_USER: LOCAL_APPLICATION_USER,
    SR_LOCAL_APPLICATION_PASSWORD: 'synthetic-application-password',
    SR_LOCAL_BACKEND_HOST: '127.0.0.1',
    SR_LOCAL_BACKEND_PORT: '3000',
    SR_LOCAL_VITE_HOST: '127.0.0.1',
    SR_LOCAL_VITE_PORT: '4173',
    SR_STATION_BOOTSTRAP_SECRET: 'synthetic-local-station-bootstrap-secret',
    SR_USER_BOOTSTRAP_SECRET: 'synthetic-local-user-bootstrap-secret',
    SR_PIN_PEPPER: Buffer.alloc(32, 0x25).toString('base64url'),
    SR_ADMIN_PASSWORD_PEPPER: Buffer.alloc(32, 0x26).toString('base64url'),
    SR_LOCAL_PIN_JORGE: '0601',
    SR_LOCAL_PIN_MARIA: '0602',
    SR_LOCAL_PIN_CARLOS: '0603',
    SR_LOCAL_PIN_LUIS: '0604',
  };
}

test('local configuration derives separate migration and application roles', () => {
  const values = validLocalValues();
  const migration = databaseEnvironment(values, 'migration');
  const application = databaseEnvironment(values, 'application');
  assert.equal(migration.SR_DB_ROLE, 'migration');
  assert.equal(migration.SR_DB_MIGRATIONS_ENABLED, 'true');
  assert.equal(migration.SR_DB_USER, LOCAL_MIGRATION_USER);
  assert.equal(application.SR_DB_ROLE, 'application');
  assert.equal(application.SR_DB_MIGRATIONS_ENABLED, 'false');
  assert.equal(application.SR_DB_USER, LOCAL_APPLICATION_USER);
  assert.equal(Object.hasOwn(migration, 'DATABASE_URL'), false);
});

test('local target guard rejects non-local targets and connection aliases', () => {
  const remote = validLocalValues();
  remote.SR_LOCAL_DB_HOST = 'preview.internal';
  assert.throws(() => assertLocalTarget(remote), /SR_LOCAL_DB_HOST/u);

  const alias = validLocalValues();
  alias.DATABASE_URL = 'postgres://preview';
  assert.throws(() => assertLocalTarget(alias), /DATABASE_URL/u);

  const persistedCanonical = validLocalValues();
  persistedCanonical.SR_DB_HOST = 'preview.internal';
  assert.throws(() => assertLocalTarget(persistedCanonical), /SR_DB_HOST/u);
});

test('first-user bootstrap authority fails closed before persistence', () => {
  const values = validLocalValues();
  assert.equal(
    assertLocalUserBootstrapAuthority(
      values,
      values.SR_USER_BOOTSTRAP_SECRET,
    ),
    values,
  );
  assert.throws(
    () => assertLocalUserBootstrapAuthority(values, undefined),
    /Local user bootstrap authority rejected/u,
  );
  assert.throws(
    () => assertLocalUserBootstrapAuthority(values, 'wrong-local-secret'),
    /Local user bootstrap authority rejected/u,
  );

  const remote = validLocalValues();
  remote.SR_LOCAL_DB_HOST = 'preview.internal';
  assert.throws(
    () =>
      assertLocalUserBootstrapAuthority(
        remote,
        remote.SR_USER_BOOTSTRAP_SECRET,
      ),
    /SR_LOCAL_DB_HOST/u,
  );
});

test('seed contract is deterministic and contains only existing schema entities', () => {
  const first = localSeedRows();
  const second = localSeedRows();
  assert.deepEqual(first, second);
  assert.equal(first.tenant.tenantId, '00000000-0000-4000-8000-000000000001');
  assert.equal(first.branches.length, 2);
  assert.deepEqual(Object.keys(first.tenant).sort(), ['createdAt', 'tenantId']);
  assert.deepEqual(Object.keys(first.branches[0]).sort(), ['active', 'branchId', 'createdAt', 'tenantId', 'timeZone']);
  assert.match(
    localSeedSource,
    /catalog_categories \([\s\S]*normalized_name, kind, status,[\s\S]*'PART', 'ACTIVE'[\s\S]*'PRODUCT', 'ACTIVE'/u,
  );
});

test('synthetic User fixtures are deterministic, bounded, and secret-free', () => {
  const first = localUserRows();
  assert.deepEqual(first, localUserRows());
  assert.equal(first.length, 4);
  assert.deepEqual(
    first.find(({ userId }) => userId === LOCAL_OWNER_USER_ID),
    {
      userId: LOCAL_OWNER_USER_ID,
      tenantId: LOCAL_TENANT_ID,
      displayName: 'Luis',
      operationalIdentifier: 'LUIS',
      status: 'active',
      version: 0,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    },
  );
  assert.deepEqual(
    new Set(first.map(({ status }) => status)),
    new Set(['active']),
  );
  assert.ok(first.every(({ tenantId }) => tenantId === LOCAL_TENANT_ID));
  assert.ok(first.every((row) => Object.isFrozen(row)));
  assert.doesNotMatch(
    JSON.stringify(first),
    /pin|password|credential|secret|hash|salt|pepper/iu,
  );
});

test('synthetic Access fixtures are deterministic, scoped, and secret-free', () => {
  const capabilities = localAccessCapabilityRows();
  const roles = localAccessRoleRows();
  const grants = localAccessRoleCapabilityRows();
  const assignments = localAccessRoleAssignmentRows();
  assert.deepEqual(capabilities, localAccessCapabilityRows());
  assert.deepEqual(roles, localAccessRoleRows());
  assert.deepEqual(grants, localAccessRoleCapabilityRows());
  assert.deepEqual(assignments, localAccessRoleAssignmentRows());
  assert.deepEqual(
    capabilities.map(({ capabilityCode }) => capabilityCode),
    [
      'access_matrix.read',
      'access_matrix.manage',
      'repairs.add_note',
      'repairs.create',
      'repairs.correct_intake',
      'repairs.classify',
      'repairs.catalogs.read',
      'repairs.catalogs.manage',
      'repairs.configuration.read',
      'repairs.configuration.manage',
      'repairs.read',
      'price_list.read',
      'catalog.manage',
      'catalog.items.create',
      'catalog.items.update',
      'catalog.items.deactivate',
      'catalog.prices.manage',
      'catalog.branch_prices.manage',
      'catalog.reference_cost.read',
      'catalog.reference_cost.manage',
      'catalog.configuration.read',
      'catalog.configuration.manage',
      'catalog.import.read',
      'catalog.import.prepare',
      'catalog.import.publish',
      'catalog.items.bulk_retire',
      'catalog.suppliers.delete',
      'users.read',
      'users.manage',
    ],
  );
  assert.deepEqual(roles.map(({ displayName }) => displayName), [
    'Administrador',
    'Atención al cliente',
    'Técnico',
  ]);
  assert.equal(grants.length, 35);
  assert.deepEqual(assignments.map(({ assignmentScope }) => assignmentScope), [
    'TENANT_WIDE',
    'TENANT_WIDE',
    'BRANCH_RESTRICTED',
    'TENANT_WIDE',
  ]);
  assert.equal(assignments[2].branchId, '00000000-0000-4000-8000-000000000101');
  assert.deepEqual(
    assignments.find(({ userId }) => userId === LOCAL_OWNER_USER_ID),
    {
      tenantId: LOCAL_TENANT_ID,
      assignmentId: '00000000-0000-4000-8000-000000000704',
      userId: LOCAL_OWNER_USER_ID,
      roleId: '00000000-0000-4000-8000-000000000601',
      assignmentScope: 'TENANT_WIDE',
      branchId: null,
      status: 'active',
      version: 0,
      assignedAt: '2026-01-01T00:00:00.000Z',
      revokedAt: null,
    },
  );
  assert.ok([...capabilities, ...roles, ...grants, ...assignments].every(Object.isFrozen));
  assert.doesNotMatch(
    JSON.stringify({ capabilities, roles, grants, assignments }),
    /pin|password|credential|secret|hash|salt|pepper/iu,
  );
});

test('synthetic Repairs catalog labels are deterministic without inventing historical canonical links', () => {
  const catalogs = localRepairCatalogRows();
  assert.deepEqual(catalogs, localRepairCatalogRows());
  assert.deepEqual(
    Object.fromEntries(Object.entries(catalogs).map(([key, rows]) => [key, rows.length])),
    { deviceTypes: 2, brands: 12, models: 15, risks: 4, problemCategories: 5 },
  );
  const allRows = Object.values(catalogs).flat();
  assert.ok(allRows.every((row) => row.scope === 'tenant' && row.tenantId === LOCAL_TENANT_ID && row.status === 'active'));
  assert.ok(allRows.every((row) => Object.isFrozen(row)));
  assert.ok(Object.values(catalogs).every((rows) => Object.isFrozen(rows)));
  const repairLabels = new Set(localRepairRows().flatMap((repair) => [repair.deviceBrand, repair.deviceModel, repair.reportedIssue]));
  assert.ok(catalogs.brands.every((brand) => repairLabels.has(brand.canonicalLabel)));
  assert.ok(catalogs.models.every((model) => repairLabels.has(model.canonicalLabel)));
  assert.ok(catalogs.models.every((model) => catalogs.brands.some((brand) => brand.brandId === model.canonicalBrandId)));
  assert.ok(catalogs.risks.some((risk) => risk.canonicalLabel === 'Batería inflada'));
  assert.ok(catalogs.problemCategories.some((category) => category.canonicalLabel === 'Pantalla'));
  assert.ok(localRepairIntakeRows().every((intake) => !Object.keys(intake).some((key) => key.startsWith('canonical'))));
  assert.match(localSeedSource, /repairCanonicalLinksCreated: 0/u);
  assert.equal((localSeedSource.match(/ON CONFLICT \((?:device_type_id|brand_id|model_id|risk_id|category_id)\) DO NOTHING/gu) ?? []).length, 5);
  assert.doesNotMatch(JSON.stringify(catalogs), /pin|password|credential|secret|hash|salt|pepper/iu);
});

test('local PIN fixtures use the governed profile and persist no plaintext PIN', async () => {
  const values = validLocalValues();
  const rows = await localPinCredentialRows(values);
  assert.equal(rows.length, 4);
  assert.deepEqual(LOCAL_PIN_FIXTURE_PROFILE, {
    algorithm: 'argon2id',
    memoryKiB: 65_536,
    passes: 3,
    parallelism: 4,
    profileVersion: 1,
    pepperVersion: 1,
    saltLength: 16,
    tagLength: 32,
  });
  assert.ok(rows.every((row) => row.salt.byteLength === 16));
  assert.ok(rows.every((row) => row.verifier.byteLength === 32));
  assert.ok(rows.every((row) => row.lookupDigest.byteLength === 32));
  assert.ok(rows.every((row) => row.requestFingerprint.byteLength === 32));
  assert.ok(rows.every(Object.isFrozen));
  const rendered = JSON.stringify(rows);
  assert.doesNotMatch(rendered, /0601|0602|0603|0604/u);
  assert.doesNotMatch(rendered, /SR_LOCAL_PIN|SR_PIN_PEPPER/u);

  const { NodeArgon2PinHasher } = await import(
    '../dist/modules/access/infrastructure/security/node-argon2-pin-hasher.js'
  );
  const hasher = new NodeArgon2PinHasher(values.SR_PIN_PEPPER);
  const pins = [
    values.SR_LOCAL_PIN_JORGE,
    values.SR_LOCAL_PIN_MARIA,
    values.SR_LOCAL_PIN_CARLOS,
    values.SR_LOCAL_PIN_LUIS,
  ];
  for (const [index, row] of rows.entries()) {
    const runtimeMaterial = await hasher.hash({
      tenantId: row.tenantId,
      userId: row.userId,
      clientRequestId: row.clientRequestId,
      pin: pins[index],
    });
    assert.deepEqual(
      Buffer.from(row.requestFingerprint),
      Buffer.from(runtimeMaterial.requestFingerprint),
    );
    assert.equal(
      await hasher.verify({
        tenantId: row.tenantId,
        userId: row.userId,
        pin: pins[index],
        stored: row,
      }),
      true,
    );
  }
});

test('demo PINs are scrubbed while the ignored local Owner PIN survives volume resets', () => {
  assert.match(localEnvironmentExample, /^SR_LOCAL_PIN_LUIS=.*$/mu);
  assert.doesNotMatch(localEnvironmentExample, /^SR_LOCAL_PIN_(?:JORGE|MARIA|CARLOS)=.*$/mu);
  assert.match(localEnvironmentExample, /Owner PIN remains only in ignored local configuration/u);
  assert.match(localDevelopmentSource, /const ephemeralLocalPinKeys = Object\.freeze\(/u);
  assert.match(localDevelopmentSource, /const localPinKeys = Object\.freeze\(/u);
  assert.match(localDevelopmentSource, /Object\.entries\(values\)\.filter\(\(\[key\]\) => !ephemeralLocalPinKeys\.includes\(key\)\)/u);
  assert.doesNotMatch(localDevelopmentSource, /function randomPin\b|randomPin\(\)/u);
  assert.doesNotMatch(localDevelopmentSource, /SR_LOCAL_PIN_[A-Z]+:\s*random/u);
  assert.deepEqual(
    cleanChildEnvironment({
      SAFE_VALUE: 'preserved',
      SR_LOCAL_PIN_CARLOS: 'synthetic',
      SR_LOCAL_PIN_LUIS: 'synthetic',
    }),
    { SAFE_VALUE: 'preserved' },
  );
});

test('repair intake seed is deterministic, varied, and excludes sensitive intake data', () => {
  const first = localRepairIntakeRows();
  assert.deepEqual(first, localRepairIntakeRows());
  assert.equal(first.length, 16);
  assert.ok(first.some((row) => row.receivedById === null && row.documentedRiskSummary === null));
  assert.ok(first.some((row) => (row.customerNarrative?.length ?? 0) > 200));
  assert.ok(first.some((row) => row.documentedRiskSummary !== null));
  const keys = Object.keys(first[0]).join(' ');
  assert.doesNotMatch(keys, /pin|password|pattern|unlock|imei|secret/iu);
});

test('repair timeline seed is deterministic, typed, and covers rich, single, and empty scenarios', () => {
  const rows = localRepairTimelineRows();
  assert.deepEqual(rows, localRepairTimelineRows());
  assert.equal(rows.length, 20);
  assert.deepEqual(new Set(rows.map((row) => row.entryType)), new Set(['note', 'system_event']));
  assert.ok(rows.filter((row) => row.repairId === '00000000-0000-4000-8000-000000001003').length >= 6);
  assert.equal(rows.filter((row) => row.repairId === '00000000-0000-4000-8000-000000001002').length, 3);
  assert.equal(rows.filter((row) => row.repairId === '00000000-0000-4000-8000-000000001012').length, 2);
  assert.equal(rows.filter((row) => row.repairId === '00000000-0000-4000-8000-000000001005').length, 1);
  assert.equal(rows.filter((row) => row.repairId === '00000000-0000-4000-8000-000000001008').length, 0);
  assert.equal(rows.filter((row) => row.source === 'local.location').length, 8);
  assert.ok(rows.filter((row) => row.source === 'local.location').every((row) => row.title === 'Equipo movido' && row.body === 'Área de pendientes → Taller'));
  assert.ok(new Set(rows.filter((row) => row.actorId).map((row) => row.actorId)).size >= 3);
  assert.ok(rows.some((row) => (row.body?.length ?? 0) > 250));
  assert.ok(rows.filter((row) => row.entryType === 'note').every((row) => row.actorId !== null));
  assert.ok(rows.filter((row) => row.actorDisplayName === 'Sistema').every((row) => row.entryType === 'system_event'));
  const keys = Object.keys(rows[0]).join(' ');
  assert.doesNotMatch(keys, /pin|password|pattern|unlock|imei|secret/iu);
});

test('local backend startup rehydrates filesystem evidence fixtures without changing database state', async () => {
  const [localDev, localBackend] = await Promise.all([
    readFile('scripts/local-dev.mjs', 'utf8'),
    readFile('scripts/local-backend.mjs', 'utf8'),
  ]);
  for (const source of [localDev, localBackend]) {
    assert.match(source, /materializeLocalEvidenceFixtures/u);
    assert.match(source, /await materializeLocalEvidenceFixtures\(\)/u);
  }
});

test('local env parser accepts comments and rejects malformed entries', () => {
  assert.deepEqual(parseLocalEnvironment('# comment\nSR_LOCAL_ENVIRONMENT=local\n'), {
    SR_LOCAL_ENVIRONMENT: 'local',
  });
  assert.throws(() => parseLocalEnvironment('not-an-env-line'), /line 1/u);
});
