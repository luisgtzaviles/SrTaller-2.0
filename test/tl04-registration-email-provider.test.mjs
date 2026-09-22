import assert from 'node:assert/strict';
import { test } from 'node:test';

import { ResendRegistrationEmailDelivery } from '../dist/modules/registration/infrastructure/delivery/resend-registration-email.delivery.js';

const message = Object.freeze({ deliveryId: 'delivery-1', destination: 'owner@example.com', templateKey: 'registration-verification', templateVersion: 1, verificationUrl: 'https://srtaller.com/verificar#token=synthetic-token', expiresAt: '2026-09-21T13:00:00.000Z' });

test('Resend adapter uses sender and idempotency contract without exposing the API secret', async () => {
  let request;
  const adapter = new ResendRegistrationEmailDelivery('re_1234567890abcdefghijkl', 'SR Taller <no-reply@srtaller.com>', async (url, init) => { request = { url, init }; return { ok: true, async json() { return { id: 'provider-1' }; } }; });
  assert.deepEqual(await adapter.deliver(message), { status: 'DELIVERED', providerReference: 'provider-1', reasonCode: 'ACCEPTED' });
  assert.equal(request.url, 'https://api.resend.com/emails');
  assert.equal(request.init.headers['idempotency-key'], 'delivery-1');
  assert.equal(JSON.parse(request.init.body).from, 'SR Taller <no-reply@srtaller.com>');
  assert.deepEqual(adapter.toJSON(), { adapter: 'resend', sender: 'SR Taller <no-reply@srtaller.com>', apiKey: '[REDACTED]' });
  assert.doesNotMatch(JSON.stringify(adapter), /re_1234567890abcdefghijkl/u);
});

test('Resend provider failures are sanitized and retry-safe', async () => {
  const rejected = new ResendRegistrationEmailDelivery('re_1234567890abcdefghijkl', 'SR Taller <no-reply@srtaller.com>', async () => ({ ok: false, async json() { return {}; } }));
  const unavailable = new ResendRegistrationEmailDelivery('re_1234567890abcdefghijkl', 'SR Taller <no-reply@srtaller.com>', async () => { throw new Error('provider leaked detail'); });
  assert.deepEqual(await rejected.deliver(message), { status: 'FAILED', providerReference: null, reasonCode: 'PROVIDER_REJECTED' });
  assert.deepEqual(await unavailable.deliver(message), { status: 'FAILED', providerReference: null, reasonCode: 'PROVIDER_UNAVAILABLE' });
});
