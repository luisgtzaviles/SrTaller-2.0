# PBI-041 — Implementation Evidence

## Checkpoint

- **Estado:** trusted history + bounded candidate matching PASS en LOCAL; AG
  v11 y la remediación de identidad nueva AG v17 listas para Owner Review;
  Owner Acceptance pendiente.
- **Baseline:** `100eb9abc8b8b3b01da5dcc312777b59bf01a615` (`main == origin/main` al iniciar).
- **Candidato de reactivación:** `f4bc803fe3b086405024f6199b65114feb1feebe`.
- **Candidato de retiro anterior:** `44e605953676456eff519b5b3fca02d952eb5c38`.
- **Implementación core:** `b49a52faaf94184dcb7829bb255b8553b1e58c02`.
- **Cleanup local gobernado:** `a4aef9a`.
- **Decisiones CM:** `b9e1be5`.
- **Implementación trusted/candidate:**
  `f2554cf29f2211d73a688512b6f89de16ce8e108`.
- **Rama:** `feature/pbi-041-bulk-catalog-composer`.
- **Fecha:** 2026-09-16 MST.
- **Delivery:** sin push, PR, merge, Preview, Production ni deploy.
- **Gate deliberadamente no ejecutado:** `verify:full`, reservado por autoridad
  Owner para después de Owner Acceptance.

## Supplier history, automatic versioning and governed delete

La auditoría previa recorrió Source, Version, raw, Listing, RowDecision,
Resolution, ReconciliationMemory, retirement y revisiones de Catalog. El
resultado es fail-closed: una Version `INGESTED`, Resolution, Memory,
RetirementPlan o RetirementEvent bloquea el hard delete de la Source. Sólo una
Source sin historia publicada y con Versions exclusivamente `DRAFT` puede
eliminarse. El conjunto explícito contiene RowDecisions, Listings, draft
Batches, raw, Versions y Source; nunca contiene `CatalogItem`, identifiers,
revisiones de precio/costo ni audit de Catalog.

El candidato agrega secuencia monotónica por Tenant+Source. Un lock de Source
asigna `vN` al guardar, el unique físico evita duplicados y el request id hace
idempotente el retry. La descripción opcional y la fecha son metadata, no
identidad ni matching. La migración backfill ordena la historia existente por
`created_at + version_id` sin reescribir sus snapshots.

La eliminación usa `catalog.suppliers.delete`, sin fallback a
`catalog.manage`. El ejecutor ADR-013 nivel 2 reautentica al mismo actor y el
repository revalida versión, contexto, capability y dependencias dentro de una
transacción. La UI presenta dos confirmaciones; neutraliza Enter en la primera,
arma la segunda con retardo y usa un guard sincrónico más request id para que un
doble click produzca un solo efecto. Un evento append-only desacoplado conserva
actor, Session, Station, reautenticación, correlation y conteos.

El audit transversal encontró dos inconsistencias anteriores, no corregidas en
este alcance: Category/Brand de Catalog dependen de `catalog.manage` y las
referencias de Repairs de `repairs.catalogs.manage` para hard delete. Quedan
registradas como deuda; no son precedente para SupplierSource.

### Verificación focalizada de la iteración

- Contratos de dominio, Access, arquitectura, schema, migraciones, UI y entorno
  local: 80 PASS, 0 FAIL, 0 SKIP.
- PostgreSQL material: 1 PASS con 69 migraciones y cleanup del contenedor
  desechable. El benchmark de 10,000 filas registró ingest 4,169.5 ms,
  análisis 388.3 ms, preview 38.5 ms, publish 2,201.0 ms y 118.5 MiB.
- Dos conexiones independientes guardando simultáneamente contra la misma
  Source recibieron secuencias monotónicas distintas; retries idempotentes y
  versiones del mismo día permanecieron válidos.
- Safe delete, bloqueo por historia, Tenant isolation y ausencia de capability
  se probaron en backend sin eliminar CatalogItem ni evidencia publicada.

La primera migración in-place sobre el Tenant histórico local reveló una
incompatibilidad que el caso fresh no ejercitaba: el trigger de inmutabilidad
de Version `INGESTED` rechazaba el backfill de `sequence_number`. La migración
se endureció con una ventana autosellada: sólo admite llenar
`sequence_number` desde `NULL` cuando el resto completo de la fila es idéntico;
después reemplaza la función por la guarda final. El upgrade local preservó el
volumen y avanzó de 67 a 69 migraciones sin reset.

## Safe Catalog retirement decision and materialization

El Development Preflight pasó sobre
`2db8e3dc6eda44f6a5c2a78fa2323488edf1ae22`. El runtime local inicialmente era
stale; se reinició con el mecanismo gobernado y
`verify:runtime-provenance` confirmó frontend/backend exactos al mismo HEAD y
working tree limpio.

El audit previo observó que el schema local gobernado contenía 1,539
`CatalogItem`. Los 1,539
tienen identificadores y revisión de precio; 1,401 tienen costo, 1 tiene
override de Branch, 1,499 aparecen como targets de RowDecision, 1,536 tienen
SupplierListingResolution y 1,536 tienen ReconciliationMemory. No existe un
artículo sin relaciones actuales.

Las relaciones actuales hacia `CatalogItem` son:

- `catalog_item_identifiers` — FK `RESTRICT`, update/delete prohibidos por
  trigger append-only;
- `catalog_base_price_revisions` — FK `RESTRICT`, append-only;
- `catalog_branch_price_revisions` — FK `RESTRICT`, append-only;
- `catalog_reference_cost_revisions` — FK `RESTRICT`, append-only;
- `catalog_update_row_decisions.target_item_id` — FK sin cascade;
- `catalog_supplier_listing_resolutions.item_id` — FK sin cascade y resolución
  append-only;
- `catalog_supplier_reconciliation_memory.item_id` — FK sin cascade.

La publicación permite distinguir `CREATED` de `MATCHED` en Resolution, pero
no permite hard delete sin romper historia. Tampoco existe una reversión exacta
de updates porque description/Category/Brand carecen de before-images
autoritativos. Ese dictamen sigue vigente y delimita la solución aprobada.

`OD-RESET-001..005` resolvió la decisión: `Vaciar lista de precios` es retiro
`ACTIVE→INACTIVE`, no delete; el batch sólo puede retirar identidades que su
Resolution demuestra `CREATED`; MATCHED/UPDATED no se revierten. La operación
es ADR-013 nivel 2 con capability dedicada `catalog.items.bulk_retire`, PIN del
mismo actor, plan server-side de cinco minutos, confirmación exacta y
revalidación serializable del contexto, authority y hash `itemId+version`.

El lifecycle de `CatalogItem` ya representaba el retiro, por lo que no se creó
una migración de lifecycle. Las dos expansiones necesarias agregan la capability
Access y las tablas Tenant-scoped `catalog_retirement_plans` y
`catalog_retirement_events`; la segunda es append-only. La ejecución agrega
audit por item, nunca usa `DELETE/CASCADE`, y un plan stale/alien/context-changed
falla con cero retiros.

## Historical Catalog reactivation decision and materialization

El guard anterior clasificaba como `CONFLICT` todo target histórico inactivo.
La auditoría confirmó que ese comportamiento fue deliberadamente fail-safe,
pero también que el modelo ya conserva una cadena autoritativa suficiente:
Source + señal exacta del Listing + ReconciliationMemory consistente + único
`itemId` del mismo Tenant y Tipo. La corrección conserva el guard para memoria
ambigua, contradictoria, corrupta, incompatible o ajena, y sólo introduce
`REACTIVATE` cuando toda esa prueba converge.

`REACTIVATE` no es una segunda identidad ni una forma de fuzzy matching. El
publish exige que el target siga `INACTIVE` en su `expectedVersion`, cambia el
mismo item a `ACTIVE`, agrega sólo las revisiones de precio/costo que realmente
cambiaron, registra Resolution `MATCHED` y audit por fila, y conserva
identificadores, listings y memoria. Todo ocurre en la misma transacción; no
existe `REACTIVATE_AND_UPDATE`.

El schema de `CatalogItem` no necesitó cambios. La migración mínima
`20260914154000_catalog_add_historical_reactivation` amplía únicamente el CHECK
cerrado de `CatalogUpdateRowDecision.classification`. Su `down` convierte de
forma conservadora las decisiones aún clasificadas `REACTIVATE` a `CONFLICT`
antes de restaurar el conjunto previo.

## Superficie revisable por Owner

`/listas/precios/carga-masiva` entrega el primer Composer gobernado con dos
modos sobre el mismo engine:

- **Alta completa:** Tipo, título, descripción, Category, Brand, código de
  proveedor, SKU, barcode, precio base y costo observado.
- **Actualización compacta:** identificadores/señales de continuidad y campos
  comerciales proponibles, sin convertir el título en identidad.

