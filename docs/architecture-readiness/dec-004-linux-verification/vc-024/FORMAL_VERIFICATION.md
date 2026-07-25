# Verificación formal de VC-024

## 1. Dictamen

**PASS — VC-024 CLOSED**

La evidencia autoritativa demuestra dos ejecuciones Linux independientes,
limpias y materialmente equivalentes para el commit candidato exacto.

## 2. Fecha y alcance

- Fecha: `2026-07-24`.
- Alcance: evidencia Linux reproducible de DEC-004/VC-024.
- Fuera de alcance: merge, autorización de R0, cierre de Sprint 00,
  funcionalidad, base de datos, SQL, migraciones y deploy.

## 3. Commit candidato

`becb61c98c3bdf51ba9574c985fb071556c9bc8a`

## 4. Rama

`ci/vc-024-authoritative-linux-ci`

## 5. Workflow autoritativo

[Authoritative Linux CI, run 30133959709](https://github.com/luisgtzaviles/SrTaller-2.0/actions/runs/30133959709),
intento `1`, evento `push`, conclusión `success`.

## 6. Selección y rechazo de evidencia

El run aceptado declara el commit candidato, la rama y
`refs/heads/ci/vc-024-authoritative-linux-ci`. El run `pull_request`
`30134666792` fue descartado porque evaluó
`refs/pull/1/merge` y el merge sintético
`3f691c5374cf9bd0f730c3d3e96547c8df0e1bcf`.

## 7. Toolchain

Linux x64, glibc `2.39`, Node.js `24.18.0`, pnpm `11.15.1`, TypeScript
`6.0.3` y NestJS `11.1.28`.

## 8. Ejecución 1

El job `VC-024 run-1` (`89614006907`) concluyó `success` en el runner
independiente `GitHub Actions 1000000027`. El artefacto `vc024-run-1`
(`8612172679`) fue descargado y validado.

## 9. Ejecución 2

El job `VC-024 run-2` (`89614006837`) concluyó `success` en el runner
independiente `GitHub Actions 1000000026`. El artefacto `vc024-run-2`
(`8612176907`) fue descargado y validado.

## 10. Comparación

El job `VC-024 comparison` (`89614585427`) concluyó `success`. El script real
`scripts/compare-ci-evidence.mjs` produjo y reprodujo el mismo hash comparable
en ambos manifests:
`2a348f3c4f4f49f066893310c7d84d1583e2f5c57cda30189d7609da962c4701`.
No existen diferencias materiales.

## 11. Gates

Frozen install, architecture, typecheck, build, tests, test:architecture,
verify, smoke unitario, smoke compilado, inspección de `dist/` y postflight
Git concluyeron con exit code `0` en ambos jobs.

## 12. Conteos

Cada ejecución obtuvo 171/171 tests, 159/159 tests de arquitectura, 171/171
en verify y 10/10 en el smoke unitario.

## 13. Smoke

El smoke compilado verificó arranque desde `dist/`, apertura del listener y
cierre controlado sin error.

## 14. Dist

Los dos inventarios contienen 20 archivos idénticos y el mismo hash agregado:
`56636fb176fb98143ac670c4227b583395629ba915d869928a8fa2b810914af5`.

## 15. Artefactos

| Artefacto | ID | SHA-256 del ZIP |
| --- | --- | --- |
| `vc024-run-1` | `8612172679` | `f7e6dabb9a4c17b6b9c9cce79a93d2e981fe895ea213fdc03b47536fa490e83f` |
| `vc024-run-2` | `8612176907` | `af5aaa78229b5c2bbcd4d642488818e25e1ed3a5ca5cdfd2e534ada134076b29` |
| `vc024-comparison` | `8612180267` | `1e5a18d5d8c411b9ccbe0fb6364c2011aa0fa9341e29741fab9283ceda510127` |

## 16. Schema

Los manifests de ambas ejecuciones validan contra
[`evidence-manifest.schema.json`](../../../delivery/evidence-manifest.schema.json).
Los archivos JSON descargados son válidos y sus campos obligatorios coinciden
con el run autoritativo.

## 17. Integridad

Los ZIP pasaron verificación estructural y sus SHA-256 coinciden con los
digests publicados por GitHub Actions. Los hashes de manifests, inputs
gobernados y archivos de `dist/` están presentes y son consistentes.

## 18. Sanitización

La revisión de manifests y logs no encontró secretos, tokens expuestos, rutas
locales, `file://`, credenciales ni datos sensibles. Las credenciales
gestionadas por Actions aparecen enmascaradas.

## 19. Reproducibilidad

Las ejecuciones usaron runners, checkouts, instalaciones y builds separados.
El resultado semántico y el artefacto compilado son equivalentes.

## 20. Estado de VC-024

Anterior: `In progress / Pending`.

Final: `Closed / PASS`.

## 21. Estado H0

Anterior: `8 cerrados / 1 abierto`.

Final: `9 cerrados / 0 abiertos`; readiness H0 `Complete`.

## 22. Condiciones DEC-051

DEC051-C01, DEC051-C07 y DEC051-C09 quedan `Satisfied` con esta evidencia.
DEC051-C02 a C06, C08 y C10 permanecen `Pending`.

## 23. Condiciones DEC-063

DEC063-C01, DEC063-C03 y DEC063-C04 quedan `Satisfied` con esta evidencia.
DEC063-C02 y DEC063-C05 a C08 permanecen `Pending`.

## 24. Límites de gobierno

R0 permanece no autorizado y Sprint 00 permanece abierto. El cierre de H0 no
omite el gate organizacional ni los contratos transversales H1.

## 25. Conclusión y siguiente acción

VC-024 satisface íntegramente su contrato. La siguiente acción es resolver el
gate organizacional y los contratos H1 aplicables antes de solicitar
autorización explícita para programación funcional de R0.
