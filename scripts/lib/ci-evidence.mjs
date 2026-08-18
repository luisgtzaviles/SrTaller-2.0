import { execFile } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFile, readdir, stat } from 'node:fs/promises';
import { promisify } from 'node:util';
import { extname, relative, resolve, sep } from 'node:path';

import {
  comparablePostgresqlCiManifest,
  validatePostgresqlCiManifest,
} from './postgresql-ci-evidence.mjs';

const execFileAsync = promisify(execFile);
const forbiddenPathPatterns = [
  /(?:^|\/)Users\//u,
  /(?:^|\/)home\/runner\/work\//u,
  /file:\/\//iu,
  /(?<![A-Za-z0-9_])[A-Za-z]:[\\/]/u,
];

function portablePath(path) {
  return path.split(sep).join('/');
}

async function listFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const path = resolve(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await listFiles(path)));
    } else if (entry.isFile()) {
      files.push(path);
    }
  }

  return files.sort();
}

export function sha256(content) {
  return createHash('sha256').update(content).digest('hex');
}

export async function sha256File(path) {
  return sha256(await readFile(path));
}

export function validateStationMutationManifest(manifest) {
  if (
    manifest?.schemaVersion !== 2 ||
    manifest?.mode !== 'semantic' ||
    manifest?.mutationMode !== 'semantic' ||
    manifest?.causalCorrelation !== 'structured' ||
    manifest?.reporterFormat !== 'srtaller-node-test-results/v1' ||
    manifest?.expectedTestIdentity !== 'file-and-full-name' ||
    manifest?.workspaceStrategy !== 'controlled-temporary-copy' ||
    manifest?.baselineStatus !== 'PASS' ||
    manifest?.baseline?.status !== 'PASS' ||
    !Array.isArray(manifest?.baseline?.inventory) ||
    manifest.baseline.inventory.length === 0 ||
    !Array.isArray(manifest?.baseline?.targets) ||
    manifest.baseline.targets.length < 25 ||
    manifest?.total !== 25 ||
    manifest?.killed !== 25 ||
    manifest?.survived !== 0 ||
    manifest?.unrelatedFailureCount !== 0 ||
    manifest?.unexpectedTestFailureCount !== 0 ||
    manifest?.parserFailureCount !== 0 ||
    manifest?.infrastructureFailureCount !== 0 ||
    manifest?.timeoutCount !== 0 ||
    manifest?.negativeHarnessTests !== 'PASS' ||
    manifest?.falsePositiveRegressionStatus !== 'PASS' ||
    manifest?.falsePositiveRegression?.status !== 'PASS' ||
    manifest?.falsePositiveRegression?.classification !==
      'UNRELATED_TEST_FAILURE' ||
    manifest?.falsePositiveRegression?.killed !== false ||
    !Array.isArray(
      manifest?.falsePositiveRegression?.expectedTestsFailed,
    ) ||
    manifest.falsePositiveRegression.expectedTestsFailed.length !== 0 ||
    !Array.isArray(
      manifest?.falsePositiveRegression?.unexpectedTestsFailed,
    ) ||
    manifest.falsePositiveRegression.unexpectedTestsFailed.length === 0 ||
    manifest?.workspaceCleanup !== 'PASS' ||
    manifest?.workingTreePreserved !== true ||
    !Array.isArray(manifest?.results) ||
    manifest.results.length !== 25
  ) {
    throw new Error('PBI-024 mutation manifest is not materially complete');
  }
  const baselineTargetKeys = new Set(
    manifest.baseline.targets.map(({ file, fullName, status }) => {
      if (
        typeof file !== 'string' ||
        file === '' ||
        typeof fullName !== 'string' ||
        fullName === '' ||
        status !== 'PASS'
      ) {
        throw new Error('PBI-024 baseline target is invalid');
      }
      return JSON.stringify([file, fullName]);
    }),
  );
  for (const result of manifest.results) {
    if (
      !/^MUT-024-(?:0[1-9]|1[0-9]|2[0-5])$/u.test(
        result.mutationId,
      ) ||
      typeof result.targetFile !== 'string' ||
      result.targetFile === '' ||
      typeof result.description !== 'string' ||
      result.description === '' ||
      typeof result.manual !== 'boolean' ||
      !Number.isInteger(result.durationMs) ||
      result.durationMs < 0 ||
      result.reporterFormat !== 'srtaller-node-test-results/v1' ||
      !Array.isArray(result.expectedTests) ||
      result.expectedTests.length === 0 ||
      !Array.isArray(result.executedTestFiles) ||
      result.executedTestFiles.length === 0 ||
      result.applied !== true ||
      result.buildStatus !== 'PASS' ||
      result.testProcessStatus !== 'TEST_FAILURE' ||
      !Array.isArray(result.parsedTestResults) ||
      result.parsedTestResults.length === 0 ||
      !Array.isArray(result.failedTests) ||
      result.failedTests.length === 0 ||
      !Array.isArray(result.expectedTestsFailed) ||
      result.expectedTestsFailed.length === 0 ||
      !Array.isArray(result.unexpectedTestsFailed) ||
      result.unexpectedTestsFailed.length !== 0 ||
      result.timeout !== false ||
      result.infrastructureFailure !== false ||
      result.classification !== 'EXPECTED_TEST_FAILURE' ||
      result.causalMatch !== true ||
      result.killed !== true ||
      result.cleanupStatus !== 'PASS' ||
      result.nodeModulesSymlink !== true ||
      result.childProcessesStatus !== 'PASS' ||
      result.residualWorkspace !== false ||
      result.workingTreePreserved !== true
    ) {
      throw new Error(
        `Mutation result ${result?.mutationId ?? 'unknown'} is invalid`,
      );
    }
    const expectedKeys = new Set(result.expectedTests.map((expected) => {
      if (
        typeof expected?.file !== 'string' ||
        expected.file === '' ||
        typeof expected?.fullName !== 'string' ||
        expected.fullName === '' ||
        expected.causalSignature?.errorCode !== 'ERR_TEST_FAILURE' ||
        expected.causalSignature?.failureType !== 'testCodeFailure'
      ) {
        throw new Error(
          `Mutation result ${result.mutationId} has an invalid target`,
        );
      }
      const key = JSON.stringify([expected.file, expected.fullName]);
      if (!baselineTargetKeys.has(key)) {
        throw new Error(
          `Mutation result ${result.mutationId} target is absent from baseline`,
        );
      }
      if (!result.executedTestFiles.includes(expected.file)) {
        throw new Error(
          `Mutation result ${result.mutationId} target file was not executed`,
        );
      }
      return key;
    }));
    const failedKeys = result.failedTests.map(({ file, fullName, status }) => {
      if (
        typeof file !== 'string' ||
        typeof fullName !== 'string' ||
        status !== 'FAIL'
      ) {
        throw new Error(
          `Mutation result ${result.mutationId} has invalid failed tests`,
        );
      }
      return JSON.stringify([file, fullName]);
    });
    const expectedFailedKeys = result.expectedTestsFailed.map(
      ({ file, fullName, status }) => {
        const key = JSON.stringify([file, fullName]);
        if (status !== 'FAIL' || !expectedKeys.has(key)) {
          throw new Error(
            `Mutation result ${result.mutationId} causal failure is invalid`,
          );
        }
        return key;
      },
    );
    if (
      expectedFailedKeys.some((key) => !failedKeys.includes(key)) ||
      failedKeys.some((key) => !expectedKeys.has(key))
    ) {
      throw new Error(
        `Mutation result ${result.mutationId} failure correlation is invalid`,
      );
    }
  }
  if (
    new Set(manifest.results.map(({ mutationId }) => mutationId)).size !== 25
  ) {
    throw new Error('PBI-024 mutation IDs must be unique');
  }
  return manifest;
}

