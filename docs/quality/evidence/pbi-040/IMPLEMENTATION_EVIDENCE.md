# PBI-040 — Implementation Evidence

## Checkpoint y autoridad

- **Checkpoint:** funcional listo para `Owner Review`; no equivale a `Done`.
- **Branch:** `feature/pbi-040-catalog-pricing-core`.
- **Baseline:** `40684d7554cdf02551f941e5e3f0beabbe563125` con CI de
  `main` `34623060504` SUCCESS.
- **Candidato de iteración Owner:** `c97c05d9c2dfe23858df69474c39a43435d4e22b`
  más hardening de backfill/ownership `37c3dde2c34f`; aceptación Owner todavía
  pendiente.
- **No autorizado/no realizado:** push, PR, merge, deploy, release o cambio de
  infraestructura.

## Resultado funcional

- `CatalogItem`, categorías, marcas e identificadores son Tenant-wide.
- Precio base Tenant-wide y override opcional de la Branch operativa conservan
  revisiones append-only; revocar el override restaura la herencia.
- Refacción, Producto y Servicio son oferta comercial. Insumo conserva identidad
  de catálogo, pero no aparece en Lista de precios.
- Moneda proviene de `Tenant.operatingCurrency`; Avicell recibe `MXN` por
  backfill explícito y no existe default estructural de moneda.
- Costo de referencia es opcional y queda omitido en servidor salvo que la
  sesión tenga `catalog.reference_cost.read`. La preferencia personal sólo
  decide si el cliente solicita mostrarlo.
- Alta/edición individual, lifecycle, navegación `Listas > Lista de precios`,
  búsqueda por tokens de nombre y coincidencia exacta de SKU/barcode, filtros y
  precio efectivo quedaron disponibles sin construir importación ni Files.
- Categoría y Marca son comboboxes escribibles, accesibles y filtrados por Tipo.
  Una creación explícita por Enter/click nace Por revisar, queda seleccionada y
  no descarta el draft; blur no crea datos.
- Configuración > Catálogos incorpora el módulo Lista de precios para gobernar
  aplicabilidad, lifecycle y reconciliación. Category pertenece a un Tipo;
  CommercialBrand conserva identidad Tenant-wide y puede aplicar a varios.
- SKU y código interno se resuelven server-side cuando quedan vacíos. El código
  interno permanece separado de GTIN/EAN/UPC externos.

### Iteración Owner — filtros encadenados

- `/listas/precios` conserva `q`, `kind`, `categoryId` y `brandId` en URL. Los
  cuatro criterios se aplican juntos en la búsqueda server-side; `SUPPLY` se
  rechaza como Tipo de esa ruta además de permanecer no vendible.
- Las opciones comerciales no contienen combinaciones escritas en UI: Tipo usa
  aplicabilidad de Category/Brand; Tipo + Categoría usa la proyección
  Tenant-scoped de pares presentes en `CatalogItem` activos y vendibles. Esa
  proyección es de lectura, no crea una asociación persistida ni duplica Brand
  por Category.
- El cambio de Tipo conserva sólo Category/Brand compatibles; cambiar
  Category conserva Brand sólo si existe el par aplicable. Los filtros
  incompatibles vuelven determinísticamente a Todos/Todas.

## Seguridad, persistencia y fronteras

- Ocho capabilities gobernadas separan consulta, identidad, precio base,
  override Branch, lectura/gestión de costo y la autoridad futura de importación.
- Administración Tenant-wide rechaza asignaciones sólo-Branch y combina los
  commit guards contextual y Tenant-wide antes del commit.
- Writes usan allowlists estrictas, CSRF, idempotencia, `expectedVersion`, actor,
  correlation y auditoría. Constraints Tenant-aware protegen referencias y la
  unicidad histórica de SKU/barcode/GTIN.
- Cinco migraciones aditivas materializan moneda operativa, capabilities,
  preferencia personal, Catalog/Pricing y gobierno de referencias. El rollback
  de aplicación conserva datos; no existe migración destructiva en el slice.
