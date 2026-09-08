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
  assert.equal(first.manifest.migrations.length, 28);
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
        fileName: '20260819120000_database_create_repairs_worklist.js',
        migrationName: '20260819120000_database_create_repairs_worklist',
        order: 1,
        owner: 'database',
      },
      {
        fileName: '20260819130000_repairs_create_intakes.js',
        migrationName: '20260819130000_repairs_create_intakes',
        order: 2,
        owner: 'repairs',
      },
      {
        fileName: '20260819140000_repairs_create_timeline_entries.js',
        migrationName: '20260819140000_repairs_create_timeline_entries',
        order: 3,
        owner: 'repairs',
      },
      {
        fileName: '20260819150000_repairs_create_attachments.js',
        migrationName: '20260819150000_repairs_create_attachments',
        order: 4,
        owner: 'repairs',
      },
      {
        fileName: '20260820090000_repairs_add_operational_note_idempotency.js',
        migrationName: '20260820090000_repairs_add_operational_note_idempotency',
        order: 5,
        owner: 'repairs',
      },
      {
        fileName: '20260902090000_repairs_create_technician_assignment.js',
        migrationName: '20260902090000_repairs_create_technician_assignment',
        order: 6,
        owner: 'repairs',
      },
      {
        fileName: '20260902093000_repairs_add_technician_unassignment_idempotency.js',
        migrationName: '20260902093000_repairs_add_technician_unassignment_idempotency',
        order: 7,
        owner: 'repairs',
      },
      {
        fileName: '20260902100000_repairs_enforce_technician_scope.js',
        migrationName: '20260902100000_repairs_enforce_technician_scope',
        order: 8,
        owner: 'repairs',
      },
      {
        fileName: '20260903120000_repairs_create_workflow_transitions.js',
        migrationName: '20260903120000_repairs_create_workflow_transitions',
        order: 9,
        owner: 'repairs',
      },
      {
        fileName: '20260903130000_repairs_create_location_movements.js',
        migrationName: '20260903130000_repairs_create_location_movements',
        order: 10,
        owner: 'repairs',
      },
      {
        fileName: '20260904120000_stations_add_branch_timezone.js',
        migrationName: '20260904120000_stations_add_branch_timezone',
        order: 11,
        owner: 'stations',
      },
      {
        fileName: '20260905160000_stations_create_trusted_runtime_context.js',
        migrationName: '20260905160000_stations_create_trusted_runtime_context',
        order: 12,
        owner: 'stations',
      },
      {
        fileName: '20260906170000_users_create_directory.js',
        migrationName: '20260906170000_users_create_directory',
        order: 13,
        owner: 'users',
      },
      {
        fileName: '20260906171000_users_create_provisioning_bootstraps.js',
        migrationName: '20260906171000_users_create_provisioning_bootstraps',
        order: 14,
        owner: 'users',
      },
      {
        fileName: '20260906172000_users_create_lifecycle_commands.js',
        migrationName: '20260906172000_users_create_lifecycle_commands',
        order: 15,
        owner: 'users',
      },
      {
        fileName: '20260906180000_access_create_capability_catalog.js',
        migrationName: '20260906180000_access_create_capability_catalog',
        order: 16,
        owner: 'access',
      },
      {
        fileName: '20260906181000_access_create_roles.js',
        migrationName: '20260906181000_access_create_roles',
        order: 17,
        owner: 'access',
      },
      {
        fileName: '20260906182000_access_create_role_assignments.js',
        migrationName: '20260906182000_access_create_role_assignments',
        order: 18,
        owner: 'access',
      },
      {
        fileName: '20260907010000_access_create_pin_credentials.js',
        migrationName: '20260907010000_access_create_pin_credentials',
        order: 19,
        owner: 'access',
      },
      {
        fileName: '20260907110000_stations_add_admission_revisions.js',
        migrationName: '20260907110000_stations_add_admission_revisions',
        order: 20,
        owner: 'stations',
      },
      {
        fileName: '20260907111000_users_add_admission_revision.js',
        migrationName: '20260907111000_users_add_admission_revision',
        order: 21,
        owner: 'users',
      },
      {
        fileName: '20260907120000_access_create_operational_sessions.js',
        migrationName: '20260907120000_access_create_operational_sessions',
        order: 22,
        owner: 'access',
      },
      {
        fileName: '20260907220000_repairs_create_business_audit_events.js',
        migrationName: '20260907220000_repairs_create_business_audit_events',
        order: 23,
        owner: 'repairs',
      },
      {
        fileName: '20260907230000_access_add_local_administration_capabilities.js',
        migrationName: '20260907230000_access_add_local_administration_capabilities',
        order: 24,
        owner: 'access',
      },
      {
        fileName: '20260908000000_access_harden_pin_only_lookup.js',
        migrationName: '20260908000000_access_harden_pin_only_lookup',
        order: 25,
        owner: 'access',
      },
      {
        fileName: '20260908001000_repairs_create_operational_note_request_guards.js',
        migrationName: '20260908001000_repairs_create_operational_note_request_guards',
        order: 26,
        owner: 'repairs',
      },
      {
        fileName: '20260908002000_access_add_role_editing_commands.js',
        migrationName: '20260908002000_access_add_role_editing_commands',
        order: 27,
        owner: 'access',
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
