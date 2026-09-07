import type {
  ContextualAuthorizationExecutor,
  ProtectedRequestEvidence,
} from '../index.js';
import type { UserProductRuntime } from '../../users/index.js';
import { randomUUID } from 'node:crypto';

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

const localAdminPinPattern = /^[0-9]{4}$/u;

/** Access composes User commands only after server-side authorization. */
export class AccessAdministrationOperations {
  constructor(
    private readonly authorization: ContextualAuthorizationExecutor,
    private readonly users: UserProductRuntime,
    private readonly listAccessMatrix: (scope: unknown) => Promise<unknown>,
    private readonly createAccessRole: (scope: unknown, input: unknown) => Promise<unknown>,
    private readonly replaceAccessRoleCapabilities: (scope: unknown, roleId: unknown, input: unknown) => Promise<unknown>,
    private readonly assignRoleUseCase: (scope: unknown, input: unknown) => Promise<unknown>,
    private readonly revokeRoleAssignmentUseCase: (scope: unknown, input: unknown) => Promise<unknown>,
    private readonly provisionPin: (scope: unknown, input: unknown) => Promise<unknown>,
    private readonly replacePin: (scope: unknown, input: unknown) => Promise<unknown>,
    private readonly listConfiguredPinUserIds: (scope: unknown) => Promise<readonly string[]>,
  ) {}

  listUsers(evidence: ProtectedRequestEvidence) {
    return this.authorization.execute(
      evidence,
      usersReadRequirement,
      async (context) => {
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
      (context) => this.users.create({ tenantId: context.tenantId }, input),
    );
  }

  updateUser(evidence: ProtectedRequestEvidence, userId: string, input: unknown) {
    return this.authorization.execute(
      evidence,
      usersManageRequirement,
      (context) => this.users.update({ tenantId: context.tenantId }, userId, input),
    );
  }

  listRoles(evidence: ProtectedRequestEvidence) {
    return this.authorization.execute(
      evidence,
      accessMatrixReadRequirement,
      (context) => this.listAccessMatrix({ tenantId: context.tenantId }),
    );
  }

  createRole(evidence: ProtectedRequestEvidence, input: unknown) {
    return this.authorization.execute(
      evidence,
      accessMatrixManageRequirement,
      (context) => this.createAccessRole({ tenantId: context.tenantId }, input),
    );
  }

  replaceRoleCapabilities(evidence: ProtectedRequestEvidence, roleId: string, input: unknown) {
    return this.authorization.execute(
      evidence,
      accessMatrixManageRequirement,
      (context) => this.replaceAccessRoleCapabilities({ tenantId: context.tenantId }, roleId, input),
    );
  }

  assignRole(evidence: ProtectedRequestEvidence, userId: string, input: unknown) {
    const body = input as Readonly<Record<string, unknown>> | null;
    return this.authorization.execute(
      evidence,
      usersManageRequirement,
      (context) => this.assignRoleUseCase({ tenantId: context.tenantId }, {
        userId,
        roleId: body?.roleId,
        assignmentScope: 'TENANT_WIDE',
        branchId: null,
        clientRequestId: randomUUID(),
      }),
    );
  }

  revokeRole(evidence: ProtectedRequestEvidence, assignmentId: string, input: unknown) {
    const body = input as Readonly<Record<string, unknown>> | null;
    return this.authorization.execute(
      evidence,
      usersManageRequirement,
      (context) => this.revokeRoleAssignmentUseCase({ tenantId: context.tenantId }, {
        assignmentId,
        expectedVersion: body?.expectedVersion,
        clientRequestId: randomUUID(),
      }),
    );
  }

  provisionLocalFourDigitPin(evidence: ProtectedRequestEvidence, userId: string, input: unknown) {
    const body = input as Readonly<Record<string, unknown>> | null;
    if (typeof body?.pin !== 'string' || !localAdminPinPattern.test(body.pin)) {
      throw new Error('Local PIN must contain four digits.');
    }
    return this.authorization.execute(
      evidence,
      usersManageRequirement,
      async (context) => {
        const payload = { userId, pin: `00${body.pin}`, clientRequestId: randomUUID() };
        const configured = await this.listConfiguredPinUserIds({ tenantId: context.tenantId });
        return configured.includes(userId)
          ? this.replacePin({ tenantId: context.tenantId }, payload)
          : this.provisionPin({ tenantId: context.tenantId }, payload);
      },
    );
  }

  transitionUser(evidence: ProtectedRequestEvidence, userId: string, input: unknown) {
    const body = input as Readonly<Record<string, unknown>> | null;
    return this.authorization.execute(
      evidence,
      usersManageRequirement,
      (context) => this.users.transition({ tenantId: context.tenantId }, {
        userId,
        status: body?.status,
        expectedVersion: body?.expectedVersion,
        clientRequestId: randomUUID(),
      }),
    );
  }
}
