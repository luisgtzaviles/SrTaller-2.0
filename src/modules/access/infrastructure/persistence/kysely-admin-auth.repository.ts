import { randomUUID } from 'node:crypto';

import type { Kysely, Transaction } from 'kysely';

import { databasePersistenceCapability } from '../../../../infrastructure/database/database-persistence-capability.js';
import { useTransactionalDatabasePersistenceExecutor } from '../../../../infrastructure/database/database-persistence-capability.js';
import { databaseTransactionCapability } from '../../../../infrastructure/database/database-transaction-capability.js';
import type { DatabaseSchema } from '../../../../infrastructure/database/database-types.js';
import type { ApplicationDatabaseConnection } from '../../../../infrastructure/runtime/index.js';
import type {
  AdminAuthRepositoryPort,
  AdminCredentialRecord,
} from '../../application/ports/admin-auth-repository.port.js';
import type { AdminPasswordStoredVerifier } from '../../application/ports/admin-password-hasher.port.js';
import type { AdminSessionRecord } from '../../domain/admin-session.js';

type AccessDatabase = Kysely<DatabaseSchema> | Transaction<DatabaseSchema>;

function iso(value: Date | string | null): string | null {
  return value === null ? null : (value instanceof Date ? value : new Date(value)).toISOString();
}

function credential(row: Record<string, unknown>): AdminCredentialRecord {
  return Object.freeze({
    tenantId: String(row.tenant_id),
    adminIdentityId: String(row.admin_identity_id),
    userId: String(row.user_id),
    normalizedEmail: String(row.normalized_email),
    emailDisplay: String(row.email_display),
    verifiedAt: iso(row.verified_at as Date | null),
    identityStatus: row.identity_status as 'active' | 'revoked',
    identityVersion: Number(row.identity_version),
    credentialStatus: row.credential_status as 'active' | 'revoked',
    credentialVersion: Number(row.credential_version),
    sessionRevision: Number(row.session_revision),
    password: Object.freeze({
      algorithm: String(row.algorithm),
      profileVersion: Number(row.profile_version),
      pepperVersion: Number(row.pepper_version),
      memoryKiB: Number(row.memory_kib),
      passes: Number(row.passes),
      parallelism: Number(row.parallelism),
      salt: Uint8Array.from(row.salt as Uint8Array),
      verifier: Uint8Array.from(row.verifier as Uint8Array),
    }),
  });
}

function session(row: Record<string, unknown>): AdminSessionRecord {
  return Object.freeze({
    tenantId: String(row.tenant_id), sessionId: String(row.session_id),
    userId: String(row.user_id), adminIdentityId: String(row.admin_identity_id),
    userAdmissionRevision: Number(row.user_admission_revision),
    identityVersion: Number(row.identity_version), credentialVersion: Number(row.credential_version),
    sessionRevision: Number(row.session_revision), status: row.status as AdminSessionRecord['status'],
    version: Number(row.version), issuedAt: iso(row.issued_at as Date) as string,
    lastActivityAt: iso(row.last_activity_at as Date) as string,
    expiresAt: iso(row.expires_at as Date) as string,
    reauthenticatedAt: iso(row.reauthenticated_at as Date | null), endedAt: iso(row.ended_at as Date | null),
  });
}

const credentialSelection = [
  'i.tenant_id', 'i.admin_identity_id', 'i.user_id', 'i.normalized_email', 'i.email_display',
  'i.verified_at', 'i.status as identity_status', 'i.identity_version',
  'c.status as credential_status', 'c.credential_version', 'c.session_revision',
  'c.algorithm', 'c.profile_version', 'c.pepper_version', 'c.memory_kib', 'c.passes',
  'c.parallelism', 'c.salt', 'c.verifier',
] as const;

export class KyselyAdminAuthRepository implements AdminAuthRepositoryPort {
  constructor(private readonly connection: ApplicationDatabaseConnection) {}

