import { execFile } from 'node:child_process';
import { createHash, randomBytes } from 'node:crypto';
import { promisify } from 'node:util';

const execute = promisify(execFile);
const imageDigest =
  'sha256:d93de42662696f278fb34354b06fdaa90ad7ca3106d6f72fbd01d16da006d2cf';
const image = `postgres@${imageDigest}`;
const requestedRuns =
  process.argv[2] === '--runs'
    ? Number.parseInt(process.argv[3] ?? '', 10)
    : 1;

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

async function runOnce() {
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

    await execute(
      process.execPath,
      ['--test', 'test/owner-scoped-persistence-postgresql.test.mjs'],
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
        },
        maxBuffer: 10 * 1024 * 1024,
        timeout: 150_000,
      },
    );

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
      throw new Error('adapter verification retained database objects');
    }

    return Object.freeze({
      cleanup: 'PASS',
      imageDigest,
      migration:
        '20260725183832_database_create_tenants_and_branches',
      node: '24.18.0',
      postgres: '18.4',
      scenarios: Object.freeze([
        'branch-create-find-exists-list',
        'concurrent-duplicate',
        'context-expiry',
        'cross-tenant-read',
        'duplicate-conflict',
        'migration-up-down',
        'nested-transaction-rejected',
        'rollback',
        'same-branch-id-across-tenants',
        'tenant-create-find-exists',
        'tenant-foreign-key',
        'transaction-commit',
      ]),
      status: 'PASS',
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
    },
    null,
    2,
  )}\n`,
);
