# SPRINT-02 — Backlog

## Estado del documento

- **Estado:** Active.
- **PBI actual:** `NONE`.
- **WIP:** 0/1.

| Orden | PBI | Estado | Dependencia secuencial y gates propios |
|---:|---|---|---|
| 1 | [PBI-025](../../backlog/pbis/PBI-025.md) | Done; Released: NO | Cierre PR #32 + CI exacto de main GREEN |
| 2 | [PBI-034](../../backlog/pbis/PBI-034.md) | Done; Released: NO | Cierre PR #34 + CI exacto de main GREEN |
| 3 | [PBI-026](../../backlog/pbis/PBI-026.md) | Done; Released: NO | Cierre PR #36 merge `0b39e3794a97c22d5471c0b6dfa278026f237b03` + CI exacto `34161029937` GREEN; G4 PASS |
| 4 | [PBI-028](../../backlog/pbis/PBI-028.md) | Done candidate — closure PR pending | Large / High; PR #37 merge `ab8e8ba9a1274030e27ad920d61c66ed461bf122`, CI `34193770228` GREEN; PR #38 focus remediation merge `a9bb0744ebf8b32b91a9ddf90f67570830182afc`, CI `34197268832` GREEN; Owner Acceptance recorded |

Operational Note real-actor es el checkpoint integrado, no un PBI paralelo.
No existe autorización de deploy ni de trabajo fuera del Identity Master Goal.
PBI-037 se conserva como slice de administración Owner-autorizado e integrado
dentro de este mismo candidato; no crea WIP adicional ni reabre foundations.
No existe PBI posterior seleccionado: el roadmap requiere una selección Owner
separada antes de DoR o implementación.

## Próxima revisión

- **Fecha:** al integrar o revisar el cierre documental de PBI-028.
- **Disparador:** CI del HEAD exacto del cierre o una contradicción material en
  WIP, orden, dependencia o trust boundary.
