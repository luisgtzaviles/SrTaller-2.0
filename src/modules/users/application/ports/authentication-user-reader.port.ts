import type { TenantId } from '../../../tenancy/index.js';
import type { AuthenticationUserRecord } from '../../index.js';

type AuthenticationUserScopedTenantId = string & TenantId;

export interface AuthenticationUserPersistenceScope {
  readonly tenantId: AuthenticationUserScopedTenantId;
}

/** Owner-scoped persistence port behind the public Users read contract. */
export interface AuthenticationUserReaderPort {
  findAuthenticationUser(
    scope: AuthenticationUserPersistenceScope,
    userId: string,
  ): Promise<AuthenticationUserRecord | null>;
}
