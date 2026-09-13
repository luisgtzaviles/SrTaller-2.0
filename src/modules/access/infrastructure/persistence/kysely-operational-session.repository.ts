import type { Transaction } from 'kysely';

import type { ApplicationDatabaseConnection } from '../../../../infrastructure/runtime/index.js';
import {
  bindDatabaseTransactionContext,
  databaseTransactionCapability,
  releaseDatabaseTransactionContext,
} from '../../../../infrastructure/database/database-transaction-capability.js';
import type { DatabaseSchema, AccessOperationalSessionRow } from '../../../../infrastructure/database/database-types.js';
import { useDatabasePersistenceExecutor } from '../../../../infrastructure/database/database-persistence-capability.js';
import type { TrustedStationContext } from '../../../stations/index.js';
import type { TrustedStationAdmissionValidator } from '../../../stations/index.js';
import type { AuthenticationUserAdmissionValidator } from '../../../users/index.js';
import type {
  OperationalSessionRepositoryPort,
} from '../../application/ports/operational-session-repository.port.js';
import {
  OperationalSessionAdmissionError,
} from '../../application/ports/operational-session-repository.port.js';
import type {
  OperationalSessionRecord,
} from '../../domain/operational-session.js';
import {
  OPERATIONAL_SESSION_ACTIVITY_TOUCH_INTERVAL_MS,
  OPERATIONAL_SESSION_IDLE_MS,
} from '../../domain/operational-session.js';
import type { CapabilityCode } from '../../domain/capability.js';
import { KyselyOperationalAuthorizationCommitGuard } from './kysely-operational-authorization-commit.guard.js';

type AccessTables = Pick<DatabaseSchema,
  | 'access_role_assignments'
  | 'access_roles'
  | 'access_operational_session_station_guards'
  | 'access_operational_sessions'
  | 'access_pin_credentials'>;

function map(row: AccessOperationalSessionRow): OperationalSessionRecord {
  return Object.freeze({
    sessionId: row.session_id,
    tenantId: row.tenant_id,
    branchId: row.branch_id,
    stationId: row.station_id,
    branchAdmissionRevision: row.branch_admission_revision,
    stationAdmissionRevision: row.station_admission_revision,
    stationBindingAdmissionRevision: row.station_binding_admission_revision,
    stationCredentialAdmissionRevision: row.station_credential_admission_revision,
    userId: row.user_id,
    userVersion: row.user_version,
    userAdmissionRevision: row.user_admission_revision,
    credentialVersion: row.credential_version,
    status: row.status,
    version: row.version,
    issuedAt: row.issued_at.toISOString(),
    lastActivityAt: row.last_activity_at.toISOString(),
    expiresAt: row.expires_at.toISOString(),
    endedAt: row.ended_at?.toISOString() ?? null,
  });
}

