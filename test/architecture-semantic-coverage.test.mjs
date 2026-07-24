import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import test from 'node:test';

import {
  assertUniqueSemanticCoverage,
  createSemanticCoverageEntry,
  stableSerialize,
} from './architecture-semantic-coverage.mjs';

const baseSource = [
  "import { forwardRef } from '@nestjs/common';",
  'forwardRef(() => 1);',
  '',
].join('\n');

const baseCase = {
  name: 'direct forwardRef coverage',
  description: 'descriptive metadata',
  expectedPath: 'src/modules/access/access.module.ts',
  expectedRules: ['D5-R025'],
  expectedText: 'forwardRef is forbidden',
  files: {
    'src/modules/access/access.module.ts': baseSource,
  },
  coverage: {
    evidence: ['forwardRef'],
    ids: ['fixture:D5-R025:semantic-base'],
  },
};

function clone(value) {
  return structuredClone(value);
}

function hash(value) {
  return createHash('sha256').update(stableSerialize(value)).digest('hex');
}

function entry({ id, testCase, caseType = 'fixture' }) {
  return createSemanticCoverageEntry({
    caseType,
    id,
    testCase,
  });
}

function entriesFrom(records) {
  return records.map(entry);
}

function expectDuplicate(records, expectedIds) {
  assert.throws(
    () => assertUniqueSemanticCoverage(entriesFrom(records)),
    (error) => {
      assert.match(error.message, /D5-R033 semantic duplicate/u);
      for (const id of expectedIds) {
        assert.ok(error.message.includes(id), `diagnostic must include ${id}`);
      }
      assert.match(error.message, /rules=D5-R025/u);
      assert.match(error.message, /polarity=negative/u);
      assert.match(
        error.message,
        /paths=src\/modules\/access\/access\.module\.ts/u,
      );
      assert.match(error.message, /source\/execution=sha256:/u);
      assert.match(error.message, /reason=same effective execution/u);
      return true;
    },
  );
}

const mutationGuards = [
  {
    name: 'duplicate contract changing only coverage ID',
    apply(records) {
      records.push({
        id: 'fixture:D5-R025:semantic-duplicate-id',
        testCase: clone(records[0].testCase),
      });
      return () => records.pop();
    },
  },
  {
    name: 'duplicate contract changing ID and description',
    apply(records) {
      const duplicate = clone(records[0].testCase);
      duplicate.description = 'different descriptive text';
      records.push({
        id: 'fixture:D5-R025:semantic-duplicate-description',
        testCase: duplicate,
      });
      return () => records.pop();
    },
  },
  {
    name: 'remove useful case and compensate count with a duplicate',
    seed() {
      const distinct = clone(baseCase);
      distinct.files = {
        'src/modules/access/access.module.ts': [
          "import { forwardRef as nestForwardRef } from '@nestjs/common';",
          'nestForwardRef(() => 1);',
          '',
        ].join('\n'),
      };
      return [
        {
          id: 'fixture:D5-R025:semantic-base',
          testCase: clone(baseCase),
        },
        {
          id: 'fixture:D5-R025:useful-alias',
          testCase: distinct,
        },
      ];
    },
    apply(records) {
      const removed = records.pop();
      records.push({
        id: 'fixture:D5-R025:count-compensation',
        testCase: clone(records[0].testCase),
      });
      return () => {
        records.pop();
        records.push(removed);
      };
    },
  },
  {
    name: 'duplicate contract with reordered object properties',
    apply(records) {
      const duplicate = Object.fromEntries(
        Object.entries(clone(records[0].testCase)).reverse(),
      );
      duplicate.files = Object.fromEntries(
        Object.entries(duplicate.files).reverse(),
      );
      records.push({
        id: 'fixture:D5-R025:semantic-reordered',
        testCase: duplicate,
      });
      return () => records.pop();
    },
  },
  {
    name: 'neutralize descriptive evidence while retaining duplicate execution',
    apply(records) {
      const duplicate = clone(records[0].testCase);
      duplicate.coverage = {
        evidence: ['different descriptive evidence'],
        ids: ['fixture:D5-R025:semantic-neutralized'],
      };
      records.push({
        id: 'fixture:D5-R025:semantic-neutralized',
        testCase: duplicate,
      });
      return () => records.pop();
    },
  },
  {
    name: 'remove the only material diagnostic field and expose collision',
    seed() {
      const distinct = clone(baseCase);
      distinct.expectedText = 'different actionable diagnostic';
      return [
        {
          id: 'fixture:D5-R025:semantic-base',
          testCase: clone(baseCase),
        },
        {
          id: 'fixture:D5-R025:diagnostic-distinct',
          testCase: distinct,
        },
      ];
    },
    apply(records) {
      const previous = records[1].testCase.expectedText;
      delete records[1].testCase.expectedText;
      delete records[0].testCase.expectedText;
      return () => {
        records[0].testCase.expectedText = baseCase.expectedText;
        records[1].testCase.expectedText = previous;
      };
    },
  },
];

