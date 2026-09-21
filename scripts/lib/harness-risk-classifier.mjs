import { classifyWorkflowChanges } from './workflow-change-classifier.mjs';

const rank = Object.freeze({ NORMAL: 1, SENSITIVE: 2, ARCHITECTURAL: 3 });

export function classifyHarnessPath(path) {
  if (
    path === 'AGENTS.md' ||
    path.startsWith('architecture/') ||
    path.startsWith('docs/architecture/') ||
    path.startsWith('docs/decisions/') ||
    path.startsWith('docs/delivery/') ||
    [
      'docs/delivery/WORK_UNIT_LIFECYCLE.md',
      'docs/delivery/RISK_CLASSIFICATION.md',
      'docs/delivery/MAIN_BRANCH_PROTECTION_CONTRACT.md',
    ].includes(path)
  ) {
    return Object.freeze({
      risk: 'ARCHITECTURAL',
      reason: 'Changes an accepted decision, architecture boundary, or fundamental delivery contract.',
    });
  }
  if (
    path.startsWith('src/infrastructure/database/') ||
    path.startsWith('src/infrastructure/security/') ||
    path.startsWith('src/modules/access/') ||
    path.startsWith('deploy/') ||
    path.startsWith('infrastructure/') ||
    path.startsWith('.github/') ||
    /(?:migration|authorization|authentication|session|csrf|cookie|capabilit|secret)/iu.test(path)
  ) {
    return Object.freeze({
      risk: 'SENSITIVE',
      reason: 'Touches persistence, security, authority, deployment, or another sensitive operation.',
    });
  }
  return Object.freeze({
    risk: 'NORMAL',
    reason: 'Stays within accepted product and technical contracts.',
  });
}

export function compareHarnessRisk(paths, options = {}) {
  const current = classifyWorkflowChanges(paths, options);
  const pathClassifications = current.changedPaths.map((path) => Object.freeze({
    path,
    ...classifyHarnessPath(path),
  }));
  const shadowRisk = pathClassifications.reduce(
    (highest, item) => rank[item.risk] > rank[highest] ? item.risk : highest,
    'NORMAL',
  );
  const architecturalReasons = pathClassifications
    .filter(({ risk }) => risk === shadowRisk)
    .map(({ reason }) => reason);
  const futurePipeline = shadowRisk === 'NORMAL'
    ? 'FOCUSED_DEVELOPMENT_THEN_CURRENT_PROMOTION'
    : shadowRisk === 'SENSITIVE'
      ? 'FULL_PLUS_OWNER_AND_DOMAIN_SECURITY_REVIEW'
      : 'FULL_PLUS_OWNER_ARCHITECTURE_DECISION_AND_SECOND_REVIEW';
  return Object.freeze({
    schemaVersion: 1,
    contract: 'HARNESS-2-RISK-SHADOW',
    activeEnforcement: 'CURRENT_POLICY',
    harnessMode: 'SHADOW_ONLY',
    currentClassification: current.primaryRisk,
    existingRequiredPipeline: current.enforcedPipeline,
    proposedClassification: shadowRisk,
    proposedFuturePipeline: futurePipeline,
    reason: architecturalReasons[0] ?? 'No changed paths were supplied; current policy still fails closed.',
    pathClassifications: Object.freeze(pathClassifications),
    gatesReduced: false,
  });
}
