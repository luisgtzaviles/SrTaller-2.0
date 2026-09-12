export const fullVerificationStages = Object.freeze([
  Object.freeze({ id: 'candidate-preflight', name: 'Stage 0 Candidate preflight + initial fingerprint' }),
  Object.freeze({ id: 'toolchain', name: 'Stage 1 Toolchain verification' }),
  Object.freeze({ id: 'repository-integrity', name: 'Stage 2 Repository integrity' }),
  Object.freeze({ id: 'base-verify', name: 'Stage 3 Base verify gate' }),
  Object.freeze({ id: 'postgresql-composite', name: 'Stage 4 Material PostgreSQL composite' }),
  Object.freeze({ id: 'pbi039-postgresql', name: 'Stage 5 PBI-039 PostgreSQL' }),
  Object.freeze({ id: 'pbi040-postgresql', name: 'Stage 6 PBI-040 PostgreSQL' }),
  Object.freeze({ id: 'preview-runtime', name: 'Stage 7 Preview-like PostgreSQL runtime' }),
  Object.freeze({ id: 'smoke-provision', name: 'Stage 8 Provision compiled-smoke PostgreSQL' }),
  Object.freeze({ id: 'smoke-start', name: 'Stage 9 Compiled backend smoke' }),
  Object.freeze({ id: 'smoke-ui', name: 'Stage 10 Compiled UI smoke' }),
  Object.freeze({ id: 'cleanup', name: 'Stage 11 Cleanup proof' }),
  Object.freeze({ id: 'candidate-final', name: 'Stage 12 Final fingerprint + evidence' }),
]);

export function renderFullVerificationSummary(evidence) {
  const lines = [
    '',
    'Full Verification stage summary',
    ...evidence.stages.map(({ name, status, durationMs }) =>
      `${status.padEnd(4)}  ${name}  ${durationMs}ms`,
    ),
    `Warnings: ${evidence.warnings.map(({ code, disposition }) => `${code} (${disposition})`).join(', ') || 'NONE'}`,
    `Cleanup: ${evidence.cleanup.status ?? 'UNKNOWN'}`,
    `Candidate: ${evidence.candidateFingerprintAfter?.candidateSha256 ?? 'UNAVAILABLE'}`,
    `Evidence: ${evidence.evidencePath}`,
    `Verdict: ${evidence.verdict}`,
  ];
  return lines.join('\n');
}

export function assertExternalEvidenceDirectory(repositoryRoot, evidenceDirectory) {
  const normalizedRoot = repositoryRoot.endsWith('/')
    ? repositoryRoot
    : `${repositoryRoot}/`;
  if (
    evidenceDirectory === repositoryRoot ||
    evidenceDirectory.startsWith(normalizedRoot)
  ) {
    throw new Error('Full Verification evidence directory must be outside the repository');
  }
  return evidenceDirectory;
}

function safeError(error) {
  return Object.freeze({
    name: typeof error?.name === 'string' ? error.name : 'Error',
    code:
      typeof error?.code === 'string' || typeof error?.code === 'number'
        ? String(error.code)
        : 'FULL_VERIFICATION_STAGE_FAILED',
    message:
      typeof error?.message === 'string'
        ? error.message
        : 'Full Verification stage failed',
  });
}

function elapsed(started, finished) {
  return Math.max(0, finished.getTime() - started.getTime());
}

