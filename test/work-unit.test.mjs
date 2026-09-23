import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { promisify } from 'node:util';

import { compareHarnessRisk } from '../scripts/lib/harness-risk-classifier.mjs';
import {
  closeIntegratedSubjectWorkUnit,
  closeWorkUnit,
  initializeWorkUnit,
  inspectWorkUnit,
  parseWorkUnitDocument,
  REQUIRED_WORK_UNIT_SECTIONS,
  selectSubjectAttestationArtifact,
  workUnitClosureTag,
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
  const container = await mkdtemp(join(tmpdir(), 'srtaller-work-unit-'));
  const root = join(container, 'work');
  const origin = join(container, 'origin.git');
  await execute('git', ['init', '--quiet', '--bare', origin]);
  await mkdir(root);
  const git = (...argumentsList) => execute('git', argumentsList, { cwd: root });
  await git('init', '--quiet', '--initial-branch=main');
  await git('config', 'user.name', 'SR Taller Test');
  await git('config', 'user.email', 'test@srtaller.invalid');
  await git('remote', 'add', 'origin', origin);
  await mkdir(join(root, 'docs/work'), { recursive: true });
  await writeFile(join(root, 'README.md'), '# Test\n');
  await git('add', '.');
  await git('commit', '--quiet', '-m', 'baseline');
  const baseSha = (await git('rev-parse', 'HEAD')).stdout.trim();
  await git('push', '--quiet', '--set-upstream', 'origin', 'main');
  return { container, root, origin, git, baseSha };
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

function authoritativeRun(head, { conclusion = 'success', gateConclusion = 'success' } = {}) {
  return {
    workflowName: 'Authoritative Linux CI',
    status: 'completed',
    conclusion,
    headSha: head,
    headBranch: 'main',
    event: 'push',
    jobs: [{ name: 'Authoritative promotion gate', conclusion: gateConclusion }],
  };
}

function authoritativeSubjectRun(controllerSha, {
  conclusion = 'success',
  gateConclusion = 'success',
  event = 'workflow_dispatch',
  workflowName = 'Authoritative Linux CI',
} = {}) {
  return {
    databaseId: 123456,
    workflowName,
    status: 'completed',
    conclusion,
    headSha: controllerSha,
    headBranch: 'main',
    event,
    jobs: [{ name: 'Authoritative promotion gate', conclusion: gateConclusion }],
  };
}

function subjectAttestation(controllerSha, testedSha, overrides = {}) {
  return {
    schemaVersion: 1,
    contract: 'SR_TALLER_AUTHORITATIVE_SUBJECT_V1',
    workflow: 'Authoritative Linux CI',
    workflowPath: '.github/workflows/authoritative-linux-ci.yml',
    controllerSha,
    testedSha,
    runId: 123456,
    conclusion: 'success',
    promotionGate: 'success',
    ...overrides,
  };
}

function subjectAttestationProvenance(overrides = {}) {
  return {
    artifactId: 789,
    artifactName: 'authoritative-subject-attestation',
    contract: 'GITHUB_ACTIONS_RUN_ARTIFACT_V1',
    expired: false,
    runId: '123456',
    ...overrides,
  };
}

test('subject attestation artifact selection requires one exact non-expired run artifact', () => {
  const artifact = {
    id: 789,
    name: 'authoritative-subject-attestation',
    expired: false,
    workflow_run: { id: 123456 },
  };
  assert.deepEqual(selectSubjectAttestationArtifact([artifact], '123456'), {
    artifactId: 789,
    artifactName: 'authoritative-subject-attestation',
    contract: 'GITHUB_ACTIONS_RUN_ARTIFACT_V1',
    expired: false,
    runId: '123456',
  });
  assert.throws(
    () => selectSubjectAttestationArtifact([{ ...artifact, expired: true }], '123456'),
    /invalid or expired/u,
  );
  assert.throws(
    () => selectSubjectAttestationArtifact([{ ...artifact, workflow_run: { id: 1 } }], '123456'),
    /another run/u,
  );
  assert.throws(
    () => selectSubjectAttestationArtifact([artifact, { ...artifact, id: 790 }], '123456'),
    /exactly one/u,
  );
});

async function promoteAndMerge(repo, { status = 'READY_FOR_PROMOTION' } = {}) {
  await repo.git('switch', '--quiet', '-c', 'feature/work-unit');
  await writeFile(
    join(repo.root, 'docs/work/ACTIVE_CHECKLIST.md'),
    checklist({ baseSha: repo.baseSha, status }),
  );
  await repo.git('add', '.');
  await repo.git('commit', '--quiet', '-m', 'ready work unit');
  const candidate = (await repo.git('rev-parse', 'HEAD')).stdout.trim();
  await repo.git('switch', '--quiet', 'main');
  await repo.git('merge', '--quiet', '--no-ff', 'feature/work-unit', '-m', 'merge work unit');
  const mergeCommit = (await repo.git('rev-parse', 'HEAD')).stdout.trim();
  await repo.git('push', '--quiet', 'origin', 'main');
  return { candidate, mergeCommit };
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
    await rm(repo.container, { recursive: true, force: true });
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
    await rm(repo.container, { recursive: true, force: true });
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
    await rm(repo.container, { recursive: true, force: true });
  }
});

