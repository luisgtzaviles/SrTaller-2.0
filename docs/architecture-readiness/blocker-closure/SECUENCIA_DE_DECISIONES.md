# Secuencia recomendada de decisiones

## Principio

La secuencia reduce decisiones irreversibles: primero autoridad y contexto; después identidad y persistencia; luego recepción; por último operación real y producción. Un grupo puede preparar evidencia del siguiente, pero no saltar su gate.

## Grupo 0 — Autoridad y base ejecutable

1. **Cerrado el 2026-07-21:** alcance, inclusiones y exclusiones de R0 (`DEC-002`).
2. **Selección aceptada el 2026-07-22:** `DEC-004` fija Node.js `24.18.0`, pnpm `11.15.1`, lockfile frozen, ESM/NodeNext, TypeScript `6.0.3`, compilación previa y Linux x86_64/glibc. [PBI-021](../../backlog/pbis/PBI-021.md) está creado y `Ready`; faltan materialización, VC-001 a VC-024, CI posterior y evidencia Linux.
3. **Cerrado para H0 el 2026-07-23:** `DEC-005` fija `tenancy`, `stations`, `access`, ownership, imports, shared, infraestructura y límites NestJS; [PBI-022](../../backlog/pbis/PBI-022.md) está `Done` y la sexta reverificación formal confirmó DEC005-C01 a C05 en `PASS`.
4. **Cerrado el 2026-07-24:** el Responsable del Proyecto aceptó [propiedad, repositorios, transacciones y acceso PostgreSQL](../../decisions/dec-049-persistence-ownership/FORMAL_REVIEW.md) (`DEC-049`), con DEC049-C01 a C08 vigentes para materialización.
5. **Cerrado el 2026-07-24:** el Responsable del Proyecto aceptó la [estrategia de errores (`DEC-044`)](../../decisions/dec-044-error-strategy/FORMAL_REVIEW.md), con DEC044-C01 a C08 vigentes y pendientes.
6. **Cerrado el 2026-07-24:** el Responsable del Proyecto aceptó la
   [estrategia de pruebas, CI y gates ejecutables
   (`DEC-051`)](../../decisions/dec-051-testing-ci-strategy/FORMAL_REVIEW.md),
   con DEC051-C01 a C10 vigentes y pendientes.
7. **Cerrado el 2026-07-24:** el Responsable del Proyecto aceptó la
   [Definition of Done
   (`DEC-063`)](../../decisions/dec-063-definition-of-done/FORMAL_REVIEW.md),
   con DEC063-C01 a C08 vigentes y `Pending`. Los criterios de aceptación de
   R0 (`DEC-062`) quedaron cerrados por Producto el 2026-07-21.

Este grupo desbloquea el primer cambio funcional de R0 sólo cuando las
materializaciones estén verificadas y los demás H0 cierren. PBI-022 y DEC-005
ya satisfacen su gate. DEC-044, DEC-049, DEC-051 y DEC-063 también están
cerradas para H0. El único remanente H0 es VC-024 de DEC-004; su siguiente
acción exige autorización separada, materialización mínima de prerrequisitos y
dos corridas CI equivalentes, sin inferir cumplimiento de DEC051-C01 a C10 ni
DEC063-C01 a C08.

## Grupo A — Fundación de contexto

1. Aplicar la clasificación SaaS, tenant y sucursal aceptada por ADR-004 (`DEC-006` a `DEC-008`).
2. Aplicar el contexto efectivo aceptado por ADR-010: estación vinculada, sucursal derivada y usuario del mismo tenant (`DEC-009` a `DEC-011`).
3. Aplicar desvinculación/revinculación, ausencia segura, cambio de turno y atribución histórica de ADR-010 (`DEC-012`, parte de `DEC-015/016`).
4. Decidir zona horaria (`DEC-037`, `DEC-038`).
5. Preparar la precedencia conceptual de configuración que R1 usará (`DEC-032`).

