const databaseTypes = [
  'export interface TenantTable { readonly tenant_id: string; readonly created_at: Date; }',
  'export interface BranchTable { readonly tenant_id: string; readonly branch_id: string; readonly created_at: Date; }',
  'export interface StationTable { readonly tenant_id: string; readonly station_id: string; }',
  'export interface StationBindingTable { readonly tenant_id: string; readonly station_id: string; readonly branch_id: string; }',
  'export interface StationCredentialTable { readonly credential_id: string; readonly credential_hash: string; }',
  'export interface CustomerTable { readonly customer_id: string; readonly tenant_id: string; readonly branch_id: string; }',
  'export interface CustomerContactPhoneTable { readonly customer_contact_phone_id: string; readonly customer_id: string; }',
  'export interface DatabaseSchema {',
  '  readonly tenants: TenantTable;',
  '  readonly branches: BranchTable;',
  '  readonly stations: StationTable;',
  '  readonly station_bindings: StationBindingTable;',
  '  readonly station_credentials: StationCredentialTable;',
  '}',
  'export type TenantRow = TenantTable;',
  'export type NewTenant = TenantTable;',
  'export type TenantUpdate = Partial<TenantTable>;',
  'export type BranchRow = BranchTable;',
  'export type NewBranch = BranchTable;',
  'export type BranchUpdate = Partial<BranchTable>;',
  'export type StationRow = StationTable;',
  'export type NewStation = StationTable;',
  'export type StationBindingRow = StationBindingTable;',
  'export type NewStationBinding = StationBindingTable;',
  'export type StationCredentialRow = StationCredentialTable;',
  'export type NewStationCredential = StationCredentialTable;',
  'export type CustomerRow = CustomerTable;',
  'export type NewCustomer = CustomerTable;',
  'export type CustomerContactPhoneRow = CustomerContactPhoneTable;',
  'export type NewCustomerContactPhone = CustomerContactPhoneTable;',
  '',
].join('\n');

const initialSchemaMigrationPath =
  'src/infrastructure/database/migrations/20260725183832_database_create_tenants_and_branches.ts';

const initialSchemaMigration = [
  "import type { Kysely } from 'kysely';",
  "import type { DatabaseSchema } from '../database-types.js';",
  'export async function up(database: Kysely<DatabaseSchema>): Promise<void> {',
  "  await database.schema.createTable('tenants')",
  "    .addColumn('tenant_id', 'uuid', (column) => column.notNull())",
  "    .addColumn('created_at', 'timestamptz', (column) => column.notNull())",
  "    .addPrimaryKeyConstraint('tenants_pk', ['tenant_id']).execute();",
  "  await database.schema.createTable('branches')",
  "    .addColumn('tenant_id', 'uuid', (column) => column.notNull())",
  "    .addColumn('branch_id', 'uuid', (column) => column.notNull())",
  "    .addColumn('created_at', 'timestamptz', (column) => column.notNull())",
  "    .addPrimaryKeyConstraint('branches_pk', ['tenant_id', 'branch_id'])",
  "    .addForeignKeyConstraint('branches_tenant_fk', ['tenant_id'], 'tenants', ['tenant_id'],",
  "      (constraint) => constraint.onUpdate('restrict').onDelete('restrict')).execute();",
  '}',
  'export async function down(database: Kysely<DatabaseSchema>): Promise<void> {',
  "  await database.schema.dropTable('branches').execute();",
  "  await database.schema.dropTable('tenants').execute();",
  '}',
  '',
].join('\n');

const databaseConfig = [
  'export interface DatabaseConfig { readonly host: string; }',
  'export class DatabaseConfigError extends Error {}',
  'export function parseDatabaseConfig(): DatabaseConfig {',
  "  return Object.freeze({ host: 'synthetic' });",
  '}',
  'export function sanitizeDatabaseConfig(): unknown {',
  '  return Object.freeze({ host: "<configured>" });',
  '}',
  '',
].join('\n');

const databaseConnection = [
  "import type { PoolClient } from 'pg';",
  "import type { DatabaseConfig } from './database-config.js';",
  "import { databaseTransactionCapability } from './database-transaction-capability.js';",
  "import type { InternalDatabaseTransactionConnection, InternalDatabaseTransactionOperation, InternalDatabaseTransactionSettings } from './database-transaction-capability.js';",
  'export interface DatabaseConnection {',
  '  readonly state: string;',
  '}',
  'export class DatabaseConnectionError extends Error {}',
  'class Connection implements DatabaseConnection, InternalDatabaseTransactionConnection {',
  "  readonly state = 'ready';",
  '  async [databaseTransactionCapability]<T>(settings: InternalDatabaseTransactionSettings, operation: InternalDatabaseTransactionOperation<T>): Promise<T> {',
  '    void settings;',
  '    void operation;',
  "    throw new Error('synthetic');",
  '  }',
  '}',
  'async function runConnectionVerification(client: PoolClient): Promise<void> {',
  "  await client.query('select 1');",
  '}',
  'export function createDatabaseConnection(config: DatabaseConfig): DatabaseConnection {',
  '  void config;',
  '  void runConnectionVerification;',
  '  return new Connection();',
  '}',
  'export function sanitizeDatabaseConnectionState(connection: DatabaseConnection): unknown {',
  '  return Object.freeze({ state: connection.state });',
  '}',
  '',
].join('\n');

