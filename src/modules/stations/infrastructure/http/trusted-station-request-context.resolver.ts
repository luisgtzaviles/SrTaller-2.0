import type { TrustedStationContext, TrustedStationContextResolver } from '../../index.js';
import { ResolveTrustedStationContextUseCase } from '../../application/use-cases/resolve-trusted-station-context.js';
import { readStationCredentialCookie } from './station-credential-cookie.js';

export interface StationRuntimeRequestHeaders {
  readonly cookie?: string | readonly string[];
}

/**
 * The request adapter accepts only the browser Cookie header. It deliberately
 * has no tenant, branch, station, query, body or local-storage input.
 */
export class TrustedStationRequestContextResolver implements TrustedStationContextResolver {
  constructor(private readonly resolver: ResolveTrustedStationContextUseCase) {}

  async resolve(
    cookieValue: string | StationRuntimeRequestHeaders | undefined,
  ): Promise<TrustedStationContext> {
    const cookieHeader = typeof cookieValue === 'string'
      ? cookieValue
      : typeof cookieValue?.cookie === 'string'
        ? cookieValue.cookie
        : undefined;
    return this.resolver.execute(readStationCredentialCookie(cookieHeader));
  }
}
