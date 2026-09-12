# PBI-040 — Implementation Evidence

## Checkpoint y autoridad

- **Checkpoint:** funcional listo para `Owner Review`; no equivale a `Done`.
- **Branch:** `feature/pbi-040-catalog-pricing-core`.
- **Baseline:** `40684d7554cdf02551f941e5e3f0beabbe563125` con CI de
  `main` `34623060504` SUCCESS.
- **Candidato de iteración Owner:** funcionalidad congelada durante la
  reconciliación de runtime provenance; aceptación Owner todavía pendiente.
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
- SKU y código de barras internos se resuelven server-side cuando quedan vacíos.
  Code 128 se conserva como representación futura, no como identificador.

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

### Iteración Owner — convergencia visual e integridad Repairs

- La investigación partió de PostgreSQL local y encontró cero filas en
  `repair_device_types`, `repair_brands`, `repair_models`, `repair_risks` y
  `repair_problem_categories`. Las 15 reparaciones sintéticas sí conservaban
  snapshots de marca/modelo, pero el seed no materializaba las identidades
  canónicas; ésa era la causa de la superficie vacía.
- No fue una regresión PBI-040: sus cinco migraciones sólo expanden Tenancy,
  Access, Users y Catalog/Pricing y no mutan tablas Repairs. La sesión Owner
  posee `repairs.catalogs.read/manage`; todas las lecturas observadas fueron
  `200` y Tenant-scoped.
- New Repair y Configuración no son fuentes paralelas. Sus endpoints
  operativos/administrativos convergen en el mismo repositorio Kysely y las
  mismas cinco tablas Repairs. La prueba HTTP autenticada devolvió IDs idénticos
  para Riesgos `4/4`, Tipos `2/2`, Marcas `12/12` y Categorías `5/5`; Modelos
  devolvió 15 en administración y los 3 Apple compatibles en operación.
- El seed local gobernado define 38 fixtures deterministas: 2 tipos, 12 marcas,
  15 modelos, 4 riesgos y 5 categorías. Son datos exclusivamente sintéticos
  Tenant-wide y reversibles con `local:db:reset`; no son defaults productivos.
  Sus etiquetas cubren los snapshots locales, pero no crean vínculos canónicos
  para Repairs históricas. Los inserts no sobrescriben una fila existente.
- `CatalogSectionTabs`, lifecycle, counters, panel/header/table, badges,
  acciones, empty states y estados hover/focus/selected viven en las primitives
  compartidas. Reparaciones y Lista de precios las componen sin duplicar CSS.

## Seguridad, persistencia y fronteras

- Ocho capabilities gobernadas separan consulta, identidad, precio base,
  override Branch, lectura/gestión de costo y la autoridad futura de importación.
- Administración Tenant-wide rechaza asignaciones sólo-Branch y combina los
  commit guards contextual y Tenant-wide antes del commit.
- Writes usan allowlists estrictas, CSRF, idempotencia, `expectedVersion`, actor,
  correlation y auditoría. Constraints Tenant-aware protegen referencias y la
  unicidad histórica de SKU y código de barras.
- Cinco migraciones aditivas materializan moneda operativa, capabilities,
  preferencia personal, Catalog/Pricing y gobierno de referencias. El rollback
  de aplicación conserva datos; no existe migración destructiva en el slice.
- DEC-005/policy registra la nueva frontera. Catalog/Pricing no adquiere
  ownership de Inventory, Procurement, Repair, Payments, Cash, Files, pedidos o
  solicitudes.

## Reconciliación de runtime PBI-039

- Preview fue identificado materialmente en `0d1c5760ce962d17a8292b841f5de43a8cb453a7`
  mediante checkout Dokploy, imagen en ejecución y assets HTTP. Un rebuild
  limpio reprodujo exactamente sus hashes.
- PR #42 y #43 son ancestros; PR #44 es el SHA desplegado; PR #45
  `40684d7554…` es su hijo documental y la baseline integrada actual.
- El Vite local previo era un proceso longevo sin identidad de source; el
  backend provenía del mismo worktree pero de un build/reinicio posterior. No
  había listeners duplicados ni worktrees alternos en los puertos servidos.
- La comparación runtime contra runtime usó el mismo read model sintético. Las
  superficies Header, Recepción, Historial, Conceptos y Evidencias resultaron
  iguales; la única diferencia fue el shell `Listas` legítimo de PBI-040.
