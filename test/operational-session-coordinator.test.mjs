import assert from 'node:assert/strict';
import test from 'node:test';

import {
  OperationalSessionCoordinationError,
  createSessionRequestCoordinator,
} from '../apps/dev-preview-web/src/session/session-request-coordinator.mjs';

class SharedLockManager {
  tail = Promise.resolve();

  request(name, options, operation) {
    assert.equal(name, 'srtaller.operational-session.request.v1');
    assert.equal(options.mode, 'exclusive');
    assert.ok(options.signal instanceof AbortSignal);
    const execute = () => {
      if (options.signal.aborted) {
        return Promise.reject(options.signal.reason);
      }
      return operation();
    };
    const result = this.tail.then(execute, execute);
    this.tail = result.catch(() => undefined);
    return result;
  }
}

class ChannelBus {
  channels = new Set();
  messages = [];

  create() {
    const listeners = new Set();
    const channel = {
      postMessage: (message) => {
        this.messages.push(structuredClone(message));
        for (const peer of this.channels) {
          if (peer === channel) continue;
          for (const listener of peer.listeners) {
            queueMicrotask(() => listener({ data: structuredClone(message) }));
          }
        }
      },
      addEventListener: (type, listener) => {
        assert.equal(type, 'message');
        listeners.add(listener);
      },
      removeEventListener: (type, listener) => {
        assert.equal(type, 'message');
        listeners.delete(listener);
      },
      close: () => this.channels.delete(channel),
      listeners,
    };
    this.channels.add(channel);
    return channel;
  }
}

test('coordination fails closed without both an exclusive lock and a channel', () => {
  assert.throws(
    () => createSessionRequestCoordinator({ lockManager: null, channel: null }),
    OperationalSessionCoordinationError,
  );
});

test('two tabs total-order complete exchanges so a delayed read finishes before a newer mutation', async () => {
  const locks = new SharedLockManager();
  const bus = new ChannelBus();
  const left = createSessionRequestCoordinator({ lockManager: locks, channel: bus.create() });
  const right = createSessionRequestCoordinator({ lockManager: locks, channel: bus.create() });
  const delayed = Promise.withResolvers();
  const order = [];
  let active = 0;
  let maximumActive = 0;
  const exchange = async (label, wait) => {
    active += 1;
    maximumActive = Math.max(maximumActive, active);
    order.push(`${label}:start`);
    await wait;
    order.push(`${label}:finish`);
    active -= 1;
    return label;
  };

  const oldRead = left.runRead(() => exchange('old-get', delayed.promise));
  const newerMutation = right.runMutation(async (markMayHaveChanged) => {
    markMayHaveChanged();
    return exchange('new-post', Promise.resolve());
  });
  await Promise.resolve();
  assert.deepEqual(order, ['old-get:start']);
  delayed.resolve();
  assert.equal(await oldRead, 'old-get');
  assert.equal(await newerMutation, 'new-post');
  assert.deepEqual(order, [
    'old-get:start',
    'old-get:finish',
    'new-post:start',
    'new-post:finish',
  ]);
  assert.equal(maximumActive, 1);
  left.dispose();
  right.dispose();
});

test('a mutation hides peer snapshots before dispatch and publishes its final outcome afterwards', async () => {
  const locks = new SharedLockManager();
  const bus = new ChannelBus();
  const left = createSessionRequestCoordinator({ lockManager: locks, channel: bus.create() });
  const right = createSessionRequestCoordinator({ lockManager: locks, channel: bus.create() });
  let rightSignals = 0;
  right.subscribe(() => {
    rightSignals += 1;
  });
  const response = Promise.withResolvers();

  const mutation = left.runMutation(async (markMayHaveChanged) => {
    markMayHaveChanged();
    await response.promise;
    return 'confirmed';
  });
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(rightSignals, 1);
  assert.deepEqual(bus.messages, [{ type: 'session-changing', version: 1 }]);

  response.resolve();
  assert.equal(await mutation, 'confirmed');
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(rightSignals, 2);
  assert.deepEqual(bus.messages, [
    { type: 'session-changing', version: 1 },
    { type: 'session-changed', version: 1 },
  ]);
  assert.doesNotMatch(JSON.stringify(bus.messages), /actor|bearer|csrf|pin|sessionId|userId/iu);

  await left.runMutation(async () => 'preflight-rejected');
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(rightSignals, 2);
  assert.equal(bus.messages.length, 2);

  await assert.rejects(
    left.runMutation(async (markMayHaveChanged) => {
      markMayHaveChanged();
      throw new Error('response lost after request');
    }),
    /response lost/u,
  );
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(rightSignals, 4);
  assert.deepEqual(bus.messages.slice(2), [
    { type: 'session-changing', version: 1 },
    { type: 'session-changed', version: 1 },
  ]);
  assert.doesNotMatch(JSON.stringify(bus.messages), /actor|bearer|csrf|pin|sessionId|userId/iu);
  left.dispose();
  right.dispose();
});

