import assert from 'node:assert/strict';
import test from 'node:test';

import { fixtureCases } from './architecture-fixtures.mjs';
import {
  createFixture,
  diagnosticPathProblems,
  diagnosticsFrom,
  removeFixture,
  rulesFrom,
  runChecker,
} from './architecture-support.mjs';

for (const fixtureCase of fixtureCases) {
  test(`architecture fixture: ${fixtureCase.name}`, async () => {
    const root = await createFixture(fixtureCase);
    try {
      const first = await runChecker(root);
      const second = await runChecker(root);
      const expectedExit = fixtureCase.expectedRules.length === 0 ? 0 : 1;

      assert.equal(first.code, expectedExit);
      assert.equal(second.code, expectedExit);
      assert.equal(first.stdout, second.stdout);
      assert.equal(first.stderr, second.stderr);
      assert.deepEqual(rulesFrom(first.stderr), [...fixtureCase.expectedRules].sort());
      if (fixtureCase.expectedText) {
        assert.match(first.stderr, new RegExp(fixtureCase.expectedText, 'u'));
      }
      if (expectedExit === 1) {
        assert.equal(typeof fixtureCase.expectedPath, 'string');
        const diagnostics = diagnosticsFrom(first.stderr);
        const expectedPaths = fixtureCase.expectedPaths ?? [
          fixtureCase.expectedPath,
        ];
        assert.ok(diagnostics.length > 0);
        assert.deepEqual(diagnosticPathProblems(first.stderr, root), []);
        assert.ok(
          diagnostics.every(
            ({ path, rule }) =>
              expectedPaths.includes(path) &&
              fixtureCase.expectedRules.includes(rule),
          ),
          `expected only ${fixtureCase.expectedRules.join(', ')} at ${expectedPaths.join(', ')}`,
        );
        for (const expectedPath of expectedPaths) {
          assert.ok(
            diagnostics.some(({ path }) => path === expectedPath),
            `expected exact diagnostic path ${expectedPath}`,
          );
        }
      }
    } finally {
      await removeFixture(root);
    }
  });
}
