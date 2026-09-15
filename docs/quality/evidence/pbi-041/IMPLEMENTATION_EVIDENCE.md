# PBI-041 — Implementation Evidence

## Checkpoint

- **Estado:** safe Catalog retirement iteration lista para Owner Review;
  Owner Acceptance pendiente.
- **Baseline:** `100eb9abc8b8b3b01da5dcc312777b59bf01a615` (`main == origin/main` al iniciar).
- **Candidato funcional:** `44e605953676456eff519b5b3fca02d952eb5c38`.
- **Implementación core:** `b49a52faaf94184dcb7829bb255b8553b1e58c02`.
- **Rama:** `feature/pbi-041-bulk-catalog-composer`.
- **Fecha:** 2026-09-14 MST.
- **Delivery:** sin push, PR, merge, Preview, Production ni deploy.
- **Gate deliberadamente no ejecutado:** `verify:full`, reservado por autoridad
  Owner para después de Owner Acceptance.

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

## Reproducción exacta del fallo Owner

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

Clasificación: error de **lote** en `Versión del proveedor`. El contrato final
publica `CATALOG_SUPPLIER_VERSION_ALREADY_EXISTS`, enfoca ese control y explica
que debe elegirse otra revisión o abrirse el draft existente. No se expusieron
tokens, credenciales ni datos Owner reales.

## Fixtures sintéticos gobernados

| Fixture | Estado | Propósito |
|---|---|---|
| AG / Owner real paste 36 | `DRAFT` | 36 pantallas sintéticas, pegado 3 columnas, contexto `Refacción / Pantallas / Apple` y recuperación por reload; no escribe Catalog |
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
- `ACTIVE→INACTIVE` conserva identidad e historia. Un target histórico inactivo
  bloquea como `HISTORICAL_ITEM_RETIRED_REQUIRES_REACTIVATION`, no se duplica.
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

## Frontera de aceptación

Este documento demuestra un candidato local revisable. No demuestra Owner
Acceptance, PR CI, independent review, merge, exact-main, Preview ni release.
El siguiente acto permitido es exclusivamente la revisión Owner de los fixtures
y superficies locales descritos arriba.
