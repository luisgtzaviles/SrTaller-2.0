import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { createConnection, createServer } from 'node:net';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const startupMarker = 'technical_shell_listening';

function abortError() {
  const error = new Error('Smoke listener probe was aborted');
  error.name = 'AbortError';
  return error;
}

async function reservePort() {
  const server = createServer();
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const address = server.address();

  if (!address || typeof address === 'string') {
    server.close();
    throw new Error('Unable to reserve a local TCP port');
  }

  const { port } = address;
  server.close();
  await once(server, 'close');
  return port;
}

function delay(milliseconds, signal) {
  return new Promise((resolveDelay, rejectDelay) => {
    if (signal?.aborted) {
      rejectDelay(abortError());
      return;
    }
    const cleanup = () => signal?.removeEventListener('abort', onAbort);
    const timer = setTimeout(() => {
      cleanup();
      resolveDelay();
    }, milliseconds);
    const onAbort = () => {
      clearTimeout(timer);
      cleanup();
      rejectDelay(abortError());
    };
    signal?.addEventListener('abort', onAbort, { once: true });
    timer.unref?.();
  });
}

async function probeListener(port, signal, connect = createConnection) {
  if (signal?.aborted) {
    throw abortError();
  }
  return new Promise((resolveProbe, rejectProbe) => {
    const socket = connect({ host: '127.0.0.1', port });
    let settled = false;
    const finish = (result) => {
      if (settled) {
        return;
      }
      settled = true;
      signal?.removeEventListener('abort', onAbort);
      socket.removeListener('connect', onConnect);
      socket.removeListener('error', onError);
      socket.destroy();
      resolveProbe(result);
    };
    const onConnect = () => finish(true);
    const onError = () => finish(false);
    const onAbort = () => {
      if (!settled) {
        settled = true;
        socket.removeListener('connect', onConnect);
        socket.removeListener('error', onError);
        socket.destroy();
        rejectProbe(abortError());
      }
    };
    socket.once('connect', onConnect);
    socket.once('error', onError);
    signal?.addEventListener('abort', onAbort, { once: true });
  });
}

export async function waitForListener(
  port,
  {
    connect = createConnection,
    intervalMs = 50,
    signal,
  } = {},
) {
  while (!signal?.aborted) {
    if (await probeListener(port, signal, connect)) {
      return;
    }
    await delay(intervalMs, signal);
  }
  throw abortError();
}

export function createChunkSignal(expected) {
  let buffer = '';
  let matched = false;
  let resolveSignal;
  const promise = new Promise((resolvePromise) => {
    resolveSignal = resolvePromise;
  });
  return {
    promise,
    push(chunk) {
      if (matched) {
        return;
      }
      buffer += String(chunk);
      if (buffer.includes(expected)) {
        matched = true;
        resolveSignal();
      }
    },
  };
}

export function createReadinessCoordinator({
  child,
  listenerPromise,
  marker = startupMarker,
  timeoutMs = 8_000,
}) {
  let stdout = '';
  let stderr = '';
  let listenerReady = false;
  let settled = false;
  let timer;
  let resolveReady;
  let rejectReady;
  const markerSignal = createChunkSignal(marker);
  const ready = new Promise((resolvePromise, rejectPromise) => {
    resolveReady = resolvePromise;
    rejectReady = rejectPromise;
  });

  const output = () => ({ stderr, stdout });
  const errorWithOutput = (message) => {
    const details = stderr.trim() || stdout.trim();
    return new Error(details ? `${message}: ${details}` : message);
  };
  const succeedIfComplete = () => {
    if (!settled && listenerReady && stdout.includes(marker)) {
      settled = true;
      clearTimeout(timer);
      resolveReady(output());
    }
  };
  const fail = (error) => {
    if (settled) {
      return;
    }
    settled = true;
    clearTimeout(timer);
    rejectReady(error);
  };
  const onStdout = (chunk) => {
    stdout += String(chunk);
    markerSignal.push(chunk);
    succeedIfComplete();
  };
  const onStderr = (chunk) => {
    stderr += String(chunk);
  };
  const onExit = (code, signal) => {
    fail(
      errorWithOutput(
        `Compiled shell exited before readiness (code ${String(code)}, signal ${String(signal)})`,
      ),
    );
  };
  const onError = (error) => {
    fail(errorWithOutput(`Compiled shell failed to start (${error.message})`));
  };

  child.stdout.setEncoding('utf8');
  child.stderr.setEncoding('utf8');
  child.stdout.on('data', onStdout);
  child.stderr.on('data', onStderr);
  child.once('exit', onExit);
  child.once('error', onError);

  markerSignal.promise.then(succeedIfComplete);
  listenerPromise.then(
    () => {
      listenerReady = true;
      succeedIfComplete();
    },
    (error) => fail(errorWithOutput(`Listener probe failed (${error.message})`)),
  );
  timer = setTimeout(() => {
    fail(errorWithOutput('Compiled shell readiness timed out'));
  }, timeoutMs);

  return {
    cleanup() {
      clearTimeout(timer);
      child.stdout.removeListener('data', onStdout);
      child.stderr.removeListener('data', onStderr);
      child.removeListener('exit', onExit);
      child.removeListener('error', onError);
    },
    output,
    ready,
  };
}

async function childExit(child) {
  if (child.exitCode !== null || child.signalCode !== null) {
    return [child.exitCode, child.signalCode];
  }
  return once(child, 'exit');
}

export async function runCompiledSmoke({ timeoutMs = 8_000 } = {}) {
  const port = await reservePort();
  const child = spawn(
    process.execPath,
    ['--enable-source-maps', resolve(process.cwd(), 'dist/main.js')],
    {
      env: {
        ...process.env,
        HOST: '127.0.0.1',
        NODE_ENV: 'production',
        PORT: String(port),
      },
      stdio: ['ignore', 'pipe', 'pipe'],
    },
  );
  const abortController = new AbortController();
  const coordinator = createReadinessCoordinator({
    child,
    listenerPromise: waitForListener(port, {
      signal: abortController.signal,
    }),
    timeoutMs,
  });

  try {
    await coordinator.ready;
    child.kill('SIGTERM');
    const [code, signal] = await childExit(child);
    if (code !== 0 && signal !== 'SIGTERM') {
      const { stderr } = coordinator.output();
      throw new Error(
        `Compiled shell exited unexpectedly: ${stderr.trim() || 'no stderr'}`,
      );
    }
    process.stdout.write('Compiled dist startup, listener and shutdown verified\n');
  } catch (error) {
    if (child.exitCode === null && child.signalCode === null) {
      child.kill('SIGTERM');
      await childExit(child);
    }
    throw error;
  } finally {
    abortController.abort();
    coordinator.cleanup();
    child.stdout.destroy();
    child.stderr.destroy();
  }
}

const invokedPath = process.argv[1] ? resolve(process.argv[1]) : undefined;
if (invokedPath === fileURLToPath(import.meta.url)) {
  await runCompiledSmoke();
}
