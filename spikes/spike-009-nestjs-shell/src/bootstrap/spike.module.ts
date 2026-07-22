import { DynamicModule, Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { ExecuteSyntheticOperation } from '../synthetic/application/execute-synthetic-operation.js';
import { SyntheticAuthorizationPolicy } from '../synthetic/application/authorization-policy.js';
import { DeferredJobRunner } from '../synthetic/infrastructure/jobs/deferred-job-runner.js';
import { TechnicalTelemetry } from '../synthetic/infrastructure/observability/technical-telemetry.js';
import { OperationalLogger } from '../synthetic/infrastructure/observability/operational-logger.js';
import { PostgresAuditAdapter, PostgresUnitOfWork } from '../synthetic/infrastructure/postgres/postgres-adapters.js';
import { PostgresPool, type PostgresTimeouts } from '../synthetic/infrastructure/postgres/postgres-pool.js';
import { FixtureAuthority } from '../synthetic/infrastructure/security/fixture-authority.js';
import { CorrelationInterceptor } from '../synthetic/transport/http/correlation.interceptor.js';
import { HealthController } from '../synthetic/transport/http/health.controller.js';
import { SyntheticController } from '../synthetic/transport/http/synthetic.controller.js';
import { TechnicalAuthenticationGuard } from '../synthetic/transport/http/technical-authentication.guard.js';
import { LifecycleCoordinator } from './lifecycle-coordinator.js';
import { TOKENS } from './tokens.js';

export interface SpikeModuleOptions {
  readonly databaseUrl: string;
  readonly logger?: OperationalLogger;
  readonly postgresTimeouts?: PostgresTimeouts;
}

@Module({})
export class SpikeModule {
  static register(options: SpikeModuleOptions): DynamicModule {
    return {
      module: SpikeModule,
      controllers: [SyntheticController, HealthController],
      providers: [
        { provide: TOKENS.authority, useFactory: () => new FixtureAuthority() },
        {
          provide: TOKENS.pool,
          useFactory: () => new PostgresPool(options.databaseUrl, options.postgresTimeouts),
        },
        {
          provide: TOKENS.readiness,
          inject: [TOKENS.pool],
          useFactory: (pool: PostgresPool) => ({ ping: () => pool.ping() }),
        },
        { provide: TOKENS.authorization, useFactory: () => new SyntheticAuthorizationPolicy() },
        {
          provide: TOKENS.unitOfWork,
          inject: [TOKENS.pool],
          useFactory: (pool: PostgresPool) => new PostgresUnitOfWork(pool),
        },
        {
          provide: TOKENS.audit,
          inject: [TOKENS.pool],
          useFactory: (pool: PostgresPool) => new PostgresAuditAdapter(pool),
        },
        {
          provide: TOKENS.operation,
          inject: [TOKENS.authorization, TOKENS.unitOfWork, TOKENS.audit],
          useFactory: (
            authorization: SyntheticAuthorizationPolicy,
            unitOfWork: PostgresUnitOfWork,
            audit: PostgresAuditAdapter,
          ) => new ExecuteSyntheticOperation(authorization, unitOfWork, audit),
        },
        {
          provide: TOKENS.jobs,
          inject: [TOKENS.authority, TOKENS.operation],
          useFactory: (authority: FixtureAuthority, operation: ExecuteSyntheticOperation) =>
            new DeferredJobRunner(authority, operation),
        },
        { provide: TOKENS.telemetry, useFactory: () => new TechnicalTelemetry() },
        { provide: TOKENS.logger, useFactory: () => options.logger ?? new OperationalLogger() },
        TechnicalAuthenticationGuard,
        LifecycleCoordinator,
        {
          provide: APP_INTERCEPTOR,
          inject: [TOKENS.telemetry, TOKENS.logger],
          useFactory: (telemetry: TechnicalTelemetry, logger: OperationalLogger) =>
            new CorrelationInterceptor(telemetry, logger),
        },
      ],
      exports: [
        TOKENS.authority,
        TOKENS.pool,
        TOKENS.readiness,
        TOKENS.operation,
        TOKENS.jobs,
        TOKENS.telemetry,
        TOKENS.logger,
      ],
    };
  }
}
