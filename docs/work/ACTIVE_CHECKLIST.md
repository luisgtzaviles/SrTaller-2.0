# Active Work Unit Checklist

<!-- WORK_UNIT_METADATA
work_unit: TL-01 — Owner Decisions + Lifecycle Contract
iteration: 2 - Final Contract Reconciliation
type: ARCHITECTURE
risk: ARCHITECTURAL
shadow_risk: ARCHITECTURAL
branch: chore/tl-01-lifecycle-contract
base_sha: b2a38088b5d1673417ad7dd8dcfee34ec2349119
status: READY_FOR_PROMOTION
closure_mode: DERIVED
last_updated: 2026-09-20
-->

## Identity

- **Milestone:** Tenant Lifecycle MVP.
- **Work Unit:** TL-01 — Owner Decisions + Lifecycle Contract.
- **Sprint:** ninguno; no se inició Sprint de producto.
- **Current PBI:** `NONE`; TL-01 es arquitectura/planificación y no implementa
  producto.
Current PBI: NONE
- **Estado general:** `READY_FOR_PROMOTION`.
- **Progreso:** `11 / 11` bloques completados para promoción local de TL-01.
- **Trabajo actual:** checkpoint de promoción local; sin acciones remotas.
- **Siguiente bloque:** Owner autoriza push/PR de TL-01 si desea promoverlo;
  TL-02 permanece sin seleccionar e iniciar.
- **Bloqueos:** ninguno conocido.
- **Última actualización:** 2026-09-20, America/Hermosillo.

## Objective

Materializar las decisiones Owner TL-001–016 como contrato arquitectónico del
Tenant Lifecycle MVP, resolver su relación con ADRs aceptados y dejar TL-02 en
adelante listos para planificación de implementación, sin implementar producto.

## Why

El sistema operativo actual parte de una Station confiable. El Tenant
Lifecycle necesita un control plane administrativo previo y separado que pueda
crear de forma segura el primer Tenant, su autoridad y su primera Branch sin
debilitar las invariantes operativas existentes.

## In Scope

- Registrar la dirección Owner aprobada TL-001–016.
- Reconciliar QUESTION-005 y contratos de tenancy, identidad, autorización,
  Branch y Station.
- Crear la decisión arquitectónica necesaria para separar control plane y
  contexto operativo.
- Definir registration attempt, verificación, bootstrap, ONBOARDING y ACTIVE.
- Definir threat models de identidad/sesión/recovery/reauth administrativa y
  enrollment de Station.
- Definir starter Tenant Admin authority sin elevación aportada por cliente.
- Definir Branch V1 y auditoría/invariantes de seguridad.
- Refinar TL-02 en adelante como Work Units implementation-ready.

## Out of Scope

- Código de producto, endpoints, UI, migraciones, schemas o datos runtime.
- Seleccionar o iniciar TL-02 o un PBI de implementación.
- Billing, planes, Super Admin, soporte privilegiado o suspensión comercial.
- Copiar arquitectura, credenciales o seguridad de SR Taller 1.0.
- Push, PR, merge, deploy o cambios remotos/de infraestructura.

## Applicable Contracts

- [`AGENTS.md`](../../AGENTS.md)
- [`WORK_UNIT_LIFECYCLE.md`](../delivery/WORK_UNIT_LIFECYCLE.md)
- [`TENANT_LIFECYCLE_MVP_DISCOVERY.md`](../product/TENANT_LIFECYCLE_MVP_DISCOVERY.md)
- [`MULTITENANCY_MODEL.md`](../architecture/MULTITENANCY_MODEL.md)
- [`IDENTITY_ACCESS_AND_PERMISSIONS.md`](../architecture/IDENTITY_ACCESS_AND_PERMISSIONS.md)
- [`BRANCH_AND_DEVICE_MODEL.md`](../architecture/BRANCH_AND_DEVICE_MODEL.md)
- ADR-004 y ADR-010 a ADR-014.

## Risks

- Crear una excepción administrativa implícita al requisito operativo de
  Station en ADR-010/012.
- Confundir email/password administrativo con PIN/Operational Session.
- Permitir tenant, roles, capabilities o Branch authority desde el payload.
- Dejar un Tenant parcialmente provisionado o un último Admin revocable.
- Exponer/reutilizar verification, recovery o enrollment secrets.
- Declarar implementation-ready decisiones de seguridad que el Owner no tomó.

## Plan

