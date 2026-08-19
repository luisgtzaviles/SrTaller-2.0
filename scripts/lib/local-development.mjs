import { randomBytes } from 'node:crypto';
import { chmod, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

export const LOCAL_ENVIRONMENT = 'local';
export const LOCAL_IMAGE = 'postgres:18.4';
export const LOCAL_CONTAINER = 'srtaller-postgres-local';
export const LOCAL_VOLUME = 'srtaller-postgres-local-data';
export const LOCAL_DB_HOST = '127.0.0.1';
export const LOCAL_DB_PORT = 55432;
export const LOCAL_DB_NAME = 'srtaller_local';
export const LOCAL_ADMIN_USER = 'srtaller_local_admin';
export const LOCAL_MIGRATION_USER = 'srtaller_local_migration';
export const LOCAL_APPLICATION_USER = 'srtaller_local_application';
export const LOCAL_BACKEND_HOST = '127.0.0.1';
export const LOCAL_BACKEND_PORT = 3000;
export const LOCAL_VITE_HOST = '127.0.0.1';
export const LOCAL_VITE_PORT = 4173;
export const LOCAL_ENV_FILE = resolve(process.cwd(), '.env.local');

export const LOCAL_TENANT_ID = '00000000-0000-4000-8000-000000000001';
export const LOCAL_BRANCH_IDS = Object.freeze([
  '00000000-0000-4000-8000-000000000101',
  '00000000-0000-4000-8000-000000000102',
]);
export const LOCAL_SEED_TIMESTAMP = '2026-01-01T00:00:00.000Z';

const requiredLocalKeys = Object.freeze([
  'SR_LOCAL_ENVIRONMENT',
  'SR_LOCAL_DB_HOST',
  'SR_LOCAL_DB_PORT',
  'SR_LOCAL_DB_NAME',
  'SR_LOCAL_ADMIN_USER',
  'SR_LOCAL_ADMIN_PASSWORD',
  'SR_LOCAL_MIGRATION_USER',
  'SR_LOCAL_MIGRATION_PASSWORD',
  'SR_LOCAL_APPLICATION_USER',
  'SR_LOCAL_APPLICATION_PASSWORD',
  'SR_LOCAL_BACKEND_HOST',
  'SR_LOCAL_BACKEND_PORT',
  'SR_LOCAL_VITE_HOST',
  'SR_LOCAL_VITE_PORT',
]);

const forbiddenLocalKeys = Object.freeze([
  'DATABASE_URL',
  'PGDATABASE',
  'PGHOST',
  'PGPASSWORD',
  'PGPORT',
  'PGSERVICE',
  'PGSSLMODE',
  'PGUSER',
]);

function randomSecret() {
  return `local_${randomBytes(24).toString('hex')}`;
}

function defaultLocalValues() {
  return Object.freeze({
    SR_LOCAL_ENVIRONMENT: LOCAL_ENVIRONMENT,
    SR_LOCAL_DB_HOST: LOCAL_DB_HOST,
    SR_LOCAL_DB_PORT: String(LOCAL_DB_PORT),
    SR_LOCAL_DB_NAME: LOCAL_DB_NAME,
    SR_LOCAL_ADMIN_USER: LOCAL_ADMIN_USER,
    SR_LOCAL_ADMIN_PASSWORD: randomSecret(),
    SR_LOCAL_MIGRATION_USER: LOCAL_MIGRATION_USER,
    SR_LOCAL_MIGRATION_PASSWORD: randomSecret(),
    SR_LOCAL_APPLICATION_USER: LOCAL_APPLICATION_USER,
    SR_LOCAL_APPLICATION_PASSWORD: randomSecret(),
    SR_LOCAL_BACKEND_HOST: LOCAL_BACKEND_HOST,
    SR_LOCAL_BACKEND_PORT: String(LOCAL_BACKEND_PORT),
    SR_LOCAL_VITE_HOST: LOCAL_VITE_HOST,
    SR_LOCAL_VITE_PORT: String(LOCAL_VITE_PORT),
  });
}

function parseLine(line, lineNumber) {
  const trimmed = line.trim();
  if (trimmed === '' || trimmed.startsWith('#')) return null;
  const match = /^(?<key>[A-Z][A-Z0-9_]*)=(?<value>.*)$/u.exec(trimmed);
  if (!match?.groups) {
    throw new Error(`Invalid .env.local entry at line ${lineNumber}`);
  }
  return [match.groups.key, match.groups.value];
}

export function parseLocalEnvironment(text) {
  const values = {};
  for (const [index, line] of text.split(/\r?\n/u).entries()) {
    const parsed = parseLine(line, index + 1);
    if (parsed) values[parsed[0]] = parsed[1];
  }
  return Object.freeze(values);
}

function assertRequiredLocalValues(values) {
  for (const key of requiredLocalKeys) {
    if (typeof values[key] !== 'string' || values[key].trim() === '') {
      throw new Error(`Missing local development configuration: ${key}`);
    }
  }
  for (const key of forbiddenLocalKeys) {
    if (values[key] !== undefined) {
      throw new Error(`Forbidden connection variable in local configuration: ${key}`);
    }
  }
  for (const key of Object.keys(values)) {
    if (key.startsWith('SR_DB_') || key.startsWith('SR_TEST_DB_')) {
      throw new Error(`Canonical SR_DB_* values must be derived by the local runner: ${key}`);
    }
  }
}

export function assertLocalTarget(values) {
  assertRequiredLocalValues(values);
  const expected = {
    SR_LOCAL_ENVIRONMENT: LOCAL_ENVIRONMENT,
    SR_LOCAL_DB_HOST: LOCAL_DB_HOST,
    SR_LOCAL_DB_PORT: String(LOCAL_DB_PORT),
    SR_LOCAL_DB_NAME: LOCAL_DB_NAME,
    SR_LOCAL_ADMIN_USER: LOCAL_ADMIN_USER,
    SR_LOCAL_MIGRATION_USER: LOCAL_MIGRATION_USER,
    SR_LOCAL_APPLICATION_USER: LOCAL_APPLICATION_USER,
    SR_LOCAL_BACKEND_HOST: LOCAL_BACKEND_HOST,
    SR_LOCAL_BACKEND_PORT: String(LOCAL_BACKEND_PORT),
    SR_LOCAL_VITE_HOST: LOCAL_VITE_HOST,
    SR_LOCAL_VITE_PORT: String(LOCAL_VITE_PORT),
  };
  for (const [key, expectedValue] of Object.entries(expected)) {
    if (values[key] !== expectedValue) {
      throw new Error(`Local-only guard rejected ${key}: expected ${expectedValue}`);
    }
  }
  return values;
}

export async function ensureLocalEnvironment({ create = true } = {}) {
  let values;
  try {
    values = parseLocalEnvironment(await readFile(LOCAL_ENV_FILE, 'utf8'));
  } catch (error) {
    if (!create || error?.code !== 'ENOENT') throw error;
    values = defaultLocalValues();
    const contents = `${Object.entries(values)
      .map(([key, value]) => `${key}=${value}`)
      .join('\n')}\n`;
    await writeFile(LOCAL_ENV_FILE, contents, { encoding: 'utf8', mode: 0o600 });
    await chmod(LOCAL_ENV_FILE, 0o600);
  }
  return Object.freeze({ ...assertLocalTarget(values) });
}

export function databaseEnvironment(values, role) {
  assertLocalTarget(values);
  if (role !== 'migration' && role !== 'application') {
    throw new Error(`Unsupported local database role: ${String(role)}`);
  }
  const isMigration = role === 'migration';
  return Object.freeze({
    SR_DB_ENVIRONMENT: 'development',
    SR_DB_HOST: values.SR_LOCAL_DB_HOST,
    SR_DB_PORT: values.SR_LOCAL_DB_PORT,
    SR_DB_NAME: values.SR_LOCAL_DB_NAME,
    SR_DB_USER: isMigration ? values.SR_LOCAL_MIGRATION_USER : values.SR_LOCAL_APPLICATION_USER,
    SR_DB_PASSWORD: isMigration ? values.SR_LOCAL_MIGRATION_PASSWORD : values.SR_LOCAL_APPLICATION_PASSWORD,
    SR_DB_SSL_MODE: 'disable',
    SR_DB_POOL_MIN: '0',
    SR_DB_POOL_MAX: '5',
    SR_DB_IDLE_TIMEOUT_MS: '1000',
    SR_DB_CONNECTION_TIMEOUT_MS: '2000',
    SR_DB_STATEMENT_TIMEOUT_MS: '5000',
    SR_DB_QUERY_TIMEOUT_MS: '5000',
    SR_DB_APPLICATION_NAME: isMigration ? 'srtaller-local-migrator' : 'srtaller-local-runtime',
    SR_DB_ROLE: role,
    SR_DB_ACCESS_MODE: 'read-write',
    SR_DB_MIGRATIONS_ENABLED: String(isMigration),
  });
}

export function startupEnvironment(values) {
  assertLocalTarget(values);
  return Object.freeze({
    HOST: values.SR_LOCAL_BACKEND_HOST,
    NODE_ENV: 'development',
    PORT: values.SR_LOCAL_BACKEND_PORT,
  });
}

export function viteEnvironment(values) {
  assertLocalTarget(values);
  return Object.freeze({
    SRT_DEPLOY_ENV: 'local',
    SRT_LOCAL_BACKEND_PORT: values.SR_LOCAL_BACKEND_PORT,
    SRT_LOCAL_VITE_HOST: values.SR_LOCAL_VITE_HOST,
    SRT_LOCAL_VITE_PORT: values.SR_LOCAL_VITE_PORT,
  });
}

export function cleanChildEnvironment(base = process.env) {
  const environment = { ...base };
  for (const key of Object.keys(environment)) {
    if (
      forbiddenLocalKeys.includes(key) ||
      key === 'DATABASE_URL' ||
      key.startsWith('SR_DB_') ||
      key.startsWith('SR_TEST_DB_')
    ) delete environment[key];
  }
  return environment;
}

export function localSeedRows() {
  return Object.freeze({
    tenant: Object.freeze({
      tenantId: LOCAL_TENANT_ID,
      createdAt: LOCAL_SEED_TIMESTAMP,
    }),
    branches: Object.freeze(
      LOCAL_BRANCH_IDS.map((branchId) => Object.freeze({
        tenantId: LOCAL_TENANT_ID,
        branchId,
        createdAt: LOCAL_SEED_TIMESTAMP,
      })),
    ),
  });
}