La superficie permite paste rectangular desde Sheets, edición directa,
selección visible, navegación por teclado, undo antes de ingesta, draft durable,
análisis, reconciliación agrupada, preview, comparación entre versiones y
publicación confirmada. La grid virtualiza el DOM; los límites se rechazan sin
truncamiento ni persistencia parcial.

La iteración Owner de ergonomía añade una vista esencial `Título | Costo |
Precio`, contexto de lote para Tipo/Category/Brand, copy-fill con undo,
redimensionamiento manual y auto-fit. El título observado se conserva exacto en
`SupplierListing`; la propuesta editable normaliza presentación sin convertir
ese texto en identidad. El costo recibido sigue siendo evidencia de proveedor y
sólo propone `ReferenceCostRevision`: no se convierte en costo de compra.

La iteración de workspace y validación concentra el trabajo en la grid: fuentes
y contexto pueden compactarse, columnas y acciones viven en una toolbar única,
el header permanece alineado durante scroll y `← Lista de precios` usa el patrón
reusable del Design System. El Composer no repite el banner de ambiente del
shell. Confirmaciones y acciones reversibles usan Toast; los errores que exigen
decisión permanecen visibles.

## Reproducción histórica del fallo Owner ya sustituido

Antes de modificar la experiencia se reprodujo el guardado observado:

- UI: `No se guardó. Revisa campos requeridos, importes y revisión única.`;
- request: `POST /api/catalog/supplier-versions`, Source `AG`, revisión
  `Versión 1`, modo `FULL`, 36 filas;
- response: HTTP `409`, body `{"code":"CATALOG_CONFLICT"}`;
- correlation: `004f9c66-c261-4c16-8170-99c38efde7e3`;
- fuente: constraint PostgreSQL
  `catalog_supplier_versions_revision_uq (tenant_id, source_id,
  source_revision)`; el repositorio convertía toda violación `23505` en el
  conflicto genérico y la UI descartaba ese contexto.

Clasificación en aquel corte: error de **lote** en `Versión del proveedor`. La
iteración actual elimina ese input manual: el servidor asigna `vN` y la
descripción opcional no participa en el unique. La corrección intermedia que
publicaba `CATALOG_SUPPLIER_VERSION_ALREADY_EXISTS` quedó sustituida por esta
secuencia automática; el fallo manual ya no es alcanzable desde la UI. No se
expusieron tokens, credenciales ni datos Owner reales.

## Fixtures sintéticos gobernados

| Fixture | Estado | Propósito |
|---|---|---|
| AG / Owner real paste 36 | `DRAFT` | 36 pantallas sintéticas, pegado 3 columnas, contexto `Refacción / Pantallas / Apple` y recuperación por reload; no escribe Catalog |
| AG / Versión 1.2 | `APPLIED` | las mismas 36 identidades históricas, con costo/precio nuevos: reanálisis 36 `REACTIVATE`, publicación sobre los mismos items y cero altas |
| Proveedor Demo / Versión 1 | `APPLIED` | 1,500 observaciones sintéticas, publicación inicial y memoria histórica |
| Proveedor Demo / Versión 2 | `RECONCILING` | 1,500 observaciones equivalentes con cambios controlados y comparación |
| Historical Tenant desechable | `ACTIVE CATALOG EMPTY` | cuatro items retirados, cero activos y Listings/Resolutions/Memory intactos; una V5 reconoce el item retirado como conflicto/reactivación, no `NEW` |
| Virgin Tenant desechable | `NO HISTORICAL CATALOG MEMORY` | primera B1 de 36 pantallas AG queda 36 `NEW`; una B2 mixta prueba un UPDATE, 35 UNCHANGED y un NEW |

La comparación visible de Version 2 contra Version 1 produce:

- mapeadas: 1,496;
- cambiadas: 249;
- nuevas: 2;
- desaparecidas: 3;
- ambiguas: 1.

Los datos son exclusivamente locales y sintéticos. El estado fue creado por el
mecanismo normal de Source/Version/Listing/Batch, no mediante escritura manual
para aparentar un resultado.

Historical y Virgin no comparten Tenant. La prueba PostgreSQL crea y elimina
su contenedor completo, por lo que demuestra el primer intake sin borrar la
historia del Tenant habitual.

## Contratos materializados

- `SupplierSource` es Tenant-scoped.
- `SupplierCatalogVersion` conserva content hash, modo, revisión y lineage de
  corrección; Listings y raw quedan inmutables después de ingesta.
- El draft usa versión optimista y sobrevive reload.
- Matching automático se limita a SKU, barcode, supplier code o firma histórica
  exacta, única y consistente. Título/similitud nunca escriben Catalog.
- La corrección de mapping conserva historia; una corrección durable marcada
  como incompatible se clasifica `CONFLICT`, mientras múltiples historias
  independientes permanecen `AMBIGUOUS`.
- `CatalogUpdateBatch` y sus decisiones son independientes de la versión de
  proveedor.
- Publish revalida sesión, capabilities, Tenant, expected version, decisiones y
  referencias dentro de una transacción PostgreSQL all-or-nothing.
- Retry idempotente devuelve el mismo resultado sin duplicar items, precios,
  costos o memoria.
- Precio base y Reference Cost crean revisiones sólo cuando hay cambio material;
  Branch overrides no son mutados.
- Raw vence a 90 días y el purge idempotente conserva metadata, listings
  estructurados, mappings, batches, revisiones y audit.
- `ACTIVE→INACTIVE` conserva identidad e historia. Un mapping histórico exacto,
  único, consistente y compatible hacia ese target se clasifica `REACTIVATE`;
  un target sin esa prueba continúa bloqueado como
  `HISTORICAL_ITEM_RETIRED_REQUIRES_REACTIVATION` y nunca se duplica.
- Una versión/batch ya `APPLIED` no puede reanalizarse ni republicarse con otra
  clave; el retry con la misma identidad idempotente devuelve el mismo outcome
  sin agregar revisiones, resolutions ni audit.
- El plan global obtiene el conjunto desde Catalog; el plan por batch sólo
  considera Resolution `CREATED`. Ambos quedan ligados al contexto creador.
- El ejecutor Level 2 consume una prueba PIN de un solo uso del mismo actor y
  Catalog vuelve a validar plan, conjunto y commit guards dentro de transacción.

## Seguridad y ownership

La preparación exige `catalog.import.prepare`. Publicar exige además
`catalog.import.publish`, `catalog.manage` y `catalog.prices.manage`; observar o
publicar costo también exige las capabilities de Reference Cost. El backend
omite costo en respuestas cuando falta autorización. Tenant, Branch, Station,
User, Session y correlation se derivan del contexto confiable.

PBI-041 no adquiere ownership de Inventory, Procurement, Caja, Repair Concepts,
Pedidos, Solicitudes de clientes, Files ni Branch Pricing. Tampoco introduce
CSV/XLSX, supplier API o Advanced Supplier Reconciliation.

La capability masiva no se deriva de `catalog.manage`. Access conserva la
reautenticación; Catalog conserva plan, lifecycle, retiro y audit. El cliente
no elige Tenant, actor, targets ni clasificación sensible.

## Verificación focalizada

### Cierre de la iteración `OD-RESET-001..005`

Sobre `44e605953676456eff519b5b3fca02d952eb5c38`, sin ejecutar
`verify:full`, se obtuvo:

- build TypeScript/Vite: PASS; conserva únicamente la advertencia conocida de
  tamaño del chunk principal;
- 71/71 contratos focalizados de retirement, Level 2, API/UI, autorización,
  arquitectura, schema y migraciones: PASS;
- suite PostgreSQL material PBI-041: PASS con 66 migraciones y cleanup del
  contenedor desechable;
- suite base completa de la iteración: 885 pruebas, 864 PASS, 0 FAIL y 21 SKIP;
- suite PostgreSQL PBI-040 de no regresión: PASS; búsqueda sobre 10,000 items
  con p95 de 6.01 ms;
- benchmark PBI-041 de 10,000 filas: ingesta 6,084.2 ms, análisis 430.3 ms,
  preview 66.2 ms, publish 24,470.1 ms y 34.1 MiB de heap, dentro de los
  budgets vigentes.

El Development Preflight final detectó correctamente que el journal local
tenía 64 migraciones frente a las 66 del candidato. Las dos expansiones se
aplicaron mediante el mecanismo gobernado y no destructivo; el seed sintético
fue reconciliado sin imprimir PINs y el runtime quedó en frontend/backend del
mismo candidato.

La prueba Owner sobre el Tenant histórico se hizo por las superficies reales:

1. `Retirar artículos creados por este lote` planificó 1,500 targets
   autoritativamente `CREATED`, reautenticó al mismo actor y retiró exactamente
   esos 1,500; `MATCHED/UPDATED` permanecieron.
2. `Vaciar lista de precios` volvió a planificar el conjunto actual, reautenticó
   y retiró los 39 items activos restantes. La lista activa mostró el empty
   state con cero resultados.
