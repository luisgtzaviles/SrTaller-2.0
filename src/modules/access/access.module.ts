import { Module } from '@nestjs/common';

import { RuntimeInfrastructureModule } from '../../infrastructure/runtime/runtime-infrastructure.module.js';
import {
  ACCESS_PIN_HASHER_FACTORY,
  APPLICATION_DATABASE_CONNECTION,
} from '../../infrastructure/runtime/index.js';
import type {
  AccessPinHasherFactory,
  ApplicationDatabaseConnection,
} from '../../infrastructure/runtime/index.js';
import { StationsModule } from '../stations/stations.module.js';
import { UsersModule } from '../users/users.module.js';
import {
  TRUSTED_STATION_ADMISSION_VALIDATOR,
  TRUSTED_STATION_CONTEXT_RESOLVER,
} from '../stations/index.js';
import type {
  TrustedStationAdmissionValidator,
  TrustedStationContextResolver,
} from '../stations/index.js';
import {
  AUTHENTICATION_USER_ADMISSION_VALIDATOR,
  AUTHENTICATION_USER_READER,
  USER_PRODUCT_RUNTIME,
} from '../users/index.js';
import type {
  AuthenticationUserAdmissionValidator,
  AuthenticationUserReader,
  UserProductRuntime,
} from '../users/index.js';

import { CONTEXTUAL_AUTHORIZATION_EXECUTOR } from './index.js';
import type { ContextualAuthorizationExecutor } from './index.js';

import { ListAccessMatrixUseCase } from './application/use-cases/list-access-matrix.use-case.js';
import { CreateAccessRoleUseCase } from './application/use-cases/create-access-role.use-case.js';
import { ReplaceAccessRoleCapabilitiesUseCase } from './application/use-cases/replace-access-role-capabilities.use-case.js';
import { UpdateAccessRoleUseCase } from './application/use-cases/update-access-role.use-case.js';
import { AssignRoleUseCase } from './application/use-cases/assign-role.use-case.js';
import { RevokeRoleAssignmentUseCase } from './application/use-cases/revoke-role-assignment.use-case.js';
import type { KyselyAccessRepositoryFactory } from './infrastructure/persistence/kysely-access.repository.js';
import type { KyselyPinCredentialRepositoryFactory } from './infrastructure/persistence/kysely-pin-credential.repository.js';
import { ProvisionPinCredentialUseCase } from './application/use-cases/provision-pin-credential.use-case.js';
import { ReplacePinCredentialUseCase } from './application/use-cases/replace-pin-credential.use-case.js';
import { AuthenticatePinUseCase } from './application/use-cases/authenticate-pin.use-case.js';
import { AuthenticatePinOnlyUseCase } from './application/use-cases/authenticate-pin-only.use-case.js';
import { ListApplicableUsersUseCase } from './application/use-cases/list-applicable-users.use-case.js';
import { ResolveEffectiveCapabilitiesUseCase } from './application/use-cases/resolve-effective-capabilities.use-case.js';
import {
  CreateOperationalSessionUseCase,
  EndOperationalSessionUseCase,
  ListLoginUsersUseCase,
  ResolveOperationalSessionUseCase,
} from './application/use-cases/operational-session.use-cases.js';
import { createKyselyAccessRepository } from './infrastructure/persistence/kysely-access.repository.js';
import { createKyselyPinCredentialRepository } from './infrastructure/persistence/kysely-pin-credential.repository.js';
import { KyselyOperationalSessionRepository } from './infrastructure/persistence/kysely-operational-session.repository.js';
import { KyselyAdministrationAuthorizationCommitGuard } from './infrastructure/persistence/kysely-administration-authorization-commit.guard.js';
import { NodeArgon2PinHasher } from './infrastructure/security/node-argon2-pin-hasher.js';
import { NodeSessionToken } from './infrastructure/security/node-session-token.js';
import {
  ACCESS_SESSION_RUNTIME,
  AccessSessionController,
} from './presentation/access-session.controller.js';
import type { AccessSessionRuntime } from './presentation/access-session.controller.js';
import { AccessAdministrationController } from './presentation/access-administration.controller.js';
import { ContextualAuthorizationExecutorService } from './presentation/contextual-authorization.executor.js';
import { AccessAdministrationOperations } from './application/access-administration-operations.js';

type RegisteredAccessPersistenceAdapter =
  | KyselyAccessRepositoryFactory
  | KyselyPinCredentialRepositoryFactory;
type RegisteredAccessSecurityAdapter = NodeArgon2PinHasher;
type RegisteredAccessUseCases =
  | AuthenticatePinUseCase
  | AuthenticatePinOnlyUseCase
  | AssignRoleUseCase
  | ListAccessMatrixUseCase
  | ListApplicableUsersUseCase
  | ResolveEffectiveCapabilitiesUseCase
  | RevokeRoleAssignmentUseCase
  | UpdateAccessRoleUseCase
  | ProvisionPinCredentialUseCase;

