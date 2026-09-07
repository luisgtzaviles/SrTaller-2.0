# SPRINT-01 — Riesgos y bloqueos

## Estado del documento

- **Estado:** Active — PBI-032 `Done candidate`; WIP 0/1 durante el cierre
  documental.
- **Última revisión:** 2026-09-07.

## Riesgos

| Riesgo | Impacto | Mitigación | Estado |
|---|---|---|---|
| Integrar la rama histórica PBI-024 completa | Conflictos y regresiones | Recuperación selectiva sobre `main` actual | Closed |
| Iniciar PIN sin secretos/contexto/User | Seguridad y retrabajo | Respetar secuencia y gates | Open |
| Confundir role label con autoridad | Escalamiento de privilegio | Capability enforcement deny-by-default | Open |
| Abrir varios PBIs simultáneos | Estado y evidencia divergentes | WIP=1 | Open |

## Bloqueos

| Elemento | Bloqueo | Condición de salida | Estado |
|---|---|---|---|
| PBI-032 | Merge autorizado del cierre documental y CI exacto post-cierre de `main` | No declarar `Done` efectivo ni iniciar PBI-033 antes de completar el cierre | Open |
| Migración timezone | Backfill histórico equivocado o cambio de instante | Fallback IANA documentado, validación y pruebas PostgreSQL; roll-forward en compartido | Mitigated |

## Próxima revisión

- **Fecha:** TBD.
- **Disparador:** Owner merge review del cierre documental de PBI-032 o un
  hallazgo de CI.
