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
} from './lib/postgresql-ci-evidence.mjs';
import {
  formatPostgresqlChildDiagnostic,
  formatPostgresqlChildFailureDiagnostic,
  formatPostgresqlHarnessFailureDiagnostic,
  parsePostgresqlChildDiagnosticMarker,
  parsePostgresqlChildFailureMarker,
  parsePostgresqlHarnessFailureMarker,
} from './lib/postgresql-test-output.mjs';
import { sha256File } from './lib/ci-evidence.mjs';

const execute = promisify(execFile);

const DEFAULT_POSTGRESQL_SUITE_TIMEOUT_MS = 240_000;
const OWNER_SCOPED_POSTGRESQL_SUITE_TIMEOUT_MS = 360_000;

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
const runtimeDiagnosticsOutput = argument('--runtime-diagnostics-output');
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
const headSha =
  argument('--head-sha') ??
  process.env.GITHUB_SHA ??
  '0000000000000000000000000000000000000000';

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
    const stderr =
      error !== null &&
        typeof error === 'object' &&
        typeof error.stderr === 'string'
        ? error.stderr
        : '';
    const childFailure = parsePostgresqlChildFailureMarker(stderr);
    const childDiagnostic = parsePostgresqlChildDiagnosticMarker(stderr);
    const harnessFailure = parsePostgresqlHarnessFailureMarker(stderr);
    const diagnostics = [
      childDiagnostic === null
        ? null
        : formatPostgresqlChildDiagnostic(childDiagnostic),
      childFailure !== null && harnessFailure === null
        ? formatPostgresqlChildFailureDiagnostic(childFailure)
        : harnessFailure !== null && childFailure === null
          ? formatPostgresqlHarnessFailureDiagnostic(harnessFailure)
          : null,
    ].filter((value) => value !== null);
    throw new Error(
      `PostgreSQL CI operation failed: ${
        argumentsList[0] ?? commandName
      }${diagnostics.length === 0 ? '' : `; ${diagnostics.join('; ')}`}`,
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
      timeout:
        definition.name === 'owner-scoped-adapters'
          ? OWNER_SCOPED_POSTGRESQL_SUITE_TIMEOUT_MS
          : DEFAULT_POSTGRESQL_SUITE_TIMEOUT_MS,
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
  if (definition.name === 'owner-scoped-adapters') {
    const diagnostics = result.diagnostics;
    const diagnosticRun = diagnostics?.runs?.[0];
    if (
      !Number.isFinite(diagnostics?.imagePullMs) ||
      !Number.isFinite(diagnostics?.containerStartMs) ||
      diagnostics?.containerCount !== 1 ||
      diagnostics?.executionMode !== 'serial-fresh-database' ||
      !Number.isFinite(diagnosticRun?.totalMs) ||
      diagnosticRun?.executionMode !== 'serial-fresh-database' ||
      !Array.isArray(diagnosticRun?.executionOrder) ||
      diagnosticRun.executionOrder.length !== 8 ||
      !Array.isArray(diagnosticRun?.fileTimings) ||
      diagnosticRun.fileTimings.length !== 8
    ) {
      throw new Error(
        'PostgreSQL owner-scoped timing diagnostics are incomplete',
      );
    }
    process.stdout.write(
      `PostgreSQL owner-scoped timing: pull=${diagnostics.imagePullMs}ms ` +
        `container-start=${diagnostics.containerStartMs}ms ` +
        `campaign=${diagnosticRun.totalMs}ms mode=serial-fresh-database\n`,
    );
    for (const timing of diagnosticRun.fileTimings) {
      process.stdout.write(
        `PostgreSQL owner-scoped file timing: ${timing.file} ` +
          `total=${timing.totalMs}ms test=${timing.testProcessMs}ms ` +
          `database-create=${timing.databaseCreateMs}ms ` +
          `database-drop=${timing.databaseDropMs}ms\n`,
      );
    }
  }
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
if (residualContainers.trim() !== '') {
  throw new Error('PostgreSQL CI suites left a governed container');
}

const schemaResult = suiteResults.get('schema');
const schemaEvidence = schemaResult.suite.schemaEvidence;
const adapterResult = suiteResults.get('owner-scoped-adapters');
const postgresEnvironment = adapterResult.suite.environment;

if (runtimeDiagnosticsOutput) {
  const runtimeDiagnostics = Object.freeze({
    contract: 'SR_TALLER_POSTGRESQL_RUNTIME_DIAGNOSTICS_V1',
    executionLabel,
    headSha,
    ownerScoped: adapterResult.diagnostics,
    schemaVersion: 1,
  });
  await writeFile(
    resolve(runtimeDiagnosticsOutput),
    `${JSON.stringify(runtimeDiagnostics, null, 2)}\n`,
    { mode: 0o600 },
  );
}

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
const manifest = finalizePostgresqlCiManifest({
  schemaVersion: 1,
  contract: 'PBI-023/POSTGRESQL-CI',
  execution: {
    attempt,
    event: process.env.GITHUB_EVENT_NAME ?? 'local',
    headSha,
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
    sha256: await sha256File(migrationPath),
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
