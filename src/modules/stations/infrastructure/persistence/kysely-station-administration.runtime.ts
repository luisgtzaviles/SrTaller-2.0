import { createHash, randomBytes, randomUUID, timingSafeEqual } from 'node:crypto';
import { inspect } from 'node:util';

import {
  useDatabasePersistenceExecutor,
  useTransactionalDatabasePersistenceExecutor,
} from '../../../../infrastructure/database/database-persistence-capability.js';
import type { InternalDatabasePersistenceConnection } from '../../../../infrastructure/database/database-persistence-capability.js';
import { runInTransaction } from '../../../../infrastructure/database/transaction-runner.js';
import { parseBranchId } from '../../application/ports/branch-repository.port.js';
import type {
  IssuedStationEnrollment,
  StationAdministrationContext,
  StationAdministrationRuntime,
  StationEnrollmentItem,
  StationInventoryItem,
} from '../../application/station-administration.runtime.js';
import { parseStationDisplayName, parseStationId } from '../../domain/station.js';

export type StationAdministrationErrorCode =
  | 'STATION_NOT_FOUND'
  | 'STATION_ENROLLMENT_NOT_FOUND'
  | 'STATION_INVALID_INPUT'
  | 'STATION_VERSION_CONFLICT'
  | 'STATION_IDEMPOTENCY_CONFLICT'
  | 'STATION_INVALID_TRANSITION'
  | 'STATION_BRANCH_INACTIVE'
  | 'STATION_ACCESS_DENIED'
  | 'STATION_AUTHORITY_CHANGED'
  | 'STATION_CONCURRENCY_CONFLICT';

export class StationAdministrationError extends Error {
  constructor(readonly code: StationAdministrationErrorCode) {
    super(code);
    this.name = 'StationAdministrationError';
  }
  toJSON() { return Object.freeze({ name: this.name, code: this.code }); }
  [inspect.custom]() { return this.toJSON(); }
}

type CommandKind = 'RENAME' | 'ISSUE_ENROLLMENT' | 'CANCEL_ENROLLMENT' | 'UNLINK' | 'INITIATE_RELINK' | 'REVOKE';
type CommandInput = Readonly<{
  clientRequestId: string;
  expectedVersion?: number;
  displayName?: string;
  branchId?: string;
}>;

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/u;
const commandFields = new Set(['clientRequestId', 'expectedVersion', 'displayName', 'branchId']);

function object(value: unknown): Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new StationAdministrationError('STATION_INVALID_INPUT');
  }
  const candidate = value as Record<string, unknown>;
  if (Object.keys(candidate).some((key) => !commandFields.has(key))) {
    throw new StationAdministrationError('STATION_INVALID_INPUT');
  }
  return candidate;
}

function parseCommand(
  value: unknown,
  options: Readonly<{ expectedVersion?: boolean; displayName?: boolean; branchId?: boolean }>,
): CommandInput {
  const candidate = object(value);
  if (typeof candidate.clientRequestId !== 'string' || !uuid.test(candidate.clientRequestId)) {
    throw new StationAdministrationError('STATION_INVALID_INPUT');
  }
  const output: { clientRequestId: string; expectedVersion?: number; displayName?: string; branchId?: string } = {
    clientRequestId: candidate.clientRequestId,
  };
  try {
    if (options.expectedVersion) {
      if (!Number.isSafeInteger(candidate.expectedVersion) || (candidate.expectedVersion as number) < 0) throw new TypeError();
      output.expectedVersion = candidate.expectedVersion as number;
    }
    if (options.displayName) output.displayName = parseStationDisplayName(candidate.displayName);
    if (options.branchId) output.branchId = parseBranchId(candidate.branchId);
  } catch {
    throw new StationAdministrationError('STATION_INVALID_INPUT');
  }
  return Object.freeze(output);
}

function requestDigest(kind: CommandKind, targetId: string | null, input: CommandInput): Uint8Array {
  return createHash('sha256').update(JSON.stringify({ kind, targetId, ...input })).digest();
}

function sameDigest(left: Uint8Array, right: Uint8Array): boolean {
  return left.length === right.length && timingSafeEqual(Buffer.from(left), Buffer.from(right));
}

function stationStatus(value: string): StationInventoryItem['status'] {
  if (value === 'active') return 'ACTIVE';
  if (value === 'unlinked') return 'UNLINKED';
  return 'REVOKED';
}

