# SPRINT-01 — Backlog

## Estado del documento

- **Estado:** Active — PBI-029 autorizado localmente; candidato no integrado.
- **PBI actual:** PBI-029 — Secrets and External Configuration Foundation.
- **WIP:** uno.
- **Siguiente candidato:** PBI-024, seleccionado solamente; no iniciado.

## Gate externo de activación

| PBI de cierre previo | Estado | Relación con Sprint 01 | Condición de salida |
|---|---|---|---|
| [PBI-030](../../backlog/pbis/PBI-030.md) | Done | Predecesor cerrado; no pertenece al compromiso | Sin condición adicional de PBI-030 |

## Committed

| PBI | Estado | Entrada autorizada |
|---|---|---|
| [PBI-027](../../backlog/pbis/PBI-027.md) | Done | Cierre canónico integrado por PR #20; `Released: NO`. |
| [PBI-029](../../backlog/pbis/PBI-029.md) | In review | Owner Start Authorization; riesgo `CRITICAL` aceptado; scope local-first; Owner Review en curso. |

## Candidatos ordenados

| Orden | PBI | Estado | Condición de entrada |
|---:|---|---|---|
| 1 | [PBI-024](../../backlog/pbis/PBI-024.md) | Draft | PBI-029 Done; recuperación selectiva refinada |
| 4 | [PBI-032](../../backlog/pbis/PBI-032.md) | Draft | PBI-024 Done; bootstrap de primer User resuelto |
| 5 | [PBI-033](../../backlog/pbis/PBI-033.md) | Draft | PBI-032 Done; catálogo inicial refinado |

## Bloqueos

| PBI | Bloqueo | Condición de salida |
|---|---|---|
| PBI-029 | CI autoritativo y Owner Review del candidato | No integrar, declarar `Done` ni iniciar PBI-024 antes de los gates aplicables |

## Reglas de cambio

- Sólo un PBI puede pasar a ejecución/cierre.
- El cierre anterior selecciona el siguiente mediante PR documental.
- Selección no equivale a `In progress` ni autorización.
- Si el siguiente no cumple la condición de entrada, el Sprint falla cerrado.

## Próxima revisión

- **Fecha:** TBD.
- **Disparador:** Owner Review de PBI-029 o cambio material de amenazas/dependencias.
