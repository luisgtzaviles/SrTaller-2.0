import { randomBytes, randomUUID } from 'node:crypto';

import type { RegistrationPasswordProtector, TenantBootstrapExecutor } from '../../../access/index.js';
import type { RegistrationRuntimeConfiguration } from '../../../../infrastructure/runtime/index.js';
import type { RegistrationEmailDeliveryPort } from '../ports/registration-email-delivery.port.js';
import type { RegistrationAttemptRecord, RegistrationRepositoryPort } from '../ports/registration-repository.port.js';
import {
  REGISTRATION_ATTEMPT_TTL_MS,
  REGISTRATION_CHALLENGE_TTL_MS,
  REGISTRATION_RESEND_COOLDOWN_MS,
  REGISTRATION_RESEND_LIMIT_PER_HOUR,
  digestVerificationToken,
  normalizeRegistrationEmail,
  parseRegistrationDisplayName,
  parseWorkshopDisplayName,
  registrationApprovedInputDigest,
} from '../../domain/registration-attempt.js';

export class PublicRegistrationError extends Error {
  constructor(readonly code: 'REGISTRATION_DISABLED' | 'REGISTRATION_INPUT_INVALID') {
    super('Public registration request cannot be completed.');
    this.name = 'PublicRegistrationError';
  }
}

function exactObject(value: unknown, keys: readonly string[]): Readonly<Record<string, unknown>> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) throw new PublicRegistrationError('REGISTRATION_INPUT_INVALID');
  const input = value as Readonly<Record<string, unknown>>;
  const actual = Object.keys(input).sort();
  const expected = [...keys].sort();
  if (actual.length !== expected.length || actual.some((key, index) => key !== expected[index])) throw new PublicRegistrationError('REGISTRATION_INPUT_INVALID');
  return input;
}

function tokenMaterial(): Readonly<{ plaintext: string; digest: Uint8Array }> {
  const plaintext = randomBytes(32).toString('base64url');
  return Object.freeze({ plaintext, digest: digestVerificationToken(plaintext) });
}

export class PublicRegistrationService {
  constructor(
    private readonly repository: RegistrationRepositoryPort,
    private readonly passwords: RegistrationPasswordProtector,
    private readonly bootstrap: TenantBootstrapExecutor,
    private readonly delivery: RegistrationEmailDeliveryPort,
    private readonly configuration: RegistrationRuntimeConfiguration,
    private readonly now: () => Date = () => new Date(),
    private readonly createId: () => string = randomUUID,
  ) {}

  policy() {
    return Object.freeze({
      enabled: this.configuration.enabled,
      documents: this.configuration.enabled ? this.configuration.legalDocuments : Object.freeze([]),
    });
  }

