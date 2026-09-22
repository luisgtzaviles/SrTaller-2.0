import { execFile } from 'node:child_process';
import { createHash, randomBytes } from 'node:crypto';
import { promisify } from 'node:util';

import {
  assertPostgresqlTestSummary,
  createPostgresqlChildFailureMarker,
  createPostgresqlHarnessFailureMarker,
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
const activeContainers = new Map();
const scenarios = Object.freeze([
  'access-pin-authentication-lock-and-rate-limit',
  'access-pin-migration-up-down-reapply',
  'access-pin-provisioning-concurrency-and-idempotency',
  'access-pin-tenant-and-station-isolation',
  'access-pin-verifier-not-plaintext',
  'access-session-independent-concurrency-and-exact-switch',
  'access-session-migration-existing-guarded-down-reapply',
  'access-session-scoped-revocation-and-expiration',
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
]);

async function measure(timings, phase, operation) {
  const startedAt = Date.now();
  try {
    return await operation();
  } finally {
    timings[phase] += Date.now() - startedAt;
  }
}

const dockerOperationByCommand = Object.freeze({
  exec: 'owner-scoped-adapters-docker-exec',
  inspect: 'owner-scoped-adapters-docker-inspect',
  ps: 'owner-scoped-adapters-docker-list',
  pull: 'owner-scoped-adapters-docker-pull',
  rm: 'owner-scoped-adapters-docker-remove',
  run: 'owner-scoped-adapters-docker-run',
});

class OwnerScopedPostgresqlHarnessError extends Error {
  constructor(operation, testFile, cause) {
    super(`Owner-scoped PostgreSQL harness operation failed: ${operation}`);
    this.marker = createPostgresqlHarnessFailureMarker(
      operation,
      testFile,
      cause,
    );
  }
}

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

async function docker(argumentsList, testFile, options = {}) {
  try {
    return await execute('docker', argumentsList, {
      encoding: 'utf8',
      maxBuffer: 10 * 1024 * 1024,
      ...options,
    });
  } catch (error) {
    const operation = dockerOperationByCommand[argumentsList[0]];
    if (operation === undefined) {
      throw new Error(
        'Owner-scoped PostgreSQL used an ungoverned Docker operation',
      );
    }
    throw new OwnerScopedPostgresqlHarnessError(
      operation,
      testFile,
      error,
    );
  }
}

async function waitForHealthy(container, testFile) {
  const deadline = Date.now() + 60_000;
  while (Date.now() < deadline) {
    const { stdout } = await docker(
      [
        'inspect',
        '--format',
        '{{if .State.Health}}{{.State.Health.Status}}{{else}}{{.State.Status}}{{end}}',
        container,
      ],
      testFile,
    );
    const state = stdout.trim();
    if (state === 'healthy') return;
    if (state === 'exited' || state === 'dead' || state === 'unhealthy') {
      throw new Error('ephemeral PostgreSQL did not become healthy');
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error('ephemeral PostgreSQL health check timed out');
}

async function assertContainerAbsent(container, testFile) {
  const { stdout } = await docker(
    [
      'ps',
      '--all',
      '--filter',
      `name=^/${container}$`,
      '--format',
      '{{.Names}}',
    ],
    testFile,
  );
  if (stdout.trim() !== '') {
    throw new Error('ephemeral PostgreSQL cleanup left a container');
  }
}

async function cleanupContainer(container, testFile) {
  if (!activeContainers.has(container)) return;
  await docker(['rm', '--force', container], testFile);
  activeContainers.delete(container);
  await assertContainerAbsent(container, testFile);
}

async function cleanupAfterSignal(signal) {
  try {
    for (const [container, testFile] of activeContainers) {
      await cleanupContainer(container, testFile);
    }
  } finally {
    process.exit(signal === 'SIGINT' ? 130 : 143);
  }
}

process.once('SIGINT', () => void cleanupAfterSignal('SIGINT'));
process.once('SIGTERM', () => void cleanupAfterSignal('SIGTERM'));

function assertDatabaseName(database) {
  if (!/^[a-z][a-z0-9_]+$/u.test(database)) {
    throw new Error('Owner-scoped PostgreSQL generated an invalid database name');
  }
  return database;
}

async function createDatabase(campaign, file, database) {
  assertDatabaseName(database);
  await docker([
    'exec',
    campaign.container,
    'createdb',
    '--username',
    campaign.user,
    database,
  ], file);
}

async function assertDatabaseAbsent(campaign, file, database) {
  assertDatabaseName(database);
  const { stdout } = await docker([
    'exec',
    campaign.container,
    'psql',
    '--tuples-only',
    '--no-align',
    '--username',
    campaign.user,
    '--dbname',
    campaign.controlDatabase,
    '--command',
    `select count(*) from pg_database where datname = '${database}'`,
  ], file);
  if (stdout.trim() !== '0') {
    throw new Error(`owner-scoped cleanup retained database: ${database}`);
  }
}

async function dropDatabase(campaign, file, database) {
  assertDatabaseName(database);
  await docker([
    'exec',
    campaign.container,
    'dropdb',
    '--force',
    '--if-exists',
    '--username',
    campaign.user,
    database,
  ], file);
  await assertDatabaseAbsent(campaign, file, database);
}

async function startCampaign() {
  const suffix = randomBytes(6).toString('hex');
  const container = `srtaller_pbi023_adapters_${suffix}`;
  const controlDatabase = `srtaller_adapters_control_${suffix}`;
  const user = 'srtaller_adapter_test';
  const password = `synthetic_${randomBytes(18).toString('hex')}`;
  const file = ownerScopedPostgresqlTestFiles[0];
  const timings = {
    cleanupMs: 0,
    containerStartMs: 0,
    environmentProbeMs: 0,
    readinessMs: 0,
  };
  let started = false;

  try {
    const { stdout: runOutput } = await measure(
      timings,
      'containerStartMs',
      () => docker([
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
        `POSTGRES_DB=${controlDatabase}`,
        '--env',
        `POSTGRES_PASSWORD=${password}`,
        '--env',
        `POSTGRES_USER=${user}`,
        '--env',
        'TZ=UTC',
        '--health-cmd',
        `pg_isready --username=${user} --dbname=${controlDatabase}`,
        '--health-interval',
        '1s',
        '--health-timeout',
        '2s',
        '--health-retries',
        '30',
        image,
      ], file),
    );
    if (runOutput.trim() === '') {
      throw new Error('Docker did not return an ephemeral container ID');
    }
    started = true;
    activeContainers.set(container, file);
    await measure(timings, 'readinessMs', () =>
      waitForHealthy(container, file),
    );

    const environment = await measure(
      timings,
      'environmentProbeMs',
      async () => {
        const { stdout: versionOutput } = await docker([
          'exec', container, 'postgres', '--version',
        ], file);
        const { stdout: encodingOutput } = await docker([
          'exec', container, 'psql', '--tuples-only', '--no-align',
          '--username', user, '--dbname', controlDatabase,
          '--command', 'show server_encoding',
        ], file);
        const { stdout: timezoneOutput } = await docker([
          'exec', container, 'psql', '--tuples-only', '--no-align',
          '--username', user, '--dbname', controlDatabase,
          '--command', 'show TimeZone',
        ], file);
        const { stdout: localeOutput } = await docker([
          'exec', container, 'psql', '--tuples-only', '--no-align',
          '--username', user, '--dbname', controlDatabase,
          '--command',
          'select datcollate from pg_database where datname = current_database()',
        ], file);
        const { stdout: clientVersionOutput } = await docker([
          'exec', container, 'psql', '--version',
        ], file);
        const { stdout: portOutput } = await docker([
          'inspect',
          '--format',
          '{{(index (index .NetworkSettings.Ports "5432/tcp") 0).HostPort}}',
          container,
        ], file);
        return {
          clientVersionOutput,
          encodingOutput,
          localeOutput,
          portOutput,
          timezoneOutput,
          versionOutput,
        };
      },
    );
    if (!/postgres \(PostgreSQL\) 18\.4\b/u.test(environment.versionOutput)) {
      throw new Error('ephemeral PostgreSQL version differs from 18.4');
    }
    if (environment.encodingOutput.trim() !== 'UTF8') {
      throw new Error('ephemeral PostgreSQL encoding differs from UTF8');
    }
    if (environment.timezoneOutput.trim() !== 'UTC') {
      throw new Error('ephemeral PostgreSQL timezone differs from UTC');
    }
    const port = environment.portOutput.trim();
    if (!/^\d{1,5}$/u.test(port)) {
      throw new Error('Docker did not assign a loopback test port');
    }

    return {
      container,
      controlDatabase,
      environment: Object.freeze({
        clientVersion: environment.clientVersionOutput.trim(),
        encoding: environment.encodingOutput.trim(),
        locale: environment.localeOutput.trim(),
        serverVersion: environment.versionOutput.trim(),
        timezone: environment.timezoneOutput.trim(),
      }),
      password,
      port,
      timings,
      user,
    };
  } catch (error) {
    if (started) {
      await measure(timings, 'cleanupMs', () =>
        cleanupContainer(container, file),
      );
    }
    throw error;
  }
}

async function runFileOnce(file, campaign) {
  const startedAt = Date.now();
  const database = `srtaller_adapters_${randomBytes(6).toString('hex')}`;
  const timings = {
    databaseCreateMs: 0,
    databaseDropMs: 0,
    schemaCheckMs: 0,
    testProcessMs: 0,
  };
  let result;

  try {
    await measure(timings, 'databaseCreateMs', () =>
      createDatabase(campaign, file, database),
    );
    let testOutput;
    try {
      ({ stdout: testOutput } = await measure(
        timings,
        'testProcessMs',
        () => execute(
          process.execPath,
          ['--no-maglev', '--test', '--test-concurrency=1', file],
          {
            encoding: 'utf8',
            env: {
              ...process.env,
              SR_OWNER_SCOPED_PG_HOST: '127.0.0.1',
              SR_OWNER_SCOPED_PG_NAME: database,
              SR_OWNER_SCOPED_PG_PASSWORD: campaign.password,
              SR_OWNER_SCOPED_PG_PORT: campaign.port,
              SR_OWNER_SCOPED_PG_TEST: '1',
              SR_OWNER_SCOPED_PG_USER: campaign.user,
              SR_STATION_PG_HOST: '127.0.0.1',
              SR_STATION_PG_NAME: database,
              SR_STATION_PG_PASSWORD: campaign.password,
              SR_STATION_PG_PORT: campaign.port,
              SR_STATION_PG_TEST: '1',
              SR_STATION_PG_USER: campaign.user,
            },
            maxBuffer: 10 * 1024 * 1024,
            timeout: 150_000,
          },
        ),
      ));
    } catch (error) {
      process.stderr.write(`${createPostgresqlChildFailureMarker(error)}\n`);
      throw new Error(
        `PostgreSQL adapter critical test failed: ${file} in ${campaign.container}/${database}`,
      );
    }
    const tests = assertPostgresqlTestSummary(testOutput);

    const { stdout: schemaOutput } = await measure(
      timings,
      'schemaCheckMs',
      () => docker([
        'exec',
        campaign.container,
        'pg_dump',
        '--schema-only',
        '--no-owner',
        '--no-privileges',
        '--username',
        campaign.user,
        '--dbname',
        database,
      ], file),
    );
    if (
      /\bCREATE TABLE\b/iu.test(schemaOutput) ||
      /tenants|branches|kysely_migration/iu.test(schemaOutput)
    ) {
      const retainedTables = [...schemaOutput.matchAll(
        /^CREATE TABLE public\."?([a-z0-9_]+)"?/gimu,
      )].map((match) => match[1]);
      throw new Error(
        `adapter verification retained database objects: ${file} in ${campaign.container}/${database}: ${retainedTables.join(',') || 'unidentified'}`,
      );
    }

    result = Object.freeze({
      cleanup: 'PASS',
      environment: campaign.environment,
      file,
      imageDigest,
      migration: '20260725183832_database_create_tenants_and_branches',
      node: '24.18.0',
      postgres: '18.4',
      scenarios,
      status: 'PASS',
      tests,
    });
  } finally {
    await measure(timings, 'databaseDropMs', () =>
      dropDatabase(campaign, file, database),
    );
  }

  return Object.freeze({
    result,
    timing: Object.freeze({
      file,
      ...timings,
      totalMs: Date.now() - startedAt,
    }),
  });
}

async function runOnce(campaign, runIndex) {
  const startedAt = Date.now();
  const executions = new Array(ownerScopedPostgresqlTestFiles.length);
  const executionOrder = runIndex % 2 === 0
    ? [...ownerScopedPostgresqlTestFiles]
    : [...ownerScopedPostgresqlTestFiles].reverse();

  for (const file of executionOrder) {
    const index = ownerScopedPostgresqlTestFiles.indexOf(file);
    executions[index] = await runFileOnce(file, campaign);
  }

  const fileResults = executions.map(({ result }) => result);
  const fileTimings = executions.map(({ timing }) => timing);
  const { file: _file, tests: _tests, ...common } = fileResults[0];
  const tests = fileResults.reduce(
    (summary, fileResult) => {
      for (const key of Object.keys(summary)) {
        summary[key] += fileResult.tests[key];
      }
      return summary;
    },
    { tests: 0, pass: 0, fail: 0, cancelled: 0, skipped: 0, todo: 0 },
  );

  return Object.freeze({
    diagnostics: Object.freeze({
      executionMode: 'serial-fresh-database',
      executionOrder: Object.freeze(executionOrder),
      fileTimings: Object.freeze(fileTimings),
      summedSuiteMs: fileTimings.reduce(
        (total, timing) => total + timing.totalMs,
        0,
      ),
      totalMs: Date.now() - startedAt,
    }),
    material: Object.freeze({
      ...common,
      databaseIsolation:
        'fresh database per test file within one governed campaign container',
      files: Object.freeze(fileResults.map((fileResult) => fileResult.file)),
      tests: Object.freeze(tests),
    }),
  });
}

async function main() {
  const results = [];
  const campaignTimings = {
    cleanupMs: 0,
    containerStartMs: 0,
    environmentProbeMs: 0,
    imagePullMs: 0,
    readinessMs: 0,
  };
  await measure(campaignTimings, 'imagePullMs', () =>
    docker(['pull', image], ownerScopedPostgresqlTestFiles[0]),
  );
  const campaign = await startCampaign();
  Object.assign(campaignTimings, {
    containerStartMs: campaign.timings.containerStartMs,
    environmentProbeMs: campaign.timings.environmentProbeMs,
    readinessMs: campaign.timings.readinessMs,
  });
  try {
    for (let index = 0; index < requestedRuns; index += 1) {
      results.push(await runOnce(campaign, index));
    }
  } finally {
    await measure(campaignTimings, 'cleanupMs', () =>
      cleanupContainer(campaign.container, ownerScopedPostgresqlTestFiles[0]),
    );
  }

  const material = JSON.stringify(results[0].material);
  if (
    results.some(
      (result) => JSON.stringify(result.material) !== material,
    )
  ) {
    throw new Error('PostgreSQL adapter verification runs differ materially');
  }
  const materialSha256 = createHash('sha256')
    .update(material)
    .digest('hex');
  process.stdout.write(
    `${JSON.stringify(
      {
        cleanup: 'PASS',
        diagnostics: Object.freeze({
          ...campaignTimings,
          containerCount: 1,
          executionMode: 'serial-fresh-database',
          runs: Object.freeze(
            results.map((result) => result.diagnostics),
          ),
        }),
        imageDigest,
        materialComparison: 'MATCH',
        materialSha256,
        node: '24.18.0',
        postgres: '18.4',
        runs: requestedRuns,
        status: 'PASS',
        suite: results[0].material,
      },
      null,
      2,
    )}\n`,
  );
}

try {
  await main();
} catch (error) {
  if (error instanceof OwnerScopedPostgresqlHarnessError) {
    process.stderr.write(`${error.marker}\n`);
  }
  throw error;
}
