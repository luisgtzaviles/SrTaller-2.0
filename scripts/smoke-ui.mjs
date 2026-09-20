import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { once } from 'node:events';
import { createServer } from 'node:net';
import { resolve } from 'node:path';

import {
  inspectWorkingTreeProvenance,
  runtimeProvenanceEnvironment,
} from './lib/runtime-provenance.mjs';

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
const expectedProvenance = await inspectWorkingTreeProvenance();
const child = spawn(
  process.execPath,
  ['--enable-source-maps', resolve(process.cwd(), 'dist/main.js')],
  {
    env: {
      ...process.env,
      HOST: '127.0.0.1',
      NODE_ENV: 'production',
      PORT: String(port),
      ...runtimeProvenanceEnvironment(expectedProvenance),
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
  const [root, spa, priceList, bulkCatalogComposer, catalogAdministration, catalogFieldPolicy, catalog, provenance, live, ready, apiUnknown, routeUnknown] = await Promise.all([
    fetch(`${baseUrl}/`, { headers: { Accept: 'text/html' } }),
    fetch(`${baseUrl}/reparaciones`, { headers: { Accept: 'text/html' } }),
    fetch(`${baseUrl}/listas/precios`, { headers: { Accept: 'text/html' } }),
    fetch(`${baseUrl}/listas/precios/carga-masiva`, { headers: { Accept: 'text/html' } }),
    fetch(`${baseUrl}/configuracion/catalogos?module=price-list`, { headers: { Accept: 'text/html' } }),
    fetch(`${baseUrl}/configuracion/catalogos/lista-de-precios/campos-de-carga`, { headers: { Accept: 'text/html' } }),
    fetch(`${baseUrl}/__internal/ui-catalog`, { headers: { Accept: 'text/html' } }),
    fetch(`${baseUrl}/runtime-provenance.json`, { cache: 'no-store' }),
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
  assert.equal(root.headers.get('cache-control'), 'no-store');
  assert.equal(
    root.headers.get('etag'),
    `"${createHash('sha256').update(rootHtml).digest('base64url')}"`,
  );
  assert.match(rootHtml, /<title>SR Taller 2\.0 · Preview<\/title>/u);
  assert.equal(spa.status, 200);
  assert.equal(spa.headers.get('cache-control'), 'no-store');
  assert.equal(spa.headers.get('etag'), root.headers.get('etag'));
  assert.equal(spaHtml, rootHtml);
  assert.equal(priceList.status, 200);
  assert.equal(priceList.headers.get('cache-control'), 'no-store');
  assert.equal(priceList.headers.get('etag'), root.headers.get('etag'));
  assert.equal(await priceList.text(), rootHtml);
  assert.equal(bulkCatalogComposer.status, 200);
  assert.equal(bulkCatalogComposer.headers.get('cache-control'), 'no-store');
  assert.equal(bulkCatalogComposer.headers.get('etag'), root.headers.get('etag'));
  assert.equal(await bulkCatalogComposer.text(), rootHtml);
  assert.equal(catalogAdministration.status, 200);
  assert.equal(catalogAdministration.headers.get('cache-control'), 'no-store');
  assert.equal(catalogAdministration.headers.get('etag'), root.headers.get('etag'));
  assert.equal(await catalogAdministration.text(), rootHtml);
  assert.equal(catalogFieldPolicy.status, 200);
  assert.equal(catalogFieldPolicy.headers.get('cache-control'), 'no-store');
  assert.equal(catalogFieldPolicy.headers.get('etag'), root.headers.get('etag'));
  assert.equal(await catalogFieldPolicy.text(), rootHtml);
  assert.equal(catalog.status, 200);
  assert.equal(catalog.headers.get('cache-control'), 'no-store');
  assert.equal(catalog.headers.get('etag'), root.headers.get('etag'));
  assert.equal(catalog.headers.get('x-robots-tag'), 'noindex, nofollow, noarchive');
  assert.equal(provenance.status, 200);
  assert.equal(provenance.headers.get('cache-control'), 'no-store');
  assert.deepEqual(await provenance.json(), { role: 'frontend', ...expectedProvenance });
  assert.deepEqual(await live.json(), { status: 'live' });
  assert.deepEqual(await ready.json(), { status: 'ready' });
  assert.equal(ready.headers.get('x-sr-runtime-role'), 'backend');
  assert.equal(ready.headers.get('x-sr-source-revision'), expectedProvenance.sourceRevision);
  assert.equal(ready.headers.get('x-sr-source-state'), expectedProvenance.sourceState);
  assert.equal(apiUnknown.status, 404);
  assert.equal(routeUnknown.status, 404);
  assert.ok(assetPath, 'Compiled frontend JavaScript asset is missing from index.html');

  const asset = await fetch(`${baseUrl}${assetPath}`);
  assert.equal(asset.status, 200);
  assert.match(asset.headers.get('content-type') ?? '', /javascript/u);

  process.stdout.write(`${JSON.stringify({
    apiUnknown: apiUnknown.status,
    asset: asset.status,
    bulkCatalogComposer: bulkCatalogComposer.status,
    catalog: catalog.status,
    catalogAdministration: catalogAdministration.status,
    catalogFieldPolicy: catalogFieldPolicy.status,
    livez: live.status,
    readyz: ready.status,
    root: root.status,
    spa: spa.status,
    priceList: priceList.status,
    unknown: routeUnknown.status,
  })}\n`);
} catch (error) {
  if (stderr.trim()) process.stderr.write(stderr);
  throw error;
} finally {
  await stop(child);
}
