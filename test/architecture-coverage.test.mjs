import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import ts from 'typescript';

import { unwrapTransparentExpression } from '../scripts/lib/architecture-checker.mjs';
import { fixtureCases, validFiles } from './architecture-fixtures.mjs';
import { remediationMutations } from './architecture-remediation-mutations.mjs';
import {
  assertRequiredSemanticCoverage,
  collectSemanticCoverage,
} from './architecture-semantic-coverage.mjs';

function variableInitializer(source) {
  const sourceFile = ts.createSourceFile(
    'wrapper.ts',
    `const value = ${source};`,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS,
  );
  assert.deepEqual(sourceFile.parseDiagnostics, []);
  const statement = sourceFile.statements[0];
  assert.ok(ts.isVariableStatement(statement));
  const initializer = statement.declarationList.declarations[0]?.initializer;
  assert.ok(initializer);
  return initializer;
}

test('D5-R033 requires unique semantic execution contracts with exact policy coverage', async () => {
  const policy = JSON.parse(
    await readFile('architecture/dec-005-policy.json', 'utf8'),
  );
  const declared = collectSemanticCoverage({
    baseFiles: validFiles,
    fixtureCases,
    remediationMutations,
  });
  assertRequiredSemanticCoverage(policy, declared);
});

test('transparent AST normalizer is iterative and stops at semantic operations', () => {
  for (const source of [
    '((((identity))))',
    '((identity as unknown) as unknown)',
    '(<unknown>(<unknown>identity))',
    '((identity!)!)',
    '((identity satisfies unknown) satisfies unknown)',
  ]) {
    const normalized = unwrapTransparentExpression(variableInitializer(source));
    assert.ok(ts.isIdentifier(normalized), `${source} must unwrap to identity`);
    assert.equal(normalized.text, 'identity');
  }

  const emittedIdentity = ts.factory.createIdentifier('identity');
  const partiallyEmitted = ts.factory.createPartiallyEmittedExpression(
    ts.factory.createPartiallyEmittedExpression(emittedIdentity),
  );
  assert.equal(unwrapTransparentExpression(partiallyEmitted), emittedIdentity);

  for (const source of [
    'identity.member',
    'identity[member]',
    'identity()',
    'identity ? left : right',
  ]) {
    const expression = variableInitializer(source);
    assert.equal(
      unwrapTransparentExpression(expression),
      expression,
      `${source} must retain its semantic operation`,
    );
  }

  const commaExpression = unwrapTransparentExpression(
    variableInitializer('(identity, other)'),
  );
  assert.ok(ts.isBinaryExpression(commaExpression));
  assert.equal(commaExpression.operatorToken.kind, ts.SyntaxKind.CommaToken);
});
