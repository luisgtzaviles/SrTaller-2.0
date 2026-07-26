# Comparación material

## Push autoritativo

| Campo | Valor |
|---|---|
| run ID | `30185110105` |
| comparison job | `89748812805` |
| commit | `9e38f20900e2be4df7680a936fdfee077e6c6950` |
| comparable run-1 | `c512cdd892be92daafcdd66510dd2a6d5e02d16b9144837d0d431e75bc8d50a7` |
| comparable run-2 | `c512cdd892be92daafcdd66510dd2a6d5e02d16b9144837d0d431e75bc8d50a7` |
| diferencias | ninguna |
| resultado | `success`, `equivalent: true` |

La comparación descargada se reprodujo localmente y el JSON generado fue
idéntico byte a byte al artifact.

## Pull Request

| Campo | Valor |
|---|---|
| run ID | `30185111056` |
| comparison job | `89748807240` |
| artifact commit | `33e886c5bdda06a4f189fd0e0c549930222be873` |
| comparable run-1/run-2 | `60294894518b7fd3c3a5ec81fcddab9016202016672c4439612df8ada8c3d26a` |
| diferencias | ninguna |
| resultado | `success`, `equivalent: true` |

La diferencia entre el comparable global de push y PR se debe al commit/ref
del merge sintético. El comparable PostgreSQL interno es
`6daf3478…` en los cuatro manifests.

## Material comparado

Versión/digest, migración/hash/status, schema/hash/constraints/índices,
inventario y outcomes de tests, aislamiento negativo, cleanup, sanitización y
artefactos. Se normalizan únicamente identidades efímeras, timestamps,
duraciones, puertos y metadatos de ejecución.
