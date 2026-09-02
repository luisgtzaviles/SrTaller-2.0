import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

import {
  LOCAL_EVIDENCE_FIXTURES,
  materializeLocalEvidenceFixtures,
} from '../scripts/lib/local-evidence-fixtures.mjs';

test('local evidence materialization writes deterministic files to the requested root', async () => {
  const temporary = await mkdtemp(join(tmpdir(), 'srtaller-evidence-fixtures-'));
  const root = join(temporary, 'repair-evidence');
  try {
    const materialized = await materializeLocalEvidenceFixtures(root);
    assert.deepEqual(
      materialized.map(({ id, storageKey, sizeBytes }) => ({ id, storageKey, sizeBytes })),
      LOCAL_EVIDENCE_FIXTURES.map(({ id, storageKey, sizeBytes }) => ({ id, storageKey, sizeBytes })),
    );
    for (const fixture of LOCAL_EVIDENCE_FIXTURES) {
      const path = join(root, fixture.storageKey);
      const metadata = await stat(path);
      assert.equal(metadata.isFile(), true);
      assert.equal(metadata.size, fixture.sizeBytes);
      assert.deepEqual(await readFile(path), fixture.content);
    }
  } finally {
    await rm(temporary, { recursive: true, force: true });
  }
});
