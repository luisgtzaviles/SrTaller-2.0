# SPRINT-01 — Riesgos y bloqueos

## Estado del documento

- **Estado:** Active — PBI-033 `In progress`; WIP 1/1.
- **Última revisión:** 2026-09-06.

## Riesgos

| Riesgo | Impacto | Mitigación | Estado |
|---|---|---|---|
| Integrar la rama histórica PBI-024 completa | Conflictos y regresiones | Recuperación selectiva sobre `main` actual | Closed |
| Iniciar PIN sin secretos/contexto/User | Seguridad y retrabajo | Respetar secuencia y gates | Open |
| Confundir role label con autoridad | Escalamiento de privilegio | Capability codes son la única concesión; labels son metadata; pruebas negativas PBI-033 | Mitigating |
| Assignment cross-tenant o fuera de Branch | Fuga de autoridad | Scopes explícitos, FKs compuestas, queries tenant-scoped y PostgreSQL negativo | Mitigating |
| Exponer administración antes de autorización reforzada | Bypass de controles pendientes | PBI-033 conserva assign/revoke server-only y ninguna superficie HTTP/UI productiva | Mitigated |
| Abrir varios PBIs simultáneos | Estado y evidencia divergentes | WIP=1 | Open |

## Bloqueos

| Elemento | Bloqueo | Condición de salida | Estado |
|---|---|---|---|
| PBI-032 | Cierre documental autorizado, mergeado y verificado | PR #27 merge `db6637ee`; CI post-cierre `34074457695` GREEN | Closed |
| PBI-033 | No existe bloqueo Owner vigente; validación material y CI `34080940466` del implementation checkpoint PASS; falta revalidar el HEAD final tras reconciliar trazabilidad y concluir focused review | Mantener WIP `1/1`; no integrar ni avanzar sin gates GREEN | Open |
| Migración timezone | Backfill histórico equivocado o cambio de instante | Fallback IANA documentado, validación y pruebas PostgreSQL; roll-forward en compartido | Mitigated |

## Próxima revisión

- **Fecha:** TBD.
- **Disparador:** focused high-risk review de PBI-033 bajo el Master Goal o un
  hallazgo de validación/CI.
