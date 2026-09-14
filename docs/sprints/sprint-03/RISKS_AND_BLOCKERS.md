# SPRINT-03 — Riesgos y bloqueos

## Estado

- **Estado:** Active — PBI-040 Done; sin PBI actual.
- **Bloqueos:** ninguno para PBI-040.

| Riesgo | Clasificación | Control | Estado |
|---|---|---|---|
| fuga Tenant/Branch | Critical | contexto confiable, constraints y pruebas cruzadas | control verificado en full/CI |
| costo expuesto | High | capability y field omission server-side | control verificado en full/CI/Preview |
| identidad duplicada | High | ID opaco, SKU/barcode Tenant, concurrencia | control verificado |
| historial de precio perdido | High | revisiones append-only + snapshots futuros | control verificado |
| Composer ambiguo/partial | High | PBI-041 separado; unresolved cero, preview/confirmación y apply atómico | arquitectura/DoR Ready; no materializado |
| WIP paralelo | Medium | no existe WIP activo; PBI-041 Ready pero no seleccionado/autorizado | controlado |

## Próxima revisión

Al seleccionar PBI-041 o ante una regresión de Catalog/Pricing. Los riesgos de
Composer permanecen diseño futuro y no están materializados.
