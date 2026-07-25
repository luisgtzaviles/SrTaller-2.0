import assert from 'node:assert/strict';
import {
  cp,
  mkdtemp,
  mkdir,
  rm,
  symlink,
  unlink,
  writeFile,
} from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { inspect } from 'node:util';

const {
  databaseMigrationCapability,
  databaseMigrationRuntime,
} = await import(
  '../dist/infrastructure/database/database-migration-capability.js'
);
const {
  InternalMigrationProviderError,
  createGovernedFileMigrationProvider,
  databaseMigrationSourceOverride,
  inspectMigrationSource,
} = await import(
  '../dist/infrastructure/database/database-migration-provider.js'
);
const {
  DatabaseMigrationError,
  createMigrationRunner,
} = await import('../dist/infrastructure/database/migration-runner.js');

const fixtureRoot = 'test/fixtures/database-migrations';

function source(root, mode = 'compiled', authorizedRoot = root) {
  return Object.freeze({
    root,
    authorizedRoot,
    normalizedRoot: 'test-fixtures/database-migrations',
    mode,
  });
}

async function temporaryDirectory() {
  return mkdtemp(join(tmpdir(), 'srtaller-migration-unit-'));
}

async function copyFixture(name) {
  const temporary = await temporaryDirectory();
  const root = join(temporary, name);
  await cp(join(fixtureRoot, name), root, { recursive: true });
  return { authorizedRoot: temporary, root, temporary };
}

function expectsProviderCode(code) {
  return (error) => {
    assert.ok(error instanceof InternalMigrationProviderError);
    assert.equal(error.code, code);
    return true;
  };
}

function expectsMigrationCode(code) {
  return (error) => {
    assert.ok(error instanceof DatabaseMigrationError);
    assert.equal(error.code, code);
    return true;
  };
}

function fakeConnection(runtime) {
  let verifyCount = 0;
  let capabilityCount = 0;
  return {
    connection: {
      state: 'created',
      async verify() {
        verifyCount += 1;
        this.state = 'ready';
      },
      async close() {
        this.state = 'closed';
      },
      [databaseMigrationRuntime]() {
        return Object.freeze({ ...runtime });
      },
      async [databaseMigrationCapability]() {
        capabilityCount += 1;
        throw new Error('database capability must not run');
      },
    },
    capabilityCount: () => capabilityCount,
    verifyCount: () => verifyCount,
  };
}

test('compiled discovery is strict, deterministic and backed by FileMigrationProvider', async () => {
  const copied = await copyFixture('valid');
  try {
    const first = await inspectMigrationSource(
      source(copied.root, 'compiled', copied.authorizedRoot),
    );
    const second = await inspectMigrationSource(
      source(copied.root, 'compiled', copied.authorizedRoot),
    );
    assert.deepEqual(first.manifest, second.manifest);
    assert.equal(first.manifest.migrations.length, 2);
    assert.deepEqual(
      first.manifest.migrations.map(({ migrationName, owner, order }) => ({
        migrationName,
        owner,
        order,
      })),
      [
        {
          migrationName: '20260725010000_database_create_probe_a',
          owner: 'database',
          order: 0,
        },
        {
          migrationName: '20260725010100_database_create_probe_b',
          owner: 'database',
          order: 1,
        },
      ],
    );
    assert.match(first.manifest.aggregateSha256, /^[a-f0-9]{64}$/u);
    assert.ok(Object.isFrozen(first.manifest));
    assert.ok(Object.isFrozen(first.manifest.migrations));

    const migrations =
      await createGovernedFileMigrationProvider(first).getMigrations();
    assert.deepEqual(Object.keys(migrations), [
      '20260725010000_database_create_probe_a',
      '20260725010100_database_create_probe_b',
    ]);
    assert.equal(typeof migrations['20260725010000_database_create_probe_a']?.up, 'function');
    assert.equal(typeof migrations['20260725010100_database_create_probe_b']?.down, 'function');
  } finally {
    await rm(copied.temporary, { recursive: true, force: true });
  }
});

