import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const overlaySource = await readFile('apps/dev-preview-web/src/components/ui/overlays.tsx', 'utf8');

function section(source, startMarker, endMarker) {
  const start = source.indexOf(startMarker);
  const end = source.indexOf(endMarker, start + startMarker.length);
  assert.notEqual(start, -1, `missing source marker: ${startMarker}`);
  assert.notEqual(end, -1, `missing source marker: ${endMarker}`);
  return source.slice(start, end);
}

test('a controlled dialog update keeps its focus trap installed while Escape uses the latest callback', () => {
  const focusTrap = section(overlaySource, 'export function useFocusTrap(', '\nexport function Dialog(');
  const lifecycle = section(focusTrap, '  useEffect(() => {\n    if (!active', '\n}\n');

  assert.match(focusTrap, /const onEscapeRef = useRef\(onEscape\);/u);
  assert.match(focusTrap, /useEffect\(\(\) => \{\n    onEscapeRef\.current = onEscape;\n  \}, \[onEscape\]\);/u);
  assert.match(lifecycle, /onEscapeRef\.current\(\);/u);
  assert.match(lifecycle, /\}, \[active, container, restoreFocusSelector\]\);/u);
  assert.doesNotMatch(lifecycle, /\[active, container, onEscape, restoreFocusSelector\]/u);
});

test('the focus trap retains keyboard cycling and close restoration contracts', () => {
  const focusTrap = section(overlaySource, 'export function useFocusTrap(', '\nexport function Dialog(');

  assert.match(focusTrap, /event\.shiftKey && document\.activeElement === first/u);
  assert.match(focusTrap, /!event\.shiftKey && document\.activeElement === last/u);
  assert.match(focusTrap, /last\?\.focus\(\);/u);
  assert.match(focusTrap, /first\?\.focus\(\);/u);
  assert.match(focusTrap, /window\.requestAnimationFrame\(\(\) => \{/u);
  assert.match(focusTrap, /\(explicitTarget \?\? previous\)\?\.focus\(\);/u);
});

test('the focus trap leaves Escape consumed by a nested interaction alone', () => {
  const focusTrap = section(overlaySource, 'export function useFocusTrap(', '\nexport function Dialog(');

  assert.match(focusTrap, /if \(event\.key === 'Escape'\) \{\n        if \(event\.defaultPrevented\) return;\n        event\.preventDefault\(\);\n        onEscapeRef\.current\(\);/u);
});

test('dialog removes background inertness before restoring trigger focus', () => {
  const dialogStart = overlaySource.indexOf('export function Dialog(');
  assert.notEqual(dialogStart, -1);
  const dialog = overlaySource.slice(dialogStart);
  const inertLifecycle = dialog.indexOf("document.body.classList.add('srt-dialog-open')");
  const focusLifecycle = dialog.indexOf('useFocusTrap(open, dialogRef, onClose, restoreFocusSelector);');

  assert.notEqual(inertLifecycle, -1);
  assert.notEqual(focusLifecycle, -1);
  assert.equal(inertLifecycle < focusLifecycle, true);
});
