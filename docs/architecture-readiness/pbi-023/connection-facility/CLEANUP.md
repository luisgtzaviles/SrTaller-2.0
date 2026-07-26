# Cleanup

## Recursos de aplicación

- cada cliente del probe se libera en `finally`;
- close espera verify activo;
- pool termina explícitamente;
- Kysely se destruye dentro de la misma facility;
- close antes del primer verify es seguro;
- close después de error y close concurrente son deterministas;
- conteos del pool terminan en cero.

## Recursos PostgreSQL de prueba

El runner usa nombre aleatorio, puerto loopback dinámico y `tmpfs`. En
`finally` ejecuta eliminación forzada y después verifica que no exista el
container. No crea volumen nombrado, red persistente, archivo `.env` ni
credencial estable.

Los dos runs terminaron `cleanup=PASS`. La inspección de schema confirmó que
el probe no creó tablas, journal Kysely ni DDL residual.
