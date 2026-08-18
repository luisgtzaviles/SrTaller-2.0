import assert from 'node:assert/strict';
import { execFile, spawn } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { once } from 'node:events';
import { promisify } from 'node:util';

const execute = promisify(execFile);
const image =
  'postgres@sha256:d93de42662696f278fb34354b06fdaa90ad7ca3106d6f72fbd01d16da006d2cf';

async function docker(argumentsList, options = {}) {
  try {
    return await execute('docker', argumentsList, {
      encoding: 'utf8',
      maxBuffer: 10 * 1024 * 1024,
      ...options,
    });
  } catch {
    throw new Error(`Preview PostgreSQL test failed: ${argumentsList[0] ?? 'docker'}`);
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
    await new Promise((resolve) => setTimeout(resolve, 400));
  }
  throw new Error('Preview PostgreSQL test failed: health timeout');
}

function databaseEnvironment({
  database,
  password,
  port,
  role,
  user,
}) {
  return {
    SR_DB_ENVIRONMENT: 'development',
    SR_DB_HOST: '127.0.0.1',
    SR_DB_PORT: port,
    SR_DB_NAME: database,
    SR_DB_USER: user,
    SR_DB_PASSWORD: password,
    SR_DB_SSL_MODE: 'disable',
    SR_DB_POOL_MIN: '0',
    SR_DB_POOL_MAX: '3',
    SR_DB_IDLE_TIMEOUT_MS: '1000',
    SR_DB_CONNECTION_TIMEOUT_MS: '1000',
    SR_DB_STATEMENT_TIMEOUT_MS: '1000',
    SR_DB_QUERY_TIMEOUT_MS: '1000',
    SR_DB_APPLICATION_NAME:
      role === 'migration'
        ? 'srtaller-preview-migrator-test'
        : 'srtaller-preview-runtime-test',
    SR_DB_ROLE: role,
    SR_DB_ACCESS_MODE: 'read-write',
    SR_DB_MIGRATIONS_ENABLED: role === 'migration' ? 'true' : 'false',
  };
}

async function runEntrypoint(file, environment) {
  try {
    const result = await execute(
      process.execPath,
      ['--enable-source-maps', file],
      {
        encoding: 'utf8',
        env: environment,
        timeout: 30_000,
      },
    );
    return { code: 0, stderr: result.stderr, stdout: result.stdout };
  } catch (error) {
    return {
      code: typeof error.code === 'number' ? error.code : 1,
      stderr: String(error.stderr ?? ''),
      stdout: String(error.stdout ?? ''),
    };
  }
}

