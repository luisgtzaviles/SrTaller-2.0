import assert from 'node:assert/strict';
import { cp, mkdtemp, rm, unlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { inspect } from 'node:util';

const {
  InternalMigrationProviderError,
  inspectMigrationSource,
} = await import(
  '../dist/infrastructure/database/database-migration-provider.js'
);

const migrationRoot = 'dist/infrastructure/database/migrations';
const migrationFile =
  '20260725183832_database_create_tenants_and_branches.js';
const stationMigrationFile =
  '20260726160000_stations_create_stations_and_bindings.js';
const previewMigrationFile =
  '20260801140000_preview_create_repairs_and_status_history.js';

function source(root, authorizedRoot = root) {
  return Object.freeze({
    root,
    authorizedRoot,
    normalizedRoot: 'src/infrastructure/database/migrations',
    mode: 'compiled',
  });
}

test('productive migration manifest is deterministic and owner-scoped', async () => {
  const first = await inspectMigrationSource(source(migrationRoot));
  const second = await inspectMigrationSource(source(migrationRoot));
  assert.deepEqual(first.manifest, second.manifest);
  assert.equal(first.manifest.migrations.length, 3);
  assert.deepEqual(
    first.manifest.migrations.map(
      ({ fileName, migrationName, order, owner }) => ({
        fileName,
        migrationName,
        order,
        owner,
      }),
    ),
    [
      {
        fileName: migrationFile,
        migrationName: migrationFile.replace(/\.js$/u, ''),
        order: 0,
        owner: 'database',
      },
      {
        fileName: stationMigrationFile,
        migrationName: stationMigrationFile.replace(/\.js$/u, ''),
        order: 1,
        owner: 'stations',
      },
      {
        fileName: previewMigrationFile,
        migrationName: previewMigrationFile.replace(/\.js$/u, ''),
        order: 2,
        owner: 'preview',
      },
    ],
  );
  assert.match(first.manifest.migrations[0].sha256, /^[a-f0-9]{64}$/u);
  assert.match(first.manifest.aggregateSha256, /^[a-f0-9]{64}$/u);
});

test('productive migration copy detects content, removal and interleaving drift', async () => {
  const temporary = await mkdtemp(
    join(tmpdir(), 'srtaller-tenant-schema-manifest-'),
  );
  const copiedRoot = join(temporary, 'migrations');
  await cp(migrationRoot, copiedRoot, { recursive: true });
  try {
    const migrationSource = source(copiedRoot, temporary);
    const baseline = await inspectMigrationSource(migrationSource);
    const copiedFile = join(copiedRoot, migrationFile);
    await writeFile(
      copiedFile,
      `${await import('node:fs/promises').then(({ readFile }) =>
        readFile(copiedFile, 'utf8'),
      )}\n// controlled drift\n`,
    );
    const changed = await inspectMigrationSource(migrationSource);
    assert.notEqual(
      changed.manifest.aggregateSha256,
      baseline.manifest.aggregateSha256,
    );

    await unlink(copiedFile);
    await unlink(`${copiedFile}.map`);
    const removed = await inspectMigrationSource(migrationSource);
    assert.notEqual(
      removed.manifest.aggregateSha256,
      changed.manifest.aggregateSha256,
    );

    const interleavedName =
      '20260725180000_database_create_interleaved_probe.js';
    await writeFile(
      join(copiedRoot, interleavedName),
      'export async function up() {}\n',
    );
    const interleaved = await inspectMigrationSource(migrationSource);
    assert.equal(
      interleaved.manifest.migrations[0].fileName,
      interleavedName,
    );
    assert.notEqual(
      interleaved.manifest.aggregateSha256,
      removed.manifest.aggregateSha256,
    );
  } finally {
    await rm(temporary, { recursive: true, force: true });
  }
});

test('manifest errors remain sanitized', async () => {
  const temporary = await mkdtemp(
    join(tmpdir(), 'srtaller-tenant-schema-invalid-'),
  );
  try {
    await writeFile(
      join(temporary, 'invalid-name.js'),
      'export async function up() {}\n',
    );
    await assert.rejects(
      inspectMigrationSource(source(temporary)),
      (error) => {
        assert.ok(error instanceof InternalMigrationProviderError);
        assert.equal(error.code, 'FILENAME_INVALID');
        assert.doesNotMatch(
          `${JSON.stringify(error)}\n${inspect(error)}`,
          /\/Users\/|password|postgres:\/\//iu,
        );
        return true;
      },
    );
  } finally {
    await rm(temporary, { recursive: true, force: true });
  }
});
