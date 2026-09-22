import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { test } from 'node:test';

import { LocalRegistrationEmailDelivery } from '../dist/modules/registration/infrastructure/delivery/local-registration-email.delivery.js';
import { PublicRegistrationError, PublicRegistrationService } from '../dist/modules/registration/application/use-cases/public-registration.use-cases.js';

const verifier = Object.freeze({ algorithm: 'argon2id', profileVersion: 1, pepperVersion: 1, memoryKiB: 65_536, passes: 3, parallelism: 1, salt: new Uint8Array(16).fill(1), verifier: new Uint8Array(32).fill(2) });
const configuration = Object.freeze({
  enabled: true,
  mode: 'local',
  sender: 'SR Taller <no-reply@srtaller.com>',
  publicBaseUrl: 'http://127.0.0.1:4173',
  legalDocuments: Object.freeze([
    Object.freeze({ key: 'terms', version: 'local-v1', url: '/legal/terms/local-v1' }),
    Object.freeze({ key: 'privacy', version: 'local-v1', url: '/legal/privacy/local-v1' }),
  ]),
  principalDigest(value) { return createHash('sha256').update(value).digest(); },
  createResendAdapter() { throw new Error('not available'); },
});

class MemoryRegistrationRepository {
  attempts = new Map(); challenges = new Map(); dispatches = new Map(); events = []; limits = new Map(); documents = [];
  async maintainRetention() { return { expiredAttempts: 0, purgedAttempts: 0, purgedActionLimits: 0 }; }
  async findActiveByEmail(email, now) { return [...this.attempts.values()].find((attempt) => attempt.normalizedEmail === email && ['PENDING_VERIFICATION', 'VERIFIED'].includes(attempt.status) && attempt.expiresAt > now) ?? null; }
  async findAttempt(id) { return this.attempts.get(id) ?? null; }
  async create(input) {
    if (await this.findActiveByEmail(input.attempt.normalizedEmail, input.occurredAt)) return 'ACTIVE_EMAIL_EXISTS';
    this.attempts.set(input.attempt.registrationAttemptId, input.attempt);
    this.documents.push(...input.documents.map((document) => ({ ...document, acceptanceEvidenceId: input.attempt.acceptanceEvidenceId })));
    this.challenges.set(Buffer.from(input.challenge.tokenDigest).toString('hex'), { ...input.challenge, registrationAttemptId: input.attempt.registrationAttemptId, status: 'ACTIVE' });
    this.dispatches.set(input.dispatch.deliveryId, { ...input.dispatch, status: 'PENDING' });
    return 'CREATED';
  }
  async rotateChallenge(input) {
    const attempt = await this.findActiveByEmail(input.normalizedEmail, input.occurredAt);
    if (!attempt || attempt.status !== 'PENDING_VERIFICATION') return null;
    for (const challenge of this.challenges.values()) if (challenge.registrationAttemptId === attempt.registrationAttemptId && challenge.status === 'ACTIVE') challenge.status = 'SUPERSEDED';
    this.challenges.set(Buffer.from(input.tokenDigest).toString('hex'), { challengeId: input.challengeId, tokenDigest: input.tokenDigest, expiresAt: input.challengeExpiresAt, registrationAttemptId: attempt.registrationAttemptId, status: 'ACTIVE' });
    this.dispatches.set(input.deliveryId, { status: 'PENDING' });
    return attempt;
  }
  async consumeChallenge(input) {
    const challenge = this.challenges.get(Buffer.from(input.tokenDigest).toString('hex'));
    if (!challenge || challenge.status === 'SUPERSEDED' || challenge.expiresAt <= input.occurredAt) return { outcome: 'INVALID_OR_EXPIRED', attempt: null };
    const attempt = this.attempts.get(challenge.registrationAttemptId);
    if (challenge.status === 'CONSUMED') return { outcome: 'REPLAY', attempt };
    challenge.status = 'CONSUMED';
    const verified = { ...attempt, status: 'VERIFIED', verifiedAt: input.occurredAt, version: attempt.version + 1 };
    this.attempts.set(attempt.registrationAttemptId, verified);
    return { outcome: 'VERIFIED', attempt: verified };
  }
  async markConsumed(input) {
    const attempt = this.attempts.get(input.registrationAttemptId);
    if (!attempt || attempt.status !== 'VERIFIED' || attempt.version !== input.expectedVersion) return null;
    const consumed = { ...attempt, status: 'CONSUMED', consumedAt: input.occurredAt, passwordVerifier: null, version: attempt.version + 1 };
    this.attempts.set(attempt.registrationAttemptId, consumed);
    return consumed;
  }
  async recordDispatch(input) { this.dispatches.set(input.deliveryId, { ...this.dispatches.get(input.deliveryId), ...input }); }
  async consumeActionLimit(input) {
    const key = `${Buffer.from(input.principalDigest).toString('hex')}:${input.action}`;
    const current = this.limits.get(key) ?? { count: 0, last: 0 };
    const now = Date.parse(input.occurredAt);
    if (current.count >= input.maximum || now - current.last < input.cooldownMs) return false;
    this.limits.set(key, { count: current.count + 1, last: now }); return true;
  }
  async recordSecurityEvent(input) { this.events.push(input); }
}

