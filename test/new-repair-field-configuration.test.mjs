import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import { CreateRepairInputError, CreateRepairUseCase } from '../dist/modules/repairs/application/use-cases/create-repair.use-case.js';
import { NewRepairPolicyInputError, NewRepairPolicyService } from '../dist/modules/repairs/application/new-repair-policy.service.js';
import { newRepairFieldRegistry, systemNewRepairFieldStates } from '../dist/modules/repairs/domain/new-repair-field-policy.js';

const scope = Object.freeze({ tenantId: '10000000-0000-4000-8000-000000000001', branchId: 'a0000000-0000-4000-8000-000000000001' });
const context = Object.freeze({
  ...scope,
  stationId: '41000000-0000-4000-8000-000000000001',
  sessionId: '42000000-0000-4000-8000-000000000001',
  actorUserId: '40000000-0000-4000-8000-000000000001',
  actorDisplayName: 'Luis',
  capability: 'repairs.configuration.manage',
  commitGuard: Object.freeze({ async confirmCurrent() { return true; }, async confirmTemporalCurrent() { return true; } }),
});

test('central registry keeps fixed, conditional and unavailable product decisions out of Branch relaxation', () => {
  const byKey = new Map(newRepairFieldRegistry.map((field) => [field.key, field]));
  assert.deepEqual(byKey.get('customerGivenName').allowedStates, ['fixed']);
  assert.deepEqual(byKey.get('reportedIssue').allowedStates, ['fixed']);
  assert.deepEqual(byKey.get('otherAccessories').allowedStates, ['conditional']);
  assert.equal(byKey.get('deposit').available, false);
  for (const key of ['warrantyReviewRequested', 'differentDeliverer', 'requiresRiskAcceptance']) {
    assert.equal(byKey.get(key).classification, 'configurable');
    assert.deepEqual(byKey.get(key).allowedStates, ['required', 'optional']);
  }
  for (const key of ['previousRepairId', 'deliveredByName', 'acceptedInterventionRisks']) {
    assert.equal(byKey.get(key).classification, 'conditional');
    assert.deepEqual(byKey.get(key).allowedStates, ['conditional']);
  }
  assert.equal(newRepairFieldRegistry.some((field) => /secret|pin|password|pattern|captureMode/iu.test(field.key)), false);
});

test('initial Branch defaults require only device brand and model', () => {
  const defaults = systemNewRepairFieldStates();
  const required = newRepairFieldRegistry.filter((field) => defaults[field.key] === 'required').map((field) => field.key);
  assert.deepEqual(required, ['deviceBrand', 'deviceModel']);
  for (const key of ['customerPhone', 'simIncluded', 'memoryCardIncluded', 'receivedPowerState', 'deviceAccessType', 'warrantyReviewRequested', 'differentDeliverer', 'requiresRiskAcceptance']) {
    assert.equal(defaults[key], 'optional');
  }
});

test('effective policy upgrades legacy boolean state without rewriting stored Branch history', async () => {
  const legacy = Object.freeze({
    schemaVersion: 1,
    policyVersion: 6,
    fieldStates: Object.freeze({ ...systemNewRepairFieldStates(), warrantyReviewRequested: 'hidden', differentDeliverer: undefined, requiresRiskAcceptance: undefined }),
    updatedAt: '2026-09-08T20:00:00.000Z',
  });
  const service = new NewRepairPolicyService({ async readNewRepairPolicy() { return legacy; } });
  const effective = await service.effective(scope);
  assert.equal(effective.policyVersion, 6);
  assert.equal(effective.fieldStates.warrantyReviewRequested, 'optional');
  assert.equal(effective.fieldStates.differentDeliverer, 'optional');
  assert.equal(effective.fieldStates.requiresRiskAcceptance, 'optional');
});

