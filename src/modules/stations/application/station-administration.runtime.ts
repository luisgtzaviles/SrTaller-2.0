export type StationInventoryStatus = 'UNLINKED' | 'ACTIVE' | 'REVOKED';
export type StationCredentialState = 'CURRENT' | 'ABSENT' | 'REVOKED';

export type StationBindingHistoryItem = Readonly<{
  branchId: string;
  branchDisplayName: string;
  linkedAt: string;
  unlinkedAt: string | null;
  admissionRevision: number;
}>;

export type StationInventoryItem = Readonly<{
  stationId: string;
  displayName: string;
  status: StationInventoryStatus;
  branchId: string | null;
  branchDisplayName: string | null;
  branchStatus: 'ACTIVE' | 'INACTIVE' | null;
  credentialState: StationCredentialState;
  version: number;
  admissionRevision: number;
  createdAt: string;
  updatedAt: string;
  revokedAt: string | null;
  bindingHistory?: readonly StationBindingHistoryItem[];
}>;

export type StationEnrollmentItem = Readonly<{
  challengeId: string;
  targetBranchId: string;
  targetBranchDisplayName: string;
  intendedStationId: string | null;
  intendedDisplayName: string;
  kind: 'NEW_STATION' | 'RELINK_STATION';
  status: 'ACTIVE' | 'CONSUMED' | 'CANCELED' | 'SUPERSEDED' | 'EXPIRED';
  version: number;
  createdAt: string;
  expiresAt: string;
  consumedAt: string | null;
  canceledAt: string | null;
  supersededAt: string | null;
}>;

export type IssuedStationEnrollment = Readonly<{
  enrollment: StationEnrollmentItem;
  /** Returned only by the successful first issue response. Never persisted. */
  manualCode: string | null;
  /** Presentation payload for a QR. It carries the same authority as manualCode. */
  qrPayload: string | null;
}>;

export interface StationAdministrationContext {
  readonly tenantId: string;
  readonly sessionId: string;
  readonly userId: string;
  readonly adminIdentityId: string;
  readonly userDisplayName: string;
  readonly capability: string;
  /** null means tenant-wide; otherwise exact authorized Branch IDs. */
  readonly authorizedBranchIds: readonly string[] | null;
  readonly authorityDigest: Uint8Array;
  readonly commitGuard: Readonly<{
    confirmCurrent(transactionContext: object, exactBranchIds?: readonly string[]): Promise<boolean>;
  }>;
  readonly invalidateOperationalSessions: (
    stationId: string,
    occurredAt: string,
    transactionContext: object,
  ) => Promise<number>;
}

export interface StationAdministrationRuntime {
  list(context: StationAdministrationContext): Promise<readonly StationInventoryItem[]>;
  read(context: StationAdministrationContext, stationId: unknown): Promise<StationInventoryItem>;
  listEnrollments(context: StationAdministrationContext): Promise<readonly StationEnrollmentItem[]>;
  rename(context: StationAdministrationContext, stationId: unknown, input: unknown): Promise<StationInventoryItem>;
  issueEnrollment(context: StationAdministrationContext, input: unknown): Promise<IssuedStationEnrollment>;
  cancelEnrollment(context: StationAdministrationContext, challengeId: unknown, input: unknown): Promise<StationEnrollmentItem>;
  unlink(context: StationAdministrationContext, stationId: unknown, input: unknown): Promise<StationInventoryItem>;
  initiateRelink(context: StationAdministrationContext, stationId: unknown, input: unknown): Promise<IssuedStationEnrollment>;
  revoke(context: StationAdministrationContext, stationId: unknown, input: unknown): Promise<StationInventoryItem>;
}

export const STATION_ADMINISTRATION_RUNTIME: unique symbol = Symbol(
  'srtaller.stations.station-administration-runtime',
);
