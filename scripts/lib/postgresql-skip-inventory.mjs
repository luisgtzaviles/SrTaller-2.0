import { readFile, readdir } from 'node:fs/promises';
import { resolve } from 'node:path';

export const expectedPostgresqlSkipInventory = Object.freeze([
  Object.freeze({ file: 'test/database-connection-postgresql.test.mjs', tests: 6, materialStage: 'postgresql-composite' }),
  Object.freeze({ file: 'test/database-transaction-postgresql.test.mjs', tests: 1, materialStage: 'postgresql-composite' }),
  Object.freeze({ file: 'test/database-migration-postgresql.test.mjs', tests: 1, materialStage: 'postgresql-composite' }),
  Object.freeze({ file: 'test/database-schema-postgresql.test.mjs', tests: 1, materialStage: 'postgresql-composite' }),
  Object.freeze({ file: 'test/owner-scoped-persistence-postgresql.test.mjs', tests: 1, materialStage: 'postgresql-composite' }),
  Object.freeze({ file: 'test/repair-persistence-postgresql.test.mjs', tests: 1, materialStage: 'postgresql-composite' }),
  Object.freeze({ file: 'test/trusted-station-context-postgresql.test.mjs', tests: 1, materialStage: 'postgresql-composite' }),
  Object.freeze({ file: 'test/user-directory-postgresql.test.mjs', tests: 1, materialStage: 'postgresql-composite' }),
  Object.freeze({ file: 'test/access-role-postgresql.test.mjs', tests: 1, materialStage: 'postgresql-composite' }),
  Object.freeze({ file: 'test/access-pin-postgresql.test.mjs', tests: 1, materialStage: 'postgresql-composite' }),
  Object.freeze({ file: 'test/access-session-postgresql.test.mjs', tests: 1, materialStage: 'postgresql-composite' }),
  Object.freeze({ file: 'test/contextual-authorization-postgresql.test.mjs', tests: 1, materialStage: 'postgresql-composite' }),
  Object.freeze({ file: 'test/catalog-postgresql.test.mjs', tests: 1, materialStage: 'pbi040-postgresql' }),
  Object.freeze({ file: 'test/bulk-catalog-postgresql.test.mjs', tests: 1, materialStage: 'pbi041-postgresql' }),
  Object.freeze({ file: 'test/customer-phone-postgresql.test.mjs', tests: 1, materialStage: 'pbi039-postgresql' }),
  Object.freeze({ file: 'test/user-preferences-postgresql.test.mjs', tests: 1, materialStage: 'pbi039-postgresql' }),
]);

export async function inspectPostgresqlSkipInventory(root = process.cwd()) {
  const testRoot = resolve(root, 'test');
  const files = (await readdir(testRoot))
    .filter((file) => file.endsWith('.test.mjs'))
    .sort();
  const actual = [];
  for (const file of files) {
    const source = await readFile(resolve(testRoot, file), 'utf8');
    const matches = source.match(/\bskip\s*:\s*!enabled\b/gu) ?? [];
    if (matches.length > 0) {
      actual.push(Object.freeze({ file: `test/${file}`, tests: matches.length }));
    }
  }
  const expected = expectedPostgresqlSkipInventory
    .map(({ file, tests }) => ({ file, tests }))
    .sort((left, right) => left.file.localeCompare(right.file, 'en'));
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(
      `PostgreSQL skip inventory changed: expected ${JSON.stringify(expected)}, received ${JSON.stringify(actual)}`,
    );
  }
  return Object.freeze({
    files: Object.freeze(actual),
    total: actual.reduce((total, item) => total + item.tests, 0),
    material: Object.freeze({
      postgresqlComposite: expectedPostgresqlSkipInventory
        .filter(({ materialStage }) => materialStage === 'postgresql-composite')
        .reduce((total, item) => total + item.tests, 0),
      pbi039Postgresql: expectedPostgresqlSkipInventory
        .filter(({ materialStage }) => materialStage === 'pbi039-postgresql')
        .reduce((total, item) => total + item.tests, 0),
      pbi040Postgresql: expectedPostgresqlSkipInventory
        .filter(({ materialStage }) => materialStage === 'pbi040-postgresql')
        .reduce((total, item) => total + item.tests, 0),
      pbi041Postgresql: expectedPostgresqlSkipInventory
        .filter(({ materialStage }) => materialStage === 'pbi041-postgresql')
        .reduce((total, item) => total + item.tests, 0),
    }),
  });
}

export function assertBaseSkipSummary(output, inventory) {
  const matches = [...output.matchAll(/^ℹ skipped\s+(\d+)\s*$/gmu)];
  if (matches.length !== 1) {
    throw new Error('Base verify output did not contain one authoritative skipped-test summary');
  }
  const skipped = Number.parseInt(matches[0][1], 10);
  if (skipped !== inventory.total) {
    throw new Error(
      `Base verify skipped ${skipped} tests; expected ${inventory.total} mapped PostgreSQL tests`,
    );
  }
  return Object.freeze({ skipped, inventory: inventory.files });
}
