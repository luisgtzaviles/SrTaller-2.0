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

export type OperatingCurrency = string & { readonly __operatingCurrency: true };

export function parseOperatingCurrency(value: unknown): OperatingCurrency {
  if (typeof value !== 'string' || !/^[A-Z]{3}$/u.test(value)) {
    throw new TypeError('Operating currency must be an ISO 4217 alpha code.');
  }
  return value as OperatingCurrency;
}

export interface TenantSettingsRuntime {
  readOperatingCurrency(scope: Readonly<{ tenantId: TenantId }>): Promise<OperatingCurrency | null>;
}

export const TENANT_SETTINGS_RUNTIME: unique symbol = Symbol(
  'srtaller.tenancy.settings-runtime',
);

export type TenantBootstrapWriter =
  import('./application/ports/tenant-bootstrap-writer.port.js').TenantBootstrapWriterPort;
export interface TenantBootstrapPersistence {
  readonly writer: TenantBootstrapWriter;
}

export const TENANT_BOOTSTRAP_PERSISTENCE: unique symbol = Symbol(
  'srtaller.tenancy.bootstrap-persistence',
);
