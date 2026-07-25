# VC-024 — Matriz de trazabilidad

| Contrato | Materialización | Evidencia | Estado |
| --- | --- | --- | --- |
| VC-024: dos ejecuciones limpias | `authoritative-gate` matrix `run-1`/`run-2` | Run `30133959709`, jobs `89614006907` y `89614006837` | PASS |
| Linux `x86_64`/glibc | Preflight bloqueante del workflow | Manifests: Linux x64, glibc 2.39 | PASS |
| Node `24.18.0` / pnpm `11.15.1` | setup-node + Corepack exacto | Manifests y logs | PASS |
| Frozen install | Etapa dedicada | Exit code 0 en ambos jobs | PASS |
| Arquitectura siempre | `pnpm run architecture` y suite dedicada | Logs: 159/159 por ejecución | PASS |
| Typecheck/build/tests/verify | Etapas independientes | Logs y manifests; 171/171 tests/verify | PASS |
| Smoke unitario/compilado | Dos etapas dedicadas | 10/10 y arranque/listener/shutdown compilado | PASS |
| Inspección de `dist/` | `collect-ci-evidence.mjs` | 20 archivos; hash agregado equivalente | PASS |
| No mutación Git | Preflight y postflight | `initialClean` y `finalClean` verdaderos | PASS |
| Equivalencia | `compare-ci-evidence.mjs` | Hash comparable idéntico; cero diferencias | PASS |
| Schema y hashes | Schema canónico + SHA-256 | Tres ZIP y manifests validados | PASS |
| Sanitización | Revisión de JSON y logs | Sin secretos, rutas locales o datos sensibles | PASS |
| DEC051-C01 | Workflow Linux, triggers y artefactos | Run `push` exitoso y evidencia versionada | Satisfied |
| DEC051-C07 | Dos jobs y dictamen VC-024 | [Verificación formal](./FORMAL_VERIFICATION.md) | Satisfied |
| DEC051-C09 | Checker, fixtures, mutaciones y determinismo preservados | Gates dobles y comparación semántica | Satisfied |
| DEC063-C01 | Templates mínimos por tipo | Templates versionados consumidos por el cambio técnico y PR | Satisfied |
| DEC063-C03 | Schema y manifest canónicos | JSON, schema, artefactos y revisión | Satisfied |
| DEC063-C04 | DoD integrado al workflow | Workflow fail-closed y run Linux real | Satisfied |
