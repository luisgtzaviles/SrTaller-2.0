import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { promisify } from 'node:util';
import { Pool } from 'pg';

import { postgresqlImage } from './lib/postgresql-ci-evidence.mjs';
import { assertPostgresqlTestSummary } from './lib/postgresql-test-output.mjs';

const execute = promisify(execFile);
const suffix = randomBytes(6).toString('hex');
const container = `srtaller_pbi040_catalog_${suffix}`;
const database = `srtaller_pbi040_catalog_${suffix}`;
const user = 'srtaller_pbi040_test';
const password = `synthetic_${randomBytes(18).toString('hex')}`;
let started = false;
let successOutput = '';

async function docker(args, timeout = 60_000) {
  try {
    return await execute('docker', args, { encoding: 'utf8', maxBuffer: 20 * 1024 * 1024, timeout });
  } catch {
    throw new Error(`PBI-040 PostgreSQL operation failed: ${args[0] ?? 'docker'}`);
  }
}

async function cleanup() {
  if (!started) return;
  await docker(['rm', '--force', container]).catch(() => undefined);
  started = false;
}

process.once('SIGINT', () => void cleanup().finally(() => process.exit(130)));
process.once('SIGTERM', () => void cleanup().finally(() => process.exit(143)));

try {
  assert.equal(process.version, 'v24.18.0');
  await docker(['pull', '--quiet', postgresqlImage], 180_000);
  const run = await docker([
    'run', '--detach', '--name', container,
    '--label', 'com.srtaller.pbi040.catalog=postgresql',
    '--publish', '127.0.0.1::5432',
    '--tmpfs', '/var/lib/postgresql:rw,noexec,nosuid,size=512m',
    '--env', `POSTGRES_DB=${database}`,
    '--env', `POSTGRES_PASSWORD=${password}`,
    '--env', `POSTGRES_USER=${user}`,
    '--env', 'TZ=UTC',
    '--health-cmd', `pg_isready --username=${user} --dbname=${database}`,
    '--health-interval', '1s', '--health-timeout', '2s', '--health-retries', '30',
    postgresqlImage,
  ]);
  if (!run.stdout.trim()) throw new Error('PBI-040 PostgreSQL container did not start');
  started = true;
  const deadline = Date.now() + 60_000;
  while (true) {
    const state = (await docker(['inspect', '--format', '{{if .State.Health}}{{.State.Health.Status}}{{else}}{{.State.Status}}{{end}}', container])).stdout.trim();
    if (state === 'healthy') break;
    if (Date.now() >= deadline || ['dead', 'exited', 'unhealthy'].includes(state)) throw new Error(`PBI-040 PostgreSQL container is ${state}`);
    await new Promise((resolve) => setTimeout(resolve, 400));
  }
  const port = (await docker(['inspect', '--format', '{{(index (index .NetworkSettings.Ports "5432/tcp") 0).HostPort}}', container])).stdout.trim();
  if (!/^\d{1,5}$/u.test(port)) throw new Error('PBI-040 PostgreSQL loopback port is unavailable');

  const databaseEnvironment = {
    SR_DB_ENVIRONMENT: 'development', SR_DB_HOST: '127.0.0.1', SR_DB_PORT: port,
    SR_DB_NAME: database, SR_DB_USER: user, SR_DB_PASSWORD: password,
    SR_DB_SSL_MODE: 'disable', SR_DB_POOL_MIN: '0', SR_DB_POOL_MAX: '4',
    SR_DB_IDLE_TIMEOUT_MS: '1000', SR_DB_CONNECTION_TIMEOUT_MS: '2000',
    SR_DB_STATEMENT_TIMEOUT_MS: '20000', SR_DB_QUERY_TIMEOUT_MS: '20000',
    SR_DB_APPLICATION_NAME: 'srtaller-pbi040-migrator', SR_DB_ROLE: 'migration',
    SR_DB_ACCESS_MODE: 'read-write', SR_DB_MIGRATIONS_ENABLED: 'true',
  };
  const rawPool = new Pool({ host: '127.0.0.1', port: Number(port), database, user, password, ssl: false });
  try {
    const loopbackDeadline = Date.now() + 10_000;
    while (true) {
      try {
        await rawPool.query('select 1');
        break;
      } catch (error) {
        if (Date.now() >= loopbackDeadline) throw error;
        await new Promise((resolve) => setTimeout(resolve, 200));
      }
    }
  } catch (error) {
    const directCode = typeof error === 'object' && error !== null && 'code' in error ? error.code : undefined;
    const nestedCodes = typeof error === 'object' && error !== null && 'errors' in error && Array.isArray(error.errors)
      ? error.errors.map((nested) => typeof nested === 'object' && nested !== null && 'code' in nested ? nested.code : 'UNKNOWN')
      : [];
    const name = error instanceof Error ? error.name : 'Error';
    const message = error instanceof Error ? error.message.replace(/password=[^\s]+/giu, 'password=[REDACTED]') : 'unknown failure';
    const codes = (directCode ?? nestedCodes.join(',')) || 'UNKNOWN';
    throw new Error(`PBI-040 raw PostgreSQL loopback preflight failed on port ${port}: ${codes} ${name} ${message}`);
  } finally {
    await rawPool.end().catch(() => undefined);
  }
  const [{ parseDatabaseConfig }, { createDatabaseConnection }] = await Promise.all([
    import('../dist/infrastructure/database/database-config.js'),
    import('../dist/infrastructure/database/database-connection.js'),
  ]);
  const preflightConnection = createDatabaseConnection(parseDatabaseConfig({ ...process.env, ...databaseEnvironment }));
  try {
    await preflightConnection.verify();
  } catch (error) {
    const code = typeof error === 'object' && error !== null && 'code' in error ? error.code : 'UNKNOWN';
    throw new Error(`PBI-040 PostgreSQL loopback preflight failed: ${code}`);
  } finally {
    await preflightConnection.close().catch(() => undefined);
  }
  const migration = await execute(process.execPath, ['--enable-source-maps', 'dist/db-migrate.js'], {
    encoding: 'utf8', env: { ...process.env, ...databaseEnvironment }, maxBuffer: 20 * 1024 * 1024, timeout: 90_000,
  });
  const migrationResult = JSON.parse(migration.stdout.trim());
  if (migrationResult.pending !== 0 || migrationResult.applied < 55) throw new Error('PBI-040 migration set is incomplete');

  const testResult = await execute(process.execPath, ['--no-maglev', '--test', '--test-concurrency=1', 'test/catalog-postgresql.test.mjs'], {
    encoding: 'utf8',
    env: {
      ...process.env,
      SR_PBI040_PG_TEST: '1', SR_PBI040_PG_HOST: '127.0.0.1', SR_PBI040_PG_PORT: port,
      SR_PBI040_PG_NAME: database, SR_PBI040_PG_USER: user, SR_PBI040_PG_PASSWORD: password,
    },
    maxBuffer: 20 * 1024 * 1024,
    timeout: 90_000,
  });
  const testSummary = assertPostgresqlTestSummary(testResult.stdout);
  assert.equal(testSummary.tests, 1, 'PBI-040 PostgreSQL must execute its one registered material test');
  successOutput = `${testResult.stdout}PBI-040 PostgreSQL PASS: ${migrationResult.applied} migrations, zero critical skips, disposable container removed\n`;
} finally {
  await cleanup();
}
process.stdout.write(successOutput);
