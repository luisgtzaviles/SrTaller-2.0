import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import {
  localRepairEvidenceRows,
  localRepairIntakeRows,
  localRepairInterventionRiskRows,
  localRepairProblemClassificationRows,
  localRepairRows,
  localRepairTimelineRows,
} from '../scripts/lib/local-development.mjs';
import { PBI039_REPAIR_DETAIL_PARITY_FIXTURE as fixture } from '../scripts/lib/pbi039-repair-detail-parity-fixture.mjs';
import {
  assertRepairDetailParityDom,
  repairDetailDomSignature,
} from '../scripts/lib/repair-detail-parity-contract.mjs';

const page = await readFile('apps/dev-preview-web/src/pages/RepairDetailPage.tsx', 'utf8');
const seed = await readFile('scripts/local-db-seed.mjs', 'utf8');
const packageJson = JSON.parse(await readFile('package.json', 'utf8'));

test('PBI-039 canonical parity fixture is complete, synthetic, deterministic, and materialized', () => {
  assert.equal(fixture.contract, 'PBI-039/REPAIR-DETAIL-PARITY');
  assert.equal(fixture.dataClassification, 'synthetic-development-only');
  assert.ok(Object.isFrozen(fixture));
  assert.deepEqual(localRepairRows().find((row) => row.repairId === fixture.repairId), fixture.repair);
  assert.deepEqual(localRepairIntakeRows().find((row) => row.repairId === fixture.repairId), fixture.intake);
  assert.deepEqual(localRepairProblemClassificationRows(), fixture.problemClassifications);
  assert.deepEqual(localRepairInterventionRiskRows(), fixture.interventionRisks);
  assert.ok(fixture.timeline.every((entry) => localRepairTimelineRows().some((row) => row.entryId === entry.entryId)));
  assert.equal(localRepairEvidenceRows().filter((row) => row.repairId === fixture.repairId).length, fixture.evidence.length);
  assert.match(seed, /localRepairProblemClassificationRows/u);
  assert.match(seed, /localRepairInterventionRiskRows/u);
});

test('PBI-039 parity fixture exercises the accepted information architecture', () => {
  for (const value of [
    fixture.intake.customerNarrative,
    fixture.intake.physicalConditionSummary,
    fixture.intake.deviceType,
    fixture.intake.deviceIdentifier,
    fixture.intake.documentedRiskSummary,
    fixture.intake.estimatedDeliveryAt,
  ]) assert.ok(value);
  assert.equal(fixture.intake.simIncluded, true);
  assert.equal(fixture.intake.memoryCardIncluded, false);
  assert.equal(fixture.intake.deviceAccessType, 'pin');
  assert.ok(fixture.timeline.some((entry) => entry.source === fixture.expected.receptionTimelineSource));
  assert.ok(fixture.timeline.some((entry) => entry.entryType === 'note' && entry.actorId));
  assert.equal(fixture.problemClassifications[0].stage, 'post_intake');
  assert.ok(fixture.interventionRisks.length > 0);
  assert.ok(fixture.evidence.length > 0);
});

test('Repair Detail source retains every structural anchor required by the parity fixture', () => {
  let previous = -1;
  for (const section of fixture.expected.sections) {
    const index = page.indexOf(`>${section}<`);
    assert.ok(index > previous, `${section} must remain in accepted order`);
    previous = index;
  }
  for (const label of [
    ...fixture.expected.header,
    ...fixture.expected.receptionSections,
    ...fixture.expected.receptionFields,
    fixture.expected.conceptPlaceholder,
  ]) assert.ok(page.includes(label), `Repair Detail source is missing ${label}`);
  assert.match(page, /repair\.timeline\.items\.map/u);
  assert.match(page, /entry\.actor\.displayName/u);
  assert.match(page, /compactTimelineAt\(entry\.occurredAt/u);
  assert.match(page, /repair\.evidence\.items\.map/u);
});

test('DOM parity contract rejects missing sections and produces comparable structural signatures', () => {
  const headings = [
    { tag: 'H1', text: 'Detalle de reparación' },
    ...fixture.expected.header.map((text) => ({ tag: 'DT', text })),
  ];
  const sections = fixture.expected.sections.map((heading) => ({ heading }));
  const bodyText = [
    ...fixture.expected.header,
    ...fixture.expected.receptionSections,
    ...fixture.expected.receptionFields,
    ...fixture.expected.sections,
    fixture.expected.conceptPlaceholder,
    fixture.repair.customerName,
    fixture.repair.reportedIssue,
    fixture.receiver.displayName,
  ].join('\n');
  const capture = { headings, sections, bodyText };
  assert.doesNotThrow(() => assertRepairDetailParityDom(capture, fixture));
  assert.deepEqual(repairDetailDomSignature(capture), repairDetailDomSignature(structuredClone(capture)));
  assert.throws(() => assertRepairDetailParityDom({ ...capture, bodyText: bodyText.replace('Historial', '') }, fixture));
});

test('runtime parity verifier is an explicit pre-Owner-Review gate', () => {
  assert.equal(packageJson.scripts['verify:repair-detail-parity'], 'pnpm run verify:toolchain && node ./scripts/verify-repair-detail-parity.mjs');
});
