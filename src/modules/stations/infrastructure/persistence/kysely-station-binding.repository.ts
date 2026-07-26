import type { Kysely, Transaction } from 'kysely';

import type { DatabaseConnection } from '../../../../infrastructure/database/database-connection.js';
import {
  useDatabasePersistenceExecutor,
  useTransactionalDatabasePersistenceExecutor,
} from '../../../../infrastructure/database/database-persistence-capability.js';
import type {
  InternalDatabasePersistenceExecutor,
  InternalDatabasePersistenceOperation,
} from '../../../../infrastructure/database/database-persistence-capability.js';
import type {
  DatabaseSchema,
  StationBindingRow,
} from '../../../../infrastructure/database/database-types.js';
import type { DatabaseTransactionContext } from '../../../../infrastructure/database/transaction-runner.js';
import { parseBranchId, parseTenantId } from '../../../tenancy/index.js';
import { parseStationId, parseStationRevision } from '../../domain/station.js';
import { StationPersistenceError } from '../../application/ports/station-persistence.error.js';
import type {
  CreateStationBindingRecord,
  StationBindingRecord,
  StationBindingRepositoryPort,
  StationBindingScope,
} from '../../application/ports/station-binding-repository.port.js';

type BindingExecutor = InternalDatabasePersistenceExecutor<'stations'>;

type ExecuteBindingOperation = <Result>(
  operation: InternalDatabasePersistenceOperation<'stations', Result>,
) => Promise<Result>;

function driverCode(error: unknown): string {
  if (typeof error !== 'object' || error === null) {
    return '';
  }
  const value = (error as Readonly<Record<string, unknown>>).code;
  return typeof value === 'string' ? value : '';
}

function mapError(error: unknown): StationPersistenceError {
  if (error instanceof StationPersistenceError) {
    return error;
  }
  const code = driverCode(error);
  if (code === '23505') {
    return new StationPersistenceError('STATION_PERSISTENCE_CONFLICT');
  }
  if (code === '23503') {
    return new StationPersistenceError(
      'STATION_PERSISTENCE_REFERENCE_NOT_FOUND',
    );
  }
  if (code === '23502' || code === '23514' || code === '22P02') {
    return new StationPersistenceError(
      'STATION_PERSISTENCE_INVARIANT_BROKEN',
    );
  }
  return new StationPersistenceError(
    'STATION_PERSISTENCE_FAILED',
    code === '40001' || code === '40P01' || code === '57014'
      ? 'conditional'
      : 'never',
  );
}

function scope(input: StationBindingScope): StationBindingScope {
  try {
    return Object.freeze({
      tenantId: parseTenantId(input?.tenantId),
      stationId: parseStationId(input?.stationId),
    });
  } catch {
    throw new StationPersistenceError(
      'PERSISTENCE_BINDING_SCOPE_REQUIRED',
    );
  }
}

function instant(value: string): Date {
  const parsed = new Date(value);
  if (!Number.isFinite(parsed.getTime()) || parsed.toISOString() !== value) {
    throw new StationPersistenceError(
      'STATION_PERSISTENCE_INVARIANT_BROKEN',
    );
  }
  return parsed;
}

function mapBinding(row: StationBindingRow): StationBindingRecord {
  return Object.freeze({
    tenantId: parseTenantId(row.tenant_id),
    stationId: parseStationId(row.station_id),
    bindingRevision: parseStationRevision(row.binding_revision),
    branchId: parseBranchId(row.branch_id),
    linkedAt: row.linked_at.toISOString(),
    unlinkedAt: row.unlinked_at?.toISOString() ?? null,
  });
}

