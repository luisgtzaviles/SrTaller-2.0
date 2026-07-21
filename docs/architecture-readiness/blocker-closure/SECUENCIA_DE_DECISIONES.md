# Secuencia recomendada de decisiones

## Principio

La secuencia reduce decisiones irreversibles: primero autoridad y contexto; después identidad y persistencia; luego recepción; por último operación real y producción. Un grupo puede preparar evidencia del siguiente, pero no saltar su gate.

## Grupo 0 — Autoridad y base ejecutable

1. Cerrar alcance exacto de R0 (`DEC-002`).
2. Revisar/aceptar el conjunto mínimo de ADR-001, ADR-003, ADR-005 y ADR-009 (`DEC-004`).
3. Definir agrupación inicial y enforcement de ADR-002 (`DEC-005`, `DEC-049`).
4. Cerrar errores, pruebas, aceptación y Definition of Done (`DEC-044`, `DEC-051`, `DEC-062`, `DEC-063`).

Este grupo desbloquea el primer commit, pero no basta para R0.

## Grupo A — Fundación de contexto

1. Aplicar la clasificación SaaS, tenant y sucursal aceptada por ADR-004 (`DEC-006` a `DEC-008`).
2. Cerrar el mecanismo confiable de contexto tenant sin reabrir la topología (`DEC-009`).
3. Decidir estación, sucursal activa, asignación multisucursal y cambio de contexto (`DEC-010` a `DEC-012`).
4. Decidir zona horaria (`DEC-037`, `DEC-038`).
5. Preparar la precedencia conceptual de configuración que R1 usará (`DEC-032`).

La matriz de propiedad lógica ya está respondida. Arquitectura y Seguridad deben usarla como precondición del ADR de contexto operativo. No debe ejecutarse un experimento de RLS antes de aceptar PostgreSQL, autorizarlo y acotar su pregunta.

## Grupo B — Identidad y seguridad operativa

1. Identidad y membresía (`DEC-013`).
2. Sesión, PIN e inactividad (`DEC-014`, `DEC-015`).
3. Atribución (`DEC-016`).
4. Roles, permisos y acciones sensibles (`DEC-017` a `DEC-019`).
5. Reautenticación (`DEC-020`).
6. Secretos y auditoría mínima (`DEC-046`, `DEC-055`).

Puede trabajarse en paralelo con Grupo A después de fijar los conceptos tenant/sucursal, pero el ADR de identidad no se acepta sin la matriz de producto.

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

`DEC-002 → DEC-004/005 → DEC-007/008 → DEC-006/009 → DEC-010/012 → DEC-013/018 → DEC-049/050/051 → R0 demostrado → DEC-003 → DEC-021/025 → DEC-029/030 → DEC-032/035 → R1`.
