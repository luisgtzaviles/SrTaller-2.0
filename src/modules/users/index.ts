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
