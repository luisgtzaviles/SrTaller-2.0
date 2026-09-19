import assert from 'node:assert/strict';
import test from 'node:test';

import {
  applyAuthorizedProtectedSurfaceChanges,
  CURRENT_PROTECTED_SURFACES,
  evaluateIntegrationBaseline,
  evaluateMaterializedPreviewGenealogy,
  evaluateProtectedSurfaces,
  PBI039_MATERIALIZED_PREVIEW_SHA,
  PBI039_PROTECTED_SURFACES,
  PBI041_AUTHORIZED_PROTECTED_SURFACE_CHANGES,
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

test('protected-surface inventory accepts PBI-039 plus the exact authorized PBI-041 API blob', () => {
  const result = evaluateProtectedSurfaces(CURRENT_PROTECTED_SURFACES);
  assert.equal(result.status, 'PASS');
  assert.equal(result.protectedSurfaceCount, 20);
  assert.deepEqual(PBI041_AUTHORIZED_PROTECTED_SURFACE_CHANGES, [
    {
      path: 'apps/dev-preview-web/src/api.ts',
      previousBlob: '3a7c93f4f1597dbef9bbbfcc916dcd3cb7afe226',
      authorizedBlob: 'f1e9a33f9a7dc534e223eee37bb1b234feafb35b',
      owner: 'PBI-041',
      decision: 'FV-GATE-REMEDIATION',
      reason: 'Add typed PreviewApiError.parameter metadata for actionable bulk validation.',
    },
  ]);
});

test('protected-surface inventory still rejects unrelated protected-surface drift by path', () => {
  assert.throws(() => evaluateProtectedSurfaces({
    ...CURRENT_PROTECTED_SURFACES,
    'apps/dev-preview-web/src/pages/RepairDetailPage.tsx': 'changed',
  }), /RepairDetailPage\.tsx/u);
});

test('protected-surface authorization rejects unknown and wildcard paths', () => {
  const exactChange = PBI041_AUTHORIZED_PROTECTED_SURFACE_CHANGES[0];
  assert.throws(() => applyAuthorizedProtectedSurfaceChanges(
    PBI039_PROTECTED_SURFACES,
    [{ ...exactChange, path: 'apps/dev-preview-web/src/another-api.ts' }],
  ), /outside the governed inventory/u);
  assert.throws(() => applyAuthorizedProtectedSurfaceChanges(
    PBI039_PROTECTED_SURFACES,
    [{ ...exactChange, path: 'apps/dev-preview-web/src/*.ts' }],
  ), /must use an exact path/u);
});

test('protected-surface inventory rejects a mutation after the authorized PBI-041 API blob', () => {
  assert.throws(() => evaluateProtectedSurfaces({
    ...CURRENT_PROTECTED_SURFACES,
    'apps/dev-preview-web/src/api.ts': 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
  }), /apps\/dev-preview-web\/src\/api\.ts/u);
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
