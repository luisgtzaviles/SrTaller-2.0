import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';
import { chmod, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

import { LOCAL_EVIDENCE_FIXTURES } from './local-evidence-fixtures.mjs';
import { PBI039_REPAIR_DETAIL_PARITY_FIXTURE } from './pbi039-repair-detail-parity-fixture.mjs';

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
export const LOCAL_BRANCH_TIME_ZONES = Object.freeze([
  'America/Hermosillo',
  'America/Tijuana',
]);
export const LOCAL_SEED_TIMESTAMP = '2026-01-01T00:00:00.000Z';
export const LOCAL_REPAIR_REFERENCE_DATE = '2026-08-19T12:00:00.000Z';
export const LOCAL_STATION_ID = '00000000-0000-4000-8000-000000000401';
export const LOCAL_STATION_CREDENTIAL_ID = '00000000-0000-4000-8000-000000000402';
export const LOCAL_OWNER_USER_ID = 'fe67f3c1-8794-461c-be72-7321b958000e';

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
  'SR_STATION_BOOTSTRAP_SECRET',
  'SR_USER_BOOTSTRAP_SECRET',
  'SR_PIN_PEPPER',
  'SR_ADMIN_PASSWORD_PEPPER',
  'SR_REGISTRATION_ABUSE_PEPPER',
]);

const ephemeralLocalPinKeys = Object.freeze([
  'SR_LOCAL_PIN_JORGE',
  'SR_LOCAL_PIN_MARIA',
  'SR_LOCAL_PIN_CARLOS',
]);

