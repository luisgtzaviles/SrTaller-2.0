export const pbi024EvidenceManifestSchemaVersion = 3;
export const pbi024EvidenceContract =
  'PBI-024/EVIDENCE-RECONCILIATION';
export const pbi024Branch = 'r0/pbi-024-trusted-station-context';
export const pbi024Status =
  'In review — evidence reconciled; formal verification pending; ' +
  'functional merge blocked by DEC-051 C02';

const sha1Pattern = /^[0-9a-f]{40}$/u;
const sha256Pattern = /^[0-9a-f]{64}$/u;

function assertObject(value, label) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(`${label} must be an object`);
  }
}

function assertExactKeys(value, keys, label) {
  assertObject(value, label);
  const actual = Object.keys(value).sort();
  const expected = [...keys].sort();
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(`${label} has unsupported or missing fields`);
  }
}

function assertSha1(value, label) {
  if (!sha1Pattern.test(value)) {
    throw new Error(`${label} must be a full Git SHA-1`);
  }
}

function assertSha256(value, label) {
  if (!sha256Pattern.test(value)) {
    throw new Error(`${label} must be a SHA-256`);
  }
}

function assertPositiveInteger(value, label) {
  if (!Number.isInteger(value) || value < 1) {
    throw new Error(`${label} must be a positive integer`);
  }
}

function assertIsoTimestamp(value, label) {
  if (
    typeof value !== 'string' ||
    !value.endsWith('Z') ||
    Number.isNaN(Date.parse(value))
  ) {
    throw new Error(`${label} must be an ISO-8601 UTC timestamp`);
  }
}

function validateExecutionArtifact(artifact, run, materialSha256, label) {
  assertExactKeys(artifact, [
    'archiveSha256',
    'event',
    'headSha',
    'id',
    'mutationMaterialSha256',
    'name',
    'testedSha',
    'workflowRunId',
  ], label);
  if (!['vc024-run-1', 'vc024-run-2'].includes(artifact.name)) {
    throw new Error(`${label}.name is not an execution artifact`);
  }
  assertSha256(artifact.archiveSha256, `${label}.archiveSha256`);
  assertSha256(
    artifact.mutationMaterialSha256,
    `${label}.mutationMaterialSha256`,
  );
  if (artifact.mutationMaterialSha256 !== materialSha256) {
    throw new Error(`${label} declares a different mutation material hash`);
  }
  validateArtifactAssignment(artifact, run, label);
}

function validateComparisonArtifact(artifact, run, label) {
  assertExactKeys(artifact, [
    'archiveSha256',
    'comparisonSha256',
    'equivalent',
    'event',
    'headSha',
    'id',
    'name',
    'testedSha',
    'workflowRunId',
  ], label);
  if (
    artifact.name !== 'vc024-comparison' ||
    artifact.equivalent !== true
  ) {
    throw new Error(`${label} must be an equivalent comparison artifact`);
  }
  assertSha256(artifact.archiveSha256, `${label}.archiveSha256`);
  assertSha256(artifact.comparisonSha256, `${label}.comparisonSha256`);
  validateArtifactAssignment(artifact, run, label);
}

function validateArtifactAssignment(artifact, run, label) {
  assertPositiveInteger(artifact.id, `${label}.id`);
  assertPositiveInteger(artifact.workflowRunId, `${label}.workflowRunId`);
  assertSha1(artifact.headSha, `${label}.headSha`);
  assertSha1(artifact.testedSha, `${label}.testedSha`);
  if (
    artifact.workflowRunId !== run.runId ||
    artifact.event !== run.event ||
    artifact.headSha !== run.headSha ||
    artifact.testedSha !== run.testedSha
  ) {
    throw new Error(`${label} is assigned to the wrong workflow run`);
  }
}

function validateRun(run, {
  event,
  expectedHeadSha,
  materialSha256,
  label,
}) {
  assertExactKeys(run, [
    'artifacts',
    'event',
    'headSha',
    'runId',
    'status',
    'testedSha',
  ], label);
  assertPositiveInteger(run.runId, `${label}.runId`);
  assertSha1(run.headSha, `${label}.headSha`);
  assertSha1(run.testedSha, `${label}.testedSha`);
  if (
    run.event !== event ||
    run.headSha !== expectedHeadSha ||
    run.status !== 'SUCCESS'
  ) {
    throw new Error(`${label} identity or status is invalid`);
  }
  if (
    (event === 'push' && run.testedSha !== run.headSha) ||
    (event === 'pull_request' && run.testedSha === run.headSha)
  ) {
    throw new Error(`${label}.testedSha does not match its event semantics`);
  }
  if (!Array.isArray(run.artifacts) || run.artifacts.length !== 3) {
    throw new Error(`${label} must declare exactly three artifacts`);
  }
  const byName = new Map(run.artifacts.map((artifact) => [
    artifact.name,
    artifact,
  ]));
  if (
    byName.size !== 3 ||
    !byName.has('vc024-run-1') ||
    !byName.has('vc024-run-2') ||
    !byName.has('vc024-comparison')
  ) {
    throw new Error(`${label} artifact names are incomplete or duplicated`);
  }
  validateExecutionArtifact(
    byName.get('vc024-run-1'),
    run,
    materialSha256,
    `${label}.artifacts[vc024-run-1]`,
  );
  validateExecutionArtifact(
    byName.get('vc024-run-2'),
    run,
    materialSha256,
    `${label}.artifacts[vc024-run-2]`,
  );
  validateComparisonArtifact(
    byName.get('vc024-comparison'),
    run,
    `${label}.artifacts[vc024-comparison]`,
  );
}

