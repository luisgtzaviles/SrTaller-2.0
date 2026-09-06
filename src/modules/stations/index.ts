import type { TenancyModuleContract } from '../tenancy/index.js';

/** Compile-time marker for the public stations module boundary. */
export interface StationsModuleContract {
  readonly module: 'stations';
  readonly tenancy: TenancyModuleContract;
}
