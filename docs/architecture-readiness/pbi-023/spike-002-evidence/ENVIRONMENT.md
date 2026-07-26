# Entorno material

## Baseline exacta

| Componente | Versión observada |
|---|---|
| Node.js | `24.18.0` |
| pnpm | `11.15.1` |
| TypeScript | `6.0.3` |
| Kysely | `0.29.4` |
| `pg` | `8.22.0` |
| `@types/pg` | `8.20.0` |
| PostgreSQL | `18.4 (Debian 18.4-1.pgdg13+1)` |
| módulos | ESM |
| resolución TypeScript | `NodeNext` |

El `package.json` experimental fijó versiones exactas, sin `^` ni `~`. El
lockfile experimental se creó y luego se instaló en cada corrida con
`--frozen-lockfile --ignore-scripts`.

## Plataforma

| Elemento | Valor |
|---|---|
| mecanismo | Docker `29.6.2` |
| Compose disponible | `5.3.1` |
| plataforma fijada | `linux/amd64` |
| Node OS/arquitectura | Linux / `x64` |
| Node glibc | `2.36` |
| PostgreSQL OS/arquitectura | Linux / `x86_64` |
| PostgreSQL libc | glibc `2.41` |
| timezone de base | `UTC` |
| encoding | `UTF8` |
| locale | `C.UTF-8` |
| conexiones máximas | `20` |
| puertos publicados al host | `0` |

La máquina host es `arm64`, por lo que ambas imágenes se ejecutaron
explícitamente como `linux/amd64`, la plataforma autoritativa de DEC-004.

## Imágenes inmutables

| Imagen | Digest observado |
|---|---|
| `postgres:18.4` | `sha256:d93de42662696f278fb34354b06fdaa90ad7ca3106d6f72fbd01d16da006d2cf` |
| `node:24.18.0-bookworm-slim` | `sha256:d45d78e7929b46875bbd4e29bea672d5bc48186c6c3588306521c815e78352d6` |

## Configuración sanitizada

- base y usuario con nombres sintéticos por run;
- credencial aleatoria sintética en archivo temporal modo `0600`;
- healthcheck real de PostgreSQL;
- red Docker privada por run;
- volumen efímero por run;
- sin bind de puerto al host;
- application name experimental;
- `statement_timeout` y `lock_timeout` finitos;
- base, red, volumen, archivo de entorno y directorio eliminados en `finally`.

No se conserva connection string, credencial ni variable de entorno completa.
