import { execFile } from 'node:child_process';
import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { promisify } from 'node:util';

const execute = promisify(execFile);

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

async function git(projectRoot, argumentsList) {
  const { stdout } = await execute('git', argumentsList, {
    cwd: projectRoot,
    encoding: 'utf8',
    maxBuffer: 10 * 1024 * 1024,
  });
  return stdout.trim();
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
      contract: 'WORK_UNIT_LIFECYCLE/ITERATION_2',
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

  if (!['ACTIVE', 'MAIN'].includes(selectedMode)) {
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
  } else if (selectedMode === 'MAIN') {
    const idleMain = parsed.metadata.status === 'IDLE' && parsed.metadata.branch === 'main';
    const derivedLanding =
      parsed.metadata.closure_mode === 'DERIVED' &&
      ['READY_FOR_PROMOTION', 'PROMOTION', 'CLOSED'].includes(parsed.metadata.status) &&
      parsed.metadata.branch !== 'main';
    if (branch !== 'main') {
      findings.push(finding('MAIN_MODE_BRANCH_MISMATCH', 'MAIN mode requires the main branch.'));
    }
    if (!idleMain && !derivedLanding) {
      findings.push(finding(
        'INVALID_MAIN_SNAPSHOT',
        'main requires IDLE/main metadata or a DERIVED promotion/closure landing snapshot.',
      ));
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
    contract: 'WORK_UNIT_LIFECYCLE/ITERATION_2',
    checklistPath,
    mode: selectedMode,
    actualBranch: branch,
    head: currentHead,
    metadata: parsed.metadata,
    requiredSections: REQUIRED_WORK_UNIT_SECTIONS,
    findings: Object.freeze(findings),
    status: findings.length === 0 ? 'PASS' : 'FAIL',
  });
}

function renderChecklist({ name, branch, baseSha, risk, shadowRisk, objective, type, lastUpdated }) {
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
-->

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

  try {
    const existing = parseWorkUnitDocument(
      await readFile(resolve(projectRoot, checklistPath), 'utf8'),
    );
    if (existing.findings.length > 0) {
      throw new Error('existing Work Unit metadata is invalid; refusing unsafe overwrite');
    }
    const existingStatus = existing.metadata.status;
    if (['ACTIVE', 'BLOCKED'].includes(existingStatus)) {
      throw new Error(`refusing to overwrite ${existingStatus} Work Unit ${existing.metadata.work_unit ?? ''}`.trim());
    }
    if (
      ['READY_FOR_PROMOTION', 'PROMOTION'].includes(existingStatus) &&
      !confirmPreviousClosed
    ) {
      throw new Error('previous derived closure must be explicitly confirmed with --confirm-previous-closed');
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
  });
  await writeFile(resolve(projectRoot, checklistPath), source);
  return inspectWorkUnit({ projectRoot, checklistPath, actualBranch, head });
}
