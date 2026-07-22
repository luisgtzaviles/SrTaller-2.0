export type OperationalLogLevel = 'info' | 'warn' | 'error';

export interface OperationalLogRecord {
  readonly timestamp: string;
  readonly level: OperationalLogLevel;
  readonly event: string;
  readonly serverCorrelationId?: string;
  readonly clientCorrelationIdCandidate?: string;
  readonly errorName?: string;
  readonly durationMs?: number;
}

export type OperationalLogSink = (serialized: string, record: OperationalLogRecord) => void;
export type OperationalLogListener = (record: OperationalLogRecord) => void;

const defaultSink: OperationalLogSink = (serialized) => {
  process.stderr.write(`${serialized}\n`);
};

export class OperationalLogger {
  private readonly listeners = new Set<OperationalLogListener>();

  constructor(
    private readonly sink: OperationalLogSink = defaultSink,
    private readonly now: () => Date = () => new Date(),
  ) {}

  info(event: string, fields: Omit<OperationalLogRecord, 'timestamp' | 'level' | 'event'> = {}): void {
    this.write('info', event, fields);
  }

  warn(event: string, fields: Omit<OperationalLogRecord, 'timestamp' | 'level' | 'event'> = {}): void {
    this.write('warn', event, fields);
  }

  error(event: string, fields: Omit<OperationalLogRecord, 'timestamp' | 'level' | 'event'> = {}): void {
    this.write('error', event, fields);
  }

  subscribe(listener: OperationalLogListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private write(
    level: OperationalLogLevel,
    event: string,
    fields: Omit<OperationalLogRecord, 'timestamp' | 'level' | 'event'>,
  ): void {
    const record = Object.freeze({
      timestamp: this.now().toISOString(),
      level,
      event,
      ...fields,
    });
    this.sink(JSON.stringify(record), record);
    for (const listener of this.listeners) listener(record);
  }
}
