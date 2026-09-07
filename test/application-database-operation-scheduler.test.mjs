import assert from 'node:assert/strict';
import test from 'node:test';

const { ApplicationDatabaseOperationScheduler } = await import(
  '../dist/infrastructure/runtime/application-database-operation-scheduler.js'
);

function scheduler(options = {}) {
  return new ApplicationDatabaseOperationScheduler({
    maxPending: 8,
    waitTimeoutMs: 100,
    ...options,
  });
}

function admissionError(code) {
  return () => Object.assign(new Error(code), { code });
}

async function settledAfterMicrotask(promise) {
  let settled = false;
  void promise.finally(() => {
    settled = true;
  }).catch(() => undefined);
  await Promise.resolve();
  return settled;
}

test('a queued transaction receives its fair turn before later persistence', async () => {
  const operations = scheduler();
  const releaseInitialPersistence = await operations.acquire(
    'persistence',
    admissionError('initial'),
  );
  const order = [];
  const transaction = operations.acquire(
    'transaction',
    admissionError('transaction'),
  ).then((release) => {
    order.push('transaction');
    return release;
  });
  const laterPersistence = operations.acquire(
    'persistence',
    admissionError('later-persistence'),
  ).then((release) => {
    order.push('later-persistence');
    return release;
  });

  releaseInitialPersistence();
  const releaseTransaction = await transaction;
  assert.deepEqual(order, ['transaction']);
  assert.equal(await settledAfterMicrotask(laterPersistence), false);

  releaseTransaction();
  const releaseLaterPersistence = await laterPersistence;
  assert.deepEqual(order, ['transaction', 'later-persistence']);
  releaseLaterPersistence();
  await operations.close();
});

test('consecutive queued persistence operations start as one concurrent batch', async () => {
  const operations = scheduler();
  const releaseTransaction = await operations.acquire(
    'transaction',
    admissionError('transaction'),
  );
  const started = [];
  const left = operations.acquire('persistence', admissionError('left')).then(
    (release) => {
      started.push('left');
      return release;
    },
  );
  const right = operations.acquire('persistence', admissionError('right')).then(
    (release) => {
      started.push('right');
      return release;
    },
  );

  releaseTransaction();
  const [releaseLeft, releaseRight] = await Promise.all([left, right]);
  assert.deepEqual(started, ['left', 'right']);
  releaseLeft();
  releaseRight();
  await operations.close();
});

test('pending capacity and wait time reject fail-closed with caller-owned errors', async () => {
  const capacityBound = scheduler({ maxPending: 1 });
  const releaseActive = await capacityBound.acquire(
    'transaction',
    admissionError('active'),
  );
  const accepted = capacityBound.acquire(
    'persistence',
    admissionError('accepted'),
  );
  await assert.rejects(
    capacityBound.acquire('transaction', admissionError('QUEUE_FULL')),
    (error) => error.code === 'QUEUE_FULL',
  );
  releaseActive();
  (await accepted)();
  await capacityBound.close();

  const timeoutBound = scheduler({ waitTimeoutMs: 10 });
  const releaseOuter = await timeoutBound.acquire(
    'transaction',
    admissionError('outer'),
  );
  await assert.rejects(
    timeoutBound.acquire('transaction', admissionError('NESTED_FORBIDDEN')),
    (error) => error.code === 'NESTED_FORBIDDEN',
  );
  releaseOuter();
  await timeoutBound.close();
});

test('close drains accepted work in order and rejects all new admission', async () => {
  const operations = scheduler();
  const releaseTransaction = await operations.acquire(
    'transaction',
    admissionError('transaction'),
  );
  const accepted = operations.acquire(
    'persistence',
    admissionError('accepted'),
  );
  const closing = operations.close();

  await assert.rejects(
    operations.acquire('persistence', admissionError('CLOSING')),
    (error) => error.code === 'CLOSING',
  );
  assert.equal(await settledAfterMicrotask(closing), false);

  releaseTransaction();
  const releaseAccepted = await accepted;
  assert.equal(await settledAfterMicrotask(closing), false);
  releaseAccepted();
  await closing;
});

test('configuration bounds fail before the scheduler can admit work', () => {
  for (const options of [
    { maxPending: 0 },
    { maxPending: Number.MAX_SAFE_INTEGER + 1 },
    { waitTimeoutMs: 0 },
    { waitTimeoutMs: 1.5 },
  ]) {
    assert.throws(
      () => new ApplicationDatabaseOperationScheduler(options),
      TypeError,
    );
  }
});
