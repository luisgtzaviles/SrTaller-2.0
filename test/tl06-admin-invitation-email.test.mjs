import assert from 'node:assert/strict';
import test from 'node:test';
import { inspect } from 'node:util';

import { LocalEmailDelivery, ResendEmailDelivery } from '../dist/infrastructure/email/email-delivery.js';

const invitation = Object.freeze({
  deliveryId: '11111111-1111-4111-8111-111111111111',
  destination: 'invitee@example.com',
  templateKey: 'admin-invitation',
  templateVersion: 1,
  actionUrl: 'http://127.0.0.1:4173/admin/invitaciones/aceptar#token=secret-value',
  expiresAt: '2026-09-22T12:00:00.000Z',
});

test('TL-06 reuses the shared local email transport without inspecting secrets', async () => {
  const delivery = new LocalEmailDelivery();
  assert.equal((await delivery.deliver(invitation)).status, 'DELIVERED');
  assert.equal(delivery.takeLatestForTest()?.templateKey, 'admin-invitation');
  assert.equal(JSON.stringify(delivery).includes('secret-value'), false);
});

test('TL-06 invitation-specific Resend template preserves transport safety', async () => {
  let body = '';
  const delivery = new ResendEmailDelivery('re_1234567890abcdefghijkl', 'SR Taller <no-reply@srtaller.com>', async (_url, init) => {
    body = String(init.body);
    return { ok: true, async json() { return { id: 'provider-1' }; } };
  });
  assert.equal((await delivery.deliver(invitation)).status, 'DELIVERED');
  assert.match(body, /Invitación a SR Taller/u);
  assert.match(body, /24 horas/u);
  assert.equal(inspect(delivery).includes('re_1234567890abcdefghijkl'), false);
});
