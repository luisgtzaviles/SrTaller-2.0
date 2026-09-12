# SPRINT-02 — Backlog

## Estado del documento

- **Estado:** Active; remediación Access en implementación.
- **PBI actual:** [PBI-043](../../backlog/pbis/PBI-043.md) — `In progress`.
- **WIP:** `1/1`.

| Orden | PBI | Estado | Dependencia secuencial y gates propios |
|---:|---|---|---|
| 1 | [PBI-025](../../backlog/pbis/PBI-025.md) | Done; Released: NO | Cierre PR #32 + CI exacta de `main` GREEN |
| 2 | [PBI-034](../../backlog/pbis/PBI-034.md) | Done; Released: NO | Cierre PR #34 + CI exacta; exclusividad histórica sustituida parcialmente por ADR-014 |
| 3 | [PBI-026](../../backlog/pbis/PBI-026.md) | Done; Released: NO | Cierre PR #36 + CI `34161029937`; G4 PASS |
| 4 | [PBI-028](../../backlog/pbis/PBI-028.md) | Done; Released: NO | Cierre PR #39 + CI `34249869167`; G5 PASS |
| 5 | [PBI-038](../../backlog/pbis/PBI-038.md) | Done; Released: NO | Cierre PR #40 + CI `34280510716` GREEN |
| 6 | [PBI-039](../../backlog/pbis/PBI-039.md) | Done; Released: NO | Cierre PR #45 en `40684d7`; CI exacta `34623060504` PASS |
| 7 | [PBI-043](../../backlog/pbis/PBI-043.md) | In progress; WIP 1/1 | ADR-014 + DoR + threat model + COS-01…24; implementación autorizada |

PBI-043 es una remediación Access independiente. No implementa administración
de sesiones, auditoría global de lifecycle ni cambios a PIN/cookies/timeouts.
PBI-040 se preserva como WIP congelado no integrado de Price List; los IDs
PBI-041/PBI-042 permanecen reservados como Planned/Deferred. Ninguno forma
parte de esta extensión.

## Próxima revisión

- **Fecha:** al autorizar o rechazar el inicio de PBI-043.
- **Disparador:** decisión Owner explícita o contradicción material de
  readiness.
