# PostgreSQL foundation de Preview

## Alcance

Esta baseline conecta el proceso HTTP de SR Taller con PostgreSQL mediante la
foundation Kysely/`pg` existente. El proceso HTTP sólo usa el rol lógico
`application`; no ejecuta migraciones ni DDL al arrancar.

La migración se ejecuta explícitamente desde el mismo artefacto OCI:

```sh
pnpm run db:migrate
```

El comando requiere `SR_DB_ROLE=migration`,
`SR_DB_ACCESS_MODE=read-write` y `SR_DB_MIGRATIONS_ENABLED=true`. El proceso
HTTP requiere `SR_DB_ROLE=application` y
`SR_DB_MIGRATIONS_ENABLED=false`.

## Contrato de configuración

La aplicación acepta exclusivamente variables individuales `SR_DB_*`; las
cadenas de conexión (`DATABASE_URL`, variables `PG*`, `SR_DATABASE_URL` y
equivalentes) están prohibidas por el parser.

Variables obligatorias para Preview:

- `SR_DB_ENVIRONMENT`
- `SR_DB_HOST`
- `SR_DB_PORT`
- `SR_DB_NAME`
- `SR_DB_USER`
- `SR_DB_PASSWORD`
- `SR_DB_SSL_MODE`
- `SR_DB_POOL_MIN`
- `SR_DB_POOL_MAX`
- `SR_DB_IDLE_TIMEOUT_MS`
- `SR_DB_CONNECTION_TIMEOUT_MS`
- `SR_DB_STATEMENT_TIMEOUT_MS`
- `SR_DB_QUERY_TIMEOUT_MS`
- `SR_DB_APPLICATION_NAME`
- `SR_DB_ROLE`
- `SR_DB_ACCESS_MODE`
- `SR_DB_MIGRATIONS_ENABLED`

La contraseña se configura sólo en Dokploy. No debe almacenarse en Git,
imprimirse en logs ni incluirse en evidencia.

## TLS de Preview

El PostgreSQL privado administrado por Dokploy usa la red interna del entorno
Preview y no publica el puerto 5432. Mientras ese servicio no tenga TLS
configurado, Preview se declara como `SR_DB_ENVIRONMENT=development` y usa
`SR_DB_SSL_MODE=disable` de forma explícita y acotada a esa red privada.

Esta excepción no relaja producción: el parser rechaza cualquier configuración
con `SR_DB_ENVIRONMENT=production` que no use
`SR_DB_SSL_MODE=verify-full`.

## Readiness y liveness

El proceso verifica conexión, journal de Kysely y las tablas/columnas mínimas
antes de escuchar. Después:

- `/readyz` consulta PostgreSQL y el estado del esquema; responde `503` cuando
  la dependencia no está disponible o no es compatible y se recupera sin
  reiniciar el proceso.
- `/livez` sólo expresa que el proceso está vivo y permanece independiente de
  PostgreSQL.
- `/` mantiene la UI de preview existente.

## Evidencia local

La prueba integrada usa PostgreSQL 18.4 y comprueba una ejecución inicial de
una migración, una segunda ejecución idempotente con cero migraciones, cero
pendientes, `readyz` 200/503/200 ante pausa y recuperación de PostgreSQL,
`livez` 200 durante la pausa y cierre del pool al recibir `SIGTERM`.

La verificación del artefacto `linux/amd64` repite la migración 1/0 contra un
PostgreSQL 18.4 en red privada sin puerto público y confirma UI, health checks,
usuario no root y filesystem de sólo lectura.

## Límite de credenciales

La aplicación y el migrador tienen roles lógicos distintos en el contrato. Si
el servicio PostgreSQL nativo de Dokploy entrega un único usuario técnico, la
primera activación puede reutilizar esa credencial únicamente en Preview: el
migrador cambia temporalmente el modo lógico a `migration` y el proceso HTTP
vuelve a `application`. La creación de roles físicos separados queda como
hardening posterior; no autoriza ampliar alcance a otros ambientes.
