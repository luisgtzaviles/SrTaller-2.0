import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import dns from 'node:dns';
import net from 'node:net';
import { promisify } from 'node:util';
import { inspect } from 'node:util';
import test from 'node:test';

const execFileAsync = promisify(execFile);

const {
  DatabaseConfigError,
  parseDatabaseConfig,
  sanitizeDatabaseConfig,
} = await import('../dist/infrastructure/database/database-config.js');

function developmentInput(overrides = {}) {
  return {
    SR_DB_ENVIRONMENT: 'development',
    SR_DB_HOST: '127.0.0.1',
    SR_DB_PORT: '5432',
    SR_DB_NAME: 'srtaller_development',
    SR_DB_USER: 'srtaller_application',
    SR_DB_PASSWORD: 'synthetic-development-password',
    SR_DB_SSL_MODE: 'disable',
    SR_DB_POOL_MIN: '0',
    SR_DB_POOL_MAX: '8',
    SR_DB_IDLE_TIMEOUT_MS: '30000',
    SR_DB_CONNECTION_TIMEOUT_MS: '5000',
    SR_DB_STATEMENT_TIMEOUT_MS: '15000',
    SR_DB_QUERY_TIMEOUT_MS: '20000',
    SR_DB_APPLICATION_NAME: 'srtaller-api-development',
    SR_DB_ROLE: 'application',
    SR_DB_ACCESS_MODE: 'read-write',
    SR_DB_MIGRATIONS_ENABLED: 'false',
    ...overrides,
  };
}

function productionInput(overrides = {}) {
  return developmentInput({
    SR_DB_ENVIRONMENT: 'production',
    SR_DB_HOST: 'db.internal.example',
    SR_DB_NAME: 'srtaller',
    SR_DB_USER: 'srtaller_application',
    SR_DB_PASSWORD: 'synthetic-production-placeholder',
    SR_DB_SSL_MODE: 'verify-full',
    SR_DB_APPLICATION_NAME: 'srtaller-api',
    ...overrides,
  });
}

function testInput(overrides = {}) {
  return {
    SR_DB_ENVIRONMENT: 'test',
    SR_TEST_DB_RUN_ID: 'run_001',
    SR_TEST_DB_HOST: '127.0.0.1',
    SR_TEST_DB_PORT: '5432',
    SR_TEST_DB_NAME: 'srtaller_test_run_001',
    SR_TEST_DB_USER: 'srtaller_test',
    SR_TEST_DB_PASSWORD: 'synthetic-test-password',
    SR_TEST_DB_SSL_MODE: 'disable',
    SR_TEST_DB_POOL_MIN: '0',
    SR_TEST_DB_POOL_MAX: '4',
    SR_TEST_DB_IDLE_TIMEOUT_MS: '1000',
    SR_TEST_DB_CONNECTION_TIMEOUT_MS: '1000',
    SR_TEST_DB_STATEMENT_TIMEOUT_MS: '5000',
    SR_TEST_DB_QUERY_TIMEOUT_MS: '5000',
    SR_TEST_DB_APPLICATION_NAME: 'srtaller-test',
    SR_TEST_DB_ROLE: 'test',
    SR_TEST_DB_ACCESS_MODE: 'read-write',
    SR_TEST_DB_MIGRATIONS_ENABLED: 'false',
    ...overrides,
  };
}

function expectConfigError(input, code, variable, secrets = []) {
  assert.throws(
    () => parseDatabaseConfig(input),
    (error) => {
      assert.ok(error instanceof DatabaseConfigError);
      assert.equal(error.code, code);
      assert.equal(error.variable, variable);
      assert.equal(error.category, 'Configuration');
      const rendered = [
        error.message,
        error.stack,
        JSON.stringify(error),
        inspect(error),
      ].join('\n');
      for (const secret of secrets.filter(Boolean)) {
        assert.ok(!rendered.includes(secret), 'diagnostic must not expose a secret');
      }
      return true;
    },
  );
}

