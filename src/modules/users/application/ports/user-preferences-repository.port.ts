import type { TenantId } from '../../../tenancy/index.js';
import type { UserId } from '../../domain/user.js';

type ScopedTenantId = string & TenantId;
type ScopedUserId = string & UserId;

export type NewRepairFormMode = 'classic' | 'guided_v2';

export interface UserPreferencesScope {
  readonly tenantId: ScopedTenantId;
  readonly userId: ScopedUserId;
}

export type UserPreferencesRecord = Readonly<{
  newRepairFormMode: NewRepairFormMode;
  priceListShowReferenceCost: boolean;
  updatedAt: string | null;
}>;

export type UserPreferencesPatch = Readonly<{
  newRepairFormMode?: NewRepairFormMode;
  priceListShowReferenceCost?: boolean;
}>;

export type UserPreferencesMutationGuard = Readonly<{
  confirmCurrent(transactionContext: object): Promise<boolean>;
}>;

export type UserPreferencesPersistenceErrorCode =
  | 'USER_PREFERENCES_AUTHENTICATION_CHANGED'
  | 'USER_PREFERENCES_INPUT_INVALID'
  | 'USER_PREFERENCES_PERSISTENCE_FAILED'
  | 'USER_PREFERENCES_USER_NOT_FOUND';

export class UserPreferencesPersistenceError extends Error {
  constructor(readonly code: UserPreferencesPersistenceErrorCode) {
    super(code);
    this.name = 'UserPreferencesPersistenceError';
  }
}

export interface UserPreferencesRepositoryPort {
  read(scope: UserPreferencesScope): Promise<UserPreferencesRecord | null>;
  upsert(
    scope: UserPreferencesScope,
    patch: UserPreferencesPatch,
    occurredAt: Date,
    guard?: UserPreferencesMutationGuard,
  ): Promise<UserPreferencesRecord>;
}
