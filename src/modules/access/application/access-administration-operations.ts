import type {
  AuthorizedOperationalContext,
  ContextualAuthorizationExecutor,
  ProtectedRequestEvidence,
} from '../index.js';
import { ContextualAuthorizationError } from '../index.js';
import type { UserProductRuntime } from '../../users/index.js';
import type { BranchSettingsRuntime } from '../../stations/index.js';
import type { CapabilityCode } from '../domain/capability.js';
import type { AccessMatrixRecord } from './ports/access-repository.port.js';
import type { AdministrationAuthorizationCommitGuardPort } from './ports/administration-authorization-commit-guard.port.js';

type AdministrationMutationGuard = Readonly<{
  confirmCurrent(transactionContext: object): Promise<boolean>;
  confirmContinuity(transactionContext: object): Promise<boolean>;
}>;

const usersReadRequirement = Object.freeze({
  capability: 'users.read' as const,
  kind: 'read' as const,
});

const usersManageRequirement = Object.freeze({
  capability: 'users.manage' as const,
  kind: 'state-change' as const,
});

const accessMatrixReadRequirement = Object.freeze({
  capability: 'access_matrix.read' as const,
  kind: 'read' as const,
});

const accessMatrixManageRequirement = Object.freeze({
  capability: 'access_matrix.manage' as const,
  kind: 'state-change' as const,
});

const branchSettingsReadRequirement = Object.freeze({
  capability: 'access_matrix.manage' as const,
  kind: 'read' as const,
});

const canonicalUuid =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/u;
const localAdminPinPattern = /^[0-9]{4}$/u;

export class AccessAdministrationRequestError extends Error {
  readonly code = 'ADMIN_REQUEST_INVALID';

  constructor(readonly parameter: string) {
    super('Invalid access administration request.');
    this.name = 'AccessAdministrationRequestError';
  }
}

export class AccessAdministrationResourceNotFoundError extends Error {
  readonly code = 'ADMIN_RESOURCE_NOT_FOUND';

  constructor() {
    super('The requested administration resource was not found.');
    this.name = 'AccessAdministrationResourceNotFoundError';
  }
}

class AccessAdministrationInvariantError extends Error {
  constructor() {
    super('Access administration authority could not be resolved.');
    this.name = 'AccessAdministrationInvariantError';
  }
}

function exactObject(
  value: unknown,
  allowedKeys: readonly string[],
): Readonly<Record<string, unknown>> {
  if (
    typeof value !== 'object' ||
    value === null ||
    Array.isArray(value) ||
    Object.keys(value).length !== allowedKeys.length ||
    Object.keys(value).some((key) => !allowedKeys.includes(key))
  ) {
    throw new AccessAdministrationRequestError('payload');
  }
  return value as Readonly<Record<string, unknown>>;
}

function uuid(value: unknown, parameter: string): string {
  if (typeof value !== 'string' || !canonicalUuid.test(value)) {
    throw new AccessAdministrationRequestError(parameter);
  }
  return value;
}

function hasErrorCode(error: unknown, code: string): boolean {
  return typeof error === 'object' && error !== null &&
    'code' in error && error.code === code;
}

function accessMatrix(value: unknown): AccessMatrixRecord {
  if (
    typeof value !== 'object' ||
    value === null ||
    Array.isArray(value) ||
    !Array.isArray((value as { capabilities?: unknown }).capabilities) ||
    !Array.isArray((value as { roles?: unknown }).roles) ||
    !Array.isArray((value as { assignments?: unknown }).assignments)
  ) {
    throw new AccessAdministrationInvariantError();
  }
  return value as AccessMatrixRecord;
}

type AdministrationUser = Awaited<ReturnType<UserProductRuntime['create']>> &
  Readonly<{ pinConfigured: boolean }>;