test('explicit MAIN mode accepts IDLE main and requires a closure ref for a derived landing', async () => {
  const repo = await repository();
  try {
    await writeFile(
      join(repo.root, 'docs/work/ACTIVE_CHECKLIST.md'),
      checklist({ branch: 'main', baseSha: repo.baseSha, status: 'IDLE' }),
    );
    assert.equal((await inspectWorkUnit({ projectRoot: repo.root, mode: 'MAIN' })).status, 'PASS');
    await repo.git('add', '.');
    await repo.git('commit', '--quiet', '-m', 'idle work unit snapshot');
    repo.baseSha = (await repo.git('rev-parse', 'HEAD')).stdout.trim();
    await repo.git('push', '--quiet', 'origin', 'main');
    const { mergeCommit } = await promoteAndMerge(repo, { status: 'PROMOTION' });
    const pending = await inspectWorkUnit({ projectRoot: repo.root, mode: 'MAIN' });
    assert.equal(pending.status, 'FAIL');
    assert.equal(pending.effectiveStatus, 'PROMOTION');
    assert.ok(pending.findings.some(({ code }) => code === 'DERIVED_CLOSURE_UNPROVEN'));

    await closeWorkUnit({
      projectRoot: repo.root,
      authoritativeRun: authoritativeRun(mergeCommit),
      confirmPredicate: true,
    });
    const closed = await inspectWorkUnit({ projectRoot: repo.root, mode: 'MAIN' });
    assert.equal(closed.status, 'PASS');
    assert.equal(closed.effectiveStatus, 'IDLE');
    assert.equal(closed.closure.proven, true);
  } finally {
    await rm(repo.container, { recursive: true, force: true });
  }
});

test('promotion mode accepts ready/promotion states and rejects ACTIVE before PR', async () => {
  const repo = await repository();
  try {
    await repo.git('switch', '--quiet', '-c', 'feature/work-unit');
    for (const status of ['READY_FOR_PROMOTION', 'PROMOTION']) {
      await writeFile(
        join(repo.root, 'docs/work/ACTIVE_CHECKLIST.md'),
        checklist({ baseSha: repo.baseSha, status }),
      );
      const result = await inspectWorkUnit({
        projectRoot: repo.root,
        mode: 'PROMOTION',
      });
      assert.equal(result.status, 'PASS');
    }
    await writeFile(
      join(repo.root, 'docs/work/ACTIVE_CHECKLIST.md'),
      checklist({ baseSha: repo.baseSha, status: 'ACTIVE' }),
    );
    const active = await inspectWorkUnit({ projectRoot: repo.root, mode: 'PROMOTION' });
    assert.equal(active.status, 'FAIL');
    assert.ok(active.findings.some(({ code }) => code === 'INVALID_PROMOTION_STATUS'));
  } finally {
    await rm(repo.container, { recursive: true, force: true });
  }
});