- DEC-005/policy registra la nueva frontera. Catalog/Pricing no adquiere
  ownership de Inventory, Procurement, Repair, Payments, Cash, Files, pedidos o
  solicitudes.

## Evidencia automatizada

- Build gobernado y pruebas focalizadas posteriores a la remediación del GET de
  detalle: `13/13 PASS`, cero skips.
- Base suite de iteración: `814` tests; `794 PASS`, `20` skips PostgreSQL gobernados, cero
  failures. Los skips se ejecutan en stages materiales separados.
- PostgreSQL PBI-040 de la iteración: `56` migraciones, cero skips; aislamiento
  de dos Tenants/dos Branches, aplicabilidad, Por revisar, aprobación/fusión,
  identificadores automáticos/explícitos, constraints y concurrencia.
- Benchmark PostgreSQL más reciente con `10,000` items: p95 `6.76 ms`, bajo el
  presupuesto fijado de `750 ms`.
- Suite PostgreSQL compuesta aislada: `5/5` suites, `17` tests PASS, cero skips.
- Campaña `verify:full` previa a esta iteración: `13/13` stages PASS,
  incluida UI smoke, runtime, schema/migrations y PBI-040 PostgreSQL.
- La campaña final de esta iteración se ejecuta sobre el HEAD documental
  reconciliado y su resultado se entrega en el handoff de Owner Review.
- La primera campaña de iteración falló correctamente en Stage 3: el backfill
  leía `catalog_items`, pero esa tabla no estaba declarada en el registro de
  ownership de la nueva migración. Se corrigió la declaración exacta en
  DEC-005/policy; `verify:architecture` y las `36/36` mutaciones controladas
  posteriores pasaron sin relajar reglas.
- Full Verification de iteración `local-full-verification-20260912022105-37c3dde2c34f`:
  `13/13` stages PASS, cleanup PASS, fingerprint
  `7f4f894abd92750f4cb45783b05a1eb21383707df5923bc1d6af9f5598c836d5`.
  Único warning: chunk Vite principal >500 kB, deuda ya aceptada y no ocultada.
- Validación focalizada de la iteración de filtros: `typecheck`, build,
  `catalog-domain` y `catalog-ui-contract` (`12/12 PASS`), más
  `test:pbi040:postgresql` (`56` migraciones, cero skips, benchmark de 10,000
  items p95 `8.90 ms` contra presupuesto `750 ms`).
- Full Verification final de la iteración de filtros:
  `local-full-verification-20260912024931-aef7d3a70fd0`, `13/13 PASS`, cleanup
  PASS, PostgreSQL material sin skips críticos y fingerprint de candidato
  `d16c026e18563592cd23fd99122581da82349ef6c8e087e8df4891b3f24f7e36`.
  El benchmark material PBI-040 de esa campaña registró p95 `7.23 ms` para
  10,000 items, bajo el presupuesto `750 ms`. Permanece visible el warning
  aceptado de chunk Vite principal mayor a 500 kB.

## Prueba funcional HTTP local previa a la iteración

El recorrido que originó el primer checkpoint usó PostgreSQL 18.4, 55
migraciones, datos sintéticos y sesión operacional real:

1. alta de categoría, marca y Refacción con precio, costo, SKU y barcode;
2. búsqueda inequívoca por nombre, SKU y barcode;
3. ausencia de costo en la respuesta normal y proyección con capability;
4. aplicación de override Branch `1499.00`, seguida de revocación y retorno al
   precio base `1399.00` con fuente `TENANT_BASE`;
5. GET de detalle/reload persistente;
6. cambio y restauración de `priceListShowReferenceCost`.

El primer recorrido detectó un `403` al recargar detalle: el GET reutilizaba una
clasificación de transporte `state-change`. Se corrigió a lectura protegida por
`catalog.manage`, se agregó una regresión y el recorrido completo terminó
`PASS`. No se relajó la capability Tenant-wide ni ningún commit guard.

