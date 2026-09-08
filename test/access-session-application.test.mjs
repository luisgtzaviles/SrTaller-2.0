import assert from 'node:assert/strict';
import test from 'node:test';

import { ListApplicableUsersUseCase } from '../dist/modules/access/application/use-cases/list-applicable-users.use-case.js';
import { OperationalSessionAdmissionError } from '../dist/modules/access/application/ports/operational-session-repository.port.js';
import {
  CreateOperationalSessionUseCase,
  EndOperationalSessionUseCase,
  ListLoginUsersUseCase,
  OperationalSessionError,
  ResolveOperationalSessionUseCase,
} from '../dist/modules/access/application/use-cases/operational-session.use-cases.js';
import { createPinAuthenticationProof } from '../dist/modules/access/domain/pin-credential.js';
import { NodeSessionToken } from '../dist/modules/access/infrastructure/security/node-session-token.js';
import { createTrustedStationContext } from '../dist/modules/stations/application/contracts/trusted-station-context.js';

const tenantId = '00000000-0000-4000-8000-000000000001';
const branchId = '00000000-0000-4000-8000-000000000101';
const otherBranchId = '00000000-0000-4000-8000-000000000102';
const stationId = '00000000-0000-4000-8000-000000000401';
const stationCredentialId = '00000000-0000-4000-8000-000000000402';
const otherStationCredentialId = '00000000-0000-4000-8000-000000000403';
const userId = '00000000-0000-4000-8000-000000000501';
const secondUserId = '00000000-0000-4000-8000-000000000502';
const sessionId = '00000000-0000-4000-8000-000000000801';
const stationAdmission = Object.freeze({
  branchAdmissionRevision: 0,
  stationAdmissionRevision: 0,
  stationBindingAdmissionRevision: 0,
  stationCredentialAdmissionRevision: 0,
});
const context = createTrustedStationContext({ tenantId, branchId, stationId, stationCredentialId, ...stationAdmission });

