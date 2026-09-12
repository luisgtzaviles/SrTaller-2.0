import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const [app, shell, page, api, preferences] = await Promise.all([
  readFile('apps/dev-preview-web/src/App.tsx', 'utf8'),
  readFile('apps/dev-preview-web/src/components/shell/ApplicationShell.tsx', 'utf8'),
  readFile('apps/dev-preview-web/src/pages/PriceListPage.tsx', 'utf8'),
  readFile('apps/dev-preview-web/src/catalog-api.ts', 'utf8'),
  readFile('apps/dev-preview-web/src/user-preferences/UserPreferencesProvider.tsx', 'utf8'),
]);

test('price list is capability-gated and is the only initial Listas destination', () => {
  assert.match(app, /path="\/listas\/precios"[\s\S]*capability="price_list\.read"/u);
  assert.match(shell, /group: 'Listas', items: listNavigation/u);
  assert.match(shell, /to: '\/listas\/precios', label: 'Lista de precios'[\s\S]*requiredCapability: 'price_list\.read'/u);
  assert.doesNotMatch(shell, /Pedidos|Solicitudes de clientes/u);
  const listBlock = shell.match(/const listNavigation[\s\S]*?\n\]\);/u)?.[0] ?? '';
  assert.equal((listBlock.match(/\{ to:/gu) ?? []).length, 1);
});

test('price lookup sends no cost request unless capability and personal preference both allow it', () => {
  assert.match(page, /const includeCost = canReadCost && preferences\.priceListShowReferenceCost/u);
  assert.match(api, /if \(input\.includeReferenceCost\) query\.set\('includeReferenceCost', 'true'\)/u);
  assert.match(preferences, /useState\(false\)/u);
  assert.match(page, /value\.referenceCost \? <small>Costo ref\./u);
});

test('price list covers commercial states without claiming Inventory or bulk import', () => {
  assert.match(page, /Refacción/u);
  assert.match(page, /Producto/u);
  assert.match(page, /Servicio/u);
  assert.match(page, /Insumo \(no aparece en Lista\)/u);
  assert.match(page, /Base Tenant/u);
  assert.match(page, /Override Branch/u);
  assert.match(page, /Sin precio/u);
  assert.match(page, /Artículo creado y disponible en la lista/u);
  assert.match(page, /Insumo creado en catálogo; no forma parte/u);
  assert.doesNotMatch(page, /Inventario|Carga masiva|Importar proveedor/u);
});

test('catalog browser transport keeps credentials, CSRF and no-store on the governed API', () => {
  assert.match(api, /credentials: 'include', cache: 'no-store'/u);
  assert.match(api, /'X-SR-CSRF-Token': csrfToken/u);
  assert.match(api, /encodeURIComponent\(itemId\)/u);
  assert.match(page, /placeholder="Buscar por nombre, SKU o código…"/u);
  assert.match(api, /pageSize: '25'/u);
});
