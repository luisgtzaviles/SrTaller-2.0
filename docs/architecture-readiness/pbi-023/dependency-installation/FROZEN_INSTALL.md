# Instalaciones frozen reproducibles

## Procedimiento

1. Se instalaron únicamente las tres versiones exactas autorizadas.
2. Se ejecutaron todos los gates.
3. Se limpió `dist` y se eliminó sólo `node_modules`.
4. Se ejecutó `pnpm install --frozen-lockfile` y todos los gates.
5. Se repitió la limpieza, frozen install y todos los gates.
6. No se eliminó caché global ni se levantó PostgreSQL o Docker.

## Resultados

| Evidencia | Instalación limpia 1 | Instalación limpia 2 |
|---|---|---|
| lock policy | PASS | PASS |
| lockfile frozen/up to date | PASS | PASS |
| paquetes | 121 | 121 |
| reutilizados | 121 | 121 |
| descargados | 0 | 0 |
| `preinstall` propio | PASS | PASS |
| manifest modificado por install | no | no |
| lockfile modificado por install | no | no |
| architecture | PASS | PASS |
| typecheck | PASS | PASS |
| build | PASS | PASS |
| tests | PASS — 219/219 | PASS — 219/219 |
| architecture tests | PASS — 207/207 | PASS — 207/207 |
| verify | PASS | PASS |
| smoke | PASS | PASS |
| whitespace | PASS | PASS |

## Hashes

| Artefacto | Antes de clean 1 | Después de clean 1 | Después de clean 2 |
|---|---|---|---|
| `package.json` | `18b4a198effb890d7806b0426cc73df7a19ef306e40fa67f04fdcb118e663d84` | igual | igual |
| `pnpm-lock.yaml` | `2fde645e039107249348ff4f66510220383341635fa18c8fe3ec7ff0219611f7` | igual | igual |
| grafo completo | `b1d7235ae9909ceee9fff81e850e5ab899996963cf8ec2915bbdf8d769fcf8dc` | mismo lock/cierre de 121 paquetes | igual |

El frozen install no resolvió versiones nuevas ni reescribió el lockfile.

## Superficies preservadas

Se calculó un inventario SHA-256 canónico de `path + NUL + contenido + NUL`
contra el commit base y contra el working tree:

| Superficie | Archivos | SHA-256 antes/después |
|---|---:|---|
| `src/` | 10 | `a03377c37fdab1f995ebf726fe174f2f47b9dfcd5fbc4c3f25a2971c268e6a6c` |
| workflows | 1 | `155774e2d2fed2f1e74e1a58727cea749c06d1b22c678e258e56296a60759575` |
| scripts técnicos | 13 | `b26a63eab7abb1b9374f66b18a60029df68fb5efe70cfef994e24842e7eec288` |
| tests | 15 | `e638fa8630a04522170aca0223a916ea9f3901084b501cce28649fa912ff48ad` |
| tsconfig | 2 | `4ac0e5709490bfa53440be5c75eafa7a411aab3b49f2c143220ad3871db68276` |
| checker | 1 | `a2de6b545324809acd770a0e5fa2e2af67c746eced03e1613e17c0206536e167` |
| policy | 1 | `3f8f8914bc948153f7758f70a2737f30359d292056d59b8afccc5ea331338a34` |
| Dockerfile gobernado | 1 | `5e73adacd2d1d5bfba1d5a625d8617e05ce74036428c3c90ec2b4affab43624c` |
| migraciones productivas | 0 | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` |

## Reversibilidad

La instalación no creó datos ni recursos externos. Se revierte restaurando
`package.json` y `pnpm-lock.yaml` mediante Git y regenerando `node_modules`.