test('an ACTIVE feature snapshot merged into main remains invalid', async () => {
  const repo = await repository();
  try {
    const { mergeCommit } = await promoteAndMerge(repo, { status: 'ACTIVE' });
    const result = await inspectWorkUnit({ projectRoot: repo.root, mode: 'MAIN' });
    assert.equal(result.status, 'FAIL');
    assert.equal(result.head, mergeCommit);
    assert.ok(result.findings.some(({ code }) => code === 'INVALID_MAIN_SNAPSHOT'));
  } finally {
    await rm(repo.container, { recursive: true, force: true });
  }
});

test('failed exact-main evidence cannot publish closure or produce false IDLE', async () => {
  const repo = await repository();
  try {
    const { mergeCommit } = await promoteAndMerge(repo);
    await assert.rejects(closeWorkUnit({
      projectRoot: repo.root,
      authoritativeRun: authoritativeRun(mergeCommit, { conclusion: 'failure' }),
      confirmPredicate: true,
    }), /not successfully completed/u);
    await assert.rejects(closeWorkUnit({
      projectRoot: repo.root,
      authoritativeRun: {
        ...authoritativeRun(mergeCommit),
        workflowName: 'Unrelated CI',
      },
      confirmPredicate: true,
    }), /must come from Authoritative Linux CI/u);
    await assert.rejects(closeWorkUnit({
      projectRoot: repo.root,
      authoritativeRun: {
        ...authoritativeRun(mergeCommit),
        headBranch: 'ci/not-main',
      },
      confirmPredicate: true,
    }), /must be bound to the main branch/u);
    const result = await inspectWorkUnit({ projectRoot: repo.root, mode: 'MAIN' });
    assert.equal(result.status, 'FAIL');
    assert.equal(result.effectiveStatus, 'PROMOTION');
    const metadata = parseWorkUnitDocument(await readFile(
      join(repo.root, 'docs/work/ACTIVE_CHECKLIST.md'),
      'utf8',
    )).metadata;
    await assert.rejects(
      repo.git('rev-parse', '--verify', `refs/tags/${workUnitClosureTag(metadata)}^{commit}`),
    );
  } finally {
    await rm(repo.container, { recursive: true, force: true });
  }
});

test('closure rejects a stale origin/main cache when the live remote has advanced', async () => {
  const repo = await repository();
  try {
    const { mergeCommit } = await promoteAndMerge(repo);
    await execute('git', [
      '--git-dir',
      repo.origin,
      'update-ref',
      'refs/heads/main',
      repo.baseSha,
    ]);
    await assert.rejects(closeWorkUnit({
      projectRoot: repo.root,
      authoritativeRun: authoritativeRun(mergeCommit),
      confirmPredicate: true,
    }), /must equal live origin\/main/u);
  } finally {
    await rm(repo.container, { recursive: true, force: true });
  }
});

test('a non-merged feature branch cannot publish false closure', async () => {
  const repo = await repository();
  try {
    const candidate = await onFeature(repo);
    await writeFile(
      join(repo.root, 'docs/work/ACTIVE_CHECKLIST.md'),
      checklist({ baseSha: repo.baseSha, status: 'READY_FOR_PROMOTION' }),
    );
    await repo.git('add', '.');
    await repo.git('commit', '--quiet', '-m', 'ready for promotion');
    await assert.rejects(closeWorkUnit({
      projectRoot: repo.root,
      authoritativeRun: authoritativeRun(candidate),
      confirmPredicate: true,
    }), /must run on main/u);
    const metadata = parseWorkUnitDocument(await readFile(
      join(repo.root, 'docs/work/ACTIVE_CHECKLIST.md'),
      'utf8',
    )).metadata;
    await assert.rejects(
      repo.git('rev-parse', '--verify', `refs/tags/${workUnitClosureTag(metadata)}^{commit}`),
    );
  } finally {
    await rm(repo.container, { recursive: true, force: true });
  }
});

