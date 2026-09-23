import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import {
  AUTHORITATIVE_DISPATCH_NORMAL_MODE,
  TIER2_CONTRACT,
  TIER2_SHADOW_DISPATCH_MODE,
  TIER2_SHADOW_MODE,
  TIER2_TRUSTED_REPOSITORY,
  classifyManagedResources,
  compareTier2Legs,
  createTier2Attestation,
  estimateTier2Cost,
  isRetryableTier2PreBootstrapTransportError,
  parseOwnerScopedDiagnostics,
  tier2ResourceLabels,
  validateAuthoritativeDispatchMode,
  validateTier2ControlPlane,
  validateTier2Invocation,
  validateTier2RecoveryInvocation,
  validateTier2ServerProfile,
} from '../scripts/lib/tier2-authoritative-ci.mjs';
import { selectSubjectAttestationArtifact } from '../scripts/lib/work-unit.mjs';

const controllerSha = 'a'.repeat(40);
const dependencySubjectSha = 'b'.repeat(40);

function trustedInvocation(overrides = {}) {
  return {
    controllerSha,
    dependencySubjectSha,
    environmentAuthorized: true,
    eventName: 'workflow_dispatch',
    liveMainSha: controllerSha,
    ref: 'refs/heads/main',
    repository: TIER2_TRUSTED_REPOSITORY,
    requested: true,
    testedSha: dependencySubjectSha,
    ...overrides,
  };
}

test('explicit dispatch modes preserve normal authority and require an exact shadow subject', () => {
  assert.deepEqual(validateAuthoritativeDispatchMode({
    eventName: 'workflow_dispatch',
    mode: AUTHORITATIVE_DISPATCH_NORMAL_MODE,
  }), {
    authoritative: true,
    mode: 'normal',
    testedSha: null,
    tier2ShadowOnly: false,
  });
  assert.deepEqual(validateAuthoritativeDispatchMode({
    eventName: 'workflow_dispatch',
    mode: TIER2_SHADOW_DISPATCH_MODE,
    testedSha: controllerSha,
  }), {
    authoritative: false,
    mode: 'tier2-shadow',
    testedSha: controllerSha,
    tier2ShadowOnly: true,
  });
  assert.throws(
    () => validateAuthoritativeDispatchMode({
      eventName: 'workflow_dispatch',
      mode: TIER2_SHADOW_DISPATCH_MODE,
    }),
    /testedSha/u,
  );
  assert.throws(
    () => validateAuthoritativeDispatchMode({
      eventName: 'push',
      mode: TIER2_SHADOW_DISPATCH_MODE,
      testedSha: controllerSha,
    }),
    /restricted to workflow_dispatch/u,
  );
  assert.throws(
    () => validateAuthoritativeDispatchMode({
      eventName: 'workflow_dispatch',
      mode: 'implicit-shadow',
    }),
    /mode is invalid/u,
  );
});

function runnerEvidence({ leg = 'run-1', serverId = 1 } = {}) {
  return {
    contract: TIER2_CONTRACT,
    full: {
      candidateFingerprintAfter: { candidateSha256: 'candidate' },
      cleanup: { status: 'PASS', containers: 0 },
      failedStage: null,
      postgresql: { composite: { tests: 91 }, tl07: { tests: 3 } },
      smoke: {
        provision: {
          container: `random-${leg}`,
          database: `random-${leg}`,
          imageDigest: 'sha256:postgres',
          label: `random-${leg}`,
          migration: { applied: 89, pending: 0, manifestHash: 'manifest' },
          port: leg === 'run-1' ? '41001' : '42001',
          postgres: '18.4',
        },
        start: { startup: 'PASS', shutdown: 'PASS' },
        ui: { status: 'PASS' },
      },
      stages: [{ id: 'candidate-preflight', status: 'PASS', durationMs: 123 }],
      toolchain: { node: '24.18.0', pnpm: '11.15.1', status: 'PASS' },
      verdict: 'PASS',
      warnings: [],
    },
    leg,
    provider: {
      placementGroupId: 91,
      serverId,
    },
    testedSha: dependencySubjectSha,
  };
}

