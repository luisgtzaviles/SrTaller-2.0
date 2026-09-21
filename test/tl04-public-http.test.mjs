import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';

import { BadRequestException, ForbiddenException, ServiceUnavailableException } from '@nestjs/common';
import { PublicRegistrationController } from '../dist/modules/registration/presentation/public-registration.controller.js';
import { PublicRegistrationError } from '../dist/modules/registration/application/use-cases/public-registration.use-cases.js';

const headers = Object.freeze({
  'content-type': 'application/json',
  'content-length': '128',
  'sec-fetch-site': 'same-origin',
  origin: 'https://srtaller.com',
  host: 'srtaller.com',
});

function response() {
  const values = new Map();
  return { values, setHeader(name, value) { values.set(name.toLowerCase(), value); } };
}

test('public registration HTTP returns no-store and server-generated correlation metadata', async () => {
  const calls = [];
  const controller = new PublicRegistrationController({
    policy() { return { enabled: true, documents: [] }; },
    async register(body, correlationId, networkSignal) { calls.push({ body, correlationId, networkSignal }); return { result: 'accepted' }; },
  });
  const reply = response();
  assert.deepEqual(await controller.register({ safe: true }, headers, '203.0.113.4', reply), { result: 'accepted' });
  assert.equal(reply.values.get('cache-control'), 'no-store');
  assert.equal(reply.values.get('referrer-policy'), 'no-referrer');
  assert.match(reply.values.get('x-correlation-id'), /^[0-9a-f-]{36}$/u);
  assert.equal(calls[0].correlationId, reply.values.get('x-correlation-id'));
  assert.equal(calls[0].networkSignal, '203.0.113.4');
});

test('public mutation rejects cross-site, non-JSON and oversized requests before service execution', async () => {
  let calls = 0;
  const controller = new PublicRegistrationController({ async register() { calls += 1; } });
  for (const altered of [
    { ...headers, 'sec-fetch-site': 'cross-site' },
    { ...headers, 'content-type': 'text/plain' },
    { ...headers, 'content-length': '16385' },
    { ...headers, origin: 'https://evil.example' },
  ]) {
    await assert.rejects(() => controller.register({}, altered, '203.0.113.4', response()), ForbiddenException);
  }
  assert.equal(calls, 0);
});

test('public registration errors are sanitized without enumeration detail', async () => {
  const input = new PublicRegistrationController({ async register() { throw new PublicRegistrationError('REGISTRATION_INPUT_INVALID'); } });
  const disabled = new PublicRegistrationController({ async register() { throw new PublicRegistrationError('REGISTRATION_DISABLED'); } });
  await assert.rejects(() => input.register({}, headers, '203.0.113.4', response()), (error) => error instanceof BadRequestException && error.getResponse().code === 'REGISTRATION_INPUT_INVALID');
  await assert.rejects(() => disabled.register({}, headers, '203.0.113.4', response()), (error) => error instanceof ServiceUnavailableException && error.getResponse().code === 'REGISTRATION_UNAVAILABLE');
});

test('public route owns the strict 16kb parser before the catalog parser', async () => {
  const source = await readFile(new URL('../src/main.ts', import.meta.url), 'utf8');
  const narrow = source.indexOf("application.use('/api/public', json({ limit: '16kb', strict: true }))");
  const broad = source.indexOf("application.useBodyParser('json', { limit: '20mb' })");
  assert.ok(narrow >= 0 && broad > narrow);
});
