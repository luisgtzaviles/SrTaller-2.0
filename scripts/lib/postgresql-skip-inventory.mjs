import { readFile, readdir } from 'node:fs/promises';
import { resolve } from 'node:path';

import ts from 'typescript';

function materialTest(file, title, materialStage, guard = 'enabled') {
  return Object.freeze({ file, title, materialStage, guard });
}

export const expectedPostgresqlSkipInventory = Object.freeze([
  materialTest('test/access-pin-postgresql.test.mjs', 'PostgreSQL 18.4 enforces tenant-scoped PIN protection, lockout, and Station rate limits', 'postgresql-composite'),
  materialTest('test/access-role-postgresql.test.mjs', 'PostgreSQL 18.4 enforces tenant-scoped roles, capabilities, assignments, and read models', 'postgresql-composite'),
  materialTest('test/access-session-postgresql.test.mjs', 'PostgreSQL 18.4 enforces concurrent Operational Sessions, exact lifecycle, isolation, and rollback safety', 'postgresql-composite'),
  materialTest('test/contextual-authorization-postgresql.test.mjs', 'PostgreSQL 18.4 materially enforces contextual authorization and scoped Repair effects', 'postgresql-composite'),
  materialTest('test/database-connection-postgresql.test.mjs', 'PostgreSQL 18.4 connection facility verifies, releases and closes', 'postgresql-composite'),
  materialTest('test/database-connection-postgresql.test.mjs', 'PostgreSQL rejects invalid credentials with a sanitized stable error', 'postgresql-composite'),
  materialTest('test/database-connection-postgresql.test.mjs', 'PostgreSQL rejects a nonexistent database with a stable error', 'postgresql-composite'),
  materialTest('test/database-connection-postgresql.test.mjs', 'PostgreSQL without TLS rejects verify-full with a stable SSL error', 'postgresql-composite'),
  materialTest('test/database-connection-postgresql.test.mjs', 'paused PostgreSQL produces a finite connection timeout and recovers for cleanup', 'postgresql-composite'),
  materialTest('test/database-connection-postgresql.test.mjs', 'verify-close race remains deterministic against PostgreSQL', 'postgresql-composite'),
  materialTest('test/database-migration-postgresql.test.mjs', 'PostgreSQL 18.4 governed migration runner is deterministic and leak-free', 'postgresql-composite'),
  materialTest('test/database-schema-postgresql.test.mjs', 'PostgreSQL 18.4 materializes the exact tenant schema and isolation contract', 'postgresql-composite'),
  materialTest('test/database-transaction-postgresql.test.mjs', 'PostgreSQL 18.4 transaction runner contract is deterministic and leak-free', 'postgresql-composite'),
  materialTest('test/owner-scoped-persistence-postgresql.test.mjs', 'PostgreSQL 18.4 verifies owner-scoped adapters and negative tenant isolation', 'postgresql-composite'),
  materialTest('test/repair-persistence-postgresql.test.mjs', 'PostgreSQL 18.4 materially verifies repairs migrations, scope, projections, filters, and idempotency', 'postgresql-composite'),
  materialTest('test/trusted-station-context-postgresql.test.mjs', 'PostgreSQL 18.4 resolves only an active, tenant-bound trusted station context', 'postgresql-composite'),
  materialTest('test/user-directory-postgresql.test.mjs', 'PostgreSQL 18.4 enforces the tenant-scoped user bootstrap and lifecycle contract', 'postgresql-composite'),
  materialTest('test/customer-phone-postgresql.test.mjs', 'Customer phone search hydrates matched Customer-owned phones and stays isolated across Tenant and Branch', 'pbi039-postgresql'),
  materialTest('test/user-preferences-postgresql.test.mjs', 'PostgreSQL persists personal mode by Tenant and User with restrictive lifecycle and last-write-wins', 'pbi039-postgresql'),
  materialTest('test/catalog-postgresql.test.mjs', 'PostgreSQL enforces PBI-040 tenant identity, branch pricing, history and fast lookup', 'pbi040-postgresql', 'pbi040Enabled'),
  materialTest('test/bulk-catalog-postgresql.test.mjs', 'PBI-041 persists immutable supplier versions and publishes one tenant-wide atomic batch', 'pbi041-postgresql'),
  materialTest('test/bulk-catalog-postgresql.test.mjs', 'UX-005.1 keeps safely capturable new references out of manual reconciliation until Apply', 'pbi041-postgresql'),
  materialTest('test/bulk-catalog-postgresql.test.mjs', 'PBI-041 material handoff preserves the publisher as the Apply audit actor', 'pbi041-postgresql'),
  materialTest('test/bulk-catalog-postgresql.test.mjs', 'PBI-041 rejects a stale authorized Apply snapshot after a concurrent decision escalates the effect', 'pbi041-postgresql'),
  materialTest('test/bulk-catalog-postgresql.test.mjs', 'UX-005.3 correction drafts preserve an analyzed source snapshot and reject stale predecessor Apply', 'pbi041-postgresql'),
  materialTest('test/bulk-catalog-postgresql.test.mjs', 'UX-003.1 persists tenant-isolated catalog field policies with append-only versions', 'pbi041-postgresql'),
  materialTest('test/bulk-catalog-postgresql.test.mjs', 'UX-003.4 enforces required values from the resulting Catalog state and rechecks policy at Apply', 'pbi041-postgresql'),
  materialTest('test/bulk-catalog-postgresql.test.mjs', 'UX-005.6 rejects zero effective base prices at Analyze and independently at Apply', 'pbi041-postgresql'),
  materialTest('test/catalog-authorization-postgresql.test.mjs', 'granular catalog capability migration preserves compatibility and materializes the role matrix', 'pbi041-postgresql'),
  materialTest('test/catalog-postgresql.test.mjs', 'UX-005.6 promotes one exact pending Brand group atomically without fuzzy matching or duplicate canonicals', 'pbi041-postgresql', 'pbi041Enabled'),
  materialTest('test/tl02-admin-auth-postgresql.test.mjs', 'TL-02 persistence enforces tenant identity, secret shape and append-only audit', 'tl02-postgresql'),
  materialTest('test/tl02-admin-auth-postgresql.test.mjs', 'TL-02 PostgreSQL executes concurrent sessions, rate limit, reauth, revocation and recovery without Operational Session crossover', 'tl02-postgresql'),
  materialTest('test/tl03-bootstrap-postgresql.test.mjs', 'TL-03 permits duplicate workshop names, isolates tenants, logs no secrets and supports TL-02 login', 'tl03-postgresql'),
  materialTest('test/tl03-bootstrap-postgresql.test.mjs', 'TL-03 rolls back every material failure stage without partial authority', 'tl03-postgresql'),
  materialTest('test/tl03-bootstrap-postgresql.test.mjs', 'TL-03 serializes duplicate calls, replays ambiguous success and rejects conflicting reuse', 'tl03-postgresql'),
  materialTest('test/tl04-registration-postgresql.test.mjs', 'TL-04 PostgreSQL executes registration, challenge concurrency, TL-03 bootstrap and TL-02 login end to end', 'tl04-postgresql'),
  materialTest('test/tl04-registration-postgresql.test.mjs', 'TL-04 PostgreSQL purges retained attempt material while preserving independent legal evidence', 'tl04-postgresql'),
  materialTest('test/tl04-registration-postgresql.test.mjs', 'TL-04 PostgreSQL rejects malformed durable lifecycle and preserves append-only legal/audit evidence', 'tl04-postgresql'),
]);

