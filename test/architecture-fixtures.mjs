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
    'export class TrustedStationContextError extends Error {}',
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

const directedAccessModule = [
  "import { Module } from '@nestjs/common';",
  "import { RuntimeInfrastructureModule } from '../../infrastructure/runtime/runtime-infrastructure.module.js';",
  "import { StationsModule } from '../stations/stations.module.js';",
  "import { TenancyModule } from '../tenancy/tenancy.module.js';",
  "import { UsersModule } from '../users/users.module.js';",
  "import { ADMIN_INVITATION_BRANCH_COMMIT_VALIDATOR, BRANCH_ADMINISTRATION_RUNTIME, BRANCH_SETTINGS_RUNTIME } from '../stations/index.js';",
  "import type { AdminInvitationBranchCommitValidator, BranchAdministrationRuntime, BranchSettingsRuntime } from '../stations/index.js';",
  "import { STATION_ADMINISTRATION_RUNTIME } from '../stations/index.js';",
  "import type { StationAdministrationRuntime } from '../stations/index.js';",
  "import { TRUSTED_STATION_ADMISSION_VALIDATOR, TRUSTED_STATION_CONTEXT_RESOLVER } from '../stations/index.js';",
  "import type { TrustedStationAdmissionValidator, TrustedStationContextResolver } from '../stations/index.js';",
  "import { ADMIN_INVITATION_USER_COMMIT_RUNTIME, AUTHENTICATION_USER_ADMISSION_VALIDATOR, AUTHENTICATION_USER_READER, USER_PREFERENCES_RUNTIME, USER_PRODUCT_RUNTIME } from '../users/index.js';",
  "import { TENANT_BOOTSTRAP_USER_WRITER } from '../users/index.js';",
  "import type { AdminInvitationUserCommitRuntime, AuthenticationUserAdmissionValidator, AuthenticationUserReader, TenantBootstrapUserWriter, UserPreferencesRuntime, UserProductRuntime } from '../users/index.js';",
  "import { TENANT_BOOTSTRAP_PERSISTENCE, TENANT_LIFECYCLE_COMMIT_RUNTIME } from '../tenancy/index.js';",
  "import type { TenantBootstrapPersistence, TenantLifecycleCommitRuntime } from '../tenancy/index.js';",
  '@Module({',
  '  imports: [RuntimeInfrastructureModule, StationsModule, TenancyModule, UsersModule],',
  '  providers: [{',
  "    provide: 'DIRECTED_COMPOSITION_PROBE',",
  '    inject: [TRUSTED_STATION_ADMISSION_VALIDATOR, TRUSTED_STATION_CONTEXT_RESOLVER, AUTHENTICATION_USER_ADMISSION_VALIDATOR, AUTHENTICATION_USER_READER, USER_PREFERENCES_RUNTIME, USER_PRODUCT_RUNTIME],',
  '    useFactory: (stationAdmission: TrustedStationAdmissionValidator, stations: TrustedStationContextResolver, userAdmission: AuthenticationUserAdmissionValidator, users: AuthenticationUserReader, preferences: UserPreferencesRuntime, userProduct: UserProductRuntime) => ({ stationAdmission, stations, userAdmission, users, preferences, userProduct }),',
  '  }, {',
  "    provide: 'BRANCH_ADMINISTRATION_PROBE',",
  '    inject: [BRANCH_ADMINISTRATION_RUNTIME],',
  '    useFactory: (branchAdministration: BranchAdministrationRuntime) => ({ branchAdministration }),',
  '  }, {',
  "    provide: 'STATION_ADMINISTRATION_PROBE',",
  '    inject: [STATION_ADMINISTRATION_RUNTIME],',
  '    useFactory: (stationAdministration: StationAdministrationRuntime) => ({ stationAdministration }),',
  '  }, {',
  "    provide: 'BRANCH_RUNTIME_PROBE',",
  '    inject: [BRANCH_SETTINGS_RUNTIME],',
  '    useFactory: (branchSettings: BranchSettingsRuntime) => ({ branchSettings }),',
  '  }, {',
  "    provide: 'ADMIN_INVITATION_COMMIT_PROBE',",
  '    inject: [ADMIN_INVITATION_BRANCH_COMMIT_VALIDATOR, ADMIN_INVITATION_USER_COMMIT_RUNTIME, TENANT_LIFECYCLE_COMMIT_RUNTIME],',
  '    useFactory: (branches: AdminInvitationBranchCommitValidator, users: AdminInvitationUserCommitRuntime, tenants: TenantLifecycleCommitRuntime) => ({ branches, users, tenants }),',
  '  }, {',
  "    provide: 'TENANT_BOOTSTRAP_PROBE',",
  '    inject: [TENANT_BOOTSTRAP_PERSISTENCE, TENANT_BOOTSTRAP_USER_WRITER],',
  '    useFactory: (persistence: TenantBootstrapPersistence, users: TenantBootstrapUserWriter) => ({ persistence, users }),',
  '  }],',
  '})',
  'export class AccessModule {}',
  '',
].join('\n');