const localPinKeys = Object.freeze([
  ...ephemeralLocalPinKeys,
  'SR_LOCAL_PIN_LUIS',
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

function randomPinPepper() {
  return randomBytes(32).toString('base64url');
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
    SR_STATION_BOOTSTRAP_SECRET: randomSecret(),
    SR_USER_BOOTSTRAP_SECRET: randomSecret(),
    SR_PIN_PEPPER: randomPinPepper(),
    SR_ADMIN_PASSWORD_PEPPER: randomPinPepper(),
    SR_REGISTRATION_ABUSE_PEPPER: randomPinPepper(),
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
  if (values.SR_STATION_BOOTSTRAP_SECRET === undefined && create) {
    values = {
      ...values,
      SR_STATION_BOOTSTRAP_SECRET: randomSecret(),
    };
    const contents = `${Object.entries(values)
      .map(([key, value]) => `${key}=${value}`)
      .join('\n')}\n`;
    await writeFile(LOCAL_ENV_FILE, contents, { encoding: 'utf8', mode: 0o600 });
    await chmod(LOCAL_ENV_FILE, 0o600);
  }
  if (values.SR_USER_BOOTSTRAP_SECRET === undefined && create) {
    values = {
      ...values,
      SR_USER_BOOTSTRAP_SECRET: randomSecret(),
    };
    const contents = `${Object.entries(values)
      .map(([key, value]) => `${key}=${value}`)
      .join('\n')}\n`;
    await writeFile(LOCAL_ENV_FILE, contents, { encoding: 'utf8', mode: 0o600 });
    await chmod(LOCAL_ENV_FILE, 0o600);
  }
  if (values.SR_PIN_PEPPER === undefined && create) {
    values = {
      ...values,
      SR_PIN_PEPPER: randomPinPepper(),
    };
    const contents = `${Object.entries(values)
      .map(([key, value]) => `${key}=${value}`)
      .join('\n')}\n`;
    await writeFile(LOCAL_ENV_FILE, contents, { encoding: 'utf8', mode: 0o600 });
    await chmod(LOCAL_ENV_FILE, 0o600);
  }
  if (values.SR_ADMIN_PASSWORD_PEPPER === undefined && create) {
    values = {
      ...values,
      SR_ADMIN_PASSWORD_PEPPER: randomPinPepper(),
    };
    const contents = `${Object.entries(values)
      .map(([key, value]) => `${key}=${value}`)
      .join('\n')}\n`;
    await writeFile(LOCAL_ENV_FILE, contents, { encoding: 'utf8', mode: 0o600 });
    await chmod(LOCAL_ENV_FILE, 0o600);
  }
  if (values.SR_REGISTRATION_ABUSE_PEPPER === undefined && create) {
    values = {
      ...values,
      SR_REGISTRATION_ABUSE_PEPPER: randomPinPepper(),
    };
    const contents = `${Object.entries(values)
      .map(([key, value]) => `${key}=${value}`)
      .join('\n')}\n`;
    await writeFile(LOCAL_ENV_FILE, contents, { encoding: 'utf8', mode: 0o600 });
    await chmod(LOCAL_ENV_FILE, 0o600);
  }
  const persistedValues = Object.fromEntries(
    Object.entries(values).filter(([key]) => !ephemeralLocalPinKeys.includes(key)),
  );
  if (Object.keys(persistedValues).length !== Object.keys(values).length) {
    const contents = `${Object.entries(persistedValues)
      .map(([key, value]) => `${key}=${value}`)
      .join('\n')}\n`;
    await writeFile(LOCAL_ENV_FILE, contents, { encoding: 'utf8', mode: 0o600 });
    await chmod(LOCAL_ENV_FILE, 0o600);
  }
  return Object.freeze({ ...assertLocalTarget(values) });
}

export function assertLocalUserBootstrapAuthority(values, presentedSecret) {
  assertLocalTarget(values);
  const expected = Buffer.from(values.SR_USER_BOOTSTRAP_SECRET, 'utf8');
  const actual = Buffer.from(
    typeof presentedSecret === 'string' ? presentedSecret : '',
    'utf8',
  );
  if (
    expected.length !== actual.length ||
    !timingSafeEqual(expected, actual)
  ) {
    throw new Error('Local user bootstrap authority rejected.');
  }
  return values;
}

export function assertLocalAdminProvisioningContext(values, runtime) {
  assertLocalTarget(values);
  if (
    runtime?.NODE_ENV !== 'development' ||
    runtime?.SR_LOCAL_RUNTIME !== 'true' ||
    runtime?.SR_DB_ENVIRONMENT !== 'development' ||
    runtime?.HOST !== LOCAL_BACKEND_HOST
  ) {
    throw new Error('Local administrative identity provisioning rejected.');
  }
  return values;
}

export function localStationBootstrapCredential(values) {
  assertLocalTarget(values);
  const secret = values.SR_STATION_BOOTSTRAP_SECRET;
  if (typeof secret !== 'string' || secret.length < 32 || secret !== secret.trim()) {
    throw new Error('Local station bootstrap secret is unavailable.');
  }
  return createHash('sha256')
    .update(`srtaller-local-station-bootstrap:${secret}`, 'utf8')
    .digest('base64url');
}

export function localStationBootstrapCredentialHash(values) {
  return createHash('sha256')
    .update(localStationBootstrapCredential(values), 'utf8')
    .digest('hex');
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

export function startupEnvironment(values, runtimeProvenance = {}) {
  assertLocalTarget(values);
  return Object.freeze({
    HOST: values.SR_LOCAL_BACKEND_HOST,
    NODE_ENV: 'development',
    PORT: values.SR_LOCAL_BACKEND_PORT,
    SR_LOCAL_RUNTIME: 'true',
    ...runtimeProvenance,
  });
}

export function viteEnvironment(values, runtimeProvenance = {}) {
  assertLocalTarget(values);
  return Object.freeze({
    SRT_DEPLOY_ENV: 'local',
    SRT_LOCAL_BACKEND_PORT: values.SR_LOCAL_BACKEND_PORT,
    SRT_LOCAL_VITE_HOST: values.SR_LOCAL_VITE_HOST,
    SRT_LOCAL_VITE_PORT: values.SR_LOCAL_VITE_PORT,
    ...runtimeProvenance,
  });
}

export function cleanChildEnvironment(base = process.env) {
  const environment = { ...base };
  for (const key of Object.keys(environment)) {
    if (
      forbiddenLocalKeys.includes(key) ||
      localPinKeys.includes(key) ||
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
      LOCAL_BRANCH_IDS.map((branchId, index) => Object.freeze({
        tenantId: LOCAL_TENANT_ID,
        branchId,
        displayName: index === 0
          ? 'SR Taller Fixture — Hermosillo'
          : 'SR Taller Fixture — Tijuana',
        timeZone: LOCAL_BRANCH_TIME_ZONES[index],
        active: true,
        version: 0,
        createdAt: LOCAL_SEED_TIMESTAMP,
        updatedAt: LOCAL_SEED_TIMESTAMP,
      })),
    ),
  });
}

export function localUserRows() {
  return Object.freeze([
    ['00000000-0000-4000-8000-000000000501', 'Jorge Sintético', 'JORGE', 'active'],
    ['00000000-0000-4000-8000-000000000502', 'María Sintética', 'MARIA', 'active'],
    ['00000000-0000-4000-8000-000000000503', 'Carlos Sintético', 'CARLOS', 'active'],
    [LOCAL_OWNER_USER_ID, 'Luis', 'LUIS', 'active'],
  ].map(([userId, displayName, operationalIdentifier, status]) => Object.freeze({ userId, tenantId: LOCAL_TENANT_ID, displayName, operationalIdentifier, status, version: 0, createdAt: LOCAL_SEED_TIMESTAMP, updatedAt: LOCAL_SEED_TIMESTAMP })));
}

export function localAccessCapabilityRows() {
  return Object.freeze([
    'access_matrix.read',
    'access_matrix.manage',
    'repairs.add_note',
    'repairs.create',
    'repairs.correct_intake',
    'repairs.classify',
    'repairs.catalogs.read',
    'repairs.catalogs.manage',
    'repairs.configuration.read',
    'repairs.configuration.manage',
    'repairs.read',
    'price_list.read',
    'catalog.manage',
    'catalog.items.create',
    'catalog.items.update',
    'catalog.items.deactivate',
    'catalog.prices.manage',
    'catalog.branch_prices.manage',
    'catalog.reference_cost.read',
    'catalog.reference_cost.manage',
    'catalog.configuration.read',
    'catalog.configuration.manage',
    'catalog.import.read',
    'catalog.import.prepare',
    'catalog.import.publish',
    'catalog.items.bulk_retire',
    'catalog.suppliers.delete',
    'users.read',
    'users.manage',
  ].map((capabilityCode) => Object.freeze({
    capabilityCode,
    createdAt: LOCAL_SEED_TIMESTAMP,
  })));
}

export function localAccessRoleRows() {
  return Object.freeze([
    ['00000000-0000-4000-8000-000000000601', 'administrator', 'Administrador'],
    ['00000000-0000-4000-8000-000000000602', 'customer_service', 'Atención al cliente'],
    ['00000000-0000-4000-8000-000000000603', 'technician', 'Técnico'],
  ].map(([roleId, roleKey, displayName]) => Object.freeze({
    tenantId: LOCAL_TENANT_ID,
    roleId,
    roleKey,
    displayName,
    status: 'active',
    version: 0,
    createdAt: LOCAL_SEED_TIMESTAMP,
    updatedAt: LOCAL_SEED_TIMESTAMP,
  })));
}

export function localAccessRoleCapabilityRows() {
  const roleIds = Object.freeze({
    administrator: '00000000-0000-4000-8000-000000000601',
    customerService: '00000000-0000-4000-8000-000000000602',
    technician: '00000000-0000-4000-8000-000000000603',
  });
  const rows = [
    [roleIds.administrator, 'access_matrix.read'],
    [roleIds.administrator, 'access_matrix.manage'],
    [roleIds.administrator, 'repairs.add_note'],
    [roleIds.administrator, 'repairs.create'],
    [roleIds.administrator, 'repairs.correct_intake'],
    [roleIds.administrator, 'repairs.classify'],
    [roleIds.administrator, 'repairs.catalogs.read'],
    [roleIds.administrator, 'repairs.catalogs.manage'],
    [roleIds.administrator, 'repairs.configuration.read'],
    [roleIds.administrator, 'repairs.configuration.manage'],
    [roleIds.administrator, 'repairs.read'],
    [roleIds.administrator, 'price_list.read'],
    [roleIds.administrator, 'catalog.manage'],
    [roleIds.administrator, 'catalog.prices.manage'],
    [roleIds.administrator, 'catalog.branch_prices.manage'],
    [roleIds.administrator, 'catalog.reference_cost.read'],
    [roleIds.administrator, 'catalog.reference_cost.manage'],
    [roleIds.administrator, 'catalog.import.prepare'],
    [roleIds.administrator, 'catalog.import.publish'],
    [roleIds.administrator, 'catalog.items.bulk_retire'],
    [roleIds.administrator, 'catalog.suppliers.delete'],
    [roleIds.administrator, 'catalog.configuration.read'],
    [roleIds.administrator, 'catalog.configuration.manage'],
    [roleIds.administrator, 'users.read'],
    [roleIds.administrator, 'users.manage'],
    [roleIds.customerService, 'repairs.add_note'],
    [roleIds.customerService, 'repairs.create'],
    [roleIds.customerService, 'repairs.read'],
    [roleIds.customerService, 'price_list.read'],
    [roleIds.technician, 'repairs.add_note'],
    [roleIds.technician, 'repairs.read'],
  ];
  const legacySuccessors = Object.freeze({
    'catalog.manage': Object.freeze([
      'catalog.items.create',
      'catalog.items.update',
      'catalog.items.deactivate',
    ]),
    'catalog.import.prepare': Object.freeze(['catalog.import.read']),
  });
  const compatibilityRows = rows.flatMap(([roleId, capabilityCode]) =>
    (legacySuccessors[capabilityCode] ?? []).map((successor) => [roleId, successor]),
  );
  return Object.freeze([...rows, ...compatibilityRows].map(([roleId, capabilityCode]) => Object.freeze({
    tenantId: LOCAL_TENANT_ID,
    roleId,
    capabilityCode,
    createdAt: LOCAL_SEED_TIMESTAMP,
  })));
}

export function localAccessRoleAssignmentRows() {
  return Object.freeze([
    [
      '00000000-0000-4000-8000-000000000701',
      '00000000-0000-4000-8000-000000000501',
      '00000000-0000-4000-8000-000000000601',
      'TENANT_WIDE',
      null,
    ],
    [
      '00000000-0000-4000-8000-000000000702',
      '00000000-0000-4000-8000-000000000502',
      '00000000-0000-4000-8000-000000000602',
      'TENANT_WIDE',
      null,
    ],
    [
      '00000000-0000-4000-8000-000000000703',
      '00000000-0000-4000-8000-000000000503',
      '00000000-0000-4000-8000-000000000603',
      'BRANCH_RESTRICTED',
      LOCAL_BRANCH_IDS[0],
    ],
    [
      '00000000-0000-4000-8000-000000000704',
      LOCAL_OWNER_USER_ID,
      '00000000-0000-4000-8000-000000000601',
      'TENANT_WIDE',
      null,
    ],
  ].map(([assignmentId, userId, roleId, assignmentScope, branchId]) => Object.freeze({
    tenantId: LOCAL_TENANT_ID,
    assignmentId,
    userId,
    roleId,
    assignmentScope,
    branchId,
    status: 'active',
    version: 0,
    assignedAt: LOCAL_SEED_TIMESTAMP,
    revokedAt: null,
  })));
}

export function localRepairRows() {
  const tenantId = LOCAL_TENANT_ID;
  const branchId = LOCAL_BRANCH_IDS[0];
  const technicians = Object.freeze({
    ana: '00000000-0000-4000-8000-000000000201',
    bruno: '00000000-0000-4000-8000-000000000202',
    carla: '00000000-0000-4000-8000-000000000203',
  });
  const rows = [
    ['00000000-0000-4000-8000-000000001001', 'SR-2026-001', '2026-08-19T10:20:00.000Z', 'Ada Prueba', '6621000001', 'Apple', 'iPhone 13', 'Pantalla sin imagen', null, null, 'pending', 'active'],
    ['00000000-0000-4000-8000-000000001002', 'SR-2026-002', '2026-08-19T09:10:00.000Z', 'Bruno Ficticio', '6621000002', 'Samsung', 'Galaxy S22', 'No enciende después de caída', technicians.ana, 'Ana Técnica', 'diagnosing', 'active'],
    ['00000000-0000-4000-8000-000000001003', 'SR-2026-003', '2026-08-18T16:40:00.000Z', 'Celia Demo', '6621000003', 'Motorola', 'Edge 40', 'Cambio de centro de carga', technicians.bruno, 'Bruno Técnico', 'awaiting_authorization', 'active'],
    ['00000000-0000-4000-8000-000000001004', 'SR-2026-004', '2026-08-18T14:15:00.000Z', 'Dario Sintético', '6621000004', 'Xiaomi', 'Redmi Note 12', 'Batería inflada', technicians.carla, 'Carla Técnica', 'awaiting_part', 'active'],
    ['00000000-0000-4000-8000-000000001005', 'SR-2026-005', '2026-08-18T11:30:00.000Z', 'Eva Ejemplo', '6621000005', 'Huawei', 'P30 Lite', 'Cámara con enfoque intermitente', technicians.ana, 'Ana Técnica', 'repairing', 'active'],
    ['00000000-0000-4000-8000-000000001006', 'SR-2026-006', '2026-08-17T17:00:00.000Z', 'Fabián Prueba', '6621000006', 'Apple', 'iPhone 11', 'Micrófono con ruido', technicians.bruno, 'Bruno Técnico', 'reviewing', 'active'],
    ['00000000-0000-4000-8000-000000001007', 'SR-2026-007', '2026-08-17T13:45:00.000Z', 'Gala Ficticia', '6621000007', 'OPPO', 'Reno 8', 'Equipo probado y listo', technicians.carla, 'Carla Técnica', 'ready', 'active'],
    ['00000000-0000-4000-8000-000000001008', 'SR-2026-008', '2026-08-16T12:20:00.000Z', 'Hugo Demo', '6621000008', 'Nokia', 'G50', 'Falla no reproducible', null, null, 'unsuccessful', 'active'],
    ['00000000-0000-4000-8000-000000001009', 'SR-2026-009', '2026-08-15T10:00:00.000Z', 'Iris Sintética', '6621000009', 'Google', 'Pixel 7', 'Cliente canceló antes de autorizar', null, null, 'cancelled', 'active'],
    ['00000000-0000-4000-8000-000000001010', 'SR-2026-010', '2026-08-14T15:30:00.000Z', 'Jorge Ejemplo', '6621000010', 'Samsung', 'A54', 'Cambio de módulo terminado', technicians.ana, 'Ana Técnica', 'delivered', 'ended'],
    ['00000000-0000-4000-8000-000000001011', 'SR-2026-011', '2026-08-12T09:25:00.000Z', 'Karla Prueba', '6621000011', 'Apple', 'iPad 9', 'Conector flojo', technicians.bruno, 'Bruno Técnico', 'pending', 'active'],
    ['00000000-0000-4000-8000-000000001012', 'SR-2026-012', '2026-08-08T11:05:00.000Z', 'Leo Ficticio', '6621000012', 'Realme', 'C55', 'Equipo mojado', null, null, 'diagnosing', 'active'],
    ['00000000-0000-4000-8000-000000001013', 'SR-2026-013', '2026-07-31T16:10:00.000Z', 'Mia Demo', '6621000013', 'OnePlus', 'Nord 2', 'Falla de señal', technicians.carla, 'Carla Técnica', 'ready', 'active'],
    ['00000000-0000-4000-8000-000000001014', 'SR-2026-014', '2026-07-20T13:00:00.000Z', 'Nora Sintética', '6621000014', 'Sony', 'Xperia 10', 'Pantalla rota', technicians.ana, 'Ana Técnica', 'unsuccessful', 'active'],
    ['00000000-0000-4000-8000-000000001015', 'SR-2026-015', '2026-06-28T10:45:00.000Z', 'Oscar Ejemplo', '6621000015', 'Asus', 'Zenfone 9', 'No carga', technicians.bruno, 'Bruno Técnico', 'delivered', 'ended'],
  ];
  const mapped = rows.map(([repairId, folio, receivedAt, customerName, customerPhone, deviceBrand, deviceModel, reportedIssue, technicianId, technicianDisplayName, repairStatus, custodyStatus]) => Object.freeze({
    repairId,
    tenantId,
    branchId,
    folio,
    receivedAt,
    customerName,
    customerPhone,
    deviceBrand,
    deviceModel,
    reportedIssue,
    technicianId,
    technicianDisplayName,
    repairStatus,
    custodyStatus,
    createdAt: receivedAt,
  }));
  return Object.freeze([...mapped, PBI039_REPAIR_DETAIL_PARITY_FIXTURE.repair]);
}

export function localRepairCatalogRows() {
  const common = Object.freeze({
    scope: 'tenant',
    tenantId: LOCAL_TENANT_ID,
    code: null,
    status: 'active',
    version: 1,
    createdByActorId: LOCAL_OWNER_USER_ID,
    updatedByActorId: LOCAL_OWNER_USER_ID,
    createdAt: LOCAL_SEED_TIMESTAMP,
    updatedAt: LOCAL_SEED_TIMESTAMP,
  });
  const brandIds = Object.freeze({
    apple: '00000000-0000-4000-8000-000000020201',
    samsung: '00000000-0000-4000-8000-000000020202',
    motorola: '00000000-0000-4000-8000-000000020203',
    xiaomi: '00000000-0000-4000-8000-000000020204',
    huawei: '00000000-0000-4000-8000-000000020205',
    oppo: '00000000-0000-4000-8000-000000020206',
    nokia: '00000000-0000-4000-8000-000000020207',
    google: '00000000-0000-4000-8000-000000020208',
    realme: '00000000-0000-4000-8000-000000020209',
    oneplus: '00000000-0000-4000-8000-000000020210',
    sony: '00000000-0000-4000-8000-000000020211',
    asus: '00000000-0000-4000-8000-000000020212',
  });
  const rows = {
    deviceTypes: [
      ['00000000-0000-4000-8000-000000020101', 'Teléfono', 'telefono'],
      ['00000000-0000-4000-8000-000000020102', 'Tableta', 'tableta'],
    ].map(([deviceTypeId, canonicalLabel, normalizedKey]) => Object.freeze({ ...common, deviceTypeId, canonicalLabel, normalizedKey })),
    brands: [
      [brandIds.apple, 'Apple', 'apple'],
      [brandIds.samsung, 'Samsung', 'samsung'],
      [brandIds.motorola, 'Motorola', 'motorola'],
      [brandIds.xiaomi, 'Xiaomi', 'xiaomi'],
      [brandIds.huawei, 'Huawei', 'huawei'],
      [brandIds.oppo, 'OPPO', 'oppo'],
      [brandIds.nokia, 'Nokia', 'nokia'],
      [brandIds.google, 'Google', 'google'],
      [brandIds.realme, 'Realme', 'realme'],
      [brandIds.oneplus, 'OnePlus', 'oneplus'],
      [brandIds.sony, 'Sony', 'sony'],
      [brandIds.asus, 'Asus', 'asus'],
    ].map(([brandId, canonicalLabel, normalizedKey]) => Object.freeze({ ...common, brandId, canonicalLabel, normalizedKey })),
    models: [
      ['00000000-0000-4000-8000-000000020301', brandIds.apple, 'iPhone 11', 'iphone 11'],
      ['00000000-0000-4000-8000-000000020302', brandIds.apple, 'iPhone 13', 'iphone 13'],
      ['00000000-0000-4000-8000-000000020303', brandIds.samsung, 'Galaxy S22', 'galaxy s22'],
      ['00000000-0000-4000-8000-000000020304', brandIds.samsung, 'A54', 'a54'],
      ['00000000-0000-4000-8000-000000020305', brandIds.motorola, 'Edge 40', 'edge 40'],
      ['00000000-0000-4000-8000-000000020306', brandIds.xiaomi, 'Redmi Note 12', 'redmi note 12'],
      ['00000000-0000-4000-8000-000000020307', brandIds.huawei, 'P30 Lite', 'p30 lite'],
      ['00000000-0000-4000-8000-000000020308', brandIds.oppo, 'Reno 8', 'reno 8'],
      ['00000000-0000-4000-8000-000000020309', brandIds.nokia, 'G50', 'g50'],
      ['00000000-0000-4000-8000-000000020310', brandIds.google, 'Pixel 7', 'pixel 7'],
      ['00000000-0000-4000-8000-000000020311', brandIds.realme, 'C55', 'c55'],
      ['00000000-0000-4000-8000-000000020312', brandIds.oneplus, 'Nord 2', 'nord 2'],
      ['00000000-0000-4000-8000-000000020313', brandIds.sony, 'Xperia 10', 'xperia 10'],
      ['00000000-0000-4000-8000-000000020314', brandIds.asus, 'Zenfone 9', 'zenfone 9'],
      ['00000000-0000-4000-8000-000000020315', brandIds.apple, 'iPad 9', 'ipad 9'],
    ].map(([modelId, canonicalBrandId, canonicalLabel, normalizedKey]) => Object.freeze({ ...common, modelId, canonicalBrandId, canonicalLabel, normalizedKey })),
    risks: [
      ['00000000-0000-4000-8000-000000020401', 'Batería inflada', 'bateria inflada'],
      ['00000000-0000-4000-8000-000000020402', 'Cristal o pantalla quebrada', 'cristal o pantalla quebrada'],
      ['00000000-0000-4000-8000-000000020403', 'Humedad o contacto con líquido', 'humedad o contacto con liquido'],
      ['00000000-0000-4000-8000-000000020404', 'Equipo abierto previamente', 'equipo abierto previamente'],
    ].map(([riskId, canonicalLabel, normalizedKey]) => Object.freeze({ ...common, riskId, canonicalLabel, normalizedKey })),
    problemCategories: [
      ['00000000-0000-4000-8000-000000020501', 'Pantalla', 'pantalla'],
      ['00000000-0000-4000-8000-000000020502', 'Encendido', 'encendido'],
      ['00000000-0000-4000-8000-000000020503', 'Centro de carga', 'centro de carga'],
      ['00000000-0000-4000-8000-000000020504', 'Batería', 'bateria'],
      ['00000000-0000-4000-8000-000000020505', 'Audio', 'audio'],
    ].map(([categoryId, canonicalLabel, normalizedKey]) => Object.freeze({ ...common, categoryId, canonicalLabel, normalizedKey })),
  };
  return Object.freeze(Object.fromEntries(
    Object.entries(rows).map(([key, values]) => [key, Object.freeze(values)]),
  ));
}

export function localRepairTechnicianRows() {
  const tenantId = LOCAL_TENANT_ID;
  const createdAt = LOCAL_SEED_TIMESTAMP;
  return Object.freeze([
    ['00000000-0000-4000-8000-000000000201', 'Ana Técnica'],
    ['00000000-0000-4000-8000-000000000202', 'Bruno Técnico'],
    ['00000000-0000-4000-8000-000000000203', 'Carla Técnica'],
  ].map(([technicianId, displayName]) => Object.freeze({ technicianId, tenantId, displayName, active: true, createdAt })));
}

export function localRepairWorkflowTransitionRows() {
  const tenantId = LOCAL_TENANT_ID;
  const branchId = LOCAL_BRANCH_IDS[0];
  const actorId = '00000000-0000-4000-8000-000000000301';
  return Object.freeze([
    ['00000000-0000-4000-8000-000000006002', '00000000-0000-4000-8000-000000001002', '00000000-0000-4000-8000-000000007002', '2026-08-19T09:25:00.000Z'],
    ['00000000-0000-4000-8000-000000006012', '00000000-0000-4000-8000-000000001012', '00000000-0000-4000-8000-000000007012', '2026-08-08T11:20:00.000Z'],
  ].map(([transitionId, repairId, clientRequestId, occurredAt]) => Object.freeze({
    transitionId,
    tenantId,
    branchId,
    repairId,
    command: 'start_diagnosis',
    fromState: 'pending',
    toState: 'diagnosing',
    actorId,
    actorDisplayName: 'Operador sintético',
    occurredAt,
    reason: null,
    clientRequestId,
    expectedWorkflowVersion: 0,
    workflowVersion: 1,
  })));
}

export function localRepairLocationRows() {
  return Object.freeze(LOCAL_BRANCH_IDS.flatMap((branchId, branchIndex) => [
    Object.freeze({
      locationId: `00000000-0000-4000-8000-${String(8001 + branchIndex * 2).padStart(12, '0')}`,
      tenantId: LOCAL_TENANT_ID,
      branchId,
      code: 'pending_area',
      semanticCategory: 'pending_area',
      displayLabel: 'Área de pendientes',
      active: true,
      createdAt: LOCAL_SEED_TIMESTAMP,
    }),
    Object.freeze({
      locationId: `00000000-0000-4000-8000-${String(8002 + branchIndex * 2).padStart(12, '0')}`,
      tenantId: LOCAL_TENANT_ID,
      branchId,
      code: 'workshop',
      semanticCategory: 'workshop',
      displayLabel: 'Taller',
      active: true,
      createdAt: LOCAL_SEED_TIMESTAMP,
    }),
  ]));
}

export function localRepairLocationMovementRows() {
  const locations = localRepairLocationRows().filter(({ branchId }) => branchId === LOCAL_BRANCH_IDS[0]);
  const pending = locations.find(({ code }) => code === 'pending_area');
  const workshop = locations.find(({ code }) => code === 'workshop');
  if (!pending || !workshop) throw new Error('Local repair location catalog is incomplete.');
  const workshopRepairs = new Set(['002', '003', '005', '006', '007', '012', '013', '039']);
  const actorId = '00000000-0000-4000-8000-000000000301';
  const rows = [];
  for (const repair of localRepairRows()) {
    const suffix = repair.folio.slice(-3);
    if (suffix === '008') continue;
    rows.push(Object.freeze({
      movementId: `00000000-0000-4000-8000-${String(9000 + Number(suffix)).padStart(12, '0')}`,
      tenantId: repair.tenantId,
      branchId: repair.branchId,
      repairId: repair.repairId,
      command: 'initial_placement',
      fromLocationId: null,
      toLocationId: pending.locationId,
      fromCode: null,
      fromLabel: null,
      toCode: pending.code,
      toLabel: pending.displayLabel,
      actorId,
      actorDisplayName: 'Operador sintético',
      occurredAt: repair.receivedAt,
      reason: null,
      clientRequestId: `00000000-0000-4000-8000-${String(10000 + Number(suffix)).padStart(12, '0')}`,
      expectedLocationVersion: 0,
      locationVersion: 1,
    }));
    if (workshopRepairs.has(suffix)) {
      const occurredAt = new Date(new Date(repair.receivedAt).getTime() + 30 * 60_000).toISOString();
      rows.push(Object.freeze({
        movementId: `00000000-0000-4000-8000-${String(11000 + Number(suffix)).padStart(12, '0')}`,
        tenantId: repair.tenantId,
        branchId: repair.branchId,
        repairId: repair.repairId,
        command: 'move_to_workshop',
        fromLocationId: pending.locationId,
        toLocationId: workshop.locationId,
        fromCode: pending.code,
        fromLabel: pending.displayLabel,
        toCode: workshop.code,
        toLabel: workshop.displayLabel,
        actorId,
        actorDisplayName: 'Operador sintético',
        occurredAt,
        reason: null,
        clientRequestId: `00000000-0000-4000-8000-${String(12000 + Number(suffix)).padStart(12, '0')}`,
        expectedLocationVersion: 1,
        locationVersion: 2,
      }));
    }
  }
  return Object.freeze(rows);
}

export function localRepairTechnicianBranchRows() {
  const tenantId = LOCAL_TENANT_ID;
  const branchId = LOCAL_BRANCH_IDS[0];
  return Object.freeze(localRepairTechnicianRows().map((technician) => Object.freeze({ tenantId, branchId, technicianId: technician.technicianId, createdAt: LOCAL_SEED_TIMESTAMP })));
}

export function localRepairTechnicianAssignmentRows() {
  const actorId = '00000000-0000-4000-8000-000000000301';
  const actorName = 'Operador sintético';
  const assignments = localRepairRows().filter((repair) => repair.technicianId).map((repair) => Object.freeze({
    assignmentId: `00000000-0000-4000-8000-${String(4000 + Number(repair.folio.slice(-3))).padStart(12, '0')}`,
    tenantId: repair.tenantId,
    branchId: repair.branchId,
    repairId: repair.repairId,
    technicianId: repair.technicianId,
    assignedByActorId: actorId,
    assignedByActorDisplayName: actorName,
    assignedAt: repair.receivedAt,
    endedAt: repair.custodyStatus === 'ended' ? repair.receivedAt : null,
    endedByActorId: repair.custodyStatus === 'ended' ? actorId : null,
    endedByActorDisplayName: repair.custodyStatus === 'ended' ? actorName : null,
    reason: null,
    clientRequestId: `00000000-0000-4000-8000-${String(5000 + Number(repair.folio.slice(-3))).padStart(12, '0')}`,
    endedClientRequestId: null,
    assignmentSequence: 1,
  }));
  return Object.freeze(assignments);
}

export function localRepairIntakeRows() {
  const tenantId = LOCAL_TENANT_ID;
  const branchId = LOCAL_BRANCH_IDS[0];
  const receivers = Object.freeze({
    mar: '00000000-0000-4000-8000-000000000301',
    sol: '00000000-0000-4000-8000-000000000302',
  });
  const rows = [
    ['00000000-0000-4000-8000-000000001001', 'Azul medianoche', receivers.mar, 'Mar Recepción', 'La pantalla dejó de mostrar imagen después de una caída corta; el equipo todavía emite sonidos.', 'Cristal con fisura en la esquina superior derecha y marcas de uso en el marco.', 'Se informó que la apertura puede extender la fisura existente.'],
    ['00000000-0000-4000-8000-000000001002', 'Negro', null, null, 'El equipo cayó y desde entonces no responde al botón de encendido.', 'Golpe visible en marco inferior; tapa posterior sin desprendimiento.', null],
    ['00000000-0000-4000-8000-000000001003', 'Verde', receivers.sol, 'Sol Recepción', 'La persona indica que el equipo cargaba únicamente al mantener el cable inclinado. Durante los últimos días la conexión se volvió intermitente hasta dejar de reconocer distintos cables y cargadores. Solicita revisar el centro de carga antes de considerar cualquier otra intervención.', 'Puerto de carga con residuos visibles y desgaste. Marco con rayones moderados, cristal frontal íntegro y tapa posterior firmemente colocada. El equipo se recibió encendido con nivel bajo de batería; no se realizaron pruebas que impliquen desmontaje.', 'Se explicó que retirar residuos o abrir el equipo puede revelar corrosión o daño previo no visible.'],
    ['00000000-0000-4000-8000-000000001004', 'Azul', receivers.mar, 'Mar Recepción', 'Notó que la tapa comenzó a levantarse durante la carga.', 'Tapa posterior separada en el costado derecho; no se presionó ni conectó el equipo.', 'Se informó que una batería inflada requiere aislamiento y que el equipo no debe cargarse.'],
    ['00000000-0000-4000-8000-000000001005', 'Dorado', receivers.sol, 'Sol Recepción', 'La cámara pierde el enfoque de forma intermitente.', 'Marcas leves de uso; lentes sin fractura visible.', null],
    ['00000000-0000-4000-8000-000000001006', 'Negro', receivers.mar, 'Mar Recepción', 'En llamadas se escucha ruido y la voz se corta.', 'Malla inferior con suciedad superficial; estructura íntegra.', null],
    ['00000000-0000-4000-8000-000000001007', 'Azul', receivers.sol, 'Sol Recepción', null, 'Equipo con marcas normales de uso.', null],
    ['00000000-0000-4000-8000-000000001008', null, null, null, 'La falla apareció una vez y no volvió a presentarse.', null, null],
    ['00000000-0000-4000-8000-000000001009', 'Blanco', receivers.mar, 'Mar Recepción', 'Decidió no continuar con la revisión.', 'Cristal y carcasa con desgaste normal.', null],
    ['00000000-0000-4000-8000-000000001010', 'Negro', receivers.sol, 'Sol Recepción', 'Solicitó cambio de módulo por daño previo.', 'Módulo reemplazado; carcasa con marcas de uso.', null],
    ['00000000-0000-4000-8000-000000001011', 'Plata', receivers.mar, 'Mar Recepción', 'El cable se mueve dentro del conector.', 'Esquina inferior con golpe pequeño.', null],
    ['00000000-0000-4000-8000-000000001012', null, null, null, 'El equipo tuvo contacto con agua y después dejó de responder.', 'Humedad visible bajo el cristal; equipo recibido apagado.', 'Se informó que el daño por líquido puede progresar y que no es posible anticipar el alcance interno.'],
    ['00000000-0000-4000-8000-000000001013', 'Gris', receivers.sol, 'Sol Recepción', 'Pierde señal móvil en distintos lugares.', 'Sin daño físico evidente durante la recepción.', null],
    ['00000000-0000-4000-8000-000000001014', 'Negro', receivers.mar, 'Mar Recepción', 'La pantalla se fracturó por una caída.', 'Cristal frontal fracturado en múltiples zonas.', 'Se informó que el cristal puede desprender fragmentos durante la manipulación.'],
    ['00000000-0000-4000-8000-000000001015', 'Azul', receivers.sol, 'Sol Recepción', 'No reconoce cargadores compatibles.', 'Puerto con desgaste visible; pantalla íntegra.', null],
  ];
  const mapped = rows.map(([repairId, deviceColor, receivedById, receivedByDisplayName, customerNarrative, physicalConditionSummary, documentedRiskSummary]) => Object.freeze({
    repairId,
    tenantId,
    branchId,
    deviceColor,
    receivedById,
    receivedByDisplayName,
    customerNarrative,
    physicalConditionSummary,
    documentedRiskSummary,
    deviceType: null,
    deviceIdentifier: null,
    deviceIdentifierUnavailable: false,
    distinctiveSigns: null,
    simIncluded: null,
    memoryCardIncluded: null,
    otherAccessories: null,
    warrantyReviewRequested: false,
    previousRepairId: null,
    deliveredByName: null,
    estimatedDeliveryAt: null,
    receivedPowerState: null,
    deviceAccessType: null,
    initialBudgetAmountMinor: null,
    newRepairPolicyVersion: 0,
    createdAt: LOCAL_SEED_TIMESTAMP,
  }));
  return Object.freeze([...mapped, PBI039_REPAIR_DETAIL_PARITY_FIXTURE.intake]);
}

export function localRepairProblemClassificationRows() {
  return PBI039_REPAIR_DETAIL_PARITY_FIXTURE.problemClassifications;
}

export function localRepairInterventionRiskRows() {
  return PBI039_REPAIR_DETAIL_PARITY_FIXTURE.interventionRisks;
}

export function localRepairTimelineRows() {
  const tenantId = LOCAL_TENANT_ID;
  const branchId = LOCAL_BRANCH_IDS[0];
  const actors = Object.freeze({
    bruno: '00000000-0000-4000-8000-000000000202',
    mar: '00000000-0000-4000-8000-000000000301',
    sol: '00000000-0000-4000-8000-000000000302',
  });
  const repairIds = Object.freeze({
    oneEntry: '00000000-0000-4000-8000-000000001002',
    rich: '00000000-0000-4000-8000-000000001003',
  });
  const rows = [
    ['00000000-0000-4000-8000-000000002001', repairIds.rich, 'system_event', null, 'Sistema', 'Recepción registrada', 'El ingreso del equipo quedó registrado en la sucursal.', 'local.reception', '2026-08-18T16:40:00.000Z'],
    ['00000000-0000-4000-8000-000000002002', repairIds.rich, 'note', actors.sol, 'Sol Recepción', 'Nota de mostrador', 'La persona solicita que primero se revise el centro de carga y que cualquier hallazgo adicional permanezca documentado antes de continuar.', 'local.operator_note', '2026-08-18T16:52:00.000Z'],
    ['00000000-0000-4000-8000-000000002003', repairIds.rich, 'system_event', null, 'Sistema', 'Asignación técnica registrada', 'La responsabilidad técnica quedó asignada a Bruno Técnico en este escenario sintético.', 'local.assignment_projection', '2026-08-18T17:05:00.000Z'],
    ['00000000-0000-4000-8000-000000002004', repairIds.rich, 'note', actors.bruno, 'Bruno Técnico', 'Observación técnica', 'Se realizó una inspección visual sin desmontaje. El puerto presenta residuos compactados y desgaste visible. El equipo reconoce alimentación sólo al mantener el conector en una posición específica; esta observación describe lo revisado y no constituye todavía un diagnóstico ni una autorización de trabajo.', 'local.operator_note', '2026-08-18T18:10:00.000Z'],
    ['00000000-0000-4000-8000-000000002005', repairIds.rich, 'system_event', null, 'Sistema', 'Situación operativa actualizada', 'La reparación quedó representada como espera de autorización en los datos sintéticos.', 'local.status_projection', '2026-08-18T18:25:00.000Z'],
    ['00000000-0000-4000-8000-000000002006', repairIds.rich, 'note', actors.mar, 'Mar Recepción', null, 'Se dejó constancia de que el cliente recibirá una explicación del alcance antes de cualquier intervención adicional.', 'local.operator_note', '2026-08-18T18:40:00.000Z'],
    ['00000000-0000-4000-8000-000000002007', repairIds.oneEntry, 'system_event', null, 'Sistema', 'Recepción registrada', 'El ingreso del equipo quedó registrado en la sucursal.', 'local.reception', '2026-08-19T09:10:00.000Z', null],
    ['00000000-0000-4000-8000-000000002008', repairIds.oneEntry, 'system_event', actors.mar, 'Operador sintético', 'Diagnóstico iniciado', 'Operador sintético inició el diagnóstico.', 'local.workflow', '2026-08-19T09:25:00.000Z', '00000000-0000-4000-8000-000000007002'],
    ['00000000-0000-4000-8000-000000002009', '00000000-0000-4000-8000-000000001012', 'system_event', actors.mar, 'Operador sintético', 'Diagnóstico iniciado', 'Operador sintético inició el diagnóstico.', 'local.workflow', '2026-08-08T11:20:00.000Z', '00000000-0000-4000-8000-000000007012'],
  ];
  const locationRows = localRepairLocationMovementRows()
    .filter(({ command }) => command === 'move_to_workshop')
    .map((movement) => {
      const suffix = movement.repairId.slice(-3);
      return [
        `00000000-0000-4000-8000-${String(13000 + Number(suffix)).padStart(12, '0')}`,
        movement.repairId,
        'system_event',
        movement.actorId,
        movement.actorDisplayName,
        'Equipo movido',
        `${movement.fromLabel} → ${movement.toLabel}`,
        'local.location',
        movement.occurredAt,
        movement.clientRequestId,
      ];
    });
  const mapped = [...rows, ...locationRows].map(([entryId, repairId, entryType, actorId, actorDisplayName, title, body, source, occurredAt, clientRequestId = null]) => Object.freeze({
    entryId,
    tenantId,
    branchId,
    repairId,
    entryType,
    actorId,
    actorDisplayName,
    title,
    body,
    source,
    clientRequestId,
    occurredAt,
    createdAt: occurredAt,
  }));
  const parityRows = PBI039_REPAIR_DETAIL_PARITY_FIXTURE.timeline.map((entry) => Object.freeze({
    ...entry,
    tenantId,
    branchId,
    repairId: PBI039_REPAIR_DETAIL_PARITY_FIXTURE.repairId,
    createdAt: entry.occurredAt,
  }));
  return Object.freeze([...mapped, ...parityRows]);
}

export function localRepairEvidenceRows() {
  const tenantId = LOCAL_TENANT_ID;
  const branchId = LOCAL_BRANCH_IDS[0];
  const richRepairId = '00000000-0000-4000-8000-000000001003';
  const oneRepairId = '00000000-0000-4000-8000-000000001002';
  const brokenRepairId = '00000000-0000-4000-8000-000000001004';
  const uploaderId = '00000000-0000-4000-8000-000000000302';
  const captions = [
    'Ilustración sintética del frente del equipo al recibirlo.',
    'Ilustración sintética de la parte posterior del equipo.',
    'Ilustración sintética del estado de la pantalla.',
    'Ilustración sintética del puerto de carga observado.',
    'Ilustración sintética de marcas visibles en la carcasa.',
    'Ilustración sintética general del equipo recibido.',
  ];
  const rows = LOCAL_EVIDENCE_FIXTURES.slice(0, 6).map((fixture, index) => Object.freeze({
    attachmentId: fixture.id,
    tenantId,
    branchId,
    repairId: index < 5 ? richRepairId : oneRepairId,
    kind: 'photo',
    category: index < 3 || index === 5 ? 'intake' : 'general',
    storageKey: fixture.storageKey,
    mimeType: 'image/png',
    sizeBytes: fixture.sizeBytes,
    width: fixture.width,
    height: fixture.height,
    caption: captions[index],
    capturedAt: index < 5 ? `2026-08-18T16:${String(41 + index).padStart(2, '0')}:00.000Z` : null,
    uploadedAt: index < 5 ? `2026-08-18T16:${String(46 + index).padStart(2, '0')}:00.000Z` : '2026-08-19T09:12:00.000Z',
    uploadedById: uploaderId,
    uploadedByDisplayName: 'Sol Recepción',
  }));
  rows.push(Object.freeze({
    attachmentId: '00000000-0000-4000-8000-000000003007',
    tenantId,
    branchId,
    repairId: brokenRepairId,
    kind: 'photo',
    category: 'general',
    storageKey: '00000000-0000-4000-8000-000000003007.png',
    mimeType: 'image/png',
    sizeBytes: 1024,
    width: 640,
    height: 420,
    caption: 'Ilustración sintética configurada para probar un archivo no disponible.',
    capturedAt: null,
    uploadedAt: '2026-08-18T14:18:00.000Z',
    uploadedById: uploaderId,
    uploadedByDisplayName: 'Sol Recepción',
  }));
  rows.push(...PBI039_REPAIR_DETAIL_PARITY_FIXTURE.evidence.map((evidence) => Object.freeze({
    ...evidence,
    tenantId,
    branchId,
    repairId: PBI039_REPAIR_DETAIL_PARITY_FIXTURE.repairId,
    kind: 'photo',
    mimeType: 'image/png',
    sizeBytes: LOCAL_EVIDENCE_FIXTURES.find((fixture) => fixture.storageKey === evidence.storageKey)?.sizeBytes,
    width: 640,
    height: 420,
    uploadedById: uploaderId,
    uploadedByDisplayName: 'Sol Recepción',
  })));
  return Object.freeze(rows);
}
