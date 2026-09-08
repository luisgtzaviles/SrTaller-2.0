import assert from 'node:assert/strict';
import test from 'node:test';

import {
  ContextualAuthorizationError,
} from '../dist/modules/access/index.js';
import { ContextualAuthorizationExecutorService } from '../dist/modules/access/presentation/contextual-authorization.executor.js';
import { NodeSessionToken } from '../dist/modules/access/infrastructure/security/node-session-token.js';
import { OperationalSessionError } from '../dist/modules/access/application/use-cases/operational-session.use-cases.js';
import { createTrustedStationContext } from '../dist/modules/stations/application/contracts/trusted-station-context.js';
import { TrustedStationContextError } from '../dist/modules/stations/index.js';

const tenantId = '10000000-0000-4000-8000-000000000026';
const branchId = '20000000-0000-4000-8000-000000000026';
const stationId = '30000000-0000-4000-8000-000000000026';
const stationCredentialId = '40000000-0000-4000-8000-000000000026';
const sessionId = '50000000-0000-4000-8000-000000000026';
const userId = '60000000-0000-4000-8000-000000000026';

const station = createTrustedStationContext({
  tenantId,
  branchId,
  stationId,
  stationCredentialId,
  branchAdmissionRevision: 0,
  stationAdmissionRevision: 0,
  stationBindingAdmissionRevision: 0,
  stationCredentialAdmissionRevision: 0,
});

const activeSession = Object.freeze({
  sessionId,
  tenantId,
  branchId,
  stationId,
  branchAdmissionRevision: 0,
  stationAdmissionRevision: 0,
  stationBindingAdmissionRevision: 0,
  stationCredentialAdmissionRevision: 0,
  userId,
  displayName: 'Jorge Operador',
  credentialVersion: 1,
  userVersion: 0,
  userAdmissionRevision: 0,
  status: 'active',
  version: 1,
  issuedAt: '2026-09-07T12:00:00.000Z',
  lastActivityAt: '2026-09-07T12:01:00.000Z',
  expiresAt: '2026-09-08T00:00:00.000Z',
  endedAt: null,
});

function requestFixture() {
  const tokens = new NodeSessionToken();
  const material = tokens.issue();
  return {
    material,
    read: Object.freeze({
      cookieHeader: `sr_session=${material.bearer}; sr_session_csrf=${material.csrf}`,
      origin: undefined,
      host: undefined,
      forwardedProto: undefined,
      fetchSite: undefined,
      contentType: undefined,
      csrfToken: undefined,
    }),
    stateChange: Object.freeze({
      cookieHeader: `sr_session=${material.bearer}; sr_session_csrf=${material.csrf}`,
      origin: 'http://127.0.0.1:4173',
      host: '127.0.0.1:4173',
      forwardedProto: undefined,
      fetchSite: 'same-origin',
      contentType: 'application/json; charset=utf-8',
      csrfToken: material.csrf,
    }),
  };
}

function runtimeFixture(overrides = {}) {
  const calls = [];
  const runtime = {
    trustedStations: {
      async resolve(cookieHeader) {
        calls.push(['station', cookieHeader]);
        return station;
      },
    },
    resolveSession: {
      async execute(context, input) {
        calls.push(['session', context, input]);
        return activeSession;
      },
      async confirmAuthorizedAtCommit(context, session, capability, transactionContext) {
        calls.push(['commit', context, session, capability, transactionContext]);
        return true;
      },
    },
    resolveCapabilities: {
      async execute(scope) {
        calls.push(['capabilities', scope]);
        return Object.freeze(['repairs.read', 'repairs.add_note']);
      },
    },
    ...overrides,
  };
  return { calls, runtime };
}

function isDenial(code) {
  return (error) =>
    error instanceof ContextualAuthorizationError && error.code === code;
}

test('contextual authorization resolves immutable server authority in order for every read', async () => {
  const request = requestFixture();
  const fixture = runtimeFixture();
  const executor = new ContextualAuthorizationExecutorService(fixture.runtime);
  let received;
  const result = await executor.execute(
    {
      ...request.read,
      tenantId: 'attacker-tenant',
      branchId: 'attacker-branch',
      stationId: 'attacker-station',
      userId: 'attacker-user',
      capabilities: ['repairs.add_note'],
      roleName: 'Administrator',
    },
    { capability: 'repairs.read', kind: 'read' },
    async (context) => {
      received = context;
      return 'allowed';
    },
  );

  assert.equal(result, 'allowed');
  assert.deepEqual({
    ...received,
    commitGuard: undefined,
  }, {
    tenantId,
    branchId,
    stationId,
    sessionId,
    userId,
    userDisplayName: 'Jorge Operador',
    capability: 'repairs.read',
    commitGuard: undefined,
  });
  assert.equal(typeof received.commitGuard.confirmCurrent, 'function');
  assert.equal(Object.isFrozen(received), true);
  assert.deepEqual(fixture.calls.map(([name]) => name), [
    'station',
    'session',
    'capabilities',
  ]);
  assert.deepEqual(fixture.calls[1][2], {
    bearer: request.material.bearer,
    csrfCookie: request.material.csrf,
    touch: true,
  });
  assert.deepEqual(fixture.calls[2][1], { tenantId, branchId, userId });
});

