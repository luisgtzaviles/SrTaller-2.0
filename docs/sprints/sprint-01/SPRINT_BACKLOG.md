# SPRINT-01 — Backlog

## Estado del documento

- **Estado:** Planned — ready for activation after roadmap reconciliation.
- **PBI actual:** ninguno.
- **WIP:** uno.
- **Siguiente candidato:** PBI-027, pendiente de DoR/estimación; no iniciado.

## Gate externo de activación

| PBI de cierre previo | Estado | Relación con Sprint 01 | Condición de salida |
|---|---|---|---|
| [PBI-030](../../backlog/pbis/PBI-030.md) | Closure approved; integration pending | No pertenece al compromiso; bloquea la activación | Integrar reconciliación en `main` y obtener CI verde |

## Committed

Ningún PBI está `Committed`: PBI-027 todavía requiere estimación acordada,
revisión DoR y autorización Owner de implementación.

## Candidatos ordenados

| Orden | PBI | Estado | Condición de entrada |
|---:|---|---|---|
| 1 | [PBI-027](../../backlog/pbis/PBI-027.md) | Ready candidate | Reconciliación integrada; estimación y DoR PASS |
| 2 | [PBI-029](../../backlog/pbis/PBI-029.md) | Draft | PBI-027 Done; DoR y autorización |
| 3 | [PBI-024](../../backlog/pbis/PBI-024.md) | Draft | PBI-029 Done; recuperación selectiva refinada |
| 4 | [PBI-032](../../backlog/pbis/PBI-032.md) | Draft | PBI-024 Done; bootstrap de primer User resuelto |
| 5 | [PBI-033](../../backlog/pbis/PBI-033.md) | Draft | PBI-032 Done; catálogo inicial refinado |

## Bloqueos

| PBI | Bloqueo | Condición de salida |
|---|---|---|
| Activación | Reconciliación no integrada | Merge autorizado y CI de `main` GREEN |
| PBI-027 | Falta estimación/DoR | Acuerdo de equipo y revisión formal DoR |

## Reglas de cambio

- Sólo un PBI puede pasar a ejecución/cierre.
- El cierre anterior selecciona el siguiente mediante PR documental.
- Selección no equivale a `In progress` ni autorización.
- Si el siguiente no cumple la condición de entrada, el Sprint falla cerrado.

## Próxima revisión

- **Fecha:** TBD.
- **Disparador:** integración de la reconciliación o cambio material de dependencias.