  async confirmCurrent(
    expected: AdminSessionRecord,
    occurredAt: string,
    requireRecentReauthentication: boolean,
    transactionContext: object,
  ): Promise<boolean> {
    const now = new Date(occurredAt);
    const current = await useTransactionalDatabasePersistenceExecutor(
      transactionContext,
      'access',
      async (db) => await db.selectFrom('access_admin_sessions as s')
        .innerJoin('access_admin_identities as i', (join) => join
          .onRef('i.tenant_id', '=', 's.tenant_id')
          .onRef('i.admin_identity_id', '=', 's.admin_identity_id'))
        .innerJoin('access_admin_password_credentials as c', (join) => join
          .onRef('c.tenant_id', '=', 's.tenant_id')
          .onRef('c.admin_identity_id', '=', 's.admin_identity_id'))
        .select([
          's.status', 's.version', 's.user_admission_revision', 's.identity_version',
          's.credential_version', 's.session_revision', 's.last_activity_at',
          's.expires_at', 's.reauthenticated_at', 'i.status as identity_status',
          'i.identity_version as current_identity_version',
          'c.status as credential_status',
          'c.credential_version as current_credential_version',
          'c.session_revision as current_session_revision',
        ])
        .where('s.tenant_id', '=', expected.tenantId)
        .where('s.session_id', '=', expected.sessionId)
        .where('s.user_id', '=', expected.userId)
        .where('s.admin_identity_id', '=', expected.adminIdentityId)
        .forShare(['s', 'i', 'c'])
        .executeTakeFirst(),
    );
    if (!current || current.status !== 'active' || current.version !== expected.version ||
      current.identity_status !== 'active' || current.credential_status !== 'active' ||
      current.user_admission_revision !== expected.userAdmissionRevision ||
      current.identity_version !== expected.identityVersion ||
      current.current_identity_version !== expected.identityVersion ||
      current.credential_version !== expected.credentialVersion ||
      current.current_credential_version !== expected.credentialVersion ||
      current.session_revision !== expected.sessionRevision ||
      current.current_session_revision !== expected.sessionRevision ||
      now >= current.expires_at || now.getTime() - current.last_activity_at.getTime() >= 30 * 60_000 ||
      (requireRecentReauthentication && (
        current.reauthenticated_at === null ||
        now.getTime() - current.reauthenticated_at.getTime() < 0 ||
        now.getTime() - current.reauthenticated_at.getTime() >= 10 * 60_000
      ))) return false;
    const user = await useTransactionalDatabasePersistenceExecutor(
      transactionContext,
      'users',
      async (db) => await db.selectFrom('users')
        .select('user_id')
        .where('tenant_id', '=', expected.tenantId)
        .where('user_id', '=', expected.userId)
        .where('status', '=', 'active')
        .where('admission_revision', '=', expected.userAdmissionRevision)
        .forShare()
        .executeTakeFirst(),
    );
    return user !== undefined;
  }