test('service supplies defaults, validates field-specific states and versions every reset', async () => {
  let stored = null;
  const changes = [];
  const repository = {
    async readNewRepairPolicy() { return stored; },
    async changeNewRepairPolicy(_context, change) {
      changes.push(change);
      if (stored?.policyVersion !== undefined ? stored.policyVersion !== change.expectedVersion : change.expectedVersion !== 0) throw new Error('stale');
      stored = Object.freeze({ schemaVersion: change.schemaVersion, policyVersion: change.expectedVersion + 1, fieldStates: change.fieldStates, updatedAt: change.occurredAt.toISOString() });
      return stored;
    },
  };
  const ids = ['43000000-0000-4000-8000-000000000001', '43000000-0000-4000-8000-000000000002'];
  const service = new NewRepairPolicyService(repository, () => new Date('2026-09-08T20:00:00.000Z'), () => ids.shift());
  const defaults = await service.effective(scope);
  assert.equal(defaults.policyVersion, 0);
  assert.equal(defaults.source, 'system-default');
  const changed = await service.update(context, { expectedVersion: 0, fieldStates: { ...defaults.fieldStates, customerFamilyName: 'required', deviceColor: 'hidden' } });
  assert.equal(changed.policyVersion, 1);
  assert.equal(changed.fieldStates.customerFamilyName, 'required');
  assert.equal(changed.fieldStates.deviceColor, 'hidden');
  await assert.rejects(service.update(context, { expectedVersion: 1, fieldStates: { ...changed.fieldStates, customerGivenName: 'optional' } }), (error) => error instanceof NewRepairPolicyInputError && error.parameter === 'fieldStates');
  await assert.rejects(service.update(context, { expectedVersion: 1, fieldStates: { ...changed.fieldStates, deposit: 'required' } }), (error) => error instanceof NewRepairPolicyInputError && error.parameter === 'fieldStates');
  const reset = await service.reset(context, { expectedVersion: 1 });
  assert.equal(reset.policyVersion, 2);
  assert.deepEqual(reset.fieldStates, systemNewRepairFieldStates());
  assert.equal(changes[1].action, 'new_repair_policy.reset');
});

test('Create Repair rejects hidden payload, enforces required override and stores effective policyVersion', async () => {
  const states = Object.freeze({ ...systemNewRepairFieldStates(), customerFamilyName: 'required', deviceColor: 'hidden' });
  const policy = Object.freeze({ schemaVersion: 1, policyVersion: 7, fieldStates: states, updatedAt: null });
  let captured;
  const repository = { async createRepair(_scope, repair, resolveCustomer) { const customer = await resolveCustomer({}); captured = repair; return { repairId: repair.repairId, folio: 'SR-2026-1000', customerId: customer.customerId, customerName: customer.displayName, customerPhone: repair.customerPhone, occurredAt: repair.occurredAt.toISOString(), correlationId: repair.correlationId, newRepairPolicyVersion: repair.newRepairPolicyVersion }; } };
  const customers = { async resolveSelectedOrCreate(customerScope, input) { return { customerId: 'b0000000-0000-4000-8000-000000000001', ...customerScope, givenName: input.givenName, familyName: input.familyName, displayName: `${input.givenName} ${input.familyName}` }; } };
  const ids = ['f0000000-0000-4000-8000-000000000001', 'f1000000-0000-4000-8000-000000000001', 'f2000000-0000-4000-8000-000000000001', 'f3000000-0000-4000-8000-000000000001', 'f5000000-0000-4000-8000-000000000001', 'f6000000-0000-4000-8000-000000000001', 'f7000000-0000-4000-8000-000000000001', 'f8000000-0000-4000-8000-000000000001', 'f9000000-0000-4000-8000-000000000001'];
  const create = new CreateRepairUseCase(repository, customers, () => ({ ...context, capability: 'repairs.create' }), 'America/Hermosillo', () => new Date('2026-09-08T20:00:00.000Z'), () => ids.shift(), policy);
  const valid = { customerId: null, customerGivenName: 'Cliente', customerFamilyName: 'Prueba', customerPhone: '+52 6620000000', deviceBrand: 'Apple', deviceModel: 'iPhone', simIncluded: false, memoryCardIncluded: false, receivedPowerState: 'powered_on', deviceAccessType: 'none', reportedProblems: [{ label: 'No enciende', categoryId: null }], clientRequestId: 'f4000000-0000-4000-8000-000000000001' };
  await assert.rejects(create.execute({ request: { ...valid, deviceColor: null } }), (error) => error instanceof CreateRepairInputError && error.parameter === 'deviceColor');
  await assert.rejects(create.execute({ request: { ...valid, customerFamilyName: null } }), (error) => error instanceof CreateRepairInputError && error.parameter === 'customerFamilyName');
  await create.execute({ request: valid });
  assert.equal(captured.newRepairPolicyVersion, 7);
});

