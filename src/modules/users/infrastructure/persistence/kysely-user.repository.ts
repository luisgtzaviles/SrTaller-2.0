import type { DatabaseConnection } from '../../../../infrastructure/database/database-connection.js';
import { useDatabasePersistenceExecutor } from '../../../../infrastructure/database/database-persistence-capability.js';
import type {
  InternalDatabasePersistenceExecutor,
  InternalDatabasePersistenceOperation,
} from '../../../../infrastructure/database/database-persistence-capability.js';
import type {
  UserLifecycleCommandRow,
  UserRow,
} from '../../../../infrastructure/database/database-types.js';
import { parseTenantId } from '../../../tenancy/index.js';
import {
  canTransitionUser,
  parseUserId,
  parseUserStatus,
} from '../../domain/user.js';
import { UserPersistenceError } from '../../application/ports/user-repository.port.js';
import type {
  BootstrapUserInput,
  TransitionUserInput,
  UserRecord,
  UserRepositoryPort,
  UserScope,
} from '../../application/ports/user-repository.port.js';

type UserExecutor = InternalDatabasePersistenceExecutor<'users'>;
type UserOperation = <Result>(
  operation: InternalDatabasePersistenceOperation<'users', Result>,
) => Promise<Result>;

const canonicalUuid =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/u;

function driverErrorCode(error: unknown): string {
  if (typeof error !== 'object' || error === null) {
    return '';
  }
  const candidate = error as Readonly<Record<string, unknown>>;
  return typeof candidate.code === 'string' ? candidate.code : '';
}

function mapUserError(error: unknown): UserPersistenceError {
  if (error instanceof UserPersistenceError) {
    return error;
  }
  const code = driverErrorCode(error);
  if (code === '23505') {
    return new UserPersistenceError('USER_PERSISTENCE_CONFLICT');
  }
  if (code === '23503') {
    return new UserPersistenceError('USER_TENANT_NOT_FOUND');
  }
  if (
    code === '22001' ||
    code === '22P02' ||
    code === '23502' ||
    code === '23514'
  ) {
    return new UserPersistenceError('USER_INPUT_INVALID');
  }
  return new UserPersistenceError('USER_PERSISTENCE_FAILED');
}

function validInstant(value: unknown): value is string {
  if (typeof value !== 'string') {
    return false;
  }
  const instant = new Date(value);
  return Number.isFinite(instant.getTime()) && instant.toISOString() === value;
}

function validateScope(scope: UserScope): UserScope {
  try {
    return Object.freeze({ tenantId: parseTenantId(scope?.tenantId) });
  } catch {
    throw new UserPersistenceError('USER_TENANT_SCOPE_REQUIRED');
  }
}

function validateName(value: unknown): string {
  if (
    typeof value !== 'string' ||
    value.length < 1 ||
    value.length > 160 ||
    value.trim() !== value
  ) {
    throw new UserPersistenceError('USER_INPUT_INVALID');
  }
  return value;
}

function validateOperationalIdentifier(value: unknown): string | null {
  if (value === null) {
    return null;
  }
  return validateName(value);
}

function validateClientRequestId(value: unknown): string {
  if (typeof value !== 'string' || !canonicalUuid.test(value)) {
    throw new UserPersistenceError('USER_INPUT_INVALID');
  }
  return value;
}

function validateBootstrapInput(input: BootstrapUserInput): Readonly<{
  userId: BootstrapUserInput['userId'];
  displayName: string;
  operationalIdentifier: string | null;
  clientRequestId: string;
  occurredAt: Date;
}> {
  try {
    if (!validInstant(input?.occurredAt)) {
      throw new Error('invalid instant');
    }
    return Object.freeze({
      userId: parseUserId(input.userId),
      displayName: validateName(input.displayName),
      operationalIdentifier: validateOperationalIdentifier(
        input.operationalIdentifier,
      ),
      clientRequestId: validateClientRequestId(input.clientRequestId),
      occurredAt: new Date(input.occurredAt),
    });
  } catch (error: unknown) {
    if (error instanceof UserPersistenceError) {
      throw error;
    }
    throw new UserPersistenceError('USER_INPUT_INVALID');
  }
}

