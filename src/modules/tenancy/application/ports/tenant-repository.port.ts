import { inspect } from 'node:util';

import type { TenantId } from '../../index.js';

type ScopedTenantId = string & TenantId;

export interface TenantPersistenceScope {
  readonly tenantId: ScopedTenantId;
}

export interface TenantRecord {
  readonly tenantId: TenantId;
  readonly createdAt: string;
}

export interface CreateTenantRecord {
  readonly tenantId: TenantId;
  readonly createdAt: string;
}

export type TenantPersistenceErrorCode =
  | 'PERSISTENCE_TENANT_SCOPE_REQUIRED'
  | 'TENANT_PERSISTENCE_CONFLICT'
  | 'TENANT_PERSISTENCE_NOT_FOUND'
  | 'TENANT_PERSISTENCE_FAILED';

type TenantPersistenceErrorCategory =
  | 'Conflict'
  | 'NotFound'
  | 'Persistence'
  | 'Validation';

type TenantPersistenceRetryability = 'conditional' | 'never';

const errorContracts: Readonly<
  Record<
    TenantPersistenceErrorCode,
    Readonly<{
      category: TenantPersistenceErrorCategory;
      message: string;
    }>
  >
> = Object.freeze({
  PERSISTENCE_TENANT_SCOPE_REQUIRED: Object.freeze({
    category: 'Validation',
    message: 'A valid tenant persistence scope is required.',
  }),
  TENANT_PERSISTENCE_CONFLICT: Object.freeze({
    category: 'Conflict',
    message: 'The tenant persistence operation conflicts with existing state.',
  }),
  TENANT_PERSISTENCE_NOT_FOUND: Object.freeze({
    category: 'NotFound',
    message: 'The tenant persistence record was not found.',
  }),
  TENANT_PERSISTENCE_FAILED: Object.freeze({
    category: 'Persistence',
    message: 'The tenant persistence operation failed.',
  }),
});

export class TenantPersistenceError extends Error {
  readonly category: TenantPersistenceErrorCategory;

  constructor(
    readonly code: TenantPersistenceErrorCode,
    readonly retryable: TenantPersistenceRetryability = 'never',
  ) {
    const contract = errorContracts[code];
    super(contract.message);
    this.name = 'TenantPersistenceError';
    this.category = contract.category;
  }

  toJSON(): Readonly<{
    name: 'TenantPersistenceError';
    category: TenantPersistenceErrorCategory;
    code: TenantPersistenceErrorCode;
    message: string;
    retryable: TenantPersistenceRetryability;
  }> {
    return Object.freeze({
      name: 'TenantPersistenceError',
      category: this.category,
      code: this.code,
      message: this.message,
      retryable: this.retryable,
    });
  }

  [inspect.custom](): ReturnType<TenantPersistenceError['toJSON']> {
    return this.toJSON();
  }
}

export interface TenantRepositoryPort {
  createTenant(
    scope: TenantPersistenceScope,
    record: CreateTenantRecord,
  ): Promise<TenantRecord>;
  findTenantById(
    scope: TenantPersistenceScope,
  ): Promise<TenantRecord | null>;
  existsTenant(scope: TenantPersistenceScope): Promise<boolean>;
}