3. La lectura PostgreSQL posterior conservó 1,539 items inactivos, 1,539 SKU,
   1,539 barcodes, 1,539 revisiones de precio base, 1,401 revisiones de costo,
   un override Branch, 4,609 Listings, 1,836 Resolutions, 1,836 entradas de
   ReconciliationMemory, siete batches, dos planes ejecutados y 1,539 eventos
   de retiro. No se ejecutó `DELETE` ni se perdió identidad o historia.
4. Una nueva versión AG de las mismas 36 pantallas produjo 0 `NEW` y 36
   `CONFLICT`: cada fila explicó que la memoria histórica apunta a un artículo
   retirado y exige reactivación explícita. La cuadrícula mostró `Original:`.

### Iteración Historical Catalog reactivation

Sobre `f4bc803fe3b086405024f6199b65114feb1feebe`, sin corrección manual de
mappings, reset de DB ni `verify:full`:

- 33/33 contratos focalizados de bulk, domain/application, UI, arquitectura,
  schema y manifest de migraciones: PASS;
- typecheck backend/web y build TypeScript/Vite: PASS; sólo permanece la
  advertencia conocida de tamaño del chunk principal;
- PostgreSQL material PBI-041: PASS con 67 migraciones y cleanup del contenedor
  desechable. El caso de 36 filas cubrió stale expectedVersion, rollback sin
  parciales, reanálisis, dos publicaciones concurrentes, retry idempotente,
  identidad exacta y 36 audit events;
- benchmark incluido: ingesta 10,000 `5,402.7 ms`, análisis `406.8 ms`, primera
  preview `39.3 ms`, publish `20,573.8 ms`, heap adicional `70.4 MiB`, dentro
  de los budgets vigentes.

El fixture local preservado `AG / Versión 1.2` es
`d08616af-33d4-44b8-a636-ecaacf4c72ba`; su batch es
`aeb87845-b9ec-4370-a12e-901e3dad0b2b`. Antes del reanálisis tenía 36
`CONFLICT`, 36 targets `INACTIVE` y propuestas de precio/costo distintas. El
reanálisis produjo exactamente 0 `NEW`, 0 `UPDATE`, 36 `REACTIVATE`, 0
`UNCHANGED`, 0 `PENDING_REFERENCE`, 0 `AMBIGUOUS`, 0 `CONFLICT` y 0 `INVALID`.
La UI mostró estado actual Inactivo, propuesta Reactivar y el diff monetario,
sin campo de UUID manual.

La confirmación explícita y el publish dejaron el batch `APPLIED`. El agregado
material cambió de 0 activos / 1,539 inactivos a 36 activos / 1,503 inactivos,
con 1,539 items antes y después. SKU y barcode permanecieron 1,539/1,539;
Listings permanecieron 4,681; ReconciliationMemory permaneció 1,836. Se
agregaron exactamente 36 PriceRevisions (1,539→1,575), 36 CostRevisions
(1,401→1,437), 36 Resolutions `MATCHED` (1,836→1,872) y 36 audit events
`catalog.bulk.publish.row` con clasificación `REACTIVATE` y lifecycle
`INACTIVE→ACTIVE` (3,075→3,111).

Los IDs preservados antes/después son:

| Fila | `itemId` antes = después | SKU | Barcode |
|---:|---|---|---|
| 1 | `7e0de2f0-9f58-455d-b4d2-a749386f36d9` | `REF-000839` | `SR00001600` |
| 2 | `a8a49950-6d64-4f2e-b634-cad49ffbd13b` | `REF-000840` | `SR00001601` |
| 3 | `36b1c923-908e-4e0d-9e09-0c50e11533e6` | `REF-000841` | `SR00001602` |
| 4 | `e566c30d-4895-4ac9-9f7c-8aa4f1724e62` | `REF-000842` | `SR00001603` |
| 5 | `0223c4b4-3a68-4b88-a679-8a85aaff817e` | `REF-000843` | `SR00001604` |
| 6 | `e32e34ec-0411-47bb-a2cc-a612fc78d513` | `REF-000844` | `SR00001605` |
| 7 | `3ea605ae-6944-448a-bcfc-c23cc780d6ca` | `REF-000845` | `SR00001606` |
| 8 | `fff7da89-34a7-4669-80f2-566b536317bb` | `REF-000846` | `SR00001607` |
| 9 | `2cc6d7bf-4ff5-4310-9139-0eead8770b15` | `REF-000847` | `SR00001608` |
| 10 | `379facb4-28b3-4d08-8034-c41595fa1b88` | `REF-000848` | `SR00001609` |
| 11 | `9a617954-a1b5-4de3-917d-8cf2c0d75c92` | `REF-000849` | `SR00001610` |
| 12 | `a85c0b51-c1f4-4138-84d5-e1debed7f01e` | `REF-000850` | `SR00001611` |
| 13 | `6d86a99a-9894-456a-b868-3711c893bc3d` | `REF-000851` | `SR00001612` |
| 14 | `5a7f9e65-b4b1-4091-8941-aebe83a2d53a` | `REF-000852` | `SR00001613` |
| 15 | `0d724c90-10b5-4fb0-9f92-c1c7f91679d3` | `REF-000853` | `SR00001614` |
| 16 | `79706fcb-2ea1-4938-912f-4981a3ee75ff` | `REF-000854` | `SR00001615` |
| 17 | `49ca8640-066c-459e-b7bd-8ac695290e04` | `REF-000855` | `SR00001616` |
| 18 | `1b65b297-3649-4a22-85a8-e239f1a2f9f0` | `REF-000856` | `SR00001617` |
| 19 | `e4c05fd2-c83e-4fff-aeaa-66414c61a97e` | `REF-000857` | `SR00001618` |
| 20 | `29703aeb-76dc-4b79-9aee-362fa6d0e33e` | `REF-000858` | `SR00001619` |
| 21 | `1fc737af-bdf3-446b-8eef-cfe3a46f8bbb` | `REF-000859` | `SR00001620` |
| 22 | `6fa9faec-8bd4-4e23-a644-ab716d9806b5` | `REF-000860` | `SR00001621` |
| 23 | `454df71b-a6d5-4b89-a180-ff3a357732c4` | `REF-000861` | `SR00001622` |
| 24 | `7c7e9819-6186-4134-b31b-e42976458d12` | `REF-000862` | `SR00001623` |
| 25 | `55c032a9-df8e-4784-86b7-1bfcdeca5ee2` | `REF-000863` | `SR00001624` |
| 26 | `edb39899-7e2e-4fa9-bd70-26238028d921` | `REF-000864` | `SR00001625` |
| 27 | `88dd95fe-22c0-458c-8dcc-7de0ef621a9d` | `REF-000865` | `SR00001626` |
| 28 | `4b669821-7f5c-4e6c-b8d8-07c4130e5c10` | `REF-000866` | `SR00001627` |
| 29 | `a37c542b-23f1-43c1-8d1d-2427714d3dbd` | `REF-000867` | `SR00001628` |
| 30 | `0c13f646-67e9-45a0-9cb6-c7d9a950eb4f` | `REF-000868` | `SR00001629` |
| 31 | `54c9635e-c05b-4f16-9bfa-e80d8997891c` | `REF-000869` | `SR00001630` |
| 32 | `340ec4c1-8808-46ca-ab3c-12525a5f3a74` | `REF-000870` | `SR00001631` |
| 33 | `fc8d014a-9542-4f2b-9ce5-29374a5d60ef` | `REF-000871` | `SR00001632` |
| 34 | `e6804dcd-20eb-4dc4-aca2-a1c5d91d00a7` | `REF-000872` | `SR00001633` |
| 35 | `7f0b27b9-bd53-414c-b25c-8423f1d3c2e4` | `REF-000873` | `SR00001634` |
| 36 | `f76312a3-cf09-4c46-9262-2813debd13b9` | `REF-000874` | `SR00001635` |

Cada uno terminó `ACTIVE`, versión 3, con dos revisiones históricas de precio y
dos de costo; la revisión vigente coincide con la propuesta de la versión 1.2.
La validación agregada obtuvo `36/36` items distintos, activos, con ambos
identificadores, precio exacto, costo exacto y un audit de reactivación por
item. No se creó ningún `CatalogItem`.

La suite negativa conserva `UPDATE` para activo con cambio, `UNCHANGED` para
activo sin cambio, y `AMBIGUOUS/CONFLICT` para múltiples candidatos, memoria o
Tipo incompatible y targets no autorizados por Tenant. También demuestra que
un stale write revierte las 36 filas, que concurrencia no duplica y que el retry
con el mismo request id no añade revisiones. Reanalizar una versión cuyo batch
ya está `APPLIED` falla cerrado; la UI final no ofrece controles de reanálisis o
reconciliación mutables sobre ese resultado.

