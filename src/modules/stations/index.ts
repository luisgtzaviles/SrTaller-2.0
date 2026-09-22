import type { TenancyModuleContract } from '../tenancy/index.js';
import type { TenantId } from '../tenancy/index.js';
import { recognizesTrustedStationContext } from './application/contracts/trusted-station-context.js';
import {
  BRANCH_SETTINGS_RUNTIME as branchSettingsRuntimeToken,
} from './application/ports/branch-settings-runtime.port.js';
import type {
  BranchSettingsRuntime as BranchSettingsRuntimeContract,
  BranchSettingsScope as BranchSettingsScopeContract,
} from './application/ports/branch-settings-runtime.port.js';
import {
  branchLocalCalendarBoundaryToUtc as toBranchLocalCalendarBoundary,
  branchLocalCalendarDate as toBranchLocalCalendarDate,
  branchLocalDateTimeToUtc as toBranchLocalDateTime,
  parseBranchTimeZone as parseTimeZone,
  presentOperationalDateTime as presentDateTime,
} from './application/branch-time-zone.js';
import { BRANCH_ADMINISTRATION_RUNTIME as branchAdministrationRuntimeToken } from './application/branch-administration.service.js';
import type { BranchAdministrationRuntime as BranchAdministrationRuntimeContract } from './application/branch-administration.service.js';
import type {
  BranchTimeZone as BranchTimeZoneContract,
  OperationalDateTime as OperationalDateTimeContract,
} from './application/branch-time-zone.js';

/** Public façade for the Stations-owned Branch settings capability. */
export const BRANCH_SETTINGS_RUNTIME: typeof branchSettingsRuntimeToken =
  branchSettingsRuntimeToken;
export type BranchSettingsRuntime = BranchSettingsRuntimeContract;
export type BranchSettingsScope = BranchSettingsScopeContract;
export type BranchTimeZone = BranchTimeZoneContract;
export type OperationalDateTime = OperationalDateTimeContract;
export const branchLocalCalendarBoundaryToUtc = toBranchLocalCalendarBoundary;
export const branchLocalCalendarDate = toBranchLocalCalendarDate;
export const branchLocalDateTimeToUtc = toBranchLocalDateTime;
export const parseBranchTimeZone = parseTimeZone;
export const presentOperationalDateTime = presentDateTime;
export const BRANCH_ADMINISTRATION_RUNTIME: typeof branchAdministrationRuntimeToken = branchAdministrationRuntimeToken;
export type BranchAdministrationRuntime = BranchAdministrationRuntimeContract;

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

export interface AdminInvitationBranchCommitValidator {
  validateActive(
    scope: Readonly<{ tenantId: string; branchId: string }>,
    transactionContext: object,
  ): Promise<boolean>;
}

export const ADMIN_INVITATION_BRANCH_COMMIT_VALIDATOR: unique symbol = Symbol(
  'srtaller.stations.admin-invitation-branch-commit-validator',
);

/** Compile-time marker for the public stations module boundary. */
export interface StationsModuleContract {
  readonly module: 'stations';
  readonly tenancy: TenancyModuleContract;
}
