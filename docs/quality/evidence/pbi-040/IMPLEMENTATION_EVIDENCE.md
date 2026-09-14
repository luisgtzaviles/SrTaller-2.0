# PBI-040 — Implementation Evidence

## Checkpoint y autoridad

- **Checkpoint:** `Done candidate` después de Owner Acceptance, integración,
  exact-main CI y Preview PASS; el cierre documental materializa `Done`.
- **Branch de cierre:** `ops/pbi-040-roadmap-advance`; la rama funcional ya fue
  integrada por PR #49.
- **Baseline histórica de implementación:**
  `40684d7554cdf02551f941e5e3f0beabbe563125` con CI de `main`
  `34623060504` SUCCESS.
- **Baseline funcional integrada:** `main`
  `09e14c89892f5770977c5028a899714b7a30d6d5`, CI exacta
  `34809054770` SUCCESS y Preview PASS.
- **Owner Acceptance:** explícita el 2026-09-13 para el alcance funcional de
  PBI-040. Bulk Composer/import permanece en PBI-041 y no forma parte de esta
  aceptación.
- **Autoridad de cierre:** el Master Goal de 2026-09-13 autoriza verificación,
  remediación acotada, push, PR, CI exact-head, merge, exact-main, deployment y
  validación de Preview y limpieza de la branch. Production no está autorizada.

## Reconciliación con el nuevo `main`

- El head funcional PBI-040 se congeló en
  `68843baea68a618d0c00748e464b3cd2cffbdab3`; su merge-base con el nuevo
  `main` es el cierre PBI-039
  `40684d7554cdf02551f941e5e3f0beabbe563125`.
- La reconciliación se realiza como merge local, sin rebase ni force-push. Así
  se preservan los 38 commits propios de Catalog/Pricing y los 12 commits de
  `main` que incorporan la remediación y cierre de PBI-043.
- En conflictos, `main` conserva autoridad sobre Access, sesiones concurrentes,
  PBI-039 y delivery; PBI-040 conserva Catalog/Pricing, sus cinco migraciones y
  evidencia. DEC-005, el registro de esquema y las pruebas de arquitectura
  incluyen ambas fronteras y la migración de PBI-043 después de las de
  Catalog/Pricing.
- Esta reconciliación no agrega funcionalidad, no inicia PBI-041/PBI-042 y no
  concede Owner Acceptance. Los resultados actuales de gates y runtime se
  documentarán al completar la campaña sobre el commit reconciliado.

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
  Una captura explícita por Enter/click queda seleccionada en el draft y sólo se
  persiste atómicamente con el artículo como referencia pendiente; blur y
  cancelar no crean datos ni canon.
- Configuración > Catálogos incorpora el módulo Lista de precios para gobernar
  aplicabilidad, lifecycle y reconciliación. Category pertenece a un Tipo;
  CommercialBrand conserva identidad Tenant-wide y puede aplicar a varios.
- La reconciliación usa una única acción `Resolver`: asociar a un canon activo y
  compatible o crear canon. En ambos casos los artículos adoptan el ID canónico
  sin perder la captura, primera/última observación, actor, Branch, uso ni
  resultado de resolución.
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

La reconciliación posterior comparó primero los GET y DOM efectivos de las dos
reparaciones que Owner observaba y clasificó la diferencia como A/D (datos y
fixture), no B/C (backend o frontend distintos). Después materializó
`SR-2026-039` y ejecutó ambos runtimes con exactamente el mismo read model. El
guard verificó Header, Recepción, Historial, Conceptos y Evidencias, cuatro
eventos, dos evidencias, ancho funcional idéntico y cero overflow. No se cambió
Repair Detail ni se escribió en Preview. Evidencia completa:
[`REPAIR_DETAIL_PARITY.md`](REPAIR_DETAIL_PARITY.md).

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
- Reconciliación con el nuevo `main` sobre merge local `28320b39fcb4`:
  `verify:full` `13/13` etapas PASS, cleanup PASS y fingerprint
  `a8a59c78719c78dece2d4dc6a39847cf4aac23c82af0939b97045848fbe8f82e`.
  La base ejecutó 836 pruebas (`816 PASS`, 20 skips PostgreSQL gobernados,
  cero fallas); el stage material compuesto ejecutó `17/17`; PBI-039 fue
  `2/2`; PBI-040 aplicó 57 migraciones y registró p95 `7.19 ms` sobre 10,000
  items contra presupuesto `750 ms`. Build, arquitectura, configuración, UI,
  runtime Preview-like, smokes y cleanup pasaron. Permanece sólo el warning
  aceptado del chunk Vite principal mayor a 500 kB.

