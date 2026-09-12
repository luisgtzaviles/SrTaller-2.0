import { execFile } from 'node:child_process';
import { mkdir, mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { promisify } from 'node:util';

import {
  assertCandidateFingerprintStable,
  assertCandidatePreflight,
  createCandidateFingerprint,
  verifyCandidateWhitespace,
} from './lib/candidate-fingerprint.mjs';
import { createFullVerificationSmokeHarness, fullVerificationSmokeLabel } from './lib/full-verification-smoke.mjs';
import {
  assertExternalEvidenceDirectory,
  fullVerificationStages,
  renderFullVerificationSummary,
  runFullVerificationCampaign,
} from './lib/full-verification-orchestrator.mjs';
import { assertBaseSkipSummary, inspectPostgresqlSkipInventory } from './lib/postgresql-skip-inventory.mjs';
import { runStreamingCommand } from './lib/process-runner.mjs';

const execute = promisify(execFile);
const repositoryRoot = process.cwd();
const executionLabel = 'local-run-1';

if (process.version !== 'v24.18.0') {
  throw new Error('Node.js 24.18.0 is required for Full Verification');
}

function campaignIdentifier(date, baseHead) {
  return `local-full-verification-${date.toISOString().replace(/[^0-9]/gu, '').slice(0, 14)}-${baseHead.slice(0, 12)}`;
}

async function docker(argumentsList) {
  try {
    return await execute('docker', argumentsList, {
      encoding: 'utf8',
      maxBuffer: 10 * 1024 * 1024,
    });
  } catch {
    throw new Error(
      `Full Verification Docker operation failed: ${argumentsList[0] ?? 'unknown'}`,
    );
  }
}

const governedFilters = Object.freeze([
  `label=com.srtaller.pbi023.execution=${executionLabel}`,
  'label=com.srtaller.pbi039.hardening=postgresql',
  'label=com.srtaller.pbi040.catalog=postgresql',
  'label=com.srtaller.preview-runtime=postgresql',
  `label=${fullVerificationSmokeLabel}`,
]);

async function governedContainerIds() {
  const identifiers = new Set();
  for (const filter of governedFilters) {
    const { stdout } = await docker(['ps', '--all', '--quiet', '--filter', filter]);
    for (const identifier of stdout.trim().split(/\s+/u).filter(Boolean)) {
      identifiers.add(identifier);
    }
  }
  return [...identifiers];
}

async function assertResourcePreflight() {
  await docker(['version', '--format', '{{.Server.Version}}']);
  const containers = await governedContainerIds();
  if (containers.length > 0) {
    throw new Error('Full Verification preflight found governed orphan containers');
  }
  return Object.freeze({ docker: 'AVAILABLE', governedContainers: 0 });
}

async function cleanupGovernedResources(smoke) {
  const failures = [];
  if (smoke) {
    try {
      await smoke.cleanup();
    } catch (error) {
      failures.push(error.message);
    }
  }
  try {
    await runStreamingCommand(
      process.execPath,
      ['scripts/cleanup-postgresql-ci.mjs', executionLabel],
      { timeoutMs: 30_000 },
    );
  } catch (error) {
    failures.push(error.message);
  }
  const containers = await governedContainerIds();
  if (containers.length > 0) {
    await docker(['rm', '--force', ...containers]);
  }
  const remaining = await governedContainerIds();
  if (remaining.length > 0) failures.push('Governed containers remain after cleanup');
  if (failures.length > 0) throw new Error(`Full Verification cleanup failed: ${failures.join('; ')}`);
  return Object.freeze({
    containers: 0,
    networks: 0,
    processes: 0,
    volumes: 0,
    status: 'PASS',
  });
}

function parseJsonOutput(stdout, label) {
  try {
    return JSON.parse(stdout.trim());
  } catch {
    throw new Error(`${label} did not emit one machine-readable JSON result`);
  }
}

async function dryInventory() {
  const fingerprint = assertCandidatePreflight(await createCandidateFingerprint(repositoryRoot));
  const skipInventory = await inspectPostgresqlSkipInventory(repositoryRoot);
  const requiredScripts = [
    'scripts/run-postgresql-ci.mjs',
    'scripts/test-pbi039-postgresql.mjs',
    'scripts/test-pbi040-postgresql.mjs',
    'scripts/test-preview-database-runtime-postgresql.mjs',
    'scripts/smoke-start.mjs',
    'scripts/smoke-ui.mjs',
  ];
  await Promise.all(requiredScripts.map((path) => readFile(resolve(repositoryRoot, path))));
  const { stdout: dockerVersion } = await docker(['version', '--format', '{{.Server.Version}}']);
  let imageState = 'NOT_CACHED';
  try {
    await docker([
      'image', 'inspect',
      'postgres@sha256:d93de42662696f278fb34354b06fdaa90ad7ca3106d6f72fbd01d16da006d2cf',
    ]);
    imageState = 'CACHED';
  } catch {
    // The real campaign owns the governed pull.
  }
  process.stdout.write(`${JSON.stringify({
    status: 'READY',
    campaignExecuted: false,
    candidateFingerprint: fingerprint.candidateSha256,
    docker: dockerVersion.trim(),
    postgresImage: imageState,
    evidenceLocation: 'external operating-system temporary directory',
    stages: fullVerificationStages.map(({ id }) => id),
    skipInventory,
    unknownUntracked: 0,
  }, null, 2)}\n`);
}

if (process.argv.includes('--dry-run')) {
  await dryInventory();
} else {
  const initial = await createCandidateFingerprint(repositoryRoot);
  const startedAt = new Date();
  const campaignId = campaignIdentifier(startedAt, initial.baseHead);
  const configuredEvidenceDirectory = process.env.SR_FULL_VERIFICATION_EVIDENCE_DIR;
  const evidenceDirectory = configuredEvidenceDirectory
    ? resolve(configuredEvidenceDirectory)
    : await mkdtemp(join(tmpdir(), 'srtaller-full-verification-evidence-'));
  assertExternalEvidenceDirectory(repositoryRoot, evidenceDirectory);
  await mkdir(evidenceDirectory, { recursive: true });
  const evidencePath = join(evidenceDirectory, 'FULL_VERIFICATION_SUMMARY.json');
  const postgresqlEvidencePath = join(evidenceDirectory, 'POSTGRESQL_MANIFEST.json');
  let skipInventory;

  const operations = {
    candidateFingerprint: () => createCandidateFingerprint(repositoryRoot),
    candidatePreflight: async (fingerprint) => assertCandidatePreflight(fingerprint),
    resourcePreflight: assertResourcePreflight,
    toolchain: async () => {
      await runStreamingCommand('pnpm', ['run', 'verify:toolchain']);
      return Object.freeze({ node: '24.18.0', pnpm: '11.15.1', status: 'PASS' });
    },
    integrity: async () => {
      skipInventory = await inspectPostgresqlSkipInventory(repositoryRoot);
      return Object.freeze({
        ...(await verifyCandidateWhitespace(repositoryRoot)),
        expectedPostgresqlSkips: skipInventory,
      });
    },
    baseVerify: async () => {
      const result = await runStreamingCommand('pnpm', ['run', 'verify']);
      return Object.freeze({
        status: 'PASS',
        skips: assertBaseSkipSummary(result.stdout, skipInventory),
      });
    },
    postgresqlComposite: async () => {
      await runStreamingCommand(
        process.execPath,
        [
          'scripts/run-postgresql-ci.mjs',
          '--execution-label', executionLabel,
          '--workflow-run-id', campaignId,
          '--head-sha', initial.baseHead,
          '--output', postgresqlEvidencePath,
        ],
        { timeoutMs: 20 * 60_000 },
      );
      const manifest = JSON.parse(await readFile(postgresqlEvidencePath, 'utf8'));
      if (
        manifest.result !== 'PASS' ||
        manifest.totals?.suites !== 5 ||
        manifest.totals?.testsExecuted !== skipInventory.material.postgresqlComposite ||
        manifest.totals?.criticalSkips !== 0 ||
        manifest.totals?.failures !== 0
      ) {
        throw new Error('Material PostgreSQL evidence does not match the governed skip inventory');
      }
      return Object.freeze({
        digest: manifest.image.digest,
        migration: Object.freeze({
          emptyDatabase: manifest.migration.emptyDatabase,
          journal: manifest.migration.journal,
          lock: manifest.migration.lock,
          status: manifest.migration.status,
        }),
        postgres: manifest.postgres.version,
        suites: manifest.totals.suites,
        tests: manifest.totals.testsExecuted,
        skips: manifest.totals.criticalSkips,
        cleanup: manifest.cleanup.status,
      });
    },
    pbi039Postgresql: async () => {
      const result = await runStreamingCommand(
        process.execPath,
        [
          'scripts/test-pbi039-postgresql.mjs',
          '--runs', '1',
          '--execution-label', executionLabel,
          '--workflow-run-id', campaignId,
          '--head-sha', initial.baseHead,
        ],
        { timeoutMs: 8 * 60_000 },
      );
      const evidence = parseJsonOutput(result.stdout, 'PBI-039 PostgreSQL');
      const tests = evidence.suites.reduce((total, suite) => total + suite.tests.tests, 0);
      const skipped = evidence.suites.reduce((total, suite) => total + suite.tests.skipped, 0);
      if (
        evidence.status !== 'PASS' || evidence.cleanup?.status !== 'PASS' ||
        tests !== skipInventory.material.pbi039Postgresql || skipped !== 0
      ) {
        throw new Error('PBI-039 PostgreSQL evidence does not match the governed skip inventory');
      }
      return Object.freeze({
        postgres: evidence.postgres.version,
        tests,
        skips: skipped,
        cleanup: evidence.cleanup.status,
      });
    },
    pbi040Postgresql: async () => {
      const result = await runStreamingCommand(
        process.execPath,
        ['scripts/test-pbi040-postgresql.mjs'],
        { timeoutMs: 5 * 60_000 },
      );
      if (
        !result.stdout.includes('PBI-040 PostgreSQL PASS:') ||
        !result.stdout.includes('zero critical skips') ||
        !result.stdout.includes('disposable container removed')
      ) {
        throw new Error('PBI-040 PostgreSQL evidence is incomplete');
      }
      return Object.freeze({
        tests: skipInventory.material.pbi040Postgresql,
        skips: 0,
        cleanup: 'PASS',
      });
    },
    previewRuntime: async () => {
      const result = await runStreamingCommand(
        process.execPath,
        ['scripts/test-preview-database-runtime-postgresql.mjs'],
        { timeoutMs: 5 * 60_000 },
      );
      const evidence = parseJsonOutput(result.stdout, 'Preview PostgreSQL runtime');
      if (evidence.status !== 'PASS' || evidence.cleanup !== 'PASS') {
        throw new Error('Preview PostgreSQL runtime did not pass materially');
      }
      return evidence;
    },
    smokeProvision: async () => {
      const harness = createFullVerificationSmokeHarness({ campaignId });
      const evidence = await harness.provision();
      return Object.freeze({
        evidence,
        cleanup: harness.cleanup,
        smokeStart: harness.smokeStart,
        smokeUi: harness.smokeUi,
      });
    },
    cleanup: cleanupGovernedResources,
    assertCandidateStable: assertCandidateFingerprintStable,
  };

  try {
    const evidence = await runFullVerificationCampaign({
      campaignId,
      evidencePath,
      now: () => new Date(),
      operations,
      writeEvidence: async (path, value) =>
        writeFile(path, `${JSON.stringify(value, null, 2)}\n`, { mode: 0o600 }),
    });
    process.stdout.write(`${renderFullVerificationSummary(evidence)}\n`);
  } catch (error) {
    const summary = error.evidence
      ? renderFullVerificationSummary(error.evidence)
      : `Full Verification FAIL: ${error.message}\nEvidence: ${evidencePath}`;
    process.stderr.write(`${summary}\n`);
    process.exitCode = 1;
  }
}