function challengeStatus(
  status: StationEnrollmentItem['status'],
  expiresAt: Date,
  now: Date,
): StationEnrollmentItem['status'] {
  return status === 'ACTIVE' && expiresAt.getTime() <= now.getTime() ? 'EXPIRED' : status;
}

function manualCode(): Readonly<{ compact: string; presented: string }> {
  const alphabet = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
  const bytes = randomBytes(32);
  let accumulator = 0;
  let bits = 0;
  let compact = '';
  for (const byte of bytes) {
    accumulator = (accumulator << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      bits -= 5;
      compact += alphabet[(accumulator >>> bits) & 31];
    }
    // Keep only the unread tail. This prevents JavaScript's 32-bit bitwise
    // accumulator from discarding entropy across the 32 random bytes.
    accumulator &= bits === 0 ? 0 : (1 << bits) - 1;
  }
  if (bits > 0) compact += alphabet[(accumulator << (5 - bits)) & 31];
  return Object.freeze({ compact, presented: compact.match(/.{1,4}/gu)!.join('-') });
}

function canAccess(context: StationAdministrationContext, branchId: string | null): boolean {
  return context.authorizedBranchIds === null || (
    branchId !== null && context.authorizedBranchIds.includes(branchId)
  );
}

export class KyselyStationAdministrationRuntime implements StationAdministrationRuntime {
  constructor(
    private readonly connection: Parameters<typeof runInTransaction>[0] & InternalDatabasePersistenceConnection,
    private readonly clock: () => Date = () => new Date(),
  ) {}

  async list(context: StationAdministrationContext): Promise<readonly StationInventoryItem[]> {
    return useDatabasePersistenceExecutor(this.connection, 'stations', async (database) => {
      let query = database.selectFrom('stations as station')
        .leftJoin('station_bindings as binding', (join) => join
          .onRef('binding.tenant_id', '=', 'station.tenant_id')
          .onRef('binding.station_id', '=', 'station.station_id')
          .on('binding.revoked_at', 'is', null))
        .leftJoin('branches as branch', (join) => join
          .onRef('branch.tenant_id', '=', 'binding.tenant_id')
          .onRef('branch.branch_id', '=', 'binding.branch_id'))
        .select([
          'station.station_id', 'station.display_name', 'station.status',
          'station.version', 'station.admission_revision', 'station.created_at',
          'station.updated_at', 'station.revoked_at', 'binding.branch_id',
          'branch.display_name as branch_display_name', 'branch.active as branch_active',
        ])
        .where('station.tenant_id', '=', context.tenantId)
        .orderBy('station.display_name')
        .orderBy('station.station_id');
      if (context.authorizedBranchIds !== null) {
        if (context.authorizedBranchIds.length === 0) return Object.freeze([]);
        query = query.where('binding.branch_id', 'in', [...context.authorizedBranchIds]);
      }
      const rows = await query.execute();
      const credentialRows = rows.length === 0 ? [] : await database
        .selectFrom('station_credentials')
        .select(['station_id', 'revoked_at'])
        .where('tenant_id', '=', context.tenantId)
        .where('station_id', 'in', rows.map((row) => row.station_id))
        .orderBy('created_at', 'desc')
        .execute();
      return Object.freeze(rows.map((row) => this.mapStation(row, credentialRows)));
    });
  }

  async read(context: StationAdministrationContext, stationIdValue: unknown): Promise<StationInventoryItem> {
    const stationId = this.stationId(stationIdValue);
    const item = (await this.list(context)).find((candidate) => candidate.stationId === stationId);
    if (!item) throw new StationAdministrationError('STATION_NOT_FOUND');
    return useDatabasePersistenceExecutor(this.connection, 'stations', async (database) => {
      const history = await database.selectFrom('station_bindings as binding')
        .innerJoin('branches as branch', (join) => join
          .onRef('branch.tenant_id', '=', 'binding.tenant_id')
          .onRef('branch.branch_id', '=', 'binding.branch_id'))
        .select(['binding.branch_id', 'branch.display_name', 'binding.created_at', 'binding.revoked_at', 'binding.admission_revision'])
        .where('binding.tenant_id', '=', context.tenantId)
        .where('binding.station_id', '=', stationId)
        .orderBy('binding.created_at', 'desc')
        .orderBy('binding.binding_id')
        .execute();
      return Object.freeze({
        ...item,
        bindingHistory: Object.freeze(history.map((row) => Object.freeze({
          branchId: row.branch_id,
          branchDisplayName: row.display_name,
          linkedAt: row.created_at.toISOString(),
          unlinkedAt: row.revoked_at?.toISOString() ?? null,
          admissionRevision: row.admission_revision,
        }))),
      });
    });
  }