function validateTransitionInput(input: TransitionUserInput): Readonly<{
  userId: TransitionUserInput['userId'];
  status: TransitionUserInput['status'];
  expectedVersion: number;
  clientRequestId: string;
  occurredAt: Date;
}> {
  try {
    if (
      !Number.isSafeInteger(input?.expectedVersion) ||
      input.expectedVersion < 0 ||
      !validInstant(input.occurredAt)
    ) {
      throw new Error('invalid transition input');
    }
    return Object.freeze({
      userId: parseUserId(input.userId),
      status: parseUserStatus(input.status),
      expectedVersion: input.expectedVersion,
      clientRequestId: validateClientRequestId(input.clientRequestId),
      occurredAt: new Date(input.occurredAt),
    });
  } catch (error: unknown) {
    if (error instanceof UserPersistenceError) {
      throw error;
    }
    throw new UserPersistenceError('USER_INPUT_INVALID');
  }
}

function mapUserRecord(row: UserRow): UserRecord {
  return Object.freeze({
    userId: parseUserId(row.user_id),
    tenantId: parseTenantId(row.tenant_id),
    displayName: row.display_name,
    operationalIdentifier: row.operational_identifier,
    status: parseUserStatus(row.status),
    version: row.version,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  });
}

function matchesBootstrapGate(
  gate: Readonly<{
    client_request_id: string;
    display_name: string;
    operational_identifier: string | null;
  }>,
  input: ReturnType<typeof validateBootstrapInput>,
): boolean {
  return gate.client_request_id === input.clientRequestId &&
    gate.display_name === input.displayName &&
    gate.operational_identifier === input.operationalIdentifier;
}

function matchesLifecycleCommand(
  command: UserLifecycleCommandRow,
  input: ReturnType<typeof validateTransitionInput>,
): boolean {
  return command.user_id === input.userId &&
    command.requested_status === input.status &&
    command.expected_version === input.expectedVersion;
}

function mapLifecycleCommand(command: UserLifecycleCommandRow): UserRecord {
  return Object.freeze({
    userId: parseUserId(command.user_id),
    tenantId: parseTenantId(command.tenant_id),
    displayName: command.result_display_name,
    operationalIdentifier: command.result_operational_identifier,
    status: parseUserStatus(command.result_status),
    version: command.result_version,
    createdAt: command.result_created_at.toISOString(),
    updatedAt: command.result_updated_at.toISOString(),
  });
}

function replayLifecycleCommand(
  command: UserLifecycleCommandRow,
  input: ReturnType<typeof validateTransitionInput>,
): UserRecord {
  if (!matchesLifecycleCommand(command, input)) {
    throw new UserPersistenceError('USER_IDEMPOTENCY_CONFLICT');
  }
  return mapLifecycleCommand(command);
}

class KyselyUserRepository implements UserRepositoryPort {
  constructor(private readonly execute: UserOperation) {}

  async list(scope: UserScope): Promise<readonly UserRecord[]> {
    const trustedScope = validateScope(scope);
    try {
      return await this.execute(async (database: UserExecutor) => {
        const rows = await database
          .selectFrom('users')
          .selectAll()
          .where('tenant_id', '=', trustedScope.tenantId)
          .orderBy('display_name', 'asc')
          .orderBy('user_id', 'asc')
          .execute();
        return Object.freeze(rows.map(mapUserRecord));
      });
    } catch (error: unknown) {
      throw mapUserError(error);
    }
  }

