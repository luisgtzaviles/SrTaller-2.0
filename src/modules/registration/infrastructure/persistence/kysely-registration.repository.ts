import { useDatabasePersistenceExecutor, useTransactionalDatabasePersistenceExecutor } from '../../../../infrastructure/database/database-persistence-capability.js';
import type { DatabaseConnection } from '../../../../infrastructure/database/database-connection.js';
import { DatabaseTransactionError, runInTransaction } from '../../../../infrastructure/database/transaction-runner.js';
import type { RegistrationAttemptRow } from '../../../../infrastructure/database/database-types.js';
import type { RegistrationAttemptRecord, RegistrationRepositoryPort } from '../../application/ports/registration-repository.port.js';

function mapAttempt(row: RegistrationAttemptRow): RegistrationAttemptRecord {
  const hasPassword = row.password_algorithm !== null && row.password_profile_version !== null &&
    row.password_pepper_version !== null && row.password_memory_kib !== null &&
    row.password_passes !== null && row.password_parallelism !== null &&
    row.password_salt !== null && row.password_verifier !== null;
  return Object.freeze({
    registrationAttemptId: row.registration_attempt_id,
    status: row.status,
    personDisplayName: row.person_display_name,
    workshopDisplayName: row.workshop_display_name,
    normalizedEmail: row.normalized_email,
    emailDisplay: row.email_display,
    tenantId: row.tenant_id,
    firstUserId: row.first_user_id,
    adminIdentityId: row.admin_identity_id,
    acceptanceEvidenceId: row.acceptance_evidence_id,
    approvedInputDigest: Uint8Array.from(row.approved_input_digest),
    registrationRevision: row.registration_revision,
    passwordVerifier: hasPassword ? Object.freeze({
      algorithm: row.password_algorithm as string,
      profileVersion: row.password_profile_version as number,
      pepperVersion: row.password_pepper_version as number,
      memoryKiB: row.password_memory_kib as number,
      passes: row.password_passes as number,
      parallelism: row.password_parallelism as number,
      salt: Uint8Array.from(row.password_salt as Uint8Array),
      verifier: Uint8Array.from(row.password_verifier as Uint8Array),
    }) : null,
    expiresAt: row.expires_at.toISOString(),
    verifiedAt: row.verified_at?.toISOString() ?? null,
    consumedAt: row.consumed_at?.toISOString() ?? null,
    version: row.version,
  });
}

async function retrySerializable<Result>(operation: () => Promise<Result>): Promise<Result> {
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try { return await operation(); }
    catch (error) {
      if (!(error instanceof DatabaseTransactionError) || error.retryable !== 'conditional' || attempt === 3) throw error;
    }
  }
  throw new Error('Unreachable registration transaction retry state.');
}

export class KyselyRegistrationRepository implements RegistrationRepositoryPort {
  constructor(private readonly connection: DatabaseConnection) {}

  findActiveByEmail(normalizedEmail: string, now: string): Promise<RegistrationAttemptRecord | null> {
    return useDatabasePersistenceExecutor(this.connection, 'registration', async (database) => {
      const row = await database.selectFrom('registration_attempts').selectAll()
        .where('normalized_email', '=', normalizedEmail)
        .where('status', 'in', ['PENDING_VERIFICATION', 'VERIFIED'])
        .where('expires_at', '>', new Date(now)).executeTakeFirst();
      return row ? mapAttempt(row) : null;
    });
  }

  findAttempt(registrationAttemptId: string): Promise<RegistrationAttemptRecord | null> {
    return useDatabasePersistenceExecutor(this.connection, 'registration', async (database) => {
      const row = await database.selectFrom('registration_attempts').selectAll()
        .where('registration_attempt_id', '=', registrationAttemptId).executeTakeFirst();
      return row ? mapAttempt(row) : null;
    });
  }