  async listEnrollments(context: StationAdministrationContext): Promise<readonly StationEnrollmentItem[]> {
    return useDatabasePersistenceExecutor(this.connection, 'stations', async (database) => {
      let query = database.selectFrom('station_enrollment_challenges as challenge')
        .innerJoin('branches as branch', (join) => join
          .onRef('branch.tenant_id', '=', 'challenge.tenant_id')
          .onRef('branch.branch_id', '=', 'challenge.target_branch_id'))
        .selectAll('challenge')
        .select('branch.display_name as branch_display_name')
        .where('challenge.tenant_id', '=', context.tenantId)
        .orderBy('challenge.created_at', 'desc');
      if (context.authorizedBranchIds !== null) {
        if (context.authorizedBranchIds.length === 0) return Object.freeze([]);
        query = query.where('challenge.target_branch_id', 'in', [...context.authorizedBranchIds]);
      }
      const now = this.clock();
      return Object.freeze((await query.execute()).map((row) => this.mapChallenge(row, now)));
    });
  }

  async rename(context: StationAdministrationContext, stationIdValue: unknown, value: unknown): Promise<StationInventoryItem> {
    const stationId = this.stationId(stationIdValue);
    const input = parseCommand(value, { expectedVersion: true, displayName: true });
    await this.mutate(context, 'RENAME', stationId, input, async (database, transactionContext, now) => {
      const station = await this.lockStation(database, context, stationId);
      if (!await context.commitGuard.confirmCurrent(transactionContext, station.branch_id ? [station.branch_id] : [])) throw new StationAdministrationError('STATION_AUTHORITY_CHANGED');
      if (station.version !== input.expectedVersion) throw new StationAdministrationError('STATION_VERSION_CONFLICT');
      await database.updateTable('stations').set({ display_name: input.displayName!, version: station.version + 1, updated_at: now })
        .where('tenant_id', '=', context.tenantId).where('station_id', '=', stationId).executeTakeFirstOrThrow();
      await this.audit(database, context, input.clientRequestId, 'STATION_RENAMED', stationId, station.branch_id, station.version + 1, station.admission_revision, now, 1);
      void transactionContext;
      return { stationId, challengeId: null, stationVersion: station.version + 1, challengeVersion: null };
    });
    return this.read(context, stationId);
  }

  async issueEnrollment(context: StationAdministrationContext, value: unknown): Promise<IssuedStationEnrollment> {
    const input = parseCommand(value, { branchId: true, displayName: true });
    return this.issue(context, 'ISSUE_ENROLLMENT', null, input, 'NEW_STATION');
  }

  async cancelEnrollment(context: StationAdministrationContext, challengeIdValue: unknown, value: unknown): Promise<StationEnrollmentItem> {
    const challengeId = this.id(challengeIdValue, 'STATION_ENROLLMENT_NOT_FOUND');
    const input = parseCommand(value, { expectedVersion: true });
    await this.mutate(context, 'CANCEL_ENROLLMENT', challengeId, input, async (database, _transactionContext, now) => {
      const challenge = await database.selectFrom('station_enrollment_challenges').selectAll()
        .where('tenant_id', '=', context.tenantId).where('challenge_id', '=', challengeId).forUpdate().executeTakeFirst();
      if (!challenge || !canAccess(context, challenge.target_branch_id)) throw new StationAdministrationError('STATION_ENROLLMENT_NOT_FOUND');
      if (!await context.commitGuard.confirmCurrent(_transactionContext, [challenge.target_branch_id])) throw new StationAdministrationError('STATION_AUTHORITY_CHANGED');
      if (challenge.version !== input.expectedVersion) throw new StationAdministrationError('STATION_VERSION_CONFLICT');
      if (challenge.status !== 'ACTIVE' || challenge.expires_at.getTime() <= now.getTime()) throw new StationAdministrationError('STATION_INVALID_TRANSITION');
      await database.updateTable('station_enrollment_challenges').set({ status: 'CANCELED', canceled_at: now, updated_at: now, version: challenge.version + 1 })
        .where('tenant_id', '=', context.tenantId).where('challenge_id', '=', challengeId).executeTakeFirstOrThrow();
      await this.audit(database, context, input.clientRequestId, 'STATION_ENROLLMENT_CANCELED', challenge.intended_station_id, challenge.target_branch_id, null, null, now, 1, challengeId);
      return { stationId: challenge.intended_station_id, challengeId, stationVersion: null, challengeVersion: challenge.version + 1 };
    });
    const item = (await this.listEnrollments(context)).find((entry) => entry.challengeId === challengeId);
    if (!item) throw new StationAdministrationError('STATION_ENROLLMENT_NOT_FOUND');
    return item;
  }

