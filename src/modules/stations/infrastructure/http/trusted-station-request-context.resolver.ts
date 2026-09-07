import type { TrustedStationContext } from '../../index.js';
import { ResolveTrustedStationContextUseCase } from '../../application/use-cases/resolve-trusted-station-context.js';
import { readStationCredentialCookie } from './station-credential-cookie.js';

export interface StationRuntimeRequestHeaders {
  readonly cookie?: string | readonly string[];
}

/**
 * The request adapter accepts only the browser Cookie header. It deliberately
 * has no tenant, branch, station, query, body or local-storage input.
 */
export class TrustedStationRequestContextResolver {
  constructor(private readonly resolver: ResolveTrustedStationContextUseCase) {}

  async resolve(
    headers: StationRuntimeRequestHeaders,
  ): Promise<TrustedStationContext> {
    const cookie = typeof headers.cookie === 'string' ? headers.cookie : undefined;
    return this.resolver.execute(readStationCredentialCookie(cookie));
  }
}
