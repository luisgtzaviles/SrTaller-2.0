# SPRINT-01 — Backlog

## Estado del documento

- **Estado:** Planned — activation pending PBI-027 DoR, estimación y
  autorización Owner.
- **PBI actual:** ninguno.
- **WIP:** uno.
- **Siguiente candidato:** PBI-027, pendiente de DoR/estimación; no iniciado.

## Gate externo de activación

| PBI de cierre previo | Estado | Relación con Sprint 01 | Condición de salida |
|---|---|---|---|
| [PBI-030](../../backlog/pbis/PBI-030.md) | Done — cierre documental candidato | Predecesor cerrado; no pertenece al compromiso | Sin condición adicional de PBI-030 |

## Committed

Ningún PBI está `Committed`: PBI-027 todavía requiere estimación acordada,
revisión DoR y autorización Owner de implementación.

## Candidatos ordenados

| Orden | PBI | Estado | Condición de entrada |
|---:|---|---|---|
| 1 | [PBI-027](../../backlog/pbis/PBI-027.md) | Ready candidate | Estimación y DoR PASS; autorización Owner |
| 2 | [PBI-029](../../backlog/pbis/PBI-029.md) | Draft | PBI-027 Done; DoR y autorización |
| 3 | [PBI-024](../../backlog/pbis/PBI-024.md) | Draft | PBI-029 Done; recuperación selectiva refinada |
| 4 | [PBI-032](../../backlog/pbis/PBI-032.md) | Draft | PBI-024 Done; bootstrap de primer User resuelto |
| 5 | [PBI-033](../../backlog/pbis/PBI-033.md) | Draft | PBI-032 Done; catálogo inicial refinado |

## Bloqueos

| PBI | Bloqueo | Condición de salida |
|---|---|---|
| Activación | PBI-027 no tiene readiness completo ni autorización Owner | DoR PASS, estimación acordada y decisión Owner separada |
| PBI-027 | Falta estimación/DoR | Acuerdo de equipo y revisión formal DoR |

## Reglas de cambio

- Sólo un PBI puede pasar a ejecución/cierre.
- El cierre anterior selecciona el siguiente mediante PR documental.
- Selección no equivale a `In progress` ni autorización.
- Si el siguiente no cumple la condición de entrada, el Sprint falla cerrado.

## Próxima revisión

- **Fecha:** TBD.
- **Disparador:** revisión DoR/estimación de PBI-027 o cambio material de dependencias.
