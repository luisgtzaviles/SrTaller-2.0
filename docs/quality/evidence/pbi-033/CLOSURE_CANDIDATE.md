# PBI-033 — Canonical Closure Candidate

## Resultado

**PASS — PBI-033 DONE CANDIDATE.** Este expediente reúne los predicados
materiales de DoD para que el PR documental de avance materialice el cierre
efectivo en `main` y G2 `PASS`. No autoriza release, deploy ni el inicio de
PBI-025.

## Trazabilidad

| Campo | Evidencia |
|---|---|
| PBI | `PBI-033 — Roles, Assignments and Capability Catalog` |
| PR funcional | [#28 — Add tenant-scoped roles and capabilities](https://github.com/luisgtzaviles/SrTaller-2.0/pull/28) |
| Candidate revisado | `bb5a1efde19171703d0b3ce84567ff14538b32b7` |
| CI del candidate | [Run 34081637692](https://github.com/luisgtzaviles/SrTaller-2.0/actions/runs/34081637692) — SUCCESS |
| Merge funcional | `065b859e3db64f82f033ce75ce5fb33df9b3ade1`; `2026-09-07T04:15:05Z` |
| CI de `main` | [Run 34082394514](https://github.com/luisgtzaviles/SrTaller-2.0/actions/runs/34082394514) — SUCCESS |
| Checks | VC-024 run-1 GREEN; run-2 GREEN; comparison GREEN en candidate y `main` |
| DoR / threat model | PASS; riesgo High y Size Large autorizados dentro del Identity Master Goal |
| Focused high-risk review | PASS; findings abiertos BLOCKER/HIGH/MEDIUM: 0 |
| Riesgo residual conocido | LOW — los grants son una proyección; PBI-026 debe intersectar User, Station/Branch y contexto/sesión antes de cualquier efecto protegido |
| Owner Acceptance del resultado | APPROVED condicionalmente; todos sus predicados materiales se cumplieron |
| Released | NO |

## DoD

- Criterios de aceptación y alcance: PASS.
- Revisión proporcional de alto riesgo y pruebas negativas: PASS.
- Merge funcional autorizado en `main`: PASS.
- CI autoritativo sobre el SHA integrado exacto: PASS.
- Evidencia, riesgos y documentación funcional: PASS.
- Owner Acceptance condicional: PASS.
- G2 IDENTITY: `PASS candidate`; Users, Roles y assignments persistentes tienen
  evidencia material, pero el estado se vuelve efectivo con este cierre.
- Cierre documental: pendiente de merge autorizado y CI autoritativo GREEN
  sobre el SHA exacto de ese merge.

## Límite de autoridad

El slice integra catálogo cerrado de capabilities, roles tenant-scoped,
composición rol–capability, assignments tenant-wide/Branch-restricted,
assign/revoke server-only, read models y persistencia/material PostgreSQL. Los
read models de grants no son una decisión final de autorización: PBI-026 debe
intersectarlos con el User activo, Station/Branch confiable y sesión/contexto
antes de permitir cualquier efecto protegido.

No integra PIN, credenciales, Operational Session, login, cookies, enforcement
final PBI-026, administración HTTP/UI, autorización reforzada, release ni
deploy. PBI-025 queda seleccionado, no iniciado, con riesgo `Critical`,
estimación `TBD` y DoR pendiente; requiere sus propios gates y autorización
Owner.
