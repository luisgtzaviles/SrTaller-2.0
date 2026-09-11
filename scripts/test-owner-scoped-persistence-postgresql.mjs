import { execFile } from 'node:child_process';
import { createHash, randomBytes } from 'node:crypto';
import { promisify } from 'node:util';

import {
  assertPostgresqlTestSummary,
  createPostgresqlChildFailureMarker,
  ownerScopedPostgresqlTestFiles,
} from './lib/postgresql-test-output.mjs';

const execute = promisify(execFile);
const imageDigest =
  'sha256:d93de42662696f278fb34354b06fdaa90ad7ca3106d6f72fbd01d16da006d2cf';
const image = `postgres@${imageDigest}`;
const executionLabel =
  process.env.SR_PG_CI_EXECUTION_LABEL ?? 'standalone';
const requestedRuns =
  process.argv[2] === '--runs'
    ? Number.parseInt(process.argv[3] ?? '', 10)
    : 1;
const activeContainers = new Set();

if (process.version !== 'v24.18.0') {
  throw new Error('Node.js 24.18.0 is required for adapter verification');
}
if (
  !Number.isInteger(requestedRuns) ||
  requestedRuns < 1 ||
  requestedRuns > 5
) {
  throw new Error(
    'usage: node scripts/test-owner-scoped-persistence-postgresql.mjs [--runs 1..5]',
  );
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
      `Docker adapter test operation failed: ${argumentsList[0] ?? 'unknown'}`,
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
    if (state === 'healthy') {
      return;
    }
    if (state === 'exited' || state === 'dead' || state === 'unhealthy') {
      throw new Error('ephemeral PostgreSQL did not become healthy');
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error('ephemeral PostgreSQL health check timed out');
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
    throw new Error('ephemeral PostgreSQL cleanup left a container');
  }
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

async function runFileOnce(file) {
  const suffix = randomBytes(6).toString('hex');
  const container = `srtaller_pbi023_adapters_${suffix}`;
  const database = `srtaller_adapters_${suffix}`;
  const user = 'srtaller_adapter_test';
  const password = `synthetic_${randomBytes(18).toString('hex')}`;
  let started = false;

  try {
    await docker(['pull', image]);
    const { stdout: runOutput } = await docker([
      'run',
      '--detach',
      '--name',
      container,
      '--label',
      `com.srtaller.pbi023.execution=${executionLabel}`,
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
      throw new Error('Docker did not return an ephemeral container ID');
    }
    started = true;
    activeContainers.add(container);
    await waitForHealthy(container);

    const { stdout: versionOutput } = await docker([
      'exec',
      container,
      'postgres',
      '--version',
    ]);
    if (!/postgres \(PostgreSQL\) 18\.4\b/u.test(versionOutput)) {
      throw new Error('ephemeral PostgreSQL version differs from 18.4');
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
      throw new Error('ephemeral PostgreSQL encoding differs from UTF8');
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
      throw new Error('ephemeral PostgreSQL timezone differs from UTC');
    }
    const { stdout: localeOutput } = await docker([
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
      'select datcollate from pg_database where datname = current_database()',
    ]);
    const { stdout: clientVersionOutput } = await docker([
      'exec',
      container,
      'psql',
      '--version',
    ]);

    const { stdout: portOutput } = await docker([
      'inspect',
      '--format',
      '{{(index (index .NetworkSettings.Ports "5432/tcp") 0).HostPort}}',
      container,
    ]);
    const port = portOutput.trim();
    if (!/^\d{1,5}$/u.test(port)) {
      throw new Error('Docker did not assign a loopback test port');
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
            SR_OWNER_SCOPED_PG_HOST: '127.0.0.1',
            SR_OWNER_SCOPED_PG_NAME: database,
            SR_OWNER_SCOPED_PG_PASSWORD: password,
            SR_OWNER_SCOPED_PG_PORT: port,
            SR_OWNER_SCOPED_PG_TEST: '1',
            SR_OWNER_SCOPED_PG_USER: user,
            SR_STATION_PG_HOST: '127.0.0.1',
            SR_STATION_PG_NAME: database,
            SR_STATION_PG_PASSWORD: password,
            SR_STATION_PG_PORT: port,
            SR_STATION_PG_TEST: '1',
            SR_STATION_PG_USER: user,
          },
          maxBuffer: 10 * 1024 * 1024,
          timeout: 150_000,
        },
      ));
    } catch (error) {
      process.stderr.write(
        `${createPostgresqlChildFailureMarker(error)}\n`,
      );
      throw new Error(
        `PostgreSQL adapter critical test failed: ${file} in ${container}/${database}`,
      );
    }
    const tests = assertPostgresqlTestSummary(testOutput);

    const { stdout: schemaOutput } = await docker([
      'exec',
      container,
      'pg_dump',
      '--schema-only',
      '--no-owner',
      '--no-privileges',
      '--username',
      user,
      '--dbname',
      database,
    ]);
    if (
      /\bCREATE TABLE\b/iu.test(schemaOutput) ||
      /tenants|branches|kysely_migration/iu.test(schemaOutput)
    ) {
      const retainedTables = [...schemaOutput.matchAll(
        /^CREATE TABLE public\."?([a-z0-9_]+)"?/gimu,
      )].map((match) => match[1]);
      throw new Error(
        `adapter verification retained database objects: ${file} in ${container}/${database}: ${retainedTables.join(',') || 'unidentified'}`,
      );
    }

    return Object.freeze({
      cleanup: 'PASS',
      file,
      environment: Object.freeze({
        clientVersion: clientVersionOutput.trim(),
        encoding: encodingOutput.trim(),
        locale: localeOutput.trim(),
        serverVersion: versionOutput.trim(),
        timezone: timezoneOutput.trim(),
      }),
      imageDigest,
      migration:
        '20260725183832_database_create_tenants_and_branches',
      node: '24.18.0',
      postgres: '18.4',
      scenarios: Object.freeze([
        'access-pin-authentication-lock-and-rate-limit',
        'access-pin-migration-up-down-reapply',
        'access-pin-provisioning-concurrency-and-idempotency',
        'access-pin-tenant-and-station-isolation',
        'access-pin-verifier-not-plaintext',
        'access-session-concurrency-and-replacement',
        'access-session-migration-up-down-reapply',
        'access-session-tenant-branch-station-isolation',
        'access-session-verifier-and-lifecycle-constraints',
        'contextual-authorization-fresh-revocation-and-no-effects',
        'contextual-authorization-operational-note',
        'contextual-authorization-repair-tenant-and-branch-isolation',
        'contextual-authorization-station-session-user-capability-chain',
        'access-assignment-concurrency-and-idempotency',
        'access-capability-and-role-catalog',
        'access-migration-up-down-reapply',
        'access-read-model-and-effective-capabilities',
        'access-tenant-and-branch-isolation',
        'access-transaction-rollback',
        'branch-create-find-exists-list',
        'concurrent-duplicate',
        'context-expiry',
        'cross-tenant-read',
        'duplicate-conflict',
        'migration-up-down',
        'nested-transaction-rejected',
        'rollback',
        'repair-constraints-and-migration-chain',
        'repair-idempotency-and-concurrency',
        'repair-literal-search-and-periods',
        'repair-scope-and-projections',
        'same-branch-id-across-tenants',
        'trusted-station-runtime-resolution-and-revocation',
        'tenant-create-find-exists',
        'tenant-foreign-key',
        'transaction-commit',
        'user-bootstrap-concurrency-and-idempotency',
        'user-create-concurrency-and-idempotency',
        'user-lifecycle-concurrency-and-idempotency',
        'user-migration-up-down-reapply',
        'user-tenant-isolation',
      ]),
      status: 'PASS',
      tests,
    });
  } finally {
    if (started) {
      await cleanupContainer(container);
    }
    await assertContainerAbsent(container);
  }
}

