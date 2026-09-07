import { parseTenantId } from '../../tenancy/index.js';
import type { TenantId } from '../../tenancy/index.js';
import {
  parseRoleId,
} from '../domain/role.js';
import type { RoleId } from '../domain/role.js';
import {
  parseAccessBranchId,
  parseAccessUserId,
  parseRoleAssignmentId,
  parseRoleAssignmentScope,
} from '../domain/role-assignment.js';
import type {
  AccessBranchId,
  AccessUserId,
  RoleAssignmentId,
  RoleAssignmentScope,
} from '../domain/role-assignment.js';

const canonicalUuid =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/u;

export class AccessInputError extends Error {
  constructor(
    readonly parameter:
      | 'assignmentId'
      | 'assignmentScope'
      | 'branchId'
      | 'clientRequestId'
      | 'expectedVersion'
      | 'payload'
      | 'roleId'
      | 'tenantId'
      | 'userId',
  ) {
    super('Invalid Access input.');
    this.name = 'AccessInputError';
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
    Object.keys(value).some((key) => !allowedKeys.includes(key))
  ) {
    throw new AccessInputError('payload');
  }
  return value as Readonly<Record<string, unknown>>;
}

function parseRequestId(value: unknown): string {
  if (typeof value !== 'string' || !canonicalUuid.test(value)) {
    throw new AccessInputError('clientRequestId');
  }
  return value;
}

function tenantId(value: unknown): TenantId {
  try {
    return parseTenantId(value as string);
  } catch {
    throw new AccessInputError('tenantId');
  }
}

function branchId(value: unknown): AccessBranchId {
  try {
    return parseAccessBranchId(value as string);
  } catch {
    throw new AccessInputError('branchId');
  }
}

function userId(value: unknown): AccessUserId {
  try {
    return parseAccessUserId(value as string);
  } catch {
    throw new AccessInputError('userId');
  }
}

function roleId(value: unknown): RoleId {
  try {
    return parseRoleId(value as string);
  } catch {
    throw new AccessInputError('roleId');
  }
}

function assignmentId(value: unknown): RoleAssignmentId {
  try {
    return parseRoleAssignmentId(value as string);
  } catch {
    throw new AccessInputError('assignmentId');
  }
}

export function parseAccessTenantScope(
  value: unknown,
): Readonly<{ tenantId: TenantId }> {
  const input = exactObject(value, ['tenantId']);
  if (Object.keys(input).length !== 1) {
    throw new AccessInputError('tenantId');
  }
  return Object.freeze({ tenantId: tenantId(input.tenantId) });
}

export function parseAccessBranchScope(
  value: unknown,
): Readonly<{ tenantId: TenantId; branchId: AccessBranchId }> {
  const input = exactObject(value, ['branchId', 'tenantId']);
  if (Object.keys(input).length !== 2) {
    throw new AccessInputError('payload');
  }
  return Object.freeze({
    tenantId: tenantId(input.tenantId),
    branchId: branchId(input.branchId),
  });
}

export function parseAccessPrincipalScope(value: unknown): Readonly<{
  tenantId: TenantId;
  branchId: AccessBranchId;
  userId: AccessUserId;
}> {
  const input = exactObject(value, ['branchId', 'tenantId', 'userId']);
  if (Object.keys(input).length !== 3) {
    throw new AccessInputError('payload');
  }
  return Object.freeze({
    tenantId: tenantId(input.tenantId),
    branchId: branchId(input.branchId),
    userId: userId(input.userId),
  });
}

export function parseAssignRoleInput(value: unknown): Readonly<{
  userId: AccessUserId;
  roleId: RoleId;
  assignmentScope: RoleAssignmentScope;
  branchId: AccessBranchId | null;
  clientRequestId: string;
}> {
  const input = exactObject(value, [
    'assignmentScope',
    'branchId',
    'clientRequestId',
    'roleId',
    'userId',
  ]);
  if (Object.keys(input).length !== 5) {
    throw new AccessInputError('payload');
  }
  let assignmentScope: RoleAssignmentScope;
  try {
    assignmentScope = parseRoleAssignmentScope(input.assignmentScope as string);
  } catch {
    throw new AccessInputError('assignmentScope');
  }
  let parsedBranchId: AccessBranchId | null;
  if (input.branchId === null) {
    parsedBranchId = null;
  } else {
    parsedBranchId = branchId(input.branchId);
  }
  if (
    (assignmentScope === 'TENANT_WIDE' && parsedBranchId !== null) ||
    (assignmentScope === 'BRANCH_RESTRICTED' && parsedBranchId === null)
  ) {
    throw new AccessInputError('branchId');
  }
  return Object.freeze({
    userId: userId(input.userId),
    roleId: roleId(input.roleId),
    assignmentScope,
    branchId: parsedBranchId,
    clientRequestId: parseRequestId(input.clientRequestId),
  });
}

export function parseRevokeRoleAssignmentInput(value: unknown): Readonly<{
  assignmentId: RoleAssignmentId;
  expectedVersion: number;
  clientRequestId: string;
}> {
  const input = exactObject(value, [
    'assignmentId',
    'clientRequestId',
    'expectedVersion',
  ]);
  if (
    Object.keys(input).length !== 3 ||
    !Number.isSafeInteger(input.expectedVersion) ||
    (input.expectedVersion as number) < 0
  ) {
    throw new AccessInputError(
      Object.keys(input).length === 3 ? 'expectedVersion' : 'payload',
    );
  }
  return Object.freeze({
    assignmentId: assignmentId(input.assignmentId),
    expectedVersion: input.expectedVersion as number,
    clientRequestId: parseRequestId(input.clientRequestId),
  });
}