test('valid development, production, migration and isolated test configurations pass', () => {
  const development = parseDatabaseConfig(developmentInput());
  const production = parseDatabaseConfig(productionInput());
  const migration = parseDatabaseConfig(
    developmentInput({
      SR_DB_ROLE: 'migration',
      SR_DB_ACCESS_MODE: 'read-write',
      SR_DB_MIGRATIONS_ENABLED: 'true',
      SR_DB_APPLICATION_NAME: 'srtaller-migrator-development',
    }),
  );
  const isolatedTest = parseDatabaseConfig(testInput());

  assert.equal(development.runtime.environment, 'development');
  assert.equal(production.transport.sslMode, 'verify-full');
  assert.equal(migration.runtime.role, 'migration');
  assert.equal(migration.runtime.migrationsEnabled, true);
  assert.equal(isolatedTest.runtime.testRunId, 'run_001');
  assert.equal(isolatedTest.identity.database, 'srtaller_test_run_001');
});

test('governed PostgreSQL Unix socket host configuration passes', () => {
  const development = parseDatabaseConfig(
    developmentInput({ SR_DB_HOST: '/var/run/postgresql' }),
  );
  const migration = parseDatabaseConfig(
    developmentInput({
      SR_DB_HOST: '/var/run/postgresql',
      SR_DB_ROLE: 'migration',
      SR_DB_ACCESS_MODE: 'read-write',
      SR_DB_MIGRATIONS_ENABLED: 'true',
      SR_DB_APPLICATION_NAME: 'srtaller-migrator-development',
    }),
  );
  const isolatedTest = parseDatabaseConfig(
    testInput({ SR_TEST_DB_HOST: '/var/run/postgresql' }),
  );

  assert.equal(development.identity.host, '/var/run/postgresql');
  assert.equal(development.identity.port, 5432);
  assert.equal(migration.identity.host, '/var/run/postgresql');
  assert.equal(migration.identity.port, 5432);
  assert.equal(isolatedTest.identity.host, '/var/run/postgresql');
  assert.equal(isolatedTest.identity.port, 5432);
});

test('ungoverned Unix socket paths and host injection payloads fail closed', () => {
  for (const host of [
    '/tmp',
    '/etc',
    '/',
    '/tmp/../../etc',
    '../postgresql',
    'var/run/postgresql',
    '/var/run/postgresql/',
    '/var/run/postgresql/../../etc',
    '/var/run/postgresql\n',
    '/var/run/postgresql\t',
    '/var/run/postgresql;touch',
    '/var/run/postgresql --host=127.0.0.1',
    'postgresql://srtaller_preview_migrator:secret@localhost/srtaller_preview',
    '127.0.0.1/.s.PGSQL.5432',
  ]) {
    expectConfigError(
      developmentInput({ SR_DB_HOST: host }),
      'PERSISTENCE_CONFIG_INVALID_STRING',
      'SR_DB_HOST',
      ['secret', 'synthetic-development-password'],
    );
  }
});

test('boundary values for port, pool and timeouts pass', () => {
  const minimum = parseDatabaseConfig(
    developmentInput({
      SR_DB_PORT: '1',
      SR_DB_POOL_MIN: '1',
      SR_DB_POOL_MAX: '1',
      SR_DB_IDLE_TIMEOUT_MS: '1',
      SR_DB_CONNECTION_TIMEOUT_MS: '1',
      SR_DB_STATEMENT_TIMEOUT_MS: '1',
      SR_DB_QUERY_TIMEOUT_MS: '1',
    }),
  );
  const maximum = parseDatabaseConfig(
    developmentInput({
      SR_DB_PORT: '65535',
      SR_DB_POOL_MIN: '100',
      SR_DB_POOL_MAX: '100',
      SR_DB_IDLE_TIMEOUT_MS: '3600000',
      SR_DB_CONNECTION_TIMEOUT_MS: '3600000',
      SR_DB_STATEMENT_TIMEOUT_MS: '3600000',
      SR_DB_QUERY_TIMEOUT_MS: '3600000',
    }),
  );

  assert.equal(minimum.identity.port, 1);
  assert.equal(minimum.pool.min, minimum.pool.max);
  assert.equal(maximum.identity.port, 65_535);
  assert.equal(maximum.pool.max, 100);
});