export function comparableStationMutationManifest(manifest) {
  validateStationMutationManifest(manifest);
  const results = manifest.results.map(
    ({ durationMs: _durationMs, ...result }) => result,
  );
  const material = {
    baseline: manifest.baseline,
    baselineStatus: manifest.baselineStatus,
    causalCorrelation: manifest.causalCorrelation,
    expectedTestIdentity: manifest.expectedTestIdentity,
    falsePositiveRegression: manifest.falsePositiveRegression,
    falsePositiveRegressionStatus: manifest.falsePositiveRegressionStatus,
    infrastructureFailureCount: manifest.infrastructureFailureCount,
    killed: manifest.killed,
    mode: manifest.mode,
    mutationMode: manifest.mutationMode,
    negativeHarnessTests: manifest.negativeHarnessTests,
    parserFailureCount: manifest.parserFailureCount,
    reporterFormat: manifest.reporterFormat,
    results,
    schemaVersion: manifest.schemaVersion,
    survived: manifest.survived,
    timeoutCount: manifest.timeoutCount,
    total: manifest.total,
    unrelatedFailureCount: manifest.unrelatedFailureCount,
    unexpectedTestFailureCount: manifest.unexpectedTestFailureCount,
    workspaceCleanup: manifest.workspaceCleanup,
    workspaceStrategy: manifest.workspaceStrategy,
    workingTreePreserved: manifest.workingTreePreserved,
  };
  return Object.freeze({
    baselineStatus: manifest.baselineStatus,
    causalCorrelation: manifest.causalCorrelation,
    expectedTestIdentity: manifest.expectedTestIdentity,
    falsePositiveRegression: manifest.falsePositiveRegressionStatus,
    infrastructureFailureCount: manifest.infrastructureFailureCount,
    killed: manifest.killed,
    manualDemonstrations: results
      .filter(({ manual }) => manual === true)
      .map(({ mutationId }) => mutationId),
    materialSha256: sha256(JSON.stringify(material)),
    mode: manifest.mode,
    mutationMode: manifest.mutationMode,
    negativeHarnessTests: manifest.negativeHarnessTests,
    parserFailureCount: manifest.parserFailureCount,
    reporterFormat: manifest.reporterFormat,
    survived: manifest.survived,
    timeoutCount: manifest.timeoutCount,
    total: manifest.total,
    unrelatedFailureCount: manifest.unrelatedFailureCount,
    unexpectedTestFailureCount: manifest.unexpectedTestFailureCount,
    workspaceCleanup: manifest.workspaceCleanup,
    workspaceStrategy: manifest.workspaceStrategy,
  });
}

