# SPRINT-01 — Backlog

## Estado del documento

- **Estado:** Active — PBI-032 en cierre documental candidato.
- **PBI actual:** NONE.
- **WIP:** 0/1 durante el cierre documental.
- **Siguiente candidato:** PBI-033 — seleccionado, no iniciado.

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
| [PBI-032](../../backlog/pbis/PBI-032.md) | Done candidate | Focused review PASS; merge funcional `66aebdbb`; CI `main` `34072709330` GREEN; Owner Acceptance condicional satisfecha; `Released: NO`. |

## Candidatos ordenados

| Orden | PBI | Estado | Condición de entrada |
|---:|---|---|---|
| 1 | [PBI-033](../../backlog/pbis/PBI-033.md) | Draft / selected | PBI-032 Done; catálogo inicial refinado |

## Bloqueos

| PBI | Bloqueo | Condición de salida |
|---|---|---|
| PBI-032 | Merge autorizado del cierre documental y CI exacto post-cierre de `main` | No declarar `Done` efectivo ni iniciar PBI-033 antes de completar esos gates |

## Reglas de cambio

- Sólo un PBI puede pasar a ejecución/cierre.
- El cierre anterior selecciona el siguiente mediante PR documental.
- Selección no equivale a `In progress` ni autorización.
- Si el siguiente no cumple la condición de entrada, el Sprint falla cerrado.

## Próxima revisión

- **Fecha:** TBD.
- **Disparador:** Owner merge review del cierre documental de PBI-032.
