# SPRINT-01 — Backlog

## Estado del documento

- **Estado:** Active — PBI-033 `In progress`.
- **PBI actual:** PBI-033 — Roles, Assignments and Capability Catalog.
- **WIP:** 1/1.
- **Siguiente candidato:** NONE durante la ejecución; PBI-025 permanece
  ordenado, no seleccionado.

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
| [PBI-033](../../backlog/pbis/PBI-033.md) | In progress | DoR PASS; riesgo High y Size Large autorizados por Master Goal; único PBI actual. |

## Secuencia posterior, no seleccionada

| Orden | PBI | Estado | Condición de entrada |
|---:|---|---|---|
| 1 | [PBI-025](../../backlog/pbis/PBI-025.md) | Ordered / not selected | PBI-033 Done; DoR y gates propios antes de iniciar |

## Bloqueos

| PBI | Bloqueo | Condición de salida |
|---|---|---|
| PBI-033 | Sin bloqueo Owner vigente; candidate material y CI `34080940466` del implementation checkpoint PASS en Draft PR #28; exact-final-HEAD CI/focused review pendientes tras reconciliar trazabilidad | Mantener `In progress` y WIP `1/1` hasta completar sus gates |

## Reglas de cambio

- Sólo un PBI puede pasar a ejecución/cierre.
- El cierre anterior selecciona el siguiente mediante PR documental.
- Selección no equivale a `In progress` ni autorización.
- Si el siguiente no cumple la condición de entrada, el Sprint falla cerrado.

## Próxima revisión

- **Fecha:** TBD.
- **Disparador:** focused high-risk review de PBI-033 bajo el Master Goal.