function validateCiPhase(phase, {
  expectedHeadSha,
  materialSha256,
  label,
}) {
  assertExactKeys(phase, ['pullRequest', 'push'], label);
  validateRun(phase.push, {
    event: 'push',
    expectedHeadSha,
    materialSha256,
    label: `${label}.push`,
  });
  validateRun(phase.pullRequest, {
    event: 'pull_request',
    expectedHeadSha,
    materialSha256,
    label: `${label}.pullRequest`,
  });
}

export function pbi024EvidenceArtifacts(manifest) {
  return [
    ...manifest.ciEvidence.technical.push.artifacts,
    ...manifest.ciEvidence.technical.pullRequest.artifacts,
    ...manifest.ciEvidence.priorDocumentation.push.artifacts,
    ...manifest.ciEvidence.priorDocumentation.pullRequest.artifacts,
    ...manifest.ciEvidence.finalDocumentation.push.artifacts,
    ...manifest.ciEvidence.finalDocumentation.pullRequest.artifacts,
  ];
}

export function validatePbi024EvidenceManifest(manifest) {
  assertExactKeys(manifest, [
    'branch',
    'causalHarness',
    'ciEvidence',
    'contract',
    'generatedAtUtc',
    'governance',
    'identity',
    'material',
    'pbi',
    'pullRequest',
    'schemaVersion',
    'toolchain',
    'verdict',
  ], 'manifest');
  if (
    manifest.schemaVersion !== pbi024EvidenceManifestSchemaVersion ||
    manifest.contract !== pbi024EvidenceContract ||
    manifest.pbi !== 'PBI-024' ||
    manifest.branch !== pbi024Branch
  ) {
    throw new Error('PBI-024 evidence manifest identity is invalid');
  }
  assertIsoTimestamp(manifest.generatedAtUtc, 'generatedAtUtc');

  assertExactKeys(manifest.pullRequest, [
    'draft',
    'mergeBlockedBy',
    'number',
    'state',
  ], 'pullRequest');
  if (
    manifest.pullRequest.number !== 3 ||
    manifest.pullRequest.state !== 'OPEN' ||
    manifest.pullRequest.draft !== true ||
    manifest.pullRequest.mergeBlockedBy !== 'DEC-051 C02'
  ) {
    throw new Error('PBI-024 pull request governance is invalid');
  }

  assertExactKeys(manifest.identity, [
    'finalDocumentationHeadSha',
    'priorDocumentationHeadSha',
    'technicalImplementationSha',
  ], 'identity');
  for (const [label, sha] of Object.entries(manifest.identity)) {
    assertSha1(sha, `identity.${label}`);
  }
  if (
    new Set(Object.values(manifest.identity)).size !==
      Object.values(manifest.identity).length
  ) {
    throw new Error('PBI-024 technical and documentation SHAs must be distinct');
  }

  assertExactKeys(manifest.toolchain, [
    'node',
    'pnpm',
    'postgresql',
  ], 'toolchain');
  if (
    manifest.toolchain.node !== '24.18.0' ||
    manifest.toolchain.pnpm !== '11.15.1' ||
    manifest.toolchain.postgresql !== '18.4'
  ) {
    throw new Error('PBI-024 evidence toolchain is invalid');
  }

  assertExactKeys(manifest.material, [
    'algorithm',
    'generator',
    'previousIncorrectSha256',
    'sha256',
    'source',
  ], 'material');
  if (
    manifest.material.algorithm !== 'sha256' ||
    manifest.material.generator !==
      'comparableStationMutationManifest(JSON.stringify(material))' ||
    manifest.material.source !== 'MUTATION_MANIFEST.json'
  ) {
    throw new Error('PBI-024 material hash derivation is invalid');
  }
  assertSha256(
    manifest.material.previousIncorrectSha256,
    'material.previousIncorrectSha256',
  );
  assertSha256(manifest.material.sha256, 'material.sha256');
  if (
    manifest.material.previousIncorrectSha256 === manifest.material.sha256
  ) {
    throw new Error('PBI-024 corrected material hash must differ from history');
  }

  assertExactKeys(manifest.causalHarness, [
    'baselineStatus',
    'causalCorrelation',
    'causalMatchCount',
    'cleanupFailureCount',
    'expectedTestIdentity',
    'falsePositiveRegression',
    'infrastructureFailureCount',
    'killedCount',
    'manualMutationDemonstrations',
    'mutationCount',
    'mutationMode',
    'negativeHarnessTests',
    'parserFailureCount',
    'reporterFormat',
    'survivedCount',
    'timeoutCount',
    'unrelatedFailureCount',
  ], 'causalHarness');
  const harness = manifest.causalHarness;
  if (
    harness.mutationMode !== 'semantic' ||
    harness.causalCorrelation !== 'structured' ||
    harness.reporterFormat !== 'srtaller-node-test-results/v1' ||
    harness.expectedTestIdentity !== 'file-and-full-name' ||
    harness.mutationCount !== 25 ||
    harness.killedCount !== 25 ||
    harness.causalMatchCount !== harness.killedCount ||
    harness.killedCount > harness.mutationCount ||
    harness.unrelatedFailureCount !== 0 ||
    harness.survivedCount !== 0 ||
    harness.timeoutCount !== 0 ||
    harness.parserFailureCount !== 0 ||
    harness.infrastructureFailureCount !== 0 ||
    harness.cleanupFailureCount !== 0 ||
    harness.baselineStatus !== 'PASS' ||
    harness.negativeHarnessTests !== 'PASS' ||
    harness.falsePositiveRegression !== 'PASS' ||
    harness.manualMutationDemonstrations !== 5
  ) {
    throw new Error('PBI-024 causal harness summary is inconsistent');
  }

  assertExactKeys(manifest.ciEvidence, [
    'finalDocumentation',
    'priorDocumentation',
    'technical',
  ], 'ciEvidence');
  validateCiPhase(manifest.ciEvidence.technical, {
    expectedHeadSha: manifest.identity.technicalImplementationSha,
    materialSha256: manifest.material.sha256,
    label: 'ciEvidence.technical',
  });
  validateCiPhase(manifest.ciEvidence.priorDocumentation, {
    expectedHeadSha: manifest.identity.priorDocumentationHeadSha,
    materialSha256: manifest.material.sha256,
    label: 'ciEvidence.priorDocumentation',
  });
  validateCiPhase(manifest.ciEvidence.finalDocumentation, {
    expectedHeadSha: manifest.identity.finalDocumentationHeadSha,
    materialSha256: manifest.material.sha256,
    label: 'ciEvidence.finalDocumentation',
  });
  const artifactIds = pbi024EvidenceArtifacts(manifest).map(({ id }) => id);
  if (new Set(artifactIds).size !== artifactIds.length) {
    throw new Error('PBI-024 artifact IDs must be globally unique');
  }

  assertExactKeys(manifest.governance, [
    'dec051C02',
    'merge',
    'pbiStatus',
  ], 'governance');
  if (
    manifest.governance.dec051C02 !==
      'Pending — external platform enforcement unavailable' ||
    manifest.governance.merge !== 'BLOCKED' ||
    manifest.governance.pbiStatus !== pbi024Status
  ) {
    throw new Error('PBI-024 governance state is invalid');
  }
  if (manifest.verdict !== 'PASS — PBI-024 EVIDENCE RECONCILIATION COMPLETE') {
    throw new Error('PBI-024 evidence reconciliation verdict is invalid');
  }
  return manifest;
}

