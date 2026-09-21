import { execFile } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { promisify } from 'node:util';

import { postgresqlImage, postgresqlImageDigest } from './postgresql-ci-evidence.mjs';
import { runStreamingCommand } from './process-runner.mjs';

const execute = promisify(execFile);
const smokeLabel = 'com.srtaller.full-verification.smoke';
const inheritedEnvironmentDenylist = new Set([
  'DATABASE_URL',
  'PGDATABASE',
  'PGHOST',
  'PGPASSWORD',
  'PGPORT',
  'PGUSER',
  'SR_DATABASE_URL',
  'SR_DB_URL',
  'SR_LOCAL_RUNTIME',
  'SR_PIN_PEPPER',
  'SR_ADMIN_PASSWORD_PEPPER',
  'SR_SESSION_SIGNING_KEY',
  'SR_STATION_BOOTSTRAP_SECRET',
  'SR_TEST_DATABASE_URL',
  'SR_TEST_DB_URL',
  'SR_USER_BOOTSTRAP_SECRET',
]);

function controlledProcessEnvironment(environment) {
  return Object.fromEntries(
    Object.entries(environment).filter(([name]) =>
      !inheritedEnvironmentDenylist.has(name) &&
      !name.startsWith('SR_DB_') &&
      !name.startsWith('SR_TEST_DB_'),
    ),
  );
}

function safeCampaignLabel(campaignId) {
  const value = campaignId.replace(/[^A-Za-z0-9_.-]/gu, '-').slice(0, 63);
  if (!value) throw new Error('Full Verification campaign label is empty');
  return value;
}

async function defaultDocker(argumentsList) {
  try {
    return await execute('docker', argumentsList, {
      encoding: 'utf8',
      maxBuffer: 10 * 1024 * 1024,
    });
  } catch {
    throw new Error(
      `Full Verification Docker operation failed: ${argumentsList[0] ?? 'unknown'}`,
    );
  }
}

async function waitForHealthy(docker, container) {
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
    if (['dead', 'exited', 'unhealthy'].includes(state)) {
      throw new Error(`Full Verification smoke PostgreSQL became ${state}`);
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error('Full Verification smoke PostgreSQL health timeout');
}

function databaseEnvironment({ database, password, port, role, user }) {
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
    SR_DB_CONNECTION_TIMEOUT_MS: '2000',
    SR_DB_STATEMENT_TIMEOUT_MS: '2000',
    SR_DB_QUERY_TIMEOUT_MS: '2000',
    SR_DB_APPLICATION_NAME:
      role === 'migration'
        ? 'srtaller-full-verification-smoke-migrator'
        : 'srtaller-full-verification-smoke-runtime',
    SR_DB_ROLE: role,
    SR_DB_ACCESS_MODE: 'read-write',
    SR_DB_MIGRATIONS_ENABLED: role === 'migration' ? 'true' : 'false',
  };
}

