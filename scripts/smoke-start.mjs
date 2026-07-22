import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { createConnection, createServer } from 'node:net';
import { resolve } from 'node:path';

async function reservePort() {
  const server = createServer();
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const address = server.address();

  if (!address || typeof address === 'string') {
    throw new Error('Unable to reserve a local TCP port');
  }

  const { port } = address;
  server.close();
  await once(server, 'close');
  return port;
}

async function waitForListener(port) {
  const deadline = Date.now() + 8_000;

  while (Date.now() < deadline) {
    const connected = await new Promise((resolveConnection) => {
      const socket = createConnection({ host: '127.0.0.1', port });
      socket.once('connect', () => {
        socket.destroy();
        resolveConnection(true);
      });
      socket.once('error', () => resolveConnection(false));
    });

    if (connected) {
      return;
    }

    await new Promise((resolveDelay) => setTimeout(resolveDelay, 50));
  }

  throw new Error('The compiled technical shell did not open its listener');
}

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

let stdout = '';
let stderr = '';
child.stdout.setEncoding('utf8');
child.stderr.setEncoding('utf8');
child.stdout.on('data', (chunk) => {
  stdout += chunk;
});
child.stderr.on('data', (chunk) => {
  stderr += chunk;
});

try {
  await waitForListener(port);

  if (!stdout.includes('technical_shell_listening')) {
    throw new Error('The startup marker was not emitted');
  }

  child.kill('SIGTERM');
  const [code, signal] = await once(child, 'exit');

  if (code !== 0 && signal !== 'SIGTERM') {
    throw new Error(`Compiled shell exited unexpectedly: ${stderr.trim()}`);
  }

  process.stdout.write('Compiled dist startup, listener and shutdown verified\n');
} catch (error) {
  child.kill('SIGTERM');
  throw error;
}
