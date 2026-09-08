# SR Taller 2.0 — Current State

## Estado del documento

- **Estado:** Snapshot preventivo del cierre canónico de PBI-028.
- **Baseline auditada:** `main` en
  `a9bb0744ebf8b32b91a9ddf90f67570830182afc`.
- **CI autoritativo de la baseline:** run `34197268832`, `SUCCESS`; VC-024
  run-1, run-2 y comparison verdes sobre ese SHA.
- **Regla:** este documento describe estado; no autoriza implementación,
  merge, release, deploy, migración ni infraestructura.

## Resumen ejecutivo

La foundation técnica y el Repair Workstream permanecen integrados en `main`.
SPRINT-01 está cerrado; SPRINT-02 sigue activo. PBI-025, PBI-034 y PBI-026
están `Done` y G3/G4 están `PASS`; ninguno está `Released`.

PBI-028 está materialmente integrado por PR #37: Operational Note obtiene
actor y contexto reales server-side, y su business audit/correlation mínimo es
atómico, append-only y libre de secretos. PR #38 corrigió el único defecto UX
post-integración conocido: el campo PIN controlado ya no pierde foco al cambiar
de estado. Owner Acceptance fue otorgada. Este PR documental deja PBI-028 como
`Done candidate` y G5 como `PASS candidate`; sólo su eventual merge autorizado
y CI exacto de `main` vuelven esos estados efectivos.

PBI-037 es el slice de administración Users & Roles autorizado por Owner y
materializado dentro del checkpoint PBI-028. No es un segundo PBI actual ni
tiene un lifecycle `Done` independiente: no reabre PBI-032/PBI-033.

## Git y CI

| Hecho | Estado |
|---|---|
| Baseline | `main` |
| HEAD auditado / `origin/main` | `a9bb0744ebf8b32b91a9ddf90f67570830182afc` |
| Divergencia al iniciar este cierre | `0/0` |
| Working tree al iniciar | limpio |
| PR #37 funcional | merge ordinario `ab8e8ba9a1274030e27ad920d61c66ed461bf122` |
| CI exacta de PR #37 en `main` | `34193770228` SUCCESS; run-1/run-2/comparison GREEN |
| PR #38 remediación PIN focus | merge ordinario `a9bb0744ebf8b32b91a9ddf90f67570830182afc` |
| CI exacta de PR #38 en `main` | `34197268832` SUCCESS; run-1/run-2/comparison GREEN |

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
| Current PBI | `NONE` |
| WIP | `0/1` |
| PBI-028 | `Done candidate`; `Released: NO` |
| G5 AUDIT | `PASS candidate` |
| PBI-037 | Slice integrado y trazable dentro de PBI-028; sin lifecycle independiente |
| Next candidate | `NONE` — el roadmap apunta a proof/retrofit de actor real y luego Customers, pero no existe PBI seleccionado/ready ni autorización de inicio |

## Próxima acción

Revisar este PR documental, obtener CI autoritativo sobre su HEAD exacto y
detenerse para autorización Owner de merge. Su merge autorizado y CI de `main`
GREEN materializarán PBI-028 `Done` y G5 `PASS`. No iniciar otro PBI y no
desplegar.