test('closure ref changes no commit, enables effective IDLE and permits the next authorized Work Unit', async () => {
  const repo = await repository();
  try {
    const { mergeCommit } = await promoteAndMerge(repo);
    const commitCountBefore = (await repo.git('rev-list', '--count', 'HEAD')).stdout.trim();
    const closure = await closeWorkUnit({
      projectRoot: repo.root,
      authoritativeRun: authoritativeRun(mergeCommit),
      confirmPredicate: true,
    });
    assert.equal(closure.status, 'CLOSED');
    assert.equal(closure.effectiveStatus, 'IDLE');
    assert.equal((await repo.git('rev-list', '--count', 'HEAD')).stdout.trim(), commitCountBefore);
    assert.equal((await repo.git('status', '--porcelain=v1')).stdout.trim(), '');
    const repeated = await closeWorkUnit({
      projectRoot: repo.root,
      authoritativeRun: authoritativeRun(mergeCommit),
      confirmPredicate: true,
    });
    assert.equal(repeated.status, 'ALREADY_CLOSED');
    assert.equal(
      (await repo.git('ls-remote', '--tags', 'origin', closure.ref)).stdout
        .trim()
        .split(/\s+/u)[0],
      await repo.git('rev-parse', closure.ref).then(({ stdout }) => stdout.trim()),
    );

    const main = await inspectWorkUnit({ projectRoot: repo.root, mode: 'MAIN' });
    assert.equal(main.status, 'PASS');
    assert.equal(main.effectiveStatus, 'IDLE');

    await repo.git('switch', '--quiet', '-c', 'feature/next-unit');
    const next = await initializeWorkUnit({
      projectRoot: repo.root,
      name: 'Next Unit',
      branch: 'feature/next-unit',
      objective: 'Prove the next Work Unit can start after derived closure.',
      risk: 'NORMAL',
      shadowRisk: 'NORMAL',
      lastUpdated: '2026-09-21',
      confirmPreviousClosed: true,
    });
    assert.equal(next.status, 'PASS');
    assert.equal(next.metadata.status, 'ACTIVE');
  } finally {
    await rm(repo.container, { recursive: true, force: true });
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
    await repo.git('commit', '--quiet', '-m', 'idle work unit snapshot');
    repo.baseSha = (await repo.git('rev-parse', 'HEAD')).stdout.trim();
    await repo.git('push', '--quiet', 'origin', 'main');
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
    await rm(repo.container, { recursive: true, force: true });
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
    await rm(repo.container, { recursive: true, force: true });
  }
});

