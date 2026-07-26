# Metadata de paquetes

## Fuente y baseline

La metadata se consultó el 2026-07-25 UTC con `pnpm view` contra el registro
oficial de npm antes de instalar. La baseline ejecutada fue Node.js `24.18.0`,
pnpm `11.15.1` y TypeScript `6.0.3`.

| Paquete | Versión | Engines | Dependencias directas declaradas | Peers/optional | Licencia |
|---|---:|---|---|---|---|
| `kysely` | `0.29.4` | Node `>=22.0.0` | ninguna | ninguno | MIT |
| `pg` | `8.22.0` | Node `>=16.0.0` | `pg-connection-string`, `pg-pool`, `pg-protocol`, `pg-types`, `pgpass`, `pg-cloudflare` | `pg-native >=3.0.1` peer opcional; `pg-cloudflare` opcional | MIT |
| `@types/pg` | `8.20.0` | no declara | `@types/node`, `pg-protocol`, `pg-types` | ninguno | MIT |

Los tres engines son compatibles con Node.js `24.18.0`. `@types/pg` expone
tipos de desarrollo y por ello está en `devDependencies`; Kysely y `pg` son
dependencias runtime. El proyecto ya exige versiones exactas mediante
`.npmrc`, y no se cambió ese criterio.

## Integridades directas

| Paquete | Integridad publicada y fijada |
|---|---|
| `kysely@0.29.4` | `sha512-y5mVgQNkMbs1eK9Xyc0pmNdabN2wHhRYY/5r4W5HrUT1rYCEPeVNSj1RUJeSDKT3U0p+mXCvLgkrFuIafYI6BA==` |
| `pg@8.22.0` | `sha512-8wih1vVIBMxoUM2oB4soJsD9tDnDpLv4OXBJ+EJzFsvycD+lfyIreC2gGHq78f8jbLLt+bvlPTFdFZfJkOuzAA==` |
| `@types/pg@8.20.0` | `sha512-bEPFOaMAHTEP1EzpvHTbmwR8UsFyHSKsRisLIHVMXnpNefSbGA1bD6CVy+qKjGSqmZqNqBDV2azOBo8TgkcVow==` |

Los valores publicados coinciden con `pnpm-lock.yaml`. Los tarballs resuelven
al registro público de npm; no se versiona una URL de descarga ni se usó un
registro alternativo.

## Scripts y artefactos

Ninguno de los tres manifests contiene `preinstall`, `install`, `postinstall`
o `prepare`; tampoco declara `bin`, `gypfile` o metadata de binario nativo.
Los scripts de desarrollo publicados por Kysely y `pg` no son lifecycle de
instalación y no se ejecutaron. El detalle del cierre completo está en
[LIFECYCLE_SCRIPTS.md](LIFECYCLE_SCRIPTS.md).

## Estado

- versiones existentes y exactas: PASS;
- integridad disponible: PASS;
- engines compatibles: PASS;
- ubicación runtime/dev: PASS;
- versiones deprecated: ninguna reportada;
- sustitución por versiones más recientes: no realizada.
