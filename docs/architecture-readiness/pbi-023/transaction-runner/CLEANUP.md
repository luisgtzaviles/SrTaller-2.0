# Cleanup

El harness usa:

- credenciales sintéticas aleatorias;
- database y nombre de container por run;
- PostgreSQL 18.4 por digest;
- timezone UTC;
- puerto loopback dinámico;
- filesystem de datos `tmpfs`;
- healthcheck finito;
- `docker rm --force` en `finally`.

Después de cada run verifica ausencia exacta del container. No crea volumen ni
red nombrados. La prueba elimina `transaction_probe`; el harness valida por
`pg_dump --schema-only` que no queden tablas ni `_kysely_migration`.

Resultado esperado/final:

- containers: 0;
- volúmenes: 0;
- redes: 0;
- puertos/sockets/procesos: 0;
- `.env`/credenciales/logs sensibles: 0;
- tablas experimentales: 0;
- `/tmp` versionado: 0.