const directedStationsIndex = [
  "import type { TenancyModuleContract } from '../tenancy/index.js';",
  'export class TrustedStationContextError extends Error {}',
  'export interface TrustedStationContext {',
  '  readonly tenantId: string;',
  '  readonly branchId: string;',
  '  readonly stationId: string;',
  '}',
  'export interface TrustedStationContextResolver {',
  '  resolve(cookie: string | undefined): Promise<TrustedStationContext>;',
  '}',
  'export interface TrustedStationAdmissionValidator {',
  '  validateTrustedStationAdmission(context: TrustedStationContext, expected: object, transactionContext: object): Promise<object | null>;',
  '}',
  "export const TRUSTED_STATION_ADMISSION_VALIDATOR: unique symbol = Symbol('fixture.station-admission');",
  "export const TRUSTED_STATION_CONTEXT_RESOLVER: unique symbol = Symbol('fixture.station-resolver');",
  "export const BRANCH_SETTINGS_RUNTIME: unique symbol = Symbol('fixture.branch-settings');",
  "export const BRANCH_ADMINISTRATION_RUNTIME: unique symbol = Symbol('fixture.branch-administration');",
  "export const STATION_ADMINISTRATION_RUNTIME: unique symbol = Symbol('fixture.station-administration');",
  "export const ADMIN_INVITATION_BRANCH_COMMIT_VALIDATOR: unique symbol = Symbol('fixture.admin-invitation-branch-commit-validator');",
  'export interface AdminInvitationBranchCommitValidator { readonly validate: unknown; }',
  'export interface BranchAdministrationRuntime { readonly list: unknown; }',
  'export interface StationAdministrationRuntime { readonly list: unknown; }',
  'export interface BranchSettingsRuntime {',
  '  readTimeZone(scope: object): Promise<object | null>;',
  '  updateTimeZone(scope: object, timeZone: unknown): Promise<object>;',
  '}',
  'export function isTrustedStationContext(value: unknown): value is TrustedStationContext { return typeof value === "object"; }',
  'export interface StationsModuleContract {',
  "  readonly module: 'stations';",
  '  readonly tenancy: TenancyModuleContract;',
  '}',
  '',
].join('\n');

const directedStationsModule = [
  "import { Module } from '@nestjs/common';",
  "import { RuntimeInfrastructureModule } from '../../infrastructure/runtime/runtime-infrastructure.module.js';",
  "import { TenancyModule } from '../tenancy/tenancy.module.js';",
  "import { TENANT_LIFECYCLE_COMMIT_RUNTIME } from '../tenancy/index.js';",
  "import type { TenantLifecycleCommitRuntime } from '../tenancy/index.js';",
  "import { ADMIN_INVITATION_BRANCH_COMMIT_VALIDATOR, BRANCH_ADMINISTRATION_RUNTIME, BRANCH_SETTINGS_RUNTIME } from './index.js';",
  "import type { AdminInvitationBranchCommitValidator, BranchAdministrationRuntime, BranchSettingsRuntime } from './index.js';",
  "import { STATION_ADMINISTRATION_RUNTIME } from './index.js';",
  "import type { StationAdministrationRuntime } from './index.js';",
  "import { TRUSTED_STATION_ADMISSION_VALIDATOR, TRUSTED_STATION_CONTEXT_RESOLVER } from './index.js';",
  "import type { TrustedStationAdmissionValidator, TrustedStationContextResolver } from './index.js';",
  '@Module({',
  '  imports: [RuntimeInfrastructureModule, TenancyModule],',
  '  providers: [{',
  '    provide: ADMIN_INVITATION_BRANCH_COMMIT_VALIDATOR,',
  '    useFactory: (): AdminInvitationBranchCommitValidator => ({ validate: async () => null }),',
  '  }, {',
  '    provide: BRANCH_ADMINISTRATION_RUNTIME,',
  '    inject: [TENANT_LIFECYCLE_COMMIT_RUNTIME],',
  '    useFactory: (tenants: TenantLifecycleCommitRuntime): BranchAdministrationRuntime => ({ list: tenants.activate }),',
  '  }, {',
  '    provide: STATION_ADMINISTRATION_RUNTIME,',
  '    useFactory: (): StationAdministrationRuntime => ({ list: async () => [] }),',
  '  }, {',
  '    provide: BRANCH_SETTINGS_RUNTIME,',
  '    useFactory: (): BranchSettingsRuntime => ({ readTimeZone: async () => null, updateTimeZone: async () => ({}) }),',
  '  }, {',
  '    provide: TRUSTED_STATION_ADMISSION_VALIDATOR,',
  '    useFactory: (): TrustedStationAdmissionValidator => ({ validateTrustedStationAdmission: async () => null }),',
  '  }, {',
  '    provide: TRUSTED_STATION_CONTEXT_RESOLVER,',
  '    useFactory: (): TrustedStationContextResolver => ({ resolve: async () => { throw new Error("fixture"); } }),',
  '  }],',
  '  exports: [ADMIN_INVITATION_BRANCH_COMMIT_VALIDATOR, BRANCH_ADMINISTRATION_RUNTIME, STATION_ADMINISTRATION_RUNTIME, BRANCH_SETTINGS_RUNTIME, TRUSTED_STATION_ADMISSION_VALIDATOR, TRUSTED_STATION_CONTEXT_RESOLVER],',
  '})',
  'export class StationsModule {}',
  '',
].join('\n');

