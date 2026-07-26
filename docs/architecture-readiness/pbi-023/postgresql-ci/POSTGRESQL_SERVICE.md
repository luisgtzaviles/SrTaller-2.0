# Servicio PostgreSQL

## Imagen gobernada

| Campo | Valor observado |
|---|---|
| referencia | `postgres@sha256:d93de42662696f278fb34354b06fdaa90ad7ca3106d6f72fbd01d16da006d2cf` |
| digest | `sha256:d93de42662696f278fb34354b06fdaa90ad7ca3106d6f72fbd01d16da006d2cf` |
| PostgreSQL server | `18.4 (Debian 18.4-1.pgdg13+1)` |
| cliente `psql` | `18.4 (Debian 18.4-1.pgdg13+1)` |
| OS/arquitectura | `linux/amd64` |
| encoding | `UTF8` |
| timezone | `UTC` |
| locale | `en_US.utf8` |

## Lifecycle

Cada suite crea su propio contenedor, base y credencial sintética, espera
salud con polling y timeout finito, ejecuta su contrato y destruye el
contenedor. No hay volumen, red dedicada ni data directory persistente. La
orquestación verifica además que el label del run no conserve contenedores.

Las bases no se comparten entre suites, jobs, eventos o runs. Los puertos son
efímeros y no forman parte de la comparación material.

## Roles

Las suites usan una identidad sintética efímera por lifecycle. La capacidad de
migrar sólo se habilita en las suites de migración, schema y adapters. Esto
prueba separación de modo, pero no pretende fijar privilegios productivos:
DEC050-C06 conserva pendiente el diseño operacional de roles/provider/rotación.

## Health y timeouts

El pull de imagen tiene límite de `180 s`; inspección, health/lifecycle y
ejecuciones usan límites finitos, y cada suite tiene un máximo de `240 s`.
La falla de startup, versión, digest o cleanup bloquea el job.
