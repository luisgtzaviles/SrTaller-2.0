# Mapeo de errores

| Código estable | Categoría | Retry | Origen |
| --- | --- | --- | --- |
| `DATABASE_TRANSACTION_INVALID_STATE` | Configuration | never | connection/context inactivo |
| `DATABASE_TRANSACTION_INVALID_OPTIONS` | Configuration | never | options/callback inválidos |
| `DATABASE_TRANSACTION_NESTED_FORBIDDEN` | Configuration | never | nesting/overlap |
| `DATABASE_TRANSACTION_TIMEOUT` | Infrastructure | conditional | `57014`, timeout driver |
| `DATABASE_TRANSACTION_SERIALIZATION_FAILURE` | Concurrency | conditional | `40001` |
| `DATABASE_TRANSACTION_DEADLOCK` | Concurrency | conditional | `40P01` |
| `DATABASE_TRANSACTION_READ_ONLY_VIOLATION` | Persistence | never | `25006` |
| `DATABASE_TRANSACTION_ABORTED` | Persistence | never | start/commit no clasificado |
| `DATABASE_TRANSACTION_CALLBACK_FAILED` | Unexpected | never | callback no PostgreSQL |
| `DATABASE_TRANSACTION_ROLLBACK_FAILED` | Persistence | never | rollback secundario fallido |

`conditional` es metadata, no ejecución. DEC-049 mantiene la autoridad de retry
en aplicación, sobre la unidad completa, idempotente y con política acotada.

## Fases

`validation`, `start`, `callback`, `commit`, `rollback` y `context` distinguen
la procedencia sin revelar mensajes del driver. Si commit falla, Kysely intenta
rollback. Si rollback también falla después de un error primario, se expone
sólo su código estable en `primaryCode`; las causas se preservan privadamente.

Este contrato concreta la traducción requerida por
[DEC-044](../../../decisions/dec-044-error-strategy/DECISION_PROPOSAL.md) y no
acopla callers a PostgreSQL.
