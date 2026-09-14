# SPRINT-03 — Riesgos y bloqueos

## Estado

- **Estado:** Active — PBI-040 Done; PBI-041 Owner Review ready.
- **Bloqueos:** ninguno para el checkpoint local PBI-041.

| Riesgo | Clasificación | Control | Estado |
|---|---|---|---|
| fuga Tenant/Branch | Critical | contexto confiable, constraints y pruebas cruzadas | control verificado en full/CI |
| costo expuesto | High | capability y field omission server-side | control verificado en full/CI/Preview |
| identidad duplicada | High | ID opaco, SKU/barcode Tenant, concurrencia | control verificado |
| historial de precio perdido | High | revisiones append-only + snapshots futuros | control verificado |
| Composer ambiguo/partial | High | unresolved cero, preview/confirmación y apply atómico | control focalizado y PostgreSQL PASS; Owner Review pendiente |
| WIP paralelo | Medium | PBI-041 es el único WIP; PBI-042 permanece fuera | controlado |

## Próxima revisión

Ante la decisión Owner de PBI-041 o una regresión de Catalog/Pricing. Los
riesgos de Composer están materializados y cubiertos localmente; no se declaran
cerrados para integración antes de Acceptance y sus gates posteriores.
