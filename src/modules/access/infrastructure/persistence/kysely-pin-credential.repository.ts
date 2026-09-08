import { timingSafeEqual } from 'node:crypto';

import type { InternalDatabasePersistenceConnection } from '../../../../infrastructure/database/database-persistence-capability.js';
import {
  useDatabasePersistenceExecutor,
  useTransactionalDatabasePersistenceExecutor,
} from '../../../../infrastructure/database/database-persistence-capability.js';
import type { DatabaseConnection } from '../../../../infrastructure/database/database-connection.js';
import { runInTransaction } from '../../../../infrastructure/database/transaction-runner.js';
import type {
  InternalDatabasePersistenceExecutor,
  InternalDatabasePersistenceOperation,
} from '../../../../infrastructure/database/database-persistence-capability.js';
import type {
  AccessPinCredentialCommandRow,
  AccessPinCredentialRow,
} from '../../../../infrastructure/database/database-types.js';
import { parseTenantId } from '../../../tenancy/index.js';
import { isTrustedStationContext } from '../../../stations/index.js';
import {
  PIN_KDF_PROFILE,
  parsePinCredentialId,
} from '../../domain/pin-credential.js';
import { parseAccessUserId } from '../../domain/role-assignment.js';
import type {
  PinAttemptResult,
  PinCredentialRecord,
  PinCredentialRepositoryPort,
  PinCredentialMutationCommitGuard,
  PinOnlyAttemptResult,
} from '../../application/ports/pin-credential-repository.port.js';
import { PinCredentialPersistenceError } from '../../application/ports/pin-credential-repository.port.js';
import type {
  PinStoredVerifier,
} from '../../application/ports/pin-secret-hasher.port.js';

type AccessExecutor = InternalDatabasePersistenceExecutor<'access'>;
type AccessOperation = <Result>(
  operation: InternalDatabasePersistenceOperation<'access', Result>,
) => Promise<Result>;
type AccessTransactionOperation = <Result>(
  operation: (executor: AccessExecutor, transactionContext: object) => Promise<Result>,
) => Promise<Result>;

const canonicalUuid =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/u;
const rateWindowMs = 60_000;
const credentialLockMs = 5 * 60_000;
const maxRatePrincipalsPerStation = 1_024;
const dummyPinUserId = parseAccessUserId(
  '00000000-0000-4000-8000-000000000000',
);

function driverErrorCode(error: unknown): string {
  if (typeof error !== 'object' || error === null) return '';
  const candidate = error as Readonly<Record<string, unknown>>;
  return typeof candidate.code === 'string' ? candidate.code : '';
}

function mapPersistenceError(error: unknown): PinCredentialPersistenceError {
  if (error instanceof PinCredentialPersistenceError) return error;
  const code = driverErrorCode(error);
  if (code === '23503') {
    return new PinCredentialPersistenceError('PIN_CREDENTIAL_USER_INVALID');
  }
  if (code === '23505') {
    return new PinCredentialPersistenceError('PIN_CREDENTIAL_EXISTS');
  }
  if (
    code === '22001' ||
    code === '22P02' ||
    code === '23502' ||
    code === '23514'
  ) {
    return new PinCredentialPersistenceError('PIN_CREDENTIAL_INPUT_INVALID');
  }
  return new PinCredentialPersistenceError(
    'PIN_CREDENTIAL_PERSISTENCE_FAILED',
  );
}

function validInstant(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  const date = new Date(value);
  return Number.isFinite(date.getTime()) && date.toISOString() === value;
}

function validSecretMaterial(
  value: Parameters<PinCredentialRepositoryPort['provision']>[1]['secret'],
): boolean {
  return (
    value.algorithm === PIN_KDF_PROFILE.algorithm &&
    value.profileVersion === PIN_KDF_PROFILE.profileVersion &&
    value.pepperVersion === 1 &&
    value.memoryKiB === PIN_KDF_PROFILE.memoryKiB &&
    value.passes === PIN_KDF_PROFILE.passes &&
    value.parallelism === PIN_KDF_PROFILE.parallelism &&
    value.salt.byteLength === PIN_KDF_PROFILE.saltLength &&
    value.verifier.byteLength === PIN_KDF_PROFILE.tagLength &&
    value.requestFingerprint.byteLength === 32
    && value.lookupDigest.byteLength === 32
  );
}

