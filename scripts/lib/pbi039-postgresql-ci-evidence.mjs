import { createHash } from 'node:crypto';

import { pbi039PostgresqlTestFiles } from './postgresql-test-output.mjs';
import {
  postgresqlImage,
  postgresqlImageDigest,
} from './postgresql-ci-evidence.mjs';

export const pbi039PostgresqlSuites = Object.freeze(
  pbi039PostgresqlTestFiles.map((file) =>
    file.replace(/^test\//u, '').replace(/-postgresql\.test\.mjs$/u, ''),
  ),
);

function sha256(value) {
  return createHash('sha256').update(value).digest('hex');
}

function requiredString(value, label) {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new Error(`${label} must be a non-empty string`);
  }
}

export function comparablePbi039PostgresqlCiManifest(manifest) {
  return {
    cleanup: manifest.cleanup,
    contract: manifest.contract,
    database: manifest.database,
    image: manifest.image,
    materialComparison: manifest.materialComparison,
    postgres: manifest.postgres,
    result: manifest.result,
    runs: manifest.runs,
    sanitization: manifest.sanitization,
    schemaVersion: manifest.schemaVersion,
    status: manifest.status,
    suites: manifest.suites,
    totals: manifest.totals,
  };
}

export function validatePbi039PostgresqlCiManifest(manifest) {
  if (
    manifest?.schemaVersion !== 1 ||
    manifest.contract !== 'PBI-039/POSTGRESQL-CI'
  ) {
    throw new Error('Unsupported PBI-039 PostgreSQL CI evidence contract');
  }
  for (const [label, value] of [
    ['execution.label', manifest.execution?.label],
    ['execution.workflowRunId', manifest.execution?.workflowRunId],
    ['execution.headSha', manifest.execution?.headSha],
    ['image.reference', manifest.image?.reference],
    ['image.digest', manifest.image?.digest],
    ['postgres.version', manifest.postgres?.version],
    ['materialSha256', manifest.materialSha256],
    ['comparableSha256', manifest.comparableSha256],
    ['result', manifest.result],
  ]) {
    requiredString(value, label);
  }
  if (!/^[0-9a-f]{40}$/u.test(manifest.execution.headSha)) {
    throw new Error('PBI-039 PostgreSQL head SHA must be a full Git SHA-1');
  }
  if (!/^(?:run-[12]|local-run-[12])$/u.test(manifest.execution.label)) {
    throw new Error('PBI-039 PostgreSQL execution label is not governed');
  }
  if (
    manifest.image.reference !== postgresqlImage ||
    manifest.image.digest !== postgresqlImageDigest ||
    manifest.image.os !== 'linux' ||
    manifest.image.architecture !== 'amd64'
  ) {
    throw new Error('PBI-039 PostgreSQL image is not the governed 18.4 digest');
  }
  if (
    manifest.postgres.version !== '18.4' ||
    manifest.postgres.encoding !== 'UTF8' ||
    manifest.postgres.timezone !== 'UTC'
  ) {
    throw new Error('PBI-039 PostgreSQL runtime contract is not exact');
  }
  if (
    manifest.database.isolation !==
      'fresh database and container per test file' ||
    manifest.database.identitiesExposed !== false ||
    manifest.database.persistentStorage !== false ||
    manifest.database.suiteDatabases !== pbi039PostgresqlSuites.length
  ) {
    throw new Error('PBI-039 PostgreSQL database isolation is incomplete');
  }
  if (
    !Array.isArray(manifest.suites) ||
    manifest.suites.length !== pbi039PostgresqlSuites.length ||
    manifest.suites.some(
      (suite, index) =>
        suite.name !== pbi039PostgresqlSuites[index] ||
        suite.status !== 'PASS' ||
        suite.cleanup !== 'PASS' ||
        suite.migration?.applied < 1 ||
        suite.migration?.pending !== 0 ||
        suite.tests?.tests < 1 ||
        suite.tests?.pass !== suite.tests?.tests ||
        suite.tests?.fail !== 0 ||
        suite.tests?.cancelled !== 0 ||
        suite.tests?.skipped !== 0 ||
        suite.tests?.todo !== 0,
    )
  ) {
    throw new Error('A PBI-039 PostgreSQL suite was skipped or failed');
  }
  const testsExecuted = manifest.suites.reduce(
    (total, suite) => total + suite.tests.tests,
    0,
  );
  if (
    manifest.totals.suites !== pbi039PostgresqlSuites.length ||
    manifest.totals.testsExecuted !== testsExecuted ||
    manifest.totals.criticalSkips !== 0 ||
    manifest.totals.failures !== 0 ||
    testsExecuted < pbi039PostgresqlSuites.length
  ) {
    throw new Error('PBI-039 PostgreSQL totals are incomplete');
  }
  if (
    manifest.status !== 'PASS' ||
    manifest.result !== 'PASS' ||
    manifest.materialComparison !== 'MATCH' ||
    !Number.isInteger(manifest.runs) ||
    manifest.runs < 1 ||
    manifest.runs > 5 ||
    manifest.cleanup?.status !== 'PASS' ||
    manifest.cleanup?.containers !== 0 ||
    manifest.cleanup?.volumes !== 0 ||
    manifest.cleanup?.persistentFiles !== 0 ||
    manifest.sanitization?.status !== 'PASS'
  ) {
    throw new Error('PBI-039 PostgreSQL evidence did not pass materially');
  }
  const serialized = JSON.stringify(manifest);
  if (
    /postgres(?:ql)?:\/\//iu.test(serialized) ||
    /synthetic_[0-9a-f]{8,}/iu.test(serialized) ||
    /(?:^|[\\/])Users[\\/]/u.test(serialized) ||
    /(?:^|[\\/])home[\\/]runner[\\/]work[\\/]/u.test(serialized)
  ) {
    throw new Error('PBI-039 PostgreSQL evidence contains sensitive material');
  }
  const material = JSON.stringify(manifest.suites);
  if (manifest.materialSha256 !== sha256(material)) {
    throw new Error('PBI-039 PostgreSQL material hash does not match');
  }
  const comparable = comparablePbi039PostgresqlCiManifest(manifest);
  if (manifest.comparableSha256 !== sha256(JSON.stringify(comparable))) {
    throw new Error('PBI-039 PostgreSQL comparable hash does not match');
  }
  return manifest;
}

export function finalizePbi039PostgresqlCiManifest(manifest) {
  const finalized = {
    ...manifest,
    materialSha256: sha256(JSON.stringify(manifest.suites)),
    comparableSha256: sha256(
      JSON.stringify(comparablePbi039PostgresqlCiManifest(manifest)),
    ),
  };
  return validatePbi039PostgresqlCiManifest(finalized);
}