/** Access composes User commands only after server-side authorization. */
export class AccessAdministrationOperations {
  constructor(
    private readonly authorization: ContextualAuthorizationExecutor,
    private readonly users: UserProductRuntime,
    private readonly listAccessMatrix: (scope: unknown) => Promise<unknown>,
    private readonly createAccessRole: (scope: unknown, input: unknown, guard?: AdministrationMutationGuard) => Promise<unknown>,
    private readonly replaceAccessRoleCapabilities: (scope: unknown, roleId: unknown, input: unknown, guard?: AdministrationMutationGuard) => Promise<unknown>,
    private readonly updateAccessRole: (scope: unknown, roleId: unknown, input: unknown, guard?: AdministrationMutationGuard) => Promise<unknown>,
    private readonly assignRoleUseCase: (scope: unknown, input: unknown, guard?: AdministrationMutationGuard) => Promise<unknown>,
    private readonly revokeRoleAssignmentUseCase: (scope: unknown, input: unknown, guard?: AdministrationMutationGuard) => Promise<unknown>,
    private readonly provisionPin: (scope: unknown, input: unknown, guard?: AdministrationMutationGuard) => Promise<unknown>,
    private readonly replacePin: (scope: unknown, input: unknown, guard?: AdministrationMutationGuard) => Promise<unknown>,
    private readonly listConfiguredPinUserIds: (scope: unknown) => Promise<readonly string[]>,
    private readonly administrationCommitGuard?: AdministrationAuthorizationCommitGuardPort,
    private readonly branchSettings?: BranchSettingsRuntime,
  ) {}

  private branchSettingsRuntime(): BranchSettingsRuntime {
    if (this.branchSettings === undefined) throw new AccessAdministrationInvariantError();
    return this.branchSettings;
  }

  private mutationGuard(
    context: AuthorizedOperationalContext,
    capability: CapabilityCode,
    additionalCapabilities: readonly CapabilityCode[] = [],
  ): AdministrationMutationGuard {
    const requiredCapabilities = [capability, ...additionalCapabilities];
    return Object.freeze({
      confirmCurrent: async (transactionContext: object) => {
        if (
          !await context.commitGuard.confirmCurrent(transactionContext) ||
          this.administrationCommitGuard === undefined
        ) return false;
        for (const required of requiredCapabilities) {
          if (!await this.administrationCommitGuard.confirmCurrent(
            { tenantId: context.tenantId, userId: context.userId },
            required,
            transactionContext,
          )) return false;
        }
        return true;
      },
      confirmContinuity: async (transactionContext: object) =>
        this.administrationCommitGuard !== undefined &&
        await this.administrationCommitGuard.confirmContinuity(
          { tenantId: context.tenantId, userId: context.userId },
          transactionContext,
        ),
    });
  }

  private async requireTenantWideAuthority(
    context: AuthorizedOperationalContext,
    capability: CapabilityCode,
  ): Promise<AccessMatrixRecord> {
    const matrix = accessMatrix(
      await this.listAccessMatrix({ tenantId: context.tenantId }),
    );
    const activeRoleIds = new Set(
      matrix.roles
        .filter((role) =>
          role.status === 'active' && role.capabilityCodes.includes(capability),
        )
        .map((role) => role.roleId),
    );
    const authorized = matrix.assignments.some((assignment) =>
      assignment.userId === context.userId &&
      assignment.status === 'active' &&
      assignment.assignmentScope === 'TENANT_WIDE' &&
      assignment.branchId === null &&
      activeRoleIds.has(assignment.roleId),
    );
    if (!authorized) {
      throw new ContextualAuthorizationError('ACCESS_DENIED');
    }
    return matrix;
  }

  private async requireTenantWideAuthorities(
    context: AuthorizedOperationalContext,
    capabilities: readonly CapabilityCode[],
  ): Promise<void> {
    const matrix = accessMatrix(
      await this.listAccessMatrix({ tenantId: context.tenantId }),
    );
    const activeRoles = new Map(
      matrix.roles
        .filter((role) => role.status === 'active')
        .map((role) => [role.roleId, new Set(role.capabilityCodes)]),
    );
    const granted = new Set<string>();
    for (const assignment of matrix.assignments) {
      if (
        assignment.userId !== context.userId ||
        assignment.status !== 'active' ||
        assignment.assignmentScope !== 'TENANT_WIDE' ||
        assignment.branchId !== null
      ) continue;
      for (const capability of activeRoles.get(assignment.roleId) ?? []) {
        granted.add(capability);
      }
    }
    if (!capabilities.every((capability) => granted.has(capability))) {
      throw new ContextualAuthorizationError('ACCESS_DENIED');
    }
  }

  private async withPinConfigured(
    tenantId: string,
    user: Awaited<ReturnType<UserProductRuntime['create']>>,
  ): Promise<AdministrationUser> {
    const configured = await this.listConfiguredPinUserIds({ tenantId });
    return Object.freeze({
      ...user,
      pinConfigured: configured.includes(user.userId),
    });
  }