  async unlink(context: StationAdministrationContext, stationIdValue: unknown, value: unknown): Promise<StationInventoryItem> {
    const stationId = this.stationId(stationIdValue);
    const input = parseCommand(value, { expectedVersion: true });
    await this.cutTrust(context, 'UNLINK', stationId, input, 'unlinked', 'STATION_UNLINKED');
    return this.readMutationOutcome(context, stationId);
  }

  async initiateRelink(context: StationAdministrationContext, stationIdValue: unknown, value: unknown): Promise<IssuedStationEnrollment> {
    const stationId = this.stationId(stationIdValue);
    const input = parseCommand(value, { expectedVersion: true, branchId: true, displayName: true });
    return this.issue(context, 'INITIATE_RELINK', stationId, input, 'RELINK_STATION');
  }

  async revoke(context: StationAdministrationContext, stationIdValue: unknown, value: unknown): Promise<StationInventoryItem> {
    const stationId = this.stationId(stationIdValue);
    const input = parseCommand(value, { expectedVersion: true });
    await this.cutTrust(context, 'REVOKE', stationId, input, 'revoked', 'STATION_REVOKED');
    return this.readMutationOutcome(context, stationId);
  }

  private async issue(
    context: StationAdministrationContext,
    commandKind: 'ISSUE_ENROLLMENT' | 'INITIATE_RELINK',
    stationId: string | null,
    input: CommandInput,
    kind: 'NEW_STATION' | 'RELINK_STATION',
  ): Promise<IssuedStationEnrollment> {
    const token = manualCode();
    const challengeId = randomUUID();
    let firstIssue = false;
    const result = await this.mutate(context, commandKind, stationId, input, async (database, transactionContext, now) => {
      const branch = await database.selectFrom('branches').select(['branch_id', 'active'])
        .where('tenant_id', '=', context.tenantId).where('branch_id', '=', input.branchId!).forShare().executeTakeFirst();
      if (!branch || !canAccess(context, branch.branch_id)) throw new StationAdministrationError('STATION_ACCESS_DENIED');
      if (!await context.commitGuard.confirmCurrent(transactionContext, [branch.branch_id])) throw new StationAdministrationError('STATION_AUTHORITY_CHANGED');
      if (!branch.active) throw new StationAdministrationError('STATION_BRANCH_INACTIVE');
      const expiredChallenges = await database.selectFrom('station_enrollment_challenges')
        .select(['challenge_id', 'version'])
        .where('tenant_id', '=', context.tenantId)
        .where('status', '=', 'ACTIVE')
        .where('expires_at', '<=', now)
        .forUpdate()
        .execute();
      for (const expired of expiredChallenges) {
        await database.updateTable('station_enrollment_challenges').set({
          status: 'EXPIRED', updated_at: now, version: expired.version + 1,
        })
          .where('tenant_id', '=', context.tenantId)
          .where('challenge_id', '=', expired.challenge_id)
          .where('version', '=', expired.version)
          .executeTakeFirstOrThrow();
      }
      let stationVersion: number | null = null;
      let stationRevision: number | null = null;
      if (stationId) {
        const station = await this.lockStation(database, context, stationId);
        const exactBranches = station.branch_id === null ? [branch.branch_id] : [station.branch_id, branch.branch_id];
        if (!await context.commitGuard.confirmCurrent(transactionContext, exactBranches)) throw new StationAdministrationError('STATION_AUTHORITY_CHANGED');
        if (station.version !== input.expectedVersion) throw new StationAdministrationError('STATION_VERSION_CONFLICT');
        if (station.status !== 'active') throw new StationAdministrationError('STATION_INVALID_TRANSITION');
        const revokedTrust = await this.revokeTrust(database, context, stationId, now, transactionContext);
        const updated = await database.updateTable('stations').set({ status: 'unlinked', display_name: input.displayName!, version: station.version + 1, updated_at: now, revoked_at: null })
          .where('tenant_id', '=', context.tenantId).where('station_id', '=', stationId)
          .returning(['version', 'admission_revision']).executeTakeFirstOrThrow();
        stationVersion = updated.version;
        stationRevision = updated.admission_revision;
        await this.auditTrustCut(database, context, input.clientRequestId, stationId, station.branch_id, updated.version, updated.admission_revision, now, revokedTrust);
        const supersededChallenges = await database.selectFrom('station_enrollment_challenges')
          .select(['challenge_id', 'version'])
          .where('tenant_id', '=', context.tenantId)
          .where('intended_station_id', '=', stationId)
          .where('status', '=', 'ACTIVE')
          .forUpdate()
          .execute();
        for (const superseded of supersededChallenges) {
          await database.updateTable('station_enrollment_challenges').set({
            status: 'SUPERSEDED', superseded_at: now, updated_at: now,
            version: superseded.version + 1,
          })
            .where('tenant_id', '=', context.tenantId)
            .where('challenge_id', '=', superseded.challenge_id)
            .where('version', '=', superseded.version)
            .executeTakeFirstOrThrow();
        }
      }
      await database.insertInto('station_enrollment_challenges').values({
        tenant_id: context.tenantId, challenge_id: challengeId,
        target_branch_id: input.branchId!, intended_station_id: stationId,
        intended_display_name: input.displayName!, kind,
        token_digest: createHash('sha256').update(token.compact).digest(), status: 'ACTIVE',
        issuer_user_id: context.userId, issuer_admin_identity_id: context.adminIdentityId,
        issuer_admin_session_id: context.sessionId, issuer_capability: context.capability,
        issuer_authority_digest: context.authorityDigest,
        expires_at: new Date(now.getTime() + 600_000), consumed_at: null,
        canceled_at: null, superseded_at: null, version: 0,
        created_at: now, updated_at: now,
      }).execute();
      await this.audit(database, context, input.clientRequestId, commandKind === 'ISSUE_ENROLLMENT' ? 'STATION_ENROLLMENT_ISSUED' : 'STATION_RELINK_INITIATED', stationId, input.branchId!, stationVersion, stationRevision, now, 2, challengeId);
      firstIssue = true;
      return { stationId, challengeId, stationVersion, challengeVersion: 0 };
    });
    const enrollment = (await this.listEnrollments(context)).find((entry) => entry.challengeId === result.challengeId);
    if (!enrollment) throw new StationAdministrationError('STATION_ENROLLMENT_NOT_FOUND');
    return Object.freeze({
      enrollment,
      manualCode: firstIssue ? token.presented : null,
      qrPayload: firstIssue ? `srtaller-enroll:${token.compact}` : null,
    });
  }

