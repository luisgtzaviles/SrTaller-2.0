import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import { readFile } from 'node:fs/promises';
import { PassThrough } from 'node:stream';
import test from 'node:test';

import { checkArchitecture } from '../scripts/lib/architecture-checker.mjs';
import {
  createChunkSignal,
  createReadinessCoordinator,
} from '../scripts/smoke-start.mjs';
import { fixtureCases } from './architecture-fixtures.mjs';
import { persistenceFixtureCases } from './architecture-persistence-fixtures.mjs';

const marker = 'technical_shell_listening';

function deferred() {
  let resolvePromise;
  let rejectPromise;
  const promise = new Promise((resolve, reject) => {
    resolvePromise = resolve;
    rejectPromise = reject;
  });
  return { promise, reject: rejectPromise, resolve: resolvePromise };
}

function fakeChild() {
  const child = new EventEmitter();
  child.stdout = new PassThrough();
  child.stderr = new PassThrough();
  return child;
}

function destroyCoordinator(child, coordinator) {
  coordinator.cleanup();
  child.stdout.destroy();
  child.stderr.destroy();
}

test('product tree satisfies the executable DEC-005 policy', async () => {
  const result = await checkArchitecture({ root: process.cwd() });
  assert.deepEqual(result.diagnostics, []);
  assert.deepEqual(result.observedEdges, [
    'access->stations',
    'access->tenancy',
    'stations->tenancy',
  ]);
});

test('policy, rules, ownership and graph evidence remain consistent', async () => {
  const policy = JSON.parse(
    await readFile('architecture/dec-005-policy.json', 'utf8'),
  );
  const [rules, ownership, graph, fixtures, matrix] = await Promise.all(
    [
      'ARCHITECTURE_RULES.md',
      'OWNERSHIP.md',
      'DEPENDENCY_GRAPH.md',
      'FIXTURES.md',
      'TRACEABILITY_MATRIX.md',
    ].map((file) =>
      readFile(
        `docs/architecture-readiness/dec-005-materialization/${file}`,
        'utf8',
      ),
    ),
  );

  for (let number = 1; number <= 47; number += 1) {
    const rule = `D5-R${String(number).padStart(3, '0')}`;
    assert.match(rules, new RegExp(rule, 'u'));
    assert.match(matrix, new RegExp(`\\| ${rule} \\|`, 'u'));
  }
  const fixtureRules = new Set(
    [...fixtureCases, ...persistenceFixtureCases].flatMap(
      ({ expectedRules = [] }) => expectedRules,
    ),
  );
  assert.deepEqual(
    policy.checkerRules.filter((rule) => !fixtureRules.has(rule)),
    [],
    'every checker rule must have an isolated negative fixture',
  );
  for (const moduleName of policy.allowedModules) {
    assert.ok(ownership.includes(`| \`${moduleName}\` |`));
    for (const exportName of policy.publicSurfaces[moduleName]) {
      assert.match(ownership, new RegExp(exportName, 'u'));
    }
    for (const consumer of policy.consumers[moduleName]) {
      assert.match(ownership, new RegExp(consumer, 'u'));
    }
    for (const dependency of policy.dependencies[moduleName]) {
      assert.match(graph, new RegExp(`${moduleName}->${dependency}`, 'u'));
    }
  }
  for (const requiredCase of [
    'Módulo no autorizado',
    'Dependencia fuera del grafo',
    'Ciclo intermodular',
    'Root global `helpers`',
    'Root global `base`',
    'Root global `core`',
  ]) {
    assert.match(fixtures, new RegExp(requiredCase, 'u'));
  }
});

test('smoke readiness accepts marker before listener', async () => {
  const child = fakeChild();
  const listener = deferred();
  const coordinator = createReadinessCoordinator({
    child,
    listenerPromise: listener.promise,
    timeoutMs: 100,
  });
  try {
    child.stdout.write(marker);
    listener.resolve();
    await coordinator.ready;
  } finally {
    destroyCoordinator(child, coordinator);
  }
});

test('smoke readiness accepts listener before marker', async () => {
  const child = fakeChild();
  const listener = deferred();
  const coordinator = createReadinessCoordinator({
    child,
    listenerPromise: listener.promise,
    timeoutMs: 100,
  });
  try {
    listener.resolve();
    child.stdout.write(marker);
    await coordinator.ready;
  } finally {
    destroyCoordinator(child, coordinator);
  }
});

