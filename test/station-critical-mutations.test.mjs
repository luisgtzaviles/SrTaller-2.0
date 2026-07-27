import assert from 'node:assert/strict';
import test from 'node:test';

import {
  assertMutationExecution,
  runStationMutationCampaign,
} from '../scripts/lib/station-semantic-mutation-runner.mjs';
import {
  stationSemanticMutations,
} from '../scripts/lib/station-semantic-mutations.mjs';

test('mutation assertion accepts only a causal expected test failure', () => {
  assert.doesNotThrow(() => assertMutationExecution({
    applied: true,
    buildStatus: 'PASS',
    causalMatch: true,
    classification: 'EXPECTED_TEST_FAILURE',
    cleanupStatus: 'PASS',
    expectedTestsFailed: [{ file: 'test/a.test.mjs', fullName: 'target' }],
    infrastructureFailure: false,
    killed: true,
    testProcessStatus: 'TEST_FAILURE',
    timeout: false,
  }));
  for (const classification of [
    'PASS',
    'UNRELATED_TEST_FAILURE',
    'BUILD_FAILURE',
    'TEST_DISCOVERY_FAILURE',
    'INFRASTRUCTURE_FAILURE',
    'TIMEOUT',
    'MUTATION_NOT_APPLIED',
    'RESULT_PARSE_FAILURE',
    'CLEANUP_FAILURE',
  ]) {
    assert.throws(
      () => assertMutationExecution({ classification }),
      new RegExp(classification, 'u'),
    );
  }
});

test('all governed Station mutations compile and die causally', {
  timeout: 900_000,
}, async () => {
  assert.equal(stationSemanticMutations.length, 25);
  assert.equal(
    new Set(stationSemanticMutations.map(({ id }) => id)).size,
    25,
  );
  const report = await runStationMutationCampaign();
  assert.equal(report.mode, 'semantic');
  assert.equal(report.causalCorrelation, 'structured');
  assert.equal(report.expectedTestIdentity, 'file-and-full-name');
  assert.equal(report.baselineStatus, 'PASS');
  assert.equal(report.baseline.inventory.length, 34);
  assert.equal(report.total, 25);
  assert.equal(report.killed, 25);
  assert.equal(report.survived, 0);
  assert.equal(report.unrelatedFailureCount, 0);
  assert.equal(report.unexpectedTestFailureCount, 0);
  assert.equal(report.parserFailureCount, 0);
  assert.equal(report.timeoutCount, 0);
  assert.equal(report.infrastructureFailureCount, 0);
  assert.equal(report.falsePositiveRegressionStatus, 'PASS');
  assert.equal(report.negativeHarnessTests, 'PASS');
  assert.equal(report.workspaceCleanup, 'PASS');
  assert.equal(
    report.results.every(({ classification }) =>
      classification === 'EXPECTED_TEST_FAILURE'),
    true,
  );
  assert.equal(
    report.results.every(({ buildStatus }) => buildStatus === 'PASS'),
    true,
  );
  assert.equal(
    report.results.every(({ causalMatch }) => causalMatch),
    true,
  );
  assert.equal(
    report.results.every(({ cleanupStatus }) => cleanupStatus === 'PASS'),
    true,
  );
});