function fixture(now = '2026-09-07T12:00:00.000Z') {
  const rows = [];
  let creates = 0;
  let applicableIds = [userId];
  let createFailure = null;
  let closeFailure = null;
  const userRecords = new Map([
    [userId, { tenantId, userId, displayName: 'Jorge Operador', status: 'active', version: 0, admissionRevision: 0 }],
    [secondUserId, { tenantId, userId: secondUserId, displayName: 'Ana Operadora', status: 'active', version: 0, admissionRevision: 0 }],
  ]);
  const users = {
    async findAuthenticationUser(scope, requested) {
      if (scope.tenantId !== tenantId) return null;
      return userRecords.get(requested) ?? null;
    },
  };
  const applicableRepository = {
    async listApplicableUserIds(scope) {
      return scope.tenantId === tenantId && scope.branchId === branchId
        ? [...applicableIds]
        : [];
    },
  };
  const applicable = new ListApplicableUsersUseCase(applicableRepository);
  const repository = {
    credentialCurrent: true,
    closeConflicts: 0,
    async createReplacingActive(trusted, input) {
      if (createFailure) throw createFailure;
      const active = rows.find((candidate) =>
        candidate.tenantId === trusted.tenantId &&
        candidate.stationId === trusted.stationId &&
        candidate.status === 'active');
      if ((active?.sessionId ?? null) !== input.expectedSessionId) {
        throw new OperationalSessionAdmissionError();
      }
      creates += 1;
      const occurredAt = input.occurredAt;
      for (const existing of rows) {
        if (
          existing.tenantId === trusted.tenantId &&
          existing.stationId === trusted.stationId &&
          existing.status === 'active'
        ) {
          existing.status = 'replaced';
          existing.endedAt = occurredAt;
          existing.version += 1;
        }
      }
      const row = {
        sessionId: input.sessionId,
        tenantId: trusted.tenantId,
        branchId: trusted.branchId,
        stationId: trusted.stationId,
        stationCredentialId: trusted.stationCredentialId,
        branchAdmissionRevision: 0,
        stationAdmissionRevision: 0,
        stationBindingAdmissionRevision: 0,
        stationCredentialAdmissionRevision: 0,
        userId: input.userId,
        userVersion: input.userVersion,
        userAdmissionRevision: 0,
        credentialVersion: input.credentialVersion,
        status: 'active',
        version: 0,
        issuedAt: occurredAt,
        lastActivityAt: occurredAt,
        expiresAt: input.expiresAt,
        endedAt: null,
        csrfVerifier: input.csrfVerifier,
        bearerVerifier: input.bearerVerifier,
      };
      rows.push(row);
      return { ...row };
    },
    async findByBearerVerifier(trusted, bearerVerifier) {
      const row = rows.find((candidate) =>
        candidate.tenantId === trusted.tenantId &&
        candidate.branchId === trusted.branchId &&
        candidate.stationId === trusted.stationId &&
        candidate.stationCredentialId === trusted.stationCredentialId &&
        Buffer.from(candidate.bearerVerifier).equals(Buffer.from(bearerVerifier)));
      return row ? { ...row } : null;
    },
    async confirmActive(trusted, input) {
      const row = rows.find((candidate) =>
        candidate.tenantId === trusted.tenantId &&
        candidate.branchId === trusted.branchId &&
        candidate.stationId === trusted.stationId &&
        candidate.stationCredentialId === trusted.stationCredentialId &&
        candidate.sessionId === input.sessionId &&
        candidate.status === 'active' &&
        candidate.version === input.expectedVersion);
      if (!row) return null;
      const user = userRecords.get(row.userId);
      if (
        !user ||
        user.status !== 'active' ||
        user.version !== row.userVersion ||
        !applicableIds.includes(row.userId) ||
        !this.credentialCurrent
      ) {
        row.status = 'invalidated';
        row.endedAt = input.occurredAt;
        row.version += 1;
        return null;
      }
      if (input.recordActivity) {
        if (new Date(input.occurredAt).getTime() > new Date(row.lastActivityAt).getTime()) {
          row.lastActivityAt = input.occurredAt;
        }
        row.version += 1;
      }
      return { ...row, displayName: user.displayName };
    },
    async close(trusted, input) {
      if (closeFailure) throw closeFailure;
      const row = rows.find((candidate) =>
        candidate.tenantId === trusted.tenantId &&
        candidate.branchId === trusted.branchId &&
        candidate.stationId === trusted.stationId &&
        candidate.sessionId === input.sessionId &&
        candidate.status === 'active');
      if (!row || row.version !== input.expectedVersion) return false;
      if (this.closeConflicts > 0) {
        this.closeConflicts -= 1;
        row.version += 1;
        return false;
      }
      row.status = input.status;
      row.endedAt = input.occurredAt;
      row.version += 1;
      return true;
    },
    async closeAuthenticated(trusted, input) {
      if (closeFailure) throw closeFailure;
      const row = rows.find((candidate) =>
        candidate.tenantId === trusted.tenantId &&
        candidate.branchId === trusted.branchId &&
        candidate.stationId === trusted.stationId &&
        candidate.stationCredentialId === trusted.stationCredentialId &&
        Buffer.from(candidate.bearerVerifier).equals(Buffer.from(input.bearerVerifier)) &&
        Buffer.from(candidate.csrfVerifier).equals(Buffer.from(input.csrfVerifier)) &&
        candidate.status === 'active');
      if (!row) return false;
      row.status = input.status;
      row.endedAt = input.occurredAt;
      row.version += 1;
      return true;
    },
    async isPinCredentialCurrent() {
      return this.credentialCurrent;
    },
  };
  const tokens = new NodeSessionToken();
  const clock = {
    value: new Date(now),
    now() { return new Date(this.value); },
  };
  let nextId = 0;
  const ids = [sessionId, '00000000-0000-4000-8000-000000000802'];
  const create = new CreateOperationalSessionUseCase(
    repository,
    users,
    applicable,
    tokens,
    () => clock.now(),
    () => ids[nextId++] ?? '00000000-0000-4000-8000-000000000899',
  );
  const resolve = new ResolveOperationalSessionUseCase(
    repository,
    users,
    applicable,
    tokens,
    () => clock.now(),
  );
  const end = new EndOperationalSessionUseCase(
    repository,
    tokens,
    () => clock.now(),
  );
  return {
    repository,
    users,
    tokens,
    clock,
    create,
    resolve,
    end,
    applicable,
    rows,
    setApplicable(ids) { applicableIds = [...ids]; },
    setUserStatus(requested, status) {
      const user = userRecords.get(requested);
      if (user) userRecords.set(requested, { ...user, status });
    },
    setCreateFailure(error) { createFailure = error; },
    setCloseFailure(error) { closeFailure = error; },
    setLastActivityAt(value) {
      const row = [...rows].reverse().find(({ status }) => status === 'active');
      if (row) row.lastActivityAt = value;
    },
    get row() { return [...rows].reverse()[0] ?? null; },
    get creates() { return creates; },
  };
}

