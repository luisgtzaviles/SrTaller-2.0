# Active Work Unit Checklist

<!-- WORK_UNIT_METADATA
work_unit: Tenant Lifecycle MVP — Discovery & Planning
iteration: 1 - Authorized Start
type: DISCOVERY
risk: SENSITIVE
shadow_risk: SENSITIVE
branch: chore/tenant-lifecycle-mvp-discovery
base_sha: b2a38088b5d1673417ad7dd8dcfee34ec2349119
status: ACTIVE
closure_mode: DERIVED
last_updated: 2026-09-21
-->

## Identity

- **Milestone:** Tenant Lifecycle MVP — Discovery & Planning.
- **Sprint:** ninguno; no se inició Sprint de producto.
- **Current PBI:** `NONE`; este Work Unit no selecciona un PBI.
Current PBI: NONE
- **Estado general:** `ACTIVE — OWNER REVIEW`; discovery completo.
- **Progreso:** `7 / 7` bloques de discovery completados.
- **Trabajo actual:** artefacto y propuesta listos para revisión del Owner.
- **Siguiente bloque:** decisiones Owner `TL-001` a `TL-016`; no se inició
  ningún Work Unit de implementación.
- **Bloqueos:** ninguno para discovery/Owner Review; promoción remota no está
  autorizada y el último `verify:full` quedó bloqueado por el benchmark 10k
  heredado de PBI-041 (`33,305 ms / 30,000 ms`).
- **Última actualización:** 2026-09-21, America/Hermosillo.

## Objective

Auditar SR Taller 2.0 y la referencia conductual 1.0 para proponer el Tenant Lifecycle MVP, sus decisiones Owner, riesgos, Work Units futuras y escenario E2E, sin implementar producto.

## Why

Definir un camino mínimo, coherente y seguro desde el registro público de un
taller hasta su operación diaria, usando lo que 2.0 ya ofrece y tomando 1.0
únicamente como referencia de comportamiento.

## In Scope

- Auditar implementación, contratos y pruebas existentes de SR Taller 2.0.
- Auditar los flujos equivalentes disponibles en SR Taller 1.0 sin modificarlo.
- Mapear capacidades existentes, parciales y faltantes del lifecycle Tenant.
- Identificar decisiones Owner pendientes y riesgos de seguridad/multitenancy.
- Proponer el Tenant Lifecycle MVP mínimo y Work Units futuras acotadas.
- Definir un escenario E2E con dos tenants, múltiples sucursales, usuarios y
  estaciones.

## Out of Scope

- Implementación de funcionalidad de producto, migraciones o cambios runtime.
- SaaS Super Admin, billing, planes, suscripciones y operación comercial SaaS.
- Copiar la arquitectura, persistencia o modelo de seguridad de SR Taller 1.0.
- Seleccionar o iniciar un PBI de implementación.
- Push, PR, merge, deploy o cambios de infraestructura/remotos.

## Applicable Contracts

- [`AGENTS.md`](../../AGENTS.md)
- [`WORK_UNIT_LIFECYCLE.md`](../delivery/WORK_UNIT_LIFECYCLE.md)
- [`CURRENT_STATE.md`](../CURRENT_STATE.md)
- [`MVP_OPERATING_ROADMAP.md`](../product/MVP_OPERATING_ROADMAP.md)
- Contratos vigentes de tenancy, identidad/acceso, sucursales/estaciones,
  seguridad, diseño y pruebas.

## Risks

- Confundir disponibilidad de piezas aisladas con un lifecycle E2E completo.
- Reutilizar conductas inseguras de 1.0 junto con su referencia funcional.
- Dejar autoridad tenant/branch/station controlada por datos del cliente.
- Crear tenants parcialmente provisionados si el bootstrap no es atómico.
- Diseñar inscripción de estaciones sin credenciales rotables, auditables y
  acotadas al tenant/sucursal.
- Inventar decisiones de producto sobre registro, propietario o recuperación.

## Plan

