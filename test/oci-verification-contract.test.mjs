import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const source = await readFile('scripts/verify-oci-image.mjs', 'utf8');

test('OCI verifier failures cannot expose generated database or PIN secrets', () => {
  const dockerHelper = source.slice(
    source.indexOf('async function docker'),
    source.indexOf('function assert'),
  );
  assert.match(dockerHelper, /try \{[\s\S]*?await execFileAsync/u);
  assert.match(
    dockerHelper,
    /catch \{[\s\S]*?OCI verification Docker operation failed/u,
  );
  assert.doesNotMatch(dockerHelper, /cause|stderr|stdout|arguments_\.join/u);
  assert.match(source, /const databasePassword = `synthetic_/u);
  assert.match(source, /const pinPepper = randomBytes/u);
});

test('OCI verifier requires one source revision across image, frontend and backend', () => {
  assert.match(source, /org\.opencontainers\.image\.revision/u);
  assert.match(source, /SR_RUNTIME_GIT_SHA/u);
  assert.match(source, /runtime-provenance\.json/u);
  assert.match(source, /x-sr-source-revision/u);
  assert.match(source, /x-sr-source-state/u);
});
