import { createHash } from 'node:crypto';

export const TIER2_CONTRACT = 'SR_TALLER_TIER2_AUTHORITATIVE_V1';
export const TIER2_SHADOW_MODE = 'SHADOW';
export const AUTHORITATIVE_DISPATCH_NORMAL_MODE = 'normal';
export const TIER2_SHADOW_DISPATCH_MODE = 'tier2-shadow';
export const TIER2_TRUSTED_REPOSITORY = 'luisgtzaviles/SrTaller-2.0';
export const TIER2_BOOTSTRAP_VERSION = 'ubuntu-24.04-x86_64-v1';
export const TIER2_PROVIDER = 'hetzner-cloud';
export const TIER2_LOCATION = 'hel1';
export const TIER2_SERVER_TYPE = 'ccx23';
export const TIER2_HOURLY_USD = 0.1626;
export const TIER2_MONTHLY_GUARD_USD = 25;
export const TIER2_TTL_MINUTES = 90;
export const TL07_SUBJECT_SHA = '0e6193e4afa6ebe35accdac7b58e69fa992d9c43';

const shaPattern = /^[0-9a-f]{40}$/u;
const allowedEvents = new Set(['push', 'workflow_dispatch']);
const allowedDispatchModes = new Set([
  AUTHORITATIVE_DISPATCH_NORMAL_MODE,
  TIER2_SHADOW_DISPATCH_MODE,
]);

function requireSha(value, label) {
  if (!shaPattern.test(value ?? '')) {
    throw new Error(`${label} must be a full lowercase Git SHA`);
  }
  return value;
}

function requireString(value, label) {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new Error(`${label} must be a non-empty string`);
  }
  return value;
}

function sha256(value) {
  return createHash('sha256').update(value).digest('hex');
}

export function validateAuthoritativeDispatchMode({ eventName, mode, testedSha }) {
  requireString(eventName, 'eventName');
  const normalizedMode = mode || AUTHORITATIVE_DISPATCH_NORMAL_MODE;
  if (!allowedDispatchModes.has(normalizedMode)) {
    throw new Error('authoritative workflow dispatch mode is invalid');
  }
  if (eventName !== 'workflow_dispatch' && normalizedMode !== AUTHORITATIVE_DISPATCH_NORMAL_MODE) {
    throw new Error('Tier-2 shadow mode is restricted to workflow_dispatch');
  }
  if (normalizedMode === TIER2_SHADOW_DISPATCH_MODE) {
    requireSha(testedSha, 'testedSha');
  }
  return Object.freeze({
    authoritative: normalizedMode === AUTHORITATIVE_DISPATCH_NORMAL_MODE,
    mode: normalizedMode,
    testedSha: testedSha || null,
    tier2ShadowOnly: normalizedMode === TIER2_SHADOW_DISPATCH_MODE,
  });
}

export function validateTier2ControlPlane({
  controllerSha,
  dependencySubjectSha,
  eventName,
  liveMainSha,
  ref,
  repository,
  testedSha,
}) {
  requireSha(controllerSha, 'controllerSha');
  requireSha(liveMainSha, 'liveMainSha');
  requireSha(testedSha, 'testedSha');
  if (!allowedEvents.has(eventName)) {
    throw new Error('Tier-2 provisioning is restricted to push or workflow_dispatch');
  }
  if (eventName !== 'workflow_dispatch') {
    throw new Error('Tier-2 material shadow is restricted to workflow_dispatch');
  }
  if (repository !== TIER2_TRUSTED_REPOSITORY) {
    throw new Error('Tier-2 provisioning is restricted to the trusted upstream repository');
  }
  if (ref !== 'refs/heads/main') {
    throw new Error('Tier-2 provisioning is restricted to refs/heads/main');
  }
  if (controllerSha !== liveMainSha) {
    throw new Error('Tier-2 controller SHA must equal live remote main');
  }
  const allowedSubjects = new Set([controllerSha]);
  if (dependencySubjectSha) {
    allowedSubjects.add(requireSha(dependencySubjectSha, 'dependencySubjectSha'));
  }
  if (!allowedSubjects.has(testedSha)) {
    throw new Error('testedSha is not the current controller or authorized dependency subject');
  }
  return Object.freeze({
    authoritative: false,
    controllerSha,
    eventName,
    liveMainSha,
    mode: TIER2_SHADOW_MODE,
    ref,
    repository,
    testedSha,
  });
}

