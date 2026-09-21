import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

import { closeWorkUnit } from './lib/work-unit.mjs';

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

const result = await closeWorkUnit({
  projectRoot: process.cwd(),
  authoritativeRun,
  confirmPredicate: true,
  push: true,
});

process.stdout.write(`${JSON.stringify({ ...result, runUrl: authoritativeRun.url }, null, 2)}\n`);
