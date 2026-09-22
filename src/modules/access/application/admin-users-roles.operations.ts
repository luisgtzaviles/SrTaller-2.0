import { randomUUID } from 'node:crypto';

import type { UserProductRuntime } from '../../users/index.js';
import type { AdminAuthorizationExecutor, AuthorizedAdminContext, ProtectedRequestEvidence } from '../index.js';
import type { AdminLifecycleRepositoryPort, AdminUsersRolesAccessRuntime } from './ports/admin-users-roles-runtime.port.js';
import type { AdminInvitationService } from './use-cases/admin-invitation.use-cases.js';

function isControlPlaneCapability(value: unknown): boolean {
  return typeof value === 'string' && ['tenant.profile.', 'users.', 'access_matrix.', 'branches.', 'stations.'].some((prefix) => value.startsWith(prefix));
}

function requestedCapabilities(input: unknown): readonly unknown[] {
  return typeof input === 'object' && input !== null && 'capabilityCodes' in input && Array.isArray(input.capabilityCodes) ? input.capabilityCodes : [];
}

function auditGuard(context: AuthorizedAdminContext, lifecycle: AdminLifecycleRepositoryPort, input: Readonly<{ eventType: string; level: 1 | 2; correlationId: string; occurredAt: string; continuity?: boolean; targetUserId?: string | undefined; protectedAuthorityEvent?: string | undefined }>) {
  return Object.freeze({
    confirmCurrent: context.commitGuard.confirmCurrent,
    ...(input.continuity ? { confirmContinuity: context.commitGuard.confirmEffectiveTenantAdmin } : {}),
    recordAudit: async (transactionContext: object, resultValue: unknown) => {
      const result = typeof resultValue === 'object' && resultValue !== null ? resultValue as Readonly<Record<string, unknown>> : {};
      const common = { tenantId: context.tenantId, actorUserId: context.userId, actorAdminIdentityId: context.adminIdentityId, sessionId: context.sessionId, correlationId: input.correlationId, level: input.level, occurredAt: input.occurredAt } as const;
      await lifecycle.recordEvent(transactionContext, { ...common, eventType: input.eventType, targetUserId: input.targetUserId ?? (typeof result.userId === 'string' ? result.userId : undefined), roleId: typeof result.roleId === 'string' ? result.roleId : undefined, assignmentId: typeof result.assignmentId === 'string' ? result.assignmentId : undefined, branchId: typeof result.branchId === 'string' ? result.branchId : undefined });
      if (input.protectedAuthorityEvent) await lifecycle.recordEvent(transactionContext, { ...common, eventType: input.protectedAuthorityEvent, targetUserId: typeof result.userId === 'string' ? result.userId : input.targetUserId, roleId: typeof result.roleId === 'string' ? result.roleId : undefined, assignmentId: typeof result.assignmentId === 'string' ? result.assignmentId : undefined, branchId: typeof result.branchId === 'string' ? result.branchId : undefined });
    },
  });
}

export class AdminUsersRolesOperations {
  constructor(
    private readonly authorization: AdminAuthorizationExecutor,
    private readonly users: UserProductRuntime,
    private readonly runtime: AdminUsersRolesAccessRuntime,
    private readonly invitations: AdminInvitationService,
    private readonly lifecycle: AdminLifecycleRepositoryPort,
  ) {}

  listUsers(evidence: ProtectedRequestEvidence) {
    return this.authorization.execute(evidence, { capability: 'users.read', kind: 'read' }, async (context) => {
      const [users, matrix, pinUserIds, invitations, identities] = await Promise.all([
        this.users.list({ tenantId: context.tenantId }),
        this.runtime.listAccessMatrix.execute({ tenantId: context.tenantId }),
        this.runtime.listConfiguredPinUserIds({ tenantId: context.tenantId }),
        this.invitations.list(context.tenantId),
        this.lifecycle.listAdminIdentities(context.tenantId),
      ]);
      const pinSet = new Set(pinUserIds);
      return Object.freeze({ users: users.map((user) => Object.freeze({ ...user, pinConfigured: pinSet.has(user.userId), adminIdentity: identities.find((identity) => identity.userId === user.userId) ?? null, assignments: matrix.assignments.filter((assignment) => String(assignment.userId) === String(user.userId)) })), invitations });
    });
  }

