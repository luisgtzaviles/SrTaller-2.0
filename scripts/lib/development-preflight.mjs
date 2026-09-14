import { execFile } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { createConnection } from 'node:net';
import { resolve } from 'node:path';
import { promisify } from 'node:util';

import { Pool } from 'pg';

import {
  LOCAL_BACKEND_HOST,
  LOCAL_BACKEND_PORT,
  LOCAL_BRANCH_IDS,
  LOCAL_DB_PORT,
  LOCAL_ENV_FILE,
  LOCAL_OWNER_USER_ID,
  LOCAL_STATION_ID,
  LOCAL_TENANT_ID,
  LOCAL_VITE_HOST,
  LOCAL_VITE_PORT,
  assertLocalTarget,
  parseLocalEnvironment,
} from './local-development.mjs';
import { LOCAL_EVIDENCE_FIXTURES } from './local-evidence-fixtures.mjs';
import { createCandidateFingerprint, assertCandidateFingerprintStable } from './candidate-fingerprint.mjs';
import { inspectSourceMigrationManifest } from './migration-state-snapshot.mjs';
import { inspectLiveRuntimeProvenance, inspectWorkingTreeProvenance } from './runtime-provenance.mjs';

const execute = promisify(execFile);

async function command(commandName, argumentsList, options = {}) {
  const { stdout } = await execute(commandName, argumentsList, {
    cwd: options.cwd ?? process.cwd(),
    encoding: 'utf8',
    maxBuffer: 10 * 1024 * 1024,
  });
  return stdout.trim();
}

export async function inspectLoopbackPort(port, host = '127.0.0.1') {
  return new Promise((resolveResult) => {
    const socket = createConnection({ host, port });
    const finish = (open) => {
      socket.destroy();
      resolveResult(Object.freeze({ host, port, open }));
    };
    socket.setTimeout(400, () => finish(false));
    socket.once('connect', () => finish(true));
    socket.once('error', () => finish(false));
  });
}

async function processLabel(port) {
  try {
    const output = await command('lsof', [
      '-nP',
      `-iTCP:${port}`,
      '-sTCP:LISTEN',
      '-F',
      'c',
    ]);
    return output
      .split('\n')
      .find((line) => line.startsWith('c'))
      ?.slice(1) ?? 'UNKNOWN';
  } catch {
    return 'NONE';
  }
}

async function inspectGit(projectRoot) {
  const [branch, head, status, main, originMain] = await Promise.all([
    command('git', ['branch', '--show-current'], { cwd: projectRoot }),
    command('git', ['rev-parse', 'HEAD'], { cwd: projectRoot }),
    command('git', ['status', '--porcelain=v1', '--untracked-files=all'], { cwd: projectRoot }),
    command('git', ['rev-parse', 'main'], { cwd: projectRoot }),
    command('git', ['rev-parse', 'origin/main'], { cwd: projectRoot }),
  ]);
  const mainIsAncestor = await execute(
    'git',
    ['merge-base', '--is-ancestor', main, head],
    { cwd: projectRoot },
  ).then(() => true, (error) => {
    if (error?.code === 1) return false;
    throw error;
  });
  return Object.freeze({
    branch: branch || 'DETACHED',
    head,
    sourceState: status === '' ? 'clean' : 'dirty',
    main,
    originMain,
    mainMatchesOrigin: main === originMain,
    mainIsAncestor,
  });
}

async function readLocalConfiguration() {
  const values = parseLocalEnvironment(await readFile(LOCAL_ENV_FILE, 'utf8'));
  assertLocalTarget(values);
  return values;
}

async function inspectLocalDatabase(values) {
  const pool = new Pool({
    host: values.SR_LOCAL_DB_HOST,
    port: Number(values.SR_LOCAL_DB_PORT),
    database: values.SR_LOCAL_DB_NAME,
    user: values.SR_LOCAL_MIGRATION_USER,
    password: values.SR_LOCAL_MIGRATION_PASSWORD,
    ssl: false,
    max: 1,
    connectionTimeoutMillis: 1_000,
    statement_timeout: 2_000,
    application_name: 'srtaller-development-preflight-read-only',
  });
  const client = await pool.connect();
  try {
    await client.query('begin read only');
    const [journal, fixtureCounts] = await Promise.all([
      client.query('select name from kysely_migration order by timestamp, name'),
      client.query(
        `select
           (select count(*)::integer from tenants where tenant_id = $1) as tenants,
           (select count(*)::integer from branches where tenant_id = $1 and branch_id = any($2::uuid[])) as branches,
           (select count(*)::integer from stations where tenant_id = $1 and station_id = $3) as stations,
           (select count(*)::integer from users where tenant_id = $1 and user_id = $4) as owner_users,
           (select count(*)::integer from access_pin_credentials where tenant_id = $1 and user_id = $4 and revoked_at is null) as owner_credentials`,
        [LOCAL_TENANT_ID, LOCAL_BRANCH_IDS, LOCAL_STATION_ID, LOCAL_OWNER_USER_ID],
      ),
    ]);
    await client.query('rollback');
    const counts = fixtureCounts.rows[0];
    return Object.freeze({
      status: 'AVAILABLE',
      journal: Object.freeze(journal.rows.map(({ name }) => name)),
      fixtures: Object.freeze({
        expectedDefinitions: LOCAL_EVIDENCE_FIXTURES.length,
        tenant: counts.tenants === 1,
        branches: counts.branches === LOCAL_BRANCH_IDS.length,
        station: counts.stations === 1,
        ownerUser: counts.owner_users === 1,
        ownerCredential: counts.owner_credentials === 1,
      }),
    });
  } finally {
    client.release();
    await pool.end();
  }
}

