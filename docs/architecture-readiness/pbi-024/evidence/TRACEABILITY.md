# Trazabilidad ejecutada

| Requisito | Evidencia |
| --- | --- |
| tenant/branch server-side | aplicación + PostgreSQL |
| ownership Branch/Station | arquitectura 265/265 |
| lifecycle e historia | dominio + aplicación + PostgreSQL |
| contexto inmutable | dominio + arquitectura |
| no global/wildcard | arquitectura + mutaciones |
| errores DEC-044 | translator estructurado + retryability + sanitización |
| aislamiento | PostgreSQL + mutaciones |
| row lock/revisión | dos conexiones/transacciones + ambos órdenes PostgreSQL |
| `bindingRevision` | resolver fail-closed + guard transaccional |
| mutation semantics | 25 workspaces mutados + cinco demostraciones manuales |
| atomicidad | rollback PostgreSQL |
| migración/schema | up/down/reapply + introspección |
| doble corrida | [Run 1](RUN_1.md), [Run 2](RUN_2.md), [comparación](COMPARISON.md) |
| exclusiones | arquitectura + revisión de diff |
| DEC-051/063 | expedientes de aplicabilidad |

La evidencia Linux remota corresponde al head
`e02f4acb84bf67cfa8683c0dfb0fffc202bdcd66`; sus artifacts push y
pull_request fueron descargados, parseados, validados y comparados. PR #3
permanece `OPEN` y `Draft`.