export async function inspectDist({
  projectRoot = process.cwd(),
} = {}) {
  const distRoot = resolve(projectRoot, 'dist');
  const files = await listFiles(distRoot);

  if (files.length === 0) {
    throw new Error('dist/ must contain at least one compiled artifact');
  }

  const artifacts = [];
  for (const absolutePath of files) {
    const path = portablePath(relative(projectRoot, absolutePath));
    const extension = extname(path);
    const previewAsset = path.startsWith('dist/public/') &&
      ['.css', '.html', '.js', '.map'].includes(extension);
    if (!previewAsset && !['.js', '.map'].includes(extension)) {
      throw new Error(`Unexpected dist artifact: ${path}`);
    }

    const content = await readFile(absolutePath);
    const text = content.toString('utf8');
    for (const pattern of forbiddenPathPatterns) {
      if (pattern.test(text)) {
        throw new Error(`Non-portable path detected in ${path}`);
      }
    }

    if (extension === '.map') {
      const sourceMap = JSON.parse(text);
      if ('sourcesContent' in sourceMap) {
        throw new Error(`Inline source content detected in ${path}`);
      }
      for (const source of sourceMap.sources ?? []) {
        if (
          typeof source !== 'string' ||
          source.startsWith('/') ||
          forbiddenPathPatterns.some((pattern) => pattern.test(source))
        ) {
          throw new Error(`Non-portable source map entry detected in ${path}`);
        }
      }
    }

    artifacts.push({
      bytes: (await stat(absolutePath)).size,
      path,
      sha256: sha256(content),
    });
  }

  const inventory = artifacts
    .map(({ bytes, path, sha256: digest }) => `${digest} ${bytes} ${path}`)
    .join('\n');

  return {
    aggregateSha256: sha256(`${inventory}\n`),
    algorithm: 'sha256',
    files: artifacts,
  };
}

function requiredString(value, label) {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new Error(`${label} must be a non-empty string`);
  }
}