El escenario Virgin se ejecutó en un Tenant sintético aislado dentro del
contenedor desechable: la primera versión B1 de 36 filas fue 36 `NEW`. Una B2
posterior probó 1 UPDATE, 35 UNCHANGED y 1 NEW; su acción acotada retiró sólo el
único item demostrado `CREATED` por B2 y conservó los 36 `MATCHED`. Esto prueba
materialmente que `ACTIVE CATALOG EMPTY` y `NO HISTORICAL CATALOG MEMORY` son
estados distintos.

El clasificador shadow declaró `CROSS_MODULE_HIGH_RISK`, observó
`APPLICATION_LOGIC`, `AUTHORIZATION_SECURITY`, `CI_INFRASTRUCTURE`,
`DATABASE_SCHEMA`, `DOCS_ONLY`, `MIGRATION` y `UI_ONLY`, seleccionó conceptualmente
pipeline completo y conservó `fullExactMainRequired=true`. No omitió ni alteró
ningún gate.

Sobre el candidato ejecutable se ejecutaron:

- build TypeScript/web: PASS;
- 91 contratos focalizados de domain, API/UI, autorización, arquitectura,
  schema, migrations y workflow: 91 PASS, 0 FAIL, 0 SKIP;
- suite PostgreSQL material PBI-041: 1 PASS, 0 FAIL;
- 64 migrations en PostgreSQL desechable y cleanup de contenedor: PASS;
- Tenant isolation, unauthorized cost omission, immutable ingested version,
  correction lineage, ambiguity, purge, idempotency y rollback atómico: PASS.

El build conserva una advertencia no bloqueante de Vite por tamaño del chunk
principal mayor a 500 kB; no hubo error de compilación ni cambio de gate.

Sobre la iteración Owner `8b934080071e` se ejecutaron, sin `verify:full`:

- 21/21 contratos de paste, trimming terminal, títulos, costos, defaults,
  teclado, fill, auto-fit, Catalog y UI;
- 42/42 contratos de dominio, autorización contextual y DEC-005;
- build TypeScript/Vite: PASS;
- suite PostgreSQL PBI-041: PASS con 64 migraciones, aislamiento desechable y
  cleanup; la separación entre título observado/propuesto quedó verificada en
  respuesta, listing y `source_observation`.

Sobre la iteración de workspace/validación `a2098ddb57f9` se ejecutaron, sin
`verify:full`:

- 18/18 contratos focalizados de Composer y bulk: PASS;
- 16/16 contratos compartidos de catálogo, autorización contextual y Design
  System: PASS;
- typecheck TypeScript/web: PASS;
- build TypeScript/Vite: PASS; conserva sólo la advertencia conocida del chunk
  principal mayor a 500 kB;
- suite PostgreSQL material PBI-041: PASS, incluida la traducción exacta del
  constraint de revisión duplicada y cleanup gobernado.
- la reconciliación documental fue clasificada fail-closed como
  `CROSS_MODULE_HIGH_RISK` porque toca la autoridad del Design System. Por esa
  razón `verify:docs-only` la rechazó correctamente; no se ejecutó
  `verify:full`, que permanece expresamente reservado hasta Owner Acceptance.

## Performance y límites

Veinte repeticiones completas sobre el core `b49a52f` terminaron 20/20 PASS. El
fix final `6936ab2` sólo contiene CSS y conserva exactamente el backend medido.
El p95 por nearest-rank fue:

| Caso | Resultado | Budget |
|---|---:|---:|
| ingesta 10,000 | 4,555.6 ms | preparación dentro del envelope del test |
| análisis 10,000 | 344.1 ms | <= 30,000 ms |
| primera preview 10,000 | 36.3 ms | <= 2,000 ms |
| publish total 10,000 | 2,189.2 ms | <= 30,000 ms |
| heap adicional | 118.3 MiB | <= 250 MiB |
| caracterización engine 50,000 | 38.6 ms | observación, no capacidad publicada |
| rechazo 50,000 | 0.0 ms; persisted=0 | rechazo completo |

El rango observado del publish fue 2,082.5–2,191.8 ms. Esta muestra se ejecutó
después del hardening de inserts agrupados y memoria histórica mínima
suficiente; no se retiró ninguna assertion ni límite para obtener el resultado.

En Chrome real, un paste de 10,000 filas mantuvo 22 filas DOM virtualizadas,
181–215 ms de tiempo observado, tarea principal CDP de 198.094 ms y aumento de
heap de 2.73 MiB.

La transformación de clipboard medida en la iteración Owner obtuvo p95 de
2.0 ms para 1,500 filas y 16.2 ms para 10,000. La campaña PostgreSQL de 10,000
filas registró ingest 4,766.7 ms, análisis 394.1 ms, preview 43.8 ms, publish
2,460.7 ms y 126.7 MiB de heap, dentro de los budgets vigentes.

## Matriz browser observada

| Observación | Resultado |
|---|---|
| 1280, light, flujo V1/V2 y comparación | PASS |
| 768, dark, jerarquía y acciones | PASS |
| 640, light, navegación y grid | PASS |
| teclado: Tab, Shift+Tab, flechas y Enter | PASS |
| paste rectangular, selección y anuncio accesible | PASS |
| reload de Source/Version/draft | PASS |
| caso Owner 36 × 3 + 963 filas terminales vacías | PASS; quedaron exactamente 36 filas |
| Batch Context y override por fila | PASS; cambiar el default no reescribió filas capturadas |
| fill handle + undo + Escape | PASS; relleno 450 y restauración 520/490 observados |
| resize manual + doble clic auto-fit | PASS |
| light/dark en viewport normal | PASS |
| consola final | 0 errores, 0 warnings |
| red final | 0 respuestas HTTP >=400; una Fetch cancelada por reload intencional |
| workspace compacto 1280 light | PASS; grid dominante, fuentes y contexto compactados |
| workspace compacto 768 dark | PASS; toolbar, navegación y grid visibles |
| workspace compacto 640 light/dark | PASS; controles apilados y scroll horizontal gobernado |
| guardar con 3 errores | PASS; 1/3 enfocó `Título fila 1`, sin request ni escritura parcial |
| anterior/siguiente | PASS; 2/3 enfocó costo fila 2 y 3/3 enfocó precio fila 36 |
| fila virtualizada fuera de vista | PASS; fila 36 se materializó, desplazó y enfocó; contrato puro cubre `rows.826.basePriceMinor` como fila 827 |
| corrección de error | PASS; al corregir título, el contador cambió inmediatamente de 3 a 2 |
| copy-fill + undo con Toast | PASS; 450 se extendió por drag, Toast no movió layout, undo restauró `1,2`/490 y anunció la reversión |
| guardado válido + reload | PASS; Toast de borrador guardado, reload, reapertura desde historial y recuperación de 36 filas + `PART/Pantallas/Apple` |
| conflicto de revisión duplicada | PASS; error batch persistente junto a versión y foco en el control |
| consola de la iteración final | 0 errores, 0 warnings |
| jerarquía Supplier → Versions | PASS; AG 8, Demo 3 y QA 2; versiones newest-first con estado, fecha, filas y descripción |
| creación explícita de Source | PASS; `Proveedor QA eliminable 15 sep` nació con 0 Versions y la selección no persistió una carga vacía |
| versionado automático mismo día | PASS; dos guardados recibieron `v1` y `v2`, ambos 15 sep 2026, sin input manual ni colisión |
| descripción + reload | PASS; reload conservó ambas Versions y reabrir `v2` recuperó `QA segunda versión del día` |
| historial colapsado | PASS; el panel desapareció, el grid ganó ancho y quedó un solo control `Abrir fuentes y versiones` accesible por teclado |
| protección de Source histórica | PASS; AG y Proveedor Demo muestran delete deshabilitado por historia publicada/dependencias |
| doble confirmación Supplier delete | PASS; Enter no avanzó la primera, la segunda exigió PIN y el botón destructivo sólo se armó tras el retardo |
| efecto destructivo browser | NOT EXECUTED; se canceló para conservar el fixture Owner; PostgreSQL material cubre ejecución, doble envío y bloqueo |
| overflow 1280/768/640 | PASS; documento y acciones sin overflow; sólo la grid conserva su scroll horizontal gobernado |
| consola Supplier/version iteration | 0 errores, 0 warnings |

## Workflow shadow

El clasificador WF-006 evaluó el delta base→candidato como
`CROSS_MODULE_HIGH_RISK`. Observó `APPLICATION_LOGIC`,
`AUTHORIZATION_SECURITY`, `CI_INFRASTRUCTURE`, `DATABASE_SCHEMA`, `MIGRATION` y
`UI_ONLY`; recomendó pipeline completo, mantuvo
`fullExactMainRequired=true` y no omitió gates. Shadow no alteró el resultado.

## Remediaciones durante la implementación