const databaseTransactionCapabilitySource = [
  "import type { Transaction } from 'kysely';",
  'type EmptyDatabaseSchema = Record<never, never>;',
  "export type InternalDatabaseTransactionSettings = Readonly<{ isolationLevel: 'read committed'; accessMode: 'read only' | 'read write' }>;",
  'export type InternalDatabaseTransactionExecutor = Transaction<EmptyDatabaseSchema>;',
  'export type InternalDatabaseTransactionOperation<T> = (executor: InternalDatabaseTransactionExecutor) => Promise<T>;',
  "export const databaseTransactionCapability: unique symbol = Symbol('synthetic');",
  "export class DatabaseTransactionCapabilityError extends Error { readonly code = 'NESTED_FORBIDDEN'; }",
  'export interface InternalDatabaseTransactionConnection {',
  '  readonly state: string;',
  '  [databaseTransactionCapability]<T>(settings: InternalDatabaseTransactionSettings, operation: InternalDatabaseTransactionOperation<T>): Promise<T>;',
  '}',
  'export function bindDatabaseTransactionContext(): void {}',
  'export function releaseDatabaseTransactionContext(): void {}',
  'export async function useDatabaseTransactionExecutor<T>(context: object, operation: InternalDatabaseTransactionOperation<T>): Promise<T> {',
  '  void context;',
  '  void operation;',
  "  throw new Error('synthetic');",
  '}',
  '',
].join('\n');

const transactionRunner = [
  "import type { DatabaseConnection } from './database-connection.js';",
  "import { databaseTransactionCapability } from './database-transaction-capability.js';",
  "export type DatabaseTransactionOptions = Readonly<{ isolationLevel?: 'read committed'; readOnly?: boolean }>;",
  "export type DatabaseTransactionContext = Readonly<{ attempt: 1; isolationLevel: 'read committed'; readOnly: boolean }>;",
  'export class DatabaseTransactionError extends Error {}',
  'export async function runInTransaction<T>(connection: DatabaseConnection, options: DatabaseTransactionOptions, callback: (context: DatabaseTransactionContext) => T | Promise<T>): Promise<T> {',
  '  void connection;',
  '  void options;',
  '  void callback;',
  '  void databaseTransactionCapability;',
  "  throw new DatabaseTransactionError('synthetic');",
  '}',
  '',
].join('\n');

const databaseMigrationCapabilitySource = [
  "import type { Kysely } from 'kysely';",
  'export type InternalDatabaseMigrationExecutor = Kysely<Record<string, Record<string, unknown>>>;',
  'export type InternalDatabaseMigrationOperation<T> = (executor: InternalDatabaseMigrationExecutor) => Promise<T>;',
  "export type InternalDatabaseMigrationRuntime = Readonly<{ environment: 'development'; role: 'migration'; accessMode: 'read-write'; migrationsEnabled: true }>;",
  "export const databaseMigrationCapability: unique symbol = Symbol('synthetic-migration');",
  "export const databaseMigrationRuntime: unique symbol = Symbol('synthetic-runtime');",
  "export class DatabaseMigrationCapabilityError extends Error { readonly code = 'OVERLAP_FORBIDDEN'; }",
  'export interface InternalDatabaseMigrationConnection {',
  '  readonly state: string;',
  '  [databaseMigrationRuntime](): InternalDatabaseMigrationRuntime;',
  '  [databaseMigrationCapability]<T>(operation: InternalDatabaseMigrationOperation<T>): Promise<T>;',
  '}',
  '',
].join('\n');

const databaseMigrationProviderSource = [
  "import { FileMigrationProvider } from 'kysely/migration';",
  "export type InternalMigrationSource = Readonly<{ root: string; authorizedRoot: string; normalizedRoot: string; mode: 'compiled' }>;",
  'export type InternalMigrationManifestItem = Readonly<{ fileName: string }>;',
  'export type InternalMigrationManifest = Readonly<{ migrations: readonly InternalMigrationManifestItem[] }>;',
  'export type InternalMigrationInspection = Readonly<{ source: InternalMigrationSource; manifest: InternalMigrationManifest }>;',
  "export const databaseMigrationSourceOverride: unique symbol = Symbol('synthetic-source');",
  "export class InternalMigrationProviderError extends Error { readonly code = 'PROVIDER_FAILED'; }",
  'export async function inspectMigrationSource(source: InternalMigrationSource): Promise<InternalMigrationInspection> {',
  '  return { source, manifest: { migrations: [] } };',
  '}',
  'export function createGovernedFileMigrationProvider(): FileMigrationProvider {',
  "  return new FileMigrationProvider({ fs: { readdir: async () => [] }, migrationFolder: '.', path: { join: (...parts) => parts.join('/') } });",
  '}',
  '',
].join('\n');

const migrationRunner = [
  "import type { DatabaseConnection } from './database-connection.js';",
  "import { databaseMigrationCapability } from './database-migration-capability.js';",
  "import { inspectMigrationSource } from './database-migration-provider.js';",
  'export type DatabaseMigrationRunnerOptions = Readonly<{ lockTimeoutMs?: number }>;',
  "export type DatabaseMigrationDownAuthorization = Readonly<{ confirmation: 'REVERT_ONE_MIGRATION' }>;",
  "export type DatabaseMigrationStatusItem = Readonly<{ state: 'pending' }>;",
  'export type DatabaseMigrationStatus = Readonly<{ migrations: readonly DatabaseMigrationStatusItem[] }>;',
  "export type DatabaseMigrationExecution = Readonly<{ operation: 'up' }>;",
  'export interface DatabaseMigrationRunner { getMigrationStatus(): Promise<DatabaseMigrationStatus>; }',
  'export class DatabaseMigrationError extends Error {}',
  'export function createMigrationRunner(connection: DatabaseConnection): DatabaseMigrationRunner {',
  '  void connection;',
  '  void databaseMigrationCapability;',
  '  void inspectMigrationSource;',
  "  throw new DatabaseMigrationError('synthetic');",
  '}',
  '',
].join('\n');

const migrationEntrypoint =
  "import { createMigrationRunner } from './infrastructure/database/migration-runner.js';\nvoid createMigrationRunner;\n";

const tenantPort = [
  'export interface TenantPersistenceScope { readonly tenantId: string; }',
  'export interface TenantRepositoryPort {',
  '  find(scope: TenantPersistenceScope, tenantId: string): Promise<unknown>;',
  '  save(scope: TenantPersistenceScope, value: unknown): Promise<void>;',
  '}',
  '',
].join('\n');

