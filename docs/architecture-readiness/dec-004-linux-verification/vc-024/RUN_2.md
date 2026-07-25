# VC-024 — Ejecución 2

## Estado

`PASS`.

## Identidad

| Campo | Valor |
| --- | --- |
| Commit | `becb61c98c3bdf51ba9574c985fb071556c9bc8a` |
| Workflow run | [30133959709](https://github.com/luisgtzaviles/SrTaller-2.0/actions/runs/30133959709), intento `1`, `push` |
| Ref | `refs/heads/ci/vc-024-authoritative-linux-ci` |
| Job | `VC-024 run-2`, ID `89614006837` |
| Runner | GitHub-hosted `GitHub Actions 1000000026` |
| Inicio / fin UTC | `2026-07-24T23:30:25Z` / `2026-07-24T23:34:57Z` |
| Artefacto | `vc024-run-2`, ID `8612176907`, 3,436 bytes |
| Expiración del artefacto | `2026-08-23T23:34:55Z` |
| Artifact ZIP SHA-256 | `af5aaa78229b5c2bbcd4d642488818e25e1ed3a5ca5cdfd2e534ada134076b29` |
| Evidence manifest SHA-256 | `fec9122880924f438b5ac359836c5e488c6744561ff89ac531f476ea34596c27` |
| Dist manifest SHA-256 | `ce243b219ec31e52746f10259cac3d3ff5cbf13555b8852f66ca6b0edf4aa9a1` |
| Job log SHA-256 | `9e2351fb1a9cf2d0d801c6eda13ba9d90f6711cf6cf3b3fde3b5fb26dfcae25c` |

## Independencia

El job usó un runner GitHub-hosted distinto, checkout propio, `node_modules`
propio y ninguna caché de dependencias o build compartida con `run-1`.

## Entorno y validaciones

El entorno y toolchain coinciden exactamente con `run-1`: Ubuntu `24.04.4`,
Linux `x64`, glibc `2.39`, Node.js `24.18.0`, pnpm `11.15.1`, TypeScript
`6.0.3` y NestJS `11.1.28`.

Los 11 comandos declarados terminaron con exit code `0`: frozen install,
arquitectura, typecheck, build, 171/171 tests, 159/159 tests de arquitectura,
171/171 en verify, 10/10 smoke unitario, smoke compilado, inspección de
`dist/` y `git diff --check`. El repositorio estuvo limpio al inicio y al
final.

## Resultado

El job concluyó `success`; el manifest valida contra el schema canónico, está
sanitizado y registra `verdict: PASS`. Los 20 archivos de `dist/` producen el
mismo hash agregado que `run-1`:
`56636fb176fb98143ac670c4227b583395629ba915d869928a8fa2b810914af5`.
