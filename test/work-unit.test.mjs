import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { promisify } from 'node:util';

import { compareHarnessRisk } from '../scripts/lib/harness-risk-classifier.mjs';
import {
  initializeWorkUnit,
  inspectWorkUnit,
  parseWorkUnitDocument,
  REQUIRED_WORK_UNIT_SECTIONS,
} from '../scripts/lib/work-unit.mjs';

const execute = promisify(execFile);

function checklist({
  branch = 'feature/work-unit',
  baseSha,
  status = 'ACTIVE',
  closureMode = 'DERIVED',
  omitSection,
  metadataLine = '',
} = {}) {
  const sections = REQUIRED_WORK_UNIT_SECTIONS
    .filter((section) => section !== omitSection)
    .map((section) => `## ${section}\n\nMaterial ${section}.`)
    .join('\n\n');
  return `# Active Work Unit Checklist

<!-- WORK_UNIT_METADATA
work_unit: Test Work Unit
iteration: 1 - Test
type: TEST
risk: NORMAL
shadow_risk: NORMAL
branch: ${branch}
base_sha: ${baseSha}
status: ${status}
closure_mode: ${closureMode}
last_updated: 2026-09-20
${metadataLine}-->

${sections}
`;
}

async function repository() {
  const root = await mkdtemp(join(tmpdir(), 'srtaller-work-unit-'));
  const git = (...argumentsList) => execute('git', argumentsList, { cwd: root });
  await git('init', '--quiet', '--initial-branch=main');
  await git('config', 'user.name', 'SR Taller Test');
  await git('config', 'user.email', 'test@srtaller.invalid');
  await mkdir(join(root, 'docs/work'), { recursive: true });
  await writeFile(join(root, 'README.md'), '# Test\n');
  await git('add', '.');
  await git('commit', '--quiet', '-m', 'baseline');
  const baseSha = (await git('rev-parse', 'HEAD')).stdout.trim();
  await git('update-ref', 'refs/remotes/origin/main', baseSha);
  return { root, git, baseSha };
}

async function onFeature(repo) {
  await repo.git('switch', '--quiet', '-c', 'feature/work-unit');
  await writeFile(
    join(repo.root, 'docs/work/ACTIVE_CHECKLIST.md'),
    checklist({ baseSha: repo.baseSha }),
  );
  await repo.git('add', '.');
  await repo.git('commit', '--quiet', '-m', 'active work unit');
  return (await repo.git('rev-parse', 'HEAD')).stdout.trim();
}

test('valid active Work Unit passes deterministic Git and structure checks', async () => {
  const repo = await repository();
  try {
    await onFeature(repo);
    const result = await inspectWorkUnit({ projectRoot: repo.root });
    assert.equal(result.status, 'PASS');
    assert.equal(result.mode, 'ACTIVE');
    assert.equal(result.metadata.branch, 'feature/work-unit');
  } finally {
    await rm(repo.root, { recursive: true, force: true });
  }
});

test('checker reports wrong branch and missing required section', async () => {
  const repo = await repository();
  try {
    await repo.git('switch', '--quiet', '-c', 'feature/work-unit');
    await writeFile(
      join(repo.root, 'docs/work/ACTIVE_CHECKLIST.md'),
      checklist({
        branch: 'feature/other',
        baseSha: repo.baseSha,
        omitSection: 'Handoff Notes',
      }),
    );
    const result = await inspectWorkUnit({ projectRoot: repo.root });
    assert.equal(result.status, 'FAIL');
    assert.deepEqual(
      new Set(result.findings.map(({ code }) => code)),
      new Set(['MISSING_REQUIRED_SECTION', 'BRANCH_MISMATCH']),
    );
  } finally {
    await rm(repo.root, { recursive: true, force: true });
  }
});

test('parser rejects invalid status, invalid base SHA, and malformed metadata', () => {
  const result = parseWorkUnitDocument(checklist({
    baseSha: 'not-a-sha',
    status: 'DONE',
    metadataLine: 'broken metadata line\n',
  }));
  assert.deepEqual(
    new Set(result.findings.map(({ code }) => code)),
    new Set(['INVALID_STATUS', 'INVALID_BASE_SHA', 'MALFORMED_METADATA']),
  );
});

test('checker rejects a valid base object that is not an ancestor of HEAD', async () => {
  const repo = await repository();
  try {
    await repo.git('switch', '--quiet', '-c', 'side');
    await writeFile(join(repo.root, 'side.txt'), 'side\n');
    await repo.git('add', '.');
    await repo.git('commit', '--quiet', '-m', 'side');
    const sideSha = (await repo.git('rev-parse', 'HEAD')).stdout.trim();
    await repo.git('switch', '--quiet', '-c', 'feature/work-unit', repo.baseSha);
    await writeFile(join(repo.root, 'feature.txt'), 'feature\n');
    await writeFile(
      join(repo.root, 'docs/work/ACTIVE_CHECKLIST.md'),
      checklist({ baseSha: sideSha }),
    );
    await repo.git('add', '.');
    await repo.git('commit', '--quiet', '-m', 'feature');
    const result = await inspectWorkUnit({ projectRoot: repo.root });
    assert.equal(result.status, 'FAIL');
    assert.ok(result.findings.some(({ code }) => code === 'BASE_NOT_ANCESTOR'));
  } finally {
    await rm(repo.root, { recursive: true, force: true });
  }
});