  async register(value: unknown, correlationId: string, networkSignal = 'unavailable'): Promise<Readonly<{ result: 'accepted' }>> {
    if (!this.configuration.enabled) throw new PublicRegistrationError('REGISTRATION_DISABLED');
    const input = exactObject(value, ['personName', 'workshopName', 'email', 'password', 'acceptedDocuments']);
    const personDisplayName = parseRegistrationDisplayName(input.personName);
    const workshopDisplayName = parseWorkshopDisplayName(input.workshopName);
    const email = normalizeRegistrationEmail(input.email);
    const accepted = input.acceptedDocuments;
    if (!Array.isArray(accepted) || accepted.length !== this.configuration.legalDocuments.length ||
      !this.configuration.legalDocuments.every((document) => accepted.some((candidate) =>
        typeof candidate === 'object' && candidate !== null &&
        (candidate as Record<string, unknown>).key === document.key &&
        (candidate as Record<string, unknown>).version === document.version))) {
      throw new PublicRegistrationError('REGISTRATION_INPUT_INVALID');
    }
    const now = this.now();
    const occurredAt = now.toISOString();
    await this.repository.maintainRetention({ occurredAt, retentionDays: 30, maximumAttempts: 100 });
    const principal = this.configuration.principalDigest(`register:${email.normalized}:${networkSignal}`);
    const allowed = await this.repository.consumeActionLimit({
      principalDigest: principal, action: 'REGISTER', occurredAt,
      windowMs: 60 * 60 * 1_000, maximum: 10, cooldownMs: 5_000,
    });
    if (!allowed) return Object.freeze({ result: 'accepted' });
    const existing = await this.repository.findActiveByEmail(email.normalized, occurredAt);
    if (existing) return Object.freeze({ result: 'accepted' });

    const registrationAttemptId = this.createId();
    const tenantId = this.createId();
    const firstUserId = this.createId();
    const adminIdentityId = this.createId();
    const acceptanceEvidenceId = this.createId();
    const challengeId = this.createId();
    const deliveryId = this.createId();
    const token = tokenMaterial();
    const passwordVerifier = await this.passwords.protect({ tenantId, adminIdentityId, password: input.password });
    const approvedInputDigest = registrationApprovedInputDigest({
      personDisplayName, workshopDisplayName, normalizedEmail: email.normalized, acceptanceEvidenceId,
    });
    const attempt: RegistrationAttemptRecord = Object.freeze({
      registrationAttemptId, status: 'PENDING_VERIFICATION', personDisplayName,
      workshopDisplayName, normalizedEmail: email.normalized, emailDisplay: email.display,
      tenantId, firstUserId, adminIdentityId, acceptanceEvidenceId,
      approvedInputDigest, registrationRevision: 1, passwordVerifier,
      expiresAt: new Date(now.getTime() + REGISTRATION_ATTEMPT_TTL_MS).toISOString(),
      verifiedAt: null, consumedAt: null, version: 0,
    });
    const result = await this.repository.create({
      attempt,
      documents: this.configuration.legalDocuments.map((document) => ({ documentKey: document.key, documentVersion: document.version })),
      challenge: { challengeId, tokenDigest: token.digest, expiresAt: new Date(now.getTime() + REGISTRATION_CHALLENGE_TTL_MS).toISOString() },
      dispatch: { deliveryId, challengeId }, occurredAt,
    });
    if (result === 'CREATED') {
      await this.deliver({ attempt, challengeId, deliveryId, token: token.plaintext, occurredAt });
      await this.audit(registrationAttemptId, 'REGISTRATION_ATTEMPT_CREATED', 'SUCCEEDED', 'ATTEMPT_CREATED', correlationId, occurredAt);
    }
    return Object.freeze({ result: 'accepted' });
  }

  async resend(value: unknown, correlationId: string, _networkSignal = 'unavailable'): Promise<Readonly<{ result: 'accepted'; retryAfterSeconds: 60 }>> {
    if (!this.configuration.enabled) throw new PublicRegistrationError('REGISTRATION_DISABLED');
    const input = exactObject(value, ['email']);
    let email;
    try { email = normalizeRegistrationEmail(input.email); } catch { return Object.freeze({ result: 'accepted', retryAfterSeconds: 60 }); }
    const now = this.now();
    const occurredAt = now.toISOString();
    await this.repository.maintainRetention({ occurredAt, retentionDays: 30, maximumAttempts: 100 });
    const allowed = await this.repository.consumeActionLimit({
      principalDigest: this.configuration.principalDigest(`resend:${email.normalized}`), action: 'RESEND', occurredAt,
      windowMs: 60 * 60 * 1_000, maximum: REGISTRATION_RESEND_LIMIT_PER_HOUR,
      cooldownMs: REGISTRATION_RESEND_COOLDOWN_MS,
    });
    if (!allowed) return Object.freeze({ result: 'accepted', retryAfterSeconds: 60 });
    const token = tokenMaterial();
    const challengeId = this.createId();
    const deliveryId = this.createId();
    const attempt = await this.repository.rotateChallenge({
      normalizedEmail: email.normalized, challengeId, tokenDigest: token.digest,
      challengeExpiresAt: new Date(now.getTime() + REGISTRATION_CHALLENGE_TTL_MS).toISOString(),
      deliveryId, occurredAt,
    });
    if (attempt) {
      await this.deliver({ attempt, challengeId, deliveryId, token: token.plaintext, occurredAt });
      await this.audit(attempt.registrationAttemptId, 'REGISTRATION_CHALLENGE_ROTATED', 'SUCCEEDED', 'CHALLENGE_ROTATED', correlationId, occurredAt);
    }
    return Object.freeze({ result: 'accepted', retryAfterSeconds: 60 });
  }

