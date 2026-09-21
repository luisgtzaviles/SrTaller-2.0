import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { promisify } from 'node:util';

import { postgresqlImage } from './lib/postgresql-ci-evidence.mjs';
import { assertPostgresqlTestSummary } from './lib/postgresql-test-output.mjs';

const execute = promisify(execFile); const suffix = randomBytes(6).toString('hex');
const container = `srtaller_tl02_${suffix}`; const database = `srtaller_tl02_${suffix}`;
const user = 'srtaller_tl02_test'; const password = `synthetic_${randomBytes(18).toString('hex')}`; let started = false; let output = '';
async function docker(args, timeout = 60_000) { return execute('docker', args, { encoding: 'utf8', maxBuffer: 20 * 1024 * 1024, timeout }); }
async function cleanup() { if (started) await docker(['rm', '--force', container]).catch(() => undefined); started = false; }
try {
  assert.equal(process.version, 'v24.18.0'); await docker(['pull', '--quiet', postgresqlImage], 180_000);
  await docker(['run','--detach','--name',container,'--label','com.srtaller.tl02=postgresql','--publish','127.0.0.1::5432','--tmpfs','/var/lib/postgresql:rw,noexec,nosuid,size=384m','--env',`POSTGRES_DB=${database}`,'--env',`POSTGRES_PASSWORD=${password}`,'--env',`POSTGRES_USER=${user}`,'--health-cmd',`pg_isready --username=${user} --dbname=${database}`,'--health-interval','1s','--health-timeout','2s','--health-retries','30',postgresqlImage]); started = true;
  const deadline = Date.now() + 60_000; while (true) { const state = (await docker(['inspect','--format','{{if .State.Health}}{{.State.Health.Status}}{{else}}{{.State.Status}}{{end}}',container])).stdout.trim(); if (state === 'healthy') break; if (Date.now() >= deadline) throw new Error('TL-02 PostgreSQL health timeout'); await new Promise((resolve) => setTimeout(resolve, 300)); }
  const port = (await docker(['inspect','--format','{{(index (index .NetworkSettings.Ports "5432/tcp") 0).HostPort}}',container])).stdout.trim();
  const env = { ...process.env, SR_DB_ENVIRONMENT:'development',SR_DB_HOST:'127.0.0.1',SR_DB_PORT:port,SR_DB_NAME:database,SR_DB_USER:user,SR_DB_PASSWORD:password,SR_DB_SSL_MODE:'disable',SR_DB_POOL_MIN:'0',SR_DB_POOL_MAX:'4',SR_DB_IDLE_TIMEOUT_MS:'1000',SR_DB_CONNECTION_TIMEOUT_MS:'2000',SR_DB_STATEMENT_TIMEOUT_MS:'30000',SR_DB_QUERY_TIMEOUT_MS:'30000',SR_DB_APPLICATION_NAME:'srtaller-tl02-migrator',SR_DB_ROLE:'migration',SR_DB_ACCESS_MODE:'read-write',SR_DB_MIGRATIONS_ENABLED:'true' };
  const first = JSON.parse((await execute(process.execPath,['--enable-source-maps','dist/db-migrate.js'],{encoding:'utf8',env,timeout:90_000})).stdout.trim()); assert.equal(first.applied, 76); assert.equal(first.pending, 0);
  const second = JSON.parse((await execute(process.execPath,['--enable-source-maps','dist/db-migrate.js'],{encoding:'utf8',env,timeout:90_000})).stdout.trim()); assert.equal(second.applied, 0); assert.equal(second.pending, 0);
  const testResult = await execute(process.execPath,['--test','test/tl02-admin-auth-postgresql.test.mjs'],{encoding:'utf8',env:{...process.env,SR_TL02_PG_TEST:'1',SR_TL02_PG_HOST:'127.0.0.1',SR_TL02_PG_PORT:port,SR_TL02_PG_NAME:database,SR_TL02_PG_USER:user,SR_TL02_PG_PASSWORD:password},timeout:90_000});
  const summary = assertPostgresqlTestSummary(testResult.stdout); assert.equal(summary.pass, 2); output = `${testResult.stdout}TL-02 PostgreSQL PASS: 76 migrations, second run 0 pending\n`;
} finally { await cleanup(); }
process.stdout.write(output);
