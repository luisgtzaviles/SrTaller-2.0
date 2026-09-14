import { execFile } from 'node:child_process';
import { createHash } from 'node:crypto';
import { access, lstat, readFile } from 'node:fs/promises';
import { dirname, relative, resolve, sep } from 'node:path';
import { promisify } from 'node:util';

import { inspectWorkflowChanges } from './workflow-change-classifier.mjs';

const execute = promisify(execFile);
const secretPatterns = Object.freeze([
  /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/u,
  /\bghp_[A-Za-z0-9]{30,}\b/u,
  /\bgithub_pat_[A-Za-z0-9_]{30,}\b/u,
  /\bAKIA[0-9A-Z]{16}\b/u,
  /postgres(?:ql)?:\/\/[^\s:@/]+:[^\s@/]+@/iu,
  /\beyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\b/u,
]);

function sha256(value) {
  return createHash('sha256').update(value).digest('hex');
}

export function markdownRelativeLinks(content) {
  const links = [];
  const pattern = /!?\[[^\]]*\]\((?<target><[^>]+>|[^)\s]+)(?:\s+"[^"]*")?\)/gu;
  const definitions = /^\s{0,3}\[(?<label>[^\]]+)\]:\s*(?<target><[^>]+>|\S+)/gmu;
  for (const match of [
    ...content.matchAll(pattern),
    ...[...content.matchAll(definitions)].filter(
      (candidate) => !candidate.groups?.label?.startsWith('^'),
    ),
  ]) {
    const raw = match.groups?.target ?? '';
    const target = raw.startsWith('<') && raw.endsWith('>')
      ? raw.slice(1, -1)
      : raw;
    if (
      target === '' ||
      target.startsWith('#') ||
      target.startsWith('/') ||
      /^[a-z][a-z0-9+.-]*:/iu.test(target)
    ) {
      continue;
    }
    const withoutFragment = target.split('#', 1)[0].split('?', 1)[0];
    if (withoutFragment) links.push(decodeURIComponent(withoutFragment));
  }
  return links;
}

export function assertNoSecretsInAddedLines(diff) {
  const added = diff
    .split('\n')
    .filter((line) => line.startsWith('+') && !line.startsWith('+++'))
    .map((line) => line.slice(1))
    .join('\n');
  if (secretPatterns.some((pattern) => pattern.test(added))) {
    throw new Error('DOCS_ONLY added lines contain secret-like material');
  }
  return Object.freeze({ status: 'PASS', patterns: secretPatterns.length });
}

export function assertDocsOnlyFileState(fileState, path) {
  if (!fileState.isFile() || fileState.isSymbolicLink()) {
    throw new Error(`DOCS_ONLY requires a regular non-symlink file: ${path}`);
  }
  if ((fileState.mode & 0o111) !== 0) {
    throw new Error(`DOCS_ONLY rejects executable file mode: ${path}`);
  }
}

export function assertMarkdownStructure(content, path) {
  if (typeof content !== 'string' || !content.startsWith('# ') || content.trim() === '') {
    throw new Error(`DOCS_ONLY Markdown structure is invalid: ${path}`);
  }
}

async function git(projectRoot, argumentsList) {
  return execute('git', argumentsList, {
    cwd: projectRoot,
    encoding: 'utf8',
    maxBuffer: 20 * 1024 * 1024,
  });
}

function portablePath(path) {
  return path.split(sep).join('/');
}

async function assertNoInboundLinksToDeletedMarkdown({
  base,
  head,
  projectRoot,
}) {
  const [{ stdout: deletedOutput }, { stdout: trackedOutput }] = await Promise.all([
    git(projectRoot, [
      'diff', '--diff-filter=D', '--name-only', '-z', '--no-renames',
      '--no-ext-diff', base, head, '--',
    ]),
    git(projectRoot, ['ls-files', '-z', '--', '*.md']),
  ]);
  const deleted = new Set(deletedOutput.split('\0').filter(Boolean));
  if (deleted.size === 0) return Object.freeze([]);

  const checked = [];
  for (const sourcePath of trackedOutput.split('\0').filter(Boolean)) {
    const absoluteSource = resolve(projectRoot, sourcePath);
    const content = await readFile(absoluteSource, 'utf8');
    for (const link of markdownRelativeLinks(content)) {
      const targetPath = portablePath(relative(
        projectRoot,
        resolve(dirname(absoluteSource), link),
      ));
      if (deleted.has(targetPath)) {
        throw new Error(
          `DOCS_ONLY deleted Markdown has an inbound link: ${sourcePath} -> ${link}`,
        );
      }
      checked.push(`${sourcePath}:${link}`);
    }
  }
  return Object.freeze(checked);
}

function requiredMatch(content, pattern, label) {
  const value = pattern.exec(content)?.groups?.value;
  if (!value) throw new Error(`DOCS_ONLY policy marker missing: ${label}`);
  return value;
}

