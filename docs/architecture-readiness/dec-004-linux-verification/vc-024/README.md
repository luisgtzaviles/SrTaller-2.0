# VC-024 — Repetición CI autoritativa

## Estado

- **Estado:** `Closed / PASS`.
- **Fecha de verificación:** `2026-07-24`.
- **Commit verificado:** `becb61c98c3bdf51ba9574c985fb071556c9bc8a`.
- **Run autoritativo:** [Authoritative Linux CI #30133959709](https://github.com/luisgtzaviles/SrTaller-2.0/actions/runs/30133959709), intento `1`, evento `push`.
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
- [Verificación formal](./FORMAL_VERIFICATION.md)

Los logs y manifests producidos por CI se conservan como artefactos del
workflow. Este directorio registra referencias, hashes, revisión y dictamen;
no copia tokens, homes, caches, `node_modules/`, `dist/` ni dumps de entorno.

## Selección de evidencia

Se aceptó exclusivamente el run `30133959709`, disparado por `push` sobre
`refs/heads/ci/vc-024-authoritative-linux-ci` y el commit candidato exacto.
El run de `pull_request` `30134666792` fue rechazado porque evaluó el merge
sintético `3f691c5374cf9bd0f730c3d3e96547c8df0e1bcf` bajo
`refs/pull/1/merge`.

## Regla y resultado de cierre

VC-024 sólo puede pasar a `PASS` cuando ambos jobs terminen verdes, los
manifests comparables sean idénticos, el repositorio permanezca sin mutaciones
y la evidencia quede revisada. Las dos ejecuciones, la comparación y la
revisión formal satisfacen esa regla; VC-024 queda `Closed / PASS`.
