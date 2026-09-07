import { Module } from '@nestjs/common';

import { RuntimeInfrastructureModule } from '../../infrastructure/runtime/runtime-infrastructure.module.js';
import {
  APPLICATION_DATABASE_CONNECTION,
} from '../../infrastructure/runtime/index.js';
import type {
  ApplicationDatabaseConnection,
} from '../../infrastructure/runtime/index.js';
import {
  AUTHENTICATION_USER_ADMISSION_VALIDATOR,
  AUTHENTICATION_USER_READER,
} from './index.js';
import type {
  AuthenticationUserAdmissionValidator,
  AuthenticationUserReader,
} from './index.js';
import type { GetUserUseCase } from './application/use-cases/get-user.use-case.js';
import type { ListUsersUseCase } from './application/use-cases/list-users.use-case.js';
import type { ProvisionFirstUserUseCase } from './application/use-cases/provision-first-user.use-case.js';
import type { TransitionUserStatusUseCase } from './application/use-cases/transition-user-status.use-case.js';
import type { KyselyUserRepositoryFactory } from './infrastructure/persistence/kysely-user.repository.js';
import { KyselyAuthenticationUserReader } from './infrastructure/persistence/kysely-authentication-user.reader.js';

type RegisteredUsersPersistenceAdapter =
  | KyselyUserRepositoryFactory
  | KyselyAuthenticationUserReader;
type RegisteredUsersUseCases =
  | GetUserUseCase
  | ListUsersUseCase
  | ProvisionFirstUserUseCase
  | TransitionUserStatusUseCase;

/** User identity owns lifecycle data only; authorization remains PBI-033. */
@Module({
  imports: [RuntimeInfrastructureModule],
  providers: [
    {
      provide: KyselyAuthenticationUserReader,
      inject: [APPLICATION_DATABASE_CONNECTION],
      useFactory: (database: ApplicationDatabaseConnection) =>
        new KyselyAuthenticationUserReader(database),
    },
    {
      provide: AUTHENTICATION_USER_READER,
      inject: [KyselyAuthenticationUserReader],
      useFactory: (
        reader: KyselyAuthenticationUserReader,
      ): AuthenticationUserReader => reader,
    },
    {
      provide: AUTHENTICATION_USER_ADMISSION_VALIDATOR,
      inject: [KyselyAuthenticationUserReader],
      useFactory: (
        reader: KyselyAuthenticationUserReader,
      ): AuthenticationUserAdmissionValidator => reader,
    },
  ],
  exports: [
    AUTHENTICATION_USER_ADMISSION_VALIDATOR,
    AUTHENTICATION_USER_READER,
  ],
})
export class UsersModule {
  declare private readonly persistenceAdapter: RegisteredUsersPersistenceAdapter;
  declare private readonly useCases: RegisteredUsersUseCases;
}
