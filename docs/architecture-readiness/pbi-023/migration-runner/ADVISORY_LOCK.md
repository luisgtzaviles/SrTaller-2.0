# Advisory lock

## Contrato

El runner usa el ID versionado `3853314791062309107`, el mismo ID del adaptador
PostgreSQL de Kysely `0.29.4`.

Antes de invocar al migrador obtiene, sobre una conexión dedicada:

`pg_try_advisory_lock(id)`

con polling acotado y timeout configurable entre 10 y 60,000 ms; default
1,000 ms. Si no obtiene exclusión responde
`DATABASE_MIGRATION_LOCK_TIMEOUT` sin ejecutar cambios.

## Interacción con Kysely

`Migrator` adquiere después su lock integrado en la misma sesión. El lock de
PostgreSQL es reentrante: Kysely libera una adquisición y el `finally` del
runner libera la otra. Esta preadquisición agrega el timeout operativo finito
que DEC-050 exige sin sustituir el lock del adaptador.

## Fallos y cleanup

- fallo de adquisición → `DATABASE_MIGRATION_LOCK_FAILED`;
- timeout → código específico y timeout seguro;
- unlock falso o error → `DATABASE_MIGRATION_CLEANUP_FAILED`;
- toda adquisición propia se libera en `finally`;
- el cierre de connection espera la operación activa.

La prueba real ejecuta A y B concurrentes, obtiene timeout en B, completa A y
permite a C continuar. También verifica liberación tras migración fallida.