function mapCredential(row: AccessPinCredentialRow): PinCredentialRecord {
  return Object.freeze({
    tenantId: parseTenantId(row.tenant_id),
    userId: parseAccessUserId(row.user_id),
    credentialId: parsePinCredentialId(row.credential_id),
    status: row.status,
    credentialVersion: row.credential_version,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
    revokedAt: row.revoked_at?.toISOString() ?? null,
  });
}

function mapCommand(command: AccessPinCredentialCommandRow): PinCredentialRecord {
  return Object.freeze({
    tenantId: parseTenantId(command.tenant_id),
    userId: parseAccessUserId(command.user_id),
    credentialId: parsePinCredentialId(command.credential_id),
    status: command.result_status,
    credentialVersion: command.result_credential_version,
    createdAt: command.result_created_at.toISOString(),
    updatedAt: command.result_updated_at.toISOString(),
    revokedAt: null,
  });
}

function equalBytes(left: Uint8Array, right: Uint8Array): boolean {
  if (left.byteLength !== right.byteLength) return false;
  return timingSafeEqual(Buffer.from(left), Buffer.from(right));
}

function replayCommand(
  command: AccessPinCredentialCommandRow,
  input: Parameters<PinCredentialRepositoryPort['provision']>[1],
): PinCredentialRecord {
  if (
    command.command_type !== 'provision' ||
    command.user_id !== input.userId ||
    !equalBytes(command.request_fingerprint, input.secret.requestFingerprint)
  ) {
    throw new PinCredentialPersistenceError(
      'PIN_CREDENTIAL_IDEMPOTENCY_CONFLICT',
    );
  }
  return mapCommand(command);
}

function replayReplacement(
  command: AccessPinCredentialCommandRow,
  input: Parameters<PinCredentialRepositoryPort['replace']>[1],
): PinCredentialRecord {
  if (
    command.command_type !== 'replace' ||
    command.user_id !== input.userId ||
    !equalBytes(command.request_fingerprint, input.secret.requestFingerprint)
  ) {
    throw new PinCredentialPersistenceError(
      'PIN_CREDENTIAL_IDEMPOTENCY_CONFLICT',
    );
  }
  return mapCommand(command);
}

function storedVerifier(row: AccessPinCredentialRow): PinStoredVerifier {
  return Object.freeze({
    algorithm: row.algorithm,
    profileVersion: row.profile_version,
    pepperVersion: row.pepper_version,
    memoryKiB: row.memory_kib,
    passes: row.passes,
    parallelism: row.parallelism,
    salt: Uint8Array.from(row.salt),
    verifier: Uint8Array.from(row.verifier),
  });
}

class KyselyPinCredentialRepository implements PinCredentialRepositoryPort {
  constructor(
    private readonly execute: AccessOperation,
    private readonly executeTransaction: AccessTransactionOperation,
  ) {}

  async listConfiguredUserIds(
    scope: Parameters<PinCredentialRepositoryPort['listConfiguredUserIds']>[0],
  ): Promise<readonly ReturnType<typeof parseAccessUserId>[]> {
    let tenantId;
    try {
      tenantId = parseTenantId(scope?.tenantId);
    } catch {
      throw new PinCredentialPersistenceError('PIN_CREDENTIAL_TENANT_SCOPE_REQUIRED');
    }
    try {
      return await this.execute(async (database: AccessExecutor) => {
        const rows = await database
          .selectFrom('access_pin_credentials')
          .select('user_id')
          .where('tenant_id', '=', tenantId)
          .where('status', '=', 'active')
          .orderBy('user_id', 'asc')
          .execute();
        return Object.freeze(rows.map((row) => parseAccessUserId(row.user_id)));
      });
    } catch (error: unknown) {
      throw mapPersistenceError(error);
    }
  }

