# PBI-041 — Final Closure & Readiness Audit

- **Fecha:** 2026-09-19.
- **Alcance original:** audit y verificación local; ese checkpoint no tuvo
  implementación, mutación de datos Owner, push, PR, merge, deploy ni cambios
  de infraestructura. Las remediaciones de gates posteriores se registran sin
  reescribir ese resultado histórico.
- **Dictamen actual:** **REVIEW REMEDIATION LOCALLY VERIFIED.** El PASS
  formal posterior a FV-GATE-REMEDIATION-5 permanece histórico para `690282a`.
  `REVIEW-041-001` cambió la implementación y exige nueva Formal Verification
  independiente. Los gates locales base y full ya pasaron.

## Repositorio y candidate del audit original

| Campo | Resultado |
| --- | --- |
| Repositorio | `SrTaller-2.0` local |
| Branch | `feature/pbi-041-bulk-catalog-composer` |
| HEAD | `26f329580b15e3ec10801b602cf16a67078f4c88` |
| `origin/main` | `100eb9abc8b8b3b01da5dcc312777b59bf01a615` |
| Divergencia | `152` commits ahead / `0` behind |
| PR remoto | ninguno para esta branch al momento del audit |
| Árbol versionado | limpio |
| Untracked preservado | `apps/dev-preview-web/src/.DS_Store` del Owner; no añadido, borrado ni modificado |

Los 152 commits desde `origin/main` pertenecen al único WIP PBI-041: foundation
de Composer y migraciones, lifecycle/reconciliación/coverage, UX-001..005,
field policy, autorización, regresiones y evidencia. La inspección de los 140
paths modificados no encontró otro PBI, infraestructura remota ni un commit que
dependa de archivos de producto no versionados. El único archivo no versionado
es el artefacto `.DS_Store` preservado.

## Contrato y estado funcional

El objetivo original permanece: intake de proveedor versionado y durable,
reconciliación explicable, Apply atómico/idempotente y Catalog Tenant-scoped
sin inferencia débil de identidad. El alcance y sus 29 criterios incorporan
draft grid, FULL/COMPACT, PARTIAL/COMPLETE, duplicates, history, pending
references, field policy, capabilities, lifecycle/retirement seguro, Source
governance y evidencia responsive.

La documentación PBI, `PRICE_LIST_ARCHITECTURE`, estrategia de pruebas y
evidencia concuerdan en que UX-001, UX-002, UX-003, UX-004 y UX-005 fueron
materializados localmente. Sus sub-slices preservan los contratos siguientes:

- **UX-001:** selección explícita de proveedor/intención, workspace y panel de
  Sources/Versions sin contaminación de estado.
- **UX-002:** Review guarda y analiza, duplicados requieren ganador explícito,
  FULL es la vía primaria y COMPACT no crea `NEW`; contexto faltante sólo
  completa vacíos explícitos.
- **UX-003:** policy Tenant-wide append-only, Essentials derivados de policy,
  valores requeridos efectivos y relectura de policy durante Apply.
- **UX-004:** capability model granular, server-side authorization, read /
  prepare / publish separados, controles ADR-013 Level 2 para bulk retire y
  supplier delete, toolbar/grid/resizing/undo conservados.
- **UX-005:** first baseline, coverage, corrección de excepciones, duplicate
  winner, Apply/provenance y remediación AviCell trazable.

El `FAIL` histórico de UX-005.5 no se reescribió: sus dos hallazgos fueron
remediados explícitamente por UX-005.6/005.7. La consulta actual confirma que
Avicell v3 conserva 744 listings, `COMPLETE`, Batch `APPLIED` y 742 items
atribuidos; las 16 promotions relinked eliminaron los pendientes AviCell,
`Aple` sigue pendiente y la fila 411 está `INACTIVE` versión 3 con precio/costo
históricos en cero. Los eventos auditados son 16
`catalog.brand_pending.canonical_created` y un `catalog.item.update` con las
capabilities correctas. No hay defecto funcional, de seguridad ni de integridad
de datos actualmente observado en esta auditoría.

## Arquitectura, persistencia y seguridad

`verify:architecture` pasa para DEC-005. La evidencia y las pruebas materiales
vigentes cubren errores sanitizados DEC-044, repositorios/transacciones
Tenant-scoped DEC-049, aislamiento ADR-004, roles-capabilities-contexto
ADR-012 y controles Level 2 ADR-013. No se detectó branching por nombre de rol;
lectura, costo, item, import read/prepare/publish, configuración, bulk retire
y supplier delete permanecen separados y tienen denegación server-side.

La base local tiene 75 migraciones aplicadas y la suite PostgreSQL desechable
PBI-041 ejecutó 10/10 pruebas, removiendo su contenedor. Esto cubre migración,
esquema, publicación atómica/idempotente, tenant isolation, duplicate winner,
field policy, zero-price defense, pending Brand exacta y capabilities. No hay
dependencia conocida de mutación manual de schema.

