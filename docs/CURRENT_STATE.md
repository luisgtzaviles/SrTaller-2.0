# SR Taller 2.0 — Current State

## Estado del documento

- **Estado:** PBI-040 `Done`, `Released: NO`. PBI-041 permanece
  `Ready — implementation not authorized`.
- **Baseline Git verificada:** `main == origin/main` en
  `859825025cf1f9fa94a8b0ced5b91b95760e36a8` antes de la reconciliación
  documental de cierre.
- **CI exacta de baseline:**
  [`34893081175`](https://github.com/luisgtzaviles/SrTaller-2.0/actions/runs/34893081175),
  `SUCCESS` sobre `8598250` con run-1, run-2 y comparison PASS.
- **Sprint:** SPRINT-02 `Closed`; SPRINT-03 `Active`.
- **PBI actual:** `NONE`.
- **WIP:** `0/1`; PBI-041 no está seleccionado ni iniciado.
- **PBI-040:** PR #49/#50/#51 y cierre PR #52 integrados; `Done`.
- **Preview:** `09e14c8` desplegado, clean, health y PBI-040 autenticado PASS.
- **Production:** no desplegada ni autorizada.

## Resumen ejecutivo

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
PBI-040; `Released` permanece `NO`. No existe PBI actual y PBI-041 sigue Ready,
no seleccionado, no autorizado y no iniciado.

Workflow Phase 1 quedó Owner Accepted e integrado por PR #53. El candidato
exacto `a0eb1f6` pasó full local, CI `34892262371` con dos legs y comparison, y
revisión independiente sin findings abiertos. El merge `8598250` pasó el full
exact-main obligatorio `34893081175`; la attestation permaneció shadow-only.
La primera medición verde bajó de la baseline 12.6 min wall / 24.6 job-minutes
a 6.98 / 11.80, sin perder architecture, typecheck, build, broad tests,
PostgreSQL material, evidence, determinism comparison ni cleanup. No hubo
producto, PBI-041, Preview, Production o deploy.

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
CatalogUpdateBatch/RowDecision. Arquitectura, persistence design, Threat Model,
Test Strategy y Definition of Ready dejan PBI-041 `Ready — implementation not
authorized`. Advanced Supplier Reconciliation queda diferido sin PBI ID,
selección ni readiness. No se implementó producto, migración, endpoint, UI,
job o cambio de base.

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
| Sprint | SPRINT-03 — Active |
| Current PBI | NONE |
| WIP | 0/1 |
| PBI-040 | Done; Owner Accepted, integrado, exact-main CI y Preview PASS; Released NO |
| PBI-041 | Ready documentalmente; Candidate no seleccionado, no iniciado ni autorizado |
| G3 Authentication | PASS; policy delta PBI-043 integrada y validada |
| Workflow Phase 1 | Done; PR #53 y exact-main full CI PASS |
| Preview | `09e14c8` PASS; sin cambio por Workflow Phase 1 |
| Production / release | NO / NO |

## Próxima acción

Esperar selección/autorización Owner. PBI-041 permanece Ready, no seleccionado
ni autorizado; no iniciar otro PBI ni desplegar Production.
