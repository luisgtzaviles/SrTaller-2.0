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
  USER_PREFERENCES_RUNTIME,
  USER_PRODUCT_RUNTIME,
  TENANT_BOOTSTRAP_USER_WRITER,
  ADMIN_INVITATION_USER_COMMIT_RUNTIME,
} from './index.js';
import type {
  AuthenticationUserAdmissionValidator,
  AuthenticationUserReader,
  UserPreferencesRuntime,
  UserProductRuntime,
  TenantBootstrapUserWriter,
  AdminInvitationUserCommitRuntime,
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
import { KyselyUserPreferencesRepository } from './infrastructure/persistence/kysely-user-preferences.repository.js';
import { KyselyTenantBootstrapUserWriter } from './infrastructure/persistence/kysely-tenant-bootstrap-user.writer.js';
import { KyselyAdminInvitationUserCommit } from './infrastructure/persistence/kysely-admin-invitation-user.commit.js';
import {
  GetUserPreferencesUseCase,
  UpdateUserPreferencesUseCase,
} from './application/use-cases/user-preferences.use-cases.js';

type RegisteredUsersPersistenceAdapter =
  | KyselyUserRepositoryFactory
  | KyselyAuthenticationUserReader
  | KyselyUserPreferencesRepository
  | KyselyTenantBootstrapUserWriter
  | KyselyAdminInvitationUserCommit;
type RegisteredUsersUseCases =
  | GetUserUseCase
  | ListUsersUseCase
  | ProvisionFirstUserUseCase
  | TransitionUserStatusUseCase
  | GetUserPreferencesUseCase
  | UpdateUserPreferencesUseCase;

const USERS_RUNTIME_COMPOSITION = Symbol('srtaller.users.runtime-composition');

type UsersRuntimeComposition = Readonly<{
  authenticationReader: KyselyAuthenticationUserReader;
  preferencesRuntime: UserPreferencesRuntime;
  productRuntime: UserProductRuntime;
}>;

/** User identity owns lifecycle data only; authorization remains PBI-033. */
@Module({
  imports: [RuntimeInfrastructureModule],
  providers: [
    {
      provide: TENANT_BOOTSTRAP_USER_WRITER,
      useFactory: (): TenantBootstrapUserWriter => new KyselyTenantBootstrapUserWriter(),
    },
    {
      provide: ADMIN_INVITATION_USER_COMMIT_RUNTIME,
      useFactory: (): AdminInvitationUserCommitRuntime => new KyselyAdminInvitationUserCommit(),
    },
    {
      provide: USERS_RUNTIME_COMPOSITION,
      inject: [APPLICATION_DATABASE_CONNECTION],
      useFactory: (database: ApplicationDatabaseConnection): UsersRuntimeComposition => {
        const repository = createKyselyUserRepository(database);
        const preferencesRepository = new KyselyUserPreferencesRepository(database);
        return Object.freeze({
          authenticationReader: new KyselyAuthenticationUserReader(database),
          preferencesRuntime: Object.freeze({
            get: (scope: unknown) =>
              new GetUserPreferencesUseCase(preferencesRepository).execute(scope),
            update: (
              scope: unknown,
              input: unknown,
              guard?: import('./application/ports/user-preferences-repository.port.js').UserPreferencesMutationGuard,
            ) =>
              new UpdateUserPreferencesUseCase(preferencesRepository).execute(
                scope,
                input,
                guard,
              ),
          }),
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
      provide: USER_PREFERENCES_RUNTIME,
      inject: [USERS_RUNTIME_COMPOSITION],
      useFactory: (composition: UsersRuntimeComposition): UserPreferencesRuntime =>
        composition.preferencesRuntime,
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
    USER_PREFERENCES_RUNTIME,
    USER_PRODUCT_RUNTIME,
    AUTHENTICATION_USER_READER,
    TENANT_BOOTSTRAP_USER_WRITER,
    ADMIN_INVITATION_USER_COMMIT_RUNTIME,
  ],
})
export class UsersModule {
  declare private readonly persistenceAdapter: RegisteredUsersPersistenceAdapter;
  declare private readonly useCases: RegisteredUsersUseCases;
}
