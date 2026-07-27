import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { resolve } from 'node:path';
import { promisify } from 'node:util';
import test from 'node:test';

import {
  parseStationTestResults,
  stationTestReporterFormat,
} from '../scripts/lib/station-test-results.mjs';

const execute = promisify(execFile);
const reporter = resolve('scripts/lib/node-test-json-reporter.mjs');
const nestedA = 'test/fixtures/node-test-reporter/nested-a.test.mjs';
const nestedB = 'test/fixtures/node-test-reporter/nested-b.test.mjs';
const failures = 'test/fixtures/node-test-reporter/failures.test.mjs';

async function reporterRun(files) {
  const environment = { ...process.env };
  delete environment.NODE_TEST_CONTEXT;
  try {
    const { stdout } = await execute(process.execPath, [
      '--test',
      '--test-isolation=none',
      `--test-reporter=${reporter}`,
      ...files,
    ], {
      cwd: process.cwd(),
      encoding: 'utf8',
      env: environment,
    });
    return { code: 0, stdout };
  } catch (error) {
    return {
      code: typeof error.code === 'number' ? error.code : -1,
      stdout: error.stdout ?? '',
    };
  }
}

test('reporter composes deterministic identities for nested suites', async () => {
  const first = await reporterRun([nestedA, nestedB]);
  const second = await reporterRun([nestedA, nestedB]);
  assert.equal(first.code, 0);
  assert.deepEqual(JSON.parse(first.stdout), JSON.parse(second.stdout));

  const document = JSON.parse(first.stdout);
  assert.equal(document.format, stationTestReporterFormat);
  assert.equal(document.complete, true);
  const parsed = parseStationTestResults(first.stdout);
  const duplicateTests = parsed.tests.filter(({ kind, name }) =>
    kind === 'test' && name === 'duplicate name');
  assert.deepEqual(
    duplicateTests.map(({ file, fullName }) => [file, fullName]).sort(),
    [
      [nestedA, 'outer > inner > duplicate name'],
      [nestedA, 'outer > sibling > duplicate name'],
      [nestedB, 'other outer > inner > duplicate name'],
    ],
  );
});

test('reporter distinguishes hook, suite and direct test failures', async () => {
  const execution = await reporterRun([failures]);
  assert.equal(execution.code, 1);
  const parsed = parseStationTestResults(execution.stdout);

  const hookFailure = parsed.tests.find(({ name }) => name === 'hook target');
  assert.equal(hookFailure.kind, 'test');
  assert.equal(hookFailure.fullName, 'broken suite > hook target');
  assert.equal(hookFailure.error.failureType, 'hookFailed');

  const suiteFailure = parsed.tests.find(({ name }) => name === 'broken suite');
  assert.equal(suiteFailure.kind, 'suite');
  assert.equal(suiteFailure.error.failureType, 'subtestsFailed');

  const directFailure = parsed.tests.find(
    ({ name }) => name === 'direct test failure',
  );
  assert.equal(directFailure.kind, 'test');
  assert.equal(directFailure.fullName, 'direct test failure');
  assert.equal(directFailure.error.failureType, 'testCodeFailure');
});
