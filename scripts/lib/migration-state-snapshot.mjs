import { createHash } from 'node:crypto';
import { execFile } from 'node:child_process';
import { readFile, readdir } from 'node:fs/promises';
import { basename, resolve } from 'node:path';
import { promisify } from 'node:util';

const execute = promisify(execFile);

const migrationPattern =
  /^(?<timestamp>\d{14})_(?<owner>[a-z][a-z0-9]*)_(?<action>[a-z][a-z0-9]*(?:_[a-z0-9]+)+)\.ts$/u;

function sha256(value) {
  return createHash('sha256').update(value).digest('hex');
}

function validTimestamp(value) {
  const year = Number(value.slice(0, 4));
  const month = Number(value.slice(4, 6));
  const day = Number(value.slice(6, 8));
  const hour = Number(value.slice(8, 10));
  const minute = Number(value.slice(10, 12));
  const second = Number(value.slice(12, 14));
  const date = new Date(Date.UTC(year, month - 1, day, hour, minute, second));
  return year >= 2000 && [
    date.getUTCFullYear(),
    String(date.getUTCMonth() + 1).padStart(2, '0'),
    String(date.getUTCDate()).padStart(2, '0'),
    String(date.getUTCHours()).padStart(2, '0'),
    String(date.getUTCMinutes()).padStart(2, '0'),
    String(date.getUTCSeconds()).padStart(2, '0'),
  ].join('') === value;
}

function createMigrationManifest(entries) {
  const migrations = [];
  const timestamps = new Set();
  const names = new Set();
  const contents = new Map();
  for (const entry of entries) {
    const match = migrationPattern.exec(entry.fileName);
    if (!entry.regularFile || !match?.groups) {
      throw new Error(`MIGRATION_FILENAME_INVALID:${entry.fileName}`);
    }
    const { timestamp, owner, action } = match.groups;
    const name = basename(entry.fileName, '.ts');
    if (!validTimestamp(timestamp)) {
      throw new Error(`MIGRATION_TIMESTAMP_INVALID:${entry.fileName}`);
    }
    if (timestamps.has(timestamp) || names.has(name)) {
      throw new Error(`MIGRATION_ID_DUPLICATE:${entry.fileName}`);
    }
    timestamps.add(timestamp);
    names.add(name);
    const content = entry.content;
    const contentSha256 = sha256(content);
    const duplicate = contents.get(contentSha256);
    if (duplicate) {
      throw new Error(`MIGRATION_CONTENT_DUPLICATE:${duplicate}:${entry.fileName}`);
    }
    contents.set(contentSha256, entry.fileName);
    migrations.push(Object.freeze({
      order: migrations.length,
      name,
      fileName: entry.fileName,
      timestamp,
      owner,
      action,
      sha256: contentSha256,
      bytes: content.byteLength,
    }));
  }
  const comparable = {
    schemaVersion: 1,
    migrations,
  };
  return Object.freeze({
    ...comparable,
    aggregateSha256: sha256(JSON.stringify(comparable)),
  });
}

export async function inspectSourceMigrationManifest({
  root = resolve(process.cwd(), 'src/infrastructure/database/migrations'),
} = {}) {
  const directoryEntries = (await readdir(root, { withFileTypes: true }))
    .sort((left, right) => left.name.localeCompare(right.name, 'en'));
  const entries = await Promise.all(directoryEntries.map(async (entry) => {
    const regularFile = entry.isFile() && !entry.isSymbolicLink();
    return {
      fileName: entry.name,
      regularFile,
      content: regularFile
        ? await readFile(resolve(root, entry.name))
        : Buffer.alloc(0),
    };
  }));
  return createMigrationManifest(entries);
}

export async function inspectMigrationManifestAtRevision({
  projectRoot = process.cwd(),
  revision,
} = {}) {
  if (!/^[0-9a-f]{40}$/u.test(revision ?? '')) {
    throw new Error('revision must be a full Git SHA');
  }
  const migrationRoot = 'src/infrastructure/database/migrations';
  const { stdout } = await execute(
    'git',
    ['ls-tree', '-rz', '--full-tree', revision, '--', migrationRoot],
    { cwd: projectRoot, encoding: 'buffer', maxBuffer: 10 * 1024 * 1024 },
  );
  const records = stdout.toString('utf8').split('\0').filter(Boolean);
  const entries = await Promise.all(records.map(async (record) => {
    const match = /^(?<mode>\d+) blob [0-9a-f]+\t(?<path>.+)$/u.exec(record);
    if (!match?.groups) throw new Error(`MIGRATION_GIT_ENTRY_INVALID:${record}`);
    const path = match.groups.path;
    const { stdout: content } = await execute(
      'git',
      ['show', `${revision}:${path}`],
      { cwd: projectRoot, encoding: 'buffer', maxBuffer: 10 * 1024 * 1024 },
    );
    return {
      fileName: basename(path),
      regularFile: match?.groups?.mode === '100644',
      content,
    };
  }));
  return createMigrationManifest(
    entries.sort((left, right) => left.fileName.localeCompare(right.fileName, 'en')),
  );
}

function assertIsoInstant(value, label) {
  const parsed = Date.parse(value ?? '');
  if (!Number.isFinite(parsed) || new Date(parsed).toISOString() !== value) {
    throw new Error(`${label} must be an ISO UTC instant`);
  }
}

