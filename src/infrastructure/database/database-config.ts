export interface DatabaseConfig {
  readonly identity: Readonly<{
    host: string;
    port: number;
    database: string;
    user: string;
    password: string;
  }>;
  readonly transport: Readonly<{
    sslMode: 'disable' | 'verify-ca' | 'verify-full';
  }>;
  readonly pool: Readonly<{
    min: number;
    max: number;
    idleTimeoutMs: number;
    connectionTimeoutMs: number;
    statementTimeoutMs: number;
    queryTimeoutMs: number;
  }>;
  readonly runtime: Readonly<{
    environment: 'development' | 'test' | 'production';
    role: 'application' | 'migration' | 'test';
    accessMode: 'read-only' | 'read-write';
    migrationsEnabled: boolean;
    testRunId: string | null;
  }>;
  readonly observability: Readonly<{
    applicationName: string;
    labels: Readonly<{
      component: 'persistence';
      environment: 'development' | 'test' | 'production';
      role: 'application' | 'migration' | 'test';
    }>;
  }>;
}

type DatabaseEnvironment = DatabaseConfig['runtime']['environment'];
type DatabaseRole = DatabaseConfig['runtime']['role'];
type DatabaseAccessMode = DatabaseConfig['runtime']['accessMode'];
type DatabaseSslMode = DatabaseConfig['transport']['sslMode'];

type DatabaseConfigErrorCode =
  | 'PERSISTENCE_CONFIG_REQUIRED'
  | 'PERSISTENCE_CONFIG_EMPTY'
  | 'PERSISTENCE_CONFIG_INVALID_STRING'
  | 'PERSISTENCE_CONFIG_INVALID_INTEGER'
  | 'PERSISTENCE_CONFIG_OUT_OF_RANGE'
  | 'PERSISTENCE_CONFIG_INVALID_BOOLEAN'
  | 'PERSISTENCE_CONFIG_UNKNOWN_VALUE'
  | 'PERSISTENCE_CONFIG_INCOMPATIBLE'
  | 'PERSISTENCE_CONFIG_UNSAFE_PRODUCTION'
  | 'PERSISTENCE_CONFIG_CONNECTION_STRING_FORBIDDEN'
  | 'PERSISTENCE_CONFIG_UNKNOWN_VARIABLE';

type SanitizedDatabaseConfig = Readonly<{
  identity: Readonly<{
    host: '<configured>';
    port: number;
    database: '<configured>';
    user: '<configured>';
    password: '[REDACTED]';
  }>;
  transport: DatabaseConfig['transport'];
  pool: DatabaseConfig['pool'];
  runtime: Readonly<{
    environment: DatabaseEnvironment;
    role: DatabaseRole;
    accessMode: DatabaseAccessMode;
    migrationsEnabled: boolean;
    testRunConfigured: boolean;
  }>;
  observability: DatabaseConfig['observability'];
}>;

const sharedVariableSuffixes = Object.freeze([
  'HOST',
  'PORT',
  'NAME',
  'USER',
  'PASSWORD',
  'SSL_MODE',
  'POOL_MIN',
  'POOL_MAX',
  'IDLE_TIMEOUT_MS',
  'CONNECTION_TIMEOUT_MS',
  'STATEMENT_TIMEOUT_MS',
  'QUERY_TIMEOUT_MS',
  'APPLICATION_NAME',
  'ROLE',
  'ACCESS_MODE',
  'MIGRATIONS_ENABLED',
] as const);

const forbiddenConnectionVariables = Object.freeze([
  'DATABASE_URL',
  'PGDATABASE',
  'PGHOST',
  'PGPASSWORD',
  'PGPORT',
  'PGSERVICE',
  'PGSSLMODE',
  'PGUSER',
  'SR_DATABASE_URL',
  'SR_DB_URL',
  'SR_TEST_DATABASE_URL',
  'SR_TEST_DB_URL',
]);

const maximumTimeoutMs = 3_600_000;

export class DatabaseConfigError extends Error {
  readonly category = 'Configuration';

  constructor(
    readonly code: DatabaseConfigErrorCode,
    readonly variable: string,
    readonly reason: string,
  ) {
    super(`${code}: ${variable}: ${reason}`);
    this.name = 'DatabaseConfigError';
  }

  toJSON(): Readonly<{
    name: 'DatabaseConfigError';
    category: 'Configuration';
    code: DatabaseConfigErrorCode;
    variable: string;
    reason: string;
    message: string;
  }> {
    return Object.freeze({
      name: 'DatabaseConfigError',
      category: this.category,
      code: this.code,
      variable: this.variable,
      reason: this.reason,
      message: this.message,
    });
  }
}

