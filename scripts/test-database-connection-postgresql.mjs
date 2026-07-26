import { execFile } from 'node:child_process';
import { createHash, randomBytes } from 'node:crypto';
import { promisify } from 'node:util';

import { assertPostgresqlTestSummary } from './lib/postgresql-test-output.mjs';

const execute = promisify(execFile);
const imageDigest =
  'sha256:d93de42662696f278fb34354b06fdaa90ad7ca3106d6f72fbd01d16da006d2cf';
const image = `postgres@${imageDigest}`;
const executionLabel =
  process.env.SR_PG_CI_EXECUTION_LABEL ?? 'standalone';
const requestedRuns =
  process.argv[2] === '--runs' ? Number.parseInt(process.argv[3] ?? '', 10) : 1;

if (!Number.isInteger(requestedRuns) || requestedRuns < 1 || requestedRuns > 5) {
  throw new Error('usage: node scripts/test-database-connection-postgresql.mjs [--runs 1..5]');
}

async function docker(argumentsList, options = {}) {
  try {
    return await execute('docker', argumentsList, {
      encoding: 'utf8',
      maxBuffer: 10 * 1024 * 1024,
      ...options,
    });
  } catch {
    throw new Error(`Docker test operation failed: ${argumentsList[0] ?? 'unknown'}`);
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

async function runOnce() {
  const suffix = randomBytes(6).toString('hex');
  const runId = `connection_${suffix}`;
  const container = `srtaller_pbi023_connection_${suffix}`;
  const database = `srtaller_test_${runId}`;
  const user = 'srtaller_connection_test';
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

    const testEnvironment = {
      ...process.env,
      SR_CONNECTION_PG_CONTAINER: container,
      SR_CONNECTION_PG_TEST: '1',
      SR_DB_ENVIRONMENT: 'test',
      SR_TEST_DB_ACCESS_MODE: 'read-write',
      SR_TEST_DB_APPLICATION_NAME: 'srtaller-pbi023-postgresql',
      SR_TEST_DB_CONNECTION_TIMEOUT_MS: '2000',
      SR_TEST_DB_HOST: '127.0.0.1',
      SR_TEST_DB_IDLE_TIMEOUT_MS: '1000',
      SR_TEST_DB_MIGRATIONS_ENABLED: 'false',
      SR_TEST_DB_NAME: database,
      SR_TEST_DB_PASSWORD: password,
      SR_TEST_DB_POOL_MAX: '2',
      SR_TEST_DB_POOL_MIN: '0',
      SR_TEST_DB_PORT: port,
      SR_TEST_DB_QUERY_TIMEOUT_MS: '2000',
      SR_TEST_DB_ROLE: 'test',
      SR_TEST_DB_RUN_ID: runId,
      SR_TEST_DB_SSL_MODE: 'disable',
      SR_TEST_DB_STATEMENT_TIMEOUT_MS: '2000',
      SR_TEST_DB_USER: user,
    };
    const { stdout: testOutput } = await execute(
      process.execPath,
      ['--test', 'test/database-connection-postgresql.test.mjs'],
      {
        encoding: 'utf8',
        env: testEnvironment,
        maxBuffer: 10 * 1024 * 1024,
        timeout: 60_000,
      },
    );
    const tests = assertPostgresqlTestSummary(testOutput, {
      minimumTests: 6,
    });

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
      /_kysely_migration/iu.test(schemaOutput)
    ) {
      throw new Error('connection verification unexpectedly created database objects');
    }

    return Object.freeze({
      cleanup: 'PASS',
      databaseObjects: 'NONE',
      imageDigest,
      postgres: '18.4',
      scenarios: Object.freeze([
        'authentication',
        'close',
        'concurrency',
        'database-not-found',
        'pool-release',
        'select-1',
        'ssl',
        'timeout',
      ]),
      status: 'PASS',
      tests,
    });
  } finally {
    if (started) {
      await docker(['rm', '--force', container]).catch(() => undefined);
    }
    await assertContainerAbsent(container);
  }
}

const results = [];
for (let index = 0; index < requestedRuns; index += 1) {
  results.push(await runOnce());
}

const material = JSON.stringify(results[0]);
if (results.some((result) => JSON.stringify(result) !== material)) {
  throw new Error('PostgreSQL connection verification runs differ materially');
}
const materialSha256 = createHash('sha256').update(material).digest('hex');
process.stdout.write(
  `${JSON.stringify(
    {
      cleanup: 'PASS',
      imageDigest,
      materialComparison: 'MATCH',
      materialSha256,
      postgres: '18.4',
      runs: requestedRuns,
      status: 'PASS',
      suite: results[0],
    },
    null,
    2,
  )}\n`,
);
