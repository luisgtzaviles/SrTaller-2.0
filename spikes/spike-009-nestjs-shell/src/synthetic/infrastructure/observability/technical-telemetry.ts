import { AsyncLocalStorage } from 'node:async_hooks';

export interface TechnicalSignal {
  readonly serverCorrelationId: string;
  readonly clientCorrelationIdCandidate?: string;
  readonly name: string;
  readonly durationMs?: number;
}

export class TechnicalTelemetry {
  private readonly correlation = new AsyncLocalStorage<string>();
  private readonly collected: TechnicalSignal[] = [];

  run<T>(serverCorrelationId: string, callback: () => T): T {
    return this.correlation.run(serverCorrelationId, callback);
  }

  currentCorrelationId(): string | undefined {
    return this.correlation.getStore();
  }

  record(signal: TechnicalSignal): void {
    this.collected.push(Object.freeze({ ...signal }));
  }

  signals(): readonly TechnicalSignal[] {
    return Object.freeze([...this.collected]);
  }
}