export function createFullVerificationSmokeHarness({
  campaignId,
  docker = defaultDocker,
  environment = process.env,
  runCommand = runStreamingCommand,
} = {}) {
  const label = safeCampaignLabel(campaignId ?? 'local-full-verification');
  const suffix = randomBytes(6).toString('hex');
  const container = `srtaller_full_verify_smoke_${suffix}`;
  const database = `srtaller_full_verify_${suffix}`;
  const user = 'srtaller_full_verify';
  const password = `synthetic_${randomBytes(24).toString('hex')}`;
  let started = false;
  let port = null;
  let migration = null;

  const publicContext = () => Object.freeze({
    container,
    database,
    imageDigest: postgresqlImageDigest,
    label,
    port,
  });

  async function provision() {
    await docker(['pull', '--quiet', postgresqlImage]);
    const { stdout } = await docker([
      'run',
      '--detach',
      '--name', container,
      '--label', `${smokeLabel}=${label}`,
      '--publish', '127.0.0.1::5432',
      '--tmpfs', '/var/lib/postgresql:rw,noexec,nosuid,size=256m',
      '--env', `POSTGRES_DB=${database}`,
      '--env', `POSTGRES_PASSWORD=${password}`,
      '--env', `POSTGRES_USER=${user}`,
      '--env', 'TZ=UTC',
      '--health-cmd', `pg_isready --username=${user} --dbname=${database}`,
      '--health-interval', '1s',
      '--health-timeout', '2s',
      '--health-retries', '30',
      postgresqlImage,
    ]);
    if (!stdout.trim()) throw new Error('Full Verification smoke PostgreSQL did not start');
    started = true;
    await waitForHealthy(docker, container);
    const [{ stdout: version }, { stdout: portOutput }] = await Promise.all([
      docker(['exec', container, 'postgres', '--version']),
      docker([
        'inspect',
        '--format',
        '{{(index (index .NetworkSettings.Ports "5432/tcp") 0).HostPort}}',
        container,
      ]),
    ]);
    if (!/postgres \(PostgreSQL\) 18\.4\b/u.test(version)) {
      throw new Error('Full Verification smoke PostgreSQL version differs from 18.4');
    }
    port = portOutput.trim();
    if (!/^\d{1,5}$/u.test(port)) {
      throw new Error('Full Verification smoke PostgreSQL has no loopback port');
    }

    const result = await runCommand(
      process.execPath,
      ['--enable-source-maps', 'dist/db-migrate.js'],
      {
        env: {
          ...controlledProcessEnvironment(environment),
          HOST: '127.0.0.1',
          NODE_ENV: 'production',
          PORT: '1',
          ...databaseEnvironment({ database, password, port, role: 'migration', user }),
          SR_PIN_PEPPER: Buffer.alloc(32, 0x46).toString('base64url'),
          SR_ADMIN_PASSWORD_PEPPER: Buffer.alloc(32, 0x47).toString('base64url'),
        },
        timeoutMs: 90_000,
      },
    );
    migration = JSON.parse(result.stdout.trim());
    if (migration.pending !== 0 || migration.applied < 1) {
      throw new Error('Full Verification smoke migration did not materialize current schema');
    }
    return Object.freeze({
      ...publicContext(),
      migration: Object.freeze({
        applied: migration.applied,
        pending: migration.pending,
        manifestHash: migration.manifestHash,
      }),
      postgres: '18.4',
    });
  }

  function applicationEnvironment() {
    if (!started || port === null) {
      throw new Error('Full Verification smoke PostgreSQL is not provisioned');
    }
    return {
      ...controlledProcessEnvironment(environment),
      HOST: '127.0.0.1',
      NODE_ENV: 'production',
      ...databaseEnvironment({ database, password, port, role: 'application', user }),
      SR_PIN_PEPPER: Buffer.alloc(32, 0x46).toString('base64url'),
      SR_ADMIN_PASSWORD_PEPPER: Buffer.alloc(32, 0x47).toString('base64url'),
    };
  }

  async function smokeStart() {
    await runCommand(process.execPath, ['scripts/smoke-start.mjs'], {
      env: applicationEnvironment(),
      timeoutMs: 30_000,
    });
    return Object.freeze({ emittedJavaScript: true, startup: 'PASS', shutdown: 'PASS' });
  }

  async function smokeUi() {
    const result = await runCommand(process.execPath, ['scripts/smoke-ui.mjs'], {
      env: applicationEnvironment(),
      timeoutMs: 30_000,
    });
    return Object.freeze({ routes: JSON.parse(result.stdout.trim()), status: 'PASS' });
  }

  async function cleanup() {
    if (started) {
      await docker(['rm', '--force', container]);
      started = false;
    }
    const { stdout } = await docker([
      'ps', '--all', '--quiet', '--filter', `label=${smokeLabel}=${label}`,
    ]);
    if (stdout.trim()) throw new Error('Full Verification smoke cleanup retained a container');
    return Object.freeze({ containers: 0, networks: 0, volumes: 0, status: 'PASS' });
  }

  return Object.freeze({ cleanup, provision, publicContext, smokeStart, smokeUi });
}

export const fullVerificationSmokeLabel = smokeLabel;