- La primera corrida PostgreSQL rebasó el timeout envolvente de 60 s sin fallo
  semántico; el envelope se alineó a 90 s conservando todos los budgets.
- El publish inicial de 10,000 filas tardó más de un minuto por escrituras
  unitarias. Se perfiló y cambió a inserts agrupados y memoria histórica mínima
  suficiente; el resultado final fue 1.9 s sin retirar assertions.
- DEC-005 detectó la segunda migración no registrada. Se actualizó su política y
  la suite completa de arquitectura focalizada volvió a PASS.
- La inspección Owner final detectó overflow horizontal en Reconciliación a
  1280 px. Los fixes CSS `c394126` y `6936ab2` contienen texto largo, apilan el
  workspace cuando el ancho útil lo requiere, conservan visibles ambas acciones
  y volvieron a pasar build y 11/11 contratos UI/bulk focalizados.
- La primera prueba de recuperación conservó las 36 filas pero perdió el
  contexto del lote por una carrera entre efectos de `sessionStorage`; se movió
  la lectura al inicializador de estado y la recarga posterior conservó
  `Refacción / Pantallas / Apple`.
- El error genérico al guardar una revisión ya existente ocultaba una constraint
  conocida. Se especializó la traducción PostgreSQL y su código de API; la UI
  ahora conserva los fallos globales en banner y lleva los errores de lote o
  celda al punto exacto de corrección.
- El upgrade in-place del Tenant histórico encontró que el trigger de Version
  `INGESTED` también bloqueaba el backfill de secuencia. La migración ahora abre
  únicamente la transición `NULL → sequence_number` cuando todo el resto de la
  fila permanece idéntico y reinstala después la guarda final. El mismo volumen
  avanzó de 67 a 69 migraciones sin reset.
- La matriz Chrome de esta iteración detectó que el setup imponía 45–69 px de
  ancho extra a 1280. `min-width: 0` en los tracks y un setup `auto-fit`
  eliminaron el overflow externo; 18/18 contratos UI/bulk, typecheck y build
  volvieron a PASS.

## Synthetic Demo fixture cleanup

El Owner autorizó retirar por completo de LOCAL el fixture persistente
`Proveedor Demo`, pero sólo después de demostrar su genealogía aislada. La
auditoría se hizo antes de cualquier delete y resolvió la identidad exacta como
`1dbec1cf-eb2e-4f96-b3f0-caab42316855` dentro del Tenant sintético local.

### Inventario pre-delete

| Entidad | Total actual | Exclusivo Demo | Compartido / otro | Acción propuesta |
|---|---:|---:|---:|---|
| SupplierSource | 2 | 1 | 1 | eliminar sólo Demo |
| SupplierCatalogVersion | 11 | 3 | 8 | eliminar las tres Version de Demo |
| SupplierRawPayload | 11 | 3 | 8 | eliminar los tres payloads Demo |
| SupplierListing | 4,753 | 4,500 | 253 | eliminar Listings Demo |
| UpdateBatch | 11 | 3 | 8 | eliminar Batches Demo |
| RowDecision | 4,753 | 4,500 | 253 | eliminar decisiones Demo |
| Resolution / Mapping | 1,908 | 1,800 | 108 | eliminar mappings Demo |
| ReconciliationMemory | 1,836 | 1,800 | 36 | eliminar memoria Demo |
| RetirementPlan | 4 | 1 | 3 | eliminar evidencia exclusiva Demo |
| RetirementEvent | 3 | 1 | 2 | eliminar evidencia exclusiva Demo |
| CatalogItem | 1,539 | 1,500 | 39 | eliminar sólo items exclusivos Demo |
| ItemIdentifier | 3,078 | 3,000 | 78 | eliminar SKU/barcode de esos items |
| BasePriceRevision | 1,611 | 1,500 | 111 | eliminar revisiones exclusivas Demo |
| ReferenceCostRevision | 1,473 | 1,364 | 109 | eliminar revisiones exclusivas Demo |
| BranchPriceRevision | 1 | 0 | 1 | preservar |
| CatalogAuditEvent | 3,147 | 3,000 | 147 | eliminar eventos exclusivos Demo |

La exclusividad no se infirió por volumen. Los 1,500 `CatalogItem` coincidieron
uno a uno en `kind`, título y descripción `Observación sintética` con el
generador determinista interno; las 4,500 Listings coincidieron con sus tres
ejecuciones V1/V2. Los 1,800 Resolution `CREATED` apuntaban exactamente a esos
1,500 IDs; 1,200 aparecían una vez y 300 dos veces. Todos estaban `INACTIVE`,
fueron creados en el mismo instante de fixture y sus únicos audit events eran
1,500 publish + 1,500 retire del batch sintético.

No hubo un solo Resolution, Memory o RowDecision de AG hacia esos IDs. Las 36
identidades AG quedaron fuera del conjunto y no apareció FK operativa de
Repairs, Caja, Inventory u otro bounded context hacia los targets. Category y
Brand compartidas, secuencias del Tenant y todas las relaciones no Demo se
clasificaron como preservadas. `catalog_commands` no referenciaba ninguno de
los 1,500 items.

### Mecanismo y resultado

`pnpm local:cleanup:synthetic-supplier` es un mecanismo explícito de
remediación local. En modo normal sólo audita; para ejecutar exige `--execute`,
el UUID y nombre exactos. Además comprueba `.env.local`, host/puerto/base/users
locales, contenedor Docker gobernado, labels `local/postgres`, bind loopback y
volumen exacto. La transacción `SERIALIZABLE` bloquea las tablas materiales,
repite toda la auditoría y compara conteos exactos antes de escribir.

El primer intento encontró correctamente los triggers append-only y revirtió
sin cambios. El mecanismo final usa exclusivamente el admin local para
deshabilitar temporalmente los triggers `USER` de las nueve tablas de historia
dentro de la misma transacción; las FK internas permanecen activas. Rehabilita
y verifica cada trigger antes del commit. No usa `session_replication_role`, no
expone endpoint, no cambia capabilities y no toca el guard productivo de
`PUBLISHED_HISTORY`/`DEPENDENT_HISTORY`.

La ejecución eliminó exactamente: 1 Source, 3 Versions, 3 raw payloads, 4,500
Listings, 3 Batches, 4,500 RowDecisions, 1,800 Resolutions, 1,800 Memory, 1
RetirementPlan, 1 RetirementEvent, 1,500 CatalogItems, 3,000 identifiers, 1,500
precios, 1,364 costos y 3,000 audit events. Eliminó cero BranchPriceRevision.
El cálculo final fue material: `1,539 - 1,500 = 39` CatalogItems.

### QA post-cleanup

- PostgreSQL: Demo Source/Versions/items `0`; AG `1` Source, `8` Versions,
  `253` Listings, `108` Resolutions y `36` Memory.
- Catálogo: `39` items, `36 ACTIVE` y `3 INACTIVE`; `39` SKU y `39` barcodes.
  Los `36` items AG siguen activos y los otros `3` son seed no Demo.
- Integridad: `0` orphan rows en identifiers, precios, costos, Listings,
  Resolution y Memory; `0` product triggers deshabilitados.
- API autenticada: `GET /api/catalog/supplier-sources` `200`, sólo AG con
  `versionCount=8`; Versions para el UUID Demo `200 []`; Price List `200` con
  `totalCount=36` y sólo items activos.
- Chrome reload: Composer muestra AG seleccionado y ocho versiones; Demo no
  aparece. Lista de precios contiene únicamente el catálogo activo sobreviviente.
- Root cause: los antiguos controles operativos `Caso Owner · 36`,
  `Demo V1 · 1500` y `Demo V2 · 1500` permitían persistir el harness grande en
  la base Owner. El commit previo `4f3e647` retiró esos controles; los
  generadores continúan sólo para tests deterministas y PostgreSQL desechable.
- Gates focalizados: 23/23 cleanup/Composer contracts, architecture,
  typecheck, build y PBI-041 PostgreSQL 1/1 con 69 migraciones PASS. No se
  ejecutó `verify:full`.

## Frontera de aceptación

Este documento demuestra un candidato local revisable. No demuestra Owner
Acceptance, PR CI, independent review, merge, exact-main, Preview ni release.
El siguiente acto permitido es exclusivamente la revisión Owner de los fixtures
y superficies locales descritos arriba. La Source sintética
`Proveedor QA eliminable 15 sep` conserva dos Versions `DRAFT` para inspeccionar
historia, descripción y las dos confirmaciones sin afectar Catalog.

## Trusted history + bounded candidate matching

Las decisiones `CM-001..CM-009` se materializaron sin activar Advanced Supplier
Reconciliation. La identidad exacta sólo se considera confiable cuando la
Memory del mismo Tenant, Source y column signature enlaza a la última
Resolution, esa Resolution proviene de un Batch `APPLIED`, el estado sigue
`CONSISTENT`, `correction_count = 0`, el algoritmo es conocido y el target
continúa único y compatible con Tipo/Category/Brand. El resultado resuelve la
fila como `APPLY`, pero no aplica el batch.

