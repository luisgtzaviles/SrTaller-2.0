import type { TenantId } from '../../../tenancy/index.js';
import type { BranchId } from '../ports/branch-repository.port.js';
import type { StationId } from '../../domain/station.js';

declare const trustedStationContextBrand: unique symbol;

export interface TrustedStationContext {
  readonly tenantId: TenantId;
  readonly branchId: BranchId;
  readonly stationId: StationId;
  readonly source: 'server-verified-station-cookie';
  readonly [trustedStationContextBrand]: true;
}

const trustedContexts = new WeakSet<object>();

export function createTrustedStationContext(input: Readonly<{
  tenantId: TenantId;
  branchId: BranchId;
  stationId: StationId;
}>): TrustedStationContext {
  const context = Object.freeze({
    ...input,
    source: 'server-verified-station-cookie' as const,
  }) as TrustedStationContext;
  trustedContexts.add(context);
  return context;
}

export function recognizesTrustedStationContext(value: unknown): value is TrustedStationContext {
  return typeof value === 'object' && value !== null && trustedContexts.has(value);
}