  async provision(
    scope: Parameters<PinCredentialRepositoryPort['provision']>[0],
    input: Parameters<PinCredentialRepositoryPort['provision']>[1],
    guard?: PinCredentialMutationCommitGuard,
  ): Promise<PinCredentialRecord> {
    let tenantId;
    try {
      tenantId = parseTenantId(scope?.tenantId);
      parseAccessUserId(input?.userId);
      parsePinCredentialId(input?.credentialId);
      if (
        !canonicalUuid.test(input.clientRequestId) ||
        !validInstant(input.occurredAt) ||
        !validSecretMaterial(input.secret)
      ) {
        throw new TypeError('invalid');
      }
    } catch {
      throw new PinCredentialPersistenceError(
        'PIN_CREDENTIAL_INPUT_INVALID',
      );
    }
    const occurredAt = new Date(input.occurredAt);
    try {
      return await this.executeTransaction(async (transaction, transactionContext) => {
          if (guard && !await guard.confirmCurrent(transactionContext)) {
            throw new PinCredentialPersistenceError('PIN_CREDENTIAL_AUTHORIZATION_CHANGED');
          }
          await transaction
            .insertInto('access_pin_eligibility_tenant_guards')
            .values({ tenant_id: tenantId, created_at: occurredAt })
            .onConflict((conflict) => conflict.column('tenant_id').doNothing())
            .execute();
          await transaction
            .selectFrom('access_pin_eligibility_tenant_guards')
            .select('tenant_id')
            .where('tenant_id', '=', tenantId)
            .forUpdate()
            .executeTakeFirstOrThrow();
          const prior = await transaction
            .selectFrom('access_pin_credential_commands')
            .selectAll()
            .where('tenant_id', '=', tenantId)
            .where('client_request_id', '=', input.clientRequestId)
            .executeTakeFirst();
          if (prior) return replayCommand(prior, input);

          const row = await transaction
            .insertInto('access_pin_credentials')
            .values({
              tenant_id: tenantId,
              user_id: input.userId,
              credential_id: input.credentialId,
              status: 'active',
              algorithm: input.secret.algorithm,
              profile_version: input.secret.profileVersion,
              pepper_version: input.secret.pepperVersion,
              memory_kib: input.secret.memoryKiB,
              passes: input.secret.passes,
              parallelism: input.secret.parallelism,
              salt: input.secret.salt,
              verifier: input.secret.verifier,
              lookup_digest: input.secret.lookupDigest,
              credential_version: 0,
              consecutive_failures: 0,
              locked_until: null,
              created_at: occurredAt,
              updated_at: occurredAt,
              revoked_at: null,
            })
            .onConflict((conflict) => conflict.doNothing())
            .returningAll()
            .executeTakeFirst();

          if (!row) {
            const concurrent = await transaction
              .selectFrom('access_pin_credential_commands')
              .selectAll()
              .where('tenant_id', '=', tenantId)
              .where('client_request_id', '=', input.clientRequestId)
              .executeTakeFirst();
            if (concurrent) return replayCommand(concurrent, input);
            throw new PinCredentialPersistenceError('PIN_CREDENTIAL_EXISTS');
          }

          const command = await transaction
            .insertInto('access_pin_credential_commands')
            .values({
              tenant_id: tenantId,
              client_request_id: input.clientRequestId,
              user_id: input.userId,
              credential_id: input.credentialId,
              command_type: 'provision',
              request_fingerprint: input.secret.requestFingerprint,
              result_status: 'active',
              result_credential_version: 0,
              result_created_at: occurredAt,
              result_updated_at: occurredAt,
              applied_at: occurredAt,
            })
            .onConflict((conflict) =>
              conflict.columns(['tenant_id', 'client_request_id']).doNothing(),
            )
            .returningAll()
            .executeTakeFirst();
          if (!command) {
            const concurrent = await transaction
              .selectFrom('access_pin_credential_commands')
              .selectAll()
              .where('tenant_id', '=', tenantId)
              .where('client_request_id', '=', input.clientRequestId)
              .executeTakeFirstOrThrow();
            return replayCommand(concurrent, input);
          }
          return mapCredential(row);
        });
    } catch (error: unknown) {
      throw mapPersistenceError(error);
    }
  }

