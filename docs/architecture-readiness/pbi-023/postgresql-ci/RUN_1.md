# Run autoritativo 1

## Push

| Campo | Valor |
|---|---|
| workflow run | `30185110105` |
| job | `89748256832` — `VC-024 run-1` |
| evento | `push` |
| commit | `9e38f20900e2be4df7680a936fdfee077e6c6950` |
| attempt | `1` |
| inicio/fin | `2026-07-26T02:47:13Z` / `2026-07-26T02:55:11Z` |
| PostgreSQL step | `2026-07-26T02:47:37Z`–`02:48:03Z` |
| resultado | `success` |

PostgreSQL reportó cinco suites, diez tests, cero skips críticos, migración,
schema, aislamiento, sanitización y cleanup `PASS`. El comparable PostgreSQL
fue `6daf3478d4b9bb3ead212f46455516d8a1c6ed68b289f59996bcf5986695760e`.

## Pull Request

| Campo | Valor |
|---|---|
| workflow run | `30185111056` |
| job | `89748259605` — `VC-024 run-1` |
| head SHA remoto | `9e38f20900e2be4df7680a936fdfee077e6c6950` |
| artifact commit | `33e886c5bdda06a4f189fd0e0c549930222be873` |
| resultado | `success` |

El artifact commit es el merge sintético `refs/pull/2/merge`; no se usa como
evidencia autoritativa del SHA de rama. Su material PostgreSQL coincide con el
push.