## Runtime de reanudación y concurrencia

- La base preservada del Owner Review contenía las 56 migraciones PBI-040 y
  cuatro artículos. Se promovió reversiblemente al nombre local canónico y la
  base que ya tenía PBI-043 quedó preservada como
  `srtaller_pbi043_preserved_20260912`; no se destruyó ningún volumen ni
  fixture. La migración concurrente se aplicó como número 57.
- `verify:runtime-provenance` confirmó
  `28320b39fcb42287444c7131a8405c9340677025` y estado `clean` por igual en
  worktree, frontend y backend.
- `verify:repair-detail-parity` pasó con el fixture `SR-2026-039`: mismo
  read model, cuatro eventos, dos evidencias, nueve encabezados funcionales,
  ancho 1102 px y cero overflow entre Preview aceptado y Local reconciliado.
- La prueba Chrome PBI-043 pasó con perfiles Owner/QA independientes sobre la
  misma Station: Users y SessionIds distintos, ambos sobrevivieron reload;
  logout, relogin y switch de QA no afectaron Owner. Cero errores de consola,
  runtime, red o servidor; sólo favicon 404 permitido.
- La pestaña personal del Owner se autenticó de nuevo sin apropiación por el
  perfil QA y quedó visible en `/listas/precios`: cuatro resultados, defaults
  Todos/Todas/Todas, costo oculto y acceso a Nuevo artículo. La revisión humana
  y Owner Acceptance continúan pendientes.

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

La prueba material de paridad con el mismo payload, su matriz A-E y el guard
permanente están en
[`REPAIR_DETAIL_PARITY.md`](REPAIR_DETAIL_PARITY.md).

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

## Iteración Owner — reconciliación unificada

El workflow provisional `PENDING dentro del canon → Aprobar/Fusionar` fue
retirado. La migración productiva número 58 separa
`catalog_category_pending_values` y `catalog_brand_pending_values` de las
tablas canónicas, conserva el WIP local anterior y agrega aplicabilidad
multi-Tipo para Brand pendiente. Un `CatalogItem` puede conservar la referencia
capturada mientras está pendiente; al resolver adopta la identidad canónica sin
perder el vínculo histórico.

La superficie administrativa reutiliza las primitives de Repairs para Canónicas
/ Por revisar, tabla, contador, lifecycle, feedback y diálogo. `Resolver`
presenta sólo Asociar existente o Crear canónica. Las candidatas existentes
deben estar activas y cubrir todos los Tipos observados; al crear, los Tipos ya
usados son obligatorios. Las referencias pendientes nunca aparecen como filtros
normales de `/listas/precios`.

El seed local gobernado y reversible materializa:

- Repairs: `Smart Watch`, Tipo pendiente, un uso y primera/última observación;
- Catalog Category: `Fundas premium`, Producto, un artículo;
- Catalog Brand: `Aple`, Refacción + Producto, dos artículos;
- tres artículos deterministas con SKU/barcode, precios base, costo protegido y
  un override de Branch. El WIP local anterior también se migró como pendientes
  trazables, sin presentarlo como dato Owner real.

Evidencia material ejecutada sobre el candidato:

- suite base: 836 pruebas, 816 PASS, 20 skips PostgreSQL gobernados, 0 fallas;
- PBI-040 PostgreSQL: PASS con 58 migraciones, ambos modos de resolución para
  Category/Brand, duplicado y near-duplicate, reload, usos, compatibilidad,
  Tenant isolation y p95 `7.51 ms` / presupuesto `750 ms`;
- Chrome real: 1280, 768 y 640 sin overflow; Light/Dark; foco atrapado,
  navegación por Tab/Arrow y cancelación por Escape;
