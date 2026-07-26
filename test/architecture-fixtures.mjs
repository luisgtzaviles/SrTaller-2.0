export const validFiles = {
  'src/app.module.ts': [
    "import { Module } from '@nestjs/common';",
    "import type { AccessModuleContract } from './modules/access/index.js';",
    "import { AccessModule } from './modules/access/access.module.js';",
    "import { StationsModule } from './modules/stations/stations.module.js';",
    "import { TenancyModule } from './modules/tenancy/tenancy.module.js';",
    '@Module({',
    '  imports: [TenancyModule, StationsModule, AccessModule],',
    '})',
    'export class AppModule {',
    '  private declare readonly architectureContract: AccessModuleContract;',
    '}',
    '',
  ].join('\n'),
  'src/modules/access/access.module.ts': [
    "import { Module } from '@nestjs/common';",
    '@Module({})',
    'export class AccessModule {}',
    '',
  ].join('\n'),
  'src/modules/access/index.ts': [
    "import type { StationsModuleContract } from '../stations/index.js';",
    "import type { TenancyModuleContract } from '../tenancy/index.js';",
    'export interface AccessModuleContract {',
    "  readonly module: 'access';",
    '  readonly stations: StationsModuleContract;',
    '  readonly tenancy: TenancyModuleContract;',
    '}',
    '',
  ].join('\n'),
  'src/modules/stations/index.ts': [
    "import type { TenancyModuleContract } from '../tenancy/index.js';",
    'export interface StationsModuleContract {',
    "  readonly module: 'stations';",
    '  readonly tenancy: TenancyModuleContract;',
    '}',
    '',
  ].join('\n'),
  'src/modules/stations/stations.module.ts': [
    "import { Module } from '@nestjs/common';",
    '@Module({})',
    'export class StationsModule {}',
    '',
  ].join('\n'),
  'src/modules/tenancy/index.ts': [
    'export interface TenancyModuleContract {',
    "  readonly module: 'tenancy';",
    '}',
    '',
  ].join('\n'),
  'src/modules/tenancy/tenancy.module.ts': [
    "import { Module } from '@nestjs/common';",
    '@Module({})',
    'export class TenancyModule {}',
    '',
  ].join('\n'),
};

const expectedPathByFixtureName = {
  'unauthorized module': 'src/modules/inventory',
  'deep inter-module import': 'src/modules/stations/index.ts',
  'internal access across modules': 'src/modules/stations/index.ts',
  'inverse dependency': 'src/modules/tenancy/index.ts',
  'dependency outside the graph': 'src/modules/stations/index.ts',
  'inter-module cycle': 'src/modules/stations/index.ts',
  'NestJS in domain': 'src/modules/access/domain/model.ts',
  'NestJS in application': 'src/modules/access/application/contract.ts',
  'NestJS in public contract': 'src/modules/access/index.ts',
  'forwardRef usage': 'src/modules/access/access.module.ts',
  'ModuleRef service locator': 'src/modules/access/access.module.ts',
  'functional global module': 'src/modules/access/access.module.ts',
  'forbidden utils root': 'src/utils',
  'forbidden common root': 'src/common',
  'forbidden helpers root': 'src/helpers',
  'forbidden base root': 'src/base',
  'forbidden core root': 'src/core',
  'empty anticipatory module': 'src/modules/access',
  'missing public surface': 'src/modules/access',
  'invalid public re-export': 'src/modules/access/index.ts',
  'unauthorized controller':
    'src/modules/access/presentation/http/probe.ts',
  'unauthorized endpoint': 'src/modules/access/presentation/http/endpoint.ts',
  'shared content': 'src/shared',
  'domain imports application': 'src/modules/access/domain/rule.ts',
  'application imports infrastructure':
    'src/modules/access/application/handler.ts',
  'module composition import outside AppModule':
    'src/modules/stations/index.ts',
  'functional business behavior': 'src/modules/access/domain/create-repair.ts',
  'NodeNext extension violation': 'src/modules/access/index.ts',
  'port outside application': 'src/modules/access/ports/token.ts',
  'adapter in domain': 'src/modules/access/domain/token.adapter.ts',
  'HTTP DTO outside presentation':
    'src/modules/access/application/request.dto.ts',
  'entity exported from public surface': 'src/modules/access/index.ts',
  'presentation imports repository':
    'src/modules/access/presentation/http/handler.ts',
};

