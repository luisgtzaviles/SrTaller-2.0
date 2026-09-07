import assert from 'node:assert/strict';
import { rm, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import test from 'node:test';

import { toRepositoryRelativePath } from '../scripts/lib/architecture-checker.mjs';
import { fixtureCases } from './architecture-fixtures.mjs';
import {
  createFixture,
  createProductFixture,
  diagnosticPathProblems,
  diagnosticsFrom,
  removeFixture,
  runChecker,
} from './architecture-support.mjs';

async function assertEquivalentFailure({
  create,
  expectedPath,
  expectedRule,
  fixture = true,
  mutate,
}) {
  const roots = [];
  try {
    roots.push(await create());
    roots.push(await create());
    assert.notEqual(roots[0], roots[1]);
    if (mutate) {
      await Promise.all(roots.map((root) => mutate(root)));
    }

    const results = await Promise.all(
      roots.map((root) => runChecker(root, { fixture })),
    );
    for (let index = 0; index < results.length; index += 1) {
      const result = results[index];
      assert.equal(result.code, 1);
      assert.deepEqual(diagnosticPathProblems(result.stderr, roots[index]), []);
      assert.ok(
        diagnosticsFrom(result.stderr).some(
          ({ path, rule }) => path === expectedPath && rule === expectedRule,
        ),
        `expected ${expectedRule} at ${expectedPath}`,
      );
    }
    assert.equal(results[0].stdout, results[1].stdout);
    assert.equal(results[0].stderr, results[1].stderr);
  } finally {
    await Promise.all(roots.map((root) => removeFixture(root)));
  }
}

test('path contract normalizes once and rejects repository escapes', () => {
  const root = resolve('/tmp', 'srtaller-path-contract-root');
  assert.equal(
    toRepositoryRelativePath(root, resolve(root, 'src/modules/access/index.ts')),
    'src/modules/access/index.ts',
  );
  assert.equal(
    toRepositoryRelativePath(root, './src\\modules/./access/../access/index.ts'),
    'src/modules/access/index.ts',
  );
  assert.throws(
    () => toRepositoryRelativePath(root, resolve(root, '..', 'outside.ts')),
    /must remain inside the repository root/u,
  );
  assert.throws(
    () => toRepositoryRelativePath(root, '../outside.ts'),
    /must remain inside the repository root/u,
  );
  assert.throws(
    () => toRepositoryRelativePath(root, 'C:\\external\\source.ts'),
    /must not use an external absolute form/u,
  );
  assert.throws(
    () => toRepositoryRelativePath(root, 'file:///external/source.ts'),
    /must not use an external absolute form/u,
  );
});

test('path regression: required module missing is checkout-independent', async () => {
  await assertEquivalentFailure({
    create: () => createFixture({}),
    expectedPath: 'src/modules/access',
    expectedRule: 'D5-R003',
    mutate: (root) =>
      rm(resolve(root, 'src/modules/access'), { force: true, recursive: true }),
  });
});

test('path regression: dependency cycle is checkout-independent', async () => {
  await assertEquivalentFailure({
    create: () =>
      createFixture({
        files: {
          'src/modules/tenancy/index.ts': [
            "import type { StationsModuleContract } from '../stations/index.js';",
            'export interface TenancyModuleContract {',
            '  readonly stations: StationsModuleContract;',
            '}',
            '',
          ].join('\n'),
        },
      }),
    expectedPath: 'src/modules/stations/index.ts',
    expectedRule: 'D5-R007',
  });
});

test('path regression: observed graph mismatch is checkout-independent', async () => {
  await assertEquivalentFailure({
    create: createProductFixture,
    expectedPath: 'src/modules',
    expectedRule: 'D5-R006',
    fixture: false,
    mutate: (root) =>
      writeFile(
        resolve(root, 'src/modules/access/index.ts'),
        [
          "import type { StationsModuleContract } from '../stations/index.js';",
          "import type { RepairsModuleContract } from '../repairs/index.js';",
          "import type { TenancyModuleContract } from '../tenancy/index.js';",
          "import type { UsersModuleContract } from '../users/index.js';",
          'export interface AccessModuleContract {',
          "  readonly module: 'access';",
          '  readonly stations: StationsModuleContract;',
          '  readonly repairs: RepairsModuleContract;',
          '  readonly tenancy: TenancyModuleContract;',
          '  readonly users: UsersModuleContract;',
          '}',
          '',
        ].join('\n'),
      ),
  });
});

test('path regression: required evidence missing is checkout-independent', async () => {
  const evidencePath =
    'docs/architecture-readiness/dec-005-materialization/EVIDENCE.md';
  await assertEquivalentFailure({
    create: createProductFixture,
    expectedPath: evidencePath,
    expectedRule: 'DEC005-C03',
    fixture: false,
    mutate: (root) => rm(resolve(root, evidencePath)),
  });
});

test('every negative fixture declares an exact expected path', () => {
  const negativeFixtures = fixtureCases.filter(
    ({ expectedRules }) => expectedRules.length > 0,
  );
  assert.ok(negativeFixtures.length > 0);
  assert.equal(
    negativeFixtures.filter(({ expectedPath }) => typeof expectedPath === 'string')
      .length,
    negativeFixtures.length,
  );
});