export function validateTier2Invocation({
  controllerSha,
  dependencySubjectSha,
  environmentAuthorized,
  eventName,
  liveMainSha,
  ref,
  repository,
  requested,
  testedSha,
}) {
  if (requested !== true) {
    throw new Error('Tier-2 shadow requires an explicit governed request');
  }
  if (environmentAuthorized !== true) {
    throw new Error('Tier-2 shadow requires protected Environment authorization');
  }
  return validateTier2ControlPlane({
    controllerSha,
    dependencySubjectSha,
    eventName,
    liveMainSha,
    ref,
    repository,
    testedSha,
  });
}

export function tier2ResourceLabels({ controllerSha, expiresAtEpoch, runId }) {
  requireSha(controllerSha, 'controllerSha');
  requireString(runId, 'runId');
  if (!Number.isSafeInteger(expiresAtEpoch) || expiresAtEpoch <= 0) {
    throw new Error('expiresAtEpoch must be a positive integer');
  }
  return Object.freeze({
    'controller-sha': controllerSha,
    'expires-at': String(expiresAtEpoch),
    'managed-by': 'srtaller-authoritative-ci',
    'run-id': runId,
  });
}

export function validateTier2ServerProfile(server, placementGroupId) {
  if (
    server?.server_type?.name !== TIER2_SERVER_TYPE ||
    server.server_type.architecture !== 'x86' ||
    server.server_type.cpu_type !== 'dedicated' ||
    server.server_type.cores !== 4 ||
    server.server_type.memory !== 16 ||
    server.server_type.disk < 160 ||
    server.location?.name !== TIER2_LOCATION ||
    server.image?.name !== 'ubuntu-24.04' ||
    server.placement_group?.id !== placementGroupId
  ) {
    throw new Error('Provisioned Tier-2 server does not match the approved dedicated profile');
  }
  return server;
}

export function classifyManagedResources(resources, nowEpoch) {
  if (!Number.isSafeInteger(nowEpoch) || nowEpoch <= 0) {
    throw new Error('nowEpoch must be a positive integer');
  }
  return Object.freeze(resources.map((resource) => {
    const expiresAt = Number(resource.labels?.['expires-at']);
    return Object.freeze({
      id: resource.id,
      kind: resource.kind,
      name: resource.name,
      state:
        Number.isSafeInteger(expiresAt) && expiresAt <= nowEpoch
          ? 'EXPIRED_ORPHAN'
          : 'ACTIVE_OR_UNKNOWN',
    });
  }));
}

export function parseOwnerScopedDiagnostics(log) {
  if (typeof log !== 'string') throw new Error('verification log must be a string');
  const campaign = /PostgreSQL owner-scoped timing: pull=(\d+)ms container-start=(\d+)ms campaign=(\d+)ms mode=([^\s]+)/u.exec(log);
  const files = [...log.matchAll(
    /PostgreSQL owner-scoped file timing: ([^\s]+) total=(\d+)ms test=(\d+)ms database-create=(\d+)ms database-drop=(\d+)ms/gu,
  )];
  if (!campaign || files.length !== 8) {
    throw new Error('owner-scoped runtime diagnostics are incomplete');
  }
  return Object.freeze({
    contract: 'SR_TALLER_POSTGRESQL_RUNTIME_DIAGNOSTICS_V1',
    ownerScoped: Object.freeze({
      containerStartMs: Number(campaign[2]),
      executionMode: campaign[4],
      imagePullMs: Number(campaign[1]),
      runs: Object.freeze([Object.freeze({
        fileTimings: Object.freeze(files.map((match) => Object.freeze({
          databaseCreateMs: Number(match[4]),
          databaseDropMs: Number(match[5]),
          file: match[1],
          testProcessMs: Number(match[3]),
          totalMs: Number(match[2]),
        }))),
        totalMs: Number(campaign[3]),
      })]),
    }),
    schemaVersion: 1,
  });
}