function proof(input = {}) {
  return createPinAuthenticationProof({
    context: input.context ?? context,
    user: {
      userId: input.userId ?? userId,
      displayName: input.displayName ?? 'Jorge Operador',
      version: input.userVersion ?? 0,
      admissionRevision: input.userAdmissionRevision ?? 0,
    },
    credentialVersion: input.credentialVersion ?? 3,
    authenticatedAt: input.authenticatedAt ?? '2026-09-07T12:00:00.000Z',
  });
}

function cookieInput(created, overrides = {}) {
  return {
    bearer: created.tokens.bearer,
    csrfCookie: created.tokens.csrf,
    ...overrides,
  };
}

test('a successful PIN proof is exact-context, fresh, one-shot, and consumed even when persistence fails', async () => {
  const state = fixture();
  const accepted = proof();
  await state.create.execute(context, accepted);
  await assert.rejects(state.create.execute(context, accepted), OperationalSessionError);

  const wrongContext = createTrustedStationContext({ tenantId, branchId: otherBranchId, stationId, stationCredentialId, ...stationAdmission });
  await assert.rejects(state.create.execute(context, proof({ context: wrongContext })), OperationalSessionError);
  const wrongCredentialContext = createTrustedStationContext({
    tenantId,
    branchId,
    stationId,
    stationCredentialId: otherStationCredentialId,
    ...stationAdmission,
  });
  await assert.rejects(
    state.create.execute(context, proof({ context: wrongCredentialContext })),
    OperationalSessionError,
  );
  const rotatedStationAuthority = createTrustedStationContext({
    ...context,
    stationCredentialAdmissionRevision: 1,
  });
  await assert.rejects(
    state.create.execute(context, proof({ context: rotatedStationAuthority })),
    OperationalSessionError,
  );
  await assert.rejects(
    state.create.execute(context, proof({ userAdmissionRevision: 1 })),
    OperationalSessionError,
  );
  await assert.rejects(
    state.create.execute(context, proof({ authenticatedAt: '2026-09-07T11:59:29.999Z' })),
    OperationalSessionError,
  );
  await assert.rejects(
    state.create.execute(context, proof({ authenticatedAt: '2026-09-07T12:00:00.001Z' })),
    OperationalSessionError,
  );

  const failed = proof();
  state.setCreateFailure(new Error('database unavailable'));
  await assert.rejects(state.create.execute(context, failed), /database unavailable/u);
  state.setCreateFailure(null);
  await assert.rejects(state.create.execute(context, failed), OperationalSessionError);

  const revokedDuringAdmission = proof();
  state.setCreateFailure(new OperationalSessionAdmissionError());
  await assert.rejects(
    state.create.execute(context, revokedDuringAdmission),
    OperationalSessionError,
  );
});

