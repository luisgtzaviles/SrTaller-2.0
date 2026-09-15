# PBI-041 — Persistence and Migration Design

## Estado

- **Resultado:** diseño materializado en el candidato local; Owner Review
  pendiente.
- **Fecha:** 2026-09-14.
- **Owner lógico:** módulo `catalog`, conforme DEC-005 y DEC-049.
- **Motor objetivo:** PostgreSQL 18.4, Kysely sobre `pg`, shared schema con
  discriminación Tenant conforme ADR-004.
- **Alcance:** diseño de tablas, constraints, indexes, transacciones, retención
  retiro seguro y rollout/rollback para PBI-041.

## Principios

1. Cada fila propia contiene `tenant_id`; ningún repository ordinario acepta
   scope libre del cliente.
2. Compound foreign keys prueban pertenencia al mismo Tenant.
3. `CatalogItem` es identidad; `SupplierListing` es evidencia externa.
4. Version/Listing/Resolution history y Update Batch son responsabilidades
   distintas aunque pertenezcan al mismo módulo.
5. PostgreSQL protege invariantes estructurales; aplicación protege dominio y
   capabilities.
6. La publicación usa una única conexión/transacción. No hay loops HTTP ni
   partial success.
7. Raw temporal puede expirar; historia estructurada y Catalog no se eliminan
   por cascada.
8. Retirar un `CatalogItem` cambia `ACTIVE` a `INACTIVE`; no elimina identidad,
   identificadores ni historia.

## Modelo relacional propuesto

Los nombres son contractuales para diseño; la implementación autorizada debe
confirmarlos en migration review sin cambiar semántica.

### `catalog_supplier_sources`

| Columna conceptual | Contrato |
|---|---|
| `tenant_id`, `supplier_source_id` | PK/identity compuesta; UUID opaco |
| `display_name`, `normalized_name` | casing visible preservado; exact duplicate Tenant-scoped rechazado |
| `status` | `ACTIVE`/`INACTIVE`; no hard delete con versiones |
| `version` | optimistic concurrency |
| actor/correlation/timestamps | creación y última mutación gobernada |

Unique parcial/lógico: `(tenant_id, normalized_name)` para identidad vigente.
No contiene contactos, términos, cuentas, pagos, compras ni recepción.

### `catalog_supplier_catalog_versions`

| Columna conceptual | Contrato |
|---|---|
| `tenant_id`, `supplier_catalog_version_id` | PK compuesta |
| `supplier_source_id` | FK compuesta a Source del mismo Tenant |
| `label`, `revision` | ronda declarada y revisión; unique por Source |
| `status` | `DRAFT/INGESTING/INGESTED/CANCELLED/FAILED` |
| `corrects_version_id` | self-FK mismo Tenant+Source; acíclica, distinta de sí misma |
| `content_hash` | hash del contenido canónico; no sustituye label/revision |
| `schema_version`, `signature_algorithm_version` | positivos y explícitos |
| `input_kind`, `row_count` | `COMPOSER` inicialmente; count 0..10,000 |
| `version` | optimistic concurrency sólo pre-INGESTED |
| actor/context/correlation/timestamps | received/ingested y procedencia |

Unique: `(tenant_id, supplier_source_id, label, revision)` y
`(tenant_id, supplier_catalog_version_id, supplier_source_id)` para FKs
scope-safe. Un trigger o repository+test de mutation guard impide alterar
contenido/metadata de negocio después de `INGESTED`; la corrección se expresa en
una nueva fila. `SUPERSEDED` es una proyección derivada de otra versión que
apunta a `corrects_version_id`, no una reescritura del snapshot anterior.

### `catalog_supplier_listings`

| Columna conceptual | Contrato permanente |
|---|---|
| `tenant_id`, `supplier_listing_id` | PK compuesta |
| `supplier_catalog_version_id`, `supplier_source_id` | FK compuesta al mismo Tenant/Source |
| `ordinal` | posición observada; unique dentro de Version |
| `exact_title` | texto limpio con casing original, longitud limitada |
| `supplier_item_code`, `normalized_supplier_item_code` | ambos nullable; duplicados se conservan y clasifican, no unique destructivo |
| `observed_cost_minor`, `observed_currency` | ambos null o ambos presentes; costo protegido |
| `category_hint`, `brand_hint`, `tags` | subset bounded; no identidad canónica |
| `normalized_signature`, `listing_fingerprint` | hash/version explícitos, no title-only identity |
| `structured_payload_version` | evolución legible del subset permanente |
| timestamps | observación/ingesta |