  listRoles(evidence: ProtectedRequestEvidence) {
    return this.authorization.execute(evidence, { capability: 'access_matrix.read', kind: 'read' }, (context) => this.runtime.listAccessMatrix.execute({ tenantId: context.tenantId }));
  }

  createRole(evidence: ProtectedRequestEvidence, input: unknown) {
    const highImpact = requestedCapabilities(input).some(isControlPlaneCapability);
    return this.authorization.execute(evidence, { capability: 'access_matrix.manage', kind: 'state-change', requiresRecentReauthentication: highImpact }, (context) => { const occurredAt = new Date().toISOString(); return this.runtime.createAccessRole.execute({ tenantId: context.tenantId }, input, auditGuard(context, this.lifecycle, { eventType: 'ROLE_CREATED', level: highImpact ? 2 : 1, correlationId: randomUUID(), occurredAt })); });
  }

  updateRole(evidence: ProtectedRequestEvidence, roleId: string, input: unknown) {
    return this.authorization.execute(evidence, { capability: 'access_matrix.manage', kind: 'state-change' }, (context) => { const occurredAt = new Date().toISOString(); return this.runtime.updateAccessRole.execute({ tenantId: context.tenantId }, roleId, input, auditGuard(context, this.lifecycle, { eventType: 'ROLE_UPDATED', level: 1, correlationId: randomUUID(), occurredAt })); });
  }

  async replaceRoleCapabilities(evidence: ProtectedRequestEvidence, roleId: string, input: unknown) {
    const currentCapabilities = await this.authorization.execute(evidence, { capability: 'access_matrix.read', kind: 'read' }, async (context) => {
      const matrix = await this.runtime.listAccessMatrix.execute({ tenantId: context.tenantId });
      return matrix.roles.find((role) => role.roleId === roleId)?.capabilityCodes ?? [];
    });
    const highImpact = [...currentCapabilities, ...requestedCapabilities(input)].some(isControlPlaneCapability);
    return this.authorization.execute(evidence, { capability: 'access_matrix.manage', kind: 'state-change', requiresRecentReauthentication: highImpact }, (context) => { const occurredAt = new Date().toISOString(); return this.runtime.replaceAccessRoleCapabilities.execute({ tenantId: context.tenantId }, roleId, input, auditGuard(context, this.lifecycle, { eventType: 'ROLE_UPDATED', level: highImpact ? 2 : 1, correlationId: randomUUID(), occurredAt })); });
  }

  async assignRole(evidence: ProtectedRequestEvidence, input: Readonly<{ roleId?: unknown }> & Record<string, unknown>) {
    const impact = await this.authorization.execute(evidence, { capability: 'access_matrix.read', kind: 'read' }, async (context) => {
      const matrix = await this.runtime.listAccessMatrix.execute({ tenantId: context.tenantId });
      const role = matrix.roles.find((candidate) => candidate.roleId === input.roleId);
      const protectedTenantAdmin = role?.managementMode === 'SYSTEM_MANAGED' && role.roleKey === 'tenant_admin';
      return Object.freeze({ protectedTenantAdmin, highImpact: protectedTenantAdmin || (role?.capabilityCodes.some(isControlPlaneCapability) ?? false) });
    });
    return this.authorization.execute(evidence, { capability: 'access_matrix.manage', kind: 'state-change', requiresRecentReauthentication: impact.highImpact }, (context) => { const occurredAt = new Date().toISOString(); return this.runtime.assignRole.execute({ tenantId: context.tenantId }, input, auditGuard(context, this.lifecycle, { eventType: 'ROLE_ASSIGNED', protectedAuthorityEvent: impact.protectedTenantAdmin ? 'TENANT_ADMIN_GRANTED' : undefined, level: impact.highImpact ? 2 : 1, correlationId: randomUUID(), occurredAt })); });
  }

