import { execFile } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { promisify } from 'node:util';

import {
  finalizePbi039PostgresqlCiManifest,
} from './lib/pbi039-postgresql-ci-evidence.mjs';
import {
  assertPostgresqlTestSummary,
  pbi039PostgresqlTestFiles,
} from './lib/postgresql-test-output.mjs';
import {
  postgresqlImage as image,
  postgresqlImageDigest as imageDigest,
} from './lib/postgresql-ci-evidence.mjs';

const execute = promisify(execFile);

function argument(name) {
  const index = process.argv.indexOf(name);
  return index === -1 ? undefined : process.argv[index + 1];
}

const runsArgumentIndex = process.argv.indexOf('--runs');
const requestedRuns =
  runsArgumentIndex === -1
    ? 1
    : Number.parseInt(process.argv[runsArgumentIndex + 1] ?? '', 10);
const activeContainers = new Set();
const outputArgument = argument('--output');
const outputPath = outputArgument ? resolve(outputArgument) : undefined;
const executionLabel =
  process.env.SR_PG_CI_EXECUTION_LABEL ??
  argument('--execution-label') ??
  'local-run-1';
const workflowRunId =
  process.env.GITHUB_RUN_ID ??
  argument('--workflow-run-id') ??
  'pbi039-local';
const headSha =
  process.env.GITHUB_SHA ??
  argument('--head-sha') ??
  '0000000000000000000000000000000000000000';

if (process.version !== 'v24.18.0') {
  throw new Error('Node.js 24.18.0 is required for PBI-039 PostgreSQL verification');
}
if (!Number.isInteger(requestedRuns) || requestedRuns < 1 || requestedRuns > 5) {
  throw new Error(
    'usage: node scripts/test-pbi039-postgresql.mjs [--runs 1..5]',
  );
}
if (!/^(?:run-[12]|local-run-[12])$/u.test(executionLabel)) {
  throw new Error('PBI-039 PostgreSQL execution label is not governed');
}

async function docker(argumentsList, options = {}) {
  try {
    return await execute('docker', argumentsList, {
      encoding: 'utf8',
      maxBuffer: 10 * 1024 * 1024,
      ...options,
    });
  } catch {
    throw new Error(
      `PBI-039 PostgreSQL operation failed: ${argumentsList[0] ?? 'docker'}`,
    );
  }
}