Checks: ordinal positivo; money entero seguro/no negativo; ISO currency cuando
hay costo; longitudes/cantidad de tags acotadas. Listing queda inmutable al
ingresar su Version. Duplicar supplier code o fingerprint dentro de una versión
produce clasificación `CONFLICT/DUPLICATE`; se preserva evidencia en vez de
descartar last-row.

### `catalog_supplier_listing_resolutions`

Append-only. Contiene `tenant_id`, `resolution_id`, `supplier_listing_id`,
`sequence`, `outcome`, `catalog_item_id` nullable, `method`, evidence bounded,
`supersedes_resolution_id` nullable, actor/Station/Session/correlation y
timestamp. Unique `(tenant_id, listing_id, sequence)`; FKs compuestas a Listing,
resolución previa e item. `MAPPED/CORRECTED` requiere target; `UNRESOLVED`,
`NEW_CANDIDATE` y `EXCLUDED` no lo fingen. Corregir agrega evento y nunca edita
el anterior.

### `catalog_supplier_reconciliation_memory`

Read model reconstruible, no autoridad nueva. Key conceptual:
`tenant_id + supplier_source_id + signature_algorithm_version +
normalized_signature`. Conserva target candidato, `evidence_count`,
`first_seen_at`, `last_seen_at`, última resolución y flags `CONSISTENT`,
`CORRECTED`, `CONFLICTING`.

La proyección sólo preselecciona cuando toda evidencia vigente resuelve a un
único CatalogItem compatible. Si se materializa por performance, cada fila
conserva `projection_version` y puede reconstruirse desde Resolution history;
no se expone como alias Catalog ni se consulta fuera de `catalog`.

### `catalog_supplier_version_raw_payloads`

Temporal: `tenant_id`, Version, payload/encoding/schema temporal, byte count,
`created_at`, `expires_at`, `purged_at` y purge correlation. `expires_at` =
creación/ingesta + 90 días. Puede contener clipboard completo, celdas no
mapeadas y parse artifacts; acceso requiere prepare y capabilities de costo si
aplica. No existe cascade desde purge hacia Version/Listing.

### `catalog_update_batches`

| Columna conceptual | Contrato |
|---|---|
| `tenant_id`, `catalog_update_batch_id` | PK compuesta |
| `supplier_catalog_version_id` | nullable; PBI-041 usa una Version por batch, sin imponer 1:1 futuro |
| `target_scope` | `TENANT_BASE` únicamente en PBI-041 |
| `status` | lifecycle separado del Supplier snapshot |
| `client_request_id`, `publish_request_id` | uniques Tenant+operation; payload hash detecta replay incompatible |
| `version` | optimistic concurrency de draft/reconciliation |
| aggregate counts | proyección validada desde rows, no autorización |
| actor/context/correlation/timestamps | creator/analyzer/publisher y outcome |

No guarda Branch target. Branch del contexto queda sólo en audit. `COMPLETED`
es terminal; repetir publish devuelve su mismo outcome.

### `catalog_update_row_decisions`

Contiene `tenant_id`, batch, row ID/ordinal, Listing nullable, classification,
decision, selected target/item ID, proposed new item ID, `expected_item_version`,
selected field intents, before/after bounded, pending Category/Brand refs,
generated revision IDs, reason, warnings/errors y row version.

Unique `(tenant_id, batch_id, row_ordinal)` y compound FKs. Una fila incluida
debe estar `CREATE/UPDATE/NO_CHANGE`; `EXCLUDED` queda fuera de commit.
`UNRESOLVED/AMBIGUOUS/CONFLICT/INVALID/STALE` bloquea el batch. IDs de items y
revisiones nuevas se reservan en intención persistida para que retry no cambie
identidad.

