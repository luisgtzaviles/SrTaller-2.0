import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';

const input = process.env.SR_PREVIEW_SMOKE_BASE_URL;
if (!input) {
  throw new Error('SR_PREVIEW_SMOKE_BASE_URL is required');
}
const base = new URL(input);
if (
  !['http:', 'https:'].includes(base.protocol) ||
  base.username ||
  base.password ||
  base.pathname !== '/'
) {
  throw new Error('SR_PREVIEW_SMOKE_BASE_URL must be an origin-only HTTP(S) URL');
}

async function request(path, init = {}) {
  const response = await fetch(new URL(path, base), {
    ...init,
    headers: {
      Accept: 'application/json',
      ...(init.body ? { 'Content-Type': 'application/json' } : {}),
      ...init.headers,
    },
  });
  const text = await response.text();
  let json = null;
  if (text && response.headers.get('content-type')?.includes('application/json')) {
    json = JSON.parse(text);
  }
  return Object.freeze({ response, text, json });
}

for (const path of ['/', '/reparaciones', '/reparaciones/nueva']) {
  const result = await request(path, { headers: { Accept: 'text/html' } });
  assert.equal(result.response.status, 200);
  assert.match(result.text, /<div id="root"><\/div>/u);
}

const contextResult = await request('/api/preview/context');
assert.equal(contextResult.response.status, 200);
assert.deepEqual(Object.keys(contextResult.json).sort(), [
  'branchName',
  'environment',
  'stationLabel',
  'tenantName',
]);
assert.equal(contextResult.json.environment, 'DEV_PREVIEW');

const suffix = randomBytes(4).toString('hex');
const createResult = await request('/api/preview/repairs', {
  method: 'POST',
  body: JSON.stringify({
    customerName: `Cliente Sintético ${suffix}`,
    customerPhone: '6620000000',
    deviceBrand: 'Marca Demo',
    deviceModel: 'Modelo VS0',
    deviceSerial: `SERIE-${suffix}`,
    deviceColor: 'Azul demo',
    reportedProblem: 'No enciende en prueba sintética.',
    physicalCondition: 'Sin daño sintético.',
    notes: 'Registro descartable del smoke VS0.',
    estimatedPrice: 750,
    depositAmount: 100,
  }),
});
assert.equal(createResult.response.status, 201);
assert.equal(createResult.json.status, 'received');
assert.equal(createResult.json.revision, 1);
assert.equal(createResult.json.history.length, 1);

const repairId = createResult.json.id;
const listResult = await request('/api/preview/repairs');
assert.equal(listResult.response.status, 200);
assert.equal(listResult.json.filter(({ id }) => id === repairId).length, 1);

const detailResult = await request(`/api/preview/repairs/${encodeURIComponent(repairId)}`);
assert.equal(detailResult.response.status, 200);
assert.equal(detailResult.json.status, 'received');

const transitionResult = await request(
  `/api/preview/repairs/${encodeURIComponent(repairId)}/status`,
  {
    method: 'PATCH',
    body: JSON.stringify({ expectedRevision: 1, status: 'diagnosing' }),
  },
);
assert.equal(transitionResult.response.status, 200);
assert.equal(transitionResult.json.revision, 2);
assert.equal(transitionResult.json.history.length, 2);

const staleResult = await request(
  `/api/preview/repairs/${encodeURIComponent(repairId)}/status`,
  {
    method: 'PATCH',
    body: JSON.stringify({ expectedRevision: 1, status: 'ready' }),
  },
);
assert.equal(staleResult.response.status, 409);
assert.equal(
  staleResult.json.message?.error?.code ?? staleResult.json.error?.code,
  'PREVIEW_REPAIR_REVISION_CONFLICT',
);

const reloadResult = await request(`/api/preview/repairs/${encodeURIComponent(repairId)}`);
assert.equal(reloadResult.response.status, 200);
assert.equal(reloadResult.json.status, 'diagnosing');
assert.equal(reloadResult.json.revision, 2);

process.stdout.write([
  'HTTP shell/fallback: PASS',
  'Public context contract: PASS',
  'Create/list/detail/reload: PASS',
  'Status CAS and stale conflict: PASS',
].join('\n') + '\n');
