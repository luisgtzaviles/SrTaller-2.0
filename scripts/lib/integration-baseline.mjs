import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execute = promisify(execFile);

export const PBI040_REQUIRED_BASELINE_SHA = '40684d7554cdf02551f941e5e3f0beabbe563125';
export const PBI039_MATERIALIZED_PREVIEW_SHA = '0d1c5760ce962d17a8292b841f5de43a8cb453a7';
export const DEFAULT_INTEGRATION_REF = 'origin/main';
export const PBI039_PROTECTED_SURFACES = Object.freeze({
  'apps/dev-preview-web/src/pages/RepairsPage.tsx': 'e2d877dae9d229d65cb30cf0f0fe4b7bdfb5ee90',
  'apps/dev-preview-web/src/pages/NewRepairPage.tsx': '831d4afaac2c10335a38d10d37fef46aa30eca59',
  'apps/dev-preview-web/src/pages/RepairDetailPage.tsx': '3aeb21915fae079b879e71e5e67a490324330e05',
  'apps/dev-preview-web/src/pages/pages.module.css': '87049e6bf541c7b4b1b0ba005cade84f8f9594f3',
  'apps/dev-preview-web/src/api.ts': '3a7c93f4f1597dbef9bbbfcc916dcd3cb7afe226',
  'src/modules/repairs/presentation/repairs.controller.ts': '46b9170ff3d9badedd3897a26a33019ae4f2f001',
  'src/modules/repairs/infrastructure/persistence/kysely-repair.repository.ts': 'd35e9646cff0982004a38e338ec38a2561cb00bf',
  'src/modules/repairs/application/repair-protected-operations.ts': 'f42cad5aa9669b7aca26b2e9cb8460593f261a9f',
  'src/modules/repairs/application/use-cases/get-repair-detail.use-case.ts': 'b9f1e19fc49a996c9ba77b691596c548fdae2db3',
  'test/repair-detail-contract.test.mjs': 'fa9b26bebeca5d2a43691ac0de59bc19fea49d3d',
  'test/repair-detail-evidence-contract.test.mjs': '155177d27728067a9c217f309c4da5cad3a2307f',
  'test/repair-detail-future-concepts-surface.test.mjs': 'e56956beea98c9e409e2c55425a8316981f61402',
  'test/repair-detail-history-information-architecture.test.mjs': '9603ac8f07030ab3085e4e2bb8fca763fd6f0057',
  'test/repair-detail-operational-header.test.mjs': 'e7916c856037034f3d08335e71245ad077770c58',
  'test/repair-detail-reception-information-architecture.test.mjs': '429af0f10764a4baa4ea65831c6606260d900bf4',
  'test/new-repair-owner-iteration-contract.test.mjs': '3b1dbc40cf691893d9371baffaa9547f05998e5e',
  'scripts/lib/pbi039-repair-detail-parity-fixture.mjs': 'e890bdc088d6cc9e9fbcfb01e0b48d90aa463d12',
  'scripts/lib/repair-detail-parity-contract.mjs': 'f35225ed14e4e8099defc36687fad0e1ebf1c6f2',
  'scripts/verify-repair-detail-parity.mjs': '601fdd66cedcb271f6d5b22a8462f1ffa01fd733',
  'test/repair-detail-parity-fixture.test.mjs': 'a29c8e5d65c03c338d7e4cc16315ca200144dc28',
});

async function git(root, argumentsList) {
  const { stdout } = await execute('git', argumentsList, {
    cwd: root,
    encoding: 'utf8',
    maxBuffer: 10 * 1024 * 1024,
  });
  return stdout.trim();
}

export function evaluateIntegrationBaseline({
  baselineSha,
  branchHead,
  integrationHead,
  mergeBase,
  baselineIsAncestor,
}) {
  if (!baselineIsAncestor) {
    throw new Error(`Candidate does not contain required integrated baseline ${baselineSha}`);
  }
  if (mergeBase !== integrationHead) {
    throw new Error(
      `Candidate is behind the integration branch: merge-base ${mergeBase} != integration head ${integrationHead}`,
    );
  }
  return Object.freeze({
    status: 'PASS',
    baselineSha,
    branchHead,
    integrationHead,
    mergeBase,
    baselineIsAncestor: true,
    branchContainsCurrentIntegrationHead: true,
  });
}

export function evaluateProtectedSurfaces(actual, expected = PBI039_PROTECTED_SURFACES) {
  const changed = Object.entries(expected)
    .filter(([path, blob]) => actual[path] !== blob)
    .map(([path, blob]) => Object.freeze({ path, expectedBlob: blob, actualBlob: actual[path] ?? null }));
  if (changed.length > 0) {
    throw new Error(`Accepted PBI-039 protected surfaces changed: ${changed.map(({ path }) => path).join(', ')}`);
  }
  return Object.freeze({ status: 'PASS', protectedSurfaceCount: Object.keys(expected).length });
}

export function evaluateMaterializedPreviewGenealogy({
  materializedPreviewSha,
  integratedBaselineSha,
  materializedIsAncestor,
}) {
  if (!materializedIsAncestor) {
    throw new Error(
      `Materialized Preview ${materializedPreviewSha} is not an ancestor of integrated baseline ${integratedBaselineSha}`,
    );
  }
  return Object.freeze({
    materializedPreviewSha,
    materializedPreviewIsAncestorOfIntegratedBaseline: true,
  });
}

async function inspectProtectedSurfaces(root) {
  const actual = {};
  for (const path of Object.keys(PBI039_PROTECTED_SURFACES)) {
    actual[path] = await git(root, ['hash-object', '--', path]);
  }
  return evaluateProtectedSurfaces(actual);
}

export async function inspectIntegrationBaseline(
  root = process.cwd(),
  {
    baselineSha = PBI040_REQUIRED_BASELINE_SHA,
    integrationRef = DEFAULT_INTEGRATION_REF,
  } = {},
) {
  const [branchHead, integrationHead, mergeBase] = await Promise.all([
    git(root, ['rev-parse', 'HEAD']),
    git(root, ['rev-parse', integrationRef]),
    git(root, ['merge-base', 'HEAD', integrationRef]),
  ]);
  let baselineIsAncestor = true;
  let materializedIsAncestor = true;
  try {
    await git(root, ['merge-base', '--is-ancestor', baselineSha, 'HEAD']);
  } catch {
    baselineIsAncestor = false;
  }
  try {
    await git(root, [
      'merge-base',
      '--is-ancestor',
      PBI039_MATERIALIZED_PREVIEW_SHA,
      baselineSha,
    ]);
  } catch {
    materializedIsAncestor = false;
  }
  const ancestry = evaluateIntegrationBaseline({
    baselineSha,
    branchHead,
    integrationHead,
    mergeBase,
    baselineIsAncestor,
  });
  const protectedSurfaces = await inspectProtectedSurfaces(root);
  const materialized = evaluateMaterializedPreviewGenealogy({
    materializedPreviewSha: PBI039_MATERIALIZED_PREVIEW_SHA,
    integratedBaselineSha: baselineSha,
    materializedIsAncestor,
  });
  return Object.freeze({ ...ancestry, ...materialized, ...protectedSurfaces });
}
