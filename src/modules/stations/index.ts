import type { TenancyModuleContract } from '../tenancy/index.js';

export { ResolveTrustedStationContextUseCase, TrustedStationContextError } from './application/use-cases/resolve-trusted-station-context.js';
export { stationCredentialCookieName, readStationCredentialCookie } from './infrastructure/persistence/kysely-station-credential.verifier.js';
export type { TrustedStationContext } from './application/contracts/trusted-station-context.js';
export { localStationBootstrapCredential } from './infrastructure/development/local-station-bootstrap.js';

/** Compile-time marker for the public stations module boundary. */
export interface StationsModuleContract {
  readonly module: 'stations';
  readonly tenancy: TenancyModuleContract;
}
