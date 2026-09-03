# SPRINT-01 — Riesgos y bloqueos

## Estado del documento

- **Estado:** Planned.
- **Última revisión:** 2026-09-03.

## Riesgos

| Riesgo | Impacto | Mitigación | Estado |
|---|---|---|---|
| Integrar la rama histórica PBI-024 completa | Conflictos y regresiones | Recuperación selectiva sobre `main` actual | Open |
| Iniciar PIN sin secretos/contexto/User | Seguridad y retrabajo | Respetar secuencia y gates | Open |
| Confundir role label con autoridad | Escalamiento de privilegio | Capability enforcement deny-by-default | Open |
| Abrir varios PBIs simultáneos | Estado y evidencia divergentes | WIP=1 | Open |

## Bloqueos

| Elemento | Bloqueo | Condición de salida | Estado |
|---|---|---|---|
| Activación Sprint 01 | PBI-030 en In review | DoD, disposición AT y Owner Acceptance | Open |
| PBI-027 Ready | Estimación/DoR pendientes | Acuerdo de equipo y revisión formal | Open |

## Próxima revisión

- **Fecha:** TBD.
- **Disparador:** cierre de PBI-030 o refinamiento de PBI-027.
