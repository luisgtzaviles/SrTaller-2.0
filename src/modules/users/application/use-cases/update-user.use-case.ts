import { parseUserId } from '../../domain/user.js';
import type { UserMutationCommitGuard, UserRecord, UserRepositoryPort } from '../ports/user-repository.port.js';
import { parseUpdateUserInput, parseUserScope } from '../user-input.js';

/** Edits identity metadata only; roles and PIN remain owned by Access. */
export class UpdateUserUseCase {
  constructor(private readonly repository: UserRepositoryPort, private readonly now: () => Date = () => new Date()) {}

  execute(scope: unknown, userId: unknown, input: unknown, guard?: UserMutationCommitGuard): Promise<UserRecord> {
    return this.repository.update(parseUserScope(scope), {
      ...parseUpdateUserInput(input), userId: parseUserId(userId as string), occurredAt: this.now().toISOString(),
    }, guard);
  }
}