  private async cutTrust(
    context: StationAdministrationContext,
    commandKind: 'UNLINK' | 'REVOKE',
    stationId: string,
    input: CommandInput,
    status: 'unlinked' | 'revoked',
    eventType: 'STATION_UNLINKED' | 'STATION_REVOKED',
  ): Promise<void> {
    await this.mutate(context, commandKind, stationId, input, async (database, transactionContext, now) => {
      const station = await this.lockStation(database, context, stationId);
      if (!await context.commitGuard.confirmCurrent(transactionContext, station.branch_id ? [station.branch_id] : [])) throw new StationAdministrationError('STATION_AUTHORITY_CHANGED');
      if (station.version !== input.expectedVersion) throw new StationAdministrationError('STATION_VERSION_CONFLICT');
      if (station.status !== 'active') throw new StationAdministrationError('STATION_INVALID_TRANSITION');
      const revokedTrust = await this.revokeTrust(database, context, stationId, now, transactionContext);
      const updated = await database.updateTable('stations').set({ status, version: station.version + 1, updated_at: now, revoked_at: status === 'revoked' ? now : null })
        .where('tenant_id', '=', context.tenantId).where('station_id', '=', stationId)
        .returning(['version', 'admission_revision']).executeTakeFirstOrThrow();
      await this.audit(database, context, input.clientRequestId, eventType, stationId, station.branch_id, updated.version, updated.admission_revision, now, 2);
      await this.auditTrustCut(database, context, input.clientRequestId, stationId, station.branch_id, updated.version, updated.admission_revision, now, revokedTrust);
      return { stationId, challengeId: null, stationVersion: updated.version, challengeVersion: null };
    });
  }

