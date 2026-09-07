import type { TenantId } from '../../../tenancy/index.js';
import type { BranchId } from '../ports/branch-repository.port.js';
import type { StationId } from '../../domain/station.js';

declare const trustedStationContextBrand: unique symbol;

export interface TrustedStationContext {
  readonly tenantId: TenantId;
  readonly branchId: BranchId;
  readonly stationId: StationId;
  readonly stationCredentialId: string;
  /** Stations-owned monotonic authority captured with credential verification. */
  readonly branchAdmissionRevision: number;
  readonly stationAdmissionRevision: number;
  readonly stationBindingAdmissionRevision: number;
  readonly stationCredentialAdmissionRevision: number;
  readonly source: 'server-verified-station-cookie';
  readonly [trustedStationContextBrand]: true;
}

const trustedContexts = new WeakSet<object>();

function validAdmissionRevision(value: number): boolean {
  return Number.isSafeInteger(value) && value >= 0;
}

export function createTrustedStationContext(input: Readonly<{
  tenantId: TenantId;
  branchId: BranchId;
  stationId: StationId;
  stationCredentialId: string;
  branchAdmissionRevision: number;
  stationAdmissionRevision: number;
  stationBindingAdmissionRevision: number;
  stationCredentialAdmissionRevision: number;
}>): TrustedStationContext {
  if (
    !validAdmissionRevision(input.branchAdmissionRevision) ||
    !validAdmissionRevision(input.stationAdmissionRevision) ||
    !validAdmissionRevision(input.stationBindingAdmissionRevision) ||
    !validAdmissionRevision(input.stationCredentialAdmissionRevision)
  ) {
    throw new TypeError('Trusted Station admission authority is invalid.');
  }
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
