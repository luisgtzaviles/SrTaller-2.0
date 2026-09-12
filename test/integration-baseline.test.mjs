import assert from 'node:assert/strict';
import test from 'node:test';

import {
  evaluateIntegrationBaseline,
  evaluateProtectedSurfaces,
  PBI039_PROTECTED_SURFACES,
  PBI040_REQUIRED_BASELINE_SHA,
} from '../scripts/lib/integration-baseline.mjs';

const branchHead = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
const currentMain = 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb';

test('baseline preflight accepts ancestry plus the current integration head', () => {
  const result = evaluateIntegrationBaseline({
    baselineSha: PBI040_REQUIRED_BASELINE_SHA,
    branchHead,
    integrationHead: currentMain,
    mergeBase: currentMain,
    baselineIsAncestor: true,
  });
  assert.equal(result.status, 'PASS');
  assert.equal(result.branchContainsCurrentIntegrationHead, true);
});

test('protected-surface inventory accepts the exact accepted PBI-039 blobs', () => {
  const result = evaluateProtectedSurfaces(PBI039_PROTECTED_SURFACES);
  assert.equal(result.status, 'PASS');
  assert.equal(result.protectedSurfaceCount, 16);
});

test('protected-surface inventory reports any drift by path', () => {
  assert.throws(() => evaluateProtectedSurfaces({
    ...PBI039_PROTECTED_SURFACES,
    'apps/dev-preview-web/src/pages/RepairDetailPage.tsx': 'changed',
  }), /RepairDetailPage\.tsx/u);
});

test('baseline preflight fails when the required integrated baseline is absent', () => {
  assert.throws(() => evaluateIntegrationBaseline({
    baselineSha: PBI040_REQUIRED_BASELINE_SHA,
    branchHead,
    integrationHead: currentMain,
    mergeBase: currentMain,
    baselineIsAncestor: false,
  }), /does not contain required integrated baseline/u);
});

test('baseline preflight fails when origin main advanced past the feature branch', () => {
  assert.throws(() => evaluateIntegrationBaseline({
    baselineSha: PBI040_REQUIRED_BASELINE_SHA,
    branchHead,
    integrationHead: currentMain,
    mergeBase: PBI040_REQUIRED_BASELINE_SHA,
    baselineIsAncestor: true,
  }), /Candidate is behind the integration branch/u);
});
