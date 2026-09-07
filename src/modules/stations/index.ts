import type { TenancyModuleContract } from '../tenancy/index.js';
import type { TenantId } from '../tenancy/index.js';
import { recognizesTrustedStationContext } from './application/contracts/trusted-station-context.js';

/** Server-verified Station authority shared through the public module boundary. */
export interface TrustedStationContext {
  readonly tenantId: TenantId;
  readonly branchId: string;
  readonly stationId: string;
  readonly source: 'server-verified-station-cookie';
}

export function isTrustedStationContext(
  value: unknown,
): value is TrustedStationContext {
  return recognizesTrustedStationContext(value);
}

/** Compile-time marker for the public stations module boundary. */
export interface StationsModuleContract {
  readonly module: 'stations';
  readonly tenancy: TenancyModuleContract;
}
