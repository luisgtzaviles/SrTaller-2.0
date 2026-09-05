# SPRINT-01 — Riesgos y bloqueos

## Estado del documento

- **Estado:** Active — PBI-027 es el único trabajo en ejecución.
- **Última revisión:** 2026-09-04.

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
| PBI-027 cierre | Owner Review, merge autorizado y CI GREEN de `main` | No pasar a Done ni iniciar PBI-029 antes de esos gates | Open |
| Migración timezone | Backfill histórico equivocado o cambio de instante | Fallback IANA documentado, validación y pruebas PostgreSQL; roll-forward en compartido | Mitigated |

## Próxima revisión

- **Fecha:** TBD.
- **Disparador:** Owner Review de PBI-027 o un hallazgo de CI.
