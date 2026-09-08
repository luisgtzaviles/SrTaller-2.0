export type PendingProfileUpdate = Readonly<{
  userId: string;
  expectedVersion: number;
  displayName: string;
  operationalIdentifier: string | null;
  clientRequestId: string;
}>;

export function createPendingProfileUpdate(input: PendingProfileUpdate): PendingProfileUpdate;

export function isPendingProfileInput(
  command: PendingProfileUpdate,
  userId: string,
  displayName: string,
  operationalIdentifier: string | null,
): boolean;

export function isProfileUpdateConfirmed(
  command: PendingProfileUpdate,
  user: Readonly<{
    userId: string;
    version: number;
    displayName: string;
    operationalIdentifier: string | null;
  }>,
): boolean;
