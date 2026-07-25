import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { posix } from 'node:path';

import ts from 'typescript';

const descriptiveKeys = new Set(['coverage', 'description', 'name']);

const fixtureKnownKeys = new Set([
  ...descriptiveKeys,
  'deleteDirectories',
  'deleteFiles',
  'emptyDirectories',
  'expectedPath',
  'expectedPaths',
  'expectedRules',
  'expectedText',
  'files',
]);

const mutationKnownKeys = new Set([
  ...descriptiveKeys,
  'allowedFiles',
  'cleanupDirectory',
  'content',
  'directory',
  'expectedPath',
  'expectedPaths',
  'expectedRules',
  'expectedText',
  'files',
  'path',
  'rule',
  'support',
]);

const triviaKinds = new Set([
  ts.SyntaxKind.MultiLineCommentTrivia,
  ts.SyntaxKind.NewLineTrivia,
  ts.SyntaxKind.SingleLineCommentTrivia,
  ts.SyntaxKind.WhitespaceTrivia,
]);

function sha256(value) {
  return createHash('sha256').update(value).digest('hex');
}

function own(object, key) {
  return Object.prototype.hasOwnProperty.call(object, key);
}

export function stableSerialize(value) {
  const seen = new Set();

  function serialize(current) {
    if (current === null) {
      return 'null';
    }
    switch (typeof current) {
      case 'undefined':
        return 'undefined';
      case 'boolean':
        return `boolean:${current}`;
      case 'string':
        return `string:${JSON.stringify(current)}`;
      case 'number':
        if (Number.isNaN(current)) {
          return 'number:NaN';
        }
        if (Object.is(current, -0)) {
          return 'number:-0';
        }
        if (current === Infinity) {
          return 'number:+Infinity';
        }
        if (current === -Infinity) {
          return 'number:-Infinity';
        }
        return `number:${current}`;
      case 'bigint':
        return `bigint:${current}`;
      case 'symbol':
        return `symbol:${JSON.stringify(current.description)}`;
      case 'function':
        throw new TypeError('functions are not valid semantic coverage data');
      case 'object':
        break;
      default:
        throw new TypeError(`unsupported semantic coverage type ${typeof current}`);
    }

    if (seen.has(current)) {
      throw new TypeError('cyclic semantic coverage data is not supported');
    }
    seen.add(current);
    try {
      if (Array.isArray(current)) {
        return `array:[${current.map(serialize).join(',')}]`;
      }
      const prototype = Object.getPrototypeOf(current);
      if (prototype !== Object.prototype && prototype !== null) {
        throw new TypeError('only plain objects are valid semantic coverage data');
      }
      const properties = Object.keys(current)
        .sort()
        .map(
          (key) =>
            `${JSON.stringify(key)}=${serialize(current[key])}`,
        );
      return `object:{${properties.join(',')}}`;
    } finally {
      seen.delete(current);
    }
  }

  return serialize(value);
}

export function normalizeCoveragePath(path) {
  assert.equal(typeof path, 'string', 'coverage paths must be strings');
  const portable = path.replaceAll('\\', '/');
  const normalized = posix.normalize(portable);
  return normalized === '.' ? '' : normalized.replace(/^\.\/+/u, '');
}

export function canonicalSourceTokens(source) {
  assert.equal(typeof source, 'string', 'coverage source must be a string');
  const scanner = ts.createScanner(
    ts.ScriptTarget.Latest,
    false,
    ts.LanguageVariant.Standard,
    source,
  );
  const tokens = [];
  for (
    let kind = scanner.scan();
    kind !== ts.SyntaxKind.EndOfFileToken;
    kind = scanner.scan()
  ) {
    if (triviaKinds.has(kind)) {
      continue;
    }
    tokens.push({
      kind: ts.SyntaxKind[kind],
      value: scanner.getTokenValue(),
    });
  }
  return tokens;
}

function canonicalSourceValue(value) {
  if (typeof value === 'string') {
    return {
      sourceType: 'string',
      tokens: canonicalSourceTokens(value),
    };
  }
  return {
    sourceType: typeof value,
    value,
  };
}

function normalizedUniquePaths(paths) {
  return [...new Set(paths.map(normalizeCoveragePath))].sort();
}

function pathIsWithin(path, directory) {
  return path === directory || path.startsWith(`${directory}/`);
}

