import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { promisify } from 'node:util';

import {
  classifyWorkflowChanges,
  isUnequivocallyNonExecutableDocumentation,
} from '../scripts/lib/workflow-change-classifier.mjs';
import {
  assertDocsOnlyFileState,
  assertMarkdownStructure,
  assertNoSecretsInAddedLines,
  markdownRelativeLinks,
  verifyDocsOnlyChange,
  verifyDocumentationPolicyConsistency,
} from '../scripts/lib/docs-only-verification.mjs';

const execute = promisify(execFile);

test('DOCS_ONLY accepts only the narrow non-executable allowlist', () => {
  for (const path of [
    'docs/CURRENT_STATE.md',
    'docs/product/MVP_OPERATING_ROADMAP.md',
    'docs/backlog/pbis/PBI-040.md',
    'docs/sprints/sprint-03/SPRINT_BACKLOG.md',
    'docs/work/ACTIVE_CHECKLIST.md',
    'docs/quality/evidence/pbi-040/FORMAL_UI_VERIFICATION.md',
  ]) {
    assert.equal(isUnequivocallyNonExecutableDocumentation(path), true, path);
  }
});

test('DOCS_ONLY fails closed for every explicitly forbidden surface', () => {
  for (const path of [
    'test/example.test.mjs',
    '.github/workflows/authoritative-linux-ci.yml',
    'scripts/example.mjs',
    'architecture/dec-005-policy.json',
    'tsconfig.json',
    'Dockerfile',
    'apps/dev-preview-web/public/logo.svg',
    'docs/delivery/BRANCH_POLICY.md',
    'docs/decisions/dec-051-testing-ci-strategy/DECISION_PROPOSAL.md',
    'docs/quality/evidence/pbi-040/EVIDENCE_MANIFEST.json',
  ]) {
    assert.equal(isUnequivocallyNonExecutableDocumentation(path), false, path);
    assert.equal(
      classifyWorkflowChanges([path]).enforcedPipeline,
      'FULL',
      path,
    );
  }
});

test('mixed, empty and forced classifications select full', () => {
  assert.equal(
    classifyWorkflowChanges([
      'docs/work/ACTIVE_CHECKLIST.md',
      'src/main.ts',
    ]).enforcedPipeline,
    'FULL',
  );
  assert.equal(classifyWorkflowChanges([]).enforcedPipeline, 'FULL');
  assert.equal(
    classifyWorkflowChanges(['docs/work/ACTIVE_CHECKLIST.md'], {
      forceFullReason: 'workflow-dispatch',
    }).enforcedPipeline,
    'FULL',
  );
});

test('shadow classifier cannot omit full gates or exact-main', () => {
  const result = classifyWorkflowChanges([
    'src/infrastructure/database/migrations/20260914000000_catalog_probe.ts',
  ]);
  assert.equal(result.mode, 'SHADOW');
  assert.equal(result.primaryRisk, 'MIGRATION');
  assert.equal(result.enforcedPipeline, 'FULL');
  assert.equal(result.gatesOmittedByShadowClassifier, false);
  assert.equal(result.fullExactMainRequired, true);
  assert.equal(result.migrationHotfixFullExactMainRequired, true);
});

test('docs link and secret helpers detect material failures', () => {
  assert.deepEqual(
    markdownRelativeLinks('[local](../README.md) [anchor](#x) [web](https://example.test)'),
    ['../README.md'],
  );
  assert.doesNotThrow(() => assertNoSecretsInAddedLines('+safe text\n'));
  assert.throws(
    () => assertNoSecretsInAddedLines('+postgres://user:password@host/db\n'),
    /secret-like/u,
  );
});

test('DOCS_ONLY rejects symlinks and executable Markdown', () => {
  assert.doesNotThrow(() => assertDocsOnlyFileState({
    isFile: () => true,
    isSymbolicLink: () => false,
    mode: 0o100644,
  }, 'docs/work/note.md'));
  assert.throws(() => assertDocsOnlyFileState({
    isFile: () => false,
    isSymbolicLink: () => true,
    mode: 0o120777,
  }, 'docs/work/link.md'), /non-symlink/u);
  assert.throws(() => assertDocsOnlyFileState({
    isFile: () => true,
    isSymbolicLink: () => false,
    mode: 0o100755,
  }, 'docs/work/executable.md'), /executable file mode/u);
  assert.doesNotThrow(() => assertMarkdownStructure('# Title\n', 'docs/work/note.md'));
  assert.throws(
    () => assertMarkdownStructure('title only\n', 'docs/work/note.md'),
    /Markdown structure/u,
  );
});

test('DOCS_ONLY policy consistency follows the current Sprint and PBI pointers', async () => {
  const result = await verifyDocumentationPolicyConsistency();
  assert.deepEqual(result, {
    status: 'PASS',
    sprint: 'SPRINT-03',
    currentPbi: 'NONE',
  });
});

test('DOCS_ONLY verifies an exact allowed Git delta end to end', async () => {
  const root = await mkdtemp(join(tmpdir(), 'srtaller-docs-only-'));
  const write = async (path, content) => {
    const absolute = join(root, path);
    await mkdir(join(absolute, '..'), { recursive: true });
    await writeFile(absolute, content);
  };
  const git = (...argumentsList) => execute('git', argumentsList, { cwd: root });
  try {
    await git('init', '--quiet');
    await git('config', 'user.name', 'SR Taller Test');
    await git('config', 'user.email', 'test@srtaller.invalid');
    await write('docs/CURRENT_STATE.md', '- **PBI actual:** `NONE`.\n');
    await write('docs/product/MVP_OPERATING_ROADMAP.md', [
      '- **Sprint activo:** SPRINT-03 — Test.',
      '- **PBI actual:** `NONE`.',
      '',
    ].join('\n'));
    await write('docs/work/ACTIVE_CHECKLIST.md', 'Current PBI: NONE\n');
    await write('docs/work/note.md', '# Note\n');
    await write('docs/sprints/sprint-03/SPRINT_GOAL.md', '- **PBI actual:** NONE.\n');
    await write('docs/sprints/sprint-03/SPRINT_BACKLOG.md', '- **PBI actual:** NONE.\n');
    await git('add', '.');
    await git('commit', '--quiet', '-m', 'baseline');
    const { stdout: baseOutput } = await git('rev-parse', 'HEAD');
    await write('docs/work/note.md', '# Note\n\n[State](../CURRENT_STATE.md)\n');
    await git('add', '.');
    await git('commit', '--quiet', '-m', 'docs update');
    const { stdout: headOutput } = await git('rev-parse', 'HEAD');
    const result = await verifyDocsOnlyChange({
      base: baseOutput.trim(),
      head: headOutput.trim(),
      projectRoot: root,
    });
    assert.equal(result.verdict, 'PASS');
    assert.equal(result.classification.enforcedPipeline, 'DOCS_ONLY');
    assert.equal(result.links.checked, 1);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
