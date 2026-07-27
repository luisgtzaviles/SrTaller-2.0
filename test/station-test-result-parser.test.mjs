import assert from 'node:assert/strict';
import test from 'node:test';

import {
  normalizeStationTestFile,
  parseStationTestResults,
  stationTestReporterFormat,
} from '../scripts/lib/station-test-results.mjs';

const root = '/workspace/repository';

function record(overrides = {}) {
  return {
    file: `${root}/test/example.test.mjs`,
    name: 'exact test name',
    fullName: 'exact test name',
    suitePath: [],
    kind: 'test',
    testId: 1,
    nesting: 0,
    status: 'PASS',
    error: null,
    ...overrides,
  };
}

function document(tests) {
  return JSON.stringify({
    complete: true,
    format: stationTestReporterFormat,
    tests,
  });
}

test('structured parser distinguishes passed, failed and skipped tests', () => {
  const parsed = parseStationTestResults(document([
    record(),
    record({
      name: 'failed',
      fullName: 'failed',
      status: 'FAIL',
      error: {
        name: 'Error',
        code: 'ERR_TEST_FAILURE',
        message: 'expected true',
        stack: 'Error: expected true',
        failureType: 'testCodeFailure',
      },
    }),
    record({
      name: 'skipped',
      fullName: 'skipped',
      status: 'SKIP',
    }),
  ]), { repositoryRoot: root });

  assert.deepEqual(
    parsed.tests.map(({ status }) => status),
    ['PASS', 'FAIL', 'SKIP'],
  );
});

test('structured parser preserves duplicate names for ambiguity checks', () => {
  const parsed = parseStationTestResults(document([
    record(),
    record(),
  ]), { repositoryRoot: root });
  assert.equal(parsed.tests.length, 2);
  assert.equal(parsed.tests[0].fullName, parsed.tests[1].fullName);
});

test('structured parser distinguishes the same name in different files', () => {
  const parsed = parseStationTestResults(document([
    record(),
    record({ file: `${root}/test/other.test.mjs` }),
  ]), { repositoryRoot: root });
  assert.deepEqual(
    parsed.tests.map(({ file }) => file),
    ['test/example.test.mjs', 'test/other.test.mjs'],
  );
});

test('structured parser preserves multiple failures', () => {
  const failure = {
    name: 'Error',
    code: 'ERR_TEST_FAILURE',
    message: 'failure',
    stack: 'Error: failure',
    failureType: 'testCodeFailure',
  };
  const parsed = parseStationTestResults(document([
    record({
      name: 'failure one',
      fullName: 'failure one',
      status: 'FAIL',
      error: failure,
    }),
    record({
      name: 'failure two',
      fullName: 'failure two',
      status: 'FAIL',
      error: failure,
    }),
  ]), { repositoryRoot: root });
  assert.equal(
    parsed.tests.filter(({ status }) => status === 'FAIL').length,
    2,
  );
});

test('structured parser rejects empty and corrupt results', () => {
  assert.throws(
    () => parseStationTestResults('', { repositoryRoot: root }),
    /RESULT_PARSE_EMPTY_OUTPUT/u,
  );
  assert.throws(
    () => parseStationTestResults('{', { repositoryRoot: root }),
    /RESULT_PARSE_INVALID_JSON/u,
  );
  assert.throws(
    () => parseStationTestResults(document([]), { repositoryRoot: root }),
    /RESULT_PARSE_EMPTY_TEST_RESULTS/u,
  );
});

test('structured parser preserves special characters exactly', () => {
  const fullName = 'tenant “á/β” <=> branch [x] (exact)';
  const parsed = parseStationTestResults(document([
    record({ name: fullName, fullName }),
  ]), { repositoryRoot: root });
  assert.equal(parsed.tests[0].fullName, fullName);
});

test('structured parser validates explicit nested suite identities', () => {
  const parsed = parseStationTestResults(document([
    record({
      name: 'duplicate name',
      fullName: 'outer > inner > duplicate name',
      suitePath: ['outer', 'inner'],
      nesting: 2,
    }),
  ]), { repositoryRoot: root });
  assert.deepEqual(parsed.tests[0].suitePath, ['outer', 'inner']);
  assert.equal(
    parsed.tests[0].fullName,
    'outer > inner > duplicate name',
  );

  assert.throws(
    () => parseStationTestResults(document([
      record({
        name: 'duplicate name',
        fullName: 'inner > duplicate name',
        suitePath: ['outer', 'inner'],
        nesting: 2,
      }),
    ]), { repositoryRoot: root }),
    /RESULT_PARSE_INVALID_TEST_IDENTITY/u,
  );
});

test('structured parser normalizes relative, absolute and file URL paths', () => {
  assert.equal(
    normalizeStationTestFile('test/example.test.mjs', root),
    'test/example.test.mjs',
  );
  assert.equal(
    normalizeStationTestFile(`${root}/test/example.test.mjs`, root),
    'test/example.test.mjs',
  );
  assert.equal(
    normalizeStationTestFile(
      'file:///workspace/repository/test/example.test.mjs',
      root,
    ),
    'test/example.test.mjs',
  );
});

test('structured parser preserves multiline stacks and sanitizes workspace paths', () => {
  const stack = `Error: failed\n    at ${root}/test/example.test.mjs:1:1`;
  const parsed = parseStationTestResults(document([
    record({
      status: 'FAIL',
      error: {
        name: 'Error',
        code: 'ERR_TEST_FAILURE',
        message: 'failed',
        stack,
        failureType: 'testCodeFailure',
      },
    }),
  ]), { repositoryRoot: root });
  assert.equal(
    parsed.tests[0].error.stack,
    'Error: failed\n    at <workspace>/test/example.test.mjs:1:1',
  );
});

test('structured parser rejects records with inconsistent status and error', () => {
  assert.throws(
    () => parseStationTestResults(document([
      record({ status: 'FAIL' }),
    ]), { repositoryRoot: root }),
    /RESULT_PARSE_FAILED_TEST_WITHOUT_ERROR/u,
  );
  assert.throws(
    () => parseStationTestResults(document([
      record({
        error: {
          name: 'Error',
          code: null,
          message: 'unexpected',
          stack: '',
          failureType: null,
        },
      }),
    ]), { repositoryRoot: root }),
    /RESULT_PARSE_NON_FAILED_TEST_WITH_ERROR/u,
  );
});