  async findById(
    scope: UserScope,
    userId: UserRecord['userId'],
  ): Promise<UserRecord | null> {
    const trustedScope = validateScope(scope);
    let trustedUserId: UserRecord['userId'];
    try {
      trustedUserId = parseUserId(userId);
    } catch {
      throw new UserPersistenceError('USER_INPUT_INVALID');
    }
    try {
      return await this.execute(async (database: UserExecutor) => {
        const row = await database
          .selectFrom('users')
          .selectAll()
          .where('tenant_id', '=', trustedScope.tenantId)
          .where('user_id', '=', trustedUserId)
          .executeTakeFirst();
        return row ? mapUserRecord(row) : null;
      });
    } catch (error: unknown) {
      throw mapUserError(error);
    }
  }

  async bootstrap(
    scope: UserScope,
    input: BootstrapUserInput,
  ): Promise<UserRecord> {
    const trustedScope = validateScope(scope);
    const trustedInput = validateBootstrapInput(input);
    try {
      return await this.execute(async (database: UserExecutor) =>
        database.transaction().execute(async (transaction) => {
          const previousGate = await transaction
            .selectFrom('user_provisioning_bootstraps')
            .selectAll()
            .where('tenant_id', '=', trustedScope.tenantId)
            .executeTakeFirst();
          if (previousGate) {
            if (!matchesBootstrapGate(previousGate, trustedInput)) {
              throw new UserPersistenceError(
                previousGate.client_request_id === trustedInput.clientRequestId
                  ? 'USER_IDEMPOTENCY_CONFLICT'
                  : 'FIRST_USER_ALREADY_PROVISIONED',
              );
            }
            const existing = await transaction
              .selectFrom('users')
              .selectAll()
              .where('tenant_id', '=', trustedScope.tenantId)
              .where('user_id', '=', previousGate.first_user_id)
              .executeTakeFirst();
            if (!existing) {
              throw new UserPersistenceError('USER_PERSISTENCE_FAILED');
            }
            return mapUserRecord(existing);
          }

          const existingUser = await transaction
            .selectFrom('users')
            .select('user_id')
            .where('tenant_id', '=', trustedScope.tenantId)
            .limit(1)
            .executeTakeFirst();
          if (existingUser) {
            throw new UserPersistenceError('FIRST_USER_ALREADY_PROVISIONED');
          }

          const gate = await transaction
            .insertInto('user_provisioning_bootstraps')
            .values({
              tenant_id: trustedScope.tenantId,
              first_user_id: trustedInput.userId,
              client_request_id: trustedInput.clientRequestId,
              display_name: trustedInput.displayName,
              operational_identifier: trustedInput.operationalIdentifier,
              provisioned_at: trustedInput.occurredAt,
            })
            .onConflict((conflict) => conflict.column('tenant_id').doNothing())
            .returningAll()
            .executeTakeFirst();

          if (!gate) {
            const prior = await transaction
              .selectFrom('user_provisioning_bootstraps')
              .selectAll()
              .where('tenant_id', '=', trustedScope.tenantId)
              .executeTakeFirstOrThrow();
            if (!matchesBootstrapGate(prior, trustedInput)) {
              throw new UserPersistenceError(
                prior.client_request_id === trustedInput.clientRequestId
                  ? 'USER_IDEMPOTENCY_CONFLICT'
                  : 'FIRST_USER_ALREADY_PROVISIONED',
              );
            }
            const existing = await transaction
              .selectFrom('users')
              .selectAll()
              .where('tenant_id', '=', trustedScope.tenantId)
              .where('user_id', '=', prior.first_user_id)
              .executeTakeFirst();
            if (!existing) {
              throw new UserPersistenceError('USER_PERSISTENCE_FAILED');
            }
            return mapUserRecord(existing);
          }

          const row = await transaction
            .insertInto('users')
            .values({
              user_id: trustedInput.userId,
              tenant_id: trustedScope.tenantId,
              display_name: trustedInput.displayName,
              operational_identifier: trustedInput.operationalIdentifier,
              status: 'active',
              version: 0,
              created_at: trustedInput.occurredAt,
              updated_at: trustedInput.occurredAt,
            })
            .returningAll()
            .executeTakeFirstOrThrow();
          return mapUserRecord(row);
        }),
      );
    } catch (error: unknown) {
      throw mapUserError(error);
    }
  }

