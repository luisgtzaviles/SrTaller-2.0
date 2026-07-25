# VC-024 — Comparación de ejecuciones

## Estado

`PASS — materially equivalent`.

## Identidad

- Run autoritativo: `30133959709`, intento `1`, evento `push`.
- Commit: `becb61c98c3bdf51ba9574c985fb071556c9bc8a`.
- Job de comparación: `VC-024 comparison`, ID `89614585427`,
  `2026-07-24T23:35:01Z` a `2026-07-24T23:35:13Z`.
- Artefacto: `vc024-comparison`, ID `8612180267`.
- Artifact ZIP SHA-256:
  `1e5a18d5d8c411b9ccbe0fb6364c2011aa0fa9341e29741fab9283ceda510127`.

## Campos comparados

- commit y contrato;
- Linux, arquitectura y libc;
- toolchain exacto;
- hashes de inputs gobernados;
- comandos y exit codes;
- inventario, tamaño y SHA-256 de cada archivo de `dist/`;
- estado Git inicial/final;
- veredicto semántico.

IDs de job, runner, duración, etiqueta, ref y trigger identifican ejecuciones,
pero no alteran la igualdad semántica.

## Reproducción independiente

Se ejecutó el script versionado `scripts/compare-ci-evidence.mjs` sobre los dos
manifests descargados. La salida recomputada coincide byte a byte con
`COMPARISON.json` del artefacto remoto.

| Medida | run-1 | run-2 |
| --- | --- | --- |
| Hash comparable | `2a348f3c4f4f49f066893310c7d84d1583e2f5c57cda30189d7609da962c4701` | `2a348f3c4f4f49f066893310c7d84d1583e2f5c57cda30189d7609da962c4701` |
| Dist manifest SHA-256 | `ce243b219ec31e52746f10259cac3d3ff5cbf13555b8852f66ca6b0edf4aa9a1` | `ce243b219ec31e52746f10259cac3d3ff5cbf13555b8852f66ca6b0edf4aa9a1` |
| Dist agregado | `56636fb176fb98143ac670c4227b583395629ba915d869928a8fa2b810914af5` | `56636fb176fb98143ac670c4227b583395629ba915d869928a8fa2b810914af5` |
| Veredicto | PASS | PASS |

## Resultado

- **Equivalentes:** Sí.
- **Diferencias materiales:** ninguna.
- **Sanitización:** PASS.
- **Dictamen:** la repetición autoritativa requerida por VC-024 es
  reproducible.
