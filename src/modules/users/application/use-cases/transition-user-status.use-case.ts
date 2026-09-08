import type { UserMutationCommitGuard, UserRecord, UserRepositoryPort } from '../ports/user-repository.port.js';
import {
  parseTransitionUserInput,
  parseUserScope,
} from '../user-input.js';

/** Governed lifecycle transition; no public presentation adapter is exposed in PBI-032. */
export class TransitionUserStatusUseCase {
  constructor(
    private readonly repository: UserRepositoryPort,
    private readonly now: () => Date = () => new Date(),
  ) {}

  execute(scope: unknown, input: unknown, guard?: UserMutationCommitGuard): Promise<UserRecord> {
    return this.repository.transition(
      parseUserScope(scope),
      {
        ...parseTransitionUserInput(input),
        occurredAt: this.now().toISOString(),
      },
      guard,
    );
  }
}
