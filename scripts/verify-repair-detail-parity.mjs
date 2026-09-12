import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';

import { PBI039_REPAIR_DETAIL_PARITY_FIXTURE as fixture } from './lib/pbi039-repair-detail-parity-fixture.mjs';
import {
  assertRepairDetailParityDom,
  assertRepairDetailParityReadModel,
  repairDetailDomSignature,
} from './lib/repair-detail-parity-contract.mjs';

function argument(name, fallback) {
  const index = process.argv.indexOf(name);
  return index === -1 ? fallback : process.argv[index + 1];
}

const cdp = argument('--cdp', 'http://127.0.0.1:9223');
const localOrigin = argument('--local-origin', 'http://127.0.0.1:4173');
const backendOrigin = argument('--backend-origin', 'http://127.0.0.1:3000');
const output = argument('--output', null);
const hold = process.argv.includes('--hold');

function sha256(bytes) {
  return createHash('sha256').update(bytes).digest('hex');
}

async function fetchBytes(url) {
  const response = await fetch(url, { cache: 'no-store' });
  assert.equal(response.status, 200, `${url} returned ${response.status}`);
  return Buffer.from(await response.arrayBuffer());
}

async function verifyPreviewAssets() {
  const baseline = fixture.previewBaseline;
  const entrypoint = await fetchBytes(`${baseline.origin}/`);
  const javascript = await fetchBytes(`${baseline.origin}${baseline.javascriptPath}`);
  const stylesheet = await fetchBytes(`${baseline.origin}${baseline.stylesheetPath}`);
  assert.equal(sha256(entrypoint), baseline.entrypointSha256, 'Preview HTML differs from the accepted PBI-039 runtime');
  assert.equal(sha256(javascript), baseline.javascriptSha256, 'Preview JavaScript differs from the accepted PBI-039 runtime');
  assert.equal(sha256(stylesheet), baseline.stylesheetSha256, 'Preview stylesheet differs from the accepted PBI-039 runtime');
}

async function targetList() {
  const response = await fetch(`${cdp}/json/list`);
  assert.equal(response.status, 200, 'Chrome CDP target list is unavailable');
  return response.json();
}

async function browserTarget(url, preferredOrigin) {
  const current = (await targetList()).find((target) => target.type === 'page' && target.url.startsWith(preferredOrigin));
  if (current) return current;
  const created = await fetch(`${cdp}/json/new?${encodeURIComponent(url)}`, { method: 'PUT' });
  assert.equal(created.status, 200, `Could not open ${preferredOrigin}`);
  return created.json();
}

function connect(target, onPaused) {
  const websocket = new WebSocket(target.webSocketDebuggerUrl);
  let sequence = 0;
  const pending = new Map();
  websocket.onmessage = async (event) => {
    const message = JSON.parse(event.data);
    if (message.id && pending.has(message.id)) {
      pending.get(message.id)(message);
      pending.delete(message.id);
      return;
    }
    if (message.method === 'Fetch.requestPaused' && onPaused) {
      await onPaused(message.params, call);
    }
  };
  const opened = new Promise((resolve) => { websocket.onopen = resolve; });
  function call(method, params = {}) {
    return new Promise((resolveCall) => {
      const id = ++sequence;
      pending.set(id, resolveCall);
      websocket.send(JSON.stringify({ id, method, params }));
    });
  }
  return Object.freeze({ websocket, opened, call });
}

async function evaluate(connection, expression, awaitPromise = false) {
  const response = await connection.call('Runtime.evaluate', {
    expression,
    awaitPromise,
    returnByValue: true,
  });
  if (response.result?.exceptionDetails) throw new Error('Browser evaluation failed');
  return response.result?.result?.value;
}

async function waitForDetail(connection) {
  for (let attempt = 0; attempt < 40; attempt += 1) {
    const ready = await evaluate(connection, `document.body.innerText.includes('Detalle de reparación') && !document.body.innerText.includes('Cargando reparación')`);
    if (ready) return;
    await new Promise((resolveWait) => setTimeout(resolveWait, 250));
  }
  const state = await evaluate(connection, `({ url: location.href, text: document.body.innerText.slice(0, 500) })`);
  throw new Error(`Repair Detail did not become ready at ${state.url}: ${state.text.replace(/\s+/gu, ' ')}`);
}

