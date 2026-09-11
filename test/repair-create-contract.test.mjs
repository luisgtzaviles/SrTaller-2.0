import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const customerMigrationSource = await readFile('src/infrastructure/database/migrations/20260908111000_customers_create_branch_minimum.ts', 'utf8');
const repairMigrationSource = await readFile('src/infrastructure/database/migrations/20260908112000_repairs_enable_minimum_intake_creation.ts', 'utf8');
const classicMigrationSource = await readFile('src/infrastructure/database/migrations/20260908113000_repairs_expand_classic_intake.ts', 'utf8');
const avicellMigrationSource = await readFile('src/infrastructure/database/migrations/20260908114000_repairs_expand_avicell_reception.ts', 'utf8');
const customerSource = await readFile('src/modules/customers/infrastructure/persistence/kysely-customer-intake.repository.ts', 'utf8');
const useCaseSource = await readFile('src/modules/repairs/application/use-cases/create-repair.use-case.ts', 'utf8');
const policyRegistrySource = await readFile('src/modules/repairs/domain/new-repair-field-policy.ts', 'utf8');
const repositorySource = await readFile('src/modules/repairs/infrastructure/persistence/kysely-repair.repository.ts', 'utf8');
const operationsSource = await readFile('src/modules/repairs/application/repair-protected-operations.ts', 'utf8');
const appSource = await readFile('apps/dev-preview-web/src/App.tsx', 'utf8');
const repairsPageSource = await readFile('apps/dev-preview-web/src/pages/RepairsPage.tsx', 'utf8');
const formSource = await readFile('apps/dev-preview-web/src/pages/NewRepairPage.tsx', 'utf8');
const reportedProblemsInputSource = await readFile('apps/dev-preview-web/src/components/ReportedProblemsInput.tsx', 'utf8');
const searchAutocompleteSource = await readFile('apps/dev-preview-web/src/components/ui/SearchAutocomplete.tsx', 'utf8');
const riskMigrationSource = await readFile('src/infrastructure/database/migrations/20260908122000_repairs_create_risk_catalog.ts', 'utf8');
const apiSource = await readFile('apps/dev-preview-web/src/api.ts', 'utf8');
const { CreateRepairInputError, CreateRepairUseCase } = await import('../dist/modules/repairs/application/use-cases/create-repair.use-case.js');

const context = Object.freeze({
  tenantId: '10000000-0000-4000-8000-000000000001',
  branchId: 'a0000000-0000-4000-8000-000000000001',
  stationId: 'a1000000-0000-4000-8000-000000000001',
  sessionId: 'a2000000-0000-4000-8000-000000000001',
  actorUserId: 'a3000000-0000-4000-8000-000000000001',
  actorDisplayName: 'Ada Operadora',
  capability: 'repairs.create',
  commitGuard: Object.freeze({
    async confirmCurrent() { return true; },
    async confirmTemporalCurrent() { return true; },
  }),
});
const problemCategoryId = '70000000-0000-4000-8000-000000000001';

function validAvicellRequest(overrides = {}) {
  return {
    customerId: null, customerGivenName: 'Cliente Avicell', customerFamilyName: null, customerPhone: '+52 662 100 1000',
    deviceType: null, deviceBrand: 'Apple', deviceModel: 'iPhone 15', deviceIdentifier: null, deviceIdentifierUnavailable: false,
    deviceColor: null, distinctiveSigns: null, simIncluded: false, memoryCardIncluded: false, otherAccessories: null,
    reportedProblems: [{ label: 'Pantalla sin imagen', categoryId: null }], customerNarrative: null, physicalConditionSummary: null,
    documentedRiskSummary: null, acceptedRiskIds: [], receivedPowerState: 'powered_off', deviceAccessType: 'none',
    warrantyReviewRequested: false, previousRepairId: null, differentDeliverer: false, deliveredByName: null, requiresRiskAcceptance: false, estimatedDeliveryLocal: null,
    initialBudgetAmount: null, clientRequestId: '99000000-0000-4000-8000-000000000001', ...overrides,
  };
}