test('failed switching preserves the prior Session and successful switching replaces exactly once', async () => {
  const state = fixture();
  const first = await state.create.execute(context, proof());
  state.setUserStatus(secondUserId, 'revoked');
  state.setApplicable([userId, secondUserId]);
  await assert.rejects(
    state.create.execute(context, proof({ userId: secondUserId, displayName: 'Ana Operadora' })),
    OperationalSessionError,
  );
  assert.equal(state.creates, 1);
  assert.equal(state.row.status, 'active');
  assert.equal((await state.resolve.execute(context, cookieInput(first))).userId, userId);

  state.setUserStatus(secondUserId, 'active');
  state.clock.value = new Date('2026-09-07T12:00:01.000Z');
  const second = await state.create.execute(
    context,
    proof({ userId: secondUserId, displayName: 'Ana Operadora', authenticatedAt: '2026-09-07T12:00:01.000Z' }),
    first.session.sessionId,
  );
  assert.equal(state.creates, 2);
  assert.deepEqual(state.rows.map(({ status }) => status), ['replaced', 'active']);
  await assert.rejects(state.resolve.execute(context, cookieInput(first)), OperationalSessionError);
  assert.equal((await state.resolve.execute(context, cookieInput(second))).userId, secondUserId);

  state.clock.value = new Date('2026-09-07T12:00:02.000Z');
  await assert.rejects(
    state.create.execute(
      context,
      proof({ authenticatedAt: '2026-09-07T12:00:02.000Z' }),
      first.session.sessionId,
    ),
    OperationalSessionError,
  );
  assert.equal(state.creates, 2);
  assert.equal((await state.resolve.execute(context, cookieInput(second))).userId, secondUserId);
});

for (const scenario of [
  {
    name: 'User lifecycle revocation',
    revoke(state) { state.setUserStatus(userId, 'revoked'); },
    restore(state) { state.setUserStatus(userId, 'active'); },
  },
  {
    name: 'branch role-assignment revocation',
    revoke(state) { state.setApplicable([]); },
    restore(state) { state.setApplicable([userId]); },
  },
  {
    name: 'PIN credential rotation or revocation',
    revoke(state) { state.repository.credentialCurrent = false; },
    restore(state) { state.repository.credentialCurrent = true; },
  },
]) {
  test(`${scenario.name} invalidates an active Session and restoration cannot revive it`, async () => {
    const state = fixture();
    const created = await state.create.execute(context, proof());
    scenario.revoke(state);
    await assert.rejects(state.resolve.execute(context, cookieInput(created)), OperationalSessionError);
    assert.equal(state.row.status, 'invalidated');
    scenario.restore(state);
    await assert.rejects(state.resolve.execute(context, cookieInput(created)), OperationalSessionError);
    assert.equal(state.row.status, 'invalidated');
  });
}

test('resolution rejects CSRF mismatch without touching and touches valid activity monotonically', async () => {
  const state = fixture();
  const created = await state.create.execute(context, proof());
  const originalVersion = state.row.version;
  await assert.rejects(state.resolve.execute(context, cookieInput(created, {
    requireCsrf: true,
    csrfHeader: `${created.tokens.csrf.slice(0, -1)}x`,
  })), OperationalSessionError);
  assert.equal(state.row.version, originalVersion);

  state.clock.value = new Date('2026-09-07T12:59:59.000Z');
  const active = await state.resolve.execute(context, cookieInput(created));
  assert.equal(active.lastActivityAt, '2026-09-07T12:59:59.000Z');
  state.clock.value = new Date('2026-09-07T12:30:00.000Z');
  const nonRegressing = await state.resolve.execute(context, cookieInput(created));
  assert.equal(nonRegressing.lastActivityAt, '2026-09-07T12:59:59.000Z');
});

test('idle and absolute expiry are inclusive and CAS conflict retries cannot revive an expired Session', async () => {
  const idle = fixture();
  const idleCreated = await idle.create.execute(context, proof());
  idle.repository.closeConflicts = 1;
  idle.clock.value = new Date('2026-09-07T13:00:00.000Z');
  await assert.rejects(idle.resolve.execute(context, cookieInput(idleCreated)), OperationalSessionError);
  assert.equal(idle.row.status, 'expired');
  assert.equal(idle.row.version, 2);

  const absolute = fixture();
  const absoluteCreated = await absolute.create.execute(context, proof());
  absolute.setLastActivityAt('2026-09-07T23:30:00.000Z');
  absolute.clock.value = new Date('2026-09-07T23:59:59.999Z');
  await absolute.resolve.execute(context, cookieInput(absoluteCreated));
  absolute.clock.value = new Date('2026-09-08T00:00:00.000Z');
  await assert.rejects(absolute.resolve.execute(context, cookieInput(absoluteCreated)), OperationalSessionError);
  assert.equal(absolute.row.status, 'expired');
});

