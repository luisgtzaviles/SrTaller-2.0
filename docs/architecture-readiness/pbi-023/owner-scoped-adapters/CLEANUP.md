# Cleanup

Cada run:

1. crea nombre de contenedor/base y password aleatorios sintéticos;
2. publica PostgreSQL sólo en `127.0.0.1` con puerto efímero;
3. usa tmpfs, sin volumen persistente;
4. aplica y revierte la migración mediante el runner;
5. elimina journals/objetos allowlisted en el `finally` de test;
6. cierra runner, connection/pool y admin pool;
7. confirma schema vacío con `pg_dump`;
8. fuerza remove del contenedor;
9. confirma que el contenedor ya no existe.

La verificación final confirma cero contenedor, volumen, red dedicada, puerto,
proceso, socket, tabla, journal o dato residual. No se creó `.env`; ningún
password, connection string, SQL ejecutado, ruta personal o `/tmp` se
versiona.

El cleanup sólo opera sobre recursos con nombres generados por el propio
harness. No toca bases, contenedores ni archivos externos.