test('the governed dependency exception is limited to the named Infra dependency and preserves TL-07', async () => {
  const repo = await repository();
  try {
    await repo.git('switch', '--quiet', '-c', 'feature/tl-07');
    await writeFile(
      join(repo.root, 'docs/work/ACTIVE_CHECKLIST.md'),
      checklist({ branch: 'feature/tl-07', baseSha: repo.baseSha, status: 'PROMOTION' }),
    );
    await repo.git('add', '.');
    await repo.git('commit', '--quiet', '-m', 'tl07 promotion snapshot');
    await repo.git('switch', '--quiet', 'main');
    await repo.git('merge', '--quiet', '--no-ff', 'feature/tl-07', '-m', 'merge tl07');
    const subjectSha = (await repo.git('rev-parse', 'HEAD')).stdout.trim();
    await repo.git('push', '--quiet', 'origin', 'main');

    await repo.git('switch', '--quiet', '-c', 'chore/deterministic-authoritative-ci-runner');
    await assert.rejects(initializeWorkUnit({
      projectRoot: repo.root,
      name: 'TL-08 — Device Redemption',
      branch: 'chore/deterministic-authoritative-ci-runner',
      objective: 'Must not use the Infra exception.',
      type: 'PRODUCT',
      dependencyException: 'INFRA_CI_BLOCKER',
    }), /limited to the named Infrastructure\/Quality Work Unit/u);

    const result = await initializeWorkUnit({
      projectRoot: repo.root,
      name: 'INFRA — Deterministic Authoritative CI Runner',
      branch: 'chore/deterministic-authoritative-ci-runner',
      objective: 'Restore deterministic authoritative CI for the preserved TL-07 dependency.',
      risk: 'ARCHITECTURAL',
      shadowRisk: 'ARCHITECTURAL',
      type: 'INFRASTRUCTURE_QUALITY',
      dependencyException: 'INFRA_CI_BLOCKER',
      lastUpdated: '2026-09-22',
    });
    assert.equal(result.status, 'PASS');
    assert.equal(result.metadata.dependency_work_unit, 'Test Work Unit');
    assert.equal(result.metadata.dependency_branch, 'feature/tl-07');
    assert.equal(result.metadata.dependency_subject_sha, subjectSha);
    assert.equal(result.metadata.dependency_status, 'PROMOTION');
    assert.equal(result.metadata.dependency_return, 'REQUIRED');
  } finally {
    await rm(repo.container, { recursive: true, force: true });
  }
});

