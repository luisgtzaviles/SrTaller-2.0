import { createTrustedStationContext } from '../contracts/trusted-station-context.js';
import type { TrustedStationContext } from '../contracts/trusted-station-context.js';
import type { StationCredentialVerifier } from '../ports/station-credential.port.js';

export class TrustedStationContextError extends Error {
  constructor() { super('Trusted station context is unavailable.'); this.name = 'TrustedStationContextError'; }
}

export class ResolveTrustedStationContextUseCase {
  constructor(private readonly verifier: StationCredentialVerifier) {}

  async execute(credential: string | null): Promise<TrustedStationContext> {
    if (credential === null) throw new TrustedStationContextError();
    const verified = await this.verifier.verify(credential);
    if (!verified) throw new TrustedStationContextError();
    return createTrustedStationContext(verified);
  }
}
