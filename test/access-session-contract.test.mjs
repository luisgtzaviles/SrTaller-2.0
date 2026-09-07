import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import { ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';

import { AppModule } from '../dist/app.module.js';
import { OperationalSessionError } from '../dist/modules/access/application/use-cases/operational-session.use-cases.js';
import {
  AccessSessionController,
} from '../dist/modules/access/presentation/access-session.controller.js';
import {
  expireOperationalSessionCookies,
  readOperationalSessionCookies,
  requestIsSameOrigin,
  serializeOperationalSessionCookies,
  serializeOperationalSessionCsrfCookie,
} from '../dist/modules/access/presentation/access-session-cookie.js';
import { NodeSessionToken } from '../dist/modules/access/infrastructure/security/node-session-token.js';
import { createTrustedStationContext } from '../dist/modules/stations/application/contracts/trusted-station-context.js';
import { readStationCredentialCookie } from '../dist/modules/stations/infrastructure/http/station-credential-cookie.js';

const tenantId = '00000000-0000-4000-8000-000000000001';
const branchId = '00000000-0000-4000-8000-000000000101';
const stationId = '00000000-0000-4000-8000-000000000401';
const stationCredentialId = '00000000-0000-4000-8000-000000000402';
const userId = '00000000-0000-4000-8000-000000000501';
const stationAdmission = Object.freeze({
  branchAdmissionRevision: 0,
  stationAdmissionRevision: 0,
  stationBindingAdmissionRevision: 0,
  stationCredentialAdmissionRevision: 0,
});
const context = createTrustedStationContext({ tenantId, branchId, stationId, stationCredentialId, ...stationAdmission });

function responseDouble() {
  const headers = new Map();
  return {
    headers,
    setHeader(name, value) {
      headers.set(name.toLowerCase(), value);
      return this;
    },
  };
}

function sessionRecord(overrides = {}) {
  return {
    sessionId: '00000000-0000-4000-8000-000000000801',
    tenantId,
    branchId,
    stationId,
    branchAdmissionRevision: 0,
    stationAdmissionRevision: 0,
    stationBindingAdmissionRevision: 0,
    stationCredentialAdmissionRevision: 0,
    userId,
    displayName: 'Jorge Operador',
    credentialVersion: 3,
    userVersion: 0,
    userAdmissionRevision: 0,
    status: 'active',
    version: 1,
    issuedAt: '2026-09-07T12:00:00.000Z',
    lastActivityAt: '2026-09-07T12:00:01.000Z',
    expiresAt: '2026-09-08T00:00:00.000Z',
    endedAt: null,
    ...overrides,
  };
}

function runtimeDouble(overrides = {}) {
  const tokens = new NodeSessionToken();
  return {
    trustedStations: { async resolve() { return context; } },
    authenticatePin: { async execute() { return Object.freeze({}); } },
    createSession: {
      async execute() {
        const material = tokens.issue();
        return { tokens: material, session: sessionRecord({ version: 0 }) };
      },
    },
    resolveSession: { async execute() { return sessionRecord(); } },
    endSession: { async execute() {} },
    listLoginUsers: {
      async execute() { return [{ userId, displayName: 'Jorge Operador' }]; },
    },
    tokens,
    ...overrides,
  };
}

function sameOriginHeaders(cookie, csrf) {
  return {
    cookie,
    host: '127.0.0.1:4173',
    origin: 'http://127.0.0.1:4173',
    'sec-fetch-site': 'same-origin',
    'content-type': 'application/json',
    'x-sr-csrf-token': csrf,
  };
}

const secureTransportPolicy = Object.freeze({
  isExplicitLocalRequest: () => false,
  requiresSecureCookies: () => true,
});

test('Session cookies are host-only, bounded, and split bearer from readable CSRF', () => {
  const material = new NodeSessionToken().issue();
  const cookies = serializeOperationalSessionCookies(material.bearer, material.csrf, true);
  assert.equal(cookies.length, 2);
  assert.match(cookies[0], /^sr_session=.*; HttpOnly; SameSite=Strict; Path=\/; Secure; Max-Age=43200$/u);
  assert.match(cookies[1], /^sr_session_csrf=.*; SameSite=Strict; Path=\/; Secure; Max-Age=43200$/u);
  assert.doesNotMatch(cookies.join('\n'), /Domain=/u);
  assert.match(serializeOperationalSessionCsrfCookie(material.csrf, false), /^sr_session_csrf=.*; SameSite=Strict; Path=\/; Max-Age=43200$/u);
  assert.deepEqual(
    readOperationalSessionCookies(`sr_session=${material.bearer}; sr_session_csrf=${material.csrf}`),
    { bearer: material.bearer, csrf: material.csrf },
  );
  assert.throws(
    () => readOperationalSessionCookies(`sr_session=${material.bearer}; sr_session=${material.bearer}; sr_session_csrf=${material.csrf}`),
    /invalid/u,
  );
  assert.throws(
    () => readOperationalSessionCookies(`sr_session=${material.bearer}; sr_session_csrf=bad`),
    /invalid/u,
  );
  assert.throws(
    () => readOperationalSessionCookies(`sr_session=${material.bearer}; sr_session_csrf=${material.csrf}; sr_session_csrf=${material.csrf}`),
    /invalid/u,
  );
  assert.ok(expireOperationalSessionCookies(false).every((value) => value.endsWith('Max-Age=0')));
  assert.equal(readStationCredentialCookie('sr_station=valid-but-short; sr_station=duplicate'), null);
});

test('state-changing Session requests require exact same-origin browser metadata', () => {
  assert.equal(requestIsSameOrigin({ origin: 'http://127.0.0.1:4173', host: '127.0.0.1:4173', fetchSite: 'same-origin' }), true);
  assert.equal(requestIsSameOrigin({ origin: 'https://evil.example', host: '127.0.0.1:4173', fetchSite: 'cross-site' }), false);
  assert.equal(requestIsSameOrigin({ origin: 'http://127.0.0.1:4173', host: '127.0.0.1:4173' }), false);
  assert.equal(requestIsSameOrigin({ origin: 'https://app.example', host: 'app.example', forwardedProto: 'https', fetchSite: 'same-origin' }), true);
  assert.equal(requestIsSameOrigin({ origin: 'https://app.example', host: 'app.example', forwardedProto: 'http', fetchSite: 'same-origin' }), false);
});

test('owner migrations enforce monotonic admission epochs and Access migration stays owner-scoped', async () => {
  const [source, stations, users] = await Promise.all([
    readFile('src/infrastructure/database/migrations/20260907120000_access_create_operational_sessions.ts', 'utf8'),
    readFile('src/infrastructure/database/migrations/20260907110000_stations_add_admission_revisions.ts', 'utf8'),
    readFile('src/infrastructure/database/migrations/20260907111000_users_add_admission_revision.ts', 'utf8'),
  ]);
  assert.match(source, /createTable\('access_operational_sessions'\)/u);
  assert.match(source, /octet_length\(token_verifier\) = 32/u);
  assert.match(source, /octet_length\(csrf_verifier\) = 32/u);
  assert.match(source, /expires_at = issued_at \+ interval '12 hours'/u);
  assert.match(source, /access_operational_sessions_one_active_station_uq/u);
  assert.match(source, /station_credential_admission_revision/u);
  assert.match(source, /user_admission_revision/u);
  assert.match(source, /access_advance_pin_credential_version/u);
  assert.match(source, /access_sessions_validate_admission/u);
  assert.match(source, /where\(sql<SqlBool>`status = 'active'`\)/u);
  assert.doesNotMatch(source, /alterTable\('(?:branches|stations|station_bindings|station_credentials|users)'\)/u);
  assert.doesNotMatch(source, /(?:from|on) (?:branches|stations|station_bindings|station_credentials|users)\b/iu);
  assert.match(stations, /stations_advance_admission_revision/u);
  assert.match(users, /users_advance_admission_revision/u);
  assert.doesNotMatch(source, /SR_SESSION_SIGNING_KEY|plaintext|raw_token/iu);
});

test('GET is no-store, returns the minimum login snapshot, rotates malformed Session state, and preserves infrastructure errors', async () => {
  const runtime = runtimeDouble();
  const controller = new AccessSessionController(runtime, secureTransportPolicy);
  const freshResponse = responseDouble();
  const fresh = await controller.get({ cookie: 'sr_station=abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQ' }, freshResponse);
  assert.equal(freshResponse.headers.get('cache-control'), 'no-store');
  assert.deepEqual(fresh.station, { stationId, branchId });
  assert.deepEqual(fresh.users, [{ userId, displayName: 'Jorge Operador' }]);
  assert.equal(fresh.session, null);
  assert.equal(fresh.revalidateAfterMs, null);
  assert.match(fresh.csrfToken, /^[A-Za-z0-9_-]{43}$/u);
  assert.match(freshResponse.headers.get('set-cookie'), /^sr_session_csrf=/u);

  const malformedResponse = responseDouble();
  const malformed = await controller.get({
    cookie: `sr_session=${'a'.repeat(43)}; sr_session=${'a'.repeat(43)}; sr_session_csrf=${'b'.repeat(43)}`,
  }, malformedResponse);
  assert.equal(malformed.session, null);
  assert.equal(malformed.revalidateAfterMs, null);
  assert.equal(malformedResponse.headers.get('cache-control'), 'no-store');
  assert.equal(malformedResponse.headers.get('set-cookie').length, 2);
  assert.match(malformedResponse.headers.get('set-cookie')[0], /Max-Age=0/u);
  assert.match(malformedResponse.headers.get('set-cookie')[1], /^sr_session_csrf=/u);

  const material = runtime.tokens.issue();
  const infrastructureFailure = new Error('repository unavailable');
  const failing = new AccessSessionController(runtimeDouble({
    resolveSession: { async execute() { throw infrastructureFailure; } },
  }), secureTransportPolicy);
  await assert.rejects(
    failing.get({ cookie: `sr_session=${material.bearer}; sr_session_csrf=${material.csrf}` }, responseDouble()),
    infrastructureFailure,
  );
});

test('POST rejects origin, media type, and CSRF before auth; failed switch preserves cookies; success rotates both cookies', async () => {
  const runtime = runtimeDouble();
  const material = runtime.tokens.issue();
  const cookie = `sr_session=${material.bearer}; sr_session_csrf=${material.csrf}`;
  const controller = new AccessSessionController(runtime, secureTransportPolicy);

  await assert.rejects(
    controller.create({ userId, pin: '123456' }, { ...sameOriginHeaders(cookie, material.csrf), origin: 'https://evil.example' }, responseDouble()),
    ForbiddenException,
  );
  await assert.rejects(
    controller.create({ userId, pin: '123456' }, { ...sameOriginHeaders(cookie, material.csrf), 'content-type': 'text/plain' }, responseDouble()),
    ForbiddenException,
  );
  await assert.rejects(
    controller.create({ userId, pin: '123456' }, sameOriginHeaders(cookie, `${material.csrf.slice(0, -1)}x`), responseDouble()),
    UnauthorizedException,
  );

  const deniedResponse = responseDouble();
  const denied = new AccessSessionController(runtimeDouble({
    authenticatePin: { async execute() { throw new OperationalSessionError(); } },
  }), secureTransportPolicy);
  await assert.rejects(
    denied.create({ userId, pin: '000000' }, sameOriginHeaders(cookie, material.csrf), deniedResponse),
    UnauthorizedException,
  );
  assert.equal(deniedResponse.headers.has('set-cookie'), false);
  assert.equal(deniedResponse.headers.get('cache-control'), 'no-store');

  const successResponse = responseDouble();
  const success = await controller.create(
    { userId, pin: '123456' },
    sameOriginHeaders(`sr_session_csrf=${material.csrf}`, material.csrf),
    successResponse,
  );
  assert.equal(success.session.userId, userId);
  assert.equal(success.csrfToken.length, 43);
  assert.ok(success.revalidateAfterMs >= 1_000 && success.revalidateAfterMs <= 60 * 60 * 1_000);
  assert.equal(successResponse.headers.get('cache-control'), 'no-store');
  const setCookies = successResponse.headers.get('set-cookie');
  assert.equal(setCookies.length, 2);
  assert.match(setCookies[0], /^sr_session=.*; HttpOnly; SameSite=Strict; Path=\/; Secure; Max-Age=43200$/u);
  assert.match(setCookies[1], /^sr_session_csrf=.*; SameSite=Strict; Path=\/; Secure; Max-Age=43200$/u);
});

test('DELETE is no-store, rejects cross-origin and missing CSRF, expires replayed auth denials, and surfaces infrastructure failure', async () => {
  const runtime = runtimeDouble();
  const material = runtime.tokens.issue();
  const cookie = `sr_session=${material.bearer}; sr_session_csrf=${material.csrf}`;
  const controller = new AccessSessionController(runtime, secureTransportPolicy);
  await assert.rejects(
    controller.end({ ...sameOriginHeaders(cookie, material.csrf), 'sec-fetch-site': 'cross-site' }, responseDouble()),
    ForbiddenException,
  );
  await assert.rejects(
    controller.end(sameOriginHeaders(cookie, undefined), responseDouble()),
    UnauthorizedException,
  );

  const replayResponse = responseDouble();
  const replay = new AccessSessionController(runtimeDouble({
    endSession: { async execute() { throw new OperationalSessionError(); } },
  }), secureTransportPolicy);
  await replay.end(sameOriginHeaders(cookie, material.csrf), replayResponse);
  assert.equal(replayResponse.headers.get('cache-control'), 'no-store');
  assert.equal(replayResponse.headers.get('set-cookie').length, 2);
  assert.ok(replayResponse.headers.get('set-cookie').every((value) => /Max-Age=0$/u.test(value)));

  const infrastructureFailure = new Error('database unavailable');
  const failureResponse = responseDouble();
  const failing = new AccessSessionController(runtimeDouble({
    endSession: { async execute() { throw infrastructureFailure; } },
  }), secureTransportPolicy);
  await assert.rejects(
    failing.end(sameOriginHeaders(cookie, material.csrf), failureResponse),
    infrastructureFailure,
  );
  assert.equal(failureResponse.headers.get('cache-control'), 'no-store');
  assert.equal(failureResponse.headers.has('set-cookie'), false);
});

test('real AppModule/Nest routing fails closed without a trusted Station and never enables local bootstrap by default', async () => {
  const application = await NestFactory.create(AppModule, { logger: false });
  await application.listen(0, '127.0.0.1');
  try {
    const address = application.getHttpServer().address();
    assert.ok(address && typeof address !== 'string');
    const baseUrl = `http://127.0.0.1:${address.port}`;
    const session = await fetch(`${baseUrl}/api/access/session`, { redirect: 'manual' });
    assert.equal(session.status, 401);
    assert.equal(session.headers.get('cache-control'), 'no-store');
    assert.deepEqual(await session.json(), { code: 'ACCESS_SESSION_DENIED' });
    const bootstrap = await fetch(`${baseUrl}/api/stations/local-bootstrap`, {
      method: 'POST',
      headers: {
        Origin: baseUrl,
        'Sec-Fetch-Site': 'same-origin',
      },
    });
    assert.equal(bootstrap.status, 403);
    assert.equal(bootstrap.headers.has('set-cookie'), false);
  } finally {
    await application.close();
  }
});
