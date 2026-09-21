import assert from 'node:assert/strict';
import test from 'node:test';

import { UnauthorizedException } from '@nestjs/common';

import { AdminSessionController } from '../dist/modules/access/presentation/admin-session.controller.js';
import {
  adminSessionCookieName,
  adminSessionCsrfCookieName,
  adminSessionLoginCsrfCookieName,
  expireAdminSessionCookies,
  readAdminSessionCookies,
  serializeAdminSessionCookies,
  serializeAdminSessionLoginCsrfCookie,
} from '../dist/modules/access/presentation/admin-session-cookie.js';
import { readOperationalSessionCookies } from '../dist/modules/access/presentation/access-session-cookie.js';
import { NodeAdminSessionToken } from '../dist/modules/access/infrastructure/security/node-admin-session-token.js';

function responseStub() {
  const headers = new Map();
  return {
    headers,
    setHeader(name, value) { headers.set(name.toLowerCase(), value); },
  };
}

function session(sessionId = 'a0000000-0000-4000-8000-000000000001') {
  return {
    tenantId: 'a0000000-0000-4000-8000-000000000002',
    sessionId,
    userId: 'a0000000-0000-4000-8000-000000000003',
    adminIdentityId: 'a0000000-0000-4000-8000-000000000004',
    userAdmissionRevision: 0,
    identityVersion: 0,
    credentialVersion: 1,
    sessionRevision: 1,
    status: 'active',
    version: 0,
    displayName: 'Owner Synthetic',
    issuedAt: '2026-09-20T12:00:00.000Z',
    lastActivityAt: '2026-09-20T12:00:00.000Z',
    expiresAt: '2026-09-21T00:00:00.000Z',
    reauthenticatedAt: null,
    endedAt: null,
  };
}

function harness() {
  const tokens = new NodeAdminSessionToken();
  const active = tokens.issue();
  const current = session();
  const calls = { login: [], logout: 0, reauth: 0, revokeOne: [], revokeAll: 0 };
  const runtime = {
    admin: {
      tokens,
      capabilities: async (tenantId, userId) => {
        assert.equal(tenantId, current.tenantId);
        assert.equal(userId, current.userId);
        return ['users.read'];
      },
      login: { execute: async (input) => { calls.login.push(input); return { session: current, tokens: active }; } },
      resolve: { execute: async (input) => {
        assert.equal(input.bearer, active.bearer);
        assert.equal(input.csrfCookie, active.csrf);
        if (input.requireCsrf) assert.equal(input.csrfHeader, active.csrf);
        return current;
      } },
      sessions: {
        list: async () => [current],
        logout: async () => { calls.logout += 1; },
        reauthenticate: async () => { calls.reauth += 1; return { ...current, reauthenticatedAt: '2026-09-20T12:10:00.000Z' }; },
        revokeOne: async (_context, id) => { calls.revokeOne.push(id); },
        revokeAll: async () => { calls.revokeAll += 1; },
      },
    },
  };
  const controller = new AdminSessionController(runtime, { requiresSecureCookies: () => false });
  const cookie = `${adminSessionCookieName}=${active.bearer}; ${adminSessionCsrfCookieName}=${active.csrf}`;
  const mutationHeaders = {
    host: '127.0.0.1:3000', origin: 'http://127.0.0.1:3000',
    'sec-fetch-site': 'same-origin', 'content-type': 'application/json',
    'x-sr-admin-csrf-token': active.csrf, cookie,
  };
  return { active, calls, controller, cookie, current, mutationHeaders };
}

test('administrative cookies are separate, strict, opaque and operationally unusable', () => {
  const tokens = new NodeAdminSessionToken().issue();
  const serialized = serializeAdminSessionCookies(tokens.bearer, tokens.csrf, true);
  assert.match(serialized[0], /^sr_admin_session=/u);
  assert.match(serialized[0], /HttpOnly; SameSite=Strict; Path=\/api\/admin; Secure/u);
  assert.match(serialized[1], /^sr_admin_session_csrf=/u);
  assert.equal(readOperationalSessionCookies(serialized.join('; ')).bearer, null);
  assert.equal(readAdminSessionCookies(`sr_session=${tokens.bearer}; sr_session_csrf=${tokens.csrf}`).bearer, null);
  assert.match(serializeAdminSessionLoginCsrfCookie(tokens.csrf, false), /^sr_admin_login_csrf=.*Path=\/api\/admin\/session/u);
  assert.equal(expireAdminSessionCookies(false).every((value) => value.endsWith('Max-Age=0')), true);
});

test('admin HTTP login has no Station or client Tenant input and returns only safe session data', async () => {
  const { controller, calls } = harness();
  const challengeResponse = responseStub();
  const unauthenticated = await controller.getSession({}, challengeResponse);
  assert.equal(unauthenticated.session, null);
  const challengeCookie = challengeResponse.headers.get('set-cookie');
  assert.match(challengeCookie, new RegExp(`^${adminSessionLoginCsrfCookieName}=`));
  const csrf = challengeCookie.match(/^sr_admin_login_csrf=([^;]+)/u)[1];
  const response = responseStub();
  const result = await controller.login(
    { email: 'owner@example.test', password: 'valid synthetic password' },
    {
      host: '127.0.0.1:3000', origin: 'http://127.0.0.1:3000',
      'sec-fetch-site': 'same-origin', 'content-type': 'application/json',
      'x-sr-admin-csrf-token': csrf, cookie: `${adminSessionLoginCsrfCookieName}=${csrf}`,
    },
    response,
  );
  assert.equal(calls.login.length, 1);
  assert.deepEqual(Object.keys(calls.login[0]).sort(), ['correlationId', 'email', 'password']);
  assert.equal(result.session.tenantId, session().tenantId);
  assert.equal('email' in result.session, false);
  assert.equal('password' in result, false);
  assert.equal(response.headers.get('cache-control'), 'no-store');
  assert.equal(Array.isArray(response.headers.get('set-cookie')), true);
  await assert.rejects(
    controller.login({ email: 'owner@example.test', password: 'valid synthetic password', tenantId: 'attacker' }, {}, responseStub()),
  );
});

test('admin self-session mutations require the separate CSRF audience', async () => {
  const { calls, controller, mutationHeaders } = harness();
  const response = responseStub();
  await controller.reauthenticate({ password: 'valid synthetic password' }, mutationHeaders, response);
  await controller.revokeOne('a0000000-0000-4000-8000-000000000099', mutationHeaders, response);
  await controller.revokeAll(mutationHeaders, response);
  assert.equal(calls.reauth, 1);
  assert.deepEqual(calls.revokeOne, ['a0000000-0000-4000-8000-000000000099']);
  assert.equal(calls.revokeAll, 1);
  await assert.rejects(
    controller.reauthenticate({ password: 'valid synthetic password' }, { ...mutationHeaders, 'x-sr-admin-csrf-token': 'invalid' }, responseStub()),
    UnauthorizedException,
  );
});
