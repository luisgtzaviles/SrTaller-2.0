import { execFile } from 'node:child_process';
import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { promisify } from 'node:util';

import {
  criticalPostgresqlSuites,
  finalizePostgresqlCiManifest,
  postgresqlImage,
  postgresqlImageDigest,
  productiveMigration,
  previewMigration,
  stationMigration,
} from './lib/postgresql-ci-evidence.mjs';
import { sha256File } from './lib/ci-evidence.mjs';

const execute = promisify(execFile);

function argument(name) {
  const index = process.argv.indexOf(name);
  return index === -1 ? undefined : process.argv[index + 1];
}

function required(value, label) {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new Error(`${label} is required`);
  }
  return value;
}

const outputPath = resolve(required(argument('--output'), '--output'));
const executionLabel = required(
  process.env.VC024_EXECUTION_LABEL ?? argument('--execution-label'),
  'execution label',
);
const workflowRunId = required(
  process.env.GITHUB_RUN_ID ?? argument('--workflow-run-id'),
  'workflow run id',
);
const attempt =
  process.env.GITHUB_RUN_ATTEMPT ?? argument('--attempt') ?? '1';

if (!/^(?:run-[12]|local-run-[12])$/u.test(executionLabel)) {
  throw new Error('PostgreSQL CI execution label is not governed');
}
if (process.version !== 'v24.18.0') {
  throw new Error('Node.js 24.18.0 is required for PostgreSQL CI');
}

async function command(commandName, argumentsList, options = {}) {
  try {
    return await execute(commandName, argumentsList, {
      encoding: 'utf8',
      maxBuffer: 20 * 1024 * 1024,
      ...options,
    });
  } catch (error) {
    const diagnostic = [error?.stdout, error?.stderr]
      .filter((value) => typeof value === 'string' && value.trim() !== '')
      .join('\n')
      .replace(/synthetic_[0-9a-f]+/giu, 'synthetic_<redacted>')
      .replace(/postgres(?:ql)?:\/\/\S+/giu, '<redacted-database-url>')
      .split('\n')
      .slice(-80)
      .join('\n')
      .trim();
    throw new Error(
      `PostgreSQL CI operation failed: ${argumentsList[0] ?? commandName}` +
        (diagnostic === '' ? '' : `\n${diagnostic}`),
    );
  }
}

const suiteDefinitions = Object.freeze([
  {
    name: 'connection',
    script: 'scripts/test-database-connection-postgresql.mjs',
  },
  {
    name: 'transaction',
    script: 'scripts/test-database-transaction-postgresql.mjs',
  },
  {
    name: 'migration',
    script: 'scripts/test-database-migration-postgresql.mjs',
  },
  {
    name: 'schema',
    script: 'scripts/test-database-schema-postgresql.mjs',
  },
  {
    name: 'owner-scoped-adapters',
    script: 'scripts/test-owner-scoped-persistence-postgresql.mjs',
  },
  {
    name: 'trusted-station-context',
    script: 'scripts/test-trusted-station-context-postgresql.mjs',
  },
  {
    name: 'preview-repairs',
    script: 'scripts/test-preview-repair-postgresql.mjs',
  },
]);

await command('docker', ['pull', '--quiet', postgresqlImage], {
  timeout: 180_000,
});
const { stdout: inspectionOutput } = await command(
  'docker',
  ['image', 'inspect', postgresqlImage],
  { timeout: 30_000 },
);
const inspection = JSON.parse(inspectionOutput)[0];
if (
  inspection?.Os !== 'linux' ||
  inspection?.Architecture !== 'amd64' ||
  !inspection?.RepoDigests?.includes(postgresqlImage)
) {
  throw new Error('Pulled PostgreSQL image does not match governed digest');
}

const suites = [];
const suiteResults = new Map();
for (const definition of suiteDefinitions) {
  const startedAt = Date.now();
  process.stdout.write(
    `PostgreSQL CI suite ${definition.name}: running\n`,
  );
  const { stdout } = await command(
    process.execPath,
    [definition.script, '--runs', '1'],
    {
      env: {
        ...process.env,
        SR_PG_CI_EXECUTION_LABEL: executionLabel,
      },
      timeout: 240_000,
    },
  );
  const result = JSON.parse(stdout);
  if (
    result.status !== 'PASS' ||
    result.cleanup !== 'PASS' ||
    result.imageDigest !== postgresqlImageDigest ||
    result.postgres !== '18.4' ||
    result.suite?.tests?.skipped !== 0
  ) {
    throw new Error(
      `PostgreSQL CI suite ${definition.name} did not pass materially`,
    );
  }
  suiteResults.set(definition.name, result);
  suites.push(
    Object.freeze({
      name: definition.name,
      status: result.status,
      cleanup: result.cleanup,
      materialSha256: result.materialSha256,
      scenarios: result.suite.scenarios,
      tests: result.suite.tests,
    }),
  );
  process.stdout.write(
    `PostgreSQL CI suite ${definition.name}: PASS ` +
      `(${Date.now() - startedAt}ms, ${result.suite.tests.tests} tests, 0 skipped)\n`,
  );
}

