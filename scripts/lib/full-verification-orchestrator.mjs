export const fullVerificationStages = Object.freeze([
  Object.freeze({ id: 'candidate-preflight', name: 'Stage 0 Candidate + integration baseline preflight' }),
  Object.freeze({ id: 'toolchain', name: 'Stage 1 Toolchain verification' }),
  Object.freeze({ id: 'repository-integrity', name: 'Stage 2 Repository integrity' }),
  Object.freeze({ id: 'base-verify', name: 'Stage 3 Base verify gate' }),
  Object.freeze({ id: 'postgresql-composite', name: 'Stage 4 Material PostgreSQL composite' }),
  Object.freeze({ id: 'pbi039-postgresql', name: 'Stage 5 PBI-039 PostgreSQL' }),
  Object.freeze({ id: 'pbi040-postgresql', name: 'Stage 6 PBI-040 PostgreSQL' }),
  Object.freeze({ id: 'pbi041-postgresql', name: 'Stage 7 PBI-041 PostgreSQL' }),
  Object.freeze({ id: 'tl02-postgresql', name: 'Stage 8 TL-02 PostgreSQL' }),
  Object.freeze({ id: 'tl03-postgresql', name: 'Stage 9 TL-03 PostgreSQL' }),
  Object.freeze({ id: 'tl04-postgresql', name: 'Stage 10 TL-04 PostgreSQL' }),
  Object.freeze({ id: 'tl05-postgresql', name: 'Stage 11 TL-05 PostgreSQL' }),
  Object.freeze({ id: 'tl06-postgresql', name: 'Stage 12 TL-06 PostgreSQL' }),
  Object.freeze({ id: 'preview-runtime', name: 'Stage 13 Preview-like PostgreSQL runtime' }),
  Object.freeze({ id: 'smoke-provision', name: 'Stage 14 Provision compiled-smoke PostgreSQL' }),
  Object.freeze({ id: 'smoke-start', name: 'Stage 15 Compiled backend smoke' }),
  Object.freeze({ id: 'smoke-ui', name: 'Stage 16 Compiled UI smoke' }),
  Object.freeze({ id: 'cleanup', name: 'Stage 17 Cleanup proof' }),
  Object.freeze({ id: 'candidate-final', name: 'Stage 18 Final fingerprint + evidence' }),
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
      results.integrationBaseline = await operations.candidatePreflight(fingerprint);
      results.resourcePreflight = await operations.resourcePreflight();
      return fingerprint;
    });
    results.toolchain = await stage('toolchain', operations.toolchain);
    results.integrity = await stage('repository-integrity', operations.integrity);
    results.baseVerify = await stage('base-verify', operations.baseVerify);
    results.postgresql = await stage('postgresql-composite', operations.postgresqlComposite);
    results.pbi039Postgresql = await stage('pbi039-postgresql', operations.pbi039Postgresql);
    results.pbi040Postgresql = await stage('pbi040-postgresql', operations.pbi040Postgresql);
    results.pbi041Postgresql = await stage('pbi041-postgresql', operations.pbi041Postgresql);
    results.tl02Postgresql = await stage('tl02-postgresql', operations.tl02Postgresql);
    results.tl03Postgresql = await stage('tl03-postgresql', operations.tl03Postgresql);
    results.tl04Postgresql = await stage('tl04-postgresql', operations.tl04Postgresql);
    results.tl05Postgresql = await stage('tl05-postgresql', operations.tl05Postgresql);
    results.tl06Postgresql = await stage('tl06-postgresql', operations.tl06Postgresql);
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
    integrationBaseline: results.integrationBaseline ?? null,
    candidateFingerprintBefore: candidateBefore,
    candidateFingerprintAfter: candidateAfter,
    toolchain: results.toolchain ?? null,
    stages: Object.freeze(stageRecords),
    postgresql: Object.freeze({
      composite: results.postgresql ?? null,
      pbi039: results.pbi039Postgresql ?? null,
      pbi040: results.pbi040Postgresql ?? null,
      pbi041: results.pbi041Postgresql ?? null,
      tl02: results.tl02Postgresql ?? null,
      tl03: results.tl03Postgresql ?? null,
      tl04: results.tl04Postgresql ?? null,
      tl05: results.tl05Postgresql ?? null,
      tl06: results.tl06Postgresql ?? null,
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
