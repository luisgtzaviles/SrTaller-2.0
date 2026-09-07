import { Module } from '@nestjs/common';

import type { GetUserUseCase } from './application/use-cases/get-user.use-case.js';
import type { ListUsersUseCase } from './application/use-cases/list-users.use-case.js';
import type { ProvisionFirstUserUseCase } from './application/use-cases/provision-first-user.use-case.js';
import type { TransitionUserStatusUseCase } from './application/use-cases/transition-user-status.use-case.js';
import type { KyselyUserRepositoryFactory } from './infrastructure/persistence/kysely-user.repository.js';
import type { KyselyAuthenticationUserReader } from './infrastructure/persistence/kysely-authentication-user.reader.js';

type RegisteredUsersPersistenceAdapter =
  | KyselyUserRepositoryFactory
  | KyselyAuthenticationUserReader;
type RegisteredUsersUseCases =
  | GetUserUseCase
  | ListUsersUseCase
  | ProvisionFirstUserUseCase
  | TransitionUserStatusUseCase;

/** User identity owns lifecycle data only; authorization remains PBI-033. */
@Module({})
export class UsersModule {
  declare private readonly persistenceAdapter: RegisteredUsersPersistenceAdapter;
  declare private readonly useCases: RegisteredUsersUseCases;
}