Cuando no existe esa identidad exacta, el engine construye una vez un índice de
la historia publicada del mismo Source, limita el pool a 200 y devuelve como
máximo tres candidates. El score Jaccard sólo filtra y ordena; no llena
`target_item_id`. Los tokens de modelo/número, `Pro/Plus/Max`, tecnología
`OLED/INCELL`, calidad `Original/Calidad`, color, capacidad y tamaño se preservan
como contrastes de candidate. Pueden filtrar una propuesta, pero no son por sí
solos identidad durable ni `CONFLICT`. La selección Owner se revalida contra el conjunto
persistido; un UUID arbitrario o de otro Tenant falla cerrado.

La migración `20260915120000_catalog_add_bounded_candidate_matching` agrega la
clasificación `CANDIDATE` y los campos `match_origin`,
`match_algorithm_version` y `candidate_matches` con cap físico de tres. No hace
backfill semántico, no reanaliza Supplier Versions y no escribe memoria. Una
elección humana sólo se vuelve Resolution/Memory reutilizable dentro del publish
exitoso y transaccional.

La UI abre en `Requieren atención`, separa `Resueltas` y `Todas`, y presenta por
candidate evidencia compartida, diferencias y score identificado explícitamente
como de presentación. Las acciones son `Mismo artículo`, `Artículo nuevo` y
`Excluir`; las 34 filas trusted siguen inspeccionables.

### AG v11 — reanalysis controlada, sin Apply

| Evidencia | Antes | Después |
|---|---:|---:|
| Batch lifecycle | `RECONCILING` | `RECONCILING` |
| Batch lock version | 2 | 3 |
| análisis | `9285fc78…ad3df1` | `8cb51267…e47a9` |
| `NEW/APPLY` | 2 | 0 |
| `UNCHANGED/UNRESOLVED` | 34 | 0 |
| `UNCHANGED/APPLY/TRUSTED_HISTORY` | 0 | 34 |
| `CANDIDATE/UNRESOLVED` | 0 | 2 |
| CatalogItems | 39 | 39 |
| Resolutions | 108 | 108 |
| ReconciliationMemory | 36 | 36 |
| `published_at` | null | null |

El content hash de la Version permaneció
`58d7203d6b48ffe8c94f98e13b4c4bc563a3d5de50a395975d73820032ec6b13`.
La fila 1 sugirió `Pantalla iPhone 11 Calidad RJ >>` con score de presentación
83 % y diferencia `OBSERVED_ONLY:liquidacion`; la fila 2 sugirió
`Pantalla iPhone 11 Original >>I` con 67 % y diferencias
`OBSERVED_ONLY:display / HISTORY_ONLY:pantalla`. Cada una tuvo un solo candidato,
`target_item_id = null` y ninguna decisión fue tomada. Chrome quedó abierto en
AG v11; no se ejecutó `Aplicar lote`.

### AG v17 — genuinely new item, reanalysis controlada sin Apply

Antes de la remediación, la fila 37 `Pantalla iPhone 16 Original` estaba
`CONFLICT/UNRESOLVED` por `CANDIDATE_IDENTITY_CONTRADICTION`: sólo había dos
observaciones históricas plausibles (`iPhone 14` e `iPhone 15`, ambas score
0.60), sin identifier ni memoria trusted. La causa fue convertir el contraste
de token protegido `16` contra `14/15` en conflicto durable.

Después, el matcher devuelve esos contrastes bounded sin convertirlos en
candidate persistido o target. El reanálisis se hizo mediante el botón local
`Reanalizar versión`, no por escritura SQL: `36 UNCHANGED`, `1 NEW/APPLY`, `0
CONFLICT`, batch `READY`, `published_at = null`. La fila 37 no muestra
UUID de mapping, no tiene `target_item_id`, Resolution ni Memory; `Aplicar
lote` no se ejecutó. Chrome queda abierto en `/listas/precios/carga-masiva`
con AG v17 seleccionado.

Los conflictos fuertes siguen materiales: SKU y barcode dirigidos a items
distintos producen `IDENTIFIERS_POINT_TO_DIFFERENT_ITEMS/CONFLICT`; memoria
corregida e incompatible produce `CORRECTED_MAPPING_CONFLICT/CONFLICT`.
`AMBIGUOUS_HISTORY` permanece para historias independientes múltiples. El
input UUID de UI queda acotado a esos conflictos durables; reemplazarlo por un
selector Catalog reutilizable se registra como deuda UX, fuera de este fix.

### Gates focalizados

- typecheck gobernado: PASS;
- build gobernado: PASS; sólo warning informativo de tamaño Vite;
- contratos candidate/Composer: 22 PASS, 0 FAIL;
- PostgreSQL material PBI-041: 1 PASS, 0 FAIL, 70 migraciones; incluido
  provenance trusted, candidate tamper, publish-only learning y Tenant
  isolation. La campaña final ampliada probó además exact replay no publicado
  (`NEW/NONE`), dos candidates razonables como `AMBIGUOUS`, memoria sin cambio
  después de decisiones provisionales y `(oferta)` como candidate nuevo, no
  herencia de `(liquidacion)`. Benchmark 10k final: ingest 5,350.7 ms, análisis
  488.2 ms, preview 53.0 ms, publish 20,560.0 ms y 85.7 MiB de heap; todos
  dentro de los budgets de 30 s/250 MiB, con variación de publish registrada;
- migration architecture/database: 12 PASS, 0 FAIL;
- caracterización in-memory final: p95 4.1 ms para 1,500 filas y 12.5 ms para
  10,000; 50k se caracterizó en 41.9 ms y fue rechazado antes de persistir; el candidate lookup usa
  carga/indexación acotada, pool 200, top K 3 y sin N+1;
- runtime provenance: frontend/backend servidos desde
  `f2554cf29f2211d73a688512b6f89de16ce8e108`;
- `verify:full`: NOT RUN por prohibición explícita previa a Owner Acceptance.

La única anomalía de preflight es un ref Git local preexistente roto para
`origin/main`; no afectó runtime, tests ni la rama candidata y no se modificó
durante esta iteración. El archivo no versionado
`apps/dev-preview-web/src/.DS_Store` pertenece al Owner y permanece intacto.

## Canonical title + Supplier observed title history

### Estado anterior y hallazgo material

La auditoría del 2026-09-16 encontró tres hechos distintos: `CatalogItem.title`
era la única fuente de búsqueda por nombre; las Listings ya conservaban el
título exacto del proveedor y las Resolutions publicadas ya permitían
reconstruir su `itemId`; `CatalogAuditEvent` ya era suficiente para conservar
un rename, siempre que recibiera old/new y provenance. No se justificó crear
una segunda tabla de alias o historia.

AG v13 ya estaba `APPLIED`, con `published_at=2026-09-16 06:32:29.493+00`,
antes de este cambio. Sus dos observaciones quedaron mapeadas a los mismos
itemId, pero los títulos canónicos continuaron como `Pantalla iPhone 11 Calidad
RJ >>` y `Pantalla iPhone 11 Original >>I`. v12 permaneció `READY` y v11
`RECONCILING`, ambas sin publicar. Ninguna versión AG se aplicó durante esta
iteración.

### Modelo y persistencia

- `CatalogItem.itemId` continúa como identidad estable para consumidores.
- `CatalogItem.title` es el título canónico vigente y mutable.
- `SupplierListing.supplier_title` es observación exacta e inmutable;
  `SupplierListingResolution` la vincula al item sólo tras publish exitoso.
- `title_decision` persiste `KEEP_CURRENT | ADOPT_OBSERVED` en la decisión de
  fila; el default seguro de UI es KEEP.
- un vector generado `supplier_title_search` y su GIN soportan búsqueda
  histórica; el índice parcial de Resolution acelera la proyección por item.
- no existe backfill semántico ni alias global: Listings existentes generan su
  vector automáticamente y decisiones previas quedan null.

### Atomicidad, concurrencia y audit

Elegir identidad/nombre no cambia Catalog. Apply vuelve a leer el item y exige
expected version, decisión de título válida y lifecycle compatible. Rename,
reactivación, revisiones, Resolution, Memory y `catalog.bulk.publish.row`
comparten una transacción. El evento registra item, título anterior/nuevo,
actor, Batch, Source, Version, Listing, timestamp, correlation y
clientRequestId. Un segundo lote concurrente queda stale; no hay
last-write-wins. Replay devuelve el resultado previo y no duplica rename/audit.

### Search histórico

Price List combina el match canónico con un subquery que devuelve itemId desde
Listings vinculadas por Resolution a Batches `APPLIED`. Los predicates Tenant
se aplican dentro y fuera; filtros Type/Category/Brand, orden, count y
paginación siguen sobre `CatalogItem`. Por eso varios títulos o Suppliers no
duplican resultados y una observación no publicada/excluida no participa.

