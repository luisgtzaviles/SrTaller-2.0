# SPRINT-01 — Backlog

## Estado del documento

- **Estado:** Active — PBI-027 DoR PASS y autorización Owner condicional.
- **PBI actual:** PBI-027 — Branch Timezone Minimum (`In progress`).
- **WIP:** uno.
- **Siguiente candidato:** PBI-029, seleccionado solamente; no iniciado.

## Gate externo de activación

| PBI de cierre previo | Estado | Relación con Sprint 01 | Condición de salida |
|---|---|---|---|
| [PBI-030](../../backlog/pbis/PBI-030.md) | Done | Predecesor cerrado; no pertenece al compromiso | Sin condición adicional de PBI-030 |

## Committed

| PBI | Estado | Entrada autorizada |
|---|---|---|
| [PBI-027](../../backlog/pbis/PBI-027.md) | In progress | DoR PASS; Size Small / Risk Medium; autorización Owner condicional del 2026-09-04. |

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
| PBI-027 cierre | Owner Review, merge autorizado y CI de `main` | No pasar a `Done` ni iniciar PBI-029 antes de esos gates |

## Reglas de cambio

- Sólo un PBI puede pasar a ejecución/cierre.
- El cierre anterior selecciona el siguiente mediante PR documental.
- Selección no equivale a `In progress` ni autorización.
- Si el siguiente no cumple la condición de entrada, el Sprint falla cerrado.

## Próxima revisión

- **Fecha:** TBD.
- **Disparador:** revisión DoR/estimación de PBI-027 o cambio material de dependencias.
