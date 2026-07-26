import { createHash } from 'node:crypto';

export const postgresqlImageDigest =
  'sha256:d93de42662696f278fb34354b06fdaa90ad7ca3106d6f72fbd01d16da006d2cf';
export const postgresqlImage = `postgres@${postgresqlImageDigest}`;
export const productiveMigration =
  '20260725183832_database_create_tenants_and_branches.ts';
export const criticalPostgresqlSuites = Object.freeze([
  'connection',
  'transaction',
  'migration',
  'schema',
  'owner-scoped-adapters',
]);

function sha256(value) {
  return createHash('sha256').update(value).digest('hex');
}

function requiredString(value, label) {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new Error(`${label} must be a non-empty string`);
  }
}

export function comparablePostgresqlCiManifest(manifest) {
  return {
    artifacts: manifest.artifacts,
    cleanup: manifest.cleanup,
    contract: manifest.contract,
    database: manifest.database,
    image: manifest.image,
    isolation: manifest.isolation,
    migration: manifest.migration,
    postgres: manifest.postgres,
    result: manifest.result,
    roles: manifest.roles,
    sanitization: manifest.sanitization,
    schema: manifest.schema,
    schemaVersion: manifest.schemaVersion,
    suites: manifest.suites,
    totals: manifest.totals,
  };
}

export function validatePostgresqlCiManifest(manifest) {
  if (
    manifest.schemaVersion !== 1 ||
    manifest.contract !== 'PBI-023/POSTGRESQL-CI'
  ) {
    throw new Error('Unsupported PostgreSQL CI evidence contract');
  }
  for (const [label, value] of [
    ['execution.label', manifest.execution?.label],
    ['execution.workflowRunId', manifest.execution?.workflowRunId],
    ['image.reference', manifest.image?.reference],
    ['image.digest', manifest.image?.digest],
    ['postgres.version', manifest.postgres?.version],
    ['migration.sha256', manifest.migration?.sha256],
    ['schema.sha256', manifest.schema?.sha256],
    ['comparableSha256', manifest.comparableSha256],
    ['result', manifest.result],
  ]) {
    requiredString(value, label);
  }
  if (
    manifest.image.reference !== postgresqlImage ||
    manifest.image.digest !== postgresqlImageDigest ||
    manifest.image.os !== 'linux' ||
    manifest.image.architecture !== 'amd64'
  ) {
    throw new Error('PostgreSQL CI image is not the governed 18.4 digest');
  }
  if (
    manifest.postgres.version !== '18.4' ||
    manifest.postgres.encoding !== 'UTF8' ||
    manifest.postgres.timezone !== 'UTC'
  ) {
    throw new Error('PostgreSQL CI runtime contract is not exact');
  }
  if (
    !Array.isArray(manifest.suites) ||
    manifest.suites.length !== criticalPostgresqlSuites.length ||
    manifest.suites.some(
      (suite, index) =>
        suite.name !== criticalPostgresqlSuites[index] ||
        suite.status !== 'PASS' ||
        suite.cleanup !== 'PASS' ||
        suite.tests.skipped !== 0 ||
        suite.tests.fail !== 0 ||
        suite.tests.cancelled !== 0 ||
        suite.tests.todo !== 0 ||
        suite.tests.tests < 1 ||
        suite.tests.pass !== suite.tests.tests,
    )
  ) {
    throw new Error('A critical PostgreSQL suite was skipped or failed');
  }
  if (
    manifest.totals.suites !== criticalPostgresqlSuites.length ||
    manifest.totals.criticalSkips !== 0 ||
    manifest.totals.failures !== 0 ||
    manifest.totals.testsExecuted < 10
  ) {
    throw new Error('PostgreSQL CI totals are incomplete');
  }
  if (
    manifest.migration.filename !== productiveMigration ||
    manifest.migration.status !== 'PASS' ||
    manifest.schema.tables.join(',') !== 'branches,tenants' ||
    manifest.isolation.schema !== 'PASS' ||
    manifest.isolation.adapters !== 'PASS' ||
    manifest.cleanup.status !== 'PASS'
  ) {
    throw new Error('PostgreSQL CI material verification is incomplete');
  }
  if (
    manifest.result !== 'PASS' ||
    manifest.sanitization.status !== 'PASS'
  ) {
    throw new Error('PostgreSQL CI evidence did not pass');
  }
  const serialized = JSON.stringify(manifest);
  if (
    /postgres(?:ql)?:\/\//iu.test(serialized) ||
    /synthetic_[0-9a-f]{8,}/iu.test(serialized) ||
    /(?:^|[\\/])Users[\\/]/u.test(serialized) ||
    /(?:^|[\\/])home[\\/]runner[\\/]work[\\/]/u.test(serialized)
  ) {
    throw new Error('PostgreSQL CI evidence contains sensitive material');
  }
  const comparable = comparablePostgresqlCiManifest(manifest);
  if (manifest.comparableSha256 !== sha256(JSON.stringify(comparable))) {
    throw new Error('PostgreSQL CI comparable hash does not match');
  }
  return manifest;
}

export function finalizePostgresqlCiManifest(manifest) {
  const finalized = {
    ...manifest,
    comparableSha256: sha256(
      JSON.stringify(comparablePostgresqlCiManifest(manifest)),
    ),
  };
  return validatePostgresqlCiManifest(finalized);
}