  async replace(
    scope: Parameters<PinCredentialRepositoryPort['replace']>[0],
    input: Parameters<PinCredentialRepositoryPort['replace']>[1],
    guard?: PinCredentialMutationCommitGuard,
  ): Promise<PinCredentialRecord> {
    let tenantId;
    try {
      tenantId = parseTenantId(scope?.tenantId);
      parseAccessUserId(input?.userId);
      if (
        !canonicalUuid.test(input?.clientRequestId ?? '') ||
        !validInstant(input?.occurredAt) ||
        !validSecretMaterial(input.secret)
      ) throw new Error('invalid');
    } catch { throw new PinCredentialPersistenceError('PIN_CREDENTIAL_INPUT_INVALID'); }
    const occurredAt = new Date(input.occurredAt);
    try {
      return await this.executeTransaction(async (transaction, transactionContext) => {
        if (guard && !await guard.confirmCurrent(transactionContext)) {
          throw new PinCredentialPersistenceError('PIN_CREDENTIAL_AUTHORIZATION_CHANGED');
        }
        await transaction
          .insertInto('access_pin_eligibility_tenant_guards')
          .values({ tenant_id: tenantId, created_at: occurredAt })
          .onConflict((conflict) => conflict.column('tenant_id').doNothing())
          .execute();
        await transaction
          .selectFrom('access_pin_eligibility_tenant_guards')
          .select('tenant_id')
          .where('tenant_id', '=', tenantId)
          .forUpdate()
          .executeTakeFirstOrThrow();
        const prior = await transaction
          .selectFrom('access_pin_credential_commands')
          .selectAll()
          .where('tenant_id', '=', tenantId)
          .where('client_request_id', '=', input.clientRequestId)
          .executeTakeFirst();
        if (prior) return replayReplacement(prior, input);
        const current = await transaction.selectFrom('access_pin_credentials').selectAll()
          .where('tenant_id', '=', tenantId).where('user_id', '=', input.userId).where('status', '=', 'active').executeTakeFirst();
        if (!current) throw new PinCredentialPersistenceError('PIN_CREDENTIAL_USER_INVALID');
        const row = await transaction.updateTable('access_pin_credentials').set({
          algorithm: input.secret.algorithm, profile_version: input.secret.profileVersion, pepper_version: input.secret.pepperVersion,
          memory_kib: input.secret.memoryKiB, passes: input.secret.passes, parallelism: input.secret.parallelism,
          salt: input.secret.salt, verifier: input.secret.verifier, credential_version: current.credential_version + 1,
          lookup_digest: input.secret.lookupDigest,
          consecutive_failures: 0, locked_until: null, updated_at: occurredAt,
        }).where('tenant_id', '=', tenantId).where('user_id', '=', input.userId)
          .where('credential_version', '=', current.credential_version).where('status', '=', 'active').returningAll().executeTakeFirst();
        if (!row) throw new PinCredentialPersistenceError('PIN_CREDENTIAL_PERSISTENCE_FAILED');
        const command = await transaction
          .insertInto('access_pin_credential_commands')
          .values({
            tenant_id: tenantId,
            client_request_id: input.clientRequestId,
            user_id: row.user_id,
            credential_id: row.credential_id,
            command_type: 'replace',
            request_fingerprint: input.secret.requestFingerprint,
            result_status: 'active',
            result_credential_version: row.credential_version,
            result_created_at: row.created_at,
            result_updated_at: row.updated_at,
            applied_at: occurredAt,
          })
          .returningAll()
          .executeTakeFirstOrThrow();
        return mapCommand(command);
      });
    } catch (error: unknown) { throw mapPersistenceError(error); }
  }

