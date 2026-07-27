import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import test from 'node:test';

import {
  assertMutationExecution,
  StationMutationCampaignError,
  runStationMutationCampaign,
} from '../scripts/lib/station-semantic-mutation-runner.mjs';
import {
  stationMutationTestFiles,
  stationSemanticMutations,
} from '../scripts/lib/station-semantic-mutations.mjs';

const ambiguousFixture =
  'test/fixtures/station-mutation-harness/ambiguous-targets.test.mjs';
const invalidReporter =
  'test/fixtures/station-mutation-harness/invalid-json-reporter.mjs';
const assertionSignature = Object.freeze({
  errorCode: 'ERR_TEST_FAILURE',
  failureType: 'testCodeFailure',
});

function target(file, fullName) {
  return Object.freeze([
    Object.freeze({
      causalSignature: assertionSignature,
      file,
      fullName,
    }),
  ]);
}

function mutation(id, overrides = {}) {
  const source = stationSemanticMutations.find(({ id: candidate }) =>
    candidate === id);
  assert.ok(source);
  return Object.freeze({ ...source, ...overrides });
}

async function rejectedCampaign(options) {
  try {
    await runStationMutationCampaign({
      verifyFalsePositiveRegression: false,
      ...options,
    });
  } catch (error) {
    assert.ok(error instanceof StationMutationCampaignError);
    return error.report;
  }
  assert.fail('mutation campaign should have failed');
}

function assertRejectedResult(result, classification) {
  assert.equal(result.classification, classification);
  assert.equal(result.killed, false);
  assert.equal(result.causalMatch, false);
  assert.equal(result.cleanupStatus, 'PASS');
  assert.equal(result.childProcessesStatus, 'PASS');
  assert.equal(result.residualWorkspace, false);
  assert.equal(result.workingTreePreserved, true);
  assert.throws(
    () => assertMutationExecution(result),
    new RegExp(classification, 'u'),
  );
}

test('real harness rejects unrelated failures in cases A through E', {
  timeout: 180_000,
}, async (context) => {
  await context.test('A: intentionally wrong approved expected test', async () => {
    const report = await rejectedCampaign({
      mutations: [mutation('MUT-024-01', {
        expectedTests: stationSemanticMutations[23].expectedTests,
      })],
    });
    const [result] = report.results;
    assertRejectedResult(result, 'UNRELATED_TEST_FAILURE');
    assert.deepEqual(result.expectedTestsFailed, []);
    assert.equal(
      result.unexpectedTestsFailed[0].fullName,
      'station lookup never crosses tenant scope',
    );
  });

  await context.test('B: any unrelated test failure is insufficient', async () => {
    const report = await rejectedCampaign({
      mutations: [mutation('MUT-024-24', {
        expectedTests: stationSemanticMutations[0].expectedTests,
      })],
    });
    assertRejectedResult(
      report.results[0],
      'UNRELATED_TEST_FAILURE',
    );
  });

  await context.test('C: an executed passing target is not a failed target', async () => {
    const report = await rejectedCampaign({
      mutations: [mutation('MUT-024-01', {
        expectedTests: stationSemanticMutations[23].expectedTests,
      })],
    });
    const [result] = report.results;
    assertRejectedResult(result, 'UNRELATED_TEST_FAILURE');
    assert.equal(
      result.parsedTestResults.find(({ fullName }) =>
        fullName === 'Revoked is terminal and records the terminal instant')
        ?.status,
      'PASS',
    );
  });

  await context.test('D: substring-similar names never match', async () => {
    const report = await rejectedCampaign({
      mutations: [mutation('MUT-024-01', {
        expectedTests: target(
          ambiguousFixture,
          'station lookup never crosses tenant scope extended',
        ),
      })],
      testFiles: [...stationMutationTestFiles, ambiguousFixture],
    });
    assertRejectedResult(
      report.results[0],
      'UNRELATED_TEST_FAILURE',
    );
  });

  await context.test('E: same name in another file never matches', async () => {
    const report = await rejectedCampaign({
      mutations: [mutation('MUT-024-01', {
        expectedTests: target(
          ambiguousFixture,
          'station lookup never crosses tenant scope',
        ),
      })],
      testFiles: [...stationMutationTestFiles, ambiguousFixture],
    });
    assertRejectedResult(
      report.results[0],
      'UNRELATED_TEST_FAILURE',
    );
  });
});

