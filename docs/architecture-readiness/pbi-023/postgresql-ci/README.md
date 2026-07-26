# PBI-023 — PostgreSQL 18.4 autoritativo en CI

## Dictamen

**PASS — PBI-023 POSTGRESQL CI AUTHORITATIVE**

El commit técnico
`9e38f20900e2be4df7680a936fdfee077e6c6950` ejecutó PostgreSQL `18.4`
real en `VC-024 run-1` y `VC-024 run-2`, tanto para el evento `push` como
para el Pull Request #2. Los dos jobs y su comparación terminaron `success`;
los artefactos descargados validaron contra sus contratos y la comparación
se reprodujo localmente.

## Resultado material

- imagen oficial fijada por digest;
- cinco suites críticas por ejecución;
- diez tests PostgreSQL ejecutados y cero skips críticos por ejecución;
- migración productiva aplicada desde vacío;
- schema `tenants`/`branches` verificado;
- aislamiento tenant negativo verificado;
- cleanup sin recursos gobernados residuales;
- evidencia sanitizada;
- `run-1` y `run-2` materialmente equivalentes.

## Índice

| Documento | Contenido |
|---|---|
| [CI_TOPOLOGY.md](CI_TOPOLOGY.md) | jobs, eventos y flujo fail-closed |
| [POSTGRESQL_SERVICE.md](POSTGRESQL_SERVICE.md) | imagen, lifecycle y health |
| [ENVIRONMENT.md](ENVIRONMENT.md) | toolchain y ambiente observado |
| [SUITE_MATRIX.md](SUITE_MATRIX.md) | suites, triggers y resultados |
| [SKIP_POLICY.md](SKIP_POLICY.md) | política de cero skips críticos |
| [RUN_1.md](RUN_1.md) | evidencia remota del primer run |
| [RUN_2.md](RUN_2.md) | evidencia remota del segundo run |
| [COMPARISON.md](COMPARISON.md) | equivalencia material |
| [ARTIFACTS.md](ARTIFACTS.md) | inventario y hashes |
| [CLEANUP.md](CLEANUP.md) | teardown y residuos |
| [SECURITY.md](SECURITY.md) | credenciales sintéticas y sanitización |
| [RESULTS.md](RESULTS.md) | checklist y dictamen |
| [TRACEABILITY_MATRIX.md](TRACEABILITY_MATRIX.md) | requisitos y decisiones |
| [EVIDENCE_MANIFEST.json](EVIDENCE_MANIFEST.json) | manifest consolidado |

## Autoridad

La evidencia autoritativa es el evento `push` sobre el SHA de rama
`9e38f20900e2be4df7680a936fdfee077e6c6950`. El evento
`pull_request` informa ese mismo `headSha` en GitHub, pero sus artefactos
corresponden al merge sintético
`33e886c5bdda06a4f189fd0e0c549930222be873`; se conserva como evidencia
secundaria y no sustituye al push.

## Alcance preservado

No se crearon tablas, migraciones, endpoints, controllers, módulos,
dependencias, roles productivos ni capacidades de negocio. El PR #2 permanece
Draft. No hubo merge, deploy, SSH ni force push.
