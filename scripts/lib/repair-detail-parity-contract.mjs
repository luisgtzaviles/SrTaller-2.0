import assert from 'node:assert/strict';

function requireText(value, path) {
  assert.equal(typeof value, 'string', `${path} must be text`);
  assert.notEqual(value.trim(), '', `${path} must not be empty`);
}

export function assertRepairDetailParityReadModel(readModel, fixture) {
  assert.equal(readModel.id, fixture.repairId);
  assert.equal(readModel.folio, fixture.folio);
  assert.equal(readModel.receivedDevice.type, fixture.intake.deviceType);
  assert.equal(readModel.receivedDevice.identifier, fixture.intake.deviceIdentifier);
  assert.equal(readModel.receivedDevice.identifierUnavailable, false);
  assert.equal(readModel.receivedDevice.accessories.simIncluded, true);
  assert.equal(readModel.receivedDevice.accessories.memoryCardIncluded, false);
  assert.equal(readModel.intake.deviceAccessType, fixture.intake.deviceAccessType);
  assert.equal(readModel.intake.receivedPowerState, fixture.intake.receivedPowerState);
  assert.equal(readModel.intake.initialBudgetAmountMinor, fixture.intake.initialBudgetAmountMinor);
  assert.equal(readModel.intake.estimatedDeliveryAt, fixture.intake.estimatedDeliveryAt);
  assert.equal(readModel.intake.receivedBy.id, fixture.receiver.id);
  assert.equal(readModel.currentSituation.technician.id, fixture.technician.id);
  assert.equal(readModel.currentSituation.location.code, 'workshop');
  assert.equal(readModel.currentSituation.custody.code, 'active');
  requireText(readModel.customer.name, 'customer.name');
  requireText(readModel.receivedDevice.label, 'receivedDevice.label');
  requireText(readModel.intake.reportedIssue, 'intake.reportedIssue');
  requireText(readModel.intake.customerNarrative, 'intake.customerNarrative');
  requireText(readModel.intake.physicalConditionSummary, 'intake.physicalConditionSummary');
  requireText(readModel.intake.documentedRiskSummary, 'intake.documentedRiskSummary');
  assert.ok(readModel.problemClassifications.some((problem) => problem.label === 'Centro de carga'));
  assert.ok(readModel.intake.acceptedInterventionRisks.length > 0);
  assert.ok(readModel.timeline.items.some((entry) => entry.source === fixture.expected.receptionTimelineSource));
  assert.ok(readModel.timeline.items.some((entry) => entry.type === 'note' && entry.actor.id));
  assert.ok(readModel.timeline.items.every((entry) => !Number.isNaN(Date.parse(entry.occurredAt))));
  assert.equal(readModel.timeline.totalCount, readModel.timeline.items.length);
  assert.equal(readModel.evidence.totalCount, fixture.evidence.length);
  assert.equal(readModel.evidence.items.length, fixture.evidence.length);
}

export function repairDetailDomSignature(capture) {
  const headings = capture.headings.map(({ tag, text }) => `${tag}:${text}`);
  const sectionHeadings = capture.sections.map(({ heading }) => heading);
  const definitionTerms = capture.headings
    .filter(({ tag }) => tag === 'DT')
    .map(({ text }) => text);
  return Object.freeze({ headings, sectionHeadings, definitionTerms });
}

export function assertRepairDetailParityDom(capture, fixture) {
  for (const label of [
    ...fixture.expected.header,
    ...fixture.expected.receptionSections,
    ...fixture.expected.receptionFields,
    ...fixture.expected.sections,
    fixture.expected.conceptPlaceholder,
    fixture.repair.customerName,
    fixture.repair.reportedIssue,
    fixture.receiver.displayName,
  ]) {
    assert.ok(capture.bodyText.includes(label), `Repair Detail DOM is missing: ${label}`);
  }
  assert.ok(capture.headings.some(({ tag, text }) => tag === 'H1' && text === 'Detalle de reparación'));
  assert.ok(capture.sections.some(({ heading }) => heading === 'Historial'));
  assert.ok(capture.sections.some(({ heading }) => heading === 'Conceptos'));
  assert.ok(capture.sections.some(({ heading }) => heading === 'Evidencias'));
}
