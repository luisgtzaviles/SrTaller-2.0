# PBI-043 — Definition of Ready

## Resultado

**PASS — READY (2026-09-12).** PBI-043 tiene política, arquitectura, delta de
datos, rollback, races, revocación, browser behavior, threat model y evidencia
esperada definidos. Riesgo `Critical` y tamaño `Large` se preservan.

Este PASS no autoriza implementación, PR, merge, Preview, Production ni
reanudar PBI-040.

## Revisión

| Campo | Resultado |
|---|---|
| Objetivo | PASS — permitir Sessions independientes sin perder contexto o atribución |
| Autoridad de producto | PASS — ASC-001 a ASC-008 aprobadas |
| ADR | PASS — ADR-014 Accepted; sustitución parcial exacta de ADR-011 |
| Scope | PASS — admission, switch local, índice, revocación efectiva y pruebas |
| Exclusiones | PASS — sin Admin UI, audit global, enrollment, PIN UX, Price List, Repairs o Production |
| Identidad/contexto | PASS — Tenant+Branch+Station+StationCredential+User+SessionId server-side |
| Admission | PASS — login null inserta independiente; switch X reemplaza sólo X |
| Concurrencia | PASS — no lock station-wide para create; CAS/row lock exactos para switch |
| Persistencia | PASS — drop unique parcial, índices no únicos, PK/verifier/lifecycle/version conservados |
| Migración | PASS — fresh/existing, compatibilidad por fases y PostgreSQL real definidos |
| Rollback | PASS — guard aborta con N>1; ninguna ganadora silenciosa |
| Revocación | PASS — efectiva inmediata por epochs; materialización posterior permitida |
| PIN | PASS — rate/lockout conservados; no expulsa Sessions activas |
| Cookies/CSRF | PASS — nombres y controles sin cambios; perfiles usan jars independientes |
| Autorización | PASS — Session solicitante, capabilities y confirmación al commit |
| Atribución | PASS — hechos cubiertos conservan Tenant/Branch/Station/User/SessionId |
| Tiempo | PASS — idle 60m; absolute 12h |
| Threat model | PASS — Critical, amenazas/controles/stop conditions explícitos |
| Test strategy | PASS — 24 casos clasificados y gates run-1/run-2/comparison |
| Browser QA | PASS — dos perfiles reales y preservación de sesión Owner |
| Compatibilidad | PASS — consumidores de negocio sin cambio funcional |
| Delivery | PASS — branch desde main, ancestry/provenance, cleanup y Preview separados |
| Estimación | PASS — `Large`, estimación de ingeniería sin story points |
| Sprint/WIP | PASS — SPRINT-02 remediation; PBI-043 Ready; WIP 0/1 hasta start Owner |
| Preguntas bloqueantes | Ninguna |

## Definition of Ready checklist

- [x] Problema, usuario afectado y evidencia exacta documentados.
- [x] Resultado, scope y exclusiones verificables.
- [x] ASC-001 a ASC-008 trazadas sin reinterpretación.
- [x] ADR-014 Accepted y conflicto con ADR-011 resuelto explícitamente.
- [x] Modelo actual y destino definidos.
- [x] `expectedSessionId` definido para login y switch.
- [x] Transaction boundaries y outcomes de races definidos.
- [x] Delta de migración, compatibilidad y rollback guard definidos.
- [x] Revocación efectiva y materialización física distinguidas.
- [x] Tenant/Branch/Station/User/Session authority server-side preservada.
- [x] Cookies, CSRF, Origin, Fetch Metadata, JSON-only y anti-enumeración
  preservados.
- [x] Threat model Critical completo.
- [x] Matriz material de 24 casos completa.
- [x] Browser/Owner proof reproducible definido.
- [x] Delivery, evidence y cleanup definidos.
- [x] Riesgo `Critical` y tamaño `Large` registrados.
- [x] Ninguna pregunta bloqueante abierta.

## Evidencia requerida antes de Owner Review

- migración e índices verificados en PostgreSQL 18.x fresh/existing/down;
- suites application/contract/HTTP/materiales de [Test Strategy](./TEST_STRATEGY.md);
- dos perfiles Chrome reales sobre el mismo build/Station sintética;
- sesión Owner preservada al operar/logout en QA;
- business attribution con SessionId correcto;
- focused Critical-risk review sin BLOCKER/HIGH/MEDIUM;
- arquitectura, typecheck, build, `verify`, campaña full aplicable, run-1,
  run-2 y comparison GREEN;
- baseline ancestry y runtime provenance PASS;
- diff sin cambios fuera de Access/documentación autorizada.

## No aplicables

- UI responsive/visual nueva: no hay UI funcional nueva; sólo se valida el gate
  existente en perfiles reales.
- Integraciones externas: no existen en el scope.
- Global Access audit: excluido por ASC-005.
- Production rollout: no autorizado.

## Gates de inicio

PBI-043 sólo pasa a `In progress` cuando el Owner autorice explícitamente su
implementación. En ese momento debe crearse una rama `fix/*` nueva desde el
`main` actualizado que ya contenga este readiness; esta rama documental no se
reutiliza como implementación.