async function waitForHealthy(container) {
  const deadline = Date.now() + 60_000;
  while (Date.now() < deadline) {
    const { stdout } = await docker([
      'inspect',
      '--format',
      '{{if .State.Health}}{{.State.Health.Status}}{{else}}{{.State.Status}}{{end}}',
      container,
    ]);
    const state = stdout.trim();
    if (state === 'healthy') return;
    if (state === 'exited' || state === 'dead' || state === 'unhealthy') {
      throw new Error(`PBI-039 PostgreSQL container ${container} is ${state}`);
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error(`PBI-039 PostgreSQL container ${container} health timeout`);
}

async function assertContainerAbsent(container) {
  const { stdout } = await docker([
    'ps',
    '--all',
    '--filter',
    `name=^/${container}$`,
    '--format',
    '{{.Names}}',
  ]);
  if (stdout.trim() !== '') {
    throw new Error(`PBI-039 PostgreSQL cleanup retained ${container}`);
  }
}

function databaseEnvironment({ database, password, port, user }) {
  return {
    SR_DB_ENVIRONMENT: 'development',
    SR_DB_HOST: '127.0.0.1',
    SR_DB_PORT: port,
    SR_DB_NAME: database,
    SR_DB_USER: user,
    SR_DB_PASSWORD: password,
    SR_DB_SSL_MODE: 'disable',
    SR_DB_POOL_MIN: '0',
    SR_DB_POOL_MAX: '4',
    SR_DB_IDLE_TIMEOUT_MS: '1000',
    SR_DB_CONNECTION_TIMEOUT_MS: '2000',
    SR_DB_STATEMENT_TIMEOUT_MS: '10000',
    SR_DB_QUERY_TIMEOUT_MS: '10000',
    SR_DB_APPLICATION_NAME: 'srtaller-pbi039-postgresql-migrator',
    SR_DB_ROLE: 'migration',
    SR_DB_ACCESS_MODE: 'read-write',
    SR_DB_MIGRATIONS_ENABLED: 'true',
  };
}

async function cleanupContainer(container) {
  if (!activeContainers.has(container)) return;
  await docker(['rm', '--force', container]);
  activeContainers.delete(container);
  await assertContainerAbsent(container);
}

async function cleanupAfterSignal(signal) {
  try {
    for (const container of [...activeContainers]) {
      await cleanupContainer(container);
    }
  } finally {
    process.exit(signal === 'SIGINT' ? 130 : 143);
  }
}

process.once('SIGINT', () => void cleanupAfterSignal('SIGINT'));
process.once('SIGTERM', () => void cleanupAfterSignal('SIGTERM'));

async function runSuite(file, run) {
  const suite = file.replace(/^test\//u, '').replace(/-postgresql\.test\.mjs$/u, '');
  const suffix = randomBytes(6).toString('hex');
  const container = `srtaller_pbi039_${suite}_${suffix}`;
  const database = `srtaller_pbi039_${suite}_${suffix}`;
  const user = 'srtaller_pbi039_test';
  const password = `synthetic_${randomBytes(18).toString('hex')}`;

  try {
    const { stdout: runOutput } = await docker([
      'run',
      '--detach',
      '--name',
      container,
      '--label',
      'com.srtaller.pbi039.hardening=postgresql',
      '--label',
      `com.srtaller.pbi039.execution=${executionLabel}`,
      '--publish',
      '127.0.0.1::5432',
      '--tmpfs',
      '/var/lib/postgresql:rw,noexec,nosuid,size=256m',
      '--env',
      `POSTGRES_DB=${database}`,
      '--env',
      `POSTGRES_PASSWORD=${password}`,
      '--env',
      `POSTGRES_USER=${user}`,
      '--env',
      'TZ=UTC',
      '--health-cmd',
      `pg_isready --username=${user} --dbname=${database}`,
      '--health-interval',
      '1s',
      '--health-timeout',
      '2s',
      '--health-retries',
      '30',
      image,
    ]);
    if (runOutput.trim() === '') {
      throw new Error(`PBI-039 PostgreSQL suite ${suite} did not start a container`);
    }
    activeContainers.add(container);
    await waitForHealthy(container);

    const { stdout: versionOutput } = await docker([
      'exec',
      container,
      'postgres',
      '--version',
    ]);
    if (!/postgres \(PostgreSQL\) 18\.4\b/u.test(versionOutput)) {
      throw new Error(`PBI-039 PostgreSQL suite ${suite} version differs from 18.4`);
    }
    const { stdout: encodingOutput } = await docker([
      'exec',
      container,
      'psql',
      '--tuples-only',
      '--no-align',
      '--username',
      user,
      '--dbname',
      database,
      '--command',
      'show server_encoding',
    ]);
    if (encodingOutput.trim() !== 'UTF8') {
      throw new Error(`PBI-039 PostgreSQL suite ${suite} encoding differs from UTF8`);
    }
    const { stdout: timezoneOutput } = await docker([
      'exec',
      container,
      'psql',
      '--tuples-only',
      '--no-align',
      '--username',
      user,
      '--dbname',
      database,
      '--command',
      'show TimeZone',
    ]);
    if (timezoneOutput.trim() !== 'UTC') {
      throw new Error(`PBI-039 PostgreSQL suite ${suite} timezone differs from UTC`);
    }

    const { stdout: portOutput } = await docker([
      'inspect',
      '--format',
      '{{(index (index .NetworkSettings.Ports "5432/tcp") 0).HostPort}}',
      container,
    ]);
    const port = portOutput.trim();
    if (!/^\d{1,5}$/u.test(port)) {
      throw new Error(`PBI-039 PostgreSQL suite ${suite} has no loopback port`);
    }

    const environment = databaseEnvironment({ database, password, port, user });
    const { stdout: migrationOutput } = await execute(
      process.execPath,
      ['--enable-source-maps', 'dist/db-migrate.js'],
      {
        encoding: 'utf8',
        env: { ...process.env, ...environment },
        maxBuffer: 10 * 1024 * 1024,
        timeout: 60_000,
      },
    );
    const migration = JSON.parse(migrationOutput.trim());
    if (migration.pending !== 0 || migration.applied < 1) {
      throw new Error(`PBI-039 PostgreSQL suite ${suite} schema is incomplete`);
    }

    let testOutput;
    try {
      ({ stdout: testOutput } = await execute(
        process.execPath,
        ['--no-maglev', '--test', '--test-concurrency=1', file],
        {
          encoding: 'utf8',
          env: {
            ...process.env,
            SR_PBI039_PG_TEST: '1',
            SR_PBI039_PG_HOST: '127.0.0.1',
            SR_PBI039_PG_NAME: database,
            SR_PBI039_PG_PASSWORD: password,
            SR_PBI039_PG_PORT: port,
            SR_PBI039_PG_USER: user,
          },
          maxBuffer: 10 * 1024 * 1024,
          timeout: 60_000,
        },
      ));
    } catch {
      throw new Error(
        `PBI-039 PostgreSQL suite ${suite} failed in ${container}/${database} (run ${run})`,
      );
    }
    const tests = assertPostgresqlTestSummary(testOutput);
    return Object.freeze({
      name: suite,
      status: 'PASS',
      cleanup: 'PASS',
      migration: Object.freeze({
        applied: migration.applied,
        pending: migration.pending,
      }),
      tests,
    });
  } finally {
    await cleanupContainer(container);
  }
}

await docker(['pull', '--quiet', image], { timeout: 180_000 });
const { stdout: inspectionOutput } = await docker(
  ['image', 'inspect', image],
  { timeout: 30_000 },
);
const inspection = JSON.parse(inspectionOutput)[0];
if (
  inspection?.Os !== 'linux' ||
  inspection?.Architecture !== 'amd64' ||
  !inspection?.RepoDigests?.includes(image)
) {
  throw new Error('PBI-039 PostgreSQL image does not match governed digest');
}

const results = [];
for (let run = 1; run <= requestedRuns; run += 1) {
  const suites = [];
  for (const file of pbi039PostgresqlTestFiles) {
    suites.push(await runSuite(file, run));
  }
  results.push(Object.freeze(suites));
}

const material = JSON.stringify(results[0]);
if (results.some((result) => JSON.stringify(result) !== material)) {
  throw new Error('PBI-039 PostgreSQL grouped runs differ materially');
}

const manifest = finalizePbi039PostgresqlCiManifest({
  schemaVersion: 1,
  contract: 'PBI-039/POSTGRESQL-CI',
  execution: {
    attempt: process.env.GITHUB_RUN_ATTEMPT ?? '1',
    event: process.env.GITHUB_EVENT_NAME ?? 'local',
    headSha,
    label: executionLabel,
    workflowRunId,
  },
  image: {
    reference: image,
    digest: imageDigest,
    os: inspection.Os,
    architecture: inspection.Architecture,
  },
  postgres: {
    version: '18.4',
    encoding: 'UTF8',
    timezone: 'UTC',
  },
  database: {
    isolation: 'fresh database and container per test file',
    identitiesExposed: false,
    persistentStorage: false,
    suiteDatabases: results[0].length,
  },
  suites: results[0],
  totals: {
    suites: results[0].length,
    testsExecuted: results[0].reduce(
      (total, suite) => total + suite.tests.tests,
      0,
    ),
    criticalSkips: 0,
    failures: 0,
  },
  cleanup: {
    status: 'PASS',
    containers: 0,
    volumes: 0,
    persistentFiles: 0,
  },
  sanitization: {
    status: 'PASS',
    credentials: 'not recorded',
    connectionStrings: 'not recorded',
    rawSqlLogs: 'not recorded',
    personalPaths: 'not recorded',
  },
  materialComparison: 'MATCH',
  runs: requestedRuns,
  status: 'PASS',
  result: 'PASS',
});

if (outputPath) {
  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, `${JSON.stringify(manifest, null, 2)}\n`);
  process.stdout.write(
    `PBI-039 PostgreSQL CI PASS: ${manifest.totals.suites} suites, ` +
      `${manifest.totals.testsExecuted} tests, 0 critical skips\n`,
  );
} else {
  process.stdout.write(
    `${JSON.stringify(
      manifest,
      null,
      2,
    )}\n`,
  );
}
