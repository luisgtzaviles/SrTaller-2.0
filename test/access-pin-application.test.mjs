import assert from 'node:assert/strict';
import test from 'node:test';

const {
  isPinAuthenticationProof,
} = await import('../dist/modules/access/domain/pin-credential.js');
const {
  PinInputError,
  parseAuthenticatePinInput,
  parseProvisionPinInput,
  parseTrustedPinContext,
} = await import('../dist/modules/access/application/pin-input.js');
const {
  AuthenticatePinUseCase,
  PinAuthenticationError,
} = await import(
  '../dist/modules/access/application/use-cases/authenticate-pin.use-case.js'
);
const { ProvisionPinCredentialUseCase } = await import(
  '../dist/modules/access/application/use-cases/provision-pin-credential.use-case.js'
);
const { createTrustedStationContext } = await import(
  '../dist/modules/stations/application/contracts/trusted-station-context.js'
);

const tenantId = '10000000-0000-4000-8000-000000000025';
const branchId = '20000000-0000-4000-8000-000000000025';
const stationId = '30000000-0000-4000-8000-000000000025';
const stationCredentialId = '35000000-0000-4000-8000-000000000025';
const userId = '40000000-0000-4000-8000-000000000025';
const credentialId = '50000000-0000-4000-8000-000000000025';
const clientRequestId = '60000000-0000-4000-8000-000000000025';
const rateLimitPrincipalId = '65000000-0000-4000-8000-000000000025';
const pin = '270625';
const now = new Date('2026-09-07T01:00:00.000Z');
const stationAdmission = Object.freeze({
  branchAdmissionRevision: 0,
  stationAdmissionRevision: 0,
  stationBindingAdmissionRevision: 0,
  stationCredentialAdmissionRevision: 0,
});
const context = createTrustedStationContext({
  tenantId,
  branchId,
  stationId,
  stationCredentialId,
  ...stationAdmission,
});

const activeUser = Object.freeze({
  tenantId,
  userId,
  displayName: 'Jorge Administrador',
  status: 'active',
  version: 2,
  admissionRevision: 5,
});

const storedVerifier = Object.freeze({
  algorithm: 'argon2id',
  profileVersion: 1,
  pepperVersion: 1,
  memoryKiB: 65_536,
  passes: 3,
  parallelism: 4,
  salt: Uint8Array.from({ length: 16 }, (_, index) => index + 1),
  verifier: Uint8Array.from({ length: 32 }, (_, index) => index + 1),
});

const secretMaterial = Object.freeze({
  ...storedVerifier,
  requestFingerprint: Uint8Array.from(
    { length: 32 },
    (_, index) => 255 - index,
  ),
});

const credentialRecord = Object.freeze({
  tenantId,
  userId,
  credentialId,
  status: 'active',
  credentialVersion: 0,
  createdAt: now.toISOString(),
  updatedAt: now.toISOString(),
  revokedAt: null,
});

function expectsPinInput(parameter) {
  return (error) =>
    error instanceof PinInputError && error.parameter === parameter;
}

function fixture({ user = activeUser, attemptStatus = 'authenticated' } = {}) {
  const calls = [];
  return {
    calls,
    users: {
      async findAuthenticationUser(scope, requestedUserId) {
        calls.push(['findAuthenticationUser', scope, requestedUserId]);
        return user;
      },
    },
    hasher: {
      rateLimitPrincipalId(input) {
        calls.push(['rateLimitPrincipalId', input]);
        return rateLimitPrincipalId;
      },
      async hash(input) {
        calls.push(['hash', input]);
        return secretMaterial;
      },
      async verify(input) {
        calls.push(['verify', input]);
        return input.pin === pin && input.stored === storedVerifier;
      },
    },
    repository: {
      async provision(scope, input) {
        calls.push(['provision', scope, input]);
        return credentialRecord;
      },
      async authenticateAttempt(trustedContext, input, verify) {
        calls.push(['authenticateAttempt', trustedContext, input]);
        const matched = await verify(storedVerifier);
        calls.push(['verifierResult', matched]);
        if (attemptStatus === 'temporarily-unavailable') {
          return Object.freeze({ status: 'temporarily-unavailable' });
        }
        if (attemptStatus === 'authenticated' && input.userEligible && matched) {
          return Object.freeze({
            status: 'authenticated',
            credentialVersion: 7,
          });
        }
        return Object.freeze({ status: 'denied' });
      },
    },
  };
}

