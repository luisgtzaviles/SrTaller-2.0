import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import {
  assertPostgresqlTestSummary,
  createPostgresqlChildDiagnosticMarker,
  createPostgresqlChildFailureMarker,
  formatPostgresqlChildDiagnostic,
  ownerScopedPostgresqlTestFiles,
  parsePostgresqlChildDiagnosticMarker,
  parsePostgresqlChildFailureMarker,
} from '../scripts/lib/postgresql-test-output.mjs';

const ownerRunner = await readFile(
  'scripts/test-owner-scoped-persistence-postgresql.mjs',
  'utf8',
);
const workflowRunner = await readFile('scripts/run-postgresql-ci.mjs', 'utf8');
const childSuite = 'test/contextual-authorization-postgresql.test.mjs';

function failure(overrides = {}) {
  return {
    code: 1,
    killed: false,
    signal: null,
    stdout: [
      'not ok 1 - contextual authorization rejects stale authority',
      'AssertionError: expected deny, received allow',
      `test at ${childSuite}:123:7`,
    ].join('\n'),
    stderr: 'Error: authorization assertion failed',
    ...overrides,
  };
}

test('passing child summaries retain existing fail-closed semantics', () => {
  assert.deepEqual(
    assertPostgresqlTestSummary(
      [
        'ℹ tests 1',
        'ℹ pass 1',
        'ℹ fail 0',
        'ℹ cancelled 0',
        'ℹ skipped 0',
        'ℹ todo 0',
      ].join('\n'),
    ),
    { tests: 1, pass: 1, fail: 0, cancelled: 0, skipped: 0, todo: 0 },
  );
  assert.match(ownerRunner, /createPostgresqlChildDiagnosticMarker/u);
  assert.match(
    ownerRunner,
    /PostgreSQL adapter critical test failed: \$\{file\}/u,
  );
});

