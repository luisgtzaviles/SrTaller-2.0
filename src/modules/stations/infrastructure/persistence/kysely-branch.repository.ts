import type { Kysely, Transaction } from 'kysely';

import type { DatabaseConnection } from '../../../../infrastructure/database/database-connection.js';
import {
  useDatabasePersistenceExecutor,
  useTransactionalDatabasePersistenceExecutor,
} from '../../../../infrastructure/database/database-persistence-capability.js';
import type {
  InternalDatabasePersistenceOperation,
} from '../../../../infrastructure/database/database-persistence-capability.js';
import type { BranchRow, DatabaseSchema } from '../../../../infrastructure/database/database-types.js';
import type { DatabaseTransactionContext } from '../../../../infrastructure/database/transaction-runner.js';
import { parseTenantId } from '../../../tenancy/index.js';
import {
  BranchPersistenceError,
  parseBranchId,
} from '../../application/ports/branch-repository.port.js';
import type {
  BranchRecord,
  BranchRepositoryPort,
  CreateBranchRecord,
  TenantBranchPersistenceScope,
  TenantPersistenceScope,
} from '../../application/ports/branch-repository.port.js';

type BranchExecutor =
  | Kysely<Pick<DatabaseSchema, 'branches'>>
  | Transaction<Pick<DatabaseSchema, 'branches'>>;

type ExecuteBranchOperation = <Result>(
  operation: InternalDatabasePersistenceOperation<'stations', Result>,
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

function mapBranchError(error: unknown): BranchPersistenceError {
  if (error instanceof BranchPersistenceError) {
    return error;
  }
  const { code } = driverErrorShape(error);
  if (code === '23505') {
    return new BranchPersistenceError('BRANCH_PERSISTENCE_CONFLICT');
  }
  if (code === '23503') {
    return new BranchPersistenceError(
      'BRANCH_PERSISTENCE_TENANT_NOT_FOUND',
    );
  }
  if (code === '23502' || code === '22P02') {
    return new BranchPersistenceError(
      code === '23502'
        ? 'PERSISTENCE_TENANT_SCOPE_REQUIRED'
        : 'PERSISTENCE_BRANCH_SCOPE_REQUIRED',
    );
  }
  return new BranchPersistenceError(
    'BRANCH_PERSISTENCE_FAILED',
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

function validateTenantScope(
  scope: TenantPersistenceScope,
): TenantPersistenceScope {
  try {
    const tenantId = parseTenantId(scope?.tenantId);
    return Object.freeze({ tenantId });
  } catch {
    throw new BranchPersistenceError('PERSISTENCE_TENANT_SCOPE_REQUIRED');
  }
}

function validateBranchScope(
  scope: TenantBranchPersistenceScope,
): TenantBranchPersistenceScope {
  const tenantScope = validateTenantScope(scope);
  try {
    const branchId = parseBranchId(scope?.branchId);
    return Object.freeze({
      tenantId: tenantScope.tenantId,
      branchId,
    });
  } catch {
    throw new BranchPersistenceError('PERSISTENCE_BRANCH_SCOPE_REQUIRED');
  }
}

function validateCreateRecord(
  scope: TenantBranchPersistenceScope,
  record: CreateBranchRecord,
): Readonly<{
  tenantId: TenantBranchPersistenceScope['tenantId'];
  branchId: TenantBranchPersistenceScope['branchId'];
  createdAt: Date;
}> {
  if (
    typeof record !== 'object' ||
    record === null ||
    record.tenantId !== scope.tenantId ||
    record.branchId !== scope.branchId ||
    !validInstant(record.createdAt)
  ) {
    throw new BranchPersistenceError(
      record?.tenantId !== scope.tenantId
        ? 'PERSISTENCE_TENANT_SCOPE_REQUIRED'
        : 'PERSISTENCE_BRANCH_SCOPE_REQUIRED',
    );
  }
  return Object.freeze({
    tenantId: scope.tenantId,
    branchId: scope.branchId,
    createdAt: new Date(record.createdAt),
  });
}

function mapBranchRecord(row: BranchRow): BranchRecord {
  return Object.freeze({
    tenantId: parseTenantId(row.tenant_id),
    branchId: parseBranchId(row.branch_id),
    createdAt: row.created_at.toISOString(),
  });
}

class KyselyBranchRepository implements BranchRepositoryPort {
  constructor(readonly execute: ExecuteBranchOperation) {}

  async createBranch(
    scope: TenantBranchPersistenceScope,
    record: CreateBranchRecord,
  ): Promise<BranchRecord> {
    const validatedScope = validateBranchScope(scope);
    const validatedRecord = validateCreateRecord(validatedScope, record);
    try {
      return await this.execute(async (executor: BranchExecutor) => {
        const row = await executor
          .insertInto('branches')
          .values({
            tenant_id: validatedRecord.tenantId,
            branch_id: validatedRecord.branchId,
            created_at: validatedRecord.createdAt,
          })
          .returning(['tenant_id', 'branch_id', 'created_at'])
          .executeTakeFirstOrThrow();
        return mapBranchRecord(row);
      });
    } catch (error: unknown) {
      throw mapBranchError(error);
    }
  }

  async findBranchById(
    scope: TenantBranchPersistenceScope,
  ): Promise<BranchRecord | null> {
    const validatedScope = validateBranchScope(scope);
    try {
      return await this.execute(async (executor: BranchExecutor) => {
        const row = await executor
          .selectFrom('branches')
          .select(['tenant_id', 'branch_id', 'created_at'])
          .where('tenant_id', '=', validatedScope.tenantId)
          .where('branch_id', '=', validatedScope.branchId)
          .executeTakeFirst();
        return row ? mapBranchRecord(row) : null;
      });
    } catch (error: unknown) {
      throw mapBranchError(error);
    }
  }

  async listBranchesByTenant(
    scope: TenantPersistenceScope,
  ): Promise<readonly BranchRecord[]> {
    const validatedScope = validateTenantScope(scope);
    try {
      return await this.execute(async (executor: BranchExecutor) => {
        const rows = await executor
          .selectFrom('branches')
          .select(['tenant_id', 'branch_id', 'created_at'])
          .where('tenant_id', '=', validatedScope.tenantId)
          .orderBy('branch_id', 'asc')
          .execute();
        return Object.freeze(rows.map(mapBranchRecord));
      });
    } catch (error: unknown) {
      throw mapBranchError(error);
    }
  }

  async existsBranch(
    scope: TenantBranchPersistenceScope,
  ): Promise<boolean> {
    const validatedScope = validateBranchScope(scope);
    try {
      return await this.execute(async (executor: BranchExecutor) => {
        const row = await executor
          .selectFrom('branches')
          .select('branch_id')
          .where('tenant_id', '=', validatedScope.tenantId)
          .where('branch_id', '=', validatedScope.branchId)
          .executeTakeFirst();
        return row !== undefined;
      });
    } catch (error: unknown) {
      throw mapBranchError(error);
    }
  }
}

export function createKyselyBranchRepository(
  connection: DatabaseConnection,
): BranchRepositoryPort {
  return new KyselyBranchRepository((operation) =>
    useDatabasePersistenceExecutor(connection, 'stations', operation),
  );
}

export function createTransactionalKyselyBranchRepository(
  context: DatabaseTransactionContext,
): BranchRepositoryPort {
  return new KyselyBranchRepository((operation) =>
    useTransactionalDatabasePersistenceExecutor(
      context,
      'stations',
      operation,
    ),
  );
}

export type KyselyBranchRepositoryFactory =
  typeof createKyselyBranchRepository;
