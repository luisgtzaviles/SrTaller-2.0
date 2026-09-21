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
  BRANCH_SETTINGS_RUNTIME,
  TRUSTED_STATION_ADMISSION_VALIDATOR,
  TRUSTED_STATION_CONTEXT_RESOLVER,
} from '../stations/index.js';
import type {
  BranchSettingsRuntime,
  TrustedStationAdmissionValidator,
  TrustedStationContextResolver,
} from '../stations/index.js';
import {
  AUTHENTICATION_USER_ADMISSION_VALIDATOR,
  AUTHENTICATION_USER_READER,
  USER_PREFERENCES_RUNTIME,
  USER_PRODUCT_RUNTIME,
} from '../users/index.js';
import type {
  AuthenticationUserAdmissionValidator,
  AuthenticationUserReader,
  UserPreferencesRuntime,
  UserProductRuntime,
} from '../users/index.js';

import { ADMIN_AUTHORIZATION_EXECUTOR, CONTEXTUAL_AUTHORIZATION_EXECUTOR, SENSITIVE_ACTION_LEVEL2_EXECUTOR, TENANT_WIDE_AUTHORIZATION_EXECUTOR } from './index.js';
import type { AdminAuthorizationExecutor } from './index.js';
import type { ContextualAuthorizationExecutor } from './index.js';
import type { TenantWideAuthorizationExecutor } from './index.js';
import type { SensitiveActionLevel2Executor } from './index.js';
import {
  AUTHENTICATED_SELF_EXECUTOR,
} from './application/authenticated-self-executor.js';
import type {
  AuthenticatedSelfExecutor,
} from './application/authenticated-self-executor.js';

import { ListAccessMatrixUseCase } from './application/use-cases/list-access-matrix.use-case.js';
import { CreateAccessRoleUseCase } from './application/use-cases/create-access-role.use-case.js';
import { ReplaceAccessRoleCapabilitiesUseCase } from './application/use-cases/replace-access-role-capabilities.use-case.js';
import { UpdateAccessRoleUseCase } from './application/use-cases/update-access-role.use-case.js';
import { AssignRoleUseCase } from './application/use-cases/assign-role.use-case.js';
import { RevokeRoleAssignmentUseCase } from './application/use-cases/revoke-role-assignment.use-case.js';
import type { KyselyAccessRepositoryFactory } from './infrastructure/persistence/kysely-access.repository.js';
import type { KyselyPinCredentialRepositoryFactory } from './infrastructure/persistence/kysely-pin-credential.repository.js';
import { KyselyAdminAuthRepository } from './infrastructure/persistence/kysely-admin-auth.repository.js';
import type { KyselyTenantBootstrapAccessWriter } from './infrastructure/persistence/kysely-tenant-bootstrap-access.writer.js';
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
import { NodeArgon2AdminPasswordHasher } from './infrastructure/security/node-argon2-admin-password-hasher.js';
import { NodeAdminSessionToken } from './infrastructure/security/node-admin-session-token.js';
import {
  AdminRecoveryFoundationUseCase,
  AdminSessionManagementUseCase,
  LoginAdminUseCase,
  ProvisionAdminIdentityUseCase,
  ResolveAdminSessionUseCase,
} from './application/use-cases/admin-session.use-cases.js';
import { composeEffectiveCapabilities } from './domain/capability.js';
import {
  ACCESS_SESSION_RUNTIME,
  AccessSessionController,
} from './presentation/access-session.controller.js';
import type { AccessSessionRuntime } from './presentation/access-session.controller.js';
import {
  AccessAdministrationController,
} from './presentation/access-administration.controller.js';
import { AdminSessionController } from './presentation/admin-session.controller.js';
import { BranchSettingsAdministrationController } from './presentation/branch-settings-administration.controller.js';
import { ContextualAuthorizationExecutorService } from './presentation/contextual-authorization.executor.js';
import { TenantWideAuthorizationExecutorService } from './presentation/tenant-wide-authorization.executor.js';
import { SensitiveActionLevel2ExecutorService } from './presentation/sensitive-action-level2.executor.js';
import { AuthenticatedSelfExecutorService } from './presentation/authenticated-self.executor.js';
import { AdminAuthorizationExecutorService } from './presentation/admin-authorization.executor.js';
import { AccessAdministrationOperations } from './application/access-administration-operations.js';
import { AccessSelfPreferencesOperations } from './application/access-self-preferences.operations.js';
import { UserPreferencesController } from './presentation/user-preferences.controller.js';