  async revokeRole(evidence: ProtectedRequestEvidence, input: Readonly<{ assignmentId?: unknown }> & Record<string, unknown>) {
    const impact = await this.authorization.execute(evidence, { capability: 'access_matrix.read', kind: 'read' }, async (context) => {
      const matrix = await this.runtime.listAccessMatrix.execute({ tenantId: context.tenantId });
      const assignment = matrix.assignments.find((candidate) => candidate.assignmentId === input.assignmentId);
      const role = matrix.roles.find((candidate) => candidate.roleId === assignment?.roleId);
      const protectedTenantAdmin = role?.managementMode === 'SYSTEM_MANAGED' && role.roleKey === 'tenant_admin';
      return Object.freeze({ protectedTenantAdmin, highImpact: protectedTenantAdmin || (role?.capabilityCodes.some(isControlPlaneCapability) ?? false) });
    });
    return this.authorization.execute(evidence, { capability: 'access_matrix.manage', kind: 'state-change', requiresRecentReauthentication: impact.highImpact }, (context) => { const occurredAt = new Date().toISOString(); return this.runtime.revokeRoleAssignment.execute({ tenantId: context.tenantId }, input, auditGuard(context, this.lifecycle, { eventType: 'ROLE_UNASSIGNED', protectedAuthorityEvent: impact.protectedTenantAdmin ? 'TENANT_ADMIN_REVOKED' : undefined, level: impact.highImpact ? 2 : 1, continuity: impact.protectedTenantAdmin, correlationId: randomUUID(), occurredAt })); });
  }

  async transitionRole(evidence: ProtectedRequestEvidence, roleId: string, input: Readonly<Record<string, unknown>>, active: boolean) {
    const highImpact = await this.authorization.execute(evidence, { capability: 'access_matrix.read', kind: 'read' }, async (context) => {
      const matrix = await this.runtime.listAccessMatrix.execute({ tenantId: context.tenantId });
      return matrix.roles.find((role) => role.roleId === roleId)?.capabilityCodes.some(isControlPlaneCapability) ?? false;
    });
    return this.authorization.execute(evidence, { capability: 'access_matrix.manage', kind: 'state-change', requiresRecentReauthentication: highImpact }, (context) => this.lifecycle.transitionRole({ tenantId: context.tenantId, roleId, expectedVersion: Number(input.expectedVersion), active, clientRequestId: String(input.clientRequestId), actorUserId: context.userId, actorAdminIdentityId: context.adminIdentityId, sessionId: context.sessionId, correlationId: randomUUID(), occurredAt: new Date().toISOString() }, context.commitGuard));
  }

  async transitionUser(evidence: ProtectedRequestEvidence, userId: string, input: Readonly<Record<string, unknown>>, active: boolean) {
    const administrative = await this.authorization.execute(evidence, { capability: 'users.read', kind: 'read' }, async (context) => {
      const identities = await this.lifecycle.listAdminIdentities(context.tenantId);
      return identities.some((identity) => identity.userId === userId && identity.status === 'active');
    });
    return this.authorization.execute(evidence, { capability: 'users.manage', kind: 'state-change', requiresRecentReauthentication: administrative }, (context) => { const occurredAt = new Date().toISOString(); return this.users.transition({ tenantId: context.tenantId }, { userId, status: active ? 'active' : 'inactive', expectedVersion: Number(input.expectedVersion), clientRequestId: String(input.clientRequestId) }, auditGuard(context, this.lifecycle, { eventType: active ? 'USER_ACTIVATED' : 'USER_DEACTIVATED', level: administrative ? 2 : 1, continuity: administrative && !active, targetUserId: userId, correlationId: randomUUID(), occurredAt })); });
  }

  revokeAdminIdentity(evidence: ProtectedRequestEvidence, userId: string, identityId: string, input: Readonly<Record<string, unknown>>) {
    return this.authorization.execute(evidence, { capability: 'users.manage', kind: 'state-change', requiresRecentReauthentication: true }, (context) => this.lifecycle.revokeAdminIdentity({ tenantId: context.tenantId, targetUserId: userId, adminIdentityId: identityId, actorUserId: context.userId, actorAdminIdentityId: context.adminIdentityId, sessionId: context.sessionId, correlationId: randomUUID(), occurredAt: new Date().toISOString() }, context.commitGuard));
  }