function fail(
  code: DatabaseConfigErrorCode,
  variable: string,
  reason: string,
): never {
  throw new DatabaseConfigError(code, variable, reason);
}

function requireRawValue(
  input: Readonly<Record<string, string | undefined>>,
  variable: string,
): string {
  const value = input[variable];
  if (value === undefined) {
    return fail(
      'PERSISTENCE_CONFIG_REQUIRED',
      variable,
      'required variable is missing',
    );
  }
  if (value.length === 0 || /^\s+$/u.test(value)) {
    return fail(
      'PERSISTENCE_CONFIG_EMPTY',
      variable,
      'required variable must not be empty or whitespace-only',
    );
  }
  return value;
}

function requireGovernedString(
  input: Readonly<Record<string, string | undefined>>,
  variable: string,
  maximumLength: number,
  pattern: RegExp,
): string {
  const value = requireRawValue(input, variable);
  if (value !== value.trim()) {
    return fail(
      'PERSISTENCE_CONFIG_INVALID_STRING',
      variable,
      'surrounding whitespace is not allowed',
    );
  }
  if (value.length > maximumLength || !pattern.test(value)) {
    return fail(
      'PERSISTENCE_CONFIG_INVALID_STRING',
      variable,
      'value does not satisfy the governed format',
    );
  }
  return value;
}

function requirePassword(
  input: Readonly<Record<string, string | undefined>>,
  variable: string,
): string {
  const value = requireRawValue(input, variable);
  if (value.length > 1_024) {
    return fail(
      'PERSISTENCE_CONFIG_INVALID_STRING',
      variable,
      'secret exceeds the governed maximum length',
    );
  }
  return value;
}

function requireInteger(
  input: Readonly<Record<string, string | undefined>>,
  variable: string,
  minimum: number,
  maximum: number,
): number {
  const value = requireRawValue(input, variable);
  if (!/^-?(?:0|[1-9]\d*)$/u.test(value)) {
    return fail(
      'PERSISTENCE_CONFIG_INVALID_INTEGER',
      variable,
      'value must use an unambiguous base-10 integer format',
    );
  }
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed)) {
    return fail(
      'PERSISTENCE_CONFIG_INVALID_INTEGER',
      variable,
      'value must be a safe integer',
    );
  }
  if (parsed < minimum || parsed > maximum) {
    return fail(
      'PERSISTENCE_CONFIG_OUT_OF_RANGE',
      variable,
      `value must be between ${minimum} and ${maximum}`,
    );
  }
  return parsed;
}

function requireBoolean(
  input: Readonly<Record<string, string | undefined>>,
  variable: string,
): boolean {
  const value = requireRawValue(input, variable);
  if (value === 'true') {
    return true;
  }
  if (value === 'false') {
    return false;
  }
  return fail(
    'PERSISTENCE_CONFIG_INVALID_BOOLEAN',
    variable,
    'value must be exactly true or false',
  );
}

function requireEnvironment(
  input: Readonly<Record<string, string | undefined>>,
): DatabaseEnvironment {
  const variable = 'SR_DB_ENVIRONMENT';
  const value = requireRawValue(input, variable);
  if (value === 'development' || value === 'test' || value === 'production') {
    return value;
  }
  return fail(
    'PERSISTENCE_CONFIG_UNKNOWN_VALUE',
    variable,
    'value must be development, test or production',
  );
}

function requireRole(
  input: Readonly<Record<string, string | undefined>>,
  variable: string,
): DatabaseRole {
  const value = requireRawValue(input, variable);
  if (value === 'application' || value === 'migration' || value === 'test') {
    return value;
  }
  return fail(
    'PERSISTENCE_CONFIG_UNKNOWN_VALUE',
    variable,
    'value must be application, migration or test',
  );
}

function requireAccessMode(
  input: Readonly<Record<string, string | undefined>>,
  variable: string,
): DatabaseAccessMode {
  const value = requireRawValue(input, variable);
  if (value === 'read-only' || value === 'read-write') {
    return value;
  }
  return fail(
    'PERSISTENCE_CONFIG_UNKNOWN_VALUE',
    variable,
    'value must be read-only or read-write',
  );
}

function requireSslMode(
  input: Readonly<Record<string, string | undefined>>,
  variable: string,
): DatabaseSslMode {
  const value = requireRawValue(input, variable);
  if (value === 'disable' || value === 'verify-ca' || value === 'verify-full') {
    return value;
  }
  return fail(
    'PERSISTENCE_CONFIG_UNKNOWN_VALUE',
    variable,
    'value must be disable, verify-ca or verify-full',
  );
}

