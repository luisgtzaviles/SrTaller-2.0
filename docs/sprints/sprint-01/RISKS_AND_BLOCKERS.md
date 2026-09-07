# SPRINT-01 — Riesgos y bloqueos

## Estado del documento

- **Estado:** Closed; PBI-033 `Done`; WIP 0/1.
- **Última revisión:** 2026-09-06.

## Riesgos

| Riesgo | Impacto | Mitigación | Estado |
|---|---|---|---|
| Integrar la rama histórica PBI-024 completa | Conflictos y regresiones | Recuperación selectiva sobre `main` actual | Closed |
| Iniciar PIN sin secretos/contexto/User | Seguridad y retrabajo | Respetar secuencia y gates | Open |
| Confundir role label con autoridad | Escalamiento de privilegio | Capability codes son la única concesión; labels son metadata; pruebas negativas PBI-033 | Mitigated |
| Assignment cross-tenant o fuera de Branch | Fuga de autoridad | Scopes explícitos, FKs compuestas, queries tenant-scoped y PostgreSQL negativo | Mitigated |
| Exponer administración antes de autorización reforzada | Bypass de controles pendientes | PBI-033 conserva assign/revoke server-only y ninguna superficie HTTP/UI productiva | Mitigated |
| Tratar una proyección de grants como veredicto final | Bypass de User/Station/Branch/session | PBI-026 debe intersectar todos los predicados antes del efecto protegido | Known residual LOW |
| Abrir varios PBIs simultáneos | Estado y evidencia divergentes | WIP=1 | Open |

## Bloqueos

| Elemento | Bloqueo | Condición de salida | Estado |
|---|---|---|---|
| PBI-032 | Cierre documental autorizado, mergeado y verificado | PR #27 merge `db6637ee`; CI post-cierre `34074457695` GREEN | Closed |
| PBI-033 | Cierre documental y CI exacto | PR #29 merge y CI `34084930812` GREEN | Closed |
| PBI-025 | Fuera del alcance de Sprint 01 | SPRINT-02 y DoR propios | Transferred |
| Migración timezone | Backfill histórico equivocado o cambio de instante | Fallback IANA documentado, validación y pruebas PostgreSQL; roll-forward en compartido | Mitigated |

## Próxima revisión

- **Fecha:** no aplica; Sprint cerrado.
- **Disparador:** sólo una inconsistencia material en la evidencia de cierre.
  PBI-025 se gobierna desde SPRINT-02.
