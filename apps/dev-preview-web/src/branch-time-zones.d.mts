export type BranchTimeZoneOption = Readonly<{ timeZone: string; city: string }>;

export const BRANCH_TIME_ZONE_OPTIONS: readonly BranchTimeZoneOption[];
export function humanBranchTimeZoneLabel(timeZone: string, now?: Date): string;
export function branchTimeZoneOptions(currentTimeZone: string): readonly BranchTimeZoneOption[];