test('all required shared variables fail closed when absent', () => {
  const input = developmentInput();
  for (const variable of Object.keys(input)) {
    const missing = { ...input };
    delete missing[variable];
    expectConfigError(
      missing,
      'PERSISTENCE_CONFIG_REQUIRED',
      variable,
      [input.SR_DB_PASSWORD],
    );
  }
});

test('all required test variables fail closed and never fall back to shared values', () => {
  const input = testInput();
  for (const variable of Object.keys(input)) {
    const missing = { ...input };
    delete missing[variable];
    expectConfigError(
      missing,
      'PERSISTENCE_CONFIG_REQUIRED',
      variable,
      [input.SR_TEST_DB_PASSWORD],
    );
  }

  expectConfigError(
    {
      ...input,
      SR_DB_HOST: 'shared-host.example',
    },
    'PERSISTENCE_CONFIG_INCOMPATIBLE',
    'SR_DB_HOST',
    [input.SR_TEST_DB_PASSWORD],
  );
  expectConfigError(
    {
      ...developmentInput(),
      SR_TEST_DB_HOST: 'test-host.example',
    },
    'PERSISTENCE_CONFIG_INCOMPATIBLE',
    'SR_TEST_DB_HOST',
    ['synthetic-development-password'],
  );
});

test('empty and whitespace-only required strings fail without trimming', () => {
  for (const [variable, value] of [
    ['SR_DB_HOST', ''],
    ['SR_DB_NAME', '   '],
    ['SR_DB_USER', '\t'],
    ['SR_DB_PASSWORD', '\n'],
    ['SR_DB_APPLICATION_NAME', ' '],
  ]) {
    expectConfigError(
      developmentInput({ [variable]: value }),
      'PERSISTENCE_CONFIG_EMPTY',
      variable,
      [developmentInput().SR_DB_PASSWORD],
    );
  }

  for (const variable of [
    'SR_DB_HOST',
    'SR_DB_NAME',
    'SR_DB_USER',
    'SR_DB_APPLICATION_NAME',
  ]) {
    expectConfigError(
      developmentInput({ [variable]: ` ${developmentInput()[variable]}` }),
      'PERSISTENCE_CONFIG_INVALID_STRING',
      variable,
      [developmentInput().SR_DB_PASSWORD],
    );
  }
});

test('deterministic property-like integer cases reject ambiguous and extreme values', () => {
  const invalidFormats = [
    '1.5',
    '1e3',
    '+1',
    '01',
    ' 1',
    '1 ',
    'NaN',
    'Infinity',
    '∞',
    '１２',
  ];
  for (const value of invalidFormats) {
    expectConfigError(
      developmentInput({ SR_DB_PORT: value }),
      'PERSISTENCE_CONFIG_INVALID_INTEGER',
      'SR_DB_PORT',
      ['synthetic-development-password'],
    );
  }

  for (const value of ['-1', '0', '65536', '9007199254740992']) {
    expectConfigError(
      developmentInput({ SR_DB_PORT: value }),
      value === '9007199254740992'
        ? 'PERSISTENCE_CONFIG_INVALID_INTEGER'
        : 'PERSISTENCE_CONFIG_OUT_OF_RANGE',
      'SR_DB_PORT',
      ['synthetic-development-password'],
    );
  }

  for (const [variable, values] of [
    ['SR_DB_POOL_MIN', ['-1', '101']],
    ['SR_DB_POOL_MAX', ['0', '101']],
    ['SR_DB_IDLE_TIMEOUT_MS', ['-1', '0', '3600001']],
    ['SR_DB_CONNECTION_TIMEOUT_MS', ['-1', '0', '3600001']],
    ['SR_DB_STATEMENT_TIMEOUT_MS', ['-1', '0', '3600001']],
    ['SR_DB_QUERY_TIMEOUT_MS', ['-1', '0', '3600001']],
  ]) {
    for (const value of values) {
      expectConfigError(
        developmentInput({ [variable]: value }),
        'PERSISTENCE_CONFIG_OUT_OF_RANGE',
        variable,
        ['synthetic-development-password'],
      );
    }
  }
});

