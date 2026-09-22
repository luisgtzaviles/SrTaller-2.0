import type { TenantId } from '../../../tenancy/index.js';
import type { CapabilityCode } from '../../domain/capability.js';
import type {
  RoleDisplayName,
  RoleDescription,
  RoleId,
  RoleKey,
  RoleStatus,
} from '../../domain/role.js';
import type {
  AccessBranchId,
  AccessUserId,
  RoleAssignmentId,
  RoleAssignmentScope,
  RoleAssignmentStatus,
} from '../../domain/role-assignment.js';

type ScopedTenantId = string & TenantId;
type ScopedBranchId = string & AccessBranchId;
type ScopedUserId = string & AccessUserId;

export interface AccessTenantScope {
  readonly tenantId: ScopedTenantId;
}

export interface AccessBranchScope {
  readonly tenantId: ScopedTenantId;
  readonly branchId: ScopedBranchId;
}

export interface AccessPrincipalScope {
  readonly tenantId: ScopedTenantId;
  readonly branchId: ScopedBranchId;
  readonly userId: ScopedUserId;
}

export type AccessCapabilityRecord = Readonly<{
  capabilityCode: CapabilityCode;
  createdAt: string;
}>;

export type AccessRoleRecord = Readonly<{
  tenantId: TenantId;
  roleId: RoleId;
  roleKey: RoleKey;
  displayName: RoleDisplayName;
  description: RoleDescription | null;
  status: RoleStatus;
  version: number;
  managementMode: 'TENANT_MANAGED' | 'SYSTEM_MANAGED';
  policyVersion: number | null;
  capabilityCodes: readonly CapabilityCode[];
  createdAt: string;
  updatedAt: string;
}>;

export type AccessRoleAssignmentRecord = Readonly<{
  tenantId: TenantId;
  assignmentId: RoleAssignmentId;
  userId: AccessUserId;
  roleId: RoleId;
  assignmentScope: RoleAssignmentScope;
  branchId: AccessBranchId | null;
  status: RoleAssignmentStatus;
  version: number;
  assignedAt: string;
  revokedAt: string | null;
}>;

export type AccessMatrixRecord = Readonly<{
  capabilities: readonly AccessCapabilityRecord[];
  roles: readonly AccessRoleRecord[];
  assignments: readonly AccessRoleAssignmentRecord[];
}>;

export type AssignRoleInput = Readonly<{
  assignmentId: RoleAssignmentId;
  userId: AccessUserId;
  roleId: RoleId;
  assignmentScope: RoleAssignmentScope;
  branchId: AccessBranchId | null;
  clientRequestId: string;
  occurredAt: string;
}>;

export type CreateAccessRoleInput = Readonly<{
  roleId: RoleId;
  roleKey: RoleKey;
  displayName: RoleDisplayName;
  description: RoleDescription | null;
  capabilityCodes: readonly CapabilityCode[];
  clientRequestId: string;
  occurredAt: string;
}>;

export type ReplaceAccessRoleCapabilitiesInput = Readonly<{
  roleId: RoleId;
  expectedVersion: number;
  capabilityCodes: readonly CapabilityCode[];
  clientRequestId: string;
  occurredAt: string;
}>;

export type UpdateAccessRoleInput = Readonly<{
  roleId: RoleId;
  displayName: RoleDisplayName;
  description: RoleDescription | null;
  expectedVersion: number;
  clientRequestId: string;
  occurredAt: string;
}>;

export type RevokeRoleAssignmentInput = Readonly<{
  assignmentId: RoleAssignmentId;
  expectedVersion: number;
  clientRequestId: string;
  occurredAt: string;
}>;

export type AccessPersistenceErrorCode =
  | 'ACCESS_ASSIGNMENT_CONFLICT'
  | 'ACCESS_ASSIGNMENT_NOT_FOUND'
  | 'ACCESS_ASSIGNMENT_REVOKED'
  | 'ACCESS_AUTHORIZATION_CHANGED'
  | 'ACCESS_IDEMPOTENCY_CONFLICT'
  | 'ACCESS_INPUT_INVALID'
  | 'ACCESS_PERSISTENCE_FAILED'
  | 'ACCESS_PROTECTED_ROLE'
  | 'ACCESS_REFERENCE_NOT_FOUND'
  | 'ACCESS_STALE_WRITE'
  | 'ACCESS_TENANT_SCOPE_REQUIRED';

export class AccessPersistenceError extends Error {
  constructor(readonly code: AccessPersistenceErrorCode) {
    super(code);
    this.name = 'AccessPersistenceError';
  }

  toJSON(): Readonly<{ code: AccessPersistenceErrorCode; name: string }> {
    return Object.freeze({ code: this.code, name: this.name });
  }
}

export interface AccessMutationCommitGuard {
  confirmCurrent(transactionContext: object): Promise<boolean>;
  confirmContinuity?(transactionContext: object): Promise<boolean>;
  recordAudit?(transactionContext: object, result: AccessRoleRecord | AccessRoleAssignmentRecord): Promise<void>;
}

export interface AccessRepositoryPort {
  listMatrix(scope: AccessTenantScope): Promise<AccessMatrixRecord>;
  listApplicableUserIds(
    scope: AccessBranchScope,
  ): Promise<readonly AccessUserId[]>;
  resolveEffectiveCapabilities(
    scope: AccessPrincipalScope,
  ): Promise<readonly CapabilityCode[]>;
  createRole(
    scope: AccessTenantScope,
    input: CreateAccessRoleInput,
    guard?: AccessMutationCommitGuard,
  ): Promise<AccessRoleRecord>;
  replaceRoleCapabilities(
    scope: AccessTenantScope,
    input: ReplaceAccessRoleCapabilitiesInput,
    guard?: AccessMutationCommitGuard,
  ): Promise<AccessRoleRecord>;
  updateRole(
    scope: AccessTenantScope,
    input: UpdateAccessRoleInput,
    guard?: AccessMutationCommitGuard,
  ): Promise<AccessRoleRecord>;
  assignRole(
    scope: AccessTenantScope,
    input: AssignRoleInput,
    guard?: AccessMutationCommitGuard,
  ): Promise<AccessRoleAssignmentRecord>;
  revokeRoleAssignment(
    scope: AccessTenantScope,
    input: RevokeRoleAssignmentInput,
    guard?: AccessMutationCommitGuard,
  ): Promise<AccessRoleAssignmentRecord>;
}
