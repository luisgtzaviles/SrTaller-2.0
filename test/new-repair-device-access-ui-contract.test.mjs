import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import { addDevicePatternNode, isDevicePatternValid, MAX_DEVICE_PATTERN_NODES, MIN_DEVICE_PATTERN_NODES } from '../apps/dev-preview-web/src/device-access-pattern.mjs';

const formSource = await readFile('apps/dev-preview-web/src/pages/NewRepairPage.tsx', 'utf8');
const patternDialogSource = await readFile('apps/dev-preview-web/src/components/DevicePatternDialog.tsx', 'utf8');
const pagesSource = await readFile('apps/dev-preview-web/src/pages/pages.module.css', 'utf8');
const controlsSource = await readFile('apps/dev-preview-web/src/components/ui/controls.tsx', 'utf8');
const uiSource = await readFile('apps/dev-preview-web/src/components/ui/ui.module.css', 'utf8');
const apiSource = await readFile('apps/dev-preview-web/src/api.ts', 'utf8');
const useCaseSource = await readFile('src/modules/repairs/application/use-cases/create-repair.use-case.ts', 'utf8');
const migrationSource = await readFile('src/infrastructure/database/migrations/20260908114000_repairs_expand_avicell_reception.ts', 'utf8');

function section(source, startMarker, endMarker) {
  const start = source.indexOf(startMarker);
  const end = source.indexOf(endMarker, start + startMarker.length);
  assert.notEqual(start, -1, `missing source marker: ${startMarker}`);
  assert.notEqual(end, -1, `missing source marker: ${endMarker}`);
  return source.slice(start, end);
}

test('the reception row keeps required controls together before optional accessories', () => {
  const sim = formSource.indexOf("visible('simIncluded')");
  const memory = formSource.indexOf("visible('memoryCardIncluded')");
  const power = formSource.indexOf("visible('receivedPowerState')");
  const accessories = formSource.indexOf('Registrar otros accesorios');
  assert.ok(sim >= 0 && sim < memory && memory < power && power < accessories);
  assert.match(formSource, /name="simIncluded" value="no" required=\{requiredByPolicy\('simIncluded'\)\}/u);
  assert.match(formSource, /name="memoryCardIncluded" value="no" required=\{requiredByPolicy\('memoryCardIncluded'\)\}/u);
  assert.match(formSource, /name="receivedPowerState" value="powered_on" required=\{requiredByPolicy\('receivedPowerState'\)\}/u);
});

test('Classic sections follow Owner order and customer selection restores a useful focus target', () => {
  const client = formSource.indexOf('step={1} icon={UserRound}');
  const equipment = formSource.indexOf('step={2} icon={Smartphone}');
  const reception = formSource.indexOf('step={3} icon={ClipboardPenLine}');
  const access = formSource.indexOf('step={4} icon={LockKeyhole}');
  const commitment = formSource.indexOf('step={5} icon={CalendarClock}');
  assert.ok(client >= 0 && client < equipment && equipment < reception && reception < access && access < commitment);
  assert.match(formSource, /requestAnimationFrame\(\(\) => selectedCustomerChangeRef\.current\?\.focus\(\)\)/u);
  assert.match(formSource, /requestAnimationFrame\(\(\) => customerGivenNameRef\.current\?\.focus\(\)\)/u);
});

test('Classic visual hierarchy reuses tokenized Dialog and FormSection primitives', () => {
  assert.match(controlsSource, /icon\?: LucideIcon/u);
  assert.match(controlsSource, /className=\{classNames\(styles\.formSection,[^\n]*className\)\}/u);
  assert.match(uiSource, /\.dialogWorkspace > header \{[^}]*background: var\(--color-surface-subtle\)/u);
  assert.match(pagesSource, /\.classicModalForm \{[^}]*background: var\(--color-surface-subtle\)/u);
  assert.match(uiSource, /\.formSection \{[^}]*border: 1px solid var\(--color-border\)[^}]*border-radius: var\(--radius-lg\)[^}]*background: var\(--color-surface-raised\)[^}]*box-shadow: var\(--shadow-sm\)/u);
  assert.match(uiSource, /\.formSectionCompact > header \{[^}]*border-bottom: 1px solid var\(--color-border\)[^}]*background: var\(--color-surface-subtle\)/u);
  assert.match(pagesSource, /\.classicModalForm textarea \{[^}]*height: var\(--space-16\)/u);
  assert.match(pagesSource, /\.conditionalTriggers \{[^}]*grid-column: 1 \/ -1/u);
  assert.match(formSource, /Folio automático al guardar/u);
  assert.match(formSource, /Sin credencial de acceso para esta recepción/u);
});

