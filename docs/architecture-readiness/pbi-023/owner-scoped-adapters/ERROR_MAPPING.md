# Error mapping

## Catálogo estable

### Tenancy

- `PERSISTENCE_TENANT_SCOPE_REQUIRED`
- `TENANT_PERSISTENCE_CONFLICT`
- `TENANT_PERSISTENCE_NOT_FOUND` — reservado para una operación futura que
  requiera not-found; find actual retorna `null`
- `TENANT_PERSISTENCE_FAILED`

### Stations

- `PERSISTENCE_TENANT_SCOPE_REQUIRED`
- `PERSISTENCE_BRANCH_SCOPE_REQUIRED`
- `BRANCH_PERSISTENCE_CONFLICT`
- `BRANCH_PERSISTENCE_TENANT_NOT_FOUND`
- `BRANCH_PERSISTENCE_NOT_FOUND` — reservado para una mutación futura;
  find actual retorna `null`
- `BRANCH_PERSISTENCE_FAILED`

## PostgreSQL

| SQLSTATE | Resultado owner |
|---|---|
| `23505` | `*_PERSISTENCE_CONFLICT` |
| `23503` | `BRANCH_PERSISTENCE_TENANT_NOT_FOUND` |
| `23502` | scope requerido |
| `22P02` | scope requerido |
| `40001` | `*_PERSISTENCE_FAILED`, retry `conditional` |
| `40P01` | `*_PERSISTENCE_FAILED`, retry `conditional` |
| `57014` | `*_PERSISTENCE_FAILED`, retry `conditional` |
| otro | `*_PERSISTENCE_FAILED`, retry `never` |

El adapter inspecciona únicamente `code`. No interpreta mensajes. Los errores
serializados contienen nombre, categoría, código, mensaje estable y
retryability. No conservan cause, SQL, parámetros, constraint, host, base,
usuario, password, connection string ni mensaje del driver.

Retry `conditional` no ejecuta retry automático. El caller futuro deberá
cumplir idempotencia y reintentar la transacción completa conforme DEC-044.
