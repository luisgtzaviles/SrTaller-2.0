import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import { resolveNewRepairPresentation } from '../apps/dev-preview-web/src/new-repair-presentation.mjs';
import { formatGuidedLocalDateTime, formatGuidedMoney, guidedAccessSummary, resolveGuidedNewRepairSteps } from '../apps/dev-preview-web/src/new-repair-guided.mjs';

const [app, entry, provider, api, configuration, classic, styles] = await Promise.all([
  readFile('apps/dev-preview-web/src/App.tsx', 'utf8'),
  readFile('apps/dev-preview-web/src/pages/NewRepairEntryPage.tsx', 'utf8'),
  readFile('apps/dev-preview-web/src/user-preferences/UserPreferencesProvider.tsx', 'utf8'),
  readFile('apps/dev-preview-web/src/user-preferences-api.ts', 'utf8'),
  readFile('apps/dev-preview-web/src/pages/NewRepairConfigurationPage.tsx', 'utf8'),
  readFile('apps/dev-preview-web/src/pages/NewRepairPage.tsx', 'utf8'),
  readFile('apps/dev-preview-web/src/pages/pages.module.css', 'utf8'),
]);

test('one resolver selects the New Repair presentation for direct and overlay routes', () => {
  assert.equal(resolveNewRepairPresentation('classic'), 'classic');
  assert.equal(resolveNewRepairPresentation('guided_v2'), 'classic');
  assert.equal(resolveNewRepairPresentation('guided_v2', true), 'guided_v2');
  assert.equal((app.match(/<NewRepairEntryPage/gu) ?? []).length, 2);
  assert.equal(app.includes('<NewRepairPage'), false);
  assert.match(entry, /status === 'loading'[\s\S]*resolveNewRepairPresentation\(preferences\.mode, true\)[\s\S]*mode=\{presentation\}/u);
});

