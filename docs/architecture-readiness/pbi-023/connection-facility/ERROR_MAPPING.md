# Mapping de errores

## Catálogo estable

| Código | Categoría | Retryable | Origen |
|---|---|:---:|---|
| `DATABASE_CONNECTION_INVALID_STATE` | Configuration | No | objeto/estado no autorizado |
| `DATABASE_CONNECTION_AUTHENTICATION_FAILED` | Authentication | No | SQLSTATE `28P01` |
| `DATABASE_CONNECTION_DATABASE_NOT_FOUND` | Persistence | No | SQLSTATE `3D000` |
| `DATABASE_CONNECTION_TIMEOUT` | Infrastructure | Sí | `57014`, `ETIMEDOUT`, timeout |
| `DATABASE_CONNECTION_NETWORK_FAILED` | Infrastructure | Sí | códigos de red gobernados |
| `DATABASE_CONNECTION_SSL_FAILED` | Infrastructure | No | TLS/certificado/SSL incompatible |
| `DATABASE_CONNECTION_VERIFICATION_FAILED` | Unexpected | No | error desconocido fail-closed |
| `DATABASE_CONNECTION_CLOSED` | Infrastructure | No | verify durante/después de cierre |
| `DATABASE_CONNECTION_CLOSE_FAILED` | Infrastructure | No | pool no cerró de forma segura |

## Frontera

El error del driver se inspecciona sólo dentro de infraestructura para
clasificarlo. No se conserva como `cause`, no se reexporta y no cruza la API.
El mensaje público es fijo por código. SQLSTATE, mensajes PostgreSQL, host,
usuario, base, password, SQL, stack del driver y connection strings no forman
parte del error estable.

Este mapping satisface el alcance de conexión de DEC-044/DEC-049. El mapping
de unique/FK/concurrency para adapters sigue pendiente.
