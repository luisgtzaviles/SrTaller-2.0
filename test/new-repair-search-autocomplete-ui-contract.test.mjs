import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const [autocomplete, ui, overlays, base, tokens, form, problems, problemsCss] = await Promise.all([
  readFile('apps/dev-preview-web/src/components/ui/SearchAutocomplete.tsx', 'utf8'),
  readFile('apps/dev-preview-web/src/components/ui/ui.module.css', 'utf8'),
  readFile('apps/dev-preview-web/src/components/ui/overlays.tsx', 'utf8'),
  readFile('apps/dev-preview-web/src/styles/base.css', 'utf8'),
  readFile('apps/dev-preview-web/src/styles/tokens.css', 'utf8'),
  readFile('apps/dev-preview-web/src/pages/NewRepairPage.tsx', 'utf8'),
  readFile('apps/dev-preview-web/src/components/ReportedProblemsInput.tsx', 'utf8'),
  readFile('apps/dev-preview-web/src/components/reported-problems-input.module.css', 'utf8'),
]);

test('one presentational SearchAutocomplete owns shared popover, result rows and status states', () => {
  assert.doesNotMatch(autocomplete, /api\.js|Customer|Brand|RepairWorklist|reportedProblem/u);
  assert.match(autocomplete, /primary: ReactNode/u);
  assert.match(autocomplete, /secondary\?: ReactNode/u);
  assert.match(autocomplete, /tertiary\?: ReactNode/u);
  assert.match(autocomplete, /meta\?: ReactNode/u);
  assert.match(autocomplete, /icon\?: ReactNode/u);
  assert.match(autocomplete, /badge\?: ReactNode/u);
  for (const state of ["'loading'", "'empty'", "'error'"]) assert.match(autocomplete, new RegExp(state, 'u'));
  assert.match(autocomplete, /retryLabel/u);
  assert.match(autocomplete, /createPortal\(popover, portalHost\)/u);
  assert.match(autocomplete, /closest<HTMLElement>\('\[role="dialog"\]'\)[\s\S]*data-dialog-floating-root/u);
  assert.match(autocomplete, /spaceBelow < Math\.min\(160, spaceAbove\)[\s\S]*placement === 'above'/u);
  assert.match(autocomplete, /document\.addEventListener\('scroll', updatePosition, true\)/u);
  assert.match(autocomplete, /window\.addEventListener\('resize', updatePosition\)/u);
  assert.match(autocomplete, /new ResizeObserver\(updatePosition\)/u);
  assert.match(overlays, /data-dialog-floating-root="true"/u);
  assert.match(ui, /\.searchAutocompletePopover \{[\s\S]*position: fixed;[\s\S]*max-height: min\(260px, attr\(data-max-height px\)\);[\s\S]*overflow-y: auto;/u);
  assert.match(autocomplete, /data-left=\{floatingPosition\.left\}[\s\S]*data-max-height=\{floatingPosition\.maxHeight\}/u);
  assert.match(ui, /\.dialogFloatingRoot \{[\s\S]*position: fixed;[\s\S]*overflow: visible;[\s\S]*pointer-events: none;/u);
  assert.match(ui, /\.searchAutocompleteOption \{[\s\S]*min-height: 48px;/u);
});

test('Customer, Device Type, Brand, Model, Problems and Previous Repair consume the shared primitive', () => {
  assert.equal((form.match(/<SearchAutocomplete/gu) ?? []).length, 5);
  assert.equal((problems.match(/<SearchAutocomplete/gu) ?? []).length, 1);
  for (const label of ['Clientes coincidentes', 'Tipos de equipo sugeridos', 'Marcas sugeridas', 'Modelos sugeridos', 'Reparaciones coincidentes']) assert.match(form, new RegExp(`label="${label}"`, 'u'));
  assert.match(problems, /label="Categorías de problema sugeridas"/u);
  assert.doesNotMatch(form, /styles\.autocompleteMenu|styles\.customerAutocompleteLayer|styles\.brandAutocomplete/u);
  assert.doesNotMatch(problems, /styles\.menu/u);
  assert.doesNotMatch(problemsCss, /\.menu \{/u);
});

test('the shared combobox contract preserves keyboard, pointer and focus behavior', () => {
  assert.match(autocomplete, /role: 'combobox'/u);
  assert.match(autocomplete, /'aria-autocomplete': 'list'/u);
  assert.match(autocomplete, /'aria-expanded': expanded/u);
  assert.match(autocomplete, /'aria-controls': listboxId/u);
  assert.match(autocomplete, /'aria-activedescendant': activeOptionId/u);
  assert.match(autocomplete, /role="listbox"/u);
  assert.match(autocomplete, /role="option"/u);
  assert.match(autocomplete, /tabIndex=\{-1\}/u);
  assert.match(autocomplete, /onMouseDown=\{\(event\) => event\.preventDefault\(\)\}/u);
  assert.match(autocomplete, /focused: boolean/u);
  assert.match(autocomplete, /onFocusCapture=\{\(\) => onFocusWithinChange\(true\)\}/u);
  assert.match(autocomplete, /popoverRef\.current\?\.contains\(nextTarget\)/u);
  assert.match(autocomplete, /onFocusWithinChange\(false\)/u);
  for (const focusState of ['customerLookupFocused', 'deviceTypeLookupFocused', 'brandLookupFocused', 'modelLookupFocused', 'previousRepairLookupFocused']) {
    assert.match(form, new RegExp(`focused=\\{${focusState}\\}`, 'u'));
  }
  assert.match(problems, /focused=\{lookupFocused\}/u);
  for (const key of ['ArrowDown', 'ArrowUp', 'Enter']) assert.match(`${form}\n${problems}`, new RegExp(key, 'u'));
  assert.match(autocomplete, /event\.key !== 'Escape'/u);
});

test('Escape dismisses the shared popover without reaching the outer dialog', () => {
  assert.match(autocomplete, /onDismiss\(\): void/u);
  assert.match(autocomplete, /onKeyDownCapture=\{\(event\) => \{[\s\S]*event\.key !== 'Escape' \|\| !popoverVisible[\s\S]*event\.preventDefault\(\);[\s\S]*event\.stopPropagation\(\);[\s\S]*onDismiss\(\);/u);
  assert.match(overlays, /if \(event\.key === 'Escape'\) \{[\s\S]*if \(event\.defaultPrevented\) return;[\s\S]*onEscapeRef\.current\(\);/u);
  assert.equal((form.match(/onDismiss=/gu) ?? []).length, 5);
  assert.equal((problems.match(/onDismiss=/gu) ?? []).length, 1);
  assert.match(form, /function dismissPreviousRepairAutocomplete\(\): void \{[\s\S]*setPreviousRepairCandidates\(\[\]\);[\s\S]*setPreviousRepairLookupState\('idle'\);/u);
  const previousDismiss = form.slice(form.indexOf('function dismissPreviousRepairAutocomplete'), form.indexOf('function chooseBrand'));
  assert.doesNotMatch(previousDismiss, /setPreviousRepairQuery/u);
  assert.doesNotMatch(problems, /event\.key === 'Escape'/u);
});

test('application-owned suggestions suppress browser autofill without weakening field semantics', () => {
  assert.match(autocomplete, /type: inputKind === 'telephone' \? 'tel' : 'search'/u);
  assert.match(autocomplete, /autoComplete: 'off'/u);
  assert.doesNotMatch(form, /autoComplete="(?:given-name|family-name|tel-national)"/u);
  assert.doesNotMatch(form, /<form[^>]*autoComplete=/u);
  assert.match(form, /inputMode="numeric"[\s\S]*autocompleteInputProps\([^)]*'telephone'\)/u);
  assert.match(form, /type=\{deviceAccessSecretVisible \? 'text' : 'password'\}[\s\S]*autoComplete="one-time-code"/u);
  assert.equal((form.match(/autocompleteInputProps\(/gu) ?? []).length, 7);
  assert.equal((problems.match(/autocompleteInputProps\(/gu) ?? []).length, 1);
});

test('focus and modal density are tokenized and refined without changing control semantics', () => {
  assert.match(tokens, /--focus-ring-width: 2px/u);
  assert.match(tokens, /--focus-ring-offset: 1px/u);
  assert.match(base, /outline: var\(--focus-ring-width\) solid var\(--color-brand-focus\)/u);
  assert.match(ui, /\.input:focus \{[^}]*box-shadow: none/u);
  assert.match(ui, /\.dialogWorkspace \{ width: min\(1180px, 92vw\)/u);
  assert.match(ui, /\.formSectionCompact > header \{ padding: var\(--space-1\) var\(--space-3\)/u);
});

test('Previous Repair selected state stays compact and supports explicit change or removal', () => {
  assert.match(form, /className=\{styles\.selectedPreviousRepairActions\}/u);
  assert.match(form, /onClick=\{changePreviousRepair\}>Cambiar<\/Button>/u);
  assert.match(form, /onClick=\{removePreviousRepair\}>Quitar<\/Button>/u);
  assert.match(form, /previousRepairId: selectedPreviousRepair\?\.id/u);
});

test('Reported Problems keeps multivalue free-entry and pending reconciliation semantics', () => {
  assert.match(problems, /value\.length >= 12/u);
  assert.match(problems, /add\(query, null\)/u);
  assert.match(problems, /categoryId/u);
  assert.match(problems, /El texto libre no bloquea la recepción y queda por revisar/u);
  assert.match(problems, /className=\{styles\.chips\}/u);
});
