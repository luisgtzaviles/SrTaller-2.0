# Trazabilidad ejecutada

| Requisito | Evidencia |
| --- | --- |
| tenant/branch server-side | aplicación + PostgreSQL |
| ownership Branch/Station | arquitectura 265/265 |
| lifecycle e historia | dominio + aplicación + PostgreSQL |
| contexto inmutable | dominio + arquitectura |
| no global/wildcard | arquitectura + mutaciones |
| errores DEC-044 | aplicación + sanitización |
| aislamiento | PostgreSQL + mutaciones |
| row lock/revisión | concurrencia PostgreSQL |
| atomicidad | rollback PostgreSQL |
| migración/schema | up/down/reapply + introspección |
| doble corrida | [Run 1](RUN_1.md), [Run 2](RUN_2.md), [comparación](COMPARISON.md) |
| exclusiones | arquitectura + revisión de diff |
| DEC-051/063 | expedientes de aplicabilidad |

La evidencia Linux remota corresponde a
`3b7a852873147377b9552464dc9df3da2737f4fa`; sus artifacts fueron descargados,
parseados y comparados antes de abrir el PR Draft #3.