test('Guided orientation and semantic review stay compact without changing Classic headers', () => {
  assert.match(classic, /const guidedSectionClass = \(section:[\s\S]*mode !== 'guided_v2'\s*\? ''\s*:\s*guidedStep\?\.id === section/u);
  assert.match(classic, /className=\{`\$\{styles\.formSurface\} \$\{styles\.classicModalForm\} \$\{mode === 'guided_v2' \? styles\.guidedModalForm : ''\}`\}/u);
  assert.match(classic, /className=\{styles\.guidedHeaderCurrent\}[\s\S]*Paso \{guidedStepIndex \+ 1\} de \{guidedSteps\.length\}/u);
  assert.match(styles, /\.guidedActiveSection > header \{[\s\S]*clip-path: inset\(50%\)/u);
  assert.match(styles, /\.guidedActiveSection \{[\s\S]*border: 0;[\s\S]*box-shadow: none;/u);
  assert.match(styles, /\.guidedModalForm \{[\s\S]*min-height: 0;/u);
  assert.doesNotMatch(classic, /guided-review-title|Problema \$\{index \+ 1\}/u);
  assert.match(classic, /title="Recepción"[\s\S]*Riesgos aceptados[\s\S]*reviewRiskLabels\.join\(' · '\)/u);
  assert.equal(formatGuidedLocalDateTime('2026-09-09T22:41'), '9 sep 2026, 10:41 p.m.');
  assert.equal(formatGuidedLocalDateTime('not-a-date'), '');
  assert.equal(formatGuidedMoney('100'), '$100 MXN');
  assert.equal(formatGuidedMoney('1250.50'), '$1,250.5 MXN');
});

test('personal preference state is server-backed, identity-keyed, and falls back to Classic', () => {
  assert.match(app, /key=\{`\$\{session\.tenantId\}:\$\{session\.userId\}`\}/u);
  assert.match(provider, /useState<NewRepairFormMode>\('classic'\)/u);
  assert.match(provider, /setStatus\('fallback'\)[\s\S]*setModeState\('classic'\)|setModeState\('classic'\)[\s\S]*setStatus\('fallback'\)/u);
  assert.match(provider, /const previousMode = mode[\s\S]*setModeState\(nextMode\)[\s\S]*setModeState\(previousMode\)/u);
  assert.match(api, /method: 'PATCH'/u);
  assert.match(api, /'X-SR-CSRF-Token': csrfToken/u);
  assert.doesNotMatch(`${provider}\n${api}`, /localStorage|sessionStorage|indexedDB/iu);
});

test('configuration separates personal mode from Branch policy and enables Guided', () => {
  assert.match(configuration, /Preferencia personal/u);
  assert.match(configuration, /Classic 2\.0/u);
  assert.match(configuration, /Guided V2/u);
  assert.match(configuration, /value="guided_v2"[\s\S]*preferences\.setMode\('guided_v2'\)/u);
  assert.doesNotMatch(configuration, /Guided V2 <em>Próximamente<\/em>|value="guided_v2"[\s\S]{0,160}disabled/u);
  assert.match(configuration, /if \(!canReadBranchPolicy\) return;[\s\S]*getAdminNewRepairPolicy/u);
  assert.match(configuration, /!canReadBranchPolicy \? <p className=\{styles\.personalOnlyNote\}/u);
  assert.match(configuration, /Configuración de esta sucursal/u);
  assert.match(app, /repairs\.create'[\s\S]*repairs\.configuration\.read'/u);
  assert.match(configuration, /const dirty = useMemo\(\(\) => policy !== null && policy\.registry\.some\(\(field\) => draft\[field\.key\] !== policy\.fieldStates\[field\.key\]\), \[draft, policy\]\)/u);
  assert.match(configuration, /resetNewRepairPolicy\(policy\.policyVersion, csrfToken\)/u);
  assert.doesNotMatch(configuration, /resetNewRepairPolicy\([^)]*preferences|setDraft\([^)]*preferences|preferences\.setMode\([^)]*draft/iu);
  assert.match(classic, /mode === 'guided_v2'/u);
});

test('Guided derives policy-aware steps and never exposes captured access secrets in review copy', () => {
  const defaultSteps = resolveGuidedNewRepairSteps({});
  assert.deepEqual(defaultSteps.map((step) => step.id), ['customer', 'equipment', 'reception', 'access', 'commitment', 'review']);
  const compactSteps = resolveGuidedNewRepairSteps({
    deviceType: 'hidden', deviceBrand: 'hidden', deviceModel: 'hidden', deviceIdentifier: 'hidden',
    deviceColor: 'hidden', physicalConditionSummary: 'hidden', simIncluded: 'hidden',
    memoryCardIncluded: 'hidden', receivedPowerState: 'hidden', deviceAccessType: 'hidden',
    estimatedDeliveryLocal: 'hidden', initialBudgetAmount: 'hidden',
  });
  assert.deepEqual(compactSteps.map((step) => step.id), ['customer', 'reception', 'review']);
  assert.equal(guidedAccessSummary('pin', true), 'PIN proporcionado');
  assert.equal(guidedAccessSummary('password', true), 'Contraseña proporcionada');
  assert.equal(guidedAccessSummary('pattern', true), 'Patrón capturado');
  assert.match(classic, /const meaningfulItems = items\.filter[\s\S]{0,220}if \(meaningfulItems\.length === 0\) return null/u);
  assert.doesNotMatch(classic, /value:\s*deviceAccessSecret|value:\s*devicePattern|devicePattern\.join/iu);
  assert.match(classic, /createRepair\(\{[\s\S]*deviceAccessType[\s\S]*\}, csrfToken\)/u);
  assert.match(classic, /key="guided-continue"[\s\S]{0,220}type="button"[\s\S]{0,260}event\.preventDefault\(\)[\s\S]{0,100}advanceGuided\(\)/u);
  assert.match(classic, /key="guided-save"[\s\S]{0,120}type="submit"/u);
  assert.match(classic, /onSubmit=\{\(event\) => \{ if \(mode === 'guided_v2' && !guidedOnReview\) \{ event\.preventDefault\(\); advanceGuided\(\); \}/u);
});

test('preference transport exposes the exact allowlisted payload only', () => {
  assert.match(api, /Object\.keys\(value\)\.length !== 1/u);
  assert.match(api, /JSON\.stringify\(input\)/u);
  assert.doesNotMatch(api, /tenantId|userId|branchId|policyVersion/u);
});
