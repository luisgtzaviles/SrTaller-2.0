# Ambiente autoritativo

## Toolchain

| Componente | Valor |
|---|---|
| runner | GitHub-hosted Linux |
| OS de evidencia | `linux` |
| arquitectura Node | `x64` |
| glibc | `2.39` |
| Node.js | `24.18.0` |
| pnpm | `11.15.1` |
| TypeScript | `6.0.3` |
| NestJS | `11.1.28` |
| PostgreSQL | `18.4` |
| imagen PostgreSQL | `linux/amd64`, digest exacto |

## Identidad de datos

Las identidades de base, usuario, puerto y contenedor son sintéticas, efímeras
y se generan durante la ejecución. Contenedor y base reciben un sufijo
aleatorio; el password también es sintético y aleatorio; el nombre de usuario
es sintético y específico del harness, y Docker asigna un puerto efímero. No
son identidades productivas, no se reutilizan como credenciales estables y no
se derivan determinísticamente de run/job/attempt.

Run, job, attempt y label se registran por separado para trazabilidad; el
label gobierna además la verificación de cleanup. Cada suite conserva su
contenedor y base independientes. Los manifests no publican connection
strings, passwords ni secretos productivos.

## Reproducibilidad

`run-1` y `run-2` usan el mismo commit, lockfile, toolchain, imagen y contratos,
pero no comparten estado. El hash comparable PostgreSQL fue
`6daf3478d4b9bb3ead212f46455516d8a1c6ed68b289f59996bcf5986695760e`
en los cuatro jobs remotos.
