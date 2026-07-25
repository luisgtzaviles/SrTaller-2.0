const databaseTypes = [
  'export interface DatabaseSchema {',
  '  readonly tenants: { readonly tenantId: string };',
  '  readonly branches: { readonly branchId: string; readonly tenantId: string };',
  '}',
  '',
].join('\n');

const databaseConnection = [
  "import type { Kysely } from 'kysely';",
  "import type { DatabaseSchema } from './database-types.js';",
  'export declare function createDatabaseConnection(): Kysely<DatabaseSchema>;',
  '',
].join('\n');

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
  'src/infrastructure/database/database-connection.ts': databaseConnection,
  'src/infrastructure/database/database-types.ts': databaseTypes,
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
      'src/infrastructure/database/database-connection.ts': [
        "import type { Kysely } from 'kysely';",
        "import type { DatabaseSchema } from './database-types.js';",
        'export declare function createDatabaseConnection(): Kysely<DatabaseSchema>;',
        'export declare const db: Kysely<DatabaseSchema>;',
        '',
      ].join('\n'),
    }),
    coverage: {
      ids: ['fixture:D5-R038:global-export'],
      evidence: ['export declare const db'],
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
    name: 'PBI-023 central owner-named migration may use semantic raw SQL',
    expectedRules: [],
    files: {
      'src/infrastructure/database/migrations/20260724010101_tenancy_create_tenants.ts':
        "import { sql } from 'kysely';\nexport const up = () => sql`create table tenants (tenant_id text)`;\n",
    },
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
        "import type { Kysely } from 'kysely';",
        "import type { DatabaseSchema } from './database-types.js';",
        'export declare function createDatabaseConnection(): Kysely<DatabaseSchema>;',
        'export declare const connectionHandle: Kysely<DatabaseSchema>;',
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
    expectedRules: ['D5-R042'],
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
    name: 'D5-R045 rejects registered infrastructure without consumer',
    expectedRules: ['D5-R045'],
    expectedPath: 'src/infrastructure/database/database-config.ts',
    files: {
      'src/infrastructure/database/database-config.ts':
        'export interface DatabaseConfig { readonly connectionString: string; }\n',
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
