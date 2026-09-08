declare const roleIdBrand: unique symbol;
declare const roleKeyBrand: unique symbol;
declare const roleDisplayNameBrand: unique symbol;
declare const roleDescriptionBrand: unique symbol;

export type RoleId = string & { readonly [roleIdBrand]: 'RoleId' };
export type RoleKey = string & { readonly [roleKeyBrand]: 'RoleKey' };
export type RoleDisplayName = string & {
  readonly [roleDisplayNameBrand]: 'RoleDisplayName';
};
export type RoleDescription = string & {
  readonly [roleDescriptionBrand]: 'RoleDescription';
};
export type RoleStatus = 'active' | 'disabled' | 'archived';

const canonicalUuid =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/u;
const canonicalRoleKey = /^[a-z][a-z0-9]*(?:_[a-z0-9]+)*$/u;

export function parseRoleId(value: unknown): RoleId {
  if (typeof value !== 'string' || !canonicalUuid.test(value)) {
    throw new TypeError('Role ID must be a canonical UUID.');
  }
  return value as RoleId;
}

export function parseRoleKey(value: unknown): RoleKey {
  if (
    typeof value !== 'string' ||
    value.length > 64 ||
    !canonicalRoleKey.test(value)
  ) {
    throw new TypeError('Role key is invalid.');
  }
  return value as RoleKey;
}

export function parseRoleDisplayName(value: unknown): RoleDisplayName {
  if (
    typeof value !== 'string' ||
    value.length === 0 ||
    value.length > 160 ||
    value !== value.trim()
  ) {
    throw new TypeError('Role display name is invalid.');
  }
  return value as RoleDisplayName;
}

export function parseRoleDescription(value: unknown): RoleDescription | null {
  if (value === null) return null;
  if (
    typeof value !== 'string' ||
    value.length === 0 ||
    value.length > 320 ||
    value !== value.trim()
  ) {
    throw new TypeError('Role description is invalid.');
  }
  return value as RoleDescription;
}

export function parseRoleStatus(value: unknown): RoleStatus {
  if (value !== 'active' && value !== 'disabled' && value !== 'archived') {
    throw new TypeError('Role status is invalid.');
  }
  return value;
}
