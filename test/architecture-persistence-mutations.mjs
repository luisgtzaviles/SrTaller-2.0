import {
  persistenceBaseFiles,
  persistenceFixtureCases,
} from './architecture-persistence-fixtures.mjs';

function fixtureFor(rule) {
  const fixture = persistenceFixtureCases.find(
    (candidate) =>
      candidate.expectedRules?.length === 1 &&
      candidate.expectedRules[0] === rule &&
      candidate.coverage?.ids?.some((id) => id.includes(`:${rule}:`)),
  );
  if (!fixture) {
    throw new Error(`missing persistence fixture for ${rule}`);
  }
  return fixture;
}

const rulesRequiringTopology = new Set([
  'D5-R038',
  'D5-R040',
  'D5-R043',
  'D5-R044',
  'D5-R046',
  'D5-R047',
  'D5-R048',
  'D5-R049',
]);

export const persistenceMutations = Array.from(
  { length: 13 },
  (_, index) => `D5-R${String(index + 37).padStart(3, '0')}`,
).map((rule) => {
  const fixture = fixtureFor(rule);
  return {
    name: `${rule} isolated persistence-boundary mutation`,
    allowedFiles: rulesRequiringTopology.has(rule)
      ? persistenceBaseFiles
      : {},
    coverage: {
      ids: [`mutation:${rule}:persistence-boundary`],
      evidence: fixture.coverage.evidence,
    },
    expectedPath: fixture.expectedPath,
    expectedRules: [rule],
    files: fixture.files,
    rule,
  };
});