  async verify(value: unknown, correlationId: string, networkSignal = 'unavailable'): Promise<Readonly<{ result: 'completed' | 'retryable' | 'invalid_or_expired'; loginUrl?: string }>> {
    if (!this.configuration.enabled) throw new PublicRegistrationError('REGISTRATION_DISABLED');
    const input = exactObject(value, ['token']);
    let digest;
    try { digest = digestVerificationToken(input.token); } catch { return Object.freeze({ result: 'invalid_or_expired' }); }
    const occurredAt = this.now().toISOString();
    await this.repository.maintainRetention({ occurredAt, retentionDays: 30, maximumAttempts: 100 });
    const allowed = await this.repository.consumeActionLimit({
      principalDigest: this.configuration.principalDigest(`verify:${networkSignal}`),
      action: 'VERIFY', occurredAt, windowMs: 60 * 60 * 1_000, maximum: 10, cooldownMs: 0,
    });
    if (!allowed) return Object.freeze({ result: 'invalid_or_expired' });
    const consumed = await this.repository.consumeChallenge({ tokenDigest: digest, occurredAt });
    if (!consumed.attempt) return Object.freeze({ result: 'invalid_or_expired' });
    if (consumed.attempt.status === 'CONSUMED') return this.completed();
    try {
      await this.bootstrap.execute({
        verifiedRegistrationId: consumed.attempt.registrationAttemptId,
        correlationId,
        loadVerifiedGrant: async (registrationId) => this.grant(registrationId),
      });
      const current = await this.repository.findAttempt(consumed.attempt.registrationAttemptId);
      if (!current) return Object.freeze({ result: 'retryable' });
      const completed = await this.repository.markConsumed({
        registrationAttemptId: current.registrationAttemptId,
        expectedVersion: current.version,
        tenantId: current.tenantId,
        userId: current.firstUserId,
        occurredAt,
      });
      if (!completed) {
        const replay = await this.repository.findAttempt(current.registrationAttemptId);
        if (replay?.status !== 'CONSUMED') return Object.freeze({ result: 'retryable' });
      }
      await this.audit(current.registrationAttemptId, 'REGISTRATION_BOOTSTRAP_COMPLETED', 'SUCCEEDED', 'TENANT_BOOTSTRAPPED', correlationId, occurredAt);
      return this.completed();
    } catch {
      await this.audit(consumed.attempt.registrationAttemptId, 'REGISTRATION_BOOTSTRAP_RETRYABLE', 'FAILED', 'BOOTSTRAP_RETRYABLE', correlationId, occurredAt);
      return Object.freeze({ result: 'retryable' });
    }
  }

  private completed() {
    return Object.freeze({ result: 'completed' as const, loginUrl: 'https://admin.srtaller.com/login' });
  }

  private async grant(registrationAttemptId: string) {
    const attempt = await this.repository.findAttempt(registrationAttemptId);
    if (!attempt || attempt.status !== 'VERIFIED' || !attempt.passwordVerifier || !attempt.verifiedAt) return null;
    return Object.freeze({
      verifiedRegistrationId: attempt.registrationAttemptId,
      registrationRevision: attempt.registrationRevision,
      approvedInputDigest: attempt.approvedInputDigest,
      tenantId: attempt.tenantId,
      firstUserId: attempt.firstUserId,
      adminIdentityId: attempt.adminIdentityId,
      personDisplayName: attempt.personDisplayName,
      workshopDisplayName: attempt.workshopDisplayName,
      normalizedEmail: attempt.normalizedEmail,
      emailDisplay: attempt.emailDisplay,
      verifiedAt: attempt.verifiedAt,
      passwordVerifier: attempt.passwordVerifier,
      termsAcceptanceEvidenceId: attempt.acceptanceEvidenceId,
    });
  }

  private async deliver(input: Readonly<{ attempt: RegistrationAttemptRecord; challengeId: string; deliveryId: string; token: string; occurredAt: string }>): Promise<void> {
    const verificationUrl = `${this.configuration.publicBaseUrl}/verificar#token=${input.token}`;
    const result = await this.delivery.deliver({
      deliveryId: input.deliveryId, destination: input.attempt.emailDisplay,
      templateKey: 'registration-verification', templateVersion: 1,
      verificationUrl, expiresAt: new Date(Date.parse(input.occurredAt) + REGISTRATION_CHALLENGE_TTL_MS).toISOString(),
    });
    await this.repository.recordDispatch({
      deliveryId: input.deliveryId, status: result.status,
      providerReference: result.providerReference,
      providerReasonCode: result.reasonCode, occurredAt: input.occurredAt,
    });
  }

  private audit(registrationAttemptId: string | null, eventType: string, result: 'SUCCEEDED' | 'DENIED' | 'FAILED', reasonCode: string, correlationId: string, occurredAt: string) {
    return this.repository.recordSecurityEvent({
      eventId: this.createId(), registrationAttemptId, eventType, result, reasonCode, correlationId, occurredAt,
    });
  }
}