const captureExpression = `(() => {
  const headings = [...document.querySelectorAll('main h1,main h2,main h3,main dt,main button,main a,[role=dialog] h1,[role=dialog] h2,[role=dialog] h3,[role=dialog] dt,[role=dialog] button')]
    .map((node, index) => ({ index, tag: node.tagName, text: node.textContent?.trim().replace(/\\s+/g, ' '), aria: node.getAttribute('aria-label'), role: node.getAttribute('role') }));
  const sections = [...document.querySelectorAll('main section,[role=dialog] section')]
    .map((node, index) => { const box = node.getBoundingClientRect(); return { index, aria: node.getAttribute('aria-label'), heading: node.querySelector('h1,h2,h3')?.textContent?.trim() ?? null, classes: node.className, geometry: { x: Math.round(box.x), width: Math.round(box.width) } }; });
  const main = document.querySelector('main')?.getBoundingClientRect();
  return { url: location.href, title: document.title, headings, sections, bodyText: document.body.innerText, geometry: main ? { x: Math.round(main.x), width: Math.round(main.width), overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth } : null };
})()`;

async function captureLocal(target) {
  const connection = connect(target);
  await connection.opened;
  await connection.call('Page.navigate', { url: `${localOrigin}/reparaciones/${fixture.repairId}` });
  await waitForDetail(connection);
  const exchange = await evaluate(connection, `(async () => {
    const sessionResponse = await fetch('/api/access/session', { credentials: 'include', cache: 'no-store' });
    const repairResponse = await fetch('/api/repairs/${fixture.repairId}', { credentials: 'include', cache: 'no-store' });
    return { sessionStatus: sessionResponse.status, session: await sessionResponse.json(), repairStatus: repairResponse.status, repair: await repairResponse.json() };
  })()`, true);
  assert.equal(exchange.sessionStatus, 200, 'Local operational Session is unavailable');
  assert.ok(exchange.session.session, 'Local operational Session is not active');
  assert.equal(exchange.repairStatus, 200, 'Canonical local Repair is unavailable');
  assertRepairDetailParityReadModel(exchange.repair, fixture);
  const capture = await evaluate(connection, captureExpression);
  assertRepairDetailParityDom(capture, fixture);
  return { connection, capture, exchange };
}

async function evidenceBodies() {
  const bodies = new Map();
  for (const evidence of fixture.evidence) {
    bodies.set(evidence.attachmentId, Buffer.from(await readFile(resolve('.runtime/repair-evidence', evidence.storageKey))).toString('base64'));
  }
  return bodies;
}

async function capturePreview(target, localExchange) {
  const images = await evidenceBodies();
  const previewSession = {
    ...localExchange.session,
    capabilities: localExchange.session.capabilities.filter((capability) => [
      'repairs.read',
      'repairs.add_note',
      'repairs.create',
      'repairs.correct_intake',
      'repairs.classify',
      'repairs.catalogs.read',
      'repairs.catalogs.manage',
      'repairs.configuration.read',
      'repairs.configuration.manage',
    ].includes(capability)),
    administrationCapabilities: [],
  };
  const connection = connect(target, async (paused, call) => {
    const url = new URL(paused.request.url);
    const method = paused.request.method;
    let responseBody = null;
    let contentType = 'application/json; charset=utf-8';
    if (method === 'GET' && url.pathname === '/api/access/session') responseBody = Buffer.from(JSON.stringify(previewSession)).toString('base64');
    if (method === 'GET' && url.pathname === '/api/users/me/preferences') responseBody = Buffer.from(JSON.stringify({ newRepairFormMode: 'classic' })).toString('base64');
    if (method === 'GET' && url.pathname === `/api/repairs/${fixture.repairId}`) responseBody = Buffer.from(JSON.stringify(localExchange.repair)).toString('base64');
    const evidenceMatch = new RegExp(`^/api/repairs/${fixture.repairId}/evidence/([^/]+)/content$`, 'u').exec(url.pathname);
    if (method === 'GET' && evidenceMatch && images.has(evidenceMatch[1])) {
      responseBody = images.get(evidenceMatch[1]);
      contentType = 'image/png';
    }
    if (responseBody !== null) {
      await call('Fetch.fulfillRequest', {
        requestId: paused.requestId,
        responseCode: 200,
        responseHeaders: [{ name: 'Content-Type', value: contentType }, { name: 'Cache-Control', value: 'private, no-store' }],
        body: responseBody,
      });
      return;
    }
    if (method !== 'GET' && url.pathname.startsWith('/api/')) {
      await call('Fetch.fulfillRequest', {
        requestId: paused.requestId,
        responseCode: 409,
        responseHeaders: [{ name: 'Content-Type', value: 'application/json; charset=utf-8' }],
        body: Buffer.from(JSON.stringify({ code: 'PARITY_FIXTURE_READ_ONLY' })).toString('base64'),
      });
      return;
    }
    await call('Fetch.continueRequest', { requestId: paused.requestId });
  });
  await connection.opened;
  await connection.call('Fetch.enable', { patterns: [{ urlPattern: '*api/*', requestStage: 'Request' }] });
  await connection.call('Page.navigate', { url: `${fixture.previewBaseline.origin}/reparaciones/${fixture.repairId}` });
  await waitForDetail(connection);
  const capture = await evaluate(connection, captureExpression);
  assertRepairDetailParityDom(capture, fixture);
  return { connection, capture };
}