### `catalog_retirement_plans`

Plan autoritativo Tenant-scoped, efímero y de un solo uso. Conserva `plan_id`,
scope `ACTIVE_CATALOG/BATCH_CREATED`, batch opcional, hash canónico del conjunto
activo y sus versiones, conteos, actor/Branch/Station/Session creadoras,
expiración y estado `PENDING/EXECUTED/STALE/EXPIRED`. Para batch, los targets se
derivan exclusivamente de resolutions `CREATED`; ningún ID libre del cliente
forma el conjunto. El plan dura cinco minutos y no concede autorización.

### `catalog_retirement_events`

Evidencia append-only del intento sensible: plan/scope/batch, contexto completo,
capability exacta, nivel 2, instante de reautenticación, hash y conteos,
resultado `SUCCEEDED/REJECTED`, motivo seguro, correlation y request id. Los
triggers impiden update/delete. Los eventos no son un mecanismo de rollback.

## Index strategy

- `(tenant_id, supplier_source_id, status)` y nombre normalizado de Source;
- Version por `(tenant_id, source_id, label, revision)`, content hash e
  `corrects_version_id`;
- Listing por `(tenant_id, version_id, ordinal)`, fingerprint, signature y
  supplier code nullable;
- Resolution por listing/sequence, target y source/signature projection;
- Memory por exact key y por target; nunca consulta title con fuzzy write;
- Batch por Tenant/status/updated, Version y idempotency keys;
- RowDecision por batch/classification/decision/ordinal y target item;
- raw payload por `expires_at` con `purged_at IS NULL` para cleanup.
- RetirementPlan por Tenant/status/expiry y batch; RetirementEvent por
  Tenant/plan/ocurrencia y client request.

Preview/compare usa queries set-based y paginadas; no carga 10,000 rows al DOM ni
hace N+1 contra Catalog/Resolution. Los planes y p95 forman evidencia futura.

## Query contracts

| Puerto/query | Resultado mínimo |
|---|---|
| `SupplierVersionWriter` | create/save/freeze/correct con expectedVersion e idempotencia |
| `SupplierVersionReader` | header/counts y Listings paginados; costo omitido sin capability |
| `SupplierReconciliationReader` | exact confirmed target, evidence count, first/last seen, correction/conflict |
| `CatalogUpdateBatchWriter` | draft/decision/freeze/publish sobre transaction context explícito |
| `CatalogUpdatePreviewReader` | paginado before/after/match/status, redacted por capability |
| `SupplierVersionComparator` | persisted/mapped/disappeared/new/changed/ambiguous set-based |
| `ExpiredRawPayloadPurger` | claim/delete bounded, idempotente, conteos/errores auditables |
| `CatalogRetirementPlanner` | conjunto/hash/conteos server-side para catálogo activo o CREATED por batch |
| `CatalogRetirementExecutor` | revalidación serializable, retiro y evidencia append-only |

Sólo contratos públicos del módulo pueden ser consumidos; no se exportan
Kysely, tablas o repositories. Procurement futuro mapea su Supplier a Source
mediante contrato y no escribe estas tablas.

## Atomic publish transaction

1. Revalidar Session/contexto/capabilities antes de abrir y como commit guard.
2. Bloquear batch y row intents en orden estable; verificar `READY` y request ID.
3. Bulk-load CatalogItems/identifiers/references del mismo Tenant.
4. Revalidar expectedVersion, lifecycle, Type/applicability, contradictions y
   pending decisions.
5. Crear items/revisiones/audit/outcomes con IDs reservados.
6. Marcar batch `COMPLETED` y commit en la misma conexión.

Una RowDecision `REACTIVATE` sólo es válida si el mapping histórico exacto y
Tenant-scoped converge en un único `CatalogItem` compatible que sigue
`INACTIVE` en su `expectedVersion`. El mismo update conserva `itemId`, SKU y
barcode, cambia a `ACTIVE`, incrementa la versión y agrega únicamente las
revisiones de precio/costo cuyo importe cambió. El Resolution sigue siendo
`MATCHED` y el audit registra `INACTIVE→ACTIVE`. No se crea una segunda identidad
ni una variante `REACTIVATE_AND_UPDATE`.