const directedUsersIndex = [
  "import type { TenantId } from '../tenancy/index.js';",
  "export const AUTHENTICATION_USER_ADMISSION_VALIDATOR: unique symbol = Symbol('fixture.user-admission');",
  "export const AUTHENTICATION_USER_READER: unique symbol = Symbol('fixture.user-reader');",
  "export const USER_PREFERENCES_RUNTIME: unique symbol = Symbol('fixture.user-preferences');",
  "export const USER_PRODUCT_RUNTIME: unique symbol = Symbol('fixture.user-product');",
  "export const TENANT_BOOTSTRAP_USER_WRITER: unique symbol = Symbol('fixture.tenant-bootstrap-user-writer');",
  "export const ADMIN_INVITATION_USER_COMMIT_RUNTIME: unique symbol = Symbol('fixture.admin-invitation-user-commit-runtime');",
  'export interface AdminInvitationUserCommitRuntime { readonly create: unknown; }',
  'export interface AuthenticationUserScope { readonly tenantId: TenantId; }',
  'export interface AuthenticationUserRecord { readonly userId: string; }',
  'export interface AuthenticationUserReader {',
  '  findAuthenticationUser(scope: AuthenticationUserScope, userId: string): Promise<AuthenticationUserRecord | null>;',
  '}',
  'export interface AuthenticationUserAdmissionValidator {',
  '  validateAuthenticationUserAdmission(scope: AuthenticationUserScope, userId: string, expectedVersion: number, expectedAdmissionRevision: number, transactionContext: object): Promise<object | null>;',
  '}',
  'export interface UserPreferencesRuntime { readonly read: unknown; readonly save: unknown; }',
  'export interface UserProductRuntime { readonly list: unknown; }',
  'export interface TenantBootstrapUserWriter { readonly create: unknown; }',
  "export interface UsersModuleContract { readonly module: 'users'; }",
  '',
].join('\n');

const directedUsersModule = [
  "import { Module } from '@nestjs/common';",
  "import { ADMIN_INVITATION_USER_COMMIT_RUNTIME, AUTHENTICATION_USER_ADMISSION_VALIDATOR, AUTHENTICATION_USER_READER, TENANT_BOOTSTRAP_USER_WRITER, USER_PREFERENCES_RUNTIME, USER_PRODUCT_RUNTIME } from './index.js';",
  "import type { AdminInvitationUserCommitRuntime, AuthenticationUserAdmissionValidator, AuthenticationUserReader, TenantBootstrapUserWriter, UserPreferencesRuntime, UserProductRuntime } from './index.js';",
  '@Module({',
  '  providers: [{',
  '    provide: ADMIN_INVITATION_USER_COMMIT_RUNTIME,',
  '    useFactory: (): AdminInvitationUserCommitRuntime => ({ create: async () => ({}) }),',
  '  }, {',
  '    provide: AUTHENTICATION_USER_ADMISSION_VALIDATOR,',
  '    useFactory: (): AuthenticationUserAdmissionValidator => ({ validateAuthenticationUserAdmission: async () => null }),',
  '  }, {',
  '    provide: AUTHENTICATION_USER_READER,',
  '    useFactory: (): AuthenticationUserReader => ({ findAuthenticationUser: async () => null }),',
  '  }, {',
  '    provide: USER_PREFERENCES_RUNTIME,',
  '    useFactory: (): UserPreferencesRuntime => ({ read: async () => null, save: async () => ({}) }),',
  '  }, {',
  '    provide: USER_PRODUCT_RUNTIME,',
  '    useFactory: (): UserProductRuntime => ({ list: async () => [] }),',
  '  }, {',
  '    provide: TENANT_BOOTSTRAP_USER_WRITER,',
  '    useFactory: (): TenantBootstrapUserWriter => ({ create: async () => ({}) }),',
  '  }],',
  '  exports: [ADMIN_INVITATION_USER_COMMIT_RUNTIME, AUTHENTICATION_USER_ADMISSION_VALIDATOR, AUTHENTICATION_USER_READER, USER_PREFERENCES_RUNTIME, USER_PRODUCT_RUNTIME, TENANT_BOOTSTRAP_USER_WRITER],',
  '})',
  'export class UsersModule {}',
  '',
].join('\n');

