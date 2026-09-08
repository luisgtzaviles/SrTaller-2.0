import type { TenantId } from '../../../tenancy/index.js';
import type { BranchTimeZone } from '../branch-time-zone.js';

/** Server-derived scope for the Branch currently trusted for the Station. */
export interface BranchSettingsScope {
  readonly tenantId: TenantId;
  readonly branchId: string;
}

export interface BranchSettingsRuntime {
  readTimeZone(
    scope: BranchSettingsScope,
  ): Promise<Readonly<{ timeZone: BranchTimeZone }> | null>;
  updateTimeZone(
    scope: BranchSettingsScope,
    timeZone: unknown,
  ): Promise<Readonly<{ timeZone: BranchTimeZone }>>;
}

export const BRANCH_SETTINGS_RUNTIME: unique symbol = Symbol(
  'srtaller.stations.branch-settings-runtime',
);
