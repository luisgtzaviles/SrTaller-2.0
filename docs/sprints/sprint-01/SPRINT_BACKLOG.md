# SPRINT-01 — Backlog

## Estado del documento

- **Estado:** Active — PBI-032 en review candidate.
- **PBI actual:** PBI-032 — User Directory and Lifecycle.
- **WIP:** 1/1.
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
| [PBI-032](../../backlog/pbis/PBI-032.md) | In review candidate | DoR PASS, High Risk/Size Large y Owner Start Authorization aprobados; espera review, merge y CI exacto de main. |

## Candidatos ordenados

| Orden | PBI | Estado | Condición de entrada |
|---:|---|---|---|
| 1 | [PBI-033](../../backlog/pbis/PBI-033.md) | Draft / selected | PBI-032 Done; catálogo inicial refinado |

## Bloqueos

| PBI | Bloqueo | Condición de salida |
|---|---|---|
| PBI-032 | Focused review, merge funcional autorizado, CI exacto de `main`, Owner Acceptance y cierre documental autorizado con CI exacto post-cierre | No declarar `Done` ni iniciar PBI-033 antes de completar esos gates |

## Reglas de cambio

- Sólo un PBI puede pasar a ejecución/cierre.
- El cierre anterior selecciona el siguiente mediante PR documental.
- Selección no equivale a `In progress` ni autorización.
- Si el siguiente no cumple la condición de entrada, el Sprint falla cerrado.

## Próxima revisión

- **Fecha:** TBD.
- **Disparador:** Focused Owner Review de PBI-032.
