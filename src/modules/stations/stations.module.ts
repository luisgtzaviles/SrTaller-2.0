import { Module } from '@nestjs/common';

import type { KyselyBranchRepositoryFactory } from './infrastructure/persistence/kysely-branch.repository.js';

type RegisteredStationsPersistenceAdapter = KyselyBranchRepositoryFactory;

@Module({})
export class StationsModule {
  declare private readonly persistenceAdapter: RegisteredStationsPersistenceAdapter;
}
