# SR Taller 2.0 — Current State

## Estado del documento

- **Estado:** Fotografía reconciliada de la baseline canónica.
- **Baseline auditada:** `main` en
  `4d54f84e8ad4b16b2889a555f7fc75975c6ddc68`.
- **CI autoritativo:** run `33944664589`, `SUCCESS`; VC-024 run-1, run-2 y
  comparison verdes sobre el mismo SHA.
- **Regla:** este documento describe estado; no autoriza implementación,
  merge, deploy, migración o infraestructura.

## Resumen ejecutivo

SR Taller 2.0 tiene una foundation técnica ejecutable y un Repair Workstream
local integrado. D5 Technician Assignment, D6.1 Start Diagnosis y D6.2 Internal
Physical Location pertenecen a `main` y tienen CI verde.

Repairs no está completo ni listo para operación productiva. El runtime local
usa contexto y actor sintéticos; no existen todavía Users, PIN, Operational
Session, contextual authorization o Trusted Station Runtime Context en
`main`. Por ello el roadmap aprobado detiene nuevas features profundas de
Repairs y prioriza Identity & Context Foundation.

## Git y CI

| Hecho | Estado |
|---|---|
| Baseline | `main` |
| HEAD auditado | `4d54f84e8ad4b16b2889a555f7fc75975c6ddc68` |
| `origin/main` auditado | mismo SHA |
| Divergencia al iniciar reconciliación | `0/0` |
| Working tree al iniciar | limpio |
| CI | `33944664589` SUCCESS |
| Última integración | PR #19 — Branch Timezone Minimum |

La rama documental que modifique esta fotografía no se convierte en baseline
hasta integrarse a `main` con autorización y CI propios.

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

- `access` no contiene todavía Users, credentials, roles o sessions.
- No existe Station runtime persistente en `main`.
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
- Siguiente dirección: Identity & Context Foundation.

## Roadmap y WIP

La fuente canónica es [MVP Operating Roadmap](product/MVP_OPERATING_ROADMAP.md).

| Elemento | Estado |
|---|---|
| Sprint activo | Sprint 01 |
| Sprint 01 | Active — sin PBI de implementación activo; cierre documental PBI-027 pendiente |
| PBI actual | NONE |
| Siguiente candidato | PBI-029, seleccionado solamente y no iniciado |
| WIP permitido | Uno |

PBI-030 tiene implementación, independent review, merge, CI y Owner Acceptance
aprobados. Su [auditoría final](quality/evidence/pbi-030/FINAL_CLOSURE_AUDIT.md)
registra la cobertura AT/cross-browser formal pendiente como
`Bajo (LOW) — ACCEPTED RESIDUAL QUALITY RISK`. No está `Released` y no bloquea
la preparación de PBI-027; la integración de este PR documental sólo hace
canónica esta fotografía.

PBI-027 tiene merge `4d54f84e8ad4b16b2889a555f7fc75975c6ddc68`, CI de `main`
`33944664589` GREEN y Owner Acceptance APPROVED. Este PR documental lo deja
como `Done candidate`; sólo su integración vuelve ese estado canónico. PBI-029
permanece seleccionado, no iniciado ni autorizado.

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

## Próxima acción

Revisar y, si corresponde, autorizar el merge del PR documental de cierre
PBI-027. No se autoriza deploy ni inicio de PBI-029.