### Casos cubiertos

- KEEP: canonical sin cambio, mismo itemId y `liquidacion` localizable.
- ADOPT: mismo itemId, canonical `Display…`, old/new auditables y `display` /
  `pantalla` localizan una sola fila.
- NEW no ofrece rename de otro item; EXCLUDE no aprende.
- fallo/stale deja cero rename, Resolution, Memory y audit parcial.
- REACTIVATE + ADOPT conserva identidad y transacción única.
- dos Suppliers pueden aportar títulos al mismo item sin equivalencia global.
- observaciones y resultados quedan aislados por Tenant.

### Gates focalizados

- contracts/domain/UI: PASS;
- PostgreSQL material, Tenant isolation, concurrency, idempotency y search:
  PASS sobre 71 migraciones;
- typecheck, build y architecture: PASS;
- benchmark 10k final: ingest 5,106.9 ms, analyze 446.0 ms, preview 43.8 ms,
  publish 17,845.3 ms, historical search 140.1 ms y heap 95.1 MiB; dentro de
  budgets del target 10k;
- `verify:full`: NOT RUN por prohibición explícita previa a Owner Acceptance.

Chrome queda preparado en AG v11 para tomar las dos decisiones provisionales.
No se ejecutó Apply Batch. Esta evidencia no demuestra Owner Acceptance, PR,
CI autoritativa, merge, Preview, Production ni deploy.

## Supplier version completeness — local material evidence

La migración local aditiva avanzó el schema a 72 migraciones. El default seguro
clasificó las versiones históricas como `PARTIAL`; no se resembró ni alteró AG.
El Composer permite elegir “Actualización parcial” o “Lista completa del
proveedor”, conserva la declaración en draft/reload/analyze/apply y la bloquea
desde `INGESTED`.

La suite PostgreSQL creó una baseline COMPLETE de cuatro Listings y una nueva
COMPLETE que omite uno. La comparación devolvió `EVALUATED / 1 no observado`;
después de Apply el CatalogItem omitido preservó itemId, `ACTIVE`, versión,
identifiers, revisiones y ReconciliationMemory, con cero Resolution nueva. Una
tercera carga `PARTIAL` devolvió `PARTIAL_CURRENT / null`, sin señal de
ausencia. `typecheck`, build, contrato UI y PostgreSQL focalizado pasaron con
Node 24.18.0 y pnpm 11.15.1. Owner Acceptance sigue pendiente.

Chrome local sobre el HEAD runtime actualizado mostró ambos radios y el copy
Owner; la selección de `Lista completa del proveedor` cambia el control sin
guardar ni aplicar. Al abrir AG v19, que migró como `PARTIAL`, la superficie
de comparación dice que los artículos ausentes no se evalúan. Se recargó el
Composer para descartar la selección visual sin crear una nueva versión AG.

## Supplier coverage UX — exception-first local evidence

La cobertura automática ahora se lee sin persistencia adicional: el baseline
permanece la última Version `COMPLETE` `APPLIED` del mismo Tenant/Source y sus
Listings/Resolutions publicados aportan título canónico y estado actual de
cualquier artículo no observado. No existe migración, Apply, retiro ni mutación
de `CatalogItem` en esta lectura.

Después del resumen de cambios y antes de Reconciliación, el Composer presenta
una superficie independiente de cobertura. `COMPLETE` con baseline muestra
filas recibidas, observados y no observados; `COMPLETE` sin baseline no muestra
un cero ficticio; `PARTIAL` muestra artículos procesados y que las ausencias no
se evaluaron. La comparación histórica se conserva debajo de Reconciliación
como herramienta secundaria. La inspección expandible usa un botón real con
`aria-expanded` y `aria-controls`; lista sólo información (título canónico,
estado actual y baseline), sin acciones de retiro.

Chrome local verificó sin Apply sobre `AG / v29` (`COMPLETE`, `READY`, 34
filas) frente a `AG / v28` (`COMPLETE`, `APPLIED`, 37): `34 observados`, `3 no
observados`, visibles antes de Reconciliación y sin usar Comparación histórica.
`Ver 3 no observados` mostró `Pantalla iPhone 15 Pro Max Original`, `Pantalla
iPhone 15 Pro Original` y `Pantalla iPhone 16 Original`, los tres `Activo` y
observados en `AG v28`. `AG / v30` (`PARTIAL`, `READY`, 34) mostró
`Actualización parcial`, `34 artículos procesados` y que los artículos no
incluidos no se evaluaron, sin contador ni panel de no observados. Los mismos
fixtures permanecieron sin Apply.

## Post-analysis result-first workspace

`gridExpanded` es estado efímero de React y el contenedor estable
`#bulk-catalog-grid` permanece montado con `hidden` cuando se colapsa. No hay
escritura PostgreSQL, migración ni cambio de Source, Version, Batch, decisión,
cobertura, reconciliación o `CatalogItem` al Mostrar/Ocultar lista.

Una nueva carga y una Version `DRAFT` abren edit-first con grid visible; guardar
el borrador no modifica esa preferencia. Tras Analyze/Reanalyze exitoso, y al
abrir cualquier Version `INGESTED` —incluidos `READY`, `RECONCILING` y
`APPLIED`— la grid abre result-first, colapsada. El botón real alterna
`Mostrar lista`/`Ocultar lista`, conserva `aria-expanded` y
`aria-controls="bulk-catalog-grid"`; un error de celda restablece la grid antes
del scroll/focus existente. Candidate y decisiones de reconciliación no alteran
la visibilidad de la grid.

Chrome local, sin Save, Analyze ni Apply, verificó `AG v3` (`DRAFT`, 36 filas)
con grid editable visible; `AG v31` (`PARTIAL`, `READY`, 34) colapsado con
`34 artículos procesados`; y `AG v29` (`COMPLETE`, `READY`, 34) colapsado con
`34 filas recibidas / 34 observados / 3 no observados` antes de
Reconciliación. En v29, Mostrar lista materializó las filas, Ocultar lista las
retiró del viewport y `Ver 3 no observados` siguió funcionando sin expandir la
grid. Las tres ausencias continuaron activas. La Comparación histórica y los
botones de Apply conservaron su superficie independiente.

La navegación de error se verificó sin persistir: en `AG v3` se vació sólo en
memoria el título de la fila 1, se ocultó la grid y se pulsó Guardar borrador.
La validación cliente rechazó el dato antes de request/escritura, reabrió la
grid y dejó foco visible en `Título fila 1`, con `aria-invalid` y el mensaje
`El título es obligatorio.`.

Gates focalizados: typecheck PASS; Composer contract PASS 9/9; selección
Composer/domain/catalog UI/architecture PASS 48/48; build PASS; PostgreSQL
PBI-041 PASS 1/1 con 72 migraciones (benchmark 10k: ingest 4,515.2 ms,
analyze 417.2 ms, preview 38.3 ms, publish 15,498.8 ms, historical search
82.2 ms, heap 22.3 MiB). `verify:full` no se ejecutó por alcance explícito.

## Row decision JSON shape hardening — local material evidence

La causa del white screen fue aislada a `RowDecision.errors`: `decide()` enviaba
un array JavaScript directamente al JSONB, que PostgreSQL recibía como objeto
vacío. La remediación incorpora `normalizeRowErrors(value)` como contrato único:
los arrays conservan sólo strings y `null`, objetos u otras formas históricas
se leen como `[]`. Todas las escrituras de errors usan `JSON.stringify` de esa
forma canónica; no hubo migración ni backfill.

La regresión de contrato cubre array, objeto, null y scalar. La suite material
PostgreSQL verificó `EXCLUDE` y después `APPLY` sobre la misma decisión con
`jsonb_typeof(errors) = 'array'` y `errors = []`, sin publicar el batch ni
mutar el CatalogItem objetivo. Tras inyectar controladamente un `{}` histórico
en el contenedor efímero de la suite, la lectura devolvió `[]` y una nueva
decisión restauró el JSONB canónico. PASS: 1/1, 72 migraciones, contenedor
descartable eliminado.

Chrome local, autenticado como Luis, abrió `AG v35` (`READY`, 34 filas,
sin publicar), seleccionó Resueltas, excluyó e incluyó nuevamente la fila 1 y
recargó. Las vistas Requieren atención, Resueltas y Todas siguieron operables
sin white screen. La fila quedó incluida; no se ejecutó Apply ni Publish. Los
checks focalizados fueron typecheck, build, contrato bulk y PostgreSQL PBI-041;
`verify:full`, CI, push, PR, merge y deploy no se ejecutaron.

## Exception-first reconciliation UX — local material evidence

