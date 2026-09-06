export type UserStatus = 'active' | 'inactive' | 'revoked';

export function canTransitionUser(from: UserStatus, to: UserStatus): boolean {
  return (from === 'active' && (to === 'inactive' || to === 'revoked'))
    || (from === 'inactive' && (to === 'active' || to === 'revoked'));
}