- cancelación de Nuevo artículo después de capturar Category y Brand: cero filas
  huérfanas confirmadas en ambas colas;
- reload y sesión Owner preservados; tres pestañas quedaron preparadas en
  Category pendiente, Brand pendiente y Repairs/Tipo pendiente.
- `verify:full` final sobre el candidato funcional `4ef0fc9`: `13/13` etapas
  PASS, PostgreSQL compuesto `17/17`, PBI-039 `2/2`, PBI-040 con 58 migraciones
  y p95 `6.82 ms` sobre 10,000 artículos, smokes y cleanup PASS; fingerprint
  de candidato `d5b883e750e5953812ce9ed46bfd00bf975798dad33f7c77d8c002157e51aed6`.
- El primer intento del gate detectó una suposición obsoleta de aislamiento en
  siete suites owner-scoped: sus teardowns no incluían las tres tablas nuevas y
  el contrato Access asumía que PBI-043 seguía siendo la última migración. Se
  corrigió el inventario de limpieza y el test ahora retira primero la migración
  posterior de Catalog antes de comprobar, sin rebajar assertions, que el
  rollback concurrente de Access permanece protegido.

Los commits locales lógicos son `72c0921` (modelo, persistencia, UI, fixtures y
contratos), `b20dea9` (rotulado de uso por bounded context), `1bd6c81`
(limpieza de feedback al cancelar), `8b21cb6` (evidencia), `bc9fcab` (contrato
de rotulado contextual) y `4ef0fc9` (aislamiento PostgreSQL y rollback
encadenado). No hubo push, PR, merge ni deploy. Esta evidencia no constituye
Owner Acceptance.

## Iteración Owner — contexto de Tipo y eliminación segura

Configuración > Catálogos > Lista de precios incorpora el filtro
`Todos | Refacción | Servicio | Producto | Insumo` en Category y Brand,
incluidas sus colas Por revisar. Category compara su único Tipo; Brand conserva
su identidad Tenant-wide y coincide cuando su aplicabilidad multi-Tipo contiene
el filtro. La UI consume `kind`/`applicableKinds` del mismo read model usado por
Nuevo artículo; no existe una segunda matriz hardcoded.

La primitive compartida de Catalog Administration deriva las acciones de
lifecycle y presenta un solo patrón de confirmación, conflicto y feedback. Las
consultas permanecen separadas por owner. Catalog considera items y pendientes
ya resueltas; Repairs considera Repair/Intake, relaciones Risk, Model, y las
dependencias estructurales Brand → Model y canon → pending resuelto según la
entidad. El contador visible sigue declarando uso canónico y no hace string
matching sobre capturas.

Dos migraciones owner-scoped agregan eventos append-only de eliminación con el
snapshot previo. La operación toma lock sobre la referencia, reconsulta dentro
de `READ COMMITTED`, elimina sólo con cero dependencias y traduce una FK tardía
a conflicto tipado. La prueba concurrente inserta uso mientras el delete espera:
el uso gana, ambos registros permanecen y no hay pérdida de datos. Los eventos
de Repairs ya no dependen mediante FK de una referencia eliminable, por lo que
la historia sobrevive al hard delete y el down migration puede restaurar el
canon desde su snapshot antes de recomponer constraints.

Evidencia material de la iteración:

- schema/policy/manifest focalizado: 22/22 PASS con 60 migraciones;
- PostgreSQL PBI-040: PASS, incluida carrera use-vs-delete, aislamiento Tenant,
  idempotencia, stale version y audit append-only; benchmark p95 `9.10 ms`
  contra presupuesto `750 ms`;
- PostgreSQL owner-scoped: 8/8 PASS y cleanup PASS sobre PostgreSQL 18.4;
- typecheck, build y `verify:architecture`: PASS; Vite conserva sólo el warning
  conocido del chunk principal de 573.41 kB;
- Chrome local autenticado: default Todos, filtros Refacción/Servicio/Producto/
  Insumo, pendientes por Tipo, Brand Apple multi-Tipo, referencia usada con
  Desactivar y fixture sin uso con Eliminar + confirmación explícita;
