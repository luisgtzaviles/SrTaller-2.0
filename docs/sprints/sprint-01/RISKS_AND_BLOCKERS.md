# SPRINT-01 — Riesgos y bloqueos

## Estado del documento

- **Estado:** Active — cierre documental de PBI-029 en revisión; sin PBI de
  implementación activo.
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
| Cierre documental PBI-029 | PR documental, CI y autorización Owner de merge | No materializar Done ni iniciar PBI-024 antes de esos gates | Open |
| Migración timezone | Backfill histórico equivocado o cambio de instante | Fallback IANA documentado, validación y pruebas PostgreSQL; roll-forward en compartido | Mitigated |

## Próxima revisión

- **Fecha:** TBD.
- **Disparador:** Owner merge review del cierre documental PBI-029 o un hallazgo de CI.
