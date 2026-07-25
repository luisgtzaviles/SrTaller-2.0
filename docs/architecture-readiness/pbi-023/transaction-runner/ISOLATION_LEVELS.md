# Niveles de aislamiento

## Allowlist

| Opción | PostgreSQL 18.4 observado | Estado |
| --- | --- | --- |
| `read uncommitted` | `read uncommitted` | PASS |
| `read committed` | `read committed` | PASS; default |
| `repeatable read` | `repeatable read` | PASS |
| `serializable` | `serializable` | PASS |

Los valores se aplican mediante el builder transaccional tipado de Kysely. Un
valor desconocido o una propiedad extra falla con
`DATABASE_TRANSACTION_INVALID_OPTIONS` antes de verificar o adquirir conexión.

PostgreSQL acepta `read uncommitted`, pero su comportamiento efectivo equivale
a `read committed`; esta equivalencia del motor no se presenta como una
garantía distinta.

## Serializable

Dos sesiones leen la misma versión y actualizan el mismo registro experimental.
Exactamente una confirma y la otra recibe `40001`, traducido a
`DATABASE_TRANSACTION_SERIALIZATION_FAILURE`. No hay retry oculto.
