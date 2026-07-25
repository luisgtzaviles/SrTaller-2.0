# Cleanup

El harness usa un container distinto por run, tmpfs y puerto loopback
dinámico. El `finally` fuerza la eliminación y confirma que el nombre ya no
aparece en `docker ps --all`.

Dentro de PostgreSQL, el test elimina:

- `migration_probe_a`;
- `migration_probe_b`;
- probes de failure/no-down/down-failure/lock;
- `kysely_migration`;
- `kysely_migration_lock`.

Después ejecuta inspección de catálogo y `pg_dump --schema-only`. Cualquier
`CREATE TABLE`, probe o journal residual falla el run.

Connections y runners se cierran de forma idempotente; roots temporales de
fixtures se eliminan. No se crean volumen o red, `.env`, socket versionado,
credencial persistente, log crudo ni archivo bajo `/tmp` en Git.