const tenantAdapter = [
  "import type { Kysely } from 'kysely';",
  "import type { DatabaseSchema } from '../../../../infrastructure/database/database-types.js';",
  "import type { TenantPersistenceScope, TenantRepositoryPort } from '../../application/ports/tenant-repository.port.js';",
  'export class KyselyTenantRepository implements TenantRepositoryPort {',
  '  constructor(private readonly database: Kysely<DatabaseSchema>) {}',
  '  async find(scope: TenantPersistenceScope, tenantId: string): Promise<unknown> {',
  "    return this.database.selectFrom('tenants').selectAll().where('tenantId', '=', scope.tenantId).where('tenantId', '=', tenantId).executeTakeFirst();",
  '  }',
  '  async save(scope: TenantPersistenceScope, value: unknown): Promise<void> {',
  '    void scope;',
  '    void value;',
  '  }',
  '}',
  '',
].join('\n');

const tenancyComposition = [
  "import { Module } from '@nestjs/common';",
  "import { createDatabaseConnection } from '../../infrastructure/database/database-connection.js';",
  "import { KyselyTenantRepository } from './infrastructure/persistence/kysely-tenant.repository.js';",
  'void createDatabaseConnection;',
  '@Module({ providers: [KyselyTenantRepository] })',
  'export class TenancyModule {}',
  '',
].join('\n');

export const persistenceBaseFiles = {
  'src/infrastructure/database/database-config.ts': databaseConfig,
  'src/infrastructure/database/database-connection.ts': databaseConnection,
  'src/infrastructure/database/database-transaction-capability.ts':
    databaseTransactionCapabilitySource,
  'src/infrastructure/database/database-types.ts': databaseTypes,
  'src/infrastructure/database/transaction-runner.ts': transactionRunner,
  'src/modules/tenancy/application/ports/tenant-repository.port.ts': tenantPort,
  'src/modules/tenancy/infrastructure/persistence/kysely-tenant.repository.ts':
    tenantAdapter,
  'src/modules/tenancy/tenancy.module.ts': tenancyComposition,
};

function based(files = {}) {
  return { ...persistenceBaseFiles, ...files };
}

function portWithDriver(importLine, driverType) {
  return [
    importLine,
    'export interface TenantPersistenceScope { readonly tenantId: string; }',
    'export interface TenantRepositoryPort {',
    `  find(scope: TenantPersistenceScope, handle: ${driverType}): Promise<unknown>;`,
    '}',
    '',
  ].join('\n');
}

