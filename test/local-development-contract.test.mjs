import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import {
  LOCAL_APPLICATION_USER,
  LOCAL_DB_HOST,
  LOCAL_DB_NAME,
  LOCAL_DB_PORT,
  LOCAL_MIGRATION_USER,
  assertLocalTarget,
  databaseEnvironment,
  localRepairIntakeRows,
  localRepairTimelineRows,
  localSeedRows,
  parseLocalEnvironment,
} from '../scripts/lib/local-development.mjs';

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

test('seed contract is deterministic and contains only existing schema entities', () => {
  const first = localSeedRows();
  const second = localSeedRows();
  assert.deepEqual(first, second);
  assert.equal(first.tenant.tenantId, '00000000-0000-4000-8000-000000000001');
  assert.equal(first.branches.length, 2);
  assert.deepEqual(Object.keys(first.tenant).sort(), ['createdAt', 'tenantId']);
  assert.deepEqual(Object.keys(first.branches[0]).sort(), ['active', 'branchId', 'createdAt', 'tenantId', 'timeZone']);
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
