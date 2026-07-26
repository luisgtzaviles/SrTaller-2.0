import { inspect } from 'node:util';

import type { BranchId, TenantId } from '../../index.js';
import { parseBranchId } from '../../index.js';

type ScopedTenantId = string & TenantId;
type ScopedBranchId = string & BranchId;

export interface TenantPersistenceScope {
  readonly tenantId: ScopedTenantId;
}

export interface TenantBranchPersistenceScope {
  readonly tenantId: ScopedTenantId;
  readonly branchId: ScopedBranchId;
}

export interface BranchRecord {
  readonly tenantId: TenantId;
  readonly branchId: BranchId;
  readonly createdAt: string;
}

export interface CreateBranchRecord {
  readonly tenantId: TenantId;
  readonly branchId: BranchId;
  readonly createdAt: string;
}

export type BranchPersistenceErrorCode =
  | 'PERSISTENCE_TENANT_SCOPE_REQUIRED'
  | 'PERSISTENCE_BRANCH_SCOPE_REQUIRED'
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
}
