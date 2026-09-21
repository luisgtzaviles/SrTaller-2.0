import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const configPath =
  'src/infrastructure/database/database-config.ts';

test('typed persistence configuration retains its exact owner and narrow public API', async () => {
  const policy = JSON.parse(
    await readFile('architecture/dec-005-policy.json', 'utf8'),
  );
  const registration = policy.persistence.infrastructureFiles[configPath];

  assert.deepEqual(registration, {
    owner: 'database',
    publicExports: [
      'DatabaseConfig',
      'DatabaseConfigError',
      'parseDatabaseConfig',
      'sanitizeDatabaseConfig',
    ],
    consumers: [
      'src/infrastructure/database/database-connection.ts',
      'src/infrastructure/database/database-runtime.ts',
      'src/db-migrate.ts',
    ],
    status: 'materialized-configuration',
  });
});

test('configuration is pure and does not materialize persistence or SQL', async () => {
  const source = await readFile(configPath, 'utf8');

  assert.doesNotMatch(source, /^\s*import\s/mu);
  assert.doesNotMatch(source, /process\.env/u);
  assert.doesNotMatch(source, /(?:from\s+['"]|require\()['"](?:kysely|pg)/u);
  assert.doesNotMatch(source, /new\s+(?:Pool|Client|Kysely)\s*\(/u);
  assert.doesNotMatch(source, /\.(?:connect|query|execute)\s*\(/u);
  assert.doesNotMatch(source, /\b(?:SELECT|INSERT|UPDATE|DELETE|CREATE TABLE)\b/iu);
  assert.doesNotMatch(source, /connectionString/u);
  assert.doesNotMatch(source, /getGlobalDatabaseConfig|setConfig|mutableConfig/u);
});

test('only executable entrypoints read process.env and configuration is not read at import time', async () => {
  const files = [
    'src/db-migrate.ts',
    'src/app.module.ts',
    'src/main.ts',
    'src/startup-config.ts',
    'src/technical-shell.service.ts',
    configPath,
    'src/modules/access/access.module.ts',
    'src/modules/access/index.ts',
    'src/modules/stations/stations.module.ts',
    'src/modules/stations/index.ts',
    'src/modules/tenancy/tenancy.module.ts',
    'src/modules/tenancy/index.ts',
    'src/infrastructure/runtime/runtime-environment.reader.ts',
  ];
  const occurrences = [];
  for (const file of files) {
    const source = await readFile(file, 'utf8');
    for (const match of source.matchAll(/process\.env/gu)) {
      occurrences.push({ file, index: match.index });
    }
  }

  assert.deepEqual(
    occurrences.map(({ file }) => file),
    [
      'src/db-migrate.ts',
      'src/main.ts',
      'src/infrastructure/runtime/runtime-environment.reader.ts',
    ],
  );
  assert.match(
    await readFile('src/main.ts', 'utf8'),
    /const environment = process\.env;[\s\S]*loadStartupConfig\(environment\)/u,
  );
  assert.match(
    await readFile('src/main.ts', 'utf8'),
    /loadRequiredServerSecrets\(environment, \[[\s\S]*'SR_DB_PASSWORD',[\s\S]*'SR_PIN_PEPPER',[\s\S]*'SR_ADMIN_PASSWORD_PEPPER'/u,
  );
  assert.match(
    await readFile('src/db-migrate.ts', 'utf8'),
    /parseDatabaseConfig\(process\.env\)/u,
  );
});

test('domain and application layers do not import database configuration', async () => {
  const sourceFiles = [
    'src/modules/access/access.module.ts',
    'src/modules/access/index.ts',
    'src/modules/stations/stations.module.ts',
    'src/modules/stations/index.ts',
    'src/modules/tenancy/tenancy.module.ts',
    'src/modules/tenancy/index.ts',
  ];
  const combined = (
    await Promise.all(sourceFiles.map((file) => readFile(file, 'utf8')))
  ).join('\n');

  assert.doesNotMatch(combined, /database-config/u);
  assert.doesNotMatch(combined, /parseDatabaseConfig/u);
});