test('invalid enums, booleans and incompatible combinations fail closed', () => {
  const cases = [
    [
      { SR_DB_SSL_MODE: 'require' },
      'PERSISTENCE_CONFIG_UNKNOWN_VALUE',
      'SR_DB_SSL_MODE',
    ],
    [
      { SR_DB_ROLE: 'admin' },
      'PERSISTENCE_CONFIG_UNKNOWN_VALUE',
      'SR_DB_ROLE',
    ],
    [
      { SR_DB_ACCESS_MODE: 'write' },
      'PERSISTENCE_CONFIG_UNKNOWN_VALUE',
      'SR_DB_ACCESS_MODE',
    ],
    [
      { SR_DB_MIGRATIONS_ENABLED: 'TRUE' },
      'PERSISTENCE_CONFIG_INVALID_BOOLEAN',
      'SR_DB_MIGRATIONS_ENABLED',
    ],
    [
      { SR_DB_POOL_MIN: '9', SR_DB_POOL_MAX: '8' },
      'PERSISTENCE_CONFIG_INCOMPATIBLE',
      'SR_DB_POOL_MIN',
    ],
    [
      { SR_DB_ROLE: 'application', SR_DB_MIGRATIONS_ENABLED: 'true' },
      'PERSISTENCE_CONFIG_INCOMPATIBLE',
      'SR_DB_MIGRATIONS_ENABLED',
    ],
    [
      { SR_DB_ROLE: 'migration', SR_DB_MIGRATIONS_ENABLED: 'false' },
      'PERSISTENCE_CONFIG_INCOMPATIBLE',
      'SR_DB_MIGRATIONS_ENABLED',
    ],
    [
      {
        SR_DB_ROLE: 'migration',
        SR_DB_MIGRATIONS_ENABLED: 'true',
        SR_DB_ACCESS_MODE: 'read-only',
      },
      'PERSISTENCE_CONFIG_INCOMPATIBLE',
      'SR_DB_ACCESS_MODE',
    ],
    [
      { SR_DB_ROLE: 'test' },
      'PERSISTENCE_CONFIG_INCOMPATIBLE',
      'SR_DB_ROLE',
    ],
  ];

  for (const [overrides, code, variable] of cases) {
    expectConfigError(
      developmentInput(overrides),
      code,
      variable,
      ['synthetic-development-password'],
    );
  }

  expectConfigError(
    testInput({ SR_TEST_DB_ROLE: 'application' }),
    'PERSISTENCE_CONFIG_INCOMPATIBLE',
    'SR_TEST_DB_ROLE',
    ['synthetic-test-password'],
  );
  expectConfigError(
    productionInput({ SR_DB_SSL_MODE: 'disable' }),
    'PERSISTENCE_CONFIG_UNSAFE_PRODUCTION',
    'SR_DB_SSL_MODE',
    ['synthetic-production-placeholder'],
  );
});

test('test database identity is tied to a deterministic per-run namespace', () => {
  expectConfigError(
    testInput({ SR_TEST_DB_NAME: 'srtaller_test_shared' }),
    'PERSISTENCE_CONFIG_INCOMPATIBLE',
    'SR_TEST_DB_NAME',
    ['synthetic-test-password'],
  );
  for (const runId of ['RUN-1', '../run', 'run 1', 'rún', '']) {
    expectConfigError(
      testInput({ SR_TEST_DB_RUN_ID: runId }),
      runId === ''
        ? 'PERSISTENCE_CONFIG_EMPTY'
        : 'PERSISTENCE_CONFIG_INVALID_STRING',
      'SR_TEST_DB_RUN_ID',
      ['synthetic-test-password'],
    );
  }
});

test('connection strings, driver fallbacks and unknown prefixed variables are rejected', () => {
  for (const variable of [
    'DATABASE_URL',
    'PGPASSWORD',
    'PGHOST',
    'SR_DATABASE_URL',
    'SR_DB_URL',
    'SR_TEST_DB_URL',
  ]) {
    expectConfigError(
      developmentInput({ [variable]: 'postgresql://user:secret@example/db' }),
      'PERSISTENCE_CONFIG_CONNECTION_STRING_FORBIDDEN',
      variable,
      ['secret', 'synthetic-development-password'],
    );
  }
  for (const variable of ['SR_DB_SECRET_TOKEN', 'SR_DB_POOL_SIZE']) {
    expectConfigError(
      developmentInput({ [variable]: 'malicious-value' }),
      'PERSISTENCE_CONFIG_UNKNOWN_VARIABLE',
      variable,
      ['malicious-value', 'synthetic-development-password'],
    );
  }
});

