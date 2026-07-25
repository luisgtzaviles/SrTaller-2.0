# Cleanup

Cada run usa un contenedor PostgreSQL efímero independiente, tmpfs, puerto
loopback dinámico y base sintética. El bloque `finally` fuerza eliminación del
contenedor y verifica su ausencia.

Resultado final:

- contenedores: 0;
- volúmenes Docker creados: 0;
- redes Docker creadas: 0;
- puertos/listeners retenidos: 0;
- procesos/sockets de prueba retenidos: 0;
- tablas y journal residuales: 0;
- bases residuales fuera del contenedor: 0;
- `.env`, credenciales o logs sensibles versionados: 0;
- rutas `/tmp` versionadas: 0;
- fixtures fuera de `test/fixtures/database-schema/`: 0.