test('failure to announce mutation start prevents request dispatch', async () => {
  const locks = new SharedLockManager();
  const bus = new ChannelBus();
  const channel = bus.create();
  channel.postMessage = () => {
    throw new DOMException('channel unavailable', 'InvalidStateError');
  };
  const coordinator = createSessionRequestCoordinator({ lockManager: locks, channel });
  let dispatched = false;

  await assert.rejects(
    coordinator.runMutation(async (markMayHaveChanged) => {
      markMayHaveChanged();
      dispatched = true;
    }),
    OperationalSessionCoordinationError,
  );
  assert.equal(dispatched, false);
  coordinator.dispose();
});

test('invalid channel payloads and disposed coordinators cannot alter or execute state', async () => {
  const locks = new SharedLockManager();
  const bus = new ChannelBus();
  const leftChannel = bus.create();
  const rightChannel = bus.create();
  const left = createSessionRequestCoordinator({ lockManager: locks, channel: leftChannel });
  const right = createSessionRequestCoordinator({ lockManager: locks, channel: rightChannel });
  let signals = 0;
  right.subscribe(() => {
    signals += 1;
  });
  leftChannel.postMessage({ type: 'session-changed', version: 1, userId: 'forbidden' });
  leftChannel.postMessage({ type: 'session-changed', version: 2 });
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(signals, 0);
  left.dispose();
  await assert.rejects(
    left.runRead(async () => 'forbidden'),
    OperationalSessionCoordinationError,
  );
  right.dispose();
});

test('caller cancellation removes a queued exchange before it can execute', async () => {
  const locks = new SharedLockManager();
  const bus = new ChannelBus();
  const holder = createSessionRequestCoordinator({
    lockManager: locks,
    channel: bus.create(),
    timeoutMs: 1_000,
  });
  const waiter = createSessionRequestCoordinator({
    lockManager: locks,
    channel: bus.create(),
    timeoutMs: 1_000,
  });
  const release = Promise.withResolvers();
  const held = holder.runRead(async () => {
    await release.promise;
    return 'released';
  });
  const cancellation = new AbortController();
  let executed = false;
  const queued = waiter.runRead(async () => {
    executed = true;
    return 'forbidden';
  }, cancellation.signal);
  cancellation.abort();
  release.resolve();
  assert.equal(await held, 'released');
  await assert.rejects(queued, (error) => error === cancellation.signal.reason);
  assert.equal(executed, false);
  holder.dispose();
  waiter.dispose();
});

test('a stalled read reaches a finite deadline and releases the lock without publishing a mutation signal', async () => {
  const locks = new SharedLockManager();
  const bus = new ChannelBus();
  const left = createSessionRequestCoordinator({
    lockManager: locks,
    channel: bus.create(),
    timeoutMs: 20,
  });
  const right = createSessionRequestCoordinator({
    lockManager: locks,
    channel: bus.create(),
    timeoutMs: 1_000,
  });
  let signals = 0;
  right.subscribe(() => {
    signals += 1;
  });
  await assert.rejects(
    left.runRead(async (signal) => {
      await new Promise((resolve, reject) => {
        signal.addEventListener('abort', () => reject(signal.reason), { once: true });
      });
    }),
    OperationalSessionCoordinationError,
  );
  assert.equal(await right.runRead(async () => 'next'), 'next');
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(signals, 0);
  assert.deepEqual(bus.messages, []);
  left.dispose();
  right.dispose();
});

test('lock waiting is bounded but an acquired mutation is never abandoned on a client deadline', async () => {
  const locks = new SharedLockManager();
  const bus = new ChannelBus();
  const holder = createSessionRequestCoordinator({
    lockManager: locks,
    channel: bus.create(),
    timeoutMs: 1_000,
  });
  const actor = createSessionRequestCoordinator({
    lockManager: locks,
    channel: bus.create(),
    timeoutMs: 20,
  });
  const release = Promise.withResolvers();
  const held = holder.runRead(async () => {
    await release.promise;
    return 'released';
  });
  let queuedMutationExecuted = false;
  const queuedMutation = actor.runMutation(async () => {
    queuedMutationExecuted = true;
    return 'forbidden';
  });
  await new Promise((resolve) => setTimeout(resolve, 30));
  release.resolve();
  assert.equal(await held, 'released');
  await assert.rejects(queuedMutation, OperationalSessionCoordinationError);
  assert.equal(queuedMutationExecuted, false);

  assert.equal(await actor.runMutation(async (markMayHaveChanged) => {
    markMayHaveChanged();
    await new Promise((resolve) => setTimeout(resolve, 30));
    return 'committed';
  }), 'committed');

  const caller = new AbortController();
  assert.equal(await actor.runMutation(async (markMayHaveChanged, signal) => {
    markMayHaveChanged();
    caller.abort();
    await new Promise((resolve) => setTimeout(resolve, 5));
    assert.equal(signal.aborted, false);
    return 'committed-after-caller-abort';
  }, caller.signal), 'committed-after-caller-abort');
  holder.dispose();
  actor.dispose();
});
