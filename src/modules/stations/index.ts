import type { TenancyModuleContract } from '../tenancy/index.js';

export type {
  TrustedStationContext,
} from './application/contracts/trusted-station-context.js';
export type {
  ResolveTrustedStationContext,
} from './application/use-cases/resolve-trusted-station-context.js';
export type {
  RunWithTrustedStationContext,
} from './application/use-cases/run-with-trusted-station-context.js';
export type {
  StationId,
} from './domain/station.js';
export { parseStationId } from './domain/station.js';

/** Compile-time marker for the public stations module boundary. */
export interface StationsModuleContract {
  readonly module: 'stations';
  readonly tenancy: TenancyModuleContract;
}