test('explicit MAIN mode accepts IDLE main and a derived landing snapshot', async () => {
  const repo = await repository();
  try {
    await writeFile(
      join(repo.root, 'docs/work/ACTIVE_CHECKLIST.md'),
      checklist({ branch: 'main', baseSha: repo.baseSha, status: 'IDLE' }),
    );
    assert.equal((await inspectWorkUnit({ projectRoot: repo.root, mode: 'MAIN' })).status, 'PASS');
    await writeFile(
      join(repo.root, 'docs/work/ACTIVE_CHECKLIST.md'),
      checklist({
        branch: 'feature/landed',
        baseSha: repo.baseSha,
        status: 'PROMOTION',
      }),
    );
    assert.equal((await inspectWorkUnit({ projectRoot: repo.root, mode: 'MAIN' })).status, 'PASS');
  } finally {
    await rm(repo.root, { recursive: true, force: true });
  }
});

test('safe initializer writes a valid checklist but never creates or switches branch', async () => {
  const repo = await repository();
  try {
    await writeFile(
      join(repo.root, 'docs/work/ACTIVE_CHECKLIST.md'),
      checklist({ branch: 'main', baseSha: repo.baseSha, status: 'IDLE' }),
    );
    await repo.git('add', '.');
    await repo.git('commit', '--quiet', '--amend', '--no-edit');
    repo.baseSha = (await repo.git('rev-parse', 'HEAD')).stdout.trim();
    await repo.git('update-ref', 'refs/remotes/origin/main', repo.baseSha);
    await repo.git('switch', '--quiet', '-c', 'feature/new-unit');
    const result = await initializeWorkUnit({
      projectRoot: repo.root,
      name: 'New Unit',
      branch: 'feature/new-unit',
      objective: 'Prove safe initialization.',
      risk: 'MEDIUM',
      shadowRisk: 'NORMAL',
      lastUpdated: '2026-09-20',
    });
    assert.equal(result.status, 'PASS');
    assert.equal(result.actualBranch, 'feature/new-unit');
    assert.equal(result.metadata.base_sha, repo.baseSha);
  } finally {
    await rm(repo.root, { recursive: true, force: true });
  }
});

test('safe initializer refuses active Work Units, dirty tracked work, wrong branch, and wrong base', async () => {
  const repo = await repository();
  try {
    const activeHead = await onFeature(repo);
    await repo.git('update-ref', 'refs/remotes/origin/main', activeHead);
    await assert.rejects(initializeWorkUnit({
      projectRoot: repo.root,
      name: 'Replacement',
      branch: 'feature/work-unit',
      objective: 'Must be rejected.',
      baseSha: activeHead,
    }), /refusing to overwrite ACTIVE/u);

    await writeFile(join(repo.root, 'README.md'), '# Dirty\n');
    await assert.rejects(initializeWorkUnit({
      projectRoot: repo.root,
      name: 'Replacement',
      branch: 'feature/work-unit',
      objective: 'Must be rejected.',
    }), /tracked working tree must be clean/u);

    await repo.git('restore', 'README.md');
    await assert.rejects(initializeWorkUnit({
      projectRoot: repo.root,
      name: 'Replacement',
      branch: 'feature/other',
      objective: 'Must be rejected.',
    }), /does not match intended branch/u);

    await assert.rejects(initializeWorkUnit({
      projectRoot: repo.root,
      name: 'Replacement',
      branch: 'feature/work-unit',
      objective: 'Must be rejected.',
      baseSha: repo.baseSha,
    }), /base SHA must match current origin\/main/u);
  } finally {
    await rm(repo.root, { recursive: true, force: true });
  }
});

test('shadow comparison preserves current enforcement and classifies fundamental contracts as architectural', () => {
  const result = compareHarnessRisk([
    'AGENTS.md',
    'scripts/check-work-unit.mjs',
    'test/work-unit.test.mjs',
  ]);
  assert.equal(result.currentClassification, 'CROSS_MODULE_HIGH_RISK');
  assert.equal(result.existingRequiredPipeline, 'FULL');
  assert.equal(result.proposedClassification, 'ARCHITECTURAL');
  assert.equal(result.activeEnforcement, 'CURRENT_POLICY');
  assert.equal(result.harnessMode, 'SHADOW_ONLY');
  assert.equal(result.gatesReduced, false);
});
