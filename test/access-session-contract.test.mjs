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
  readOperationalSessionLoginCsrfCookie,
  requestIsSameOrigin,
  serializeOperationalSessionCookies,
  serializeOperationalSessionCsrfCookie,
  serializeOperationalSessionLoginCsrfCookie,
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

test('Session cookies split the authoritative pair from a bounded login-only CSRF challenge', () => {
  const material = new NodeSessionToken().issue();
  const cookies = serializeOperationalSessionCookies(material.bearer, material.csrf, true);
  assert.equal(cookies.length, 2);
  assert.match(cookies[0], /^sr_session=.*; HttpOnly; SameSite=Strict; Path=\/; Secure; Max-Age=43200$/u);
  assert.match(cookies[1], /^sr_session_csrf=.*; SameSite=Strict; Path=\/; Secure; Max-Age=43200$/u);
  assert.doesNotMatch(cookies.join('\n'), /Domain=/u);
  assert.match(serializeOperationalSessionCsrfCookie(material.csrf, false), /^sr_session_csrf=.*; SameSite=Strict; Path=\/; Max-Age=43200$/u);
  assert.match(
    serializeOperationalSessionLoginCsrfCookie(material.csrf, false),
    /^sr_session_login_csrf=.*; SameSite=Strict; Path=\/api\/access\/session; Max-Age=900$/u,
  );
  assert.equal(
    readOperationalSessionLoginCsrfCookie(`sr_session_login_csrf=${material.csrf}`),
    material.csrf,
  );
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

test('GET is no-store, mutates only the login challenge, and preserves active cookies and infrastructure errors', async () => {
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
  assert.match(freshResponse.headers.get('set-cookie'), /^sr_session_login_csrf=/u);

  const malformedResponse = responseDouble();
  const malformed = await controller.get({
    cookie: `sr_session=${'a'.repeat(43)}; sr_session=${'a'.repeat(43)}; sr_session_csrf=${'b'.repeat(43)}`,
  }, malformedResponse);
  assert.equal(malformed.session, null);
  assert.equal(malformed.revalidateAfterMs, null);
  assert.equal(malformedResponse.headers.get('cache-control'), 'no-store');
  assert.match(malformedResponse.headers.get('set-cookie'), /^sr_session_login_csrf=/u);
  assert.doesNotMatch(malformedResponse.headers.get('set-cookie'), /^sr_session(?:=|_csrf=)/u);

  const material = runtime.tokens.issue();
  const inactiveMaterial = runtime.tokens.issue();
  const inactiveResponse = responseDouble();
  const inactive = new AccessSessionController(runtimeDouble({
    resolveSession: { async execute() { throw new OperationalSessionError(); } },
  }), secureTransportPolicy);
  const inactiveSnapshot = await inactive.get({
    cookie: `sr_session=${inactiveMaterial.bearer}; sr_session_csrf=${inactiveMaterial.csrf}; sr_session_login_csrf=${material.csrf}`,
  }, inactiveResponse);
  assert.equal(inactiveSnapshot.session, null);
  assert.equal(inactiveSnapshot.csrfToken, material.csrf);
  assert.equal(inactiveResponse.headers.has('set-cookie'), false);

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
    controller.create({ userId, pin: '123456', expectedSessionId: sessionRecord().sessionId }, { ...sameOriginHeaders(cookie, material.csrf), origin: 'https://evil.example' }, responseDouble()),
    ForbiddenException,
  );
  await assert.rejects(
    controller.create({ userId, pin: '123456', expectedSessionId: sessionRecord().sessionId }, { ...sameOriginHeaders(cookie, material.csrf), 'content-type': 'text/plain' }, responseDouble()),
    ForbiddenException,
  );
  await assert.rejects(
    controller.create({ userId, pin: '123456', expectedSessionId: sessionRecord().sessionId }, sameOriginHeaders(cookie, `${material.csrf.slice(0, -1)}x`), responseDouble()),
    UnauthorizedException,
  );

  const deniedResponse = responseDouble();
  const denied = new AccessSessionController(runtimeDouble({
    authenticatePin: { async execute() { throw new OperationalSessionError(); } },
  }), secureTransportPolicy);
  await assert.rejects(
    denied.create({ userId, pin: '000000', expectedSessionId: sessionRecord().sessionId }, sameOriginHeaders(cookie, material.csrf), deniedResponse),
    UnauthorizedException,
  );
  assert.equal(deniedResponse.headers.has('set-cookie'), false);
  assert.equal(deniedResponse.headers.get('cache-control'), 'no-store');

  const successResponse = responseDouble();
  const success = await controller.create(
    { userId, pin: '123456', expectedSessionId: null },
    sameOriginHeaders(`sr_session_login_csrf=${material.csrf}`, material.csrf),
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

test('POST requires exact optimistic state and never accepts the login challenge as switch CSRF', async () => {
  const tokens = new NodeSessionToken();
  const active = tokens.issue();
  const login = tokens.issue();
  const cookie = [
    `sr_session=${active.bearer}`,
    `sr_session_csrf=${active.csrf}`,
    `sr_session_login_csrf=${login.csrf}`,
  ].join('; ');
  let authenticationCalls = 0;
  let creationCalls = 0;
  let observedExpectedSessionId;
  const runtime = runtimeDouble({
    authenticatePin: {
      async execute() {
        authenticationCalls += 1;
        return Object.freeze({});
      },
    },
    createSession: {
      async execute(_context, _proof, expectedSessionId) {
        creationCalls += 1;
        observedExpectedSessionId = expectedSessionId;
        const material = tokens.issue();
        return { tokens: material, session: sessionRecord({ version: 0 }) };
      },
    },
  });
  const controller = new AccessSessionController(runtime, secureTransportPolicy);
  for (const invalidBody of [
    { userId, pin: '123456' },
    { userId, pin: '123456', expectedSessionId: 'not-a-session-id' },
    { userId, pin: '123456', expectedSessionId: null, extra: true },
  ]) {
    const response = responseDouble();
    await assert.rejects(
      controller.create(invalidBody, sameOriginHeaders(cookie, login.csrf), response),
      UnauthorizedException,
    );
    assert.equal(response.headers.has('set-cookie'), false);
  }
  assert.equal(authenticationCalls, 0);
  assert.equal(creationCalls, 0);

  const expectedSessionId = sessionRecord().sessionId;
  await assert.rejects(
    controller.create(
      { userId, pin: '123456', expectedSessionId },
      sameOriginHeaders(cookie, login.csrf),
      responseDouble(),
    ),
    UnauthorizedException,
  );
  assert.equal(authenticationCalls, 0);

  await controller.create(
    { userId, pin: '123456', expectedSessionId },
    sameOriginHeaders(cookie, active.csrf),
    responseDouble(),
  );
  assert.equal(authenticationCalls, 1);
  assert.equal(creationCalls, 1);
  assert.equal(observedExpectedSessionId, expectedSessionId);

  await controller.create(
    { userId, pin: '123456', expectedSessionId: null },
    sameOriginHeaders(cookie, login.csrf),
    responseDouble(),
  );
  assert.equal(observedExpectedSessionId, null);

  const malformedAuthoritativeCookie = [
    `sr_session=${active.bearer}`,
    `sr_session=${active.bearer}`,
    `sr_session_csrf=${active.csrf}`,
    `sr_session_login_csrf=${login.csrf}`,
  ].join('; ');
  await controller.create(
    { userId, pin: '123456', expectedSessionId: null },
    sameOriginHeaders(malformedAuthoritativeCookie, login.csrf),
    responseDouble(),
  );
  assert.equal(authenticationCalls, 3);
  assert.equal(creationCalls, 3);
  assert.equal(observedExpectedSessionId, null);
});

test('POST switch proves the authoritative bearer belongs to the expected active Session before PIN authentication', async () => {
  const tokens = new NodeSessionToken();
  const forged = tokens.issue();
  const expectedSessionId = sessionRecord().sessionId;
  let authenticationCalls = 0;
  let creationCalls = 0;
  const controller = new AccessSessionController(runtimeDouble({
    resolveSession: {
      async execute() {
        throw new OperationalSessionError();
      },
    },
    authenticatePin: {
      async execute() {
        authenticationCalls += 1;
        return Object.freeze({});
      },
    },
    createSession: {
      async execute() {
        creationCalls += 1;
        throw new Error('must not create');
      },
    },
  }), secureTransportPolicy);
  const forgedResponse = responseDouble();
  await assert.rejects(
    controller.create(
      { userId, pin: '123456', expectedSessionId },
      sameOriginHeaders(
        `sr_session=${forged.bearer}; sr_session_csrf=${forged.csrf}`,
        forged.csrf,
      ),
      forgedResponse,
    ),
    UnauthorizedException,
  );
  assert.equal(authenticationCalls, 0);
  assert.equal(creationCalls, 0);
  assert.equal(forgedResponse.headers.has('set-cookie'), false);

  const other = tokens.issue();
  const mismatchResponse = responseDouble();
  const mismatch = new AccessSessionController(runtimeDouble({
    resolveSession: {
      async execute() {
        return sessionRecord({ sessionId: '00000000-0000-4000-8000-000000000802' });
      },
    },
    authenticatePin: {
      async execute() {
        authenticationCalls += 1;
        return Object.freeze({});
      },
    },
    createSession: {
      async execute() {
        creationCalls += 1;
        throw new Error('must not create');
      },
    },
  }), secureTransportPolicy);
  await assert.rejects(
    mismatch.create(
      { userId, pin: '123456', expectedSessionId },
      sameOriginHeaders(
        `sr_session=${other.bearer}; sr_session_csrf=${other.csrf}`,
        other.csrf,
      ),
      mismatchResponse,
    ),
    UnauthorizedException,
  );
  assert.equal(authenticationCalls, 0);
  assert.equal(creationCalls, 0);
  assert.equal(mismatchResponse.headers.has('set-cookie'), false);
});

test('adversarial response completion cannot let stale GET or DELETE overwrite a newer authoritative cookie pair', async () => {
  const tokens = new NodeSessionToken();
  const previous = tokens.issue();
  const current = tokens.issue();
  const jar = new Map();
  const applySetCookie = (header) => {
    for (const value of header === undefined ? [] : Array.isArray(header) ? header : [header]) {
      const [pair] = value.split(';', 1);
      const separator = pair.indexOf('=');
      jar.set(pair.slice(0, separator), pair.slice(separator + 1));
    }
  };

  applySetCookie(serializeOperationalSessionCookies(current.bearer, current.csrf, true));

  const delayedGetResponse = responseDouble();
  const delayedGet = new AccessSessionController(runtimeDouble({
    resolveSession: { async execute() { throw new OperationalSessionError(); } },
  }), secureTransportPolicy);
  await delayedGet.get({
    cookie: `sr_session=${previous.bearer}; sr_session_csrf=${previous.csrf}`,
  }, delayedGetResponse);
  applySetCookie(delayedGetResponse.headers.get('set-cookie'));
  assert.equal(jar.get('sr_session'), current.bearer);
  assert.equal(jar.get('sr_session_csrf'), current.csrf);
  assert.match(jar.get('sr_session_login_csrf'), /^[A-Za-z0-9_-]{43}$/u);

  const replayedDeleteResponse = responseDouble();
  const replayedDelete = new AccessSessionController(runtimeDouble({
    endSession: { async execute() { throw new OperationalSessionError(); } },
  }), secureTransportPolicy);
  await replayedDelete.end(
    sameOriginHeaders(
      `sr_session=${previous.bearer}; sr_session_csrf=${previous.csrf}`,
      previous.csrf,
    ),
    replayedDeleteResponse,
  );
  applySetCookie(replayedDeleteResponse.headers.get('set-cookie'));
  assert.equal(jar.get('sr_session'), current.bearer);
  assert.equal(jar.get('sr_session_csrf'), current.csrf);
});

test('DELETE is no-store, rejects cross-origin and missing CSRF, preserves newer cookies on replay denial, and surfaces infrastructure failure', async () => {
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

  const successResponse = responseDouble();
  await controller.end(sameOriginHeaders(cookie, material.csrf), successResponse);
  assert.equal(successResponse.headers.get('cache-control'), 'no-store');
  assert.equal(successResponse.headers.get('set-cookie').length, 2);
  assert.ok(successResponse.headers.get('set-cookie').every((value) => /Max-Age=0$/u.test(value)));

  const replayResponse = responseDouble();
  const replay = new AccessSessionController(runtimeDouble({
    endSession: { async execute() { throw new OperationalSessionError(); } },
  }), secureTransportPolicy);
  await replay.end(sameOriginHeaders(cookie, material.csrf), replayResponse);
  assert.equal(replayResponse.headers.get('cache-control'), 'no-store');
  assert.equal(replayResponse.headers.has('set-cookie'), false);

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
  const previousPinPepper = process.env.SR_PIN_PEPPER;
  process.env.SR_PIN_PEPPER = Buffer.alloc(32, 0x34).toString('base64url');
  let application;
  try {
    application = await NestFactory.create(AppModule, { logger: false });
    await application.listen(0, '127.0.0.1');
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
    await application?.close();
    if (previousPinPepper === undefined) delete process.env.SR_PIN_PEPPER;
    else process.env.SR_PIN_PEPPER = previousPinPepper;
  }
});
