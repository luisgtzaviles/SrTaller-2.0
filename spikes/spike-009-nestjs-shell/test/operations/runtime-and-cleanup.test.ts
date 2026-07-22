import assert from 'node:assert/strict';
import { access, mkdtemp, readFile, rm, watch } from 'node:fs/promises';
import net from 'node:net';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawn, type ChildProcess } from 'node:child_process';
import { after, describe, it } from 'node:test';

const root = new URL('../..', import.meta.url).pathname;
const wrapper = join(root, 'scripts/with-postgres.sh');
const postgresScript = join(root, 'scripts/postgres.sh');
const temporaryRoots: string[] = [];

after(async () => {
  await Promise.all(temporaryRoots.map((path) => rm(path, { recursive: true, force: true })));
});

describe('isolated PostgreSQL runner cleanup', () => {
  it('cleans its unique run after success and command failure', async () => {
    const fixture = await temporaryFixture();
    const successRecord = join(fixture, 'success.env');
    const success = spawnWrapped(['node', '-e', 'process.exit(0)'], successRecord);
    assert.equal(await exitCode(success), 0);
    await assertRunRemoved(successRecord);

    const failureRecord = join(fixture, 'failure.env');
    const failure = spawnWrapped(['node', '-e', 'process.exit(23)'], failureRecord);
    assert.equal(await exitCode(failure), 23);
    await assertRunRemoved(failureRecord);

    const alreadyStopped = spawn('bash', [postgresScript, 'stop'], {
      cwd: root,
      env: environmentWithoutSelectedRun(),
      stdio: ['ignore', 'ignore', 'pipe'],
    });
    assert.equal(await exitCode(alreadyStopped), 0);
  });

  it('runs two isolated instances concurrently without port or socket collision and cleans on signal', {
    timeout: 20_000,
  }, async () => {
    const fixture = await temporaryFixture();
    const firstRecord = join(fixture, 'first.env');
    const secondRecord = join(fixture, 'second.env');
    const hold = ['node', '-e', "process.on('SIGTERM',()=>process.exit(0));setInterval(()=>{},1000)"];
    const first = spawnWrapped(hold, firstRecord);
    const second = spawnWrapped(hold, secondRecord);
    try {
      await Promise.all([waitForFile(firstRecord), waitForFile(secondRecord)]);
      const firstState = await runState(firstRecord);
      const secondState = await runState(secondRecord);
      assert.notEqual(firstState.run_dir, secondState.run_dir);
      assert.notEqual(firstState.port, secondState.port);
      assert.notEqual(firstState.socket, secondState.socket);
      first.kill('SIGTERM');
      second.kill('SIGTERM');
      assert.equal(await exitCode(first), 143);
      assert.equal(await exitCode(second), 143);
      await assertPathMissing(requiredState(firstState, 'run_dir'));
      await assertPathMissing(requiredState(secondState, 'run_dir'));
      await assertPortClosed(Number(firstState.port));
      await assertPortClosed(Number(secondState.port));
    } finally {
      await terminateChildren([first, second]);
    }
  });
});

describe('observable process lifecycle', () => {
  it('emits sanitized startup, readiness and shutdown signals and exits understandably', {
    timeout: 10_000,
  }, async () => {
    const fixture = await temporaryFixture();
    const record = join(fixture, 'lifecycle.env');
    const port = await availablePort();
    const child = spawnWrapped(
      ['node', '--import', 'tsx', 'src/bootstrap/main.ts'],
      record,
      { PORT: String(port) },
    );
    const stderr: string[] = [];
    child.stderr?.setEncoding('utf8');
    child.stderr?.on('data', (chunk: string) => stderr.push(chunk));
    try {
      await waitForLog(stderr, 'application.ready');
      const live = await fetch(`http://127.0.0.1:${port}/health/live`);
      const ready = await fetch(`http://127.0.0.1:${port}/health/ready`);
      assert.equal(live.status, 200);
      assert.equal(ready.status, 200);
      await waitForLog(stderr, 'readiness.reached');
      child.kill('SIGTERM');
      assert.equal(await exitCode(child), 143);
      const events = logRecords(stderr).map((recordEntry) => recordEntry.event);
      for (const event of [
        'process.start',
        'application.ready',
        'readiness.reached',
        'lifecycle.shutdown.started',
        'lifecycle.jobs.drain.started',
        'lifecycle.jobs.drain.completed',
        'lifecycle.listener.closed',
        'lifecycle.database_pool.close.started',
        'lifecycle.database_pool.close.completed',
        'lifecycle.shutdown.completed',
      ]) assert.equal(events.includes(event), true, event);
      const output = stderr.join('');
      assert.doesNotMatch(output, /postgresql:\/\/|credential|password|token|pin|SELECT|record-shared/i);
      const state = await runState(record);
      await assertPathMissing(requiredState(state, 'run_dir'));
      await assertPortClosed(port);
    } finally {
      await terminateChildren([child]);
    }
  });

  it('emits a sanitized unexpected bootstrap error', async () => {
    const child = spawn('node', ['--import', 'tsx', 'src/bootstrap/main.ts'], {
      cwd: root,
      env: { ...process.env, SPIKE_DATABASE_URL: '' },
      stdio: ['ignore', 'ignore', 'pipe'],
    });
    const stderr: string[] = [];
    child.stderr.setEncoding('utf8');
    child.stderr.on('data', (chunk: string) => stderr.push(chunk));
    assert.equal(await exitCode(child), 1);
    const records = logRecords(stderr);
    assert.equal(records.some((record) => record.event === 'bootstrap.unexpected_error'), true);
    assert.doesNotMatch(stderr.join(''), /postgresql:\/\/|password|token|pin/i);
  });
});