export function validateEvidenceManifest(manifest) {
  if (manifest.schemaVersion !== 1 && manifest.schemaVersion !== 2) {
    throw new Error('Unsupported evidence manifest schemaVersion');
  }
  if (manifest.contract !== 'DEC-004/VC-024') {
    throw new Error('Evidence manifest contract must be DEC-004/VC-024');
  }
  for (const [label, value] of [
    ['commit', manifest.commit],
    ['execution.label', manifest.execution?.label],
    ['execution.workflowRunId', manifest.execution?.workflowRunId],
    ['environment.os', manifest.environment?.os],
    ['environment.arch', manifest.environment?.arch],
    ['environment.libc', manifest.environment?.libc],
    ['toolchain.node', manifest.toolchain?.node],
    ['toolchain.pnpm', manifest.toolchain?.pnpm],
    ['toolchain.typescript', manifest.toolchain?.typescript],
    ['toolchain.nestjs', manifest.toolchain?.nestjs],
    ['dist.aggregateSha256', manifest.dist?.aggregateSha256],
    ['verdict', manifest.verdict],
  ]) {
    requiredString(value, label);
  }
  if (!/^[0-9a-f]{40}$/u.test(manifest.commit)) {
    throw new Error('Evidence manifest commit must be a full Git SHA-1');
  }
  if (manifest.environment.os !== 'linux') {
    throw new Error('VC-024 evidence requires Linux');
  }
  if (manifest.environment.arch !== 'x64') {
    throw new Error('VC-024 evidence requires x64');
  }
  if (!manifest.environment.libc.toLowerCase().includes('glibc')) {
    throw new Error('VC-024 evidence requires GNU glibc');
  }
  if (
    manifest.toolchain.node !== '24.18.0' ||
    manifest.toolchain.pnpm !== '11.15.1' ||
    manifest.toolchain.typescript !== '6.0.3' ||
    manifest.toolchain.nestjs !== '11.1.28'
  ) {
    throw new Error('Evidence manifest toolchain does not match DEC-004');
  }
  if (
    manifest.repository?.initialClean !== true ||
    manifest.repository?.finalClean !== true
  ) {
    throw new Error('VC-024 requires clean initial and final repositories');
  }
  if (!Array.isArray(manifest.commands) || manifest.commands.length === 0) {
    throw new Error('Evidence manifest commands must be a non-empty array');
  }
  for (const command of manifest.commands) {
    requiredString(command.name, 'commands[].name');
    requiredString(command.command, 'commands[].command');
    if (command.exitCode !== 0) {
      throw new Error(`Command ${command.name} did not pass`);
    }
  }
  if (!Array.isArray(manifest.dist?.files) || manifest.dist.files.length === 0) {
    throw new Error('Evidence manifest must contain a dist inventory');
  }
  if (manifest.verdict !== 'PASS') {
    throw new Error('Evidence manifest verdict must be PASS');
  }
  if (manifest.schemaVersion === 2) {
    validatePostgresqlCiManifest(manifest.postgresql);
  } else if (manifest.postgresql !== undefined) {
    throw new Error(
      'PostgreSQL evidence requires evidence manifest schemaVersion 2',
    );
  }
  if (manifest.mutations !== undefined) {
    if (
      manifest.mutations.mode !== 'semantic' ||
      manifest.mutations.mutationMode !== 'semantic' ||
      manifest.mutations.causalCorrelation !== 'structured' ||
      manifest.mutations.reporterFormat !==
        'srtaller-node-test-results/v1' ||
      manifest.mutations.expectedTestIdentity !== 'file-and-full-name' ||
      manifest.mutations.workspaceStrategy !==
        'controlled-temporary-copy' ||
      manifest.mutations.baselineStatus !== 'PASS' ||
      manifest.mutations.negativeHarnessTests !== 'PASS' ||
      manifest.mutations.falsePositiveRegression !== 'PASS' ||
      manifest.mutations.total !== 25 ||
      manifest.mutations.killed !== 25 ||
      manifest.mutations.survived !== 0 ||
      manifest.mutations.unrelatedFailureCount !== 0 ||
      manifest.mutations.unexpectedTestFailureCount !== 0 ||
      manifest.mutations.parserFailureCount !== 0 ||
      manifest.mutations.infrastructureFailureCount !== 0 ||
      manifest.mutations.timeoutCount !== 0 ||
      manifest.mutations.workspaceCleanup !== 'PASS' ||
      !/^[a-f0-9]{64}$/u.test(manifest.mutations.materialSha256) ||
      !Array.isArray(manifest.mutations.manualDemonstrations) ||
      manifest.mutations.manualDemonstrations.length < 5
    ) {
      throw new Error('Evidence manifest mutation summary is invalid');
    }
  }
  return manifest;
}