## Fixtures locales de Owner Review

El runtime local se reconstruyó con `local:db:reset`/`local:db:seed`, 56
migraciones y datos exclusivamente sintéticos. La preparación autenticada creó
por API gobernada y después cerró su sesión para no bloquear el PIN de Chrome:

- Pantalla iPhone 11 OLED — Refacción/Pantallas/Apple — costo 480, base 1399;
- Funda iPhone 16 rosa — Producto/Fundas/Apple — costo 105, base 299;
- Limpieza centro de carga — Servicio/Mantenimiento/sin marca — base 350,
  override de la Branch de revisión 399;
- Alcohol isopropílico 1 L — Insumo/Insumos/Steren — costo 65, base 180;
  permanece excluido del lookup comercial;
- `Termos QA` y `MobiLab QA` quedan deliberadamente Por revisar, ambos
  aplicables a Producto, para evaluar gobierno y reconciliación.

Los cuatro artículos resolvieron SKU y código interno server-side. Todo el set
se elimina de forma reversible con el reset local gobernado; no es Production.

## UI formal y gates posteriores

La UI compila y sus contratos de navegación, autorización, estados, transporte
y preferencia pasan; el smoke automatizado también está verde. Chrome quedó
abierto en `http://127.0.0.1:4173/listas/precios`; backend y ruta respondieron
200. La inspección automatizada nativa no estuvo disponible (`Sky Computer Use
native pipe startup failed`), por lo que no se inventan screenshots ni se marca
la nueva matriz visual humana como ejecutada.

La revisión Owner previa produjo esta iteración y no constituye aceptación. El
nuevo Owner Review debe recorrer `/listas/precios` y
`/configuracion/catalogos?module=price-list` en Chrome real, al menos en Light y
Dark/responsive, y confirmar comboboxes, cascada, Por revisar, identificadores y
operabilidad. Después permanecen
separados: aceptación Owner, hardening/revisión independiente, PR/CI, merge,
exact-main CI y cualquier Preview/deploy autorizado.

Para esta iteración, Chrome local autenticado con datos sintéticos confirmó:
Todos/Todas/Todas; Refacción; Refacción + Pantallas; Refacción + Pantallas +
Apple; búsqueda combinada `OLED`; cero resultados legítimo; y el cambio
Refacción/Pantallas/Samsung → Servicio, que limpió Category y Brand. La URL
reflejó cada filtro. El toolbar conserva cuatro columnas a 1280 px y una sola
columna a 768/640 px; controles nativos `Input`/`Select` aportan foco y
teclado. Se activó Light/Dark y se restauró Light. Chrome quedó abierto,
autenticado y restablecido en `/listas/precios` sin filtros. La revisión y
aceptación humana siguen pendientes.

## Matriz de iteración Owner A-H

| Escenario | Evidencia del candidato |
|---|---|
| A Refacción existente | búsqueda y selección filtrada de Category/Brand; alta conserva costo 480 y precio 1399 |
| B Category nueva | opción Crear explícita por teclado/click; nace PENDING y queda seleccionada |
| C Brand nueva | mismo flujo, identidad Tenant-wide y visible Por revisar en Configuración |
| D Servicio sin marca | Brand sigue opcional; Category SERVICE exigida por servidor |
| E Insumo | se administra en Catalog y continúa excluido del lookup comercial |
| F cambio de Tipo | conserva compatibles y limpia/informa Category/Brand incompatibles |
| G auto identifiers | SKU e INTERNAL_BARCODE asignados en la transacción server-side y visibles en reload |
| H identifiers explícitos | valores válidos se preservan; constraint Tenant-wide impide colisión |

## Exclusiones verificadas

- PBI-041 no fue iniciado: no hay bulk import ni Supplier reconciliation.
- PBI-042 no fue iniciado: no hay imagen, Files o R2.
- No se construyeron Inventory, Caja, Repair Concepts, compras, pedidos,
  solicitudes, reportes, impuestos, descuentos o multi-currency/FX.