La matriz de propiedad lógica, el motor PostgreSQL, el contexto operativo, la identidad/sesión y la autorización ordinaria/reforzada ya están respondidos por ADR-003/004/010/011/012/013. Arquitectura y Seguridad deben usarlos como precondición de cualquier implementación. Un experimento de RLS sólo procede con autorización y pregunta acotada; es obligatorio antes de adoptar RLS, no antes de cualquier persistencia de R0.

## Grupo B — Identidad y seguridad operativa

1. Aplicar y probar usuario de tenant, autenticación y estados aceptados por ADR-011 (`DEC-013`).
2. Definir mecanismos técnicos y probar sesión, PIN e inactividad (`DEC-014`, `DEC-015`).
3. Aplicar la atribución mínima y enlazarla con auditoría (`DEC-016`).
4. Aplicar y probar roles/capacidades de ADR-012 y componer la matriz mínima por rebanada (`DEC-017`, `DEC-018`).
5. Aplicar y probar acciones sensibles y reautenticación conforme a ADR-013 sin mezclarlas con autorización ordinaria (`DEC-019`, `DEC-020`).
6. Secretos y auditoría mínima (`DEC-046`, `DEC-055`).

Puede trabajarse en paralelo con la evidencia de aplicación del Grupo A. ADR-011 gobierna identidad/sesión, ADR-012 la autorización ordinaria y ADR-013 el refuerzo; los mecanismos técnicos deben respetar ADR-004/010/011/012/013 y conservar sus decisiones diferidas.

## Grupo C — Persistencia y consistencia base

1. Propiedad/repositorios (`DEC-049`).
2. Persistencia y migraciones (`DEC-050`).
3. Errores, logs, correlación y observabilidad (`DEC-044` a `DEC-048`).
4. Pruebas y datos semilla (`DEC-051`, `DEC-052`).
5. Verificar el aislamiento con esquema compartido aceptado; evaluar RLS sólo si se autoriza y continúa como candidato.

Los grupos A–C completan el diseño de R0 y convergen en su implementación/demostración.

## Grupo D — Recepción R1

1. Aprobar alcance R1 y término visible (`DEC-003`, `DEC-026`).
2. Cerrar folio e idempotencia (`DEC-021` a `DEC-025`).
3. Cerrar estados, ubicación y custodia (`DEC-027` a `DEC-030`).
4. Cerrar política efectiva y campos (`DEC-032` a `DEC-036`).
5. Cerrar archivos/evidencia (`DEC-039`, `DEC-040`).
6. Confirmar ticket, etiqueta y fallback (`DEC-041`, `DEC-042`).
7. Definir fallo lateral de impresión/archivos (`DEC-058`).

Folio, política y archivos pueden preparar alternativas en paralelo después de cerrar tenant/sucursal. La operación atómica final depende de persistencia e idempotencia de R0.

## Grupo E — Piloto

1. Completar R1–R5 y fin de custodia (`DEC-031`).
2. Backups/restauración (`DEC-053`, `DEC-054`).
3. Límites de archivos y rendimiento cualitativo (`DEC-057`, `DEC-065`).
4. Convivencia/corte con legado (`DEC-059`).
5. Estrategia, soporte y rollback (`DEC-060`, `DEC-061`).
6. Administración mínima de tenants (`DEC-068`).

## Grupo F — Producción

1. Retención y ciclo de vida de datos (`DEC-056`, `DEC-070`).
2. Seguridad, capacidad y recuperación completa (`DEC-064`, `DEC-066`).
3. Planes, suspensión y administración general (`DEC-067`, `DEC-069`).
4. Aceptar riesgos residuales y aprobar el release.

## Camino crítico

`DEC-002 cerrada → DEC-004 selección aceptada con VC-024 pendiente + DEC-005 materializada/formalmente verificada + DEC-044/049/051/063 aceptadas → materialización mínima y cierre de VC-024 → DEC-050 coordinada con DEC-051/063 → ADR-003/004/010/011/012/013 aplicados → R0 implementado y demostrado conforme a DEC-062 → aceptación formal de R0 → DEC-003 → DEC-021/025 → DEC-029/030 → DEC-032/035 → R1`.