export const fixtureCases = [
  {
    name: 'allowed graph through public indexes',
    expectedRules: [],
  },
  {
    name: 'valid framework-free public export',
    expectedRules: [],
    files: {
      'src/modules/access/index.ts': `${validFiles['src/modules/access/index.ts']}export interface ReadOnlyTechnicalContract { readonly kind: 'technical'; }\n`,
    },
  },
  {
    name: 'Nest-like symbols from another package are ignored',
    expectedRules: [],
    files: {
      'src/modules/access/presentation/http/other-package.ts': [
        "import { Controller, forwardRef, Get, Global, Scope } from '@example/nest-like';",
        "import { ModuleRef } from '@example/nest-core';",
        '@Global()',
        '@Controller()',
        'export class LocalHttpSurface {',
        '  readonly context = Scope.REQUEST;',
        '  readonly moduleRef!: ModuleRef;',
        '  readonly reference = forwardRef(() => LocalHttpSurface);',
        '  @Get() read(): void {}',
        '}',
        '',
      ].join('\n'),
    },
  },
  {
    name: 'local Nest homonyms are ignored',
    expectedRules: [],
    files: {
      'src/modules/access/presentation/http/local-homonyms.ts': [
        'const Scope = { REQUEST: "local" } as const;',
        'function Controller(): ClassDecorator { return () => undefined; }',
        'function Get(): MethodDecorator { return () => undefined; }',
        'function Global(): ClassDecorator { return () => undefined; }',
        'function forwardRef(callback: () => unknown): unknown { return callback; }',
        'class ModuleRef {}',
        '@Global()',
        '@Controller()',
        'export class LocalHttpSurface {',
        '  readonly context = Scope.REQUEST;',
        '  readonly moduleRef!: ModuleRef;',
        '  readonly reference = forwardRef(() => LocalHttpSurface);',
        '  @Get() read(): void {}',
        '}',
        '',
      ].join('\n'),
    },
  },
  {
    name: 'Nest symbols in comments and strings are ignored',
    expectedRules: [],
    files: {
      'src/modules/access/presentation/http/text-evidence.ts': [
        '// @Global() @Controller() @Get() Scope.REQUEST forwardRef() ModuleRef',
        "export const evidence = '@Global() @Controller() @Get() Scope.REQUEST forwardRef() ModuleRef';",
        '',
      ].join('\n'),
    },
  },
  {
    name: 'named Nest imports shadowed by parameters are ignored',
    expectedRules: [],
    files: {
      'src/modules/access/presentation/http/named-shadow.ts': [
        "import { Controller as ImportedController, Scope as ImportedScope } from '@nestjs/common';",
        'export function inspect(',
        '  ImportedController: () => ClassDecorator,',
        '  ImportedScope: { readonly REQUEST: string },',
        '): string {',
        '  @ImportedController()',
        '  class LocalSurface {}',
        '  void LocalSurface;',
        '  return ImportedScope.REQUEST;',
        '}',
        '',
      ].join('\n'),
    },
  },
  {
    name: 'namespace Nest import shadowed by a parameter is ignored',
    expectedRules: [],
    files: {
      'src/modules/access/presentation/http/namespace-shadow.ts': [
        "import * as Nest from '@nestjs/common';",
        'export function inspect(',
        '  Nest: {',
        '    Controller(): ClassDecorator;',
        '    readonly Scope: { readonly REQUEST: string };',
        '  },',
        '): string {',
        '  @Nest.Controller()',
        '  class LocalSurface {}',
        '  void LocalSurface;',
        '  return Nest.Scope.REQUEST;',
        '}',
        '',
      ].join('\n'),
    },
  },
  {
    name: 'unauthorized module',
    expectedRules: ['D5-R002'],
    expectedText: 'not authorized',
    files: {
      'src/modules/inventory/index.ts': 'export interface InventoryContract {}\n',
    },
  },
  {
    name: 'deep inter-module import',
    expectedRules: ['D5-R005'],
    expectedText: 'deep-imports',
    files: {
      'src/modules/stations/index.ts': "import type { TenantValue } from '../tenancy/domain/value.js';\nexport interface StationsModuleContract { readonly tenant: TenantValue; }\n",
      'src/modules/tenancy/domain/value.ts': "export interface TenantValue { readonly kind: 'technical'; }\n",
    },
  },
  {
    name: 'internal access across modules',
    expectedRules: ['D5-R014'],
    expectedText: 'accesses tenancy internals',
    files: {
      'src/modules/stations/index.ts': "import type { Secret } from '../tenancy/internal/secret.js';\nexport interface StationsModuleContract { readonly secret: Secret; }\n",
      'src/modules/tenancy/internal/secret.ts': 'export interface Secret {}\n',
    },
  },
  {
    name: 'inverse dependency',
    expectedRules: ['D5-R006'],
    expectedText: 'outside the approved graph',
    files: {
      'src/modules/stations/index.ts': "export interface StationsModuleContract { readonly module: 'stations'; }\n",
      'src/modules/tenancy/index.ts': "import type { StationsModuleContract } from '../stations/index.js';\nexport interface TenancyModuleContract { readonly stations: StationsModuleContract; }\n",
    },
  },
  {
    name: 'dependency outside the graph',
    expectedRules: ['D5-R006'],
    expectedText: 'outside the approved graph',
    files: {
      'src/modules/access/index.ts': "export interface AccessModuleContract { readonly module: 'access'; }\n",
      'src/modules/stations/index.ts': "import type { AccessModuleContract } from '../access/index.js';\nexport interface StationsModuleContract { readonly access: AccessModuleContract; }\n",
    },
  },
  {
    name: 'inter-module cycle',
    expectedRules: ['D5-R007'],
    expectedText: 'dependency cycle detected',
    files: {
      'src/modules/tenancy/index.ts': "import type { StationsModuleContract } from '../stations/index.js';\nexport interface TenancyModuleContract { readonly stations: StationsModuleContract; }\n",
    },
  },
  {
    name: 'NestJS in domain',
    expectedRules: ['D5-R010'],
    expectedText: 'forbidden in domain',
    files: {
      'src/modules/access/domain/model.ts': "import { Injectable } from '@nestjs/common';\nexport type Marker = typeof Injectable;\n",
    },
  },
  {
    name: 'NestJS in application',
    expectedRules: ['D5-R010'],
    expectedText: 'forbidden in application',
    files: {
      'src/modules/access/application/contract.ts': "import { Injectable } from '@nestjs/common';\nexport type Marker = typeof Injectable;\n",
    },
  },
  {
    name: 'NestJS in public contract',
    expectedRules: ['D5-R016'],
    expectedText: 'public contract imports NestJS',
    files: {
      'src/modules/access/index.ts': "import { Injectable } from '@nestjs/common';\nexport interface AccessModuleContract { readonly marker: typeof Injectable; }\n",
    },
  },
  {
    name: 'forwardRef usage',
    expectedRules: ['D5-R025'],
    expectedText: 'forwardRef is forbidden',
    files: {
      'src/modules/access/access.module.ts': "import { forwardRef, Module } from '@nestjs/common';\n@Module({ imports: [forwardRef(() => class {})] })\nexport class AccessModule {}\n",
    },
  },
  {
    name: 'forwardRef alias usage',
    expectedPath: 'src/modules/access/access.module.ts',
    expectedRules: ['D5-R025'],
    expectedText: 'forwardRef is forbidden',
    files: {
      'src/modules/access/access.module.ts': "import { forwardRef as nestForwardRef, Module } from '@nestjs/common';\n@Module({ imports: [nestForwardRef(() => class {})] })\nexport class AccessModule {}\n",
    },
  },
  {
    name: 'forwardRef namespace usage',
    expectedPath: 'src/modules/access/access.module.ts',
    expectedRules: ['D5-R025'],
    expectedText: 'forwardRef is forbidden',
    files: {
      'src/modules/access/access.module.ts': "import { Module } from '@nestjs/common';\nimport * as Nest from '@nestjs/common';\n@Module({ imports: [Nest.forwardRef(() => class {})] })\nexport class AccessModule {}\n",
    },
  },
  {
    name: 'ModuleRef service locator',
    expectedRules: ['D5-R026'],
    expectedText: 'ModuleRef',
    files: {
      'src/modules/access/access.module.ts': "import { Module } from '@nestjs/common';\nimport { ModuleRef } from '@nestjs/core';\n@Module({})\nexport class AccessModule { constructor(readonly ref: ModuleRef) {} }\n",
    },
  },
  {
    name: 'ModuleRef alias service locator',
    expectedPath: 'src/modules/access/access.module.ts',
    expectedRules: ['D5-R026'],
    expectedText: 'ModuleRef',
    files: {
      'src/modules/access/access.module.ts': "import { Module } from '@nestjs/common';\nimport { ModuleRef as NestModuleRef } from '@nestjs/core';\n@Module({})\nexport class AccessModule { constructor(readonly ref: NestModuleRef) {} }\n",
    },
  },
  {
    name: 'ModuleRef namespace service locator',
    expectedPath: 'src/modules/access/access.module.ts',
    expectedRules: ['D5-R026'],
    expectedText: 'ModuleRef',
    files: {
      'src/modules/access/access.module.ts': "import { Module } from '@nestjs/common';\nimport * as NestCore from '@nestjs/core';\n@Module({})\nexport class AccessModule { constructor(readonly ref: NestCore.ModuleRef) {} }\n",
    },
  },
  {
    name: 'functional global module',
    expectedRules: ['D5-R027'],
    expectedText: 'global Nest modules',
    files: {
      'src/modules/access/access.module.ts': "import { Global, Module } from '@nestjs/common';\n@Global()\n@Module({})\nexport class AccessModule {}\n",
    },
  },
  {
    name: 'functional global module through alias',
    expectedPath: 'src/modules/access/access.module.ts',
    expectedRules: ['D5-R027'],
    expectedText: 'global Nest modules',
    files: {
      'src/modules/access/access.module.ts': "import { Global as NestGlobal, Module } from '@nestjs/common';\n@NestGlobal()\n@Module({})\nexport class AccessModule {}\n",
    },
  },
  {
    name: 'functional global module through namespace',
    expectedPath: 'src/modules/access/access.module.ts',
    expectedRules: ['D5-R027'],
    expectedText: 'global Nest modules',
    files: {
      'src/modules/access/access.module.ts': "import { Module } from '@nestjs/common';\nimport * as Nest from '@nestjs/common';\n@Nest.Global()\n@Module({})\nexport class AccessModule {}\n",
    },
  },
  {
    name: 'forbidden utils root',
    expectedRules: ['D5-R020'],
    expectedText: 'global root utils',
    files: { 'src/utils/value.ts': 'export const value = 1;\n' },
  },
  {
    name: 'forbidden common root',
    expectedRules: ['D5-R020'],
    expectedText: 'global root common',
    files: { 'src/common/value.ts': 'export const value = 1;\n' },
  },
  {
    name: 'forbidden helpers root',
    expectedRules: ['D5-R020'],
    expectedText: 'global root helpers',
    files: { 'src/helpers/value.ts': 'export const value = 1;\n' },
  },
  {
    name: 'forbidden base root',
    expectedRules: ['D5-R020'],
    expectedText: 'global root base',
    files: { 'src/base/value.ts': 'export const value = 1;\n' },
  },
  {
    name: 'forbidden core root',
    expectedRules: ['D5-R020'],
    expectedText: 'global root core',
    files: { 'src/core/value.ts': 'export const value = 1;\n' },
  },
  {
    name: 'empty anticipatory module',
    deleteFiles: [
      'src/modules/access/access.module.ts',
      'src/modules/access/index.ts',
    ],
    emptyDirectories: ['src/modules/access'],
    expectedRules: ['D5-R003'],
    expectedPaths: [
      'src/modules/access',
      'src/modules/access/access.module.ts',
      'src/modules/access/index.ts',
    ],
    expectedText: 'empty or anticipatory',
  },
  {
    name: 'required module missing',
    deleteDirectories: ['src/modules/access'],
    expectedPath: 'src/modules/access',
    expectedPaths: [
      'src/modules/access',
      'src/modules/access/access.module.ts',
      'src/modules/access/index.ts',
    ],
    expectedRules: ['D5-R003'],
    expectedText: 'required module access is missing',
  },
  {
    name: 'missing public surface',
    deleteFiles: ['src/modules/access/index.ts'],
    expectedPaths: [
      'src/modules/access',
      'src/modules/access/index.ts',
    ],
    expectedRules: ['D5-R003', 'D5-R004'],
    expectedText: 'no public index.ts',
  },
  {
    name: 'invalid public re-export',
    expectedRules: ['D5-R004'],
    expectedText: 'only explicitly allowlisted',
    files: {
      'src/modules/access/index.ts': `${validFiles['src/modules/access/index.ts']}export { Secret } from './internal/secret.js';\n`,
      'src/modules/access/internal/secret.ts': 'export interface Secret {}\n',
    },
  },
  {
    name: 'unauthorized controller',
    expectedRules: ['D5-R035'],
    expectedText: 'controllers are outside',
    files: {
      'src/modules/access/presentation/http/probe.ts': "import { Controller } from '@nestjs/common';\n@Controller()\nexport class ProbeController {}\n",
    },
  },
  {
    name: 'unauthorized controller through alias',
    expectedPath: 'src/modules/access/presentation/http/alias-controller.ts',
    expectedRules: ['D5-R035'],
    expectedText: 'controllers are outside',
    files: {
      'src/modules/access/presentation/http/alias-controller.ts': "import { Controller as HttpController } from '@nestjs/common';\n@HttpController()\nexport class ProbeController {}\n",
    },
  },
  {
    name: 'unauthorized controller through namespace',
    expectedPath: 'src/modules/access/presentation/http/namespace-controller.ts',
    expectedRules: ['D5-R035'],
    expectedText: 'controllers are outside',
    files: {
      'src/modules/access/presentation/http/namespace-controller.ts': "import * as Nest from '@nestjs/common';\n@Nest.Controller()\nexport class ProbeController {}\n",
    },
  },
  {
    name: 'unauthorized endpoint',
    expectedRules: ['D5-R035'],
    expectedText: 'HTTP endpoints are outside',
    files: {
      'src/modules/access/presentation/http/endpoint.ts': "import { Get } from '@nestjs/common';\nexport class Endpoint { @Get() run(): void {} }\n",
    },
  },
  {
    name: 'unauthorized endpoint through alias',
    expectedPath: 'src/modules/access/presentation/http/alias-endpoint.ts',
    expectedRules: ['D5-R035'],
    expectedText: 'HTTP endpoints are outside',
    files: {
      'src/modules/access/presentation/http/alias-endpoint.ts': "import { Get as HttpGet } from '@nestjs/common';\nexport class Endpoint { @HttpGet() run(): void {} }\n",
    },
  },
  {
    name: 'unauthorized endpoint through namespace',
    expectedPath: 'src/modules/access/presentation/http/namespace-endpoint.ts',
    expectedRules: ['D5-R035'],
    expectedText: 'HTTP endpoints are outside',
    files: {
      'src/modules/access/presentation/http/namespace-endpoint.ts': "import * as Nest from '@nestjs/common';\nexport class Endpoint { @Nest.Get() run(): void {} }\n",
    },
  },
  {
    name: 'shared content',
    expectedRules: ['D5-R019'],
    expectedText: 'shared must remain',
    files: { 'src/shared/value.ts': 'export const value = 1;\n' },
  },
  {
    name: 'domain imports application',
    expectedRules: ['D5-R008'],
    expectedText: 'domain import crosses',
    files: {
      'src/modules/access/application/helper.ts': 'export interface Helper {}\n',
      'src/modules/access/domain/rule.ts': "import type { Helper } from '../application/helper.js';\nexport interface Rule { readonly helper: Helper; }\n",
    },
  },
  {
    name: 'application imports infrastructure',
    expectedRules: ['D5-R009'],
    expectedText: 'outer layer',
    files: {
      'src/modules/access/application/handler.ts': "import type { Adapter } from '../infrastructure/adapter.js';\nexport interface Handler { readonly adapter: Adapter; }\n",
      'src/modules/access/infrastructure/adapter.ts': 'export interface Adapter {}\n',
    },
  },
  {
    name: 'module composition import outside AppModule',
    expectedRules: ['D5-R024'],
    expectedText: 'only AppModule',
    files: {
      'src/modules/stations/index.ts': "import { TenancyModule } from '../tenancy/tenancy.module.js';\nexport interface StationsModuleContract { readonly module: typeof TenancyModule; }\n",
    },
  },
  {
    name: 'functional business behavior',
    expectedRules: ['D5-R035'],
    expectedText: 'functional business behavior',
    files: {
      'src/modules/access/domain/create-repair.ts': 'export class CreateRepair { execute(): void {} }\n',
    },
  },
  {
    name: 'NodeNext extension violation',
    expectedRules: ['D5-R031'],
    expectedText: 'lacks a NodeNext',
    files: {
      'src/modules/access/index.ts': "import type { StationsModuleContract } from '../stations/index';\nimport type { TenancyModuleContract } from '../tenancy/index.js';\nexport interface AccessModuleContract { readonly stations: StationsModuleContract; readonly tenancy: TenancyModuleContract; }\n",
    },
  },
  {
    name: 'port outside application',
    expectedRules: ['D5-R012'],
    expectedText: 'ports must live',
    files: { 'src/modules/access/ports/token.ts': 'export interface TokenPort {}\n' },
  },
  {
    name: 'adapter in domain',
    expectedRules: ['D5-R013'],
    expectedText: 'adapters cannot live',
    files: { 'src/modules/access/domain/token.adapter.ts': 'export interface TokenAdapter {}\n' },
  },
  {
    name: 'HTTP DTO outside presentation',
    expectedRules: ['D5-R015'],
    expectedText: 'HTTP DTOs',
    files: { 'src/modules/access/application/request.dto.ts': 'export interface RequestDto {}\n' },
  },
  {
    name: 'entity exported from public surface',
    expectedRules: ['D5-R018'],
    expectedText: 'cannot be public',
    files: {
      'src/modules/access/index.ts': `${validFiles['src/modules/access/index.ts']}export class SessionEntity {}\n`,
    },
  },
  {
    name: 'presentation imports repository',
    expectedRules: ['D5-R011'],
    expectedText: 'presentation cannot access',
    files: {
      'src/modules/access/infrastructure/repository.ts': 'export interface Repository {}\n',
      'src/modules/access/presentation/http/handler.ts': "import type { Repository } from '../../infrastructure/repository.js';\nexport interface Handler { readonly repository: Repository; }\n",
    },
  },
  {
    name: 'empty directory outside governed roots is ignored',
    expectedRules: [],
    emptyDirectories: ['src/local-notes/empty'],
  },
  {
    name: 'required module file empty',
    expectedRules: ['D5-R003'],
    expectedPath: 'src/modules/access/access.module.ts',
    expectedText: 'required structural file is empty',
    files: { 'src/modules/access/access.module.ts': '' },
  },
  {
    name: 'required module file whitespace only',
    expectedRules: ['D5-R003'],
    expectedPath: 'src/modules/access/access.module.ts',
    expectedText: 'only whitespace',
    files: { 'src/modules/access/access.module.ts': '  \n\n' },
  },
  {
    name: 'required module file comments only',
    expectedRules: ['D5-R003'],
    expectedPath: 'src/modules/access/access.module.ts',
    expectedText: 'only comments or trivia',
    files: { 'src/modules/access/access.module.ts': '// reserved\n/* no declaration */\n' },
  },
  {
    name: 'required public barrel empty',
    expectedRules: ['D5-R003'],
    expectedPath: 'src/modules/access/index.ts',
    expectedText: 'required structural file is empty',
    files: { 'src/modules/access/index.ts': '' },
  },
  {
    name: 'required public symbol missing',
    expectedRules: ['D5-R004'],
    expectedPath: 'src/modules/access/index.ts',
    expectedText: 'AccessModuleContract is missing',
    files: {
      'src/modules/access/index.ts': 'export interface DifferentContract {}\n',
    },
  },
  {
    name: 'required module declaration incorrect',
    expectedRules: ['D5-R003'],
    expectedPath: 'src/modules/access/access.module.ts',
    expectedText: 'AccessModule is missing; found WrongModule',
    files: {
      'src/modules/access/access.module.ts': 'export class WrongModule {}\n',
    },
  },
  {
    name: 'internal directory empty',
    expectedRules: ['D5-R003'],
    expectedPath: 'src/modules/access/domain',
    expectedText: 'governed directory is empty',
    emptyDirectories: ['src/modules/access/domain'],
  },
  {
    name: 'internal subdirectory empty',
    expectedRules: ['D5-R003'],
    expectedPath: 'src/modules/access/domain/future',
    expectedPaths: [
      'src/modules/access/domain',
      'src/modules/access/domain/future',
    ],
    expectedText: 'governed directory is empty',
    emptyDirectories: ['src/modules/access/domain/future'],
  },
  {
    name: 'additional module empty',
    expectedRules: ['D5-R003'],
    expectedPath: 'src/modules/inventory',
    expectedText: 'empty',
    emptyDirectories: ['src/modules/inventory'],
  },
  {
    name: 'empty directory chain',
    expectedRules: ['D5-R003'],
    expectedPath: 'src/modules/access/application/future/leaf',
    expectedPaths: [
      'src/modules/access/application',
      'src/modules/access/application/future',
      'src/modules/access/application/future/leaf',
    ],
    expectedText: 'governed directory is empty',
    emptyDirectories: ['src/modules/access/application/future/leaf'],
  },
  {
    name: 'directory containing only hidden files',
    expectedRules: ['D5-R003'],
    expectedPath: 'src/modules/access/domain/future',
    expectedPaths: [
      'src/modules/access/domain',
      'src/modules/access/domain/future',
    ],
    expectedText: 'hidden/temporary files',
    files: { 'src/modules/access/domain/future/.keep': 'placeholder\n' },
  },
  {
    name: 'directory containing only temporary files',
    expectedRules: ['D5-R003'],
    expectedPath: 'src/modules/access/domain/future',
    expectedPaths: [
      'src/modules/access/domain',
      'src/modules/access/domain/future',
    ],
    expectedText: 'hidden/temporary files',
    files: { 'src/modules/access/domain/future/value.tmp': 'temporary\n' },
  },
  {
    name: 'AppModule imports declared without decorator',
    expectedRules: ['D5-R023'],
    expectedPath: 'src/app.module.ts',
    expectedText: 'exactly one @Module decorator',
    files: {
      'src/app.module.ts': [
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
  },
  {
    name: 'AppModule empty metadata',
    expectedRules: ['D5-R023'],
    expectedPath: 'src/app.module.ts',
    expectedText: 'exactly one imports property',
    files: {
      'src/app.module.ts': [
        "import { Module } from '@nestjs/common';",
        '@Module({})',
        'export class AppModule {}',
        '',
      ].join('\n'),
    },
  },
  {
    name: 'AppModule metadata without imports',
    expectedRules: ['D5-R023'],
    expectedPath: 'src/app.module.ts',
    expectedText: 'exactly one imports property',
    files: {
      'src/app.module.ts': [
        "import { Module } from '@nestjs/common';",
        '@Module({ providers: [] })',
        'export class AppModule {}',
        '',
      ].join('\n'),
    },
  },
  {
    name: 'AppModule incomplete imports',
    expectedRules: ['D5-R023'],
    expectedPath: 'src/app.module.ts',
    expectedText: 'missing required modules: AccessModule',
    files: {
      'src/app.module.ts': [
        "import { Module } from '@nestjs/common';",
        "import { AccessModule } from './modules/access/access.module.js';",
        "import { StationsModule } from './modules/stations/stations.module.js';",
        "import { TenancyModule } from './modules/tenancy/tenancy.module.js';",
        '@Module({ imports: [TenancyModule, StationsModule] })',
        'export class AppModule {}',
        '',
      ].join('\n'),
    },
  },
  {
    name: 'AppModule unknown import',
    expectedRules: ['D5-R023'],
    expectedPath: 'src/app.module.ts',
    expectedText: 'unauthorized modules: ProbeModule',
    files: {
      'src/app.module.ts': [
        "import { Module } from '@nestjs/common';",
        "import { AccessModule } from './modules/access/access.module.js';",
        "import { StationsModule } from './modules/stations/stations.module.js';",
        "import { TenancyModule } from './modules/tenancy/tenancy.module.js';",
        "import { ProbeModule } from './probe.module.js';",
        '@Module({ imports: [TenancyModule, StationsModule, AccessModule, ProbeModule] })',
        'export class AppModule {}',
        '',
      ].join('\n'),
    },
  },
  {
    name: 'AppModule duplicate import',
    expectedRules: ['D5-R023'],
    expectedPath: 'src/app.module.ts',
    expectedText: 'duplicates: AccessModule',
    files: {
      'src/app.module.ts': [
        "import { Module } from '@nestjs/common';",
        "import { AccessModule } from './modules/access/access.module.js';",
        "import { StationsModule } from './modules/stations/stations.module.js';",
        "import { TenancyModule } from './modules/tenancy/tenancy.module.js';",
        '@Module({ imports: [TenancyModule, StationsModule, AccessModule, AccessModule] })',
        'export class AppModule {}',
        '',
      ].join('\n'),
    },
  },
  {
    name: 'AppModule calculated imports metadata',
    expectedRules: ['D5-R023'],
    expectedPath: 'src/app.module.ts',
    expectedText: 'static array literal',
    files: {
      'src/app.module.ts': [
        "import { Module } from '@nestjs/common';",
        "import { AccessModule } from './modules/access/access.module.js';",
        "import { StationsModule } from './modules/stations/stations.module.js';",
        "import { TenancyModule } from './modules/tenancy/tenancy.module.js';",
        'const composition = [TenancyModule, StationsModule, AccessModule];',
        '@Module({ imports: composition })',
        'export class AppModule {}',
        '',
      ].join('\n'),
    },
  },
  {
    name: 'request scope as operational-context authority',
    expectedRules: ['D5-R029'],
    expectedPath: 'src/modules/access/infrastructure/request-context.ts',
    expectedText: 'request scope cannot be operational-context authority',
    files: {
      'src/modules/access/infrastructure/request-context.ts': [
        "import { Scope } from '@nestjs/common';",
        'export const operationalContextScope = Scope.REQUEST;',
        '',
      ].join('\n'),
    },
  },
  {
    name: 'request scope alias as operational-context authority',
    expectedPath: 'src/modules/access/infrastructure/request-context-alias.ts',
    expectedRules: ['D5-R029'],
    expectedText: 'request scope cannot be operational-context authority',
    files: {
      'src/modules/access/infrastructure/request-context-alias.ts': [
        "import { Scope as NestScope } from '@nestjs/common';",
        'export const operationalContextScope = NestScope.REQUEST;',
        '',
      ].join('\n'),
    },
  },
  {
    name: 'request scope namespace as operational-context authority',
    expectedPath: 'src/modules/access/infrastructure/request-context-namespace.ts',
    expectedRules: ['D5-R029'],
    expectedText: 'request scope cannot be operational-context authority',
    files: {
      'src/modules/access/infrastructure/request-context-namespace.ts': [
        "import * as Nest from '@nestjs/common';",
        'export const operationalContextScope = Nest.Scope.REQUEST;',
        '',
      ].join('\n'),
    },
  },
  {
    name: 'controller decides final authorization',
    expectedRules: ['D5-R035', 'D5-R036'],
    expectedPath: 'src/modules/access/presentation/http/authority.ts',
    expectedText: 'controller decides trusted context or final authorization',
    files: {
      'src/modules/access/presentation/http/authority.ts': [
        "import { Controller, Get } from '@nestjs/common';",
        '@Controller()',
        'export class AuthorityController {',
        '  @Get()',
        '  decideAuthorization(): boolean { return true; }',
        '}',
        '',
      ].join('\n'),
    },
  },
  {
    name: 'controller alias decides final authorization',
    expectedRules: ['D5-R035', 'D5-R036'],
    expectedPath: 'src/modules/access/presentation/http/authority-alias.ts',
    expectedText: 'controller decides trusted context or final authorization',
    files: {
      'src/modules/access/presentation/http/authority-alias.ts': [
        "import { Controller as HttpController } from '@nestjs/common';",
        '@HttpController()',
        'export class AuthorityController {',
        '  decideAuthorization(): boolean { return true; }',
        '}',
        '',
      ].join('\n'),
    },
  },
  {
    name: 'controller namespace decides final authorization',
    expectedRules: ['D5-R035', 'D5-R036'],
    expectedPath: 'src/modules/access/presentation/http/authority-namespace.ts',
    expectedText: 'controller decides trusted context or final authorization',
    files: {
      'src/modules/access/presentation/http/authority-namespace.ts': [
        "import * as Nest from '@nestjs/common';",
        '@Nest.Controller()',
        'export class AuthorityController {',
        '  decideAuthorization(): boolean { return true; }',
        '}',
        '',
      ].join('\n'),
    },
  },
  {
    name: 'parenthesized forwardRef direct usage',
    expectedPath: 'src/modules/access/access.module.ts',
    expectedRules: ['D5-R025'],
    expectedText: 'forwardRef is forbidden',
    files: {
      'src/modules/access/access.module.ts': [
        "import { forwardRef, Module } from '@nestjs/common';",
        '@Module({ imports: [((forwardRef))(() => class {})] })',
        'export class AccessModule {}',
        '',
      ].join('\n'),
    },
    coverage: {
      ids: ['fixture:D5-R025:parenthesized:direct'],
      evidence: ['((forwardRef))'],
    },
  },
  {
    name: 'nested transparent forwardRef alias usage',
    expectedPath: 'src/modules/access/access.module.ts',
    expectedRules: ['D5-R025'],
    expectedText: 'forwardRef is forbidden',
    files: {
      'src/modules/access/access.module.ts': [
        "import { forwardRef as nestForwardRef, Module } from '@nestjs/common';",
        '@Module({',
        '  imports: [((nestForwardRef as typeof nestForwardRef))(() => class {})],',
        '})',
        'export class AccessModule {}',
        '',
      ].join('\n'),
    },
    coverage: {
      ids: ['fixture:D5-R025:transparent:alias'],
      evidence: ['((nestForwardRef as typeof nestForwardRef))'],
    },
  },
  {
    name: 'transparent namespace forwardRef usage',
    expectedPath: 'src/modules/access/access.module.ts',
    expectedRules: ['D5-R025'],
    expectedText: 'forwardRef is forbidden',
    files: {
      'src/modules/access/access.module.ts': [
        "import { Module } from '@nestjs/common';",
        "import * as Nest from '@nestjs/common';",
        '@Module({',
        '  imports: [((<typeof Nest>Nest).forwardRef)(() => class {})],',
        '})',
        'export class AccessModule {}',
        '',
      ].join('\n'),
    },
    coverage: {
      ids: ['fixture:D5-R025:transparent:namespace'],
      evidence: ['((<typeof Nest>Nest).forwardRef)'],
    },
  },
  {
    name: 'parenthesized Global direct decorator',
    expectedPath: 'src/modules/access/access.module.ts',
    expectedRules: ['D5-R027'],
    expectedText: 'global Nest modules',
    files: {
      'src/modules/access/access.module.ts': [
        "import { Global, Module } from '@nestjs/common';",
        '@((Global))()',
        '@Module({})',
        'export class AccessModule {}',
        '',
      ].join('\n'),
    },
    coverage: {
      ids: ['fixture:D5-R027:parenthesized:direct'],
      evidence: ['@((Global))()'],
    },
  },
  {
    name: 'nested transparent Global alias decorator',
    expectedPath: 'src/modules/access/access.module.ts',
    expectedRules: ['D5-R027'],
    expectedText: 'global Nest modules',
    files: {
      'src/modules/access/access.module.ts': [
        "import { Global as NestGlobal, Module } from '@nestjs/common';",
        '@((NestGlobal!))()',
        '@Module({})',
        'export class AccessModule {}',
        '',
      ].join('\n'),
    },
    coverage: {
      ids: ['fixture:D5-R027:transparent:alias'],
      evidence: ['@((NestGlobal!))()'],
    },
  },
  {
    name: 'transparent namespace Global decorator',
    expectedPath: 'src/modules/access/access.module.ts',
    expectedRules: ['D5-R027'],
    expectedText: 'global Nest modules',
    files: {
      'src/modules/access/access.module.ts': [
        "import { Module } from '@nestjs/common';",
        "import * as Nest from '@nestjs/common';",
        '@(((Nest as typeof Nest).Global))()',
        '@Module({})',
        'export class AccessModule {}',
        '',
      ].join('\n'),
    },
    coverage: {
      ids: ['fixture:D5-R027:transparent:namespace'],
      evidence: ['@(((Nest as typeof Nest).Global))()'],
    },
  },
  {
    name: 'parenthesized request Scope direct authority',
    expectedPath: 'src/modules/access/infrastructure/request-context-direct-wrapper.ts',
    expectedRules: ['D5-R029'],
    expectedText: 'request scope cannot be operational-context authority',
    files: {
      'src/modules/access/infrastructure/request-context-direct-wrapper.ts': [
        "import { Scope } from '@nestjs/common';",
        'export const operationalContextScope = ((Scope)).REQUEST;',
        '',
      ].join('\n'),
    },
    coverage: {
      ids: ['fixture:D5-R029:parenthesized:direct'],
      evidence: ['((Scope)).REQUEST'],
    },
  },
  {
    name: 'nested transparent request Scope alias authority',
    expectedPath: 'src/modules/access/infrastructure/request-context-alias-wrapper.ts',
    expectedRules: ['D5-R029'],
    expectedText: 'request scope cannot be operational-context authority',
    files: {
      'src/modules/access/infrastructure/request-context-alias-wrapper.ts': [
        "import { Scope as NestScope } from '@nestjs/common';",
        'export const operationalContextScope =',
        '  ((NestScope satisfies typeof NestScope)).REQUEST;',
        '',
      ].join('\n'),
    },
    coverage: {
      ids: ['fixture:D5-R029:transparent:alias'],
      evidence: ['((NestScope satisfies typeof NestScope)).REQUEST'],
    },
  },
  {
    name: 'transparent namespace request Scope authority',
    expectedPath:
      'src/modules/access/infrastructure/request-context-namespace-wrapper.ts',
    expectedRules: ['D5-R029'],
    expectedText: 'request scope cannot be operational-context authority',
    files: {
      'src/modules/access/infrastructure/request-context-namespace-wrapper.ts': [
        "import * as Nest from '@nestjs/common';",
        'export const operationalContextScope = ((Nest.Scope)).REQUEST;',
        '',
      ].join('\n'),
    },
    coverage: {
      ids: ['fixture:D5-R029:transparent:namespace'],
      evidence: ['((Nest.Scope)).REQUEST'],
    },
  },
  {
    name: 'parenthesized Controller direct decorator',
    expectedPath:
      'src/modules/access/presentation/http/direct-wrapper-controller.ts',
    expectedRules: ['D5-R035'],
    expectedText: 'controllers are outside',
    files: {
      'src/modules/access/presentation/http/direct-wrapper-controller.ts': [
        "import { Controller } from '@nestjs/common';",
        '@((Controller))()',
        'export class HttpSurface {}',
        '',
      ].join('\n'),
    },
    coverage: {
      ids: ['fixture:D5-R035:controller-parenthesized:direct'],
      evidence: ['@((Controller))()'],
    },
  },
  {
    name: 'nested transparent Controller alias decorator',
    expectedPath:
      'src/modules/access/presentation/http/alias-wrapper-controller.ts',
    expectedRules: ['D5-R035'],
    expectedText: 'controllers are outside',
    files: {
      'src/modules/access/presentation/http/alias-wrapper-controller.ts': [
        "import { Controller as HttpController } from '@nestjs/common';",
        '@((HttpController as typeof HttpController))()',
        'export class HttpSurface {}',
        '',
      ].join('\n'),
    },
    coverage: {
      ids: ['fixture:D5-R035:controller-transparent:alias'],
      evidence: ['@((HttpController as typeof HttpController))()'],
    },
  },
  {
    name: 'transparent namespace Controller decorator',
    expectedPath:
      'src/modules/access/presentation/http/namespace-wrapper-controller.ts',
    expectedRules: ['D5-R035'],
    expectedText: 'controllers are outside',
    files: {
      'src/modules/access/presentation/http/namespace-wrapper-controller.ts': [
        "import * as Nest from '@nestjs/common';",
        '@(((Nest as typeof Nest).Controller))()',
        'export class HttpSurface {}',
        '',
      ].join('\n'),
    },
    coverage: {
      ids: ['fixture:D5-R035:controller-transparent:namespace'],
      evidence: ['@(((Nest as typeof Nest).Controller))()'],
    },
  },
  {
    name: 'parenthesized HTTP direct decorator',
    expectedPath:
      'src/modules/access/presentation/http/direct-wrapper-endpoint.ts',
    expectedRules: ['D5-R035'],
    expectedText: 'HTTP endpoints are outside',
    files: {
      'src/modules/access/presentation/http/direct-wrapper-endpoint.ts': [
        "import { Get } from '@nestjs/common';",
        'export class Endpoint {',
        '  @((Get))()',
        '  run(): void {}',
        '}',
        '',
      ].join('\n'),
    },
    coverage: {
      ids: ['fixture:D5-R035:endpoint-parenthesized:direct'],
      evidence: ['@((Get))()'],
    },
  },
  {
    name: 'nested transparent HTTP alias decorator',
    expectedPath:
      'src/modules/access/presentation/http/alias-wrapper-endpoint.ts',
    expectedRules: ['D5-R035'],
    expectedText: 'HTTP endpoints are outside',
    files: {
      'src/modules/access/presentation/http/alias-wrapper-endpoint.ts': [
        "import { Get as HttpGet } from '@nestjs/common';",
        'export class Endpoint {',
        '  @((HttpGet!))()',
        '  run(): void {}',
        '}',
        '',
      ].join('\n'),
    },
    coverage: {
      ids: ['fixture:D5-R035:endpoint-transparent:alias'],
      evidence: ['@((HttpGet!))()'],
    },
  },
  {
    name: 'transparent namespace HTTP decorator',
    expectedPath:
      'src/modules/access/presentation/http/namespace-wrapper-endpoint.ts',
    expectedRules: ['D5-R035'],
    expectedText: 'HTTP endpoints are outside',
    files: {
      'src/modules/access/presentation/http/namespace-wrapper-endpoint.ts': [
        "import * as Nest from '@nestjs/common';",
        'export class Endpoint {',
        '  @((Nest.Get))()',
        '  run(): void {}',
        '}',
        '',
      ].join('\n'),
    },
    coverage: {
      ids: ['fixture:D5-R035:endpoint-transparent:namespace'],
      evidence: ['@((Nest.Get))()'],
    },
  },
  {
    name: 'transparent Controller alias decides final authorization',
    expectedPath:
      'src/modules/access/presentation/http/wrapper-authority.ts',
    expectedRules: ['D5-R035', 'D5-R036'],
    expectedText: 'controller decides trusted context or final authorization',
    files: {
      'src/modules/access/presentation/http/wrapper-authority.ts': [
        "import { Controller as HttpController } from '@nestjs/common';",
        '@((HttpController as typeof HttpController))()',
        'export class AuthorityController {',
        '  decideAuthorization(): boolean { return true; }',
        '}',
        '',
      ].join('\n'),
    },
    coverage: {
      ids: ['fixture:D5-R036:controller-transparent:authority'],
      evidence: [
        '@((HttpController as typeof HttpController))()',
        'decideAuthorization',
      ],
    },
  },
  {
    name: 'transparent ModuleRef type references remain rejected',
    expectedPath: 'src/modules/access/access.module.ts',
    expectedRules: ['D5-R026'],
    expectedText: 'ModuleRef',
    files: {
      'src/modules/access/access.module.ts': [
        "import { Module } from '@nestjs/common';",
        "import { ModuleRef, ModuleRef as NestModuleRef } from '@nestjs/core';",
        "import * as NestCore from '@nestjs/core';",
        '@Module({})',
        'export class AccessModule {',
        '  constructor(',
        '    readonly direct: (ModuleRef),',
        '    readonly alias: (NestModuleRef),',
        '    readonly namespace: (NestCore.ModuleRef),',
        '  ) {}',
        '}',
        '',
      ].join('\n'),
    },
    coverage: {
      ids: ['fixture:D5-R026:transparent-types:control'],
      evidence: [
        'readonly direct: (ModuleRef)',
        'readonly alias: (NestModuleRef)',
        'readonly namespace: (NestCore.ModuleRef)',
      ],
    },
  },
  {
    name: 'ordinary global properties are not Nest global modules',
    expectedRules: [],
    files: {
      'src/modules/access/domain/global-options.ts': [
        'const configure = (value: unknown): unknown => value;',
        "export const settings = { global: true, label: 'local' };",
        'export const nested = { transport: { global: true } };',
        'export function options(): { readonly global: boolean } {',
        '  return { global: true };',
        '}',
        'export const configured = configure({ global: true });',
        '',
      ].join('\n'),
    },
    coverage: {
      ids: ['fixture:D5-R027:ordinary-global:positive'],
      evidence: [
        "settings = { global: true, label: 'local' }",
        'transport: { global: true }',
        'return { global: true }',
        'configure({ global: true })',
      ],
    },
  },
  {
    name: 'parenthesized Nest-like symbols from another package are ignored',
    expectedRules: [],
    files: {
      'src/modules/access/presentation/http/wrong-package-wrappers.ts': [
        "import { Controller, forwardRef, Get, Global, Scope } from '@example/nest-like';",
        '@((Global))()',
        '@((Controller))()',
        'export class ExternalSurface {',
        '  readonly context = ((Scope)).REQUEST;',
        '  readonly reference = ((forwardRef))(() => ExternalSurface);',
        '  @((Get))() read(): void {}',
        '}',
        '',
      ].join('\n'),
    },
    coverage: {
      ids: ['fixture:nest-identity:wrong-package-parenthesized:positive'],
      evidence: [
        "from '@example/nest-like'",
        '@((Global))()',
        '@((Controller))()',
        '((Scope)).REQUEST',
        '((forwardRef))',
        '@((Get))()',
      ],
    },
  },
  {
    name: 'parenthesized shadowed Nest imports are ignored',
    expectedRules: [],
    files: {
      'src/modules/access/presentation/http/shadowed-wrappers.ts': [
        "import { Controller as ImportedController, forwardRef as importedForwardRef, Get as ImportedGet, Global as ImportedGlobal, Scope as ImportedScope } from '@nestjs/common';",
        "import * as ImportedNest from '@nestjs/common';",
        'export function inspectNamed(',
        '  ImportedController: () => ClassDecorator,',
        '  importedForwardRef: (callback: () => unknown) => unknown,',
        '  ImportedGet: () => MethodDecorator,',
        '  ImportedGlobal: () => ClassDecorator,',
        '  ImportedScope: { readonly REQUEST: string },',
        '): string {',
        '  @((ImportedGlobal))()',
        '  @((ImportedController))()',
        '  class LocalSurface { @((ImportedGet))() read(): void {} }',
        '  ((importedForwardRef))(() => LocalSurface);',
        '  return ((ImportedScope)).REQUEST;',
        '}',
        'export function inspectNamespace(',
        '  ImportedNest: {',
        '    Controller(): ClassDecorator;',
        '    readonly Scope: { readonly REQUEST: string };',
        '  },',
        '): string {',
        '  @((ImportedNest.Controller))()',
        '  class LocalSurface {}',
        '  void LocalSurface;',
        '  return ((ImportedNest.Scope)).REQUEST;',
        '}',
        '',
      ].join('\n'),
    },
    coverage: {
      ids: ['fixture:nest-identity:shadowing-parenthesized:positive'],
      evidence: [
        '@((ImportedController))()',
        '((importedForwardRef))',
        '((ImportedScope)).REQUEST',
        '@((ImportedNest.Controller))()',
      ],
    },
  },
  {
    name: 'parenthesized local homonyms comments and strings are ignored',
    expectedRules: [],
    files: {
      'src/modules/access/presentation/http/local-wrapper-evidence.ts': [
        'const Scope = { REQUEST: "local" } as const;',
        'function Controller(): ClassDecorator { return () => undefined; }',
        'function Get(): MethodDecorator { return () => undefined; }',
        'function Global(): ClassDecorator { return () => undefined; }',
        'function forwardRef(callback: () => unknown): unknown { return callback; }',
        '// @((Global))() @((Controller))() @((Get))() ((Scope)).REQUEST',
        "export const evidence = '@((Global))() @((Controller))() @((Get))() ((Scope)).REQUEST';",
        '@((Global))()',
        '@((Controller))()',
        'export class LocalSurface {',
        '  readonly context = ((Scope)).REQUEST;',
        '  readonly reference = ((forwardRef))(() => LocalSurface);',
        '  @((Get))() read(): void {}',
        '}',
        '',
      ].join('\n'),
    },
    coverage: {
      ids: ['fixture:nest-identity:text-local-parenthesized:positive'],
      evidence: [
        '// @((Global))()',
        "evidence = '@((Global))()",
        'function Controller()',
        'readonly context = ((Scope)).REQUEST',
      ],
    },
  },
].map((fixtureCase) => ({
  ...fixtureCase,
  expectedPath:
    fixtureCase.expectedPath ?? expectedPathByFixtureName[fixtureCase.name],
}));
