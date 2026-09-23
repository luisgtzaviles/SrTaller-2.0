import { execFile } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { promisify } from 'node:util';

const execute = promisify(execFile);

const CLOSURE_TAG_PREFIX = 'srtaller-work-unit-closed';
const INFRA_DEPENDENCY_EXCEPTION = 'INFRA_CI_BLOCKER';
const INFRA_DEPENDENCY_WORK_UNIT = 'INFRA — Deterministic Authoritative CI Runner';
const INFRA_DEPENDENCY_TYPE = 'INFRASTRUCTURE_QUALITY';
const SUBJECT_ATTESTATION_CONTRACT = 'SR_TALLER_AUTHORITATIVE_SUBJECT_V1';
const AUTHORITATIVE_WORKFLOW = 'Authoritative Linux CI';
const AUTHORITATIVE_WORKFLOW_PATH = '.github/workflows/authoritative-linux-ci.yml';

export const WORK_UNIT_CHECKLIST = 'docs/work/ACTIVE_CHECKLIST.md';
export const WORK_UNIT_STATUSES = Object.freeze([
  'IDLE',
  'ACTIVE',
  'BLOCKED',
  'READY_FOR_PROMOTION',
  'PROMOTION',
  'CLOSED',
]);
export const WORK_UNIT_RISKS = Object.freeze([
  'LOW',
  'MEDIUM',
  'HIGH',
  'TRANSITIONAL',
  'NORMAL',
  'SENSITIVE',
  'ARCHITECTURAL',
]);
export const REQUIRED_WORK_UNIT_SECTIONS = Object.freeze([
  'Objective',
  'Why',
  'In Scope',
  'Out of Scope',
  'Applicable Contracts',
  'Risks',
  'Plan',
  'Current',
  'Next',
  'Blockers',
  'Important Discoveries',
  'Focused Verification',
  'Promotion Gates',
  'Remote Actions / Authorization',
  'Handoff Notes',
  'Closure Predicate',
]);

const requiredMetadata = Object.freeze([
  'work_unit',
  'branch',
  'base_sha',
  'status',
  'risk',
  'last_updated',
]);

const dependencyMetadata = Object.freeze([
  'dependency_work_unit',
  'dependency_branch',
  'dependency_subject_sha',
  'dependency_status',
  'dependency_return',
]);

async function git(projectRoot, argumentsList) {
  const { stdout } = await execute('git', argumentsList, {
    cwd: projectRoot,
    encoding: 'utf8',
    maxBuffer: 10 * 1024 * 1024,
  });
  return stdout.trim();
}

async function gitFile(projectRoot, revision, path) {
  try {
    return await git(projectRoot, ['show', `${revision}:${path}`]);
  } catch {
    return null;
  }
}

async function remoteBranchHead(projectRoot, remote, branch) {
  const result = await git(projectRoot, [
    'ls-remote',
    '--heads',
    remote,
    `refs/heads/${branch}`,
  ]);
  const [head = '', ref = ''] = result.split(/\s+/u);
  if (!/^[0-9a-f]{40}$/u.test(head) || ref !== `refs/heads/${branch}`) {
    throw new Error(`cannot resolve ${remote}/${branch} from the authoritative remote`);
  }
  return head;
}

function finding(code, message) {
  return Object.freeze({ code, message });
}

