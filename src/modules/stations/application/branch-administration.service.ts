import { createHash, randomUUID, timingSafeEqual } from 'node:crypto';
import { inspect } from 'node:util';

import type { DatabaseConnection } from '../../../infrastructure/database/database-connection.js';
import { DatabaseTransactionError, runInTransaction } from '../../../infrastructure/database/transaction-runner.js';
import type { TenantId } from '../../tenancy/index.js';
import { createTransactionalKyselyTenantRepository } from '../../tenancy/infrastructure/persistence/kysely-tenant.repository.js';
import { TenantPersistenceError } from '../../tenancy/application/ports/tenant-repository.port.js';
import { parseBranchDisplayName } from '../domain/branch.js';
import { parseBranchTimeZone } from './branch-time-zone.js';
import { createKyselyBranchRepository, createTransactionalKyselyBranchRepository } from '../infrastructure/persistence/kysely-branch.repository.js';
import { parseBranchId } from './ports/branch-repository.port.js';
import { BranchPersistenceError } from './ports/branch-repository.port.js';
import type { BranchCommandKind, BranchRecord } from './ports/branch-repository.port.js';

export type BranchAdministrationErrorCode =
  | 'BRANCH_NOT_FOUND'
  | 'BRANCH_VERSION_CONFLICT'
  | 'BRANCH_IDEMPOTENCY_CONFLICT'
  | 'BRANCH_INVALID_INPUT'
  | 'BRANCH_INVALID_TRANSITION'
  | 'LAST_ACTIVE_BRANCH_REQUIRED'
  | 'BRANCH_AUTHORITY_CHANGED'
  | 'BRANCH_CONCURRENCY_CONFLICT';

const messages: Readonly<Record<BranchAdministrationErrorCode, string>> = Object.freeze({
  BRANCH_NOT_FOUND: 'The Branch was not found in the effective Tenant.',
  BRANCH_VERSION_CONFLICT: 'The Branch changed before this command could be applied.',
  BRANCH_IDEMPOTENCY_CONFLICT: 'The client request identifier was already used for different Branch input.',
  BRANCH_INVALID_INPUT: 'The Branch command input is invalid.',
  BRANCH_INVALID_TRANSITION: 'The Branch lifecycle transition is not valid from its current state.',
  LAST_ACTIVE_BRANCH_REQUIRED: 'An active Tenant must retain at least one active Branch.',
  BRANCH_AUTHORITY_CHANGED: 'Administrative authority changed before the Branch command committed.',
  BRANCH_CONCURRENCY_CONFLICT: 'The Branch command could not be serialized safely.',
});

export class BranchAdministrationError extends Error {
  constructor(readonly code: BranchAdministrationErrorCode) {
    super(messages[code]);
    this.name = 'BranchAdministrationError';
  }
  toJSON() { return Object.freeze({ name: this.name, code: this.code, message: this.message }); }
  [inspect.custom]() { return this.toJSON(); }
}

export interface BranchAdministrationContext {
  readonly tenantId: TenantId;
  readonly sessionId: string;
  readonly userId: string;
  readonly userDisplayName: string;
  readonly capability: string;
  readonly commitGuard: Readonly<{
    confirmCurrent(transactionContext: object): Promise<boolean>;
    confirmEffectiveTenantAdmin(transactionContext: object): Promise<boolean>;
  }>;
}

export interface BranchAdministrationRuntime {
  list(context: BranchAdministrationContext): Promise<readonly BranchRecord[]>;
  read(context: BranchAdministrationContext, branchId: unknown): Promise<BranchRecord>;
  create(context: BranchAdministrationContext, input: unknown): Promise<BranchRecord>;
  update(context: BranchAdministrationContext, branchId: unknown, input: unknown): Promise<BranchRecord>;
  deactivate(context: BranchAdministrationContext, branchId: unknown, input: unknown): Promise<BranchRecord>;
  reactivate(context: BranchAdministrationContext, branchId: unknown, input: unknown): Promise<BranchRecord>;
}

type ParsedCommand = Readonly<{ clientRequestId: string; expectedVersion?: number; displayName?: ReturnType<typeof parseBranchDisplayName>; timeZone?: ReturnType<typeof parseBranchTimeZone> }>;

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/u;

function parseCommand(value: unknown, kind: BranchCommandKind): ParsedCommand {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) throw new BranchAdministrationError('BRANCH_INVALID_INPUT');
  const candidate = value as Record<string, unknown>;
  if (typeof candidate.clientRequestId !== 'string' || !uuid.test(candidate.clientRequestId)) throw new BranchAdministrationError('BRANCH_INVALID_INPUT');
  const output: { clientRequestId: string; expectedVersion?: number; displayName?: ReturnType<typeof parseBranchDisplayName>; timeZone?: ReturnType<typeof parseBranchTimeZone> } = { clientRequestId: candidate.clientRequestId };
  try {
    if (kind === 'CREATE' || kind === 'UPDATE') {
      output.displayName = parseBranchDisplayName(candidate.displayName);
      output.timeZone = parseBranchTimeZone(candidate.timeZone);
    }
  } catch { throw new BranchAdministrationError('BRANCH_INVALID_INPUT'); }
  if (kind !== 'CREATE') {
    if (!Number.isSafeInteger(candidate.expectedVersion) || (candidate.expectedVersion as number) < 0) throw new BranchAdministrationError('BRANCH_INVALID_INPUT');
    output.expectedVersion = candidate.expectedVersion as number;
  }
  return Object.freeze(output);
}