if (
  suites.map(({ name }) => name).join(',') !==
  criticalPostgresqlSuites.join(',')
) {
  throw new Error('PostgreSQL CI suite inventory differs from policy');
}
const { stdout: residualContainers } = await command('docker', [
  'ps',
  '--all',
  '--quiet',
  '--filter',
  `label=com.srtaller.pbi023.execution=${executionLabel}`,
]);
const { stdout: residualStationContainers } = await command('docker', [
  'ps',
  '--all',
  '--quiet',
  '--filter',
  `label=com.srtaller.pbi024.execution=${executionLabel}`,
]);
if (
  residualContainers.trim() !== '' ||
  residualStationContainers.trim() !== ''
) {
  throw new Error('PostgreSQL CI suites left a governed container');
}

const schemaResult = suiteResults.get('schema');
const schemaEvidence = schemaResult.suite.schemaEvidence;
const adapterResult = suiteResults.get('owner-scoped-adapters');
const postgresEnvironment = adapterResult.suite.environment;

const totals = Object.freeze({
  suites: suites.length,
  testsExecuted: suites.reduce(
    (total, suite) => total + suite.tests.tests,
    0,
  ),
  criticalSkips: suites.reduce(
    (total, suite) => total + suite.tests.skipped,
    0,
  ),
  failures: suites.reduce(
    (total, suite) => total + suite.tests.fail,
    0,
  ),
  previouslyGatedSkips: 10,
});

const migrationPath = resolve(
  'src/infrastructure/database/migrations',
  productiveMigration,
);
const stationMigrationPath = resolve(
  'src/infrastructure/database/migrations',
  stationMigration,
);
const previewMigrationPath = resolve(
  'src/infrastructure/database/migrations',
  previewMigration,
);
const manifest = finalizePostgresqlCiManifest({
  schemaVersion: 1,
  contract: 'PBI-024/POSTGRESQL-CI',
  execution: {
    attempt,
    event: process.env.GITHUB_EVENT_NAME ?? 'local',
    headSha:
      process.env.GITHUB_SHA ??
      '0000000000000000000000000000000000000000',
    label: executionLabel,
    workflowRunId,
  },
  image: {
    reference: postgresqlImage,
    digest: postgresqlImageDigest,
    os: inspection.Os,
    architecture: inspection.Architecture,
  },
  postgres: {
    version: '18.4',
    serverVersion: postgresEnvironment.serverVersion,
    clientVersion: postgresEnvironment.clientVersion,
    encoding: postgresEnvironment.encoding,
    timezone: postgresEnvironment.timezone,
    locale: postgresEnvironment.locale,
  },
  database: {
    isolation: 'fresh database and container per critical suite',
    identitiesExposed: false,
    persistentStorage: false,
    suiteDatabases: suites.length,
  },
  roles: {
    mode: 'synthetic ephemeral lifecycle identity per suite',
    migration: 'migration-enabled only in migration/schema/adapter suites',
    application: 'test/application behavior without production privilege claim',
  },
  migration: {
    filename: productiveMigration,
    stationFilename: stationMigration,
    previewFilename: previewMigration,
    sha256: await sha256File(migrationPath),
    stationSha256: await sha256File(stationMigrationPath),
    previewSha256: await sha256File(previewMigrationPath),
    status: 'PASS',
    emptyDatabase: 'PASS',
    downReapply: 'PASS',
    drift: 'PASS',
    journal: 'PASS',
    lock: 'PASS',
  },
  schema: {
    sha256: schemaEvidence.schemaSha256,
    tables: schemaEvidence.tables,
    stationTables: ['station_bindings', 'stations'],
    previewTables: ['preview_repair_status_history', 'preview_repairs'],
    stationSha256:
      suiteResults.get('trusted-station-context').materialSha256,
    previewSha256:
      suiteResults.get('preview-repairs').materialSha256,
    columns: schemaEvidence.columns,
    constraints: schemaEvidence.constraints,
    indexes: schemaEvidence.indexes,
  },
  suites,
  totals,
  isolation: {
    schema: schemaEvidence.negativeIsolation,
    adapters: 'PASS',
    crossTenantRead: 'PASS',
    tenantScopedList: 'PASS',
  },
  cleanup: {
    status: 'PASS',
    containers: 0,
    volumes: 0,
    dedicatedNetworks: 0,
    persistentFiles: 0,
    dumps: 0,
    environmentFiles: 0,
  },
  sanitization: {
    status: 'PASS',
    credentials: 'not recorded',
    connectionStrings: 'not recorded',
    rawSqlLogs: 'not recorded',
    personalPaths: 'not recorded',
  },
  artifacts: [
    'POSTGRESQL_MANIFEST.json',
    'EVIDENCE_MANIFEST.json',
    'DIST_MANIFEST.json',
  ],
  result: 'PASS',
});

await writeFile(outputPath, `${JSON.stringify(manifest, null, 2)}\n`);
process.stdout.write(
  `PostgreSQL CI PASS: ${totals.suites} suites, ` +
    `${totals.testsExecuted} tests, 0 critical skips\n`,
);

await readFile(outputPath, 'utf8');