for (const mutation of mutationGuards) {
  test(`D5-R033 controlled semantic mutation: ${mutation.name}`, () => {
    const records =
      mutation.seed?.() ?? [
        {
          id: 'fixture:D5-R025:semantic-base',
          testCase: clone(baseCase),
        },
      ];
    const originalHash = hash(records);
    const restore = mutation.apply(records);
    const ids = records.map(({ id }) => id);
    expectDuplicate(records, [ids[0], ids.at(-1)]);
    restore();
    assert.equal(hash(records), originalHash);
  });
}

const duplicateCases = [
  {
    name: 'visible case name is descriptive metadata',
    second() {
      const duplicate = clone(baseCase);
      duplicate.name = 'a visibly different case name';
      return duplicate;
    },
  },
  {
    name: 'equivalent normalized paths identify the same contract',
    second() {
      const duplicate = clone(baseCase);
      duplicate.expectedPath =
        './src/modules/access/../access/access.module.ts';
      duplicate.files = {
        './src/modules/access/../access/access.module.ts': baseSource,
      };
      return duplicate;
    },
  },
  {
    name: 'non-semantic source formatting identifies the same contract',
    second() {
      const duplicate = clone(baseCase);
      duplicate.files = {
        'src/modules/access/access.module.ts': [
          '/* formatting only */',
          'import{forwardRef}from "@nestjs/common";',
          '',
          'forwardRef( ( ) => 1 ) ; // ignored trivia',
          '',
        ].join('\n'),
      };
      return duplicate;
    },
  },
];

for (const [index, duplicateCase] of duplicateCases.entries()) {
  test(`D5-R033 rejects semantic duplicate: ${duplicateCase.name}`, () => {
    const firstId = `fixture:D5-R025:duplicate-case-${index}-a`;
    const secondId = `fixture:D5-R025:duplicate-case-${index}-b`;
    expectDuplicate(
      [
        { id: firstId, testCase: clone(baseCase) },
        { id: secondId, testCase: duplicateCase.second() },
      ],
      [firstId, secondId],
    );
  });
}

test('D5-R033 duplicate detection is independent of array position', () => {
  const records = [
    {
      id: 'fixture:D5-R025:position-a',
      testCase: clone(baseCase),
    },
    {
      id: 'fixture:D5-R025:position-b',
      testCase: clone(baseCase),
    },
  ];
  expectDuplicate(records, records.map(({ id }) => id));
  expectDuplicate([...records].reverse(), records.map(({ id }) => id));

  assert.equal(
    stableSerialize({ alpha: 1, beta: 2 }),
    stableSerialize({ beta: 2, alpha: 1 }),
  );
  const typedValues = [
    stableSerialize({}),
    stableSerialize({ value: undefined }),
    stableSerialize({ value: null }),
    stableSerialize({ value: '' }),
  ];
  assert.equal(new Set(typedValues).size, typedValues.length);
});

