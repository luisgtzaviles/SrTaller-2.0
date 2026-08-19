import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { createServer } from 'node:net';
import { resolve } from 'node:path';

async function reservePort() {
  const server = createServer();
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const address = server.address();
  assert.ok(address && typeof address !== 'string');
  server.close();
  await once(server, 'close');
  return address.port;
}

async function waitForReady(baseUrl) {
  let lastError;
  for (let attempt = 0; attempt < 80; attempt += 1) {
    try {
      const response = await fetch(`${baseUrl}/readyz`, {
        signal: AbortSignal.timeout(500),
      });
      if (response.status === 200) return;
    } catch (error) {
      lastError = error;
    }
    await new Promise((resolveDelay) => setTimeout(resolveDelay, 100));
  }
  throw new Error(`UI smoke readiness timed out: ${lastError?.message ?? 'not ready'}`);
}

async function stop(child) {
  if (child.exitCode !== null || child.signalCode !== null) return;
  child.kill('SIGTERM');
  await once(child, 'exit');
}

const port = await reservePort();
const baseUrl = `http://127.0.0.1:${port}`;
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
let stderr = '';
child.stderr.setEncoding('utf8');
child.stderr.on('data', (chunk) => {
  stderr += chunk;
});

try {
  await waitForReady(baseUrl);
  const [root, spa, catalog, live, ready, apiUnknown, routeUnknown] = await Promise.all([
    fetch(`${baseUrl}/`, { headers: { Accept: 'text/html' } }),
    fetch(`${baseUrl}/reparaciones`, { headers: { Accept: 'text/html' } }),
    fetch(`${baseUrl}/__internal/ui-catalog`, { headers: { Accept: 'text/html' } }),
    fetch(`${baseUrl}/livez`),
    fetch(`${baseUrl}/readyz`),
    fetch(`${baseUrl}/api/unknown`),
    fetch(`${baseUrl}/not-authorized`),
  ]);
  const rootHtml = await root.text();
  const spaHtml = await spa.text();
  const assetPath = rootHtml.match(/src="(\/assets\/[^"]+\.js)"/u)?.[1];

  assert.equal(root.status, 200);
  assert.match(root.headers.get('content-type') ?? '', /^text\/html/u);
  assert.match(rootHtml, /<title>SR Taller 2\.0 · Preview<\/title>/u);
  assert.equal(spa.status, 200);
  assert.equal(spaHtml, rootHtml);
  assert.equal(catalog.status, 200);
  assert.equal(catalog.headers.get('x-robots-tag'), 'noindex, nofollow, noarchive');
  assert.deepEqual(await live.json(), { status: 'live' });
  assert.deepEqual(await ready.json(), { status: 'ready' });
  assert.equal(apiUnknown.status, 404);
  assert.equal(routeUnknown.status, 404);
  assert.ok(assetPath, 'Compiled frontend JavaScript asset is missing from index.html');

  const asset = await fetch(`${baseUrl}${assetPath}`);
  assert.equal(asset.status, 200);
  assert.match(asset.headers.get('content-type') ?? '', /javascript/u);

  process.stdout.write(`${JSON.stringify({
    apiUnknown: apiUnknown.status,
    asset: asset.status,
    catalog: catalog.status,
    livez: live.status,
    readyz: ready.status,
    root: root.status,
    spa: spa.status,
    unknown: routeUnknown.status,
  })}\n`);
} catch (error) {
  if (stderr.trim()) process.stderr.write(stderr);
  throw error;
} finally {
  await stop(child);
}