La reconciliación ahora prioriza la excepción sobre la repetición de decisiones
ya resueltas. Al abrir o reanalizar una versión se selecciona `Requieren
atención`; si el contador es cero se muestra `Todo resuelto`, el total listo
para Apply y el aviso de que no es necesario inspeccionar cada fila. Las filas
resueltas permanecen disponibles en `Resueltas` y `Todas` como auditoría, no
como trabajo pendiente.

`AG / v35` permaneció `READY`, con 34 filas `APPLY`, 0 pendientes y sin
publicar. Chrome local mostró el estado compacto, ningún botón masivo inútil y
`Aplicar lote` como acción final explícita. En `Resueltas`, las filas APPLY no
mostraron `Incluir`; la decisión de nombre apareció únicamente en las filas
con diferencia observada/canónica como `Cambiar nombre`, y los diagnósticos
técnicos no se expusieron.

La regresión material de fila ejecutó sobre v35: fila 1 `APPLY` → `Excluir del
lote` → `EXCLUDE`, con toast y `Excluida del lote`/`Volver a incluir`; después
`Volver a incluir` → `APPLY`, sin reload ni white screen. No se pulsó
`Aplicar lote` ni se modificó `CatalogItem`, Resolution, Memory, audit o
historia publicada. `AG / v10` abrió directamente `Requieren atención` con 35
pendientes y la acción masiva contextual `Aceptar 35 sugerencias`, confirmando
la prioridad de trabajo real.

La revisión visual verificó layout a 1280, 768 y 640 px, y tema claro/oscuro;
los tabs y acciones visibles conservaron controles semánticos de teclado. El
viewport y tema se restauraron a la preferencia local antes de cerrar. Gates:
typecheck PASS, build PASS (sólo advertencia informativa existente de tamaño
Vite), contrato Composer 10/10 PASS, PostgreSQL PBI-041 1/1 PASS sobre 72
migraciones, architecture PASS y `git diff --check` PASS. `verify:full`, CI,
push, PR, merge y deploy no se ejecutaron.

## Completeness contract hardening and applied result state

El contrato de Create y Replace ahora exige el enum cerrado `PARTIAL` o
`COMPLETE`; ausencia, `null` y cualquier otro valor se rechazan como
`CatalogInputError(completeness)`. El default controlado del Composer sigue
siendo `PARTIAL`, pero Create, Replace, Analyze, decisiones y Publish sólo
aceptan o devuelven una versión con completeness explícito. El adaptador local
trata una respuesta sin ese campo como DTO inválido; no inventa un fallback.

La UI separa el copy de estado: `Todo resuelto` es exclusivamente pre-Apply;
una Version `APPLIED` presenta `Lote aplicado`, el número real de filas
procesadas y las categorías no-cero del Batch. No se guarda body de payload,
no cambia matching, cobertura, ausencia, history, atomicidad ni la semántica
de títulos.

Material local del 2026-09-16, autenticado como Luis y sin modificar v41:

1. `AG / v42` se creó por Composer con `Lista completa`, se guardó, recargó,
   reabrió y conservó `COMPLETE`.
2. Analyze mostró `Lista completa`, 1 observada y 33 no observadas respecto a
   AG v32; el copy confirmó que las no observadas permanecen activas.
3. Apply produjo un Batch `APPLIED` con una categoría real: `1 sin cambio`.
   Tras reload, la UI mostró `Resultado aplicado` y `Lote aplicado — 1 filas
   fueron procesadas correctamente. 1 sin cambio`; nunca el texto pre-Apply
   `listas para aplicar`.
4. `AG / v43` se creó como control `PARTIAL`, quedó `DRAFT` y no fue
   analizada ni publicada. Su propósito es demostrar que la selección
   explícita no se convierte silenciosamente a `COMPLETE`.

v41 (`fa43b69c-65db-4269-9e8d-03fd77136880`, Batch
`d798a612-c258-46b4-a86b-409cb7b4741c`) permaneció evidencia histórica:
`PARTIAL`, `APPLIED`, 38 Listings, 1 `CREATED` y 37 `MATCHED`.

Checks focalizados: typecheck y build PASS; contrato Composer PASS 10/10;
PostgreSQL PBI-041 PASS 1/1 con 72 migraciones y limpieza del contenedor
desechable. `verify:full`, CI, push, PR, merge y deploy no se ejecutaron.

## Complete baseline plausibility and coverage explainability

Las reglas BA-001..BA-004 están materializadas sin migración: la baseline se
deriva exclusivamente de la Version `COMPLETE/APPLIED` anterior más reciente
del mismo Tenant/SupplierSource. La respuesta separa `continued`,
`notObserved` y `additional`; ninguno es una decisión de identidad ni una
acción sobre Catalog.

La política backend de plausibilidad es determinista: cuando baseline es de al
menos 20 filas y la COMPLETE actual conserva 25% o menos, Publish devuelve
`CATALOG_COVERAGE_REVIEW_REQUIRED` hasta que el actor envía el acknowledgment
explícito. El acknowledgment cambia el fingerprint idempotente y queda en el
audit. En el PostgreSQL desechable, 100→5 devolvió 5 continuadas, 95 no
observadas, 0 adicionales y bloqueó Apply sin acknowledgment; el Apply
confirmado dejó intactos el item ausente, status, versión, identifiers y
ReconciliationMemory. Los casos 100→95, 37→34, 34→38 y 1→38 permanecieron
normales; `PARTIAL` no evalúa cobertura.

Chrome local autenticado como Luis abrió `AG / v44` (`COMPLETE`, 38 filas)
contra `AG / v42` (`COMPLETE/APPLIED`): la superficie mostró 38 recibidas, 1
continuada, 0 no observadas y 37 adicionales, sin aviso. Los detalles
expandibles enseñaron la continuación y las 37 adicionales con título canónico
y texto observado contextual. Apply normal produjo el toast atómico y el
resultado `38 sin cambio`; tras reload, v44 volvió a abrir como `Aplicada` con
los mismos conteos. La consulta local confirmó v42 `COMPLETE/APPLIED` (1), v43
`PARTIAL/DRAFT` (1), v44 `COMPLETE/APPLIED` (38), y v44 como la baseline
automática final. No hubo retiro, delete, rename, identifier/revision,
Resolution ni Memory inducidos por ausencia.

Gates focalizados: typecheck PASS; build PASS; Composer contract PASS 11/11;
PostgreSQL PBI-041 PASS 1/1 con 72 migraciones y contenedor desechable
eliminado; DEC-005 architecture PASS; `git diff --check` pendiente del corte
documental final. No se ejecutaron `verify:full`, CI, push, PR, merge ni
deploy.

## Operational UX polish for coverage and applied result

`UXP-001..005` se materializaron localmente sin migración, sin cambiar
matching, historia confiable, baseline, completeness, Apply ni retiro. La
causa de `Sin estado actual disponible` fue `STALE_PROJECTION`: la cobertura
leía únicamente `CatalogUpdateRowDecision.target_item_id`; para `NEW` ese campo
debe seguir nulo incluso después de publicar. La Resolution append-only ya
contenía item y resultado material, pero no participaba en la proyección.

La proyección ahora combina decisión pre-Apply y Resolution post-Apply sin
duplicar dominio: relación coverage/Catalog, classification, lifecycle y
Resolution. Un adicional `NEW` pre-Apply dice `Se creará como artículo nuevo al
aplicar`; un `CREATED` post-Apply dice `Activo · Creado por AG v45`.

Chrome local autenticado como Luis abrió y recargó `AG / v45` (`COMPLETE`,
`APPLIED`, 39 filas) frente a `AG / v44`: 38 continúan, 0 ya no aparecen y 1
adicional. La cobertura muestra primero `Cambio detectado · 1 adicional`, sin
CTA para el cero; las 38 continuaciones quedan bajo demanda. Al expandir,
`Pantalla iPhone 16 Pro Max Original` mostró `Activo · Creado por AG v45`; la
búsqueda local `16 pro` conservó el item. La base local confirma ACTIVE,
$16,500 y costo de referencia $7,500.

El resultado aplicado queda después de cobertura con `Lote aplicado`, 39 filas
procesadas y `1 nuevo · 38 sin cambio`. El retiro conserva capability y flujo
Level 2, pero vive en `Acciones del lote` como botón quiet secundario. La
Comparación histórica inicia colapsada; Enter y Espacio alternaron el
disclosure con `aria-expanded`/`aria-controls`, y el selector no aparece al
estar cerrado. Chrome verificó 1280, 768 y 640 px sin overflow horizontal,
y claro/oscuro con foco conservado.

Gates focalizados: typecheck PASS; build PASS (advertencia informativa existente
de chunk Vite); Composer contract 11/11 PASS; PostgreSQL PBI-041 1/1 PASS con
72 migraciones. La regresión PostgreSQL usa Tenant desechable COMPLETE: antes
de Apply el adicional es `NEW` sin target y después el mismo item se proyecta
`CREATED`, ACTIVE y con título canónico. `verify:full`, CI, push, PR, merge y
deploy no se ejecutaron.
