# Registro histórico del hash material incorrecto

Este registro preserva el valor publicado por el HEAD documental
`1587c328e18b9c177da45307409fc36f8551c26c` sin presentarlo como evidencia
vigente.

| Campo | Evidencia histórica |
| --- | --- |
| valor publicado | `30f5728e70fd74ac1b1fed10d457c6c2d385356055578262671fb1735647d8c6` |
| valor material autoritativo | `6e62a2b318e1b0c3067e6dea2715e1767e86f81ba422bc080ce65279de12c589` |
| artifacts afectados | ninguno; los artifacts conservaban el material correcto |
| causa | se volvió a hashear el objeto-resumen comparable |
| clasificación | metadata documental incorrecta |

`comparableStationMutationManifest(manifest)` ya devuelve el campo
`materialSha256`, calculado por el generador sobre
`JSON.stringify(material)` después de retirar únicamente `durationMs`. El
valor histórico se obtuvo aplicando SHA-256 otra vez a
`JSON.stringify(comparableStationMutationManifest(manifest))`; por eso es el
hash del resumen, no el hash del material.

La reproducción sobre el artifact técnico `vc024-run-1` produce:

```text
comparableStationMutationManifest(manifest).materialSha256
= 6e62a2b318e1b0c3067e6dea2715e1767e86f81ba422bc080ce65279de12c589

sha256(JSON.stringify(comparableStationMutationManifest(manifest)))
= 30f5728e70fd74ac1b1fed10d457c6c2d385356055578262671fb1735647d8c6
```

La corrección no altera manifests descargados, resultados causales ni código
funcional. Las referencias vigentes usan exclusivamente el valor material
devuelto por el generador.
