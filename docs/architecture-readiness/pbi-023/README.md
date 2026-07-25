# PBI-023 — Expediente de planificación de persistencia

## Estado

- **Fecha:** 2026-07-24.
- **Commit base del spike:** `2275416c92b5cb06d8182df50c3d121384ccc4db`.
- **Rama:** `r0/pbi-023-persistence-planning`.
- **Alcance:** decisión, investigación, ejecución material desechable,
  evidencia, diseño, riesgos y plan.
- **Cambio técnico:** ninguno.
- **Resultado:** `PASS — SPIKE-002 MATERIAL VERIFICATION COMPLETE`.
- **Estado PBI-023:** `Ready — SPIKE-002 materially verified /
  implementation gates ready`.

## Propósito

Este expediente lleva PBI-023 hasta el último punto reversible anterior a
instalar dependencias productivas o crear persistencia. Distingue tres estados
que no deben confundirse:

1. DEC-050 está aceptada documentalmente con condiciones.
2. SPIKE-002 está materialmente cerrado con dos runs PostgreSQL reales.
3. PBI-023 está `Ready`, no `In progress`, `Implemented` ni `Done`.

El laboratorio se ejecutó fuera de las superficies productivas y fue
destruido. No modificó `src/`, manifests, lockfile, workflows, scripts, tests,
tsconfig ni Dockerfiles del repositorio.

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

## Alcance preservado

- Sólo PBI-023 está en preparación.
- No se inicia PBI-024 a PBI-029.
- No se modelan usuarios, PIN, sesiones, roles, estaciones, reparaciones ni UI.
- No se adopta RLS.
- No se decide proveedor productivo, backup/restore ni release.
- La sucursal mínima sólo demuestra pertenencia tenant; no implementa el
  contexto operativo de ADR-010.

## Gate siguiente

Materializar el Paso 3: extender primero los boundaries y el checker con
casos válidos, negativos y mutaciones antes de modificar `src/`. Después
siguen, en orden, instalación controlada, configuración tipada e
infraestructura de conexión. Cada paso requiere autorización propia y sus
condiciones DEC-049/050/051/063 aplicables.