test('real harness fails closed in cases F through J', {
  timeout: 180_000,
}, async (context) => {
  await context.test('F: invalid structured output is rejected', async () => {
    const report = await rejectedCampaign({
      mutations: [mutation('MUT-024-01', {
        reporterPath: invalidReporter,
      })],
    });
    assertRejectedResult(report.results[0], 'RESULT_PARSE_FAILURE');
  });

  await context.test('G: timeout is rejected', async () => {
    const report = await rejectedCampaign({
      mutations: [mutation('MUT-024-01', { testTimeoutMs: 1 })],
    });
    const [result] = report.results;
    assertRejectedResult(result, 'TIMEOUT');
    assert.equal(result.timeout, true);
  });

  await context.test('H: build failure is rejected', async () => {
    const original = mutation('MUT-024-01');
    const report = await rejectedCampaign({
      mutations: [mutation('MUT-024-01', {
        mutate: (source) =>
          `${original.mutate(source)}\nthis is not valid TypeScript\n`,
      })],
    });
    assertRejectedResult(report.results[0], 'BUILD_FAILURE');
  });

  await context.test('I: a surviving mutation fails the campaign', async () => {
    const report = await rejectedCampaign({
      mutations: [mutation('MUT-024-01', {
        mutate: (source) => `${source}\n`,
      })],
    });
    assertRejectedResult(report.results[0], 'PASS');
  });

  await context.test('J: exact causal death is accepted', async () => {
    const report = await runStationMutationCampaign({
      mutations: [stationSemanticMutations[0]],
      verifyFalsePositiveRegression: false,
    });
    const [result] = report.results;
    assert.equal(result.classification, 'EXPECTED_TEST_FAILURE');
    assert.equal(result.killed, true);
    assert.equal(result.causalMatch, true);
    assert.equal(result.expectedTestsFailed.length, 1);
    assert.equal(result.unexpectedTestsFailed.length, 0);
    assert.equal(result.cleanupStatus, 'PASS');
  });
});

test('real harness rejects working-tree contamination and removes the probe', {
  timeout: 180_000,
}, async () => {
  let sentinel;
  try {
    const report = await rejectedCampaign({
      mutations: [mutation('MUT-024-01', {
        cleanupProbe: async ({ repositoryRoot }) => {
          sentinel = join(
            repositoryRoot,
            `.pbi024-cleanup-contamination-${randomUUID()}`,
          );
          await writeFile(sentinel, 'controlled contamination\n');
        },
      })],
    });
    const [result] = report.results;
    assert.equal(result.classification, 'CLEANUP_FAILURE');
    assert.equal(result.killed, false);
    assert.equal(result.causalMatch, false);
    assert.equal(result.cleanupStatus, 'FAIL');
    assert.equal(result.workingTreePreserved, false);
    assert.equal(result.residualWorkspace, false);
  } finally {
    if (sentinel) {
      await rm(sentinel, { force: true });
    }
  }
});

test('real harness detects and terminates a residual child process', {
  timeout: 180_000,
}, async () => {
  let childPid;
  const report = await rejectedCampaign({
    mutations: [mutation('MUT-024-01', {
      cleanupProbe: async ({ workspace }) => {
        const child = spawn(
          process.execPath,
          [
            '-e',
            'setInterval(() => {}, 1000)',
            workspace,
          ],
          {
            cwd: workspace,
            stdio: 'ignore',
          },
        );
        childPid = child.pid;
        await delay(100);
      },
    })],
  });
  const [result] = report.results;
  assert.equal(result.classification, 'CLEANUP_FAILURE');
  assert.equal(result.killed, false);
  assert.equal(result.causalMatch, false);
  assert.equal(result.cleanupStatus, 'FAIL');
  assert.equal(result.childProcessesStatus, 'FAIL');
  assert.equal(result.residualWorkspace, false);
  assert.equal(result.workingTreePreserved, true);
  assert.ok(Number.isInteger(childPid));
  assert.throws(
    () => process.kill(childPid, 0),
    (error) => error?.code === 'ESRCH',
  );
});
