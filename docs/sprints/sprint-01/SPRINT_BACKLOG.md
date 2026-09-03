# SPRINT-01 — Backlog

## Estado del documento

- **Estado:** Planned.
- **PBI actual:** ninguno.
- **WIP:** uno.
- **Siguiente seleccionado:** PBI-027, condicionado; no iniciado.

## Gate externo de activación

| PBI actual de cierre | Estado | Relación con Sprint 01 | Condición de salida |
|---|---|---|---|
| [PBI-030](../../backlog/pbis/PBI-030.md) | In review | No pertenece al compromiso; bloquea la activación | Owner Acceptance y disposición AT; cierre mediante PR documental |

## Committed

Ningún PBI está `Committed`: PBI-027 todavía requiere estimación acordada,
revisión DoR y autorización Owner de implementación.

## Candidatos ordenados

| Orden | PBI | Estado | Condición de entrada |
|---:|---|---|---|
| 1 | [PBI-027](../../backlog/pbis/PBI-027.md) | Ready for review | PBI-030 Done; estimación y DoR PASS |
| 2 | [PBI-029](../../backlog/pbis/PBI-029.md) | Draft | PBI-027 Done; DoR y autorización |
| 3 | [PBI-024](../../backlog/pbis/PBI-024.md) | Draft | PBI-029 Done; recuperación selectiva refinada |
| 4 | [PBI-032](../../backlog/pbis/PBI-032.md) | Draft | PBI-024 Done; bootstrap de primer User resuelto |
| 5 | [PBI-033](../../backlog/pbis/PBI-033.md) | Draft | PBI-032 Done; catálogo inicial refinado |

## Bloqueos

| PBI | Bloqueo | Condición de salida |
|---|---|---|
| PBI-027 | PBI-030 no está Done; falta estimación/DoR | Cierre formal PBI-030 y DoR PBI-027 |

## Reglas de cambio

- Sólo un PBI puede pasar a ejecución/cierre.
- El cierre anterior selecciona el siguiente mediante PR documental.
- Selección no equivale a `In progress` ni autorización.
- Si el siguiente no cumple la condición de entrada, el Sprint falla cerrado.

## Próxima revisión

- **Fecha:** TBD.
- **Disparador:** cierre de PBI-030 o cambio material de dependencias.