function effectiveFixtureExecution(testCase, baseFiles) {
  const files = new Map();
  for (const [path, source] of Object.entries({
    ...baseFiles,
    ...(testCase.files ?? {}),
  })) {
    files.set(normalizeCoveragePath(path), source);
  }

  for (const path of testCase.deleteFiles ?? []) {
    files.delete(normalizeCoveragePath(path));
  }

  const deletedDirectories = normalizedUniquePaths(
    testCase.deleteDirectories ?? [],
  );
  for (const path of [...files.keys()]) {
    if (deletedDirectories.some((directory) => pathIsWithin(path, directory))) {
      files.delete(path);
    }
  }

  const directoryCandidates = new Set();
  for (const configuredDirectory of testCase.emptyDirectories ?? []) {
    let directory = normalizeCoveragePath(configuredDirectory);
    while (directory && directory !== '.') {
      directoryCandidates.add(directory);
      const parent = posix.dirname(directory);
      if (parent === directory) {
        break;
      }
      directory = parent;
    }
  }

  const emptyDirectories = [...directoryCandidates]
    .filter(
      (directory) =>
        !deletedDirectories.some((deleted) =>
          pathIsWithin(directory, deleted),
        ) &&
        ![...files.keys()].some((path) => pathIsWithin(path, directory)),
    )
    .sort();

  return {
    emptyDirectories,
    files: [...files.entries()]
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([path, source]) => ({
        path,
        source: canonicalSourceValue(source),
      })),
  };
}

function canonicalMutationExecution(testCase) {
  const execution = {};
  if (own(testCase, 'path')) {
    execution.path = normalizeCoveragePath(testCase.path);
  }
  if (own(testCase, 'content')) {
    execution.content = canonicalSourceValue(testCase.content);
  }
  if (own(testCase, 'directory')) {
    execution.directory = normalizeCoveragePath(testCase.directory);
  }
  if (own(testCase, 'support')) {
    execution.support =
      testCase.support === null
        ? null
        : {
            content: canonicalSourceValue(testCase.support.content),
            path: normalizeCoveragePath(testCase.support.path),
          };
  }
  if (own(testCase, 'cleanupDirectory')) {
    execution.cleanupDirectory = normalizeCoveragePath(
      testCase.cleanupDirectory,
    );
  }
  for (const property of ['allowedFiles', 'files']) {
    if (own(testCase, property)) {
      execution[property] = Object.entries(testCase[property])
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([path, source]) => ({
          path: normalizeCoveragePath(path),
          source: canonicalSourceValue(source),
        }));
    }
  }
  return execution;
}

function extraMaterialConfiguration(testCase, knownKeys) {
  return Object.fromEntries(
    Object.keys(testCase)
      .filter((key) => !knownKeys.has(key))
      .sort()
      .map((key) => [key, testCase[key]]),
  );
}

function expectedRulesFrom(testCase) {
  const rules =
    testCase.expectedRules ??
    (own(testCase, 'rule') ? [testCase.rule] : []);
  return [...new Set(rules)].sort();
}

function expectedPathsFrom(testCase) {
  if (own(testCase, 'expectedPaths') && testCase.expectedPaths !== undefined) {
    return normalizedUniquePaths(testCase.expectedPaths);
  }
  if (own(testCase, 'expectedPath') && testCase.expectedPath !== undefined) {
    return [normalizeCoveragePath(testCase.expectedPath)];
  }
  return [];
}

function semanticContract(caseType, testCase, baseFiles) {
  const rules = expectedRulesFrom(testCase);
  const diagnostic = {
    paths: expectedPathsFrom(testCase),
    polarity: rules.length === 0 ? 'positive' : 'negative',
    rules,
  };
  if (own(testCase, 'expectedText')) {
    diagnostic.expectedText = testCase.expectedText;
  }

  const contract = {
    caseType,
    diagnostic,
    execution:
      caseType === 'fixture'
        ? effectiveFixtureExecution(testCase, baseFiles)
        : canonicalMutationExecution(testCase),
  };
  const extras = extraMaterialConfiguration(
    testCase,
    caseType === 'fixture' ? fixtureKnownKeys : mutationKnownKeys,
  );
  if (Object.keys(extras).length > 0) {
    contract.materialConfiguration = extras;
  }
  return contract;
}

function sourceEvidenceFor(caseType, testCase) {
  return caseType === 'fixture'
    ? Object.values(testCase.files ?? {}).join('\n')
    : testCase.content ?? Object.values(testCase.files ?? {}).join('\n');
}

export function createSemanticCoverageEntry({
  baseFiles = {},
  caseType,
  id,
  testCase,
}) {
  assert.ok(
    caseType === 'fixture' || caseType === 'mutation',
    `unsupported semantic coverage case type ${caseType}`,
  );
  const contract = semanticContract(caseType, testCase, baseFiles);
  const key = stableSerialize(contract);
  return {
    caseType,
    contract,
    evidence: testCase.coverage?.evidence,
    id,
    identity: {
      digest: sha256(key),
      key,
    },
    name: testCase.name,
    sourceEvidence: sourceEvidenceFor(caseType, testCase),
  };
}

