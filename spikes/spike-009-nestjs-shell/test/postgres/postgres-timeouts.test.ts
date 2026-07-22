import assert from 'node:assert/strict';
import net from 'node:net';
import { after, before, describe, it } from 'node:test';
import type { Socket } from 'node:net';
import { createSpikeApplication } from '../../src/bootstrap/create-application.js';
import {
  classifyPostgresError,
  PostgresOperationalError,
  PostgresPool,
  type PostgresTimeouts,
} from '../../src/synthetic/infrastructure/postgres/postgres-pool.js';
import { capturedOperationalLogger, databaseUrl, listen, resetDatabase } from '../support.js';

const timeouts: PostgresTimeouts = {
  connectionTimeoutMs: 200,
  statementTimeoutMs: 250,
  lockTimeoutMs: 150,
  idleTimeoutMs: 500,
  idleTransactionTimeoutMs: 750,
};

describe('bounded PostgreSQL dependency behavior', () => {
  let pool: PostgresPool;

  before(async () => {
    pool = new PostgresPool(databaseUrl, timeouts);
    await resetDatabase(pool);
  });

  after(async () => {
    await pool.close();
  });

  it('applies configurable connection, statement, lock, idle and transaction timeouts', async () => {
    const result = await pool.query<{
      statement_timeout: string;
      lock_timeout: string;
      idle_in_transaction_session_timeout: string;
    }>(`SELECT current_setting('statement_timeout') AS statement_timeout,
              current_setting('lock_timeout') AS lock_timeout,
              current_setting('idle_in_transaction_session_timeout') AS idle_in_transaction_session_timeout`);
    assert.deepEqual(result.rows, [{
      statement_timeout: '250ms',
      lock_timeout: '150ms',
      idle_in_transaction_session_timeout: '750ms',
    }]);
    assert.equal(pool.timeouts.connectionTimeoutMs, 200);
    assert.equal(pool.timeouts.idleTimeoutMs, 500);
  });

  it('fails a silent TCP dependency within the configured connection timeout', {
    timeout: 2_000,
  }, async () => {
    const sockets = new Set<Socket>();
    const server = net.createServer((socket) => {
      sockets.add(socket);
      socket.on('close', () => sockets.delete(socket));
    });
    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
    const address = server.address();
    if (address === null || typeof address === 'string') assert.fail('Expected TCP server address');
    const silentPool = new PostgresPool(
      `postgresql://postgres@127.0.0.1:${address.port}/spike009`,
      timeouts,
    );
    const started = performance.now();
    try {
      await assert.rejects(silentPool.connect(), (error: unknown) =>
        error instanceof PostgresOperationalError && error.reason === 'connection_timeout');
      assert.ok(performance.now() - started < 1_500);
    } finally {
      await silentPool.close();
      for (const socket of sockets) socket.destroy();
      await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
    }
  });

  it('rolls back after statement timeout and keeps the pool reusable', async () => {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      let failure: unknown;
      try {
        await client.query('SELECT pg_sleep(2)');
      } catch (error) {
        failure = error;
      }
      assert.equal(classifyPostgresError(failure).reason, 'statement_timeout');
      await client.query('ROLLBACK');
    } finally {
      client.release();
    }
    assert.equal(await pool.ping(), true);
  });

  it('times out a controlled row lock, rolls back and leaves no residual lock', async () => {
    const owner = await pool.connect();
    const waiter = await pool.connect();
    try {
      await owner.query('BEGIN');
      await waiter.query('BEGIN');
      await owner.query(
        'SELECT record_id FROM synthetic_protected_records WHERE tenant_id = $1 AND record_id = $2 FOR UPDATE',
        ['tenant-a', 'record-shared'],
      );
      let failure: unknown;
      try {
        await waiter.query(
          'UPDATE synthetic_protected_records SET value = $1 WHERE tenant_id = $2 AND record_id = $3',
          ['must-not-commit', 'tenant-a', 'record-shared'],
        );
      } catch (error) {
        failure = error;
      }
      assert.equal(classifyPostgresError(failure).reason, 'lock_timeout');
      await waiter.query('ROLLBACK');
      await owner.query('ROLLBACK');
    } finally {
      waiter.release();
      owner.release();
    }
    const value = await pool.query<{ value: string }>(
      'SELECT value FROM synthetic_protected_records WHERE tenant_id = $1 AND record_id = $2',
      ['tenant-a', 'record-shared'],
    );
    assert.equal(value.rows[0]?.value, 'tenant-a-initial');
    assert.equal(await pool.ping(), true);
  });
});

describe('health when PostgreSQL refuses connections', () => {
  it('keeps liveness, returns sanitized 503 readiness and emits an operational signal', async () => {
    const reserved = net.createServer();
    await new Promise<void>((resolve) => reserved.listen(0, '127.0.0.1', resolve));
    const address = reserved.address();
    if (address === null || typeof address === 'string') assert.fail('Expected TCP server address');
    const port = address.port;
    await new Promise<void>((resolve, reject) => reserved.close((error) => error ? reject(error) : resolve()));

    const captured = capturedOperationalLogger();
    const app = await createSpikeApplication(
      `postgresql://postgres:synthetic-secret@127.0.0.1:${port}/missing`,
      { logger: captured.logger, postgresTimeouts: timeouts },
    );
    const baseUrl = await listen(app);
    try {
      const live = await fetch(`${baseUrl}/health/live`);
      const ready = await fetch(`${baseUrl}/health/ready`);
      assert.equal(live.status, 200);
      assert.equal(ready.status, 503);
      assert.deepEqual(await ready.json(), {
        error: 'SERVICE_UNAVAILABLE', message: 'Service is not ready.',
      });
      assert.equal(captured.records.some((record) =>
        record.event === 'dependency.postgres.unavailable' && record.level === 'warn'), true);
      assert.doesNotMatch(captured.serialized.join('\n'), /synthetic-secret|postgresql:\/\/|127\.0\.0\.1/);
    } finally {
      await app.close();
    }
  });
});
