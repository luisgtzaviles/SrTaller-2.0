import { readFile } from 'node:fs/promises';
import type { INestApplication } from '@nestjs/common';
import { createSpikeApplication } from '../src/bootstrap/create-application.js';
import { TOKENS } from '../src/bootstrap/tokens.js';
import type { DeferredJobRunner } from '../src/synthetic/infrastructure/jobs/deferred-job-runner.js';
import type { PostgresPool } from '../src/synthetic/infrastructure/postgres/postgres-pool.js';
import type { FixtureAuthority } from '../src/synthetic/infrastructure/security/fixture-authority.js';
import {
  OperationalLogger,
  type OperationalLogRecord,
} from '../src/synthetic/infrastructure/observability/operational-logger.js';

export const databaseUrl =
  process.env.SPIKE_DATABASE_URL ?? 'postgresql://postgres@127.0.0.1:55439/spike009';

export async function resetDatabase(pool: PostgresPool): Promise<void> {
  const schema = await readFile(
    new URL('../src/synthetic/infrastructure/postgres/schema.sql', import.meta.url),
    'utf8',
  );
  await pool.query(schema);
}

export async function createTestApplication(options: {
  readonly logger?: OperationalLogger;
} = {}): Promise<{
  readonly app: INestApplication;
  readonly pool: PostgresPool;
  readonly authority: FixtureAuthority;
  readonly jobs: DeferredJobRunner;
  readonly logger: OperationalLogger;
}> {
  const logger = options.logger ?? new OperationalLogger(() => undefined);
  const app = await createSpikeApplication(databaseUrl, { logger });
  const pool = app.get<PostgresPool>(TOKENS.pool);
  const authority = app.get<FixtureAuthority>(TOKENS.authority);
  const jobs = app.get<DeferredJobRunner>(TOKENS.jobs);
  await resetDatabase(pool);
  return { app, pool, authority, jobs, logger };
}

export function capturedOperationalLogger(): {
  readonly logger: OperationalLogger;
  readonly records: OperationalLogRecord[];
  readonly serialized: string[];
} {
  const records: OperationalLogRecord[] = [];
  const serialized: string[] = [];
  const logger = new OperationalLogger((line, record) => {
    serialized.push(line);
    records.push(record);
  }, () => new Date('2026-07-22T00:00:00.000Z'));
  return { logger, records, serialized };
}

export async function listen(app: INestApplication): Promise<string> {
  await app.listen(0, '127.0.0.1');
  return app.getUrl();
}

export async function postSynthetic(
  baseUrl: string,
  input: {
    readonly credential?: string;
    readonly station?: string;
    readonly recordId?: string;
    readonly clientCorrelationIdCandidate?: string;
    readonly body?: unknown;
  },
): Promise<{
  readonly status: number;
  readonly body: Record<string, unknown>;
  readonly serverCorrelationId: string | null;
}> {
  const headers: Record<string, string> = { 'content-type': 'application/json' };
  if (input.credential) headers['x-spike-credential'] = input.credential;
  if (input.station) headers['x-spike-station'] = input.station;
  if (input.clientCorrelationIdCandidate) {
    headers['x-correlation-id'] = input.clientCorrelationIdCandidate;
  }
  const response = await fetch(`${baseUrl}/synthetic/records/${input.recordId ?? 'record-shared'}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(input.body ?? { nextValue: 'updated-value' }),
  });
  return {
    status: response.status,
    body: (await response.json()) as Record<string, unknown>,
    serverCorrelationId: response.headers.get('x-correlation-id'),
  };
}