  listUsers(evidence: ProtectedRequestEvidence) {
    return this.authorization.execute(
      evidence,
      usersReadRequirement,
      async (context) => {
        await this.requireTenantWideAuthority(context, usersReadRequirement.capability);
        const [users, configuredUserIds] = await Promise.all([
          this.users.list({ tenantId: context.tenantId }),
          this.listConfiguredPinUserIds({ tenantId: context.tenantId }),
        ]);
        const configured = new Set(configuredUserIds);
        return users.map((user) => Object.freeze({
          ...user,
          pinConfigured: configured.has(user.userId),
        }));
      },
    );
  }

  createUser(evidence: ProtectedRequestEvidence, input: unknown) {
    return this.authorization.execute(
      evidence,
      usersManageRequirement,
      async (context) => {
        await this.requireTenantWideAuthority(context, usersManageRequirement.capability);
        const body = exactObject(input, [
          'clientRequestId',
          'displayName',
          'operationalIdentifier',
        ]);
        const user = await this.users.create(
          { tenantId: context.tenantId },
          body,
          this.mutationGuard(context, usersManageRequirement.capability),
        );
        return this.withPinConfigured(context.tenantId, user);
      },
    );
  }

  updateUser(evidence: ProtectedRequestEvidence, userId: string, input: unknown) {
    return this.authorization.execute(
      evidence,
      usersManageRequirement,
      async (context) => {
        await this.requireTenantWideAuthority(context, usersManageRequirement.capability);
        const parsedUserId = uuid(userId, 'userId');
        const body = exactObject(input, [
          'clientRequestId',
          'displayName',
          'expectedVersion',
          'operationalIdentifier',
        ]);
        const user = await this.users.update(
          { tenantId: context.tenantId },
          parsedUserId,
          body,
          this.mutationGuard(context, usersManageRequirement.capability),
        );
        return this.withPinConfigured(context.tenantId, user);
      },
    );
  }

  listRoles(evidence: ProtectedRequestEvidence) {
    return this.authorization.execute(
      evidence,
      accessMatrixReadRequirement,
      (context) => this.requireTenantWideAuthority(
        context,
        accessMatrixReadRequirement.capability,
      ),
    );
  }

  readBranchSettings(evidence: ProtectedRequestEvidence) {
    return this.authorization.execute(
      evidence,
      branchSettingsReadRequirement,
      async (context) => {
        await this.requireTenantWideAuthority(
          context,
          branchSettingsReadRequirement.capability,
        );
        const settings = await this.branchSettingsRuntime().readTimeZone({
          tenantId: context.tenantId,
          branchId: context.branchId,
        });
        if (settings === null) throw new AccessAdministrationResourceNotFoundError();
        return settings;
      },
    );
  }

  createRole(evidence: ProtectedRequestEvidence, input: unknown) {
    return this.authorization.execute(
      evidence,
      accessMatrixManageRequirement,
      async (context) => {
        await this.requireTenantWideAuthority(
          context,
          accessMatrixManageRequirement.capability,
        );
        const body = exactObject(input, [
          'capabilityCodes',
          'clientRequestId',
          'description',
          'displayName',
          'roleKey',
        ]);
        return this.createAccessRole(
          { tenantId: context.tenantId },
          body,
          this.mutationGuard(context, accessMatrixManageRequirement.capability),
        );
      },
    );
  }

  replaceRoleCapabilities(evidence: ProtectedRequestEvidence, roleId: string, input: unknown) {
    return this.authorization.execute(
      evidence,
      accessMatrixManageRequirement,
      async (context) => {
        await this.requireTenantWideAuthority(
          context,
          accessMatrixManageRequirement.capability,
        );
        const parsedRoleId = uuid(roleId, 'roleId');
        const body = exactObject(input, [
          'capabilityCodes',
          'clientRequestId',
          'expectedVersion',
        ]);
        return this.replaceAccessRoleCapabilities(
          { tenantId: context.tenantId },
          parsedRoleId,
          body,
          this.mutationGuard(context, accessMatrixManageRequirement.capability),
        );
      },
    );
  }

  updateRole(evidence: ProtectedRequestEvidence, roleId: string, input: unknown) {
    return this.authorization.execute(
      evidence,
      accessMatrixManageRequirement,
      async (context) => {
        await this.requireTenantWideAuthority(
          context,
          accessMatrixManageRequirement.capability,
        );
        const parsedRoleId = uuid(roleId, 'roleId');
        const body = exactObject(input, [
          'clientRequestId',
          'description',
          'displayName',
          'expectedVersion',
        ]);
        return this.updateAccessRole(
          { tenantId: context.tenantId },
          parsedRoleId,
          body,
          this.mutationGuard(context, accessMatrixManageRequirement.capability),
        );
      },
    );
  }