  private async revokeTrust(database: any, context: StationAdministrationContext, stationId: string, now: Date, transactionContext: object): Promise<Readonly<{ credentials: number; sessions: number }>> {
    await database.updateTable('station_bindings').set({ revoked_at: now })
      .where('tenant_id', '=', context.tenantId).where('station_id', '=', stationId).where('revoked_at', 'is', null).execute();
    const credentialResult = await database.updateTable('station_credentials').set({ revoked_at: now })
      .where('tenant_id', '=', context.tenantId).where('station_id', '=', stationId).where('revoked_at', 'is', null).executeTakeFirst();
    const sessions = await context.invalidateOperationalSessions(stationId, now.toISOString(), transactionContext);
    return Object.freeze({ credentials: Number(credentialResult.numUpdatedRows), sessions });
  }

  private async auditTrustCut(
    database: any,
    context: StationAdministrationContext,
    clientRequestId: string,
    stationId: string,
    branchId: string | null,
    stationVersion: number,
    stationRevision: number,
    now: Date,
    result: Readonly<{ credentials: number; sessions: number }>,
  ): Promise<void> {
    if (result.credentials > 0) {
      await this.audit(database, context, clientRequestId, 'STATION_CREDENTIAL_REVOKED', stationId, branchId, stationVersion, stationRevision, now, 2);
    }
    if (result.sessions > 0) {
      await this.audit(database, context, clientRequestId, 'STATION_SESSIONS_INVALIDATED', stationId, branchId, stationVersion, stationRevision, now, 2);
    }
    await this.audit(database, context, clientRequestId, 'STATION_ADMISSION_REVISION_CHANGED', stationId, branchId, stationVersion, stationRevision, now, 2);
  }

  private readMutationOutcome(
    context: StationAdministrationContext,
    stationId: string,
  ): Promise<StationInventoryItem> {
    // A Branch-restricted actor loses ordinary list visibility as soon as the
    // current binding is cut. The already-authorized command may still return
    // its safe, secret-free outcome without restoring any operational trust.
    return this.read(Object.freeze({ ...context, authorizedBranchIds: null }), stationId);
  }

  private async lockStation(database: any, context: StationAdministrationContext, stationId: string): Promise<any> {
    const station = await database.selectFrom('stations as station')
      .leftJoin('station_bindings as binding', (join: any) => join
        .onRef('binding.tenant_id', '=', 'station.tenant_id')
        .onRef('binding.station_id', '=', 'station.station_id')
        .on('binding.revoked_at', 'is', null))
      .select(['station.station_id', 'station.status', 'station.version', 'station.admission_revision', 'binding.branch_id'])
      .where('station.tenant_id', '=', context.tenantId).where('station.station_id', '=', stationId)
      .forUpdate('station').executeTakeFirst();
    if (!station || !canAccess(context, station.branch_id)) throw new StationAdministrationError('STATION_NOT_FOUND');
    return station;
  }