test('required reception booleans reject missing decisions, accept false, and validate true dependencies', async () => {
  const states = Object.freeze({
    ...systemNewRepairFieldStates(),
    warrantyReviewRequested: 'required',
    differentDeliverer: 'required',
    requiresRiskAcceptance: 'required',
  });
  const policy = Object.freeze({ schemaVersion: 1, policyVersion: 8, fieldStates: states, updatedAt: null });
  let captured;
  const repository = { async createRepair(_scope, repair, resolveCustomer) { const customer = await resolveCustomer({}); captured = repair; return { repairId: repair.repairId, folio: 'SR-2026-1001', customerId: customer.customerId, customerName: customer.displayName, customerPhone: repair.customerPhone, occurredAt: repair.occurredAt.toISOString(), correlationId: repair.correlationId, newRepairPolicyVersion: repair.newRepairPolicyVersion }; } };
  const customers = { async resolveSelectedOrCreate(customerScope, input) { return { customerId: 'b0000000-0000-4000-8000-000000000001', ...customerScope, givenName: input.givenName, familyName: input.familyName, displayName: input.givenName }; } };
  const ids = ['e0000000-0000-4000-8000-000000000001', 'e1000000-0000-4000-8000-000000000001', 'e2000000-0000-4000-8000-000000000001', 'e3000000-0000-4000-8000-000000000001', 'e5000000-0000-4000-8000-000000000001', 'e6000000-0000-4000-8000-000000000001', 'e7000000-0000-4000-8000-000000000001', 'e8000000-0000-4000-8000-000000000001', 'e9000000-0000-4000-8000-000000000001'];
  const create = new CreateRepairUseCase(repository, customers, () => ({ ...context, capability: 'repairs.create' }), 'America/Hermosillo', () => new Date('2026-09-08T20:00:00.000Z'), () => ids.shift(), policy);
  const valid = { customerId: null, customerGivenName: 'Cliente', deviceBrand: 'Apple', deviceModel: 'iPhone', reportedProblems: [{ label: 'No enciende', categoryId: null }], warrantyReviewRequested: false, differentDeliverer: false, requiresRiskAcceptance: false, acceptedRiskIds: [], clientRequestId: 'e4000000-0000-4000-8000-000000000001' };

  for (const key of ['warrantyReviewRequested', 'differentDeliverer', 'requiresRiskAcceptance']) {
    const missing = { ...valid };
    delete missing[key];
    await assert.rejects(create.execute({ request: missing }), (error) => error instanceof CreateRepairInputError && error.parameter === key);
  }
  await assert.rejects(create.execute({ request: { ...valid, differentDeliverer: true } }), (error) => error instanceof CreateRepairInputError && error.parameter === 'deliveredByName');
  await assert.rejects(create.execute({ request: { ...valid, requiresRiskAcceptance: true } }), (error) => error instanceof CreateRepairInputError && error.parameter === 'acceptedRiskIds');
  await assert.rejects(create.execute({ request: { ...valid, requiresRiskAcceptance: true, acceptedRiskIds: ['44000000-0000-4000-8000-000000000001', '44000000-0000-4000-8000-000000000001'] } }), (error) => error instanceof CreateRepairInputError && error.parameter === 'acceptedRiskIds');
  await create.execute({ request: valid });
  assert.equal(captured.warrantyReviewRequested, false);
  assert.equal(captured.deliveredByName, null);
  assert.deepEqual(captured.acceptedRiskIds, []);
});