function comparableManifest(manifest) {
  const comparable = {
    commands: manifest.commands,
    commit: manifest.commit,
    contract: manifest.contract,
    dist: manifest.dist,
    environment: manifest.environment,
    inputs: manifest.inputs,
    repository: manifest.repository,
    schemaVersion: manifest.schemaVersion,
    toolchain: manifest.toolchain,
    verdict: manifest.verdict,
  };
  if (manifest.postgresql) {
    comparable.postgresql = {
      ...comparablePostgresqlCiManifest(manifest.postgresql),
      comparableSha256: manifest.postgresql.comparableSha256,
    };
  }
  if (manifest.mutations) {
    comparable.mutations = manifest.mutations;
  }
  return comparable;
}

export function compareEvidenceManifests(left, right) {
  validateEvidenceManifest(left);
  validateEvidenceManifest(right);

  if (left.execution.label === right.execution.label) {
    throw new Error('VC-024 executions must use distinct job labels');
  }

  const leftComparable = comparableManifest(left);
  const rightComparable = comparableManifest(right);
  const leftJson = JSON.stringify(leftComparable);
  const rightJson = JSON.stringify(rightComparable);
  const differences = leftJson === rightJson
    ? []
    : ['Comparable manifest content differs'];

  return {
    commit: left.commit,
    contract: 'DEC-004/VC-024',
    equivalent: differences.length === 0,
    executions: [
      {
        label: left.execution.label,
        workflowRunId: left.execution.workflowRunId,
      },
      {
        label: right.execution.label,
        workflowRunId: right.execution.workflowRunId,
      },
    ],
    comparableSha256: {
      left: sha256(leftJson),
      right: sha256(rightJson),
    },
    differences,
    schemaVersion: 1,
  };
}

async function commandOutput(command, argumentsList = []) {
  const { stdout } = await execFileAsync(command, argumentsList, {
    encoding: 'utf8',
  });
  return stdout.trim();
}

async function detectGlibc() {
  const output = await commandOutput('ldd', ['--version']);
  const firstLine = output.split('\n')[0] ?? '';
  if (!/(?:glibc|gnu libc)/iu.test(output)) {
    throw new Error('The authoritative runner must use GNU glibc');
  }
  const version = /(\d+\.\d+)(?!.*\d)/u.exec(firstLine)?.[1] ?? 'unknown';
  return `glibc ${version}`;
}

