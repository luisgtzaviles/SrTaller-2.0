# Matriz PostgreSQL 18.4

Imagen oficial fijada:

`postgres@sha256:d93de42662696f278fb34354b06fdaa90ad7ca3106d6f72fbd01d16da006d2cf`

| Caso | Evidencia | Resultado |
| --- | --- | --- |
| commit | insert visible fuera de la transacción | PASS |
| rollback sync/async | fila experimental ausente | PASS |
| valor tipado | objeto retornado intacto | PASS |
| isolation | `SHOW transaction_isolation` para cuatro valores | PASS |
| read-only | lectura permitida, write `25006` | PASS |
| read-write | insert permitido | PASS |
| serializable | conflicto determinista `40001` | PASS |
| deadlock | dos sesiones/orden inverso, una `40P01` | PASS |
| timeout | `pg_sleep` test-only, `57014` | PASS |
| concurrencia | dos facilities independientes | PASS |
| reutilización | operación válida después de rollback/timeout | PASS |
| close activo | espera commit y libera | PASS |
| credencial inválida | error transaccional sanitizado | PASS |
| pool | total/idle/waiting `0/0/0` al cerrar | PASS |
| dos runs | resultado material idéntico | PASS |

`transaction_probe(id, value, version)` existe sólo en el proceso de prueba, se
crea con `pg` en el test, se elimina al final y nunca aparece en migraciones.
El schema dump posterior no contiene tablas ni journal Kysely.
