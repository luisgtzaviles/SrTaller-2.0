const withAccessPersistenceComposition = (content) =>
  [
    "import type { KyselyAccessRepositoryFactory } from './infrastructure/persistence/kysely-access.repository.js';",
    "import type { KyselyOperationalSessionRepository } from './infrastructure/persistence/kysely-operational-session.repository.js';",
    "import type { KyselyPinCredentialRepositoryFactory } from './infrastructure/persistence/kysely-pin-credential.repository.js';",
    content,
  ].join('\n');

export const remediationMutations = [
  {
    name: 'parenthesized forwardRef alias escape hatch',
    path: 'src/modules/access/access.module.ts',
    expectedPath: 'src/modules/access/access.module.ts',
    rule: 'D5-R025',
    content: withAccessPersistenceComposition([
      "import { forwardRef as nestForwardRef, Module } from '@nestjs/common';",
      '@Module({',
      '  imports: [((nestForwardRef as typeof nestForwardRef))(() => class {})],',
      '})',
      'export class AccessModule {}',
      '',
    ].join('\n')),
    coverage: {
      ids: ['mutation:D5-R025:transparent-wrapper'],
      evidence: ['((nestForwardRef as typeof nestForwardRef))'],
    },
  },
  {
    name: 'parenthesized namespace Global decorator',
    path: 'src/modules/access/access.module.ts',
    expectedPath: 'src/modules/access/access.module.ts',
    rule: 'D5-R027',
    content: withAccessPersistenceComposition([
      "import { Module } from '@nestjs/common';",
      "import * as Nest from '@nestjs/common';",
      '@((Nest.Global))()',
      '@Module({})',
      'export class AccessModule {}',
      '',
    ].join('\n')),
    coverage: {
      ids: ['mutation:D5-R027:transparent-wrapper'],
      evidence: ['@((Nest.Global))()'],
    },
  },
  {
    name: 'parenthesized request Scope alias',
    path: 'src/modules/access/infrastructure/request-context-wrapper.ts',
    expectedPath:
      'src/modules/access/infrastructure/request-context-wrapper.ts',
    rule: 'D5-R029',
    content: [
      "import { Scope as NestScope } from '@nestjs/common';",
      'export const operationalContextScope =',
      '  ((NestScope satisfies typeof NestScope)).REQUEST;',
      '',
    ].join('\n'),
    coverage: {
      ids: ['mutation:D5-R029:transparent-wrapper'],
      evidence: ['((NestScope satisfies typeof NestScope)).REQUEST'],
    },
  },
  {
    name: 'parenthesized HTTP endpoint alias',
    path: 'src/modules/access/presentation/http/wrapper-endpoint.ts',
    expectedPath:
      'src/modules/access/presentation/http/wrapper-endpoint.ts',
    rule: 'D5-R035',
    content: [
      "import { Get as HttpGet } from '@nestjs/common';",
      'export class Endpoint {',
      '  @((HttpGet!))()',
      '  run(): void {}',
      '}',
      '',
    ].join('\n'),
    coverage: {
      ids: ['mutation:D5-R035:transparent-wrapper'],
      evidence: ['@((HttpGet!))()'],
    },
  },
  {
    name: 'parenthesized controller final authorization',
    path: 'src/modules/access/presentation/http/wrapper-authority.ts',
    expectedPath:
      'src/modules/access/presentation/http/wrapper-authority.ts',
    rule: 'D5-R036',
    expectedRules: ['D5-R035', 'D5-R036'],
    content: [
      "import { Controller as HttpController } from '@nestjs/common';",
      '@((HttpController as typeof HttpController))()',
      'export class AuthorityController {',
      '  decideAuthorization(): boolean { return true; }',
      '}',
      '',
    ].join('\n'),
    coverage: {
      ids: ['mutation:D5-R036:transparent-wrapper'],
      evidence: ['@((HttpController as typeof HttpController))()'],
    },
  },
];
