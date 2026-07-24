import type { StationsModuleContract } from '../stations/index.js';
import type { TenancyModuleContract } from '../tenancy/index.js';

/** Compile-time marker for the public access module boundary. */
export interface AccessModuleContract {
  readonly module: 'access';
  readonly stations: StationsModuleContract;
  readonly tenancy: TenancyModuleContract;
}
