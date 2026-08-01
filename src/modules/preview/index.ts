import type { StationsModuleContract } from '../stations/index.js';
import type { TenancyModuleContract } from '../tenancy/index.js';

export interface PreviewContextView {
  readonly tenantName: string;
  readonly branchName: string;
  readonly stationLabel: string;
  readonly environment: 'DEV_PREVIEW';
}

/** Compile-time marker for the isolated Visual Slice 0 preview boundary. */
export interface PreviewModuleContract {
  readonly module: 'preview';
  readonly stations: StationsModuleContract;
  readonly tenancy: TenancyModuleContract;
}
