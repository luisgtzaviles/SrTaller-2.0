# SPRINT-03 — Riesgos y bloqueos

## Estado

- **Estado:** Active — PBI-040 Owner Review.
- **Bloqueos:** ninguno; autorización Owner recibida 2026-09-11.

| Riesgo | Clasificación | Control | Estado |
|---|---|---|---|
| fuga Tenant/Branch | Critical | contexto confiable, constraints y pruebas cruzadas | control verificado; revisión Owner pendiente |
| costo expuesto | High | capability y field omission server-side | control verificado; revisión Owner pendiente |
| identidad duplicada | High | ID opaco, SKU/barcode Tenant, concurrencia | control verificado |
| historial de precio perdido | High | revisiones append-only + snapshots futuros | control verificado |
| import ambiguo/partial | High | PBI-041 separado, decisiones cero, publish transaccional | no materializado |
| WIP paralelo | Medium | PBI-040 único siguiente; PBI-041 Planned | controlado |

## Próxima revisión

En Owner Review y en cada gate posterior de riesgo alto.