test('logout requires the bound bearer and CSRF, is replay-safe, and distinguishes infrastructure failure', async () => {
  const state = fixture();
  const created = await state.create.execute(context, proof());
  await assert.rejects(state.end.execute(context, cookieInput(created, {
    csrfHeader: `${created.tokens.csrf.slice(0, -1)}x`,
  })), OperationalSessionError);
  assert.equal(state.row.status, 'active');

  const infrastructureFailure = new Error('database write failed');
  state.setCloseFailure(infrastructureFailure);
  await assert.rejects(state.end.execute(context, cookieInput(created, {
    csrfHeader: created.tokens.csrf,
  })), infrastructureFailure);
  assert.equal(state.row.status, 'active');

  state.setCloseFailure(null);
  await state.end.execute(context, cookieInput(created, { csrfHeader: created.tokens.csrf }));
  assert.equal(state.row.status, 'logged_out');
  await assert.rejects(
    state.end.execute(context, cookieInput(created, { csrfHeader: created.tokens.csrf })),
    OperationalSessionError,
  );
});

test('logout closes only the Session authenticated by its bearer and cannot terminate a concurrent replacement', async () => {
  let authenticatedClose = null;
  let scopedCloseCalls = 0;
  let stationWideCloseCalls = 0;
  const repository = {
    async closeAuthenticated(_context, input) {
      scopedCloseCalls += 1;
      authenticatedClose = input;
      // A false result models that this exact bearer was concurrently replaced.
      return false;
    },
    async closeActiveForStation() {
      stationWideCloseCalls += 1;
      return true;
    },
  };
  const tokens = new NodeSessionToken();
  const end = new EndOperationalSessionUseCase(
    repository,
    tokens,
    () => new Date('2026-09-07T12:02:00.000Z'),
  );
  await assert.rejects(
    end.execute(context, {
      bearer: 'a'.repeat(43),
      csrfCookie: 'b'.repeat(43),
      csrfHeader: 'b'.repeat(43),
    }),
    OperationalSessionError,
  );
  assert.deepEqual(authenticatedClose, {
    bearerVerifier: tokens.verifyBearer('a'.repeat(43)),
    csrfVerifier: tokens.verifyCsrf('b'.repeat(43)),
    status: 'logged_out',
    occurredAt: '2026-09-07T12:02:00.000Z',
  });
  assert.equal(scopedCloseCalls, 1);
  assert.equal(stationWideCloseCalls, 0);
});

test('logout uses a terminal authenticated close that is independent from touch versions', async () => {
  const calls = [];
  const tokens = new NodeSessionToken();
  const repository = {
    async closeAuthenticated(_context, input) {
      calls.push(input);
      return true;
    },
  };
  const end = new EndOperationalSessionUseCase(repository, tokens);
  await end.execute(context, {
    bearer: 'a'.repeat(43),
    csrfCookie: 'b'.repeat(43),
    csrfHeader: 'b'.repeat(43),
  });
  assert.equal(calls.length, 1);
  assert.deepEqual(calls[0].bearerVerifier, tokens.verifyBearer('a'.repeat(43)));
  assert.deepEqual(calls[0].csrfVerifier, tokens.verifyCsrf('b'.repeat(43)));
});

test('login users are branch-applicable, active, minimal, and deterministically sorted', async () => {
  const state = fixture();
  state.setApplicable([userId, secondUserId]);
  let configured = [userId, secondUserId];
  const list = new ListLoginUsersUseCase(
    state.users,
    state.applicable,
    async () => configured,
  );
  assert.deepEqual(await list.execute(context), [
    { userId: secondUserId, displayName: 'Ana Operadora' },
    { userId, displayName: 'Jorge Operador' },
  ]);
  state.setUserStatus(secondUserId, 'inactive');
  assert.deepEqual(await list.execute(context), [
    { userId, displayName: 'Jorge Operador' },
  ]);
  configured = [];
  assert.deepEqual(await list.execute(context), []);
  const wrongContext = createTrustedStationContext({ tenantId, branchId: otherBranchId, stationId, stationCredentialId, ...stationAdmission });
  assert.deepEqual(await list.execute(wrongContext), []);
});
