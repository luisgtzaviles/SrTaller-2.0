# SR Taller 2.0 — MVP Operating Roadmap

## Estado del documento

- **Estado:** Roadmap aprobado; Sprint 01 activo con WIP=1.
- **Baseline de la reconciliación:** `main` en
  `4d54f84e8ad4b16b2889a555f7fc75975c6ddc68`; CI autoritativo
  `33944664589`, `SUCCESS`.
- **Programa:** MVP Operating Roadmap.
- **Stage:** MVP.
- **Fase:** Identity & Context Foundation.
- **Checkpoint alcanzado:** `REPAIRS OPERATIONAL FOUNDATION CHECKPOINT REACHED`.
- **Sprint activo:** Sprint 01.
- **Sprint 01:** `Active — cierre documental PBI-027 pendiente`.
- **PBI actual:** NONE.
- **Siguiente PBI candidato:** [PBI-029](../backlog/pbis/PBI-029.md),
  seleccionado solamente; no iniciado ni autorizado.
- **Blocking gate:** revisión, CI y merge autorizado del PR documental de
  PBI-027; no inicia PBI-029.
- **WIP operacional:** uno.
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
2. Existe exactamente un PBI actual cuando hay un Sprint activo.
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

PBI-030 está `Done` y no está `Released`. PBI-027 cumple sus predicados de
DoD como `Done candidate`: merge, CI de `main`, evidencia y Owner Acceptance
están presentes. PBI-029 sigue seleccionado solamente.

## Current execution pointer

| Campo | Valor vigente |
|---|---|
| Program | MVP Operating Roadmap |
| Stage | MVP |
| Phase | Identity & Context Foundation |
| Sprint | SPRINT-01 |
| Sprint status | Active — WIP=1 |
| Current PBI | NONE |
| Next PBI candidate | PBI-029 — Secrets and External Configuration |
| PBI-027 status | Done candidate — cierre documental pendiente de integración |
| Blocking gate | PR documental: review, CI y autorización Owner de merge |

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
| G1–G12 | Pending | El cierre de PBI-027 no materializa ni autoriza PBI-029 |

## Cierre y avance documental de un PBI

Después del merge funcional, CI verde y aceptación Owner, se crea desde el
nuevo `main` una rama `ops/pbi-###-roadmap-advance`. El PR sólo debe:

- cerrar el PBI con evidencia exacta;
- reconciliar Product Backlog, Sprint Backlog, Roadmap y Current State;
- actualizar dependencias/preguntas afectadas;
- seleccionar el siguiente PBI sin iniciarlo.

El PR documental pasa revisión, CI y merge autorizado. Su integración
materializa el nuevo estado; no genera otro PR para cerrarse a sí mismo.

## Checkpoint de transición actual

[PBI-030](../backlog/pbis/PBI-030.md) tiene implementación, independent review,
merge y CI aprobados. El Owner concedió Acceptance y dispuso formalmente la
cobertura AT/cross-browser incompleta como
`Bajo (LOW) — ACCEPTED RESIDUAL QUALITY RISK`. La auditoría de cierre pasa.

Este candidato registra el efecto canónico de los gates ya aprobados:

1. PBI-030 `Done` por quedar su cierre/evidencia dentro de `main`;
2. Sprint 01 `Active` con WIP=1;
3. PBI-027 como `Done candidate` con merge, CI de `main` y Owner Acceptance;
4. PBI-029 como siguiente candidato, no iniciado;
5. ningún merge, deploy o release queda implícitamente autorizado.

## Próxima revisión

- **Disparador:** Owner merge review del PR documental PBI-027.
- **Resultado esperado si pasa:** PBI-027 queda `Done` canónico; PBI-029
  permanece no iniciado hasta su DoR y autorización propias.
- **Si falla:** PBI-027 permanece `Done candidate`/en remediación y no se salta
  a otro candidato.