  async create(input: Parameters<RegistrationRepositoryPort['create']>[0]): Promise<'CREATED' | 'ACTIVE_EMAIL_EXISTS' | 'ADMIN_IDENTITY_EXISTS'> {
    try {
      return await retrySerializable(() => runInTransaction(this.connection, { isolationLevel: 'serializable' }, async (context) =>
        useTransactionalDatabasePersistenceExecutor(context, 'registration', async (database) => {
          await database.updateTable('registration_attempts').set({
            status: 'EXPIRED', updated_at: new Date(input.occurredAt),
            password_algorithm: null, password_profile_version: null,
            password_pepper_version: null, password_memory_kib: null,
            password_passes: null, password_parallelism: null,
            password_salt: null, password_verifier: null,
            version: (eb) => eb('version', '+', 1),
          }).where('normalized_email', '=', input.attempt.normalizedEmail)
            .where('status', 'in', ['PENDING_VERIFICATION', 'VERIFIED'])
            .where('expires_at', '<=', new Date(input.occurredAt)).execute();
          const existing = await database.selectFrom('registration_attempts').select('registration_attempt_id')
            .where('normalized_email', '=', input.attempt.normalizedEmail)
            .where('status', 'in', ['PENDING_VERIFICATION', 'VERIFIED']).forUpdate().executeTakeFirst();
          if (existing) return 'ACTIVE_EMAIL_EXISTS' as const;
          const password = input.attempt.passwordVerifier;
          if (!password) throw new Error('Registration password verifier is required.');
          await database.insertInto('registration_attempts').values({
            registration_attempt_id: input.attempt.registrationAttemptId,
            status: input.attempt.status,
            person_display_name: input.attempt.personDisplayName,
            workshop_display_name: input.attempt.workshopDisplayName,
            normalized_email: input.attempt.normalizedEmail,
            email_display: input.attempt.emailDisplay,
            tenant_id: input.attempt.tenantId,
            first_user_id: input.attempt.firstUserId,
            admin_identity_id: input.attempt.adminIdentityId,
            acceptance_evidence_id: input.attempt.acceptanceEvidenceId,
            approved_input_digest: input.attempt.approvedInputDigest,
            registration_revision: input.attempt.registrationRevision,
            password_algorithm: password.algorithm,
            password_profile_version: password.profileVersion,
            password_pepper_version: password.pepperVersion,
            password_memory_kib: password.memoryKiB,
            password_passes: password.passes,
            password_parallelism: password.parallelism,
            password_salt: password.salt,
            password_verifier: password.verifier,
            expires_at: new Date(input.attempt.expiresAt),
            verified_at: null,
            consumed_at: null,
            version: 0,
            created_at: new Date(input.occurredAt),
            updated_at: new Date(input.occurredAt),
          }).execute();
          await database.insertInto('registration_acceptance_documents').values(input.documents.map((document) => ({
            acceptance_evidence_id: input.attempt.acceptanceEvidenceId,
            document_key: document.documentKey,
            document_version: document.documentVersion,
            registration_attempt_id: input.attempt.registrationAttemptId,
            tenant_id: null,
            user_id: null,
            accepted_at: new Date(input.occurredAt),
          }))).execute();
          await database.insertInto('registration_verification_challenges').values({
            challenge_id: input.challenge.challengeId,
            registration_attempt_id: input.attempt.registrationAttemptId,
            token_digest: input.challenge.tokenDigest,
            status: 'ACTIVE', failure_count: 0, expires_at: new Date(input.challenge.expiresAt),
            consumed_at: null, superseded_at: null, version: 0,
            created_at: new Date(input.occurredAt), updated_at: new Date(input.occurredAt),
          }).execute();
          await database.insertInto('registration_email_dispatches').values({
            delivery_id: input.dispatch.deliveryId,
            registration_attempt_id: input.attempt.registrationAttemptId,
            challenge_id: input.dispatch.challengeId,
            template_key: 'registration-verification', template_version: 1,
            status: 'PENDING', attempt_count: 0, provider_reference: null,
            provider_reason_code: null, last_attempt_at: null,
            created_at: new Date(input.occurredAt), updated_at: new Date(input.occurredAt),
          }).execute();
          return 'CREATED' as const;
        })));
    } catch (error: unknown) {
      const code = typeof error === 'object' && error !== null && 'code' in error ? String(error.code) : '';
      if (code === '23505') return 'ACTIVE_EMAIL_EXISTS';
      throw error;
    }
  }