async function waitForApplication(child, stdout, port) {
  const deadline = Date.now() + 20_000;
  while (Date.now() < deadline) {
    if (child.exitCode !== null || child.signalCode !== null) {
      throw new Error('Preview PostgreSQL test failed: app exited before ready');
    }
    if (stdout.value.includes('technical_shell_listening')) {
      try {
        const response = await fetch(`http://127.0.0.1:${port}/readyz`, {
          signal: AbortSignal.timeout(1_500),
        });
        if (response.status === 200) return;
      } catch {}
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error('Preview PostgreSQL test failed: app readiness timeout');
}

async function stopApplication(child) {
  if (child.exitCode !== null || child.signalCode !== null) return;
  child.kill('SIGTERM');
  const [code, signal] = await once(child, 'exit');
  assert.equal(signal, null);
  assert.equal(code, 0);
}

const suffix = randomBytes(6).toString('hex');
const container = `srtaller_preview_runtime_${suffix}`;
const database = `srtaller_preview_${suffix}`;
const user = 'srtaller_preview_test';
const password = `synthetic_${randomBytes(24).toString('hex')}`;
let application = null;
let paused = false;

try {
  await docker(['pull', '--quiet', image], { timeout: 180_000 });
  await docker([
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
  await waitForHealthy(container);
  const { stdout: portOutput } = await docker([
    'inspect',
    '--format',
    '{{(index (index .NetworkSettings.Ports "5432/tcp") 0).HostPort}}',
    container,
  ]);
  const port = portOutput.trim();
  assert.match(port, /^\d{1,5}$/u);

  const technicalEnvironment = {
    ...process.env,
    HOST: '127.0.0.1',
    NODE_ENV: 'production',
    PORT: '31991',
  };
  const applicationEnvironment = {
    ...technicalEnvironment,
    ...databaseEnvironment({ database, password, port, role: 'application', user }),
  };
  const migrationEnvironment = {
    ...technicalEnvironment,
    ...databaseEnvironment({ database, password, port, role: 'migration', user }),
  };

  const unmigrated = await runEntrypoint('dist/main.js', applicationEnvironment);
  assert.notEqual(unmigrated.code, 0);
  assert.match(unmigrated.stderr, /DATABASE_RUNTIME_SCHEMA_NOT_READY/u);
  assert.doesNotMatch(unmigrated.stderr, new RegExp(password, 'u'));

  const invalidPassword = await runEntrypoint('dist/main.js', {
    ...applicationEnvironment,
    SR_DB_PASSWORD: 'synthetic_invalid_password',
  });
  assert.notEqual(invalidPassword.code, 0);
  assert.match(invalidPassword.stderr, /DATABASE_RUNTIME_INITIALIZATION_FAILED/u);
  assert.doesNotMatch(invalidPassword.stderr, /synthetic_invalid_password/u);

  const firstMigration = await runEntrypoint('dist/db-migrate.js', migrationEnvironment);
  assert.equal(firstMigration.code, 0);
  assert.doesNotMatch(firstMigration.stdout + firstMigration.stderr, new RegExp(password, 'u'));
  const firstResult = JSON.parse(firstMigration.stdout.trim());
  assert.equal(firstResult.event, 'database_migration_complete');
  assert.equal(firstResult.applied, 1);
  assert.equal(firstResult.pending, 0);

  const secondMigration = await runEntrypoint('dist/db-migrate.js', migrationEnvironment);
  assert.equal(secondMigration.code, 0);
  const secondResult = JSON.parse(secondMigration.stdout.trim());
  assert.equal(secondResult.applied, 0);
  assert.equal(secondResult.pending, 0);
  assert.equal(secondResult.manifestHash, firstResult.manifestHash);

  const stdout = { value: '' };
  const stderr = { value: '' };
  application = spawn(
    process.execPath,
    ['--enable-source-maps', 'dist/main.js'],
    { env: applicationEnvironment, stdio: ['ignore', 'pipe', 'pipe'] },
  );
  application.stdout.setEncoding('utf8');
  application.stderr.setEncoding('utf8');
  application.stdout.on('data', (chunk) => {
    stdout.value += chunk;
  });
  application.stderr.on('data', (chunk) => {
    stderr.value += chunk;
  });
  await waitForApplication(application, stdout, 31991);

  const root = await fetch('http://127.0.0.1:31991/');
  const live = await fetch('http://127.0.0.1:31991/livez');
  const ready = await fetch('http://127.0.0.1:31991/readyz');
  assert.equal(root.status, 200);
  assert.equal(live.status, 200);
  assert.equal(ready.status, 200);

  await docker(['pause', container]);
  paused = true;
  const unavailable = await fetch('http://127.0.0.1:31991/readyz', {
    signal: AbortSignal.timeout(5_000),
  });
  assert.equal(unavailable.status, 503);
  const liveWhileUnavailable = await fetch('http://127.0.0.1:31991/livez');
  assert.equal(liveWhileUnavailable.status, 200);
  await docker(['unpause', container]);
  paused = false;

  let recovered = false;
  for (let attempt = 0; attempt < 30; attempt += 1) {
    const response = await fetch('http://127.0.0.1:31991/readyz');
    if (response.status === 200) {
      recovered = true;
      break;
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  assert.equal(recovered, true);

  await stopApplication(application);
  application = null;
  assert.doesNotMatch(stderr.value, new RegExp(password, 'u'));

  const { stdout: schemaState } = await docker([
    'exec',
    container,
    'psql',
    '--username',
    user,
    '--dbname',
    database,
    '--tuples-only',
    '--no-align',
    '--command',
    "select (select count(*) from tenants), (select count(*) from branches), (select count(*) from kysely_migration);",
  ]);
  assert.equal(schemaState.trim(), '0|0|1');
  const { stdout: activeConnections } = await docker([
    'exec',
    container,
    'psql',
    '--username',
    user,
    '--dbname',
    database,
    '--tuples-only',
    '--no-align',
    '--command',
    "select count(*) from pg_stat_activity where application_name = 'srtaller-preview-runtime-test';",
  ]);
  assert.equal(activeConnections.trim(), '0');

  process.stdout.write(
    `${JSON.stringify({
      status: 'PASS',
      postgres: '18.4',
      migration: { firstApplied: 1, secondApplied: 0, pending: 0 },
      readiness: { available: 200, unavailable: 503, recovered: 200 },
      livenessWhileDatabaseUnavailable: 200,
      shutdownPoolConnections: 0,
      data: { tenants: 0, branches: 0, journal: 1 },
      secretsExposed: false,
      cleanup: 'PASS',
    })}\n`,
  );
} finally {
  await stopApplication(application).catch(() => undefined);
  if (paused) await docker(['unpause', container]).catch(() => undefined);
  await docker(['rm', '--force', container]).catch(() => undefined);
}