Unique/FK/check/deadlock/serialization/timeout se traducen al contrato DEC-044.
Un stale vuelve a reconciliation; una falla técnica no deja writes de producto.
No se reintenta un commit outcome desconocido sin consultar idempotency outcome.

## Atomic retirement transaction

1. Resolver la capability dedicada y reautenticar al mismo actor mediante
   Access antes de entrar a Catalog.
2. Bloquear plan y candidatos en orden estable dentro de una transacción
   `SERIALIZABLE`.
3. Revalidar Tenant, actor, Branch, Station, Session, expiración, confirmación,
   capability/temporal guards y hash `itemId+version`.
4. Actualizar sólo targets todavía `ACTIVE` a `INACTIVE`, incrementando su
   versión; nunca ejecutar `DELETE`.
5. Agregar audit por item y un RetirementEvent agregado; marcar el plan
   `EXECUTED` en la misma transacción.

Una diferencia de contexto, conjunto, lifecycle, versión o autoridad produce
`STALE/EXPIRED/REJECTED` y cero retiros. Un retry idéntico devuelve el mismo
outcome; otro request no reutiliza el plan.

## Retention cleanup

Un job/command gobernado de Catalog —a materializar sólo al implementar
PBI-041— toma raw vencido en chunks máximos de 1,000 con lock breve y skip-locked
o mecanismo equivalente, marca correlation/outcome y elimina únicamente el
payload temporal. Debe ser reentrante, tolerar caída y terminar en ≤10 s para
1k/≤60 s para 10k. Alertará raw vencido no purgado dentro de 24 h. La suite usa
reloj controlado y demuestra que Listing estructurado, resolutions, batch,
audit y Catalog permanecen.

## Rollout de migraciones materializado

1. `20260914152000_access_add_catalog_bulk_retire_capability` agrega la
   capability explícita sin convertir `catalog.manage` en super-capability.
2. `20260914153000_catalog_create_retirement_plans` agrega únicamente planes y
   eventos; el lifecycle `ACTIVE/INACTIVE` de `CatalogItem` ya existía y no
   requirió alteración.
3. `20260914154000_catalog_add_historical_reactivation` amplía sólo el CHECK
   existente de RowDecision para admitir `REACTIVATE`; no agrega tablas,
   columnas, identidad ni backfill de CatalogItem.
4. No hay backfill de CatalogItem ni conversión de WIP PBI-040.
5. Crear roles/grants y queries owner del módulo; app antigua ignora tablas.
6. Ejecutar fresh/up, previous→up, constraints, rollback transaction y cleanup
   tests en PostgreSQL 18.4.
7. Habilitar sólo después de gates, CI y Owner checkpoint aplicables.

## Rollback constraints

- Rollback de aplicación deja tablas/evidencia intactas; una versión más vieja
  no debe interpretar estados nuevos.
- Down migration sólo se permite antes de existir datos persistidos y con
  autorización explícita. Después, recovery es roll-forward.
- Nunca `CASCADE` desde Source/Version/Listing/Resolution/Batch hacia
  CatalogItem, price/cost revisions, audit o downstream snapshots.
- Corregir versión/mapping/precio/costo crea nueva historia; no ejecuta DELETE ni
  reescribe timestamps.
- Advanced Supplier Reconciliation deberá ampliar schema de forma compatible;
  no puede reinterpretar firmas antiguas sin `signature_algorithm_version`.

## Evidencia requerida al implementar

- migration inventory/hash y schema snapshot;
- fresh + upgrade + failure/rollback real;
- two-Tenant/compound-FK/anti-enumeration matrix;
- immutability mutation guard y no-cascade proof;
- concurrent owners, replay, stale and transaction atomicity;
- EXPLAIN/plan y budgets 1k/10k; 50k characterization;
- retention clock/cleanup/no-loss proof;
- architecture/persistence ownership checks.

## Decisiones pendientes

Ninguna bloqueante para readiness. Nombres físicos/índices exactos pueden
ajustarse durante implementación sólo si conservan este contrato y pasan review;
no habilitan ampliar alcance ni degradar invariantes.
