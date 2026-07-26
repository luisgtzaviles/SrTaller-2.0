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

Las identidades de base, usuario, puerto y contenedor son efímeras y no se
retienen. Se derivan del run/job/attempt/label con caracteres válidos. Los
manifests sólo indican que existen cinco bases aisladas por ejecución; no
publican connection strings ni credenciales.

## Reproducibilidad

`run-1` y `run-2` usan el mismo commit, lockfile, toolchain, imagen y contratos,
pero no comparten estado. El hash comparable PostgreSQL fue
`6daf3478d4b9bb3ead212f46455516d8a1c6ed68b289f59996bcf5986695760e`
en los cuatro jobs remotos.