test('Customer persistence is Branch-scoped and phone remains a non-unique lookup aid', () => {
  assert.match(customerMigrationSource, /\.addColumn\('branch_id', 'uuid', \(column\) => column\.notNull\(\)\)/u);
  assert.match(customerMigrationSource, /customers_scope_id_uq', \['tenant_id', 'branch_id', 'customer_id'\]/u);
  assert.match(customerMigrationSource, /customers_branch_fk', \['tenant_id', 'branch_id'\]/u);
  assert.match(customerMigrationSource, /customer_contact_phones_customer_phone_uq', \['tenant_id', 'branch_id', 'customer_id', 'phone_normalized'\]/u);
  assert.doesNotMatch(customerMigrationSource, /addUniqueConstraint\([^\n]*\['tenant_id', 'branch_id', 'phone_normalized'\]/u);
  assert.match(repairMigrationSource, /repairs_customer_branch_fk', \['tenant_id', 'branch_id', 'customer_id'\]/u);
  assert.match(customerSource, /where\('branch_id', '=', trusted\.branchId\)/u);
  assert.match(customerSource, /where\('customer_contact_phones\.branch_id', '=', trusted\.branchId\)/u);
  assert.match(customerSource, /where\('customer_id', '=', input\.customerId\)/u);
  assert.match(customerSource, /expression\.and\(nameTerms\.map\(\(term\) => expression\.or/u);
  assert.match(customerSource, /leftJoin\('customer_contact_phones'/u);
  assert.match(customerSource, /orderBy\('customer_contact_phones\.created_at', 'asc'\)/u);
  assert.match(customerSource, /matchedPhone: matchedPhones\.get\(candidate\.customerId\) \?\? null/u);
  assert.match(customerSource, /contactPhones: Object\.freeze\(\[\.\.\.candidate\.contactPhones\]\)/u);
  assert.match(customerSource, /!selected \|\| input\.addCustomerContactPhone/u);
  assert.match(customerSource, /onConflict\(\(conflict\) => conflict\.columns\(\['tenant_id', 'branch_id', 'customer_id', 'phone_normalized'\]\)\.doNothing\(\)\)/u);
  assert.doesNotMatch(customerSource, /selectFrom\('repairs'\)|join\('repairs'/u);
  assert.doesNotMatch(customerSource, /same phone|find.*same.*customer/iu);
});

test('universal minimum remains separate from the Owner initial Branch field policy', () => {
  assert.match(useCaseSource, /if \(!customerId && !customerGivenName\)/u);
  assert.match(useCaseSource, /enforcePolicy\(input, policy\)/u);
  for (const key of ['deviceBrand', 'deviceModel']) {
    assert.match(policyRegistrySource, new RegExp(`key: '${key}'[^\\n]*systemDefault: 'required'`, 'u'));
  }
  for (const key of ['customerPhone', 'deviceType', 'deviceIdentifier', 'deviceColor', 'physicalConditionSummary', 'simIncluded', 'memoryCardIncluded', 'receivedPowerState', 'customerNarrative', 'deviceAccessType', 'estimatedDeliveryLocal', 'initialBudgetAmount']) {
    assert.match(policyRegistrySource, new RegExp(`key: '${key}'[^\\n]*systemDefault: 'optional'`, 'u'));
  }
  assert.match(useCaseSource, /reportedProblems\(input\.reportedProblems\)/u);
  assert.match(formSource, /name="customerGivenName" required=\{!selectedCustomer\}/u);
  assert.match(formSource, /name="customerFamilyName"/u);
  assert.match(formSource, /name="customerPhone"[\s\S]*required/u);
  assert.match(formSource, /phone\.trim\(\) \? `\$\{countryCode\.trim\(\)\} \$\{phone\.trim\(\)\}`\.trim\(\) : ''/u);
  assert.match(formSource, /name="deviceBrand" required=\{requiredByPolicy\('deviceBrand'\)\}/u);
  assert.match(formSource, /name="deviceModel" required=\{requiredByPolicy\('deviceModel'\)\}/u);
  assert.match(formSource, /label="Problemas reportados" required/u);
  assert.match(reportedProblemsInputSource, /Buscar o escribir otro problema/u);
  assert.doesNotMatch(formSource, /Buscar cliente|Señas distintivas/u);
  assert.match(formSource, /searchCustomers\(term, controller\.signal\)/u);
  assert.match(formSource, /searchPreviousRepairs\(query, controller\.signal\)/u);
  assert.match(formSource, /window\.setTimeout\([\s\S]*250\);/u);
  assert.doesNotMatch(formSource, />Buscar<\/Button>/u);
  assert.match(formSource, /autocompleteInputProps\(`\$\{prefix\}-customerOptions`/u);
  assert.match(searchAutocompleteSource, /role: 'combobox'/u);
  assert.match(searchAutocompleteSource, /'aria-controls': listboxId/u);
  assert.match(searchAutocompleteSource, /'aria-activedescendant': activeOptionId/u);
  assert.match(formSource, /id: `\$\{prefix\}-customerOption-\$\{index\}`/u);
  assert.match(searchAutocompleteSource, /aria-selected=\{option\.selected \?\? active\}/u);
  assert.match(formSource, /label="Reparaciones coincidentes"/u);
  assert.match(searchAutocompleteSource, /role="listbox" aria-label=\{label\}/u);
  assert.match(formSource, /handleCustomerComboboxKeyDown/u);
  assert.match(formSource, /handlePreviousRepairComboboxKeyDown/u);
  assert.match(formSource, /autocompleteInputProps\(`\$\{prefix\}-previousRepairOptions`/u);
  assert.match(formSource, /previousRepairId: selectedPreviousRepair\?\.id/u);
  assert.match(formSource, /clearPreviousRepairLookup\(\)/u);
  assert.match(formSource, /<Dialog open title="Nueva reparación"/u);
  assert.match(formSource, /name="simIncluded" value="no" required=\{requiredByPolicy\('simIncluded'\)\}/u);
  assert.match(formSource, /name="memoryCardIncluded" value="no" required=\{requiredByPolicy\('memoryCardIncluded'\)\}/u);
  assert.match(formSource, /name="receivedPowerState" value="powered_on" required=\{requiredByPolicy\('receivedPowerState'\)\}/u);
  assert.match(formSource, /name="receivedPowerState" value="powered_off" required=\{requiredByPolicy\('receivedPowerState'\)\}/u);
  assert.doesNotMatch(formSource, /not_verifiable|No verificable/u);
  assert.doesNotMatch(useCaseSource, /not_verifiable/u);
  assert.doesNotMatch(avicellMigrationSource, /not_verifiable/u);
  assert.match(formSource, /Registrar otros accesorios/u);
  assert.match(formSource, /registerOtherAccessories \? <Field/u);
  assert.match(formSource, /if \(!event\.target\.checked\) setOtherAccessories\(''\)/u);
  assert.match(formSource, /registerOtherAccessories[\s\S]*\? \{ otherAccessories:[\s\S]*: \{\}/u);
  assert.match(formSource, /Credencial temporal/u);
  assert.doesNotMatch(useCaseSource, /deviceAccessSecret|unlockSecret|patternSecret/u);
});

test('initial Branch required fields are enforced server-side and secret payload keys fail closed', async () => {
  let persisted = false;
  const useCase = new CreateRepairUseCase(
    { async createRepair() { persisted = true; } },
    { async resolveSelectedOrCreate() { throw new Error('must not run'); } },
    () => context,
    'America/Hermosillo',
  );
  await assert.rejects(useCase.execute({ request: validAvicellRequest({ deviceBrand: null }) }), (error) => error instanceof CreateRepairInputError && error.parameter === 'deviceBrand');
  await assert.rejects(useCase.execute({ request: validAvicellRequest({ receivedPowerState: 'not_verifiable' }) }), (error) => error instanceof CreateRepairInputError && error.parameter === 'receivedPowerState');
  await assert.rejects(useCase.execute({ request: validAvicellRequest({ deviceAccessSecret: '1234' }) }), (error) => error instanceof CreateRepairInputError && error.parameter === 'payload');
  assert.equal(persisted, false);
});

test('reported problems require 1..N distinct normalized values and preserve capture order', async () => {
  let captured;
  const ids = Array.from({ length: 11 }, (_, index) => `ca000000-0000-4000-8000-${String(index + 1).padStart(12, '0')}`);
  const useCase = new CreateRepairUseCase(
    { async createRepair(_scope, repair, resolveCustomer) { await resolveCustomer({}); captured = repair; return { repairId: repair.repairId, folio: 'SR-2026-1000', customerId: 'b0000000-0000-4000-8000-000000000001', customerName: 'Cliente', customerPhone: null, occurredAt: repair.occurredAt.toISOString(), correlationId: repair.correlationId, newRepairPolicyVersion: repair.newRepairPolicyVersion }; } },
    { async resolveSelectedOrCreate(scope) { return { customerId: 'b0000000-0000-4000-8000-000000000001', tenantId: scope.tenantId, branchId: scope.branchId, givenName: 'Cliente', familyName: null, displayName: 'Cliente' }; } },
    () => context, 'America/Hermosillo', () => new Date('2026-09-09T12:00:00.000Z'), () => ids.shift(),
  );
  await useCase.execute({ request: validAvicellRequest({ reportedProblems: [{ label: ' Pantalla ', categoryId: null }, { label: 'Micrófono', categoryId: problemCategoryId }] }) });
  assert.deepEqual(captured.reportedProblems.map(({ rawLabel, normalizedKey, canonicalCategoryId }) => ({ rawLabel, normalizedKey, canonicalCategoryId })), [
    { rawLabel: 'Pantalla', normalizedKey: 'pantalla', canonicalCategoryId: null },
    { rawLabel: 'Micrófono', normalizedKey: 'microfono', canonicalCategoryId: problemCategoryId },
  ]);
  await assert.rejects(new CreateRepairUseCase({ async createRepair() {} }, { async resolveSelectedOrCreate() {} }, () => context, 'America/Hermosillo').execute({ request: validAvicellRequest({ reportedProblems: [{ label: 'Pantalla', categoryId: null }, { label: ' pantalla ', categoryId: null }] }) }), (error) => error instanceof CreateRepairInputError && error.parameter === 'reportedProblems');
});

test('create repair derives Branch scope and Branch-local folio year server-side', async () => {
  const calls = [];
  const customers = {
    async resolveSelectedOrCreate(scope, input) {
      calls.push({ scope, input });
      return {
        customerId: 'b0000000-0000-4000-8000-000000000001',
        tenantId: scope.tenantId,
        branchId: scope.branchId,
        givenName: input.givenName,
        familyName: input.familyName,
        displayName: [input.givenName, input.familyName].filter(Boolean).join(' '),
        created: true,
      };
    },
  };
  const repository = {
    async createRepair(scope, repair, resolveCustomer) {
      const customer = await resolveCustomer({});
      calls.push({ scope, repair, customer });
      return {
        repairId: repair.repairId,
        folio: `SR-${repair.folioYear}-1000`,
        customerId: customer.customerId,
        customerName: customer.displayName,
        customerPhone: repair.customerPhone,
        occurredAt: repair.occurredAt.toISOString(),
        correlationId: repair.correlationId,
      };
    },
  };
  const ids = [
    'c0000000-0000-4000-8000-000000000001',
    'c1000000-0000-4000-8000-000000000001',
    'c2000000-0000-4000-8000-000000000001',
    'c3000000-0000-4000-8000-000000000001',
    'c4000000-0000-4000-8000-000000000001',
    'c5000000-0000-4000-8000-000000000001',
    'c6000000-0000-4000-8000-000000000001',
    'c7000000-0000-4000-8000-000000000001',
    'c8000000-0000-4000-8000-000000000001',
  ];
  const useCase = new CreateRepairUseCase(
    repository,
    customers,
    () => context,
    'America/Hermosillo',
    () => new Date('2026-01-01T02:00:00.000Z'),
    () => ids.shift(),
  );
  const result = await useCase.execute({ request: {
    customerId: null,
    customerGivenName: ' lUIS   aNTONIO ',
    customerFamilyName: ' gUTIERREZ aVILES ',
    customerPhone: '+52 662 100 1000',
    deviceType: 'Teléfono',
    deviceBrand: 'APPPLE',
    deviceModel: ' iphone 99 qa ',
    deviceIdentifier: '  ABcd123X  ',
    deviceIdentifierUnavailable: false,
    deviceColor: null,
    distinctiveSigns: null,
    simIncluded: true,
    memoryCardIncluded: false,
    otherAccessories: ' FUNDA Y CARGADOR ',
    reportedProblems: [{ label: ' DESBLOQUEO ', categoryId: null }],
    customerNarrative: ' EL CLIENTE DICE QUE EL EQUIPO SE APAGA AL CONECTARLO ',
    physicalConditionSummary: ' GOLPE EN ESQUINA INFERIOR ',
    documentedRiskSummary: null,
    acceptedRiskIds: [],
    receivedPowerState: 'powered_on',
    deviceAccessType: 'none',
    warrantyReviewRequested: false,
    previousRepairId: null,
    deliveredByName: null,
    estimatedDeliveryLocal: '2026-01-02T16:30',
    initialBudgetAmount: '999.00',
    clientRequestId: 'd0000000-0000-4000-8000-000000000001',
  } });

  assert.equal(result.folio, 'SR-2025-1000');
  assert.deepEqual(calls[0], {
    scope: { tenantId: context.tenantId, branchId: context.branchId },
    input: { customerId: null, givenName: 'Luis Antonio', familyName: 'Gutierrez Aviles', contactPhone: '+52 662 100 1000', addCustomerContactPhone: false },
  });
  assert.equal(calls[1].repair.deviceType, 'Teléfono');
  assert.equal(calls[1].repair.canonicalDeviceTypeId, null);
  assert.equal(calls[1].repair.pendingDeviceTypeValueId, 'c4000000-0000-4000-8000-000000000001');
  assert.equal(calls[1].repair.deviceBrand, 'Appple');
  assert.equal(calls[1].repair.canonicalBrandId, null);
  assert.equal(calls[1].repair.pendingBrandValueId, 'c5000000-0000-4000-8000-000000000001');
  assert.equal(calls[1].repair.deviceModel, 'iphone 99 qa');
  assert.equal(calls[1].repair.canonicalModelId, null);
  assert.equal(calls[1].repair.pendingModelValueId, 'c6000000-0000-4000-8000-000000000001');
  assert.equal(calls[1].repair.estimatedDeliveryAt.toISOString(), '2026-01-02T23:30:00.000Z');
  assert.equal(calls[1].repair.deviceIdentifier, 'ABcd123X');
  assert.equal(calls[1].repair.otherAccessories, 'Funda y cargador');
  assert.equal(calls[1].repair.customerNarrative, 'El cliente dice que el equipo se apaga al conectarlo');
  assert.equal(calls[1].repair.physicalConditionSummary, 'Golpe en esquina inferior');
  assert.equal(calls[1].repair.reportedIssueCompatibilitySummary, 'Desbloqueo');
  assert.equal(calls[1].repair.reportedProblems[0].rawLabel, 'Desbloqueo');
  assert.equal(calls[1].repair.receivedPowerState, 'powered_on');
  assert.equal(calls[1].repair.deviceAccessType, 'none');
  assert.equal(calls[1].repair.initialBudgetAmountMinor, 99900);
  assert.equal(calls[1].scope.actorUserId, context.actorUserId);
});

test('Classic 2.0 snapshots do not silently add a Repair phone to a selected Customer', async () => {
  const calls = [];
  const repository = {
    async createRepair(scope, repair, resolveCustomer) {
      const customer = await resolveCustomer({});
      calls.push({ repair, customer });
      return { repairId: repair.repairId, folio: 'SR-2026-1000', customerId: customer.customerId, customerName: customer.displayName, customerPhone: repair.customerPhone, occurredAt: repair.occurredAt.toISOString(), correlationId: repair.correlationId };
    },
  };
  const customers = {
    async resolveSelectedOrCreate(scope, input) {
      calls.push({ scope, input });
      return { customerId: input.customerId, tenantId: scope.tenantId, branchId: scope.branchId, givenName: 'Ana', familyName: null, displayName: 'Ana', created: false };
    },
  };
  const ids = ['e0000000-0000-4000-8000-000000000001', 'e1000000-0000-4000-8000-000000000001', 'e2000000-0000-4000-8000-000000000001', 'e3000000-0000-4000-8000-000000000001', 'e5000000-0000-4000-8000-000000000001', 'e6000000-0000-4000-8000-000000000001', 'e7000000-0000-4000-8000-000000000001', 'e8000000-0000-4000-8000-000000000001', 'e9000000-0000-4000-8000-000000000001'];
  const useCase = new CreateRepairUseCase(repository, customers, () => context, 'America/Hermosillo', () => new Date('2026-09-08T20:00:00.000Z'), () => ids.shift());
  await useCase.execute({ request: {
    customerId: 'b0000000-0000-4000-8000-000000000001', customerGivenName: null, customerFamilyName: null,
    customerPhone: '+52 662 200 2000', deviceType: null, deviceBrand: 'Samsung', deviceModel: 'S24',
    deviceIdentifier: null, deviceIdentifierUnavailable: false, deviceColor: null, distinctiveSigns: null,
    simIncluded: false, memoryCardIncluded: false, otherAccessories: null, reportedProblems: [{ label: 'No carga', categoryId: null }], customerNarrative: null,
    physicalConditionSummary: null, documentedRiskSummary: null, acceptedRiskIds: [], receivedPowerState: 'powered_off', deviceAccessType: 'none', warrantyReviewRequested: false, previousRepairId: null,
    deliveredByName: null, estimatedDeliveryLocal: null, initialBudgetAmount: null, clientRequestId: 'e4000000-0000-4000-8000-000000000001',
  } });
  assert.equal(calls[0].input.contactPhone, null);
  assert.equal(calls[0].input.addCustomerContactPhone, false);
  assert.equal(calls[1].repair.customerPhone, '+52 662 200 2000');
  assert.equal(calls[1].repair.addCustomerContactPhone, false);
});

test('selected Customer phone ownership requires and transports the explicit command', async () => {
  const calls = [];
  const repository = {
    async createRepair(_scope, repair, resolveCustomer) {
      const customer = await resolveCustomer({});
      calls.push({ repair, customer });
      return { repairId: repair.repairId, folio: 'SR-2026-1001', customerId: customer.customerId, customerName: customer.displayName, customerPhone: repair.customerPhone, occurredAt: repair.occurredAt.toISOString(), correlationId: repair.correlationId };
    },
  };
  const customers = {
    async resolveSelectedOrCreate(scope, input) {
      calls.push({ scope, input });
      return { customerId: input.customerId, tenantId: scope.tenantId, branchId: scope.branchId, givenName: 'Ana', familyName: null, displayName: 'Ana', created: false };
    },
  };
  const ids = ['a9000000-0000-4000-8000-000000000001', 'a9000000-0000-4000-8000-000000000002', 'a9000000-0000-4000-8000-000000000003', 'a9000000-0000-4000-8000-000000000004', 'a9000000-0000-4000-8000-000000000005', 'a9000000-0000-4000-8000-000000000006', 'a9000000-0000-4000-8000-000000000007', 'a9000000-0000-4000-8000-000000000008', 'a9000000-0000-4000-8000-000000000010'];
  const useCase = new CreateRepairUseCase(repository, customers, () => context, 'America/Hermosillo', () => new Date('2026-09-09T20:00:00.000Z'), () => ids.shift());
  await useCase.execute({ request: validAvicellRequest({
    customerId: 'b0000000-0000-4000-8000-000000000001',
    customerGivenName: null,
    customerPhone: '+52 (662) 200-2000',
    addCustomerContactPhone: true,
    clientRequestId: 'a9000000-0000-4000-8000-000000000009',
  }) });
  assert.equal(calls[0].input.contactPhone, '+52 (662) 200-2000');
  assert.equal(calls[0].input.addCustomerContactPhone, true);
  assert.equal(calls[1].repair.addCustomerContactPhone, true);

  await assert.rejects(
    new CreateRepairUseCase(repository, customers, () => context, 'America/Hermosillo').execute({ request: validAvicellRequest({ addCustomerContactPhone: true }) }),
    (error) => error instanceof CreateRepairInputError && error.parameter === 'addCustomerContactPhone',
  );
  await assert.rejects(
    new CreateRepairUseCase(repository, customers, () => context, 'America/Hermosillo').execute({ request: validAvicellRequest({ customerId: 'b0000000-0000-4000-8000-000000000001', customerGivenName: null, customerPhone: null, addCustomerContactPhone: true }) }),
    (error) => error instanceof CreateRepairInputError && error.parameter === 'addCustomerContactPhone',
  );
});

test('field requirements remain configurable policy instead of universal Repair invariants', async () => {
  const ids = ['f0000000-0000-4000-8000-000000000001', 'f1000000-0000-4000-8000-000000000001', 'f2000000-0000-4000-8000-000000000001', 'f3000000-0000-4000-8000-000000000001', 'f6000000-0000-4000-8000-000000000001', 'f7000000-0000-4000-8000-000000000001', 'f8000000-0000-4000-8000-000000000001', 'f9000000-0000-4000-8000-000000000001', 'fa000000-0000-4000-8000-000000000001'];
  let capturedRepair;
  const useCase = new CreateRepairUseCase(
    { async createRepair(scope, repair, resolveCustomer) {
      const customer = await resolveCustomer({});
      capturedRepair = repair;
      return { repairId: repair.repairId, folio: 'SR-2026-1000', customerId: customer.customerId, customerName: customer.displayName, customerPhone: repair.customerPhone, occurredAt: repair.occurredAt.toISOString(), correlationId: repair.correlationId };
    } },
    { async resolveSelectedOrCreate(scope, input) { return { customerId: 'b0000000-0000-4000-8000-000000000001', tenantId: scope.tenantId, branchId: scope.branchId, givenName: input.givenName, familyName: null, displayName: input.givenName, created: true }; } },
    () => context,
    'America/Hermosillo',
    () => new Date('2026-09-08T20:00:00.000Z'),
    () => ids.shift(),
    { schemaVersion: 1, policyVersion: 4, updatedAt: null, fieldStates: Object.freeze(Object.fromEntries([
      ...['customerGivenName', 'reportedIssue'].map((key) => [key, 'fixed']),
      ...['otherAccessories', 'previousRepairId', 'deliveredByName', 'acceptedInterventionRisks', 'deposit'].map((key) => [key, 'conditional']),
      ...['customerFamilyName', 'customerPhone', 'deviceType', 'deviceBrand', 'deviceModel', 'deviceIdentifier', 'deviceColor', 'physicalConditionSummary', 'simIncluded', 'memoryCardIncluded', 'receivedPowerState', 'customerNarrative', 'warrantyReviewRequested', 'differentDeliverer', 'requiresRiskAcceptance', 'deviceAccessType', 'estimatedDeliveryLocal', 'initialBudgetAmount'].map((key) => [key, 'optional']),
    ])) },
  );
  await useCase.execute({ request: {
    customerId: null, customerGivenName: 'Política portable', customerFamilyName: null, customerPhone: null,
    deviceType: null, deviceBrand: null, deviceModel: null, deviceIdentifier: null, deviceIdentifierUnavailable: false,
    deviceColor: null, distinctiveSigns: null, simIncluded: null, memoryCardIncluded: null, otherAccessories: null,
    reportedProblems: [{ label: 'Falla reportada', categoryId: null }], customerNarrative: null, physicalConditionSummary: null, documentedRiskSummary: null, acceptedRiskIds: [], receivedPowerState: null, deviceAccessType: null,
    warrantyReviewRequested: false, previousRepairId: null, differentDeliverer: false, deliveredByName: null, requiresRiskAcceptance: false, estimatedDeliveryLocal: null,
    initialBudgetAmount: null, clientRequestId: 'f4000000-0000-4000-8000-000000000001',
  } });
  assert.equal(capturedRepair.customerPhone, null);
  assert.equal(capturedRepair.deviceBrand, null);
  assert.equal(capturedRepair.deviceModel, null);
});

test('an invalid Branch-local delivery estimate is rejected as input before persistence', async () => {
  let persisted = false;
  const useCase = new CreateRepairUseCase(
    { async createRepair() { persisted = true; } },
    { async resolveSelectedOrCreate() { throw new Error('must not run'); } },
    () => context,
    'America/Hermosillo',
  );
  await assert.rejects(useCase.execute({ request: {
    customerId: null, customerGivenName: 'Fecha inválida', customerFamilyName: null, customerPhone: '+52 662 100 1000',
    deviceType: null, deviceBrand: 'Apple', deviceModel: 'iPhone', deviceIdentifier: null, deviceIdentifierUnavailable: false,
    deviceColor: null, distinctiveSigns: null, simIncluded: false, memoryCardIncluded: false, otherAccessories: null,
    reportedProblems: [{ label: 'Falla reportada', categoryId: null }], customerNarrative: null, physicalConditionSummary: null, documentedRiskSummary: null, acceptedRiskIds: [], receivedPowerState: 'powered_off', deviceAccessType: 'none',
    warrantyReviewRequested: false, previousRepairId: null, deliveredByName: null, estimatedDeliveryLocal: '2026-02-30T12:00',
    initialBudgetAmount: null, clientRequestId: 'f5000000-0000-4000-8000-000000000001',
  } }), (error) => error instanceof CreateRepairInputError && error.parameter === 'estimatedDeliveryLocal');
  assert.equal(persisted, false);
});

test('Repair create is atomic, capability-gated, and exposed only to authorized UI', () => {
  const createMethod = repositorySource.slice(repositorySource.indexOf('async createRepair'), repositorySource.indexOf('async addOperationalNote'));
  for (const table of ['repairs', 'repair_intakes', 'repair_timeline_entries', 'repair_business_audit_events', 'repair_create_commands']) {
    assert.match(createMethod, new RegExp(`insertInto\\('${table}'\\)`, 'u'));
  }
  assert.match(createMethod, /#runCreateTransaction/u);
  assert.match(createMethod, /customer\.branchId !== validatedScope\.branchId/u);
  assert.match(operationsSource, /repairsCreateRequirement[\s\S]*capability:\s*'repairs\.create'[\s\S]*kind:\s*'state-change'/u);
  assert.match(operationsSource, /repairsCreateLookupRequirement[\s\S]*capability:\s*'repairs\.create'[\s\S]*kind:\s*'read'/u);
  assert.match(appSource, /capability="repairs\.create"><NewRepairEntryPage/u);
  assert.match(repairsPageSource, /hasOperationalCapability\(capabilities, 'repairs\.create'\)/u);
  assert.match(repairsPageSource, /to="\/reparaciones\/nueva"/u);
  assert.doesNotMatch(formSource, /createPreviewRepair|\/api\/preview\/repairs/u);
  assert.match(classicMigrationSource, /estimated_delivery_at', 'timestamptz'/u);
  assert.match(classicMigrationSource, /repair_intakes_previous_repair_scope_fk/u);
  assert.match(avicellMigrationSource, /received_power_state/u);
  assert.match(avicellMigrationSource, /device_access_type/u);
  assert.doesNotMatch(avicellMigrationSource, /documented_risk_code/u);
  assert.match(avicellMigrationSource, /initial_budget_amount_minor/u);
  assert.match(formSource, /<strong>Anticipo<\/strong><span>Próximamente<\/span>/u);
  assert.match(formSource, /<small>Requiere Caja<\/small>/u);
  assert.doesNotMatch(formSource, /id=\{`\$\{prefix\}-deposit`\}[\s\S]{0,200}<Input/u);
});

test('risk choices come from the Repairs-owned persistent effective catalog, not the form policy', () => {
  assert.match(riskMigrationSource, /createTable\('repair_risks'\)/u);
  assert.match(riskMigrationSource, /createTable\('repair_intervention_risks'\)/u);
  assert.match(riskMigrationSource, /scope = 'platform'/u);
  assert.match(riskMigrationSource, /scope = 'tenant'/u);
  for (const label of ['Batería inflada', 'Cristal o pantalla quebrada', 'Humedad o contacto con líquido', 'Marco o chasis deformado', 'Equipo abierto previamente', 'Otro riesgo']) {
    assert.doesNotMatch(riskMigrationSource, new RegExp(label, 'u'));
    assert.doesNotMatch(formSource, new RegExp(label, 'u'));
  }
  assert.match(apiSource, /getOperationalRepairRisks/u);
  assert.match(formSource, /getOperationalRepairRisks\(signal\)/u);
  assert.match(formSource, /¿La reparación requiere aceptar algún riesgo\?/u);
  assert.match(formSource, /<InterventionRiskCheckboxList/u);
  assert.match(formSource, /setAcceptedRiskIds\(\[\]\)/u);
  assert.match(formSource, /Selecciona al menos un riesgo aceptado para continuar\./u);
  assert.match(formSource, /acceptedRiskIds: requiresRiskAcceptance === true/u);
  assert.match(formSource, /no constituye firma ni evidencia legal/u);
});