type RegisteredAccessPersistenceAdapter =
  | KyselyAccessRepositoryFactory
  | KyselyPinCredentialRepositoryFactory
  | KyselyAdminAuthRepository
  | KyselyTenantBootstrapAccessWriter;
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
  controllers: [
    AccessSessionController,
    AdminSessionController,
    AccessAdministrationController,
    BranchSettingsAdministrationController,
    UserPreferencesController,
  ],
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
        BRANCH_SETTINGS_RUNTIME,
      ],
      useFactory: (
        database: ApplicationDatabaseConnection,
        stationAdmission: TrustedStationAdmissionValidator,
        trustedStations: TrustedStationContextResolver,
        userAdmission: AuthenticationUserAdmissionValidator,
        users: AuthenticationUserReader,
        pinHashers: AccessPinHasherFactory,
        branchSettings: BranchSettingsRuntime,
      ): AccessSessionRuntime => {
        const accessRepository = createKyselyAccessRepository(database);
        const pinRepository = createKyselyPinCredentialRepository(database);
        const adminRepository = new KyselyAdminAuthRepository(database);
        // Active credential configuration is a readiness predicate. Construct
        // the hasher while the module is composed so a malformed pepper cannot
        // leave the process listening with every login guaranteed to fail.
        const pinHasher = pinHashers.create(NodeArgon2PinHasher);
        const adminPasswordHasher = pinHashers.createAdminPasswordHasher(
          NodeArgon2AdminPasswordHasher,
        );
        const adminTokens = new NodeAdminSessionToken();
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
          readTimeZone: (
            scope: Parameters<BranchSettingsRuntime['readTimeZone']>[0],
          ) => branchSettings.readTimeZone(scope),
          updateTimeZone: (
            scope: Parameters<BranchSettingsRuntime['updateTimeZone']>[0],
            timeZone: Parameters<BranchSettingsRuntime['updateTimeZone']>[1],
          ) => branchSettings.updateTimeZone(scope, timeZone),
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
          listLoginUsers: new ListLoginUsersUseCase(
            users,
            applicableUsers,
            (scope) => pinRepository.listConfiguredUserIds(scope as never),
          ),
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
          admin: Object.freeze({
            provision: new ProvisionAdminIdentityUseCase(adminRepository, users, adminPasswordHasher),
            login: new LoginAdminUseCase(adminRepository, users, adminPasswordHasher, adminTokens),
            resolve: new ResolveAdminSessionUseCase(adminRepository, users, adminTokens),
            sessions: new AdminSessionManagementUseCase(adminRepository, adminPasswordHasher),
            recovery: new AdminRecoveryFoundationUseCase(adminRepository, users, adminPasswordHasher, adminTokens),
            tokens: adminTokens,
            capabilities: async (tenantId: string, userId: string) => {
              const matrix = await new ListAccessMatrixUseCase(accessRepository).execute({ tenantId });
              const activeRoles = new Map(matrix.roles.filter((role) => role.status === 'active').map((role) => [role.roleId, role.capabilityCodes]));
              const capabilities = matrix.assignments
                .filter((assignment) => assignment.userId === userId && assignment.status === 'active' && assignment.assignmentScope === 'TENANT_WIDE' && assignment.branchId === null)
                .flatMap((assignment) => activeRoles.get(assignment.roleId) ?? []);
              return composeEffectiveCapabilities(capabilities);
            },
          }),
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
      provide: ADMIN_AUTHORIZATION_EXECUTOR,
      inject: [ACCESS_SESSION_RUNTIME],
      useFactory: (runtime: AccessSessionRuntime): AdminAuthorizationExecutor =>
        new AdminAuthorizationExecutorService(
          runtime,
          new KyselyAdministrationAuthorizationCommitGuard(),
        ),
    },
    {
      provide: TENANT_WIDE_AUTHORIZATION_EXECUTOR,
      inject: [CONTEXTUAL_AUTHORIZATION_EXECUTOR, ACCESS_SESSION_RUNTIME],
      useFactory: (contextual: ContextualAuthorizationExecutor, runtime: AccessSessionRuntime): TenantWideAuthorizationExecutor =>
        new TenantWideAuthorizationExecutorService(contextual, runtime, new KyselyAdministrationAuthorizationCommitGuard()),
    },
    {
      provide: AUTHENTICATED_SELF_EXECUTOR,
      inject: [ACCESS_SESSION_RUNTIME],
      useFactory: (runtime: AccessSessionRuntime): AuthenticatedSelfExecutor =>
        new AuthenticatedSelfExecutorService(runtime),
    },
    {
      provide: SENSITIVE_ACTION_LEVEL2_EXECUTOR,
      inject: [TENANT_WIDE_AUTHORIZATION_EXECUTOR, ACCESS_SESSION_RUNTIME],
      useFactory: (tenantWide: TenantWideAuthorizationExecutor, runtime: AccessSessionRuntime): SensitiveActionLevel2Executor =>
        new SensitiveActionLevel2ExecutorService(tenantWide, runtime),
    },
    {
      provide: AccessSelfPreferencesOperations,
      inject: [AUTHENTICATED_SELF_EXECUTOR, USER_PREFERENCES_RUNTIME],
      useFactory: (
        authorization: AuthenticatedSelfExecutor,
        preferences: UserPreferencesRuntime,
      ): AccessSelfPreferencesOperations =>
        new AccessSelfPreferencesOperations(authorization, preferences),
    },
    {
      provide: AccessAdministrationOperations,
      inject: [
        CONTEXTUAL_AUTHORIZATION_EXECUTOR,
        USER_PRODUCT_RUNTIME,
        ACCESS_SESSION_RUNTIME,
      ],
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
        runtime,
      ),
    },
  ],
  exports: [CONTEXTUAL_AUTHORIZATION_EXECUTOR, TENANT_WIDE_AUTHORIZATION_EXECUTOR, SENSITIVE_ACTION_LEVEL2_EXECUTOR],
})
export class AccessModule {
  declare private readonly persistenceAdapter: RegisteredAccessPersistenceAdapter;
  declare private readonly securityAdapter: RegisteredAccessSecurityAdapter;
  declare private readonly useCases: RegisteredAccessUseCases;
}