function digest(kind: BranchCommandKind, branchId: string | null, input: ParsedCommand): Uint8Array {
  return createHash('sha256').update(JSON.stringify({ kind, branchId, ...input })).digest();
}

function sameDigest(left: Uint8Array, right: Uint8Array): boolean {
  return left.length === right.length && timingSafeEqual(Buffer.from(left), Buffer.from(right));
}

export class BranchAdministrationService implements BranchAdministrationRuntime {
  private readonly repository;
  constructor(
    private readonly connection: DatabaseConnection,
    private readonly clock: () => Date = () => new Date(),
    private readonly createId: () => string = randomUUID,
  ) {
    this.repository = createKyselyBranchRepository(connection as never);
  }

  async list(context: BranchAdministrationContext): Promise<readonly BranchRecord[]> {
    return this.repository.listBranchesByTenant({ tenantId: context.tenantId });
  }

  async read(context: BranchAdministrationContext, branchIdValue: unknown): Promise<BranchRecord> {
    let branchId;
    try { branchId = parseBranchId(branchIdValue); } catch { throw new BranchAdministrationError('BRANCH_NOT_FOUND'); }
    const branch = await this.repository.findBranchById({ tenantId: context.tenantId, branchId });
    if (!branch) throw new BranchAdministrationError('BRANCH_NOT_FOUND');
    return branch;
  }

  async create(context: BranchAdministrationContext, value: unknown): Promise<BranchRecord> {
    const input = parseCommand(value, 'CREATE');
    return this.mutate(context, 'CREATE', null, input, async ({ branches, tenants, now, correlationId, transactionContext }) => {
      const branchId = parseBranchId(this.createId());
      const branch = await branches.createBranch({ tenantId: context.tenantId, branchId }, { tenantId: context.tenantId, branchId, displayName: input.displayName!, timeZone: input.timeZone!, createdAt: now });
      await this.maybeActivate(context, branches, tenants, transactionContext, now, correlationId);
      return branch;
    });
  }

  async update(context: BranchAdministrationContext, branchIdValue: unknown, value: unknown): Promise<BranchRecord> {
    const branchId = this.branchId(branchIdValue);
    const input = parseCommand(value, 'UPDATE');
    return this.mutate(context, 'UPDATE', branchId, input, async ({ branches, now }) => {
      const current = await branches.findBranchById({ tenantId: context.tenantId, branchId });
      if (!current) throw new BranchAdministrationError('BRANCH_NOT_FOUND');
      if (current.version !== input.expectedVersion) throw new BranchAdministrationError('BRANCH_VERSION_CONFLICT');
      return branches.updateBranch({ tenantId: context.tenantId, branchId }, { displayName: input.displayName!, timeZone: input.timeZone!, expectedVersion: input.expectedVersion!, updatedAt: now });
    });
  }

  async deactivate(context: BranchAdministrationContext, branchIdValue: unknown, value: unknown): Promise<BranchRecord> {
    const branchId = this.branchId(branchIdValue); const input = parseCommand(value, 'DEACTIVATE');
    return this.mutate(context, 'DEACTIVATE', branchId, input, async ({ branches, tenants, now }) => {
      const tenant = await tenants.lockTenant({ tenantId: context.tenantId });
      const current = await branches.findBranchById({ tenantId: context.tenantId, branchId });
      if (!current) throw new BranchAdministrationError('BRANCH_NOT_FOUND');
      if (current.version !== input.expectedVersion) throw new BranchAdministrationError('BRANCH_VERSION_CONFLICT');
      if (current.status !== 'ACTIVE') throw new BranchAdministrationError('BRANCH_INVALID_TRANSITION');
      if (tenant.lifecycleStatus === 'ACTIVE' && await branches.countActiveBranches({ tenantId: context.tenantId }) <= 1) throw new BranchAdministrationError('LAST_ACTIVE_BRANCH_REQUIRED');
      return branches.setBranchActive({ tenantId: context.tenantId, branchId }, false, input.expectedVersion!, now);
    });
  }

