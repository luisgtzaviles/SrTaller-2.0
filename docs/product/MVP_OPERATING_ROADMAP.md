# SR Taller 2.0 — MVP Operating Roadmap

## Estado del documento

- **Estado:** Roadmap aprobado; Sprint 01 activo con límite WIP=1.
- **Baseline de la reconciliación:** `main` en
  `db6637ee6902b9b0e4a40ba39d7f203cb6889352`; CI autoritativo
  `34074457695`, `SUCCESS`.
- **Programa:** MVP Operating Roadmap.
- **Stage:** MVP.
- **Fase:** Identity & Context Foundation.
- **Checkpoint alcanzado:** `REPAIRS OPERATIONAL FOUNDATION CHECKPOINT REACHED`.
- **Sprint activo:** Sprint 01.
- **Sprint 01:** `Active — PBI-033 In progress`.
- **PBI actual:** PBI-033 — Roles, Assignments and Capability Catalog.
- **Siguiente PBI candidato:** NONE durante la ejecución; PBI-025 permanece
  ordenado después de PBI-033, no seleccionado.
- **Blocking gate:** completar candidate, evidencia, focused high-risk review y
  CI exacto de PBI-033 antes de cualquier integración.
- **WIP operacional:** `1/1`.
- **Autoridad:** decisiones Owner de roadmap e Identity Foundation del
  2026-09-03.

## Objetivo

Llevar SR Taller desde la foundation actual hasta un MVP capaz de operar una
sucursal con contexto, identidad y trazabilidad reales; registrar clientes,
reparaciones, precios y cobros; y cerrar el ciclo físico mediante resolución,
entrega y terminación de custodia.

`Revenue Checkpoint` y `MVP Operativo Final` son gates diferentes. Registrar un
cobro no declara terminado el ciclo de una reparación.

## Workflow canónico del roadmap

```text
Roadmap
  ↓
Sprint activo
  ↓
PBI actual
  ↓
Discovery / decisiones Owner si aplican
  ↓
Autorización Owner de implementación
  ↓
Implementación
  ↓
Review
  ↓
Merge autorizado
  ↓
CI autoritativo de main GREEN
  ↓
Owner Acceptance
  ↓
Definition of Done y evidencia completas
  ↓
PBI Done
  ↓
PR documental de avance
  ↓
Siguiente PBI seleccionado, no iniciado
```

El avance es automático como obligación documental del workflow, no como
autorización de merge o de implementación. Mientras `DEC051-C02` permanezca
abierta, cada PR documental conserva preflight, revisión, CI y autorización
Owner explícita de merge.

## Invariantes

1. Existe como máximo un Sprint `Active`.
2. Existe como máximo un PBI actual. Puede ser `NONE` durante el avance
   documental entre el cierre candidato y el inicio autorizado del siguiente.
3. Existe como máximo un PBI en ejecución o cierre (`In progress` o
   `In review`) dentro del workflow operativo vigente.
4. `Selected/current` es un marcador de planificación, no un estado adicional
   del lifecycle del PBI.
5. El siguiente PBI no pasa a `In progress` por cerrar el anterior.
6. `Done` exige merge, CI de `main` sobre el SHA exacto, evidencia, DoD y Owner
   Acceptance aplicables.
7. `Done` no significa `Released`; deploy y release requieren alcance y
   autoridad propios.
8. Si falta prioridad, readiness o autoridad, el avance falla cerrado y no
   salta silenciosamente a otro PBI.

PBI-030, PBI-027, PBI-029, PBI-024 y PBI-032 están `Done` y no están
`Released`. PBI-033 está `In progress`; `Released: NO`.

## Current execution pointer

| Campo | Valor vigente |
|---|---|
| Program | MVP Operating Roadmap |
| Stage | MVP |
| Phase | Identity & Context Foundation |
| Sprint | SPRINT-01 |
| Sprint status | Active — WIP=1/1 con PBI-033 |
| Current PBI | PBI-033 — Roles, Assignments and Capability Catalog |
| Next PBI candidate | NONE; PBI-025 permanece ordenado, no seleccionado |
| PBI-029 status | Done — cierre documental integrado y CI post-cierre GREEN |
| Blocking gate | Candidate/review/CI exacto de PBI-033; no avanzar mientras el PBI actual siga abierto |

## Fases aprobadas

| Fase | Resultado | Gate principal |
|---|---|---|
| 1 — Identity & Context Foundation | Timezone, secretos, Station context, Users, Roles y Capabilities | G1–G2 |
| 2 — Operational Authentication | PIN, sesión, autorización y auditoría mínima | G3–G5 |
| 3 — Customers | Customer mínimo tenant-scoped | G6 |
| 4 — Real New Repair / Intake | Recepción atómica con actor real | G7 |
| 5 — Real Actor Retrofit | Cero actor sintético en writes productivos aprobados | G8 |
| 6 — UI Coherence / Polish | Login, Customers, Intake, Worklist y Detail coherentes | Gate visual propio |
| 7 — Pricing Catalog | Precios de referencia sin inventario | G9 parcial |
| 8 — Quote / Authorization | Cotización versionada y autorización comercial | G9 |
| 9 — Payments / Cash | Ledger de pagos y caja mínima si se aprueba | G10 |
| 10 — Repair Completion | Resolución, QC, entrega y fin de custodia | G11 |
| 11 — MVP E2E Hardening | Recorrido completo y aceptación Owner | G12 |