  async #reserveAttempt(
    context: Parameters<PinCredentialRepositoryPort['authenticateAttempt']>[0],
    rateLimitPrincipalId: string,
    occurredAt: Date,
  ): Promise<boolean> {
    return this.execute(async (database: AccessExecutor) =>
      database.transaction().execute(async (transaction) => {
        await transaction
          .insertInto('access_pin_attempt_station_guards')
          .values({
            tenant_id: context.tenantId,
            station_id: context.stationId,
            created_at: occurredAt,
            updated_at: occurredAt,
          })
          .onConflict((conflict) => conflict.doNothing())
          .execute();
        await transaction
          .selectFrom('access_pin_attempt_station_guards')
          .select('station_id')
          .where('tenant_id', '=', context.tenantId)
          .where('station_id', '=', context.stationId)
          .forUpdate()
          .executeTakeFirstOrThrow();
        await transaction
          .deleteFrom('access_pin_attempt_limits')
          .where('tenant_id', '=', context.tenantId)
          .where('station_id', '=', context.stationId)
          .where(
            'window_started_at',
            '<=',
            new Date(occurredAt.getTime() - rateWindowMs),
          )
          .execute();
        const activePrincipalCount = await transaction
          .selectFrom('access_pin_attempt_limits')
          .select(({ fn }) => fn.countAll<number>().as('count'))
          .where('tenant_id', '=', context.tenantId)
          .where('station_id', '=', context.stationId)
          .executeTakeFirstOrThrow();
        if (Number(activePrincipalCount.count) >= maxRatePrincipalsPerStation) {
          return false;
        }
        await transaction
          .insertInto('access_pin_attempt_limits')
          .values({
            tenant_id: context.tenantId,
            station_id: context.stationId,
            rate_principal_id: rateLimitPrincipalId,
            attempt_count: 0,
            window_started_at: occurredAt,
            blocked_until: null,
            updated_at: occurredAt,
          })
          .onConflict((conflict) => conflict.doNothing())
          .execute();
        let limit = await transaction
          .selectFrom('access_pin_attempt_limits')
          .selectAll()
          .where('tenant_id', '=', context.tenantId)
          .where('station_id', '=', context.stationId)
          .where('rate_principal_id', '=', rateLimitPrincipalId)
          .forUpdate()
          .executeTakeFirstOrThrow();
        const windowEnd = new Date(
          limit.window_started_at.getTime() + rateWindowMs,
        );
        if (occurredAt.getTime() >= windowEnd.getTime()) {
          limit = {
            ...limit,
            attempt_count: 0,
            window_started_at: occurredAt,
            blocked_until: null,
            updated_at: occurredAt,
          };
        }
        if (
          limit.attempt_count >= 5 ||
          (limit.blocked_until !== null && limit.blocked_until > occurredAt)
        ) {
          return false;
        }
        const next = limit.attempt_count + 1;
        const activeWindowEnd = new Date(
          limit.window_started_at.getTime() + rateWindowMs,
        );
        await transaction
          .updateTable('access_pin_attempt_limits')
          .set({
            attempt_count: next,
            window_started_at: limit.window_started_at,
            blocked_until: next === 5 ? activeWindowEnd : null,
            updated_at: occurredAt,
          })
          .where('tenant_id', '=', context.tenantId)
          .where('station_id', '=', context.stationId)
          .where('rate_principal_id', '=', rateLimitPrincipalId)
          .executeTakeFirst();
        return true;
      }),
    );
  }

  async #recordFailure(
    tenantId: string,
    userId: string,
    credentialVersion: number,
    occurredAt: Date,
  ): Promise<void> {
    await this.execute(async (database: AccessExecutor) =>
      database.transaction().execute(async (transaction) => {
        const current = await transaction
          .selectFrom('access_pin_credentials')
          .selectAll()
          .where('tenant_id', '=', tenantId)
          .where('user_id', '=', userId)
          .forUpdate()
          .executeTakeFirst();
        if (
          !current ||
          current.status !== 'active' ||
          current.credential_version !== credentialVersion ||
          (current.locked_until !== null && current.locked_until > occurredAt)
        ) {
          return;
        }
        const expired =
          current.locked_until !== null && current.locked_until <= occurredAt;
        const failures = Math.min(
          5,
          (expired ? 0 : current.consecutive_failures) + 1,
        );
        await transaction
          .updateTable('access_pin_credentials')
          .set({
            consecutive_failures: failures,
            locked_until:
              failures === 5
                ? new Date(occurredAt.getTime() + credentialLockMs)
                : null,
            updated_at: occurredAt,
          })
          .where('tenant_id', '=', tenantId)
          .where('user_id', '=', userId)
          .where('credential_version', '=', credentialVersion)
          .where('status', '=', 'active')
          .executeTakeFirst();
      }),
    );
  }

  async #recordSuccess(
    tenantId: string,
    userId: string,
    credentialVersion: number,
    occurredAt: Date,
  ): Promise<boolean> {
    return this.execute(async (database: AccessExecutor) => {
      const row = await database
        .updateTable('access_pin_credentials')
        .set({
          consecutive_failures: 0,
          locked_until: null,
          updated_at: occurredAt,
        })
        .where('tenant_id', '=', tenantId)
        .where('user_id', '=', userId)
        .where('credential_version', '=', credentialVersion)
        .where('status', '=', 'active')
        .where((expression) =>
          expression.or([
            expression('locked_until', 'is', null),
            expression('locked_until', '<=', occurredAt),
          ]),
        )
        .returning('credential_version')
        .executeTakeFirst();
      return row !== undefined;
    });
  }

  async authenticateAttempt(
    context: Parameters<PinCredentialRepositoryPort['authenticateAttempt']>[0],
    input: Parameters<PinCredentialRepositoryPort['authenticateAttempt']>[1],
    verify: Parameters<PinCredentialRepositoryPort['authenticateAttempt']>[2],
  ): Promise<PinAttemptResult> {
    if (
      !isTrustedStationContext(context) ||
      !validInstant(input?.occurredAt) ||
      !canonicalUuid.test(input?.rateLimitPrincipalId ?? '')
    ) {
      return Object.freeze({ status: 'denied' });
    }
    let userId;
    try {
      userId = parseAccessUserId(input.userId);
    } catch {
      return Object.freeze({ status: 'denied' });
    }
    const occurredAt = new Date(input.occurredAt);
    try {
      const reserved = await this.#reserveAttempt(
        context,
        input.rateLimitPrincipalId,
        occurredAt,
      );
      if (!reserved) {
        return Object.freeze({ status: 'temporarily-unavailable' });
      }
      const credential = await this.execute(async (database: AccessExecutor) =>
        database
          .selectFrom('access_pin_credentials')
          .selectAll()
          .where('tenant_id', '=', context.tenantId)
          .where('user_id', '=', userId)
          .executeTakeFirst(),
      );
      const canVerify =
        input.userEligible === true &&
        credential?.status === 'active' &&
        (credential.locked_until === null || credential.locked_until <= occurredAt);
      let verified = false;
      try {
        verified = await verify(
          canVerify && credential ? storedVerifier(credential) : null,
        );
      } catch {
        return Object.freeze({ status: 'temporarily-unavailable' });
      }
      if (!canVerify || !credential || !verified) {
        if (canVerify && credential) {
          await this.#recordFailure(
            context.tenantId,
            userId,
            credential.credential_version,
            occurredAt,
          );
        }
        return Object.freeze({ status: 'denied' });
      }
      const committed = await this.#recordSuccess(
        context.tenantId,
        userId,
        credential.credential_version,
        occurredAt,
      );
      return committed
        ? Object.freeze({
            status: 'authenticated',
            credentialVersion: credential.credential_version,
          })
        : Object.freeze({ status: 'denied' });
    } catch {
      return Object.freeze({ status: 'temporarily-unavailable' });
    }
  }

  async authenticatePinOnlyAttempt(
    context: Parameters<PinCredentialRepositoryPort['authenticatePinOnlyAttempt']>[0],
    input: Parameters<PinCredentialRepositoryPort['authenticatePinOnlyAttempt']>[1],
    verify: Parameters<PinCredentialRepositoryPort['authenticatePinOnlyAttempt']>[2],
  ): Promise<PinOnlyAttemptResult> {
    if (
      !isTrustedStationContext(context) ||
      !validInstant(input?.occurredAt) ||
      !canonicalUuid.test(input?.rateLimitPrincipalId ?? '') ||
      !(input?.lookupDigest instanceof Uint8Array) ||
      input.lookupDigest.byteLength !== 32 ||
      !Array.isArray(input.eligibleUserIds) ||
      input.eligibleUserIds.length > 1_024
    ) {
      return Object.freeze({ status: 'denied' });
    }
    let eligibleUserIds;
    try {
      eligibleUserIds = [...new Set(input.eligibleUserIds.map(parseAccessUserId))];
      if (eligibleUserIds.length !== input.eligibleUserIds.length) {
        return Object.freeze({ status: 'denied' });
      }
    } catch {
      return Object.freeze({ status: 'denied' });
    }
    const occurredAt = new Date(input.occurredAt);
    try {
      const reserved = await this.#reserveAttempt(
        context,
        input.rateLimitPrincipalId,
        occurredAt,
      );
      if (!reserved) return Object.freeze({ status: 'temporarily-unavailable' });

      const matches = eligibleUserIds.length === 0
        ? []
        : await this.execute((database: AccessExecutor) =>
            database
              .selectFrom('access_pin_credentials')
              .selectAll()
              .where('tenant_id', '=', context.tenantId)
              .where('user_id', 'in', eligibleUserIds)
              .where('status', '=', 'active')
              .where('lookup_digest', '=', input.lookupDigest)
              .orderBy('user_id', 'asc')
              .limit(2)
              .execute(),
          );
      if (matches.length !== 1) {
        await verify(eligibleUserIds[0] ?? dummyPinUserId, null);
        return Object.freeze({ status: 'denied' });
      }
      const credential = matches[0]!;
      const canVerify =
        credential.locked_until === null || credential.locked_until <= occurredAt;
      const verified = await verify(
        parseAccessUserId(credential.user_id),
        canVerify ? storedVerifier(credential) : null,
      );
      if (!canVerify || !verified) {
        if (canVerify) {
          await this.#recordFailure(
            context.tenantId,
            credential.user_id,
            credential.credential_version,
            occurredAt,
          );
        }
        return Object.freeze({ status: 'denied' });
      }
      const committed = await this.#recordSuccess(
        context.tenantId,
        credential.user_id,
        credential.credential_version,
        occurredAt,
      );
      return committed
        ? Object.freeze({
            status: 'authenticated',
            userId: parseAccessUserId(credential.user_id),
            credentialVersion: credential.credential_version,
          })
        : Object.freeze({ status: 'denied' });
    } catch {
      return Object.freeze({ status: 'temporarily-unavailable' });
    }
  }
}

export function createKyselyPinCredentialRepository(
  connection: InternalDatabasePersistenceConnection,
): PinCredentialRepositoryPort {
  let transactionTail = Promise.resolve();
  return new KyselyPinCredentialRepository(
    (operation) => useDatabasePersistenceExecutor(connection, 'access', operation),
    async (operation) => {
      let releaseTurn!: () => void;
      const previousTurn = transactionTail;
      transactionTail = new Promise<void>((resolve) => { releaseTurn = resolve; });
      await previousTurn;
      let operationFailed = false;
      let operationError: unknown;
      try {
        return await runInTransaction(
          connection as unknown as DatabaseConnection,
          { isolationLevel: 'serializable' },
          async (transactionContext) => {
            try {
              return await useTransactionalDatabasePersistenceExecutor(
                transactionContext,
                'access',
                (executor) => operation(executor, transactionContext),
              );
            } catch (error: unknown) {
              operationFailed = true;
              operationError = error;
              throw error;
            }
          },
        );
      } catch (error: unknown) {
        if (operationFailed) throw operationError;
        throw error;
      } finally {
        releaseTurn();
      }
    },
  );
}

export type KyselyPinCredentialRepositoryFactory =
  typeof createKyselyPinCredentialRepository;
