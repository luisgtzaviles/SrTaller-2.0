import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import ts from 'typescript';

const policyPath = 'src/modules/repairs/domain/new-repair-input-normalization.ts';
const policySource = await readFile(policyPath, 'utf8');
const transpiled = ts.transpileModule(policySource, {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2024 },
  fileName: policyPath,
}).outputText;
const policy = await import(`data:text/javascript;base64,${Buffer.from(transpiled).toString('base64')}`);

test('the explicit registry assigns every New Repair capture to a normalization strategy', () => {
  assert.deepEqual(policy.newRepairInputNormalization, {
    customerGivenName: 'person-name', customerFamilyName: 'person-name', customerPhone: 'phone',
    deviceType: 'catalog-label', deviceBrand: 'brand-label', deviceModel: 'model-label',
    deviceIdentifier: 'identifier', deviceIdentifierUnavailable: 'none', deviceColor: 'catalog-label',
    distinctiveSigns: 'sentence-text', physicalConditionSummary: 'sentence-text', simIncluded: 'none',
    memoryCardIncluded: 'none', receivedPowerState: 'none', otherAccessories: 'sentence-text',
    reportedProblem: 'problem-label', customerNarrative: 'sentence-text', warrantyReviewRequested: 'none',
    previousRepairId: 'identifier', differentDeliverer: 'none', deliveredByName: 'person-name',
    requiresRiskAcceptance: 'none', acceptedRiskIds: 'none', documentedRiskSummary: 'sentence-text',
    deviceAccessType: 'none', deviceAccessSecret: 'secret', devicePattern: 'secret',
    estimatedDeliveryLocal: 'none', initialBudgetAmount: 'monetary',
  });
  assert.deepEqual(policy.relatedRepairCatalogInputNormalization, {
    risk: 'catalog-label', deviceType: 'catalog-label', brand: 'brand-label', model: 'model-label', problemCategory: 'problem-label',
  });
});

test('person names normalize deterministic casing, spaces and Spanish Unicode', () => {
  for (const [input, expected] of [
    ['luis', 'Luis'], ['LUIS ANTONIO', 'Luis Antonio'], ['  luis   antonio ', 'Luis Antonio'],
    ['lUIS aNTONIO', 'Luis Antonio'], ['josé luis', 'José Luis'], ['maría fernanda', 'María Fernanda'],
    ['gUTIERREZ aVILES', 'Gutierrez Aviles'], ['de la cruz', 'De La Cruz'],
  ]) assert.equal(policy.normalizePersonName(input), expected);
});

test('brand presentation stays conservative and never performs identity canonicalization', () => {
  for (const input of ['apple', 'APPLE']) assert.equal(policy.normalizeBrandLabel(input), 'Apple');
  for (const input of ['appple', 'APPPLE']) assert.equal(policy.normalizeBrandLabel(input), 'Appple');
  assert.notEqual(policy.normalizeBrandLabel('APPPLE'), 'Apple');
  assert.deepEqual(['LG', 'OPPO', 'vivo', 'realme', 'HMD'].map(policy.normalizeBrandLabel), ['LG', 'OPPO', 'vivo', 'realme', 'HMD']);
  assert.equal(policy.normalizeNewRepairInput('deviceBrand', 'APPPLE', 'Apple'), 'Apple');
});

test('models preserve meaningful free-entry casing while selected canonical labels win exactly', () => {
  assert.equal(policy.normalizeModelLabel(' iphone 99 qa '), 'iphone 99 qa');
  assert.equal(policy.normalizeModelLabel('iPhone 14 Pro Max'), 'iPhone 14 Pro Max');
  assert.notEqual(policy.normalizeModelLabel('iphone 14'), 'Iphone 14');
  assert.equal(policy.normalizeNewRepairInput('deviceModel', 'iphone 14', 'iPhone 14 Pro Max'), 'iPhone 14 Pro Max');
});

