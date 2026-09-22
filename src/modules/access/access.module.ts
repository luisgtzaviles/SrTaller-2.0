import { createHash } from 'node:crypto';

import { Module } from '@nestjs/common';

import { RuntimeInfrastructureModule } from '../../infrastructure/runtime/runtime-infrastructure.module.js';
import {
  ACCESS_PIN_HASHER_FACTORY,
  APPLICATION_DATABASE_CONNECTION,
  REGISTRATION_RUNTIME_CONFIGURATION,
} from '../../infrastructure/runtime/index.js';
import type {
  AccessPinHasherFactory,
  ApplicationDatabaseConnection,
  RegistrationRuntimeConfiguration,
} from '../../infrastructure/runtime/index.js';
import { LocalEmailDelivery, ResendEmailDelivery } from '../../infrastructure/email/email-delivery.js';
import { StationsModule } from '../stations/stations.module.js';
import { UsersModule } from '../users/users.module.js';
import { TenancyModule } from '../tenancy/tenancy.module.js';
import { TENANT_BOOTSTRAP_PERSISTENCE, TENANT_LIFECYCLE_COMMIT_RUNTIME } from '../tenancy/index.js';
import type { TenantBootstrapPersistence, TenantLifecycleCommitRuntime } from '../tenancy/index.js';
import { ADMIN_INVITATION_USER_COMMIT_RUNTIME, TENANT_BOOTSTRAP_USER_WRITER } from '../users/index.js';
import type { AdminInvitationUserCommitRuntime, TenantBootstrapUserWriter } from '../users/index.js';
import {
  BRANCH_ADMINISTRATION_RUNTIME,
  BRANCH_SETTINGS_RUNTIME,
  ADMIN_INVITATION_BRANCH_COMMIT_VALIDATOR,
  TRUSTED_STATION_ADMISSION_VALIDATOR,
  TRUSTED_STATION_CONTEXT_RESOLVER,
} from '../stations/index.js';
import type {
  BranchAdministrationRuntime,
  BranchSettingsRuntime,
  AdminInvitationBranchCommitValidator,
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

import { ADMIN_AUTHORIZATION_EXECUTOR, CONTEXTUAL_AUTHORIZATION_EXECUTOR, REGISTRATION_PASSWORD_PROTECTOR, SENSITIVE_ACTION_LEVEL2_EXECUTOR, TENANT_BOOTSTRAP_EXECUTOR, TENANT_WIDE_AUTHORIZATION_EXECUTOR } from './index.js';
import type { AdminAuthorizationExecutor } from './index.js';
import type { ContextualAuthorizationExecutor } from './index.js';
import type { TenantWideAuthorizationExecutor } from './index.js';
import type { SensitiveActionLevel2Executor } from './index.js';
import type { RegistrationPasswordProtector, TenantBootstrapExecutor } from './index.js';
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
import type { CapabilityCode } from './domain/capability.js';
import {
  ACCESS_SESSION_RUNTIME,
  AccessSessionController,
} from './presentation/access-session.controller.js';
import type { AccessSessionRuntime } from './presentation/access-session.controller.js';
import {
  AccessAdministrationController,
} from './presentation/access-administration.controller.js';
import { AdminSessionController } from './presentation/admin-session.controller.js';
import {
  ACCESS_BRANCH_ADMINISTRATION_RUNTIME,
  AdminBranchesController,
} from './presentation/admin-branches.controller.js';
import { AdminStationsController } from './presentation/admin-stations.controller.js';
import { BranchSettingsAdministrationController } from './presentation/branch-settings-administration.controller.js';
import { ContextualAuthorizationExecutorService } from './presentation/contextual-authorization.executor.js';
import { TenantWideAuthorizationExecutorService } from './presentation/tenant-wide-authorization.executor.js';
import { SensitiveActionLevel2ExecutorService } from './presentation/sensitive-action-level2.executor.js';
import { AuthenticatedSelfExecutorService } from './presentation/authenticated-self.executor.js';
import { AdminAuthorizationExecutorService } from './presentation/admin-authorization.executor.js';
import { AccessAdministrationOperations } from './application/access-administration-operations.js';
import { AccessSelfPreferencesOperations } from './application/access-self-preferences.operations.js';
import { UserPreferencesController } from './presentation/user-preferences.controller.js';
import { BootstrapTenantUseCase } from './application/use-cases/bootstrap-tenant.use-case.js';
import { KyselyTenantBootstrapAccessWriter, KyselyTenantBootstrapTransaction } from './infrastructure/persistence/kysely-tenant-bootstrap-access.writer.js';
import { KyselyAdminInvitationRepository } from './infrastructure/persistence/kysely-admin-invitation.repository.js';
import { ADMIN_INVITATION_SERVICE, AdminInvitationService } from './application/use-cases/admin-invitation.use-cases.js';
import { AdminUsersRolesOperations } from './application/admin-users-roles.operations.js';
import { AdminUsersRolesController, PublicAdminInvitationController } from './presentation/admin-users-roles.controller.js';
import { KyselyAdminLifecycleRepository } from './infrastructure/persistence/kysely-admin-lifecycle.repository.js';
import type { AdminInvitationRepositoryPort } from './application/ports/admin-invitation-repository.port.js';
import type { AdminLifecycleRepositoryPort } from './application/ports/admin-users-roles-runtime.port.js';

type AccessCompositionRuntime = AccessSessionRuntime & Readonly<{
  users: UserProductRuntime;
  adminInvitationRepository: AdminInvitationRepositoryPort;
  adminLifecycle: AdminLifecycleRepositoryPort;
}>;

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
  imports: [RuntimeInfrastructureModule, StationsModule, TenancyModule, UsersModule],
  controllers: [
    AccessSessionController,
    AdminSessionController,
    AdminBranchesController,
    AdminStationsController,
    AdminUsersRolesController,
    PublicAdminInvitationController,
    AccessAdministrationController,
    BranchSettingsAdministrationController,
    UserPreferencesController,
  ],
  providers: [
    {
      provide: ACCESS_BRANCH_ADMINISTRATION_RUNTIME,
      inject: [BRANCH_ADMINISTRATION_RUNTIME],
      useFactory: (
        branches: BranchAdministrationRuntime,
      ): BranchAdministrationRuntime => branches,
    },
    {
      provide: ACCESS_SESSION_RUNTIME,
      inject: [
        APPLICATION_DATABASE_CONNECTION,
        TRUSTED_STATION_ADMISSION_VALIDATOR,
        TRUSTED_STATION_CONTEXT_RESOLVER,
        AUTHENTICATION_USER_ADMISSION_VALIDATOR,
        AUTHENTICATION_USER_READER,
        USER_PRODUCT_RUNTIME,
        TENANT_LIFECYCLE_COMMIT_RUNTIME,
        ADMIN_INVITATION_USER_COMMIT_RUNTIME,
        ADMIN_INVITATION_BRANCH_COMMIT_VALIDATOR,
        ACCESS_PIN_HASHER_FACTORY,
        BRANCH_SETTINGS_RUNTIME,
      ],
      useFactory: (
        database: ApplicationDatabaseConnection,
        stationAdmission: TrustedStationAdmissionValidator,
        trustedStations: TrustedStationContextResolver,
        userAdmission: AuthenticationUserAdmissionValidator,
        users: AuthenticationUserReader,
        productUsers: UserProductRuntime,
        tenantLifecycle: TenantLifecycleCommitRuntime,
        invitationUsers: AdminInvitationUserCommitRuntime,
        invitationBranches: AdminInvitationBranchCommitValidator,
        pinHashers: AccessPinHasherFactory,
        branchSettings: BranchSettingsRuntime,
      ): AccessCompositionRuntime => {
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
          invalidateStationSessionsAtCommit: (
            tenantId: string,
            stationId: string,
            occurredAt: string,
            transactionContext: object,
          ) => sessionRepository.invalidateByStationAtCommit(
            { tenantId },
            { stationId, occurredAt },
            transactionContext,
          ),
          tokens,
          registrationPasswordHasher: adminPasswordHasher,
          tenantBootstrapTransaction: new KyselyTenantBootstrapTransaction(database as never),
          users: productUsers,
          adminInvitationRepository: new KyselyAdminInvitationRepository(
            database,
            tenantLifecycle,
            invitationUsers,
            invitationBranches,
          ),
          adminLifecycle: new KyselyAdminLifecycleRepository(database),
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
                .filter((assignment) => assignment.userId === userId && assignment.status === 'active')
                .flatMap((assignment) => activeRoles.get(assignment.roleId) ?? []);
              return composeEffectiveCapabilities(capabilities);
            },
            capabilityAuthority: async (tenantId: string, userId: string, capability: CapabilityCode) => {
              const matrix = await new ListAccessMatrixUseCase(accessRepository).execute({ tenantId });
              const roles = new Map(matrix.roles
                .filter((role) => role.status === 'active' && role.capabilityCodes.includes(capability))
                .map((role) => [role.roleId, role]));
              const grants = matrix.assignments
                .filter((assignment) => assignment.userId === userId && assignment.status === 'active' && roles.has(assignment.roleId));
              if (grants.length === 0) return null;
              const tenantWide = grants.some((grant) => grant.assignmentScope === 'TENANT_WIDE' && grant.branchId === null);
              const branchIds = tenantWide ? null : Object.freeze([...new Set(grants
                .filter((grant) => grant.assignmentScope === 'BRANCH_RESTRICTED' && grant.branchId !== null)
                .map((grant) => grant.branchId as string))].sort());
              if (branchIds !== null && branchIds.length === 0) return null;
              const snapshot = grants.map((grant) => ({
                assignmentId: grant.assignmentId,
                assignmentVersion: grant.version,
                assignmentScope: grant.assignmentScope,
                branchId: grant.branchId,
                roleId: grant.roleId,
                roleVersion: roles.get(grant.roleId)!.version,
              })).sort((left, right) => left.assignmentId.localeCompare(right.assignmentId));
              return Object.freeze({
                branchIds,
                digest: createHash('sha256').update(JSON.stringify({ tenantId, userId, capability, snapshot })).digest(),
              });
            },
          }),
        });
      },
    },
    {
      provide: REGISTRATION_PASSWORD_PROTECTOR,
      inject: [ACCESS_SESSION_RUNTIME],
      useFactory: (runtime: AccessSessionRuntime): RegistrationPasswordProtector => Object.freeze({
        protect: (input: Parameters<RegistrationPasswordProtector['protect']>[0]) =>
          runtime.registrationPasswordHasher.hash({
            tenantId: input.tenantId,
            adminIdentityId: input.adminIdentityId,
            password: input.password as never,
          }),
      }),
    },
    {
      provide: TENANT_BOOTSTRAP_EXECUTOR,
      inject: [ACCESS_SESSION_RUNTIME, TENANT_BOOTSTRAP_PERSISTENCE, TENANT_BOOTSTRAP_USER_WRITER],
      useFactory: (
        runtime: AccessCompositionRuntime,
        tenancy: TenantBootstrapPersistence,
        users: TenantBootstrapUserWriter,
      ): TenantBootstrapExecutor => ({
        execute: async (input) => {
          const useCase = new BootstrapTenantUseCase(
            { loadVerifiedGrant: (registrationId) => input.loadVerifiedGrant(registrationId) as never },
            runtime.tenantBootstrapTransaction,
            tenancy.writer,
            users,
            new KyselyTenantBootstrapAccessWriter(),
          );
          const result = await useCase.execute({
            verifiedRegistrationId: input.verifiedRegistrationId,
            correlationId: input.correlationId,
          });
          return Object.freeze({ tenantStatus: result.tenantStatus, completedAt: result.completedAt });
        },
      }),
    },
    {
      provide: CONTEXTUAL_AUTHORIZATION_EXECUTOR,
      inject: [ACCESS_SESSION_RUNTIME],
      useFactory: (
        runtime: AccessCompositionRuntime,
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
      provide: ADMIN_INVITATION_SERVICE,
      inject: [ACCESS_SESSION_RUNTIME, REGISTRATION_RUNTIME_CONFIGURATION],
      useFactory: (
        runtime: AccessCompositionRuntime,
        configuration: RegistrationRuntimeConfiguration,
      ): AdminInvitationService => new AdminInvitationService(
        runtime.adminInvitationRepository,
        runtime.registrationPasswordHasher,
        configuration.mode === 'local'
          ? new LocalEmailDelivery()
          : configuration.createResendAdapter(ResendEmailDelivery),
        configuration.publicBaseUrl,
      ),
    },
    {
      provide: AdminUsersRolesOperations,
      inject: [ADMIN_AUTHORIZATION_EXECUTOR, ACCESS_SESSION_RUNTIME, ADMIN_INVITATION_SERVICE],
      useFactory: (
        authorization: AdminAuthorizationExecutor,
        runtime: AccessCompositionRuntime,
        invitations: AdminInvitationService,
      ): AdminUsersRolesOperations => new AdminUsersRolesOperations(authorization, runtime.users, runtime, invitations, runtime.adminLifecycle),
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
        ACCESS_SESSION_RUNTIME,
      ],
      useFactory: (
        authorization: ContextualAuthorizationExecutor,
        runtime: AccessCompositionRuntime,
      ): AccessAdministrationOperations => new AccessAdministrationOperations(
        authorization,
        runtime.users,
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
  exports: [CONTEXTUAL_AUTHORIZATION_EXECUTOR, TENANT_WIDE_AUTHORIZATION_EXECUTOR, SENSITIVE_ACTION_LEVEL2_EXECUTOR, REGISTRATION_PASSWORD_PROTECTOR, TENANT_BOOTSTRAP_EXECUTOR],
})
export class AccessModule {
  declare private readonly persistenceAdapter: RegisteredAccessPersistenceAdapter;
  declare private readonly securityAdapter: RegisteredAccessSecurityAdapter;
  declare private readonly useCases: RegisteredAccessUseCases;
}
