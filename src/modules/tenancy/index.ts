/** Compile-time marker for the public tenancy module boundary. */
export interface TenancyModuleContract {
  readonly module: 'tenancy';
}

declare const tenantIdBrand: unique symbol;
declare const branchIdBrand: unique symbol;

/** Canonical tenant identifier shared only through the tenancy public contract. */
export type TenantId = string & {
  readonly [tenantIdBrand]: 'TenantId';
};

/** Canonical branch identifier owned by tenancy and shared publicly. */
export type BranchId = string & {
  readonly [branchIdBrand]: 'BranchId';
};

const canonicalUuid =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/u;

export function parseTenantId(value: unknown): TenantId {
  if (
    typeof value !== 'string' ||
    !canonicalUuid.test(value)
  ) {
    throw new TypeError('TenantId must be a canonical UUID.');
  }
  return value as TenantId;
}

export function parseBranchId(value: unknown): BranchId {
  if (
    typeof value !== 'string' ||
    !canonicalUuid.test(value)
  ) {
    throw new TypeError('BranchId must be a canonical UUID.');
  }
  return value as BranchId;
}

export interface BranchEligibilityQuery {
  readonly tenantId: TenantId;
  readonly branchId: BranchId;
  /**
   * Opaque transaction participation token. It never exposes Kysely, pg or a
   * query builder and is meaningful only to the owner implementation.
   */
  readonly transactionContext?: object;
}

export interface EligibleBranchSnapshot {
  readonly tenantId: TenantId;
  readonly branchId: BranchId;
  readonly eligible: true;
}

export interface BranchEligibilityCapability {
  findEligibleBranch(
    query: BranchEligibilityQuery,
  ): Promise<EligibleBranchSnapshot | null>;
}