const distinctCases = [
  {
    name: 'direct and alias imports retain different execution source',
    second() {
      const distinct = clone(baseCase);
      distinct.files = {
        'src/modules/access/access.module.ts': [
          "import { forwardRef as nestForwardRef } from '@nestjs/common';",
          'nestForwardRef(() => 1);',
          '',
        ].join('\n'),
      };
      return distinct;
    },
  },
  {
    name: 'alias and namespace imports retain different execution source',
    first() {
      const alias = clone(baseCase);
      alias.files = {
        'src/modules/access/access.module.ts': [
          "import { forwardRef as nestForwardRef } from '@nestjs/common';",
          'nestForwardRef(() => 1);',
          '',
        ].join('\n'),
      };
      return alias;
    },
    second() {
      const namespace = clone(baseCase);
      namespace.files = {
        'src/modules/access/access.module.ts': [
          "import * as Nest from '@nestjs/common';",
          'Nest.forwardRef(() => 1);',
          '',
        ].join('\n'),
      };
      return namespace;
    },
  },
  {
    name: 'opposite polarity remains a distinct contract',
    second() {
      const positive = clone(baseCase);
      positive.expectedRules = [];
      delete positive.expectedText;
      return positive;
    },
  },
  {
    name: 'shadowing and wrong package remain distinct sources',
    first() {
      const shadowed = clone(baseCase);
      shadowed.files = {
        'src/modules/access/access.module.ts': [
          "import { forwardRef as Imported } from '@nestjs/common';",
          'function inspect(Imported) { return Imported(() => 1); }',
          '',
        ].join('\n'),
      };
      shadowed.expectedRules = [];
      delete shadowed.expectedText;
      return shadowed;
    },
    second() {
      const wrongPackage = clone(baseCase);
      wrongPackage.files = {
        'src/modules/access/access.module.ts': [
          "import { forwardRef } from '@example/nest-like';",
          'forwardRef(() => 1);',
          '',
        ].join('\n'),
      };
      wrongPackage.expectedRules = [];
      delete wrongPackage.expectedText;
      return wrongPackage;
    },
  },
  {
    name: 'parenthesized and typed wrappers retain distinct AST paths',
    first() {
      const parenthesized = clone(baseCase);
      parenthesized.files = {
        'src/modules/access/access.module.ts':
          "import { forwardRef } from '@nestjs/common';\n((forwardRef))(() => 1);\n",
      };
      return parenthesized;
    },
    second() {
      const typed = clone(baseCase);
      typed.files = {
        'src/modules/access/access.module.ts':
          "import { forwardRef } from '@nestjs/common';\n((forwardRef as typeof forwardRef))(() => 1);\n",
      };
      return typed;
    },
  },
  {
    name: 'D5-R035 surface and D5-R036 authority contracts stay distinct',
    first() {
      const surface = clone(baseCase);
      surface.expectedRules = ['D5-R035'];
      surface.expectedText = 'controllers are outside';
      return surface;
    },
    second() {
      const authority = clone(baseCase);
      authority.expectedRules = ['D5-R035', 'D5-R036'];
      authority.expectedText =
        'controller decides trusted context or final authorization';
      return authority;
    },
  },
  {
    name: 'same source at different governed roots remains distinct',
    second() {
      const distinct = clone(baseCase);
      distinct.expectedPath = 'src/modules/stations/stations.module.ts';
      distinct.files = {
        'src/modules/stations/stations.module.ts': baseSource,
      };
      return distinct;
    },
  },
  {
    name: 'materially different executable source remains distinct',
    second() {
      const distinct = clone(baseCase);
      distinct.files = {
        'src/modules/access/access.module.ts': baseSource.replace(
          '() => 1',
          '() => 2',
        ),
      };
      return distinct;
    },
  },
];

for (const [index, distinctCase] of distinctCases.entries()) {
  test(`D5-R033 accepts legitimate distinction: ${distinctCase.name}`, () => {
    const first = entry({
      id: `fixture:distinct:${index}:a`,
      testCase: distinctCase.first?.() ?? clone(baseCase),
    });
    const second = entry({
      id: `fixture:distinct:${index}:b`,
      testCase: distinctCase.second(),
    });
    assert.doesNotThrow(() => assertUniqueSemanticCoverage([first, second]));
    assert.notEqual(first.identity.key, second.identity.key);
  });
}
