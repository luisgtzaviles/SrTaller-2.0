import { parseAccessTenantScope } from '../access-input.js';
import { parseProvisionPinInput } from '../pin-input.js';
import type { PinCredentialRepositoryPort } from '../ports/pin-credential-repository.port.js';
import type { PinSecretHasherPort } from '../ports/pin-secret-hasher.port.js';

/** Replaces the verifier atomically; the previous PIN is never returned or retained. */
export class ReplacePinCredentialUseCase {
  constructor(private readonly repository: PinCredentialRepositoryPort, private readonly hasher: PinSecretHasherPort, private readonly now: () => Date = () => new Date()) {}
  async execute(scope: unknown, value: unknown) {
    const trustedScope = parseAccessTenantScope(scope);
    const input = parseProvisionPinInput(value);
    const secret = await this.hasher.hash({ tenantId: trustedScope.tenantId, userId: input.userId, clientRequestId: input.clientRequestId, pin: input.pin });
    return this.repository.replace(trustedScope, { userId: input.userId, occurredAt: this.now().toISOString(), secret });
  }
}
