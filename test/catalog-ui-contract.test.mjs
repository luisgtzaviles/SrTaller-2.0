import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const [app, shell, page, api, preferences, combobox, catalogsPage, commercialCatalogs] = await Promise.all([
  readFile('apps/dev-preview-web/src/App.tsx', 'utf8'),
  readFile('apps/dev-preview-web/src/components/shell/ApplicationShell.tsx', 'utf8'),
  readFile('apps/dev-preview-web/src/pages/PriceListPage.tsx', 'utf8'),
  readFile('apps/dev-preview-web/src/catalog-api.ts', 'utf8'),
  readFile('apps/dev-preview-web/src/user-preferences/UserPreferencesProvider.tsx', 'utf8'),
  readFile('apps/dev-preview-web/src/components/CatalogReferenceCombobox.tsx', 'utf8'),
  readFile('apps/dev-preview-web/src/pages/RepairCatalogsPage.tsx', 'utf8'),
  readFile('apps/dev-preview-web/src/components/CatalogPriceListReferencesPanel.tsx', 'utf8'),
]);

test('price list is capability-gated and is the only initial Listas destination', () => {
  assert.match(app, /path="\/listas\/precios"[\s\S]*capability="price_list\.read"/u);
  assert.match(shell, /group: 'Listas', items: listNavigation/u);
  assert.match(shell, /to: '\/listas\/precios', label: 'Lista de precios'[\s\S]*requiredCapability: 'price_list\.read'/u);
  assert.doesNotMatch(shell, /Pedidos|Solicitudes de clientes/u);
  const listBlock = shell.match(/const listNavigation[\s\S]*?\n\]\);/u)?.[0] ?? '';
  assert.equal((listBlock.match(/\{ to:/gu) ?? []).length, 1);
});

test('Owner iteration centralizes governance and keeps operation reconciliable', () => {
  assert.match(catalogsPage, /Lista de precios/u);
  assert.match(commercialCatalogs, /CatalogReconciliationSummary/u);
  assert.match(commercialCatalogs, /Valor capturado/u);
  assert.match(commercialCatalogs, /Asociar a referencia existente/u);
  assert.match(commercialCatalogs, /Crear referencia canónica/u);
  assert.doesNotMatch(commercialCatalogs, /Aprobar/u);
  assert.match(commercialCatalogs, /Fusionar seleccionados/u);
  assert.match(commercialCatalogs, /Referencia superviviente/u);
  assert.match(commercialCatalogs, /reassignedItemCount/u);
  assert.match(api, /mergeCatalogCategories/u);
  assert.match(api, /mergeCatalogBrands/u);
  assert.match(commercialCatalogs, /applicableKinds/u);
  assert.match(page, /CatalogReferenceCombobox/u);
  assert.match(combobox, /autocompleteInputProps/u);
  assert.match(combobox, /event\.key === 'Enter'[\s\S]*choose\(safeActiveIndex\)/u);
  assert.match(combobox, /Usar “\$\{query\.trim\(\)\}”/u);
  assert.match(combobox, /valor Por revisar al guardar el artículo/u);
  assert.match(api, /export function normalizeCatalogReferenceText/u);
  assert.match(combobox, /const exactCompatible = references\.find/u);
  assert.match(combobox, /value !== exactCompatibleId\) onChange\(exactCompatibleId\)/u);
  assert.match(combobox, /const exactExpansion = expansionReferences\.find/u);
  assert.match(combobox, /\(onExpand \?\? onCapture\)\(exactExpansion\.name\)/u);
  assert.match(combobox, /!exact/u);
  assert.match(page, /Se reutilizará la marca/u);
  assert.match(page, /canCreate=\{canManage\}/u);
  assert.match(page, /categoryCapturedValue/u);
  assert.match(page, /brandCapturedValue/u);
  assert.match(page, /key=\{`catalog-category-\$\{kind\}`\}/u);
  assert.match(commercialCatalogs, /exactCanonicalMatch/u);
  assert.match(commercialCatalogs, /disabled=\{exactCanonicalMatch !== null\}/u);
  assert.match(commercialCatalogs, /Ya existe la/u);
  assert.match(commercialCatalogs, /Asóciala a esa referencia/u);
  assert.doesNotMatch(combobox, /createCatalogCategory|createCatalogBrand/u);
  assert.match(page, /setDialog\('create'\); setNotice\(null\)/u);
  assert.match(page, /setDialog\(null\); setNotice\(null\); requestId\.current = null/u);
  assert.match(combobox, /onSelect=\{\(index\) => \{ void choose\(index\); \}\}/u);
  assert.doesNotMatch(page, />Catálogos comerciales</u);
  assert.match(page, /Limpiamos Categoría o Marca porque no aplican al nuevo Tipo/u);
  assert.match(page, /Automático si lo dejas vacío/u);
  assert.match(page, /label="Código de barras" hint="Automático si lo dejas vacío\."/u);
  assert.doesNotMatch(page, /Código interno|GTIN|EAN|UPC|Esquema externo|externalIdentifier/u);
  assert.match(commercialCatalogs, /<CatalogSectionTabs/u);
  assert.match(commercialCatalogs, /<CatalogLifecycleFilter/u);
  assert.match(commercialCatalogs, /data-status=\{reference\.status\.toLowerCase\(\)\}/u);
});

