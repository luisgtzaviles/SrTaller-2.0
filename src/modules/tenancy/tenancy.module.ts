import { Module } from '@nestjs/common';

import type { KyselyBranchEligibilityCapabilityFactory } from './infrastructure/persistence/kysely-branch-eligibility.js';
import type { KyselyBranchRepositoryFactory } from './infrastructure/persistence/kysely-branch.repository.js';
import type { KyselyTenantRepositoryFactory } from './infrastructure/persistence/kysely-tenant.repository.js';

type RegisteredTenancyPersistenceAdapter =
  | KyselyBranchEligibilityCapabilityFactory
  | KyselyBranchRepositoryFactory
  | KyselyTenantRepositoryFactory;

@Module({})
export class TenancyModule {
  declare private readonly persistenceAdapter: RegisteredTenancyPersistenceAdapter;
}
