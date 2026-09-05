import { inspect } from 'node:util';

import type { TenantId } from '../../../tenancy/index.js';
import type { BranchTimeZone } from '../branch-time-zone.js';

declare const branchIdBrand: unique symbol;

type ScopedTenantId = string & TenantId;

export type BranchId = string & {
  readonly [branchIdBrand]: 'BranchId';
};

const canonicalUuid =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/u;

export function parseBranchId(value: unknown): BranchId {
  if (
    typeof value !== 'string' ||
    !canonicalUuid.test(value)
  ) {
    throw new TypeError('BranchId must be a canonical UUID.');
  }
  return value as BranchId;
}

export interface TenantPersistenceScope {
  readonly tenantId: ScopedTenantId;
}

export interface TenantBranchPersistenceScope {
  readonly tenantId: ScopedTenantId;
  readonly branchId: BranchId;
}

export interface BranchRecord {
  readonly tenantId: TenantId;
  readonly branchId: BranchId;
  readonly timeZone: BranchTimeZone;
  readonly createdAt: string;
}

export interface CreateBranchRecord {
  readonly tenantId: TenantId;
  readonly branchId: BranchId;
  readonly timeZone: BranchTimeZone;
  readonly createdAt: string;
}

export type BranchPersistenceErrorCode =
  | 'PERSISTENCE_TENANT_SCOPE_REQUIRED'
  | 'PERSISTENCE_BRANCH_SCOPE_REQUIRED'
  | 'BRANCH_PERSISTENCE_TIME_ZONE_INVALID'
  | 'BRANCH_PERSISTENCE_CONFLICT'
  | 'BRANCH_PERSISTENCE_TENANT_NOT_FOUND'
  | 'BRANCH_PERSISTENCE_NOT_FOUND'
  | 'BRANCH_PERSISTENCE_FAILED';

type BranchPersistenceErrorCategory =
  | 'Conflict'
  | 'NotFound'
  | 'Persistence'
  | 'Validation';

type BranchPersistenceRetryability = 'conditional' | 'never';

const errorContracts: Readonly<
  Record<
    BranchPersistenceErrorCode,
    Readonly<{
      category: BranchPersistenceErrorCategory;
      message: string;
    }>
  >
> = Object.freeze({
  PERSISTENCE_TENANT_SCOPE_REQUIRED: Object.freeze({
    category: 'Validation',
    message: 'A valid tenant persistence scope is required.',
  }),
  PERSISTENCE_BRANCH_SCOPE_REQUIRED: Object.freeze({
    category: 'Validation',
    message: 'A valid branch persistence scope is required.',
  }),
  BRANCH_PERSISTENCE_TIME_ZONE_INVALID: Object.freeze({
    category: 'Validation',
    message: 'A valid branch IANA time zone is required.',
  }),
  BRANCH_PERSISTENCE_CONFLICT: Object.freeze({
    category: 'Conflict',
    message: 'The branch persistence operation conflicts with existing state.',
  }),
  BRANCH_PERSISTENCE_TENANT_NOT_FOUND: Object.freeze({
    category: 'NotFound',
    message: 'The branch tenant persistence record was not found.',
  }),
  BRANCH_PERSISTENCE_NOT_FOUND: Object.freeze({
    category: 'NotFound',
    message: 'The branch persistence record was not found.',
  }),
  BRANCH_PERSISTENCE_FAILED: Object.freeze({
    category: 'Persistence',
    message: 'The branch persistence operation failed.',
  }),
});

export class BranchPersistenceError extends Error {
  readonly category: BranchPersistenceErrorCategory;

  constructor(
    readonly code: BranchPersistenceErrorCode,
    readonly retryable: BranchPersistenceRetryability = 'never',
  ) {
    const contract = errorContracts[code];
    super(contract.message);
    this.name = 'BranchPersistenceError';
    this.category = contract.category;
  }

  toJSON(): Readonly<{
    name: 'BranchPersistenceError';
    category: BranchPersistenceErrorCategory;
    code: BranchPersistenceErrorCode;
    message: string;
    retryable: BranchPersistenceRetryability;
  }> {
    return Object.freeze({
      name: 'BranchPersistenceError',
      category: this.category,
      code: this.code,
      message: this.message,
      retryable: this.retryable,
    });
  }

  [inspect.custom](): ReturnType<BranchPersistenceError['toJSON']> {
    return this.toJSON();
  }
}

export interface BranchRepositoryPort {
  createBranch(
    scope: TenantBranchPersistenceScope,
    record: CreateBranchRecord,
  ): Promise<BranchRecord>;
  findBranchById(
    scope: TenantBranchPersistenceScope,
  ): Promise<BranchRecord | null>;
  listBranchesByTenant(
    scope: TenantPersistenceScope,
  ): Promise<readonly BranchRecord[]>;
  existsBranch(scope: TenantBranchPersistenceScope): Promise<boolean>;
  updateBranchTimeZone(
    scope: TenantBranchPersistenceScope,
    timeZone: BranchTimeZone,
  ): Promise<BranchRecord>;
}