  assignRole(evidence: ProtectedRequestEvidence, userId: string, input: unknown) {
    return this.authorization.execute(
      evidence,
      accessMatrixManageRequirement,
      async (context) => {
        await this.requireTenantWideAuthority(
          context,
          accessMatrixManageRequirement.capability,
        );
        const parsedUserId = uuid(userId, 'userId');
        const body = exactObject(input, ['clientRequestId', 'roleId']);
        return this.assignRoleUseCase({ tenantId: context.tenantId }, {
          userId: parsedUserId,
          roleId: uuid(body.roleId, 'roleId'),
          assignmentScope: 'TENANT_WIDE',
          branchId: null,
          clientRequestId: uuid(body.clientRequestId, 'clientRequestId'),
        }, this.mutationGuard(context, accessMatrixManageRequirement.capability));
      },
    );
  }

  revokeRole(
    evidence: ProtectedRequestEvidence,
    userId: string,
    assignmentId: string,
    input: unknown,
  ) {
    return this.authorization.execute(
      evidence,
      accessMatrixManageRequirement,
      async (context) => {
        const matrix = await this.requireTenantWideAuthority(
          context,
          accessMatrixManageRequirement.capability,
        );
        const parsedUserId = uuid(userId, 'userId');
        const parsedAssignmentId = uuid(assignmentId, 'assignmentId');
        const body = exactObject(input, ['clientRequestId', 'expectedVersion']);
        const assignment = matrix.assignments.find(
          (candidate) => candidate.assignmentId === parsedAssignmentId,
        );
        if (assignment?.userId !== parsedUserId) {
          throw new AccessAdministrationResourceNotFoundError();
        }
        return this.revokeRoleAssignmentUseCase({ tenantId: context.tenantId }, {
          assignmentId: parsedAssignmentId,
          expectedVersion: body.expectedVersion,
          clientRequestId: uuid(body.clientRequestId, 'clientRequestId'),
        }, this.mutationGuard(context, accessMatrixManageRequirement.capability));
      },
    );
  }

  provisionFourDigitPin(evidence: ProtectedRequestEvidence, userId: string, input: unknown) {
    return this.authorization.execute(
      evidence,
      usersManageRequirement,
      async (context) => {
        await this.requireTenantWideAuthorities(context, [
          usersManageRequirement.capability,
          accessMatrixManageRequirement.capability,
        ]);
        const parsedUserId = uuid(userId, 'userId');
        const body = exactObject(input, ['clientRequestId', 'pin']);
        if (typeof body.pin !== 'string' || !localAdminPinPattern.test(body.pin)) {
          throw new AccessAdministrationRequestError('pin');
        }
        const payload = {
          userId: parsedUserId,
          pin: body.pin,
          clientRequestId: uuid(body.clientRequestId, 'clientRequestId'),
        };
        try {
          return await this.replacePin(
            { tenantId: context.tenantId },
            payload,
            this.mutationGuard(context, usersManageRequirement.capability, [
              accessMatrixManageRequirement.capability,
            ]),
          );
        } catch (error: unknown) {
          if (
            !hasErrorCode(error, 'PIN_CREDENTIAL_USER_INVALID') &&
            !hasErrorCode(error, 'PIN_CREDENTIAL_IDEMPOTENCY_CONFLICT')
          ) throw error;
          return this.provisionPin(
            { tenantId: context.tenantId },
            payload,
            this.mutationGuard(context, usersManageRequirement.capability, [
              accessMatrixManageRequirement.capability,
            ]),
          );
        }
      },
    );
  }

  transitionUser(evidence: ProtectedRequestEvidence, userId: string, input: unknown) {
    return this.authorization.execute(
      evidence,
      usersManageRequirement,
      async (context) => {
        await this.requireTenantWideAuthority(context, usersManageRequirement.capability);
        const parsedUserId = uuid(userId, 'userId');
        const body = exactObject(input, [
          'clientRequestId',
          'expectedVersion',
          'status',
        ]);
        const user = await this.users.transition({ tenantId: context.tenantId }, {
          userId: parsedUserId,
          status: body.status,
          expectedVersion: body.expectedVersion,
          clientRequestId: uuid(body.clientRequestId, 'clientRequestId'),
        }, this.mutationGuard(context, usersManageRequirement.capability));
        return this.withPinConfigured(context.tenantId, user);
      },
    );
  }
}