test('trusted Tier-2 invocation accepts only protected current main and one explicit subject', () => {
  assert.deepEqual(
    validateTier2Invocation({
      ...trustedInvocation(),
    }),
    {
      authoritative: false,
      controllerSha,
      eventName: 'workflow_dispatch',
      liveMainSha: controllerSha,
      mode: TIER2_SHADOW_MODE,
      ref: 'refs/heads/main',
      repository: TIER2_TRUSTED_REPOSITORY,
      testedSha: dependencySubjectSha,
    },
  );
  for (const eventName of ['pull_request', 'pull_request_target']) {
    assert.throws(
      () => validateTier2Invocation(trustedInvocation({
        eventName,
        ref: 'refs/pull/7/merge',
      })),
      /restricted/u,
    );
  }
  assert.throws(
    () => validateTier2Invocation(trustedInvocation({
      testedSha: 'c'.repeat(40),
    })),
    /not the current controller or authorized dependency/u,
  );
  assert.throws(
    () => validateTier2Invocation(trustedInvocation({
      liveMainSha: 'd'.repeat(40),
      testedSha: controllerSha,
    })),
    /must equal live remote main/u,
  );
});

test('shadow eligibility is independent of hosted FULL results but remains explicitly requested', () => {
  for (const hostedResult of ['success', 'failure']) {
    const result = validateTier2Invocation(trustedInvocation({ hostedResult }));
    assert.equal(result.mode, 'SHADOW');
    assert.equal(result.authoritative, false);
  }
  assert.throws(
    () => validateTier2Invocation(trustedInvocation({ requested: false })),
    /explicit governed request/u,
  );
});

test('shadow eligibility fails closed for fork, non-main, untrusted controller, and missing Environment authorization', () => {
  assert.throws(
    () => validateTier2Invocation(trustedInvocation({ repository: undefined })),
    /trusted upstream repository/u,
  );
  assert.throws(
    () => validateTier2Invocation(trustedInvocation({ repository: 'fork/SrTaller-2.0' })),
    /trusted upstream repository/u,
  );
  assert.throws(
    () => validateTier2Invocation(trustedInvocation({ ref: 'refs/heads/feature/untrusted' })),
    /refs\/heads\/main/u,
  );
  assert.throws(
    () => validateTier2Invocation(trustedInvocation({ liveMainSha: 'c'.repeat(40) })),
    /must equal live remote main/u,
  );
  assert.throws(
    () => validateTier2Invocation(trustedInvocation({ environmentAuthorized: false })),
    /protected Environment authorization/u,
  );
  assert.throws(
    () => validateTier2ControlPlane(trustedInvocation({ eventName: 'push' })),
    /restricted to workflow_dispatch/u,
  );
});

test('resource labels carry TTL and orphan classifier fails closed on expired resources', () => {
  const labels = tier2ResourceLabels({
    controllerSha,
    expiresAtEpoch: 2_000,
    runId: '123-1',
  });
  assert.equal(labels['managed-by'], 'srtaller-authoritative-ci');
  assert.equal(labels['expires-at'], '2000');
  assert.deepEqual(
    classifyManagedResources([
      { id: 1, kind: 'server', labels, name: 'one' },
      { id: 2, kind: 'server', labels: { ...labels, 'expires-at': '3000' }, name: 'two' },
    ], 2_500).map(({ state }) => state),
    ['EXPIRED_ORPHAN', 'ACTIVE_OR_UNKNOWN'],
  );
});

test('explicit residual recovery is bound to trusted live main and a single run identity', () => {
  assert.deepEqual(validateTier2RecoveryInvocation({
    controllerSha,
    environmentAuthorized: true,
    eventName: 'workflow_dispatch',
    liveMainSha: controllerSha,
    recoveryRunId: '35841981493-1',
    ref: 'refs/heads/main',
    repository: TIER2_TRUSTED_REPOSITORY,
  }), {
    controllerSha,
    liveMainSha: controllerSha,
    recoveryRunId: '35841981493-1',
  });
  assert.throws(
    () => validateTier2RecoveryInvocation({
      controllerSha,
      environmentAuthorized: true,
      eventName: 'workflow_dispatch',
      liveMainSha: controllerSha,
      recoveryRunId: '../../all',
      ref: 'refs/heads/main',
      repository: TIER2_TRUSTED_REPOSITORY,
    }),
    /run identity is invalid/u,
  );
  assert.throws(
    () => validateTier2RecoveryInvocation({
      controllerSha,
      environmentAuthorized: true,
      eventName: 'push',
      liveMainSha: controllerSha,
      recoveryRunId: '35841981493-1',
      ref: 'refs/heads/main',
      repository: TIER2_TRUSTED_REPOSITORY,
    }),
    /restricted to workflow_dispatch/u,
  );
});

