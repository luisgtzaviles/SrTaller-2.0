import { Module } from '@nestjs/common';

import { RuntimeInfrastructureModule } from '../../infrastructure/runtime/runtime-infrastructure.module.js';
import { APPLICATION_DATABASE_CONNECTION } from '../../infrastructure/runtime/index.js';
import type { ApplicationDatabaseConnection } from '../../infrastructure/runtime/index.js';
import { TENANT_BOOTSTRAP_PERSISTENCE, TENANT_LIFECYCLE_COMMIT_RUNTIME, TENANT_SETTINGS_RUNTIME, TenantLifecycleCommitError, parseOperatingCurrency } from './index.js';
import type { TenantBootstrapPersistence, TenantLifecycleCommitRuntime, TenantSettingsRuntime } from './index.js';
import { createKyselyTenantRepository, createTransactionalKyselyTenantRepository } from './infrastructure/persistence/kysely-tenant.repository.js';
import { KyselyTenantBootstrapWriter } from './infrastructure/persistence/kysely-tenant-bootstrap.writer.js';

import type { KyselyTenantRepositoryFactory } from './infrastructure/persistence/kysely-tenant.repository.js';

type RegisteredTenancyPersistenceAdapter =
  | KyselyTenantRepositoryFactory
  | KyselyTenantBootstrapWriter;

const TENANCY_RUNTIME_COMPOSITION = Symbol('srtaller.tenancy.runtime-composition');
type TenancyRuntimeComposition = Readonly<{
  settings: TenantSettingsRuntime;
  bootstrap: TenantBootstrapPersistence;
  lifecycle: TenantLifecycleCommitRuntime;
}>;

@Module({
  imports: [RuntimeInfrastructureModule],
  providers: [{
    provide: TENANCY_RUNTIME_COMPOSITION,
    inject: [APPLICATION_DATABASE_CONNECTION],
    useFactory: (database: ApplicationDatabaseConnection): TenancyRuntimeComposition => {
      const repository = createKyselyTenantRepository(database as never);
      return Object.freeze({
        settings: Object.freeze({
          readOperatingCurrency: async (scope: Parameters<TenantSettingsRuntime['readOperatingCurrency']>[0]) => {
            const currency = await repository.readOperatingCurrency(scope);
            return currency === null ? null : parseOperatingCurrency(currency);
          },
        }),
        bootstrap: Object.freeze({ writer: new KyselyTenantBootstrapWriter() }),
        lifecycle: Object.freeze({
          lock: async (
            scope: Parameters<TenantLifecycleCommitRuntime['lock']>[0],
            transactionContext: object,
          ) => {
            try {
              return await createTransactionalKyselyTenantRepository(transactionContext as never)
                .lockTenant(scope);
            } catch (error: unknown) {
              throw new TenantLifecycleCommitError(
                typeof error === 'object' && error !== null &&
                'retryable' in error && error.retryable === 'conditional',
              );
            }
          },
          activate: async (
            scope: Parameters<TenantLifecycleCommitRuntime['activate']>[0],
            input: Parameters<TenantLifecycleCommitRuntime['activate']>[1],
            transactionContext: object,
          ) => {
            try {
              return await createTransactionalKyselyTenantRepository(transactionContext as never)
                .activateTenant(scope, input);
            } catch (error: unknown) {
              throw new TenantLifecycleCommitError(
                typeof error === 'object' && error !== null &&
                'retryable' in error && error.retryable === 'conditional',
              );
            }
          },
        }),
      });
    },
  }, {
    provide: TENANT_SETTINGS_RUNTIME,
    inject: [TENANCY_RUNTIME_COMPOSITION],
    useFactory: (composition: TenancyRuntimeComposition): TenantSettingsRuntime => composition.settings,
  }, {
    provide: TENANT_BOOTSTRAP_PERSISTENCE,
    inject: [TENANCY_RUNTIME_COMPOSITION],
    useFactory: (composition: TenancyRuntimeComposition): TenantBootstrapPersistence => composition.bootstrap,
  }, {
    provide: TENANT_LIFECYCLE_COMMIT_RUNTIME,
    inject: [TENANCY_RUNTIME_COMPOSITION],
    useFactory: (composition: TenancyRuntimeComposition): TenantLifecycleCommitRuntime => composition.lifecycle,
  }],
  exports: [TENANT_SETTINGS_RUNTIME, TENANT_BOOTSTRAP_PERSISTENCE, TENANT_LIFECYCLE_COMMIT_RUNTIME],
})
export class TenancyModule {
  declare private readonly persistenceAdapter: RegisteredTenancyPersistenceAdapter;
}
