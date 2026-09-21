import assert from 'node:assert/strict';
import {
  access,
  cp,
  mkdir,
  mkdtemp,
  readFile,
  rm,
  rmdir,
  writeFile,
} from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import test from 'node:test';

import {
  diagnosticPathProblems,
  diagnosticsFrom,
  rulesFrom,
  runChecker,
} from './architecture-support.mjs';
import { remediationMutations } from './architecture-remediation-mutations.mjs';

const withAccessPersistenceComposition = (content) => [
  "import type { KyselyAccessRepositoryFactory } from './infrastructure/persistence/kysely-access.repository.js';",
  "import type { KyselyOperationalSessionRepository } from './infrastructure/persistence/kysely-operational-session.repository.js';",
  "import type { KyselyPinCredentialRepositoryFactory } from './infrastructure/persistence/kysely-pin-credential.repository.js';",
  "import type { KyselyAdminAuthRepository } from './infrastructure/persistence/kysely-admin-auth.repository.js';",
  content,
].join('\n');

function replaceExactly(content, search, replacement) {
  const parts = content.split(search);
  assert.equal(
    parts.length,
    2,
    `controlled mutation source must contain exactly one ${JSON.stringify(search)}`,
  );
  return `${parts[0]}${replacement}${parts[1]}`;
}

async function missingParents(path, root) {
  const parents = [];
  let current = path;
  while (current.startsWith(root) && current !== root) {
    const exists = await access(current).then(() => true, () => false);
    if (exists) {
      break;
    }
    parents.push(current);
    current = dirname(current);
  }
  return parents;
}

async function removeEmptyParents(parents) {
  for (const directory of parents) {
    await rmdir(directory).catch((error) => {
      if (!['ENOENT', 'ENOTEMPTY'].includes(error?.code)) {
        throw error;
      }
    });
  }
}