function spawnWrapped(
  command: readonly string[],
  record: string,
  extraEnvironment: Readonly<Record<string, string>> = {},
): ChildProcess {
  return spawn('bash', [wrapper, ...command], {
    cwd: root,
    env: { ...process.env, ...extraEnvironment, SPIKE_RUN_RECORD: record },
    stdio: ['ignore', 'ignore', 'pipe'],
  });
}

function environmentWithoutSelectedRun(): NodeJS.ProcessEnv {
  const environment = { ...process.env };
  delete environment.SPIKE_PG_RUN_DIR;
  delete environment.SPIKE_POSTGRES_PORT;
  delete environment.SPIKE_POSTGRES_SOCKET;
  delete environment.SPIKE_DATABASE_URL;
  return environment;
}

async function temporaryFixture(): Promise<string> {
  const path = await mkdtemp(join(tmpdir(), 'spike009-operations-test-'));
  temporaryRoots.push(path);
  return path;
}

async function exitCode(child: ChildProcess): Promise<number | null> {
  if (child.exitCode !== null) return child.exitCode;
  return new Promise((resolve, reject) => {
    child.once('error', reject);
    child.once('exit', (code) => resolve(code));
  });
}

async function waitForFile(path: string): Promise<void> {
  try {
    await access(path);
    return;
  } catch {}
  const directory = path.slice(0, path.lastIndexOf('/'));
  const filename = path.slice(path.lastIndexOf('/') + 1);
  const watcher = watch(directory);
  const timer = setTimeout(() => {
    if (watcher.return) void watcher.return();
  }, 5_000);
  try {
    try {
      await access(path);
      return;
    } catch {}
    for await (const event of watcher) {
      if (event.filename?.toString() === filename) return;
    }
    throw new Error(`Timed out waiting for ${filename}`);
  } finally {
    clearTimeout(timer);
    if (watcher.return) await watcher.return();
  }
}

async function terminateChildren(children: readonly ChildProcess[]): Promise<void> {
  for (const child of children) {
    if (child.exitCode === null && child.signalCode === null) child.kill('SIGTERM');
  }
  await Promise.allSettled(children.map((child) => exitCode(child)));
}

async function runState(path: string): Promise<Record<string, string>> {
  const content = await readFile(path, 'utf8');
  return Object.fromEntries(content.trim().split('\n').map((line) => {
    const separator = line.indexOf('=');
    return [line.slice(0, separator), line.slice(separator + 1)];
  }));
}

async function assertRunRemoved(record: string): Promise<void> {
  const state = await runState(record);
  await assertPathMissing(requiredState(state, 'run_dir'));
  await assertPortClosed(Number(requiredState(state, 'port')));
}

function requiredState(state: Readonly<Record<string, string>>, key: string): string {
  const value = state[key];
  assert.ok(value, `Missing ${key} in run record`);
  return value;
}

async function assertPathMissing(path: string): Promise<void> {
  await assert.rejects(access(path));
}

async function availablePort(): Promise<number> {
  const server = net.createServer();
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  if (address === null || typeof address === 'string') assert.fail('Expected TCP server address');
  const port = address.port;
  await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  return port;
}

async function assertPortClosed(port: number): Promise<void> {
  await assert.rejects(new Promise<void>((resolve, reject) => {
    const socket = net.connect({ host: '127.0.0.1', port });
    socket.once('connect', () => {
      socket.destroy();
      resolve();
    });
    socket.once('error', reject);
  }));
}

async function waitForLog(chunks: readonly string[], event: string): Promise<void> {
  const started = performance.now();
  while (!logRecords(chunks).some((record) => record.event === event)) {
    if (performance.now() - started > 5_000) throw new Error(`Timed out waiting for ${event}`);
    await new Promise<void>((resolve) => setImmediate(resolve));
  }
}

function logRecords(chunks: readonly string[]): Array<{ readonly event?: string }> {
  return chunks.join('').split('\n').flatMap((line) => {
    if (!line.startsWith('{')) return [];
    try {
      return [JSON.parse(line) as { readonly event?: string }];
    } catch {
      return [];
    }
  });
}
