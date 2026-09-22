import { randomUUID } from 'node:crypto';

import type { DatabaseConnection } from '../../../../infrastructure/database/database-connection.js';
import {
  useDatabasePersistenceExecutor,
  useTransactionalDatabasePersistenceExecutor,
} from '../../../../infrastructure/database/database-persistence-capability.js';
import type {
  InternalDatabasePersistenceExecutor,
  InternalDatabasePersistenceOperation,
} from '../../../../infrastructure/database/database-persistence-capability.js';
import type { TenantRow } from '../../../../infrastructure/database/database-types.js';
import type { DatabaseTransactionContext } from '../../../../infrastructure/database/transaction-runner.js';
import { parseTenantId } from '../../index.js';
import {
  TenantPersistenceError,
} from '../../application/ports/tenant-repository.port.js';
import type {
  CreateTenantRecord,
  TenantPersistenceScope,
  TenantRecord,
  TenantRepositoryPort,
} from '../../application/ports/tenant-repository.port.js';

type TenantExecutor = InternalDatabasePersistenceExecutor<'tenancy'>;

type ExecuteTenantOperation = <Result>(
  operation: InternalDatabasePersistenceOperation<'tenancy', Result>,
) => Promise<Result>;

type DriverErrorShape = Readonly<{ code: string }>;

function driverErrorShape(error: unknown): DriverErrorShape {
  if (typeof error !== 'object' || error === null) {
    return Object.freeze({ code: '' });
  }
  const candidate = error as Readonly<Record<string, unknown>>;
  return Object.freeze({
    code: typeof candidate.code === 'string' ? candidate.code : '',
  });
}

function mapTenantError(error: unknown): TenantPersistenceError {
  if (error instanceof TenantPersistenceError) {
    return error;
  }
  const { code } = driverErrorShape(error);
  if (code === '23505') {
    return new TenantPersistenceError('TENANT_PERSISTENCE_CONFLICT');
  }
  if (code === '23502' || code === '22P02') {
    return new TenantPersistenceError('PERSISTENCE_TENANT_SCOPE_REQUIRED');
  }
  return new TenantPersistenceError(
    'TENANT_PERSISTENCE_FAILED',
    code === '40001' || code === '40P01' || code === '57014'
      ? 'conditional'
      : 'never',
  );
}

function validInstant(value: unknown): value is string {
  if (typeof value !== 'string') {
    return false;
  }
  const instant = new Date(value);
  return (
    Number.isFinite(instant.getTime()) &&
    instant.toISOString() === value
  );
}

function validateScope(
  scope: TenantPersistenceScope,
): TenantPersistenceScope {
  try {
    const tenantId = parseTenantId(scope?.tenantId);
    return Object.freeze({ tenantId });
  } catch {
    throw new TenantPersistenceError('PERSISTENCE_TENANT_SCOPE_REQUIRED');
  }
}

function validateCreateRecord(
  scope: TenantPersistenceScope,
  record: CreateTenantRecord,
): Readonly<{ tenantId: TenantPersistenceScope['tenantId']; displayName: string; lifecycleStatus: 'ONBOARDING' | 'ACTIVE'; operatingCurrency: string; createdAt: Date }> {
  if (
    typeof record !== 'object' ||
    record === null ||
    record.tenantId !== scope.tenantId ||
    typeof record.displayName !== 'string' ||
    record.displayName.length === 0 ||
    record.displayName.length > 160 ||
    record.displayName !== record.displayName.trim() ||
    (record.lifecycleStatus !== 'ONBOARDING' && record.lifecycleStatus !== 'ACTIVE') ||
    !validInstant(record.createdAt) ||
    typeof record.operatingCurrency !== 'string' ||
    !/^[A-Z]{3}$/u.test(record.operatingCurrency)
  ) {
    throw new TenantPersistenceError('PERSISTENCE_TENANT_SCOPE_REQUIRED');
  }
  return Object.freeze({
    tenantId: scope.tenantId,
    displayName: record.displayName,
    lifecycleStatus: record.lifecycleStatus,
    operatingCurrency: record.operatingCurrency,
    createdAt: new Date(record.createdAt),
  });
}

function mapTenantRecord(row: TenantRow): TenantRecord {
  return Object.freeze({
    tenantId: parseTenantId(row.tenant_id),
    displayName: row.display_name,
    lifecycleStatus: row.lifecycle_status,
    operatingCurrency: row.operating_currency,
    version: row.version,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  });
}

class KyselyTenantRepository implements TenantRepositoryPort {
  constructor(readonly execute: ExecuteTenantOperation) {}

