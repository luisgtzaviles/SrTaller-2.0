# SPRINT-01 — Backlog

## Estado del documento

- **Estado:** Active — closure candidate; PBI-033 `Done candidate`.
- **PBI actual:** NONE.
- **WIP:** 0/1 durante el cierre documental.
- **Siguiente candidato:** PBI-025 — seleccionado, no iniciado; riesgo
  `Critical`, estimación `TBD` y DoR pendiente.

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
| [PBI-033](../../backlog/pbis/PBI-033.md) | Done candidate | Candidate `bb5a1efde19171703d0b3ce84567ff14538b32b7`, CI `34081637692`, focused high-risk review PASS, merge PR #28 `065b859e3db64f82f033ce75ce5fb33df9b3ade1`, CI exacto de `main` `34082394514` y Owner Acceptance condicional PASS; cierre documental pendiente; `Released: NO`. |

## Secuencia posterior, seleccionada y no iniciada

| Orden | PBI | Estado | Condición de entrada |
|---:|---|---|---|
| 1 | [PBI-025](../../backlog/pbis/PBI-025.md) | Blocked / selected; not started | PBI-033 Done efectivo; threat model, estimación, DoR y autorización Owner propios antes de iniciar |

## Bloqueos

| PBI | Bloqueo | Condición de salida |
|---|---|---|
| PBI-033 | Merge autorizado del cierre documental y CI exacto post-cierre de `main` | Mantener `Done candidate`, G2 `PASS candidate` y WIP `0/1` hasta completar el cierre |
| PBI-025 | Riesgo `Critical`; threat model, estimación, DoR y autorización de inicio pendientes | Mantener seleccionado, no iniciado, hasta satisfacer sus gates propios |

## Reglas de cambio

- Sólo un PBI puede pasar a ejecución/cierre.
- El cierre anterior selecciona el siguiente mediante PR documental.
- Selección no equivale a `In progress` ni autorización.
- Si el siguiente no cumple la condición de entrada, el Sprint falla cerrado.

## Próxima revisión

- **Fecha:** TBD.
- **Disparador:** Owner merge review/CI del cierre documental candidato de
  PBI-033 o cambio material de los gates de PBI-025.
