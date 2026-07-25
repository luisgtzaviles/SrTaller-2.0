import assert from 'node:assert/strict';
import test from 'node:test';

import { checkArchitecture } from '../scripts/lib/architecture-checker.mjs';
import { persistenceMutations } from './architecture-persistence-mutations.mjs';
import {
  createFixture,
  removeFixture,
} from './architecture-support.mjs';

function diagnosticRules(result) {
  return [...new Set(result.diagnostics.map(({ rule }) => rule))].sort();
}

for (const mutation of persistenceMutations) {
  test(`PBI-023 controlled mutation: ${mutation.name}`, async () => {
    const allowedRoot = await createFixture({ files: mutation.allowedFiles });
    const mutatedRoot = await createFixture({ files: mutation.files });
    try {
      const allowed = await checkArchitecture({
        fixture: true,
        root: allowedRoot,
      });
      assert.deepEqual(allowed.diagnostics, []);

      const first = await checkArchitecture({
        fixture: true,
        root: mutatedRoot,
      });
      const second = await checkArchitecture({
        fixture: true,
        root: mutatedRoot,
      });
      assert.deepEqual(first, second, 'checker must be deterministic');
      assert.deepEqual(diagnosticRules(first), mutation.expectedRules);
      assert.ok(first.diagnostics.length > 0);
      assert.ok(
        first.diagnostics.every(
          ({ file, rule }) =>
            file === mutation.expectedPath &&
            mutation.expectedRules.includes(rule),
        ),
      );

      const neutralized = await checkArchitecture({
        disabledRules: [mutation.rule],
        fixture: true,
        root: mutatedRoot,
      });
      assert.deepEqual(
        neutralized.diagnostics,
        [],
        `${mutation.rule} mutation must become invisible only when its rule is neutralized`,
      );

      const restored = await checkArchitecture({
        fixture: true,
        root: allowedRoot,
      });
      assert.deepEqual(restored.diagnostics, []);
    } finally {
      await Promise.all([
        removeFixture(allowedRoot),
        removeFixture(mutatedRoot),
      ]);
    }
  });
}

test('PBI-023 production-mode rule neutralization is forbidden', async () => {
  await assert.rejects(
    checkArchitecture({
      disabledRules: ['D5-R037'],
      fixture: false,
      root: process.cwd(),
    }),
    /only in isolated fixtures/u,
  );
});
