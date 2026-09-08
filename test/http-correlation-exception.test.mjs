import assert from 'node:assert/strict';
import test from 'node:test';

import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';

import { AppModule } from '../dist/app.module.js';
import { HttpCorrelationExceptionFilter } from '../dist/infrastructure/runtime/http-correlation-exception.filter.js';

const canonicalUuid =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/u;

function responseFixture() {
  const state = { body: undefined, headers: {}, status: undefined };
  const response = {
    headersSent: false,
    setHeader(name, value) { state.headers[name] = value; },
    status(value) { state.status = value; return response; },
    json(value) { state.body = value; return response; },
  };
  const host = {
    switchToHttp() {
      return { getResponse() { return response; } };
    },
  };
  return { host, state };
}

test('global filter gives malformed JSON a server UUID without echoing parser input', () => {
  const fixture = responseFixture();
  new HttpCorrelationExceptionFilter().catch(
    new BadRequestException('Unexpected token with secret-looking request text'),
    fixture.host,
  );
  assert.equal(fixture.state.status, 400);
  assert.deepEqual(fixture.state.body, { code: 'REQUEST_INVALID' });
  assert.match(fixture.state.headers['X-Correlation-ID'], canonicalUuid);
  assert.doesNotMatch(JSON.stringify(fixture.state), /secret-looking/u);
});

test('global filter preserves allowlisted application error shapes and correlates them', () => {
  const fixture = responseFixture();
  new HttpCorrelationExceptionFilter().catch(
    new ForbiddenException({ code: 'ACCESS_DENIED' }),
    fixture.host,
  );
  assert.equal(fixture.state.status, 403);
  assert.deepEqual(fixture.state.body, { code: 'ACCESS_DENIED' });
  assert.match(fixture.state.headers['X-Correlation-ID'], canonicalUuid);
});

test('real HTTP parser replaces a client correlation value on malformed JSON', async () => {
  const previousPinPepper = process.env.SR_PIN_PEPPER;
  process.env.SR_PIN_PEPPER = Buffer.alloc(32, 0x34).toString('base64url');
  let application;
  try {
    application = await NestFactory.create(AppModule, { logger: false });
    await application.listen(0, '127.0.0.1');
    const address = application.getHttpServer().address();
    assert.ok(address && typeof address !== 'string');
    const spoofed = '11111111-1111-4111-8111-111111111111';
    const response = await fetch(`http://127.0.0.1:${address.port}/api/access/session`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Correlation-ID': spoofed,
      },
      body: '{"pin":',
    });
    assert.equal(response.status, 400);
    assert.deepEqual(await response.json(), { code: 'REQUEST_INVALID' });
    const correlation = response.headers.get('x-correlation-id');
    assert.match(correlation, canonicalUuid);
    assert.notEqual(correlation, spoofed);
  } finally {
    await application?.close();
    if (previousPinPepper === undefined) delete process.env.SR_PIN_PEPPER;
    else process.env.SR_PIN_PEPPER = previousPinPepper;
  }
});
