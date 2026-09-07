# SR Taller 2.0 — Current State

## Estado del documento

- **Estado:** Fotografía reconciliada de la baseline canónica.
- **Baseline auditada:** `main` en
  `a51ddcca13cfc43fccb77378643b6874dfb772da`.
- **CI autoritativo:** run `34100056690`, `SUCCESS`; VC-024 run-1, run-2 y
  comparison verdes sobre el mismo SHA.
- **Regla:** este documento describe estado; no autoriza implementación,
  merge, deploy, migración o infraestructura.

## Resumen ejecutivo

SR Taller 2.0 tiene una foundation técnica ejecutable y un Repair Workstream
local integrado. D5 Technician Assignment, D6.1 Start Diagnosis y D6.2 Internal
Physical Location pertenecen a `main` y tienen CI verde.

Repairs no está completo ni listo para operación productiva. Trusted Station
Runtime Context, User Directory and Lifecycle y Roles, Assignments and
Capability Catalog están cerrados canónicamente; G1 y G2 están `PASS`. El
alcance funcional de PIN y su remediación de determinismo pertenecen a
`main`; PBI-025 es `Done candidate` con Owner Acceptance condicional
`APPROVED` y cierre documental pendiente. Operational Session y contextual
authorization aún no pertenecen a `main`. SPRINT-01 quedó cerrado y SPRINT-02
está activo sin PBI actual; PBI-034 está seleccionado, no iniciado.

## Git y CI

| Hecho | Estado |
|---|---|
| Baseline | `main` |
| HEAD auditado | `a51ddcca13cfc43fccb77378643b6874dfb772da` |
| `origin/main` auditado | mismo SHA |
| Divergencia al iniciar reconciliación | `0/0` |
| Working tree al iniciar | limpio |
| CI | `34100056690` SUCCESS |
| Última integración | PR #31 — remediación del gate Critical de PBI-025 |

PR #30 integró el candidate funcional exacto de PBI-025 tras un primer intento
rojo y un rerun verde. La integración fue una desviación de DEC-051/DEC-063,
ratificada expresamente por el Owner sólo para este cierre: se conserva el
primer rojo y no existe waiver general. PR #31 integró la remediación como
`a51ddcca13cfc43fccb77378643b6874dfb772da`; CI `34100056690` quedó GREEN
en el primer intento.

## Stack actual

- Node.js `24.18.0`, pnpm `11.15.1`, TypeScript.
- NestJS modular monolith.
- React/Vite en `apps/dev-preview-web`.
- PostgreSQL 18.x, Kysely y migraciones one-shot.
- Imagen OCI mediante Dockerfile.
- CI Linux reproducible con PostgreSQL material, dos runs y comparison.
- Preview/Dokploy existe como ambiente separado; no fue modificado ni
  verificado nuevamente por esta reconciliación.

## Capacidades integradas

### Platform foundation

- Tenants y Branches persistentes.
- Users, Roles, catálogo de capabilities y assignments tenant/Branch-scoped;
  PBI-033 está `Done` y G2 `PASS`.
- Health `/livez` y readiness `/readyz`.
- Propiedad modular y acceso a persistencia gobernados.
- Desarrollo local con PostgreSQL, migración y seed sintético.

### UI foundation

- Design System y Application Shell V1.
- Temas Light/Dark, Brand System, navegación y responsive.
- Worklist y Repair Detail operational workspace.
- PBI-030: `Done`; Owner Acceptance `APPROVED`, riesgo AT/cross-browser LOW
  aceptado y `Released: NO`.

### Repairs

- Worklist, búsqueda y filtros.
- Detail, intake read model y timeline.
- Evidencias locales y contenido rehidratable.
- Operational Note append-only.
- D5 asignación, reasignación y desasignación de técnico.
- D6.1 transición `pending → diagnosing`.
- D6.2 movimiento `pending_area → workshop`.
- Idempotencia, versiones, concurrencia e aislamiento tenant/branch aplicables.

## Limitaciones vigentes

- El directorio User tenant-scoped y Roles/Capabilities/Assignments están
  integrados; la baseline contiene la credencial PIN separada y su prueba
  efímera server-side, pero todavía no contiene Operational Session y no
  existe superficie HTTP/UI productiva de login, Users o Roles.
- Los read models de grants son proyecciones, no veredictos finales de
  autorización. PBI-026 debe intersectarlos con User activo, Station/Branch
  confiable y sesión antes de permitir un efecto protegido.
- Trusted Station Runtime Context está `Done` canónico; no incorpora enrollment
  productivo ni administración completa de bindings.
- `LocalRepairContext` sólo habilita contexto fijo en desarrollo.
- Writes de Repairs integrados todavía registran actor sintético.
- New Repair es una superficie visual, no un write productivo persistente.
- No existen Customers, Pricing Catalog, Quote, Payments, Cash o Delivery
  completos.
- No existe Production materializada ni autorización de deploy en esta tarea.

## Checkpoint de producto