test('problem labels and narrative fields use sentence style without destroying known technical casing', () => {
  for (const [input, expected] of [
    ['desbloqueo', 'Desbloqueo'], ['DESBLOQUEO', 'Desbloqueo'],
    ['centro de carga', 'Centro de carga'], ['CENTRO DE CARGA QA', 'Centro de carga qa'],
    ['pantalla quebrada', 'Pantalla quebrada'],
  ]) assert.equal(policy.normalizeProblemLabel(input), expected);
  assert.equal(policy.normalizeSentenceText('se cayo y dejo de prender'), 'Se cayo y dejo de prender');
  assert.equal(policy.normalizeSentenceText('CLIENTE DICE QUE FACE ID NO FUNCIONA'), 'Cliente dice que Face ID no funciona');
  assert.equal(policy.normalizeSentenceText('FUNDA, CARGADOR Y CABLE USB-C'), 'Funda, cargador y cable USB-C');
  assert.equal(policy.normalizeSentenceText('cliente dice que Face ID, USB-C, iPhone, SIM, IMEI, Wi-Fi y 5G fallan'), 'Cliente dice que Face ID, USB-C, iPhone, SIM, IMEI, Wi-Fi y 5G fallan');
});

test('identifiers and secrets keep their meaningful or exact content', () => {
  assert.equal(policy.normalizeIdentifier('  ABcd123X  '), 'ABcd123X');
  assert.equal(policy.normalizeInputByStrategy('identifier', '  AB cd123X  '), 'AB cd123X');
  assert.equal(policy.normalizeInputByStrategy('secret', '  Päss Word  '), '  Päss Word  ');
  assert.equal(policy.normalizeInputByStrategy('none', ' powered_on '), ' powered_on ');
});

test('display normalization remains separate from case/diacritic-insensitive exact lookup keys', () => {
  assert.equal(policy.normalizeProblemLabel('PÉRDIDA DE INFORMACIÓN'), 'Pérdida de información');
  assert.equal(policy.normalizeInputLookupKey('Pérdida de información'), 'perdida de informacion');
  assert.equal(policy.normalizeBrandLabel('APPPLE'), 'Appple');
  assert.equal(policy.normalizeInputLookupKey('Appple'), 'appple');
});

test('frontend commit points and backend persistence authority use the shared Repairs policy', async () => {
  const [form, reportedProblems, createUseCase, brandPanel, modelPanel, riskPanel, categoryPanel] = await Promise.all([
    readFile('apps/dev-preview-web/src/pages/NewRepairPage.tsx', 'utf8'),
    readFile('apps/dev-preview-web/src/components/ReportedProblemsInput.tsx', 'utf8'),
    readFile('src/modules/repairs/application/use-cases/create-repair.use-case.ts', 'utf8'),
    readFile('apps/dev-preview-web/src/components/RepairBrandCatalogPanel.tsx', 'utf8'),
    readFile('apps/dev-preview-web/src/components/RepairModelCatalogPanel.tsx', 'utf8'),
    readFile('apps/dev-preview-web/src/components/RepairRiskCatalogPanel.tsx', 'utf8'),
    readFile('apps/dev-preview-web/src/components/RepairProblemCategoryCatalogPanel.tsx', 'utf8'),
  ]);
  assert.match(form, /normalizeNewRepairInput\('customerGivenName'/u);
  assert.match(form, /normalizeNewRepairInput\('deviceBrand', deviceBrand, selectedBrand\?\.label\)/u);
  assert.match(form, /normalizeNewRepairInput\('deviceModel', deviceModel, selectedModel\?\.label\)/u);
  assert.match(reportedProblems, /normalizeNewRepairInput\('reportedProblem', label/u);
  assert.match(createUseCase, /normalizeNewRepairInput\(field, value\)/u);
  assert.match(createUseCase, /normalizedOptional\(input\.deviceBrand/u);
  for (const source of [brandPanel, modelPanel, riskPanel, categoryPanel]) assert.match(source, /normalizeRelatedRepairCatalogInput/u);
  assert.match(brandPanel, /normalizeRelatedRepairCatalogInput\('brand', item\.rawLabel\)/u);
  assert.match(modelPanel, /normalizeRelatedRepairCatalogInput\('model', item\.rawModelLabel\)/u);
  assert.match(categoryPanel, /normalizeRelatedRepairCatalogInput\('problemCategory', item\.rawLabel\)/u);
  assert.doesNotMatch(form.slice(form.indexOf('await createRepair({'), form.indexOf('}, csrfToken);')), /deviceAccessSecret|devicePattern/u);
});
