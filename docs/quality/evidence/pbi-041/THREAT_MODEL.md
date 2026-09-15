# PBI-041 — Threat Model

## Estado

- **Resultado:** controles de readiness más extensión `OD-RESET-001..005`
  materializados en candidato local; Owner Review pendiente.
- **Fecha:** 2026-09-14.
- **Riesgo:** Alto por bulk mutation, persistencia, costos, multitenancy,
  concurrencia e idempotencia.
- **Alcance:** Composer clipboard, Supplier Version/Listing/Resolution,
  reconciliation memory, atomic Catalog apply, report, raw retention y retiro
  seguro de catálogo/lote.
- **Diferido:** amenazas CSV/XLSX de ZIP bomb, MIME, fórmulas, macros y links se
  modelan cuando exista ese adapter.

## Activos y trust boundaries

| Activo | Riesgo dominante | Frontera |
|---|---|---|
| CatalogItem/price/cost | cambio masivo incorrecto | preview humano vs commit server-side |
| Supplier snapshot/mapping | poisoning o reescritura histórica | input externo vs evidencia inmutable |
| Tenant/Branch context | lectura/write cross-tenant | trusted Session vs IDs del cliente |
| observed/reference cost | fuga comercial | capability server-side vs grid/report |
| raw clipboard | active content/retención excesiva | browser/input vs storage temporal |
| batch/idempotency | replay/partial success | request/red vs transaction outcome |
| grid/browser | resource exhaustion | paste no confiable vs main thread/memory |
| audit/report | datos sensibles/log injection | business evidence vs telemetry/export |
| retirement plan/effect | retiro masivo indebido o falsa reversión | Level 2 Access vs transacción Catalog |

Clipboard y texto del proveedor son totalmente no confiables. Source ID,
Tenant, Branch, actor, capability, mapping method, signature y target enviados
por cliente tampoco son autoridad.

## Amenazas y controles

| ID | Amenaza | Impacto | Controles requeridos | Prueba mínima |
|---|---|---|---|---|
| BI-T01 | HTML/script/fórmula en clipboard ejecuta contenido | Alto | aceptar texto plano; escape en DOM/export; CSP vigente; sin `innerHTML` | payloads HTML/SVG/formula/control chars quedan texto |
| BI-T02 | paste sobredimensionado agota grid/API | Alto | límites filas/columnas/celda/bytes; hard cap 10k; virtualización/chunks; rechazo antes de staging | 10,001/50k y celdas largas sin freeze/persistencia parcial |
| BI-T03 | Tenant A lee Source/Version/Listing/Batch de B | Crítico | contexto confiable, predicates/FKs compuestas, 404 uniforme, no global repo | dos Tenants, IDs cruzados en read/search/count/report |
| BI-T04 | Tenant A mapea Listing a item de B | Crítico | FK compuesta y revalidación target dentro del commit | cross-tenant item/source/version rechazados |
| BI-T05 | costo aparece sin permiso en grid/error/report/cache | Alto | response shape omite campo; read/manage revalidados; cache keys completas; logs redacted | network/DOM/export/error authorized vs denied |
| BI-T06 | capability revocada después de preview permite publish | Crítico | commit guard de Session + diff capabilities; fail closed y cero writes | revoke before commit bloquea batch completo |
| BI-T07 | CSRF dispara draft/publish | Alto | CSRF/origin/session contracts vigentes; no GET writes; explicit confirmation | origin/token negativos para cada command |
| BI-T08 | replay duplica items/revisiones | Alto | Tenant+operation idempotency keys, payload hash, reserved IDs/outcome lookup | retry same/different payload y unknown outcome |
| BI-T09 | mapping histórico envenenado auto-selecciona target | Crítico | sólo exact/unique/consistent; contradiction checks; preview; batch confirmation; correction history | inconsistent history becomes ambiguous |
| BI-T10 | title similarity renombra/actualiza item incorrecto | Crítico | no fuzzy/title write; descriptive/classification opt-in | near names/suffixes/casing never auto-write |
| BI-T11 | duplicate uses last-row-wins | Alto | detect all duplicate strong keys/fingerprints; conflict both rows | reversed input order same conflict |
| BI-T12 | dos Owners pierden decisiones | Alto | optimistic versions, stable row IDs, stale 409, no silent merge | concurrent draft/resolution edits |
| BI-T13 | stale CatalogItem creates partial apply | Crítico | expectedVersion per row; revalidation and one transaction | mutate one included item; zero batch effects |
| BI-T14 | commit failure leaves partial rows | Crítico | one connection/transaction; DB constraints; outcome journal | injected failure/deadlock/timeout with no partial history |
| BI-T15 | malicious supplier text poisons logs/audit | Alto | length/character allowlists; structured logs IDs/counts/codes only; export neutralization | CRLF/control chars do not forge entries |
| BI-T16 | raw survives 90 days | Alto | explicit expiresAt, bounded idempotent cleanup, overdue signal | controlled clock purge + failure/retry |
| BI-T17 | cleanup deletes permanent history | Crítico | raw table isolated; no destructive cascades; allowlisted delete | resolution/listing/batch/revisions remain |
| BI-T18 | permanent observed cost bypasses cost policy | Alto | same server-side redaction and capability checks for all queries/projections | old Version/history remains inaccessible denied |
| BI-T19 | signature collision treated as identity | Alto | signature version + source scope + evidence/identifier/type/lifecycle checks; collision -> ambiguous | forced collision never auto-selects |
| BI-T20 | supplier code absent/fabricated or duplicated | Alto | nullable; never generated; duplicate classification, not destructive unique | no-code 1,500 rows and repeated codes |
| BI-T21 | disappeared Listing inactivates Catalog | Alto | comparison is read-only evidence; lifecycle field outside batch | version omission creates no Catalog write |
| BI-T22 | branch override overwritten by base update | Alto | `TENANT_BASE` only; override tables absent from write set | base changes, effective override unchanged |
| BI-T23 | user tampers classification/match method | Alto | server recomputes matching/diff/state transitions | forged READY/MAPPED/expectedVersion denied |
| BI-T24 | report enumerates other Tenant or hidden cost | Alto | Tenant-scoped report query, authorization at read, redacted permanent fields | cross-tenant/report cost negative tests |
| BI-T25 | `catalog.manage` se usa como autoridad masiva implícita | Crítico | capability exacta `catalog.items.bulk_retire`, sin fallback | permiso ordinario solo no muestra ni ejecuta retiro |
| BI-T26 | otro usuario confirma con su PIN la acción del actor | Crítico | reautenticación PIN del mismo actor, proof consumido una vez | PIN ajeno rechaza y no cambia la Session ni Catalog |
| BI-T27 | plan manipulado/stale/expirado ejecuta otro conjunto | Crítico | conjunto derivado server-side, hash de item+version, TTL 5 min y revalidación serializable | cambio de versión/contexto/tiempo produce rechazo y cero retiros |
| BI-T28 | `Vaciar` destruye historia o reutiliza identidad | Crítico | sólo `ACTIVE→INACTIVE`; FKs/append-only intactos; inactive match exacto es REACTIVATE, nunca NEW | cero activos con IDs/SKU/barcode/listings/resolutions/memory intactos |
| BI-T29 | retiro por batch afecta MATCHED/UPDATED | Crítico | targets sólo por Resolution `CREATED` del batch aplicado | lote mixto retira CREATED y deja MATCHED/UPDATED activos |
| BI-T30 | Tenant A infiere o ejecuta el plan de B | Crítico | PK/predicates Tenant-scoped y 404 uniforme | plan alien no se lee, consume ni audita en el Tenant incorrecto |
| BI-T31 | reactivación débil o ambigua revive la identidad equivocada | Crítico | sólo mapping histórico exacto, único, consistente, mismo Tenant y Tipo compatible; sin fuzzy write | dos candidatos, contradicción y Tenant ajeno siguen AMBIGUOUS/CONFLICT |
| BI-T32 | reactivación parcial crea identidad o revisiones duplicadas | Crítico | target INACTIVE + expectedVersion, transacción serializable, idempotency journal y Resolution MATCHED | stale/concurrencia/retry conservan mismo ID y cero efectos parciales/duplicados |
| BI-T33 | dos cargas concurrentes reciben el mismo número de versión | Alto | lock de Source + contador server-side + unique Tenant/Source/sequence | requests concurrentes producen `vN` y `vN+1` |
| BI-T34 | hard delete de Source borra o desconecta evidencia publicada | Crítico | elegibilidad server-side; INGESTED/Resolution/Memory/retirement bloquean; sin CASCADE | Source histórica rechazada y CatalogItems intactos |
| BI-T35 | capacidad administrativa amplia sustituye autoridad de delete | Crítico | `catalog.suppliers.delete` exacta, asignable y sin fallback | UI oculta + backend deniega sin capability |
| BI-T36 | Enter/doble click salta intención o duplica delete | Alto | dos confirmaciones, primer Enter neutralizado, guard sincrónico e idempotencia | un solo evento/resultado |

