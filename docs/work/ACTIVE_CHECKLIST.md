# Active Work Unit Checklist

<!-- WORK_UNIT_METADATA
work_unit: TL-01 — Owner Decisions + Lifecycle Contract
iteration: 2 - Final Contract Reconciliation
type: ARCHITECTURE
risk: ARCHITECTURAL
shadow_risk: ARCHITECTURAL
branch: chore/tl-01-lifecycle-contract
base_sha: b2a38088b5d1673417ad7dd8dcfee34ec2349119
status: ACTIVE
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
- **Estado general:** `ACTIVE — FINAL CONTRACT RECONCILIATION`.
- **Progreso:** `10 / 11` bloques completados para promoción local de TL-01.
- **Trabajo actual:** validación local de promoción del Work Unit.
- **Siguiente bloque:** cerrar evidencia local exacta; TL-02
  permanece sin iniciar hasta autorización independiente.
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
- [~] Ejecutar el pipeline local de promoción exigido por la clasificación.

## Current

Contrato TL-01 reconciliado; validación local de promoción en curso. No existe
implementación de producto iniciada.

## Next

Completar el gate local y, si pasa, marcar `READY_FOR_PROMOTION`.

## Blockers

None known for TL-01. El Owner aprobó ADR-015 y resolvió `TLD-001–009`; faltan
su materialización canónica y los gates locales antes de promoción.

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
  `CROSS_MODULE_HIGH_RISK` y reserva pipeline `FULL` para promoción. TL-01 se
  detiene en Owner Review; no se declara `READY_FOR_PROMOTION`.

## Focused Verification

- [x] `work-unit:check` — PASS.
- [x] Markdown links y consistencia documental — PASS.
- [x] Secret-pattern scan — PASS.
- [x] `git diff --check` — PASS.
- [x] `verify:architecture` — PASS.
- [x] Clasificación vigente registrada: `CROSS_MODULE_HIGH_RISK` / pipeline
  `FULL`; ejecución del pipeline completo queda para promoción, no para este
  checkpoint de Owner Review.

## Promotion Gates

- La promoción remota no está autorizada en este turno.
- La preparación local debe satisfacer el pipeline `FULL` exigido por la
  clasificación arquitectónica antes de marcar `READY_FOR_PROMOTION`.

## Remote Actions / Authorization

- No push, PR, merge, deploy ni cambios remotos autorizados.

## Handoff Notes

- La rama local no publicada de discovery fue renombrada sin reescribir ni
  perder sus tres commits; conserva base `origin/main`.
- Preservar sin agregar ni borrar
  `apps/dev-preview-web/src/.DS_Store` (artefacto Owner preexistente).

## Closure Predicate

TL-01 llega a Owner Review cuando: TL-001–016 están en fuentes permanentes;
QUESTION-005 y contratos afectados están reconciliados; el ADR de control
plane delimita explícitamente su relación con ADR-010/011/012/013/014; lifecycle,
threat models, starter authority, Branch y enrollment tienen invariantes y
pruebas propuestas; TL-02 en adelante poseen alcance, dependencias, decisiones
residuales y gates; las validaciones focalizadas pasan, la clasificación de
promoción queda registrada y no existe cambio de producto.