  replaceOperationalPin(evidence: ProtectedRequestEvidence, userId: string, input: Readonly<Record<string, unknown>>) {
    return this.authorization.execute(evidence, { capability: 'users.manage', kind: 'state-change', requiresRecentReauthentication: true }, (context) => this.runtime.replacePin.execute({ tenantId: context.tenantId }, { ...input, userId }, context.commitGuard));
  }

  async issueInvitation(evidence: ProtectedRequestEvidence, input: Readonly<Record<string, unknown>>) {
    const grants = Array.isArray(input.grants) ? input.grants : [];
    const highImpact = await this.authorization.execute(evidence, { capability: 'access_matrix.read', kind: 'read' }, async (context) => {
      const matrix = await this.runtime.listAccessMatrix.execute({ tenantId: context.tenantId });
      const requestedRoleIds = new Set(grants.flatMap((grant) => typeof grant === 'object' && grant !== null && 'roleId' in grant && typeof grant.roleId === 'string' ? [grant.roleId] : []));
      return matrix.roles.some((role) => requestedRoleIds.has(role.roleId) && ((role.roleKey === 'tenant_admin' && role.managementMode === 'SYSTEM_MANAGED') || role.capabilityCodes.some(isControlPlaneCapability)));
    });
    return this.authorization.execute(evidence, { capability: 'users.manage', kind: 'state-change', requiresRecentReauthentication: highImpact }, (context) => this.invitations.issue({ tenantId: context.tenantId, inviterUserId: context.userId, inviterAdminIdentityId: context.adminIdentityId, inviterAdminSessionId: context.sessionId, targetUserId: typeof input.targetUserId === 'string' ? input.targetUserId : null, proposedDisplayName: typeof input.proposedDisplayName === 'string' ? input.proposedDisplayName : null, email: input.email, grants: grants as never, clientRequestId: String(input.clientRequestId), correlationId: randomUUID(), guard: context.commitGuard }));
  }

  async resendInvitation(evidence: ProtectedRequestEvidence, invitationId: string, input: Readonly<Record<string, unknown>>) {
    const highImpact = await this.authorization.execute(evidence, { capability: 'users.read', kind: 'read' }, async (context) => {
      const [invitation, matrix] = await Promise.all([
        this.invitations.list(context.tenantId).then((items) => items.find((candidate) => candidate.invitationId === invitationId)),
        this.runtime.listAccessMatrix.execute({ tenantId: context.tenantId }),
      ]);
      const roleIds = new Set(invitation?.grants.map((grant) => grant.roleId) ?? []);
      return matrix.roles.some((role) => roleIds.has(role.roleId) && ((role.roleKey === 'tenant_admin' && role.managementMode === 'SYSTEM_MANAGED') || role.capabilityCodes.some(isControlPlaneCapability)));
    });
    return this.authorization.execute(evidence, { capability: 'users.manage', kind: 'state-change', requiresRecentReauthentication: highImpact }, (context) => this.invitations.resend({ tenantId: context.tenantId, invitationId, expectedVersion: Number(input.expectedVersion), clientRequestId: String(input.clientRequestId), correlationId: randomUUID(), actorUserId: context.userId, actorAdminIdentityId: context.adminIdentityId, actorAdminSessionId: context.sessionId, guard: context.commitGuard }));
  }

  revokeInvitation(evidence: ProtectedRequestEvidence, invitationId: string, input: Readonly<Record<string, unknown>>) {
    return this.authorization.execute(evidence, { capability: 'users.manage', kind: 'state-change' }, (context) => this.invitations.revoke({ tenantId: context.tenantId, invitationId, expectedVersion: Number(input.expectedVersion), clientRequestId: String(input.clientRequestId), correlationId: randomUUID(), actorUserId: context.userId, actorAdminIdentityId: context.adminIdentityId, actorAdminSessionId: context.sessionId, occurredAt: new Date().toISOString(), guard: context.commitGuard }));
  }
}
