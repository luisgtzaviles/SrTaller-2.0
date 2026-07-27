import assert from 'node:assert/strict';
import test from 'node:test';

import {
  assertMutationExecution,
  runStationMutationCampaign,
} from '../scripts/lib/station-semantic-mutation-runner.mjs';
import {
  stationSemanticMutations,
} from '../scripts/lib/station-semantic-mutations.mjs';

function validResult(overrides = {}) {
  return {
    applied: true,
    cleanupComplete: true,
    compile: { code: 0, timedOut: false },
    expectedFailureObserved: true,
    residualFile: false,
    test: { code: 1, timedOut: false },
    workingTreePreserved: true,
    ...overrides,
  };
}

test('semantic mutation harness rejects invalid execution outcomes', () => {
  for (const [overrides, code] of [
    [{ applied: false }, 'MUTATION_NOT_APPLIED'],
    [{ compile: { code: 2, timedOut: false } }, 'MUTATION_DID_NOT_COMPILE'],
    [{ test: { code: 0, timedOut: false } }, 'MUTATION_SURVIVED'],
    [{ expectedFailureObserved: false }, 'MUTATION_UNRELATED_FAILURE'],
    [{ test: { code: -1, timedOut: true } }, 'MUTATION_TIMEOUT'],
    [{ cleanupComplete: false }, 'MUTATION_CLEANUP_INCOMPLETE'],
    [{ residualFile: true }, 'MUTATION_RESIDUAL_FILE'],
    [{ workingTreePreserved: false }, 'MUTATION_WORKTREE_CONTAMINATED'],
  ]) {
    assert.throws(
      () => assertMutationExecution(validResult(overrides)),
      new RegExp(code, 'u'),
    );
  }
});

test('all governed Station mutations compile and are killed semantically', {
  timeout: 900_000,
}, async () => {
  assert.equal(stationSemanticMutations.length, 25);
  assert.equal(
    new Set(stationSemanticMutations.map(({ id }) => id)).size,
    25,
  );
  const report = await runStationMutationCampaign();
  assert.equal(report.mode, 'semantic');
  assert.equal(report.total, 25);
  assert.equal(report.killed, 25);
  assert.equal(report.survived, 0);
  assert.equal(report.results.every(({ compile }) => compile.code === 0), true);
  assert.equal(
    report.results.every(({ expectedFailureObserved }) =>
      expectedFailureObserved),
    true,
  );
  assert.equal(
    report.results.every(({ cleanupComplete }) => cleanupComplete),
    true,
  );
});
