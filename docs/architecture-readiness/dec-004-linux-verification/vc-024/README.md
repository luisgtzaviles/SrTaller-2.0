# VC-024 — Repetición CI autoritativa

## Estado

- **Estado:** `In progress`.
- **Contrato:** [DEC-004 VC-024](../../../decisions/dec-004-toolchain-contract/VERIFICATION_CONTRACT.md#matriz-obligatoria).
- **Gate CI:** [DEC-051](../../../decisions/dec-051-testing-ci-strategy/DECISION_PROPOSAL.md#30-evidencia-de-vc-024).
- **Definition of Done:** [DEC-063](../../../decisions/dec-063-definition-of-done/DECISION_PROPOSAL.md).
- **R0:** no autorizado.
- **Sprint 00:** abierto.

## Propósito

Conservar evidencia sanitizada de dos jobs Linux `x86_64`/GNU glibc,
independientes y limpios, ejecutados contra el mismo commit con Node.js
`24.18.0`, pnpm `11.15.1`, instalación frozen, gates obligatorios, smoke
compilado e inventarios SHA-256 equivalentes.

## Contenido

- [Manifest consolidado](./EVIDENCE_MANIFEST.json)
- [Ejecución 1](./RUN_1.md)
- [Ejecución 2](./RUN_2.md)
- [Comparación](./COMPARISON.md)
- [Resultados](./RESULTS.md)
- [Matriz de trazabilidad](./TRACEABILITY_MATRIX.md)

Los logs y manifests producidos por CI se conservan como artefactos del
workflow. Este directorio registra referencias, hashes, revisión y dictamen;
no copia tokens, homes, caches, `node_modules/`, `dist/` ni dumps de entorno.

## Regla de cierre

VC-024 sólo puede pasar a `Pass` cuando ambos jobs terminen verdes, los
manifests comparables sean idénticos, el repositorio permanezca sin mutaciones
y la evidencia quede revisada. Un único job, una reejecución que oculte un
fallo o una diferencia material produce `FAIL` o `BLOCKED`.
