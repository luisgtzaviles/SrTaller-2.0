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
    '.env.local.example',
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
    'scripts/lib/local-development.mjs',
    'scripts/lib/local-pin-fixtures.mjs',
    'scripts/local-db-seed.mjs',
    'scripts/run-postgresql-ci.mjs',
    'scripts/test-database-connection-postgresql.mjs',
    'scripts/test-database-migration-postgresql.mjs',
    'scripts/test-database-schema-postgresql.mjs',
    'scripts/test-database-transaction-postgresql.mjs',
    'scripts/test-owner-scoped-persistence-postgresql.mjs',
    'src/infrastructure/database/migrations/20260725183832_database_create_tenants_and_branches.ts',
    'src/infrastructure/database/migrations/20260906170000_users_create_directory.ts',
    'src/infrastructure/database/migrations/20260906171000_users_create_provisioning_bootstraps.ts',
    'src/infrastructure/database/migrations/20260906172000_users_create_lifecycle_commands.ts',
    'src/infrastructure/database/migrations/20260906180000_access_create_capability_catalog.ts',
    'src/infrastructure/database/migrations/20260906181000_access_create_roles.ts',
    'src/infrastructure/database/migrations/20260906182000_access_create_role_assignments.ts',
    'src/infrastructure/database/migrations/20260907010000_access_create_pin_credentials.ts',
    'src/infrastructure/database/migrations/20260907120000_access_create_operational_sessions.ts',
    'supply-chain-policy.json',
    'test/database-schema-postgresql.test.mjs',
    'test/local-development-contract.test.mjs',
    'test/access-pin-postgresql.test.mjs',
    'test/access-session-postgresql.test.mjs',
    'test/access-role-postgresql.test.mjs',
    'test/trusted-station-context-postgresql.test.mjs',
    'test/user-directory-postgresql.test.mjs',
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
    ...(postgresql ? { postgresql } : {}),
  };

  if (postgresql) {
    manifest.commands.splice(7, 0, {
      name: 'test:postgresql',
      command: 'node scripts/run-postgresql-ci.mjs',
      exitCode: 0,
    });
  }

  return validateEvidenceManifest(manifest);
}
