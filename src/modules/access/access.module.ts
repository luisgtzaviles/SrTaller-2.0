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
} from '../users/index.js';
import type {
  AuthenticationUserAdmissionValidator,
  AuthenticationUserReader,
} from '../users/index.js';

import type { AssignRoleUseCase } from './application/use-cases/assign-role.use-case.js';
import type { ListAccessMatrixUseCase } from './application/use-cases/list-access-matrix.use-case.js';
import type { ResolveEffectiveCapabilitiesUseCase } from './application/use-cases/resolve-effective-capabilities.use-case.js';
import type { RevokeRoleAssignmentUseCase } from './application/use-cases/revoke-role-assignment.use-case.js';
import type { KyselyAccessRepositoryFactory } from './infrastructure/persistence/kysely-access.repository.js';
import type { KyselyPinCredentialRepositoryFactory } from './infrastructure/persistence/kysely-pin-credential.repository.js';
import type { ProvisionPinCredentialUseCase } from './application/use-cases/provision-pin-credential.use-case.js';
import { AuthenticatePinUseCase } from './application/use-cases/authenticate-pin.use-case.js';
import { ListApplicableUsersUseCase } from './application/use-cases/list-applicable-users.use-case.js';
import {
  CreateOperationalSessionUseCase,
  EndOperationalSessionUseCase,
  ListLoginUsersUseCase,
  ResolveOperationalSessionUseCase,
} from './application/use-cases/operational-session.use-cases.js';
import { createKyselyAccessRepository } from './infrastructure/persistence/kysely-access.repository.js';
import { createKyselyPinCredentialRepository } from './infrastructure/persistence/kysely-pin-credential.repository.js';
import { KyselyOperationalSessionRepository } from './infrastructure/persistence/kysely-operational-session.repository.js';
import { createDeferredNodeArgon2PinHasher, NodeArgon2PinHasher } from './infrastructure/security/node-argon2-pin-hasher.js';
import { NodeSessionToken } from './infrastructure/security/node-session-token.js';
import {
  ACCESS_SESSION_RUNTIME,
  AccessSessionController,
} from './presentation/access-session.controller.js';
import type { AccessSessionRuntime } from './presentation/access-session.controller.js';

type RegisteredAccessPersistenceAdapter =
  | KyselyAccessRepositoryFactory
  | KyselyPinCredentialRepositoryFactory;
type RegisteredAccessSecurityAdapter = NodeArgon2PinHasher;
type RegisteredAccessUseCases =
  | AuthenticatePinUseCase
  | AssignRoleUseCase
  | ListAccessMatrixUseCase
  | ListApplicableUsersUseCase
  | ResolveEffectiveCapabilitiesUseCase
  | RevokeRoleAssignmentUseCase
  | ProvisionPinCredentialUseCase;

@Module({
  imports: [RuntimeInfrastructureModule, StationsModule, UsersModule],
  controllers: [AccessSessionController],
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
        const sessionRepository = new KyselyOperationalSessionRepository(
          database,
          stationAdmission,
          userAdmission,
        );
        const applicableUsers = new ListApplicableUsersUseCase(accessRepository);
        const tokens = new NodeSessionToken();
        const resolveSession = new ResolveOperationalSessionUseCase(
          sessionRepository,
          users,
          applicableUsers,
          tokens,
        );
        return Object.freeze({
          trustedStations,
          authenticatePin: new AuthenticatePinUseCase(
            pinRepository,
            users,
            createDeferredNodeArgon2PinHasher(
              () => pinHashers.create(NodeArgon2PinHasher),
            ),
          ),
          createSession: new CreateOperationalSessionUseCase(
            sessionRepository,
            users,
            applicableUsers,
            tokens,
          ),
          resolveSession,
          endSession: new EndOperationalSessionUseCase(
            resolveSession,
            sessionRepository,
          ),
          listLoginUsers: new ListLoginUsersUseCase(users, applicableUsers),
          tokens,
        });
      },
    },
  ],
})
export class AccessModule {
  declare private readonly persistenceAdapter: RegisteredAccessPersistenceAdapter;
  declare private readonly securityAdapter: RegisteredAccessSecurityAdapter;
  declare private readonly useCases: RegisteredAccessUseCases;
}
