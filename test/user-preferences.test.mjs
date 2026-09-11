import assert from 'node:assert/strict';
import test from 'node:test';
import { UnauthorizedException } from '@nestjs/common';

import {
  GetUserPreferencesUseCase,
  UpdateUserPreferencesUseCase,
  UserPreferencesInputError,
} from '../dist/modules/users/application/use-cases/user-preferences.use-cases.js';
import { AuthenticatedSelfExecutorService } from '../dist/modules/access/presentation/authenticated-self.executor.js';
import { AccessSelfPreferencesOperations } from '../dist/modules/access/application/access-self-preferences.operations.js';
import { UserPreferencesController } from '../dist/modules/access/presentation/user-preferences.controller.js';
import { ContextualAuthorizationError } from '../dist/modules/access/index.js';
import { NodeSessionToken } from '../dist/modules/access/infrastructure/security/node-session-token.js';

const tenantId = '10000000-0000-4000-8000-000000000039';
const userId = '20000000-0000-4000-8000-000000000039';
const branchId = '30000000-0000-4000-8000-000000000039';
const stationId = '40000000-0000-4000-8000-000000000039';

test('missing personal preferences resolve to Classic without creating a row', async () => {
  let reads = 0;
  const useCase = new GetUserPreferencesUseCase({
    async read(scope) {
      reads += 1;
      assert.deepEqual(scope, { tenantId, userId });
      return null;
    },
  });
  assert.deepEqual(await useCase.execute({ tenantId, userId }), {
    newRepairFormMode: 'classic',
    updatedAt: null,
  });
  assert.equal(reads, 1);
});

test('preference updates accept the exact Classic and Guided contracts and pass the session guard', async () => {
  const occurredAt = new Date('2026-09-09T22:00:00.000Z');
  const guard = Object.freeze({ async confirmCurrent() { return true; } });
  let captured;
  const useCase = new UpdateUserPreferencesUseCase({
    async read() { return null; },
    async upsert(scope, mode, at, receivedGuard) {
      captured = { scope, mode, at, receivedGuard };
      return { newRepairFormMode: mode, updatedAt: at.toISOString() };
    },
  }, () => occurredAt);

  assert.deepEqual(
    await useCase.execute({ tenantId, userId }, { newRepairFormMode: 'classic' }, guard),
    { newRepairFormMode: 'classic', updatedAt: occurredAt.toISOString() },
  );
  assert.deepEqual(captured, {
    scope: { tenantId, userId },
    mode: 'classic',
    at: occurredAt,
    receivedGuard: guard,
  });
  assert.deepEqual(
    await useCase.execute({ tenantId, userId }, { newRepairFormMode: 'guided_v2' }, guard),
    { newRepairFormMode: 'guided_v2', updatedAt: occurredAt.toISOString() },
  );
  for (const input of [{}, { newRepairFormMode: 'classic', extra: true }, { newRepairFormMode: 'other' }]) {
    assert.throws(
      () => useCase.execute({ tenantId, userId }, input),
      UserPreferencesInputError,
    );
  }
});

function selfFixture() {
  const token = new NodeSessionToken().issue();
  const calls = [];
  const station = Object.freeze({ tenantId, branchId, stationId });
  const session = Object.freeze({ userId, sessionId: '50000000-0000-4000-8000-000000000039' });
  const runtime = {
    trustedStations: { async resolve() { calls.push('station'); return station; } },
    resolveSession: {
      async execute(_station, input) { calls.push(['session', input]); return session; },
      async confirmTemporalAtCommit(receivedStation, receivedSession, transaction) {
        calls.push(['commit', receivedStation, receivedSession, transaction]);
        return true;
      },
    },
  };
  return {
    calls,
    runtime,
    token,
    evidence: Object.freeze({
      cookieHeader: `sr_session=${token.bearer}; sr_session_csrf=${token.csrf}`,
      origin: 'http://127.0.0.1:4173',
      host: '127.0.0.1:4173',
      forwardedProto: undefined,
      fetchSite: 'same-origin',
      contentType: 'application/json',
      csrfToken: token.csrf,
    }),
  };
}