- [x] Auditar contratos y estado actual de SR Taller 2.0.
- [x] Auditar el comportamiento equivalente disponible en SR Taller 1.0.
- [x] Consolidar matriz existente / parcial / faltante del lifecycle.
- [x] Documentar decisiones Owner pendientes y riesgos de seguridad.
- [x] Proponer el MVP mínimo y su secuencia de Work Units futuras.
- [x] Definir escenario de aceptación E2E multitenant.
- [x] Validar documentación, links, consistencia y Work Unit contract.

## Current

Discovery y validación completos; el Work Unit se encuentra en Owner Review.

## Next

Resolver las decisiones `TL-001` a `TL-016`. Sólo después podrá autorizarse el
primer Work Unit de implementación propuesto; ninguno quedó seleccionado.

## Blockers

Ninguno para completar este discovery. La implementación está
intencionalmente detenida hasta recibir decisiones Owner explícitas. Una
promoción futura requiere resolver o reproducir de forma autoritativa el fallo
no determinista del benchmark 10k heredado de PBI-041: el primer gate pasó en
`2,034.5 ms`, pero el rerun sobre el HEAD final tardó `33,305 ms` y excedió el
presupuesto de `30,000 ms`; no se remedia dentro de este alcance.

## Important Discoveries

- 2.0 ya separa Tenant, Branch, Station, User, Role y Operational Session, pero
  la existencia de esas piezas no prueba todavía un onboarding público E2E.
- 1.0 contiene flujos de alta de taller, sucursal, dispositivo, selección de
  sucursal y login por PIN; su arquitectura y seguridad no son reutilizables.
- 2.0 sólo expone el bootstrap de Station para desarrollo; la administración
  productiva de create/link/relink/unlink/revoke permanece en PBI-031.
- El primer User puede provisionarse una sola vez mediante un use case
  server-only, pero no existe una transacción pública que cree Tenant, Branch,
  Owner/Admin, rol y credenciales como una sola unidad recuperable.
- La administración actual de Users/Roles y la Session PIN dependen primero de
  una Station confiable; no resuelven por sí mismas el acceso administrativo
  previo a la primera Station.
- 1.0 demuestra el orden comprensible para el Owner, pero también conserva PIN
  inicial conocido/plaintext, alta no atómica y auto-vinculación de equipo;
  esos mecanismos se rechazan explícitamente como diseño para 2.0.
- El SaaS Super Admin y billing quedan expresamente fuera del initiative.

## Focused Verification

- [x] `work-unit:start` y `work-unit:check` iniciales.
- [x] Links Markdown locales: `PASS` (`165` referencias comprobadas en los
  archivos modificados).
- [x] Consistency/source-of-truth y secret-pattern scan: `PASS`.
- [x] Clasificación de cambio: `FULL` por tocar el mapa de producto; la ruta
  `docs-only` falló cerrada como exige el contrato.
- [!] `verify:full` exacto del HEAD final: `FAIL` sólo en Stage 7 porque el
  benchmark 10k de PBI-041 tardó `33,305 ms / 30,000 ms`; preflight, integridad,
  base verify, PostgreSQL composite/PBI-039/PBI-040 y cleanup pasaron. Un gate
  inmediatamente anterior había pasado completo con publish `2,034.5 ms`.
  Se conserva como bloqueo de promoción fuera del scope de discovery.
- [x] `git diff --check`: `PASS`.
- [x] `work-unit:check` final: `PASS`.

## Promotion Gates

- Existing authoritative promotion policy remains unchanged.

## Remote Actions / Authorization

- No remote action is implied by checklist initialization.
- No se ejecutó push, PR, merge ni deploy.

## Handoff Notes

- Branch creation/switching is explicit and occurred before this command.
- Commit de discovery: `4505c38948904ab3a95ad5cf99a2c01900598da9`.
- Preservar sin agregar ni borrar
  `apps/dev-preview-web/src/.DS_Store` (artefacto Owner preexistente).

## Closure Predicate

Existe un artefacto repository-native que: documenta el estado 2.0; describe
la referencia funcional 1.0 y sus límites; clasifica cada etapa del lifecycle;
expone decisiones Owner y riesgos; propone un MVP mínimo y Work Units futuras;
y define un escenario E2E multitenant verificable, sin cambios de producto.