function configuredVariables(prefix: 'SR_DB_' | 'SR_TEST_DB_'): readonly string[] {
  return sharedVariableSuffixes.map((suffix) => `${prefix}${suffix}`);
}

function rejectForbiddenAndUnknownVariables(
  input: Readonly<Record<string, string | undefined>>,
): void {
  for (const variable of forbiddenConnectionVariables) {
    if (input[variable] !== undefined) {
      fail(
        'PERSISTENCE_CONFIG_CONNECTION_STRING_FORBIDDEN',
        variable,
        'connection-string and driver fallback variables are forbidden',
      );
    }
  }

  const known = new Set([
    'SR_DB_ENVIRONMENT',
    'SR_TEST_DB_RUN_ID',
    ...configuredVariables('SR_DB_'),
    ...configuredVariables('SR_TEST_DB_'),
  ]);
  const unknown = Object.keys(input)
    .filter(
      (variable) =>
        input[variable] !== undefined &&
        (variable.startsWith('SR_DB_') ||
          variable.startsWith('SR_TEST_DB_')) &&
        !known.has(variable),
    )
    .sort();
  if (unknown[0]) {
    fail(
      'PERSISTENCE_CONFIG_UNKNOWN_VARIABLE',
      unknown[0],
      'prefixed persistence variable is not part of the governed contract',
    );
  }
}

function rejectInactivePrefix(
  input: Readonly<Record<string, string | undefined>>,
  environment: DatabaseEnvironment,
): void {
  const inactiveVariables =
    environment === 'test'
      ? configuredVariables('SR_DB_').filter(
          (variable) => variable !== 'SR_DB_ENVIRONMENT',
        )
      : ['SR_TEST_DB_RUN_ID', ...configuredVariables('SR_TEST_DB_')];
  const conflicting = inactiveVariables
    .filter((variable) => input[variable] !== undefined)
    .sort();
  if (conflicting[0]) {
    fail(
      'PERSISTENCE_CONFIG_INCOMPATIBLE',
      conflicting[0],
      'variable belongs to an inactive environment namespace',
    );
  }
}

function validateRuntimeCombination(
  environment: DatabaseEnvironment,
  role: DatabaseRole,
  accessMode: DatabaseAccessMode,
  migrationsEnabled: boolean,
  sslMode: DatabaseSslMode,
  prefix: 'SR_DB_' | 'SR_TEST_DB_',
): void {
  if (environment === 'test' && role !== 'test') {
    fail(
      'PERSISTENCE_CONFIG_INCOMPATIBLE',
      `${prefix}ROLE`,
      'the test environment requires the test role',
    );
  }
  if (environment !== 'test' && role === 'test') {
    fail(
      'PERSISTENCE_CONFIG_INCOMPATIBLE',
      `${prefix}ROLE`,
      'the test role is allowed only in the test environment',
    );
  }
  if (role === 'migration' && accessMode !== 'read-write') {
    fail(
      'PERSISTENCE_CONFIG_INCOMPATIBLE',
      `${prefix}ACCESS_MODE`,
      'the migration role requires read-write access',
    );
  }
  if (role === 'test' && accessMode !== 'read-write') {
    fail(
      'PERSISTENCE_CONFIG_INCOMPATIBLE',
      `${prefix}ACCESS_MODE`,
      'the test role requires isolated read-write access',
    );
  }
  if (migrationsEnabled !== (role === 'migration')) {
    fail(
      'PERSISTENCE_CONFIG_INCOMPATIBLE',
      `${prefix}MIGRATIONS_ENABLED`,
      'migrations must be enabled only, and always, for the migration role',
    );
  }
  if (environment === 'production' && sslMode !== 'verify-full') {
    fail(
      'PERSISTENCE_CONFIG_UNSAFE_PRODUCTION',
      `${prefix}SSL_MODE`,
      'production requires full certificate and hostname verification',
    );
  }
}

