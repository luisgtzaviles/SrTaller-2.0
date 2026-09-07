declare const roleAssignmentIdBrand: unique symbol;
declare const accessUserIdBrand: unique symbol;
declare const accessBranchIdBrand: unique symbol;

export type RoleAssignmentId = string & {
  readonly [roleAssignmentIdBrand]: 'RoleAssignmentId';
};
export type AccessUserId = string & {
  readonly [accessUserIdBrand]: 'AccessUserId';
};
export type AccessBranchId = string & {
  readonly [accessBranchIdBrand]: 'AccessBranchId';
};
export type RoleAssignmentScope = 'TENANT_WIDE' | 'BRANCH_RESTRICTED';
export type RoleAssignmentStatus = 'active' | 'revoked';

export type RoleAssignmentTarget =
  | Readonly<{ scope: 'TENANT_WIDE'; branchId: null }>
  | Readonly<{
      scope: 'BRANCH_RESTRICTED';
      branchId: AccessBranchId;
    }>;

const canonicalUuid =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/u;

function parseCanonicalUuid(value: unknown, label: string): string {
  if (typeof value !== 'string' || !canonicalUuid.test(value)) {
    throw new TypeError(`${label} must be a canonical UUID.`);
  }
  return value;
}

export function parseRoleAssignmentId(value: unknown): RoleAssignmentId {
  return parseCanonicalUuid(value, 'Role assignment ID') as RoleAssignmentId;
}

export function parseAccessUserId(value: unknown): AccessUserId {
  return parseCanonicalUuid(value, 'Access User ID') as AccessUserId;
}

export function parseAccessBranchId(value: unknown): AccessBranchId {
  return parseCanonicalUuid(value, 'Access Branch ID') as AccessBranchId;
}

export function parseRoleAssignmentScope(value: unknown): RoleAssignmentScope {
  if (value !== 'TENANT_WIDE' && value !== 'BRANCH_RESTRICTED') {
    throw new TypeError('Role assignment scope is invalid.');
  }
  return value;
}

export function parseRoleAssignmentStatus(value: unknown): RoleAssignmentStatus {
  if (value !== 'active' && value !== 'revoked') {
    throw new TypeError('Role assignment status is invalid.');
  }
  return value;
}

export function parseRoleAssignmentTarget(
  scopeValue: unknown,
  branchIdValue: unknown,
): RoleAssignmentTarget {
  const scope = parseRoleAssignmentScope(scopeValue);
  if (scope === 'TENANT_WIDE') {
    if (branchIdValue !== null && branchIdValue !== undefined) {
      throw new TypeError('A tenant-wide assignment cannot specify a Branch ID.');
    }
    return Object.freeze({ scope, branchId: null });
  }
  return Object.freeze({
    scope,
    branchId: parseAccessBranchId(branchIdValue),
  });
}