export async function verifyDocumentationPolicyConsistency(
  projectRoot = process.cwd(),
) {
  const currentState = await readFile(
    resolve(projectRoot, 'docs/CURRENT_STATE.md'),
    'utf8',
  );
  const roadmap = await readFile(
    resolve(projectRoot, 'docs/product/MVP_OPERATING_ROADMAP.md'),
    'utf8',
  );
  const checklist = await readFile(
    resolve(projectRoot, 'docs/work/ACTIVE_CHECKLIST.md'),
    'utf8',
  );
  const sprint = requiredMatch(
    roadmap,
    /\*\*Sprint activo:\*\* (?<value>SPRINT-\d+)/u,
    'roadmap sprint',
  );
  const sprintDirectory = sprint.toLowerCase();
  const [sprintGoal, sprintBacklog] = await Promise.all([
    readFile(resolve(projectRoot, `docs/sprints/${sprintDirectory}/SPRINT_GOAL.md`), 'utf8'),
    readFile(resolve(projectRoot, `docs/sprints/${sprintDirectory}/SPRINT_BACKLOG.md`), 'utf8'),
  ]);
  const pointers = Object.freeze({
    currentState: requiredMatch(
      currentState,
      /\*\*PBI actual:\*\* `(?<value>[^`]+)`/u,
      'current state PBI',
    ),
    roadmap: requiredMatch(
      roadmap,
      /\*\*PBI actual:\*\* `(?<value>[^`]+)`/u,
      'roadmap PBI',
    ),
    checklist: requiredMatch(
      checklist,
      /^Current PBI: (?<value>\S+)/mu,
      'active checklist PBI',
    ),
    sprintGoal: requiredMatch(
      sprintGoal,
      /\*\*PBI actual:\*\* (?<value>[^.\n]+)/u,
      'sprint goal PBI',
    ),
    sprintBacklog: requiredMatch(
      sprintBacklog,
      /\*\*PBI actual:\*\* (?<value>[^.\n]+)/u,
      'sprint backlog PBI',
    ),
  });
  if (new Set(Object.values(pointers)).size !== 1) {
    throw new Error(`DOCS_ONLY inconsistent Current PBI pointers: ${JSON.stringify(pointers)}`);
  }
  return Object.freeze({ status: 'PASS', sprint, currentPbi: pointers.currentState });
}

export async function verifyDocsOnlyChange({
  base,
  head,
  projectRoot = process.cwd(),
} = {}) {
  const classification = await inspectWorkflowChanges({ base, head, projectRoot });
  if (classification.enforcedPipeline !== 'DOCS_ONLY') {
    throw new Error(
      `DOCS_ONLY fail-closed: classified ${classification.enforcedPipeline}`,
    );
  }
  await git(projectRoot, ['diff', '--check', base, head, '--']);
  const { stdout: diff } = await git(
    projectRoot,
    ['diff', '--unified=0', '--no-ext-diff', base, head, '--', ...classification.changedPaths],
  );
  const secretScan = assertNoSecretsInAddedLines(diff);
  const checkedLinks = [];
  for (const path of classification.changedPaths) {
    const absolutePath = resolve(projectRoot, path);
    let content;
    try {
      const fileState = await lstat(absolutePath);
      assertDocsOnlyFileState(fileState, path);
      content = await readFile(absolutePath, 'utf8');
      assertMarkdownStructure(content, path);
    } catch (error) {
      if (error?.code === 'ENOENT') continue;
      throw error;
    }
    for (const link of markdownRelativeLinks(content)) {
      const target = resolve(dirname(absolutePath), link);
      try {
        await access(target);
      } catch {
        throw new Error(`DOCS_ONLY broken relative link: ${path} -> ${link}`);
      }
      checkedLinks.push(`${path}:${link}`);
    }
  }
  const inboundLinksChecked = await assertNoInboundLinksToDeletedMarkdown({
    base,
    head,
    projectRoot,
  });
  const { stdout: tree } = await git(projectRoot, ['rev-parse', `${head}^{tree}`]);
  const policyConsistency = await verifyDocumentationPolicyConsistency(projectRoot);
  return Object.freeze({
    schemaVersion: 1,
    contract: 'WF-002/DOCS_ONLY',
    base,
    head,
    tree: tree.trim(),
    classification,
    whitespace: 'PASS',
    links: Object.freeze({
      checked: checkedLinks.length + inboundLinksChecked.length,
      status: 'PASS',
    }),
    policyConsistency,
    secrets: secretScan,
    evidenceSha256: sha256(JSON.stringify({
      base,
      head,
      tree: tree.trim(),
      changedPathsSha256: classification.changedPathsSha256,
      links: [...checkedLinks, ...inboundLinksChecked].sort(),
    })),
    verdict: 'PASS',
  });
}