await verifyPreviewAssets();
const [localProvenanceResponse, backendReadyResponse] = await Promise.all([
  fetch(`${localOrigin}/runtime-provenance.json`, { cache: 'no-store' }),
  fetch(`${backendOrigin}/readyz`, { cache: 'no-store' }),
]);
assert.equal(localProvenanceResponse.status, 200, 'Local frontend provenance is unavailable');
assert.equal(backendReadyResponse.status, 200, 'Local backend readiness is unavailable');
const localProvenance = await localProvenanceResponse.json();
assert.equal(localProvenance.sourceState, 'clean', 'Local frontend does not serve a clean candidate');
assert.equal(backendReadyResponse.headers.get('x-sr-source-revision'), localProvenance.sourceRevision, 'Frontend/backend revisions differ');
assert.equal(backendReadyResponse.headers.get('x-sr-source-state'), 'clean', 'Local backend does not serve a clean candidate');

const localTarget = await browserTarget(`${localOrigin}/reparaciones/${fixture.repairId}`, localOrigin);
const previewTarget = await browserTarget(`${fixture.previewBaseline.origin}/reparaciones/${fixture.repairId}`, fixture.previewBaseline.origin);
const local = await captureLocal(localTarget);
const preview = await capturePreview(previewTarget, local.exchange);

const localSignature = repairDetailDomSignature(local.capture);
const previewSignature = repairDetailDomSignature(preview.capture);
assert.deepEqual(previewSignature.sectionHeadings, localSignature.sectionHeadings, 'Repair Detail section hierarchy differs');
assert.deepEqual(previewSignature.definitionTerms, localSignature.definitionTerms, 'Repair Detail field hierarchy differs');
assert.equal(preview.capture.geometry.overflow, false, 'Preview has horizontal overflow');
assert.equal(local.capture.geometry.overflow, false, 'Local has horizontal overflow');
assert.equal(preview.capture.geometry.width, local.capture.geometry.width, 'Repair Detail functional width differs');
for (const [index, localSection] of local.capture.sections.entries()) {
  const previewSection = preview.capture.sections[index];
  assert.equal(previewSection?.heading, localSection.heading, `Section ${index} heading differs`);
  assert.equal(previewSection?.geometry.width, localSection.geometry.width, `Section ${index} width differs`);
}

const report = {
  contract: fixture.contract,
  fixture: { repairId: fixture.repairId, folio: fixture.folio, dataClassification: fixture.dataClassification },
  preview: { origin: fixture.previewBaseline.origin, sourceRevision: fixture.previewBaseline.sourceRevision, targetId: previewTarget.id },
  local: { origin: localOrigin, sourceRevision: localProvenance.sourceRevision, targetId: localTarget.id },
  readModel: { samePayload: true, timelineCount: local.exchange.repair.timeline.totalCount, evidenceCount: local.exchange.repair.evidence.totalCount },
  dom: { sectionHeadings: localSignature.sectionHeadings, definitionTerms: localSignature.definitionTerms, functionalWidth: local.capture.geometry.width, overflow: false },
  status: 'PASS',
};
if (output) {
  const outputPath = resolve(output);
  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, `${JSON.stringify(report, null, 2)}\n`);
}
process.stdout.write(`${JSON.stringify(report)}\n`);
await fetch(`${cdp}/json/activate/${previewTarget.id}`).catch(() => undefined);

if (hold) {
  process.stdout.write('{"event":"repair_detail_parity_tabs_ready","status":"HOLDING"}\n');
  await new Promise(() => undefined);
} else {
  await preview.connection.call('Fetch.disable');
  preview.connection.websocket.close();
  local.connection.websocket.close();
}