function createHarness({ bootstrapFailures = 0, now = () => new Date('2026-09-21T12:00:00.000Z'), delivery = new LocalRegistrationEmailDelivery() } = {}) {
  const repository = new MemoryRegistrationRepository();
  const protectedInputs = [];
  let bootstraps = 0; let failures = bootstrapFailures; let sequence = 0;
  const service = new PublicRegistrationService(
    repository,
    { async protect(input) { protectedInputs.push(input); return verifier; } },
    { async execute(input) { bootstraps += 1; const grant = await input.loadVerifiedGrant(input.verifiedRegistrationId); assert.ok(grant); if (failures-- > 0) throw new Error('synthetic bootstrap failure'); return { tenantStatus: 'ONBOARDING', completedAt: '2026-09-21T12:01:00.000Z' }; } },
    delivery,
    configuration,
    now,
    () => `00000000-0000-4000-8000-${String(++sequence).padStart(12, '0')}`,
  );
  return { service, repository, delivery, protectedInputs, bootstraps: () => bootstraps };
}

const input = Object.freeze({ personName: 'Ada Owner', workshopName: 'Taller Centro', email: ' Owner@Example.COM ', password: 'local-synthetic-password-123', acceptedDocuments: [{ key: 'terms', version: 'local-v1' }, { key: 'privacy', version: 'local-v1' }] });

test('TL-04 registration protects password once and stores independent legal evidence without plaintext', async () => {
  const harness = createHarness();
  assert.deepEqual(await harness.service.register(input, '00000000-0000-4000-8000-000000000099', '127.0.0.1'), { result: 'accepted' });
  assert.equal(harness.protectedInputs.length, 1);
  assert.equal(harness.repository.documents.length, 2);
  assert.deepEqual(harness.repository.documents.map(({ documentKey, documentVersion }) => [documentKey, documentVersion]), [['terms', 'local-v1'], ['privacy', 'local-v1']]);
  const durable = JSON.stringify({ attempts: [...harness.repository.attempts.values()], events: harness.repository.events });
  assert.doesNotMatch(durable, /local-synthetic-password-123/u);
  assert.equal(harness.delivery.takeLatestForTest().destination, 'Owner@Example.COM');
  assert.deepEqual(harness.delivery.toJSON(), { adapter: 'local', captured: 1, messages: '[REDACTED]' });
});

test('TL-04 duplicate normalized email is anti-enumerating while duplicate workshop names remain allowed', async () => {
  const first = createHarness();
  await first.service.register(input, '00000000-0000-4000-8000-000000000099', '127.0.0.1');
  const duplicate = await first.service.register({ ...input, email: 'owner@example.com' }, '00000000-0000-4000-8000-000000000098', '127.0.0.1');
  assert.deepEqual(duplicate, { result: 'accepted' });
  assert.equal(first.repository.attempts.size, 1);
  const second = createHarness();
  await second.service.register({ ...input, email: 'beta@example.com' }, '00000000-0000-4000-8000-000000000097', '127.0.0.2');
  assert.equal(second.repository.attempts.size, 1);
});