export class KyselyOperationalSessionRepository
  implements OperationalSessionRepositoryPort {
  readonly #commitGuard: KyselyOperationalAuthorizationCommitGuard;

  constructor(
    private readonly connection: ApplicationDatabaseConnection,
    private readonly stations: TrustedStationAdmissionValidator,
    private readonly users: AuthenticationUserAdmissionValidator,
  ) {
    this.#commitGuard = new KyselyOperationalAuthorizationCommitGuard(
      stations,
      users,
    );
  }

  confirmCurrent(
    station: TrustedStationContext,
    session: import('../../domain/operational-session.js').OperationalSessionContext,
    capability: CapabilityCode,
    transactionContext: object,
  ): Promise<boolean> {
    return this.#commitGuard.confirmCurrent(
      station,
      session,
      capability,
      transactionContext,
    );
  }

  confirmTemporalCurrent(
    station: TrustedStationContext,
    session: import('../../domain/operational-session.js').OperationalSessionContext,
    transactionContext: object,
  ): Promise<boolean> {
    return this.#commitGuard.confirmTemporalCurrent(
      station,
      session,
      transactionContext,
    );
  }

  async createForProfile(
    context: TrustedStationContext,
    input: Parameters<OperationalSessionRepositoryPort['createForProfile']>[1],
  ) {
    for (let attempt = 0; attempt < 3; attempt += 1) {
      try {
        return await this.#inTransaction(async (database, transactionContext) => {
          const occurredAt = new Date(input.occurredAt);
          const idleCutoff = new Date(
            occurredAt.getTime() - OPERATIONAL_SESSION_IDLE_MS,
          );
          const trustedStation = await this.stations
            .validateTrustedStationAdmission(
              context,
              {
                branchRevision: context.branchAdmissionRevision,
                stationRevision: context.stationAdmissionRevision,
                bindingRevision: context.stationBindingAdmissionRevision,
                credentialRevision: context.stationCredentialAdmissionRevision,
              },
              transactionContext,
            );
          const trustedUser = trustedStation
            ? await this.users.validateAuthenticationUserAdmission(
              { tenantId: context.tenantId },
              input.userId,
              input.userVersion,
              input.userAdmissionRevision,
              transactionContext,
              )
            : null;
          if (!trustedStation || !trustedUser) {
            throw new OperationalSessionAdmissionError();
          }

          if (input.expectedSessionId !== null) {
            const replaced = await database
              .selectFrom('access_operational_sessions')
              .select(['session_id', 'version'])
              .where('tenant_id', '=', context.tenantId)
              .where('branch_id', '=', context.branchId)
              .where('station_id', '=', context.stationId)
              .where('station_credential_id', '=', context.stationCredentialId)
              .where('session_id', '=', input.expectedSessionId)
              .where('status', '=', 'active')
              .where('expires_at', '>', occurredAt)
              .where('last_activity_at', '>', idleCutoff)
              .forUpdate()
              .executeTakeFirst();
            if (!replaced) throw new OperationalSessionAdmissionError();

            const result = await database
              .updateTable('access_operational_sessions')
              .set((expression) => ({
                status: 'replaced',
                ended_at: expression.fn('greatest', [
                  'issued_at',
                  expression.val(occurredAt),
                ]),
                version: expression('version', '+', 1),
              }))
              .where('tenant_id', '=', context.tenantId)
              .where('session_id', '=', replaced.session_id)
              .where('status', '=', 'active')
              .where('version', '=', replaced.version)
              .executeTakeFirst();
            if (Number(result.numUpdatedRows) !== 1) {
              throw new OperationalSessionAdmissionError();
            }
          }

          const row = await database
            .insertInto('access_operational_sessions')
            .values({
              tenant_id: context.tenantId,
              session_id: input.sessionId,
              branch_id: context.branchId,
              station_id: context.stationId,
              station_credential_id: context.stationCredentialId,
              branch_admission_revision: trustedStation.branchRevision,
              station_admission_revision: trustedStation.stationRevision,
              station_binding_admission_revision: trustedStation.bindingRevision,
              station_credential_admission_revision: trustedStation.credentialRevision,
              user_id: input.userId,
              user_version: input.userVersion,
              user_admission_revision: trustedUser.admissionRevision,
              credential_version: input.credentialVersion,
              token_verifier: input.bearerVerifier,
              csrf_verifier: input.csrfVerifier,
              status: 'active',
              version: 0,
              issued_at: occurredAt,
              last_activity_at: occurredAt,
              expires_at: new Date(input.expiresAt),
              ended_at: null,
            })
            .returningAll()
            .executeTakeFirstOrThrow();
          return map(row);
        });
      } catch (error: unknown) {
        const code = typeof error === 'object' && error !== null && 'code' in error
          ? String(error.code)
          : '';
        const constraint = typeof error === 'object' && error !== null && 'constraint' in error
          ? String(error.constraint)
          : '';
        if (
          code === '23514' &&
          constraint === 'access_operational_sessions_admission_ck'
        ) {
          throw new OperationalSessionAdmissionError();
        }
        if (attempt === 2 || (code !== '40001' && code !== '40P01')) throw error;
      }
    }
    throw new Error('Operational Session transaction retry exhausted.');
  }

  async findByBearerVerifier(context: TrustedStationContext, bearerVerifier: Uint8Array) {
    return useDatabasePersistenceExecutor(this.connection, 'access', async (database) => {
      const row = await database.selectFrom('access_operational_sessions')
        .selectAll()
        .where('tenant_id', '=', context.tenantId)
        .where('branch_id', '=', context.branchId)
        .where('station_id', '=', context.stationId)
        .where('station_credential_id', '=', context.stationCredentialId)
        .where('token_verifier', '=', bearerVerifier)
        .executeTakeFirst();
      return row ? Object.freeze({ ...map(row), csrfVerifier: row.csrf_verifier }) : null;
    });
  }

  async confirmActive(
    context: TrustedStationContext,
    input: Parameters<OperationalSessionRepositoryPort['confirmActive']>[1],
  ) {
    for (let attempt = 0; attempt < 3; attempt += 1) {
      try {
        return await this.#inTransaction(async (database, transactionContext) => {
          const candidate = await database
            .selectFrom('access_operational_sessions')
            .selectAll()
            .where('tenant_id', '=', context.tenantId)
            .where('branch_id', '=', context.branchId)
            .where('station_id', '=', context.stationId)
            .where('station_credential_id', '=', context.stationCredentialId)
            .where('session_id', '=', input.sessionId)
            .where('status', '=', 'active')
            .where('version', '=', input.expectedVersion)
            .executeTakeFirst();
          if (!candidate) return null;

          const trustedStation = await this.stations
            .validateTrustedStationAdmission(
              context,
              {
                branchRevision: candidate.branch_admission_revision,
                stationRevision: candidate.station_admission_revision,
                bindingRevision: candidate.station_binding_admission_revision,
                credentialRevision: candidate.station_credential_admission_revision,
              },
              transactionContext,
            );
          const trustedUser = trustedStation
            ? await this.users.validateAuthenticationUserAdmission(
                { tenantId: context.tenantId },
                candidate.user_id,
                candidate.user_version,
                candidate.user_admission_revision,
                transactionContext,
              )
            : null;
          const accessValid = trustedUser
            ? await this.#accessAdmissionIsValid(database, candidate)
            : false;

          const locked = await database
            .selectFrom('access_operational_sessions')
            .selectAll()
            .where('tenant_id', '=', context.tenantId)
            .where('branch_id', '=', context.branchId)
            .where('station_id', '=', context.stationId)
            .where('station_credential_id', '=', context.stationCredentialId)
            .where('session_id', '=', input.sessionId)
            .where('status', '=', 'active')
            .where('version', '=', input.expectedVersion)
            .forUpdate()
            .executeTakeFirst();
          if (!locked) return null;

          if (!trustedStation || !trustedUser || !accessValid) {
            await database
              .updateTable('access_operational_sessions')
              .set((expression) => ({
                status: 'invalidated',
                ended_at: expression.fn('greatest', [
                  'issued_at',
                  expression.val(new Date(input.occurredAt)),
                ]),
                version: expression('version', '+', 1),
              }))
              .where('tenant_id', '=', context.tenantId)
              .where('session_id', '=', input.sessionId)
              .where('status', '=', 'active')
              .where('version', '=', input.expectedVersion)
              .execute();
            return null;
          }

          if (!input.recordActivity) {
            return Object.freeze({ ...map(locked), displayName: trustedUser.user.displayName });
          }
          const occurredAt = new Date(input.occurredAt);
          if (
            locked.last_activity_at.getTime() >=
              occurredAt.getTime() - OPERATIONAL_SESSION_ACTIVITY_TOUCH_INTERVAL_MS
          ) {
            return Object.freeze({ ...map(locked), displayName: trustedUser.user.displayName });
          }
          const current = await database
            .updateTable('access_operational_sessions')
            .set((expression) => ({
              last_activity_at: expression.fn('greatest', [
                'last_activity_at',
                expression.val(occurredAt),
              ]),
              version: expression('version', '+', 1),
            }))
            .where('tenant_id', '=', context.tenantId)
            .where('session_id', '=', input.sessionId)
            .where('status', '=', 'active')
            .where('version', '=', input.expectedVersion)
            .returningAll()
            .executeTakeFirst();
          return current
            ? Object.freeze({ ...map(current), displayName: trustedUser.user.displayName })
            : null;
        });
      } catch (error: unknown) {
        const code = typeof error === 'object' && error !== null && 'code' in error
          ? String(error.code)
          : '';
        if (attempt === 2 || (code !== '40001' && code !== '40P01')) throw error;
      }
    }
    return null;
  }

  async close(context: TrustedStationContext, input: Parameters<OperationalSessionRepositoryPort['close']>[1]) {
    return useDatabasePersistenceExecutor(this.connection, 'access', async (database) => {
      const result = await database.updateTable('access_operational_sessions')
        .set((expression) => ({
          status: input.status,
          ended_at: expression.fn('greatest', [
            'issued_at',
            expression.val(new Date(input.occurredAt)),
          ]),
          version: expression('version', '+', 1),
        }))
        .where('tenant_id', '=', context.tenantId)
        .where('branch_id', '=', context.branchId)
        .where('station_id', '=', context.stationId)
        .where('station_credential_id', '=', context.stationCredentialId)
        .where('session_id', '=', input.sessionId)
        .where('status', '=', 'active')
        .where('version', '=', input.expectedVersion)
        .executeTakeFirst();
      return Number(result.numUpdatedRows) === 1;
    });
  }

  async closeAuthenticated(
    context: TrustedStationContext,
    input: Parameters<OperationalSessionRepositoryPort['closeAuthenticated']>[1],
  ) {
    return useDatabasePersistenceExecutor(this.connection, 'access', async (database) => {
      const result = await database.updateTable('access_operational_sessions')
        .set((expression) => ({
          status: input.status,
          ended_at: expression.fn('greatest', [
            'issued_at',
            expression.val(new Date(input.occurredAt)),
          ]),
          version: expression('version', '+', 1),
        }))
        .where('tenant_id', '=', context.tenantId)
        .where('branch_id', '=', context.branchId)
        .where('station_id', '=', context.stationId)
        .where('station_credential_id', '=', context.stationCredentialId)
        .where('token_verifier', '=', input.bearerVerifier)
        .where('csrf_verifier', '=', input.csrfVerifier)
        .where('status', '=', 'active')
        .executeTakeFirst();
      return Number(result.numUpdatedRows) === 1;
    });
  }

  async invalidateOne(
    scope: Parameters<OperationalSessionRepositoryPort['invalidateOne']>[0],
    input: Parameters<OperationalSessionRepositoryPort['invalidateOne']>[1],
  ) {
    return useDatabasePersistenceExecutor(this.connection, 'access', async (database) => {
      const result = await database.updateTable('access_operational_sessions')
        .set((expression) => ({
          status: 'invalidated',
          ended_at: expression.fn('greatest', [
            'issued_at',
            expression.val(new Date(input.occurredAt)),
          ]),
          version: expression('version', '+', 1),
        }))
        .where('tenant_id', '=', scope.tenantId)
        .where('session_id', '=', input.sessionId)
        .where('status', '=', 'active')
        .where('version', '=', input.expectedVersion)
        .executeTakeFirst();
      return Number(result.numUpdatedRows) === 1;
    });
  }

  async invalidateByUser(
    scope: Parameters<OperationalSessionRepositoryPort['invalidateByUser']>[0],
    input: Parameters<OperationalSessionRepositoryPort['invalidateByUser']>[1],
  ) {
    return useDatabasePersistenceExecutor(this.connection, 'access', async (database) => {
      const result = await database.updateTable('access_operational_sessions')
        .set((expression) => ({
          status: 'invalidated',
          ended_at: expression.fn('greatest', [
            'issued_at',
            expression.val(new Date(input.occurredAt)),
          ]),
          version: expression('version', '+', 1),
        }))
        .where('tenant_id', '=', scope.tenantId)
        .where('user_id', '=', input.userId)
        .where('status', '=', 'active')
        .executeTakeFirst();
      return Number(result.numUpdatedRows);
    });
  }

  async invalidateByStation(
    scope: Parameters<OperationalSessionRepositoryPort['invalidateByStation']>[0],
    input: Parameters<OperationalSessionRepositoryPort['invalidateByStation']>[1],
  ) {
    return useDatabasePersistenceExecutor(this.connection, 'access', async (database) => {
      const result = await database.updateTable('access_operational_sessions')
        .set((expression) => ({
          status: 'invalidated',
          ended_at: expression.fn('greatest', [
            'issued_at',
            expression.val(new Date(input.occurredAt)),
          ]),
          version: expression('version', '+', 1),
        }))
        .where('tenant_id', '=', scope.tenantId)
        .where('station_id', '=', input.stationId)
        .where('status', '=', 'active')
        .executeTakeFirst();
      return Number(result.numUpdatedRows);
    });
  }

  async invalidateByCredentialVersion(
    scope: Parameters<OperationalSessionRepositoryPort['invalidateByCredentialVersion']>[0],
    input: Parameters<OperationalSessionRepositoryPort['invalidateByCredentialVersion']>[1],
  ) {
    return useDatabasePersistenceExecutor(this.connection, 'access', async (database) => {
      const result = await database.updateTable('access_operational_sessions')
        .set((expression) => ({
          status: 'invalidated',
          ended_at: expression.fn('greatest', [
            'issued_at',
            expression.val(new Date(input.occurredAt)),
          ]),
          version: expression('version', '+', 1),
        }))
        .where('tenant_id', '=', scope.tenantId)
        .where('user_id', '=', input.userId)
        .where('credential_version', '=', input.credentialVersion)
        .where('status', '=', 'active')
        .executeTakeFirst();
      return Number(result.numUpdatedRows);
    });
  }

  async isPinCredentialCurrent(context: TrustedStationContext, userId: string, credentialVersion: number) {
    return useDatabasePersistenceExecutor(this.connection, 'access', async (database) => {
      const row = await database.selectFrom('access_pin_credentials')
        .select('user_id')
        .where('tenant_id', '=', context.tenantId)
        .where('user_id', '=', userId)
        .where('status', '=', 'active')
        .where('credential_version', '=', credentialVersion)
        .executeTakeFirst();
      return row !== undefined;
    });
  }


  async #accessAdmissionIsValid(
    database: Transaction<AccessTables>,
    session: AccessOperationalSessionRow,
  ): Promise<boolean> {
    const pin = await database
      .selectFrom('access_pin_credentials')
      .select('user_id')
      .where('tenant_id', '=', session.tenant_id)
      .where('user_id', '=', session.user_id)
      .where('status', '=', 'active')
      .where('revoked_at', 'is', null)
      .where('credential_version', '=', session.credential_version)
      .forShare()
      .executeTakeFirst();
    if (!pin) return false;
    const assignment = await database
      .selectFrom('access_role_assignments')
      .innerJoin('access_roles', (join) => join
        .onRef('access_roles.tenant_id', '=', 'access_role_assignments.tenant_id')
        .onRef('access_roles.role_id', '=', 'access_role_assignments.role_id'))
      .select('access_role_assignments.assignment_id')
      .where('access_role_assignments.tenant_id', '=', session.tenant_id)
      .where('access_role_assignments.user_id', '=', session.user_id)
      .where('access_role_assignments.status', '=', 'active')
      .where('access_role_assignments.revoked_at', 'is', null)
      .where('access_roles.status', '=', 'active')
      .where((expression) => expression.or([
        expression('access_role_assignments.assignment_scope', '=', 'TENANT_WIDE'),
        expression.and([
          expression('access_role_assignments.assignment_scope', '=', 'BRANCH_RESTRICTED'),
          expression('access_role_assignments.branch_id', '=', session.branch_id),
        ]),
      ]))
      .forShare(['access_role_assignments', 'access_roles'])
      .executeTakeFirst();
    return assignment !== undefined;
  }

  #inTransaction<Result>(
    operation: (
      database: Transaction<AccessTables>,
      transactionContext: object,
    ) => Promise<Result>,
  ): Promise<Result> {
    return this.connection[databaseTransactionCapability](
      { isolationLevel: 'serializable', accessMode: 'read write' },
      async (executor) => {
        const transactionContext = Object.freeze({
          kind: 'operational-session-admission',
        });
        bindDatabaseTransactionContext(
          transactionContext,
          executor,
          () => new OperationalSessionAdmissionError(),
        );
        try {
          return await operation(
            executor as unknown as Transaction<AccessTables>,
            transactionContext,
          );
        } finally {
          releaseDatabaseTransactionContext(transactionContext);
        }
      },
    );
  }
}
