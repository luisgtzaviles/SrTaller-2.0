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
  StationRow,
} from '../../../../infrastructure/database/database-types.js';
import type { DatabaseTransactionContext } from '../../../../infrastructure/database/transaction-runner.js';
import { parseTenantId } from '../../../tenancy/index.js';
import {
  hydrateStation,
  parseStationId,
  parseStationRevision,
} from '../../domain/station.js';
import type { Station } from '../../domain/station.js';
import { StationPersistenceError } from '../../application/ports/station-persistence.error.js';
import type {
  CreateStationRecord,
  StationPersistenceScope,
  StationRepositoryPort,
  StationTransitionRecord,
} from '../../application/ports/station-repository.port.js';
import {
  translateStationPostgresqlError,
} from './station-postgresql-error.js';

type StationExecutor = InternalDatabasePersistenceExecutor<'stations'>;

type ExecuteStationOperation = <Result>(
  operation: InternalDatabasePersistenceOperation<'stations', Result>,
) => Promise<Result>;

function scope(input: StationPersistenceScope): StationPersistenceScope {
  try {
    return Object.freeze({
      tenantId: parseTenantId(input?.tenantId),
      stationId: parseStationId(input?.stationId),
    });
  } catch {
    throw new StationPersistenceError(
      'PERSISTENCE_STATION_SCOPE_REQUIRED',
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

function mapStation(row: StationRow): Station {
  return hydrateStation({
    tenantId: parseTenantId(row.tenant_id),
    stationId: parseStationId(row.station_id),
    status: row.status,
    revision: parseStationRevision(row.revision),
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
    revokedAt: row.revoked_at?.toISOString() ?? null,
  });
}

class KyselyStationRepository implements StationRepositoryPort {
  constructor(private readonly execute: ExecuteStationOperation) {}

  async createStation(
    inputScope: StationPersistenceScope,
    record: CreateStationRecord,
  ): Promise<Station> {
    const validated = scope(inputScope);
    if (
      record.tenantId !== validated.tenantId ||
      record.stationId !== validated.stationId
    ) {
      throw new StationPersistenceError(
        'PERSISTENCE_STATION_SCOPE_REQUIRED',
      );
    }
    const station = hydrateStation(record);
    try {
      return await this.execute(async (executor: StationExecutor) => {
        const row = await executor
          .insertInto('stations')
          .values({
            tenant_id: station.tenantId,
            station_id: station.stationId,
            status: station.status,
            revision: station.revision,
            created_at: instant(station.createdAt),
            updated_at: instant(station.updatedAt),
            revoked_at:
              station.revokedAt === null ? null : instant(station.revokedAt),
          })
          .returningAll()
          .executeTakeFirstOrThrow();
        return mapStation(row);
      });
    } catch (error: unknown) {
      throw translateStationPostgresqlError(error, 'create-station');
    }
  }

  async findStation(
    inputScope: StationPersistenceScope,
  ): Promise<Station | null> {
    return this.selectStation(inputScope, false);
  }

  async lockStation(
    inputScope: StationPersistenceScope,
  ): Promise<Station | null> {
    return this.selectStation(inputScope, true);
  }

  private async selectStation(
    inputScope: StationPersistenceScope,
    forUpdate: boolean,
  ): Promise<Station | null> {
    const validated = scope(inputScope);
    try {
      return await this.execute(async (executor: StationExecutor) => {
        let query = executor
          .selectFrom('stations')
          .selectAll()
          .where('tenant_id', '=', validated.tenantId)
          .where('station_id', '=', validated.stationId);
        if (forUpdate) {
          query = query.forUpdate();
        }
        const row = await query.executeTakeFirst();
        return row ? mapStation(row) : null;
      });
    } catch (error: unknown) {
      throw translateStationPostgresqlError(
        error,
        forUpdate ? 'lock-station' : 'find-station',
      );
    }
  }

  async transitionStation(
    inputScope: StationPersistenceScope,
    record: StationTransitionRecord,
  ): Promise<Station | null> {
    const validated = scope(inputScope);
    try {
      parseStationRevision(record.expectedRevision);
      parseStationRevision(record.nextRevision);
      return await this.execute(async (executor: StationExecutor) => {
        const row = await executor
          .updateTable('stations')
          .set({
            status: record.nextStatus,
            revision: record.nextRevision,
            updated_at: instant(record.updatedAt),
            revoked_at:
              record.revokedAt === null ? null : instant(record.revokedAt),
          })
          .where('tenant_id', '=', validated.tenantId)
          .where('station_id', '=', validated.stationId)
          .where('revision', '=', record.expectedRevision)
          .where('status', '=', record.expectedStatus)
          .returningAll()
          .executeTakeFirst();
        return row ? mapStation(row) : null;
      });
    } catch (error: unknown) {
      throw translateStationPostgresqlError(error, 'transition-station');
    }
  }
}

export function createKyselyStationRepository(
  connection: DatabaseConnection,
): StationRepositoryPort {
  return new KyselyStationRepository((operation) =>
    useDatabasePersistenceExecutor(connection, 'stations', operation),
  );
}

export function createTransactionalKyselyStationRepository(
  context: DatabaseTransactionContext,
): StationRepositoryPort {
  return new KyselyStationRepository((operation) =>
    useTransactionalDatabasePersistenceExecutor(
      context,
      'stations',
      operation,
    ),
  );
}

export type KyselyStationRepositoryFactory =
  typeof createKyselyStationRepository;
