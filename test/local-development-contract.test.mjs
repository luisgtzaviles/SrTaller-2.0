import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import {
  LOCAL_APPLICATION_USER,
  LOCAL_DB_HOST,
  LOCAL_DB_NAME,
  LOCAL_DB_PORT,
  LOCAL_MIGRATION_USER,
  LOCAL_TENANT_ID,
  assertLocalUserBootstrapAuthority,
  assertLocalTarget,
  databaseEnvironment,
  localAccessCapabilityRows,
  localAccessRoleAssignmentRows,
  localAccessRoleCapabilityRows,
  localAccessRoleRows,
  localRepairIntakeRows,
  localRepairTimelineRows,
  localSeedRows,
  localUserRows,
  parseLocalEnvironment,
} from '../scripts/lib/local-development.mjs';
import {
  LOCAL_PIN_FIXTURE_PROFILE,
  localPinCredentialRows,
} from '../scripts/lib/local-pin-fixtures.mjs';

const [localDevelopmentSource, localEnvironmentExample] = await Promise.all([
  readFile('scripts/lib/local-development.mjs', 'utf8'),
  readFile('.env.local.example', 'utf8'),
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
    SR_LOCAL_PIN_JORGE: '0601',
    SR_LOCAL_PIN_MARIA: '0602',
    SR_LOCAL_PIN_CARLOS: '0603',
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
});

test('synthetic User fixtures are deterministic, bounded, and secret-free', () => {
  const first = localUserRows();
  assert.deepEqual(first, localUserRows());
  assert.equal(first.length, 3);
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
      'repairs.read',
      'users.read',
      'users.manage',
    ],
  );
  assert.deepEqual(roles.map(({ displayName }) => displayName), [
    'Administrador',
    'Atención al cliente',
    'Técnico',
  ]);
  assert.equal(grants.length, 10);
  assert.deepEqual(assignments.map(({ assignmentScope }) => assignmentScope), [
    'TENANT_WIDE',
    'TENANT_WIDE',
    'BRANCH_RESTRICTED',
  ]);
  assert.equal(assignments[2].branchId, '00000000-0000-4000-8000-000000000101');
  assert.ok([...capabilities, ...roles, ...grants, ...assignments].every(Object.isFrozen));
  assert.doesNotMatch(
    JSON.stringify({ capabilities, roles, grants, assignments }),
    /pin|password|credential|secret|hash|salt|pepper/iu,
  );
});

test('local PIN fixtures use the governed profile and persist no plaintext PIN', async () => {
  const values = validLocalValues();
  const rows = await localPinCredentialRows(values);
  assert.equal(rows.length, 3);
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
  assert.doesNotMatch(rendered, /0601|0602|0603/u);
  assert.doesNotMatch(rendered, /SR_LOCAL_PIN|SR_PIN_PEPPER/u);

  const { NodeArgon2PinHasher } = await import(
    '../dist/modules/access/infrastructure/security/node-argon2-pin-hasher.js'
  );
  const hasher = new NodeArgon2PinHasher(values.SR_PIN_PEPPER);
  const pins = [
    values.SR_LOCAL_PIN_JORGE,
    values.SR_LOCAL_PIN_MARIA,
    values.SR_LOCAL_PIN_CARLOS,
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

test('demo PINs are one-shot seed inputs and are scrubbed from local configuration', () => {
  assert.doesNotMatch(localEnvironmentExample, /^SR_LOCAL_PIN_[A-Z]+=.*$/mu);
  assert.match(localEnvironmentExample, /supplied only to the seed process/u);
  assert.match(localDevelopmentSource, /const ephemeralLocalPinKeys = Object\.freeze\(/u);
  assert.match(localDevelopmentSource, /Object\.entries\(values\)\.filter\(\(\[key\]\) => !ephemeralLocalPinKeys\.includes\(key\)\)/u);
  assert.doesNotMatch(localDevelopmentSource, /function randomPin\b|randomPin\(\)/u);
  assert.doesNotMatch(localDevelopmentSource, /SR_LOCAL_PIN_[A-Z]+:\s*random/u);
});

test('repair intake seed is deterministic, varied, and excludes sensitive intake data', () => {
  const first = localRepairIntakeRows();
  assert.deepEqual(first, localRepairIntakeRows());
  assert.equal(first.length, 15);
  assert.ok(first.some((row) => row.receivedById === null && row.documentedRiskSummary === null));
  assert.ok(first.some((row) => (row.customerNarrative?.length ?? 0) > 200));
  assert.ok(first.some((row) => row.documentedRiskSummary !== null));
  const keys = Object.keys(first[0]).join(' ');
  assert.doesNotMatch(keys, /pin|password|pattern|unlock|imei|secret/iu);
});

test('repair timeline seed is deterministic, typed, and covers rich, single, and empty scenarios', () => {
  const rows = localRepairTimelineRows();
  assert.deepEqual(rows, localRepairTimelineRows());
  assert.equal(rows.length, 16);
  assert.deepEqual(new Set(rows.map((row) => row.entryType)), new Set(['note', 'system_event']));
  assert.ok(rows.filter((row) => row.repairId === '00000000-0000-4000-8000-000000001003').length >= 6);
  assert.equal(rows.filter((row) => row.repairId === '00000000-0000-4000-8000-000000001002').length, 3);
  assert.equal(rows.filter((row) => row.repairId === '00000000-0000-4000-8000-000000001012').length, 2);
  assert.equal(rows.filter((row) => row.repairId === '00000000-0000-4000-8000-000000001005').length, 1);
  assert.equal(rows.filter((row) => row.repairId === '00000000-0000-4000-8000-000000001008').length, 0);
  assert.equal(rows.filter((row) => row.source === 'local.location').length, 7);
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