test('sanitization is deterministic, immutable and safe for JSON and inspection', () => {
  const maliciousPassword =
    'synthetic-only-password\nwith-escape-\\u001b-and-"quotes"';
  const config = parseDatabaseConfig(
    developmentInput({ SR_DB_PASSWORD: maliciousPassword }),
  );
  const first = sanitizeDatabaseConfig(config);
  const second = sanitizeDatabaseConfig(config);
  const rendered = `${JSON.stringify(first)}\n${inspect(first)}`;

  assert.deepEqual(first, second);
  assert.equal(first.identity.password, '[REDACTED]');
  assert.equal(first.identity.host, '<configured>');
  assert.equal(first.identity.database, '<configured>');
  assert.equal(first.identity.user, '<configured>');
  assert.ok(!rendered.includes(maliciousPassword));
  assert.ok(!rendered.includes('synthetic-only-password'));
  assert.ok(Object.isFrozen(first));
  assert.ok(Object.isFrozen(first.identity));
  assert.ok(Object.isFrozen(first.pool));
  assert.ok(Object.isFrozen(first.observability.labels));
  assert.throws(() => {
    first.identity.port = 1234;
  }, TypeError);
});

test('errors never expose malicious password input', () => {
  const maliciousPassword =
    'synthetic-malicious\npassword\\escape\u001b[31m';
  expectConfigError(
    developmentInput({
      SR_DB_PASSWORD: maliciousPassword,
      SR_DB_PORT: 'not-a-port',
    }),
    'PERSISTENCE_CONFIG_INVALID_INTEGER',
    'SR_DB_PORT',
    [maliciousPassword, 'synthetic-malicious'],
  );
});

test('parsed configuration is deeply frozen, deterministic and input remains unchanged', () => {
  const input = developmentInput();
  const snapshot = structuredClone(input);
  const first = parseDatabaseConfig(input);
  const second = parseDatabaseConfig(input);

  assert.deepEqual(input, snapshot);
  assert.deepEqual(first, second);
  assert.notEqual(first, second);
  assert.notEqual(first.identity, second.identity);
  for (const value of [
    first,
    first.identity,
    first.transport,
    first.pool,
    first.runtime,
    first.observability,
    first.observability.labels,
  ]) {
    assert.ok(Object.isFrozen(value));
  }
  assert.throws(() => {
    first.identity.host = 'mutated.example';
  }, TypeError);
  assert.throws(() => {
    first.pool.max = 99;
  }, TypeError);
  assert.throws(() => {
    first.runtime.role = 'migration';
  }, TypeError);
});

test('TypeScript compile contract rejects every attempted mutation', async () => {
  await execFileAsync(process.execPath, [
    'node_modules/typescript/bin/tsc',
    '--ignoreConfig',
    '--noEmit',
    '--strict',
    '--noImplicitOverride',
    '--noUncheckedIndexedAccess',
    '--exactOptionalPropertyTypes',
    '--module',
    'NodeNext',
    '--moduleResolution',
    'NodeNext',
    '--target',
    'ES2024',
    '--types',
    'node',
    'test/persistence-config.types.ts',
  ]);
});

test('parsing and sanitization do not use sockets or DNS', () => {
  const originals = {
    connect: net.connect,
    createConnection: net.createConnection,
    lookup: dns.lookup,
    resolve: dns.resolve,
  };
  let networkCalls = 0;
  const unexpectedNetwork = () => {
    networkCalls += 1;
    throw new Error('persistence configuration attempted network access');
  };

  net.connect = unexpectedNetwork;
  net.createConnection = unexpectedNetwork;
  dns.lookup = unexpectedNetwork;
  dns.resolve = unexpectedNetwork;
  try {
    const config = parseDatabaseConfig(developmentInput());
    sanitizeDatabaseConfig(config);
    assert.equal(networkCalls, 0);
  } finally {
    net.connect = originals.connect;
    net.createConnection = originals.createConnection;
    dns.lookup = originals.lookup;
    dns.resolve = originals.resolve;
  }
});
