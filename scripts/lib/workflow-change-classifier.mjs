import { execFile } from 'node:child_process';
import { createHash } from 'node:crypto';
import { promisify } from 'node:util';

const execute = promisify(execFile);

const exactDocsOnlyPaths = new Set([
  'docs/CURRENT_STATE.md',
  'docs/product/MVP_OPERATING_ROADMAP.md',
]);

const docsOnlyPrefixes = Object.freeze([
  'docs/backlog/',
  'docs/quality/evidence/',
  'docs/reviews/',
  'docs/sprints/',
  'docs/work/',
]);

const executableEvidenceNames = Object.freeze([
  'EVIDENCE_MANIFEST',
  'MIGRATION_STATE',
  'RUNTIME_PROVENANCE',
]);

function sha256(value) {
  return createHash('sha256').update(value).digest('hex');
}

function uniqueSorted(values) {
  return [...new Set(values)].sort((left, right) =>
    Buffer.from(left).compare(Buffer.from(right)),
  );
}

export function isUnequivocallyNonExecutableDocumentation(path) {
  if (typeof path !== 'string' || !path.endsWith('.md')) return false;
  if (
    executableEvidenceNames.some((name) =>
      path.toUpperCase().includes(name),
    )
  ) {
    return false;
  }
  return exactDocsOnlyPaths.has(path) ||
    docsOnlyPrefixes.some((prefix) => path.startsWith(prefix));
}

export function classifyWorkflowPath(path) {
  if (/^src\/infrastructure\/database\/migrations\//u.test(path)) {
    return 'MIGRATION';
  }
  if (
    /^src\/modules\/access\//u.test(path) ||
    /^src\/infrastructure\/security\//u.test(path) ||
    /(?:authorization|authentication|session|csrf|cookie|capabilit)/iu.test(path)
  ) {
    return 'AUTHORIZATION_SECURITY';
  }
  if (
    path === 'Dockerfile' ||
    path.startsWith('deploy/') ||
    path.startsWith('infrastructure/') ||
    path === 'docs/architecture/DEPLOYMENT_STRATEGY.md' ||
    path === 'docs/delivery/ENVIRONMENTS.md' ||
    path.startsWith('docs/operations/')
  ) {
    return 'DEPLOYMENT_INFRASTRUCTURE';
  }
  if (
    path.startsWith('.github/') ||
    path.startsWith('scripts/') ||
    path.startsWith('test/') ||
    path.startsWith('architecture/') ||
    path.startsWith('docs/delivery/') ||
    path.startsWith('docs/decisions/') ||
    /^(?:package\.json|pnpm-lock\.yaml|tsconfig(?:\.[^.]+)?\.json|\.node-version|\.nvmrc|\.npmrc)$/u.test(path)
  ) {
    return 'CI_INFRASTRUCTURE';
  }
  if (path.startsWith('src/infrastructure/database/')) {
    return 'DATABASE_SCHEMA';
  }
  if (path.startsWith('apps/dev-preview-web/src/')) return 'UI_ONLY';
  if (path.startsWith('src/')) return 'APPLICATION_LOGIC';
  if (isUnequivocallyNonExecutableDocumentation(path)) return 'DOCS_ONLY';
  return 'CROSS_MODULE_HIGH_RISK';
}

export function classifyWorkflowChanges(paths, { forceFullReason = null } = {}) {
  const changedPaths = uniqueSorted(paths);
  const pathClassifications = changedPaths.map((path) => Object.freeze({
    path,
    riskClass: classifyWorkflowPath(path),
  }));
  const classes = uniqueSorted(pathClassifications.map(({ riskClass }) => riskClass));
  const docsOnly =
    forceFullReason === null &&
    changedPaths.length > 0 &&
    pathClassifications.every(({ riskClass }) => riskClass === 'DOCS_ONLY');
  const primaryRisk = docsOnly
    ? 'DOCS_ONLY'
    : classes.length === 1 && classes[0] !== 'DOCS_ONLY'
      ? classes[0]
      : 'CROSS_MODULE_HIGH_RISK';
  const migrationTouched = classes.includes('MIGRATION');
  const result = {
    schemaVersion: 1,
    contract: 'WF-002/WF-006',
    mode: 'SHADOW',
    docsOnlyActive: true,
    changedPaths,
    changedPathsSha256: sha256(`${changedPaths.join('\n')}\n`),
    pathClassifications,
    observedRiskClasses: classes,
    primaryRisk,
    enforcedPipeline: docsOnly ? 'DOCS_ONLY' : 'FULL',
    shadowRecommendedPipeline: primaryRisk,
    gatesOmittedByShadowClassifier: false,
    fullExactMainRequired: true,
    migrationHotfixFullExactMainRequired: migrationTouched,
    forceFullReason,
  };
  return Object.freeze(result);
}

function assertRevision(value, label) {
  if (!/^[0-9a-f]{40}$/u.test(value ?? '')) {
    throw new Error(`${label} must be a full lowercase Git SHA`);
  }
}

export async function listChangedPaths({
  base,
  head,
  projectRoot = process.cwd(),
} = {}) {
  assertRevision(base, 'base');
  assertRevision(head, 'head');
  const { stdout } = await execute(
    'git',
    ['diff', '--name-only', '-z', '--no-ext-diff', base, head, '--'],
    { cwd: projectRoot, encoding: 'buffer', maxBuffer: 20 * 1024 * 1024 },
  );
  return uniqueSorted(stdout.toString('utf8').split('\0').filter(Boolean));
}

export async function inspectWorkflowChanges(input = {}) {
  const paths = await listChangedPaths(input);
  return classifyWorkflowChanges(paths, {
    forceFullReason: input.forceFullReason ?? null,
  });
}

export const WORKFLOW_DOCS_ONLY_PATHS = Object.freeze({
  exact: Object.freeze([...exactDocsOnlyPaths]),
  prefixes: docsOnlyPrefixes,
});
