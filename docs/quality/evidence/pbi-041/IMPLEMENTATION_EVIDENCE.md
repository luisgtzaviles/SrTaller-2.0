# PBI-041 — Implementation Evidence

## Checkpoint

- **Estado:** local Owner Review ready; Owner Acceptance pending.
- **Baseline:** `100eb9abc8b8b3b01da5dcc312777b59bf01a615` (`main == origin/main` al iniciar).
- **Candidato funcional:** `8b934080071e1650b53c220d3fa42f8930e6479a`.
- **Implementación core:** `b49a52faaf94184dcb7829bb255b8553b1e58c02`.
- **Rama:** `feature/pbi-041-bulk-catalog-composer`.
- **Fecha:** 2026-09-14 MST.
- **Delivery:** sin push, PR, merge, Preview, Production ni deploy.
- **Gate deliberadamente no ejecutado:** `verify:full`, reservado por autoridad
  Owner para después de Owner Acceptance.

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

## Fixtures sintéticos gobernados

| Fixture | Estado | Propósito |
|---|---|---|
| AG / Owner real paste 36 | `DRAFT` | 36 pantallas sintéticas, pegado 3 columnas, contexto `Refacción / Pantallas / Apple` y recuperación por reload; no escribe Catalog |
| Proveedor Demo / Versión 1 | `APPLIED` | 1,500 observaciones sintéticas, publicación inicial y memoria histórica |
| Proveedor Demo / Versión 2 | `RECONCILING` | 1,500 observaciones equivalentes con cambios controlados y comparación |

La comparación visible de Version 2 contra Version 1 produce:

- mapeadas: 1,496;
- cambiadas: 249;
- nuevas: 2;
- desaparecidas: 3;
- ambiguas: 1.

Los datos son exclusivamente locales y sintéticos. El estado fue creado por el
mecanismo normal de Source/Version/Listing/Batch, no mediante escritura manual
para aparentar un resultado.

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

## Seguridad y ownership

La preparación exige `catalog.import.prepare`. Publicar exige además
`catalog.import.publish`, `catalog.manage` y `catalog.prices.manage`; observar o
publicar costo también exige las capabilities de Reference Cost. El backend
omite costo en respuestas cuando falta autorización. Tenant, Branch, Station,
User, Session y correlation se derivan del contexto confiable.

PBI-041 no adquiere ownership de Inventory, Procurement, Caja, Repair Concepts,
Pedidos, Solicitudes de clientes, Files ni Branch Pricing. Tampoco introduce
CSV/XLSX, supplier API o Advanced Supplier Reconciliation.

## Verificación focalizada

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

## Frontera de aceptación

Este documento demuestra un candidato local revisable. No demuestra Owner
Acceptance, PR CI, independent review, merge, exact-main, Preview ni release.
El siguiente acto permitido es exclusivamente la revisión Owner de los fixtures
y superficies locales descritos arriba.