test('self-service authority derives identity from Session and never resolves capabilities', async () => {
  const fixture = selfFixture();
  let received;
  const executor = new AuthenticatedSelfExecutorService(fixture.runtime);
  await executor.execute(fixture.evidence, 'state-change', async (context) => {
    received = context;
    return context.commitGuard.confirmCurrent({ transaction: true });
  });
  assert.equal(received.tenantId, tenantId);
  assert.equal(received.userId, userId);
  assert.deepEqual(fixture.calls.map((call) => Array.isArray(call) ? call[0] : call), [
    'station',
    'session',
    'commit',
  ]);
  assert.deepEqual(fixture.calls[1][1], {
    bearer: fixture.token.bearer,
    csrfCookie: fixture.evidence.csrfToken,
    csrfHeader: fixture.evidence.csrfToken,
    requireCsrf: true,
    touch: true,
  });

  let effects = 0;
  await assert.rejects(
    executor.execute({ ...fixture.evidence, csrfToken: undefined }, 'state-change', async () => { effects += 1; }),
    (error) => error instanceof ContextualAuthorizationError && error.code === 'ACCESS_DENIED',
  );
  await assert.rejects(
    executor.execute({ ...fixture.evidence, origin: 'https://attacker.example', fetchSite: 'cross-site' }, 'state-change', async () => { effects += 1; }),
    (error) => error instanceof ContextualAuthorizationError && error.code === 'ACCESS_DENIED',
  );
  assert.equal(effects, 0);
});

test('Access self preference operations ignore client scope and use only authenticated identity', async () => {
  let readScope;
  let updateCall;
  const authorization = {
    async execute(_evidence, _kind, operation) {
      return operation({
        tenantId,
        userId,
        commitGuard: Object.freeze({ async confirmCurrent() { return true; } }),
      });
    },
  };
  const preferences = {
    async get(scope) { readScope = scope; return { newRepairFormMode: 'classic' }; },
    async update(scope, input, guard) {
      updateCall = { scope, input, guard };
      return { newRepairFormMode: 'classic' };
    },
  };
  const operations = new AccessSelfPreferencesOperations(authorization, preferences);
  await operations.get({ tenantId: 'attacker', userId: 'attacker' });
  await operations.update({}, { newRepairFormMode: 'classic', userId: 'attacker' });
  assert.deepEqual(readScope, { tenantId, userId });
  assert.deepEqual(updateCall.scope, { tenantId, userId });
  assert.deepEqual(updateCall.input, { newRepairFormMode: 'classic', userId: 'attacker' });
  assert.equal(typeof updateCall.guard.confirmCurrent, 'function');
});

test('self preference HTTP response is allowlisted and authentication denial is typed', async () => {
  let updateBody;
  const controller = new UserPreferencesController({
    async get() {
      return { newRepairFormMode: 'classic', updatedAt: '2026-09-09T22:00:00.000Z' };
    },
    async update(_evidence, body) {
      updateBody = body;
      return { newRepairFormMode: 'classic', updatedAt: '2026-09-09T22:00:00.000Z' };
    },
  });
  assert.deepEqual(await controller.get({}), { newRepairFormMode: 'classic' });
  assert.deepEqual(
    await controller.update({ newRepairFormMode: 'classic' }, {}),
    { newRepairFormMode: 'classic' },
  );
  assert.deepEqual(updateBody, { newRepairFormMode: 'classic' });

  const denied = new UserPreferencesController({
    async get() { throw new ContextualAuthorizationError('AUTHENTICATION_REQUIRED'); },
  });
  await assert.rejects(
    denied.get({}),
    (error) => error instanceof UnauthorizedException &&
      error.getResponse().code === 'AUTHENTICATION_REQUIRED',
  );
});
