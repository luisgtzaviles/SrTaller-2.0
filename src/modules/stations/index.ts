import type { TenancyModuleContract } from '../tenancy/index.js';
import type { TenantId } from '../tenancy/index.js';
import { recognizesTrustedStationContext } from './application/contracts/trusted-station-context.js';

export class TrustedStationContextError extends Error {
  constructor() {
    super('Trusted station context is unavailable.');
    this.name = 'TrustedStationContextError';
  }
}

/** Server-verified Station authority shared through the public module boundary. */
export interface TrustedStationContext {
  readonly tenantId: TenantId;
  readonly branchId: string;
  readonly stationId: string;
  /** Non-secret identity of the exact server-verified Station credential. */
  readonly stationCredentialId: string;
  readonly branchAdmissionRevision: number;
  readonly stationAdmissionRevision: number;
  readonly stationBindingAdmissionRevision: number;
  readonly stationCredentialAdmissionRevision: number;
  readonly source: 'server-verified-station-cookie';
}

export function isTrustedStationContext(
  value: unknown,
): value is TrustedStationContext {
  return recognizesTrustedStationContext(value);
}

export interface TrustedStationContextResolver {
  resolve(cookieHeader: string | undefined): Promise<TrustedStationContext>;
}

/** Monotonic Stations-owned authority captured by a Session. */
export interface TrustedStationAdmissionSnapshot {
  readonly branchRevision: number;
  readonly stationRevision: number;
  readonly bindingRevision: number;
  readonly credentialRevision: number;
}

/**
 * Owner-scoped admission check used only inside an already active technical
 * transaction. The opaque context never exposes a driver or Stations tables.
 */
export interface TrustedStationAdmissionValidator {
  validateTrustedStationAdmission(
    context: TrustedStationContext,
    expected: TrustedStationAdmissionSnapshot,
    transactionContext: object,
  ): Promise<TrustedStationAdmissionSnapshot | null>;
}

export const TRUSTED_STATION_CONTEXT_RESOLVER: unique symbol = Symbol(
  'srtaller.stations.trusted-station-context-resolver',
);

export const TRUSTED_STATION_ADMISSION_VALIDATOR: unique symbol = Symbol(
  'srtaller.stations.trusted-station-admission-validator',
);

/** Compile-time marker for the public stations module boundary. */
export interface StationsModuleContract {
  readonly module: 'stations';
  readonly tenancy: TenancyModuleContract;
}