const directedTenancyIndex = [
  "export const TENANT_BOOTSTRAP_PERSISTENCE: unique symbol = Symbol('fixture.tenant-bootstrap-persistence');",
  "export const TENANT_LIFECYCLE_COMMIT_RUNTIME: unique symbol = Symbol('fixture.tenant-lifecycle-commit-runtime');",
  "export const TENANT_SETTINGS_RUNTIME: unique symbol = Symbol('fixture.tenant-settings-runtime');",
  'export interface TenantBootstrapPersistence { readonly execute: unknown; }',
  'export interface TenantLifecycleCommitRuntime { readonly activate: unknown; }',
  'export interface TenantSettingsRuntime { readonly read: unknown; }',
  'export interface TenancyModuleContract {',
  "  readonly module: 'tenancy';",
  '}',
  '',
].join('\n');

const directedTenancyModule = [
  "import { Module } from '@nestjs/common';",
  "import { TENANT_BOOTSTRAP_PERSISTENCE, TENANT_LIFECYCLE_COMMIT_RUNTIME, TENANT_SETTINGS_RUNTIME } from './index.js';",
  "import type { TenantBootstrapPersistence, TenantLifecycleCommitRuntime, TenantSettingsRuntime } from './index.js';",
  '@Module({',
  '  providers: [{',
  '    provide: TENANT_BOOTSTRAP_PERSISTENCE,',
  '    useFactory: (): TenantBootstrapPersistence => ({ execute: async () => ({}) }),',
  '  }, {',
  '    provide: TENANT_LIFECYCLE_COMMIT_RUNTIME,',
  '    useFactory: (): TenantLifecycleCommitRuntime => ({ activate: async () => ({}) }),',
  '  }, {',
  '    provide: TENANT_SETTINGS_RUNTIME,',
  '    useFactory: (): TenantSettingsRuntime => ({ read: async () => null }),',
  '  }],',
  '  exports: [TENANT_BOOTSTRAP_PERSISTENCE, TENANT_LIFECYCLE_COMMIT_RUNTIME, TENANT_SETTINGS_RUNTIME],',
  '})',
  'export class TenancyModule {}',
  '',
].join('\n');

