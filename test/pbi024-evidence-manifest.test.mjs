import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import {
  crossCheckPbi024EvidenceArtifacts,
  crossCheckPbi024MutationMaterial,
  pbi024EvidenceArtifacts,
  pbi024EvidenceContract,
  pbi024EvidenceManifestSchemaVersion,
  pbi024Status,
  validatePbi024EvidenceManifest,
} from '../scripts/lib/pbi024-evidence-manifest.mjs';

const technicalSha = '1'.repeat(40);
const priorDocumentationSha = '2'.repeat(40);
const finalDocumentationSha = '3'.repeat(40);
const materialSha256 = 'a'.repeat(64);
const previousIncorrectSha256 = 'b'.repeat(64);

function artifact({
  event,
  headSha,
  id,
  name,
  runId,
  testedSha,
}) {
  const common = {
    id,
    name,
    workflowRunId: runId,
    event,
    headSha,
    testedSha,
    archiveSha256: `${id % 10}`.repeat(64),
  };
  return name === 'vc024-comparison'
    ? {
        ...common,
        comparisonSha256: `${(id + 1) % 10}`.repeat(64),
        equivalent: true,
      }
    : {
        ...common,
        mutationMaterialSha256: materialSha256,
      };
}

function run({
  event,
  headSha,
  id,
  runId,
  testedSha,
}) {
  return {
    runId,
    event,
    headSha,
    testedSha,
    status: 'SUCCESS',
    artifacts: [
      artifact({
        event,
        headSha,
        id,
        name: 'vc024-run-1',
        runId,
        testedSha,
      }),
      artifact({
        event,
        headSha,
        id: id + 1,
        name: 'vc024-run-2',
        runId,
        testedSha,
      }),
      artifact({
        event,
        headSha,
        id: id + 2,
        name: 'vc024-comparison',
        runId,
        testedSha,
      }),
    ],
  };
}

function phase(headSha, runId, artifactId) {
  return {
    push: run({
      event: 'push',
      headSha,
      id: artifactId,
      runId,
      testedSha: headSha,
    }),
    pullRequest: run({
      event: 'pull_request',
      headSha,
      id: artifactId + 3,
      runId: runId + 1,
      testedSha: 'f'.repeat(40),
    }),
  };
}

function manifest() {
  return {
    schemaVersion: pbi024EvidenceManifestSchemaVersion,
    contract: pbi024EvidenceContract,
    pbi: 'PBI-024',
    branch: 'r0/pbi-024-trusted-station-context',
    pullRequest: {
      number: 3,
      state: 'OPEN',
      draft: true,
      mergeBlockedBy: 'DEC-051 C02',
    },
    identity: {
      technicalImplementationSha: technicalSha,
      priorDocumentationHeadSha: priorDocumentationSha,
      finalDocumentationHeadSha: finalDocumentationSha,
    },
    generatedAtUtc: '2026-07-27T20:00:00.000Z',
    toolchain: {
      node: '24.18.0',
      pnpm: '11.15.1',
      postgresql: '18.4',
    },
    material: {
      algorithm: 'sha256',
      generator:
        'comparableStationMutationManifest(JSON.stringify(material))',
      source: 'MUTATION_MANIFEST.json',
      previousIncorrectSha256,
      sha256: materialSha256,
    },
    causalHarness: {
      mutationMode: 'semantic',
      causalCorrelation: 'structured',
      reporterFormat: 'srtaller-node-test-results/v1',
      expectedTestIdentity: 'file-and-full-name',
      mutationCount: 25,
      killedCount: 25,
      causalMatchCount: 25,
      unrelatedFailureCount: 0,
      survivedCount: 0,
      timeoutCount: 0,
      parserFailureCount: 0,
      infrastructureFailureCount: 0,
      cleanupFailureCount: 0,
      baselineStatus: 'PASS',
      negativeHarnessTests: 'PASS',
      falsePositiveRegression: 'PASS',
      manualMutationDemonstrations: 5,
    },
    ciEvidence: {
      technical: phase(technicalSha, 100, 1000),
      priorDocumentation: phase(priorDocumentationSha, 200, 2000),
      finalDocumentation: phase(finalDocumentationSha, 300, 3000),
    },
    governance: {
      dec051C02:
        'Pending — external platform enforcement unavailable',
      merge: 'BLOCKED',
      pbiStatus: pbi024Status,
    },
    verdict: 'PASS — PBI-024 EVIDENCE RECONCILIATION COMPLETE',
  };
}