export async function runFullVerificationCampaign({
  campaignId,
  evidencePath,
  now = () => new Date(),
  operations,
  output = (line) => process.stdout.write(`${line}\n`),
  writeEvidence,
}) {
  const startedAt = now();
  const stageRecords = [];
  let candidateBefore = null;
  let candidateAfter = null;
  let smoke = null;
  let failedStage = null;
  let failure = null;
  let cleanup = Object.freeze({ status: 'NOT_RUN' });
  const results = {};

  async function stage(id, action) {
    const definition = fullVerificationStages.find((item) => item.id === id);
    if (!definition) throw new Error(`Unknown Full Verification stage: ${id}`);
    const stageStartedAt = now();
    output(`[START] ${definition.name}`);
    try {
      const result = await action();
      const stageFinishedAt = now();
      stageRecords.push(Object.freeze({
        id,
        name: definition.name,
        status: 'PASS',
        durationMs: elapsed(stageStartedAt, stageFinishedAt),
      }));
      output(`[PASS] ${definition.name} (${elapsed(stageStartedAt, stageFinishedAt)}ms)`);
      return result;
    } catch (error) {
      const stageFinishedAt = now();
      failedStage ??= id;
      failure ??= safeError(error);
      stageRecords.push(Object.freeze({
        id,
        name: definition.name,
        status: 'FAIL',
        durationMs: elapsed(stageStartedAt, stageFinishedAt),
        error: safeError(error),
      }));
      output(`[FAIL] ${definition.name} (${elapsed(stageStartedAt, stageFinishedAt)}ms)`);
      throw error;
    }
  }

  try {
    candidateBefore = await stage('candidate-preflight', async () => {
      const fingerprint = await operations.candidateFingerprint();
      candidateBefore = fingerprint;
      await operations.candidatePreflight(fingerprint);
      results.resourcePreflight = await operations.resourcePreflight();
      return fingerprint;
    });
    results.toolchain = await stage('toolchain', operations.toolchain);
    results.integrity = await stage('repository-integrity', operations.integrity);
    results.baseVerify = await stage('base-verify', operations.baseVerify);
    results.postgresql = await stage('postgresql-composite', operations.postgresqlComposite);
    results.pbi039Postgresql = await stage('pbi039-postgresql', operations.pbi039Postgresql);
    results.pbi040Postgresql = await stage('pbi040-postgresql', operations.pbi040Postgresql);
    results.previewRuntime = await stage('preview-runtime', operations.previewRuntime);
    smoke = await stage('smoke-provision', operations.smokeProvision);
    results.smokeProvision = smoke.evidence;
    results.smokeStart = await stage('smoke-start', () => smoke.smokeStart());
    results.smokeUi = await stage('smoke-ui', () => smoke.smokeUi());
  } catch {
    // Fail-fast: only mandatory cleanup, final fingerprint and evidence follow.
  }

  try {
    cleanup = await stage('cleanup', () => operations.cleanup(smoke));
  } catch {
    cleanup = Object.freeze({ status: 'FAIL' });
  }

  try {
    candidateAfter = await stage('candidate-final', async () => {
      const fingerprint = await operations.candidateFingerprint();
      candidateAfter = fingerprint;
      if (candidateBefore !== null) {
        operations.assertCandidateStable(candidateBefore, fingerprint);
      }
      return fingerprint;
    });
  } catch {
    // Failure is already recorded by stage().
  }

  const finishedAt = now();
  const verdict = failure === null ? 'PASS' : 'FAIL';
  const evidence = Object.freeze({
    schemaVersion: 1,
    campaignId,
    startedAt: startedAt.toISOString(),
    finishedAt: finishedAt.toISOString(),
    baseHead: candidateBefore?.baseHead ?? candidateAfter?.baseHead ?? null,
    candidateFingerprintBefore: candidateBefore,
    candidateFingerprintAfter: candidateAfter,
    toolchain: results.toolchain ?? null,
    stages: Object.freeze(stageRecords),
    postgresql: Object.freeze({
      composite: results.postgresql ?? null,
      pbi039: results.pbi039Postgresql ?? null,
      pbi040: results.pbi040Postgresql ?? null,
      previewRuntime: results.previewRuntime ?? null,
    }),
    smoke: Object.freeze({
      provision: results.smokeProvision ?? null,
      start: results.smokeStart ?? null,
      ui: results.smokeUi ?? null,
    }),
    warnings: Object.freeze([
      Object.freeze({
        code: 'VITE_MAIN_CHUNK_OVER_500_KB',
        disposition: 'ACCEPTED WARNING',
      }),
    ]),
    cleanup,
    failedStage,
    failure,
    evidencePath,
    verdict,
  });

  try {
    await writeEvidence(evidencePath, evidence);
  } catch (error) {
    if (failure === null) {
      failedStage = 'candidate-final';
      failure = safeError(error);
    }
    throw error;
  }

  if (failure !== null) {
    const error = new Error(`Full Verification failed at ${failedStage}`);
    error.code = 'FULL_VERIFICATION_FAILED';
    error.evidence = evidence;
    throw error;
  }
  return evidence;
}