## UI y rendimiento

El smoke autenticado local mostró Lista de precios y Composer sin pantalla
blanca: navegación, sesión Luis, selector de Brand, ruta `Carga masiva`, panel
Sources/Versions y empty workspace responden correctamente. La evidencia
histórica enlazada conserva los walkthroughs 1280/768/640, claro/oscuro y
teclado de las superficies representativas.

La última prueba controlada de 10k midió ingest `4,961.9 ms`, analyze
`453.4 ms`, preview `35.9 ms`, publish `2,160.3 ms`, historical search
`76.3 ms` y heap `71.0 MiB`: dentro de 30 s / 250 MiB. Timings históricos de
aproximadamente 30.6 s y 34.9 s son **NON-BLOCKING ENVIRONMENTAL FLAKE**:
no son deterministas, el run actual pasa ampliamente y no se reclama soporte
adicional ni se marca deuda aceptada. Formal Verification debe conservar la
medición sobre candidate congelado y registrar ambiente/hardware.

## Bloqueos formales

| ID | Clasificación | Hallazgo | Por qué bloquea |
| --- | --- | --- | --- |
| `B-041-FV-001` | Gate de integración | `verify:full` falló en Stage 0: la protección PBI-039 rechaza `apps/dev-preview-web/src/api.ts`. El único delta PBI-041 es añadir `PreviewApiError.parameter`, introducido por UX-002. | El full obligatorio no puede iniciar sus stages materiales mientras el guard no reconozca o autorice este cambio. |
| `B-041-FV-002` | Gate base / contrato de migración | `test/architecture-database-migration.test.mjs` falla: su allowlist no incluye `20260917190000_catalog_create_field_policies`, `20260917190100_access_add_catalog_configuration_capabilities` ni `20260917190200_access_add_granular_catalog_capabilities`. | `verify` falla y la lista pública de migraciones gobernadas está incompleta respecto de las 75 migraciones reales. |

Ambos requieren una remediación gobernada separada. No son deuda aceptada ni se
pueden rebautizar como tal para continuar. La auditoría no cambia el guard, la
allowlist, código funcional ni migraciones.

### Remediación posterior autorizada

La remediación FV-GATE-REMEDIATION posterior conserva este dictamen histórico.
`B-041-FV-001` y `B-041-FV-002` quedaron **RESOLVED** mediante una autorización
path+hash exacta para `PreviewApiError.parameter` y la alineación estricta de
los contratos con las 75 migraciones gobernadas. Los checks focalizados y
PostgreSQL desechable pasaron, incluida una segunda ejecución con 0 pendientes.

El `verify` posterior reveló dos blockers distintos que no estaban autorizados
para corrección en ese slice: el inventario de tests PostgreSQL de la campaña
full está stale (`B-041-FV-003`) y Composer infringe tres reglas del visual
foundation checker (`B-041-FV-004`). Por ello no se ejecutó un nuevo
`verify:full` ni el readiness recheck, y el estado continúa **NOT READY —
BLOCKERS REMAIN**. Ver
[FV_GATE_REMEDIATION.md](FV_GATE_REMEDIATION.md).

### Segunda remediación y recheck

FV-GATE-REMEDIATION-2 resolvió `B-041-FV-003` y `B-041-FV-004`: el inventario
gobernado cubre 29 identidades exactas y Composer cumple el visual foundation
sin suppressions. PostgreSQL PBI-041 pasó 9/9 con 75 migraciones y `verify`
quedó verde.

La campaña `verify:full` ejecutada una sola vez sobre `82974d8` superó Stages
0..3, pero falló en Stage 4 Material PostgreSQL composite porque el runner
owner-scoped reportó `test/access-role-postgresql.test.mjs` con exit 1. Cleanup
y fingerprint final pasaron. La evidencia disponible es intencionalmente
sanitizada y no permite atribuir una causa más estrecha sin un diagnóstico
separado. Se registra `B-041-FV-005` como blocker nuevo; no se reintentó la
campaña ni se cambió ese gate fuera del alcance autorizado. El dictamen sigue
siendo **NOT READY — BLOCKERS REMAIN**.

### Tercera remediación y blocker sucesor

FV-GATE-REMEDIATION-3 identificó `B-041-FV-005` como drift determinista del
fixture Access-role: el catálogo PostgreSQL correcto incluía
`catalog.suppliers.delete` y estaba ordenado por SQL, mientras dos expectativas
manuales estaban incompletas y fuera de orden. El test material exacto pasa
1/1 después de alinearlo con el catálogo finito de dominio, conservando grants
por rol exactos, aislamiento y ausencia de expansión sensible.

