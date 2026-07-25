# VC-024 — Ejecución 1

## Estado

`PASS`.

## Identidad

| Campo | Valor |
| --- | --- |
| Commit | `becb61c98c3bdf51ba9574c985fb071556c9bc8a` |
| Workflow run | [30133959709](https://github.com/luisgtzaviles/SrTaller-2.0/actions/runs/30133959709), intento `1`, `push` |
| Ref | `refs/heads/ci/vc-024-authoritative-linux-ci` |
| Job | `VC-024 run-1`, ID `89614006907` |
| Runner | GitHub-hosted `GitHub Actions 1000000027` |
| Inicio / fin UTC | `2026-07-24T23:30:26Z` / `2026-07-24T23:34:42Z` |
| Artefacto | `vc024-run-1`, ID `8612172679`, 3,435 bytes |
| Expiración del artefacto | `2026-08-23T23:34:37Z` |
| Artifact ZIP SHA-256 | `f7e6dabb9a4c17b6b9c9cce79a93d2e981fe895ea213fdc03b47536fa490e83f` |
| Evidence manifest SHA-256 | `74e86a2307a427ce56c37b22e187cae29d5663ce59fe94e922d5f96b23f0251d` |
| Dist manifest SHA-256 | `ce243b219ec31e52746f10259cac3d3ff5cbf13555b8852f66ca6b0edf4aa9a1` |
| Job log SHA-256 | `18cb063d73717c009e185af2b5d903eb2b2f9b09589540e9dadbc3de7aee9a7f` |

## Entorno y toolchain

- Ubuntu `24.04.4`, Linux `x64`, GNU glibc `2.39`;
- Node.js `24.18.0`;
- pnpm `11.15.1`;
- TypeScript `6.0.3`;
- NestJS `11.1.28`;
- checkout, dependencias y build propios, sin cache compartida.

## Validaciones

| Validación | Resultado |
| --- | --- |
| Checkout exacto y preflight limpio | PASS |
| `pnpm install --frozen-lockfile` | PASS |
| `pnpm run architecture` | PASS |
| `pnpm run typecheck` | PASS |
| `pnpm run build` | PASS |
| `pnpm test` | PASS — 171/171 |
| `pnpm run test:architecture` | PASS — 159/159 |
| `pnpm run verify` | PASS — 171/171 |
| Smoke unitario | PASS — 10/10 |
| `pnpm run smoke:start` | PASS |
| Inspección de `dist/` | PASS — 20 archivos |
| Postflight Git limpio | PASS |

## Resultado

El job concluyó `success`; los 11 comandos declarados tienen exit code `0`.
El manifest valida contra el schema canónico, no contiene secretos ni rutas
locales y registra `verdict: PASS`. El `dist` tiene hash agregado
`56636fb176fb98143ac670c4227b583395629ba915d869928a8fa2b810914af5`.
