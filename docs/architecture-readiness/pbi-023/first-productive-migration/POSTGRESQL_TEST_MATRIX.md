# Matriz PostgreSQL 18.4

| Escenario | Run 1 | Run 2 |
| --- | --- | --- |
| DB vacía / status pending | PASS | PASS |
| dist ESM / manifest esperado | PASS | PASS |
| up / journal | PASS | PASS |
| re-run idempotente | PASS | PASS |
| introspección exacta | PASS | PASS |
| constraints negativos | PASS | PASS |
| branch ID repetible entre tenants | PASS | PASS |
| FK futura compuesta / cross-tenant | PASS | PASS |
| índices y `EXPLAIN` | PASS | PASS |
| down bloqueado por dependencia | PASS | PASS |
| down / reapply | PASS | PASS |
| fallo atómico | PASS | PASS |
| cleanup | PASS | PASS |

## Entorno

- Node.js `24.18.0`;
- pnpm `11.15.1`;
- PostgreSQL `18.4`;
- imagen oficial:
  `postgres@sha256:d93de42662696f278fb34354b06fdaa90ad7ca3106d6f72fbd01d16da006d2cf`;
- UTC, UTF8, tmpfs, puerto loopback dinámico y credenciales sintéticas.

Comparación material: `MATCH`.

SHA-256 material:
`7cb2ff620723f9ba201fb9ae71ae25e54aaa1624d74b66fdecdb804043673dfe`.