  async rotateChallenge(input: Parameters<RegistrationRepositoryPort['rotateChallenge']>[0]): Promise<RegistrationAttemptRecord | null> {
    return retrySerializable(() => runInTransaction(this.connection, { isolationLevel: 'serializable' }, async (context) =>
      useTransactionalDatabasePersistenceExecutor(context, 'registration', async (database) => {
        const attempt = await database.selectFrom('registration_attempts').selectAll()
          .where('normalized_email', '=', input.normalizedEmail).where('status', '=', 'PENDING_VERIFICATION')
          .where('expires_at', '>', new Date(input.occurredAt)).forUpdate().executeTakeFirst();
        if (!attempt) return null;
        await database.updateTable('registration_verification_challenges').set({
          status: 'SUPERSEDED', superseded_at: new Date(input.occurredAt),
          updated_at: new Date(input.occurredAt), version: (eb) => eb('version', '+', 1),
        }).where('registration_attempt_id', '=', attempt.registration_attempt_id).where('status', '=', 'ACTIVE').execute();
        await database.insertInto('registration_verification_challenges').values({
          challenge_id: input.challengeId, registration_attempt_id: attempt.registration_attempt_id,
          token_digest: input.tokenDigest, status: 'ACTIVE', failure_count: 0,
          expires_at: new Date(input.challengeExpiresAt), consumed_at: null, superseded_at: null,
          version: 0, created_at: new Date(input.occurredAt), updated_at: new Date(input.occurredAt),
        }).execute();
        await database.insertInto('registration_email_dispatches').values({
          delivery_id: input.deliveryId, registration_attempt_id: attempt.registration_attempt_id,
          challenge_id: input.challengeId, template_key: 'registration-verification', template_version: 1,
          status: 'PENDING', attempt_count: 0, provider_reference: null, provider_reason_code: null,
          last_attempt_at: null, created_at: new Date(input.occurredAt), updated_at: new Date(input.occurredAt),
        }).execute();
        return mapAttempt(attempt);
      })));
  }

  async consumeChallenge(input: Parameters<RegistrationRepositoryPort['consumeChallenge']>[0]) {
    return retrySerializable(() => runInTransaction(this.connection, { isolationLevel: 'serializable' }, async (context) =>
      useTransactionalDatabasePersistenceExecutor(context, 'registration', async (database) => {
        const challenge = await database.selectFrom('registration_verification_challenges').selectAll()
          .where('token_digest', '=', input.tokenDigest).forUpdate().executeTakeFirst();
        if (!challenge) return Object.freeze({ outcome: 'INVALID_OR_EXPIRED' as const, attempt: null });
        const attempt = await database.selectFrom('registration_attempts').selectAll()
          .where('registration_attempt_id', '=', challenge.registration_attempt_id).forUpdate().executeTakeFirstOrThrow();
        if (challenge.status === 'CONSUMED' && (attempt.status === 'VERIFIED' || attempt.status === 'CONSUMED')) {
          return Object.freeze({ outcome: 'REPLAY' as const, attempt: mapAttempt(attempt) });
        }
        const now = new Date(input.occurredAt);
        if (challenge.status !== 'ACTIVE' || challenge.expires_at <= now || attempt.expires_at <= now || attempt.status !== 'PENDING_VERIFICATION') {
          if (challenge.status === 'ACTIVE') await database.updateTable('registration_verification_challenges').set({ status: 'EXPIRED', updated_at: now, version: (eb) => eb('version', '+', 1) }).where('challenge_id', '=', challenge.challenge_id).execute();
          if (attempt.expires_at <= now && attempt.status !== 'CONSUMED') {
            await database.updateTable('registration_attempts').set({
              status: 'EXPIRED', updated_at: now,
              password_algorithm: null, password_profile_version: null,
              password_pepper_version: null, password_memory_kib: null,
              password_passes: null, password_parallelism: null,
              password_salt: null, password_verifier: null,
              version: (eb) => eb('version', '+', 1),
            }).where('registration_attempt_id', '=', attempt.registration_attempt_id)
              .where('status', 'in', ['PENDING_VERIFICATION', 'VERIFIED']).execute();
          }
          return Object.freeze({ outcome: 'INVALID_OR_EXPIRED' as const, attempt: null });
        }
        await database.updateTable('registration_verification_challenges').set({ status: 'CONSUMED', consumed_at: now, updated_at: now, version: (eb) => eb('version', '+', 1) }).where('challenge_id', '=', challenge.challenge_id).where('status', '=', 'ACTIVE').executeTakeFirstOrThrow();
        const updated = await database.updateTable('registration_attempts').set({ status: 'VERIFIED', verified_at: now, updated_at: now, version: (eb) => eb('version', '+', 1) }).where('registration_attempt_id', '=', attempt.registration_attempt_id).where('status', '=', 'PENDING_VERIFICATION').returningAll().executeTakeFirstOrThrow();
        return Object.freeze({ outcome: 'VERIFIED' as const, attempt: mapAttempt(updated) });
      })));
  }