test('subject-SHA closure is fail-closed and targets only the explicitly preserved integrated dependency', async () => {
  const repo = await repository();
  try {
    await repo.git('switch', '--quiet', '-c', 'feature/tl-07');
    await writeFile(
      join(repo.root, 'docs/work/ACTIVE_CHECKLIST.md'),
      checklist({ branch: 'feature/tl-07', baseSha: repo.baseSha, status: 'PROMOTION' }),
    );
    await repo.git('add', '.');
    await repo.git('commit', '--quiet', '-m', 'tl07 promotion snapshot');
    await repo.git('switch', '--quiet', 'main');
    await repo.git('merge', '--quiet', '--no-ff', 'feature/tl-07', '-m', 'merge tl07');
    const subjectSha = (await repo.git('rev-parse', 'HEAD')).stdout.trim();
    await repo.git('push', '--quiet', 'origin', 'main');

    await repo.git('switch', '--quiet', '-c', 'chore/deterministic-authoritative-ci-runner');
    await initializeWorkUnit({
      projectRoot: repo.root,
      name: 'INFRA — Deterministic Authoritative CI Runner',
      branch: 'chore/deterministic-authoritative-ci-runner',
      objective: 'Restore deterministic authoritative CI for the preserved TL-07 dependency.',
      risk: 'ARCHITECTURAL',
      shadowRisk: 'ARCHITECTURAL',
      type: 'INFRASTRUCTURE_QUALITY',
      dependencyException: 'INFRA_CI_BLOCKER',
      lastUpdated: '2026-09-22',
    });
    const checklistPath = join(repo.root, 'docs/work/ACTIVE_CHECKLIST.md');
    const readySource = (await readFile(checklistPath, 'utf8'))
      .replace('status: ACTIVE', 'status: READY_FOR_PROMOTION');
    await writeFile(checklistPath, readySource);
    await repo.git('add', '.');
    await repo.git('commit', '--quiet', '-m', 'infra ready');
    await repo.git('switch', '--quiet', 'main');
    await repo.git('merge', '--quiet', '--no-ff', 'chore/deterministic-authoritative-ci-runner', '-m', 'merge infra');
    const controllerSha = (await repo.git('rev-parse', 'HEAD')).stdout.trim();
    await repo.git('push', '--quiet', 'origin', 'main');
    await closeWorkUnit({
      projectRoot: repo.root,
      authoritativeRun: authoritativeRun(controllerSha),
      confirmPredicate: true,
    });

    const run = authoritativeSubjectRun(controllerSha);
    const attestation = subjectAttestation(controllerSha, subjectSha);
    await assert.rejects(closeIntegratedSubjectWorkUnit({
      projectRoot: repo.root,
      authoritativeRun: run,
      attestation,
      attestationProvenance: subjectAttestationProvenance(),
      subjectSha: repo.baseSha,
      confirmPredicate: true,
    }), /not the explicitly authorized dependency subject/u);
    await assert.rejects(closeIntegratedSubjectWorkUnit({
      projectRoot: repo.root,
      authoritativeRun: run,
      attestation: subjectAttestation(controllerSha, subjectSha, { testedSha: repo.baseSha }),
      attestationProvenance: subjectAttestationProvenance(),
      subjectSha,
      confirmPredicate: true,
    }), /testedSha mismatch/u);
    await assert.rejects(closeIntegratedSubjectWorkUnit({
      projectRoot: repo.root,
      authoritativeRun: run,
      attestation: subjectAttestation(controllerSha, subjectSha, { controllerSha: repo.baseSha }),
      attestationProvenance: subjectAttestationProvenance(),
      subjectSha,
      confirmPredicate: true,
    }), /controller SHA mismatch/u);
    await assert.rejects(closeIntegratedSubjectWorkUnit({
      projectRoot: repo.root,
      authoritativeRun: authoritativeSubjectRun(controllerSha, { workflowName: 'Untrusted workflow' }),
      attestation,
      attestationProvenance: subjectAttestationProvenance(),
      subjectSha,
      confirmPredicate: true,
    }), /must come from Authoritative Linux CI/u);
    await assert.rejects(closeIntegratedSubjectWorkUnit({
      projectRoot: repo.root,
      authoritativeRun: authoritativeSubjectRun(controllerSha, { conclusion: 'failure' }),
      attestation,
      attestationProvenance: subjectAttestationProvenance(),
      subjectSha,
      confirmPredicate: true,
    }), /not successfully completed/u);
    await assert.rejects(closeIntegratedSubjectWorkUnit({
      projectRoot: repo.root,
      authoritativeRun: authoritativeSubjectRun(controllerSha, { gateConclusion: 'skipped' }),
      attestation,
      attestationProvenance: subjectAttestationProvenance(),
      subjectSha,
      confirmPredicate: true,
    }), /promotion gate is not successful/u);
    await assert.rejects(closeIntegratedSubjectWorkUnit({
      projectRoot: repo.root,
      authoritativeRun: run,
      attestation,
      subjectSha,
      confirmPredicate: true,
    }), /lacks exact GitHub Actions artifact provenance/u);

    const subjectMetadata = parseWorkUnitDocument(await repo.git(
      'show',
      `${subjectSha}:docs/work/ACTIVE_CHECKLIST.md`,
    ).then(({ stdout }) => stdout)).metadata;
    const subjectClosureTag = workUnitClosureTag(subjectMetadata);
    await repo.git('tag', '-a', subjectClosureTag, '-m', 'wrong target', repo.baseSha);
    await assert.rejects(closeIntegratedSubjectWorkUnit({
      projectRoot: repo.root,
      authoritativeRun: run,
      attestation,
      attestationProvenance: subjectAttestationProvenance(),
      subjectSha,
      confirmPredicate: true,
    }), /already targets .* not/u);
    await repo.git('tag', '-d', subjectClosureTag);

    const closure = await closeIntegratedSubjectWorkUnit({
      projectRoot: repo.root,
      authoritativeRun: run,
      attestation,
      attestationProvenance: subjectAttestationProvenance(),
      subjectSha,
      confirmPredicate: true,
    });
    assert.equal(closure.status, 'CLOSED');
    assert.equal(closure.mergeCommit, subjectSha);
    assert.equal(
      (await repo.git('rev-parse', `${closure.ref}^{commit}`)).stdout.trim(),
      subjectSha,
    );
  } finally {
    await rm(repo.container, { recursive: true, force: true });
  }
});

