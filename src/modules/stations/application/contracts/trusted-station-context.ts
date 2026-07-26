import type { BranchId, TenantId } from '../../../tenancy/index.js';
import type {
  StationId,
  StationRevision,
} from '../../domain/station.js';

declare const trustedStationContextBrand: unique symbol;

export interface TrustedStationContext {
  readonly tenantId: TenantId;
  readonly branchId: BranchId;
  readonly stationId: StationId;
  readonly stationRevision: StationRevision;
  readonly source: 'server-verified-station';
  readonly [trustedStationContextBrand]: true;
}

const trustedContexts = new WeakSet<object>();

export function createTrustedStationContext(input: Readonly<{
  tenantId: TenantId;
  branchId: BranchId;
  stationId: StationId;
  stationRevision: StationRevision;
}>): TrustedStationContext {
  const context = Object.freeze({
    tenantId: input.tenantId,
    branchId: input.branchId,
    stationId: input.stationId,
    stationRevision: input.stationRevision,
    source: 'server-verified-station' as const,
  }) as TrustedStationContext;
  trustedContexts.add(context);
  return context;
}

export function isTrustedStationContext(
  value: unknown,
): value is TrustedStationContext {
  return typeof value === 'object' &&
    value !== null &&
    trustedContexts.has(value);
}