Stage 2 conserva Inventory, Costs, Purchases, Expenses, Margins,
Profitability y reportes dependientes de costos.

## Secuencia de Identity Foundation

La ejecución usa WIP=1, aunque la preparación documental de dependencias pueda
adelantarse sin iniciar implementación:

1. [PBI-027](../backlog/pbis/PBI-027.md) — Branch Timezone Minimum.
2. [PBI-029](../backlog/pbis/PBI-029.md) — Secrets and External Configuration.
3. [PBI-024](../backlog/pbis/PBI-024.md) — Trusted Station Runtime Context.
4. [PBI-032](../backlog/pbis/PBI-032.md) — User Directory and Lifecycle.
5. [PBI-033](../backlog/pbis/PBI-033.md) — Roles, Assignments and Capability Catalog.
6. [PBI-025](../backlog/pbis/PBI-025.md) — PIN Credential Authentication.
7. [PBI-034](../backlog/pbis/PBI-034.md) — Operational Session.
8. [PBI-026](../backlog/pbis/PBI-026.md) — Contextual Authorization.
9. [PBI-028](../backlog/pbis/PBI-028.md) — Minimum Business Audit and Correlation.
10. Operational Note como primera prueba integral con actor real.
11. Retrofit progresivo al resto de los writes de Repairs.

[PBI-031](../backlog/pbis/PBI-031.md) conserva la administración completa de
Station binding y [PBI-035](../backlog/pbis/PBI-035.md) la autorización
reforzada. [PBI-036](../backlog/pbis/PBI-036.md) difiere observabilidad
extendida. Ninguno amplía silenciosamente el PBI actual.

## Gates formales

| Gate | Condición de salida |
|---|---|
| G0 ROADMAP | Roadmap y workflow aceptados |
| G1 CONTEXT | Trusted Station Context server-side y fail-closed |
| G2 IDENTITY | Users, Roles y assignments persistentes |
| G3 AUTHENTICATION | PIN y Operational Session GREEN |
| G4 AUTHORIZATION | Deny-by-default contextual GREEN |
| G5 AUDIT | Actor real y correlation GREEN |
| G6 CUSTOMERS | Customer mínimo GREEN |
| G7 INTAKE | New Repair atómica GREEN |
| G8 REPAIR ACTOR | Sin actor sintético en writes productivos aprobados |
| G9 PRICING | Catálogo, quote y autorización definidos y GREEN |
| G10 MONEY | Payment ledger y correcciones GREEN |
| G11 DELIVERY | Entrega y terminación de custodia GREEN |
| G12 MVP | E2E completo y Owner Acceptance GREEN |

## Dashboard de gates

| Gate | Estado | Evidencia o condición vigente |
|---|---|---|
| G0 ROADMAP | PASS | PR #17 merge `117ada7f70494b2cb35ed7adf78c3529dd271391`; CI `33821753091` GREEN |
| G1 CONTEXT | PASS | PBI-024 `Done`: Trusted Station Context server-side y fail-closed; cierre PR #25 y CI exacto `34044488745` GREEN. |
| G2–G12 | Pending | PBI-033 no cambia gates mientras permanezca candidate sin cierre canónico |

## Cierre y avance documental de un PBI

Después del merge funcional, CI verde y aceptación Owner, se crea desde el
nuevo `main` una rama `ops/pbi-###-roadmap-advance`. El PR sólo debe:

- cerrar el PBI con evidencia exacta;
- reconciliar Product Backlog, Sprint Backlog, Roadmap y Current State;
- actualizar dependencias/preguntas afectadas;
- seleccionar el siguiente PBI sin iniciarlo.

El PR documental pasa revisión, CI y merge autorizado. Su integración
materializa el nuevo estado; no genera otro PR para cerrarse a sí mismo. El
texto preventivo pre-merge `Done candidate` se vuelve `Done` efectivo cuando
el merge autorizado y el CI de `main` sobre ese SHA quedan GREEN.

## Checkpoint de transición actual

[PBI-030](../backlog/pbis/PBI-030.md) y
[PBI-027](../backlog/pbis/PBI-027.md) están `Done` y no están `Released`.
PBI-029 también está `Done`: el Owner aceptó expresamente su resultado y su
riesgo `CRITICAL`, sin reducir la clasificación; el merge `41914c78724303d66136989937cf8f38e4ea8a88`
y CI `33988752597` GREEN completaron su cierre documental.

Sprint 01 continúa `Active` con PBI-033 como único PBI actual y WIP `1/1`.
PBI-032 está `Done` después de focused review PASS, merge funcional, Owner
Acceptance, cierre PR #27 y CI exacto post-cierre `34074457695` GREEN.
PBI-033 pasó DoR con riesgo High, Size Large y autorización del Master Goal;
permanece `In progress`. Ninguno de estos estados autoriza release o deploy.

## Próxima revisión

- **Disparador:** focused high-risk review de PBI-033 bajo el Master Goal,
  después de Draft PR y CI autoritativo GREEN sobre el candidate exacto.
- **Resultado esperado si pasa:** candidate elegible para merge bajo las reglas
  condicionales del Master Goal; todavía no implica `Done` ni `Released`.
- **Si falla:** PBI-033 permanece `In progress` y se remedia dentro de su
  alcance; PBI-025 no se selecciona ni inicia.