- Preview `SR-2026-1000` es escasa y Local `SR-2026-003` es rica. Esa diferencia
  de datos activa bloques condicionales distintos y explica la divergencia
  visual; no se encontró una regresión de source PBI-039.
- El launcher y smoke nuevos verifican SHA/estado de frontend y backend. La
  imagen OCI futura falla sin SHA y el verificador exige igualdad de label,
  manifest y headers. No se desplegó este cambio.

La evidencia completa está en
[`RUNTIME_PROVENANCE_AUDIT.md`](RUNTIME_PROVENANCE_AUDIT.md).

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
- Full Verification de la iteración de identificadores:
  `local-full-verification-20260912032350-7d8f626c5c21`, `13/13 PASS`,
  cleanup PASS, huella candidata
  `ad137489eb26b6fa7c3e33ac76cf20298639a32a53da110e81a7eabc71b8aaa7`.
  La base ejecutó `815` pruebas (`795 PASS`, `20` skips PostgreSQL no
  materiales) y la etapa PBI-040 aplicó 56 migraciones, cero skips críticos y
  p95 `6.98 ms` sobre 10,000 items contra presupuesto `750 ms`.
- Validación focalizada de convergencia/integridad: `typecheck` y `41/41`
  pruebas de fixtures, UI compartida y los cinco catálogos Repairs PASS.
- Full Verification de convergencia/integridad:
  `local-full-verification-20260912035619-b903eab1ff73`, `13/13 PASS`, cleanup
  PASS y huella candidata
  `76e08075928e12110d08d7bd9e47eb1b47c990b9da6afd7bb5e99126a3291fca`.
  La base ejecutó `817` pruebas (`797 PASS`, `20` skips PostgreSQL no
  materiales); las cinco suites PostgreSQL compuestas sumaron `17` pruebas sin
  skips, y PBI-040 aplicó 56 migraciones con p95 `7.87 ms` sobre 10,000 items
  contra presupuesto `750 ms`. Permanece sólo el warning aceptado del chunk
  Vite principal mayor a 500 kB.
- La auditoría de preservación posterior confirmó ancestry exacto desde
  `40684d7554…`, PR #42/#43/#44/#45 presentes, cero commits nuevos en main y
  cero regresiones/desconocidos. El nuevo preflight verificó además 16 blobs
  protegidos de PBI-039 antes de la campaña.
- Full Verification de preservación sobre `453eeb0`:
  `local-full-verification-20260912042901-453eeb0983e3`, `13/13 PASS`, cleanup
  PASS y fingerprint
  `cdafe0acacfbf2691ea5acc6f4d4b802e2ee73cb3ed246e98d4f1b7babbc490a`.
  La base ejecutó 822 pruebas (`802 PASS`, 20 skips PostgreSQL gobernados);
  PBI-039 material fue `2/2`, el compuesto `17/17` y PBI-040 registró p95
  `8.23 ms` sobre 10,000 items. El warning de chunk permanece visible.
- Runtime provenance Full Verification sobre `52679c2`: `13/13` stages PASS,
  base `828` tests (`808 PASS`, `20` skips PostgreSQL gobernados), compuesto
  PostgreSQL `17/17`, PBI-039 `2/2`, PBI-040 p95 `6.53 ms`, smokes y cleanup
  PASS. Fingerprint
  `1862684485185049b45a3403645f7eae98af6b8a5741e30dab8a9dc660e3e283`.
- Verificación OCI separada sobre imagen local
  `sha256:e35c585e2b4919397e42304100c5f65f065013e439ec054ec7c9748a3101e377`:
  label, manifest frontend y headers backend declararon la misma revisión;
  56 migraciones y cleanup PASS.

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
por API gobernada los siguientes fixtures reversibles:

- Pantalla iPhone 11 OLED QA — Refacción/Pantallas QA/Apple QA — costo 480,
  base 1399; SKU y barcode automáticos `REF-000001` / `SR00000001`;
- Funda iPhone 16 rosa QA — Producto/Fundas QA/Apple QA — costo 105, base
  299; SKU y barcode explícitos preservados;
- Limpieza centro de carga QA — Servicio/Mantenimiento QA/sin marca — base
  350; SKU y barcode automáticos.