test('source TypeScript and compiled JavaScript manifests are both validated', async () => {
  const temporary = await temporaryDirectory();
  const sourceRoot = join(temporary, 'source');
  const compiledRoot = join(temporary, 'compiled');
  await Promise.all([mkdir(sourceRoot), mkdir(compiledRoot)]);
  const baseName = '20260725010600_database_create_probe_contract';
  const body = 'export async function up() { return undefined; }\n';
  await Promise.all([
    writeFile(join(sourceRoot, `${baseName}.ts`), body),
    writeFile(join(compiledRoot, `${baseName}.js`), body),
  ]);
  try {
    const sourceInspection = await inspectMigrationSource(
      source(sourceRoot, 'source', temporary),
    );
    const compiledInspection = await inspectMigrationSource(
      source(compiledRoot, 'compiled', temporary),
    );
    assert.equal(sourceInspection.manifest.mode, 'source');
    assert.equal(compiledInspection.manifest.mode, 'compiled');
    assert.equal(
      sourceInspection.manifest.migrations[0]?.migrationName,
      compiledInspection.manifest.migrations[0]?.migrationName,
    );
    assert.equal(
      sourceInspection.manifest.migrations[0]?.sha256,
      compiledInspection.manifest.migrations[0]?.sha256,
    );
  } finally {
    await rm(temporary, { recursive: true, force: true });
  }
});

test('manifest detects content, removal and ordering drift before import', async () => {
  const copied = await copyFixture('valid');
  try {
    const migrationSource = source(
      copied.root,
      'compiled',
      copied.authorizedRoot,
    );
    const baseline = await inspectMigrationSource(migrationSource);
    const provider = createGovernedFileMigrationProvider(baseline);
    const secondFile = join(
      copied.root,
      '20260725010100_database_create_probe_b.js',
    );
    await writeFile(
      secondFile,
      'export async function up() { return "changed"; }\n',
    );
    const contentDrift = await inspectMigrationSource(migrationSource);
    assert.notEqual(
      contentDrift.manifest.aggregateSha256,
      baseline.manifest.aggregateSha256,
    );
    await assert.rejects(
      provider.getMigrations(),
      expectsProviderCode('PATH_FORBIDDEN'),
    );

    await unlink(secondFile);
    const removalDrift = await inspectMigrationSource(migrationSource);
    assert.notEqual(
      removalDrift.manifest.aggregateSha256,
      baseline.manifest.aggregateSha256,
    );
    await writeFile(
      join(
        copied.root,
        '20260725005900_database_create_probe_interleaved.js',
      ),
      'export async function up() {}\n',
    );
    const orderingDrift = await inspectMigrationSource(migrationSource);
    assert.notEqual(
      orderingDrift.manifest.aggregateSha256,
      removalDrift.manifest.aggregateSha256,
    );
    assert.equal(
      orderingDrift.manifest.migrations[0]?.migrationName,
      '20260725005900_database_create_probe_interleaved',
    );
  } finally {
    await rm(copied.temporary, { recursive: true, force: true });
  }
});

test('discovery rejects invalid names, duplicates, unknown files and imports', async () => {
  const invalidNames = [
    '.hidden.js',
    '20260725010700_database_create_probe.js.bak',
    '20260725010700_DATABASE_create_probe.js',
    '20260725010700_unknown_create_probe.js',
    '20260725010700_database_create.js',
    '20260725010700_database_create_próbe.js',
    '20260725010700_database_create probe.js',
    '20260230010700_database_create_probe.js',
    '20260725010700_database_create_probe.mjs',
  ];
  for (const invalidName of invalidNames) {
    const temporary = await temporaryDirectory();
    await writeFile(join(temporary, invalidName), 'export async function up() {}\n');
    try {
      await assert.rejects(
        inspectMigrationSource(source(temporary)),
        expectsProviderCode('FILENAME_INVALID'),
      );
    } finally {
      await rm(temporary, { recursive: true, force: true });
    }
  }

  const duplicateRoot = await temporaryDirectory();
  await Promise.all([
    writeFile(
      join(duplicateRoot, '20260725010800_database_create_probe_a.js'),
      'export async function up() {}\n',
    ),
    writeFile(
      join(duplicateRoot, '20260725010800_tenancy_create_probe_b.js'),
      'export async function up() {}\n',
    ),
  ]);
  try {
    await assert.rejects(
      inspectMigrationSource(source(duplicateRoot)),
      expectsProviderCode('DUPLICATE'),
    );
  } finally {
    await rm(duplicateRoot, { recursive: true, force: true });
  }

  const importRoot = await temporaryDirectory();
  await writeFile(
    join(importRoot, '20260725010900_database_create_probe_import.js'),
    "throw new Error('password=private /Users/private/source.js');\n",
  );
  try {
    const inspection = await inspectMigrationSource(source(importRoot));
    await assert.rejects(
      createGovernedFileMigrationProvider(inspection).getMigrations(),
      expectsProviderCode('PROVIDER_FAILED'),
    );
  } finally {
    await rm(importRoot, { recursive: true, force: true });
  }
});

