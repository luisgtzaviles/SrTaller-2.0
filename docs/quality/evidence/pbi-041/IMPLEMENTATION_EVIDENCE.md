# PBI-041 — Implementation Evidence

## Checkpoint

- **Estado:** Supplier history, automatic versioning y governed delete listos para Owner Review;
  Owner Acceptance pendiente.
- **Baseline:** `100eb9abc8b8b3b01da5dcc312777b59bf01a615` (`main == origin/main` al iniciar).
- **Candidato de reactivación:** `f4bc803fe3b086405024f6199b65114feb1feebe`.
- **Candidato de retiro anterior:** `44e605953676456eff519b5b3fca02d952eb5c38`.
- **Implementación core:** `b49a52faaf94184dcb7829bb255b8553b1e58c02`.
- **Rama:** `feature/pbi-041-bulk-catalog-composer`.
- **Fecha:** 2026-09-14 MST.
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
- La corrección de mapping conserva historia; una contradicción posterior se
  clasifica `AMBIGUOUS`.
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

## Frontera de aceptación

Este documento demuestra un candidato local revisable. No demuestra Owner
Acceptance, PR CI, independent review, merge, exact-main, Preview ni release.
El siguiente acto permitido es exclusivamente la revisión Owner de los fixtures
y superficies locales descritos arriba. La Source sintética
`Proveedor QA eliminable 15 sep` conserva dos Versions `DRAFT` para inspeccionar
historia, descripción y las dos confirmaciones sin afectar Catalog.