  async transition(
    scope: UserScope,
    input: TransitionUserInput,
  ): Promise<UserRecord> {
    const trustedScope = validateScope(scope);
    const trustedInput = validateTransitionInput(input);
    try {
      return await this.execute(async (database: UserExecutor) =>
        database.transaction().execute(async (transaction) => {
          const previousCommand = await transaction
            .selectFrom('user_lifecycle_commands')
            .selectAll()
            .where('tenant_id', '=', trustedScope.tenantId)
            .where('client_request_id', '=', trustedInput.clientRequestId)
            .executeTakeFirst();
          if (previousCommand) {
            return replayLifecycleCommand(previousCommand, trustedInput);
          }

          const current = await transaction
            .selectFrom('users')
            .selectAll()
            .where('tenant_id', '=', trustedScope.tenantId)
            .where('user_id', '=', trustedInput.userId)
            .executeTakeFirst();
          if (!current) {
            throw new UserPersistenceError('USER_NOT_FOUND');
          }
          if (!canTransitionUser(current.status, trustedInput.status)) {
            throw new UserPersistenceError('USER_LIFECYCLE_CONFLICT');
          }
          if (current.version !== trustedInput.expectedVersion) {
            throw new UserPersistenceError('USER_STALE_WRITE');
          }

          const row = await transaction
            .updateTable('users')
            .set({
              status: trustedInput.status,
              version: current.version + 1,
              updated_at: trustedInput.occurredAt,
            })
            .where('tenant_id', '=', trustedScope.tenantId)
            .where('user_id', '=', trustedInput.userId)
            .where('version', '=', trustedInput.expectedVersion)
            .returningAll()
            .executeTakeFirst();

          if (!row) {
            const concurrentCommand = await transaction
              .selectFrom('user_lifecycle_commands')
              .selectAll()
              .where('tenant_id', '=', trustedScope.tenantId)
              .where('client_request_id', '=', trustedInput.clientRequestId)
              .executeTakeFirst();
            if (concurrentCommand) {
              return replayLifecycleCommand(concurrentCommand, trustedInput);
            }
            throw new UserPersistenceError('USER_STALE_WRITE');
          }

          const command = await transaction
            .insertInto('user_lifecycle_commands')
            .values({
              tenant_id: trustedScope.tenantId,
              client_request_id: trustedInput.clientRequestId,
              user_id: trustedInput.userId,
              requested_status: trustedInput.status,
              expected_version: trustedInput.expectedVersion,
              result_display_name: row.display_name,
              result_operational_identifier: row.operational_identifier,
              result_status: row.status,
              result_version: row.version,
              result_created_at: row.created_at,
              result_updated_at: row.updated_at,
              applied_at: trustedInput.occurredAt,
            })
            .onConflict((conflict) =>
              conflict.columns(['tenant_id', 'client_request_id']).doNothing(),
            )
            .returningAll()
            .executeTakeFirst();

          if (!command) {
            const prior = await transaction
              .selectFrom('user_lifecycle_commands')
              .selectAll()
              .where('tenant_id', '=', trustedScope.tenantId)
              .where('client_request_id', '=', trustedInput.clientRequestId)
              .executeTakeFirstOrThrow();
            return replayLifecycleCommand(prior, trustedInput);
          }
          return mapLifecycleCommand(command);
        }),
      );
    } catch (error: unknown) {
      throw mapUserError(error);
    }
  }
}

export function createKyselyUserRepository(
  connection: DatabaseConnection,
): UserRepositoryPort {
  return new KyselyUserRepository((operation) =>
    useDatabasePersistenceExecutor(connection, 'users', operation),
  );
}

export type KyselyUserRepositoryFactory = typeof createKyselyUserRepository;
