# Trazabilidad material de SPIKE-002

| Requisito | Experimento | Evidencia | Resultado |
|---|---|---|---|
| baseline exacta Linux | E1 | [ENVIRONMENT](ENVIRONMENT.md), ambos runs | PASS |
| ESM/NodeNext | E1 | compile/import/query/close | PASS |
| configuración fail-closed | E2 | faltantes, inválidos, SSL y timeout | PASS |
| migrator/journal/orden/re-run | E3 | tres migraciones ordenadas y no-op | PASS |
| rollback de migración | E4 | objeto y journal ausentes tras fallo | PASS |
| DDL no transaccional | E4 | error PostgreSQL `25001` | PASS |
| advisory lock concurrente | E5 | dos runners, un apply, timeout `57014` | PASS |
| CRUD y join scopeados | E6 | dos tenants y branches señuelo | PASS |
| constraint cross-tenant | E7 | FK compuesta, `23503` en insert/update | PASS |
| lectura fail-closed | E8 | contexto ausente/vacío/inválido | PASS |
| escritura fail-closed | E9 | update/delete/upsert/transacción mixta | PASS |
| concurrencia | E10 | `23505`, lost update observado, CAS efectivo | PASS |
| pool y recursos | E11 | límite, timeout, error y cierre | PASS |
| cleanup | E12 | cero recursos/puertos/archivos residuales | PASS |
| doble run | E1–E12 | [RUN_1](RUN_1.md), [RUN_2](RUN_2.md) | PASS |
| equivalencia | comparador | [COMPARISON](COMPARISON.md) | PASS |
| sanitización | runner + scan | [CLEANUP](CLEANUP.md) | PASS |

## Relación con decisiones

| Decisión/condición | Aporte del spike | Estado posterior |
|---|---|---|
| DEC050-C01 | baseline candidata compatible en laboratorio exacto | verificada por spike; instalación productiva pendiente |
| DEC050-C02 | orden, journal y re-run demostrados | patrón verificado; política/checker productivos pendientes |
| DEC050-C03 | serialización y timeout demostrados | patrón verificado; runner/job CI pendientes |
| DEC050-C04 | rollback y DDL no transaccional demostrados | patrón verificado; migraciones productivas pendientes |
| DEC050-C05 | hashes y comparación reproducible | parcialmente verificada; gate de drift/promoción pendiente |
| DEC050-C06 | credencial efímera y sanitización | parcialmente verificada; roles productivos pendientes |
| DEC050-C07 | vacío, orden, re-run, fallo y cleanup | patrón verificado; suite productiva/CI pendiente |
| DEC050-C08 | ejecución explícita separada del producto | patrón verificado; startup productivo pendiente |
| DEC050-C09 | owner y FK compuesta del probe | patrón verificado; registry/schema productivo pendiente |
| DEC050-C10 | no activada por operación destructiva | pendiente según trigger |
| DEC049-C03 | aislamiento y constraints reales PG18 | bloqueo del spike retirado; implementación pendiente |
| DEC051-C03/C04/C06 | testabilidad real y estrategia verificable | evidencia preparatoria; gates productivos pendientes |
| DEC063-C02/C05/C06 | riesgo, checklist y seguridad ejercitados | preparación material; cumplimiento final pendiente |