test('subject-SHA closure rejects an explicitly named subject outside live main history', async () => {
  const repo = await repository();
  try {
    await repo.git('switch', '--quiet', '-c', 'feature/tl-07');
    await writeFile(
      join(repo.root, 'docs/work/ACTIVE_CHECKLIST.md'),
      checklist({ branch: 'feature/tl-07', baseSha: repo.baseSha, status: 'PROMOTION' }),
    );
    await repo.git('add', '.');
    await repo.git('commit', '--quiet', '-m', 'tl07 promotion snapshot');
    await repo.git('switch', '--quiet', 'main');
    await repo.git('merge', '--quiet', '--no-ff', 'feature/tl-07', '-m', 'merge tl07');
    const integratedSubjectSha = (await repo.git('rev-parse', 'HEAD')).stdout.trim();
    await repo.git('push', '--quiet', 'origin', 'main');

    await repo.git('switch', '--quiet', '-c', 'side/unauthorized-subject', repo.baseSha);
    await writeFile(join(repo.root, 'side.txt'), 'outside live main history\n');
    await repo.git('add', '.');
    await repo.git('commit', '--quiet', '-m', 'unintegrated subject');
    const unintegratedSubjectSha = (await repo.git('rev-parse', 'HEAD')).stdout.trim();

    await repo.git('switch', '--quiet', 'main');
    await repo.git('switch', '--quiet', '-c', 'chore/deterministic-authoritative-ci-runner');
    await initializeWorkUnit({
      projectRoot: repo.root,
      name: 'INFRA — Deterministic Authoritative CI Runner',
      branch: 'chore/deterministic-authoritative-ci-runner',
      objective: 'Restore deterministic authoritative CI for the preserved TL-07 dependency.',
      risk: 'ARCHITECTURAL',
      shadowRisk: 'ARCHITECTURAL',
      type: 'INFRASTRUCTURE_QUALITY',
      dependencyException: 'INFRA_CI_BLOCKER',
      lastUpdated: '2026-09-22',
    });
    const checklistPath = join(repo.root, 'docs/work/ACTIVE_CHECKLIST.md');
    const readySource = (await readFile(checklistPath, 'utf8'))
      .replace(`dependency_subject_sha: ${integratedSubjectSha}`, `dependency_subject_sha: ${unintegratedSubjectSha}`)
      .replace('status: ACTIVE', 'status: READY_FOR_PROMOTION');
    await writeFile(checklistPath, readySource);
    await repo.git('add', '.');
    await repo.git('commit', '--quiet', '-m', 'infra ready with forged subject');
    await repo.git('switch', '--quiet', 'main');
    await repo.git('merge', '--quiet', '--no-ff', 'chore/deterministic-authoritative-ci-runner', '-m', 'merge infra');
    const controllerSha = (await repo.git('rev-parse', 'HEAD')).stdout.trim();
    await repo.git('push', '--quiet', 'origin', 'main');
    await closeWorkUnit({
      projectRoot: repo.root,
      authoritativeRun: authoritativeRun(controllerSha),
      confirmPredicate: true,
    });

    await assert.rejects(closeIntegratedSubjectWorkUnit({
      projectRoot: repo.root,
      authoritativeRun: authoritativeSubjectRun(controllerSha),
      attestation: subjectAttestation(controllerSha, unintegratedSubjectSha),
      attestationProvenance: subjectAttestationProvenance(),
      subjectSha: unintegratedSubjectSha,
      confirmPredicate: true,
    }), /not an ancestor integrated into live main/u);
  } finally {
    await rm(repo.container, { recursive: true, force: true });
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
