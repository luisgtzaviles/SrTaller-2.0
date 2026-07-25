# Matriz PostgreSQL 18.4

## Entorno

- imagen oficial `postgres:18.4`;
- digest
  `sha256:d93de42662696f278fb34354b06fdaa90ad7ca3106d6f72fbd01d16da006d2cf`;
- base, usuario y password sintéticos por run;
- UTC, UTF-8 del image default, puerto loopback dinámico;
- storage `tmpfs`, sin volumen nombrado;
- health check, timeout finito y cleanup en `finally`.

## Escenarios ejecutados

| Escenario | Resultado |
|---|---|
| create no abre conexión | PASS |
| `select 1` y segundo verify | PASS |
| verifies concurrentes | PASS |
| pool `max=1`, cliente liberado, waiting=0 | PASS |
| close concurrente/idempotente | PASS |
| verify después de close | PASS — `DATABASE_CONNECTION_CLOSED` |
| password incorrecto | PASS — Authentication |
| base inexistente | PASS — Database Not Found |
| PostgreSQL pausado | PASS — Timeout finito |
| `verify-full` contra servidor sin TLS | PASS — SSL |
| verify/close concurrente | PASS |
| schema después del run | PASS — sin tablas ni `_kysely_migration` |

## Doble run

El comando:

```text
node scripts/test-database-connection-postgresql.mjs --runs 2
```

creó y destruyó dos instancias independientes. Resultado material:

- runs: `2`;
- comparación: `MATCH`;
- SHA-256 material:
  `5828769bbac06526cdad20ba211b5c4a90d87faeaa2852da3b1bc8c1d494bd59`;
- cleanup: `PASS`.

Esto verifica la facility localmente. DEC051-C03 permanece pendiente hasta que
un job productivo Linux ejecute la suite real.
