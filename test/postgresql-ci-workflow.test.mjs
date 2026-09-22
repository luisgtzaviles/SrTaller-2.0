import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import {
  chmod,
  mkdtemp,
  readFile,
  rm,
  writeFile,
} from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { promisify } from 'node:util';

import {
  criticalPostgresqlSuites,
  postgresqlImage,
} from '../scripts/lib/postgresql-ci-evidence.mjs';
import {
  assertPostgresqlTestSummary,
  createPostgresqlChildFailureMarker,
  createPostgresqlHarnessFailureMarker,
  formatPostgresqlChildFailureDiagnostic,
  formatPostgresqlHarnessFailureDiagnostic,
  ownerScopedPostgresqlHarnessOperations,
  ownerScopedPostgresqlTestFiles,
  pbi039PostgresqlTestFiles,
  parsePostgresqlChildFailureMarker,
  parsePostgresqlHarnessFailureMarker,
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
const pbi039Runner = await readFile(
  'scripts/test-pbi039-postgresql.mjs',
  'utf8',
);
const cleanupRunner = await readFile(
  'scripts/cleanup-postgresql-ci.mjs',
  'utf8',
);
const execute = promisify(execFile);

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
  assert.match(
    workflow,
    /node scripts\/test-pbi039-postgresql\.mjs[\s\S]*PBI039_POSTGRESQL_MANIFEST\.json/u,
  );
  assert.match(workflow, /--pbi039-postgresql-input/u);
  assert.match(
    workflow,
    /name: Run TL-02 PostgreSQL 18\.4 contracts[\s\S]*--stage tl02-postgresql[\s\S]*node scripts\/test-tl02-postgresql\.mjs/u,
  );
  assert.match(
    workflow,
    /name: Run TL-03 PostgreSQL 18\.4 contracts[\s\S]*--stage tl03-postgresql[\s\S]*node scripts\/test-tl03-postgresql\.mjs/u,
  );
  assert.match(
    workflow,
    /name: Run TL-04 PostgreSQL 18\.4 contracts[\s\S]*--stage tl04-postgresql[\s\S]*node scripts\/test-tl04-postgresql\.mjs/u,
  );
  assert.match(
    workflow,
    /cp[\s\S]*PBI039_POSTGRESQL_MANIFEST\.json[\s\S]*evidence_dir/u,
  );
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
    /name: Prepare compiled smoke PostgreSQL schema[\s\S]*-- pnpm run db:migrate[\s\S]*SR_DB_ROLE: migration[\s\S]*SR_DB_MIGRATIONS_ENABLED: "true"/u,
  );
  assert.match(
    workflow,
    /name: Run compiled artifact smoke[\s\S]*-- pnpm run smoke:start[\s\S]*SR_DB_ROLE: application[\s\S]*SR_DB_MIGRATIONS_ENABLED: "false"[\s\S]*SR_REGISTRATION_ABUSE_PEPPER: [A-Za-z0-9_-]{43}[\s\S]*SR_RESEND_API_KEY: re_[A-Za-z0-9_-]+/u,
  );
  assert.match(
    workflow,
    /name: Run compiled UI route smoke[\s\S]*-- pnpm run smoke:ui[\s\S]*SR_DB_ROLE: application[\s\S]*SR_DB_MIGRATIONS_ENABLED: "false"[\s\S]*SR_REGISTRATION_ABUSE_PEPPER: [A-Za-z0-9_-]{43}[\s\S]*SR_RESEND_API_KEY: re_[A-Za-z0-9_-]+/u,
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

test('workflow selects DOCS_ONLY fail closed and executes one atomic base gate per leg', () => {
  assert.match(workflow, /name: Governed change classification/u);
  assert.match(workflow, /force_full="classification-policy-change"/u);
  assert.match(workflow, /verify-preview-migration-state\.mjs[\s\S]*--phase pre-merge/u);
  assert.match(workflow, /name: DOCS_ONLY fail-closed/u);
  assert.match(workflow, /scripts\/verify-docs-only\.mjs/u);
  const docsOnlyJob = workflow.slice(
    workflow.indexOf('  docs-only-gate:'),
    workflow.indexOf('  authoritative-gate:'),
  );
  assert.doesNotMatch(docsOnlyJob, /verify-structure\.mjs|pnpm install/u);
  assert.match(workflow, /if: needs\.classify-change\.outputs\.docs_only != 'true'/u);
  assert.match(workflow, /name: Run atomic canonical base verification/u);
  assert.match(
    workflow,
    /name: Checkout exact commit[\s\S]*fetch-depth: 0[\s\S]*persist-credentials: false/u,
  );
  assert.match(
    workflow,
    /candidate_sha: \$\{\{ steps\.classify\.outputs\.candidate_sha \}\}/u,
  );
  assert.match(
    workflow,
    /ref: \$\{\{ needs\.classify-change\.outputs\.candidate_sha \}\}/u,
  );
  assert.match(
    workflow,
    /git rev-parse HEAD\)" = "\$\{\{ needs\.classify-change\.outputs\.candidate_sha \}\}"/u,
  );
  assert.equal(
    workflow.match(/--head-sha "\$\{\{ needs\.classify-change\.outputs\.candidate_sha \}\}"/gu)?.length,
    2,
  );
  assert.match(
    runner,
    /argument\('--head-sha'\) \?\?[\s\S]*process\.env\.GITHUB_SHA/u,
  );
  assert.match(
    pbi039Runner,
    /argument\('--head-sha'\) \?\?[\s\S]*process\.env\.GITHUB_SHA/u,
  );
  assert.match(workflow, /-- pnpm run verify/u);
  assert.doesNotMatch(workflow, /name: Verify architecture/u);
  assert.doesNotMatch(workflow, /name: Typecheck/u);
  assert.doesNotMatch(workflow, /name: Build clean artifact/u);
  assert.doesNotMatch(workflow, /name: Run full test suite/u);
  assert.doesNotMatch(workflow, /name: Run dedicated architecture suite/u);
  assert.doesNotMatch(workflow, /name: Run smoke unit contract/u);
  assert.match(workflow, /VERIFIED_TREE_ATTESTATION\.json/u);
  assert.match(workflow, /WORKFLOW_METRICS\.json/u);
  assert.match(
    workflow,
    /SR_WORKFLOW_METRICS_FILE: WORKFLOW_METRICS-\$\{\{ matrix\.execution \}\}\.json/u,
  );
  assert.doesNotMatch(
    workflow,
    /^\s{6}[A-Z][A-Z0-9_]*:\s*\$\{\{\s*runner\./mu,
    'job-level env cannot use the runner context before a runner exists',
  );
});

test('authoritative promotion gate always resolves the selected non-reductive path', () => {
  const promotionGate = workflow.slice(
    workflow.indexOf('  promotion-gate:'),
  );

  assert.match(promotionGate, /name: Authoritative promotion gate/u);
  assert.match(
    promotionGate,
    /needs:\s*\n\s*- classify-change\s*\n\s*- docs-only-gate\s*\n\s*- authoritative-gate\s*\n\s*- compare-authoritative-gates/u,
  );
  assert.match(promotionGate, /if: always\(\)/u);
  assert.match(
    promotionGate,
    /CLASSIFICATION_RESULT: \$\{\{ needs\.classify-change\.result \}\}/u,
  );
  assert.match(
    promotionGate,
    /DOCS_ONLY_RESULT: \$\{\{ needs\.docs-only-gate\.result \}\}/u,
  );
  assert.match(
    promotionGate,
    /FULL_RESULT: \$\{\{ needs\.authoritative-gate\.result \}\}/u,
  );
  assert.match(
    promotionGate,
    /COMPARISON_RESULT: \$\{\{ needs\.compare-authoritative-gates\.result \}\}/u,
  );
  assert.match(
    promotionGate,
    /if \[\[ "\$\{DOCS_ONLY\}" == "true" \]\]; then[\s\S]*DOCS_ONLY_RESULT[\s\S]*FULL_RESULT[\s\S]*COMPARISON_RESULT[\s\S]*else[\s\S]*DOCS_ONLY_RESULT[\s\S]*FULL_RESULT[\s\S]*COMPARISON_RESULT/u,
  );
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
  assert.deepEqual(ownerScopedPostgresqlTestFiles, [
    'test/owner-scoped-persistence-postgresql.test.mjs',
    'test/repair-persistence-postgresql.test.mjs',
    'test/trusted-station-context-postgresql.test.mjs',
    'test/user-directory-postgresql.test.mjs',
    'test/access-role-postgresql.test.mjs',
    'test/access-pin-postgresql.test.mjs',
    'test/access-session-postgresql.test.mjs',
    'test/contextual-authorization-postgresql.test.mjs',
  ]);
  assert.match(
    ownerScopedRunner,
    /for \(const file of ownerScopedPostgresqlTestFiles\)/u,
  );
  assert.match(
    ownerScopedRunner,
    /fresh database and container per test file/u,
  );
  assert.match(ownerScopedRunner, /randomBytes\(6\)/u);
  assert.match(
    ownerScopedRunner,
    /finally \{\s*if \(started\)/u,
  );
  assert.match(ownerScopedRunner, /process\.once\('SIGINT'/u);
  assert.match(ownerScopedRunner, /process\.once\('SIGTERM'/u);
});

test('PBI-039 PostgreSQL runner isolates each focused test file from local and shared databases', () => {
  assert.deepEqual(pbi039PostgresqlTestFiles, [
    'test/customer-phone-postgresql.test.mjs',
    'test/user-preferences-postgresql.test.mjs',
  ]);
  assert.match(pbi039Runner, /fresh database and container per test file/u);
  assert.match(pbi039Runner, /randomBytes\(6\)/u);
  assert.match(pbi039Runner, /dist\/db-migrate\.js/u);
  assert.match(pbi039Runner, /finally \{\s*await cleanupContainer\(container\)/u);
  assert.match(
    pbi039Runner,
    /com\.srtaller\.pbi039\.execution=\$\{executionLabel\}/u,
  );
  assert.match(pbi039Runner, /finalizePbi039PostgresqlCiManifest/u);
  assert.doesNotMatch(pbi039Runner, /ensureLocalEnvironment|SR_LOCAL_DB_/u);
});

test('always cleanup covers PBI-023 and PBI-039 execution labels', () => {
  assert.match(
    cleanupRunner,
    /com\.srtaller\.pbi023\.execution=\$\{executionLabel\}/u,
  );
  assert.match(
    cleanupRunner,
    /com\.srtaller\.pbi039\.execution=\$\{executionLabel\}/u,
  );
  assert.match(
    workflow,
    /name: Cleanup PostgreSQL persistence suites\s*\n\s*if: always\(\)/u,
  );
});

test('PostgreSQL child diagnostics expose only allowlisted failure identity', () => {
  const secret = 'synthetic_secret_that_must_not_escape';
  const marker = createPostgresqlChildFailureMarker({
    code: 1,
    cmd: `${process.execPath} --test --password=${secret}`,
    killed: false,
    message: `database failure ${secret}`,
    signal: null,
    stderr: `password=${secret}`,
    stdout: [
      `✖ assertion included ${secret}`,
      'test at test/access-pin-postgresql.test.mjs:366:1',
      `Error: ${secret}`,
    ].join('\n'),
  });
  assert.doesNotMatch(marker, new RegExp(secret, 'u'));

  const payload = parsePostgresqlChildFailureMarker(
    `${marker}\nignored outer stack ${secret}`,
  );
  assert.deepEqual(payload, {
    schemaVersion: 1,
    operation: 'owner-scoped-adapters-node-test',
    failedTests: ['test/access-pin-postgresql.test.mjs'],
    exitCode: 1,
    signal: null,
    timeout: false,
  });
  const diagnostic = formatPostgresqlChildFailureDiagnostic(payload);
  assert.equal(
    diagnostic,
    'operation=owner-scoped-adapters-node-test; ' +
      'failedTests=test/access-pin-postgresql.test.mjs; ' +
      'exitCode=1; signal=none; timeout=no',
  );
  assert.doesNotMatch(diagnostic, new RegExp(secret, 'u'));
});

test('PostgreSQL child diagnostics reject forged or ambiguous markers', () => {
  const marker = createPostgresqlChildFailureMarker({
    code: null,
    killed: true,
    signal: 'SIGTERM',
    stdout: '',
  });
  assert.deepEqual(parsePostgresqlChildFailureMarker(marker), {
    schemaVersion: 1,
    operation: 'owner-scoped-adapters-node-test',
    failedTests: [],
    exitCode: null,
    signal: 'SIGTERM',
    timeout: true,
  });
  assert.equal(
    parsePostgresqlChildFailureMarker(
      'SR_POSTGRESQL_CHILD_FAILURE=' +
        JSON.stringify({
          schemaVersion: 1,
          operation: 'owner-scoped-adapters-node-test',
          failedTests: ['secret.txt'],
          exitCode: 1,
          signal: null,
          timeout: false,
        }),
    ),
    null,
  );
  assert.equal(
    parsePostgresqlChildFailureMarker(`${marker}\n${marker}`),
    null,
  );
  assert.equal(
    parsePostgresqlChildFailureMarker(
      marker.replace('SIGTERM', 'SIGSECRET'),
    ),
    null,
  );
});

test('owner-scoped harness diagnostics preserve only governed failure identity', () => {
  assert.deepEqual(ownerScopedPostgresqlHarnessOperations, [
    'owner-scoped-adapters-docker-exec',
    'owner-scoped-adapters-docker-inspect',
    'owner-scoped-adapters-docker-list',
    'owner-scoped-adapters-docker-pull',
    'owner-scoped-adapters-docker-remove',
    'owner-scoped-adapters-docker-run',
  ]);
  const secret = 'synthetic_harness_secret_that_must_not_escape';
  const marker = createPostgresqlHarnessFailureMarker(
    'owner-scoped-adapters-docker-pull',
    'test/owner-scoped-persistence-postgresql.test.mjs',
    {
      code: 1,
      cmd: `docker pull --password=${secret}`,
      killed: false,
      message: `registry failure ${secret}`,
      signal: null,
      stderr: `password=${secret}`,
      stdout: secret,
    },
  );
  assert.doesNotMatch(marker, new RegExp(secret, 'u'));

  const payload = parsePostgresqlHarnessFailureMarker(
    `${marker}\nignored outer stack ${secret}`,
  );
  assert.deepEqual(payload, {
    schemaVersion: 1,
    operation: 'owner-scoped-adapters-docker-pull',
    testFile: 'test/owner-scoped-persistence-postgresql.test.mjs',
    exitCode: 1,
    signal: null,
    timeout: false,
  });
  const diagnostic = formatPostgresqlHarnessFailureDiagnostic(payload);
  assert.equal(
    diagnostic,
    'operation=owner-scoped-adapters-docker-pull; ' +
      'testFile=test/owner-scoped-persistence-postgresql.test.mjs; ' +
      'exitCode=1; signal=none; timeout=no',
  );
  assert.doesNotMatch(diagnostic, new RegExp(secret, 'u'));
  assert.match(ownerScopedRunner, /createPostgresqlHarnessFailureMarker/u);
  assert.match(ownerScopedRunner, /OwnerScopedPostgresqlHarnessError/u);
  assert.match(runner, /parsePostgresqlHarnessFailureMarker/u);
  assert.match(runner, /formatPostgresqlHarnessFailureDiagnostic/u);
});

test('owner-scoped harness diagnostics reject forged or ambiguous markers', () => {
  const marker = createPostgresqlHarnessFailureMarker(
    'owner-scoped-adapters-docker-run',
    'test/access-session-postgresql.test.mjs',
    {
      code: null,
      killed: true,
      signal: 'SIGTERM',
    },
  );
  assert.deepEqual(parsePostgresqlHarnessFailureMarker(marker), {
    schemaVersion: 1,
    operation: 'owner-scoped-adapters-docker-run',
    testFile: 'test/access-session-postgresql.test.mjs',
    exitCode: null,
    signal: 'SIGTERM',
    timeout: true,
  });
  assert.equal(
    parsePostgresqlHarnessFailureMarker(
      marker.replace(
        'owner-scoped-adapters-docker-run',
        'owner-scoped-adapters-shell',
      ),
    ),
    null,
  );
  assert.equal(
    parsePostgresqlHarnessFailureMarker(
      marker.replace(
        'test/access-session-postgresql.test.mjs',
        'test/secret.test.mjs',
      ),
    ),
    null,
  );
  assert.equal(
    parsePostgresqlHarnessFailureMarker(`${marker}\n${marker}`),
    null,
  );
});

test('owner-scoped runner reports Docker bootstrap failure without raw stderr', async () => {
  const directory = await mkdtemp(
    join(tmpdir(), 'srtaller-owner-scoped-diagnostic-'),
  );
  const dockerPath = join(directory, 'docker');
  const secret = 'synthetic_docker_stderr_that_must_not_escape';
  await writeFile(
    dockerPath,
    `#!/bin/sh\n` +
      `if [ "$1" = "pull" ]; then\n` +
      `  echo "${secret}" >&2\n` +
      `  exit 71\n` +
      `fi\n` +
      `if [ "$1" = "ps" ]; then exit 0; fi\n` +
      `exit 72\n`,
  );
  await chmod(dockerPath, 0o755);

  try {
    await assert.rejects(
      execute(
        process.execPath,
        [
          'scripts/test-owner-scoped-persistence-postgresql.mjs',
          '--runs',
          '1',
        ],
        {
          encoding: 'utf8',
          env: {
            ...process.env,
            PATH: `${directory}:${process.env.PATH ?? ''}`,
          },
        },
      ),
      (error) => {
        assert.equal(error.code, 1);
        assert.doesNotMatch(error.stderr, new RegExp(secret, 'u'));
        const payload = parsePostgresqlHarnessFailureMarker(error.stderr);
        assert.deepEqual(payload, {
          schemaVersion: 1,
          operation: 'owner-scoped-adapters-docker-pull',
          testFile:
            'test/owner-scoped-persistence-postgresql.test.mjs',
          exitCode: 71,
          signal: null,
          timeout: false,
        });
        return true;
      },
    );
  } finally {
    await rm(directory, { force: true, recursive: true });
  }
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
