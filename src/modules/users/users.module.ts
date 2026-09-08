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
  USER_PRODUCT_RUNTIME,
} from './index.js';
import type {
  AuthenticationUserAdmissionValidator,
  AuthenticationUserReader,
  UserProductRuntime,
} from './index.js';
import type { GetUserUseCase } from './application/use-cases/get-user.use-case.js';
import type { ProvisionFirstUserUseCase } from './application/use-cases/provision-first-user.use-case.js';
import { CreateUserUseCase } from './application/use-cases/create-user.use-case.js';
import { ListUsersUseCase } from './application/use-cases/list-users.use-case.js';
import { TransitionUserStatusUseCase } from './application/use-cases/transition-user-status.use-case.js';
import { UpdateUserUseCase } from './application/use-cases/update-user.use-case.js';
import { createKyselyUserRepository } from './infrastructure/persistence/kysely-user.repository.js';
import type { KyselyUserRepositoryFactory } from './infrastructure/persistence/kysely-user.repository.js';
import type { UserMutationCommitGuard } from './application/ports/user-repository.port.js';
import { KyselyAuthenticationUserReader } from './infrastructure/persistence/kysely-authentication-user.reader.js';

type RegisteredUsersPersistenceAdapter =
  | KyselyUserRepositoryFactory
  | KyselyAuthenticationUserReader;
type RegisteredUsersUseCases =
  | GetUserUseCase
  | ListUsersUseCase
  | ProvisionFirstUserUseCase
  | TransitionUserStatusUseCase;

const USERS_RUNTIME_COMPOSITION = Symbol('srtaller.users.runtime-composition');

type UsersRuntimeComposition = Readonly<{
  authenticationReader: KyselyAuthenticationUserReader;
  productRuntime: UserProductRuntime;
}>;

/** User identity owns lifecycle data only; authorization remains PBI-033. */
@Module({
  imports: [RuntimeInfrastructureModule],
  providers: [
    {
      provide: USERS_RUNTIME_COMPOSITION,
      inject: [APPLICATION_DATABASE_CONNECTION],
      useFactory: (database: ApplicationDatabaseConnection): UsersRuntimeComposition => {
        const repository = createKyselyUserRepository(database);
        return Object.freeze({
          authenticationReader: new KyselyAuthenticationUserReader(database),
          productRuntime: Object.freeze({
            list: (scope: unknown) => new ListUsersUseCase(repository).execute(scope),
            create: (scope: unknown, input: unknown, guard?: UserMutationCommitGuard) => new CreateUserUseCase(repository).execute(scope, input, guard),
            update: (scope: unknown, userId: unknown, input: unknown, guard?: UserMutationCommitGuard) => new UpdateUserUseCase(repository).execute(scope, userId, input, guard),
            transition: (scope: unknown, input: unknown, guard?: UserMutationCommitGuard) => new TransitionUserStatusUseCase(repository).execute(scope, input, guard),
          }),
        });
      },
    },
    {
      provide: KyselyAuthenticationUserReader,
      inject: [USERS_RUNTIME_COMPOSITION],
      useFactory: (composition: UsersRuntimeComposition) => composition.authenticationReader,
    },
    {
      provide: USER_PRODUCT_RUNTIME,
      inject: [USERS_RUNTIME_COMPOSITION],
      useFactory: (composition: UsersRuntimeComposition): UserProductRuntime => composition.productRuntime,
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
    USER_PRODUCT_RUNTIME,
    AUTHENTICATION_USER_READER,
  ],
})
export class UsersModule {
  declare private readonly persistenceAdapter: RegisteredUsersPersistenceAdapter;
  declare private readonly useCases: RegisteredUsersUseCases;
}