El runner owner-scoped siguiente dejó de fallar en Access-role y reveló
`B-041-FV-006` en `test/access-session-postgresql.test.mjs`: el rollback
fixture espera como latest migration `20260913140000`, pero las 75 migraciones
vigentes terminan en `20260917190200`. La reproducción aislada confirma otro
**TEST FIXTURE DRIFT**, fuera del alcance exclusivo de FV-3. No se ejecutaron
`verify` ni `verify:full` después de ese fallo de prerequisito. El dictamen
permanece **NOT READY — BLOCKERS REMAIN** sin alterar el histórico anterior.

### Cuarta remediación y cleanup blocker

FV-GATE-REMEDIATION-4 resolvió `B-041-FV-006` como drift del fixture
Access-session. El rollback preparatorio ahora deriva cada migración posterior
a Concurrent Operational Sessions desde el manifest gobernado, valida el orden
exacto al retirarlas y conserva sin cambios la prueba de rollback rechazado con
sesiones múltiples. El test material exacto pasa 1/1 en PostgreSQL 18.4.

El composite owner-scoped posterior pasó Access-role y Access-session, pero el
control de cleanup detectó 13 tablas PBI-041 retenidas por el fixture manual de
`test/contextual-authorization-postgresql.test.mjs`. Se registra
`B-041-FV-007` como **TEST FIXTURE CLEANUP DRIFT** fuera del scope exclusivo de
FV-4. No se ejecutaron `verify` ni `verify:full` tras ese prerequisito fallido.
El dictamen continúa **NOT READY — BLOCKERS REMAIN**.

### Quinta remediación y readiness recheck

FV-GATE-REMEDIATION-5 confirmó `B-041-FV-007` como drift exclusivo del fixture:
el test funcional pasaba, pero su lista manual de teardown y su aserción local
omitían las mismas 13 tablas PBI-041. El runner externo, sin modificaciones,
las detectaba mediante `pg_dump`. La remediación reemplaza el schema `public`
sólo en una base cuyo nombre y User coinciden con el contexto gobernado
desechable, de modo que nuevas tablas gobernadas no dependen de otra lista
manual. Un probe desconocido demuestra detección antes del reset y eliminación
posterior.

El test exacto pasó 1/1 dejando cero tablas; owner-scoped PostgreSQL pasó 8/8
con cleanup PASS y material MATCH; contratos contextuales pasaron 30/30. Base
`verify` pasó sin fallos y la única corrida autorizada de `verify:full` pasó
Stages 0..13, incluido el compuesto PostgreSQL 17/17 y PBI-041 9/9. El
benchmark 10k registró ingest 4,174.4 ms, analyze 449.0 ms, preview 40.0 ms,
publish 28,920.0 ms, historical search 74.4 ms y heap 33.0 MiB; el umbral no
cambió.

Recheck corto: `B-041-FV-001..007` **RESOLVED**, blockers nuevos **NONE**.
PBI-041 está **READY FOR INDEPENDENT FORMAL VERIFICATION**. Owner Acceptance,
PR, CI, merge, Done, Released y deploy permanecen separados y no autorizados
por este resultado. Owner data y AviCell no cambiaron.

## Paquete para Formal Verification posterior

Tras remediar ambos bloqueos y congelar un HEAD nuevo, Formal Verification debe
confirmar: ancestry contra `origin/main`; árbol limpio salvo el `.DS_Store`
preservado y reconocido; `verify:full` completo; 75 migraciones desde base
desechable y segunda ejecución sin pendientes; capacidades/denegaciones;
Apply atómico/idempotente; Tenant/Branch isolation; FULL/COMPACT,
PARTIAL/COMPLETE, duplicates, coverage, policy, zero-price y pending Brand;
Avicell v3/row 411 como evidencia read-only; 10k performance; y los smokes UI
del candidate. Owner Acceptance, PR, CI, merge, Done, Released y deploy siguen
siendo pasos separados.

## Acciones remotas

Ninguna. Este audit no crea ni actualiza un PR, no hace push ni modifica GitHub
o infraestructura.

## Reapertura por review remoto — REVIEW-041-001

El review de PR #55 encontró una ventana entre la composición de capabilities
de Apply y el estado de Batch realmente publicado. `REVIEW-REMEDIATION-1`
vincula ahora el snapshot autorizado al `batch.lock_version` existente y hace
que cualquier `decide` concurrente produzca un conflicto antes de escrituras.
La prueba material cubre escalamiento `UNCHANGED → REACTIVATE`, cero efectos
del intento stale y retry sólo tras refetch/reautorización.

Esta remediación no reescribe el resultado histórico ni hereda su PASS. Véase
[`REVIEW_REMEDIATION_1.md`](REVIEW_REMEDIATION_1.md). Owner data y AviCell no
cambiaron; no hubo migración ni acción remota.