test('PIN inputs require an exact selected User plus a six-digit numeric PIN', () => {
  assert.deepEqual(parseAuthenticatePinInput({ userId, pin }), { userId, pin });
  assert.ok(Object.isFrozen(parseAuthenticatePinInput({ userId, pin })));
  assert.deepEqual(
    parseProvisionPinInput({ userId, pin, clientRequestId }),
    { userId, pin, clientRequestId },
  );

  for (const invalidPin of [270625, '27062', '2706250', '27a625', ' 270625', '２７０６２５']) {
    assert.throws(
      () => parseAuthenticatePinInput({ userId, pin: invalidPin }),
      expectsPinInput('pin'),
    );
  }
  assert.throws(
    () => parseAuthenticatePinInput({ userId: 'user-25', pin }),
    expectsPinInput('userId'),
  );
  assert.throws(
    () => parseAuthenticatePinInput({ userId, pin, tenantId }),
    expectsPinInput('payload'),
  );
  assert.throws(
    () => parseAuthenticatePinInput({ pin }),
    expectsPinInput('payload'),
  );
  assert.throws(
    () => parseProvisionPinInput({ userId, pin, clientRequestId: 'request-25' }),
    expectsPinInput('clientRequestId'),
  );
});

test('authentication accepts only a branded server-verified Station context', () => {
  assert.equal(parseTrustedPinContext(context), context);
  assert.throws(
    () =>
      parseTrustedPinContext({
        tenantId,
        branchId,
        stationId,
        source: 'server-verified-station-cookie',
      }),
    expectsPinInput('context'),
  );
  assert.throws(
    () => parseTrustedPinContext({ tenantId, branchId, stationId }),
    expectsPinInput('context'),
  );
});

test('server-only provisioning owns identity and time and never passes plaintext PIN to persistence', async () => {
  const subject = fixture();
  const useCase = new ProvisionPinCredentialUseCase(
    subject.repository,
    subject.hasher,
    () => credentialId,
    () => now,
  );

  assert.equal(
    await useCase.execute(
      { tenantId },
      { userId, pin, clientRequestId },
    ),
    credentialRecord,
  );
  assert.deepEqual(subject.calls[0], [
    'hash',
    { tenantId, userId, pin, clientRequestId },
  ]);
  assert.deepEqual(subject.calls[1], [
    'provision',
    { tenantId },
    {
      userId,
      credentialId,
      clientRequestId,
      occurredAt: now.toISOString(),
      secret: secretMaterial,
    },
  ]);
  assert.equal('pin' in subject.calls[1][2], false);
  assert.doesNotMatch(JSON.stringify(subject.calls[1]), new RegExp(pin, 'u'));
});

test('active User plus matching PIN yields a narrow proof, not a Session or authorization verdict', async () => {
  const subject = fixture();
  const useCase = new AuthenticatePinUseCase(
    subject.repository,
    subject.users,
    subject.hasher,
    () => now,
  );

  const proof = await useCase.execute(context, { userId, pin });
  assert.ok(isPinAuthenticationProof(proof));
  assert.ok(Object.isFrozen(proof));
  assert.deepEqual(proof, {
    tenantId,
    branchId,
    stationId,
    stationCredentialId,
    ...stationAdmission,
    userId,
    displayName: activeUser.displayName,
    userVersion: activeUser.version,
    userAdmissionRevision: activeUser.admissionRevision,
    credentialVersion: 7,
    authenticatedAt: now.toISOString(),
  });
  assert.equal('sessionId' in proof, false);
  assert.equal('capabilities' in proof, false);
  assert.equal('roles' in proof, false);
  assert.equal('pin' in proof, false);
  assert.deepEqual(subject.calls, [
    ['findAuthenticationUser', { tenantId }, userId],
    ['rateLimitPrincipalId', { tenantId, userId }],
    [
      'authenticateAttempt',
      context,
      {
        userId,
        userEligible: true,
        rateLimitPrincipalId,
        occurredAt: now.toISOString(),
      },
    ],
    [
      'verify',
      { tenantId, userId, pin, stored: storedVerifier },
    ],
    ['verifierResult', true],
  ]);
});

