# Plan de mutaciones críticas

## Regla

Cada mutación se aplica sobre copia temporal, debe producir el diagnóstico o
fallo esperado, se restaura y termina con baseline verde. Una mutación
superviviente es `FAIL`; no se usa score agregado para ocultarla.

| ID | Defecto sembrado | Suite que debe matarlo |
| --- | --- | --- |
| MUT-024-01 | eliminar `tenantId` del predicado station | PostgreSQL isolation |
| MUT-024-02 | cargar branch sólo por `branchId` | two-tenant branch test |
| MUT-024-03 | permitir status `Revoked` en resolver | application/lifecycle |
| MUT-024-04 | aceptar `tenantId` de payload como efectivo | contract/security |
| MUT-024-05 | aceptar `branchId` de payload como efectivo | contract/security |
| MUT-024-06 | omitir comparación de revision | stale/concurrency |
| MUT-024-07 | no incrementar revision en unlink/revoke | lifecycle/PG |
| MUT-024-08 | transformar deny en allow/fallback | AD matrix |
| MUT-024-09 | devolver distinto error para unknown/revoked | anti-enumeration |
| MUT-024-10 | compartir un objeto de contexto mutable | freeze/concurrency |
| MUT-024-11 | agregar fallback global o wildcard | architecture |
| MUT-024-12 | permitir dos bindings abiertos | constraint/PG |
| MUT-024-13 | editar branch del binding en vez de cerrarlo | history/relink |
| MUT-024-14 | exponer error `pg`/SQLSTATE | error sanitization |
| MUT-024-15 | importar adapter por deep path desde access | architecture |
| MUT-024-16 | crear contexto en controller/Nest provider request-scoped | architecture |
| MUT-024-17 | cachear un contexto después de revoke | revoke resolution |
| MUT-024-18 | reintentar una operación no idempotente | retry contract |
| MUT-024-19 | omitir guard antes del efecto transaccional | application integration |
| MUT-024-20 | confiar en fingerprint/local storage | recognition contract |
| MUT-024-21 | omitir la consulta pública de elegibilidad a `tenancy` | architecture/application |
| MUT-024-22 | ignorar resultado negativo de elegibilidad y aceptar branch inexistente | application/PG |
| MUT-024-23 | revocar station sin cerrar binding abierto | lifecycle/PG |
| MUT-024-24 | cerrar binding de otra station/tenant durante revoke | tenant isolation/lifecycle |
| MUT-024-25 | separar revoke y cierre de binding en transacciones distintas | rollback/atomicity |

## Cobertura de elegibilidad y revoke

- MUT-024-21 mata la omisión total de consulta a `tenancy`.
- MUT-024-22 mata branch inexistente o resultado de elegibilidad ignorado.
- MUT-024-02 mata una consulta de branch no tenant-scoped y aceptación
  cross-tenant.
- MUT-024-05 mata confianza en `branchId` de cliente.
- MUT-024-23 mata el binding abierto sobreviviente a revoke.
- MUT-024-24 mata cierre de binding incorrecto o de otro tenant.
- MUT-024-07 mata la omisión de incremento de revision.
- MUT-024-25 mata la pérdida de atomicidad entre station y binding.

Los IDs existentes no se renumeran. Las 25 mutaciones son obligatorias y una
sola superviviente produce `FAIL`.

## Evidencia

Por mutación:

- ID y riesgo;
- archivo/copia temporal;
- cambio semántico;
- comando y exit code;
- test/diagnóstico que la detectó;
- hash o prueba de restauración;
- baseline posterior.

No se versiona código mutado ni logs con paths personales o secretos.
