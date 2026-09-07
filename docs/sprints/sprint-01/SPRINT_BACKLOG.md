# SPRINT-01 — Backlog

## Estado del documento

- **Estado:** Closed; PBI-033 `Done`.
- **PBI actual:** NONE.
- **WIP:** 0/1 al cierre.
- **Handoff:** SPRINT-02 activo; PBI-025/PBI-034 Done; PBI-026 es Current PBI,
  WIP 1/1 y PBI-028 permanece sin iniciar.

## Gate externo de activación

| PBI de cierre previo | Estado | Relación con Sprint 01 | Condición de salida |
|---|---|---|---|
| [PBI-030](../../backlog/pbis/PBI-030.md) | Done | Predecesor cerrado; no pertenece al compromiso | Sin condición adicional de PBI-030 |

## Committed

| PBI | Estado | Entrada autorizada |
|---|---|---|
| [PBI-027](../../backlog/pbis/PBI-027.md) | Done | Cierre canónico integrado por PR #20; `Released: NO`. |
| [PBI-029](../../backlog/pbis/PBI-029.md) | Done | Merge funcional `36d93736`; CI main funcional `33974100385` GREEN; riesgo `CRITICAL` aceptado y Owner Acceptance APPROVED; cierre documental merge `41914c787` y CI post-cierre `33988752597` GREEN; `Released: NO`. |
| [PBI-024](../../backlog/pbis/PBI-024.md) | Done | Cierre canónico integrado; `Released: NO`. |
| [PBI-032](../../backlog/pbis/PBI-032.md) | Done | Cierre PR #27 merge `db6637ee`; CI post-cierre `34074457695` GREEN; `Released: NO`. |
| [PBI-033](../../backlog/pbis/PBI-033.md) | Done | Cierre PR #29 merge `d1a98c6d158cf53e1718a75c82f8eafbc3aafaf1`; CI `34084930812` GREEN; `Released: NO`. |

## Handoff posterior

| Orden | PBI | Estado | Condición de entrada |
|---:|---|---|---|
| 1 | [PBI-025](../../backlog/pbis/PBI-025.md) | Done en SPRINT-02 | Cierre PR #32 y CI exacto de main GREEN |

## Bloqueos

| PBI | Bloqueo | Condición de salida |
|---|---|---|
| PBI-033 | Ninguno | Closed |
| PBI-025 | Fuera del alcance de Sprint 01 | Gestionado por SPRINT-02 |

## Reglas de cambio

- Sólo un PBI puede pasar a ejecución/cierre.
- El cierre anterior selecciona el siguiente mediante PR documental.
- Selección no equivale a `In progress` ni autorización.
- Si el siguiente no cumple la condición de entrada, el Sprint falla cerrado.

## Próxima revisión

- **Fecha:** no aplica; Sprint cerrado.
- **Disparador:** sólo una inconsistencia material en la evidencia de cierre.
  El trabajo de PBI-025 pertenece a SPRINT-02.
