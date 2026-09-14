import { execFile } from 'node:child_process';
import { createHash } from 'node:crypto';
import { access } from 'node:fs/promises';
import { resolve } from 'node:path';
import { promisify } from 'node:util';

import { inspectDist, sha256File } from './ci-evidence.mjs';
import { inspectSourceMigrationManifest } from './migration-state-snapshot.mjs';

const execute = promisify(execFile);
const inputPaths = Object.freeze([
  '.node-version',
  '.nvmrc',
  '.npmrc',
  '.github/workflows/authoritative-linux-ci.yml',
  'architecture/dec-005-policy.json',
  'docs/delivery/evidence-manifest.schema.json',
  'package.json',
  'pnpm-lock.yaml',
  'scripts/lib/ci-evidence.mjs',
  'scripts/lib/workflow-change-classifier.mjs',
  'scripts/lib/verified-tree-attestation.mjs',
]);

function sha256(value) {
  return createHash('sha256').update(value).digest('hex');
}

async function git(projectRoot, argumentsList) {
  const { stdout } = await execute('git', argumentsList, {
    cwd: projectRoot,
    encoding: 'utf8',
    maxBuffer: 20 * 1024 * 1024,
  });
  return stdout.trim();
}

export function finalizeVerifiedTreeAttestation(value) {
  const comparable = {
    schemaVersion: 1,
    contract: 'WF-007/VERIFIED-TREE-ATTESTATION',
    mode: 'SHADOW',
    sourceCommit: value.sourceCommit,
    treeSha1: value.treeSha1,
    inputSha256: value.inputSha256,
    migrationManifestSha256: value.migrationManifestSha256,
    distAggregateSha256: value.distAggregateSha256,
    fullExactMainRequired: true,
    canReduceExactMain: false,
  };
  for (const [label, digest, pattern] of [
    ['sourceCommit', comparable.sourceCommit, /^[0-9a-f]{40}$/u],
    ['treeSha1', comparable.treeSha1, /^[0-9a-f]{40}$/u],
    ['inputSha256', comparable.inputSha256, /^[0-9a-f]{64}$/u],
    ['migrationManifestSha256', comparable.migrationManifestSha256, /^[0-9a-f]{64}$/u],
    ['distAggregateSha256', comparable.distAggregateSha256, /^[0-9a-f]{64}$/u],
  ]) {
    if (!pattern.test(digest ?? '')) throw new Error(`${label} is invalid`);
  }
  return Object.freeze({
    ...comparable,
    attestationSha256: sha256(JSON.stringify(comparable)),
  });
}

export function validateVerifiedTreeAttestation(value) {
  const expected = finalizeVerifiedTreeAttestation(value);
  if (value.attestationSha256 !== expected.attestationSha256) {
    throw new Error('Verified-tree attestation hash is invalid');
  }
  return value;
}

export function compareVerifiedTreeAttestations(candidate, integrated) {
  validateVerifiedTreeAttestation(candidate);
  validateVerifiedTreeAttestation(integrated);
  const fields = [
    'treeSha1',
    'inputSha256',
    'migrationManifestSha256',
    'distAggregateSha256',
  ];
  const differences = fields.filter((field) => candidate[field] !== integrated[field]);
  return Object.freeze({
    schemaVersion: 1,
    contract: 'WF-007/VERIFIED-TREE-COMPARISON',
    mode: 'SHADOW',
    equivalent: differences.length === 0,
    differences: Object.freeze(differences),
    canReduceExactMain: false,
    fullExactMainRequired: true,
  });
}

export async function createVerifiedTreeAttestation({
  projectRoot = process.cwd(),
} = {}) {
  const [sourceCommit, treeSha1, status, migrations, dist] = await Promise.all([
    git(projectRoot, ['rev-parse', 'HEAD']),
    git(projectRoot, ['rev-parse', 'HEAD^{tree}']),
    git(projectRoot, ['status', '--porcelain=v1', '--untracked-files=all']),
    inspectSourceMigrationManifest({
      root: resolve(projectRoot, 'src/infrastructure/database/migrations'),
    }),
    inspectDist({ projectRoot }),
  ]);
  if (status !== '') throw new Error('Verified-tree attestation requires a clean checkout');
  await Promise.all(inputPaths.map((path) => access(resolve(projectRoot, path))));
  const inputs = await Promise.all(inputPaths.map(async (path) =>
    Object.freeze({ path, sha256: await sha256File(resolve(projectRoot, path)) }),
  ));
  return finalizeVerifiedTreeAttestation({
    sourceCommit,
    treeSha1,
    inputSha256: sha256(JSON.stringify(inputs)),
    migrationManifestSha256: migrations.aggregateSha256,
    distAggregateSha256: dist.aggregateSha256,
  });
}

export const VERIFIED_TREE_INPUT_PATHS = inputPaths;
