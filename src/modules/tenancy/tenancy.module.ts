import { Module } from '@nestjs/common';

import type { KyselyTenantRepositoryFactory } from './infrastructure/persistence/kysely-tenant.repository.js';

type RegisteredTenancyPersistenceAdapter = KyselyTenantRepositoryFactory;

@Module({})
export class TenancyModule {
  declare private readonly persistenceAdapter: RegisteredTenancyPersistenceAdapter;
}
