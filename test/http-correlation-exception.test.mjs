import assert from 'node:assert/strict';
import test from 'node:test';

import { BadRequestException, ForbiddenException } from '@nestjs/common';

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
