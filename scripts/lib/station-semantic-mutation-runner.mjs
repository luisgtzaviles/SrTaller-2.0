import { execFile } from 'node:child_process';
import {
  cp,
  lstat,
  mkdir,
  mkdtemp,
  readFile,
  rm,
  symlink,
  writeFile,
} from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { basename, join, resolve } from 'node:path';
import { promisify } from 'node:util';

import {
  stationMutationTestFiles,
  stationSemanticMutations,
} from './station-semantic-mutations.mjs';

const execute = promisify(execFile);
const workspaceEntries = Object.freeze([
  '.node-version',
  '.npmrc',
  '.nvmrc',
  'architecture',
  'package.json',
  'pnpm-lock.yaml',
  'scripts',
  'src',
  'supply-chain-policy.json',
  'test',
  'tsconfig.build.json',
  'tsconfig.json',
]);

async function processResult(command, argumentsList, options) {
  try {
    const result = await execute(command, argumentsList, {
      encoding: 'utf8',
      maxBuffer: 20 * 1024 * 1024,
      ...options,
    });
    return Object.freeze({
      code: 0,
      output: `${result.stdout ?? ''}\n${result.stderr ?? ''}`,
      timedOut: false,
    });
  } catch (error) {
    return Object.freeze({
      code: typeof error?.code === 'number' ? error.code : -1,
      output: `${error?.stdout ?? ''}\n${error?.stderr ?? ''}`,
      timedOut:
        error?.killed === true ||
        error?.signal === 'SIGTERM' ||
        error?.code === 'ETIMEDOUT',
    });
  }
}

export function assertMutationExecution(result) {
  if (!result.applied) {
    throw new Error('MUTATION_NOT_APPLIED');
  }
  if (result.compile.timedOut || result.test.timedOut) {
    throw new Error('MUTATION_TIMEOUT');
  }
  if (result.compile.code !== 0) {
    throw new Error('MUTATION_DID_NOT_COMPILE');
  }
  if (result.test.code === 0) {
    throw new Error('MUTATION_SURVIVED');
  }
  if (!result.expectedFailureObserved) {
    throw new Error('MUTATION_UNRELATED_FAILURE');
  }
  if (!result.cleanupComplete) {
    throw new Error('MUTATION_CLEANUP_INCOMPLETE');
  }
  if (result.residualFile) {
    throw new Error('MUTATION_RESIDUAL_FILE');
  }
  if (!result.workingTreePreserved) {
    throw new Error('MUTATION_WORKTREE_CONTAMINATED');
  }
}

async function copyWorkspace(repositoryRoot, workspace) {
  await mkdir(workspace, { recursive: true });
  for (const entry of workspaceEntries) {
    await cp(
      join(repositoryRoot, entry),
      join(workspace, entry),
      { recursive: true },
    );
  }
  await symlink(
    join(repositoryRoot, 'node_modules'),
    join(workspace, 'node_modules'),
    'dir',
  );
}

async function gitStatus(repositoryRoot) {
  const { stdout } = await execute(
    'git',
    ['status', '--short', '--untracked-files=all'],
    { cwd: repositoryRoot, encoding: 'utf8' },
  );
  return stdout;
}

async function exists(path) {
  try {
    await lstat(path);
    return true;
  } catch (error) {
    if (error?.code === 'ENOENT') {
      return false;
    }
    throw error;
  }
}

export async function runStationMutationCampaign({
  mutations = stationSemanticMutations,
  repositoryRoot = process.cwd(),
  compileTimeoutMs = 45_000,
  testTimeoutMs = 30_000,
} = {}) {
  const root = resolve(repositoryRoot);
  const initialStatus = await gitStatus(root);
  const results = [];
  for (const mutation of mutations) {
    const startedAt = performance.now();
    const temporaryRoot = await mkdtemp(
      join(tmpdir(), 'srtaller-pbi024-semantic-mutation-'),
    );
    const workspace = join(temporaryRoot, 'workspace');
    let result;
    let cleanupComplete = false;
    let residualFile = false;
    try {
      await copyWorkspace(root, workspace);
      const target = join(workspace, mutation.file);
      const baseline = await readFile(target, 'utf8');
      const mutated = mutation.mutate(baseline);
      const applied = mutated !== baseline;
      await writeFile(target, mutated);
      const compile = await processResult(
        'pnpm',
        ['run', 'build'],
        { cwd: workspace, timeout: compileTimeoutMs },
      );
      const testEnvironment = { ...process.env };
      delete testEnvironment.NODE_TEST_CONTEXT;
      const testResult = compile.code === 0 && !compile.timedOut
        ? await processResult(
            process.execPath,
            ['--test', ...stationMutationTestFiles],
            {
              cwd: workspace,
              env: testEnvironment,
              timeout: testTimeoutMs,
            },
          )
        : Object.freeze({ code: -1, output: '', timedOut: false });
      result = {
        id: mutation.id,
        description: mutation.description,
        file: mutation.file,
        transformation: `${basename(mutation.file)} semantic defect`,
        command:
          `pnpm run build && node --test ${stationMutationTestFiles.join(' ')}`,
        expectedTest: mutation.expectedTest,
        applied,
        compile: {
          code: compile.code,
          timedOut: compile.timedOut,
        },
        compileOutput: compile.output,
        test: {
          code: testResult.code,
          timedOut: testResult.timedOut,
        },
        testOutput: testResult.output,
        expectedFailureObserved:
          testResult.output.includes(mutation.expectedTest),
        failedTest: mutation.expectedTest,
        manual: mutation.manual === true,
      };
    } finally {
      await rm(temporaryRoot, { recursive: true, force: true });
      cleanupComplete = !(await exists(temporaryRoot));
      residualFile = await exists(workspace);
    }
    const finalStatus = await gitStatus(root);
    const completed = {
      ...result,
      cleanupComplete,
      residualFile,
      workingTreePreserved: finalStatus === initialStatus,
      durationMs: Math.round(performance.now() - startedAt),
    };
    const {
      compileOutput,
      testOutput,
      ...publicCompleted
    } = completed;
    try {
      assertMutationExecution(publicCompleted);
    } catch (error) {
      const diagnostic = [
        `semantic mutation ${mutation.id}: ${error.message}`,
        result?.compile?.code === 0 ? '' : compileOutput,
        result?.test?.code === 0 ? '' : testOutput,
      ]
        .filter((value) => typeof value === 'string' && value !== '')
        .join('\n')
        .replaceAll(temporaryRoot, '<mutation-workspace>')
        .split('\n')
        .slice(-40)
        .join('\n');
      throw new Error(diagnostic);
    }
    results.push(Object.freeze(publicCompleted));
  }
  const finalStatus = await gitStatus(root);
  if (finalStatus !== initialStatus) {
    throw new Error('MUTATION_WORKTREE_CONTAMINATED');
  }
  return Object.freeze({
    schemaVersion: 1,
    mode: 'semantic',
    workspaceStrategy: 'controlled-temporary-copy',
    total: results.length,
    killed: results.length,
    survived: 0,
    results: Object.freeze(results),
  });
}
