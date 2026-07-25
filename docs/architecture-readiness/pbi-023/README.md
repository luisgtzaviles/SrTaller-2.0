# PBI-023 — Expediente de planificación de persistencia

## Estado

- **Fecha:** 2026-07-24.
- **Commit base:** `83d21e343e7194e92a26c9e6cf40bb612a7415e1`.
- **Rama:** `r0/pbi-023-persistence-planning`.
- **Alcance:** decisión, investigación, diseño, riesgos y plan.
- **Cambio técnico:** ninguno.
- **Resultado:** `CONDITIONAL PASS — PBI-023 PLANNING COMPLETE /
  IMPLEMENTATION BLOCKED`.
- **Bloqueante único inmediato:** SPIKE-002 no tiene evidencia ejecutable en
  PostgreSQL real.

## Propósito

Este expediente lleva PBI-023 hasta el último punto reversible anterior a
instalar dependencias o crear persistencia. Distingue tres estados que no deben
confundirse:

1. DEC-050 está aceptada documentalmente con condiciones.
2. La investigación de SPIKE-002 está completa.
3. SPIKE-002 sigue abierto porque sus pruebas negativas no fueron ejecutadas.

La restricción de esta tarea prohibió instalar paquetes, iniciar PostgreSQL,
usar Docker/Testcontainers, escribir SQL y modificar `src/`. Por ello un cierre
ejecutable del spike habría sido una afirmación falsa.

## Índice

| Documento | Propósito |
|---|---|
| [ESTIMATION.md](ESTIMATION.md) | estimación, supuestos y compromiso controlado |
| [DEC_050_REVIEW.md](DEC_050_REVIEW.md) | resumen y trazabilidad de la decisión |
| [SPIKE_002_RESULTS.md](SPIKE_002_RESULTS.md) | investigación primaria y brecha de evidencia |
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

## Alcance preservado

- Sólo PBI-023 está en preparación.
- No se inicia PBI-024 a PBI-029.
- No se modelan usuarios, PIN, sesiones, roles, estaciones, reparaciones ni UI.
- No se adopta RLS.
- No se decide proveedor productivo, backup/restore ni release.
- La sucursal mínima sólo demuestra pertenencia tenant; no implementa el
  contexto operativo de ADR-010.

## Gate siguiente

Autorizar y ejecutar SPIKE-002 como prototipo desechable, con las versiones
candidatas exactas y PostgreSQL `18.4`, fuera de `src/` productivo. Sólo un
dictamen ejecutable favorable permite volver a evaluar el inicio de la
materialización reversible de PBI-023.