  async reactivate(context: BranchAdministrationContext, branchIdValue: unknown, value: unknown): Promise<BranchRecord> {
    const branchId = this.branchId(branchIdValue); const input = parseCommand(value, 'REACTIVATE');
    return this.mutate(context, 'REACTIVATE', branchId, input, async ({ branches, tenants, now, correlationId, transactionContext }) => {
      const current = await branches.findBranchById({ tenantId: context.tenantId, branchId });
      if (!current) throw new BranchAdministrationError('BRANCH_NOT_FOUND');
      if (current.version !== input.expectedVersion) throw new BranchAdministrationError('BRANCH_VERSION_CONFLICT');
      if (current.status !== 'INACTIVE') throw new BranchAdministrationError('BRANCH_INVALID_TRANSITION');
      const branch = await branches.setBranchActive({ tenantId: context.tenantId, branchId }, true, input.expectedVersion!, now);
      await this.maybeActivate(context, branches, tenants, transactionContext, now, correlationId);
      return branch;
    });
  }

  private branchId(value: unknown) {
    try { return parseBranchId(value); } catch { throw new BranchAdministrationError('BRANCH_NOT_FOUND'); }
  }

  private async maybeActivate(context: BranchAdministrationContext, branches: ReturnType<typeof createTransactionalKyselyBranchRepository>, tenants: ReturnType<typeof createTransactionalKyselyTenantRepository>, transactionContext: object, now: string, correlationId: string): Promise<void> {
    const tenant = await tenants.lockTenant({ tenantId: context.tenantId });
    if (tenant.lifecycleStatus === 'ACTIVE') return;
    if (await branches.countActiveBranches({ tenantId: context.tenantId }) < 1) return;
    if (!await context.commitGuard.confirmEffectiveTenantAdmin(transactionContext)) return;
    await tenants.activateTenant({ tenantId: context.tenantId }, { actorUserId: context.userId, adminSessionId: context.sessionId, correlationId, occurredAt: now });
  }

  private async mutate(
    context: BranchAdministrationContext,
    kind: BranchCommandKind,
    branchId: ReturnType<typeof parseBranchId> | null,
    input: ParsedCommand,
    operation: (dependencies: Readonly<{ branches: ReturnType<typeof createTransactionalKyselyBranchRepository>; tenants: ReturnType<typeof createTransactionalKyselyTenantRepository>; transactionContext: object; now: string; correlationId: string }>) => Promise<BranchRecord>,
  ): Promise<BranchRecord> {
    const requestDigest = digest(kind, branchId, input);
    for (let attempt = 1; attempt <= 3; attempt += 1) {
      let safeError: BranchAdministrationError | null = null;
      let retryablePersistence = false;
      try {
        return await runInTransaction(this.connection, { isolationLevel: 'serializable' }, async (transactionContext) => {
          const branches = createTransactionalKyselyBranchRepository(transactionContext);
          const tenants = createTransactionalKyselyTenantRepository(transactionContext);
          try {
            await tenants.lockTenant({ tenantId: context.tenantId });
            if (!await context.commitGuard.confirmCurrent(transactionContext)) throw new BranchAdministrationError('BRANCH_AUTHORITY_CHANGED');
            const replay = await branches.findCommand({ tenantId: context.tenantId }, kind, input.clientRequestId);
            if (replay) {
              if (!sameDigest(replay.requestDigest, requestDigest)) throw new BranchAdministrationError('BRANCH_IDEMPOTENCY_CONFLICT');
              return replay.branch;
            }
            const now = this.clock().toISOString(); const correlationId = randomUUID();
            const result = await operation({ branches, tenants, transactionContext, now, correlationId });
            await branches.saveCommand({ tenantId: context.tenantId }, kind, input.clientRequestId, requestDigest, result, now);
            await branches.appendAudit({ eventId: randomUUID(), tenantId: context.tenantId, branchId: result.branchId, actorUserId: context.userId, actorDisplayName: context.userDisplayName, adminSessionId: context.sessionId, eventType: `BRANCH_${kind === 'CREATE' ? 'CREATED' : kind === 'UPDATE' ? 'UPDATED' : kind === 'DEACTIVATE' ? 'DEACTIVATED' : 'REACTIVATED'}`, capability: context.capability, correlationId, clientRequestId: input.clientRequestId, branchVersion: result.version, occurredAt: now });
            return result;
          } catch (error: unknown) {
            if (error instanceof BranchAdministrationError) safeError = error;
            if (error instanceof BranchPersistenceError && error.retryable === 'conditional') retryablePersistence = true;
            if (error instanceof TenantPersistenceError && error.retryable === 'conditional') retryablePersistence = true;
            throw error;
          }
        });
      } catch (error: unknown) {
        if (safeError) throw safeError;
        if (retryablePersistence && attempt < 3) continue;
        if (error instanceof DatabaseTransactionError && error.code === 'DATABASE_TRANSACTION_SERIALIZATION_FAILURE' && attempt < 3) continue;
        throw new BranchAdministrationError('BRANCH_CONCURRENCY_CONFLICT');
      }
    }
    throw new BranchAdministrationError('BRANCH_CONCURRENCY_CONFLICT');
  }
}
