import { execFile } from 'node:child_process';
import { lstat, mkdtemp, readFile, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { promisify } from 'node:util';

import {
  closeIntegratedSubjectWorkUnit,
  closeWorkUnit,
  selectSubjectAttestationArtifact,
} from './lib/work-unit.mjs';

const execute = promisify(execFile);

function argument(name) {
  const index = process.argv.indexOf(name);
  return index === -1 ? undefined : process.argv[index + 1];
}

const runId = argument('--run-id');
if (!/^\d+$/u.test(runId ?? '')) {
  throw new Error('--run-id must identify the successful exact-main GitHub Actions run');
}
if (!process.argv.includes('--confirm-predicate')) {
  throw new Error('--confirm-predicate is required after evaluating the complete Work Unit closure predicate');
}
if (!process.argv.includes('--push')) {
  throw new Error('--push is required so closure is shared; local-only closure refs are forbidden');
}

const { stdout } = await execute(
  'gh',
  [
    'run',
    'view',
    runId,
    '--json',
    'databaseId,status,conclusion,headBranch,headSha,event,url,workflowName,jobs',
  ],
  { cwd: process.cwd(), encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 },
);
const authoritativeRun = JSON.parse(stdout);
if (authoritativeRun.workflowName !== 'Authoritative Linux CI') {
  throw new Error(`run ${runId} is not Authoritative Linux CI`);
}

const subjectSha = argument('--subject-sha');
if (argument('--attestation')) {
  throw new Error('local --attestation files are forbidden; subject evidence must come from the exact GitHub Actions run artifact');
}

let result;
if (subjectSha) {
  const { stdout: repositoryOutput } = await execute(
    'gh',
    ['repo', 'view', '--json', 'nameWithOwner', '--jq', '.nameWithOwner'],
    { cwd: process.cwd(), encoding: 'utf8' },
  );
  const repository = repositoryOutput.trim();
  if (!/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/u.test(repository)) {
    throw new Error('GitHub repository identity is invalid');
  }
  const { stdout: artifactOutput } = await execute(
    'gh',
    ['api', `repos/${repository}/actions/runs/${runId}/artifacts?per_page=100`],
    { cwd: process.cwd(), encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 },
  );
  const artifactInventory = JSON.parse(artifactOutput);
  if (artifactInventory.total_count !== artifactInventory.artifacts?.length) {
    throw new Error('subject attestation artifact inventory is incomplete');
  }
  const attestationProvenance = selectSubjectAttestationArtifact(
    artifactInventory.artifacts,
    runId,
  );
  const temporary = await mkdtemp(join(tmpdir(), 'srtaller-subject-attestation-'));
  try {
    await execute(
      'gh',
      [
        'run', 'download', runId,
        '--name', attestationProvenance.artifactName,
        '--dir', temporary,
      ],
      { cwd: process.cwd(), encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 },
    );
    const entries = await readdir(temporary, { withFileTypes: true });
    if (entries.length !== 1 ||
        entries[0].name !== 'AUTHORITATIVE_SUBJECT_ATTESTATION.json' ||
        !entries[0].isFile()) {
      throw new Error('subject attestation artifact must contain exactly the canonical evidence file');
    }
    const attestationPath = join(temporary, entries[0].name);
    const fileState = await lstat(attestationPath);
    if (!fileState.isFile() || fileState.isSymbolicLink()) {
      throw new Error('subject attestation evidence must be a regular file');
    }
    result = await closeIntegratedSubjectWorkUnit({
    projectRoot: process.cwd(),
    authoritativeRun,
    attestation: JSON.parse(await readFile(attestationPath, 'utf8')),
    attestationProvenance,
    subjectSha,
    confirmPredicate: true,
    push: true,
    });
  } finally {
    await rm(temporary, { force: true, recursive: true });
  }
} else {
  result = await closeWorkUnit({
    projectRoot: process.cwd(),
    authoritativeRun,
    confirmPredicate: true,
    push: true,
  });
}

process.stdout.write(`${JSON.stringify({ ...result, runUrl: authoritativeRun.url }, null, 2)}\n`);
