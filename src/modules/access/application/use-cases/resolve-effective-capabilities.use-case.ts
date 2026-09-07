import type { CapabilityCode } from '../../domain/capability.js';
import type { AccessRepositoryPort } from '../ports/access-repository.port.js';
import { parseAccessPrincipalScope } from '../access-input.js';

/** Resolves grants only; PBI-026 owns the final contextual authorization verdict. */
export class ResolveEffectiveCapabilitiesUseCase {
  constructor(private readonly repository: AccessRepositoryPort) {}

  execute(scope: unknown): Promise<readonly CapabilityCode[]> {
    return this.repository.resolveEffectiveCapabilities(
      parseAccessPrincipalScope(scope),
    );
  }
}
