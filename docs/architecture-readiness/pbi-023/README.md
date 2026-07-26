# PBI-023 — Expediente de planificación de persistencia

## Estado

- **Fecha:** 2026-07-24.
- **Commit base del spike:** `2275416c92b5cb06d8182df50c3d121384ccc4db`.
- **Rama:** `r0/pbi-023-persistence-planning`.
- **Alcance:** decisión, investigación, ejecución material desechable,
  evidencia, diseño, riesgos y plan.
- **Cambio técnico:** checker/tests, dependencias/configuración, facility de
  conexión, runners y primera migración productiva controlados; cero wiring
  productivo.
- **Resultado:** `PASS — PBI-023 FORMALLY CLOSED`.
- **Estado PBI-023:** `Closed — PostgreSQL CI authoritative materialized and formally reviewed`.

## Propósito

Este expediente lleva PBI-023 hasta persistencia owner-scoped verificada en
PostgreSQL autoritativo sin API ni negocio. Distingue once estados
que no deben confundirse:

1. DEC-050 está aceptada documentalmente con condiciones.
2. SPIKE-002 está materialmente cerrado con dos runs PostgreSQL reales.
3. El Paso 3 está completo con checker fail-closed.
4. El Paso 4 instaló exclusivamente los paquetes exactos y PBI-023 sigue
   `Ready`, no `In progress`, `Implemented` ni `Done`.
5. Los Pasos 5 y 6 materializaron configuración y conexión sin consumidores
   productivos, startup automático, tablas ni migraciones.
6. El Paso 7 materializó el runner, capability owner-internal, D5-R048 y
   pruebas PostgreSQL reales sin migrations ni tablas productivas.
7. El Paso 8 materializó migrador/provider gobernados, D5-R049 y pruebas
   PostgreSQL reales.
8. El Paso 9 materializó `tenants`/`branches`, D5-R050–D5-R053 y pruebas
   PostgreSQL reales.
9. El Paso 10 materializó ports/adapters owner-scoped, errores, transacciones
   y aislamiento negativo.
10. El Paso 11 ejecutó las cinco suites en PostgreSQL `18.4` real dentro de
    ambos runs VC-024, con comparación y artifacts válidos.
11. El Paso 12 verificó las remediaciones documentales, repitió los gates y
    cerró formalmente PBI-023 sin autorizar merge, PBI-024 ni R0.

El laboratorio fue destruido. El Paso 4 modificó sólo `package.json`,
`pnpm-lock.yaml` y documentación; preservó `src/`, workflows, scripts, tests,
tsconfig, policy/checker, Dockerfiles y migraciones productivas.

## Índice

| Documento | Propósito |
|---|---|
| [ESTIMATION.md](ESTIMATION.md) | estimación, supuestos y compromiso controlado |
| [DEC_050_REVIEW.md](DEC_050_REVIEW.md) | resumen y trazabilidad de la decisión |
| [SPIKE_002_RESULTS.md](SPIKE_002_RESULTS.md) | investigación primaria y brecha de evidencia |
| [spike-002-evidence/](spike-002-evidence/README.md) | evidencia material E1–E12, doble run, hashes y cleanup |
| [TECHNICAL_DESIGN.md](TECHNICAL_DESIGN.md) | dependencias, arquitectura, paths, configuración y modelo mínimo |
| [TENANT_ISOLATION_TEST_PLAN.md](TENANT_ISOLATION_TEST_PLAN.md) | garantías y matriz negativa |
| [MIGRATION_STRATEGY.md](MIGRATION_STRATEGY.md) | guía ejecutable derivada de DEC-050 |
| [PERSISTENCE_OWNERSHIP_REGISTRY.md](PERSISTENCE_OWNERSHIP_REGISTRY.md) | owners y scopes propuestos de objetos mínimos |
| [RISK_ASSESSMENT.md](RISK_ASSESSMENT.md) | expediente DEC-049 y clasificación fail-closed |
| [DEC_051_APPLICABILITY.md](DEC_051_APPLICABILITY.md) | triggers, evidencia y gates de calidad |
| [DEC_063_APPLICABILITY.md](DEC_063_APPLICABILITY.md) | aplicabilidad de Definition of Done |
| [DEFINITION_OF_READY_MATRIX.md](DEFINITION_OF_READY_MATRIX.md) | estado de preparación y bloqueo |
| [IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md) | secuencia pequeña, rollback y salidas |
| [TRACEABILITY_MATRIX.md](TRACEABILITY_MATRIX.md) | requisito → decisión → evidencia |
| [EXPECTED_EVIDENCE.md](EXPECTED_EVIDENCE.md) | manifest y artefactos futuros |
| [RESULTS.md](RESULTS.md) | dictamen consolidado |
| [checker-extension/](checker-extension/README.md) | baseline D5-R037–D5-R047, fixtures, mutaciones, ownership y evidencia del Paso 3 |
| [dependency-installation/](dependency-installation/README.md) | metadata, supply chain, doble frozen install, compatibilidad y evidencia del Paso 4 |
| [typed-configuration/](typed-configuration/README.md) | parser fail-closed, roles, timeouts y redacción del Paso 5 |
| [connection-facility/](connection-facility/README.md) | lifecycle, errores, PostgreSQL 18.4, concurrencia, cleanup y dictamen del Paso 6 |
| [transaction-runner/](transaction-runner/README.md) | contrato, aislamiento, nesting, errores, PostgreSQL 18.4, D5-R048 y dictamen del Paso 7 |
| [migration-runner/](migration-runner/README.md) | discovery, manifest/drift, journal, lock, down, PostgreSQL 18.4, D5-R049 y dictamen del Paso 8 |
| [first-productive-migration/](first-productive-migration/README.md) | schema exacto, constraints, aislamiento, introspección, PostgreSQL 18.4 y dictamen del Paso 9 |
| [owner-scoped-adapters/](owner-scoped-adapters/README.md) | ports/adapters owner-scoped, errores, transacciones, aislamiento negativo y dictamen del Paso 10 |
| [postgresql-ci/](postgresql-ci/README.md) | PostgreSQL 18.4 autoritativo, doble run, comparación, artifacts y dictamen del Paso 11 |

## Alcance preservado

- Sólo PBI-023 está en preparación.
- No se inicia PBI-024 a PBI-029.
- No se modelan usuarios, PIN, sesiones, roles, estaciones, reparaciones ni UI.
- No se adopta RLS.
- No se decide proveedor productivo, backup/restore ni release.
- La sucursal mínima sólo demuestra pertenencia tenant; no implementa el
  contexto operativo de ADR-010.

## Siguiente acción

Paso 13 — revisar los cambios documentales finales, crear el commit formal de
cierre de PBI-023 y después tomar una decisión separada sobre promover el PR
#2 de Draft a Ready.

DEC051-C02 continúa pendiente del merge real, DEC-055 permanece `Propuesta`,
DEC-063 no fue ratificada, R0 sigue no autorizado y PR #2 permanece `Draft`.
