import { Module } from '@nestjs/common';

import { RuntimeInfrastructureModule } from '../../infrastructure/runtime/runtime-infrastructure.module.js';
import { APPLICATION_DATABASE_CONNECTION } from '../../infrastructure/runtime/index.js';
import type { ApplicationDatabaseConnection } from '../../infrastructure/runtime/index.js';
import { TENANT_BOOTSTRAP_PERSISTENCE, TENANT_SETTINGS_RUNTIME, parseOperatingCurrency } from './index.js';
import type { TenantBootstrapPersistence, TenantSettingsRuntime } from './index.js';
import { createKyselyTenantRepository } from './infrastructure/persistence/kysely-tenant.repository.js';
import { KyselyTenantBootstrapWriter } from './infrastructure/persistence/kysely-tenant-bootstrap.writer.js';

import type { KyselyTenantRepositoryFactory } from './infrastructure/persistence/kysely-tenant.repository.js';

type RegisteredTenancyPersistenceAdapter =
  | KyselyTenantRepositoryFactory
  | KyselyTenantBootstrapWriter;

const TENANCY_RUNTIME_COMPOSITION = Symbol('srtaller.tenancy.runtime-composition');
type TenancyRuntimeComposition = Readonly<{
  settings: TenantSettingsRuntime;
  bootstrap: TenantBootstrapPersistence;
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
  }],
  exports: [TENANT_SETTINGS_RUNTIME, TENANT_BOOTSTRAP_PERSISTENCE],
})
export class TenancyModule {
  declare private readonly persistenceAdapter: RegisteredTenancyPersistenceAdapter;
}