const validDirectedCompositionFiles = {
  'src/modules/access/access.module.ts': directedAccessModule,
  'src/modules/stations/index.ts': directedStationsIndex,
  'src/modules/stations/stations.module.ts': directedStationsModule,
  'src/modules/users/index.ts': directedUsersIndex,
  'src/modules/users/users.module.ts': directedUsersModule,
  'src/modules/tenancy/index.ts': directedTenancyIndex,
  'src/modules/tenancy/tenancy.module.ts': directedTenancyModule,
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
  'controller inside infrastructure':
    'src/modules/access/infrastructure/probe.controller.ts',
  'controller inside shared': 'src/shared/probe.controller.ts',
  'controller in undeclared module': 'src/modules/inventory',
  'unauthorized endpoint': 'src/modules/access/presentation/http/endpoint.ts',
  'authorized health surface with additional route':
    'src/health/health.controller.ts',
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
    name: 'authorized health surface',
    expectedRules: [],
    files: {
      'src/health/health.controller.ts': [
        "import { Controller, Get } from '@nestjs/common';",
        '@Controller()',
        'export class HealthController {',
        "  @Get('livez') livez(): object { return {}; }",
        "  @Get('readyz') readyz(): object { return {}; }",
        '}',
        '',
      ].join('\n'),
    },
  },
  {
    name: 'authorized health surface with additional route',
    expectedRules: ['D5-R035'],
    expectedText: 'exactly GET /livez and GET /readyz',
    files: {
      'src/health/health.controller.ts': [
        "import { Controller, Get } from '@nestjs/common';",
        '@Controller()',
        'export class HealthController {',
        "  @Get('livez') livez(): object { return {}; }",
        "  @Get('readyz') readyz(): object { return {}; }",
        "  @Get('status') status(): object { return {}; }",
        '}',
        '',
      ].join('\n'),
    },
  },
  {
    name: 'allowed graph through public indexes',
    expectedRules: [],
  },
  {
    name: 'registered directed module composition',
    expectedRules: [],
    files: validDirectedCompositionFiles,
  },
  {
    name: 'directed composition graph edge without registry',
    expectedPath: 'src/modules/stations/stations.module.ts',
    expectedRules: ['D5-R024'],
    expectedText: 'not explicitly registered|unregistered modules',
    files: {
      ...validDirectedCompositionFiles,
      'src/modules/stations/stations.module.ts': [
        "import { UsersModule } from '../users/users.module.js';",
        directedStationsModule.replace(
          'imports: [RuntimeInfrastructureModule, TenancyModule]',
          'imports: [RuntimeInfrastructureModule, TenancyModule, UsersModule]',
        ),
      ].join('\n'),
    },
  },
  {
    name: 'directed composition module alias',
    expectedPath: 'src/modules/access/access.module.ts',
    expectedRules: ['D5-R024'],
    expectedText: 'unaliased value import|missing registered modules',
    files: {
      ...validDirectedCompositionFiles,
      'src/modules/access/access.module.ts': directedAccessModule
        .replace(
          'import { StationsModule }',
          'import { StationsModule as StationComposition }',
        )
        .replace(
          'imports: [RuntimeInfrastructureModule, StationsModule, TenancyModule, UsersModule]',
          'imports: [RuntimeInfrastructureModule, StationComposition, TenancyModule, UsersModule]',
        ),
    },
  },
  {
    name: 'directed composition namespace module import',
    expectedPath: 'src/modules/access/access.module.ts',
    expectedRules: ['D5-R024'],
    expectedText: 'static named import|direct module identifiers',
    files: {
      ...validDirectedCompositionFiles,
      'src/modules/access/access.module.ts': directedAccessModule
        .replace(
          "import { StationsModule } from '../stations/stations.module.js';",
          "import * as StationsComposition from '../stations/stations.module.js';",
        )
        .replace(
          'imports: [RuntimeInfrastructureModule, StationsModule, TenancyModule, UsersModule]',
          'imports: [RuntimeInfrastructureModule, StationsComposition.StationsModule, TenancyModule, UsersModule]',
        ),
    },
  },
  {
    name: 'directed composition dynamic module import',
    expectedPath: 'src/modules/access/access.module.ts',
    expectedRules: ['D5-R024'],
    expectedText: 'static named import|missing registered modules',
    files: {
      ...validDirectedCompositionFiles,
      'src/modules/access/access.module.ts': directedAccessModule
        .replace(
          "import { StationsModule } from '../stations/stations.module.js';",
          "void import('../stations/stations.module.js');",
        )
        .replace(
          'imports: [RuntimeInfrastructureModule, StationsModule, TenancyModule, UsersModule]',
          'imports: [RuntimeInfrastructureModule, TenancyModule, UsersModule]',
        ),
    },
  },
  {
    name: 'directed composition forwardRef import',
    expectedPath: 'src/modules/access/access.module.ts',
    expectedRules: ['D5-R024', 'D5-R025'],
    expectedText: 'direct module identifiers|forwardRef is forbidden',
    files: {
      ...validDirectedCompositionFiles,
      'src/modules/access/access.module.ts': directedAccessModule
        .replace(
          "import { Module } from '@nestjs/common';",
          "import { forwardRef, Module } from '@nestjs/common';",
        )
        .replace(
          'imports: [RuntimeInfrastructureModule, StationsModule, TenancyModule, UsersModule]',
          'imports: [RuntimeInfrastructureModule, forwardRef(() => StationsModule), TenancyModule, UsersModule]',
        ),
    },
  },
  {
    name: 'directed composition missing imports metadata',
    expectedPath: 'src/modules/access/access.module.ts',
    expectedRules: ['D5-R024'],
    expectedText: 'exactly one imports property',
    files: {
      ...validDirectedCompositionFiles,
      'src/modules/access/access.module.ts': directedAccessModule.replace(
        '  imports: [RuntimeInfrastructureModule, StationsModule, TenancyModule, UsersModule],\n',
        '',
      ),
    },
  },
  {
    name: 'directed composition duplicate imports metadata',
    expectedPath: 'src/modules/access/access.module.ts',
    expectedRules: ['D5-R024'],
    expectedText: 'exactly one imports property',
    files: {
      ...validDirectedCompositionFiles,
      'src/modules/access/access.module.ts': directedAccessModule.replace(
        '  imports: [RuntimeInfrastructureModule, StationsModule, TenancyModule, UsersModule],',
        '  imports: [RuntimeInfrastructureModule, StationsModule, TenancyModule, UsersModule],\n  imports: [RuntimeInfrastructureModule, StationsModule, TenancyModule, UsersModule],',
      ),
    },
  },
  {
    name: 'directed composition duplicate module import',
    expectedPath: 'src/modules/access/access.module.ts',
    expectedRules: ['D5-R024'],
    expectedText: 'directed module imports contain duplicates',
    files: {
      ...validDirectedCompositionFiles,
      'src/modules/access/access.module.ts': directedAccessModule.replace(
        'imports: [RuntimeInfrastructureModule, StationsModule, TenancyModule, UsersModule]',
        'imports: [RuntimeInfrastructureModule, StationsModule, StationsModule, TenancyModule, UsersModule]',
      ),
    },
  },
  {
    name: 'directed composition missing public token import',
    expectedPath: 'src/modules/access/access.module.ts',
    expectedRules: ['D5-R024'],
    expectedText: 'TRUSTED_STATION_CONTEXT_RESOLVER must use exactly one',
    files: {
      ...validDirectedCompositionFiles,
      'src/modules/access/access.module.ts': directedAccessModule.replace(
        "import { TRUSTED_STATION_ADMISSION_VALIDATOR, TRUSTED_STATION_CONTEXT_RESOLVER } from '../stations/index.js';\n",
        '',
      ),
    },
  },
  {
    name: 'directed composition public token alias',
    expectedPath: 'src/modules/access/access.module.ts',
    expectedRules: ['D5-R024'],
    expectedText: 'TRUSTED_STATION_CONTEXT_RESOLVER must',
    files: {
      ...validDirectedCompositionFiles,
      'src/modules/access/access.module.ts': directedAccessModule
        .replace(
          'TRUSTED_STATION_CONTEXT_RESOLVER } from',
          'TRUSTED_STATION_CONTEXT_RESOLVER as STATION_RESOLVER } from',
        )
        .replace(
          'inject: [TRUSTED_STATION_ADMISSION_VALIDATOR, TRUSTED_STATION_CONTEXT_RESOLVER, AUTHENTICATION_USER_ADMISSION_VALIDATOR, AUTHENTICATION_USER_READER]',
          'inject: [TRUSTED_STATION_ADMISSION_VALIDATOR, STATION_RESOLVER, AUTHENTICATION_USER_ADMISSION_VALIDATOR, AUTHENTICATION_USER_READER]',
        ),
    },
  },
  {
    name: 'directed composition duplicate public token injection',
    expectedPath: 'src/modules/access/access.module.ts',
    expectedRules: ['D5-R024'],
    expectedText: 'must appear exactly once',
    files: {
      ...validDirectedCompositionFiles,
      'src/modules/access/access.module.ts': directedAccessModule.replace(
        'TRUSTED_STATION_ADMISSION_VALIDATOR, TRUSTED_STATION_CONTEXT_RESOLVER, AUTHENTICATION_USER_ADMISSION_VALIDATOR',
        'TRUSTED_STATION_ADMISSION_VALIDATOR, TRUSTED_STATION_CONTEXT_RESOLVER, TRUSTED_STATION_CONTEXT_RESOLVER, AUTHENTICATION_USER_ADMISSION_VALIDATOR',
      ),
    },
  },
  {
    name: 'directed composition missing producer binding',
    expectedPath: 'src/modules/stations/stations.module.ts',
    expectedRules: ['D5-R024'],
    expectedText: 'must have exactly one explicit provider binding',
    files: {
      ...validDirectedCompositionFiles,
      'src/modules/stations/stations.module.ts': directedStationsModule.replace(
        'provide: TRUSTED_STATION_CONTEXT_RESOLVER',
        "provide: 'PRIVATE_STATION_RESOLVER'",
      ),
    },
  },
  {
    name: 'directed composition duplicate producer binding',
    expectedPath: 'src/modules/stations/stations.module.ts',
    expectedRules: ['D5-R024'],
    expectedText: 'must have exactly one explicit provider binding',
    files: {
      ...validDirectedCompositionFiles,
      'src/modules/stations/stations.module.ts': directedStationsModule.replace(
        '  providers: [{',
        '  providers: [{\n    provide: TRUSTED_STATION_CONTEXT_RESOLVER,\n    useValue: {},\n  }, {',
      ),
    },
  },
  {
    name: 'directed composition missing producer export',
    expectedPath: 'src/modules/stations/stations.module.ts',
    expectedRules: ['D5-R024'],
    expectedText: 'exactly one exports property|registered public token',
    files: {
      ...validDirectedCompositionFiles,
      'src/modules/stations/stations.module.ts': directedStationsModule.replace(
        '  exports: [ADMIN_INVITATION_BRANCH_COMMIT_VALIDATOR, BRANCH_ADMINISTRATION_RUNTIME, STATION_ADMINISTRATION_RUNTIME, BRANCH_SETTINGS_RUNTIME, TRUSTED_STATION_ADMISSION_VALIDATOR, TRUSTED_STATION_CONTEXT_RESOLVER],\n',
        '',
      ),
    },
  },
  {
    name: 'directed composition duplicate producer export',
    expectedPath: 'src/modules/stations/stations.module.ts',
    expectedRules: ['D5-R024'],
    expectedText: 'registered public token exactly once',
    files: {
      ...validDirectedCompositionFiles,
      'src/modules/stations/stations.module.ts': directedStationsModule.replace(
        'exports: [ADMIN_INVITATION_BRANCH_COMMIT_VALIDATOR, BRANCH_ADMINISTRATION_RUNTIME, STATION_ADMINISTRATION_RUNTIME, BRANCH_SETTINGS_RUNTIME, TRUSTED_STATION_ADMISSION_VALIDATOR, TRUSTED_STATION_CONTEXT_RESOLVER]',
        'exports: [ADMIN_INVITATION_BRANCH_COMMIT_VALIDATOR, BRANCH_ADMINISTRATION_RUNTIME, STATION_ADMINISTRATION_RUNTIME, BRANCH_SETTINGS_RUNTIME, TRUSTED_STATION_ADMISSION_VALIDATOR, TRUSTED_STATION_CONTEXT_RESOLVER, TRUSTED_STATION_CONTEXT_RESOLVER]',
      ),
    },
  },
  {
    name: 'directed composition missing producer contract import',
    expectedPath: 'src/modules/stations/stations.module.ts',
    expectedRules: ['D5-R024'],
    expectedText: 'TrustedStationContextResolver must use exactly one',
    files: {
      ...validDirectedCompositionFiles,
      'src/modules/stations/stations.module.ts': directedStationsModule.replace(
        "import type { TrustedStationAdmissionValidator, TrustedStationContextResolver } from './index.js';\n",
        '',
      ),
    },
  },
  {
    name: 'directed composition reverse cycle',
    expectedPath: 'src/modules/access/access.module.ts',
    expectedPaths: [
      'src/modules/access/access.module.ts',
      'src/modules/users/users.module.ts',
    ],
    expectedRules: ['D5-R007', 'D5-R024'],
    expectedText: 'dependency cycle detected|not explicitly registered',
    files: {
      ...validDirectedCompositionFiles,
      'src/modules/users/users.module.ts': [
        "import { AccessModule } from '../access/access.module.js';",
        directedUsersModule.replace(
          '@Module({',
          '@Module({\n  imports: [AccessModule],',
        ),
      ].join('\n'),
    },
  },
  {
    name: 'directed composition ModuleRef bypass',
    expectedPath: 'src/modules/access/access.module.ts',
    expectedRules: ['D5-R026'],
    expectedText: 'ModuleRef or service-locator resolution is forbidden',
    files: {
      ...validDirectedCompositionFiles,
      'src/modules/access/access.module.ts': directedAccessModule
        .replace(
          "import { Module } from '@nestjs/common';",
          "import { Module } from '@nestjs/common';\nimport { ModuleRef } from '@nestjs/core';",
        )
        .replace(
          'export class AccessModule {}',
          'export class AccessModule { constructor(readonly ref: ModuleRef) {} }',
        ),
    },
  },
  {
    name: 'directed composition Global bypass',
    expectedPath: 'src/modules/access/access.module.ts',
    expectedRules: ['D5-R027'],
    expectedText: 'global Nest modules are forbidden',
    files: {
      ...validDirectedCompositionFiles,
      'src/modules/access/access.module.ts': directedAccessModule
        .replace(
          "import { Module } from '@nestjs/common';",
          "import { Global, Module } from '@nestjs/common';",
        )
        .replace('@Module({', '@Global()\n@Module({'),
    },
  },
  {
    name: 'directed composition private infrastructure bypass',
    expectedPath: 'src/modules/access/access.module.ts',
    expectedRules: ['D5-R014'],
    expectedText: 'accesses stations internals',
    files: {
      ...validDirectedCompositionFiles,
      'src/modules/access/access.module.ts': [
        "import type { PrivateStationsRuntime } from '../stations/infrastructure/private-runtime.js';",
        directedAccessModule.replace(
          'export class AccessModule {}',
          'export class AccessModule { private declare readonly runtime: PrivateStationsRuntime; }',
        ),
      ].join('\n'),
      'src/modules/stations/infrastructure/private-runtime.ts':
        'export interface PrivateStationsRuntime {}\n',
    },
  },
  {
    name: 'directed composition repository bypass',
    expectedPath: 'src/modules/access/access.module.ts',
    expectedRules: ['D5-R014'],
    expectedText: 'accesses users internals',
    files: {
      ...validDirectedCompositionFiles,
      'src/modules/access/access.module.ts': [
        "import type { PrivateUserRepository } from '../users/infrastructure/persistence/private-user.repository.js';",
        directedAccessModule.replace(
          'export class AccessModule {}',
          'export class AccessModule { private declare readonly repository: PrivateUserRepository; }',
        ),
      ].join('\n'),
      'src/modules/users/infrastructure/persistence/private-user.repository.ts':
        'export interface PrivateUserRepository {}\n',
    },
  },
  {
    name: 'directed composition framework-specific public coupling',
    expectedPath: 'src/modules/stations/index.ts',
    expectedRules: ['D5-R016'],
    expectedText: 'public contract imports NestJS',
    files: {
      ...validDirectedCompositionFiles,
      'src/modules/stations/index.ts': [
        "import type { Injectable } from '@nestjs/common';",
        directedStationsIndex,
        'export interface FrameworkSpecificStationContract { readonly framework: typeof Injectable; }',
        '',
      ].join('\n'),
    },
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
    expectedText: 'cannot re-export',
    files: {
      'src/modules/access/index.ts': `${validFiles['src/modules/access/index.ts']}export { Secret } from './internal/secret.js';\n`,
      'src/modules/access/internal/secret.ts': 'export interface Secret {}\n',
    },
  },
  {
    name: 'unauthorized controller',
    expectedRules: ['D5-R035'],
    expectedText: 'not a registered module-owned presentation surface',
    files: {
      'src/modules/access/presentation/http/probe.ts': "import { Controller } from '@nestjs/common';\n@Controller()\nexport class ProbeController {}\n",
    },
  },
  {
    name: 'unauthorized controller through alias',
    expectedPath: 'src/modules/access/presentation/http/alias-controller.ts',
    expectedRules: ['D5-R035'],
    expectedText: 'not a registered module-owned presentation surface',
    files: {
      'src/modules/access/presentation/http/alias-controller.ts': "import { Controller as HttpController } from '@nestjs/common';\n@HttpController()\nexport class ProbeController {}\n",
    },
  },
  {
    name: 'unauthorized controller through namespace',
    expectedPath: 'src/modules/access/presentation/http/namespace-controller.ts',
    expectedRules: ['D5-R035'],
    expectedText: 'not a registered module-owned presentation surface',
    files: {
      'src/modules/access/presentation/http/namespace-controller.ts': "import * as Nest from '@nestjs/common';\n@Nest.Controller()\nexport class ProbeController {}\n",
    },
  },
  {
    name: 'unauthorized endpoint',
    expectedRules: ['D5-R035'],
    expectedText: 'not inside a registered module-owned presentation surface',
    files: {
      'src/modules/access/presentation/http/endpoint.ts': "import { Get } from '@nestjs/common';\nexport class Endpoint { @Get() run(): void {} }\n",
    },
  },
  {
    name: 'unauthorized endpoint through alias',
    expectedPath: 'src/modules/access/presentation/http/alias-endpoint.ts',
    expectedRules: ['D5-R035'],
    expectedText: 'not inside a registered module-owned presentation surface',
    files: {
      'src/modules/access/presentation/http/alias-endpoint.ts': "import { Get as HttpGet } from '@nestjs/common';\nexport class Endpoint { @HttpGet() run(): void {} }\n",
    },
  },
  {
    name: 'unauthorized endpoint through namespace',
    expectedPath: 'src/modules/access/presentation/http/namespace-endpoint.ts',
    expectedRules: ['D5-R035'],
    expectedText: 'not inside a registered module-owned presentation surface',
    files: {
      'src/modules/access/presentation/http/namespace-endpoint.ts': "import * as Nest from '@nestjs/common';\nexport class Endpoint { @Nest.Get() run(): void {} }\n",
    },
  },
  {
    name: 'controller inside infrastructure',
    expectedRules: ['D5-R035'],
    expectedText: 'not a registered module-owned presentation surface',
    files: {
      'src/modules/access/infrastructure/probe.controller.ts': "import { Controller } from '@nestjs/common';\n@Controller()\nexport class ProbeController {}\n",
    },
  },
  {
    name: 'controller inside shared',
    expectedPaths: ['src/shared', 'src/shared/probe.controller.ts'],
    expectedRules: ['D5-R019', 'D5-R035'],
    expectedText: 'shared',
    files: {
      'src/shared/probe.controller.ts': "import { Controller } from '@nestjs/common';\n@Controller()\nexport class ProbeController {}\n",
    },
  },
  {
    name: 'controller in undeclared module',
    expectedPaths: [
      'src/modules/inventory',
      'src/modules/inventory/presentation/probe.controller.ts',
    ],
    expectedRules: ['D5-R002', 'D5-R035'],
    expectedText: 'inventory',
    files: {
      'src/modules/inventory/index.ts': 'export interface InventoryModuleContract {}\n',
      'src/modules/inventory/presentation/probe.controller.ts': "import { Controller } from '@nestjs/common';\n@Controller()\nexport class ProbeController {}\n",
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
    expectedText: 'not explicitly registered',
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
    expectedText: 'not a registered module-owned presentation surface',
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
    expectedText: 'not a registered module-owned presentation surface',
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
    expectedText: 'not a registered module-owned presentation surface',
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
    expectedText: 'not inside a registered module-owned presentation surface',
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
    expectedText: 'not inside a registered module-owned presentation surface',
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
    expectedText: 'not inside a registered module-owned presentation surface',
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