## Abuse and denial rules

- `catalog.import.prepare` does not grant catalog write or cost visibility.
- `catalog.import.publish` is not a super-capability; the server intersects all
  field capabilities at confirmation and commit.
- Cost ingestion requires the applicable read/manage pair; otherwise the cost
  column is rejected, not stored invisibly.
- A pending Category/Brand may be deliberate; an unresolved identity decision
  is not. The server distinguishes them by explicit state, not UI appearance.
- A 50k paste is rejected before durable row creation in the initial product;
  characterization runs in a controlled test harness.
- Errors for alien/missing resources do not expose which condition occurred.
- Un plan no es autorización: ejecución vuelve a exigir contexto, capability,
  prueba Level 2, confirmación y conjunto vigentes.
- `ACTIVE CATALOG EMPTY` nunca se interpreta como ausencia de memoria histórica.

## ADR-013 classification

Publish remains level 1 under the approved architecture because it requires a
specific capability, explicit diff confirmation, append-only revisions,
idempotency, audit and an all-or-nothing reversible product change. It must be
reclassified before any automatic supplier sync, threshold-based auto-publish
or material financial authority. Conforme a `OD-RESET-002`, el retiro masivo es
nivel 2: capability dedicada más reautenticación del mismo actor, plan
server-side, confirmación exacta, revalidación y auditoría transaccionales. La
reversión de MATCHED/UPDATED continúa fuera de alcance; cualquier acción
sensible no clasificada permanece nivel 4/fail-closed.

## Security exit gate for implementation

- BI-T01..T30 applicable tests green, including PostgreSQL real;
- zero open Blocker/Critical/High in focused High-risk review;
- server-side cost omission proven in HTTP/network/DOM/report/history;
- two-Tenant and Branch-preservation matrix complete;
- CSRF/replay/concurrency/stale/atomicity and retention mutation guards pass;
- architecture/persistence ownership checks pass;
- evidence contains only synthetic data and no raw supplier payload/secrets.

## Riesgo residual antes de Owner Acceptance

La prueba local no sustituye revisión Owner, CI autoritativa ni Preview.
`REACTIVATE` sólo cubre una fila cuya memoria histórica demuestra un único
CatalogItem `INACTIVE`; no constituye una reactivación masiva administrativa ni
habilita matching aproximado. La reversión exacta de updates sigue fuera de
alcance. 50k continúa siendo caracterización, no capacidad de producto.
