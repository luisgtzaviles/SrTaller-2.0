import type { TenantId } from '../../../tenancy/index.js';
import type { UserId, UserStatus } from '../../domain/user.js';

type ScopedTenantId = string & TenantId;

export interface UserScope {
  readonly tenantId: ScopedTenantId;
}

export type UserRecord = Readonly<{
  userId: UserId;
  tenantId: TenantId;
  displayName: string;
  operationalIdentifier: string | null;
  status: UserStatus;
  version: number;
  createdAt: string;
  updatedAt: string;
}>;

export type BootstrapUserInput = Readonly<{
  userId: UserId;
  displayName: string;
  operationalIdentifier: string | null;
  clientRequestId: string;
  occurredAt: string;
}>;

export type CreateUserInput = BootstrapUserInput;

export type TransitionUserInput = Readonly<{
  userId: UserId;
  status: UserStatus;
  expectedVersion: number;
  clientRequestId: string;
  occurredAt: string;
}>;

export type UpdateUserInput = Readonly<{
  userId: UserId;
  displayName: string;
  operationalIdentifier: string | null;
  expectedVersion: number;
  occurredAt: string;
}>;

export type UserPersistenceErrorCode =
  | 'FIRST_USER_ALREADY_PROVISIONED'
  | 'USER_IDEMPOTENCY_CONFLICT'
  | 'USER_INPUT_INVALID'
  | 'USER_LIFECYCLE_CONFLICT'
  | 'USER_NOT_FOUND'
  | 'USER_PERSISTENCE_CONFLICT'
  | 'USER_PERSISTENCE_FAILED'
  | 'USER_AUTHORIZATION_CHANGED'
  | 'USER_STALE_WRITE'
  | 'USER_TENANT_NOT_FOUND'
  | 'USER_TENANT_SCOPE_REQUIRED';

export class UserPersistenceError extends Error {
  constructor(readonly code: UserPersistenceErrorCode) {
    super(code);
    this.name = 'UserPersistenceError';
  }

  toJSON(): Readonly<{ code: UserPersistenceErrorCode; name: string }> {
    return Object.freeze({ code: this.code, name: this.name });
  }
}

export interface UserMutationCommitGuard {
  confirmCurrent(transactionContext: object): Promise<boolean>;
  confirmContinuity?(transactionContext: object): Promise<boolean>;
}

export interface UserRepositoryPort {
  list(scope: UserScope): Promise<readonly UserRecord[]>;
  findById(scope: UserScope, userId: UserRecord['userId']): Promise<UserRecord | null>;
  bootstrap(scope: UserScope, input: BootstrapUserInput): Promise<UserRecord>;
  create(scope: UserScope, input: CreateUserInput, guard?: UserMutationCommitGuard): Promise<UserRecord>;
  update(scope: UserScope, input: UpdateUserInput, guard?: UserMutationCommitGuard): Promise<UserRecord>;
  transition(scope: UserScope, input: TransitionUserInput, guard?: UserMutationCommitGuard): Promise<UserRecord>;
}