test('price lookup sends no cost request unless capability and personal preference both allow it', () => {
  assert.match(page, /const includeCost = canReadCost && preferences\.priceListShowReferenceCost/u);
  assert.match(api, /if \(input\.includeReferenceCost\) query\.set\('includeReferenceCost', 'true'\)/u);
  assert.match(preferences, /useState\(false\)/u);
  assert.match(page, /value\.referenceCost \? <small>Costo ref\./u);
});

test('price lookup composes URL-aware cascading commercial filters without offering incompatible pairs', () => {
  assert.match(page, /const \[searchParams, setSearchParams\] = useSearchParams\(\)/u);
  assert.match(page, /const filterKind = priceListKind\(searchParams\.get\('kind'\)\)/u);
  assert.match(page, /categoryBrandApplicability/u);
  assert.match(page, /const filterCategories = useMemo\(\(\) => filterKind/u);
  assert.match(page, /const filterBrands = useMemo\(\(\) => commercialBrands\.filter/u);
  assert.match(page, /const changeFilterKind = \(nextKind/u);
  assert.match(page, /const changeFilterCategory = \(nextCategoryId/u);
  assert.match(page, />Buscar</u);
  assert.match(page, />Tipo</u);
  assert.match(page, />Categoría</u);
  assert.match(page, />Marca</u);
  assert.match(page, /Todos los tipos/u);
  assert.match(page, /Todas las categorías/u);
  assert.match(page, /Todas las marcas/u);
  assert.match(api, /if \(input\.kind\) query\.set\('kind', input\.kind\)/u);
  assert.match(api, /categoryBrandApplicability/u);
  assert.match(page, /kind: filterKind, categoryId, brandId/u);
});

test('price list covers commercial states and links the separately authorized bulk composer', () => {
  assert.match(page, /Refacción/u);
  assert.match(page, /Producto/u);
  assert.match(page, /Servicio/u);
  assert.match(page, /Insumo \(no aparece en Lista\)/u);
  assert.match(page, /Base Tenant/u);
  assert.match(page, /Override Branch/u);
  assert.match(page, /Sin precio/u);
  assert.match(page, /Artículo creado y disponible en la lista/u);
  assert.match(page, /Insumo creado en catálogo; no forma parte/u);
  assert.match(page, /catalog\.import\.prepare/u);
  assert.match(page, /Carga masiva/u);
  assert.doesNotMatch(page, /Inventario|Importar proveedor/u);
});

test('catalog browser transport keeps credentials, CSRF and no-store on the governed API', () => {
  assert.match(api, /credentials: 'include', cache: 'no-store'/u);
  assert.match(api, /'X-SR-CSRF-Token': csrfToken/u);
  assert.match(api, /encodeURIComponent\(itemId\)/u);
  assert.match(page, /placeholder="Buscar por nombre, SKU o código…"/u);
  assert.match(api, /pageSize: '25'/u);
});
