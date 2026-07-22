import type { PoolClient, QueryResultRow } from 'pg';
import { ProtectedRecord } from '../../domain/protected-record.js';
import { ApplicationError, PersistenceError, RecordConflictError } from '../../application/errors.js';
import type { OperationalContext } from '../../application/operational-context.js';
import type {
  AuditEvent,
  AuditPort,
  ProtectedRecordRepository,
  TransactionScope,
  UnitOfWork,
} from '../../application/ports.js';
import { PostgresPool } from './postgres-pool.js';

interface ProtectedRecordRow extends QueryResultRow {
  record_id: string;
  tenant_id: string;
  branch_id: string;
  value: string;
  version: number;
}

class PostgresProtectedRecordRepository implements ProtectedRecordRepository {
  constructor(private readonly client: PoolClient) {}

  async findForUpdate(context: OperationalContext, recordId: string): Promise<ProtectedRecord | null> {
    const result = await this.client.query<ProtectedRecordRow>(
      `SELECT record_id, tenant_id, branch_id, value, version
         FROM synthetic_protected_records
        WHERE tenant_id = $1 AND branch_id = $2 AND record_id = $3
        FOR UPDATE`,
      [context.tenantId, context.branchId, recordId],
    );
    const row = result.rows[0];
    return row
      ? ProtectedRecord.rehydrate({
          id: row.record_id,
          tenantId: row.tenant_id,
          branchId: row.branch_id,
          value: row.value,
          version: row.version,
        })
      : null;
  }

  async save(context: OperationalContext, record: ProtectedRecord): Promise<void> {
    const result = await this.client.query(
      `UPDATE synthetic_protected_records
          SET value = $1, version = $2
        WHERE tenant_id = $3 AND branch_id = $4 AND record_id = $5 AND version = $6`,
      [record.value, record.version, context.tenantId, context.branchId, record.id, record.version - 1],
    );
    if (result.rowCount !== 1) throw new RecordConflictError();
  }
}

export class PostgresUnitOfWork implements UnitOfWork {
  constructor(private readonly pool: PostgresPool) {}

  async execute<T>(
    _context: OperationalContext,
    work: (scope: TransactionScope) => Promise<T>,
  ): Promise<T> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const result = await work({
        protectedRecords: new PostgresProtectedRecordRepository(client),
      });
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      if (error instanceof ApplicationError || error instanceof Error && error.name === 'DomainValidationError') {
        throw error;
      }
      throw new PersistenceError();
    } finally {
      client.release();
    }
  }
}

export class PostgresAuditAdapter implements AuditPort {
  constructor(private readonly pool: PostgresPool) {}

  async record(event: AuditEvent): Promise<void> {
    try {
      await this.pool.query(
        `INSERT INTO synthetic_audit_events
          (actor_id, tenant_id, branch_id, session_id, correlation_id, operation, resource_id, control, result)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [
          event.actorId,
          event.tenantId,
          event.branchId,
          event.sessionId,
          event.serverCorrelationId,
          event.operation,
          event.resourceId,
          event.control,
          event.result,
        ],
      );
    } catch {
      throw new PersistenceError();
    }
  }
}