test('discovery rejects traversal, symlinks and non-file entries', async () => {
  const authorized = await temporaryDirectory();
  const outside = await temporaryDirectory();
  const migrationName = '20260725011000_database_create_probe_path.js';
  await writeFile(
    join(outside, migrationName),
    'export async function up() {}\n',
  );
  try {
    await assert.rejects(
      inspectMigrationSource(source(outside, 'compiled', authorized)),
      expectsProviderCode('PATH_FORBIDDEN'),
    );

    const root = join(authorized, 'root');
    await mkdir(root);
    await symlink(join(outside, migrationName), join(root, migrationName));
    await assert.rejects(
      inspectMigrationSource(source(root, 'compiled', authorized)),
      expectsProviderCode('FILENAME_INVALID'),
    );

    await rm(join(root, migrationName));
    await mkdir(join(root, migrationName));
    await assert.rejects(
      inspectMigrationSource(source(root, 'compiled', authorized)),
      expectsProviderCode('FILENAME_INVALID'),
    );
  } finally {
    await Promise.all([
      rm(authorized, { recursive: true, force: true }),
      rm(outside, { recursive: true, force: true }),
    ]);
  }
});

test('role and missing productive directory fail before connection acquisition', async () => {
  for (const runtime of [
    {
      environment: 'development',
      role: 'application',
      accessMode: 'read-write',
      migrationsEnabled: false,
    },
    {
      environment: 'test',
      role: 'test',
      accessMode: 'read-write',
      migrationsEnabled: false,
    },
    {
      environment: 'development',
      role: 'migration',
      accessMode: 'read-only',
      migrationsEnabled: true,
    },
    {
      environment: 'development',
      role: 'migration',
      accessMode: 'read-write',
      migrationsEnabled: false,
    },
  ]) {
    const invalid = fakeConnection(runtime);
    assert.throws(
      () => createMigrationRunner(invalid.connection, {}),
      expectsMigrationCode('DATABASE_MIGRATION_INVALID_ROLE'),
    );
    assert.equal(invalid.verifyCount(), 0);
    assert.equal(invalid.capabilityCount(), 0);
  }

  const migration = fakeConnection({
    environment: 'development',
    role: 'migration',
    accessMode: 'read-write',
    migrationsEnabled: true,
  });
  const runner = createMigrationRunner(migration.connection, {});
  await assert.rejects(
    runner.getMigrationStatus(),
    expectsMigrationCode('DATABASE_MIGRATION_DIRECTORY_MISSING'),
  );
  assert.equal(migration.verifyCount(), 0);
  assert.equal(migration.capabilityCount(), 0);
  await runner.destroy();
});

test('runner options, overlap and sanitized errors fail closed', async () => {
  const migration = fakeConnection({
    environment: 'development',
    role: 'migration',
    accessMode: 'read-write',
    migrationsEnabled: true,
  });
  for (const options of [
    null,
    { lockTimeoutMs: 0 },
    { lockTimeoutMs: 60_001 },
    { expectedManifestHash: 'not-a-hash' },
    { arbitraryPath: '/tmp' },
    { [Symbol('unknown-option')]: true },
  ]) {
    assert.throws(
      () => createMigrationRunner(migration.connection, options),
      expectsMigrationCode('DATABASE_MIGRATION_INVALID_STATE'),
    );
  }

  const temporary = await temporaryDirectory();
  try {
    const runner = createMigrationRunner(migration.connection, {
      [databaseMigrationSourceOverride]: source(
        temporary,
        'compiled',
        temporary,
      ),
    });
    const status = runner.getMigrationStatus();
    await assert.rejects(
      runner.getMigrationStatus(),
      expectsMigrationCode('DATABASE_MIGRATION_INVALID_STATE'),
    );
    await assert.rejects(status);
    await runner.destroy();
  } finally {
    await rm(temporary, { recursive: true, force: true });
  }

  const error = new DatabaseMigrationError(
    'DATABASE_MIGRATION_PROVIDER_FAILED',
    'status',
    'failed',
    'development',
    'migration',
    null,
    null,
    new Error(
      'postgres://private:secret@host/db password=private /Users/private',
    ),
  );
  const rendered = `${JSON.stringify(error)}\n${inspect(error)}`;
  assert.doesNotMatch(
    rendered,
    /postgres:\/\/|password=|\/Users\/private|secret@/iu,
  );
  assert.match(rendered, /DATABASE_MIGRATION_PROVIDER_FAILED/u);
});