export function collectSemanticCoverage({
  baseFiles,
  fixtureCases,
  persistenceMutations = [],
  remediationMutations,
}) {
  const declared = [];
  for (const [caseType, cases] of [
    ['fixture', fixtureCases],
    ['mutation', [...remediationMutations, ...persistenceMutations]],
  ]) {
    for (const testCase of cases) {
      for (const id of testCase.coverage?.ids ?? []) {
        declared.push(
          createSemanticCoverageEntry({
            baseFiles,
            caseType,
            id,
            testCase,
          }),
        );
      }
    }
  }
  return declared;
}

function duplicateDiagnostic(first, second) {
  const { diagnostic } = first.contract;
  const ruleLabel =
    diagnostic.rules.length > 0
      ? diagnostic.rules.join(',')
      : 'none (positive control)';
  const pathLabel =
    diagnostic.paths.length > 0 ? diagnostic.paths.join(',') : 'none';
  return [
    'D5-R033 semantic duplicate coverage contracts',
    `ids=${first.id},${second.id}`,
    `rules=${ruleLabel}`,
    `polarity=${diagnostic.polarity}`,
    `paths=${pathLabel}`,
    `source/execution=sha256:${first.identity.digest}`,
    'reason=same effective execution and diagnostic contract; IDs and descriptive metadata do not provide independent coverage',
  ].join('; ');
}

export function assertUniqueSemanticCoverage(entries) {
  const byIdentity = new Map();
  for (const entry of entries) {
    const previous = byIdentity.get(entry.identity.key);
    if (previous) {
      throw new Error(duplicateDiagnostic(previous, entry));
    }
    byIdentity.set(entry.identity.key, entry);
  }
}

export function assertRequiredSemanticCoverage(policy, declared) {
  const required = [...policy.requiredSemanticCoverage].sort();
  const actual = declared.map(({ id }) => id).sort();

  assert.equal(new Set(required).size, required.length);
  assert.equal(new Set(actual).size, actual.length);
  assert.deepEqual(actual, required);

  for (const entry of declared) {
    assert.ok(
      entry.id.startsWith(`${entry.caseType}:`),
      `${entry.id} must identify its case type`,
    );
    assert.ok(
      Array.isArray(entry.evidence) && entry.evidence.length > 0,
      `${entry.id} must declare source evidence`,
    );
    for (const fragment of entry.evidence) {
      assert.equal(
        typeof fragment,
        'string',
        `${entry.id} source evidence must be textual`,
      );
      assert.ok(
        entry.sourceEvidence.includes(fragment),
        `${entry.id} lost source evidence ${fragment}`,
      );
    }

    const rule = entry.id.match(/:(D5-R\d{3}):/u)?.[1];
    const { paths, polarity, rules } = entry.contract.diagnostic;
    assert.ok(
      polarity === 'positive' || polarity === 'negative',
      `${entry.id} must retain a valid polarity`,
    );
    assert.equal(
      polarity,
      rules.length === 0 ? 'positive' : 'negative',
      `${entry.id} polarity must match its expected rules`,
    );
    for (const expectedRule of rules) {
      assert.ok(
        policy.checkerRules.includes(expectedRule),
        `${entry.id} references unknown rule ${expectedRule}`,
      );
    }
    for (const path of paths) {
      assert.ok(path.length > 0, `${entry.id} has an empty expected path`);
      assert.equal(
        normalizeCoveragePath(path),
        path,
        `${entry.id} expected path must be normalized`,
      );
    }
    assert.equal(typeof entry.sourceEvidence, 'string');
    assert.ok(
      entry.sourceEvidence.length > 0,
      `${entry.id} must retain executable source`,
    );
    assert.ok(entry.identity.key.length > 0, `${entry.id} lost execution data`);
    assert.match(entry.identity.digest, /^[a-f0-9]{64}$/u);
    if (rule && entry.id.endsWith(':positive')) {
      assert.ok(
        !rules.includes(rule),
        `${entry.id} must remain a positive control`,
      );
    } else if (rule) {
      assert.ok(
        policy.checkerRules.includes(rule),
        `${entry.id} identifies unknown rule ${rule}`,
      );
      assert.ok(rules.includes(rule), `${entry.id} must reject with ${rule}`);
      assert.equal(
        paths.length > 0,
        true,
        `${entry.id} must retain its exact path contract`,
      );
    }
  }

  assertUniqueSemanticCoverage(declared);
}
