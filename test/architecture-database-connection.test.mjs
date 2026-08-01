import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const connectionPath =
  'src/infrastructure/database/database-connection.ts';

test('connection facility retains its exact owner, API and transaction consumer', async () => {
  const policy = JSON.parse(
    await readFile('architecture/dec-005-policy.json', 'utf8'),
  );

  assert.deepEqual(policy.persistence.infrastructureFiles[connectionPath], {
    owner: 'database',
    publicExports: [
      'DatabaseConnection',
      'DatabaseConnectionError',
      'createDatabaseConnection',
      'sanitizeDatabaseConnectionState',
    ],
    consumers: [
      'src/infrastructure/database/transaction-runner.ts',
      'src/infrastructure/database/migration-runner.ts',
      'src/preview-runtime.service.ts',
      'src/preview-seed.ts',
      'src/run-migrations.ts',
      'src/modules/preview/infrastructure/persistence/kysely-preview-repair.repository.ts',
      'src/modules/stations/infrastructure/persistence/kysely-station-binding.repository.ts',
      'src/modules/stations/infrastructure/persistence/kysely-station-unit-of-work.ts',
      'src/modules/stations/infrastructure/persistence/kysely-station.repository.ts',
      'src/modules/stations/stations.module.ts',
      'src/modules/tenancy/infrastructure/persistence/kysely-branch-eligibility.ts',
      'src/modules/tenancy/infrastructure/persistence/kysely-branch.repository.ts',
      'src/modules/tenancy/infrastructure/persistence/kysely-tenant.repository.ts',
    ],
    status: 'materialized-connection-facility',
  });
  assert.deepEqual(policy.persistence.connectionProbe, {
    file: connectionPath,
    function: 'runConnectionVerification',
    sql: 'select 1',
  });
});

test('connection facility owns only the technical probe and exposes no driver', async () => {
  const source = await readFile(connectionPath, 'utf8');
  const queries = [...source.matchAll(/\.query\(([^)]*)\)/gu)];

  assert.equal(queries.length, 1);
  assert.equal(queries[0]?.[1], "'select 1'");
  assert.match(source, /new Pool\(poolConfig\(config\)\)/u);
  assert.match(source, /new Kysely<EmptyDatabaseSchema>/u);
  assert.match(source, /new PostgresDialect\(\{ pool: this\.#pool \}\)/u);
  assert.doesNotMatch(
    source,
    /export\s+(?:const|let|var|class|interface|type)\s+(?:pool|db|database|kysely|client)\b/iu,
  );
  assert.doesNotMatch(
    source,
    /\b(?:FileMigrationProvider|Migrator|CREATE|ALTER|DROP|INSERT|UPDATE|DELETE)\b/iu,
  );
  assert.doesNotMatch(source, /connectionString/u);
});

test('technical startup and non-owning product modules do not consume the connection facility', async () => {
  const files = [
    'src/main.ts',
    'src/app.module.ts',
    'src/modules/access/access.module.ts',
    'src/modules/tenancy/tenancy.module.ts',
  ];
  const combined = (
    await Promise.all(files.map((file) => readFile(file, 'utf8')))
  ).join('\n');

  assert.doesNotMatch(combined, /database-connection/u);
  assert.doesNotMatch(combined, /createDatabaseConnection/u);
  const stations = await readFile(
    'src/modules/stations/stations.module.ts',
    'utf8',
  );
  assert.match(stations, /import type \{ DatabaseConnection \}/u);
  assert.doesNotMatch(stations, /createDatabaseConnection/u);
  assert.match(
    await readFile('src/preview-runtime.service.ts', 'utf8'),
    /createDatabaseConnection/u,
  );
});
