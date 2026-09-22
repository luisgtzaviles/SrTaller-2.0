import {
  useDatabasePersistenceExecutor,
  useTransactionalDatabasePersistenceExecutor,
} from '../../../../infrastructure/database/database-persistence-capability.js';
import type {
  InternalDatabasePersistenceConnection,
  InternalDatabasePersistenceExecutor,
  InternalDatabasePersistenceOperation,
} from '../../../../infrastructure/database/database-persistence-capability.js';
import type { BranchRow, DatabaseSchema } from '../../../../infrastructure/database/database-types.js';
import type { DatabaseTransactionContext } from '../../../../infrastructure/database/transaction-runner.js';
import { parseTenantId } from '../../../tenancy/index.js';
import { branchStatus, parseBranchDisplayName } from '../../domain/branch.js';
import { parseBranchTimeZone } from '../../application/branch-time-zone.js';
import {
  BranchPersistenceError,
  parseBranchId,
} from '../../application/ports/branch-repository.port.js';
import type {
  BranchRecord,
  BranchAuditRecord,
  BranchCommandKind,
  BranchCommandReceipt,
  BranchRepositoryPort,
  CreateBranchRecord,
  UpdateBranchRecord,
  TenantBranchPersistenceScope,
  TenantPersistenceScope,
} from '../../application/ports/branch-repository.port.js';

type BranchExecutor = InternalDatabasePersistenceExecutor<'stations'>;

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
  timeZone: string;
  displayName: string;
  createdAt: Date;
}> {
  if (
    typeof record !== 'object' ||
    record === null ||
    record.tenantId !== scope.tenantId ||
    record.branchId !== scope.branchId ||
    typeof record.displayName !== 'string' ||
    !validInstant(record.createdAt)
  ) {
    throw new BranchPersistenceError(
      record?.tenantId !== scope.tenantId
        ? 'PERSISTENCE_TENANT_SCOPE_REQUIRED'
        : 'PERSISTENCE_BRANCH_SCOPE_REQUIRED',
    );
  }
  let timeZone: string;
  let displayName: string;
  try {
    timeZone = parseBranchTimeZone(record.timeZone);
    displayName = parseBranchDisplayName(record.displayName);
  } catch {
    throw new BranchPersistenceError('BRANCH_PERSISTENCE_TIME_ZONE_INVALID');
  }
  return Object.freeze({
    tenantId: scope.tenantId,
    branchId: scope.branchId,
    displayName,
    timeZone,
    createdAt: new Date(record.createdAt),
  });
}