  private async mutate(
    context: StationAdministrationContext,
    kind: CommandKind,
    targetId: string | null,
    input: CommandInput,
    operation: (database: any, transactionContext: object, now: Date) => Promise<Readonly<{ stationId: string | null; challengeId: string | null; stationVersion: number | null; challengeVersion: number | null }>>,
  ): Promise<Readonly<{ stationId: string | null; challengeId: string | null; stationVersion: number | null; challengeVersion: number | null }>> {
    const digest = requestDigest(kind, targetId, input);
    try {
      const outcome = await runInTransaction(this.connection, { isolationLevel: 'serializable' }, async (transactionContext) =>
        useTransactionalDatabasePersistenceExecutor(transactionContext, 'stations', async (database) => {
          try {
            if (!await context.commitGuard.confirmCurrent(transactionContext)) throw new StationAdministrationError('STATION_AUTHORITY_CHANGED');
            const replay = await database.selectFrom('station_administration_commands').selectAll()
              .where('tenant_id', '=', context.tenantId).where('command_kind', '=', kind)
              .where('client_request_id', '=', input.clientRequestId).executeTakeFirst();
            if (replay) {
              if (!sameDigest(replay.request_digest, digest)) throw new StationAdministrationError('STATION_IDEMPOTENCY_CONFLICT');
              return Object.freeze({ ok: true as const, result: Object.freeze({ stationId: replay.station_id, challengeId: replay.challenge_id, stationVersion: replay.result_station_version, challengeVersion: replay.result_challenge_version }) });
            }
            const result = await operation(database, transactionContext, this.clock());
            await database.insertInto('station_administration_commands').values({
              tenant_id: context.tenantId, command_kind: kind,
              client_request_id: input.clientRequestId, request_digest: digest,
              station_id: result.stationId, challenge_id: result.challengeId,
              result_station_version: result.stationVersion,
              result_challenge_version: result.challengeVersion,
              completed_at: this.clock(),
            }).execute();
            return Object.freeze({ ok: true as const, result });
          } catch (error: unknown) {
            if (error instanceof StationAdministrationError) {
              // The governed transaction runner intentionally normalizes callback
              // exceptions. Return a typed denial so it can commit its read-only
              // checks and preserve the domain error outside the transaction.
              return Object.freeze({ ok: false as const, error });
            }
            throw error;
          }
        }),
      );
      if (!outcome.ok) throw outcome.error;
      return outcome.result;
    } catch (error: unknown) {
      if (error instanceof StationAdministrationError) throw error;
      throw new StationAdministrationError('STATION_CONCURRENCY_CONFLICT');
    }
  }

  private async audit(
    database: any,
    context: StationAdministrationContext,
    clientRequestId: string,
    eventType: string,
    stationId: string | null,
    branchId: string | null,
    stationVersion: number | null,
    stationRevision: number | null,
    now: Date,
    level: 1 | 2,
    challengeId: string | null = null,
  ): Promise<void> {
    await database.insertInto('station_audit_events').values({
      event_id: randomUUID(), tenant_id: context.tenantId, station_id: stationId,
      challenge_id: challengeId, branch_id: branchId, actor_user_id: context.userId,
      actor_admin_identity_id: context.adminIdentityId, admin_session_id: context.sessionId,
      event_type: eventType, result: 'SUCCEEDED', reason_code: 'COMMAND_APPLIED',
      capability: context.capability, sensitivity_level: level,
      correlation_id: clientRequestId, client_request_id: clientRequestId,
      station_version: stationVersion, station_admission_revision: stationRevision,
      occurred_at: now,
    }).execute();
  }

  private stationId(value: unknown): string {
    try { return parseStationId(value); } catch { throw new StationAdministrationError('STATION_NOT_FOUND'); }
  }

  private id(value: unknown, code: StationAdministrationErrorCode): string {
    if (typeof value !== 'string' || !uuid.test(value)) throw new StationAdministrationError(code);
    return value;
  }

  private mapStation(row: any, credentialRows: readonly any[]): StationInventoryItem {
    const credentials = credentialRows.filter((credential) => credential.station_id === row.station_id);
    const credentialState = credentials.some((credential) => credential.revoked_at === null)
      ? 'CURRENT'
      : credentials.length > 0 ? 'REVOKED' : 'ABSENT';
    return Object.freeze({
      stationId: row.station_id, displayName: row.display_name,
      status: stationStatus(row.status), branchId: row.branch_id ?? null,
      branchDisplayName: row.branch_display_name ?? null,
      branchStatus: row.branch_active === null || row.branch_active === undefined ? null : row.branch_active ? 'ACTIVE' : 'INACTIVE',
      credentialState, version: row.version, admissionRevision: row.admission_revision,
      createdAt: row.created_at.toISOString(), updatedAt: row.updated_at.toISOString(),
      revokedAt: row.revoked_at?.toISOString() ?? null,
    });
  }

  private mapChallenge(row: any, now: Date): StationEnrollmentItem {
    return Object.freeze({
      challengeId: row.challenge_id, targetBranchId: row.target_branch_id,
      targetBranchDisplayName: row.branch_display_name,
      intendedStationId: row.intended_station_id,
      intendedDisplayName: row.intended_display_name, kind: row.kind,
      status: challengeStatus(row.status, row.expires_at, now), version: row.version,
      createdAt: row.created_at.toISOString(), expiresAt: row.expires_at.toISOString(),
      consumedAt: row.consumed_at?.toISOString() ?? null,
      canceledAt: row.canceled_at?.toISOString() ?? null,
      supersededAt: row.superseded_at?.toISOString() ?? null,
    });
  }
}
