# SR Taller 2.0 — Current State

## Estado del documento

- **Estado:** Snapshot de baseline y candidato activo PBI-038.
- **Baseline auditada:** `main` en
  `2b712fc3a3842f197324e8870011bf170846ddb8`.
- **CI autoritativo de la baseline:** run `34249869167`, `SUCCESS`; VC-024
  run-1, run-2 y comparison verdes sobre ese SHA.
- **Regla:** este documento describe estado; no autoriza implementación,
  merge, release, deploy, migración ni infraestructura.

## Resumen ejecutivo

La foundation técnica y el Repair Workstream permanecen integrados en `main`.
SPRINT-01 está cerrado; SPRINT-02 sigue activo. PBI-025, PBI-034 y PBI-026
están `Done` y G3/G4 están `PASS`; ninguno está `Released`.

PBI-028 está `Done` tras PR #37 y su cierre documental PR #39: Operational Note obtiene
actor y contexto reales server-side, y su business audit/correlation mínimo es
atómico, append-only y libre de secretos. PR #38 corrigió el único defecto UX
post-integración conocido: el campo PIN controlado ya no pierde foco al cambiar
de estado. Owner Acceptance fue otorgada. PR #39 fue integrado y su CI exacto
de `main` dejó PBI-028 como `Done` y G5 como `PASS`; `Released: NO`.

PBI-037 es el slice de administración Users & Roles autorizado por Owner y
materializado dentro del checkpoint PBI-028. No es un segundo PBI actual ni
tiene un lifecycle `Done` independiente: no reabre PBI-032/PBI-033.

PBI-038 es el único PBI actual de SPRINT-02: endurece e integra el trabajo
local aprobado de Timezone Foundation sin reabrir PBI-027 ni introducir una
capacidad de producto distinta. Está en preparación de candidato; merge,
release y deploy permanecen pendientes de sus gates propios.

## Git y CI

| Hecho | Estado |
|---|---|
| Baseline | `main` |
| HEAD auditado / `origin/main` | `2b712fc3a3842f197324e8870011bf170846ddb8` |
| Divergencia al iniciar este cierre | `0/0` |
| Working tree al iniciar | limpio |
| PR #37 funcional | merge ordinario `ab8e8ba9a1274030e27ad920d61c66ed461bf122` |
| CI exacta de PR #37 en `main` | `34193770228` SUCCESS; run-1/run-2/comparison GREEN |
| PR #38 remediación PIN focus | merge ordinario `a9bb0744ebf8b32b91a9ddf90f67570830182afc` |
| CI exacta de PR #38 en `main` | `34197268832` SUCCESS; run-1/run-2/comparison GREEN |
| PR #39 cierre canónico PBI-028 | merge ordinario `2b712fc3a3842f197324e8870011bf170846ddb8` |
| CI exacta de PR #39 en `main` | `34249869167` SUCCESS; run-1/run-2/comparison GREEN |

## Capacidades integradas relevantes

- Trusted Station Context, Users, Roles, catálogo de capabilities, PIN,
  Operational Session y autorización contextual server-side.
- Repairs Worklist/Detail y Operational Note append-only.
- `repairs.add_note` deriva actor, Tenant, Branch, Station y Session de la
  autoridad server-side; timeline y business audit se confirman en la misma
  transacción.
- Correlation UUID es generado por servidor en éxitos y errores; permanece
  separado de `clientRequestId` y no es elegido por frontend.
- Configuración → Roles y Usuarios permite administración local de Roles,
  Users, lifecycle y PIN sin permisos directos por User ni PIN plaintext.

## Límites vigentes

- El audit de PBI-028 está acotado a `repairs.add_note`; no hay query/export UI,
  observabilidad extendida ni retrofit de todos los writes de Repairs.
- PBI-037 no convierte la administración local en un módulo IAM genérico ni
  reabre foundations ya cerradas.
- Customers, New Repair persistente, Pricing, Payments, Inventory y Delivery
  permanecen fuera de este checkpoint.
- Preview remoto, Dokploy, PostgreSQL remoto, DNS, secretos e infraestructura
  no fueron modificados. Production no está materializada.

## Roadmap y WIP

| Elemento | Estado preventivo de este closure PR |
|---|---|
| Sprint activo | SPRINT-02 — Operational Authentication & Authorization |
| Current PBI | `PBI-038` — Timezone Foundation Integration and Hardening |
| WIP | `1/1` |
| PBI-028 | `Done`; `Released: NO` |
| G5 AUDIT | `PASS` |
| PBI-037 | Slice integrado y trazable dentro de PBI-028; sin lifecycle independiente |
| Next candidate | `NONE` — no se selecciona trabajo posterior mientras PBI-038 esté en ejecución |

## Próxima acción

Completar el candidato PBI-038, su CI autoritativo y focused review; detenerse
para autorización Owner de merge. No iniciar otro PBI ni desplegar.