function mapBranchRecord(
  row: BranchRow,
): BranchRecord {
  return Object.freeze({
    tenantId: parseTenantId(row.tenant_id),
    branchId: parseBranchId(row.branch_id),
    displayName: parseBranchDisplayName(row.display_name),
    timeZone: parseBranchTimeZone(row.time_zone),
    status: branchStatus(row.active),
    version: row.version,
    admissionRevision: row.admission_revision,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
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
            display_name: validatedRecord.displayName,
            time_zone: validatedRecord.timeZone,
            created_at: validatedRecord.createdAt,
            updated_at: validatedRecord.createdAt,
          })
          .returningAll()
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
          .selectAll()
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
          .selectAll()
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

  async updateBranchTimeZone(
    scope: TenantBranchPersistenceScope,
    timeZone: string,
  ): Promise<BranchRecord> {
    const validatedScope = validateBranchScope(scope);
    let validatedTimeZone: string;
    try {
      validatedTimeZone = parseBranchTimeZone(timeZone);
    } catch {
      throw new BranchPersistenceError('BRANCH_PERSISTENCE_TIME_ZONE_INVALID');
    }
    try {
      return await this.execute(async (executor: BranchExecutor) => {
        const row = await executor
          .updateTable('branches')
          .set({ time_zone: validatedTimeZone, version: (expression) => expression('version', '+', 1), updated_at: new Date() })
          .where('tenant_id', '=', validatedScope.tenantId)
          .where('branch_id', '=', validatedScope.branchId)
          .returningAll()
          .executeTakeFirst();
        if (!row) {
          throw new BranchPersistenceError('BRANCH_PERSISTENCE_NOT_FOUND');
        }
        return mapBranchRecord(row);
      });
    } catch (error: unknown) {
      throw mapBranchError(error);
    }
  }

  async updateBranch(scope: TenantBranchPersistenceScope, record: UpdateBranchRecord): Promise<BranchRecord> {
    const validatedScope = validateBranchScope(scope);
    let displayName: string;
    let timeZone: string;
    if (!Number.isSafeInteger(record.expectedVersion) || record.expectedVersion < 0 || !validInstant(record.updatedAt)) {
      throw new BranchPersistenceError('BRANCH_PERSISTENCE_VERSION_CONFLICT');
    }
    try {
      displayName = parseBranchDisplayName(record.displayName);
      timeZone = parseBranchTimeZone(record.timeZone);
    } catch {
      throw new BranchPersistenceError('BRANCH_PERSISTENCE_TIME_ZONE_INVALID');
    }
    try {
      return await this.execute(async (executor: BranchExecutor) => {
        const row = await executor.updateTable('branches').set({
          display_name: displayName,
          time_zone: timeZone,
          version: record.expectedVersion + 1,
          updated_at: new Date(record.updatedAt),
        }).where('tenant_id', '=', validatedScope.tenantId)
          .where('branch_id', '=', validatedScope.branchId)
          .where('version', '=', record.expectedVersion)
          .returningAll().executeTakeFirst();
        if (!row) throw new BranchPersistenceError('BRANCH_PERSISTENCE_VERSION_CONFLICT');
        return mapBranchRecord(row);
      });
    } catch (error: unknown) { throw mapBranchError(error); }
  }

  async setBranchActive(scope: TenantBranchPersistenceScope, active: boolean, expectedVersion: number, updatedAt: string): Promise<BranchRecord> {
    const validatedScope = validateBranchScope(scope);
    if (typeof active !== 'boolean' || !Number.isSafeInteger(expectedVersion) || expectedVersion < 0 || !validInstant(updatedAt)) {
      throw new BranchPersistenceError('BRANCH_PERSISTENCE_VERSION_CONFLICT');
    }
    try {
      return await this.execute(async (executor: BranchExecutor) => {
        const row = await executor.updateTable('branches').set({ active, version: expectedVersion + 1, updated_at: new Date(updatedAt) })
          .where('tenant_id', '=', validatedScope.tenantId).where('branch_id', '=', validatedScope.branchId)
          .where('version', '=', expectedVersion).returningAll().executeTakeFirst();
        if (!row) throw new BranchPersistenceError('BRANCH_PERSISTENCE_VERSION_CONFLICT');
        return mapBranchRecord(row);
      });
    } catch (error: unknown) { throw mapBranchError(error); }
  }

  async countActiveBranches(scope: TenantPersistenceScope): Promise<number> {
    const validatedScope = validateTenantScope(scope);
    try {
      return await this.execute(async (executor: BranchExecutor) => {
        const row = await executor.selectFrom('branches').select((expression) => expression.fn.countAll<number>().as('count'))
          .where('tenant_id', '=', validatedScope.tenantId).where('active', '=', true).executeTakeFirstOrThrow();
        return Number(row.count);
      });
    } catch (error: unknown) { throw mapBranchError(error); }
  }

  async findCommand(scope: TenantPersistenceScope, kind: BranchCommandKind, clientRequestId: string): Promise<BranchCommandReceipt | null> {
    const validatedScope = validateTenantScope(scope);
    try {
      return await this.execute(async (executor: BranchExecutor) => {
        const row = await executor.selectFrom('branch_commands').selectAll().where('tenant_id', '=', validatedScope.tenantId)
          .where('command_kind', '=', kind).where('client_request_id', '=', clientRequestId).executeTakeFirst();
        return row ? Object.freeze({
          branch: Object.freeze({
            tenantId: validatedScope.tenantId,
            branchId: parseBranchId(row.branch_id),
            displayName: parseBranchDisplayName(row.result_display_name),
            timeZone: parseBranchTimeZone(row.result_time_zone),
            status: row.result_status,
            version: row.result_version,
            admissionRevision: row.result_admission_revision,
            createdAt: row.result_created_at.toISOString(),
            updatedAt: row.result_updated_at.toISOString(),
          }),
          requestDigest: row.request_digest,
        }) : null;
      });
    } catch (error: unknown) { throw mapBranchError(error); }
  }

  async saveCommand(scope: TenantPersistenceScope, kind: BranchCommandKind, clientRequestId: string, requestDigest: Uint8Array, branch: BranchRecord, completedAt: string): Promise<void> {
    const validatedScope = validateTenantScope(scope);
    try {
      await this.execute(async (executor: BranchExecutor) => {
        await executor.insertInto('branch_commands').values({ tenant_id: validatedScope.tenantId, command_kind: kind, client_request_id: clientRequestId, request_digest: requestDigest, branch_id: branch.branchId, result_display_name: branch.displayName, result_time_zone: branch.timeZone, result_version: branch.version, result_status: branch.status, result_admission_revision: branch.admissionRevision, result_created_at: new Date(branch.createdAt), result_updated_at: new Date(branch.updatedAt), completed_at: new Date(completedAt) }).execute();
      });
    } catch (error: unknown) { throw mapBranchError(error); }
  }

  async appendAudit(
    scope: TenantPersistenceScope,
    record: BranchAuditRecord,
  ): Promise<void> {
    const validatedScope = validateTenantScope(scope);
    if (record.tenantId !== validatedScope.tenantId) {
      throw new BranchPersistenceError('PERSISTENCE_TENANT_SCOPE_REQUIRED');
    }
    try {
      await this.execute(async (executor: BranchExecutor) => {
        await executor.insertInto('branch_audit_events').values({ event_id: record.eventId, tenant_id: record.tenantId, branch_id: record.branchId, actor_user_id: record.actorUserId, actor_display_name: record.actorDisplayName, admin_session_id: record.adminSessionId, event_type: record.eventType, capability: record.capability, correlation_id: record.correlationId, client_request_id: record.clientRequestId, branch_version: record.branchVersion, occurred_at: new Date(record.occurredAt) }).execute();
      });
    } catch (error: unknown) { throw mapBranchError(error); }
  }
}

export function createKyselyBranchRepository(
  connection: InternalDatabasePersistenceConnection,
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
