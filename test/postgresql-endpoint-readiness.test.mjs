import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import { waitForPostgresqlEndpoint } from '../scripts/lib/postgresql-endpoint-readiness.mjs';

function options(overrides = {}) {
  return {
    host: '127.0.0.1',
    port: 54_321,
    database: 'synthetic_database',
    user: 'synthetic_user',
    password: 'synthetic_password',
    ...overrides,
  };
}

test('published PostgreSQL endpoint must accept the authoritative query before migrations begin', async () => {
  const events = [];
  let attempt = 0;
  let currentTime = 0;
  const createPool = (configuration) => ({
    query: async (statement) => {
      attempt += 1;
      events.push(`probe-${attempt}`);
      assert.equal(statement, 'select 1');
      assert.equal(configuration.host, '127.0.0.1');
      assert.equal(configuration.port, 54_321);
      if (attempt < 3) {
        const error = new Error('published endpoint is not ready');
        error.code = 'ECONNREFUSED';
        throw error;
      }
    },
    end: async () => events.push(`close-${attempt}`),
  });

  const readiness = await waitForPostgresqlEndpoint(
    options({
      createPool,
      now: () => currentTime,
      sleep: async (milliseconds) => {
        events.push(`wait-${milliseconds}`);
        currentTime += milliseconds;
      },
    }),
  );
  events.push('migration');

  assert.deepEqual(readiness, { attempts: 3, elapsedMs: 400 });
  assert.deepEqual(events, [
    'probe-1', 'close-1', 'wait-200',
    'probe-2', 'close-2', 'wait-200',
    'probe-3', 'close-3', 'migration',
  ]);
});

test('published PostgreSQL endpoint readiness fails boundedly and closes every probe', async () => {
  let currentTime = 0;
  let probes = 0;
  let closes = 0;
  const unavailable = Object.assign(new Error('not reachable'), {
    code: 'ECONNREFUSED',
  });

  await assert.rejects(
    waitForPostgresqlEndpoint(
      options({
        timeoutMs: 450,
        retryIntervalMs: 200,
        connectionTimeoutMs: 100,
        createPool: () => ({
          query: async () => {
            probes += 1;
            throw unavailable;
          },
          end: async () => {
            closes += 1;
          },
        }),
        now: () => currentTime,
        sleep: async (milliseconds) => {
          currentTime += milliseconds;
        },
      }),
    ),
    (error) => {
      assert.match(error.message, /timed out after 450ms/u);
      assert.match(error.message, /ECONNREFUSED/u);
      assert.equal(error.cause, unavailable);
      return true;
    },
  );
  assert.equal(currentTime, 450);
  assert.equal(probes, 4);
  assert.equal(closes, probes);
});

test('readiness does not absorb a genuine migration failure', async () => {
  const migrationFailure = new Error('migration failed');
  const run = async () => {
    await waitForPostgresqlEndpoint(
      options({
        createPool: () => ({
          query: async () => undefined,
          end: async () => undefined,
        }),
      }),
    );
    throw migrationFailure;
  };

  await assert.rejects(run(), (error) => error === migrationFailure);
});

test('TL-02 material harness awaits loopback readiness before invoking the migrator and retains cleanup', async () => {
  const source = await readFile('scripts/test-tl02-postgresql.mjs', 'utf8');
  const readiness = source.indexOf('await waitForPostgresqlEndpoint(');
  const migration = source.indexOf("'dist/db-migrate.js'");

  assert.ok(readiness >= 0, 'TL-02 must await the published endpoint');
  assert.ok(migration > readiness, 'migrations must start only after readiness');
  assert.match(source, /finally \{ await cleanup\(\); \}/u);
});