@Module({
  imports: [RuntimeInfrastructureModule, StationsModule, UsersModule],
  controllers: [AccessSessionController, AccessAdministrationController],
  providers: [
    {
      provide: ACCESS_SESSION_RUNTIME,
      inject: [
        APPLICATION_DATABASE_CONNECTION,
        TRUSTED_STATION_ADMISSION_VALIDATOR,
        TRUSTED_STATION_CONTEXT_RESOLVER,
        AUTHENTICATION_USER_ADMISSION_VALIDATOR,
        AUTHENTICATION_USER_READER,
        ACCESS_PIN_HASHER_FACTORY,
      ],
      useFactory: (
        database: ApplicationDatabaseConnection,
        stationAdmission: TrustedStationAdmissionValidator,
        trustedStations: TrustedStationContextResolver,
        userAdmission: AuthenticationUserAdmissionValidator,
        users: AuthenticationUserReader,
        pinHashers: AccessPinHasherFactory,
      ): AccessSessionRuntime => {
        const accessRepository = createKyselyAccessRepository(database);
        const pinRepository = createKyselyPinCredentialRepository(database);
        // Active credential configuration is a readiness predicate. Construct
        // the hasher while the module is composed so a malformed pepper cannot
        // leave the process listening with every login guaranteed to fail.
        const pinHasher = pinHashers.create(NodeArgon2PinHasher);
        const sessionRepository = new KyselyOperationalSessionRepository(
          database,
          stationAdmission,
          userAdmission,
        );
        const applicableUsers = new ListApplicableUsersUseCase(accessRepository);
        const resolveCapabilities = new ResolveEffectiveCapabilitiesUseCase(
          accessRepository,
        );
        const tokens = new NodeSessionToken();
        const resolveSession = new ResolveOperationalSessionUseCase(
          sessionRepository,
          users,
          applicableUsers,
          tokens,
        );
        const authenticatePin = new AuthenticatePinUseCase(
          pinRepository,
          users,
          pinHasher,
        );
        const pinOnly = new AuthenticatePinOnlyUseCase(
          pinRepository,
          users,
          applicableUsers,
          pinHasher,
        );
        return Object.freeze({
          trustedStations,
          authenticatePin,
          authenticatePinOnly: pinOnly,
          createSession: new CreateOperationalSessionUseCase(
            sessionRepository,
            users,
            applicableUsers,
            tokens,
          ),
          resolveSession,
          resolveCapabilities,
          endSession: new EndOperationalSessionUseCase(
            sessionRepository,
            tokens,
          ),
          listLoginUsers: new ListLoginUsersUseCase(users, applicableUsers),
          listAccessMatrix: new ListAccessMatrixUseCase(accessRepository),
          createAccessRole: new CreateAccessRoleUseCase(accessRepository),
          replaceAccessRoleCapabilities: new ReplaceAccessRoleCapabilitiesUseCase(accessRepository),
          updateAccessRole: new UpdateAccessRoleUseCase(accessRepository),
          assignRole: new AssignRoleUseCase(accessRepository),
          revokeRoleAssignment: new RevokeRoleAssignmentUseCase(accessRepository),
          provisionPin: new ProvisionPinCredentialUseCase(pinRepository, pinHasher),
          replacePin: new ReplacePinCredentialUseCase(pinRepository, pinHasher),
          listConfiguredPinUserIds: (scope: unknown) => pinRepository.listConfiguredUserIds(scope as never),
          tokens,
        });
      },
    },
    {
      provide: CONTEXTUAL_AUTHORIZATION_EXECUTOR,
      inject: [ACCESS_SESSION_RUNTIME],
      useFactory: (
        runtime: AccessSessionRuntime,
      ): ContextualAuthorizationExecutor =>
        new ContextualAuthorizationExecutorService(runtime),
    },
    {
      provide: AccessAdministrationOperations,
      inject: [CONTEXTUAL_AUTHORIZATION_EXECUTOR, USER_PRODUCT_RUNTIME, ACCESS_SESSION_RUNTIME],
      useFactory: (
        authorization: ContextualAuthorizationExecutor,
        users: UserProductRuntime,
        runtime: AccessSessionRuntime,
      ): AccessAdministrationOperations => new AccessAdministrationOperations(
        authorization,
        users,
        (scope: unknown) => runtime.listAccessMatrix.execute(scope),
        (scope: unknown, input: unknown, guard) => runtime.createAccessRole.execute(scope, input, guard),
        (scope: unknown, roleId: unknown, input: unknown, guard) => runtime.replaceAccessRoleCapabilities.execute(scope, roleId, input, guard),
        (scope: unknown, roleId: unknown, input: unknown, guard) => runtime.updateAccessRole.execute(scope, roleId, input, guard),
        (scope: unknown, input: unknown, guard) => runtime.assignRole.execute(scope, input, guard),
        (scope: unknown, input: unknown, guard) => runtime.revokeRoleAssignment.execute(scope, input, guard),
        (scope: unknown, input: unknown, guard) => runtime.provisionPin.execute(scope, input, guard),
        (scope: unknown, input: unknown, guard) => runtime.replacePin.execute(scope, input, guard),
        (scope: unknown) => runtime.listConfiguredPinUserIds(scope),
        new KyselyAdministrationAuthorizationCommitGuard(),
      ),
    },
  ],
  exports: [CONTEXTUAL_AUTHORIZATION_EXECUTOR],
})
export class AccessModule {
  declare private readonly persistenceAdapter: RegisteredAccessPersistenceAdapter;
  declare private readonly securityAdapter: RegisteredAccessSecurityAdapter;
  declare private readonly useCases: RegisteredAccessUseCases;
}
