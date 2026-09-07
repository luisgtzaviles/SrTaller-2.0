import { randomUUID } from 'node:crypto';

import { parseUserId } from '../../domain/user.js';
import type { UserRecord, UserRepositoryPort } from '../ports/user-repository.port.js';
import {
  parseProvisionFirstUserInput,
  parseUserScope,
} from '../user-input.js';

/** Server-only first-user bootstrap; it is intentionally not an HTTP surface. */
export class ProvisionFirstUserUseCase {
  constructor(
    private readonly repository: UserRepositoryPort,
    private readonly createId: () => string = randomUUID,
    private readonly now: () => Date = () => new Date(),
  ) {}

  execute(scope: unknown, input: unknown): Promise<UserRecord> {
    const trustedScope = parseUserScope(scope);
    const trustedInput = parseProvisionFirstUserInput(input);
    return this.repository.bootstrap(trustedScope, {
      ...trustedInput,
      userId: parseUserId(this.createId()),
      occurredAt: this.now().toISOString(),
    });
  }
}
