import type { UserProductRuntime } from '../../users/index.js';
import type { AdminAuthorizationExecutor, ProtectedRequestEvidence } from '../index.js';
import type { AccessSessionRuntime } from '../presentation/access-session.controller.js';
import type { AdminInvitationService } from './use-cases/admin-invitation.use-cases.js';

export class AdminUsersRolesOperations {
  constructor(
    private readonly authorization: AdminAuthorizationExecutor,
    private readonly users: UserProductRuntime,
    private readonly runtime: AccessSessionRuntime,
    private readonly invitations: AdminInvitationService,
  ) {}

  listUsers(evidence: ProtectedRequestEvidence) {
    return this.authorization.execute(evidence, { capability: 'users.read', kind: 'read' }, async (context) => {
      const [users, matrix, pinUserIds, invitations] = await Promise.all([
        this.users.list({ tenantId: context.tenantId }),
        this.runtime.listAccessMatrix.execute({ tenantId: context.tenantId }),
        this.runtime.listConfiguredPinUserIds({ tenantId: context.tenantId }),
        this.invitations.list(context.tenantId),
      ]);
      const pinSet = new Set(pinUserIds);
      return Object.freeze({ users: users.map((user) => Object.freeze({ ...user, pinConfigured: pinSet.has(user.userId), assignments: matrix.assignments.filter((assignment) => String(assignment.userId) === String(user.userId)) })), invitations });
    });
  }

  listRoles(evidence: ProtectedRequestEvidence) {
    return this.authorization.execute(evidence, { capability: 'access_matrix.read', kind: 'read' }, (context) => this.runtime.listAccessMatrix.execute({ tenantId: context.tenantId }));
  }

  createRole(evidence: ProtectedRequestEvidence, input: unknown) {
    return this.authorization.execute(evidence, { capability: 'access_matrix.manage', kind: 'state-change' }, (context) => this.runtime.createAccessRole.execute({ tenantId: context.tenantId }, input, context.commitGuard));
  }

  updateRole(evidence: ProtectedRequestEvidence, roleId: string, input: unknown) {
    return this.authorization.execute(evidence, { capability: 'access_matrix.manage', kind: 'state-change' }, (context) => this.runtime.updateAccessRole.execute({ tenantId: context.tenantId }, roleId, input, context.commitGuard));
  }

  replaceRoleCapabilities(evidence: ProtectedRequestEvidence, roleId: string, input: unknown) {
    return this.authorization.execute(evidence, { capability: 'access_matrix.manage', kind: 'state-change' }, (context) => this.runtime.replaceAccessRoleCapabilities.execute({ tenantId: context.tenantId }, roleId, input, context.commitGuard));
  }

  async assignRole(evidence: ProtectedRequestEvidence, input: Readonly<{ roleId?: unknown }> & Record<string, unknown>) {
    const protectedRole = await this.authorization.execute(evidence, { capability: 'access_matrix.read', kind: 'read' }, async (context) => {
      const matrix = await this.runtime.listAccessMatrix.execute({ tenantId: context.tenantId });
      return matrix.roles.some((role) => role.roleId === input.roleId && role.managementMode === 'SYSTEM_MANAGED' && role.roleKey === 'tenant_admin');
    });
    return this.authorization.execute(evidence, { capability: 'access_matrix.manage', kind: 'state-change', requiresRecentReauthentication: protectedRole }, (context) => this.runtime.assignRole.execute({ tenantId: context.tenantId }, input, context.commitGuard));
  }

  async revokeRole(evidence: ProtectedRequestEvidence, input: Readonly<{ assignmentId?: unknown }> & Record<string, unknown>) {
    const protectedAssignment = await this.authorization.execute(evidence, { capability: 'access_matrix.read', kind: 'read' }, async (context) => {
      const matrix = await this.runtime.listAccessMatrix.execute({ tenantId: context.tenantId });
      const assignment = matrix.assignments.find((candidate) => candidate.assignmentId === input.assignmentId);
      const role = matrix.roles.find((candidate) => candidate.roleId === assignment?.roleId);
      return role?.managementMode === 'SYSTEM_MANAGED' && role.roleKey === 'tenant_admin';
    });
    return this.authorization.execute(evidence, { capability: 'access_matrix.manage', kind: 'state-change', requiresRecentReauthentication: protectedAssignment }, (context) => this.runtime.revokeRoleAssignment.execute({ tenantId: context.tenantId }, input, context.commitGuard));
  }

  issueInvitation(evidence: ProtectedRequestEvidence, input: Readonly<Record<string, unknown>>) {
    const grants = Array.isArray(input.grants) ? input.grants : [];
    const highImpact = grants.some((grant) => typeof grant === 'object' && grant !== null && 'roleId' in grant && typeof grant.roleId === 'string');
    return this.authorization.execute(evidence, { capability: 'users.manage', kind: 'state-change', requiresRecentReauthentication: highImpact }, (context) => this.invitations.issue({ tenantId: context.tenantId, inviterUserId: context.userId, inviterAdminIdentityId: context.adminIdentityId, targetUserId: typeof input.targetUserId === 'string' ? input.targetUserId : null, proposedDisplayName: typeof input.proposedDisplayName === 'string' ? input.proposedDisplayName : null, email: input.email, authorityRevision: Number(input.authorityRevision), grants: grants as never, clientRequestId: String(input.clientRequestId), correlationId: String(input.correlationId), guard: context.commitGuard }));
  }

  resendInvitation(evidence: ProtectedRequestEvidence, invitationId: string, input: Readonly<Record<string, unknown>>) {
    return this.authorization.execute(evidence, { capability: 'users.manage', kind: 'state-change' }, (context) => this.invitations.resend({ tenantId: context.tenantId, invitationId, expectedVersion: Number(input.expectedVersion), clientRequestId: String(input.clientRequestId), correlationId: String(input.correlationId), guard: context.commitGuard }));
  }

  revokeInvitation(evidence: ProtectedRequestEvidence, invitationId: string, input: Readonly<Record<string, unknown>>) {
    return this.authorization.execute(evidence, { capability: 'users.manage', kind: 'state-change' }, (context) => this.invitations.revoke({ tenantId: context.tenantId, invitationId, expectedVersion: Number(input.expectedVersion), clientRequestId: String(input.clientRequestId), correlationId: String(input.correlationId), actorUserId: context.userId, occurredAt: new Date().toISOString(), guard: context.commitGuard }));
  }
}
