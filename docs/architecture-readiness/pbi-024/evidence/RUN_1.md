# Run 1 autoritativo

| Campo | Valor |
| --- | --- |
| workflow run/job | `30224399646` / `89852148911` |
| evento/ref | `push` / `r0/pbi-024-trusted-station-context` |
| commit | `3b7a852873147377b9552464dc9df3da2737f4fa` |
| label/attempt | `run-1` / `1` |
| PostgreSQL | `18.4` |
| suites/tests | 6 / 11 |
| skips críticos | 0 |
| cleanup | PASS |
| comparable SHA-256 | `16cfb89dd2b603a95f53683e9314c0fa4de835ff20330d6eef23f85c93ecfaa6` |
| artifact | `vc024-run-1`, ID `8638222362` |
| evidence SHA-256 | `33bf0e0d2c07bac5ec4d163086984a6c7c6c1b12439cc0e7a88a20f96bdd02b4` |
| PostgreSQL SHA-256 | `47cda1a07f8ed531244eba20a89c28b88b55e1b0cc674f652d5378611e225789` |
| dist SHA-256 | `18ea64d087f983be60c373810cde43c0693f287f1d575bfb3d48aa8644fb920c` |
| resultado | SUCCESS |

El run anterior `30223956168` no es evidencia de PASS: su primer attempt falló
en `docker pull` y el segundo expuso que el wrapper suprimía el diagnóstico de
la suite Station. Se agregó diagnóstico sanitizado y el nuevo SHA ejecutó el
gate completo sin retry interno.