test('TL-04 resend supersedes old token and verification/bootstrap replay converges', async () => {
  const harness = createHarness({ bootstrapFailures: 1 });
  await harness.service.register(input, '00000000-0000-4000-8000-000000000099', '127.0.0.1');
  const firstToken = new URL(harness.delivery.takeLatestForTest().verificationUrl).hash.slice('#token='.length);
  await harness.service.resend({ email: 'owner@example.com' }, '00000000-0000-4000-8000-000000000098', '127.0.0.1');
  const secondToken = new URL(harness.delivery.takeLatestForTest().verificationUrl).hash.slice('#token='.length);
  assert.notEqual(firstToken, secondToken);
  assert.deepEqual(await harness.service.verify({ token: firstToken }, '00000000-0000-4000-8000-000000000097', '127.0.0.1'), { result: 'invalid_or_expired' });
  assert.deepEqual(await harness.service.verify({ token: secondToken }, '00000000-0000-4000-8000-000000000096', '127.0.0.1'), { result: 'retryable' });
  assert.deepEqual(await harness.service.verify({ token: secondToken }, '00000000-0000-4000-8000-000000000095', '127.0.0.2'), { result: 'completed', loginUrl: 'https://admin.srtaller.com/login' });
  assert.deepEqual(await harness.service.verify({ token: secondToken }, '00000000-0000-4000-8000-000000000094', '127.0.0.3'), { result: 'completed', loginUrl: 'https://admin.srtaller.com/login' });
  assert.equal(harness.bootstraps(), 2);
  assert.equal([...harness.repository.attempts.values()][0].passwordVerifier, null);
});

test('TL-04 legal/input failures are sanitized', async () => {
  const harness = createHarness();
  await assert.rejects(() => harness.service.register({ ...input, acceptedDocuments: [] }, '00000000-0000-4000-8000-000000000099'), (error) => error instanceof PublicRegistrationError && error.code === 'REGISTRATION_INPUT_INVALID');
});

test('TL-04 resend enforces cooldown and five-per-hour on normalized email independent of network signal', async () => {
  let clock = Date.parse('2026-09-21T12:00:00.000Z');
  const harness = createHarness({ now: () => new Date(clock) });
  await harness.service.register(input, '00000000-0000-4000-8000-000000000099', '198.51.100.1');
  assert.equal(harness.delivery.toJSON().captured, 1);
  await harness.service.resend({ email: 'OWNER@example.com' }, '00000000-0000-4000-8000-000000000098', '198.51.100.2');
  assert.equal(harness.delivery.toJSON().captured, 2);
  await harness.service.resend({ email: 'owner@example.com' }, '00000000-0000-4000-8000-000000000097', '198.51.100.3');
  assert.equal(harness.delivery.toJSON().captured, 2);
  for (let request = 2; request <= 6; request += 1) {
    clock += 61_000;
    await harness.service.resend({ email: 'owner@example.com' }, `00000000-0000-4000-8000-${String(90 - request).padStart(12, '0')}`, `198.51.100.${request + 3}`);
  }
  assert.equal(harness.delivery.toJSON().captured, 6);
});

test('TL-04 verification guessing is bounded per ephemeral network signal', async () => {
  const harness = createHarness();
  await harness.service.register(input, '00000000-0000-4000-8000-000000000099', '198.51.100.1');
  const validToken = new URL(harness.delivery.takeLatestForTest().verificationUrl).hash.slice('#token='.length);
  for (let attempt = 0; attempt < 10; attempt += 1) {
    const wrongToken = Buffer.alloc(32, attempt + 1).toString('base64url');
    assert.deepEqual(await harness.service.verify({ token: wrongToken }, `00000000-0000-4000-8000-${String(attempt + 200).padStart(12, '0')}`, '198.51.100.9'), { result: 'invalid_or_expired' });
  }
  assert.deepEqual(await harness.service.verify({ token: validToken }, '00000000-0000-4000-8000-000000000250', '198.51.100.9'), { result: 'invalid_or_expired' });
  assert.deepEqual(await harness.service.verify({ token: validToken }, '00000000-0000-4000-8000-000000000251', '198.51.100.10'), { result: 'completed', loginUrl: 'https://admin.srtaller.com/login' });
});

test('TL-04 provider failure preserves the pending attempt and records only a sanitized dispatch outcome', async () => {
  const delivery = { async deliver() { return { status: 'FAILED', providerReference: null, reasonCode: 'PROVIDER_UNAVAILABLE' }; } };
  const harness = createHarness({ delivery });
  assert.deepEqual(await harness.service.register(input, '00000000-0000-4000-8000-000000000099', '198.51.100.1'), { result: 'accepted' });
  assert.equal(harness.repository.attempts.size, 1);
  assert.equal([...harness.repository.attempts.values()][0].status, 'PENDING_VERIFICATION');
  assert.deepEqual([...harness.repository.dispatches.values()][0], {
    challengeId: '00000000-0000-4000-8000-000000000006',
    deliveryId: '00000000-0000-4000-8000-000000000007',
    status: 'FAILED',
    providerReference: null,
    providerReasonCode: 'PROVIDER_UNAVAILABLE',
    occurredAt: '2026-09-21T12:00:00.000Z',
  });
});