test('missing, inactive and invalid-credential Users fail with the same non-enumerating denial', async () => {
  const scenarios = [
    fixture({ user: null }),
    fixture({ user: Object.freeze({ ...activeUser, status: 'inactive' }) }),
    fixture({ user: Object.freeze({ ...activeUser, status: 'revoked' }) }),
    fixture({ attemptStatus: 'denied' }),
  ];
  const errors = [];

  for (const subject of scenarios) {
    const useCase = new AuthenticatePinUseCase(
      subject.repository,
      subject.users,
      subject.hasher,
      () => now,
    );
    await assert.rejects(
      useCase.execute(context, { userId, pin }),
      (error) => {
        assert.ok(error instanceof PinAuthenticationError);
        errors.push(error.toJSON());
        return error.code === 'PIN_AUTHENTICATION_DENIED';
      },
    );
    assert.equal(
      subject.calls.some(([name]) => name === 'verify'),
      true,
      'each denial must traverse the verifier seam',
    );
  }

  for (const error of errors.slice(1)) {
    assert.deepEqual(error, errors[0]);
  }
  assert.deepEqual(errors[0], {
    name: 'PinAuthenticationError',
    category: 'Authentication',
    code: 'PIN_AUTHENTICATION_DENIED',
    message: 'PIN authentication was not accepted.',
  });
  assert.doesNotMatch(JSON.stringify(errors), /inactive|revoked|missing|credential/iu);
});

test('temporary repository conditions collapse to the same public denial and never mint a proof', async () => {
  const subject = fixture({ attemptStatus: 'temporarily-unavailable' });
  const useCase = new AuthenticatePinUseCase(
    subject.repository,
    subject.users,
    subject.hasher,
    () => now,
  );
  await assert.rejects(
    useCase.execute(context, { userId, pin }),
    (error) => {
      assert.ok(error instanceof PinAuthenticationError);
      assert.equal(error.code, 'PIN_AUTHENTICATION_DENIED');
      assert.equal(error.message, 'PIN authentication was not accepted.');
      assert.doesNotMatch(JSON.stringify(error), new RegExp(`${userId}|${pin}`, 'u'));
      return true;
    },
  );
});

test('User lookup failure is sanitized as the same non-enumerating denial', async () => {
  const subject = fixture();
  subject.users.findAuthenticationUser = async () => {
    throw new Error(`driver leaked ${userId} ${pin}`);
  };
  const useCase = new AuthenticatePinUseCase(
    subject.repository,
    subject.users,
    subject.hasher,
    () => now,
  );
  await assert.rejects(
    useCase.execute(context, { userId, pin }),
    (error) =>
      error instanceof PinAuthenticationError &&
      error.code === 'PIN_AUTHENTICATION_DENIED' &&
      !JSON.stringify(error).includes(userId) &&
      !JSON.stringify(error).includes(pin),
  );
  assert.equal(
    subject.calls.some(([name]) => name === 'authenticateAttempt'),
    false,
  );
});

test('repository failures are sanitized as the same non-enumerating denial', async () => {
  const subject = fixture();
  subject.repository.authenticateAttempt = async () => {
    throw new Error(`driver leaked ${userId} ${pin} select * from credentials`);
  };
  const useCase = new AuthenticatePinUseCase(
    subject.repository,
    subject.users,
    subject.hasher,
    () => now,
  );
  await assert.rejects(
    useCase.execute(context, { userId, pin }),
    (error) =>
      error instanceof PinAuthenticationError &&
      error.code === 'PIN_AUTHENTICATION_DENIED' &&
      !JSON.stringify(error).includes(userId) &&
      !JSON.stringify(error).includes(pin) &&
      !JSON.stringify(error).includes('select'),
  );
});
