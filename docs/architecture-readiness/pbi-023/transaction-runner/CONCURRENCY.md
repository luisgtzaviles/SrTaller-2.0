# Concurrencia y lifecycle

| Escenario | Política | Resultado |
| --- | --- | --- |
| transacción durante `verify()` | comparte el verify activo y continúa si queda ready | PASS |
| transacción tras close | rechazo tipado | PASS |
| close con transacción activa | cambia a closing, rechaza nuevas, espera la activa | PASS |
| dos operaciones en misma facility | segunda falla como overlap/nesting | PASS fail-closed |
| dos transacciones independientes | facilities/pools aislados, ambas confirman | PASS |
| pool `max=1` | begin/callback/commit y release sin waiter residual | PASS |
| error y nueva operación | rollback y reutilización válida | PASS |
| contexto tras callback | rechazo `INVALID_STATE` | PASS |

La API pública de la connection facility no cambió. Internamente, la primera
transacción activa Kysely como owner del pool; `close()` delega entonces el
cierre a Kysely. Si nunca se activó, conserva el cierre directo anterior. Esto
evita doble `pool.end()` y mantiene los tests previos.

La adquisición usa `connectionTimeoutMs`; statements usan
`statementTimeoutMs`/`queryTimeoutMs`. No se ofrece timeout total porque sin
cancelación cooperativa podría dejar el callback ejecutando con acceso válido.
Ese contrato queda diferido.