- 1280, 768 y 640 px conservaron el filtro y las acciones sin overflow;
  Light/Dark, foco por teclado y reload quedaron verificados y se restauró
  Light con viewport normal;
- fixture local adicional `Marca temporal QA`, Refacción, cero artículos, se
  conserva para que Owner pueda inspeccionar la acción Eliminar sin afectar
  datos reales;
- `verify:full` final sobre `c8410bf`: 13/13 etapas PASS; suite base 837 pruebas, 817 PASS y
  20 skips PostgreSQL gobernados; PostgreSQL compuesto 17/17, PBI-039 2/2,
  PBI-040 1/1 con 60 migraciones y p95 `7.18 ms`; runtime Preview-like,
  compiled smokes y cleanup PASS; fingerprint
  `a6206444b7904a1e9bf8e9bdbbef2c3195ca0ed00adabdacafca137d612523a7`.

El primer intento de `verify:full` falló cerrado porque cuatro superficies
compartidas protegidas por PBI-039 habían incorporado las rutas adyacentes de
safe delete. Se confirmó por diff que no cambiaron la proyección, endpoints ni
UI de Repair Detail; después se rebaselinaron sus blobs exactos y el gate volvió
a probar las 20 superficies, los contratos estructurales y PostgreSQL PBI-039.
No se eliminó ni se exceptuó el guard.

Owner Acceptance, push, PR, merge y deploy continúan pendientes/no autorizados.

## Iteración Owner — prevención de referencias pending duplicadas

La causa era una validación tardía: el alta inline consultaba/reutilizaba la
cola pending, pero no buscaba primero el canon exacto, y Category seguía teniendo
un unique físico sólo por Tenant aunque su identidad de producto ya incluía
Tipo. El autocomplete podía ocultar además una Brand exacta cuando faltaba el
Tipo vigente en su aplicabilidad.

El candidato corrige las tres capas sin introducir fuzzy matching:

- normalización común: trim, case folding `es-MX`, espacios colapsados y NFD sin
  diacríticos; `Pantalla` y `Pantallas` permanecen distintas;
- Category: identidad y unique `Tenant + Type + normalizedName`; Brand:
  `Tenant + normalizedName` con aplicabilidad multi-Tipo;
- alta inline canonical-first: una referencia activa exacta se reutiliza sin
  crear pending; Brand agrega el Tipo faltante en la misma transacción y el
  cambio queda en el audit del artículo;
- una tabla de locks de identidad Tenant-scoped serializa alta canónica,
  captura y renombre; constraints, idempotencia y conflicto tipado permanecen
  como defensa server-side;
- el modal histórico preselecciona el canon exacto, deshabilita Crear canónica
  y traduce el conflicto exacto a feedback accionable sin búsqueda cross-Tenant.

Datos sintéticos locales auditados: existía una pending `Pantallas`, Refacción,
con un artículo. Se resolvió desde Configuración mediante `Asociar a referencia
existente` contra el canon `Pantallas`; la fila quedó `RESOLVED`, conservó raw
label, normalización, Tipo, actor, primera/última observación, uso y timestamps,
y añadió el evento de resolución con destino canónico. No hubo delete ni una
nueva referencia canónica. La pending legítima `Fundas premium` permanece para
la revisión humana.

Cobertura material:

- variantes `Fundas`, `fundas`, espacios/case y `fúndas` reutilizan Category
  Producto; `Funda` continúa pending y el mismo nombre en Servicio es válido;
- Apple capturada reutiliza la Brand Tenant; una Brand existente de otro Tipo
  se reutiliza, amplía aplicabilidad y registra audit;
- dos writers simultáneos dejan un solo canon y dos capturas simultáneas
  comparten una sola pending; renombrar hacia una pending exacta se rechaza;
- el mismo texto en otro Tenant resuelve únicamente contra su canon; el error
  HTTP tipado no contiene IDs ni datos cross-Tenant;
- reload/read model conserva linkage y una pending histórica duplicada puede
  asociarse sin perder provenance.