test('Classic native controls expose design-system focus and coarse-pointer target states', () => {
  assert.match(pagesSource, /\.classicModalForm select:focus-visible/u);
  assert.match(pagesSource, /\.colorPicker button:focus-visible/u);
  assert.match(pagesSource, /\.inlineCheck input:focus-visible/u);
  assert.match(pagesSource, /\.binaryField input:focus-visible/u);
  assert.match(pagesSource, /@media \(pointer: coarse\)[\s\S]*var\(--touch-target\)/u);
  assert.match(pagesSource, /\.colorPicker button \{[^}]*min-height: var\(--control-compact\)/u);
});

test('PIN and password remain local protected values and are cleared on access-type changes', () => {
  assert.match(formSource, /<option value="none">Ninguno<\/option><option value="pin">PIN<\/option><option value="password">Contraseña<\/option><option value="pattern">Patrón<\/option>/u);
  assert.match(formSource, /type=\{deviceAccessSecretVisible \? 'text' : 'password'\}/u);
  assert.match(formSource, /autoComplete="one-time-code"/u);
  assert.match(formSource, /inputMode=\{deviceAccessType === 'pin' \? 'numeric' : 'text'\}/u);
  assert.match(formSource, /value=\{deviceAccessSecret\}/u);
  assert.match(formSource, /setDeviceAccessSecret\(''\);[\s\S]*setDevicePattern\(\[\]\);/u);
  assert.match(formSource, /function closeNow\(\): void \{\n    clearDeviceAccessSecrets\(\);/u);
  assert.doesNotMatch(formSource, /localStorage|sessionStorage|indexedDB|URLSearchParams/u);
  assert.doesNotMatch(formSource, /name=\{?[^\n>]*deviceAccessSecret/u);
});

test('pattern rules preserve order, allow jumps, reject repeats and accept two through nine nodes', () => {
  assert.equal(MIN_DEVICE_PATTERN_NODES, 2);
  assert.equal(MAX_DEVICE_PATTERN_NODES, 9);
  assert.equal(isDevicePatternValid([1]), false);

  let pattern = addDevicePatternNode([], 1);
  pattern = addDevicePatternNode(pattern, 3);
  assert.deepEqual(pattern, [1, 3]);
  assert.equal(isDevicePatternValid(pattern), true);

  const unchanged = addDevicePatternNode(pattern, 1);
  assert.strictEqual(unchanged, pattern);
  pattern = [1, 3, 9, 7, 2, 8, 4, 6, 5].reduce(addDevicePatternNode, []);
  assert.deepEqual(pattern, [1, 3, 9, 7, 2, 8, 4, 6, 5]);
  assert.equal(isDevicePatternValid(pattern), true);
  assert.strictEqual(addDevicePatternNode(pattern, 10), pattern);
  assert.equal(isDevicePatternValid([...pattern, 10]), false);
  assert.equal(isDevicePatternValid([1, 3, 1]), false);
});

test('pattern dialog supports pointer, click and keyboard-accessible dialog behavior', () => {
  assert.match(patternDialogSource, /title="Dibuja tu patrón"/u);
  assert.match(patternDialogSource, /onPointerDown=\{beginPointer\}/u);
  assert.match(patternDialogSource, /onPointerMove=\{movePointer\}/u);
  assert.match(patternDialogSource, /data-pattern-node=\{node\}/u);
  assert.match(patternDialogSource, /type="button"[\s\S]*aria-pressed=\{selected\}[\s\S]*onClick=\{\(\) => addNode\(node\)\}/u);
  assert.match(patternDialogSource, /disabled=\{!valid\}/u);
  assert.match(patternDialogSource, />Reiniciar<\/Button>[\s\S]*>Cancelar<\/Button>[\s\S]*>Guardar<\/Button>/u);
  assert.match(patternDialogSource, /restoreFocusSelector=\{restoreFocusSelector\}/u);
  assert.match(patternDialogSource, /if \(open\) setDraftPattern\(savedPattern\);/u);
  assert.match(formSource, /onCancel=\{\(\) => setPatternDialogOpen\(false\)\}/u);
  assert.match(formSource, /setDevicePattern\(pattern\);/u);
});

test('Create Repair transports only deviceAccessType and all secret-shaped keys remain excluded', () => {
  const payload = section(formSource, 'const repair = await createRepair({', '}, csrfToken);');
  assert.match(payload, /deviceAccessType:/u);
  assert.doesNotMatch(payload, /deviceAccessSecret|devicePattern|unlockSecret|patternSecret/u);
  for (const source of [apiSource, useCaseSource, migrationSource]) {
    assert.doesNotMatch(source, /deviceAccessSecret|device_access_secret|unlockSecret|patternSecret/u);
  }
  assert.match(useCaseSource, /if \(Object\.keys\(input\)\.some\(\(key\) => !allowedKeys\.includes\(key\)\)\) throw new CreateRepairInputError\('payload'\);/u);
});