  async createTenant(
    scope: TenantPersistenceScope,
    record: CreateTenantRecord,
  ): Promise<TenantRecord> {
    const validatedScope = validateScope(scope);
    const validatedRecord = validateCreateRecord(validatedScope, record);
    try {
      return await this.execute(async (executor: TenantExecutor) => {
        const row = await executor
          .insertInto('tenants')
          .values({
            tenant_id: validatedRecord.tenantId,
            display_name: validatedRecord.displayName,
            lifecycle_status: validatedRecord.lifecycleStatus,
            operating_currency: validatedRecord.operatingCurrency,
            created_at: validatedRecord.createdAt,
            updated_at: validatedRecord.createdAt,
          })
          .returning([
            'tenant_id',
            'display_name',
            'lifecycle_status',
            'operating_currency',
            'version',
            'created_at',
            'updated_at',
          ])
          .executeTakeFirstOrThrow();
        return mapTenantRecord(row);
      });
    } catch (error: unknown) {
      throw mapTenantError(error);
    }
  }

  async findTenantById(
    scope: TenantPersistenceScope,
  ): Promise<TenantRecord | null> {
    const validatedScope = validateScope(scope);
    try {
      return await this.execute(async (executor: TenantExecutor) => {
        const row = await executor
          .selectFrom('tenants')
          .selectAll()
          .where('tenant_id', '=', validatedScope.tenantId)
          .executeTakeFirst();
        return row ? mapTenantRecord(row) : null;
      });
    } catch (error: unknown) {
      throw mapTenantError(error);
    }
  }

  async existsTenant(scope: TenantPersistenceScope): Promise<boolean> {
    const validatedScope = validateScope(scope);
    try {
      return await this.execute(async (executor: TenantExecutor) => {
        const row = await executor
          .selectFrom('tenants')
          .select('tenant_id')
          .where('tenant_id', '=', validatedScope.tenantId)
          .executeTakeFirst();
        return row !== undefined;
      });
    } catch (error: unknown) {
      throw mapTenantError(error);
    }
  }

  async readOperatingCurrency(scope: TenantPersistenceScope): Promise<string | null> {
    const validatedScope = validateScope(scope);
    try {
      const row = await this.execute((executor: TenantExecutor) => executor
        .selectFrom('tenants')
        .select('operating_currency')
        .where('tenant_id', '=', validatedScope.tenantId)
        .executeTakeFirst());
      return row?.operating_currency ?? null;
    } catch (error: unknown) {
      throw mapTenantError(error);
    }
  }

  async lockTenant(scope: TenantPersistenceScope): Promise<TenantRecord> {
    const validatedScope = validateScope(scope);
    try {
      return await this.execute(async (executor: TenantExecutor) => {
        const row = await executor.selectFrom('tenants').selectAll()
          .where('tenant_id', '=', validatedScope.tenantId).forUpdate().executeTakeFirst();
        if (!row) throw new TenantPersistenceError('TENANT_PERSISTENCE_NOT_FOUND');
        return mapTenantRecord(row);
      });
    } catch (error: unknown) { throw mapTenantError(error); }
  }

  async activateTenant(scope: TenantPersistenceScope, input: Readonly<{ actorUserId: string; adminSessionId: string; correlationId: string; occurredAt: string }>): Promise<TenantRecord> {
    const validatedScope = validateScope(scope);
    if (!validInstant(input.occurredAt)) throw new TenantPersistenceError('TENANT_PERSISTENCE_FAILED');
    try {
      return await this.execute(async (executor: TenantExecutor) => {
        const current = await executor.selectFrom('tenants').selectAll().where('tenant_id', '=', validatedScope.tenantId).forUpdate().executeTakeFirst();
        if (!current) throw new TenantPersistenceError('TENANT_PERSISTENCE_NOT_FOUND');
        if (current.lifecycle_status === 'ACTIVE') return mapTenantRecord(current);
        const occurredAt = new Date(input.occurredAt);
        const updated = await executor.updateTable('tenants').set({ lifecycle_status: 'ACTIVE', version: current.version + 1, updated_at: occurredAt })
          .where('tenant_id', '=', validatedScope.tenantId).where('version', '=', current.version).returningAll().executeTakeFirstOrThrow();
        await executor.insertInto('tenant_lifecycle_events').values({ event_id: randomUUID(), tenant_id: validatedScope.tenantId, actor_user_id: input.actorUserId, admin_session_id: input.adminSessionId, event_type: 'TENANT_ACTIVATED', correlation_id: input.correlationId, tenant_version: updated.version, occurred_at: occurredAt }).execute();
        return mapTenantRecord(updated);
      });
    } catch (error: unknown) { throw mapTenantError(error); }
  }
}

export function createKyselyTenantRepository(
  connection: DatabaseConnection,
): TenantRepositoryPort {
  return new KyselyTenantRepository((operation) =>
    useDatabasePersistenceExecutor(connection, 'tenancy', operation),
  );
}

export function createTransactionalKyselyTenantRepository(
  context: DatabaseTransactionContext,
): TenantRepositoryPort {
  return new KyselyTenantRepository((operation) =>
    useTransactionalDatabasePersistenceExecutor(
      context,
      'tenancy',
      operation,
    ),
  );
}

export type KyselyTenantRepositoryFactory =
  typeof createKyselyTenantRepository;