Los cuatro artículos resolvieron SKU y código de barras server-side. Todo el set
se elimina de forma reversible con el reset local gobernado; no es Production.

## UI formal y gates posteriores

La UI compila y sus contratos de navegación, autorización, estados, transporte
y preferencia pasan; el smoke automatizado también está verde. La iteración de
identificadores confirmó los tres fixtures, las etiquetas SKU/Código de barras y
la ausencia de GTIN/EAN/UPC/Código interno.

Para convergencia e integridad se usó Chrome real local autenticado. A 1280 px,
Reparaciones y Lista de precios mostraron el mismo patrón de tabs, panel,
encabezado, lifecycle, status y acciones con contenido real. A 768 y 640 px no
hubo overflow de página; a 640 px se inspeccionaron Light y Dark y se restauró
Light. Teclado movió foco visible de Categorías a Marcas. New Repair resolvió en
la UI real `Teléfono`, `Apple`, `iPhone 11/iPhone 13`, `Pantalla` y los cuatro
riesgos materializados. La automatización nativa no estuvo disponible
(`Sky Computer Use native pipe startup failed`); el recorrido y las capturas se
obtuvieron contra el Chrome visible mediante su protocolo local, sin marcarlo
como aceptación humana.

La revisión Owner previa produjo esta iteración y no constituye aceptación. El
nuevo Owner Review debe recorrer `/listas/precios` y
`/configuracion/catalogos?module=price-list` en Chrome real, al menos en Light y
Dark/responsive, y confirmar comboboxes, cascada, Por revisar, identificadores y
operabilidad. Después permanecen
separados: aceptación Owner, hardening/revisión independiente, PR/CI, merge,
exact-main CI y cualquier Preview/deploy autorizado.

La auditoría completa de causa raíz, genealogía, diff A-E, linkage, safe delete,
fixtures y guard permanente vive en
[`BASELINE_PRESERVATION_AUDIT.md`](BASELINE_PRESERVATION_AUDIT.md).

La reconciliación posterior reemplaza cualquier inferencia basada sólo en blobs
con evidencia de checkout, build, assets y runtime:
[`RUNTIME_PROVENANCE_AUDIT.md`](RUNTIME_PROVENANCE_AUDIT.md).

Para esta iteración, Chrome local autenticado con datos sintéticos confirmó:
Todos/Todas/Todas; Refacción; Refacción + Pantallas; Refacción + Pantallas +
Apple; búsqueda combinada `OLED`; cero resultados legítimo; y el cambio
Refacción/Pantallas/Samsung → Servicio, que limpió Category y Brand. La URL
reflejó cada filtro. El toolbar conserva cuatro columnas a 1280 px y una sola
columna a 768/640 px; controles nativos `Input`/`Select` aportan foco y
teclado. Se activó Light/Dark y se restauró Light. Chrome quedó abierto,
autenticado y con dos ventanas lado a lado para comparar Catálogos de
Reparaciones y Catálogos de Lista de precios. La revisión y aceptación humana siguen
pendientes.

## Matriz de iteración Owner A-H

| Escenario | Evidencia del candidato |
|---|---|
| A Refacción existente | búsqueda y selección filtrada de Category/Brand; alta conserva costo 480 y precio 1399 |
| B Category nueva | opción Crear explícita por teclado/click; nace PENDING y queda seleccionada |
| C Brand nueva | mismo flujo, identidad Tenant-wide y visible Por revisar en Configuración |
| D Servicio sin marca | Brand sigue opcional; Category SERVICE exigida por servidor |
| E Insumo | se administra en Catalog y continúa excluido del lookup comercial |
| F cambio de Tipo | conserva compatibles y limpia/informa Category/Brand incompatibles |
| G auto identifiers | SKU y BARCODE asignados en la transacción server-side y visibles en reload |
| H identifiers explícitos | valores válidos se preservan; constraint Tenant-wide impide colisión |

## Exclusiones verificadas

- PBI-041 no fue iniciado: no hay bulk import ni Supplier reconciliation.
- PBI-042 no fue iniciado: no hay imagen, Files o R2.
- No se construyeron Inventory, Caja, Repair Concepts, compras, pedidos,
  solicitudes, reportes, impuestos, descuentos o multi-currency/FX.
