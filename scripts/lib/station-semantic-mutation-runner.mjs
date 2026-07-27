import { execFile } from 'node:child_process';
import {
  cp,
  lstat,
  mkdir,
  mkdtemp,
  readFile,
  realpath,
  rm,
  symlink,
  writeFile,
} from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import { promisify } from 'node:util';

import {
  stationMutationTestFiles,
  stationSemanticMutations,
} from './station-semantic-mutations.mjs';
import {
  matchesStationCausalSignature,
  matchesStationTestIdentity,
  parseStationTestResults,
  stationTestIdentityKey,
  stationTestReporterFormat,
} from './station-test-results.mjs';

const execute = promisify(execFile);
const defaultReporterPath = 'scripts/lib/node-test-json-reporter.mjs';
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

export const stationMutationClassifications = Object.freeze([
  'PASS',
  'EXPECTED_TEST_FAILURE',
  'UNRELATED_TEST_FAILURE',
  'BUILD_FAILURE',
  'TEST_DISCOVERY_FAILURE',
  'INFRASTRUCTURE_FAILURE',
  'TIMEOUT',
  'MUTATION_NOT_APPLIED',
  'RESULT_PARSE_FAILURE',
  'CLEANUP_FAILURE',
]);

export class StationMutationCampaignError extends Error {
  constructor(report) {
    const failures = report.results
      .filter(({ killed }) => !killed)
      .map(({ mutationId, classification }) =>
        `${mutationId}:${classification}`)
      .join(', ');
    super(`STATION_MUTATION_CAMPAIGN_FAILED: ${failures}`);
    this.name = 'StationMutationCampaignError';
    this.report = report;
  }
}

async function processResult(command, argumentsList, options) {
  try {
    const result = await execute(command, argumentsList, {
      encoding: 'utf8',
      maxBuffer: 20 * 1024 * 1024,
      ...options,
    });
    return Object.freeze({
      code: 0,
      completed: true,
      signal: null,
      spawnFailure: false,
      stderr: result.stderr ?? '',
      stdout: result.stdout ?? '',
      timedOut: false,
    });
  } catch (error) {
    const timedOut =
      error?.killed === true ||
      error?.signal === 'SIGTERM' ||
      error?.code === 'ETIMEDOUT';
    return Object.freeze({
      code: typeof error?.code === 'number' ? error.code : -1,
      completed: true,
      signal: typeof error?.signal === 'string' ? error.signal : null,
      spawnFailure: !timedOut && typeof error?.code === 'string',
      stderr: error?.stderr ?? '',
      stdout: error?.stdout ?? '',
      timedOut,
    });
  }
}

function requiredExpectedTests(mutation) {
  if (
    !Array.isArray(mutation.expectedTests) ||
    mutation.expectedTests.length === 0
  ) {
    throw new Error(`INVALID_EXPECTED_TESTS:${mutation.id}`);
  }
  for (const expected of mutation.expectedTests) {
    stationTestIdentityKey(expected);
  }
  return mutation.expectedTests;
}

function publicTestResult(result) {
  return Object.freeze({
    error: result.error,
    file: result.file,
    fullName: result.fullName,
    status: result.status,
  });
}

function uniqueFiles(results) {
  return Object.freeze([...new Set(results.map(({ file }) => file))].sort());
}

