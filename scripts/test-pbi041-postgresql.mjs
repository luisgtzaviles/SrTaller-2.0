import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { promisify } from 'node:util';
import { Pool } from 'pg';

import { postgresqlImage } from './lib/postgresql-ci-evidence.mjs';
import { assertPostgresqlTestSummary } from './lib/postgresql-test-output.mjs';
import { createPhaseRecorder } from './lib/performance-diagnostics.mjs';

const execute = promisify(execFile); const suffix = randomBytes(6).toString('hex');
const container = `srtaller_pbi041_bulk_${suffix}`; const database = `srtaller_pbi041_bulk_${suffix}`; const user = 'srtaller_pbi041_test'; const password = `synthetic_${randomBytes(18).toString('hex')}`;
let started = false; let successOutput = ''; const timing = createPhaseRecorder();
const performanceImages = Object.freeze({
  amd64: postgresqlImage,
  arm64: 'postgres@sha256:a02db8cac496f15b094798a38254f14d6e00741f709360e5e00bb6668ea31636',
});
async function docker(args, timeout = 60_000) { try { return await execute('docker', args, { encoding: 'utf8', maxBuffer: 20 * 1024 * 1024, timeout }); } catch { throw new Error(`PBI-041 PostgreSQL operation failed: ${args[0] ?? 'docker'}`); } }
async function cleanup() { if (!started) return; await docker(['rm', '--force', container]).catch(() => undefined); started = false; }
process.once('SIGINT', () => void cleanup().finally(() => process.exit(130))); process.once('SIGTERM', () => void cleanup().finally(() => process.exit(143)));
try {
  assert.equal(process.version, 'v24.18.0');
  const dockerArchitectureResult = await timing.measure('environment-inspection', () => docker(['version', '--format', '{{.Server.Arch}}']));
  const dockerArchitecture = dockerArchitectureResult.stdout.trim() === 'aarch64' ? 'arm64' : dockerArchitectureResult.stdout.trim();
  const performanceImage = performanceImages[dockerArchitecture];
  if (!performanceImage) throw new Error(`PBI-041 PostgreSQL does not define a native image for ${dockerArchitecture || 'unknown architecture'}`);
  await timing.measure('image-pull', () => docker(['pull', '--quiet', performanceImage], 180_000));
  const run = await timing.measure('container-create', () => docker(['run', '--detach', '--name', container, '--label', 'com.srtaller.pbi041.bulk=postgresql', '--platform', `linux/${dockerArchitecture}`, '--publish', '127.0.0.1::5432', '--tmpfs', '/var/lib/postgresql:rw,noexec,nosuid,size=768m', '--env', `POSTGRES_DB=${database}`, '--env', `POSTGRES_PASSWORD=${password}`, '--env', `POSTGRES_USER=${user}`, '--env', 'TZ=UTC', '--health-cmd', `pg_isready --username=${user} --dbname=${database}`, '--health-interval', '1s', '--health-timeout', '2s', '--health-retries', '30', performanceImage]));
  if (!run.stdout.trim()) throw new Error('PBI-041 PostgreSQL container did not start'); started = true;
  await timing.measure('container-health', async () => { const deadline = Date.now() + 60_000; while (true) { const state = (await docker(['inspect', '--format', '{{if .State.Health}}{{.State.Health.Status}}{{else}}{{.State.Status}}{{end}}', container])).stdout.trim(); if (state === 'healthy') break; if (Date.now() >= deadline || ['dead', 'exited', 'unhealthy'].includes(state)) throw new Error(`PBI-041 PostgreSQL container is ${state}`); await new Promise((resolve) => setTimeout(resolve, 400)); } });
  const port = (await docker(['inspect', '--format', '{{(index (index .NetworkSettings.Ports "5432/tcp") 0).HostPort}}', container])).stdout.trim();
  if (!/^\d{1,5}$/u.test(port)) throw new Error('PBI-041 PostgreSQL loopback port is unavailable');
  const environment = { SR_DB_ENVIRONMENT: 'development', SR_DB_HOST: '127.0.0.1', SR_DB_PORT: port, SR_DB_NAME: database, SR_DB_USER: user, SR_DB_PASSWORD: password, SR_DB_SSL_MODE: 'disable', SR_DB_POOL_MIN: '0', SR_DB_POOL_MAX: '4', SR_DB_IDLE_TIMEOUT_MS: '1000', SR_DB_CONNECTION_TIMEOUT_MS: '2000', SR_DB_STATEMENT_TIMEOUT_MS: '30000', SR_DB_QUERY_TIMEOUT_MS: '30000', SR_DB_APPLICATION_NAME: 'srtaller-pbi041-migrator', SR_DB_ROLE: 'migration', SR_DB_ACCESS_MODE: 'read-write', SR_DB_MIGRATIONS_ENABLED: 'true' };
  const preflight = new Pool({ host: '127.0.0.1', port: Number(port), database, user, password, ssl: false });
  await timing.measure('loopback-readiness', async () => { try { const loopbackDeadline = Date.now() + 10_000; while (true) { try { await preflight.query('select 1'); break; } catch (error) { if (Date.now() >= loopbackDeadline) throw error; await new Promise((resolve) => setTimeout(resolve, 200)); } } } finally { await preflight.end().catch(() => undefined); } });
  const migration = await timing.measure('migration-first', () => execute(process.execPath, ['--enable-source-maps', 'dist/db-migrate.js'], { encoding: 'utf8', env: { ...process.env, ...environment }, maxBuffer: 20 * 1024 * 1024, timeout: 90_000 }));
  const migrationResult = JSON.parse(migration.stdout.trim()); if (migrationResult.pending !== 0 || migrationResult.applied !== 89) throw new Error('PBI-041 migration set is incomplete');
  const secondMigration = await timing.measure('migration-second', () => execute(process.execPath, ['--enable-source-maps', 'dist/db-migrate.js'], { encoding: 'utf8', env: { ...process.env, ...environment }, maxBuffer: 20 * 1024 * 1024, timeout: 90_000 }));
  const secondMigrationResult = JSON.parse(secondMigration.stdout.trim()); if (secondMigrationResult.pending !== 0 || secondMigrationResult.applied !== 0) throw new Error('PBI-041 second migration run is not clean');
  const testEnvironment = { ...process.env, SR_PBI041_PG_TEST: '1', SR_PBI041_AUTH_PG_TEST: '1', SR_PBI041_CATALOG_PG_TEST: '1', SR_PBI041_PERF_DIAGNOSTICS: process.env.SR_PBI041_PERF_DIAGNOSTICS ?? '0', SR_PBI041_PG_HOST: '127.0.0.1', SR_PBI041_PG_PORT: port, SR_PBI041_PG_NAME: database, SR_PBI041_PG_USER: user, SR_PBI041_PG_PASSWORD: password, SR_PBI040_PG_HOST: '127.0.0.1', SR_PBI040_PG_PORT: port, SR_PBI040_PG_NAME: database, SR_PBI040_PG_USER: user, SR_PBI040_PG_PASSWORD: password };
  const results = await timing.measure('test-process', async () => {
    const authorization = await execute(process.execPath, ['--no-maglev', '--test', '--test-concurrency=1', 'test/catalog-authorization-postgresql.test.mjs'], { encoding: 'utf8', env: testEnvironment, maxBuffer: 20 * 1024 * 1024, timeout: 90_000 });
    const catalog = await execute(process.execPath, ['--no-maglev', '--test', '--test-concurrency=1', 'test/bulk-catalog-postgresql.test.mjs', 'test/catalog-postgresql.test.mjs'], { encoding: 'utf8', env: testEnvironment, maxBuffer: 20 * 1024 * 1024, timeout: 90_000 });
    return Object.freeze({ authorization, catalog });
  });
  const authorizationSummary = assertPostgresqlTestSummary(results.authorization.stdout);
  const catalogSummary = assertPostgresqlTestSummary(results.catalog.stdout);
  const testSummary = Object.freeze({
    tests: authorizationSummary.tests + catalogSummary.tests,
    pass: authorizationSummary.pass + catalogSummary.pass,
  });
  assert.equal(testSummary.tests, 10, 'PBI-041 PostgreSQL must execute its ten registered material tests');
  assert.equal(testSummary.pass, 10, 'PBI-041 PostgreSQL must pass its ten registered material tests');
  successOutput = `${results.authorization.stdout}${results.catalog.stdout}PBI-041 harness diagnostics: ${JSON.stringify({ dockerArchitecture, performanceImage, ...timing.snapshot() })}\nPBI-041 PostgreSQL PASS: ${migrationResult.applied} migrations, second run ${secondMigrationResult.pending} pending, disposable container removed\n`;
} finally { await cleanup(); }
process.stdout.write(successOutput);