async function runOnce() {
  const fileResults = [];
  for (const file of ownerScopedPostgresqlTestFiles) {
    fileResults.push(await runFileOnce(file));
  }

  const { file: _file, tests: _tests, ...common } = fileResults[0];
  const tests = fileResults.reduce(
    (summary, result) => {
      for (const key of Object.keys(summary)) {
        summary[key] += result.tests[key];
      }
      return summary;
    },
    {
      tests: 0,
      pass: 0,
      fail: 0,
      cancelled: 0,
      skipped: 0,
      todo: 0,
    },
  );

  return Object.freeze({
    ...common,
    databaseIsolation: 'fresh database and container per test file',
    files: Object.freeze(fileResults.map((result) => result.file)),
    tests: Object.freeze(tests),
  });
}

const results = [];
for (let index = 0; index < requestedRuns; index += 1) {
  results.push(await runOnce());
}

const material = JSON.stringify(results[0]);
if (results.some((result) => JSON.stringify(result) !== material)) {
  throw new Error('PostgreSQL adapter verification runs differ materially');
}
const materialSha256 = createHash('sha256')
  .update(material)
  .digest('hex');
process.stdout.write(
  `${JSON.stringify(
    {
      cleanup: 'PASS',
      imageDigest,
      materialComparison: 'MATCH',
      materialSha256,
      node: '24.18.0',
      postgres: '18.4',
      runs: requestedRuns,
      status: 'PASS',
      suite: results[0],
    },
    null,
    2,
  )}\n`,
);