test('commit guard revalidates the exact station, session, and server-selected capability', async () => {
  const request = requestFixture();
  const fixture = runtimeFixture();
  const transactionContext = Object.freeze({ opaque: true });
  await new ContextualAuthorizationExecutorService(fixture.runtime).execute(
    request.stateChange,
    { capability: 'repairs.add_note', kind: 'state-change' },
    async (context) => context.commitGuard.confirmCurrent(transactionContext),
  );
  const call = fixture.calls.find(([name]) => name === 'commit');
  assert.equal(call[1], station);
  assert.equal(call[2], activeSession);
  assert.equal(call[3], 'repairs.add_note');
  assert.equal(call[4], transactionContext);
});

test('missing, malformed, or inactive authentication fails closed before effects', async () => {
  const request = requestFixture();
  for (const [evidence, runtime] of [
    [{ ...request.read, cookieHeader: undefined }, runtimeFixture().runtime],
    [{ ...request.read, cookieHeader: 'sr_session=malformed' }, runtimeFixture().runtime],
    [request.read, runtimeFixture({
      trustedStations: { async resolve() { throw new TrustedStationContextError(); } },
    }).runtime],
    [request.read, runtimeFixture({
      resolveSession: { async execute() { throw new OperationalSessionError(); } },
    }).runtime],
  ]) {
    let effects = 0;
    await assert.rejects(
      new ContextualAuthorizationExecutorService(runtime).execute(
        evidence,
        { capability: 'repairs.read', kind: 'read' },
        async () => { effects += 1; },
      ),
      isDenial('AUTHENTICATION_REQUIRED'),
    );
    assert.equal(effects, 0);
  }
});

test('state changes require same-origin JSON and exact double-submit CSRF before effects', async () => {
  const request = requestFixture();
  for (const change of [
    { origin: 'https://evil.example' },
    { fetchSite: 'cross-site' },
    { contentType: 'text/plain' },
    { csrfToken: undefined },
    { csrfToken: `${request.material.csrf.slice(0, -1)}x` },
  ]) {
    const fixture = runtimeFixture();
    let effects = 0;
    await assert.rejects(
      new ContextualAuthorizationExecutorService(fixture.runtime).execute(
        { ...request.stateChange, ...change },
        { capability: 'repairs.add_note', kind: 'state-change' },
        async () => { effects += 1; },
      ),
      isDenial('ACCESS_DENIED'),
    );
    assert.equal(effects, 0);
    if ('csrfToken' in change) {
      assert.deepEqual(fixture.calls.map(([name]) => name), []);
    }
  }

  const fixture = runtimeFixture();
  await new ContextualAuthorizationExecutorService(fixture.runtime).execute(
    request.stateChange,
    { capability: 'repairs.add_note', kind: 'state-change' },
    async () => undefined,
  );
  assert.deepEqual(fixture.calls[1][2], {
    bearer: request.material.bearer,
    csrfCookie: request.material.csrf,
    csrfHeader: request.material.csrf,
    requireCsrf: true,
    touch: true,
  });
});

test('fresh capability evaluation makes revocation effective at the next decision', async () => {
  const request = requestFixture();
  let decisions = 0;
  const fixture = runtimeFixture({
    resolveCapabilities: {
      async execute() {
        decisions += 1;
        return decisions === 1
          ? Object.freeze(['repairs.add_note'])
          : Object.freeze([]);
      },
    },
  });
  const executor = new ContextualAuthorizationExecutorService(fixture.runtime);
  let effects = 0;
  await executor.execute(
    request.stateChange,
    { capability: 'repairs.add_note', kind: 'state-change' },
    async () => { effects += 1; },
  );
  await assert.rejects(
    executor.execute(
      request.stateChange,
      { capability: 'repairs.add_note', kind: 'state-change' },
      async () => { effects += 1; },
    ),
    isDenial('ACCESS_DENIED'),
  );
  assert.equal(decisions, 2);
  assert.equal(effects, 1);
});

test('unknown operation requirements and infrastructure failures never run effects', async () => {
  const request = requestFixture();
  let effects = 0;
  const normal = new ContextualAuthorizationExecutorService(
    runtimeFixture().runtime,
  );
  for (const requirement of [
    { capability: 'administrator', kind: 'read' },
    { capability: 'repairs.read', kind: 'write' },
  ]) {
    await assert.rejects(
      normal.execute(request.read, requirement, async () => { effects += 1; }),
      isDenial('ACCESS_DENIED'),
    );
  }

  const unavailable = new Error('database unavailable');
  const failing = new ContextualAuthorizationExecutorService(runtimeFixture({
    resolveCapabilities: { async execute() { throw unavailable; } },
  }).runtime);
  await assert.rejects(
    failing.execute(
      request.read,
      { capability: 'repairs.read', kind: 'read' },
      async () => { effects += 1; },
    ),
    unavailable,
  );
  const consumerFailure = new OperationalSessionError();
  await assert.rejects(
    normal.execute(
      request.read,
      { capability: 'repairs.read', kind: 'read' },
      async () => { throw consumerFailure; },
    ),
    (error) => error === consumerFailure,
  );
  assert.equal(effects, 0);
});
