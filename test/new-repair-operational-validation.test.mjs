import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import { isDevicePatternValid } from '../apps/dev-preview-web/src/device-access-pattern.mjs';
import { collectNewRepairValidationIssues } from '../apps/dev-preview-web/src/new-repair-validation.mjs';

const pageSource = await readFile('apps/dev-preview-web/src/pages/NewRepairPage.tsx', 'utf8');
const pageCss = await readFile('apps/dev-preview-web/src/pages/pages.module.css', 'utf8');
const problemsSource = await readFile('apps/dev-preview-web/src/components/ReportedProblemsInput.tsx', 'utf8');
const problemsCss = await readFile('apps/dev-preview-web/src/components/reported-problems-input.module.css', 'utf8');

const fieldKeys = [
  'customerFamilyName', 'customerPhone', 'deviceType', 'deviceBrand', 'deviceModel',
  'deviceIdentifier', 'deviceColor', 'physicalConditionSummary', 'simIncluded',
  'memoryCardIncluded', 'receivedPowerState', 'customerNarrative',
  'warrantyReviewRequested', 'differentDeliverer', 'requiresRiskAcceptance',
  'deviceAccessType', 'estimatedDeliveryLocal', 'initialBudgetAmount',
];

function validInput(overrides = {}) {
  return {
    fieldStates: Object.freeze(Object.fromEntries(fieldKeys.map((key) => [key, 'optional']))),
    selectedCustomer: true,
    identifierUnavailable: false,
    reportedProblemCount: 1,
    acceptedRiskCount: 0,
    patternValid: false,
    values: {
      customerGivenName: '', customerFamilyName: '', customerPhone: '', deviceType: '',
      deviceBrand: '', deviceModel: '', deviceIdentifier: '', deviceColor: '',
      physicalConditionSummary: '', simIncluded: null, memoryCardIncluded: null,
      receivedPowerState: '', customerNarrative: '', warrantyReviewRequested: null,
      differentDeliverer: null, deliveredByName: '', requiresRiskAcceptance: null,
      deviceAccessType: '', deviceAccessSecret: '', estimatedDeliveryLocal: '',
      initialBudgetAmount: '',
    },
    ...overrides,
  };
}

test('operational validation follows effective policy and excludes optional or hidden fields', () => {
  const input = validInput({
    fieldStates: {
      ...validInput().fieldStates,
      deviceBrand: 'required',
      deviceModel: 'required',
      customerPhone: 'hidden',
      deviceType: 'optional',
    },
  });
  assert.deepEqual(collectNewRepairValidationIssues(input).map((issue) => issue.fieldKey), ['deviceBrand', 'deviceModel']);
});

test('required explicit decisions distinguish missing from a valid No response', () => {
  const fieldStates = { ...validInput().fieldStates, simIncluded: 'required', memoryCardIncluded: 'required' };
  const missing = collectNewRepairValidationIssues(validInput({ fieldStates }));
  assert.deepEqual(missing.map((issue) => issue.fieldKey), ['simIncluded', 'memoryCardIncluded']);
  const answeredNo = collectNewRepairValidationIssues(validInput({ fieldStates, values: { ...validInput().values, simIncluded: false, memoryCardIncluded: false } }));
  assert.equal(answeredNo.length, 0);
});

test('domain conditionals, problem minimum, risks and access remain centralized and ordered', () => {
  const issues = collectNewRepairValidationIssues(validInput({
    selectedCustomer: false,
    reportedProblemCount: 0,
    acceptedRiskCount: 0,
    patternValid: isDevicePatternValid([1]),
    values: {
      ...validInput().values,
      differentDeliverer: true,
      requiresRiskAcceptance: true,
      deviceAccessType: 'pattern',
    },
  }));
  assert.deepEqual(issues.map((issue) => issue.fieldKey), [
    'customerGivenName', 'reportedProblems', 'deliveredByName', 'acceptedRiskIds', 'devicePattern',
  ]);
  assert.equal(issues[0].section, 'customer');
  assert.equal(issues[0].focusTarget, 'customerGivenName');
  assert.equal(isDevicePatternValid([1, 9]), true);
});

test('conditional issues disappear when their trigger no longer applies and previous Repair stays optional', () => {
  const active = collectNewRepairValidationIssues(validInput({
    values: { ...validInput().values, warrantyReviewRequested: true, differentDeliverer: true, requiresRiskAcceptance: true },
  }));
  assert.deepEqual(active.map((issue) => issue.fieldKey), ['deliveredByName', 'acceptedRiskIds']);
  const inactive = collectNewRepairValidationIssues(validInput({
    values: { ...validInput().values, warrantyReviewRequested: false, differentDeliverer: false, requiresRiskAcceptance: false },
  }));
  assert.equal(inactive.length, 0);
});

test('temporary access values validate locally while Anticipo remains unavailable', () => {
  const pinMissing = collectNewRepairValidationIssues(validInput({ values: { ...validInput().values, deviceAccessType: 'pin' } }));
  assert.deepEqual(pinMissing.map((issue) => issue.fieldKey), ['deviceAccessSecret']);
  const pinPresent = collectNewRepairValidationIssues(validInput({
    fieldStates: { ...validInput().fieldStates, deposit: 'required' },
    values: { ...validInput().values, deviceAccessType: 'pin', deviceAccessSecret: 'temporary-value' },
  }));
  assert.equal(pinPresent.length, 0);
});

test('free-entry problems are valid capture and receive a neutral reconciliation marker', () => {
  assert.equal(collectNewRepairValidationIssues(validInput({ reportedProblemCount: 1 })).length, 0);
  assert.match(problemsSource, /item\.categoryId === null[\s\S]*Por revisar/u);
  assert.match(problemsCss, /\.pendingBadge[\s\S]*--color-neutral-status/u);
});

test('New Repair owns submit validation, error semantics, footer state and tablet layout contract', () => {
  assert.match(pageSource, /<form ref=\{formRef\}[\s\S]*noValidate/u);
  assert.match(pageSource, /collectNewRepairValidationIssues/u);
  assert.match(pageSource, /aria-live="polite" aria-atomic="true"/u);
  assert.match(pageSource, /Faltan \$\{allValidationIssues\.length\}/u);
  assert.match(pageSource, /Lista para guardar/u);
  assert.match(pageSource, /scrollIntoView\(\{ block: 'center', inline: 'nearest' \}\)/u);
  assert.match(pageSource, /sectionStatus\('equipment'\)/u);
  assert.match(pageSource, /invalidProps\('deviceBrand'\)/u);
  assert.match(pageSource, /disabled=\{saving \|\| !policy\}/u);
  assert.match(pageSource, /useState\(false\);[\s\S]*validationAttempted/u);
  assert.doesNotMatch(pageSource, /Política v\$\{policy\.policyVersion\}/u);
  assert.match(pageCss, /@media \(min-width: 768px\) and \(max-width: 1024px\)[\s\S]*equipmentSection[\s\S]*repeat\(2/u);
  assert.match(pageCss, /\.depositField/u);
  assert.match(pageCss, /\.depositHeading/u);
});