- [x] Registrar autorización y decisiones Owner TL-001–016.
- [x] Auditar compatibilidad y conflictos con ADRs/contratos aceptados.
- [x] Materializar ADR del control plane y lifecycle.
- [x] Definir threat model administrativo y decisiones para Owner.
- [x] Definir Branch V1, starter authority y activación de Tenant.
- [x] Definir enrollment challenge y auditoría/invariantes.
- [x] Refinar TL-02 en adelante con dependencias y gates.
- [x] Reconciliar documentos e índices y ejecutar validación proporcional.
- [x] Registrar las decisiones finales `TLD-001–009` y aceptar ADR-015.
- [x] Reconciliar QUESTION-005 y las fronteras TL-02–TL-09.
- [x] Ejecutar el pipeline local de promoción exigido por la clasificación.

## Current

Contrato TL-01 reconciliado y validado; ADR-015 está `Accepted` y el Work Unit
está `READY_FOR_PROMOTION`. No existe implementación de producto iniciada.

## Next

Owner autoriza, en un turno posterior, la promoción remota de TL-01. No iniciar
TL-02 automáticamente.

## Blockers

None known for TL-01. Las selecciones técnicas delegadas corresponden a sus
Work Units futuros y no bloquean la promoción de este contrato.

## Important Discoveries

- El discovery previo permanece en la misma línea de commits y no fue
  promovido por separado; TL-01 continúa el mismo objetivo en una única rama.
- ADR-010 contempla contextos administrativos separados, pero ADR-012 formula
  Station + Operational Session como requisito universal de toda operación
  protegida. La administración previa a Station requiere un ADR delimitador.
- ADR-008 continúa `Proposed`; TL-006 elimina la necesidad de un subdominio
  elegido por el usuario y prohíbe usar slug/host como autoridad.
- PBI-031 ya reserva administración sensible de Stations, pero no define el
  challenge de 10 minutos ni el contexto administrativo que lo emite.
- El clasificador vigente trata el cambio de contratos arquitectónicos como
  `CROSS_MODULE_HIGH_RISK`; el clasificador shadow lo trata como
  `ARCHITECTURAL`. Ambos conservan pipeline `FULL` y no reducen gates.
- El primer intento de `verify:full` falló cerrado en Stage 0 por el archivo
  temporal local `.tmp/tl01-risk.json` generado durante la clasificación. Se
  retiró únicamente ese artefacto; la repetición completa pasó.

## Focused Verification

- [x] `work-unit:check` — PASS.
- [x] Markdown links y consistencia documental — PASS.
- [x] Secret-pattern scan — PASS.
- [x] `git diff --check` — PASS.
- [x] `verify:architecture` — PASS.
- [x] `test:architecture` — PASS, 307/307.
- [x] Markdown local links — PASS, 463 referencias en 18 archivos.
- [x] Secret-pattern scan — PASS, 6 patrones gobernados.
- [x] Clasificación vigente: `CROSS_MODULE_HIGH_RISK` / `FULL`; shadow:
  `ARCHITECTURAL`, sin reducción de gates.
- [x] `verify:full` — PASS, stages 0–13; base verify 987 tests (957 PASS,
  30 SKIP), PostgreSQL composite 17/17, PBI-039 2/2, PBI-040 1/1, PBI-041
  10/10, Preview-like runtime, backend/UI smoke y cleanup PASS. Warning de
  chunk Vite aceptado por el gate.

## Promotion Gates

- [x] Contrato/ADR/QUESTION y fronteras TL-02–TL-09 reconciliadas.
- [x] Owner architectural decision presente para riesgo `ARCHITECTURAL`.
- [x] Pipeline local `FULL` satisfecho.
- [ ] Push / PR / revisión remota / CI — no autorizados en este turno.
- [ ] Merge / exact-main CI / cierre derivado — no ocurridos.

## Remote Actions / Authorization

- No push, PR, merge, deploy ni cambios remotos autorizados.

## Handoff Notes

- La rama local no publicada de discovery fue renombrada sin reescribir ni
  perder sus tres commits; conserva base `origin/main`.
- Preservar sin agregar ni borrar
  `apps/dev-preview-web/src/.DS_Store` (artefacto Owner preexistente).

## Closure Predicate

TL-01 queda cerrado por derivación sólo cuando su candidato sea promovido por
PR autorizado, integrado a `main` mediante el método vigente y la verificación
exact-main requerida quede GREEN. Hasta entonces permanece
`READY_FOR_PROMOTION`; no existe closure PR adicional ni inicio automático de
TL-02.
