# VC-024 — Matriz de trazabilidad

| Contrato | Materialización | Evidencia | Estado |
| --- | --- | --- | --- |
| VC-024: dos ejecuciones limpias | `authoritative-gate` matrix `run-1`/`run-2` | Runs y artifacts | Pending |
| Linux `x86_64`/glibc | Preflight bloqueante del workflow | Manifest por ejecución | Pending |
| Node `24.18.0` / pnpm `11.15.1` | setup-node + Corepack exacto | Manifest y logs | Pending |
| Frozen install | Etapa dedicada | Log y exit code | Pending |
| Arquitectura siempre | `pnpm run architecture` y suite dedicada | Logs | Pending |
| Typecheck/build/tests/verify | Etapas independientes | Logs y manifest | Pending |
| Smoke unitario/compilado | Dos etapas dedicadas | Logs y manifest | Pending |
| Inspección de `dist/` | `collect-ci-evidence.mjs` | `DIST_MANIFEST.json` | Pending |
| No mutación Git | Preflight y postflight | Manifest | Pending |
| Equivalencia | `compare-ci-evidence.mjs` | `COMPARISON.json` | Pending |
| DEC051-C01 | Workflow Linux y artefactos | Runs | Pending |
| DEC051-C07 | Dos jobs y dictamen VC-024 | Este paquete | Pending |
| DEC051-C09 | Checker, fixtures y mutaciones preservados | Gates dobles | Pending |
| DEC063-C01 | Templates PR/cambio técnico | Archivos versionados | Pending |
| DEC063-C03 | Schema y manifest canónicos | JSON + artefactos | Pending |
| DEC063-C04 | DoD integrado al workflow | Workflow y runs | Pending |
