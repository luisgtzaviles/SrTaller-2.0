# Contrato transaccional

## API pública exacta

| Export | Contrato |
| --- | --- |
| `DatabaseTransactionOptions` | `isolationLevel?`, `readOnly?`; objeto allowlisted |
| `DatabaseTransactionContext` | `attempt: 1`, isolation y read-only inmutables |
| `DatabaseTransactionError` | error estable, tipado y sanitizado |
| `runInTransaction` | recibe connection, options y callback; retorna el valor tipado |

La API no contiene `PoolClient`, `Transaction<...>`, `Kysely`, `query`,
`commit`, `rollback`, SQL ni estado mutable.

## Callback

- se invoca exactamente una vez;
- admite retorno síncrono, asíncrono, primitivo u objeto;
- el valor se propaga al caller;
- un throw síncrono, asíncrono o incluso `undefined` provoca rollback;
- el contexto queda inválido al terminar;
- commit/rollback son responsabilidad exclusiva del runner;
- no existe retry automático.

## Capacidad interna

La facility implementa un símbolo no incluido en `DatabaseConnection`. El
runner reserva la transacción y asocia temporalmente contexto↔executor mediante
`WeakMap`. `useDatabaseTransactionExecutor` existe sólo en el archivo interno
registrado, no se reexporta y D5-R048 limita sus consumidores a connection y
runner hasta materializar adapters owner-scoped.

## Atomicidad y cleanup

Se usa `Kysely.transaction().execute(...)`: begin, callback, commit o rollback
ocurren sobre la conexión reservada y Kysely libera la conexión en `finally`.
Si callback y rollback fallan, el error público prioriza
`DATABASE_TRANSACTION_ROLLBACK_FAILED`, conserva `primaryCode` seguro y mantiene
ambas causas sólo en campos privados.
