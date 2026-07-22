import { ContextResolutionError } from '../../application/errors.js';
import type { ExecuteSyntheticCommand, ExecuteSyntheticOperation } from '../../application/execute-synthetic-operation.js';
import type { FixtureAuthority } from '../security/fixture-authority.js';
import { createCorrelationIdentifiers } from '../observability/correlation.js';

export interface SyntheticJobEnvelope {
  readonly credentialId: string;
  readonly stationId: string;
  readonly clientCorrelationIdCandidate?: string;
  readonly command: ExecuteSyntheticCommand;
}

export class DeferredJobRunner {
  private accepting = true;
  private readonly pending = new Set<Promise<unknown>>();

  constructor(
    private readonly authority: FixtureAuthority,
    private readonly operation: ExecuteSyntheticOperation,
  ) {}

  run(envelope: SyntheticJobEnvelope): Promise<unknown> {
    if (!this.accepting) return Promise.reject(new ContextResolutionError());
    const task = Promise.resolve().then(async () => {
      const identity = this.authority.authenticate(envelope.credentialId);
      const identifiers = createCorrelationIdentifiers(envelope.clientCorrelationIdCandidate);
      const context = this.authority.resolveContext(
        identity,
        envelope.stationId,
        identifiers.serverCorrelationId,
      );
      return this.operation.execute(context, envelope.command);
    });
    this.pending.add(task);
    void task.then(
      () => this.pending.delete(task),
      () => this.pending.delete(task),
    );
    return task;
  }

  async drainAndStop(): Promise<void> {
    this.accepting = false;
    await Promise.allSettled([...this.pending]);
  }

  get pendingCount(): number {
    return this.pending.size;
  }
}