const mutations = [
  {
    name: 'boundary/deep import',
    path: 'src/modules/stations/index.ts',
    expectedPath: 'src/modules/stations/index.ts',
    rule: 'D5-R005',
    content: "import type { Value } from '../tenancy/domain/value.js';\nexport interface StationsModuleContract { readonly value: Value; }\n",
    support: {
      path: 'src/modules/tenancy/domain/value.ts',
      content: 'export interface Value {}\n',
    },
  },
  {
    name: 'inter-module dependency cycle',
    path: 'src/modules/users/index.ts',
    expectedPath: 'src/modules/access/index.ts',
    rule: 'D5-R007',
    content: [
      "import type { AccessModuleContract } from '../access/index.js';",
      "import type { TenantId } from '../tenancy/index.js';",
      'export interface UsersModuleContract {',
      "  readonly module: 'users';",
      '  readonly access: AccessModuleContract;',
      '}',
      'export type AuthenticationUserRecord = Readonly<{',
      '  tenantId: TenantId;',
      '  userId: string;',
      '  displayName: string;',
      "  status: 'active' | 'inactive' | 'revoked';",
      '  version: number;',
      '}>;',
      'export interface AuthenticationUserScope { readonly tenantId: TenantId; }',
      'export interface AuthenticationUserReader {',
      '  findAuthenticationUser(',
      '    scope: AuthenticationUserScope,',
      '    userId: string,',
      '  ): Promise<AuthenticationUserRecord | null>;',
      '}',
      '',
    ].join('\n'),
  },
  {
    name: 'directed composition module alias',
    path: 'src/modules/access/access.module.ts',
    expectedPath: 'src/modules/access/access.module.ts',
    rule: 'D5-R024',
    transform: (content) => replaceExactly(
      replaceExactly(
        content,
        "import { StationsModule } from '../stations/stations.module.js';",
        "import { StationsModule as StationComposition } from '../stations/stations.module.js';",
      ),
      'imports: [RuntimeInfrastructureModule, StationsModule, UsersModule]',
      'imports: [RuntimeInfrastructureModule, StationComposition, UsersModule]',
    ),
  },
  {
    name: 'directed composition graph-only module edge',
    path: 'src/modules/access/access.module.ts',
    expectedPath: 'src/modules/access/access.module.ts',
    rule: 'D5-R024',
    transform: (content) => replaceExactly(
      replaceExactly(
        content,
        "import { StationsModule } from '../stations/stations.module.js';",
        "import { StationsModule } from '../stations/stations.module.js';\nimport { TenancyModule } from '../tenancy/tenancy.module.js';",
      ),
      'imports: [RuntimeInfrastructureModule, StationsModule, UsersModule]',
      'imports: [RuntimeInfrastructureModule, StationsModule, TenancyModule, UsersModule]',
    ),
  },
  {
    name: 'directed composition injection removed',
    path: 'src/modules/access/access.module.ts',
    expectedPath: 'src/modules/access/access.module.ts',
    rule: 'D5-R024',
    transform: (content) => replaceExactly(
      content,
      '        TRUSTED_STATION_CONTEXT_RESOLVER,\n',
      '',
    ),
  },
  {
    name: 'directed composition producer export removed',
    path: 'src/modules/stations/stations.module.ts',
    expectedPath: 'src/modules/stations/stations.module.ts',
    rule: 'D5-R024',
    transform: (content) => replaceExactly(
      content,
      '    TRUSTED_STATION_CONTEXT_RESOLVER,\n',
      '',
    ),
  },
  {
    name: 'directed composition reverse edge cycle',
    path: 'src/modules/users/users.module.ts',
    expectedPath: 'src/modules/access/access.module.ts',
    expectedPaths: [
      'src/modules/access/access.module.ts',
      'src/modules/users/users.module.ts',
    ],
    expectedRules: ['D5-R007', 'D5-R024'],
    rule: 'D5-R024',
    transform: (content) => replaceExactly(
      `import { AccessModule } from '../access/access.module.js';\n${content}`,
      '@Module({',
      '@Module({\n  imports: [AccessModule],',
    ),
  },
  {
    name: 'framework boundary',
    path: 'src/modules/access/domain/model.ts',
    expectedPath: 'src/modules/access/domain/model.ts',
    rule: 'D5-R010',
    content: "import { Injectable } from '@nestjs/common';\nexport type Marker = typeof Injectable;\n",
  },
  {
    name: 'Nest composition escape hatch',
    path: 'src/modules/access/access.module.ts',
    expectedPath: 'src/modules/access/access.module.ts',
    rule: 'D5-R025',
    expectedRules: ['D5-R024', 'D5-R025'],
    content: withAccessPersistenceComposition(
      "import { forwardRef, Module } from '@nestjs/common';\n@Module({ imports: [forwardRef(() => class {})] })\nexport class AccessModule {}\n",
    ),
  },
  {
    name: 'Nest composition escape hatch through alias',
    path: 'src/modules/access/access.module.ts',
    expectedPath: 'src/modules/access/access.module.ts',
    rule: 'D5-R025',
    expectedRules: ['D5-R024', 'D5-R025'],
    content: withAccessPersistenceComposition(
      "import { forwardRef as nestForwardRef, Module } from '@nestjs/common';\n@Module({ imports: [nestForwardRef(() => class {})] })\nexport class AccessModule {}\n",
    ),
  },
  {
    name: 'functional global module through alias',
    path: 'src/modules/access/access.module.ts',
    expectedPath: 'src/modules/access/access.module.ts',
    rule: 'D5-R027',
    expectedRules: ['D5-R024', 'D5-R027'],
    content: withAccessPersistenceComposition(
      "import { Global as NestGlobal, Module } from '@nestjs/common';\n@NestGlobal()\n@Module({})\nexport class AccessModule {}\n",
    ),
  },
  {
    name: 'Access persistence adapter composition removed',
    path: 'src/modules/access/access.module.ts',
    expectedPaths: [
      'src/modules/access/access.module.ts',
      'src/modules/access/infrastructure/persistence/kysely-access.repository.ts',
      'src/modules/access/infrastructure/persistence/kysely-operational-session.repository.ts',
      'src/modules/access/infrastructure/persistence/kysely-pin-credential.repository.ts',
      'src/modules/access/infrastructure/persistence/kysely-admin-auth.repository.ts',
    ],
    rule: 'D5-R041',
    expectedRules: ['D5-R024', 'D5-R041'],
    content: "import { Module } from '@nestjs/common';\n@Module({})\nexport class AccessModule {}\n",
  },
  {
    name: 'generic global root',
    path: 'src/utils/value.ts',
    expectedPath: 'src/utils',
    rule: 'D5-R020',
    content: 'export const value = 1;\n',
    cleanupDirectory: 'src/utils',
  },
  {
    name: 'shared admission',
    path: 'src/shared/value.ts',
    expectedPath: 'src/shared',
    rule: 'D5-R019',
    content: 'export const value = 1;\n',
  },
  {
    name: 'HTTP surface',
    path: 'src/modules/access/presentation/http/probe.controller.ts',
    expectedPath: 'src/modules/access/presentation/http/probe.controller.ts',
    rule: 'D5-R035',
    content: 'export class ProbeController {}\n',
  },
  {
    name: 'HTTP surface through Controller alias',
    path: 'src/modules/access/presentation/http/probe.ts',
    expectedPath: 'src/modules/access/presentation/http/probe.ts',
    rule: 'D5-R035',
    content: "import { Controller as HttpController } from '@nestjs/common';\n@HttpController()\nexport class ProbeController {}\n",
  },
  {
    name: 'controller moved into infrastructure',
    path: 'src/modules/repairs/infrastructure/moved.controller.ts',
    expectedPath: 'src/modules/repairs/infrastructure/moved.controller.ts',
    rule: 'D5-R035',
    content: "import { Controller } from '@nestjs/common';\n@Controller()\nexport class MovedController {}\n",
  },
  {
    name: 'registered controller imports Kysely adapter',
    path: 'src/modules/repairs/presentation/repairs.controller.ts',
    expectedPath: 'src/modules/repairs/presentation/repairs.controller.ts',
    rule: 'D5-R011',
    content: [
      "import { Controller } from '@nestjs/common';",
      "import { createKyselyRepairRepository } from '../infrastructure/persistence/kysely-repair.repository.js';",
      '@Controller()',
      'export class RepairsController { readonly adapter = createKyselyRepairRepository; }',
      '',
    ].join('\n'),
  },
  {
    name: 'registered controller imports database runtime',
    path: 'src/modules/repairs/presentation/repairs.controller.ts',
    expectedPath: 'src/modules/repairs/presentation/repairs.controller.ts',
    rule: 'D5-R011',
    content: [
      "import { Controller } from '@nestjs/common';",
      "import { databaseRuntime } from '../../../infrastructure/database/database-runtime.js';",
      '@Controller()',
      'export class RepairsController { readonly runtime = databaseRuntime; }',
      '',
    ].join('\n'),
  },
  {
    name: 'registered controller crosses module internals',
    path: 'src/modules/repairs/presentation/repairs.controller.ts',
    expectedPath: 'src/modules/repairs/presentation/repairs.controller.ts',
    rule: 'D5-R014',
    content: [
      "import { Controller } from '@nestjs/common';",
      "import type { TenantSecret } from '../../tenancy/internal/tenant-secret.js';",
      '@Controller()',
      'export class RepairsController { private declare readonly secret: TenantSecret; }',
      '',
    ].join('\n'),
    support: {
      path: 'src/modules/tenancy/internal/tenant-secret.ts',
      content: 'export interface TenantSecret {}\n',
    },
  },
  {
    name: 'empty required structural file',
    path: 'src/modules/access/access.module.ts',
    expectedPath: 'src/modules/access/access.module.ts',
    rule: 'D5-R003',
    expectedRules: ['D5-R003', 'D5-R024', 'D5-R041'],
    expectedPaths: [
      'src/modules/access/access.module.ts',
      'src/modules/access/infrastructure/persistence/kysely-access.repository.ts',
      'src/modules/access/infrastructure/persistence/kysely-operational-session.repository.ts',
      'src/modules/access/infrastructure/persistence/kysely-pin-credential.repository.ts',
      'src/modules/access/infrastructure/persistence/kysely-admin-auth.repository.ts',
    ],
    content: '',
  },
  {
    name: 'empty governed directory',
    directory: 'src/modules/access/domain/future',
    expectedPath: 'src/modules/access/domain/future',
    expectedPaths: ['src/modules/access/domain/future'],
    rule: 'D5-R003',
  },
  {
    name: 'AppModule metadata composition removed',
    path: 'src/app.module.ts',
    expectedPath: 'src/app.module.ts',
    rule: 'D5-R023',
    content: [
      "import { AccessModule } from './modules/access/access.module.js';",
      "import { StationsModule } from './modules/stations/stations.module.js';",
      "import { TenancyModule } from './modules/tenancy/tenancy.module.js';",
      'void AccessModule;',
      'void StationsModule;',
      'void TenancyModule;',
      'export class AppModule {}',
      '',
    ].join('\n'),
  },
  {
    name: 'request scope authority',
    path: 'src/modules/access/infrastructure/request-context.ts',
    expectedPath: 'src/modules/access/infrastructure/request-context.ts',
    rule: 'D5-R029',
    content: "import { Scope } from '@nestjs/common';\nexport const operationalContextScope = Scope.REQUEST;\n",
  },
  {
    name: 'request scope authority through alias',
    path: 'src/modules/access/infrastructure/request-context-alias.ts',
    expectedPath: 'src/modules/access/infrastructure/request-context-alias.ts',
    rule: 'D5-R029',
    content: "import { Scope as NestScope } from '@nestjs/common';\nexport const operationalContextScope = NestScope.REQUEST;\n",
  },
  {
    name: 'controller final authorization',
    path: 'src/modules/access/presentation/http/authority.controller.ts',
    expectedPath: 'src/modules/access/presentation/http/authority.controller.ts',
    rule: 'D5-R036',
    content: [
      "import { Controller, Get } from '@nestjs/common';",
      '@Controller()',
      'export class AuthorityController {',
      '  @Get()',
      '  decideAuthorization(): boolean { return true; }',
      '}',
      '',
    ].join('\n'),
    expectedRules: ['D5-R035', 'D5-R036'],
  },
  {
    name: 'controller final authorization through namespace',
    path: 'src/modules/access/presentation/http/authority.ts',
    expectedPath: 'src/modules/access/presentation/http/authority.ts',
    rule: 'D5-R036',
    expectedRules: ['D5-R035', 'D5-R036'],
    content: [
      "import * as Nest from '@nestjs/common';",
      '@Nest.Controller()',
      'export class AuthorityController {',
      '  decideAuthorization(): boolean { return true; }',
      '}',
      '',
    ].join('\n'),
  },
  {
    name: 'migration ownership rejects a Stations migration cross-owner table',
    path: 'src/infrastructure/database/migrations/20260907110000_stations_add_admission_revisions.ts',
    expectedPath: 'src/infrastructure/database/migrations/20260907110000_stations_add_admission_revisions.ts',
    rule: 'D5-R047',
    transform: (content) => replaceExactly(
      content,
      "await database.schema.alterTable('branches')\n    .addColumn('admission_revision'",
      "await database.schema.alterTable('users')\n    .addColumn('admission_revision'",
    ),
  },
  {
    name: 'migration ownership rejects an unregistered Users function',
    path: 'src/infrastructure/database/migrations/20260907111000_users_add_admission_revision.ts',
    expectedPath: 'src/infrastructure/database/migrations/20260907111000_users_add_admission_revision.ts',
    rule: 'D5-R047',
    transform: (content) => replaceExactly(
      content,
      'create function users_advance_admission_revision()',
      'create function users_advance_admission_revision_unregistered()',
    ),
  },
  {
    name: 'migration ownership rejects an unregistered Access trigger',
    path: 'src/infrastructure/database/migrations/20260907120000_access_create_operational_sessions.ts',
    expectedPath: 'src/infrastructure/database/migrations/20260907120000_access_create_operational_sessions.ts',
    rule: 'D5-R047',
    transform: (content) => replaceExactly(
      content,
      'create trigger access_sessions_validate_admission\n    before insert',
      'create trigger access_sessions_validate_admission_unregistered\n    before insert',
    ),
  },
  {
    name: 'migration ownership rejects an unregistered backdated migration',
    path: 'src/infrastructure/database/migrations/20260801000000_access_create_backdated_probe.ts',
    expectedPath: 'src/infrastructure/database/migrations/20260801000000_access_create_backdated_probe.ts',
    rule: 'D5-R047',
    content: [
      "import type { Kysely } from 'kysely';",
      "import type { DatabaseSchema } from '../database-types.js';",
      'export async function up(database: Kysely<DatabaseSchema>): Promise<void> {',
      "  await database.schema.createTable('access_backdated_probe').execute();",
      '}',
      'export async function down(database: Kysely<DatabaseSchema>): Promise<void> {',
      "  await database.schema.dropTable('access_backdated_probe').execute();",
      '}',
      '',
    ].join('\n'),
  },
  ...remediationMutations,
];