test('assertion failures retain suite, ordinal, output and summary while propagating', () => {
  const marker = createPostgresqlChildDiagnosticMarker(failure(), {
    ordinal: 8,
    suite: childSuite,
  });
  const payload = parsePostgresqlChildDiagnosticMarker(marker);
  assert.equal(payload?.suite, childSuite);
  assert.equal(payload?.ordinal, 8);
  assert.equal(payload?.exitCode, 1);
  assert.equal(payload?.signal, null);
  assert.equal(payload?.timeout, false);
  assert.match(payload?.stdout ?? '', /not ok 1/u);
  assert.match(payload?.summary ?? '', /AssertionError/u);
  assert.match(formatPostgresqlChildDiagnostic(payload), /expected deny/u);
  assert.deepEqual(
    parsePostgresqlChildFailureMarker(
      createPostgresqlChildFailureMarker(failure()),
    )?.failedTests,
    [childSuite],
  );
  assert.match(ownerRunner, /throw new Error\(/u);
  assert.match(workflowRunner, /parsePostgresqlChildDiagnosticMarker/u);
  assert.match(workflowRunner, /formatPostgresqlChildDiagnostic/u);
});

test('signaled children report signal and timed-out children report timeout', () => {
  const signaled = parsePostgresqlChildDiagnosticMarker(
    createPostgresqlChildDiagnosticMarker(
      failure({ code: null, killed: false, signal: 'SIGTERM' }),
      { ordinal: 3, suite: 'test/trusted-station-context-postgresql.test.mjs' },
    ),
  );
  assert.equal(signaled?.signal, 'SIGTERM');
  assert.equal(signaled?.exitCode, null);
  assert.equal(signaled?.timeout, false);

  const timedOut = parsePostgresqlChildDiagnosticMarker(
    createPostgresqlChildDiagnosticMarker(
      failure({ code: null, killed: true, signal: 'SIGTERM' }),
      { ordinal: 6, suite: 'test/access-pin-postgresql.test.mjs' },
    ),
  );
  assert.equal(timedOut?.timeout, true);
  assert.equal(timedOut?.timeoutReason, 'execFile-timeout');
  assert.equal(timedOut?.signal, 'SIGTERM');
  assert.equal(timedOut?.exitCode, null);
});

test('oversized child output is bounded and visibly truncated', () => {
  const marker = createPostgresqlChildDiagnosticMarker(
    failure({
      stdout: `${'head assertion\n'}${'x'.repeat(10_000)}${'\nAssertionError: middle assertion\n'}${'x'.repeat(10_000)}${'\ntail assertion'}`,
      stderr: `${'head error\n'}${'y'.repeat(20_000)}${'\ntail error'}`,
    }),
    { ordinal: 1, suite: ownerScopedPostgresqlTestFiles[0] },
  );
  const payload = parsePostgresqlChildDiagnosticMarker(marker);
  assert.equal(payload?.stdoutTruncated, true);
  assert.equal(payload?.stderrTruncated, true);
  assert.ok((payload?.stdout.length ?? 0) <= 4_096);
  assert.ok((payload?.stderr.length ?? 0) <= 4_096);
  assert.match(payload?.stdout ?? '', /diagnostic output truncated/u);
  assert.match(payload?.stderr ?? '', /diagnostic output truncated/u);
  assert.match(payload?.summary ?? '', /middle assertion/u);
});

test('secret-like child diagnostics are redacted before retention', () => {
  const secret = 'synthetic_secret_that_must_not_escape';
  const pin = 'synthetic_pin_value';
  const marker = createPostgresqlChildDiagnosticMarker(
    failure({
      stdout: [
        `password=${secret}`,
        `PIN=${pin}`,
        `Authorization: Bearer ${secret}`,
        `postgresql://user:${secret}@localhost/db`,
        `SR_REGISTRATION_ABUSE_PEPPER=${secret}`,
        `enrollment_secret=${secret}`,
      ].join('\n'),
      stderr: `csrf=${secret}`,
    }),
    { ordinal: 8, suite: childSuite },
  );
  assert.doesNotMatch(marker, new RegExp(secret, 'u'));
  assert.doesNotMatch(marker, new RegExp(pin, 'u'));
  const payload = parsePostgresqlChildDiagnosticMarker(marker);
  assert.match(payload?.stdout ?? '', /password=\[redacted\]/u);
  assert.match(payload?.stdout ?? '', /PIN=\[redacted\]/u);
  assert.match(payload?.stdout ?? '', /redacted-connection/u);
  assert.match(payload?.stderr ?? '', /csrf=\[redacted\]/u);
});

test('exact suite inventory and explicit governed budgets remain protected', () => {
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
  assert.equal((ownerRunner.match(/'run',\s*'--detach'/gu) ?? []).length, 1);
  assert.match(ownerRunner, /timeout: 150_000/u);
  assert.match(
    workflowRunner,
    /const DEFAULT_POSTGRESQL_SUITE_TIMEOUT_MS = 240_000/u,
  );
  assert.match(
    workflowRunner,
    /const OWNER_SCOPED_POSTGRESQL_SUITE_TIMEOUT_MS = 360_000/u,
  );
  assert.match(
    workflowRunner,
    /definition\.name === 'owner-scoped-adapters'[\s\S]*OWNER_SCOPED_POSTGRESQL_SUITE_TIMEOUT_MS[\s\S]*DEFAULT_POSTGRESQL_SUITE_TIMEOUT_MS/u,
  );
  assert.equal(
    (workflowRunner.match(/360_000/gu) ?? []).length,
    1,
  );
  assert.doesNotMatch(ownerRunner, /Promise\.allSettled|Promise\.all\(/u);
});

test('child failure diagnostics preserve cleanup and governed propagation', () => {
  assert.match(
    ownerRunner,
    /finally \{[\s\S]*?await measure\(timings, 'databaseDropMs',[\s\S]*?dropDatabase/u,
  );
  assert.match(ownerRunner, /createPostgresqlChildFailureMarker\(error\)/u);
  assert.match(workflowRunner, /parsePostgresqlChildFailureMarker\(stderr\)/u);
  assert.match(workflowRunner, /PostgreSQL CI operation failed/u);
});
