import type { AdminAuthorizationCommitGuard } from '../../index.js';
import type { AssignRoleUseCase } from '../use-cases/assign-role.use-case.js';
import type { CreateAccessRoleUseCase } from '../use-cases/create-access-role.use-case.js';
import type { ListAccessMatrixUseCase } from '../use-cases/list-access-matrix.use-case.js';
import type { ReplaceAccessRoleCapabilitiesUseCase } from '../use-cases/replace-access-role-capabilities.use-case.js';
import type { ReplacePinCredentialUseCase } from '../use-cases/replace-pin-credential.use-case.js';
import type { RevokeRoleAssignmentUseCase } from '../use-cases/revoke-role-assignment.use-case.js';
import type { UpdateAccessRoleUseCase } from '../use-cases/update-access-role.use-case.js';

export interface AdminUsersRolesAccessRuntime {
  readonly listAccessMatrix: Pick<ListAccessMatrixUseCase, 'execute'>;
  readonly createAccessRole: Pick<CreateAccessRoleUseCase, 'execute'>;
  readonly replaceAccessRoleCapabilities: Pick<ReplaceAccessRoleCapabilitiesUseCase, 'execute'>;
  readonly updateAccessRole: Pick<UpdateAccessRoleUseCase, 'execute'>;
  readonly assignRole: Pick<AssignRoleUseCase, 'execute'>;
  readonly revokeRoleAssignment: Pick<RevokeRoleAssignmentUseCase, 'execute'>;
  readonly replacePin: Pick<ReplacePinCredentialUseCase, 'execute'>;
  listConfiguredPinUserIds(scope: unknown): Promise<readonly string[]>;
}

export type AdminLifecycleIdentity = Readonly<{
  adminIdentityId: string;
  userId: string;
  emailDisplay: string;
  verified: boolean;
  status: string;
}>;

export type AdminLifecycleEventInput = Readonly<{
  tenantId: string;
  actorUserId: string;
  actorAdminIdentityId: string;
  sessionId: string;
  correlationId: string;
  eventType: string;
  targetUserId?: string | undefined;
  roleId?: string | undefined;
  assignmentId?: string | undefined;
  branchId?: string | undefined;
  level: 1 | 2;
  occurredAt: string;
}>;

export interface AdminLifecycleRepositoryPort {
  recordEvent(transactionContext: object, input: AdminLifecycleEventInput): Promise<void>;
  listAdminIdentities(tenantId: string): Promise<readonly AdminLifecycleIdentity[]>;
  transitionRole(
    input: Readonly<{
      tenantId: string;
      roleId: string;
      expectedVersion: number;
      active: boolean;
      clientRequestId: string;
      actorUserId: string;
      actorAdminIdentityId: string;
      sessionId: string;
      correlationId: string;
      occurredAt: string;
    }>,
    guard: AdminAuthorizationCommitGuard,
  ): Promise<unknown>;
  revokeAdminIdentity(
    input: Readonly<{
      tenantId: string;
      targetUserId: string;
      adminIdentityId: string;
      actorUserId: string;
      actorAdminIdentityId: string;
      sessionId: string;
      correlationId: string;
      occurredAt: string;
    }>,
    guard: AdminAuthorizationCommitGuard,
  ): Promise<void>;
}
