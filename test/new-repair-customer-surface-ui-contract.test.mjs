import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const formSource = await readFile('apps/dev-preview-web/src/pages/NewRepairPage.tsx', 'utf8');
const pagesSource = await readFile('apps/dev-preview-web/src/pages/pages.module.css', 'utf8');
const uiSource = await readFile('apps/dev-preview-web/src/components/ui/ui.module.css', 'utf8');
const autocompleteSource = await readFile('apps/dev-preview-web/src/components/ui/SearchAutocomplete.tsx', 'utf8');

function sourceBetween(source, startMarker, endMarker) {
  const start = source.indexOf(startMarker);
  const end = source.indexOf(endMarker, start + startMarker.length);
  assert.notEqual(start, -1, `missing source marker: ${startMarker}`);
  assert.notEqual(end, -1, `missing source marker: ${endMarker}`);
  return source.slice(start, end);
}

test('Customer results use a bounded floating listbox and do not add a permanent form row', () => {
  assert.match(formSource, /className=\{styles\.customerFields\}/u);
  assert.match(formSource, /<SearchAutocomplete[\s\S]*label="Clientes coincidentes"[\s\S]*width="wide"/u);
  assert.match(autocompleteSource, /role="listbox" aria-label=\{label\}/u);
  assert.match(uiSource, /\.searchAutocompletePopover \{[\s\S]*position: fixed;[\s\S]*max-height: min\(260px, attr\(data-max-height px\)\);[\s\S]*overflow-y: auto;/u);
  assert.match(autocompleteSource, /createPortal\(popover, portalHost\)/u);
  assert.match(uiSource, /\.searchAutocompleteWide \{ --autocomplete-min-width: 420px; --autocomplete-max-width: 500px; \}/u);
  assert.match(formSource, /secondary: formatCustomerPhone\(candidate\.matchedPhone \?\? candidate\.contactPhone\)/u);
  assert.doesNotMatch(formSource, /Customer seleccionado · ID interno|Tenant ID|Branch ID/u);
});

test('Customer lookup preserves debounce, explicit selection and combobox keyboard semantics', () => {
  assert.match(formSource, /window\.setTimeout\(\(\) => \{[\s\S]*searchCustomers\(term, controller\.signal\)[\s\S]*\}, 250\)/u);
  assert.match(formSource, /autocompleteInputProps\(`\$\{prefix\}-customerOptions`, customerLookupFocused && candidates\.length > 0/u);
  assert.match(autocompleteSource, /role: 'combobox'/u);
  assert.match(autocompleteSource, /'aria-activedescendant': activeOptionId/u);
  assert.match(formSource, /event\.key === 'ArrowDown'/u);
  assert.match(formSource, /event\.key === 'ArrowUp'/u);
  assert.match(formSource, /event\.key === 'Enter' && activeCustomerIndex >= 0/u);
  assert.match(formSource, /onDismiss=\{dismissCustomerAutocomplete\}/u);
  assert.match(autocompleteSource, /event\.key !== 'Escape'[\s\S]*event\.preventDefault\(\)[\s\S]*event\.stopPropagation\(\)[\s\S]*onDismiss\(\)/u);
  assert.match(autocompleteSource, /onMouseDown=\{\(event\) => event\.preventDefault\(\)\}/u);
  assert.match(formSource, /Buscando coincidencias…/u);
  assert.match(formSource, /Sin coincidencias\. Puedes continuar como cliente nuevo\./u);
  assert.match(formSource, /No fue posible buscar clientes\./u);
});

test('selected Customer is a compact linked state with separate Cambiar and Quitar actions', () => {
  assert.match(formSource, /Cliente vinculado/u);
  assert.match(formSource, /formatCustomerPhone\(selectedCustomer\.matchedPhone \?\? selectedCustomer\.contactPhone\)/u);
  assert.match(formSource, /onClick=\{changeSelectedCustomer\}>Cambiar<\/Button>/u);
  assert.match(formSource, /onClick=\{removeSelectedCustomer\}>Quitar<\/Button>/u);
  assert.match(pagesSource, /\.selectedCustomerIdentity \{[^}]*grid-template-columns: auto minmax\(0, 1fr\) auto/u);
  assert.match(pagesSource, /\.linkedCustomerStatus \{[^}]*color: var\(--color-success\)[^}]*background: var\(--color-success-subtle\)/u);
});

test('Cambiar and Quitar only release the Customer link and preserve captured form data', () => {
  const changeCustomer = sourceBetween(formSource, 'function changeSelectedCustomer(): void {', 'function removeSelectedCustomer(): void {');
  const removeCustomer = sourceBetween(formSource, 'function removeSelectedCustomer(): void {', 'function handleCustomerComboboxKeyDown');
  for (const action of [changeCustomer, removeCustomer]) {
    assert.match(action, /setSelectedCustomer\(null\)/u);
    assert.match(action, /setAddCustomerContactPhone\(false\)/u);
    assert.doesNotMatch(action, /setGivenName\(|setFamilyName\(|setPhone\(|setDevice|setReportedProblems|setWarrantyReview|setDifferentDeliverer|setRequiresRiskAcceptance|setInitialBudgetAmount/u);
  }
  assert.match(changeCustomer, /setCustomerLookupSuppressed\(false\)/u);
  assert.match(removeCustomer, /setCustomerLookupSuppressed\(true\)/u);
  assert.match(formSource, /customerId: selectedCustomer\?\.id \?\? null/u);
});

test('Customer phone hydration is safe and Customer ownership remains an explicit opt-in', () => {
  const chooseCustomer = sourceBetween(formSource, 'function chooseCustomer(candidate: CustomerCandidate): void {', 'function changeSelectedCustomer(): void {');
  assert.match(chooseCustomer, /resolveCustomerPhoneSelection\(\{ countryCode, phone, candidate \}\)/u);
  assert.match(chooseCustomer, /setCountryCode\(resolvedPhone\.countryCode\)/u);
  assert.match(chooseCustomer, /setPhone\(resolvedPhone\.phone\)/u);
  assert.match(formSource, /canOfferCustomerPhoneOwnership\(\{ candidate: selectedCustomer, countryCode, phone \}\)/u);
  assert.match(formSource, /candidate\.matchedPhone \?\? candidate\.contactPhone/u);
  assert.match(formSource, /Guardar también en el cliente/u);
  assert.match(formSource, /Agregar este número al cliente/u);
  assert.match(formSource, /checked=\{addCustomerContactPhone\}/u);
  assert.match(formSource, /canAddCustomerContactPhone && addCustomerContactPhone \? \{ addCustomerContactPhone: true \} : \{\}/u);
  assert.match(formSource, /normalized\.startsWith\(callingCode\) && normalized\.length > 10/u);
  assert.match(formSource, /setPhone\(nationalPhone\(event\.currentTarget\.value, countryCode\)\)/u);
  assert.match(formSource, /normalized\.startsWith\('52'\) && normalized\.length === 12/u);
  assert.match(formSource, /`\+52 \$\{national\.slice\(0, 3\)\} \$\{national\.slice\(3, 6\)\} \$\{national\.slice\(6\)\}`/u);
});

test('FormSection owns the section surface while operational and conditional groups use level three surfaces', () => {
  assert.match(pagesSource, /\.classicModalForm \{[^}]*background: var\(--color-surface-subtle\)/u);
  assert.match(uiSource, /\.formSection \{[^}]*border: 1px solid var\(--color-border\)[^}]*background: var\(--color-surface-raised\)[^}]*box-shadow: var\(--shadow-sm\)/u);
  assert.match(uiSource, /\.formSectionCompact > header \{[^}]*border-bottom: 1px solid var\(--color-border\)[^}]*background: var\(--color-surface-subtle\)/u);
  assert.match(pagesSource, /\.binaryField \{[^}]*background: var\(--color-surface-subtle\)/u);
  assert.match(pagesSource, /\.conditionalPanel \{[^}]*background: var\(--color-surface-subtle\)[^}]*inset 2px 0 0 var\(--color-brand-border\)/u);
  assert.match(pagesSource, /\.commitmentField \{[^}]*background: var\(--color-surface-subtle\)/u);
});

test('Customer layout responds at 640 and 1024 without exceeding its available width', () => {
  assert.match(pagesSource, /@media \(max-width: 640px\) \{[\s\S]*\.selectedCustomerActions > button \{ flex: 1; \}/u);
  assert.match(pagesSource, /@media \(min-width: 640px\) \{[\s\S]*\.customerFields \{ grid-template-columns: repeat\(2, minmax\(0, 1fr\)\); \}/u);
  assert.match(pagesSource, /@media \(min-width: 1024px\) \{[\s\S]*\.customerFields \{ grid-template-columns: repeat\(3, minmax\(0, 1fr\)\); \}/u);
  assert.match(autocompleteSource, /const availableWidth = Math\.max\(1, boundary\.right - boundary\.left\)[\s\S]*Math\.min\(availableWidth, widthPolicy\.max/u);
});