Chrome local autenticado confirmó coincidencia exacta acento/case/espacios sin
opción Crear, near match con opción Por revisar, reset limpio al cambiar Tipo y
Brand exacta fuera del Tipo con mensaje de reutilización/ampliación. Escape
cerró el autocomplete. A 1280, 768 y 640 px el documento no tuvo overflow y el
modal mantuvo Category, Brand y acciones; Light y Dark se inspeccionaron y el
viewport se restauró al tamaño normal.

Gates finales sobre `f4ace4a`:

- typecheck, contratos focalizados, `verify:architecture` y build: PASS;
- PostgreSQL PBI-040: 61 migraciones, cero skips críticos, carrera canónica y
  pending, aislamiento y p95 `9.00 ms` / presupuesto `750 ms`;
- PostgreSQL owner-scoped: 8/8 PASS, incluida la reversión explícita de la
  migración Catalog posterior antes de probar el rollback protegido de Access;
- `verify:full`: 13/13 etapas PASS; suite base 837 pruebas, 817 PASS y 20 skips
  PostgreSQL gobernados; composite 17/17; PBI-039 2/2; Preview-like, compiled
  backend/UI smokes y cleanup PASS; fingerprint
  `a1848d59aa42d680bad393b613e646d946eec5b4756fa14cc9267df6bb882b1c`.

El primer full gate falló por el conteo obsoleto 60→61 del manifest. El segundo
expuso el orden owner-scoped de rollback posterior. Ambos fallaron cerrado y se
remediaron registrando exactamente la migración y su orden; no se eliminaron
assertions, skips ni controles. Commits locales: `6a1204c`, `530d51c`,
`c7d9453` y `f4ace4a`. No hubo push, PR, merge, deploy ni Owner Acceptance.

## Iteración Owner — canonical merge y paridad inline en edición

Category y Brand incorporan un comando explícito de canonical merge, separado
de rename y de la resolución de capturas pendientes. Category exige Tenant y
Tipo comunes; Brand conserva la unión de aplicabilidad. El comando bloquea las
identidades y recursos relacionados, revalida versión/lifecycle/scope, reasigna
items y destinos pending resueltos y escribe un evento append-only antes de
marcar las fuentes como merged. No hay hard delete, cascada histórica ni estado
parcial.

La administración permite seleccionar dos o más referencias compatibles y
presenta survivor, nombre final, usage individual, relaciones por reasignar y
la advertencia de trazabilidad. Las fuentes merged no reaparecen en canon,
filtros o safe delete; el survivor acumula los counts. Crear y Editar item usan
el mismo `CatalogReferenceCombobox` y el mismo resolvedor server-side para
canon exacto, ampliación de Brand o nueva captura pending.

La auditoría de Repairs cubrió Device Types, Brands, Models, Problem Categories
y Risks. El patrón visual es reutilizable, pero scope Platform/Tenant, historia
de recepción y colisiones Brand/Model requieren decisiones propias; no se
implementó merge de Repairs en PBI-040.

Evidencia material sobre `0720813`:

- `verify:full` 13/13 PASS; suite base 838 pruebas, 818 PASS, 20 skips
  PostgreSQL gobernados y cero fallas;
- PostgreSQL composite 17/17, PBI-039 2/2 y PBI-040 1/1 con 62 migraciones,
  cero skips críticos y benchmark p95 `5.50 ms` / presupuesto `750 ms`;
- runtime Preview-like, backend/UI compilados y cleanup PASS; fingerprint
  `0d3f63069e348c8cb5387c4f7fffc0b91b2e92b824f211189bf24c39554dc0c7`;
- pruebas materiales cubren 4+1 items, source→survivor, unión de Brand,
  cross-Type/cross-Tenant, idempotencia, audit append-only, rollback y carreras
  con merge, create/edit/delete/reconciliation;
- Chrome local autenticado confirmó Station y Session Owner, selección
  compatible, bloqueo cross-Type, modal/foco/Escape, Light/Dark y 1280/768/640
  sin overflow de página;
- merge reversible local `Fundas + Fundas QA → Fundas` confirmó source ausente,
  survivor con dos items y evento con actor/correlation; `Pantallas (4) +
  Pantallas QA (1)` quedó sin ejecutar y preparado para revisión Owner;
