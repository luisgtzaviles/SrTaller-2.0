# SPRINT-03 — Riesgos y bloqueos

## Estado

- **Estado:** Closed candidate — PBI-040 Done; PBI-041 Done candidate.
- **Bloqueos:** ninguno; cierre documental gobernado pendiente de integración.

| Riesgo | Clasificación | Control | Estado |
|---|---|---|---|
| fuga Tenant/Branch | Critical | contexto confiable, constraints y pruebas cruzadas | control verificado en full/CI |
| costo expuesto | High | capability y field omission server-side | control verificado en full/CI/Preview |
| identidad duplicada | High | ID opaco, SKU/barcode Tenant, concurrencia | control verificado |
| historial de precio perdido | High | revisiones append-only + snapshots futuros | control verificado |
| Composer ambiguo/partial | High | unresolved cero, preview/confirmación y apply atómico | control verificado en FV/CI/Preview |
| retiro masivo indebido | Critical | capability dedicada, Level 2, plan/hash server-side, revalidación y audit | control verificado en FV/CI |
| pérdida de memoria histórica | Critical | `ACTIVE→INACTIVE`, sin delete; Historical/Virgin separados | control PostgreSQL PASS |
| reactivación de identidad equivocada o duplicada | Critical | mapping histórico exacto/único/consistente, expectedVersion, transacción e idempotencia | 36/36 material + negativos PostgreSQL PASS |
| WIP paralelo | Medium | Current PBI NONE; PBI-042 permanece fuera | controlado |

## Próxima revisión

Ante una regresión de Catalog/Pricing o una nueva selección Owner. No iniciar
otro PBI automáticamente.
