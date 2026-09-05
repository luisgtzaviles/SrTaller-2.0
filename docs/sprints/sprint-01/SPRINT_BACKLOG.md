# SPRINT-01 — Backlog

## Estado del documento

- **Estado:** Active — cierre documental de PBI-027 candidato a integración.
- **PBI actual:** ninguno. PBI-029 está seleccionado únicamente como
  candidato y no está autorizado.
- **WIP:** uno.
- **Siguiente candidato:** PBI-029, seleccionado solamente; no iniciado.

## Gate externo de activación

| PBI de cierre previo | Estado | Relación con Sprint 01 | Condición de salida |
|---|---|---|---|
| [PBI-030](../../backlog/pbis/PBI-030.md) | Done | Predecesor cerrado; no pertenece al compromiso | Sin condición adicional de PBI-030 |

## Committed

| PBI | Estado | Entrada autorizada |
|---|---|---|
| [PBI-027](../../backlog/pbis/PBI-027.md) | Done candidate | Merge `4d54f84e`; CI main `33944664589` GREEN; Owner Acceptance APPROVED; cierre documental pendiente de merge. |

## Candidatos ordenados

| Orden | PBI | Estado | Condición de entrada |
|---:|---|---|---|
| 1 | [PBI-029](../../backlog/pbis/PBI-029.md) | Draft | PBI-027 Done; DoR y autorización |
| 3 | [PBI-024](../../backlog/pbis/PBI-024.md) | Draft | PBI-029 Done; recuperación selectiva refinada |
| 4 | [PBI-032](../../backlog/pbis/PBI-032.md) | Draft | PBI-024 Done; bootstrap de primer User resuelto |
| 5 | [PBI-033](../../backlog/pbis/PBI-033.md) | Draft | PBI-032 Done; catálogo inicial refinado |

## Bloqueos

| PBI | Bloqueo | Condición de salida |
|---|---|---|
| Cierre documental PBI-027 | PR documental, CI y autorización Owner de merge | No materializar `Done` ni iniciar PBI-029 antes de esos gates |

## Reglas de cambio

- Sólo un PBI puede pasar a ejecución/cierre.
- El cierre anterior selecciona el siguiente mediante PR documental.
- Selección no equivale a `In progress` ni autorización.
- Si el siguiente no cumple la condición de entrada, el Sprint falla cerrado.

## Próxima revisión

- **Fecha:** TBD.
- **Disparador:** Owner merge review del cierre documental de PBI-027 o cambio material de dependencias.