for (const mutation of mutations) {
  test(`controlled mutation: ${mutation.name}`, async () => {
    const root = await mkdtemp(join(tmpdir(), 'srtaller-dec005-mutation-'));
    const destination = mutation.path ? resolve(root, mutation.path) : undefined;
    const directory = mutation.directory
      ? resolve(root, mutation.directory)
      : undefined;
    try {
      await cp(resolve(process.cwd(), 'src'), resolve(root, 'src'), {
        recursive: true,
      });
      let original;
      let destinationParents = [];
      if (destination) {
        original = await readFile(destination, 'utf8').catch(() => undefined);
        destinationParents = await missingParents(dirname(destination), root);
        await mkdir(dirname(destination), { recursive: true });
        const content = mutation.transform
          ? mutation.transform(original)
          : mutation.content;
        await writeFile(destination, content);
      }

      let directoryParents = [];
      if (directory) {
        directoryParents = await missingParents(directory, root);
        await mkdir(directory, { recursive: true });
      }

      let supportOriginal;
      let supportDestination;
      let supportParents = [];
      if (mutation.support) {
        supportDestination = resolve(root, mutation.support.path);
        supportOriginal = await readFile(supportDestination, 'utf8').catch(
          () => undefined,
        );
        supportParents = await missingParents(dirname(supportDestination), root);
        await mkdir(dirname(supportDestination), { recursive: true });
        await writeFile(supportDestination, mutation.support.content);
      }

      const rejected = await runChecker(root);
      const expectedRules = mutation.expectedRules ?? [mutation.rule];
      const expectedPaths = mutation.expectedPaths ?? [mutation.expectedPath];
      const diagnostics = diagnosticsFrom(rejected.stderr);
      assert.equal(rejected.code, 1);
      assert.deepEqual(rulesFrom(rejected.stderr), [...expectedRules].sort());
      assert.deepEqual(diagnosticPathProblems(rejected.stderr, root), []);
      assert.ok(diagnostics.length > 0);
      assert.ok(
        diagnostics.every(
          ({ path, rule }) =>
            expectedPaths.includes(path) && expectedRules.includes(rule),
        ),
        `expected only ${expectedRules.join(', ')} at ${expectedPaths.join(', ')}`,
      );
      for (const expectedPath of expectedPaths) {
        assert.ok(
          diagnostics.some(({ path }) => path === expectedPath),
          `expected an exact diagnostic path at ${expectedPath}`,
        );
      }

      if (destination) {
        if (original === undefined) {
          await rm(destination);
          await removeEmptyParents(destinationParents);
        } else {
          await writeFile(destination, original);
        }
      }
      if (supportDestination) {
        if (supportOriginal === undefined) {
          await rm(supportDestination);
          await removeEmptyParents(supportParents);
        } else {
          await writeFile(supportDestination, supportOriginal);
        }
      }
      if (directory) {
        await removeEmptyParents(directoryParents);
      }
      if (mutation.cleanupDirectory) {
        await rm(resolve(root, mutation.cleanupDirectory), {
          force: true,
          recursive: true,
        });
      }

      const restored = await runChecker(root);
      assert.equal(restored.code, 0, restored.stderr);
    } finally {
      await rm(root, { force: true, recursive: true });
    }
  });
}