export function parseDatabaseConfig(
  input: Readonly<Record<string, string | undefined>>,
): Readonly<DatabaseConfig> {
  rejectForbiddenAndUnknownVariables(input);
  const environment = requireEnvironment(input);
  rejectInactivePrefix(input, environment);

  const prefix = environment === 'test' ? 'SR_TEST_DB_' : 'SR_DB_';
  const variable = (suffix: (typeof sharedVariableSuffixes)[number]): string =>
    `${prefix}${suffix}`;

  const role = requireRole(input, variable('ROLE'));
  const accessMode = requireAccessMode(input, variable('ACCESS_MODE'));
  const migrationsEnabled = requireBoolean(
    input,
    variable('MIGRATIONS_ENABLED'),
  );
  const sslMode = requireSslMode(input, variable('SSL_MODE'));

  validateRuntimeCombination(
    environment,
    role,
    accessMode,
    migrationsEnabled,
    sslMode,
    prefix,
  );

  const host = requireGovernedString(
    input,
    variable('HOST'),
    255,
    /^[A-Za-z0-9._:-]+$/u,
  );
  const port = requireInteger(input, variable('PORT'), 1, 65_535);
  const database = requireGovernedString(
    input,
    variable('NAME'),
    63,
    /^[A-Za-z0-9_.-]+$/u,
  );
  const user = requireGovernedString(
    input,
    variable('USER'),
    63,
    /^[A-Za-z0-9_.-]+$/u,
  );
  const password = requirePassword(input, variable('PASSWORD'));
  const min = requireInteger(input, variable('POOL_MIN'), 0, 100);
  const max = requireInteger(input, variable('POOL_MAX'), 1, 100);
  if (min > max) {
    fail(
      'PERSISTENCE_CONFIG_INCOMPATIBLE',
      variable('POOL_MIN'),
      'pool minimum must not exceed pool maximum',
    );
  }

  const idleTimeoutMs = requireInteger(
    input,
    variable('IDLE_TIMEOUT_MS'),
    1,
    maximumTimeoutMs,
  );
  const connectionTimeoutMs = requireInteger(
    input,
    variable('CONNECTION_TIMEOUT_MS'),
    1,
    maximumTimeoutMs,
  );
  const statementTimeoutMs = requireInteger(
    input,
    variable('STATEMENT_TIMEOUT_MS'),
    1,
    maximumTimeoutMs,
  );
  const queryTimeoutMs = requireInteger(
    input,
    variable('QUERY_TIMEOUT_MS'),
    1,
    maximumTimeoutMs,
  );
  const applicationName = requireGovernedString(
    input,
    variable('APPLICATION_NAME'),
    63,
    /^[A-Za-z0-9._:-]+$/u,
  );

  let testRunId: string | null = null;
  if (environment === 'test') {
    testRunId = requireGovernedString(
      input,
      'SR_TEST_DB_RUN_ID',
      40,
      /^[a-z0-9][a-z0-9_]*$/u,
    );
    if (database !== `srtaller_test_${testRunId}`) {
      fail(
        'PERSISTENCE_CONFIG_INCOMPATIBLE',
        variable('NAME'),
        'test database must be isolated and named for the declared run',
      );
    }
  }

  const identity = Object.freeze({
    host,
    port,
    database,
    user,
    password,
  });
  const transport = Object.freeze({ sslMode });
  const pool = Object.freeze({
    min,
    max,
    idleTimeoutMs,
    connectionTimeoutMs,
    statementTimeoutMs,
    queryTimeoutMs,
  });
  const runtime = Object.freeze({
    environment,
    role,
    accessMode,
    migrationsEnabled,
    testRunId,
  });
  const labels = Object.freeze({
    component: 'persistence' as const,
    environment,
    role,
  });
  const observability = Object.freeze({
    applicationName,
    labels,
  });

  return Object.freeze({
    identity,
    transport,
    pool,
    runtime,
    observability,
  });
}

export function sanitizeDatabaseConfig(
  config: Readonly<DatabaseConfig>,
): SanitizedDatabaseConfig {
  return Object.freeze({
    identity: Object.freeze({
      host: '<configured>' as const,
      port: config.identity.port,
      database: '<configured>' as const,
      user: '<configured>' as const,
      password: '[REDACTED]' as const,
    }),
    transport: Object.freeze({
      sslMode: config.transport.sslMode,
    }),
    pool: Object.freeze({
      min: config.pool.min,
      max: config.pool.max,
      idleTimeoutMs: config.pool.idleTimeoutMs,
      connectionTimeoutMs: config.pool.connectionTimeoutMs,
      statementTimeoutMs: config.pool.statementTimeoutMs,
      queryTimeoutMs: config.pool.queryTimeoutMs,
    }),
    runtime: Object.freeze({
      environment: config.runtime.environment,
      role: config.runtime.role,
      accessMode: config.runtime.accessMode,
      migrationsEnabled: config.runtime.migrationsEnabled,
      testRunConfigured: config.runtime.testRunId !== null,
    }),
    observability: Object.freeze({
      applicationName: config.observability.applicationName,
      labels: Object.freeze({
        component: config.observability.labels.component,
        environment: config.observability.labels.environment,
        role: config.observability.labels.role,
      }),
    }),
  });
}