function semanticPostgresql(postgresql) {
  if (postgresql === null || typeof postgresql !== 'object') return postgresql;
  return Object.fromEntries(
    Object.entries(postgresql).map(([key, value]) => [
      key,
      value && typeof value === 'object'
        ? JSON.parse(JSON.stringify(value))
        : value,
    ]),
  );
}

export function semanticTier2FullEvidence(runnerEvidence) {
  if (
    runnerEvidence?.contract !== TIER2_CONTRACT ||
    runnerEvidence?.full?.verdict !== 'PASS' ||
    runnerEvidence?.full?.cleanup?.status !== 'PASS'
  ) {
    throw new Error('Tier-2 runner evidence is incomplete or failed');
  }
  const full = runnerEvidence.full;
  const smokeProvision = full.smoke?.provision;
  return Object.freeze({
    candidateFingerprint: full.candidateFingerprintAfter?.candidateSha256,
    cleanup: full.cleanup,
    failedStage: full.failedStage,
    postgresql: semanticPostgresql(full.postgresql),
    smoke: Object.freeze({
      provision: smokeProvision
        ? Object.freeze({
            imageDigest: smokeProvision.imageDigest,
            migration: smokeProvision.migration,
            postgres: smokeProvision.postgres,
          })
        : null,
      start: full.smoke?.start ?? null,
      ui: full.smoke?.ui ?? null,
    }),
    stages: full.stages.map(({ id, status }) => ({ id, status })),
    testedSha: runnerEvidence.testedSha,
    toolchain: full.toolchain,
    verdict: full.verdict,
    warnings: full.warnings,
  });
}

export function compareTier2Legs(left, right) {
  if (left.leg === right.leg) {
    throw new Error('Tier-2 evidence must come from distinct legs');
  }
  if (left.provider?.serverId === right.provider?.serverId) {
    throw new Error('Tier-2 evidence must come from distinct servers');
  }
  if (left.provider?.placementGroupId !== right.provider?.placementGroupId) {
    throw new Error('Tier-2 servers must share the governed spread placement group');
  }
  const leftSemantic = semanticTier2FullEvidence(left);
  const rightSemantic = semanticTier2FullEvidence(right);
  const leftJson = JSON.stringify(leftSemantic);
  const rightJson = JSON.stringify(rightSemantic);
  if (leftJson !== rightJson) {
    throw new Error('Tier-2 legs differ semantically');
  }
  return Object.freeze({
    comparableSha256: sha256(leftJson),
    contract: TIER2_CONTRACT,
    equivalent: true,
    legs: Object.freeze([left.leg, right.leg]),
    testedSha: left.testedSha,
  });
}

export function estimateTier2Cost({ elapsedMs, legs = 2 }) {
  if (!Number.isFinite(elapsedMs) || elapsedMs < 0 || !Number.isSafeInteger(legs) || legs < 1) {
    throw new Error('Tier-2 cost inputs are invalid');
  }
  const projectedUsd = (elapsedMs / 3_600_000) * legs * TIER2_HOURLY_USD;
  return Object.freeze({
    guardUsd: TIER2_MONTHLY_GUARD_USD,
    hourlyUsdPerLeg: TIER2_HOURLY_USD,
    legs,
    projectedUsd: Number(projectedUsd.toFixed(4)),
    status: projectedUsd <= TIER2_MONTHLY_GUARD_USD ? 'WITHIN_GUARD' : 'GUARD_EXCEEDED',
  });
}

export function createTier2Attestation({
  comparison,
  controllerSha,
  runAttempt,
  runId,
  testedSha,
  workflow,
}) {
  if (comparison?.equivalent !== true || comparison?.testedSha !== testedSha) {
    throw new Error('Successful equivalent Tier-2 comparison is required');
  }
  requireSha(controllerSha, 'controllerSha');
  requireSha(testedSha, 'testedSha');
  requireString(runAttempt, 'runAttempt');
  requireString(runId, 'runId');
  requireString(workflow, 'workflow');
  return Object.freeze({
    authoritative: false,
    comparisonSha256: comparison.comparableSha256,
    contract: TIER2_CONTRACT,
    controllerSha,
    mode: TIER2_SHADOW_MODE,
    promotionGate: 'NOT_APPLICABLE_SHADOW',
    runAttempt,
    runId,
    testedSha,
    workflow,
  });
}
