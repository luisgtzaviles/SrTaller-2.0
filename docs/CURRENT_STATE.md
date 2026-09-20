# SR Taller 2.0 — Current State

## Estado del documento

- **Estado:** PBI-041 es `Done candidate`. PR #55 integró el producto, PR #56
  corrigió las rutas SPA y PR #57 integró el determinismo de publish como
  `9b7a83d02d1cd3fccf735d7e8bebd3ff16aa54ca`; exact-main CI `35539833596`
  quedó GREEN. Dokploy Preview activo, health, provenance, navegación directa y
  reload quedan GREEN sobre ese SHA clean. Este cierre documental materializa
  `Done` al integrarse con CI exacta; `Released: NO`. PBI-040 permanece `Done`,
  `Released: NO`.
- **Baseline Git verificada:** `main == origin/main` en
  `100eb9abc8b8b3b01da5dcc312777b59bf01a615` al iniciar PBI-041.
- **Última CI PBI-041 exact-main registrada:**
  [`35539833596`](https://github.com/luisgtzaviles/SrTaller-2.0/actions/runs/35539833596),
  `SUCCESS` sobre `9b7a83d` con run-1, run-2 y comparison PASS.
- **Sprint:** SPRINT-02 `Closed`; SPRINT-03 `Closed candidate`.
- **PBI actual:** `NONE`.
- **WIP:** `0/1`.
- **PBI-040:** PR #49/#50/#51 y cierre PR #52 integrados; `Done`.
- **Preview:** `9b7a83d` desplegado, clean y healthy; PBI-041 smoke PASS,
  incluidas las rutas directas, reload y unknown API fail-closed.
- **Production:** no desplegada ni autorizada.

## Resumen ejecutivo

PBI-041 pasó Formal Re-Verification, CI candidata y revisión independiente sobre
los HEAD exactos. PR #55 se integró como `b54a095`, PR #56 corrigió el allowlist
SPA como `39ece042` y PR #57 integró la remediación de determinismo como
`9b7a83d`; las CI exact-main correspondientes pasaron, incluida `35539833596`.
Preview reporta ese último SHA exacto y clean; acceso directo/reload, rutas
desconocidas fail-closed y health pasan con 75 migraciones/0 pending. La
reconciliación de data scope preserva los dos gates: AviCell se verifica
read-only en Owner/local y Preview acredita release/runtime con seed mínimo; no
se copiaron ni mutaron datos. Dominio, API, DB Owner y Production no cambiaron.
El PBI queda `Done candidate` hasta integrar este avance documental y
`Released: NO`.

El review remoto de PR #55 encontró `REVIEW-041-001`, una ventana de
concurrencia entre el snapshot usado para autorizar efectos y el Batch
publicado. La re-verificación independiente confirmó que la remediación local
vincula Apply al `batch.lock_version`: un `decide` concurrente invalida el
intento con cero escrituras y obliga a refetch/reautorización. PostgreSQL
PBI-041 pasa 10/10 con 75 migraciones y base `verify` pasa 935/0/30. Sin
embargo, la única corrida propia de `verify:full` falló Stage 4 durante
`owner-scoped-adapters`; cleanup y fingerprint pasaron y no hubo rerun. Owner
data y AviCell no cambiaron. Véase
[`FORMAL_REVERIFICATION_REVIEW_041_001.md`](quality/evidence/pbi-041/FORMAL_REVERIFICATION_REVIEW_041_001.md).

PBI-040 quedó Owner Accepted el 2026-09-13. PR #49 integró Catalog/Pricing;
PR #50 corrigió de forma gobernada la cronología de cinco migraciones todavía
no aplicadas y PR #51 corrigió el allowlist SPA de las rutas ya aceptadas. El
`main` funcional final `09e14c8` pasó CI exacta `34809054770` y fue desplegado
en Preview. `/`, `/livez`, `/readyz`, provenance, rutas directas, autenticación,
Lista de precios, alta/edición, filtros, costos, override Branch, Catalog
Administration, pending reconciliation, safe-delete eligibility,
deactivate/reactivate, canonical merge y Repair Detail quedaron verificados en
Preview. El hard delete permanece probado materialmente por el gate local/CI.
El Administrador tiene sólo
las seis capacidades PBI-040 autorizadas; las dos de importación PBI-041 están
desactivadas. Production no cambió.

El cierre documental PR #52 quedó integrado como `a060494` y su exact-main CI
`34814070839` pasó run-1, run-2 y comparison. Esto materializó `Done` para
PBI-040; `Released` permanece `NO`. Ése fue el corte previo a la posterior
selección explícita de PBI-041.

Workflow Phase 1 quedó Owner Accepted e integrado por PR #53. El candidato
exacto `a0eb1f6` pasó full local, CI `34892262371` con dos legs y comparison, y
revisión independiente sin findings abiertos. El merge `8598250` pasó el full
exact-main obligatorio `34893081175`; la attestation permaneció shadow-only.
La primera medición verde bajó de la baseline 12.6 min wall / 24.6 job-minutes
a 6.98 / 11.80, sin perder architecture, typecheck, build, broad tests,
PostgreSQL material, evidence, determinism comparison ni cleanup. No hubo
producto, PBI-041, Preview, Production o deploy.

PBI-041 fue seleccionado después como único WIP y autorizado sólo hasta Owner
Review local. El candidato funcional `6936ab2` (core `b49a52f`) materializa Source/Version/
Listing, draft durable, matching exacto y memoria corregible, Batch/decisiones,
publicación PostgreSQL atómica e idempotente, retención raw y los modos Alta
completa/Actualización compacta del Composer. La suite focalizada quedó verde:
build PASS, 91/91 contratos, PostgreSQL material 1/1 y 64 migraciones; 10,000
filas quedaron dentro de budgets y 50,000 se rechazaron sin persistencia. En
Chrome local se observaron 1280/768/640, light/dark, teclado, paste rectangular,
virtualización, reload y comparación V1/V2. El clasificador shadow declaró
`CROSS_MODULE_HIGH_RISK` y no omitió gates. No se ejecutó `verify:full`, conforme
a la autoridad previa a Acceptance; no hubo push, PR, merge ni deploy.

La remediación local más reciente de PBI-041 separó candidate contrast de
identity conflict durable. AG v17 conserva 37 filas `FULL` sin publicar: tras
reanálisis normal en localhost, sus 36 filas trusted permanecen `UNCHANGED` y
`Pantalla iPhone 16 Original` quedó `NEW/APPLY`, sin target ni memoria,
reemplazando el falso conflicto previo derivado sólo de `16` frente a `14/15`.
Los conflictos de identifiers incompatibles y mapping durable corregido siguen
fallando cerrado. No se aplicó el batch, no hubo push, PR, merge, Preview,
Production ni deploy; Owner Review continúa pendiente.

La iteración Owner `OD-RESET-001..005`, materializada en el candidato funcional
`44e605953676456eff519b5b3fca02d952eb5c38`, resolvió el hallazgo posterior sin hard
delete ni falsa reversión. El lifecycle existente `ACTIVE/INACTIVE` soporta
retiro; `catalog.items.bulk_retire` y el ejecutor ADR-013 nivel 2 exigen PIN del
mismo actor, plan server-side, confirmación exacta y revalidación transaccional.
El retiro global preserva identidad/historia y el retiro por lote deriva sólo
targets `CREATED`; MATCHED/UPDATED permanecen. PostgreSQL desechable demuestra
Historical Tenant con 1,539 items retirados, cero activos y memoria intacta, y
Virgin Tenant con las 36 pantallas AG realmente `NEW`. Un re-intake histórico
de esas 36 filas produjo 0 `NEW` / 36 `CONFLICT`, demostrando que la historia
impide duplicarlas. Build, 71 contratos focalizados, la campaña base de 885
pruebas y PostgreSQL material con 66 migraciones están verdes. El candidato
continúa sólo en revisión local:
sin `verify:full`, push, PR, merge, Preview ni deploy.

La iteración Owner posterior corrigió la semántica final de ese caso en
`f4bc803fe3b086405024f6199b65114feb1feebe`: una memoria exacta, única,
consistente, Tenant-scoped y compatible hacia un item `INACTIVE` ahora produce
`REACTIVATE`, no `NEW`, UUID manual ni conflicto por el lifecycle. La versión
local preservada `AG / Versión 1.2` pasó de 36 conflictos a 36 reactivaciones y
se publicó sobre los mismos 36 itemId/SKU/barcode. El Tenant quedó con 36
activos y 1,503 inactivos, sin cambiar sus 1,539 identidades; se anexaron 36
revisiones de precio, 36 de costo, 36 Resolution `MATCHED` y 36 audit events.
Los contratos focalizados quedaron 33/33, typecheck/build PASS y PostgreSQL
material PASS con 67 migraciones, rollback atómico, concurrencia e idempotencia.
`verify:full`, push, PR, merge, Preview, Production y Owner Acceptance siguen
sin ejecutarse ni inferirse.

La iteración vigente de PBI-041 separa `Lista` de `Fuentes y versiones`, asigna
`vN` monotónico server-side por Tenant+Source y exige
`catalog.suppliers.delete` con ADR-013 nivel 2 para el único hard delete nuevo.
Sólo una Source exclusivamente `DRAFT` y sin Resolution, Memory ni evidencia de
retiro es elegible; CatalogItem e historia publicada nunca se eliminan. El
upgrade local preservó el Tenant histórico y avanzó de 67 a 69 migraciones; una
incompatibilidad real del backfill con el trigger inmutable fue corregida con
una ventana autosellada que sólo llena `sequence_number` sin cambiar ningún
otro valor. Pasaron 80/80 contratos, PostgreSQL 1/1, typecheck y build.

Chrome local verificó 1280/768/640, light/dark, teclado, panel abierto/cerrado,
alta explícita con cero Versions, `v1`/`v2` el mismo día, descripción, reload,
protección de Sources publicadas y las dos confirmaciones del delete. El efecto
destructivo final se canceló para conservar `Proveedor QA eliminable 15 sep`
con dos borradores revisables; la ejecución y los negativos permanecen cubiertos
por PostgreSQL/backend. No se ejecutó `verify:full`, push, PR, merge, Preview,
Production ni deploy; Owner Acceptance sigue pendiente.

La iteración local más reciente retiró la contaminación sintética persistente
`Proveedor Demo` sin cambiar el hard delete productivo. Una auditoría exacta
demostró que su Source, 3 Versions, 4,500 Listings, 1,800 mappings, 1,800
Memory y 1,500 CatalogItems eran fixtures deterministas aislados, sin una sola
referencia AG u operativa. Un cleanup LOCAL fail-closed los eliminó en una
transacción serializable y preservó toda relación compartida. PostgreSQL quedó
con AG, sus 8 Versions y 39 CatalogItems: 36 activos vinculados a AG y 3 seed
inactivos no Demo; 0 orphans y 0 triggers deshabilitados. API y reload real de
Chrome muestran sólo AG, y Lista de precios devuelve 36 activos. Los gates
focalizados de cleanup/Composer, arquitectura, typecheck, build y PostgreSQL
PBI-041 están verdes. `verify:full`, push, PR, merge, Preview, Production,
deploy y Owner Acceptance permanecen sin ejecutar ni inferir.

La iteración Owner vigente separa ahora identidad estable, título canónico
actual y títulos observados por proveedor. La auditoría confirmó que
SupplierListing + Resolution publicada ya conservan la historia item-specific
y que CatalogAuditEvent puede reconstruir un rename; no se creó una tabla de
aliases. `Mismo artículo` exige una segunda decisión KEEP/ADOPT cuando el título
difiere, con KEEP como default, y nada cambia en Catalog antes de Apply. El
rename, Resolution, Memory y audit son atómicos y usan expected item version.
Price List incorpora búsqueda histórica indexada, Tenant-scoped y deduplicada
sin alterar filtros, conteo o paginación.

Materialmente, AG v13 ya estaba `APPLIED` desde
`2026-09-16 06:32:29.493+00`; conservó los itemId y títulos canónicos previos.
No fue republicada ni modificada en esta iteración. AG v12 sigue `READY` y v11
`RECONCILING`, ambas sin publicar; Chrome usa una de esas superficies para que
el Owner revise KEEP para `(liquidacion)` y ADOPT para `Display` sin ejecutar
Apply. Gates focalizados de contracts, PostgreSQL, search, Tenant isolation,
concurrency, idempotency, architecture, typecheck, build y performance están
verdes. `verify:full`, push, PR, merge, Preview, Production, deploy y Owner
Acceptance permanecen sin ejecutar ni inferir.

PBI-039 está `Done` efectivo: PR #45 integró el cierre documental como
`40684d7` y la CI exacta `34623060504` pasó run-1, run-2 y comparison. El ciclo
Price List comenzó después en una rama no integrada. Ese WIP permaneció
congelado durante PBI-043 y ahora se reanuda exclusivamente para continuar su
Owner Review.

Durante su Owner Review se confirmó una fricción preexistente de Access: la
regla PBI-034 de una Session activa por Station rechaza otro perfil con PIN
válido. La auditoría ubicó la causa en ADR-011, el unique parcial
`(tenant_id, station_id) WHERE active`, el guard station-wide y
`createReplacingActive`.

El Product Owner aprobó ASC-001 a ASC-008. [ADR-014](decisions/proposed/ADR-014-concurrent-operational-sessions.md)
sustituye sólo la exclusividad y reemplazo station-wide de ADR-011. La nueva
política permite cero o más Sessions por Station; cada request conserva una
Session solicitante ligada a Tenant, Branch, Station, StationCredential, User
y SessionId. Cookies, CSRF, autorización, rate limit, idle 60 minutos y
absolute 12 horas permanecen.

[PBI-043](backlog/pbis/PBI-043.md) materializa la decisión como un objetivo
Access independiente. Tiene [DoR PASS](quality/evidence/pbi-043/DEFINITION_OF_READY.md),
[Threat Model Critical](quality/evidence/pbi-043/THREAT_MODEL.md) y una
[matriz de 24 pruebas](quality/evidence/pbi-043/TEST_STRATEGY.md) ejecutada
localmente. El candidato permite N Sessions por Station y conserva switch/
logout por Session exacta. Una primera revisión Critical detectó debilidad en
los oráculos de concurrencia y sobredeclaración de evidencia; el candidato fue
remediado con locks PostgreSQL observables, revocación N-session, cruces
lockout/CSRF/atribución materiales y un runner Chrome endurecido. La revisión
independiente final de `65cf2da` cerró PASS sin hallazgos Critical/High/Medium;
`verify:full` de 12 etapas y PostgreSQL owner-scoped 2× MATCH también pasaron.
PR #47 integró el candidato `65cf2da` como `aab27d9`; CI candidata
`34729684465` y exact-main `34730090448` pasaron ambas piernas y comparación.
El mismo SHA quedó desplegado en Preview con health PASS y prueba real de dos
perfiles/Users sobre una Station compartida. Logout, relogin y switch del
perfil QA no afectaron la Session Owner. El fixture User sintético quedó
inactivo, las Sessions QA revocadas y sólo la Session Owner previa permaneció
activa. Production no cambió.

El cierre PR #48 quedó integrado como `5be5cd6` y la CI exacta
`34732201476` pasó run-1, run-2 y comparison. Conforme al workflow, PBI-043
es `Done` y SPRINT-02 está `Closed`. La rama PBI-040 conserva como padre su
HEAD congelado `68843ba` y como nuevo padre integrado `5be5cd6`; los conflictos
se resolvieron por ownership, manteniendo Access/PBI-039/main autoritativos y
Catalog/Pricing desde el WIP.

La reconciliación pasó `verify:full` en sus 13 etapas sobre `28320b3`:
836 pruebas base sin fallas, PostgreSQL compuesto 17/17, PBI-039 material 2/2,
PBI-040 material con 57 migraciones y benchmark p95 7.19 ms, smokes y cleanup
PASS. El runtime local declaró el mismo SHA limpio en frontend/backend/worktree;
Repair Detail parity y la prueba Chrome de dos perfiles concurrentes también
pasaron. La sesión personal Owner quedó preparada en `/listas/precios` con los
cuatro fixtures sintéticos previos. Esto no constituye Owner Acceptance.

La iteración Owner posterior eliminó el segundo workflow de referencias de
Price List. Category y Brand ahora separan captura pendiente de canon y usan la
misma intención de Repairs: `Resolver → Asociar existente | Crear canónica`,
con ownership, IDs, capabilities y persistencia separados por bounded context.
La migración 58 preservó el WIP previo; las pruebas materiales cubren ambos
modos, duplicados, compatibilidad, reload, auditoría y Tenant isolation. Chrome
local queda preparado con colas sintéticas comparables de Repairs/Tipo,
Catalog/Category y Catalog/Brand. Aceptación Owner sigue pendiente.

El candidato funcional `4ef0fc9` pasó `verify:full` en sus 13 etapas: suite
base sin fallas, PostgreSQL compuesto 17/17, PBI-039 material 2/2, PBI-040 con
58 migraciones y búsqueda sobre 10,000 artículos en p95 6.82 ms, runtime
Preview-like, smokes compilados y cleanup PASS. El gate también confirmó que
las suites PostgreSQL owner-scoped aíslan las tres tablas nuevas y que el
rollback protegido de PBI-043 continúa probándose después de retirar de forma
gobernada la migración posterior de Catalog.

La iteración Owner vigente añade el contexto de Tipo a Category y Brand
canónicas/pendientes usando la misma aplicabilidad de Nuevo artículo. También
unifica el lifecycle administrativo: referencias realmente libres pueden
eliminarse; las usadas se desactivan/reactivan y cada bounded context conserva
la autoridad de consultar sus dependencias. Catalog y Repairs revalidan el
delete dentro de transacción, responden conflicto tipado ante uso concurrente y
preservan los eventos históricos sin cascada. El candidato local `c8410bf`
cerró `verify:full` 13/13 etapas
PASS: 837 pruebas base sin fallas, PostgreSQL compuesto 17/17, PBI-039 2/2,
PBI-040 1/1 con 60 migraciones y p95 7.18 ms, runtime Preview-like, smokes y
cleanup PASS. Esto no constituye Owner Acceptance.

La siguiente corrección de Owner evita que una captura exacta llegue tarde a
Reconciliación. Category usa identidad Tenant+Tipo+nombre normalizado y Brand
Tenant+nombre normalizado; el alta busca canon antes de pending, reutiliza la
referencia activa y amplía de forma auditada la aplicabilidad de Brand. Locks
Tenant-scoped y uniques cubren writers concurrentes. El duplicado sintético
histórico `Pantallas`/Refacción se asoció mediante el flujo gobernado al canon
existente, conservando raw label, uso, actor y tiempos. Owner Acceptance sigue
pendiente.

El candidato limpio `f4ace4a` pasó `verify:full` 13/13: suite base 817 PASS,
PostgreSQL compuesto 17/17, PBI-039 2/2, PBI-040 1/1 con 61 migraciones y p95
9.00 ms sobre 10,000 artículos, runtime Preview-like, smokes y cleanup PASS. El
primer intento detectó que el manifest general aún declaraba 60 migraciones y
el segundo que el rollback material de Access debía retirar primero la nueva
migración posterior de Catalog; ambos contratos se actualizaron de forma
exacta, sin eliminar assertions ni modificar semántica de Access.

La iteración Owner actual distingue Edit, Pending Reconciliation y Canonical
Merge. Category permite consolidación sólo en Tenant+Tipo; Brand consolida en
Tenant y conserva la unión de aplicabilidad. El comando es transaccional,
reasigna artículos y destinos pendientes gobernados, preserva las fuentes como
merged y registra un evento append-only con actor/correlation. La UI ofrece
selección múltiple, survivor, nombre final, usage y confirmación. Editar artículo
comparte ahora el mismo combobox y resolvedor server-side de creación para
reutilización exacta, expansión Brand y nuevas capturas pendientes.

La auditoría de Device Types, Repairs Brands, Models, Problem Categories y Risks
confirmó que la interacción puede ser compartida, pero no su semántica: scope
Platform/Tenant, historia de recepción y colisiones Brand/Model requieren
decisiones fuera de PBI-040. No se añadió merge a Repairs ni se abrió otro PBI.
Owner Acceptance, gates de PR/CI/merge y deploy siguen pendientes.

El discovery posterior de carga masiva auditó V1, ENL y los contratos actuales
de Catalog. La dirección Owner es un Bulk Catalog Composer tabular para
copiar/pegar desde Sheets, con un solo Batch Engine al que CSV/XLSX/API podrán
conectarse después. La evidencia adicional de proveedores informales reformuló
`OD-BI-001`: supplier code es opcional y la continuidad vive en SupplierSource,
versiones/listings inmutables y mappings persistentes hacia CatalogItem. Supplier
Listing nunca gobierna el título ni se vuelve identidad downstream. Matching por
similarity no publica automáticamente; preview no escribe producto y Branch
overrides permanecen intactos. `OD-BI-001..010` están aprobadas y promovidas.
El [documento de auditoría y diseño](domain/PRICE_LIST_BULK_IMPORT_AUDIT_AND_DOMAIN_DESIGN.md)
separa SupplierSource/Version/Listing/Resolution/Memory de
CatalogUpdateBatch/RowDecision. Arquitectura, persistence design, Threat Model
y Test Strategy dejaron PBI-041 Ready en aquel corte. La selección e
implementación local posteriores quedan descritas arriba. Advanced Supplier
Reconciliation sigue diferido sin PBI ID, selección ni readiness.

La iteración local vigente de PBI-041 agrega la declaración independiente de
cobertura `PARTIAL|COMPLETE` para cada SupplierCatalogVersion. El default y
backfill son `PARTIAL`; sólo una lista COMPLETE puede presentar “no observado”
contra una COMPLETE anterior del mismo SupplierSource. Esa observación nunca
retira ni altera CatalogItem, identidad, revisiones, Resolution o memoria.
La migración local aditiva llegó a 72 migraciones y sus gates focalizados
pasaron; Owner Review y Owner Acceptance permanecen pendientes.

El candidato funcional final es `0720813`. `verify:full` pasó 13/13 etapas:
suite base 838 pruebas, 818 PASS y 20 skips PostgreSQL gobernados; composite
17/17, PBI-039 2/2 y PBI-040 1/1 con 62 migraciones y p95 5.50 ms sobre 10,000
items; runtime Preview-like, smokes y cleanup PASS. Chrome local confirmó el
merge reversible `Fundas + Fundas QA`, selección compatible, foco/Escape,
Light/Dark y 1280/768/640. La edición mostró canon exacto y captura pending con
el mismo combobox. Esto no constituye Owner Acceptance.

## Capacidades integradas relevantes

- Trusted Station Context, Users, Roles/capabilities, PIN y Operational Session
  con autorización contextual server-side.
- PBI-043 permite Sessions concurrentes por Station en `main` y Preview.
- Customer mínimo, New Repair y Repair Detail PBI-039 integrados y validados.
- Catalog/Pricing PBI-040 integrado y validado en Preview; importación masiva
  permanece fuera del runtime.
- Auditoría de negocio acotada conserva Tenant, Branch, Station, User,
  SessionId y correlation en los writes cubiertos.

## Estado del delta PBI-043

| Área | Estado |
|---|---|
| ADR-014 | Accepted y materializada en `main`/Preview |
| Admission concurrente | PASS Application/HTTP/PostgreSQL/Chrome/Preview |
| Switch session-local | PASS; reemplazo exacto local y Preview |
| Drop unique parcial / índices | migración fresh/existing/down/reapply PASS; sin índice StationCredential injustificado |
| Revocación efectiva N-session | contratos internos y PostgreSQL PASS |
| Cookies/CSRF/PIN/timeout | Sin cambio aprobado |
| Browser Owner + QA | PASS local y Preview; misma Station, perfiles y Users distintos; DOM/Console/Network gated |
| Device/Session Admin | Fuera de alcance |
| Global Access lifecycle audit | Fuera de alcance |

## Roadmap y WIP

| Elemento | Estado vigente |
|---|---|
| Sprint | SPRINT-03 — Closed candidate |
| Current PBI | NONE |
| WIP | 0/1 |
| PBI-040 | Done; Owner Accepted, integrado, exact-main CI y Preview PASS; Released NO |
| PBI-041 | Done candidate; PR #55/#56/#57, exact-main CI, Owner/local data integrity and Preview release PASS; Released NO |
| G3 Authentication | PASS; policy delta PBI-043 integrada y validada |
| Workflow Phase 1 | Done; PR #53 y exact-main full CI PASS |
| Preview | `9b7a83d` PASS; seed mínimo es autoridad de release, no réplica Owner |
| Production / release | NO / NO |

## Próxima acción

Validar e integrar el cierre documental gobernado de PBI-041. No se inicia un
nuevo PBI; la decisión de data scope mantiene Owner/local como autoridad
read-only de AviCell y Preview como autoridad de release. La integración sigue
requiriendo el workflow de PR, CI y autorización Owner aplicable; Production
permanece fuera de alcance.