function inspectGuardedTests(source, file) {
  const sourceFile = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.JS);
  const tests = [];
  function visit(node) {
    if (
      ts.isCallExpression(node) &&
      ts.isIdentifier(node.expression) &&
      node.expression.text === 'test' &&
      node.arguments.length >= 2 &&
      ts.isStringLiteralLike(node.arguments[0]) &&
      ts.isObjectLiteralExpression(node.arguments[1])
    ) {
      const skip = node.arguments[1].properties.find((property) =>
        ts.isPropertyAssignment(property) &&
        ((ts.isIdentifier(property.name) && property.name.text === 'skip') ||
          (ts.isStringLiteralLike(property.name) && property.name.text === 'skip')),
      );
      if (
        skip &&
        ts.isPropertyAssignment(skip) &&
        ts.isPrefixUnaryExpression(skip.initializer) &&
        skip.initializer.operator === ts.SyntaxKind.ExclamationToken &&
        ts.isIdentifier(skip.initializer.operand)
      ) {
        tests.push(Object.freeze({ file, title: node.arguments[0].text, guard: skip.initializer.operand.text }));
      }
    }
    ts.forEachChild(node, visit);
  }
  visit(sourceFile);
  return tests;
}

function compareIdentity(left, right) {
  return left.file.localeCompare(right.file, 'en') || left.title.localeCompare(right.title, 'en');
}

export function assertPostgresqlSkipInventory(actualEntries, expectedEntries = expectedPostgresqlSkipInventory) {
  const actual = actualEntries.map(({ file, title, guard }) => ({ file, title, guard })).sort(compareIdentity);
  const expected = expectedEntries.map(({ file, title, guard }) => ({ file, title, guard })).sort(compareIdentity);
  const keys = expected.map(({ file, title }) => `${file}\u0000${title}`);
  if (new Set(keys).size !== keys.length) {
    throw new Error('PostgreSQL skip inventory contains a duplicate governed test identity');
  }
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(
      `PostgreSQL skip inventory changed: expected ${JSON.stringify(expected)}, received ${JSON.stringify(actual)}`,
    );
  }
  return Object.freeze(actual);
}

export async function inspectPostgresqlSkipInventory(root = process.cwd()) {
  const testRoot = resolve(root, 'test');
  const files = (await readdir(testRoot)).filter((file) => file.endsWith('.test.mjs')).sort();
  const actual = [];
  for (const file of files) {
    const relativeFile = `test/${file}`;
    const source = await readFile(resolve(testRoot, file), 'utf8');
    actual.push(...inspectGuardedTests(source, relativeFile));
  }
  const governed = assertPostgresqlSkipInventory(actual);
  const materialCount = (stage) => expectedPostgresqlSkipInventory.filter(({ materialStage }) => materialStage === stage).length;
  return Object.freeze({
    files: governed,
    total: governed.length,
    material: Object.freeze({
      postgresqlComposite: materialCount('postgresql-composite'),
      pbi039Postgresql: materialCount('pbi039-postgresql'),
      pbi040Postgresql: materialCount('pbi040-postgresql'),
      pbi041Postgresql: materialCount('pbi041-postgresql'),
      tl02Postgresql: materialCount('tl02-postgresql'),
      tl03Postgresql: materialCount('tl03-postgresql'),
      tl04Postgresql: materialCount('tl04-postgresql'),
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
