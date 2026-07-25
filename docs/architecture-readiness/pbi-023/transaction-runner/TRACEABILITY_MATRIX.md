# Matriz de trazabilidad

| Requisito | Decisión/gate | Implementación | Prueba/evidencia | Estado |
| --- | --- | --- | --- | --- |
| frontera en aplicación, runner estrecho | DEC049 §19/C04 | `runInTransaction` + contexto | unit + contrato | PASS |
| misma conexión | DEC049-C04 | callback sobre `Transaction` interno | commit/rollback PG | PASS |
| no driver público | DEC-005/D5-R038/R043 | capability no reexportada | architecture test | PASS |
| ownership/consumidor | DEC049-C02/D5-R045 | registry exacto | checker | PASS |
| nesting fail-closed | DEC049-C04 | exclusión por facility | direct/indirect/overlap | PASS |
| error translation | DEC-044/DEC049-C05 | catálogo estable | unit + PG codes | PASS |
| rollback y causa primaria | DEC049-C06 | automatic transaction + metadata privada | rollback dual-failure | PASS |
| isolation/read-only | DEC049 §19 | Kysely settings allowlisted | PG 18.4 | PASS |
| retry en aplicación | DEC049 §19 | sólo metadata conditional | ausencia de loop/retry | PASS |
| lifecycle/pool | DEC049-C06/C07 | drain activo + owner de cierre | PG counts/close | PASS |
| reproducibilidad | DEC051-C03 | harness digest/dos runs | material MATCH | Partial: CI PG pendiente |
| boundaries | DEC051-C06 | D5-R048 | fixtures/mutación | PASS parcial |
| sanitización | DEC-055/DEC-063 | JSON/inspect fijos | secretos sintéticos | PASS acotado |
| migraciones | DEC-050 | no materializadas | schema dump vacío | Pending siguiente gate |
