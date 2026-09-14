# SPRINT-03 — Riesgos y bloqueos

## Estado

- **Estado:** Active — PBI-040 Owner Accepted; Final Verification.
- **Bloqueos:** ninguno; cierre técnico/merge/Preview autorizado 2026-09-13.

| Riesgo | Clasificación | Control | Estado |
|---|---|---|---|
| fuga Tenant/Branch | Critical | contexto confiable, constraints y pruebas cruzadas | control verificado; revalidación final pendiente |
| costo expuesto | High | capability y field omission server-side | control verificado; revalidación final pendiente |
| identidad duplicada | High | ID opaco, SKU/barcode Tenant, concurrencia | control verificado |
| historial de precio perdido | High | revisiones append-only + snapshots futuros | control verificado |
| Composer ambiguo/partial | High | PBI-041 separado; unresolved cero, preview/confirmación y apply atómico | arquitectura/DoR Ready; no materializado |
| WIP paralelo | Medium | PBI-040 único WIP; PBI-041 Ready pero no seleccionado/autorizado | controlado |

## Próxima revisión

En cada gate de cierre de riesgo alto y después de Preview.