export function crossCheckPbi024EvidenceArtifacts(
  manifest,
  actualArtifacts,
) {
  validatePbi024EvidenceManifest(manifest);
  if (!Array.isArray(actualArtifacts)) {
    throw new Error('Actual PBI-024 artifacts must be an array');
  }
  const declared = pbi024EvidenceArtifacts(manifest);
  if (actualArtifacts.length !== declared.length) {
    throw new Error('PBI-024 artifact cross-check is incomplete');
  }
  const actualById = new Map(actualArtifacts.map((artifact) => [
    artifact.id,
    artifact,
  ]));
  if (actualById.size !== actualArtifacts.length) {
    throw new Error('Actual PBI-024 artifact IDs must be unique');
  }
  for (const expected of declared) {
    const actual = actualById.get(expected.id);
    if (!actual) {
      throw new Error(`PBI-024 artifact ${expected.id} is missing`);
    }
    for (const [field, value] of Object.entries(expected)) {
      if (actual[field] !== value) {
        throw new Error(
          `PBI-024 artifact ${expected.id} differs at ${field}`,
        );
      }
    }
  }
  return Object.freeze({
    artifacts: declared.length,
    materialSha256: manifest.material.sha256,
    status: 'PASS',
  });
}

export function crossCheckPbi024MutationMaterial(
  manifest,
  mutationMaterialSha256,
) {
  validatePbi024EvidenceManifest(manifest);
  assertSha256(
    mutationMaterialSha256,
    'authoritative mutation material SHA-256',
  );
  if (manifest.material.sha256 !== mutationMaterialSha256) {
    throw new Error(
      'PBI-024 manifest material hash differs from authoritative evidence',
    );
  }
  return Object.freeze({
    materialSha256: mutationMaterialSha256,
    status: 'PASS',
  });
}