test('smoke readiness accepts both signals in the same event turn', async () => {
  const child = fakeChild();
  const listener = deferred();
  const coordinator = createReadinessCoordinator({
    child,
    listenerPromise: listener.promise,
    timeoutMs: 100,
  });
  try {
    queueMicrotask(() => {
      child.stdout.write(`prefix ${marker} suffix`);
      listener.resolve();
    });
    await coordinator.ready;
  } finally {
    destroyCoordinator(child, coordinator);
  }
});

test('smoke readiness recognizes a marker split between chunks', async () => {
  const child = fakeChild();
  const coordinator = createReadinessCoordinator({
    child,
    listenerPromise: Promise.resolve(),
    timeoutMs: 100,
  });
  try {
    child.stdout.write('technical_shell_');
    child.stdout.write('listening');
    await coordinator.ready;
  } finally {
    destroyCoordinator(child, coordinator);
  }
});

test('smoke readiness accepts listener evidence split between chunks', async () => {
  const child = fakeChild();
  const listener = createChunkSignal('listener-ready');
  const coordinator = createReadinessCoordinator({
    child,
    listenerPromise: listener.promise,
    timeoutMs: 100,
  });
  try {
    child.stdout.write(marker);
    listener.push('listener-');
    listener.push('ready');
    await coordinator.ready;
  } finally {
    destroyCoordinator(child, coordinator);
  }
});

test('smoke readiness preserves stderr diagnostics', async () => {
  const child = fakeChild();
  const coordinator = createReadinessCoordinator({
    child,
    listenerPromise: Promise.resolve(),
    timeoutMs: 100,
  });
  try {
    child.stderr.write('diagnostic detail');
    child.stdout.write(marker);
    await coordinator.ready;
    assert.equal(coordinator.output().stderr, 'diagnostic detail');
  } finally {
    destroyCoordinator(child, coordinator);
  }
});

test('smoke readiness rejects termination before readiness', async () => {
  const child = fakeChild();
  const listener = deferred();
  const coordinator = createReadinessCoordinator({
    child,
    listenerPromise: listener.promise,
    timeoutMs: 100,
  });
  try {
    child.stderr.write('startup failed');
    child.emit('exit', 1, null);
    await assert.rejects(
      coordinator.ready,
      /exited before readiness.*startup failed/u,
    );
  } finally {
    destroyCoordinator(child, coordinator);
  }
});

test('smoke readiness rejects timeout without both signals', async () => {
  const child = fakeChild();
  const listener = deferred();
  const coordinator = createReadinessCoordinator({
    child,
    listenerPromise: listener.promise,
    timeoutMs: 10,
  });
  try {
    child.stdout.write(marker);
    await assert.rejects(coordinator.ready, /readiness timed out/u);
  } finally {
    destroyCoordinator(child, coordinator);
  }
});

test('smoke readiness cleanup removes listeners after PASS', async () => {
  const child = fakeChild();
  const coordinator = createReadinessCoordinator({
    child,
    listenerPromise: Promise.resolve(),
    timeoutMs: 100,
  });
  child.stdout.write(marker);
  await coordinator.ready;
  coordinator.cleanup();
  assert.equal(child.stdout.listenerCount('data'), 0);
  assert.equal(child.stderr.listenerCount('data'), 0);
  assert.equal(child.listenerCount('exit'), 0);
  assert.equal(child.listenerCount('error'), 0);
  child.stdout.destroy();
  child.stderr.destroy();
});

test('smoke readiness cleanup removes listeners after FAIL', async () => {
  const child = fakeChild();
  const coordinator = createReadinessCoordinator({
    child,
    listenerPromise: Promise.reject(new Error('probe failed')),
    timeoutMs: 100,
  });
  await assert.rejects(coordinator.ready, /Listener probe failed/u);
  coordinator.cleanup();
  assert.equal(child.stdout.listenerCount('data'), 0);
  assert.equal(child.stderr.listenerCount('data'), 0);
  assert.equal(child.listenerCount('exit'), 0);
  assert.equal(child.listenerCount('error'), 0);
  child.stdout.destroy();
  child.stderr.destroy();
});
