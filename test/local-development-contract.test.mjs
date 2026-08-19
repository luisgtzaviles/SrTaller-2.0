import assert from 'node:assert/strict';
import test from 'node:test';

import {
  LOCAL_APPLICATION_USER,
  LOCAL_DB_HOST,
  LOCAL_DB_NAME,
  LOCAL_DB_PORT,
  LOCAL_MIGRATION_USER,
  assertLocalTarget,
  databaseEnvironment,
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
  assert.deepEqual(Object.keys(first.branches[0]).sort(), ['branchId', 'createdAt', 'tenantId']);
});

test('local env parser accepts comments and rejects malformed entries', () => {
  assert.deepEqual(parseLocalEnvironment('# comment\nSR_LOCAL_ENVIRONMENT=local\n'), {
    SR_LOCAL_ENVIRONMENT: 'local',
  });
  assert.throws(() => parseLocalEnvironment('not-an-env-line'), /line 1/u);
});