test('pre-bootstrap recovery recognizes only bounded SSH transport failures', () => {
  assert.equal(isRetryableTier2PreBootstrapTransportError({
    code: 255,
    stderr: 'Connection timed out during banner exchange',
  }), true);
  assert.equal(isRetryableTier2PreBootstrapTransportError({
    code: 1,
    stderr: 'test failure',
  }), false);
  assert.equal(isRetryableTier2PreBootstrapTransportError({
    code: 255,
    stderr: 'Permission denied (publickey)',
  }), false);
});

test('provider profile validation rejects silent shared-CPU or placement drift', () => {
  const server = {
    image: { name: 'ubuntu-24.04' },
    location: { name: 'hel1' },
    placement_group: { id: 91 },
    server_type: {
      architecture: 'x86',
      cores: 4,
      cpu_type: 'dedicated',
      disk: 160,
      memory: 16,
      name: 'ccx23',
    },
  };
  assert.equal(validateTier2ServerProfile(server, 91), server);
  assert.throws(
    () => validateTier2ServerProfile({
      ...server,
      server_type: { ...server.server_type, cpu_type: 'shared' },
    }, 91),
    /approved dedicated profile/u,
  );
  assert.throws(() => validateTier2ServerProfile(server, 92), /approved dedicated profile/u);
});

test('two distinct spread-host legs compare semantically while ignoring volatile smoke identity', () => {
  const comparison = compareTier2Legs(
    runnerEvidence(),
    runnerEvidence({ leg: 'run-2', serverId: 2 }),
  );
  assert.equal(comparison.equivalent, true);
  assert.equal(comparison.testedSha, dependencySubjectSha);
  assert.throws(
    () => compareTier2Legs(runnerEvidence(), runnerEvidence({ leg: 'run-2', serverId: 1 })),
    /distinct servers/u,
  );
  const failed = runnerEvidence({ leg: 'run-2', serverId: 2 });
  failed.full.verdict = 'FAIL';
  assert.throws(() => compareTier2Legs(runnerEvidence(), failed), /incomplete or failed/u);
});

test('attestation binds controller, subject, run and comparison without claiming promotion early', () => {
  const comparison = compareTier2Legs(
    runnerEvidence(),
    runnerEvidence({ leg: 'run-2', serverId: 2 }),
  );
  const attestation = createTier2Attestation({
    comparison,
    controllerSha,
    runAttempt: '1',
    runId: '1234',
    testedSha: dependencySubjectSha,
    workflow: 'Authoritative Linux CI',
  });
  assert.equal(attestation.controllerSha, controllerSha);
  assert.equal(attestation.testedSha, dependencySubjectSha);
  assert.equal(attestation.mode, 'SHADOW');
  assert.equal(attestation.authoritative, false);
  assert.equal(attestation.promotionGate, 'NOT_APPLICABLE_SHADOW');
});

test('shadow evidence cannot satisfy authoritative promotion or Work Unit closure', async () => {
  const workflow = await readFile('.github/workflows/authoritative-linux-ci.yml', 'utf8');
  const tier2Job = workflow.slice(workflow.indexOf('  tier2-shadow:'), workflow.indexOf('  promotion-gate:'));
  const promotionGate = workflow.slice(workflow.indexOf('  promotion-gate:'));
  assert.doesNotMatch(promotionGate, /tier2-shadow/u);
  assert.match(promotionGate, /tier2_shadow_only != 'true'/u);
  assert.doesNotMatch(tier2Job, /compare-authoritative-gates\.result/u);
  assert.throws(
    () => selectSubjectAttestationArtifact([{
      expired: false,
      id: 1,
      name: 'tier2-shadow-123-1',
      workflow_run: { id: 123 },
    }], '123'),
    /exactly one authoritative subject attestation artifact/u,
  );
});

test('cost projection enforces the approved monthly guard without changing compute profile', () => {
  assert.equal(estimateTier2Cost({ elapsedMs: 90 * 60_000 }).status, 'WITHIN_GUARD');
  assert.equal(estimateTier2Cost({ elapsedMs: 100 * 60 * 60_000 }).status, 'GUARD_EXCEEDED');
});

test('owner-scoped log parser requires all eight bounded child timings', () => {
  const header = 'PostgreSQL owner-scoped timing: pull=100ms container-start=200ms campaign=3000ms mode=serial-fresh-database';
  const lines = Array.from({ length: 8 }, (_, index) =>
    `PostgreSQL owner-scoped file timing: test/file-${index}.test.mjs total=${100 + index}ms test=80ms database-create=10ms database-drop=10ms`,
  );
  const result = parseOwnerScopedDiagnostics([header, ...lines].join('\n'));
  assert.equal(result.ownerScoped.runs[0].fileTimings.length, 8);
  assert.equal(result.ownerScoped.executionMode, 'serial-fresh-database');
  assert.throws(
    () => parseOwnerScopedDiagnostics([header, ...lines.slice(0, 7)].join('\n')),
    /incomplete/u,
  );
});

