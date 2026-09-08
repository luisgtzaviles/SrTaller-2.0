# SPRINT-02 — Backlog

## Estado del documento

- **Estado:** Active.
- **PBI actual:** PBI-028 — Minimum Business Audit and Correlation.
- **WIP:** 1/1.

| Orden | PBI | Estado | Dependencia secuencial y gates propios |
|---:|---|---|---|
| 1 | [PBI-025](../../backlog/pbis/PBI-025.md) | Done; Released: NO | Cierre PR #32 + CI exacto de main GREEN |
| 2 | [PBI-034](../../backlog/pbis/PBI-034.md) | Done; Released: NO | Cierre PR #34 + CI exacto de main GREEN |
| 3 | [PBI-026](../../backlog/pbis/PBI-026.md) | Done; Released: NO | Cierre PR #36 merge `0b39e3794a97c22d5471c0b6dfa278026f237b03` + CI exacto `34161029937` GREEN; G4 PASS |
| 4 | [PBI-028](../../backlog/pbis/PBI-028.md) | In progress — hardened Draft PR #37 | Large / High; DoR, browser, full verify/PostgreSQL/OCI y CI inicial `34190625347` GREEN; final exact-HEAD CI/review y Owner merge pendientes; único WIP |

Operational Note real-actor es el checkpoint integrado, no un PBI paralelo.
No existe autorización de deploy ni de trabajo fuera del Identity Master Goal.
PBI-037 se conserva como slice de administración Owner-autorizado y trazable
dentro de este mismo candidato; no crea WIP adicional ni reabre foundations.

## Próxima revisión

- **Fecha:** al completar el candidato PBI-028.
- **Disparador:** completar focused High-risk review, CI del HEAD final exacto
  o una contradicción material en WIP, orden,
  dependencia o trust boundary.
