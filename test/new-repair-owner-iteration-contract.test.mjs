import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const [form, riskList, riskStyles, app, detail] = await Promise.all([
  readFile('apps/dev-preview-web/src/pages/NewRepairPage.tsx', 'utf8'),
  readFile('apps/dev-preview-web/src/components/InterventionRiskCheckboxList.tsx', 'utf8'),
  readFile('apps/dev-preview-web/src/components/intervention-risk-checkbox-list.module.css', 'utf8'),
  readFile('apps/dev-preview-web/src/App.tsx', 'utf8'),
  readFile('apps/dev-preview-web/src/pages/RepairDetailPage.tsx', 'utf8'),
]);

test('only the audited Classic capture fields suppress browser suggestions locally', () => {
  assert.doesNotMatch(form, /<form[^>]*autoComplete=/u);
  assert.match(form, /name="deviceType"[^>]*type="search"[^>]*autoCapitalize="sentences"[^>]*spellCheck=\{false\}[\s\S]*?autocompleteInputProps\([^)]*'search'\)/u);
  assert.match(form, /name="deviceIdentifier"[^>]*type="text"[^>]*autoComplete="off"[^>]*autoCapitalize="off"[^>]*autoCorrect="off"[^>]*spellCheck=\{false\}[^>]*inputMode="text"/u);
  assert.match(form, /name="deliveredByName"[^>]*type="text"[^>]*autoComplete="off"[^>]*autoCapitalize="words"[^>]*autoCorrect="off"[^>]*spellCheck=\{false\}[^>]*inputMode="text"/u);
  assert.match(form, /type=\{deviceAccessSecretVisible \? 'text' : 'password'\}[^>]*autoComplete="one-time-code"/u);
});

test('accepted risks are compact multi-option checkboxes with preserved input semantics', () => {
  assert.match(riskList, /<fieldset[\s\S]*aria-required="true"/u);
  assert.match(riskList, /<label key=\{risk\.riskId\} htmlFor=\{optionId\}/u);
  assert.match(riskList, /<input id=\{optionId\} type="checkbox" checked=\{checked\} onChange=\{\(event\) => toggle\(risk\.riskId, event\.target\.checked\)\}/u);
  assert.match(riskList, /selectedRiskIds\.includes\(riskId\)/u);
  assert.match(riskList, /selectedRiskIds\.filter\(\(selectedRiskId\) => selectedRiskId !== riskId\)/u);
  const optionMarkup = riskList.slice(riskList.indexOf('{options.map'), riskList.indexOf('</div>', riskList.indexOf('{options.map')));
  assert.doesNotMatch(optionMarkup, /onClick=/u);
  assert.match(riskStyles, /\.options \{[\s\S]*display: flex;[\s\S]*flex-wrap: wrap;/u);
  assert.match(riskStyles, /\.option:focus-within \{[\s\S]*outline:/u);
  assert.match(riskStyles, /\.selected \{[\s\S]*background: var\(--color-brand-subtle\)/u);
  assert.match(riskStyles, /@media \(max-width: 640px\)[\s\S]*\.option \{ flex: 1 1 min\(100%, 240px\); \}/u);
});

test('successful modal creation replaces New Repair with one route-driven Detail overlay', () => {
  const submit = form.slice(form.indexOf('async function submit'), form.indexOf('const allValidationIssues'));
  const createIndex = submit.indexOf('await createRepair(');
  const refreshIndex = submit.indexOf("new CustomEvent('srtaller:repairs-changed')");
  const navigationIndex = submit.indexOf('await navigate(`/reparaciones/${repair.id}');

  assert.ok(createIndex >= 0);
  assert.ok(refreshIndex > createIndex);
  assert.ok(navigationIndex > refreshIndex);
  assert.match(submit, /const backgroundLocation = routeState\?\.backgroundLocation/u);
  assert.match(submit, /await navigate\(`\/reparaciones\/\$\{repair\.id\}\$\{backgroundLocation\?\.search \?\? ''\}`,[\s\S]*replace: true,[\s\S]*backgroundLocation,[\s\S]*returnTo: routeState\?\.returnTo \?\? '\/reparaciones',[\s\S]*restoreFocusSelector: `\[data-repair-detail-trigger="\$\{repair\.id\}"\]`/u);
  assert.match(submit, /catch \(cause: unknown\) \{[\s\S]*setError\([\s\S]*setSaving\(false\);[\s\S]*\}/u);
  const failurePath = submit.slice(submit.indexOf('} catch (cause: unknown)'));
  assert.doesNotMatch(failurePath, /navigate\(/u);
  assert.doesNotMatch(failurePath, /setDirty\(false\)/u);

  assert.match(app, /<Routes location=\{backgroundLocation \?\? location\}>/u);
  assert.match(app, /backgroundLocation && hasOperationalCapability\(capabilities, 'repairs\.read'\)/u);
  assert.equal((app.match(/path="\/reparaciones\/:id"/gu) ?? []).length, 2);
  assert.equal((app.match(/host="overlay"/gu) ?? []).length, 1);
  assert.match(detail, /if \(host === 'overlay'\)[\s\S]*<Dialog[\s\S]*onClose=\{closeWorkspace\}/u);
  assert.match(detail, /const closeWorkspace = useCallback\(\(\) => \{[\s\S]*navigate\(-1\)/u);
  assert.match(detail, /return <div className=\{`\$\{styles\.pageStack\} \$\{styles\.detailPage\}`\}>\{header\}\{content\}<\/div>/u);
});
