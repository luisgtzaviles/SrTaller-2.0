# SR Taller 2.0 — Current State

## Estado del documento

- **Estado:** Fotografía del inicio autorizado de PBI-028; PBI-026 y G4 están
  cerrados efectivamente.
- **Baseline auditada:** `main` en
  `0b39e3794a97c22d5471c0b6dfa278026f237b03`.
- **CI autoritativo:** run `34161029937`, `SUCCESS`; VC-024 run-1, run-2 y
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
alcance funcional de PIN, su remediación y su cierre pertenecen a `main`;
PBI-025 está `Done`, con Owner Acceptance `APPROVED` y `Released: NO`.
Operational Session pertenece a `main`; PBI-034 está `Done` y G3 está `PASS`
después del cierre PR #34 y su CI exacto. SPRINT-01 quedó cerrado y SPRINT-02
sigue activo. PBI-026 está `Done` después del cierre PR #36 y G4 está `PASS`.
PBI-028 tiene tamaño `Large`, riesgo `High` preservado, threat model, contrato
acotado de auditoría/correlation, DoR `PASS` y Owner Start. Es el único PBI
actual y WIP es `1/1`.

## Git y CI

| Hecho | Estado |
|---|---|
| Baseline | `main` |
| HEAD auditado | `0b39e3794a97c22d5471c0b6dfa278026f237b03` |
| `origin/main` auditado | mismo SHA |
| Divergencia al iniciar reconciliación | `0/0` |
| Working tree al iniciar | limpio |
| CI | `34161029937` SUCCESS |
| Última integración | PR #36 — cierre canónico de PBI-026 |

PR #30 integró el candidate funcional exacto de PBI-025 tras un primer intento
rojo y un rerun verde. La integración fue una desviación de DEC-051/DEC-063,
ratificada expresamente por el Owner sólo para este cierre: se conserva el
primer rojo y no existe waiver general. PR #31 integró la remediación como
`a51ddcca13cfc43fccb77378643b6874dfb772da`; CI `34100056690` quedó GREEN
en el primer intento. PR #32 integró el cierre como
`ccdd7e243265c0f4d19e9798b8ddfa90d97e8c9e`; CI exacto `34124746317` quedó
GREEN en attempt 1. Conforme a la semántica post-merge, PBI-025 está `Done`.
PR #33 integró PBI-034 mediante merge ordinario
`f3e394b59ec7421e13b36ed6bfddff28e45c0dd7` el
`2026-09-07T18:11:35Z`; CI exacto `34150632738` quedó GREEN y la Owner
Acceptance condicional quedó `APPROVED`.
PR #34 integró el cierre documental como
`54ddc251cda8ec7465b7913786c647f8d3ccbeac`; CI exacto `34153470560` quedó
GREEN. Conforme a la semántica post-merge, PBI-034 está `Done`, G3 está
`PASS` y `Released: NO`.

PR #35 integró el candidate PBI-026
`54b3cf01c6b5ae0b51ca0b8f432d23abbb229ab7` mediante merge ordinario
`4db5d9384d13c200eb2031dceb32dd89efcca64d` el
`2026-09-07T20:07:36Z`. Candidate CI `34157187442`, focused Critical-risk
review (`0B/0H/0M/0L`) y exact-main CI `34158203438` quedaron GREEN; la Owner
Acceptance condicional quedó `APPROVED`. PR #36 integró el cierre como
`0b39e3794a97c22d5471c0b6dfa278026f237b03`; CI exacto `34161029937` quedó
GREEN. PBI-026 está `Done`, G4 está `PASS` y `Released: NO`.

## Stack actual

- Node.js `24.18.0`, pnpm `11.15.1`, TypeScript.
- NestJS modular monolith.
- React/Vite en `apps/dev-preview-web`.
- PostgreSQL 18.x, Kysely y migraciones one-shot.
- Imagen OCI mediante Dockerfile.
- CI Linux reproducible con PostgreSQL material, dos runs y comparison.
- Preview/Dokploy existe como ambiente separado; no fue modificado ni
  verificado nuevamente por esta reconciliación.

## PBI-034 cerrado y PBI-026 en cierre

PBI-034 agrega una Session Access-owned stateful con una activa por
Station, bearer opaco y CSRF aleatorios, persistencia sólo de verificadores,
idle timeout de 60 minutos y lifetime absoluto de 12 horas. Materializa
start/resolve/touch/logout/switch, invalidación ante cambios de los predicados
de admisión, superficie HTTP same-origin/no-store, bootstrap de Station sólo
local/test y un gate visible de login/cambio de User en el Application Shell.

DEC-005 Option A quedó materializada como policy v4 únicamente para las
composiciones dirigidas `access->stations` y `access->users`, mediante tokens y
contratos públicos. `SR_SESSION_SIGNING_KEY` permanece reservado y sin
consumidor. Full verify, PostgreSQL 18.4 material, lifecycle HTTP y validación
visual pasaron. El candidato `cdf2805344a5302844a8f7f6f042cb39fbe1515c`
tuvo CI `34149620560` GREEN y focused review PASS con `0`
BLOCKER/HIGH/MEDIUM y `1` LOW. Su merge funcional y CI exacto de `main`
constan arriba; PR #34 y CI `34153470560` completaron el cierre. PBI-026 inició
después con autorización propia y su alcance funcional ya está integrado; no
existe autorización de release o deploy.

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
- Contextual Authorization server-side deny-by-default para lecturas de Repairs
  y Operational Note, con capabilities frescas y scope de recurso efectivo.

## Limitaciones vigentes

- El directorio User tenant-scoped, Roles/Capabilities/Assignments, PIN,
  Operational Session y contextual authorization están integrados. La
  superficie login/logout/switch permanece local.
- Los read models de grants son proyecciones, no veredictos finales de
  autorización. PBI-026 los intersecta server-side con User activo,
  Station/Branch confiable y Session antes de permitir un efecto protegido.
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
- Siguiente dirección: auditoría/correlation mínima y actor real.

## Roadmap y WIP

La fuente canónica es [MVP Operating Roadmap](product/MVP_OPERATING_ROADMAP.md).

| Elemento | Estado |
|---|---|
| Sprint activo | SPRINT-02 — Operational Authentication & Authorization |
| Sprint 01 | Closed — cinco PBIs committed `Done`; ninguno `Released` |
| PBI actual | PBI-028 — Minimum Business Audit and Correlation |
| Siguiente candidato | NONE mientras PBI-028 está en ejecución |
| WIP permitido | Uno; actual `1/1` |

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

PBI-025 tiene threat model, estimación `Large`, DoR `PASS`, riesgo `Critical`
sin downgrade, focused review PASS y Owner Acceptance `APPROVED`. PR #32 y CI
exacto `34124746317` completaron su cierre; está `Done`, `Released: NO`.

PBI-034 está `Done`, tamaño `Large`, riesgo `Critical` y `Released: NO`.
PBI-026 está `Done`, tamaño `Large`, riesgo `Critical`, threat model y DoR
`PASS`, alcance funcional/cierre integrados y G4 `PASS`. El catálogo mínimo autoriza sólo lecturas de
Repairs y Operational Note; las mutaciones sin capability aprobada quedan
deny-by-default. PBI-028 está `In progress`, tamaño `Large`, riesgo `High`, DoR
`PASS` y Owner Start; WIP `1/1`.

## Próxima acción

Completar el candidato PBI-028, focused High-risk review y CI exacto. No iniciar
otro PBI; no existe autorización de release o deploy.
