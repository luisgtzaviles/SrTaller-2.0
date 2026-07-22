import { Pool, type PoolClient } from 'pg';

export interface PostgresTimeouts {
  readonly connectionTimeoutMs: number;
  readonly statementTimeoutMs: number;
  readonly lockTimeoutMs: number;
  readonly idleTimeoutMs: number;
  readonly idleTransactionTimeoutMs: number;
}

export type PostgresFailureReason =
  | 'connection_timeout'
  | 'statement_timeout'
  | 'lock_timeout'
  | 'unavailable'
  | 'query_failed';

export class PostgresOperationalError extends Error {
  constructor(readonly reason: PostgresFailureReason) {
    super('PostgreSQL operation failed.');
    this.name = 'PostgresOperationalError';
  }
}

const positiveInteger = (value: string | undefined, fallback: number): number => {
  if (!value) return fallback;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : fallback;
};

export function postgresTimeoutsFromEnvironment(
  environment: Readonly<Record<string, string | undefined>> = process.env,
): PostgresTimeouts {
  return Object.freeze({
    connectionTimeoutMs: positiveInteger(environment.SPIKE_PG_CONNECTION_TIMEOUT_MS, 750),
    statementTimeoutMs: positiveInteger(environment.SPIKE_PG_STATEMENT_TIMEOUT_MS, 750),
    lockTimeoutMs: positiveInteger(environment.SPIKE_PG_LOCK_TIMEOUT_MS, 300),
    idleTimeoutMs: positiveInteger(environment.SPIKE_PG_IDLE_TIMEOUT_MS, 1_000),
    idleTransactionTimeoutMs: positiveInteger(environment.SPIKE_PG_IDLE_TRANSACTION_TIMEOUT_MS, 1_500),
  });
}

export function classifyPostgresError(error: unknown): PostgresOperationalError {
  const code = typeof error === 'object' && error !== null && 'code' in error
    ? String(error.code)
    : '';
  const message = error instanceof Error ? error.message : '';
  if (code === '57014') return new PostgresOperationalError('statement_timeout');
  if (code === '55P03') return new PostgresOperationalError('lock_timeout');
  if (code === 'ETIMEDOUT' || /timeout/i.test(message)) {
    return new PostgresOperationalError('connection_timeout');
  }
  if (['ECONNREFUSED', 'ENOTFOUND', 'EHOSTUNREACH'].includes(code)) {
    return new PostgresOperationalError('unavailable');
  }
  return new PostgresOperationalError('query_failed');
}

export interface DatabaseResult<T> {
  readonly rows: T[];
  readonly rowCount: number | null;
}

export class PostgresPool {
  private readonly pool: Pool;
  private closed = false;

  constructor(
    connectionString: string,
    readonly timeouts: PostgresTimeouts = postgresTimeoutsFromEnvironment(),
  ) {
    this.pool = new Pool({
      connectionString,
      max: 8,
      connectionTimeoutMillis: timeouts.connectionTimeoutMs,
      idleTimeoutMillis: timeouts.idleTimeoutMs,
      options: [
        `-c statement_timeout=${timeouts.statementTimeoutMs}`,
        `-c lock_timeout=${timeouts.lockTimeoutMs}`,
        `-c idle_in_transaction_session_timeout=${timeouts.idleTransactionTimeoutMs}`,
      ].join(' '),
    });
  }

  async connect(): Promise<PoolClient> {
    try {
      return await this.pool.connect();
    } catch (error) {
      throw classifyPostgresError(error);
    }
  }

  async query<T = Record<string, unknown>>(
    text: string,
    values: readonly unknown[] = [],
  ): Promise<DatabaseResult<T>> {
    try {
      return await this.pool.query(text, [...values]) as unknown as DatabaseResult<T>;
    } catch (error) {
      throw classifyPostgresError(error);
    }
  }

  async ping(): Promise<boolean> {
    try {
      await this.pool.query('SELECT 1');
      return true;
    } catch {
      return false;
    }
  }

  async close(): Promise<void> {
    if (this.closed) return;
    await this.pool.end();
    this.closed = true;
  }

  get isClosed(): boolean {
    return this.closed;
  }
}