export async function runDevelopmentPreflight({
  projectRoot = process.cwd(),
  requireClean = false,
  requireRuntime = false,
} = {}) {
  const before = await createCandidateFingerprint(projectRoot);
  const findings = [];
  const [git, pnpmVersion, migrations, config, ports] = await Promise.all([
    inspectGit(projectRoot),
    command('pnpm', ['--version'], { cwd: projectRoot }),
    inspectSourceMigrationManifest({
      root: resolve(projectRoot, 'src/infrastructure/database/migrations'),
    }),
    readLocalConfiguration().catch(() => null),
    Promise.all([
      inspectLoopbackPort(LOCAL_BACKEND_PORT, LOCAL_BACKEND_HOST),
      inspectLoopbackPort(LOCAL_VITE_PORT, LOCAL_VITE_HOST),
      inspectLoopbackPort(LOCAL_DB_PORT),
    ]),
  ]);
  if (process.version !== 'v24.18.0' || pnpmVersion !== '11.15.1') {
    findings.push('TOOLCHAIN_MISMATCH');
  }
  if (!git.mainMatchesOrigin) findings.push('MAIN_ORIGIN_DIVERGED');
  if (git.branch === 'DETACHED') findings.push('DETACHED_HEAD');
  if (!git.mainIsAncestor) findings.push('CURRENT_BRANCH_NOT_BASED_ON_MAIN');
  if (requireClean && git.sourceState !== 'clean') findings.push('WORKTREE_NOT_CLEAN');
  if (!config) findings.push('LOCAL_CONFIGURATION_UNAVAILABLE');

  const portEvidence = [];
  for (const item of ports) {
    portEvidence.push(Object.freeze({
      ...item,
      process: item.open ? await processLabel(item.port) : 'NONE',
    }));
  }
  const backendOpen = portEvidence.find(({ port }) => port === LOCAL_BACKEND_PORT)?.open === true;
  const frontendOpen = portEvidence.find(({ port }) => port === LOCAL_VITE_PORT)?.open === true;
  let runtime = Object.freeze({ status: 'NOT_RUNNING' });
  if (backendOpen || frontendOpen) {
    if (!backendOpen || !frontendOpen) {
      runtime = Object.freeze({ status: 'PARTIAL' });
      findings.push('LOCAL_RUNTIME_PARTIAL');
    } else {
      try {
        runtime = await inspectLiveRuntimeProvenance({
          frontendBaseUrl: `http://${LOCAL_VITE_HOST}:${LOCAL_VITE_PORT}`,
          backendBaseUrl: `http://${LOCAL_BACKEND_HOST}:${LOCAL_BACKEND_PORT}`,
          expected: await inspectWorkingTreeProvenance(projectRoot),
        });
      } catch {
        runtime = Object.freeze({ status: 'STALE_OR_UNVERIFIABLE' });
        findings.push('LOCAL_RUNTIME_PROVENANCE_MISMATCH');
      }
    }
  } else if (requireRuntime) {
    findings.push('LOCAL_RUNTIME_NOT_RUNNING');
  }

  const databasePortOpen = portEvidence.find(({ port }) => port === LOCAL_DB_PORT)?.open === true;
  let database = Object.freeze({ status: 'NOT_RUNNING' });
  if (databasePortOpen && config) {
    try {
      database = await inspectLocalDatabase(config);
    } catch {
      database = Object.freeze({ status: 'UNVERIFIABLE' });
      findings.push('LOCAL_DATABASE_UNVERIFIABLE');
    }
  }
  if (requireRuntime && database.status !== 'AVAILABLE') {
    findings.push('LOCAL_DATABASE_NOT_READY');
  }
  if (
    database.status === 'AVAILABLE' &&
    Object.values(database.fixtures).some((value) => value === false)
  ) {
    findings.push('LOCAL_FIXTURES_INCOMPLETE');
  }
  if (
    database.status === 'AVAILABLE' &&
    database.journal.length !== migrations.migrations.length
  ) {
    findings.push('LOCAL_MIGRATION_JOURNAL_MISMATCH');
  }

  const after = await createCandidateFingerprint(projectRoot);
  assertCandidateFingerprintStable(before, after);
  const blockingFindings = findings.filter((finding) =>
    finding === 'TOOLCHAIN_MISMATCH' ||
    finding === 'MAIN_ORIGIN_DIVERGED' ||
    finding === 'DETACHED_HEAD' ||
    finding === 'CURRENT_BRANCH_NOT_BASED_ON_MAIN' ||
    finding === 'LOCAL_CONFIGURATION_UNAVAILABLE' ||
    (requireClean && finding === 'WORKTREE_NOT_CLEAN') ||
    (requireRuntime && finding.startsWith('LOCAL_')),
  );
  return Object.freeze({
    schemaVersion: 1,
    contract: 'WF-003/DEVELOPMENT-PREFLIGHT',
    destructiveOperations: false,
    git,
    toolchain: Object.freeze({ node: process.versions.node, pnpm: pnpmVersion }),
    ports: Object.freeze(portEvidence),
    runtime,
    migrations: Object.freeze({
      count: migrations.migrations.length,
      aggregateSha256: migrations.aggregateSha256,
      duplicates: 0,
    }),
    database,
    findings: Object.freeze(findings),
    candidateStable: before.candidateSha256 === after.candidateSha256,
    status: blockingFindings.length === 0 ? 'PASS' : 'FAIL',
  });
}