function isDiscoveryFailure(result) {
  return result.status === 'FAIL' &&
    (
      result.fullName === result.file ||
      result.fullName.endsWith(`/${result.file}`)
    );
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
  const nodeModules = join(workspace, 'node_modules');
  await symlink(join(repositoryRoot, 'node_modules'), nodeModules, 'dir');
  return (await lstat(nodeModules)).isSymbolicLink();
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

async function workspaceProcesses(workspace) {
  const processes = await processResult(
    'ps',
    ['-ax', '-o', 'pid=,command='],
    { timeout: 5_000 },
  );
  if (processes.code !== 0 || processes.spawnFailure || processes.timedOut) {
    throw new Error('WORKSPACE_PROCESS_INSPECTION_FAILED');
  }
  return processes.stdout
    .split('\n')
    .map((line) => /^\s*(\d+)\s+(.*)$/u.exec(line))
    .filter((match) =>
      match !== null &&
      Number(match[1]) !== process.pid &&
      match[2].includes(resolve(workspace)))
    .map((match) => Number(match[1]));
}

function signalProcess(pid, signal) {
  try {
    process.kill(pid, signal);
    return true;
  } catch (error) {
    return error?.code === 'ESRCH';
  }
}

async function terminateWorkspaceProcesses(workspace) {
  const detected = await workspaceProcesses(workspace);
  for (const pid of detected) {
    signalProcess(pid, 'SIGTERM');
  }
  for (let attempt = 0; attempt < 20; attempt += 1) {
    if ((await workspaceProcesses(workspace)).length === 0) {
      return Object.freeze({
        detected: detected.length !== 0,
        terminated: true,
      });
    }
    await delay(25);
  }
  for (const pid of await workspaceProcesses(workspace)) {
    signalProcess(pid, 'SIGKILL');
  }
  await delay(25);
  return Object.freeze({
    detected: detected.length !== 0,
    terminated: (await workspaceProcesses(workspace)).length === 0,
  });
}

function testCommandArguments(reporterPath, testFiles) {
  return [
    '--test',
    '--test-isolation=none',
    `--test-reporter=${reporterPath}`,
    ...testFiles,
  ];
}

async function executeStructuredTests({
  reporterPath = defaultReporterPath,
  testFiles,
  timeoutMs,
  workspace,
}) {
  const testEnvironment = { ...process.env };
  delete testEnvironment.NODE_TEST_CONTEXT;
  const execution = await processResult(
    process.execPath,
    testCommandArguments(resolve(workspace, reporterPath), testFiles),
    {
      cwd: workspace,
      env: testEnvironment,
      timeout: timeoutMs,
    },
  );
  return execution;
}

function validateBaselineTargets(inventory, expectedTests) {
  const targets = [];
  for (const expected of expectedTests) {
    const matching = inventory.filter((result) =>
      matchesStationTestIdentity(result, expected));
    if (matching.length !== 1) {
      throw new Error(
        `BASELINE_TARGET_AMBIGUOUS_OR_MISSING:${stationTestIdentityKey(expected)}`,
      );
    }
    if (matching[0].status !== 'PASS') {
      throw new Error(
        `BASELINE_TARGET_NOT_PASSING:${stationTestIdentityKey(expected)}`,
      );
    }
    targets.push(Object.freeze({
      file: expected.file,
      fullName: expected.fullName,
      status: matching[0].status,
    }));
  }
  return Object.freeze(targets);
}

export async function runStationMutationBaseline({
  expectedTests,
  repositoryRoot = process.cwd(),
  compileTimeoutMs = 45_000,
  testFiles = stationMutationTestFiles,
  testTimeoutMs = 30_000,
} = {}) {
  const root = resolve(repositoryRoot);
  const initialStatus = await gitStatus(root);
  const temporaryRoot = await mkdtemp(
    join(tmpdir(), 'srtaller-pbi024-semantic-baseline-'),
  );
  const workspace = join(temporaryRoot, 'workspace');
  let cleanupStatus = 'FAIL';
  let nodeModulesSymlink = false;
  let childProcessesStatus = 'NOT_CHECKED';
  try {
    nodeModulesSymlink = await copyWorkspace(root, workspace);
    const build = await processResult(
      'pnpm',
      ['run', 'build'],
      { cwd: workspace, timeout: compileTimeoutMs },
    );
    if (build.timedOut) {
      throw new Error('BASELINE_BUILD_TIMEOUT');
    }
    if (build.spawnFailure || build.code !== 0) {
      throw new Error('BASELINE_BUILD_FAILURE');
    }

    const testExecution = await executeStructuredTests({
      testFiles,
      timeoutMs: testTimeoutMs,
      workspace,
    });
    if (testExecution.timedOut) {
      throw new Error('BASELINE_TEST_TIMEOUT');
    }
    if (testExecution.spawnFailure) {
      throw new Error('BASELINE_TEST_INFRASTRUCTURE_FAILURE');
    }
    const parsed = parseStationTestResults(testExecution.stdout, {
      repositoryRoot: await realpath(workspace),
    });
    if (
      testExecution.code !== 0 ||
      parsed.tests.some(({ status }) => status === 'FAIL')
    ) {
      throw new Error('BASELINE_TEST_FAILURE');
    }

    const inventory = Object.freeze(parsed.tests.map(publicTestResult));
    const targets = validateBaselineTargets(inventory, expectedTests);
    return Object.freeze({
      buildStatus: 'PASS',
      executedTestFiles: uniqueFiles(inventory),
      inventory,
      nodeModulesSymlink,
      reporterFormat: stationTestReporterFormat,
      status: 'PASS',
      targets,
      testProcessStatus: 'PASS',
    });
  } finally {
    const processCleanup = await terminateWorkspaceProcesses(workspace);
    childProcessesStatus =
      !processCleanup.detected && processCleanup.terminated
        ? 'PASS'
        : 'FAIL';
    await rm(temporaryRoot, { recursive: true, force: true });
    cleanupStatus = !(await exists(temporaryRoot)) ? 'PASS' : 'FAIL';
    const finalStatus = await gitStatus(root);
    if (
      cleanupStatus !== 'PASS' ||
      finalStatus !== initialStatus ||
      !nodeModulesSymlink ||
      childProcessesStatus !== 'PASS'
    ) {
      throw new Error('BASELINE_CLEANUP_FAILURE');
    }
  }
}

function baseMutationResult(mutation) {
  return {
    applied: false,
    buildStatus: 'NOT_RUN',
    causalMatch: false,
    childProcessesStatus: 'NOT_CHECKED',
    classification: 'MUTATION_NOT_APPLIED',
    cleanupStatus: 'FAIL',
    description: mutation.description,
    durationMs: 0,
    executedTestFiles: Object.freeze([]),
    expectedTests: Object.freeze(
      requiredExpectedTests(mutation).map((expected) =>
        Object.freeze(structuredClone(expected))),
    ),
    expectedTestsFailed: Object.freeze([]),
    failedTests: Object.freeze([]),
    infrastructureFailure: false,
    killed: false,
    manual: mutation.manual === true,
    mutationId: mutation.id,
    nodeModulesSymlink: false,
    parsedTestResults: Object.freeze([]),
    reporterFormat: stationTestReporterFormat,
    residualWorkspace: true,
    targetFile: mutation.file,
    testProcessStatus: 'NOT_RUN',
    timeout: false,
    unexpectedTestsFailed: Object.freeze([]),
    workingTreePreserved: false,
  };
}

function classifyStructuredTestExecution(result, parsed, execution) {
  const testResults = parsed.tests.map(publicTestResult);
  const expectedTestsFailed = testResults.filter(
    (testResult) =>
      testResult.status === 'FAIL' &&
      result.expectedTests.some((expected) =>
        matchesStationTestIdentity(testResult, expected)),
  );
  const unexpectedTestsFailed = testResults.filter(
    (testResult) =>
      testResult.status === 'FAIL' &&
      !result.expectedTests.some((expected) =>
        matchesStationTestIdentity(testResult, expected)),
  );
  const expectedExecutions = result.expectedTests.flatMap((expected) =>
    testResults.filter((testResult) =>
      matchesStationTestIdentity(testResult, expected)),
  );

  result.parsedTestResults = Object.freeze(testResults);
  result.executedTestFiles = uniqueFiles(testResults);
  result.failedTests = Object.freeze(
    testResults.filter(({ status }) => status === 'FAIL'),
  );
  result.expectedTestsFailed = Object.freeze(expectedTestsFailed);
  result.unexpectedTestsFailed = Object.freeze(unexpectedTestsFailed);
  result.testProcessStatus = execution.code === 0
    ? 'PASS'
    : 'TEST_FAILURE';

  if (
    result.expectedTests.some((expected) =>
      testResults.filter((testResult) =>
        matchesStationTestIdentity(testResult, expected)).length !== 1)
  ) {
    result.classification = 'TEST_DISCOVERY_FAILURE';
    return;
  }
  if (expectedExecutions.some(({ status }) => status === 'SKIP')) {
    result.classification = 'TEST_DISCOVERY_FAILURE';
    return;
  }
  if (
    result.failedTests.some(isDiscoveryFailure) ||
    (execution.code !== 0 && result.failedTests.length === 0)
  ) {
    result.classification = 'TEST_DISCOVERY_FAILURE';
    return;
  }
  if (
    (execution.code === 0 && result.failedTests.length !== 0) ||
    (execution.code !== 0 && result.failedTests.length === 0)
  ) {
    result.classification = 'RESULT_PARSE_FAILURE';
    return;
  }
  if (execution.code === 0) {
    result.classification = 'PASS';
    return;
  }

  result.causalMatch = result.expectedTests.some((expected) =>
    expectedTestsFailed.some((failed) =>
      matchesStationTestIdentity(failed, expected) &&
      matchesStationCausalSignature(failed, expected.causalSignature)),
  );
  if (result.causalMatch) {
    result.classification = 'EXPECTED_TEST_FAILURE';
    result.killed = true;
  } else {
    result.classification = 'UNRELATED_TEST_FAILURE';
  }
}

export async function runStationMutation({
  mutation,
  repositoryRoot = process.cwd(),
  compileTimeoutMs = 45_000,
  testFiles = stationMutationTestFiles,
  testTimeoutMs = 30_000,
} = {}) {
  if (!mutation) {
    throw new Error('mutation is required');
  }

  const root = resolve(repositoryRoot);
  const initialStatus = await gitStatus(root);
  const startedAt = performance.now();
  const temporaryRoot = await mkdtemp(
    join(tmpdir(), 'srtaller-pbi024-semantic-mutation-'),
  );
  const workspace = join(temporaryRoot, 'workspace');
  const result = baseMutationResult(mutation);
  let cleanupProbeFailed = false;

  try {
    result.nodeModulesSymlink = await copyWorkspace(root, workspace);
    const target = join(workspace, mutation.file);
    const baseline = await readFile(target, 'utf8');
    let mutated;
    try {
      mutated = mutation.mutate(baseline);
    } catch {
      result.classification = 'MUTATION_NOT_APPLIED';
      return result;
    }
    result.applied = mutated !== baseline;
    if (!result.applied) {
      result.classification = 'MUTATION_NOT_APPLIED';
      return result;
    }
    await writeFile(target, mutated);

    const build = await processResult(
      'pnpm',
      ['run', 'build'],
      {
        cwd: workspace,
        timeout: mutation.compileTimeoutMs ?? compileTimeoutMs,
      },
    );
    if (build.timedOut) {
      result.buildStatus = 'TIMEOUT';
      result.timeout = true;
      result.classification = 'TIMEOUT';
      return result;
    }
    if (build.spawnFailure) {
      result.buildStatus = 'FAIL';
      result.infrastructureFailure = true;
      result.classification = 'INFRASTRUCTURE_FAILURE';
      return result;
    }
    if (build.code !== 0) {
      result.buildStatus = 'FAIL';
      result.classification = 'BUILD_FAILURE';
      return result;
    }
    result.buildStatus = 'PASS';

    const testExecution = await executeStructuredTests({
      reporterPath: mutation.reporterPath ?? defaultReporterPath,
      testFiles,
      timeoutMs: mutation.testTimeoutMs ?? testTimeoutMs,
      workspace,
    });
    if (testExecution.timedOut) {
      result.testProcessStatus = 'TIMEOUT';
      result.timeout = true;
      result.classification = 'TIMEOUT';
      return result;
    }
    if (testExecution.spawnFailure) {
      result.testProcessStatus = 'INFRASTRUCTURE_FAILURE';
      result.infrastructureFailure = true;
      result.classification = 'INFRASTRUCTURE_FAILURE';
      return result;
    }

    let parsed;
    try {
      parsed = parseStationTestResults(testExecution.stdout, {
        repositoryRoot: await realpath(workspace),
      });
    } catch {
      result.testProcessStatus = testExecution.code === 0
        ? 'PASS'
        : 'TEST_FAILURE';
      result.classification = 'RESULT_PARSE_FAILURE';
      return result;
    }
    classifyStructuredTestExecution(result, parsed, testExecution);
    return result;
  } catch {
    result.infrastructureFailure = true;
    result.classification = 'INFRASTRUCTURE_FAILURE';
    return result;
  } finally {
    try {
      if (typeof mutation.cleanupProbe === 'function') {
        await mutation.cleanupProbe({
          repositoryRoot: root,
          workspace,
        });
      }
    } catch {
      cleanupProbeFailed = true;
    }
    let processCleanup;
    try {
      processCleanup = await terminateWorkspaceProcesses(workspace);
    } catch {
      processCleanup = { detected: true, terminated: false };
    }
    result.childProcessesStatus =
      !processCleanup.detected && processCleanup.terminated
        ? 'PASS'
        : 'FAIL';
    await rm(temporaryRoot, { recursive: true, force: true });
    result.residualWorkspace = await exists(temporaryRoot);
    const finalStatus = await gitStatus(root);
    result.workingTreePreserved = finalStatus === initialStatus;
    result.cleanupStatus =
      !result.residualWorkspace &&
      result.workingTreePreserved &&
      result.nodeModulesSymlink &&
      !cleanupProbeFailed &&
      result.childProcessesStatus === 'PASS'
        ? 'PASS'
        : 'FAIL';
    result.durationMs = Math.round(performance.now() - startedAt);
    if (result.cleanupStatus !== 'PASS') {
      result.classification = 'CLEANUP_FAILURE';
      result.killed = false;
      result.causalMatch = false;
    }
  }
}

export function assertMutationExecution(result) {
  if (result.classification !== 'EXPECTED_TEST_FAILURE') {
    throw new Error(result.classification);
  }
  if (
    result.applied !== true ||
    result.buildStatus !== 'PASS' ||
    result.testProcessStatus !== 'TEST_FAILURE' ||
    result.timeout !== false ||
    result.infrastructureFailure !== false ||
    result.expectedTestsFailed.length === 0 ||
    result.causalMatch !== true ||
    result.killed !== true ||
    result.cleanupStatus !== 'PASS'
  ) {
    throw new Error('INVALID_EXPECTED_TEST_FAILURE');
  }
}

function createFalsePositiveRegressionMutation(mutations) {
  const tenantMutation = mutations.find(({ id }) => id === 'MUT-024-01');
  const revokedMutation = stationSemanticMutations.find(
    ({ id }) => id === 'MUT-024-24',
  );
  if (!tenantMutation || !revokedMutation) {
    throw new Error('FALSE_POSITIVE_REGRESSION_FIXTURE_MISSING');
  }
  return Object.freeze({
    ...tenantMutation,
    id: 'MUT-024-01-REGRESSION',
    description:
      'MUT-024-01 with an intentionally unrelated expected target',
    expectedTests: revokedMutation.expectedTests,
    manual: false,
  });
}

export async function runStationMutationCampaign({
  mutations = stationSemanticMutations,
  repositoryRoot = process.cwd(),
  compileTimeoutMs = 45_000,
  testFiles = stationMutationTestFiles,
  testTimeoutMs = 30_000,
  verifyFalsePositiveRegression = mutations === stationSemanticMutations,
} = {}) {
  const root = resolve(repositoryRoot);
  const initialStatus = await gitStatus(root);
  const expectedTests = mutations.flatMap((mutation) =>
    requiredExpectedTests(mutation));
  const baseline = await runStationMutationBaseline({
    compileTimeoutMs,
    expectedTests,
    repositoryRoot: root,
    testFiles,
    testTimeoutMs,
  });
  const results = [];

  for (const mutation of mutations) {
    results.push(await runStationMutation({
      compileTimeoutMs,
      mutation,
      repositoryRoot: root,
      testFiles,
      testTimeoutMs,
    }));
  }

  let falsePositiveRegression;
  if (verifyFalsePositiveRegression) {
    falsePositiveRegression = await runStationMutation({
      compileTimeoutMs,
      mutation: createFalsePositiveRegressionMutation(mutations),
      repositoryRoot: root,
      testFiles,
      testTimeoutMs,
    });
    if (
      falsePositiveRegression.classification !==
        'UNRELATED_TEST_FAILURE' ||
      falsePositiveRegression.killed !== false ||
      falsePositiveRegression.causalMatch !== false ||
      falsePositiveRegression.expectedTestsFailed.length !== 0 ||
      falsePositiveRegression.unexpectedTestsFailed.length === 0 ||
      falsePositiveRegression.cleanupStatus !== 'PASS'
    ) {
      results.push(falsePositiveRegression);
    }
  }

  const finalStatus = await gitStatus(root);
  const report = Object.freeze({
    baseline,
    baselineStatus: baseline.status,
    causalCorrelation: 'structured',
    expectedTestIdentity: 'file-and-full-name',
    falsePositiveRegression: falsePositiveRegression
      ? Object.freeze({
          classification: falsePositiveRegression.classification,
          expectedTestsFailed:
            falsePositiveRegression.expectedTestsFailed,
          killed: falsePositiveRegression.killed,
          status: 'PASS',
          unexpectedTestsFailed:
            falsePositiveRegression.unexpectedTestsFailed,
        })
      : undefined,
    falsePositiveRegressionStatus: verifyFalsePositiveRegression
      ? 'PASS'
      : 'NOT_RUN',
    infrastructureFailureCount: results.filter(
      ({ classification }) => classification === 'INFRASTRUCTURE_FAILURE',
    ).length,
    killed: results.filter(({ killed }) => killed).length,
    mode: 'semantic',
    mutationMode: 'semantic',
    negativeHarnessTests: verifyFalsePositiveRegression
      ? 'PASS'
      : 'NOT_RUN',
    parserFailureCount: results.filter(
      ({ classification }) => classification === 'RESULT_PARSE_FAILURE',
    ).length,
    reporterFormat: stationTestReporterFormat,
    results: Object.freeze(results),
    schemaVersion: 2,
    survived: results.filter(
      ({ classification }) => classification === 'PASS',
    ).length,
    timeoutCount: results.filter(
      ({ classification }) => classification === 'TIMEOUT',
    ).length,
    total: mutations.length,
    unrelatedFailureCount: results.filter(
      ({ classification }) => classification === 'UNRELATED_TEST_FAILURE',
    ).length,
    unexpectedTestFailureCount: results.reduce(
      (total, result) => total + result.unexpectedTestsFailed.length,
      0,
    ),
    workspaceCleanup: results.every(
      ({ cleanupStatus }) => cleanupStatus === 'PASS',
    )
      ? 'PASS'
      : 'FAIL',
    workspaceStrategy: 'controlled-temporary-copy',
    workingTreePreserved: finalStatus === initialStatus,
  });

  const invalidResults = results.filter(({ killed }) => !killed);
  if (
    invalidResults.length !== 0 ||
    report.killed !== mutations.length ||
    report.unrelatedFailureCount !== 0 ||
    report.parserFailureCount !== 0 ||
    report.infrastructureFailureCount !== 0 ||
    report.timeoutCount !== 0 ||
    report.workspaceCleanup !== 'PASS' ||
    report.workingTreePreserved !== true
  ) {
    throw new StationMutationCampaignError(report);
  }
  return report;
}
