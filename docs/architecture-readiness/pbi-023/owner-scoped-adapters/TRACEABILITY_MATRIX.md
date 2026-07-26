# Matriz de trazabilidad

| Requisito | Implementación | Prueba/evidencia | Estado |
|---|---|---|---|
| owner tenancy | tenant port/adapter | D5-R041/R047 + integration | PASS |
| owner stations | branch port/adapter | D5-R041/R047 + integration | PASS |
| tenant obligatorio | scopes nominales | unit pre-query + D5-R044 | PASS |
| branch obligatorio | `TenantBranchPersistenceScope` | unit/type/PG | PASS |
| no driver leakage | ports framework-free | D5-R043 + architecture test | PASS |
| no generic repository | APIs específicas | D5-R039 + source test | PASS |
| ordinary query | persistence capability | unit + PG | PASS |
| transaction context | transactional factory | commit/rollback/expiry/nesting | PASS |
| tenant CRUD mínimo | create/find/exists | PG | PASS |
| branch CRUD mínimo | create/find/exists/list | PG | PASS |
| duplicate | 23505 mapping | unit + PG concurrent | PASS |
| tenant FK | 23503 mapping | PG | PASS |
| anti-enumeración | `null`/`false`, sin fallback | PG cross-tenant | PASS |
| sanitización | errors sin cause/driver | unit + PG assertions | PASS |
| migración productiva | runner desde `dist` | PG up/down | PASS |
| dos runs | harness aislado | manifest/material comparison | PASS |
| cleanup | fail-closed finally | schema + Docker absence | PASS |
| PostgreSQL CI | workflow intacto | siguiente Paso 11 | PENDING |
