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
  /** Monotonic owner authority for lifecycle admission. */
  admissionRevision: number;
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

export interface AuthenticationUserAdmissionSnapshot {
  readonly user: AuthenticationUserRecord;
  /** Monotonic Users-owned lifecycle authority. */
  readonly admissionRevision: number;
}

/** Owner-scoped exact-version check for a composed admission transaction. */
export interface AuthenticationUserAdmissionValidator {
  validateAuthenticationUserAdmission(
    scope: AuthenticationUserScope,
    userId: string,
    expectedVersion: number,
    expectedAdmissionRevision: number,
    transactionContext: object,
  ): Promise<AuthenticationUserAdmissionSnapshot | null>;
}

export const AUTHENTICATION_USER_READER: unique symbol = Symbol(
  'srtaller.users.authentication-user-reader',
);

export const AUTHENTICATION_USER_ADMISSION_VALIDATOR: unique symbol = Symbol(
  'srtaller.users.authentication-user-admission-validator',
);

export const USER_PRODUCT_RUNTIME: unique symbol = Symbol('srtaller.users.product-runtime');
export const USER_PREFERENCES_RUNTIME: unique symbol = Symbol(
  'srtaller.users.preferences-runtime',
);

export type NewRepairFormMode =
  import('./application/ports/user-preferences-repository.port.js').NewRepairFormMode;

export interface UserPreferencesRuntime {
  get(scope: unknown): Promise<
    import('./application/ports/user-preferences-repository.port.js').UserPreferencesRecord
  >;
  update(
    scope: unknown,
    input: unknown,
    guard?: import('./application/ports/user-preferences-repository.port.js').UserPreferencesMutationGuard,
  ): Promise<
    import('./application/ports/user-preferences-repository.port.js').UserPreferencesRecord
  >;
}

export interface UserProductRuntime {
  list(scope: unknown): Promise<readonly import('./application/ports/user-repository.port.js').UserRecord[]>;
  create(scope: unknown, input: unknown, guard?: import('./application/ports/user-repository.port.js').UserMutationCommitGuard): Promise<import('./application/ports/user-repository.port.js').UserRecord>;
  update(scope: unknown, userId: unknown, input: unknown, guard?: import('./application/ports/user-repository.port.js').UserMutationCommitGuard): Promise<import('./application/ports/user-repository.port.js').UserRecord>;
  transition(scope: unknown, input: unknown, guard?: import('./application/ports/user-repository.port.js').UserMutationCommitGuard): Promise<import('./application/ports/user-repository.port.js').UserRecord>;
}