class KyselyStationBindingRepository
implements StationBindingRepositoryPort {
  constructor(private readonly execute: ExecuteBindingOperation) {}

  async createOpenBinding(
    inputScope: StationBindingScope,
    record: CreateStationBindingRecord,
  ): Promise<StationBindingRecord> {
    const validated = scope(inputScope);
    if (
      record.tenantId !== validated.tenantId ||
      record.stationId !== validated.stationId ||
      record.unlinkedAt !== null
    ) {
      throw new StationPersistenceError(
        'PERSISTENCE_BINDING_SCOPE_REQUIRED',
      );
    }
    try {
      return await this.execute(async (executor: BindingExecutor) => {
        const row = await executor
          .insertInto('station_bindings')
          .values({
            tenant_id: validated.tenantId,
            station_id: validated.stationId,
            binding_revision: parseStationRevision(
              record.bindingRevision,
            ),
            branch_id: parseBranchId(record.branchId),
            linked_at: instant(record.linkedAt),
            unlinked_at: null,
          })
          .returningAll()
          .executeTakeFirstOrThrow();
        return mapBinding(row);
      });
    } catch (error: unknown) {
      throw mapError(error);
    }
  }

  async findOpenBinding(
    inputScope: StationBindingScope,
  ): Promise<StationBindingRecord | null> {
    return this.selectOpenBinding(inputScope, false);
  }

  async lockOpenBinding(
    inputScope: StationBindingScope,
  ): Promise<StationBindingRecord | null> {
    return this.selectOpenBinding(inputScope, true);
  }

  private async selectOpenBinding(
    inputScope: StationBindingScope,
    forUpdate: boolean,
  ): Promise<StationBindingRecord | null> {
    const validated = scope(inputScope);
    try {
      return await this.execute(async (executor: BindingExecutor) => {
        let query = executor
          .selectFrom('station_bindings')
          .selectAll()
          .where('tenant_id', '=', validated.tenantId)
          .where('station_id', '=', validated.stationId)
          .where('unlinked_at', 'is', null);
        if (forUpdate) {
          query = query.forUpdate();
        }
        const rows = await query.limit(2).execute();
        if (rows.length > 1) {
          throw new StationPersistenceError(
            'STATION_PERSISTENCE_INVARIANT_BROKEN',
          );
        }
        return rows[0] ? mapBinding(rows[0]) : null;
      });
    } catch (error: unknown) {
      throw mapError(error);
    }
  }

  async closeOpenBinding(
    inputScope: StationBindingScope,
    bindingRevision: StationBindingRecord['bindingRevision'],
    unlinkedAt: string,
  ): Promise<StationBindingRecord | null> {
    const validated = scope(inputScope);
    try {
      return await this.execute(async (executor: BindingExecutor) => {
        const row = await executor
          .updateTable('station_bindings')
          .set({ unlinked_at: instant(unlinkedAt) })
          .where('tenant_id', '=', validated.tenantId)
          .where('station_id', '=', validated.stationId)
          .where(
            'binding_revision',
            '=',
            parseStationRevision(bindingRevision),
          )
          .where('unlinked_at', 'is', null)
          .returningAll()
          .executeTakeFirst();
        return row ? mapBinding(row) : null;
      });
    } catch (error: unknown) {
      throw mapError(error);
    }
  }

  async listBindings(
    inputScope: StationBindingScope,
  ): Promise<readonly StationBindingRecord[]> {
    const validated = scope(inputScope);
    try {
      return await this.execute(async (executor: BindingExecutor) => {
        const rows = await executor
          .selectFrom('station_bindings')
          .selectAll()
          .where('tenant_id', '=', validated.tenantId)
          .where('station_id', '=', validated.stationId)
          .orderBy('binding_revision', 'asc')
          .execute();
        return Object.freeze(rows.map(mapBinding));
      });
    } catch (error: unknown) {
      throw mapError(error);
    }
  }
}

export function createKyselyStationBindingRepository(
  connection: DatabaseConnection,
): StationBindingRepositoryPort {
  return new KyselyStationBindingRepository((operation) =>
    useDatabasePersistenceExecutor(connection, 'stations', operation),
  );
}

export function createTransactionalKyselyStationBindingRepository(
  context: DatabaseTransactionContext,
): StationBindingRepositoryPort {
  return new KyselyStationBindingRepository((operation) =>
    useTransactionalDatabasePersistenceExecutor(
      context,
      'stations',
      operation,
    ),
  );
}

export type KyselyStationBindingRepositoryFactory =
  typeof createKyselyStationBindingRepository;