  async #readCredential(where: Readonly<{ normalizedEmail?: string; tenantId?: string; identityId?: string }>): Promise<AdminCredentialRecord | null> {
    return this.connection[databasePersistenceCapability]('access', async (db) => {
      let query = db.selectFrom('access_admin_identities as i')
        .innerJoin('access_admin_password_credentials as c', (join) => join
          .onRef('c.tenant_id', '=', 'i.tenant_id')
          .onRef('c.admin_identity_id', '=', 'i.admin_identity_id'))
        .select(credentialSelection);
      if (where.normalizedEmail) query = query.where('i.normalized_email', '=', where.normalizedEmail);
      if (where.tenantId) query = query.where('i.tenant_id', '=', where.tenantId);
      if (where.identityId) query = query.where('i.admin_identity_id', '=', where.identityId);
      const row = await query.executeTakeFirst();
      return row ? credential(row) : null;
    });
  }

  findCredentialByEmail(normalizedEmail: string) { return this.#readCredential({ normalizedEmail }); }
  findCredential(tenantId: string, adminIdentityId: string) { return this.#readCredential({ tenantId, identityId: adminIdentityId }); }

  async provisionVerifiedIdentity(input: Parameters<AdminAuthRepositoryPort['provisionVerifiedIdentity']>[0]): Promise<AdminCredentialRecord> {
    await this.connection[databaseTransactionCapability]({ isolationLevel: 'serializable', accessMode: 'read write' }, async (raw) => {
      const db = raw as unknown as AccessDatabase;
      const at = new Date(input.occurredAt);
      await db.insertInto('access_admin_identities').values({ tenant_id: input.tenantId, admin_identity_id: input.adminIdentityId, user_id: input.userId, normalized_email: input.normalizedEmail, email_display: input.emailDisplay, verified_at: at, status: 'active', identity_version: 0, created_at: at, updated_at: at }).execute();
      await db.insertInto('access_admin_password_credentials').values({ tenant_id: input.tenantId, admin_identity_id: input.adminIdentityId, user_id: input.userId, status: 'active', algorithm: 'argon2id', profile_version: input.password.profileVersion, pepper_version: input.password.pepperVersion, memory_kib: input.password.memoryKiB, passes: input.password.passes, parallelism: input.password.parallelism, salt: input.password.salt, verifier: input.password.verifier, credential_version: 1, session_revision: 1, created_at: at, updated_at: at, revoked_at: null }).execute();
    });
    const created = await this.findCredential(input.tenantId, input.adminIdentityId);
    if (!created) throw new Error('Administrative identity provisioning failed.');
    return created;
  }

  async createSession(input: Parameters<AdminAuthRepositoryPort['createSession']>[0]): Promise<AdminSessionRecord> {
    return this.connection[databaseTransactionCapability]({ isolationLevel: 'serializable', accessMode: 'read write' }, async (raw) => {
      const db = raw as unknown as AccessDatabase;
      const current = await db.selectFrom('access_admin_password_credentials as c').innerJoin('access_admin_identities as i', (join) => join.onRef('i.tenant_id', '=', 'c.tenant_id').onRef('i.admin_identity_id', '=', 'c.admin_identity_id')).select(['c.status as credential_status', 'c.credential_version', 'c.session_revision', 'i.status as identity_status', 'i.identity_version', 'i.verified_at']).where('c.tenant_id', '=', input.tenantId).where('c.admin_identity_id', '=', input.adminIdentityId).forUpdate().executeTakeFirst();
      if (!current || current.credential_status !== 'active' || current.identity_status !== 'active' || current.verified_at === null || current.credential_version !== input.credentialVersion || current.session_revision !== input.sessionRevision || current.identity_version !== input.identityVersion) throw new Error('Administrative Session admission changed.');
      const at = new Date(input.occurredAt);
      const inserted = await db.insertInto('access_admin_sessions').values({ tenant_id: input.tenantId, session_id: input.sessionId, user_id: input.userId, admin_identity_id: input.adminIdentityId, user_admission_revision: input.userAdmissionRevision, identity_version: input.identityVersion, credential_version: input.credentialVersion, session_revision: input.sessionRevision, token_verifier: input.bearerVerifier, csrf_verifier: input.csrfVerifier, status: 'active', version: 0, issued_at: at, last_activity_at: at, expires_at: new Date(input.expiresAt), reauthenticated_at: null, ended_at: null }).returningAll().executeTakeFirstOrThrow();
      await this.#event(db, { tenantId: input.tenantId, userId: input.userId, identityId: input.adminIdentityId, sessionId: input.sessionId, type: 'ADMIN_LOGIN_SUCCEEDED', result: 'SUCCEEDED', reason: 'CREDENTIAL_ACCEPTED', correlationId: input.correlationId, at });
      return session(inserted);
    });
  }

  async findSessionByBearerVerifier(verifier: Uint8Array): Promise<Readonly<AdminSessionRecord & { csrfVerifier: Uint8Array }> | null> {
    return this.connection[databasePersistenceCapability]('access', async (db) => {
      const row = await db.selectFrom('access_admin_sessions').selectAll().where('token_verifier', '=', verifier).executeTakeFirst();
      return row ? Object.freeze({ ...session(row), csrfVerifier: Uint8Array.from(row.csrf_verifier) }) : null;
    });
  }

  async listSessions(tenantId: string, userId: string): Promise<readonly AdminSessionRecord[]> {
    return this.connection[databasePersistenceCapability]('access', async (db) => {
      const rows = await db.selectFrom('access_admin_sessions').selectAll().where('tenant_id', '=', tenantId).where('user_id', '=', userId).orderBy('issued_at', 'desc').execute();
      return Object.freeze(rows.map((row) => session(row)));
    });
  }

  async isAttemptBlocked(principalDigest: Uint8Array, occurredAt: string): Promise<boolean> {
    return this.connection[databasePersistenceCapability]('access', async (db) => {
      const row = await db.selectFrom('access_admin_auth_attempt_limits').select(['attempt_count', 'blocked_until']).where('principal_digest', '=', principalDigest).executeTakeFirst();
      return row?.attempt_count === 5 && row.blocked_until !== null && row.blocked_until > new Date(occurredAt);
    });
  }

  async touchSession(input: Parameters<AdminAuthRepositoryPort['touchSession']>[0]): Promise<AdminSessionRecord | null> {
    return this.connection[databasePersistenceCapability]('access', async (db) => {
      const row = await db.updateTable('access_admin_sessions').set({ last_activity_at: new Date(input.occurredAt), version: input.expectedVersion + 1 }).where('tenant_id', '=', input.tenantId).where('session_id', '=', input.sessionId).where('status', '=', 'active').where('version', '=', input.expectedVersion).returningAll().executeTakeFirst();
      return row ? session(row) : null;
    });
  }

  async endSession(input: Parameters<AdminAuthRepositoryPort['endSession']>[0]): Promise<boolean> {
    return this.connection[databaseTransactionCapability]({ isolationLevel: 'serializable', accessMode: 'read write' }, async (raw) => {
      const db = raw as unknown as AccessDatabase;
      const row = await db.updateTable('access_admin_sessions').set({ status: input.status, ended_at: new Date(input.occurredAt), reauthenticated_at: null, version: input.expectedVersion + 1 }).where('tenant_id', '=', input.tenantId).where('session_id', '=', input.sessionId).where('status', '=', 'active').where('version', '=', input.expectedVersion).returning(['user_id', 'admin_identity_id']).executeTakeFirst();
      if (!row) return false;
      await this.#event(db, { tenantId: input.tenantId, userId: row.user_id, identityId: row.admin_identity_id, sessionId: input.sessionId, type: input.eventType, result: 'SUCCEEDED', reason: input.status.toUpperCase(), correlationId: input.correlationId, at: new Date(input.occurredAt) });
      return true;
    });
  }

  async revokeAll(input: Parameters<AdminAuthRepositoryPort['revokeAll']>[0]): Promise<number> {
    return this.connection[databaseTransactionCapability]({ isolationLevel: 'serializable', accessMode: 'read write' }, async (raw) => {
      const db = raw as unknown as AccessDatabase;
      const now = new Date(input.occurredAt);
      const authorizingSession = await db.selectFrom('access_admin_sessions')
        .select(['status', 'version', 'reauthenticated_at'])
        .where('tenant_id', '=', input.tenantId)
        .where('session_id', '=', input.currentSessionId)
        .where('admin_identity_id', '=', input.adminIdentityId)
        .forUpdate()
        .executeTakeFirst();
      if (!authorizingSession || authorizingSession.status !== 'active' ||
        authorizingSession.version !== input.expectedSessionVersion ||
        authorizingSession.reauthenticated_at === null ||
        now.getTime() - authorizingSession.reauthenticated_at.getTime() < 0 ||
        now.getTime() - authorizingSession.reauthenticated_at.getTime() >= 10 * 60_000) return 0;
      const credentialRow = await db.updateTable('access_admin_password_credentials').set({ session_revision: input.expectedSessionRevision + 1, updated_at: new Date(input.occurredAt) }).where('tenant_id', '=', input.tenantId).where('admin_identity_id', '=', input.adminIdentityId).where('session_revision', '=', input.expectedSessionRevision).returning('user_id').executeTakeFirst();
      if (!credentialRow) return 0;
      const ended = await db.updateTable('access_admin_sessions').set({ status: 'revoked', ended_at: new Date(input.occurredAt), reauthenticated_at: null }).where('tenant_id', '=', input.tenantId).where('admin_identity_id', '=', input.adminIdentityId).where('status', '=', 'active').executeTakeFirst();
      await this.#event(db, { tenantId: input.tenantId, userId: credentialRow.user_id, identityId: input.adminIdentityId, sessionId: null, type: 'ADMIN_SESSIONS_REVOKED', result: 'SUCCEEDED', reason: 'GLOBAL_REVOCATION', correlationId: input.correlationId, at: new Date(input.occurredAt) });
      return Number(ended.numUpdatedRows);
    });
  }

  async markReauthenticated(input: Parameters<AdminAuthRepositoryPort['markReauthenticated']>[0]): Promise<AdminSessionRecord | null> {
    return this.connection[databaseTransactionCapability]({ isolationLevel: 'serializable', accessMode: 'read write' }, async (raw) => {
      const db = raw as unknown as AccessDatabase;
      const current = await db.selectFrom('access_admin_sessions as s')
        .innerJoin('access_admin_identities as i', (join) => join.onRef('i.tenant_id', '=', 's.tenant_id').onRef('i.admin_identity_id', '=', 's.admin_identity_id'))
        .innerJoin('access_admin_password_credentials as c', (join) => join.onRef('c.tenant_id', '=', 's.tenant_id').onRef('c.admin_identity_id', '=', 's.admin_identity_id'))
        .innerJoin('users as u', (join) => join.onRef('u.tenant_id', '=', 's.tenant_id').onRef('u.user_id', '=', 's.user_id'))
        .select(['s.status', 's.version', 's.expires_at', 's.last_activity_at', 's.user_admission_revision', 's.identity_version', 's.credential_version', 's.session_revision', 'i.status as identity_status', 'i.identity_version as current_identity_version', 'c.status as credential_status', 'c.credential_version as current_credential_version', 'c.session_revision as current_session_revision', 'u.status as user_status', 'u.admission_revision as current_admission_revision'])
        .where('s.tenant_id', '=', input.tenantId)
        .where('s.session_id', '=', input.sessionId)
        .forUpdate(['s', 'i', 'c', 'u'])
        .executeTakeFirst();
      const now = new Date(input.occurredAt);
      if (!current || current.status !== 'active' || current.version !== input.expectedVersion ||
        current.identity_status !== 'active' || current.credential_status !== 'active' || current.user_status !== 'active' ||
        current.identity_version !== current.current_identity_version || current.credential_version !== current.current_credential_version ||
        current.session_revision !== current.current_session_revision || current.user_admission_revision !== current.current_admission_revision ||
        now >= current.expires_at || now.getTime() - current.last_activity_at.getTime() >= 30 * 60_000) return null;
      const row = await db.updateTable('access_admin_sessions').set({ reauthenticated_at: new Date(input.occurredAt), version: input.expectedVersion + 1 }).where('tenant_id', '=', input.tenantId).where('session_id', '=', input.sessionId).where('status', '=', 'active').where('version', '=', input.expectedVersion).returningAll().executeTakeFirst();
      if (row) await this.#event(db, { tenantId: input.tenantId, userId: row.user_id, identityId: row.admin_identity_id, sessionId: input.sessionId, type: 'ADMIN_REAUTHENTICATED', result: 'SUCCEEDED', reason: 'PASSWORD_REAUTHENTICATED', correlationId: input.correlationId, at: new Date(input.occurredAt) });
      return row ? session(row) : null;
    });
  }

  async recordFailedAttempt(input: Parameters<AdminAuthRepositoryPort['recordFailedAttempt']>[0]) {
    return this.connection[databaseTransactionCapability]({ isolationLevel: 'read committed', accessMode: 'read write' }, async (raw) => {
      const db = raw as unknown as AccessDatabase;
      const now = new Date(input.occurredAt); const windowStart = new Date(now.getTime() - 15 * 60_000);
      const row = await db.insertInto('access_admin_auth_attempt_limits')
        .values({ principal_digest: input.principalDigest, attempt_count: 1, window_started_at: now, blocked_until: null, updated_at: now })
        .onConflict((conflict) => conflict.column('principal_digest').doUpdateSet((eb) => ({
          attempt_count: eb.case()
            .when('access_admin_auth_attempt_limits.window_started_at', '>=', windowStart)
            .then(eb.fn<number>('least', [eb.val(5), eb('access_admin_auth_attempt_limits.attempt_count', '+', 1)]))
            .else(1)
            .end()
            .$castTo<number>(),
          window_started_at: eb.case()
            .when('access_admin_auth_attempt_limits.window_started_at', '>=', windowStart)
            .thenRef('access_admin_auth_attempt_limits.window_started_at')
            .else(now)
            .end()
            .$castTo<Date>(),
          // `attempt_count = 5` is the authoritative blocked predicate. Keeping
          // the candidate deadline current avoids a dialect-specific CASE cast
          // while the atomic upsert still prevents concurrent under-counting.
          blocked_until: new Date(now.getTime() + 15 * 60_000),
          updated_at: now,
        })))
        .returning(['attempt_count', 'blocked_until'])
        .executeTakeFirstOrThrow();
      if (row.attempt_count === 5 && row.blocked_until && input.knownPrincipal) {
        await this.#event(db, {
          tenantId: input.knownPrincipal.tenantId,
          userId: input.knownPrincipal.userId,
          identityId: input.knownPrincipal.adminIdentityId,
          sessionId: null,
          type: 'ADMIN_LOGIN_BLOCKED',
          result: 'DENIED',
          reason: 'RATE_LIMIT_REACHED',
          correlationId: input.correlationId,
          at: now,
        });
      }
      return Object.freeze({ blocked: row.attempt_count === 5, blockedUntil: row.attempt_count === 5 ? iso(row.blocked_until) : null });
    });
  }

  async clearFailedAttempts(principalDigest: Uint8Array): Promise<void> { await this.connection[databasePersistenceCapability]('access', (db) => db.deleteFrom('access_admin_auth_attempt_limits').where('principal_digest', '=', principalDigest).execute().then(() => undefined)); }

  async issueRecovery(input: Parameters<AdminAuthRepositoryPort['issueRecovery']>[0]): Promise<void> {
    await this.connection[databasePersistenceCapability]('access', (db) => db.insertInto('access_admin_recovery_challenges').values({ tenant_id: input.tenantId, challenge_id: input.challengeId, admin_identity_id: input.adminIdentityId, user_id: input.userId, token_verifier: input.tokenVerifier, identity_version: input.identityVersion, credential_version: input.credentialVersion, status: 'active', version: 0, issued_at: new Date(input.occurredAt), expires_at: new Date(input.expiresAt), consumed_at: null }).execute().then(() => undefined));
  }

  async findRecoveryContext(tokenVerifier: Uint8Array): Promise<Readonly<{ tenantId: string; adminIdentityId: string }> | null> {
    return this.connection[databasePersistenceCapability]('access', async (db) => {
      const row = await db.selectFrom('access_admin_recovery_challenges').select(['tenant_id', 'admin_identity_id']).where('token_verifier', '=', tokenVerifier).where('status', '=', 'active').executeTakeFirst();
      return row ? Object.freeze({ tenantId: row.tenant_id, adminIdentityId: row.admin_identity_id }) : null;
    });
  }

  async completeRecovery(input: Parameters<AdminAuthRepositoryPort['completeRecovery']>[0]): Promise<boolean> {
    return this.connection[databaseTransactionCapability]({ isolationLevel: 'serializable', accessMode: 'read write' }, async (raw) => {
      const db = raw as unknown as AccessDatabase; const now = new Date(input.occurredAt);
      const challenge = await db.selectFrom('access_admin_recovery_challenges').selectAll().where('token_verifier', '=', input.tokenVerifier).forUpdate().executeTakeFirst();
      if (!challenge || challenge.status !== 'active' || challenge.expires_at <= now) return false;
      const identity = await db.selectFrom('access_admin_identities').selectAll().where('tenant_id', '=', challenge.tenant_id).where('admin_identity_id', '=', challenge.admin_identity_id).forUpdate().executeTakeFirst();
      const user = await db.selectFrom('users').select(['status', 'admission_revision']).where('tenant_id', '=', challenge.tenant_id).where('user_id', '=', challenge.user_id).forUpdate().executeTakeFirst();
      const current = await db.selectFrom('access_admin_password_credentials').selectAll().where('tenant_id', '=', challenge.tenant_id).where('admin_identity_id', '=', challenge.admin_identity_id).forUpdate().executeTakeFirst();
      if (!identity || !user || !current || identity.status !== 'active' || user.status !== 'active' || current.status !== 'active' || identity.identity_version !== challenge.identity_version || current.credential_version !== challenge.credential_version) return false;
      await db.updateTable('access_admin_recovery_challenges').set({ status: 'consumed', consumed_at: now, version: challenge.version + 1 }).where('tenant_id', '=', challenge.tenant_id).where('challenge_id', '=', challenge.challenge_id).where('version', '=', challenge.version).execute();
      await db.updateTable('access_admin_password_credentials').set({ algorithm: 'argon2id', profile_version: input.password.profileVersion, pepper_version: input.password.pepperVersion, memory_kib: input.password.memoryKiB, passes: input.password.passes, parallelism: input.password.parallelism, salt: input.password.salt, verifier: input.password.verifier, credential_version: current.credential_version + 1, session_revision: current.session_revision + 1, updated_at: now }).where('tenant_id', '=', challenge.tenant_id).where('admin_identity_id', '=', challenge.admin_identity_id).execute();
      await db.updateTable('access_admin_sessions').set({ status: 'revoked', ended_at: now, reauthenticated_at: null }).where('tenant_id', '=', challenge.tenant_id).where('admin_identity_id', '=', challenge.admin_identity_id).where('status', '=', 'active').execute();
      await this.#event(db, { tenantId: challenge.tenant_id, userId: challenge.user_id, identityId: challenge.admin_identity_id, sessionId: null, type: 'ADMIN_RECOVERY_COMPLETED', result: 'SUCCEEDED', reason: 'RECOVERY_ACCEPTED', correlationId: input.correlationId, at: now });
      return true;
    });
  }

  async #event(db: AccessDatabase, input: Readonly<{ tenantId: string; userId: string | null; identityId: string | null; sessionId: string | null; type: string; result: 'SUCCEEDED' | 'DENIED'; reason: string; correlationId: string; at: Date }>): Promise<void> {
    await db.insertInto('access_admin_security_events').values({ tenant_id: input.tenantId, event_id: randomUUID(), user_id: input.userId, admin_identity_id: input.identityId, session_id: input.sessionId, event_type: input.type, result: input.result, reason_code: input.reason, correlation_id: input.correlationId, occurred_at: input.at }).execute();
  }
}
