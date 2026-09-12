import assert from 'node:assert/strict';
import test from 'node:test';

import {
  evaluateIntegrationBaseline,
  evaluateMaterializedPreviewGenealogy,
  evaluateProtectedSurfaces,
  PBI039_MATERIALIZED_PREVIEW_SHA,
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

test('materialized Preview is recorded as an ancestor of the integrated PBI-039 baseline', () => {
  const result = evaluateMaterializedPreviewGenealogy({
    materializedPreviewSha: PBI039_MATERIALIZED_PREVIEW_SHA,
    integratedBaselineSha: PBI040_REQUIRED_BASELINE_SHA,
    materializedIsAncestor: true,
  });
  assert.equal(result.materializedPreviewSha, PBI039_MATERIALIZED_PREVIEW_SHA);
  assert.equal(result.materializedPreviewIsAncestorOfIntegratedBaseline, true);
  assert.throws(() => evaluateMaterializedPreviewGenealogy({
    materializedPreviewSha: PBI039_MATERIALIZED_PREVIEW_SHA,
    integratedBaselineSha: PBI040_REQUIRED_BASELINE_SHA,
    materializedIsAncestor: false,
  }), /is not an ancestor/u);
});

test('protected-surface inventory accepts the exact accepted PBI-039 blobs', () => {
  const result = evaluateProtectedSurfaces(PBI039_PROTECTED_SURFACES);
  assert.equal(result.status, 'PASS');
  assert.equal(result.protectedSurfaceCount, 20);
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
