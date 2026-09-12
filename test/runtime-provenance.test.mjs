import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import {
  inspectLiveRuntimeProvenance,
  runtimeProvenanceEnvironment,
  validateRuntimeProvenance,
} from '../scripts/lib/runtime-provenance.mjs';

const revision = '0123456789abcdef0123456789abcdef01234567';
const expected = Object.freeze({ sourceRevision: revision, sourceState: 'clean' });

function liveFetch({ frontend = expected, backend = expected } = {}) {
  return async (url) => {
    if (url.endsWith('/runtime-provenance.json')) {
      return new Response(JSON.stringify({ role: 'frontend', ...frontend }), {
        headers: { 'content-type': 'application/json' },
      });
    }
    return new Response(JSON.stringify({ status: 'ready' }), {
      headers: {
        'content-type': 'application/json',
        'x-sr-runtime-role': 'backend',
        'x-sr-source-revision': backend.sourceRevision,
        'x-sr-source-state': backend.sourceState,
      },
    });
  };
}

test('runtime provenance accepts only an exact Git SHA and governed source state', () => {
  assert.deepEqual(validateRuntimeProvenance(expected), expected);
  assert.deepEqual(runtimeProvenanceEnvironment(expected), {
    SR_RUNTIME_GIT_SHA: revision,
    SR_RUNTIME_SOURCE_STATE: 'clean',
  });
  for (const candidate of [
    {},
    { sourceRevision: revision.slice(1), sourceState: 'clean' },
    { sourceRevision: revision.toUpperCase(), sourceState: 'clean' },
    { sourceRevision: revision, sourceState: 'unknown' },
  ]) {
    assert.throws(() => validateRuntimeProvenance(candidate), /unavailable or invalid/u);
  }
});

test('live frontend and backend must identify the same expected source', async () => {
  const result = await inspectLiveRuntimeProvenance({
    frontendBaseUrl: 'http://frontend.test',
    backendBaseUrl: 'http://backend.test',
    expected,
    fetchImplementation: liveFetch(),
  });
  assert.equal(result.status, 'PASS');
  assert.deepEqual(result.frontend, expected);
  assert.deepEqual(result.backend, expected);

  await assert.rejects(
    inspectLiveRuntimeProvenance({
      frontendBaseUrl: 'http://frontend.test',
      backendBaseUrl: 'http://backend.test',
      expected,
      fetchImplementation: liveFetch({
        frontend: { ...expected, sourceState: 'dirty' },
      }),
    }),
    /frontend runtime provenance does not match/u,
  );
});

test('backend headers are bounded and fail closed to unavailable metadata', async () => {
  const {
    applyRuntimeProvenanceHeaders,
    loadRuntimeProvenance,
  } = await import('../dist/infrastructure/runtime/runtime-provenance.js');
  assert.deepEqual(loadRuntimeProvenance({
    SR_RUNTIME_GIT_SHA: revision,
    SR_RUNTIME_SOURCE_STATE: 'dirty',
  }), { sourceRevision: revision, sourceState: 'dirty' });
  assert.deepEqual(loadRuntimeProvenance({}), {
    sourceRevision: 'unavailable',
    sourceState: 'unavailable',
  });
  const headers = new Map();
  applyRuntimeProvenanceHeaders(
    { setHeader: (name, value) => headers.set(name, value) },
    expected,
  );
  assert.deepEqual(Object.fromEntries(headers), {
    'X-SR-Runtime-Role': 'backend',
    'X-SR-Source-Revision': revision,
    'X-SR-Source-State': 'clean',
  });
});

test('OCI build requires and publishes the source revision without repository paths', async () => {
  const dockerfile = await readFile('Dockerfile', 'utf8');
  const viteConfig = await readFile('apps/dev-preview-web/vite.config.ts', 'utf8');
  assert.match(dockerfile, /ARG SR_BUILD_GIT_SHA/u);
  assert.match(dockerfile, /org\.opencontainers\.image\.revision/u);
  assert.match(dockerfile, /SR_RUNTIME_GIT_SHA/u);
  assert.match(viteConfig, /runtime-provenance\.json/u);
});