export function parseWorkUnitDocument(source) {
  const findings = [];
  const matches = [...source.matchAll(
    /<!-- WORK_UNIT_METADATA\r?\n([\s\S]*?)\r?\n-->/gu,
  )];
  if (matches.length !== 1) {
    findings.push(finding(
      'MALFORMED_METADATA',
      `Expected exactly one WORK_UNIT_METADATA block; found ${matches.length}.`,
    ));
  }

  const metadata = {};
  if (matches.length === 1) {
    for (const rawLine of matches[0][1].split(/\r?\n/u)) {
      if (rawLine.trim() === '') continue;
      const match = /^([a-z][a-z0-9_]*):[ \t]+(.+?)\s*$/u.exec(rawLine);
      if (!match) {
        findings.push(finding(
          'MALFORMED_METADATA',
          `Metadata line is not key: value: ${JSON.stringify(rawLine)}.`,
        ));
        continue;
      }
      const [, key, value] = match;
      if (Object.hasOwn(metadata, key)) {
        findings.push(finding('MALFORMED_METADATA', `Duplicate metadata key: ${key}.`));
        continue;
      }
      metadata[key] = value;
    }
  }

  for (const key of requiredMetadata) {
    if (!metadata[key]) {
      findings.push(finding('MISSING_METADATA', `Required metadata is missing: ${key}.`));
    }
  }
  if (metadata.status && !WORK_UNIT_STATUSES.includes(metadata.status)) {
    findings.push(finding(
      'INVALID_STATUS',
      `Status ${metadata.status} is invalid; expected ${WORK_UNIT_STATUSES.join(', ')}.`,
    ));
  }
  if (metadata.risk && !WORK_UNIT_RISKS.includes(metadata.risk)) {
    findings.push(finding(
      'INVALID_RISK',
      `Risk ${metadata.risk} is invalid; expected ${WORK_UNIT_RISKS.join(', ')}.`,
    ));
  }
  if (metadata.shadow_risk && !['NORMAL', 'SENSITIVE', 'ARCHITECTURAL'].includes(metadata.shadow_risk)) {
    findings.push(finding(
      'INVALID_SHADOW_RISK',
      'shadow_risk must be NORMAL, SENSITIVE, or ARCHITECTURAL.',
    ));
  }
  if (metadata.base_sha && !/^[0-9a-f]{40}$/u.test(metadata.base_sha)) {
    findings.push(finding('INVALID_BASE_SHA', 'base_sha must be a full lowercase Git SHA.'));
  }
  if (metadata.last_updated && !/^\d{4}-\d{2}-\d{2}$/u.test(metadata.last_updated)) {
    findings.push(finding('INVALID_LAST_UPDATED', 'last_updated must use YYYY-MM-DD.'));
  }
  if (metadata.dependency_exception) {
    if (metadata.dependency_exception !== INFRA_DEPENDENCY_EXCEPTION) {
      findings.push(finding(
        'INVALID_DEPENDENCY_EXCEPTION',
        `Unsupported dependency exception: ${metadata.dependency_exception}.`,
      ));
    }
    for (const key of dependencyMetadata) {
      if (!metadata[key]) {
        findings.push(finding(
          'MISSING_DEPENDENCY_METADATA',
          `Dependency exception metadata is missing: ${key}.`,
        ));
      }
    }
    if (metadata.work_unit !== INFRA_DEPENDENCY_WORK_UNIT || metadata.type !== INFRA_DEPENDENCY_TYPE) {
      findings.push(finding(
        'DEPENDENCY_EXCEPTION_SCOPE_VIOLATION',
        'INFRA_CI_BLOCKER is limited to the named deterministic CI Infrastructure/Quality Work Unit.',
      ));
    }
    if (!['BLOCKED', 'PROMOTION'].includes(metadata.dependency_status)) {
      findings.push(finding(
        'INVALID_DEPENDENCY_STATUS',
        'The dependent Work Unit must be explicitly BLOCKED or PROMOTION.',
      ));
    }
    if (metadata.dependency_return !== 'REQUIRED') {
      findings.push(finding(
        'INVALID_DEPENDENCY_RETURN',
        'The dependency exception must return control to the preserved Work Unit.',
      ));
    }
    if (metadata.dependency_subject_sha && !/^[0-9a-f]{40}$/u.test(metadata.dependency_subject_sha)) {
      findings.push(finding(
        'INVALID_DEPENDENCY_SUBJECT_SHA',
        'dependency_subject_sha must be a full lowercase Git SHA.',
      ));
    }
  } else {
    for (const key of dependencyMetadata) {
      if (metadata[key]) {
        findings.push(finding(
          'ORPHAN_DEPENDENCY_METADATA',
          `${key} requires dependency_exception: ${INFRA_DEPENDENCY_EXCEPTION}.`,
        ));
      }
    }
  }

  const sectionMatches = [...source.matchAll(/^## ([^\r\n]+)\r?$/gmu)];
  const sections = {};
  for (let index = 0; index < sectionMatches.length; index += 1) {
    const current = sectionMatches[index];
    const start = current.index + current[0].length;
    const end = sectionMatches[index + 1]?.index ?? source.length;
    sections[current[1]] = source.slice(start, end).trim();
  }
  for (const section of REQUIRED_WORK_UNIT_SECTIONS) {
    if (!Object.hasOwn(sections, section) || sections[section] === '') {
      findings.push(finding(
        'MISSING_REQUIRED_SECTION',
        `Required non-empty section is missing: ${section}.`,
      ));
    }
  }

  return Object.freeze({
    metadata: Object.freeze(metadata),
    sections: Object.freeze(sections),
    findings: Object.freeze(findings),
  });
}

async function gitObjectExists(projectRoot, revision) {
  try {
    await execute('git', ['cat-file', '-e', `${revision}^{commit}`], { cwd: projectRoot });
    return true;
  } catch {
    return false;
  }
}

async function isAncestor(projectRoot, ancestor, descendant) {
  try {
    await execute('git', ['merge-base', '--is-ancestor', ancestor, descendant], {
      cwd: projectRoot,
    });
    return true;
  } catch (error) {
    if (error?.code === 1) return false;
    throw error;
  }
}

function derivedLanding(metadata) {
  return metadata.closure_mode === 'DERIVED' &&
    ['READY_FOR_PROMOTION', 'PROMOTION', 'CLOSED'].includes(metadata.status) &&
    metadata.branch !== 'main';
}

export function workUnitClosureTag(metadata) {
  const material = [metadata.work_unit, metadata.branch, metadata.base_sha].join('\0');
  const key = createHash('sha256').update(material).digest('hex');
  return `${CLOSURE_TAG_PREFIX}/${key}`;
}

async function inspectLandingCommit({
  projectRoot,
  checklistPath,
  source,
  metadata,
  mergeCommit,
}) {
  const findings = [];
  if (!await gitObjectExists(projectRoot, mergeCommit)) {
    return Object.freeze({
      findings: Object.freeze([finding(
        'CLOSURE_COMMIT_NOT_FOUND',
        `Closure commit does not exist: ${mergeCommit}.`,
      )]),
      candidateParent: null,
    });
  }

  const parents = (await git(projectRoot, ['show', '-s', '--format=%P', mergeCommit]))
    .split(/\s+/u)
    .filter(Boolean);
  if (parents.length !== 2) {
    findings.push(finding(
      'CLOSURE_NOT_MERGE_COMMIT',
      `Closure target ${mergeCommit} is not an ordinary merge commit.`,
    ));
  }

  const landedSource = await gitFile(projectRoot, mergeCommit, checklistPath);
  if (landedSource === null || landedSource.trimEnd() !== source.trimEnd()) {
    findings.push(finding(
      'CLOSURE_SNAPSHOT_MISMATCH',
      'The closure target does not contain the current Work Unit snapshot.',
    ));
  }

  let candidateParent = null;
  for (const parent of parents.slice(1)) {
    const parentSource = await gitFile(projectRoot, parent, checklistPath);
    if (parentSource !== null && parentSource.trimEnd() === source.trimEnd()) {
      candidateParent = parent;
      break;
    }
  }
  if (parents.length === 2 && candidateParent === null) {
    findings.push(finding(
      'CLOSURE_CANDIDATE_NOT_FOUND',
      'No merged feature parent contains the landed Work Unit snapshot.',
    ));
  }

  if (/^[0-9a-f]{40}$/u.test(metadata.base_sha ?? '') &&
      !await isAncestor(projectRoot, metadata.base_sha, mergeCommit)) {
    findings.push(finding(
      'CLOSURE_BASE_NOT_ANCESTOR',
      `Work Unit base ${metadata.base_sha} is not an ancestor of ${mergeCommit}.`,
    ));
  }

  return Object.freeze({ findings: Object.freeze(findings), candidateParent });
}

async function inspectDerivedClosure({
  projectRoot,
  checklistPath,
  source,
  metadata,
  currentHead,
}) {
  const tag = workUnitClosureTag(metadata);
  const ref = `refs/tags/${tag}`;
  let mergeCommit;
  try {
    mergeCommit = await git(projectRoot, ['rev-parse', '--verify', `${ref}^{commit}`]);
  } catch {
    return Object.freeze({
      tag,
      ref,
      mergeCommit: null,
      candidateParent: null,
      proven: false,
      findings: Object.freeze([finding(
        'DERIVED_CLOSURE_UNPROVEN',
        `Derived closure ref is missing: ${ref}.`,
      )]),
    });
  }

  const findings = [];
  if (!await isAncestor(projectRoot, mergeCommit, currentHead)) {
    findings.push(finding(
      'CLOSURE_NOT_IN_MAIN_HISTORY',
      `Closure target ${mergeCommit} is not an ancestor of main ${currentHead}.`,
    ));
  }
  const landing = await inspectLandingCommit({
    projectRoot,
    checklistPath,
    source,
    metadata,
    mergeCommit,
  });
  findings.push(...landing.findings);

  return Object.freeze({
    tag,
    ref,
    mergeCommit,
    candidateParent: landing.candidateParent,
    proven: findings.length === 0,
    findings: Object.freeze(findings),
  });
}

export async function inspectWorkUnit({
  projectRoot = process.cwd(),
  checklistPath = WORK_UNIT_CHECKLIST,
  actualBranch,
  head,
  mode = 'AUTO',
} = {}) {
  const branch = (actualBranch ?? await git(projectRoot, ['branch', '--show-current'])) || 'DETACHED';
  const currentHead = head ?? await git(projectRoot, ['rev-parse', 'HEAD']);
  const selectedMode = mode === 'AUTO' ? (branch === 'main' ? 'MAIN' : 'ACTIVE') : mode;
  let source;
  try {
    source = await readFile(resolve(projectRoot, checklistPath), 'utf8');
  } catch (error) {
    return Object.freeze({
      schemaVersion: 1,
      contract: 'WORK_UNIT_LIFECYCLE/ITERATION_3',
      checklistPath,
      mode: selectedMode,
      actualBranch: branch,
      head: currentHead,
      metadata: Object.freeze({}),
      requiredSections: REQUIRED_WORK_UNIT_SECTIONS,
      findings: Object.freeze([finding(
        'CHECKLIST_UNAVAILABLE',
        `Cannot read ${checklistPath}: ${error.message}`,
      )]),
      status: 'FAIL',
    });
  }
  const parsed = parseWorkUnitDocument(source);
  const findings = [...parsed.findings];
  let closure = null;
  let effectiveStatus = parsed.metadata.status ?? null;

  if (!['ACTIVE', 'PROMOTION', 'MAIN'].includes(selectedMode)) {
    findings.push(finding('INVALID_CHECK_MODE', `Unsupported Work Unit check mode: ${selectedMode}.`));
  } else if (selectedMode === 'ACTIVE') {
    if (branch === 'main' || branch === 'DETACHED') {
      findings.push(finding('INVALID_ACTIVE_BRANCH', 'ACTIVE mode requires a non-main attached branch.'));
    }
    if (parsed.metadata.branch && parsed.metadata.branch !== branch) {
      findings.push(finding(
        'BRANCH_MISMATCH',
        `Checklist branch ${parsed.metadata.branch} does not match Git branch ${branch}.`,
      ));
    }
    if (parsed.metadata.status === 'IDLE' || parsed.metadata.status === 'CLOSED') {
      findings.push(finding(
        'INVALID_ACTIVE_STATUS',
        `Branch work cannot use status ${parsed.metadata.status} in ACTIVE mode.`,
      ));
    }
  } else if (selectedMode === 'PROMOTION') {
    if (branch === 'main' || branch === 'DETACHED') {
      findings.push(finding(
        'INVALID_PROMOTION_BRANCH',
        'PROMOTION mode requires a non-main attached branch identity.',
      ));
    }
    if (parsed.metadata.branch && parsed.metadata.branch !== branch) {
      findings.push(finding(
        'BRANCH_MISMATCH',
        `Checklist branch ${parsed.metadata.branch} does not match Git branch ${branch}.`,
      ));
    }
    if (!['READY_FOR_PROMOTION', 'PROMOTION'].includes(parsed.metadata.status)) {
      findings.push(finding(
        'INVALID_PROMOTION_STATUS',
        'PR promotion requires READY_FOR_PROMOTION or PROMOTION; ACTIVE cannot land on main.',
      ));
    }
  } else if (selectedMode === 'MAIN') {
    const idleMain = parsed.metadata.status === 'IDLE' && parsed.metadata.branch === 'main';
    const isDerivedLanding = derivedLanding(parsed.metadata);
    if (branch !== 'main') {
      findings.push(finding('MAIN_MODE_BRANCH_MISMATCH', 'MAIN mode requires the main branch.'));
    }
    if (!idleMain && !isDerivedLanding) {
      findings.push(finding(
        'INVALID_MAIN_SNAPSHOT',
        'main requires IDLE/main metadata or a DERIVED promotion/closure landing snapshot.',
      ));
    } else if (isDerivedLanding && branch === 'main') {
      closure = await inspectDerivedClosure({
        projectRoot,
        checklistPath,
        source,
        metadata: parsed.metadata,
        currentHead,
      });
      findings.push(...closure.findings);
      effectiveStatus = closure.proven ? 'IDLE' : 'PROMOTION';
    } else if (idleMain) {
      effectiveStatus = 'IDLE';
    }
  }

  if (parsed.metadata.branch) {
    try {
      await execute('git', ['check-ref-format', '--branch', parsed.metadata.branch], {
        cwd: projectRoot,
      });
    } catch {
      findings.push(finding('INVALID_BRANCH', `Invalid branch name: ${parsed.metadata.branch}.`));
    }
  }
  if (/^[0-9a-f]{40}$/u.test(parsed.metadata.base_sha ?? '')) {
    if (!await gitObjectExists(projectRoot, parsed.metadata.base_sha)) {
      findings.push(finding('BASE_SHA_NOT_FOUND', `Base SHA does not exist: ${parsed.metadata.base_sha}.`));
    } else if (!await isAncestor(projectRoot, parsed.metadata.base_sha, currentHead)) {
      findings.push(finding(
        'BASE_NOT_ANCESTOR',
        `Base SHA ${parsed.metadata.base_sha} is not an ancestor of HEAD ${currentHead}.`,
      ));
    }
  }

  return Object.freeze({
    schemaVersion: 1,
    contract: 'WORK_UNIT_LIFECYCLE/ITERATION_3',
    checklistPath,
    mode: selectedMode,
    actualBranch: branch,
    head: currentHead,
    metadata: parsed.metadata,
    effectiveStatus,
    closure,
    requiredSections: REQUIRED_WORK_UNIT_SECTIONS,
    findings: Object.freeze(findings),
    status: findings.length === 0 ? 'PASS' : 'FAIL',
  });
}

function normalizedConclusion(value) {
  return typeof value === 'string' ? value.toLowerCase() : '';
}

function assertSuccessfulPromotionRun(authoritativeRun) {
  if (!authoritativeRun || typeof authoritativeRun !== 'object') {
    throw new Error('authoritative run evidence is required');
  }
  if (authoritativeRun.workflowName !== AUTHORITATIVE_WORKFLOW) {
    throw new Error('closure evidence must come from Authoritative Linux CI');
  }
  if (authoritativeRun.status !== 'completed' || normalizedConclusion(authoritativeRun.conclusion) !== 'success') {
    throw new Error('authoritative run is not successfully completed');
  }
  const promotionGate = authoritativeRun.jobs?.find(
    ({ name }) => name === 'Authoritative promotion gate',
  );
  if (!promotionGate || normalizedConclusion(promotionGate.conclusion) !== 'success') {
    throw new Error('Authoritative promotion gate is not successful');
  }
}

function assertAuthoritativeRun(authoritativeRun, head) {
  assertSuccessfulPromotionRun(authoritativeRun);
  if (authoritativeRun.headSha !== head) {
    throw new Error(`authoritative run HEAD ${authoritativeRun.headSha ?? 'unknown'} does not match main ${head}`);
  }
  if (authoritativeRun.event !== 'push') {
    throw new Error('authoritative run must be a push event on exact main');
  }
  if (authoritativeRun.headBranch !== 'main') {
    throw new Error('authoritative run must be bound to the main branch');
  }
}

function assertSubjectAuthoritativeRun(authoritativeRun, attestation, controllerSha, testedSha) {
  assertSuccessfulPromotionRun(authoritativeRun);
  if (authoritativeRun.headSha !== controllerSha || authoritativeRun.headBranch !== 'main') {
    throw new Error('subject verification must be controlled by the current trusted main SHA');
  }
  if (authoritativeRun.event !== 'workflow_dispatch') {
    throw new Error('subject verification must use the governed workflow_dispatch path');
  }
  if (!attestation || typeof attestation !== 'object') {
    throw new Error('subject verification attestation is required');
  }
  if (attestation.schemaVersion !== 1 || attestation.contract !== SUBJECT_ATTESTATION_CONTRACT) {
    throw new Error('subject verification attestation contract is invalid');
  }
  if (attestation.workflow !== AUTHORITATIVE_WORKFLOW ||
      attestation.workflowPath !== AUTHORITATIVE_WORKFLOW_PATH) {
    throw new Error('subject verification attestation names the wrong workflow');
  }
  if (attestation.controllerSha !== controllerSha) {
    throw new Error('subject verification controller SHA mismatch');
  }
  if (attestation.testedSha !== testedSha) {
    throw new Error('subject verification testedSha mismatch');
  }
  if (String(attestation.runId) !== String(authoritativeRun.databaseId)) {
    throw new Error('subject verification run identity mismatch');
  }
  if (attestation.conclusion !== 'success' || attestation.promotionGate !== 'success') {
    throw new Error('subject verification attestation is failed or incomplete');
  }
}

async function publishClosureTag({
  projectRoot,
  remote,
  metadata,
  target,
  candidateParent,
  messageVersion = 'v1',
  extraMessage = [],
}) {
  const tag = workUnitClosureTag(metadata);
  const ref = `refs/tags/${tag}`;
  try {
    const existing = await git(projectRoot, ['rev-parse', '--verify', `${ref}^{commit}`]);
    if (existing !== target) {
      throw new Error(`closure ref ${ref} already targets ${existing}, not ${target}`);
    }
    await execute('git', ['push', remote, ref], { cwd: projectRoot });
    return Object.freeze({
      status: 'ALREADY_CLOSED',
      effectiveStatus: 'IDLE',
      tag,
      ref,
      mergeCommit: target,
      candidateParent,
      pushed: true,
    });
  } catch (error) {
    if (!/Needed a single revision|unknown revision|ambiguous argument|not a valid object name/iu.test(error.message)) {
      throw error;
    }
  }

  const message = [
    `SR Taller Work Unit closure ${messageVersion}`,
    '',
    `Work Unit: ${metadata.work_unit}`,
    `Branch: ${metadata.branch}`,
    ...extraMessage,
  ].join('\n');
  await execute('git', ['tag', '-a', tag, '-m', message, target], { cwd: projectRoot });
  try {
    await execute('git', ['push', remote, ref], { cwd: projectRoot });
  } catch (error) {
    await execute('git', ['tag', '-d', tag], { cwd: projectRoot });
    throw error;
  }

  return Object.freeze({
    status: 'CLOSED',
    effectiveStatus: 'IDLE',
    tag,
    ref,
    mergeCommit: target,
    candidateParent,
    pushed: true,
  });
}

export async function closeWorkUnit({
  projectRoot = process.cwd(),
  checklistPath = WORK_UNIT_CHECKLIST,
  authoritativeRun,
  confirmPredicate = false,
  push = true,
  remote = 'origin',
} = {}) {
  if (!confirmPredicate) {
    throw new Error('closure predicate must be explicitly confirmed');
  }
  if (!push) {
    throw new Error('local-only closure refs are forbidden; closure must be shared');
  }
  const [branch, head, originMain, liveRemoteMain, trackedStatus, source] = await Promise.all([
    git(projectRoot, ['branch', '--show-current']),
    git(projectRoot, ['rev-parse', 'HEAD']),
    git(projectRoot, ['rev-parse', `${remote}/main`]),
    remoteBranchHead(projectRoot, remote, 'main'),
    git(projectRoot, ['status', '--porcelain=v1', '--untracked-files=no']),
    readFile(resolve(projectRoot, checklistPath), 'utf8'),
  ]);
  if (branch !== 'main') throw new Error('Work Unit closure must run on main');
  if (head !== originMain) throw new Error(`main ${head} must equal ${remote}/main ${originMain}`);
  if (head !== liveRemoteMain) {
    throw new Error(`main ${head} must equal live ${remote}/main ${liveRemoteMain}`);
  }
  if (trackedStatus !== '') throw new Error('tracked working tree must be clean before closure');

  const parsed = parseWorkUnitDocument(source);
  if (parsed.findings.length > 0) {
    throw new Error('Work Unit metadata is invalid; refusing closure');
  }
  if (!derivedLanding(parsed.metadata)) {
    throw new Error('main does not contain a DERIVED promotion snapshot eligible for closure');
  }
  const landing = await inspectLandingCommit({
    projectRoot,
    checklistPath,
    source,
    metadata: parsed.metadata,
    mergeCommit: head,
  });
  if (landing.findings.length > 0) {
    throw new Error(landing.findings.map(({ code, message }) => `${code}: ${message}`).join('\n'));
  }
  assertAuthoritativeRun(authoritativeRun, head);

  return publishClosureTag({
    projectRoot,
    remote,
    metadata: parsed.metadata,
    target: head,
    candidateParent: landing.candidateParent,
  });
}

export async function closeIntegratedSubjectWorkUnit({
  projectRoot = process.cwd(),
  checklistPath = WORK_UNIT_CHECKLIST,
  authoritativeRun,
  attestation,
  subjectSha,
  confirmPredicate = false,
  push = true,
  remote = 'origin',
} = {}) {
  if (!confirmPredicate) throw new Error('closure predicate must be explicitly confirmed');
  if (!push) throw new Error('local-only closure refs are forbidden; closure must be shared');
  if (!/^[0-9a-f]{40}$/u.test(subjectSha ?? '')) {
    throw new Error('subject SHA must be a full lowercase Git SHA');
  }
  const [branch, head, originMain, liveRemoteMain, trackedStatus, controllerSource] = await Promise.all([
    git(projectRoot, ['branch', '--show-current']),
    git(projectRoot, ['rev-parse', 'HEAD']),
    git(projectRoot, ['rev-parse', `${remote}/main`]),
    remoteBranchHead(projectRoot, remote, 'main'),
    git(projectRoot, ['status', '--porcelain=v1', '--untracked-files=no']),
    readFile(resolve(projectRoot, checklistPath), 'utf8'),
  ]);
  if (branch !== 'main') throw new Error('Work Unit closure must run on main');
  if (head !== originMain || head !== liveRemoteMain) {
    throw new Error('current main, remote-tracking main and live remote main must match');
  }
  if (trackedStatus !== '') throw new Error('tracked working tree must be clean before closure');

  const controller = parseWorkUnitDocument(controllerSource);
  if (controller.findings.length > 0) throw new Error('controller Work Unit metadata is invalid');
  if (controller.metadata.dependency_exception !== INFRA_DEPENDENCY_EXCEPTION ||
      controller.metadata.work_unit !== INFRA_DEPENDENCY_WORK_UNIT) {
    throw new Error('current main does not carry the authorized Infrastructure dependency exception');
  }
  if (controller.metadata.dependency_subject_sha !== subjectSha) {
    throw new Error('subject SHA is not the explicitly authorized dependency subject');
  }
  const controllerClosure = await inspectDerivedClosure({
    projectRoot,
    checklistPath,
    source: controllerSource,
    metadata: controller.metadata,
    currentHead: head,
  });
  if (!controllerClosure.proven) {
    throw new Error('Infrastructure dependency Work Unit must be closed before subject closure');
  }
  if (!await isAncestor(projectRoot, subjectSha, head)) {
    throw new Error('subject SHA is not an ancestor integrated into live main');
  }

  const subjectSource = await gitFile(projectRoot, subjectSha, checklistPath);
  if (subjectSource === null) throw new Error('subject checklist is unavailable');
  const subject = parseWorkUnitDocument(subjectSource);
  if (subject.findings.length > 0) throw new Error('subject Work Unit metadata is invalid');
  if (subject.metadata.work_unit !== controller.metadata.dependency_work_unit ||
      subject.metadata.branch !== controller.metadata.dependency_branch ||
      subject.metadata.status !== controller.metadata.dependency_status) {
    throw new Error('subject Work Unit does not match the preserved dependency identity');
  }
  const landing = await inspectLandingCommit({
    projectRoot,
    checklistPath,
    source: subjectSource,
    metadata: subject.metadata,
    mergeCommit: subjectSha,
  });
  if (landing.findings.length > 0) {
    throw new Error(landing.findings.map(({ code, message }) => `${code}: ${message}`).join('\n'));
  }
  assertSubjectAuthoritativeRun(authoritativeRun, attestation, head, subjectSha);

  return publishClosureTag({
    projectRoot,
    remote,
    metadata: subject.metadata,
    target: subjectSha,
    candidateParent: landing.candidateParent,
    messageVersion: 'v2-subject-attested',
    extraMessage: [
      `Controller: ${head}`,
      `Tested subject: ${subjectSha}`,
      `Authoritative run: ${authoritativeRun.databaseId}`,
    ],
  });
}

function renderChecklist({
  name,
  branch,
  baseSha,
  risk,
  shadowRisk,
  objective,
  type,
  lastUpdated,
  dependency,
}) {
  const dependencyLines = dependency ? `dependency_exception: ${INFRA_DEPENDENCY_EXCEPTION}
dependency_work_unit: ${dependency.workUnit}
dependency_branch: ${dependency.branch}
dependency_subject_sha: ${dependency.subjectSha}
dependency_status: ${dependency.status}
dependency_return: REQUIRED
` : '';
  return `# Active Work Unit Checklist

<!-- WORK_UNIT_METADATA
work_unit: ${name}
iteration: 1 - Authorized Start
type: ${type}
risk: ${risk}
shadow_risk: ${shadowRisk}
branch: ${branch}
base_sha: ${baseSha}
status: ACTIVE
closure_mode: DERIVED
last_updated: ${lastUpdated}
${dependencyLines}-->

## Objective

${objective}

## Why

To execute one authorized objective with a transferable repository-native handoff.

## In Scope

- Authorized Work Unit scope to be refined before implementation.

## Out of Scope

- Any work not explicitly authorized for this Work Unit.

## Applicable Contracts

- [\`AGENTS.md\`](../../AGENTS.md)
- [\`WORK_UNIT_LIFECYCLE.md\`](../delivery/WORK_UNIT_LIFECYCLE.md)

## Risks

- Confirm risk and escalation conditions before implementation.

## Plan

- [ ] Audit the authorized scope and applicable contracts.
- [ ] Implement and validate the Work Unit.

## Current

Work Unit initialized; audit is next.

## Next

Read applicable contracts and establish the focused plan.

## Blockers

None known.

## Important Discoveries

None yet.

## Focused Verification

- [ ] Define proportional development checks.

## Promotion Gates

- Existing authoritative promotion policy remains unchanged.

## Remote Actions / Authorization

- No remote action is implied by checklist initialization.

## Handoff Notes

- Branch creation/switching is explicit and occurred before this command.

## Closure Predicate

Define the verifiable closure predicate before promotion.
`;
}

export async function initializeWorkUnit({
  projectRoot = process.cwd(),
  checklistPath = WORK_UNIT_CHECKLIST,
  name,
  branch,
  objective,
  risk = 'TRANSITIONAL',
  shadowRisk = 'NORMAL',
  type = 'GOVERNANCE',
  baseSha,
  lastUpdated = new Date().toISOString().slice(0, 10),
  confirmPreviousClosed = false,
  dependencyException,
} = {}) {
  for (const [label, value] of Object.entries({ name, branch, objective })) {
    if (typeof value !== 'string' || value.trim() === '') {
      throw new Error(`${label} is required`);
    }
  }
  if (!WORK_UNIT_RISKS.includes(risk)) throw new Error(`invalid risk: ${risk}`);
  if (!['NORMAL', 'SENSITIVE', 'ARCHITECTURAL'].includes(shadowRisk)) {
    throw new Error(`invalid shadow risk: ${shadowRisk}`);
  }
  if (/\r|\n/u.test(name) || /\r|\n/u.test(type)) {
    throw new Error('name and type must be single-line metadata values');
  }
  if (!/^\d{4}-\d{2}-\d{2}$/u.test(lastUpdated)) {
    throw new Error('lastUpdated must use YYYY-MM-DD');
  }

  const [actualBranch, head, trackedStatus, originMain] = await Promise.all([
    git(projectRoot, ['branch', '--show-current']),
    git(projectRoot, ['rev-parse', 'HEAD']),
    git(projectRoot, ['status', '--porcelain=v1', '--untracked-files=no']),
    git(projectRoot, ['rev-parse', 'origin/main']),
  ]);
  if (actualBranch !== branch) {
    throw new Error(`current branch ${actualBranch || 'DETACHED'} does not match intended branch ${branch}`);
  }
  if (branch === 'main') throw new Error('work-unit:start refuses to initialize on main');
  if (trackedStatus !== '') throw new Error('tracked working tree must be clean before initialization');
  const resolvedBase = baseSha ?? originMain;
  if (resolvedBase !== originMain) {
    throw new Error(`base SHA must match current origin/main ${originMain}`);
  }
  if (head !== resolvedBase) {
    throw new Error('new Work Unit branch HEAD must equal its origin/main base before initialization');
  }

  let dependency = null;
  try {
    const existingSource = await readFile(resolve(projectRoot, checklistPath), 'utf8');
    const existing = parseWorkUnitDocument(existingSource);
    if (existing.findings.length > 0) {
      throw new Error('existing Work Unit metadata is invalid; refusing unsafe overwrite');
    }
    const existingStatus = existing.metadata.status;
    if (dependencyException === INFRA_DEPENDENCY_EXCEPTION) {
      if (name !== INFRA_DEPENDENCY_WORK_UNIT || type !== INFRA_DEPENDENCY_TYPE) {
        throw new Error('the dependency exception is limited to the named Infrastructure/Quality Work Unit');
      }
      if (!['BLOCKED', 'PROMOTION'].includes(existingStatus)) {
        throw new Error('the preserved Work Unit must be explicitly BLOCKED or PROMOTION');
      }
      dependency = {
        workUnit: existing.metadata.work_unit,
        branch: existing.metadata.branch,
        subjectSha: head,
        status: existingStatus,
      };
    } else if (['ACTIVE', 'BLOCKED'].includes(existingStatus)) {
      throw new Error(`refusing to overwrite ${existingStatus} Work Unit ${existing.metadata.work_unit ?? ''}`.trim());
    } else if (['READY_FOR_PROMOTION', 'PROMOTION', 'CLOSED'].includes(existingStatus)) {
      if (!confirmPreviousClosed) {
        throw new Error('previous derived closure must be explicitly confirmed with --confirm-previous-closed');
      }
      const closure = await inspectDerivedClosure({
        projectRoot,
        checklistPath,
        source: existingSource,
        metadata: existing.metadata,
        currentHead: head,
      });
      if (!closure.proven) {
        throw new Error('previous derived closure is not proven by a valid shared closure ref');
      }
    }
  } catch (error) {
    if (error?.code !== 'ENOENT') throw error;
  }

  const source = renderChecklist({
    name: name.trim(),
    branch,
    baseSha: resolvedBase,
    risk,
    shadowRisk,
    objective: objective.trim(),
    type,
    lastUpdated,
    dependency,
  });
  await writeFile(resolve(projectRoot, checklistPath), source);
  return inspectWorkUnit({ projectRoot, checklistPath, actualBranch, head });
}
