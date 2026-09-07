declare const userIdBrand: unique symbol;

export type UserId = string & { readonly [userIdBrand]: 'UserId' };
export type UserStatus = 'active' | 'inactive' | 'revoked';

const canonicalUuid =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/u;

export function parseUserId(value: string): UserId {
  if (!canonicalUuid.test(value)) {
    throw new Error('UserId must be a canonical UUID');
  }
  return value as UserId;
}

export function parseUserStatus(value: string): UserStatus {
  if (value !== 'active' && value !== 'inactive' && value !== 'revoked') {
    throw new Error('User status is invalid');
  }
  return value;
}

export function canTransitionUser(from: UserStatus, to: UserStatus): boolean {
  return (from === 'active' && (to === 'inactive' || to === 'revoked'))
    || (from === 'inactive' && (to === 'active' || to === 'revoked'));
}