test('workflow and bootstrap mechanically preserve the public-repository trust boundary', async () => {
  const [workflow, sweep, bootstrap, orchestrator] = await Promise.all([
    readFile('.github/workflows/authoritative-linux-ci.yml', 'utf8'),
    readFile('.github/workflows/authoritative-ci-orphan-sweep.yml', 'utf8'),
    readFile('scripts/ci/tier2-bootstrap.sh', 'utf8'),
    readFile('scripts/run-tier2-authoritative-ci.mjs', 'utf8'),
  ]);
  const hostedJob = workflow.slice(workflow.indexOf('  authoritative-gate:'), workflow.indexOf('  compare-authoritative-gates:'));
  const comparisonJob = workflow.slice(workflow.indexOf('  compare-authoritative-gates:'), workflow.indexOf('  tier2-shadow-context:'));
  const contextJob = workflow.slice(workflow.indexOf('  tier2-shadow-context:'), workflow.indexOf('  tier2-shadow:'));
  const tier2Job = workflow.slice(workflow.indexOf('  tier2-shadow:'), workflow.indexOf('  promotion-gate:'));
  const promotionGate = workflow.slice(workflow.indexOf('  promotion-gate:'));
  assert.match(workflow, /mode:\s*\n\s*description:[^\n]+\n\s*default: normal[\s\S]*- tier2-shadow/u);
  assert.match(workflow, /resolve-authoritative-dispatch-mode\.mjs/u);
  assert.match(hostedJob, /tier2_shadow_only != 'true'/u);
  assert.match(comparisonJob, /tier2_shadow_only != 'true'/u);
  assert.match(contextJob, /tier2_shadow_only == 'true'/u);
  assert.match(contextJob, /validate-tier2-shadow-context\.mjs/u);
  assert.doesNotMatch(contextJob, /HCLOUD_TOKEN|environment: authoritative-ci/u);
  assert.match(tier2Job, /tier2-shadow-context/u);
  assert.match(tier2Job, /tier2_shadow_only == 'true'/u);
  assert.doesNotMatch(tier2Job, /authoritative-gate|compare-authoritative-gates|promotion-gate/u);
  assert.doesNotMatch(tier2Job, /compare-authoritative-gates/u);
  assert.doesNotMatch(tier2Job, /pull_request_target/u);
  assert.match(tier2Job, /environment: authoritative-ci/u);
  assert.match(tier2Job, /permissions:\s*\n\s*contents: read/u);
  assert.match(tier2Job, /HCLOUD_TOKEN: \$\{\{ secrets\.HCLOUD_TOKEN \}\}/u);
  assert.match(tier2Job, /actions\/checkout@[0-9a-f]{40}/u);
  assert.match(tier2Job, /actions\/setup-node@[0-9a-f]{40}/u);
  assert.match(tier2Job, /actions\/upload-artifact@[0-9a-f]{40}/u);
  assert.match(promotionGate, /tier2_shadow_only != 'true'/u);
  assert.doesNotMatch(promotionGate, /^\s+- tier2-shadow\s*$/mu);
  assert.match(workflow, /force_full="workflow-dispatch"/u);
  assert.match(sweep, /schedule:/u);
  assert.match(sweep, /--sweep-expired/u);
  assert.match(sweep, /--sweep-run-id/u);
  assert.match(bootstrap, /NODE_VERSION="24\.18\.0"/u);
  assert.match(bootstrap, /PNPM_VERSION="11\.15\.1"/u);
  assert.match(bootstrap, /ubuntu/u);
  assert.match(bootstrap, /24\.04/u);
  assert.match(bootstrap, /x86_64/u);
  assert.match(bootstrap, /verify:full/u);
  assert.doesNotMatch(bootstrap, /HCLOUD_TOKEN/u);
  assert.match(orchestrator, /placement_group/u);
  assert.match(orchestrator, /source_ips/u);
  assert.match(orchestrator, /managed resources remain after cleanup/u);
  assert.match(orchestrator, /expected: \[200, 204, 404\]/u);
  assert.match(orchestrator, /refuses to delete a run with a remaining server/u);
  assert.match(orchestrator, /pre-bootstrap transport recovery 1\/1/u);
  assert.match(orchestrator, /authoritative: false/u);
  assert.match(orchestrator, /mode: TIER2_SHADOW_MODE/u);
});
