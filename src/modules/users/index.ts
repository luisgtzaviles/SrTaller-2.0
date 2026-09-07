import type { TenantId } from '../tenancy/index.js';

/** Public marker for the tenant-scoped User Directory boundary. */
export interface UsersModuleContract {
  readonly module: 'users';
}

export type AuthenticationUserRecord = Readonly<{
  tenantId: TenantId;
  userId: string;
  displayName: string;
  status: 'active' | 'inactive' | 'revoked';
  version: number;
}>;

export interface AuthenticationUserScope {
  readonly tenantId: TenantId;
}

/** Narrow server-side read contract used by authentication composition. */
export interface AuthenticationUserReader {
  findAuthenticationUser(
    scope: AuthenticationUserScope,
    userId: string,
  ): Promise<AuthenticationUserRecord | null>;
}