  async markConsumed(input: Parameters<RegistrationRepositoryPort['markConsumed']>[0]): Promise<RegistrationAttemptRecord | null> {
    return retrySerializable(() => runInTransaction(this.connection, { isolationLevel: 'serializable' }, async (context) =>
      useTransactionalDatabasePersistenceExecutor(context, 'registration', async (database) => {
        const updated = await database.updateTable('registration_attempts').set({
          status: 'CONSUMED', consumed_at: new Date(input.occurredAt), updated_at: new Date(input.occurredAt),
          password_algorithm: null, password_profile_version: null, password_pepper_version: null,
          password_memory_kib: null, password_passes: null, password_parallelism: null,
          password_salt: null, password_verifier: null, version: (eb) => eb('version', '+', 1),
        }).where('registration_attempt_id', '=', input.registrationAttemptId).where('tenant_id', '=', input.tenantId)
          .where('first_user_id', '=', input.userId).where('status', '=', 'VERIFIED')
          .where('version', '=', input.expectedVersion).returningAll().executeTakeFirst();
        if (!updated) return null;
        await database.updateTable('registration_acceptance_documents').set({
          tenant_id: input.tenantId, user_id: input.userId,
        }).where('acceptance_evidence_id', '=', updated.acceptance_evidence_id).execute();
        return mapAttempt(updated);
      })));
  }

  async recordDispatch(input: Parameters<RegistrationRepositoryPort['recordDispatch']>[0]): Promise<void> {
    await useDatabasePersistenceExecutor(this.connection, 'registration', async (database) => {
      await database.updateTable('registration_email_dispatches').set({
        status: input.status, provider_reference: input.providerReference,
        provider_reason_code: input.providerReasonCode, last_attempt_at: new Date(input.occurredAt),
        updated_at: new Date(input.occurredAt), attempt_count: (eb) => eb('attempt_count', '+', 1),
      }).where('delivery_id', '=', input.deliveryId).execute();
    });
  }

  async consumeActionLimit(input: Parameters<RegistrationRepositoryPort['consumeActionLimit']>[0]): Promise<boolean> {
    return retrySerializable(() => runInTransaction(this.connection, { isolationLevel: 'serializable' }, async (context) =>
      useTransactionalDatabasePersistenceExecutor(context, 'registration', async (database) => {
        const now = new Date(input.occurredAt);
        const existing = await database.selectFrom('registration_public_action_limits').selectAll()
          .where('principal_digest', '=', input.principalDigest).where('action', '=', input.action).forUpdate().executeTakeFirst();
        if (!existing || existing.expires_at <= now) {
          await database.insertInto('registration_public_action_limits').values({
            principal_digest: input.principalDigest, action: input.action, window_started_at: now,
            action_count: 1, last_action_at: now, expires_at: new Date(now.getTime() + input.windowMs),
          }).onConflict((conflict) => conflict.columns(['principal_digest', 'action']).doUpdateSet({
            window_started_at: now, action_count: 1, last_action_at: now,
            expires_at: new Date(now.getTime() + input.windowMs),
          })).execute();
          return true;
        }
        if (existing.action_count >= input.maximum || now.getTime() - existing.last_action_at.getTime() < input.cooldownMs) return false;
        await database.updateTable('registration_public_action_limits').set({
          action_count: existing.action_count + 1, last_action_at: now,
        }).where('principal_digest', '=', input.principalDigest).where('action', '=', input.action).execute();
        return true;
      })));
  }

  async recordSecurityEvent(input: Parameters<RegistrationRepositoryPort['recordSecurityEvent']>[0]): Promise<void> {
    await useDatabasePersistenceExecutor(this.connection, 'registration', async (database) => {
      await database.insertInto('registration_security_events').values({
        event_id: input.eventId, registration_attempt_id: input.registrationAttemptId,
        event_type: input.eventType, result: input.result, reason_code: input.reasonCode,
        correlation_id: input.correlationId, occurred_at: new Date(input.occurredAt),
      }).execute();
    });
  }
}