export const persistenceFixtureCases = [
  {
    name: 'D5-R050 permits the exact initial tenant schema',
    expectedRules: [],
    files: based({
      [initialSchemaMigrationPath]: initialSchemaMigration,
    }),
    coverage: {
      ids: ['fixture:D5-R050:initial-schema-control:positive'],
      evidence: ["createTable('tenants')", "createTable('branches')"],
    },
  },
  {
    name: 'D5-R050 rejects an extra table in the initial schema',
    expectedRules: ['D5-R050'],
    expectedPath: initialSchemaMigrationPath,
    files: based({
      [initialSchemaMigrationPath]: initialSchemaMigration.replace(
        'export async function down',
        "  await database.schema.createTable('users').addColumn('user_id', 'uuid', (column) => column.notNull()).execute();\n}\nexport async function down",
      ).replace('\n}\n  await database.schema.createTable', '\n  await database.schema.createTable'),
    }),
    coverage: {
      ids: ['fixture:D5-R050:initial-schema-tables'],
      evidence: ["createTable('users')"],
    },
  },
  {
    name: 'D5-R051 rejects a non-restrictive branch tenant foreign key',
    expectedRules: ['D5-R051'],
    expectedPath: initialSchemaMigrationPath,
    files: based({
      [initialSchemaMigrationPath]: initialSchemaMigration.replace(
        "constraint.onUpdate('restrict').onDelete('restrict')",
        "constraint.onUpdate('restrict').onDelete('cascade')",
      ),
    }),
    coverage: {
      ids: ['fixture:D5-R051:tenant-foreign-key'],
      evidence: ["constraint.onUpdate('restrict').onDelete('cascade')"],
    },
  },
  {
    name: 'D5-R052 rejects an aliased DML capability in the initial migration',
    expectedRules: ['D5-R052'],
    expectedPath: initialSchemaMigrationPath,
    files: based({
      [initialSchemaMigrationPath]: initialSchemaMigration.replace(
        'export async function up(database: Kysely<DatabaseSchema>): Promise<void> {',
        'export async function up(database: Kysely<DatabaseSchema>): Promise<void> {\n  const writeRows = database.insertInto;\n  void writeRows;',
      ),
    }),
    coverage: {
      ids: ['fixture:D5-R052:dml-alias'],
      evidence: ['database.insertInto'],
    },
  },
  {
    name: 'D5-R052 rejects namespace raw SQL in the initial migration',
    expectedRules: ['D5-R052'],
    expectedPath: initialSchemaMigrationPath,
    files: based({
      [initialSchemaMigrationPath]: initialSchemaMigration
        .replace(
          "import type { Kysely } from 'kysely';",
          "import type { Kysely } from 'kysely';\nimport * as Query from 'kysely';",
        )
        .replace(
          'export async function up(database: Kysely<DatabaseSchema>): Promise<void> {',
          "export async function up(database: Kysely<DatabaseSchema>): Promise<void> {\n  void Query.sql.raw('select 1');",
        ),
    }),
    coverage: {
      ids: ['fixture:D5-R052:sql-namespace'],
      evidence: ["Query.sql.raw('select 1')"],
    },
  },
  {
    name: 'D5-R052 permits a shadowed local sql name',
    expectedRules: [],
    files: based({
      [initialSchemaMigrationPath]: initialSchemaMigration.replace(
        'export async function up(database: Kysely<DatabaseSchema>): Promise<void> {',
        "export async function up(database: Kysely<DatabaseSchema>): Promise<void> {\n  const sql = { raw: (value: string): string => value };\n  void sql.raw('not executable SQL');",
      ),
    }),
    coverage: {
      ids: ['fixture:D5-R052:shadowing-control:positive'],
      evidence: ['const sql'],
    },
  },
  {
    name: 'D5-R052 ignores comments and strings',
    expectedRules: [],
    files: based({
      [initialSchemaMigrationPath]: initialSchemaMigration.replace(
        'export async function up(database: Kysely<DatabaseSchema>): Promise<void> {',
        "export async function up(database: Kysely<DatabaseSchema>): Promise<void> {\n  const note = 'insertInto sql`seed`';\n  // database.deleteFrom('tenants')\n  void note;",
      ),
    }),
    coverage: {
      ids: ['fixture:D5-R052:text-control:positive'],
      evidence: ['insertInto sql`seed`'],
    },
  },
  {
    name: 'D5-R053 rejects cascade in initial schema down',
    expectedRules: ['D5-R053'],
    expectedPath: initialSchemaMigrationPath,
    files: based({
      [initialSchemaMigrationPath]: initialSchemaMigration.replace(
        "dropTable('branches').execute()",
        "dropTable('branches').cascade().execute()",
      ),
    }),
    coverage: {
      ids: ['fixture:D5-R053:down-cascade'],
      evidence: ["dropTable('branches').cascade()"],
    },
  },
  {
    name: 'PBI-023 registered tenant persistence topology is allowed',
    expectedRules: [],
    files: based(),
    coverage: {
      ids: ['fixture:persistence-boundaries:registered-topology:positive'],
      evidence: ['KyselyTenantRepository implements TenantRepositoryPort'],
    },
  },
  {
    name: 'PBI-023 comments strings homonyms and wrong packages are ignored',
    expectedRules: [],
    files: {
      'src/modules/access/application/persistence-words.ts': [
        "import { sql as otherSql } from '@example/not-kysely';",
        "const message = 'SELECT * FROM tenants; import Kysely from kysely';",
        '// client.query(\"DELETE FROM tenants\")',
        'function inspect(sql: (value: string) => string): string {',
        "  return sql('database pool GenericRepository');",
        '}',
        'export const harmless = [otherSql, message, inspect] as const;',
        '',
      ].join('\n'),
    },
  },
  {
    name: 'D5-R037 rejects direct persistence dependency import',
    expectedRules: ['D5-R037'],
    expectedPath: 'src/modules/access/application/direct-db.ts',
    files: {
      'src/modules/access/application/direct-db.ts':
        "import { Kysely } from 'kysely';\nexport type Handle = Kysely<unknown>;\n",
    },
    coverage: {
      ids: ['fixture:D5-R037:direct-import'],
      evidence: ["from 'kysely'"],
    },
  },
  {
    name: 'D5-R037 rejects aliased type-only persistence import',
    expectedRules: ['D5-R037'],
    expectedPath: 'src/modules/access/application/alias-db.ts',
    files: {
      'src/modules/access/application/alias-db.ts':
        "import type { Kysely as Builder } from 'kysely';\nexport type Handle = Builder<unknown>;\n",
    },
  },
  {
    name: 'D5-R037 rejects namespace persistence import',
    expectedRules: ['D5-R037'],
    expectedPath: 'src/modules/access/application/namespace-db.ts',
    files: {
      'src/modules/access/application/namespace-db.ts':
        "import * as Driver from 'pg';\nexport type Handle = Driver.PoolClient;\n",
    },
  },
  {
    name: 'D5-R037 rejects require persistence import',
    expectedRules: ['D5-R037'],
    expectedPath: 'src/modules/access/application/require-db.ts',
    files: {
      'src/modules/access/application/require-db.ts':
        "const Driver = require('pg');\nexport const handle = Driver;\n",
    },
  },
  {
    name: 'D5-R037 rejects import-equals persistence import',
    expectedRules: ['D5-R037'],
    expectedPath: 'src/modules/access/application/import-equals-db.ts',
    files: {
      'src/modules/access/application/import-equals-db.ts':
        "import Driver = require('pg');\nexport type Handle = Driver.PoolClient;\n",
    },
  },
  {
    name: 'D5-R037 rejects dynamic persistence import',
    expectedRules: ['D5-R037'],
    expectedPath: 'src/modules/access/application/dynamic-db.ts',
    files: {
      'src/modules/access/application/dynamic-db.ts':
        "export const load = () => import('kysely');\n",
    },
  },
  {
    name: 'D5-R037 rejects persistence re-export',
    expectedRules: ['D5-R037'],
    expectedPath: 'src/modules/access/application/reexport-db.ts',
    files: {
      'src/modules/access/application/reexport-db.ts':
        "export type { Kysely as Handle } from 'kysely';\n",
    },
  },
  {
    name: 'D5-R038 rejects exported global database surface',
    expectedRules: ['D5-R038'],
    expectedPath: 'src/infrastructure/database/database-connection.ts',
    files: based({
      'src/infrastructure/database/database-connection.ts':
        `${databaseConnection}\nexport const db = createDatabaseConnection;\n`,
    }),
    coverage: {
      ids: ['fixture:D5-R038:global-export'],
      evidence: ['export const db'],
    },
  },
  {
    name: 'D5-R039 rejects renamed generic repository capability',
    expectedRules: ['D5-R039'],
    expectedPath: 'src/modules/access/application/ledger.ts',
    files: {
      'src/modules/access/application/ledger.ts': [
        'export interface Ledger<T> {',
        '  find(id: string): Promise<T | undefined>;',
        '  save(value: T): Promise<void>;',
        '}',
        '',
      ].join('\n'),
    },
    coverage: {
      ids: ['fixture:D5-R039:renamed-generic'],
      evidence: ['interface Ledger<T>'],
    },
  },
  {
    name: 'D5-R040 rejects application import of central DB infrastructure',
    expectedRules: ['D5-R040'],
    expectedPath: 'src/modules/access/application/db-handler.ts',
    files: based({
      'src/modules/access/application/db-handler.ts':
        "import { createDatabaseConnection } from '../../../infrastructure/database/database-connection.js';\nexport const handler = createDatabaseConnection;\n",
    }),
    coverage: {
      ids: ['fixture:D5-R040:relative-db-import'],
      evidence: ['../../../infrastructure/database/database-connection.js'],
    },
  },
  {
    name: 'D5-R041 rejects an unregistered persistence adapter',
    expectedRules: ['D5-R041'],
    expectedPath:
      'src/modules/tenancy/infrastructure/persistence/kysely-shadow.repository.ts',
    files: {
      'src/modules/tenancy/infrastructure/persistence/kysely-shadow.repository.ts':
        "import type { Kysely } from 'kysely';\nexport interface Shadow { readonly db: Kysely<unknown>; }\n",
    },
    coverage: {
      ids: ['fixture:D5-R041:unregistered-adapter'],
      evidence: ['export interface Shadow'],
    },
  },
  {
    name: 'D5-R042 rejects a dispersed module migration',
    expectedRules: ['D5-R042'],
    expectedPath: 'src/modules/tenancy/migrations/20260724010000_tenancy_seed.ts',
    files: {
      'src/modules/tenancy/migrations/20260724010000_tenancy_seed.ts':
        'export const migration = true;\n',
    },
    coverage: {
      ids: ['fixture:D5-R042:dispersed-migration'],
      evidence: ['export const migration'],
    },
  },
  {
    name: 'D5-R043 rejects an aliased driver type in a port',
    expectedRules: ['D5-R043'],
    expectedPath:
      'src/modules/tenancy/application/ports/tenant-repository.port.ts',
    files: based({
      'src/modules/tenancy/application/ports/tenant-repository.port.ts':
        portWithDriver(
          "import type { Kysely as DriverHandle } from 'kysely';",
          'DriverHandle<unknown>',
        ),
    }),
    coverage: {
      ids: ['fixture:D5-R043:aliased-type-leak'],
      evidence: ['Kysely as DriverHandle'],
    },
  },
  {
    name: 'D5-R043 rejects a namespace qualified driver type in a port',
    expectedRules: ['D5-R043'],
    expectedPath:
      'src/modules/tenancy/application/ports/tenant-repository.port.ts',
    files: based({
      'src/modules/tenancy/application/ports/tenant-repository.port.ts':
        portWithDriver(
          "import type * as Driver from 'pg';",
          'Driver.PoolClient',
        ),
    }),
  },
  {
    name: 'D5-R043 rejects a driver type re-export from a port',
    expectedRules: ['D5-R043'],
    expectedPath:
      'src/modules/tenancy/application/ports/tenant-repository.port.ts',
    files: based({
      'src/modules/tenancy/application/ports/tenant-repository.port.ts': [
        "export type { PoolClient as TenantHandle } from 'pg';",
        'export interface TenantPersistenceScope { readonly tenantId: string; }',
        'export interface TenantRepositoryPort {',
        '  find(scope: TenantPersistenceScope): Promise<unknown>;',
        '}',
        '',
      ].join('\n'),
    }),
  },
  {
    name: 'D5-R044 rejects a repository method without structural tenant scope',
    expectedRules: ['D5-R044'],
    expectedPath:
      'src/modules/tenancy/application/ports/tenant-repository.port.ts',
    files: based({
      'src/modules/tenancy/application/ports/tenant-repository.port.ts': [
        'export type TenantPersistenceScope = string;',
        'export interface TenantRepositoryPort {',
        '  find(scope: TenantPersistenceScope): Promise<unknown>;',
        '}',
        '',
      ].join('\n'),
    }),
    coverage: {
      ids: ['fixture:D5-R044:missing-structural-scope'],
      evidence: ['type TenantPersistenceScope = string'],
    },
  },
  {
    name: 'D5-R044 rejects optional nullable and defaulted tenant scope',
    expectedRules: ['D5-R044'],
    expectedPath:
      'src/modules/tenancy/application/ports/tenant-repository.port.ts',
    files: based({
      'src/modules/tenancy/application/ports/tenant-repository.port.ts': [
        'export interface TenantPersistenceScope { readonly tenantId: string; }',
        'export abstract class TenantRepositoryPort {',
        '  abstract optional(scope?: TenantPersistenceScope): Promise<void>;',
        '  abstract nullable(scope: TenantPersistenceScope | null): Promise<void>;',
        '  defaulted(scope: TenantPersistenceScope = { tenantId: "" }): Promise<void> { void scope; return Promise.resolve(); }',
        '}',
        '',
      ].join('\n'),
    }),
  },
  {
    name: 'D5-R045 rejects unregistered DB infrastructure',
    expectedRules: ['D5-R045'],
    expectedPath: 'src/infrastructure/database/hidden-runner.ts',
    files: {
      'src/infrastructure/database/hidden-runner.ts':
        'export function hiddenRunner(): void {}\n',
    },
    coverage: {
      ids: ['fixture:D5-R045:unregistered-infrastructure'],
      evidence: ['function hiddenRunner'],
    },
  },
  {
    name: 'D5-R046 rejects a changed connection verification probe',
    expectedRules: ['D5-R046'],
    expectedPath: 'src/infrastructure/database/database-connection.ts',
    files: based({
      'src/infrastructure/database/database-connection.ts':
        databaseConnection.replace("client.query('select 1')", "client.query('select 2')"),
    }),
    coverage: {
      ids: ['fixture:D5-R046:connection-probe-boundary'],
      evidence: ["client.query('select 2')"],
    },
  },
  {
    name: 'D5-R046 rejects aliased sql tagged template outside migration',
    expectedRules: ['D5-R046'],
    expectedPath:
      'src/modules/tenancy/infrastructure/persistence/kysely-tenant.repository.ts',
    files: based({
      'src/modules/tenancy/infrastructure/persistence/kysely-tenant.repository.ts':
        `${tenantAdapter}\nimport { sql as statement } from 'kysely';\nexport const rawStatement = statement\`select 1\`;\n`,
    }),
    coverage: {
      ids: ['fixture:D5-R046:aliased-sql-tag'],
      evidence: ['statement`select 1`'],
    },
  },
  {
    name: 'D5-R046 rejects namespace sql raw call outside migration',
    expectedRules: ['D5-R046'],
    expectedPath:
      'src/modules/tenancy/infrastructure/persistence/kysely-tenant.repository.ts',
    files: based({
      'src/modules/tenancy/infrastructure/persistence/kysely-tenant.repository.ts':
        `${tenantAdapter}\nimport * as Query from 'kysely';\nexport const rawStatement = Query.sql.raw('select 1');\n`,
    }),
  },
  {
    name: 'D5-R046 ignores a shadowed sql import and local client query',
    expectedRules: [],
    files: based({
      'src/modules/tenancy/infrastructure/persistence/kysely-tenant.repository.ts':
        `${tenantAdapter}\nimport { sql } from 'kysely';\nimport type { PoolClient } from 'pg';\nfunction local(sql: (parts: TemplateStringsArray) => unknown, client: { query(value: string): unknown }): unknown { client.query('select 1'); return sql\`select 1\`; }\nfunction outer(client: PoolClient): unknown { function inner(client: { query(value: string): unknown }): unknown { return client.query('select 1'); } return inner({ query: (value) => value }); }\nvoid local;\nvoid outer;\n`,
    }),
  },
  {
    name: 'D5-R047 rejects cross-owner database object access',
    expectedRules: ['D5-R047'],
    expectedPath:
      'src/modules/tenancy/infrastructure/persistence/kysely-tenant.repository.ts',
    files: based({
      'src/modules/tenancy/infrastructure/persistence/kysely-tenant.repository.ts':
        tenantAdapter.replace("selectFrom('tenants')", "selectFrom('branches')"),
    }),
    coverage: {
      ids: ['fixture:D5-R047:cross-owner-object'],
      evidence: ["selectFrom('branches')"],
    },
  },
  {
    name: 'D5-R047 rejects dynamic or unknown database objects fail-closed',
    expectedRules: ['D5-R047'],
    expectedPath:
      'src/modules/tenancy/infrastructure/persistence/kysely-tenant.repository.ts',
    files: based({
      'src/modules/tenancy/infrastructure/persistence/kysely-tenant.repository.ts':
        tenantAdapter.replace("selectFrom('tenants')", 'selectFrom(tenantId)'),
    }),
  },
  {
    name: 'D5-R048 rejects implicit async transaction context',
    expectedRules: ['D5-R048'],
    expectedPath: 'src/infrastructure/database/transaction-runner.ts',
    files: based({
      'src/infrastructure/database/transaction-runner.ts':
        `${transactionRunner}\nimport { AsyncLocalStorage } from 'node:async_hooks';\nvoid AsyncLocalStorage;\n`,
    }),
    coverage: {
      ids: ['fixture:D5-R048:async-context-import'],
      evidence: ["from 'node:async_hooks'"],
    },
  },
  {
    name: 'D5-R048 rejects aliased implicit async transaction context',
    expectedRules: ['D5-R048'],
    expectedPath: 'src/infrastructure/database/transaction-runner.ts',
    files: based({
      'src/infrastructure/database/transaction-runner.ts':
        `${transactionRunner}\nimport { AsyncLocalStorage as Scope } from 'node:async_hooks';\nvoid Scope;\n`,
    }),
  },
  {
    name: 'D5-R048 rejects namespace implicit async transaction context',
    expectedRules: ['D5-R048'],
    expectedPath: 'src/infrastructure/database/transaction-runner.ts',
    files: based({
      'src/infrastructure/database/transaction-runner.ts':
        `${transactionRunner}\nimport * as AsyncHooks from 'node:async_hooks';\nvoid AsyncHooks;\n`,
    }),
  },
  {
    name: 'D5-R048 rejects type re-export and dynamic async context imports',
    expectedRules: ['D5-R045', 'D5-R048'],
    expectedPath: 'src/infrastructure/database/transaction-runner.ts',
    files: based({
      'src/infrastructure/database/transaction-runner.ts':
        `${transactionRunner}\nexport type { AsyncLocalStorage as Scope } from 'node:async_hooks';\nvoid import('async_hooks');\n`,
    }),
  },
  {
    name: 'D5-R048 permits a shadowed local AsyncLocalStorage name',
    expectedRules: [],
    files: based({
      'src/infrastructure/database/transaction-runner.ts':
        `${transactionRunner}\nclass AsyncLocalStorage {}\nvoid AsyncLocalStorage;\n`,
    }),
    coverage: {
      ids: ['fixture:D5-R048:shadowing-control:positive'],
      evidence: ['class AsyncLocalStorage'],
    },
  },
  {
    name: 'D5-R048 rejects controller access to transaction runner',
    expectedRules: ['D5-R011', 'D5-R035', 'D5-R048'],
    expectedPath: 'src/modules/access/presentation/transaction.controller.ts',
    files: based({
      'src/modules/access/presentation/transaction.controller.ts':
        "import { runInTransaction } from '../../../infrastructure/database/transaction-runner.js';\nexport const handler = runInTransaction;\n",
    }),
  },
  {
    name: 'D5-R048 rejects owner-internal capability deep import',
    expectedRules: ['D5-R011', 'D5-R048'],
    expectedPath: 'src/modules/access/presentation/transaction-helper.ts',
    files: based({
      'src/modules/access/presentation/transaction-helper.ts':
        "import { useDatabaseTransactionExecutor } from '../../../infrastructure/database/database-transaction-capability.js';\nexport const helper = useDatabaseTransactionExecutor;\n",
    }),
  },
  {
    name: 'D5-R048 rejects manual transaction control in database infrastructure',
    expectedRules: ['D5-R048'],
    expectedPath: 'src/infrastructure/database/transaction-runner.ts',
    files: based({
      'src/infrastructure/database/transaction-runner.ts':
        `${transactionRunner}\nfunction manual(value: { startTransaction(): void }): void { value.startTransaction(); }\nvoid manual;\n`,
    }),
  },
  {
    name: 'D5-R047 rejects an unregistered owner-named migration with semantic raw SQL',
    expectedRules: ['D5-R047'],
    expectedPath:
      'src/infrastructure/database/migrations/20260724010101_tenancy_create_tenants.ts',
    files: {
      'src/infrastructure/database/migrations/20260724010101_tenancy_create_tenants.ts':
        "import { sql } from 'kysely';\nexport const up = () => sql`create table tenants (tenant_id text)`;\n",
    },
  },
  {
    name: 'D5-R049 rejects an unauthorized migration provider consumer',
    expectedRules: ['D5-R011', 'D5-R049'],
    expectedPath: 'src/modules/access/presentation/migration-helper.ts',
    files: based({
      'src/infrastructure/database/database-migration-capability.ts':
        databaseMigrationCapabilitySource,
      'src/infrastructure/database/database-migration-provider.ts':
        databaseMigrationProviderSource,
      'src/infrastructure/database/migration-runner.ts': migrationRunner,
      'src/db-migrate.ts': migrationEntrypoint,
      'src/modules/access/presentation/migration-helper.ts':
        "import { inspectMigrationSource } from '../../../infrastructure/database/database-migration-provider.js';\nexport const helper = inspectMigrationSource;\n",
    }),
  },
  {
    name: 'D5-R049 rejects migration runner import from startup',
    expectedRules: ['D5-R049'],
    expectedPath: 'src/main.ts',
    files: based({
      'src/infrastructure/database/database-migration-capability.ts':
        databaseMigrationCapabilitySource,
      'src/infrastructure/database/database-migration-provider.ts':
        databaseMigrationProviderSource,
      'src/infrastructure/database/migration-runner.ts': migrationRunner,
      'src/db-migrate.ts': migrationEntrypoint,
      'src/main.ts':
        "import { createMigrationRunner } from './infrastructure/database/migration-runner.js';\nvoid createMigrationRunner;\n",
    }),
    coverage: {
      ids: ['fixture:D5-R049:migration-provider-consumer'],
      evidence: ['createMigrationRunner'],
    },
  },
  {
    name: 'D5-R049 rejects aliased migration runner import from application',
    expectedRules: ['D5-R040', 'D5-R049'],
    expectedPath: 'src/modules/access/application/migration-use-case.ts',
    files: based({
      'src/infrastructure/database/database-migration-capability.ts':
        databaseMigrationCapabilitySource,
      'src/infrastructure/database/database-migration-provider.ts':
        databaseMigrationProviderSource,
      'src/infrastructure/database/migration-runner.ts': migrationRunner,
      'src/db-migrate.ts': migrationEntrypoint,
      'src/modules/access/application/migration-use-case.ts':
        "import { createMigrationRunner as createAdministrativeRunner } from '../../../infrastructure/database/migration-runner.js';\nexport const useCase = createAdministrativeRunner;\n",
    }),
  },
  {
    name: 'D5-R049 rejects namespace migration runner import from controller',
    expectedRules: ['D5-R011', 'D5-R035', 'D5-R049'],
    expectedPath: 'src/modules/access/presentation/migration.controller.ts',
    files: based({
      'src/infrastructure/database/database-migration-capability.ts':
        databaseMigrationCapabilitySource,
      'src/infrastructure/database/database-migration-provider.ts':
        databaseMigrationProviderSource,
      'src/infrastructure/database/migration-runner.ts': migrationRunner,
      'src/db-migrate.ts': migrationEntrypoint,
      'src/modules/access/presentation/migration.controller.ts':
        "import * as Migration from '../../../infrastructure/database/migration-runner.js';\nexport const handler = Migration.createMigrationRunner;\n",
    }),
  },
  {
    name: 'D5-R049 rejects migration provider re-export',
    expectedRules: ['D5-R011', 'D5-R049'],
    expectedPath: 'src/modules/access/presentation/migration-export.ts',
    files: based({
      'src/infrastructure/database/database-migration-capability.ts':
        databaseMigrationCapabilitySource,
      'src/infrastructure/database/database-migration-provider.ts':
        databaseMigrationProviderSource,
      'src/infrastructure/database/migration-runner.ts': migrationRunner,
      'src/db-migrate.ts': migrationEntrypoint,
      'src/modules/access/presentation/migration-export.ts':
        "export { inspectMigrationSource as inspect } from '../../../infrastructure/database/database-migration-provider.js';\n",
    }),
  },
  {
    name: 'D5-R049 rejects owner-internal migration type import',
    expectedRules: ['D5-R011', 'D5-R049'],
    expectedPath: 'src/modules/access/presentation/migration-type.ts',
    files: based({
      'src/infrastructure/database/database-migration-capability.ts':
        databaseMigrationCapabilitySource,
      'src/infrastructure/database/database-migration-provider.ts':
        databaseMigrationProviderSource,
      'src/infrastructure/database/migration-runner.ts': migrationRunner,
      'src/db-migrate.ts': migrationEntrypoint,
      'src/modules/access/presentation/migration-type.ts':
        "import type { InternalMigrationManifest } from '../../../infrastructure/database/database-migration-provider.js';\nexport type Manifest = InternalMigrationManifest;\n",
    }),
  },
  {
    name: 'D5-R049 rejects require and dynamic migration facility imports',
    expectedRules: ['D5-R011', 'D5-R049'],
    expectedPath: 'src/modules/access/presentation/migration-dynamic.ts',
    files: based({
      'src/infrastructure/database/database-migration-capability.ts':
        databaseMigrationCapabilitySource,
      'src/infrastructure/database/database-migration-provider.ts':
        databaseMigrationProviderSource,
      'src/infrastructure/database/migration-runner.ts': migrationRunner,
      'src/db-migrate.ts': migrationEntrypoint,
      'src/modules/access/presentation/migration-dynamic.ts':
        "void require('../../../infrastructure/database/database-migration-capability.js');\nvoid import('../../../infrastructure/database/database-migration-provider.js');\n",
    }),
  },
  {
    name: 'D5-R049 permits shadowed local migration names without imports',
    expectedRules: [],
    files: based({
      'src/modules/access/presentation/local-migration-name.ts':
        "const createMigrationRunner = (): string => 'local';\nconst inspectMigrationSource = createMigrationRunner;\nexport { inspectMigrationSource };\n",
    }),
  },
  {
    name: 'PBI-023 station port accepts structural tenant and branch scope',
    expectedRules: [],
    files: {
      'src/modules/stations/application/ports/branch-repository.port.ts': [
        'export interface TenantBranchPersistenceScope {',
        '  readonly tenantId: string;',
        '  readonly branchId: string;',
        '}',
        'export interface BranchRepositoryPort {',
        '  find(scope: TenantBranchPersistenceScope): Promise<unknown>;',
        '}',
        '',
      ].join('\n'),
    },
  },
  {
    name: 'D5-R037 rejects default persistence import',
    expectedRules: ['D5-R037'],
    expectedPath: 'src/modules/access/application/default-db.ts',
    files: {
      'src/modules/access/application/default-db.ts':
        "import Driver from 'pg';\nexport const poolType = Driver.Pool;\n",
    },
  },
  {
    name: 'D5-R038 rejects global capability re-export and renamed handle',
    expectedRules: ['D5-R038'],
    expectedPath: 'src/infrastructure/database/database-connection.ts',
    files: based({
      'src/infrastructure/database/database-connection.ts': [
        databaseConnection,
        'export const connectionHandle = createDatabaseConnection;',
        "export { Kysely as db } from 'kysely';",
        '',
      ].join('\n'),
    }),
  },
  {
    name: 'D5-R040 rejects a DB infrastructure barrel re-export',
    expectedRules: ['D5-R040'],
    expectedPath: 'src/modules/access/application/db-barrel.ts',
    files: based({
      'src/modules/access/application/db-barrel.ts':
        "export { createDatabaseConnection } from '../../../infrastructure/database/database-connection.js';\n",
    }),
  },
  {
    name: 'D5-R041 rejects a registered adapter without composition',
    expectedRules: ['D5-R041'],
    expectedPath:
      'src/modules/tenancy/infrastructure/persistence/kysely-tenant.repository.ts',
    files: based({
      'src/modules/tenancy/tenancy.module.ts': [
        "import { Module } from '@nestjs/common';",
        "import { createDatabaseConnection } from '../../infrastructure/database/database-connection.js';",
        'void createDatabaseConnection;',
        '@Module({})',
        'export class TenancyModule {}',
        '',
      ].join('\n'),
    }),
  },
  {
    name: 'D5-R042 rejects central migration with noncanonical name',
    expectedRules: ['D5-R042', 'D5-R047'],
    expectedPath: 'src/infrastructure/database/migrations/create-tenants.ts',
    files: {
      'src/infrastructure/database/migrations/create-tenants.ts':
        'export const up = true;\n',
    },
  },
  {
    name: 'D5-R043 rejects driver leakage through a local type alias',
    expectedRules: ['D5-R043'],
    expectedPath:
      'src/modules/tenancy/application/ports/tenant-repository.port.ts',
    files: based({
      'src/modules/tenancy/application/ports/tenant-repository.port.ts': [
        "import type { PoolClient } from 'pg';",
        'type DriverAlias = PoolClient;',
        'export interface TenantPersistenceScope { readonly tenantId: string; }',
        'export interface TenantRepositoryPort {',
        '  find(scope: TenantPersistenceScope, driver: DriverAlias): Promise<unknown>;',
        '}',
        '',
      ].join('\n'),
    }),
  },
  {
    name: 'D5-R044 rejects branch lookup scoped only by branch ID',
    expectedRules: ['D5-R044'],
    expectedPath:
      'src/modules/stations/application/ports/branch-repository.port.ts',
    files: {
      'src/modules/stations/application/ports/branch-repository.port.ts': [
        'export interface TenantBranchPersistenceScope {',
        '  readonly tenantId: string;',
        '  readonly branchId: string;',
        '}',
        'export interface BranchRepositoryPort {',
        '  find(branchId: string): Promise<unknown>;',
        '}',
        '',
      ].join('\n'),
    },
  },
  {
    name: 'D5-R045 permits the exact materialized transaction transition',
    expectedRules: [],
    files: based({
      'src/infrastructure/database/transaction-runner.ts':
        `${transactionRunner}\nconst materializedTransactionTransition = true;\nvoid materializedTransactionTransition;\n`,
    }),
    coverage: {
      ids: ['fixture:D5-R045:materialized-connection-transition:positive'],
      evidence: ['runConnectionVerification'],
    },
  },
  {
    name: 'D5-R045 rejects other registered infrastructure without consumer',
    expectedRules: ['D5-R045'],
    expectedPath: 'src/infrastructure/database/database-types.ts',
    files: {
      'src/infrastructure/database/database-types.ts':
        'export interface DatabaseSchema { readonly tenants: unknown; }\n',
    },
  },
  {
    name: 'D5-R046 rejects typed pg client query outside migration',
    expectedRules: ['D5-R046'],
    expectedPath:
      'src/modules/tenancy/infrastructure/persistence/kysely-tenant.repository.ts',
    files: based({
      'src/modules/tenancy/infrastructure/persistence/kysely-tenant.repository.ts':
        `${tenantAdapter}\nimport type { PoolClient } from 'pg';\nexport function executeRaw(client: PoolClient): unknown { return client.query('select 1'); }\n`,
    }),
  },
];