export function createPreviewMigrationSnapshot({
  capturedAt,
  journalNames,
  manifest,
  releaseSha,
} = {}) {
  assertIsoInstant(capturedAt, 'capturedAt');
  if (!/^[0-9a-f]{40}$/u.test(releaseSha ?? '')) {
    throw new Error('releaseSha must be a full Git SHA');
  }
  if (!Array.isArray(journalNames) || journalNames.length === 0) {
    throw new Error('A real Preview journal export is required');
  }
  if (new Set(journalNames).size !== journalNames.length) {
    throw new Error('PREVIEW_JOURNAL_MIGRATION_DUPLICATE');
  }
  const byName = new Map(manifest.migrations.map((item) => [item.name, item]));
  const journal = journalNames.map((name, order) => {
    const item = byName.get(name);
    if (!item) throw new Error(`PREVIEW_JOURNAL_MIGRATION_UNKNOWN:${name}`);
    return Object.freeze({ order, name, timestamp: item.timestamp, sha256: item.sha256 });
  });
  for (let index = 1; index < journal.length; index += 1) {
    if (journal[index].timestamp <= journal[index - 1].timestamp) {
      throw new Error(`PREVIEW_JOURNAL_ORDER_INVALID:${journal[index].name}`);
    }
  }
  const comparable = {
    schemaVersion: 1,
    contract: 'WF-004/PREVIEW-MIGRATION-STATE',
    status: 'CAPTURED',
    environment: 'preview',
    captureMethod: 'authorized-real-journal-export',
    capturedAt,
    freshnessHours: 24,
    releaseSha,
    journal,
  };
  return Object.freeze({
    ...comparable,
    snapshotSha256: sha256(JSON.stringify(comparable)),
  });
}

function validateCapturedSnapshot(snapshot) {
  assertIsoInstant(snapshot.capturedAt, 'snapshot.capturedAt');
  if (
    snapshot.schemaVersion !== 1 ||
    snapshot.contract !== 'WF-004/PREVIEW-MIGRATION-STATE' ||
    snapshot.environment !== 'preview' ||
    snapshot.captureMethod !== 'authorized-real-journal-export' ||
    snapshot.freshnessHours !== 24 ||
    !/^[0-9a-f]{40}$/u.test(snapshot.releaseSha ?? '') ||
    !Array.isArray(snapshot.journal) ||
    snapshot.journal.length === 0
  ) {
    throw new Error('Preview migration snapshot contract is invalid');
  }
  const journalNames = snapshot.journal.map(({ name }) => name);
  if (new Set(journalNames).size !== journalNames.length) {
    throw new Error('Preview migration snapshot contains duplicate migrations');
  }
  for (let index = 0; index < snapshot.journal.length; index += 1) {
    const item = snapshot.journal[index];
    if (
      item.order !== index ||
      !migrationPattern.test(`${item.name}.ts`) ||
      !/^[0-9a-f]{64}$/u.test(item.sha256 ?? '') ||
      item.timestamp !== item.name.slice(0, 14) ||
      (index > 0 && item.timestamp <= snapshot.journal[index - 1].timestamp)
    ) {
      throw new Error('Preview migration snapshot journal is invalid');
    }
  }
  const comparable = { ...snapshot };
  delete comparable.snapshotSha256;
  if (snapshot.snapshotSha256 !== sha256(JSON.stringify(comparable))) {
    throw new Error('Preview migration snapshot hash is invalid');
  }
  return snapshot;
}

export function evaluatePreviewMigrationState({
  candidate,
  now = new Date(),
  phase = 'pre-merge',
  snapshot,
} = {}) {
  if (!['pre-merge', 'pre-deploy'].includes(phase)) {
    throw new Error('phase must be pre-merge or pre-deploy');
  }
  if (snapshot?.status !== 'CAPTURED') {
    return Object.freeze({
      status: 'UNKNOWN',
      compatibility: 'NOT_ASSERTED',
      freshness: 'NOT_CAPTURED',
      phase,
      findings: Object.freeze(['PREVIEW_MIGRATION_SNAPSHOT_NOT_CAPTURED']),
      blocking: phase === 'pre-deploy',
    });
  }
  validateCapturedSnapshot(snapshot);
  const ageMs = now.getTime() - Date.parse(snapshot.capturedAt);
  const fresh = ageMs >= 0 && ageMs <= snapshot.freshnessHours * 60 * 60 * 1_000;
  const candidateByName = new Map(candidate.migrations.map((item) => [item.name, item]));
  const findings = [];
  for (const applied of snapshot.journal) {
    const item = candidateByName.get(applied.name);
    if (!item) findings.push(`APPLIED_MIGRATION_MISSING:${applied.name}`);
    else if (item.sha256 !== applied.sha256) {
      findings.push(`APPLIED_MIGRATION_HASH_CHANGED:${applied.name}`);
    }
  }
  const latestAppliedTimestamp = snapshot.journal.at(-1)?.timestamp ?? '';
  const appliedNames = new Set(snapshot.journal.map(({ name }) => name));
  for (const pending of candidate.migrations.filter(({ name }) => !appliedNames.has(name))) {
    if (pending.timestamp <= latestAppliedTimestamp) {
      findings.push(`PENDING_MIGRATION_PRECEDES_JOURNAL:${pending.name}`);
    }
  }
  const materialConflict = findings.length > 0;
  if (!fresh) findings.push('PREVIEW_MIGRATION_SNAPSHOT_STALE');
  const compatibility = !materialConflict && fresh ? 'COMPATIBLE' : 'NOT_ASSERTED';
  return Object.freeze({
    status: materialConflict ? 'CONFLICT' : fresh ? 'PASS' : 'UNKNOWN',
    compatibility,
    freshness: fresh ? 'FRESH' : 'STALE',
    phase,
    ageSeconds: Math.max(0, Math.floor(ageMs / 1_000)),
    findings: Object.freeze(findings),
    blocking: materialConflict || (phase === 'pre-deploy' && compatibility !== 'COMPATIBLE'),
  });
}

export async function readPreviewMigrationSnapshot(path) {
  return JSON.parse(await readFile(path, 'utf8'));
}