test('schema 3 accepts complete PBI-024 evidence and artifact cross-check', () => {
  const evidence = manifest();
  assert.equal(validatePbi024EvidenceManifest(evidence), evidence);
  const actualArtifacts = structuredClone(
    pbi024EvidenceArtifacts(evidence),
  );
  assert.deepEqual(
    crossCheckPbi024EvidenceArtifacts(evidence, actualArtifacts),
    {
      artifacts: 18,
      materialSha256,
      status: 'PASS',
    },
  );
});

test('schema 3 accepts the committed PBI-024 evidence manifest', async () => {
  const evidence = JSON.parse(
    await readFile(
      new URL(
        '../docs/architecture-readiness/pbi-024/evidence/' +
          'EVIDENCE_MANIFEST.json',
        import.meta.url,
      ),
      'utf8',
    ),
  );
  assert.equal(validatePbi024EvidenceManifest(evidence), evidence);
});

const negativeCases = [
  ['incorrect material hash', (value) => {
    value.material.sha256 = 'c'.repeat(64);
  }, /different mutation material hash/u],
  ['short material hash', (value) => {
    value.material.sha256 = 'short';
  }, /must be a SHA-256/u],
  ['missing technical SHA', (value) => {
    delete value.identity.technicalImplementationSha;
  }, /unsupported or missing fields/u],
  ['missing documentation head', (value) => {
    delete value.identity.finalDocumentationHeadSha;
  }, /unsupported or missing fields/u],
  ['missing run', (value) => {
    delete value.ciEvidence.finalDocumentation.push;
  }, /unsupported or missing fields/u],
  ['missing artifact', (value) => {
    value.ciEvidence.technical.push.artifacts.pop();
  }, /exactly three artifacts/u],
  ['duplicate artifact', (value) => {
    value.ciEvidence.technical.push.artifacts[1].id =
      value.ciEvidence.technical.push.artifacts[0].id;
  }, /globally unique/u],
  ['artifact assigned to another run', (value) => {
    value.ciEvidence.technical.push.artifacts[0].workflowRunId += 1;
  }, /wrong workflow run/u],
  ['invalid timestamp', (value) => {
    value.generatedAtUtc = 'not-a-timestamp';
  }, /ISO-8601/u],
  ['inconsistent killed count', (value) => {
    value.causalHarness.killedCount = 24;
  }, /causal harness summary/u],
  ['inconsistent causal count', (value) => {
    value.causalHarness.causalMatchCount = 24;
  }, /causal harness summary/u],
  ['unrelated failure', (value) => {
    value.causalHarness.unrelatedFailureCount = 1;
  }, /causal harness summary/u],
  ['unknown schema version', (value) => {
    value.schemaVersion = 99;
  }, /identity is invalid/u],
  ['unsupported unvalidated field', (value) => {
    value.decorative = true;
  }, /unsupported or missing fields/u],
];

for (const [name, mutate, expected] of negativeCases) {
  test(`schema 3 rejects ${name}`, () => {
    const evidence = manifest();
    mutate(evidence);
    assert.throws(
      () => validatePbi024EvidenceManifest(evidence),
      expected,
    );
  });
}

test('artifact cross-check rejects a hash that differs from real evidence', () => {
  const evidence = manifest();
  const actualArtifacts = structuredClone(
    pbi024EvidenceArtifacts(evidence),
  );
  actualArtifacts[0].mutationMaterialSha256 = 'f'.repeat(64);
  assert.throws(
    () => crossCheckPbi024EvidenceArtifacts(evidence, actualArtifacts),
    /differs at mutationMaterialSha256/u,
  );
});

test('material cross-check rejects a hash that differs from the generator', () => {
  const evidence = manifest();
  assert.deepEqual(
    crossCheckPbi024MutationMaterial(evidence, materialSha256),
    {
      materialSha256,
      status: 'PASS',
    },
  );
  assert.throws(
    () => crossCheckPbi024MutationMaterial(
      evidence,
      'f'.repeat(64),
    ),
    /differs from authoritative evidence/u,
  );
});
