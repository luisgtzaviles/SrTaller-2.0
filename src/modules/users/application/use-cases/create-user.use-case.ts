import { randomUUID } from 'node:crypto';

import { parseUserId } from '../../domain/user.js';
import type { UserRecord, UserRepositoryPort } from '../ports/user-repository.port.js';
import { parseCreateUserInput, parseUserScope } from '../user-input.js';

/** Local Product Mode command; lifecycle ownership remains the Users module. */
export class CreateUserUseCase {
  constructor(
    private readonly repository: UserRepositoryPort,
    private readonly createId: () => string = randomUUID,
    private readonly now: () => Date = () => new Date(),
  ) {}

  execute(scope: unknown, input: unknown): Promise<UserRecord> {
    return this.repository.create(parseUserScope(scope), {
      ...parseCreateUserInput(input),
      userId: parseUserId(this.createId()),
      occurredAt: this.now().toISOString(),
    });
  }
}
