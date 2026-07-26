/** Compile-time marker for the public tenancy module boundary. */
export interface TenancyModuleContract {
  readonly module: 'tenancy';
}

declare const tenantIdBrand: unique symbol;

/** Canonical tenant identifier shared only through the tenancy public contract. */
export type TenantId = string & {
  readonly [tenantIdBrand]: 'TenantId';
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
