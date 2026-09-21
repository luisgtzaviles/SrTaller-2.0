import { Module } from '@nestjs/common';

import { RuntimeInfrastructureModule } from '../../infrastructure/runtime/runtime-infrastructure.module.js';
import { APPLICATION_DATABASE_CONNECTION } from '../../infrastructure/runtime/index.js';
import type { ApplicationDatabaseConnection } from '../../infrastructure/runtime/index.js';
import { TENANT_SETTINGS_RUNTIME, parseOperatingCurrency } from './index.js';
import type { TenantSettingsRuntime } from './index.js';
import { createKyselyTenantRepository } from './infrastructure/persistence/kysely-tenant.repository.js';
import type { KyselyTenantBootstrapWriter } from './infrastructure/persistence/kysely-tenant-bootstrap.writer.js';

import type { KyselyTenantRepositoryFactory } from './infrastructure/persistence/kysely-tenant.repository.js';

type RegisteredTenancyPersistenceAdapter =
  | KyselyTenantRepositoryFactory
  | KyselyTenantBootstrapWriter;

@Module({
  imports: [RuntimeInfrastructureModule],
  providers: [{
    provide: TENANT_SETTINGS_RUNTIME,
    inject: [APPLICATION_DATABASE_CONNECTION],
    useFactory: (database: ApplicationDatabaseConnection): TenantSettingsRuntime => {
      const repository = createKyselyTenantRepository(database as never);
      return Object.freeze({
        readOperatingCurrency: async (scope: Parameters<TenantSettingsRuntime['readOperatingCurrency']>[0]) => {
          const currency = await repository.readOperatingCurrency(scope);
          return currency === null ? null : parseOperatingCurrency(currency);
        },
      });
    },
  }],
  exports: [TENANT_SETTINGS_RUNTIME],
})
export class TenancyModule {
  declare private readonly persistenceAdapter: RegisteredTenancyPersistenceAdapter;
}