- Editar `Pantalla Samsung A15` mostró `Apple` como canon exacto y un nombre
  nuevo como captura `Por revisar al guardar`, sin persistir durante la captura.

La prueba real encontró dos regresiones y ambas se remediaron con cobertura:
la selección inicial interpretaba `undefined` como Tipo incompatible y el seed
local no incluía `Category.kind`. El primer full gate de esta iteración también
detectó que el teardown owner-scoped no conocía la nueva tabla de eventos. Los
tres casos fallaron cerrado; no se retiraron assertions ni controles.

Commits locales de aquella iteración: `d846a6a` (merge, edición, persistencia,
UI y contratos), `229fafb` (estado canónico de Owner Review) y `0720813`
(selección/seed para runtime). En ese checkpoint no hubo push, PR, merge a
`main`, deploy ni Owner Acceptance; la aceptación posterior del 2026-09-13 se
registra al inicio de este documento.

## Formal UI Verification after Owner Acceptance

The frozen candidate received a real-Chrome campaign on 2026-09-13 covering
cascading filters, identifier search/generation/reload, create/edit, pending
reference resolution, compatible canonical merge, safe delete, lifecycle,
base/override inheritance, authorized cost preference, loading/error/empty
states, responsive layouts, keyboard/focus behavior, shared Catalog UI, the
five Repairs catalogs, New Repair and the canonical PBI-039 Repair Detail.
The clean final page load reported no console warning or error. Detailed
observations and the remaining reversible local fixture are recorded in
[`FORMAL_UI_VERIFICATION.md`](FORMAL_UI_VERIFICATION.md).

## Authoritative local closure gate

Full Verification `local-full-verification-20260914024748-33d83e3ef7cc` on
`33d83e3ef7cc68ea8fd1ae6f6b7e6286962a96c4` completed `13/13` stages PASS
with cleanup PASS and candidate fingerprint
`527636399c33ef71072430b1f1a0af8b5080081609844c351ed50ffad0602937`.

- base suite: 838 tests, 818 PASS, 20 governed PostgreSQL skips, zero failures;
- material composite PostgreSQL: 17/17 PASS, zero critical skips;
- PBI-039 PostgreSQL: 2/2 PASS, 62 migrations, zero critical skips;
- PBI-040 PostgreSQL: 1/1 PASS, 62 migrations, zero critical skips;
- 10,000-item Price List benchmark: p95 `7.12 ms` / budget `750 ms`;
- Preview-like runtime, compiled backend, compiled UI and cleanup: PASS.

The only warning was the already visible and accepted Vite main chunk over
500 kB. No gate, assertion, skip policy or threshold was weakened.

## Preview migration chronology remediation

The first governed Preview migration attempt after merge failed closed before
changing the HTTP runtime. Diagnostic status identified
`DATABASE_MIGRATION_DRIFT_DETECTED`: Preview already contained the applied
PBI-043 migration `20260912180000_access_enable_concurrent_operational_sessions`,
while the first five still-pending PBI-040 migrations retained earlier
timestamps from the feature branch's original chronology.

Because none of those five PBI-040 migrations had been materialized in Preview,
the safe remediation renames only their pending migration identities into the
available ordered interval immediately after PBI-043 and before the later
PBI-040 reconciliation migration. Their SQL, ownership and dependency order are
unchanged. The executable DEC-005 registry and exact migration-manifest
contracts were updated to preserve fail-closed chronology; no drift bypass or
manual schema mutation was introduced.

The first local full-verification run after the rename failed closed in the
PBI-043 rollback-safety test because that test still expected the PBI-043
migration to be immediately preceded by the earlier baseline. Its remediation
now reverses the five later Catalog foundation migrations explicitly before
asserting the protected PBI-043 down path. The focused owner-scoped suite then
passed `8/8` with zero skips.

The complete governed rerun passed all `13/13` stages with cleanup PASS:
839 base tests (`819` PASS and 20 governed PostgreSQL skips), material
PostgreSQL `17/17`, PBI-039 `2/2`, PBI-040 `1/1`, 62 migrations, zero critical
skips, Preview-like and compiled runtime smokes, and a 10,000-item Price List
p95 of `6.03 ms` against the `750 ms` budget. Candidate fingerprint:
`2998507474df58edbb86d4f24fc9da930bf700f9af0f49535f5a109c16d43216`.
The accepted Vite chunk-size warning remains visible.

