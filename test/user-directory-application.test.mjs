import assert from 'node:assert/strict';
import test from 'node:test';

const { GetUserUseCase } = await import(
  '../dist/modules/users/application/use-cases/get-user.use-case.js'
);
const { ListUsersUseCase } = await import(
  '../dist/modules/users/application/use-cases/list-users.use-case.js'
);
const { ProvisionFirstUserUseCase } = await import(
  '../dist/modules/users/application/use-cases/provision-first-user.use-case.js'
);
const { CreateUserUseCase } = await import(
  '../dist/modules/users/application/use-cases/create-user.use-case.js'
);
const { TransitionUserStatusUseCase } = await import(
  '../dist/modules/users/application/use-cases/transition-user-status.use-case.js'
);
const { UserInputError } = await import(
  '../dist/modules/users/application/user-input.js'
);

const tenantId = '10000000-0000-4000-8000-000000000032';
const userId = '20000000-0000-4000-8000-000000000032';
const requestId = '30000000-0000-4000-8000-000000000032';
const now = new Date('2026-09-06T18:00:00.000Z');
const record = Object.freeze({
  userId,
  tenantId,
  displayName: 'Jorge Administrador',
  operationalIdentifier: 'jorge',
  status: 'active',
  version: 0,
  createdAt: now.toISOString(),
  updatedAt: now.toISOString(),
});

function fixtureRepository() {
  const calls = [];
  return {
    calls,
    repository: {
      async list(scope) {
        calls.push(['list', scope]);
        return Object.freeze([record]);
      },
      async findById(scope, requestedUserId) {
        calls.push(['findById', scope, requestedUserId]);
        return requestedUserId === userId ? record : null;
      },
      async bootstrap(scope, input) {
        calls.push(['bootstrap', scope, input]);
        return record;
      },
      async create(scope, input) {
        calls.push(['create', scope, input]);
        return record;
      },
      async transition(scope, input) {
        calls.push(['transition', scope, input]);
        return Object.freeze({ ...record, status: input.status, version: 1 });
      },
    },
  };
}

function rejectsInput(operation, parameter) {
  assert.throws(
    operation,
    (error) =>
      error instanceof UserInputError && error.parameter === parameter,
  );
}

test('User read use cases enforce exact tenant scope and canonical identifiers', async () => {
  const fixture = fixtureRepository();
  const list = new ListUsersUseCase(fixture.repository);
  const get = new GetUserUseCase(fixture.repository);

  assert.deepEqual(await list.execute({ tenantId }), [record]);
  assert.equal(await get.execute({ tenantId }, userId), record);
  assert.deepEqual(fixture.calls[0], ['list', { tenantId }]);
  assert.deepEqual(fixture.calls[1], ['findById', { tenantId }, userId]);

  rejectsInput(() => list.execute({ tenantId, branchId: userId }), 'payload');
  rejectsInput(() => list.execute({ tenantId: 'tenant-a' }), 'tenantId');
  rejectsInput(() => get.execute({ tenantId }, 'user-a'), 'userId');
});

test('first-user provisioning normalizes names and owns identity and time', async () => {
  const fixture = fixtureRepository();
  const useCase = new ProvisionFirstUserUseCase(
    fixture.repository,
    () => userId,
    () => now,
  );
  assert.equal(
    await useCase.execute(
      { tenantId },
      {
        displayName: '  Jorge Administrador  ',
        operationalIdentifier: '  jorge  ',
        clientRequestId: requestId,
      },
    ),
    record,
  );
  assert.deepEqual(fixture.calls[0], [
    'bootstrap',
    { tenantId },
    {
      displayName: 'Jorge Administrador',
      operationalIdentifier: 'jorge',
      clientRequestId: requestId,
      userId,
      occurredAt: now.toISOString(),
    },
  ]);

  rejectsInput(
    () => useCase.execute(
      { tenantId },
      {
        displayName: 'Jorge',
        operationalIdentifier: null,
        clientRequestId: requestId,
        role: 'Administrador',
      },
    ),
    'payload',
  );
  rejectsInput(
    () => useCase.execute(
      { tenantId },
      {
        displayName: ' ',
        operationalIdentifier: null,
        clientRequestId: requestId,
      },
    ),
    'displayName',
  );
  rejectsInput(
    () => useCase.execute(
      { tenantId },
      {
        displayName: 'Jorge',
        operationalIdentifier: null,
        clientRequestId: 'request-a',
      },
    ),
    'clientRequestId',
  );
});

test('ordinary User creation preserves the client request identity while owning ID and time', async () => {
  const fixture = fixtureRepository();
  const useCase = new CreateUserUseCase(
    fixture.repository,
    () => userId,
    () => now,
  );
  assert.equal(await useCase.execute({ tenantId }, {
    displayName: '  Efrén Demo  ',
    operationalIdentifier: null,
    clientRequestId: requestId,
  }), record);
  assert.deepEqual(fixture.calls[0], ['create', { tenantId }, {
    displayName: 'Efrén Demo',
    operationalIdentifier: null,
    clientRequestId: requestId,
    userId,
    occurredAt: now.toISOString(),
  }]);
});

test('lifecycle use case requires exact optimistic and idempotency input', async () => {
  const fixture = fixtureRepository();
  const useCase = new TransitionUserStatusUseCase(
    fixture.repository,
    () => now,
  );
  const result = await useCase.execute(
    { tenantId },
    {
      userId,
      status: 'inactive',
      expectedVersion: 0,
      clientRequestId: requestId,
    },
  );
  assert.equal(result.status, 'inactive');
  assert.deepEqual(fixture.calls[0], [
    'transition',
    { tenantId },
    {
      userId,
      status: 'inactive',
      expectedVersion: 0,
      clientRequestId: requestId,
      occurredAt: now.toISOString(),
    },
  ]);

  for (const [change, parameter] of [
    [{ userId: 'user-a' }, 'userId'],
    [{ status: 'deleted' }, 'status'],
    [{ expectedVersion: -1 }, 'expectedVersion'],
    [{ clientRequestId: 'request-a' }, 'clientRequestId'],
  ]) {
    rejectsInput(
      () => useCase.execute(
        { tenantId },
        {
          userId,
          status: 'inactive',
          expectedVersion: 0,
          clientRequestId: requestId,
          ...change,
        },
      ),
      parameter,
    );
  }
  rejectsInput(
    () => useCase.execute(
      { tenantId },
      {
        userId,
        status: 'inactive',
        expectedVersion: 0,
        clientRequestId: requestId,
        hardDelete: true,
      },
    ),
    'payload',
  );
});
