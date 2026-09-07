import { randomUUID } from 'node:crypto';

import { parseAccessTenantScope } from '../access-input.js';
import { parseProvisionPinInput } from '../pin-input.js';
import type { PinCredentialRepositoryPort } from '../ports/pin-credential-repository.port.js';
import type { PinSecretHasherPort } from '../ports/pin-secret-hasher.port.js';
import { parsePinCredentialId } from '../../domain/pin-credential.js';

/** Server-only provisioning seam. It is intentionally not an HTTP surface. */
export class ProvisionPinCredentialUseCase {
  constructor(
    private readonly repository: PinCredentialRepositoryPort,
    private readonly hasher: PinSecretHasherPort,
    private readonly createId: () => string = randomUUID,
    private readonly now: () => Date = () => new Date(),
  ) {}

  async execute(scope: unknown, value: unknown) {
    const trustedScope = parseAccessTenantScope(scope);
    const input = parseProvisionPinInput(value);
    const credentialId = parsePinCredentialId(this.createId());
    const occurredAt = this.now().toISOString();
    const secret = await this.hasher.hash({
      tenantId: trustedScope.tenantId,
      userId: input.userId,
      clientRequestId: input.clientRequestId,
      pin: input.pin,
    });
    return this.repository.provision(trustedScope, {
      userId: input.userId,
      credentialId,
      clientRequestId: input.clientRequestId,
      occurredAt,
      secret,
    });
  }
}
