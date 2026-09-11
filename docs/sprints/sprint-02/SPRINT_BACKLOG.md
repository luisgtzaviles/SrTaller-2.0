# SPRINT-02 — Backlog

## Estado del documento

- **Estado:** Active.
- **PBI actual:** `PBI-039`.
- **WIP:** 1/1.

| Orden | PBI | Estado | Dependencia secuencial y gates propios |
|---:|---|---|---|
| 1 | [PBI-025](../../backlog/pbis/PBI-025.md) | Done; Released: NO | Cierre PR #32 + CI exacto de main GREEN |
| 2 | [PBI-034](../../backlog/pbis/PBI-034.md) | Done; Released: NO | Cierre PR #34 + CI exacto de main GREEN |
| 3 | [PBI-026](../../backlog/pbis/PBI-026.md) | Done; Released: NO | Cierre PR #36 merge `0b39e3794a97c22d5471c0b6dfa278026f237b03` + CI exacto `34161029937` GREEN; G4 PASS |
| 4 | [PBI-028](../../backlog/pbis/PBI-028.md) | Done; Released: NO | PR #39 merge `2b712fc3a3842f197324e8870011bf170846ddb8`, CI `34249869167` GREEN; G5 PASS |
| 5 | [PBI-038](../../backlog/pbis/PBI-038.md) | Done; Released: NO | PR #40 merge `5973f355a5e9dfc7ae562a688ded04e7eba8bc34`; exact-main CI `34280510716` GREEN |
| 6 | [PBI-039](../../backlog/pbis/PBI-039.md) | In progress — PR #42 ready for independent re-review | G6/G7; review remediation, high-risk Full Verification y exact-head CI `34567516069` attempt 3 PASS; merge/deploy pendientes |

Operational Note real-actor es el checkpoint integrado, no un PBI paralelo.
No existe autorización de deploy ni de trabajo fuera del Identity Master Goal.
PBI-037 se conserva como slice de administración Owner-autorizado e integrado
del checkpoint integrado; no crea WIP adicional ni reabre foundations.
No existe PBI posterior seleccionado. PBI-039 ocupa el único WIP; su gate
vigente es la re-review independiente del candidato remediado y verificado. No
se inicia trabajo posterior por inferencia.

## Próxima revisión

- **Fecha:** al seleccionarse un nuevo PBI.
- **Disparador:** una autorización Owner o una contradicción material en WIP,
  orden, dependencia o trust boundary.