`REPAIRS OPERATIONAL FOUNDATION CHECKPOINT REACHED`

- D5: integrated.
- D6.1: integrated.
- D6.2: integrated.
- Repairs complete: NO.
- Siguiente dirección: Operational Authentication & Authorization.

## Roadmap y WIP

La fuente canónica es [MVP Operating Roadmap](product/MVP_OPERATING_ROADMAP.md).

| Elemento | Estado |
|---|---|
| Sprint activo | SPRINT-02 — Operational Authentication & Authorization |
| Sprint 01 | Closed — cinco PBIs committed `Done`; ninguno `Released` |
| PBI actual | NONE; WIP `0/1` |
| Siguiente candidato | PBI-034 — Operational Session; candidato, no iniciado |
| WIP permitido | Uno; actual `0/1` |

PBI-030 tiene implementación, independent review, merge, CI y Owner Acceptance
aprobados. Su [auditoría final](quality/evidence/pbi-030/FINAL_CLOSURE_AUDIT.md)
registra la cobertura AT/cross-browser formal pendiente como
`Bajo (LOW) — ACCEPTED RESIDUAL QUALITY RISK`. No está `Released` y no bloquea
la preparación de PBI-027; su evidencia canónica preserva esta fotografía.

PBI-027 quedó `Done` canónico al integrar PR #20; `Released: NO`. PBI-029 quedó
`Done` al combinar su merge funcional `36d93736d46b69acadadd95ef66809332fbb5bd4`,
CI `33974100385` GREEN, focused security review PASS, riesgo `CRITICAL`
aceptado, Owner Acceptance APPROVED, PR #22 merge
`41914c78724303d66136989937cf8f38e4ea8a88` y CI post-cierre `33988752597`
GREEN. `Released: NO`. PBI-024 quedó `Done` canónico mediante PR #25, merge
`2b0ab85bb19b795c71332b5f2ef36ee26a75cdfe` y CI `34044488745` GREEN;
`Released: NO`.

PBI-032 integró el candidato funcional
`326a11802a4be32970d4e0634a61841b6bcb9b86` mediante PR #26, merge
`66aebdbb45f368755107db315772654bee5399a3`; CI de candidato `34072027504` y
CI de `main` `34072709330` quedaron GREEN en run-1, run-2 y comparison. La
focused review fue PASS y la Owner Acceptance condicional quedó satisfecha.
PR #27 integró su cierre como
`db6637ee6902b9b0e4a40ba39d7f203cb6889352`; CI post-cierre `34074457695`
quedó GREEN. Conforme a la semántica post-merge, PBI-032 está `Done` canónico
y `Released: NO`.

PBI-033 integró el candidate revisado
`bb5a1efde19171703d0b3ce84567ff14538b32b7` mediante PR #28, merge
`065b859e3db64f82f033ce75ce5fb33df9b3ade1` a las
`2026-09-07T04:15:05Z`; CI de candidato `34081637692` y CI exacto de `main`
`34082394514` quedaron GREEN en run-1, run-2 y comparison. La focused
high-risk review fue PASS con hallazgos abiertos BLOCKER/HIGH/MEDIUM: 0; la
Owner Acceptance condicional quedó satisfecha. PR #29 integró el cierre como
`d1a98c6d158cf53e1718a75c82f8eafbc3aafaf1` y su CI exacto de `main`
`34084930812` quedó GREEN. Conforme a la semántica post-merge, PBI-033 está
`Done`, G2 está `PASS` y `Released: NO`. El límite residual de proyección de
grants se conserva como LOW.

## Identity Foundation reconciliada

- PBI-024 — Trusted Station Runtime Context.
- PBI-027 — Branch Timezone Minimum.
- PBI-029 — Secrets and External Configuration.
- PBI-032 — User Directory and Lifecycle.
- PBI-033 — Roles, Assignments and Capability Catalog.
- PBI-025 — PIN Credential Authentication.
- PBI-034 — Operational Session.
- PBI-026 — Contextual Authorization.
- PBI-028 — Minimum Business Audit and Correlation.
- PBI-031/PBI-035/PBI-036 conservan administración completa, autorización
  reforzada y observabilidad extendida como slices separados.

## Impacto remoto de esta reconciliación

- Deploy: NO.
- Preview: sin cambios.
- Dokploy: sin cambios.
- PostgreSQL remoto: sin cambios.
- DNS/secrets/infraestructura: sin cambios.

## Ejecución vigente

PBI-025 tiene threat model, estimación `Large`, DoR `PASS` y riesgo
`Critical` sin downgrade. Su alcance y remediación están integrados; focused
review PASS y CI first-attempt GREEN respaldan Owner Acceptance condicional
`APPROVED`. Es `Done candidate` hasta integrar su cierre documental. El PBI
no incorpora login, Session ni autorización.

## Próxima acción

Integrar el único PR documental de cierre de PBI-025. PBI-034 permanece
seleccionado, no iniciado, y requiere DoR y Owner Start propios.
