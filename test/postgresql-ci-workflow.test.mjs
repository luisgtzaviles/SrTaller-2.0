import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import {
  criticalPostgresqlSuites,
  postgresqlImage,
} from '../scripts/lib/postgresql-ci-evidence.mjs';
import {
  assertPostgresqlTestSummary,
} from '../scripts/lib/postgresql-test-output.mjs';

const workflow = await readFile(
  '.github/workflows/authoritative-linux-ci.yml',
  'utf8',
);
const runner = await readFile('scripts/run-postgresql-ci.mjs', 'utf8');
const ownerScopedRunner = await readFile(
  'scripts/test-owner-scoped-persistence-postgresql.mjs',
  'utf8',
);

test('authoritative workflow runs PostgreSQL in both independent VC-024 jobs', () => {
  assert.match(workflow, /execution:\s*\n\s+- run-1\s*\n\s+- run-2/u);
  assert.match(
    workflow,
    /node scripts\/run-postgresql-ci\.mjs[\s\S]*POSTGRESQL_MANIFEST\.json/u,
  );
  assert.match(
    workflow,
    /name: Cleanup PostgreSQL persistence suites\s*\n\s*if: always\(\)/u,
  );
  assert.match(workflow, /--postgresql-input/u);
  assert.match(workflow, /- r0\/\*\*/u);
  assert.doesNotMatch(workflow, /secrets\./u);
});

test('compiled smoke uses an isolated migrated PostgreSQL service without relaxing startup', () => {
  assert.match(
    workflow,
    /compiled-smoke-postgresql:\s*\n\s*image: postgres@sha256:d93de42662696f278fb34354b06fdaa90ad7ca3106d6f72fbd01d16da006d2cf/u,
  );
  assert.match(
    workflow,
    /name: Prepare compiled smoke PostgreSQL schema[\s\S]*run: pnpm run db:migrate[\s\S]*SR_DB_ROLE: migration[\s\S]*SR_DB_MIGRATIONS_ENABLED: "true"/u,
  );
  assert.match(
    workflow,
    /name: Run compiled artifact smoke[\s\S]*run: pnpm run smoke:start[\s\S]*SR_DB_ROLE: application[\s\S]*SR_DB_MIGRATIONS_ENABLED: "false"/u,
  );
  assert.match(
    workflow,
    /name: Run compiled UI route smoke[\s\S]*run: pnpm run smoke:ui[\s\S]*SR_DB_ROLE: application[\s\S]*SR_DB_MIGRATIONS_ENABLED: "false"/u,
  );
  assert.ok(
    workflow.indexOf('name: Prepare compiled smoke PostgreSQL schema') <
      workflow.indexOf('name: Run compiled artifact smoke'),
  );
  assert.ok(
    workflow.indexOf('name: Run compiled artifact smoke') <
      workflow.indexOf('name: Run compiled UI route smoke'),
  );
  assert.doesNotMatch(workflow, /DATABASE_URL|PGPASSWORD|PGHOST/u);
});

test('PostgreSQL runner pins the governed digest and exact suite inventory', () => {
  assert.match(runner, /postgresqlImage/u);
  assert.doesNotMatch(runner, /postgres(?::latest|:18\b)/u);
  for (const suite of criticalPostgresqlSuites) {
    assert.match(runner, new RegExp(`name: '${suite}'`, 'u'));
  }
  assert.equal(
    postgresqlImage,
    'postgres@sha256:d93de42662696f278fb34354b06fdaa90ad7ca3106d6f72fbd01d16da006d2cf',
  );
});

test('owner-scoped PostgreSQL runner retains the exact material adapter inventory', () => {
  const materialAdapterTests = Array.from(
    ownerScopedRunner.matchAll(/^\s*'(test\/[^']+\.test\.mjs)',?\s*$/gmu),
    (match) => match[1],
  );
  assert.deepEqual(materialAdapterTests, [
    'test/owner-scoped-persistence-postgresql.test.mjs',
    'test/repair-persistence-postgresql.test.mjs',
    'test/trusted-station-context-postgresql.test.mjs',
    'test/user-directory-postgresql.test.mjs',
  ]);
});

test('critical test summary accepts zero skips and fails closed on any skip', () => {
  const passing = [
    'ℹ tests 6',
    'ℹ pass 6',
    'ℹ fail 0',
    'ℹ cancelled 0',
    'ℹ skipped 0',
    'ℹ todo 0',
  ].join('\n');
  assert.deepEqual(assertPostgresqlTestSummary(passing), {
    tests: 6,
    pass: 6,
    fail: 0,
    cancelled: 0,
    skipped: 0,
    todo: 0,
  });

  assert.throws(
    () =>
      assertPostgresqlTestSummary(
        passing.replace('skipped 0', 'skipped 1'),
      ),
    /did not execute every expected test/u,
  );
});