PR #49 CI run `34800704258` failed closed after all product gates in both
executions passed: `collect-ci-evidence` classified the newly governed
`dist/public/runtime-provenance.json` as an unexpected artifact. Commit
`dd3cf105fea5cea4e70c77069669307e9ea809d3` admits only that exact asset and
adds a negative contract rejecting any other JSON under `dist/public`.

After remediation, focused evidence tests passed `17/17`. Full Verification
`local-full-verification-20260914030557-dd3cf105fea5` repeated all `13/13`
stages with cleanup PASS and candidate fingerprint
`dd8369df8c3772ab074b0b919d20ed6c6baa1edf4683e361708b5044c9e5186c`:
839 base tests (`819` PASS, 20 governed PostgreSQL skips, zero failures),
material PostgreSQL `17/17`, PBI-039 `2/2`, PBI-040 `1/1`, 62 migrations,
zero critical skips and p95 `6.37 ms` for 10,000 items. The same accepted Vite
chunk warning remains visible.

## Preview bounded SPA routing remediation

The integrated migration-order remediation was deployed from exact `main`
`a3cd61198a466aef8bef1ddc1c46c9b883d1cf35`. The governed migrator exited
zero with `applied: 10` and `pending: 0`; the application posture was then
restored to role `application`, migrations disabled, and `dist/main.js`.
Health and runtime provenance passed on the same clean SHA.

The first real-browser navigation then found a separate production-serving
regression: `/listas/precios` returned HTTP 404 because the bounded SPA
allowlist still contained only the pre-PBI-040 routes. The React route existed,
but direct navigation and reload could not receive the SPA entrypoint. This is
a deployment integration defect inside the accepted PBI-040 surface, not a
new capability.

The correction keeps the static fallback fail-closed and adds only the exact
routes already declared by `App.tsx`, including Lista de precios and Catalog
Administration. Unknown and API routes remain 404. Source-contract mutations,
compiled UI smoke and OCI image verification now assert both PBI-040 routes so
future Preview candidates cannot pass while direct navigation or reload is
broken.

Full Verification
`local-full-verification-20260914045541-a3cd61198a46` completed all `13/13`
stages with cleanup PASS and candidate fingerprint
`df764b35825646c5fb1609b0282ab786bab238f3c2cd0ef02f245491b3b813de`:
841 base tests (`821` PASS, 20 governed PostgreSQL skips, zero failures),
material PostgreSQL `17/17`, PBI-039 `2/2`, PBI-040 `1/1`, 62 migrations,
zero critical skips and p95 `7.06 ms` for 10,000 items. The compiled UI smoke
proved `/listas/precios` and `/configuracion/catalogos?module=price-list` both
return the identical no-store SPA entrypoint, while `/api/unknown` and an
unknown page remain 404. The accepted Vite chunk warning remains visible.

## Final integration chain

