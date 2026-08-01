import { execFile } from 'node:child_process';
import { createHash, randomBytes } from 'node:crypto';
import { promisify } from 'node:util';

import { assertPostgresqlTestSummary } from './lib/postgresql-test-output.mjs';

const execute = promisify(execFile);
const imageDigest =
  'sha256:d93de42662696f278fb34354b06fdaa90ad7ca3106d6f72fbd01d16da006d2cf';
const image = `postgres@${imageDigest}`;
const executionLabel = process.env.SR_PG_CI_EXECUTION_LABEL ?? 'standalone';
const requestedRuns = process.argv[2] === '--runs'
  ? Number.parseInt(process.argv[3] ?? '', 10)
  : 1;

if (process.version !== 'v24.18.0') {
  throw new Error('Node.js 24.18.0 is required for preview verification');
}
if (!Number.isInteger(requestedRuns) || requestedRuns < 1 || requestedRuns > 5) {
  throw new Error('usage: node scripts/test-preview-repair-postgresql.mjs [--runs 1..5]');
}

async function docker(argumentsList, options = {}) {
  try {
    return await execute('docker', argumentsList, {
      encoding: 'utf8',
      maxBuffer: 20 * 1024 * 1024,
      ...options,
    });
  } catch {
    throw new Error(`Docker preview test operation failed: ${argumentsList[0] ?? 'unknown'}`);
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
    if (stdout.trim() === 'healthy') return;
    if (['exited', 'dead', 'unhealthy'].includes(stdout.trim())) {
      throw new Error('ephemeral preview PostgreSQL did not become healthy');
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error('ephemeral preview PostgreSQL health check timed out');
}

async function assertContainerAbsent(container) {
  const { stdout } = await docker([
    'ps', '--all', '--filter', `name=^/${container}$`, '--format', '{{.Names}}',
  ]);
  if (stdout.trim() !== '') {
    throw new Error('preview suite left an ephemeral container');
  }
}

async function runOnce() {
  const suffix = randomBytes(6).toString('hex');
  const container = `srtaller_vs0_preview_${suffix}`;
  const database = `srtaller_preview_${suffix}`;
  const user = 'srtaller_preview_test';
  const password = `synthetic_${randomBytes(18).toString('hex')}`;
  let started = false;
  try {
    await docker(['pull', '--quiet', image], { timeout: 180_000 });
    const { stdout } = await docker([
      'run', '--detach', '--name', container,
      '--label', `com.srtaller.vs0.execution=${executionLabel}`,
      '--publish', '127.0.0.1::5432',
      '--tmpfs', '/var/lib/postgresql:rw,noexec,nosuid,size=256m',
      '--env', `POSTGRES_DB=${database}`,
      '--env', `POSTGRES_PASSWORD=${password}`,
      '--env', `POSTGRES_USER=${user}`,
      '--env', 'TZ=UTC',
      '--health-cmd', `pg_isready --username=${user} --dbname=${database}`,
      '--health-interval', '1s', '--health-timeout', '2s', '--health-retries', '30',
      image,
    ]);
    if (stdout.trim() === '') throw new Error('Docker did not return a preview container ID');
    started = true;
    await waitForHealthy(container);
    const { stdout: portOutput } = await docker([
      'inspect', '--format',
      '{{(index (index .NetworkSettings.Ports "5432/tcp") 0).HostPort}}',
      container,
    ]);
    const { stdout: testOutput } = await execute(
      process.execPath,
      ['--test', 'test/preview-repair-postgresql.test.mjs'],
      {
        encoding: 'utf8',
        env: {
          ...process.env,
          SR_PREVIEW_PG_HOST: '127.0.0.1',
          SR_PREVIEW_PG_NAME: database,
          SR_PREVIEW_PG_PASSWORD: password,
          SR_PREVIEW_PG_PORT: portOutput.trim(),
          SR_PREVIEW_PG_TEST: '1',
          SR_PREVIEW_PG_USER: user,
        },
        maxBuffer: 20 * 1024 * 1024,
        timeout: 150_000,
      },
    );
    const tests = assertPostgresqlTestSummary(testOutput);
    const { stdout: schemaOutput } = await docker([
      'exec', container, 'pg_dump', '--schema-only', '--no-owner', '--no-privileges',
      '--username', user, '--dbname', database,
    ]);
    return Object.freeze({
      cleanup: 'PASS',
      imageDigest,
      materialSha256: createHash('sha256').update(schemaOutput).digest('hex'),
      node: '24.18.0',
      postgres: '18.4',
      scenarios: Object.freeze([
        'preview-schema-migration',
        'tenant-branch-isolation',
        'create-and-history-atomicity',
        'status-revision-cas',
      ]),
      status: 'PASS',
      tests,
    });
  } finally {
    if (started) await docker(['rm', '--force', '--volumes', container]).catch(() => undefined);
    await assertContainerAbsent(container);
  }
}

const runs = [];
for (let index = 0; index < requestedRuns; index += 1) runs.push(await runOnce());
const material = JSON.stringify({ ...runs[0], materialSha256: '<environment-specific-schema-hash>' });
for (const run of runs.slice(1)) {
  if (JSON.stringify({ ...run, materialSha256: '<environment-specific-schema-hash>' }) !== material) {
    throw new Error('preview PostgreSQL runs are not semantically equivalent');
  }
}
process.stdout.write(`${JSON.stringify({
  cleanup: 'PASS',
  imageDigest,
  materialComparison: 'MATCH',
  materialSha256: createHash('sha256').update(material).digest('hex'),
  node: '24.18.0',
  postgres: '18.4',
  runs: requestedRuns,
  status: 'PASS',
  suite: runs[0],
}, null, 2)}\n`);