test('configuration authorization and Classic rendering consume the effective policy without admin coupling', async () => {
  const [operations, page, route] = await Promise.all([
    readFile(new URL('../src/modules/repairs/application/repair-protected-operations.ts', import.meta.url), 'utf8'),
    readFile(new URL('../apps/dev-preview-web/src/pages/NewRepairPage.tsx', import.meta.url), 'utf8'),
    readFile(new URL('../apps/dev-preview-web/src/App.tsx', import.meta.url), 'utf8'),
  ]);
  assert.match(operations, /capability: 'repairs\.configuration\.read'/u);
  assert.match(operations, /capability: 'repairs\.configuration\.manage'/u);
  assert.match(operations, /readOperationalNewRepairPolicy[\s\S]*repairsCreateLookupRequirement/u);
  assert.match(page, /visible\('deviceColor'\)/u);
  assert.match(page, /requiredByPolicy\('customerFamilyName'\)/u);
  assert.match(page, /requiredByPolicy\('warrantyReviewRequested'\)/u);
  assert.match(page, /requiredByPolicy\('differentDeliverer'\)/u);
  assert.match(page, /requiredByPolicy\('requiresRiskAcceptance'\)/u);
  assert.match(page, /type="radio"[\s\S]*required/u);
  assert.match(page, /getOperationalNewRepairPolicy/u);
  assert.match(page, /fieldStates: policy\.fieldStates/u);
  assert.doesNotMatch(page, /Política v\$\{policy\.policyVersion\}/u);
  assert.match(route, /\/configuracion\/catalogos\/nueva-reparacion/u);
});

test('configuration UI presents the policy as a compact accessible matrix without exposing technical conditions', async () => {
  const [page, styles] = await Promise.all([
    readFile(new URL('../apps/dev-preview-web/src/pages/NewRepairConfigurationPage.tsx', import.meta.url), 'utf8'),
    readFile(new URL('../apps/dev-preview-web/src/pages/new-repair-configuration-page.module.css', import.meta.url), 'utf8'),
  ]);

  assert.match(page, /title="Nueva reparación"/u);
  assert.match(page, /description="Elige tu experiencia de captura y, si tienes permiso, configura los campos de esta sucursal\."/u);
  assert.match(page, /<h2>Campos de recepción<\/h2>/u);
  assert.match(page, /type="checkbox"[\s\S]*checked=\{!hidden && state === 'required'\}/u);
  assert.match(page, /event\.target\.checked \? 'required' : 'optional'/u);
  assert.match(page, /aria-label=\{hidden \? `Mostrar \$\{field\.label\}` : `Ocultar \$\{field\.label\}`\}/u);
  assert.match(page, /● Cambios sin guardar/u);
  assert.match(page, /¿Restaurar valores predeterminados\?/u);
  assert.doesNotMatch(page, /<select/u);
  assert.doesNotMatch(page, /Se muestra cuando:/u);
  assert.match(page, /Cuando solicita revisión por garantía/u);
  assert.match(page, /Cuando entrega otra persona/u);
  assert.match(page, /Requiere Caja/u);

  assert.match(styles, /grid-template-columns: repeat\(13, minmax\(0, 1fr\)\)/u);
  assert.match(styles, /\.equipment \.fields \{ grid-template-columns: repeat\(2, minmax\(0, 1fr\)\); \}/u);
  assert.match(styles, /@media \(max-width: 768px\)[\s\S]*\.dashboard \{ grid-template-columns: 1fr; \}/u);
  assert.match(styles, /\.fieldToggle input:focus-visible/u);
  assert.doesNotMatch(styles, /\.fieldToggle strong \{[^}]*white-space: nowrap/u);
});