- Feature PR [#49](https://github.com/luisgtzaviles/SrTaller-2.0/pull/49)
  integrated exact head `b035a61719a13e28bc9d3835549b9cb7067883ed` as
  `91bbfabe55069c4c0f94d54d8a8fe1b4541bb357`. Candidate CI
  `34801674770` and exact-main CI `34802433615` passed run-1, run-2 and
  comparison.
- Migration chronology PR [#50](https://github.com/luisgtzaviles/SrTaller-2.0/pull/50)
  integrated `40bbed50e56f4cb07e4cbe01867bb13f50f86f8f` as
  `a3cd61198a466aef8bef1ddc1c46c9b883d1cf35`. Candidate CI
  `34805632530` and exact-main CI `34806294225` passed both legs and comparison.
- Bounded SPA routing PR [#51](https://github.com/luisgtzaviles/SrTaller-2.0/pull/51)
  integrated exact head `68316b014965760a0c476d2e1ebd2c49fc8c2ca7` as
  `09e14c89892f5770977c5028a899714b7a30d6d5`. Full Verification on the
  exact head passed `13/13`: 841 base tests, 821 PASS, 20 governed PostgreSQL
  skips, composite `17/17`, PBI-039 `2/2`, PBI-040 `1/1`, 62 migrations,
  zero critical skips, p95 `6.35 ms`, compiled route smoke and cleanup PASS.
  Candidate fingerprint:
  `585763011d518ebd0c34dc60e9deb55789d4f6a68aad8f5777489b8f55f3b758`.
  PR CI `34808427617` and exact-main CI `34809054770` passed run-1, run-2 and
  comparison. Independent review reported no Critical/High/Medium finding.

## Authenticated Preview closure validation

Preview was manually deployed from exact integrated `main`
`09e14c89892f5770977c5028a899714b7a30d6d5`; Production was not touched.

- `/` returns `200` with `Cache-Control: no-store` and backend headers for the
  exact clean SHA; `/livez` and `/readyz` return `200`; frontend provenance
  reports the same clean SHA.
- Direct `/listas/precios` and
  `/configuracion/catalogos?module=price-list` navigation/reload return the
  SPA; `/api/unknown` and an unknown route remain `404`.
- The existing Administrator role was granted exactly the approved PBI-040
  capabilities: `price_list.read`, `catalog.manage`,
  `catalog.prices.manage`, `catalog.branch_prices.manage`,
  `catalog.reference_cost.read` and `catalog.reference_cost.manage`.
  `catalog.import.prepare` and `catalog.import.publish` remain disabled.
- Role revision invalidated the requesting session as designed; reauthentication
  restored only the requesting browser session. PBI-043's previously accepted
  Preview Owner+QA concurrency proof remains applicable, and the exact-main CI
  re-executed its preservation contracts. No Access code changed in PR #50/#51.
- A governed synthetic item was created with both identifiers blank and received
  server-side SKU `REF-000001` and barcode `SR00000001`. Reload and exact search
  by each identifier recovered it; edit preserved both identifiers.
- Effective price was `$1,399.00` Base Tenant; a `$1,499.00` Branch override
  was applied and revoked, restoring the base price. Authorized reference cost
  `$480.00` appeared only with the personal preference enabled and disappeared
  when disabled.
- The item moved from pending Category/Brand captures to canonical
  `Pantallas Preview QA` and `Apple Preview QA`. Pending queues returned to
  zero with actor/usage preserved.
- A second unused Category exposed `Eliminar`, while the used Category exposed
  only `Desactivar`. It was merged into `Pantallas Preview QA`; the
  source stopped appearing as an ordinary row, survivor version/usage advanced,
  and the zero-use source remained traceable. The survivor was then
  deactivated, observed under Inactivos and reactivated, preserving one linked
  article.
- Price List offered only the applicable Category/Brand after selecting
  Refacción. Refacción + Category + Brand + name search returned the item;
  Producto produced a legitimate zero-results state. `Insumo` remained absent
  from the commercial Type filter.
- The accepted PBI-039 Repair `SR-2026-1000` retained header, Recepción,
  Historial, Conceptos placeholder and Evidencias. The shell was authenticated,
  Station recognized and no material visible runtime/network failure occurred.

The reversible Preview fixtures intentionally retained for audit are the item
`Pantalla Preview QA 20260914 editada`, Category `Pantallas Preview QA` and
Brand `Apple Preview QA`. The temporary alternate Category is a merged source,
not an ordinary active canon. These are synthetic Preview data, not Owner or
Production records.

## PBI-041 material boundary

PBI-041 remains `Ready — implementation not authorized`. The repository has
future capability identifiers and readiness documents, but no Bulk Catalog
Composer, `SupplierSource`, `SupplierCatalogVersion`, `SupplierListing`,
`CatalogUpdateBatch`, table, migration, endpoint, job or batch runtime. Both
import capabilities remain disabled for the Preview Administrator role.

## Closure status

PBI-040 is a `Done candidate`: Owner Acceptance, functional integration,
exact-main CI and Preview validation are complete. The documentary closure PR
plus GREEN exact-main CI materialize `Done` under the canonical workflow.
`Released` remains `NO`; Production was not authorized.