export async function collectEvidenceManifest({
  executionLabel,
  initialClean,
  mutationInput,
  postgresqlInput,
  projectRoot = process.cwd(),
  workflowRunId,
} = {}) {
  requiredString(executionLabel, 'executionLabel');
  requiredString(workflowRunId, 'workflowRunId');
  if (initialClean !== true) {
    throw new Error('The workflow did not attest a clean initial checkout');
  }

  const gitStatus = await commandOutput('git', [
    'status',
    '--porcelain=v1',
    '--untracked-files=all',
  ]);
  if (gitStatus !== '') {
    throw new Error('The repository is not clean after authoritative gates');
  }

  const packageManifest = JSON.parse(
    await readFile(resolve(projectRoot, 'package.json'), 'utf8'),
  );
  const inputPaths = [
    '.node-version',
    '.nvmrc',
    '.npmrc',
    '.github/workflows/authoritative-linux-ci.yml',
    'architecture/dec-005-policy.json',
    'package.json',
    'pnpm-lock.yaml',
    'scripts/cleanup-postgresql-ci.mjs',
    'scripts/lib/postgresql-ci-evidence.mjs',
    'scripts/lib/postgresql-test-output.mjs',
    'scripts/lib/node-test-json-reporter.mjs',
    'scripts/lib/pbi024-evidence-manifest.mjs',
    'scripts/lib/station-semantic-mutation-runner.mjs',
    'scripts/lib/station-semantic-mutations.mjs',
    'scripts/lib/station-test-results.mjs',
    'scripts/run-postgresql-ci.mjs',
    'scripts/run-station-mutations.mjs',
    'scripts/validate-pbi024-evidence.mjs',
    'scripts/test-database-connection-postgresql.mjs',
    'scripts/test-database-migration-postgresql.mjs',
    'scripts/test-database-schema-postgresql.mjs',
    'scripts/test-database-transaction-postgresql.mjs',
    'scripts/test-owner-scoped-persistence-postgresql.mjs',
    'src/infrastructure/database/migrations/20260725183832_database_create_tenants_and_branches.ts',
    'src/modules/stations/application/use-cases/resolve-trusted-station-context.ts',
    'src/modules/stations/infrastructure/persistence/station-postgresql-error.ts',
    'supply-chain-policy.json',
    'test/database-schema-postgresql.test.mjs',
    'test/fixtures/station-mutation-harness/ambiguous-targets.test.mjs',
    'test/fixtures/station-mutation-harness/invalid-json-reporter.mjs',
    'test/fixtures/node-test-reporter/failures.test.mjs',
    'test/fixtures/node-test-reporter/nested-a.test.mjs',
    'test/fixtures/node-test-reporter/nested-b.test.mjs',
    'test/node-test-json-reporter.test.mjs',
    'test/pbi024-evidence-manifest.test.mjs',
    'test/station-critical-mutations.test.mjs',
    'test/station-mutation-harness-negative.test.mjs',
    'test/station-test-result-parser.test.mjs',
    'test/trusted-station-context-postgresql.test.mjs',
    'tsconfig.build.json',
    'tsconfig.json',
  ];
  const inputs = {};
  for (const inputPath of inputPaths) {
    inputs[inputPath] = await sha256File(resolve(projectRoot, inputPath));
  }

  const postgresql = postgresqlInput
    ? validatePostgresqlCiManifest(
        JSON.parse(await readFile(resolve(postgresqlInput), 'utf8')),
      )
    : undefined;
  const mutations = mutationInput
    ? comparableStationMutationManifest(
        JSON.parse(await readFile(resolve(mutationInput), 'utf8')),
      )
    : undefined;

  const manifest = {
    schemaVersion: postgresql ? 2 : 1,
    contract: 'DEC-004/VC-024',
    commit: await commandOutput('git', ['rev-parse', 'HEAD']),
    execution: {
      attempt: process.env.GITHUB_RUN_ATTEMPT ?? '1',
      label: executionLabel,
      ref: process.env.GITHUB_REF ?? 'unknown',
      trigger: process.env.GITHUB_EVENT_NAME ?? 'unknown',
      workflowRunId,
    },
    environment: {
      arch: process.arch,
      libc: await detectGlibc(),
      os: process.platform,
    },
    toolchain: {
      nestjs: packageManifest.dependencies['@nestjs/core'],
      node: process.versions.node,
      pnpm: await commandOutput('pnpm', ['--version']),
      typescript: packageManifest.devDependencies.typescript,
    },
    inputs,
    commands: [
      { name: 'install', command: 'pnpm install --frozen-lockfile', exitCode: 0 },
      { name: 'architecture', command: 'pnpm run architecture', exitCode: 0 },
      { name: 'typecheck', command: 'pnpm run typecheck', exitCode: 0 },
      { name: 'build', command: 'pnpm run build', exitCode: 0 },
      { name: 'test', command: 'pnpm test', exitCode: 0 },
      {
        name: 'test:architecture',
        command: 'pnpm run test:architecture',
        exitCode: 0,
      },
      { name: 'verify', command: 'pnpm run verify', exitCode: 0 },
      {
        name: 'smoke:unit',
        command:
          "node --test --test-name-pattern='smoke readiness' test/architecture-policy.test.mjs",
        exitCode: 0,
      },
      {
        name: 'smoke:compiled',
        command: 'pnpm run smoke:start',
        exitCode: 0,
      },
      {
        name: 'dist:inspect',
        command: 'node scripts/collect-ci-evidence.mjs',
        exitCode: 0,
      },
      { name: 'diff:check', command: 'git diff --check', exitCode: 0 },
    ],
    dist: await inspectDist({ projectRoot }),
    repository: {
      finalClean: true,
      initialClean: true,
    },
    verdict: 'PASS',
    ...(mutations ? { mutations } : {}),
    ...(postgresql ? { postgresql } : {}),
  };

  if (postgresql) {
    manifest.commands.splice(7, 0, {
      name: 'test:postgresql',
      command: 'node scripts/run-postgresql-ci.mjs',
      exitCode: 0,
    });
  }
  if (mutations) {
    manifest.commands.splice(7, 0, {
      name: 'test:mutations',
      command: 'node scripts/run-station-mutations.mjs',
      exitCode: 0,
    });
  }

  return validateEvidenceManifest(manifest);
}
