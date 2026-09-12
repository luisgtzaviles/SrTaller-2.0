# SPRINT-03 — Riesgos y bloqueos

## Estado

- **Estado:** Active — PBI-040 In progress.
- **Bloqueos:** ninguno; autorización Owner recibida 2026-09-11.

| Riesgo | Clasificación | Control | Estado |
|---|---|---|---|
| fuga Tenant/Branch | Critical | contexto confiable, constraints y pruebas cruzadas | control definido |
| costo expuesto | High | capability y field omission server-side | control definido |
| identidad duplicada | High | ID opaco, SKU/barcode Tenant, concurrencia | control definido |
| historial de precio perdido | High | revisiones append-only + snapshots futuros | control definido |
| import ambiguo/partial | High | PBI-041 separado, decisiones cero, publish transaccional | no materializado |
| WIP paralelo | Medium | PBI-040 único siguiente; PBI-041 Planned | controlado |

## Próxima revisión

Antes de iniciar PBI-040 y en cada gate de riesgo alto.
