import assert from 'node:assert/strict';
import test from 'node:test';

const domain = await import('../dist/modules/preview/domain/preview-repair.js');
const configuration = await import('../dist/preview-config.js');
const presentation = await import(
  '../dist/modules/preview/presentation/http/preview.controller.js'
);

test('preview repair validates input, identities and governed transitions', () => {
  const input = domain.validateCreatePreviewRepairInput({
    customerName: 'Cliente Sintético',
    customerPhone: '6620000000',
    deviceBrand: 'Marca Demo',
    deviceModel: 'Modelo Demo',
    deviceSerial: null,
    deviceColor: 'Azul demo',
    reportedProblem: 'No enciende durante la validación sintética.',
    physicalCondition: 'Sin daño físico en datos sintéticos.',
    notes: null,
    estimatedPrice: 450,
    depositAmount: 150.1,
  });
  assert.equal(input.depositAmount, 150.1);
  assert.ok(Object.isFrozen(input));
  assert.doesNotThrow(() =>
    domain.assertPreviewRepairTransition('received', 'diagnosing'));
  assert.throws(
    () => domain.assertPreviewRepairTransition('received', 'delivered'),
    (error) =>
      error instanceof domain.PreviewRepairDomainError &&
      error.code === 'PREVIEW_REPAIR_TRANSITION_INVALID',
  );
  assert.throws(
    () => domain.validateCreatePreviewRepairInput({ ...input, customerName: ' ' }),
    (error) =>
      error instanceof domain.PreviewRepairDomainError &&
      error.code === 'PREVIEW_REPAIR_INVALID',
  );
  const identity = domain.newPreviewRepairIdentity(
    new Date('2026-08-01T12:00:00.000Z'),
  );
  assert.match(identity.id, /^[0-9a-f-]{36}$/u);
  assert.match(identity.folio, /^PRE-20260801-[0-9A-F]{8}$/u);
});

test('preview configuration is disabled by default and fails closed when incomplete', () => {
  assert.deepEqual(configuration.loadPreviewConfig({}), { enabled: false });
  assert.throws(
    () => configuration.loadPreviewConfig({ SR_PREVIEW_ENABLED: 'true' }),
    (error) =>
      error instanceof configuration.PreviewConfigError &&
      error.variable === 'SR_PREVIEW_TENANT_ID',
  );
  assert.throws(
    () => configuration.loadPreviewConfig({ SR_PREVIEW_ENABLED: 'yes' }),
    (error) =>
      error instanceof configuration.PreviewConfigError &&
      error.variable === 'SR_PREVIEW_ENABLED',
  );
});

test('preview context endpoint exposes labels only and never operational identifiers', async () => {
  const publicContext = Object.freeze({
    tenantName: 'Tenant Demo SR',
    branchName: 'Sucursal Centro Demo',
    stationLabel: 'Estación Recepción 01',
    environment: 'DEV_PREVIEW',
  });
  const controller = new presentation.PreviewController({
    enabled: true,
    context: publicContext,
  });
  const result = await controller.context();
  assert.deepEqual(result, publicContext);
  assert.deepEqual(Object.keys(result).sort(), [
    'branchName',
    'environment',
    'stationLabel',
    'tenantName',
  ]);
  assert.equal(JSON.stringify(result).includes('00000000-'), false);
});
